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
    smartSearchEnabled: localStorage.getItem('vibe_prep_smart_search') !== 'false',
    aiEnabled: localStorage.getItem('vibe_prep_ai_enabled') !== 'false',
    aiModel: localStorage.getItem('vibe_prep_ai_model') || 'auto',
    aiInstructions: {
      verifyAnswer: localStorage.getItem('vibe_prep_ai_instr_verify') || '',
      explainSimpler: localStorage.getItem('vibe_prep_ai_instr_simpler') || '',
      makeDetailed: localStorage.getItem('vibe_prep_ai_instr_detailed') || '',
      generateModule: localStorage.getItem('vibe_prep_ai_instr_module') || ''
    },
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
      
      // Clear ticket stats
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vibe_prep_ticket_stats_')) {
          localStorage.removeItem(key);
        }
      }
      
      this.touchSyncTimestamp();
    },

    recordTicketStats(moduleId, ticketId, correctCount, totalCount) {
      try {
        const key = `vibe_prep_ticket_stats_${moduleId}`;
        const raw = localStorage.getItem(key);
        const stats = raw ? JSON.parse(raw) : {};

        if (!stats[ticketId]) {
          stats[ticketId] = {
            correct: 0,
            total: totalCount,
            attempts: 0
          };
        }

        const tStat = stats[ticketId];
        tStat.attempts++;
        tStat.correct = Math.max(tStat.correct, correctCount);
        tStat.total = totalCount;

        localStorage.setItem(key, JSON.stringify(stats));
        this.touchSyncTimestamp();
      } catch (e) {
        console.error('Failed to record ticket stats:', e);
      }
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

    saveActiveSession(settings = null) {
      if (!this.activeModuleId) return;
      
      let finalSettings = settings;
      if (finalSettings === null) {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            finalSettings = parsed.settings || {};
          } catch (e) {
            finalSettings = {};
          }
        } else {
          finalSettings = {};
        }
      }

      const sessionState = {
        moduleId: this.activeModuleId,
        sessionQueue: this.sessionQueue,
        currentIndex: this.currentIndex,
        sessionCorrect: this.sessionCorrect,
        sessionAttempts: this.sessionAttempts,
        sessionAnswers: this.sessionAnswers,
        activeTicketId: this.activeTicketId,
        settings: finalSettings
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
          } catch (e) { }
        } else if (key.startsWith('vibe_prep_ticket_rules_')) {
          const modId = key.substring('vibe_prep_ticket_rules_'.length);
          try {
            ruleKeys[modId] = JSON.parse(localStorage.getItem(key));
          } catch (e) { }
        } else if (key.startsWith('vibe_prep_ticket_stats_')) {
          const modId = key.substring('vibe_prep_ticket_stats_'.length);
          try {
            ticketStatsKeys[modId] = JSON.parse(localStorage.getItem(key));
          } catch (e) { }
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
      console.log('[Leaderboard] submitLeaderboardStats called', { nickname, modulesCount: standardModules.length, apiUrl: this.apiUrl });
      if (standardModules.length === 0) {
        console.log('[Leaderboard] No modules, skipping');
        return { success: true };
      }

      let syncCode = this.syncCode;
      console.log('[Leaderboard] Current syncCode:', syncCode || '(none)');

      // Auto generate sync code if empty
      if (!syncCode) {
        console.log('[Leaderboard] No sync code — generating one automatically...');
        try {
          syncCode = await this.cloudGenerateSyncCode();
          console.log('[Leaderboard] Generated syncCode:', syncCode);
        } catch (e) {
          console.error('[Leaderboard] Failed to generate sync code:', e);
          return { success: false, error: 'Для сохранения никнейма требуется синхронизация, но сервер недоступен.' };
        }
      }

      // Helper: POST with up to 3 retries and exponential back-off
      const postWithRetry = async (url, body, maxAttempts = 3) => {
        let lastError;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          try {
            console.log(`[Leaderboard] POST attempt ${attempt}/${maxAttempts} →`, url, body);
            const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            console.log(`[Leaderboard] Response attempt ${attempt}: status ${res.status}`);
            return res;
          } catch (e) {
            lastError = e;
            console.warn(`[Leaderboard] Network error on attempt ${attempt}:`, e.message);
            if (attempt < maxAttempts) {
              const delay = 500 * attempt; // 500ms, 1000ms
              console.log(`[Leaderboard] Retrying in ${delay}ms...`);
              await new Promise(r => setTimeout(r, delay));
            }
          }
        }
        throw lastError;
      };

      let errors = [];
      for (const mod of standardModules) {
        try {
          const modStats = this.getTestGlobalStats(mod.questions);
          console.log(`[Leaderboard] Module "${mod.id}": answeredCount=${modStats.answeredCount}, total=${modStats.totalQuestions}, accuracy=${modStats.accuracy}`);

          const res = await postWithRetry(`${this.apiUrl}/api/leaderboard`, {
            profileId: syncCode,
            nickname: nickname,
            moduleId: mod.id,
            completedCount: modStats.answeredCount,
            totalCount: modStats.totalQuestions,
            accuracy: modStats.accuracy
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            const msg = `${mod.name}: ${errData.detail || 'Неизвестная ошибка сервера'}`;
            console.error('[Leaderboard] Server error:', msg);
            errors.push(msg);
          } else {
            console.log(`[Leaderboard] ✓ Module "${mod.id}" pushed successfully`);
          }
        } catch (e) {
          const msg = `${mod.name}: Нет соединения с сервером (${e.message})`;
          console.error('[Leaderboard] Fatal error for module:', msg);
          errors.push(msg);
        }
      }

      if (errors.length > 0) {
        console.warn('[Leaderboard] Finished with errors:', errors);
        return { success: false, error: errors.join('\n') };
      }
      console.log('[Leaderboard] All modules pushed successfully');
      return { success: true };
    },

    async pushLeaderboardStatsSilently(standardModules) {
      if (!this.nickname) {
        console.log('[Leaderboard] pushLeaderboardStatsSilently: no nickname set, skipping');
        return;
      }
      console.log('[Leaderboard] pushLeaderboardStatsSilently: pushing for nickname:', this.nickname);
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
    },

    setSmartSearch(enabled) {
      this.smartSearchEnabled = enabled;
      localStorage.setItem('vibe_prep_smart_search', enabled.toString());
    },

    setAiEnabled(enabled) {
      this.aiEnabled = enabled;
      localStorage.setItem('vibe_prep_ai_enabled', enabled ? 'true' : 'false');
      this.touchSyncTimestamp();
    },

    setAiModel(model) {
      this.aiModel = model;
      localStorage.setItem('vibe_prep_ai_model', model);
      this.touchSyncTimestamp();
    },

    setAiInstruction(type, text) {
      if (this.aiInstructions[type] !== undefined) {
        this.aiInstructions[type] = text;
        localStorage.setItem(`vibe_prep_ai_instr_${type}`, text);
        this.touchSyncTimestamp();
      }
    },

    resetAiInstructions() {
      this.aiInstructions.verifyAnswer = '';
      this.aiInstructions.explainSimpler = '';
      this.aiInstructions.makeDetailed = '';
      this.aiInstructions.generateModule = '';
      localStorage.removeItem('vibe_prep_ai_instr_verify');
      localStorage.removeItem('vibe_prep_ai_instr_simpler');
      localStorage.removeItem('vibe_prep_ai_instr_detailed');
      localStorage.removeItem('vibe_prep_ai_instr_module');
      this.touchSyncTimestamp();
    },

    isQueryMatch(q, query) {
      if (!query) return true;
      const cleanQuery = query.toLowerCase().trim();
      if (!cleanQuery) return true;

      const titleClean = q.title.toLowerCase();
      const catClean = q.category.toLowerCase();
      const tags = q.tags || [];

      // Check simple substring match first
      const tagsStr = tags.join(' ');
      if (titleClean.includes(cleanQuery) || catClean.includes(cleanQuery) || tagsStr.includes(cleanQuery)) {
        return true;
      }

      // If smart search is disabled, we stop here
      if (!this.smartSearchEnabled) {
        return false;
      }

      // Smart search typo/word mismatch logic
      const queryWords = cleanQuery.split(/\s+/).filter(Boolean);
      if (queryWords.length === 0) return true;

      // Helper function to calculate levenshtein distance
      const levenshtein = (a, b) => {
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
              matrix[i][j] = matrix[i - 1][j - 1];
            } else {
              matrix[i][j] = Math.min(
                matrix[i - 1][j - 1] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              );
            }
          }
        }
        return matrix[b.length][a.length];
      };

      // Split the title/category/tags into words
      const textWords = [
        ...titleClean.split(/[^\wа-яё0-9_-]+/iu).filter(Boolean),
        ...catClean.split(/[^\wа-яё0-9_-]+/iu).filter(Boolean),
        ...tags
      ];

      // Each query word must match at least one word in the text (either as a prefix/substring or via Levenshtein edit distance)
      return queryWords.every(qWord => {
        // Try substring match on the entire title/category/tags first for this word
        if (titleClean.includes(qWord) || catClean.includes(qWord) || tagsStr.includes(qWord)) {
          return true;
        }

        // Try fuzzy match on individual words
        return textWords.some(tWord => {
          if (tWord.includes(qWord) || qWord.includes(tWord)) {
            return true;
          }
          // Typo tolerance (only for words > 3 characters)
          if (qWord.length > 3 && tWord.length > 3) {
            const dist = levenshtein(qWord, tWord);
            const maxAllowedDist = Math.max(1, Math.floor(qWord.length * 0.25)); // ~25% typo tolerance
            if (dist <= maxAllowedDist) {
              return true;
            }
          }
          return false;
        });
      });
    }
  }
});
