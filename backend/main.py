import os
import random
import string
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
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

# Connect to MongoDB
MONGODB_URI = os.getenv(
    "MONGODB_URI", 
    "NOCODE"
)

print(f"Attempting to connect to MongoDB at: {MONGODB_URI}")

# Handle DB connection gracefully
try:
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    # Parse DB name from URI or default to 'vibe_prep'
    db_name = "vibe_prep"
    if "/" in MONGODB_URI.split("://")[-1]:
        path_part = MONGODB_URI.split("://")[-1].split("/")[-1]
        if path_part:
            db_name = path_part.split("?")[0] or "vibe_prep"
    db = client[db_name]
    # Check connection
    client.server_info()
    print(f"Connected to MongoDB database: {db_name}")
except Exception as e:
    print(f"Error: Failed to connect to MongoDB: {e}")
    db = None

# Pydantic Models for Validation
class SyncDataPayload(BaseModel):
    data: Dict[str, Any]

class LeaderboardPayload(BaseModel):
    nickname: str
    moduleId: str
    completedCount: int
    totalCount: int
    accuracy: float

def generate_sync_code() -> str:
    # Generates a code format like VIBE-ABCD-1234
    chars = string.ascii_uppercase + string.digits
    part1 = "".join(random.choices(chars, k=4))
    part2 = "".join(random.choices(chars, k=4))
    return f"VIBE-{part1}-{part2}"

@app.get("/api/health")
def health_check():
    db_status = "disconnected"
    if db is not None:
        try:
            client.server_info()
            db_status = "connected"
        except Exception:
            pass
    return {
        "status": "ok",
        "database": db_status,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/sync/create")
def create_sync(payload: SyncDataPayload):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is currently unavailable"
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
        "updatedAt": now
    })
    
    return {
        "code": code,
        "updatedAt": now.isoformat()
    }

@app.get("/api/sync/{code}")
def get_sync(code: str):
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
def update_leaderboard(payload: LeaderboardPayload):
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection is currently unavailable"
        )
    
    # We clean up username to make sure it's valid
    clean_nickname = payload.nickname.strip()
    if not clean_nickname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nickname cannot be empty"
        )

    now = datetime.utcnow()
    # Upsert the entry based on nickname & moduleId
    db.leaderboard.update_one(
        {
            "nickname": clean_nickname,
            "moduleId": payload.moduleId
        },
        {"$set": {
            "completedCount": payload.completedCount,
            "totalCount": payload.totalCount,
            "accuracy": payload.accuracy,
            "updatedAt": now
        }},
        upsert=True
    )
    
    return {"status": "success"}

@app.get("/api/leaderboard/{module_id}")
def get_leaderboard(module_id: str):
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
