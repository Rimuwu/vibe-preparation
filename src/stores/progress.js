import { defineStore } from 'pinia';

const STORAGE_KEY = 'vibe_prep_stats';
const OVERRIDES_KEY = 'vibe_prep_question_overrides';
const ADDED_KEY = 'vibe_prep_question_added';
const CUSTOM_LISTS_KEY = 'vibe_prep_custom_lists';
const SESSION_KEY = 'vibe_prep_active_session';
const SYNC_CODE_KEY = 'vibe_prep_sync_code';
const SYNC_TIME_KEY = 'vibe_prep_sync_timestamp';
const NICKNAME_KEY = 'vibe_prep_nickname';
const DEVICE_ID_KEY = 'vibe_prep_device_id';

export const useProgressStore = defineStore('progress', {
  state: () => ({
    stats: {},
    nickname: localStorage.getItem(NICKNAME_KEY) || '',
    syncCode: localStorage.getItem(SYNC_CODE_KEY) || '',
    syncTimestamp: localStorage.getItem(SYNC_TIME_KEY) || '',
    deviceId: localStorage.getItem(DEVICE_ID_KEY) || '',
    customLists: [],
    activityLog: {},
    viewingProfileData: null,
    viewingProfileNickname: '',
    
    // Study session state
    sessionQueue: [],
    currentIndex: 0,
    sessionCorrect: 0,
    sessionAttempts: 0,
    sessionAnswers: [],
    activeTicketId: null,
    activeModuleId: localStorage.getItem('vibe_prep_active_module_id') || null,
    
    // UI Navigation
    currentScreen: 'modules',
    
    // API State
    apiUrl: '',
    isSyncing: false,
    syncError: false,
  }),
  
  actions: {
    async init() {
      this.loadStats();
      this.loadCustomLists();
      this.getOrCreateDeviceId();
      await this.resolveApiUrl(); // Must resolve before any API calls
      this.restoreActiveSession();
    },
    
    // API Resolution
    async resolveApiUrl() {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        this.apiUrl = 'http://localhost:8000';
        return;
      }
      try {
        const resp = await fetch('config.json');
        if (resp.ok) {
          const config = await resp.json();
          if (config.API_URL) {
            this.apiUrl = config.API_URL;
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to fetch config.json, using fallback production API');
      }
      this.apiUrl = 'https://vibe-preparation-eight.vercel.app';
    },

    // Load Stats with migration
    loadStats() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        
        let migrated = false;
        for (const key in parsed) {
          if (/^q_\d+_\d+$/.test(key)) {
            const newKey = `fr_${key}`;
            if (!parsed[newKey]) {
              parsed[newKey] = parsed[key];
            } else {
              parsed[newKey].correctCount = (parsed[newKey].correctCount || 0) + (parsed[key].correctCount || 0);
              parsed[newKey].incorrectCount = (parsed[newKey].incorrectCount || 0) + (parsed[key].incorrectCount || 0);
              parsed[newKey].isDifficult = parsed[newKey].isDifficult || parsed[key].isDifficult;
              if (parsed[key].acceptedAnswers) {
                parsed[newKey].acceptedAnswers = Array.from(new Set([
                  ...(parsed[newKey].acceptedAnswers || []),
                  ...parsed[key].acceptedAnswers
                ]));
              }
            }
            delete parsed[key];
            migrated = true;
          }
        }
        
        this.stats = parsed;
        if (migrated) {
          this.saveStats();
        }
      } catch (e) {
        console.error('Failed to load stats', e);
        this.stats = {};
      }

      try {
        const rawLog = localStorage.getItem('vibe_prep_activity_log');
        this.activityLog = rawLog ? JSON.parse(rawLog) : {};
      } catch (e) {
        console.error('Failed to load activity log', e);
        this.activityLog = {};
      }
    },
    
    saveStats() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.stats));
        localStorage.setItem('vibe_prep_activity_log', JSON.stringify(this.activityLog || {}));
        this.touchSyncTimestamp();
      } catch (e) {
        console.error('Failed to save stats', e);
      }
    },
    
    getQuestionStats(qId) {
      if (!this.stats[qId]) {
        this.stats[qId] = {
          correctCount: 0,
          incorrectCount: 0,
          acceptedAnswers: []
        };
      }
      return this.stats[qId];
    },
    
    recordAnswer(qId, isCorrect, mode) {
      const qStat = this.getQuestionStats(qId);
      if (isCorrect) {
        qStat.correctCount++;
      } else {
        qStat.incorrectCount++;
      }
      if (mode === 'choice') {
        if (!qStat.testCorrectCount) qStat.testCorrectCount = 0;
        if (!qStat.testIncorrectCount) qStat.testIncorrectCount = 0;
        if (isCorrect) {
          qStat.testCorrectCount++;
        } else {
          qStat.testIncorrectCount++;
        }
      }

      // Record daily activity tracking
      try {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time
        if (!this.activityLog) this.activityLog = {};
        if (!this.activityLog[today]) {
          this.activityLog[today] = {
            total: 0,
            correct: 0,
            incorrect: 0,
            modules: {}
          };
        }
        const dayLog = this.activityLog[today];
        dayLog.total++;
        if (isCorrect) {
          dayLog.correct++;
        } else {
          dayLog.incorrect++;
        }

        const activeModId = this.activeModuleId || 'unknown';
        if (!dayLog.modules[activeModId]) {
          dayLog.modules[activeModId] = {
            total: 0,
            correct: 0,
            incorrect: 0
          };
        }
        const modLog = dayLog.modules[activeModId];
        modLog.total++;
        if (isCorrect) {
          modLog.correct++;
        } else {
          modLog.incorrect++;
        }
      } catch (e) {
        console.error('Failed to log daily activity:', e);
      }

      this.saveStats();
      return qStat;
    },
    
    toggleDifficult(qId, defaultDifficult = false) {
      const qStat = this.getQuestionStats(qId);
      const currentVal = qStat.isDifficult !== undefined ? qStat.isDifficult : defaultDifficult;
      qStat.isDifficult = !currentVal;
      this.saveStats();
      return qStat.isDifficult;
    },
    
    setDifficult(qId, isDiff) {
      const qStat = this.getQuestionStats(qId);
      qStat.isDifficult = isDiff;
      this.saveStats();
    },
    
    addAcceptedAnswer(qId, answer) {
      const qStat = this.getQuestionStats(qId);
      const cleanAns = answer.trim().toLowerCase();
      if (!qStat.acceptedAnswers) {
        qStat.acceptedAnswers = [];
      }
      if (cleanAns && !qStat.acceptedAnswers.includes(cleanAns)) {
        qStat.acceptedAnswers.push(cleanAns);
        this.saveStats();
      }
    },
    
    resetAllStats() {
      this.stats = {};
      this.activityLog = {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({}));
      localStorage.setItem('vibe_prep_activity_log', JSON.stringify({}));
      this.touchSyncTimestamp();
    },
    
    getGlobalStats(questions = []) {
      const targetStats = this.viewingProfileData ? (this.viewingProfileData.stats || {}) : this.stats;
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let totalDifficult = 0;
      let answeredCount = 0;

      questions.forEach(q => {
        const qStat = targetStats[q.id] || {};
        totalCorrect += qStat.correctCount || 0;
        totalIncorrect += qStat.incorrectCount || 0;
        
        const isDiff = qStat.isDifficult !== undefined ? qStat.isDifficult : (q.isStarred || false);
        if (isDiff) {
          totalDifficult++;
        }
        
        if ((qStat.correctCount || 0) + (qStat.incorrectCount || 0) > 0) {
          answeredCount++;
        }
      });

      const totalAttempts = totalCorrect + totalIncorrect;
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

      return {
        totalCorrect,
        totalIncorrect,
        totalDifficult,
        answeredCount,
        totalQuestions: questions.length,
        accuracy
      };
    },

    getTestGlobalStats(questions = []) {
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let answeredCount = 0;

      questions.forEach(q => {
        const qStat = this.stats[q.id] || {};
        const correct = qStat.testCorrectCount || 0;
        const incorrect = qStat.testIncorrectCount || 0;
        totalCorrect += correct;
        totalIncorrect += incorrect;
        
        if (correct + incorrect > 0) {
          answeredCount++;
        }
      });

      const totalAttempts = totalCorrect + totalIncorrect;
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

      return {
        totalCorrect,
        totalIncorrect,
        answeredCount,
        totalQuestions: questions.length,
        accuracy
      };
    },

    // Session Management
    restoreActiveSession() {
      const savedSession = localStorage.getItem(SESSION_KEY);
      if (savedSession) {
        try {
          const state = JSON.parse(savedSession);
          if (state && state.sessionQueue && state.sessionQueue.length > 0) {
            this.activeModuleId = state.moduleId;
            this.sessionQueue = state.sessionQueue;
            this.currentIndex = state.currentIndex;
            this.sessionCorrect = state.sessionCorrect;
            this.sessionAttempts = state.sessionAttempts;
            this.sessionAnswers = state.sessionAnswers || new Array(this.sessionQueue.length).fill(null);
            this.activeTicketId = state.activeTicketId || null;
            this.currentScreen = 'study';
          }
        } catch (e) {
          console.error('Failed to restore active session', e);
          localStorage.removeItem(SESSION_KEY);
        }
      }
    },
    
    saveActiveSession(settings = {}) {
      if (!this.activeModuleId) return;
      const sessionState = {
        moduleId: this.activeModuleId,
        sessionQueue: this.sessionQueue,
        currentIndex: this.currentIndex,
        sessionCorrect: this.sessionCorrect,
        sessionAttempts: this.sessionAttempts,
        sessionAnswers: this.sessionAnswers,
        activeTicketId: this.activeTicketId,
        settings
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionState));
    },
    
    clearActiveSession() {
      this.sessionQueue = [];
      this.currentIndex = 0;
      this.sessionCorrect = 0;
      this.sessionAttempts = 0;
      this.sessionAnswers = [];
      this.activeTicketId = null;
      localStorage.removeItem(SESSION_KEY);
    },
    
    startStudySession(queue, ticketId = null, settings = {}) {
      this.sessionQueue = queue;
      this.currentIndex = 0;
      this.sessionCorrect = 0;
      this.sessionAttempts = 0;
      this.sessionAnswers = new Array(queue.length).fill(null);
      this.activeTicketId = ticketId;
      this.currentScreen = 'study';
      this.saveActiveSession(settings);
    },
    
    setActiveModuleId(modId) {
      this.activeModuleId = modId;
      localStorage.setItem('vibe_prep_active_module_id', modId);
    },

    // Custom Lists Management
    loadCustomLists() {
      try {
        const raw = localStorage.getItem(CUSTOM_LISTS_KEY);
        this.customLists = raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Failed to load custom lists', e);
        this.customLists = [];
      }
    },
    
    saveCustomLists() {
      try {
        localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(this.customLists));
        this.touchSyncTimestamp();
      } catch (e) {
        console.error('Failed to save custom lists', e);
      }
    },
    
    createCustomList(name, moduleId, moduleName, questionIds) {
      const newList = {
        id: 'list_' + Date.now(),
        name,
        moduleId,
        moduleName,
        questionIds,
        created: Date.now()
      };
      this.customLists.push(newList);
      this.saveCustomLists();
      return newList;
    },
    
    deleteCustomList(listId) {
      this.customLists = this.customLists.filter(l => l.id !== listId);
      this.saveCustomLists();
    },

    // Sync helpers
    getOrCreateDeviceId() {
      let dId = localStorage.getItem(DEVICE_ID_KEY);
      if (!dId) {
        dId = 'DEV-' + Math.random().toString(36).substring(2, 11).toUpperCase() + '-' + Date.now();
        localStorage.setItem(DEVICE_ID_KEY, dId);
      }
      this.deviceId = dId;
      return dId;
    },
    
    touchSyncTimestamp() {
      if (this.syncCode) {
        const timestamp = Date.now().toString();
        localStorage.setItem(SYNC_TIME_KEY, timestamp);
        this.syncTimestamp = timestamp;
      }
    },
    
    saveNickname(name) {
      this.nickname = name;
      localStorage.setItem(NICKNAME_KEY, name);
    },
    
    saveSyncDetails(code, timestamp) {
      this.syncCode = code;
      this.syncTimestamp = timestamp.toString();
      localStorage.setItem(SYNC_CODE_KEY, code);
      localStorage.setItem(SYNC_TIME_KEY, timestamp.toString());
    },
    
    disconnectSync() {
      this.syncCode = '';
      this.syncTimestamp = '';
      localStorage.removeItem(SYNC_CODE_KEY);
      localStorage.removeItem(SYNC_TIME_KEY);
      this.isSyncing = false;
      this.syncError = false;
    },

    // Import / Export JSON progress
    exportProgressJSON() {
      const customModules = localStorage.getItem('vibe_prep_custom_modules') || '[]';
      const overrides = localStorage.getItem(OVERRIDES_KEY) || '{}';
      const added = localStorage.getItem(ADDED_KEY) || '{}';
      const customLists = localStorage.getItem(CUSTOM_LISTS_KEY) || '[]';

      // Gather ticket data from localStorage
      const ticketKeys = {};
      const ruleKeys = {};
      const ticketStatsKeys = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('vibe_prep_generated_tickets_')) {
          const modId = key.substring('vibe_prep_generated_tickets_'.length);
          try {
            ticketKeys[modId] = JSON.parse(localStorage.getItem(key));
          } catch (e) {}
        } else if (key.startsWith('vibe_prep_ticket_rules_')) {
          const modId = key.substring('vibe_prep_ticket_rules_'.length);
          try {
            ruleKeys[modId] = JSON.parse(localStorage.getItem(key));
          } catch (e) {}
        } else if (key.startsWith('vibe_prep_ticket_stats_')) {
          const modId = key.substring('vibe_prep_ticket_stats_'.length);
          try {
            ticketStatsKeys[modId] = JSON.parse(localStorage.getItem(key));
          } catch (e) {}
        }
      }
      const ticketSolveModeVal = localStorage.getItem('vibe_prep_ticket_solve_mode') || 'free';

      const backup = {
        version: '1.0',
        stats: this.stats,
        activityLog: this.activityLog || {},
        customModules: JSON.parse(customModules),
        overrides: JSON.parse(overrides),
        added: JSON.parse(added),
        customLists: JSON.parse(customLists),
        generatedTickets: ticketKeys,
        ticketRules: ruleKeys,
        ticketSolveMode: ticketSolveModeVal,
        ticketStats: ticketStatsKeys
      };

      return JSON.stringify(backup, null, 2);
    },

    importProgressJSON(jsonString) {
      try {
        const backup = JSON.parse(jsonString);
        if (!backup || typeof backup !== 'object') {
          throw new Error('Неверный формат резервной копии');
        }

        if (backup.stats && typeof backup.stats === 'object') {
          this.stats = backup.stats;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.stats));
        }

        if (backup.activityLog && typeof backup.activityLog === 'object') {
          this.activityLog = backup.activityLog;
          localStorage.setItem('vibe_prep_activity_log', JSON.stringify(backup.activityLog));
        }

        if (Array.isArray(backup.customModules)) {
          localStorage.setItem('vibe_prep_custom_modules', JSON.stringify(backup.customModules));
        }

        if (backup.overrides && typeof backup.overrides === 'object') {
          localStorage.setItem(OVERRIDES_KEY, JSON.stringify(backup.overrides));
        }

        if (backup.added && typeof backup.added === 'object') {
          localStorage.setItem(ADDED_KEY, JSON.stringify(backup.added));
        }

        if (Array.isArray(backup.customLists)) {
          this.customLists = backup.customLists;
          localStorage.setItem(CUSTOM_LISTS_KEY, JSON.stringify(backup.customLists));
        }

        if (backup.generatedTickets && typeof backup.generatedTickets === 'object') {
          for (const modId in backup.generatedTickets) {
            localStorage.setItem(`vibe_prep_generated_tickets_${modId}`, JSON.stringify(backup.generatedTickets[modId]));
          }
        }

        if (backup.ticketRules && typeof backup.ticketRules === 'object') {
          for (const modId in backup.ticketRules) {
            localStorage.setItem(`vibe_prep_ticket_rules_${modId}`, JSON.stringify(backup.ticketRules[modId]));
          }
        }

        if (backup.ticketSolveMode) {
          localStorage.setItem('vibe_prep_ticket_solve_mode', backup.ticketSolveMode);
        }

        if (backup.ticketStats && typeof backup.ticketStats === 'object') {
          for (const modId in backup.ticketStats) {
            localStorage.setItem(`vibe_prep_ticket_stats_${modId}`, JSON.stringify(backup.ticketStats[modId]));
          }
        }

        return true;
      } catch (e) {
        console.error('Import failed', e);
        throw new Error('Не удалось разобрать файл резервной копии: ' + e.message);
      }
    },

    // Cloud Sync API Actions
    async cloudGenerateSyncCode() {
      this.isSyncing = true;
      this.syncError = false;
      try {
        const payload = { data: JSON.parse(this.exportProgressJSON()) };
        const res = await fetch(`${this.apiUrl}/api/sync/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Ошибка связи с сервером');
        }

        const result = await res.json();
        const timestamp = new Date(result.updatedAt).getTime();
        this.saveSyncDetails(result.code, timestamp);
        return result.code;
      } catch (e) {
        this.syncError = true;
        throw e;
      } finally {
        this.isSyncing = false;
      }
    },

    async cloudConnectWithSyncCode(code) {
      this.isSyncing = true;
      this.syncError = false;
      try {
        const cleanCode = code.trim().toUpperCase();
        const res = await fetch(`${this.apiUrl}/api/sync/${cleanCode}`);
        if (res.status === 404) {
          throw new Error('Код синхронизации не найден. Пожалуйста, проверьте правильность ввода.');
        }
        if (!res.ok) throw new Error('Ошибка связи с сервером');

        const serverData = await res.json();
        this.importProgressJSON(JSON.stringify(serverData.data));
        const timestamp = new Date(serverData.updatedAt).getTime();
        this.saveSyncDetails(cleanCode, timestamp);
        return true;
      } catch (e) {
        this.syncError = true;
        throw e;
      } finally {
        this.isSyncing = false;
      }
    },

    async cloudSyncNow(forcePull = false, forcePush = false) {
      if (!this.syncCode) return;
      this.isSyncing = true;
      this.syncError = false;
      try {
        const res = await fetch(`${this.apiUrl}/api/sync/${this.syncCode}`);
        if (res.status === 404) {
          this.disconnectSync();
          throw new Error('Код синхронизации не найден на сервере (возможно, он был удален). Синхронизация отключена.');
        }
        if (!res.ok) throw new Error('Ошибка связи с сервером');

        const serverData = await res.json();
        const serverTimestamp = new Date(serverData.updatedAt).getTime();
        const localTimestamp = this.syncTimestamp ? parseInt(this.syncTimestamp, 10) : 0;

        if ((serverTimestamp > localTimestamp || forcePull) && !forcePush) {
          // Pull from cloud
          this.importProgressJSON(JSON.stringify(serverData.data));
          this.syncTimestamp = serverTimestamp.toString();
          localStorage.setItem(SYNC_TIME_KEY, serverTimestamp.toString());
          return 'pulled';
        } else if (localTimestamp > serverTimestamp || forcePush) {
          // Push to cloud
          const payload = { data: JSON.parse(this.exportProgressJSON()) };
          const uploadRes = await fetch(`${this.apiUrl}/api/sync/${this.syncCode}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (!uploadRes.ok) throw new Error('Не удалось выгрузить данные на сервер');

          const uploadData = await uploadRes.json();
          const newServerTimestamp = new Date(uploadData.updatedAt).getTime();
          this.syncTimestamp = newServerTimestamp.toString();
          localStorage.setItem(SYNC_TIME_KEY, newServerTimestamp.toString());
          return 'pushed';
        }
        return 'synced';
      } catch (e) {
        this.syncError = true;
        throw e;
      } finally {
        this.isSyncing = false;
      }
    },

    async submitLeaderboardStats(nickname, standardModules) {
      if (standardModules.length === 0) return { success: true };
      
      let syncCode = this.syncCode;
      
      // Auto generate sync code if empty
      if (!syncCode) {
        try {
          syncCode = await this.cloudGenerateSyncCode();
        } catch (e) {
          return { success: false, error: 'Для сохранения никнейма требуется синхронизация, но сервер недоступен.' };
        }
      }

      let errors = [];
      for (const mod of standardModules) {
        try {
          // Compute stats from local state for standard modules
          const modStats = this.getTestGlobalStats(mod.questions);
          if (modStats.answeredCount === 0) continue; // No attempts, no need to push

          const res = await fetch(`${this.apiUrl}/api/leaderboard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profileId: syncCode,
              nickname: nickname,
              moduleId: mod.id,
              completedCount: modStats.answeredCount,
              totalCount: modStats.totalQuestions,
              accuracy: modStats.accuracy
            })
          });
          
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            errors.push(`${mod.name}: ${errData.detail || 'Неизвестная ошибка сервера'}`);
          }
        } catch (e) {
          errors.push(`${mod.name}: Нет соединения с сервером`);
        }
      }
      
      if (errors.length > 0) {
        return { success: false, error: errors.join('\n') };
      }
      return { success: true };
    },

    async pushLeaderboardStatsSilently(standardModules) {
      if (!this.nickname) return;
      await this.submitLeaderboardStats(this.nickname, standardModules);
    },

    getStreak() {
      const targetLog = this.viewingProfileData ? (this.viewingProfileData.activityLog || {}) : this.activityLog;
      if (!targetLog) return 0;
      const dates = Object.keys(targetLog).filter(date => {
        const log = targetLog[date];
        return log && log.total > 0;
      });
      if (dates.length === 0) return 0;

      const dateSet = new Set(dates);
      let streak = 0;
      let checkDate = new Date(); // Start checking from today

      const formatDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      let todayStr = formatDate(checkDate);
      if (dateSet.has(todayStr)) {
        streak = 1;
        while (true) {
          checkDate.setDate(checkDate.getDate() - 1);
          const checkStr = formatDate(checkDate);
          if (dateSet.has(checkStr)) {
            streak++;
          } else {
            break;
          }
        }
      } else {
        // Check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        let yesterdayStr = formatDate(checkDate);
        if (dateSet.has(yesterdayStr)) {
          streak = 1;
          while (true) {
            checkDate.setDate(checkDate.getDate() - 1);
            const checkStr = formatDate(checkDate);
            if (dateSet.has(checkStr)) {
              streak++;
            } else {
              break;
            }
          }
        }
      }
      return streak;
    },

    async viewUserProfileStats(entryId, nickname) {
      this.isSyncing = true;
      try {
        const res = await fetch(`${this.apiUrl}/api/public-stats/${entryId}`);
        if (!res.ok) throw new Error('Не удалось загрузить данные профиля.');
        const result = await res.json();
        
        // Save the user progress payload
        this.viewingProfileData = result.data;
        this.viewingProfileNickname = result.nickname || nickname;
        this.currentScreen = 'stats';
      } finally {
        this.isSyncing = false;
      }
    },

    clearViewingProfile() {
      this.viewingProfileData = null;
      this.viewingProfileNickname = '';
      this.currentScreen = 'leaderboard';
    },

    clearViewingProfileDataOnly() {
      this.viewingProfileData = null;
      this.viewingProfileNickname = '';
    }
  }
});
