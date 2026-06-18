import os
import random
import string
import hashlib
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables from root-level .env if present
# We also try reading from the current directory .env as fallback
if os.path.exists("../.env"):
    load_dotenv("../.env")
else:
    load_dotenv()

app = FastAPI(title="Vibe Prep API", version="1.0.0")

# Enable CORS for cross-domain browser requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection — lazy initialization to prevent cold-start timeouts on Vercel
MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "NOCODE"
)

_client = None
_db = None

def get_db():
    """Lazily connect to MongoDB on first use. Returns db or None on failure."""
    global _client, _db
    if _db is not None:
        return _db
    try:
        _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db_name = "vibe_prep"
        if "/" in MONGODB_URI.split("://")[-1]:
            path_part = MONGODB_URI.split("://")[-1].split("/")[-1]
            if path_part:
                db_name = path_part.split("?")[0] or "vibe_prep"
        _db = _client[db_name]
        _client.server_info()
        print(f"[MongoDB] Connected to database: {db_name}")
        try:
            _db.leaderboard.create_index([("profileId", 1), ("moduleId", 1)], unique=True)
            print("[MongoDB] Unique index on (profileId, moduleId) verified/created.")
        except Exception as idx_err:
            print(f"[MongoDB] Warning: could not create index: {idx_err}")

        try:
            # Create a TTL index on 'updatedAt' field with expireAfterSeconds=604800 (7 days)
            _db.leaderboard.create_index("updatedAt", expireAfterSeconds=7 * 24 * 60 * 60)
            print("[MongoDB] TTL index on 'updatedAt' verified/created.")
        except Exception as ttl_err:
            print(f"[MongoDB] Warning: could not create TTL index: {ttl_err}")
        return _db
    except Exception as e:
        print(f"[MongoDB] Connection failed: {e}")
        _db = None
        return None

# Pydantic Models for Validation
class SyncDataPayload(BaseModel):
    data: Dict[str, Any]

class LeaderboardPayload(BaseModel):
    profileId: str
    nickname: str
    moduleId: str
    completedCount: int
    totalCount: int
    accuracy: float

def get_client_fingerprint(request: Request) -> str:
    x_forwarded_for = request.headers.get("x-forwarded-for", "")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.client.host if request.client else "unknown-ip"
        
    user_agent = request.headers.get("user-agent", "")
    raw_str = f"{ip}|{user_agent}"
    return hashlib.sha256(raw_str.encode("utf-8")).hexdigest()

def generate_sync_code() -> str:
    # Generates a code format like VIBE-ABCD-1234
    chars = string.ascii_uppercase + string.digits
    part1 = "".join(random.choices(chars, k=16))
    part2 = "".join(random.choices(chars, k=16))
    return f"VIBE-{part1}-{part2}"

@app.get("/")
def health_check():
    return {
        "status": "ok",
        "detail": "meow from AS1AW!"
    }

@app.get("/api/health")
def health_check():
    db_status = "disconnected"
    db = get_db()
    if db is not None:
        try:
            _client.server_info()
            db_status = "connected"
        except Exception:
            db_status = "error"
    return {
        "status": "ok",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/sync/create")
def create_sync(payload: SyncDataPayload, request: Request):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is currently unavailable"
        )
    
    fingerprint = get_client_fingerprint(request)
    
    # Check if the number of sync codes created by this fingerprint exceeds the limit
    MAX_SYNC_CODES_PER_FINGERPRINT = 2
    existing_sync_codes_count = db.sync_data.count_documents({"fingerprint": fingerprint})
    if existing_sync_codes_count >= MAX_SYNC_CODES_PER_FINGERPRINT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Превышен лимит кодов синхронизации для вашего устройства (максимум 2)"
        )
    
    # Try up to 10 times to generate a unique code
    code = ""
    for _ in range(10):
        temp_code = generate_sync_code()
        if db.sync_data.find_one({"code": temp_code}) is None:
            code = temp_code
            break
            
    if not code:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate a unique sync code. Please try again."
        )
        
    now = datetime.utcnow()
    db.sync_data.insert_one({
        "code": code,
        "data": payload.data,
        "fingerprint": fingerprint,
        "updatedAt": now
    })
    
    return {
        "code": code,
        "updatedAt": now.isoformat()
    }

@app.get("/api/sync/{code}")
def get_sync(code: str):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is currently unavailable"
        )
    
    doc = db.sync_data.find_one({"code": code.upper()})
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provided sync code was not found or has expired"
        )
        
    return {
        "data": doc["data"],
        "updatedAt": doc["updatedAt"].isoformat()
    }

@app.post("/api/sync/{code}")
def update_sync(code: str, payload: SyncDataPayload):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is currently unavailable"
        )
    
    now = datetime.utcnow()
    result = db.sync_data.update_one(
        {"code": code.upper()},
        {"$set": {
            "data": payload.data,
            "updatedAt": now
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provided sync code was not found"
        )
        
    return {
        "updatedAt": now.isoformat()
    }

@app.post("/api/leaderboard")
def update_leaderboard(payload: LeaderboardPayload, request: Request):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is currently unavailable"
        )
    
    # 1. Clean and validate inputs
    clean_nickname = payload.nickname.strip()
    if not clean_nickname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nickname cannot be empty"
        )
        
    clean_profile_id = payload.profileId.strip()
    if not clean_profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile ID cannot be empty"
        )

    # Validate that profileId is a VALID sync code from the sync_data collection
    sync_doc = db.sync_data.find_one({"code": clean_profile_id})
    if sync_doc is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Для участия в таблице лидеров необходимо включить синхронизацию и использовать действительный код."
        )

    fingerprint = get_client_fingerprint(request)
    now = datetime.utcnow()

    # 2. Prevent impersonation / name hijacking
    existing_name_owner = db.leaderboard.find_one({
        "moduleId": payload.moduleId,
        "nickname": clean_nickname
    })
    if existing_name_owner and existing_name_owner.get("profileId") != clean_profile_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Этот никнейм уже занят другим пользователем"
        )

    # 3. Check account limits by browser fingerprint (User-Agent + IP)
    existing_entry = db.leaderboard.find_one({
        "profileId": clean_profile_id,
        "moduleId": payload.moduleId
    })

    if existing_entry is None:
        # Registering a NEW profile in the leaderboard for this module
        existing_profiles = db.leaderboard.distinct(
            "profileId", 
            {
                "fingerprint": fingerprint, 
                "moduleId": payload.moduleId
            }
        )
        existing_profiles_count = len(existing_profiles)
        
        # Max 2 unique profiles per IP+User-Agent to protect from spamming
        MAX_PROFILES_PER_FINGERPRINT = 2
        if existing_profiles_count >= MAX_PROFILES_PER_FINGERPRINT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Превышен лимит учетных записей для вашего устройства"
            )

    # 4. Upsert entry based on (profileId, moduleId)
    db.leaderboard.update_one(
        {
            "profileId": clean_profile_id,
            "moduleId": payload.moduleId
        },
        {"$set": {
            "nickname": clean_nickname,
            "completedCount": payload.completedCount,
            "totalCount": payload.totalCount,
            "accuracy": payload.accuracy,
            "fingerprint": fingerprint,
            "updatedAt": now
        }},
        upsert=True
    )
    
    return {"status": "success"}

@app.get("/api/leaderboard/{module_id}")
def get_leaderboard(module_id: str):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is currently unavailable"
        )
    
    cursor = db.leaderboard.find({"moduleId": module_id})
    entries = list(cursor)
    
    # Sort criteria: 
    # 1. completedCount descending
    # 2. accuracy descending
    # 3. updatedAt ascending (earlier date gets priority on tie)
    entries.sort(key=lambda x: (
        -x.get("completedCount", 0),
        -x.get("accuracy", 0.0),
        x.get("updatedAt", datetime.utcnow())
    ))
    
    response_list = []
    for rank, entry in enumerate(entries, 1):
        response_list.append({
            "rank": rank,
            "nickname": entry["nickname"],
            "completedCount": entry["completedCount"],
            "totalCount": entry["totalCount"],
            "accuracy": entry["accuracy"],
            "updatedAt": entry["updatedAt"].isoformat()
        })
        
    return response_list
