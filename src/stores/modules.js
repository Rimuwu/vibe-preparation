import { defineStore } from 'pinia';
import { parseMarkdown } from '../utils/parser.js';
import { useProgressStore } from './progress.js';

const OVERRIDES_KEY = 'vibe_prep_question_overrides';
const ADDED_KEY = 'vibe_prep_question_added';
const CUSTOM_MODS_KEY = 'vibe_prep_custom_modules';

export const useModulesStore = defineStore('modules', {
  state: () => ({
    modules: [],
    activeModule: null,
    questions: [],
    loading: false,
    categories: [],
  }),

  actions: {
    async loadModules() {
      this.loading = true;
      const progressStore = useProgressStore();

      const loadedModules = [];

      // 1. Load standard modules from modules/modules.json
      try {
        const resp = await fetch('modules/modules.json');
        if (resp.ok) {
          const standard = await resp.json();
          loadedModules.push(...standard.map(m => ({ ...m, isCustom: false })));
        }
      } catch (e) {
        console.warn('Could not load standard modules manifest', e);
      }

      // 2. Load custom modules from localStorage
      try {
        const customRaw = localStorage.getItem(CUSTOM_MODS_KEY);
        if (customRaw) {
          loadedModules.push(...JSON.parse(customRaw).map(m => ({ ...m, isCustom: true })));
        }
      } catch (e) {
        console.error('Failed to parse custom modules', e);
      }

      this.modules = loadedModules;
      this.loading = false;

      // Restore active module if stored in progress store
      if (progressStore.activeModuleId) {
        const active = this.modules.find(m => m.id === progressStore.activeModuleId);
        if (active) {
          await this.selectModule(active.id);
        }
      }
    },

    async selectModule(moduleId) {
      this.loading = true;
      const progressStore = useProgressStore();
      const mod = this.modules.find(m => m.id === moduleId);

      if (!mod) {
        this.loading = false;
        throw new Error(`Модуль ${moduleId} не найден`);
      }

      try {
        this.activeModule = mod;
        progressStore.setActiveModuleId(mod.id);

        // Load questions
        this.questions = await this.loadQuestionsForModule(mod);

        // Extract categories
        this.categories = Array.from(new Set(this.questions.map(q => q.category || 'Общее')));

        // Check auto-generation of tickets if set
        if (mod.settings && mod.settings.autoTickets) {
          const ticketsKey = `vibe_prep_generated_tickets_${mod.id}`;
          if (!localStorage.getItem(ticketsKey)) {
            console.log('[AutoTickets] Auto settings detected. Automatically generating tickets...');
            this.autoGenerateTickets(mod, this.questions, this.categories);
          }
        }
      } catch (err) {
        console.error('Failed to select module', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    autoGenerateTickets(mod, questions, categories) {
      const ticketsKey = `vibe_prep_generated_tickets_${mod.id}`;
      const rulesKey = `vibe_prep_ticket_rules_${mod.id}`;
      
      const numTickets = 20; // Default count
      const rules = categories.map(cat => ({
        category: cat,
        count: 1,
        logic: 'random'
      }));
      
      const parsedRules = rules.map(rule => {
        const catQuestions = questions.filter(q => q.category === rule.category);
        return {
          category: rule.category,
          count: 1,
          logic: 'random',
          questions: [...catQuestions]
        };
      });

      const tickets = [];
      for (let t = 1; t <= numTickets; t++) {
        const ticketQuestionIds = [];
        for (const r of parsedRules) {
          if (r.questions.length === 0) continue;
          const shuffled = [...r.questions];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          ticketQuestionIds.push(shuffled[0].id);
        }
        tickets.push({
          ticketId: t,
          name: `Билет ${t}`,
          questionIds: ticketQuestionIds
        });
      }

      localStorage.setItem(ticketsKey, JSON.stringify(tickets));
      localStorage.setItem(rulesKey, JSON.stringify(rules));
      console.log(`[AutoTickets] Successfully auto-generated ${numTickets} tickets for module ${mod.id}`);
    },

    async loadQuestionsForModule(mod, nocache = false) {
      let mdText = '';
      if (mod.isCustom) {
        mdText = mod.mdText;
      } else {
        const resp = await fetch(mod.file + '?' + (nocache ? Date.now() : ''));
        if (!resp.ok) throw new Error('Файл темы не найден');
        mdText = await resp.text();
      }

      if (nocache) {
        console.log(`Module timestamp ${mod.id}:`, Date.now());
      }

      const parsedQuestions = parseMarkdown(mdText);
      if (parsedQuestions.metadata) {
        mod.settings = parsedQuestions.metadata;
      }

      // Post-process questions: namespace IDs and apply overrides
      parsedQuestions.forEach(q => {
        q.id = `${mod.id}_${q.id}`;

        // Apply overrides
        const overrides = this.getQuestionOverrides();
        if (overrides[q.id]) {
          Object.assign(q, overrides[q.id]);
        }
      });

      // Append custom added questions
      const addedQuestions = this.getAddedQuestions(mod.id);
      parsedQuestions.push(...addedQuestions);

      return parsedQuestions;
    },

    getQuestionOverrides() {
      try {
        const raw = localStorage.getItem(OVERRIDES_KEY);
        return raw ? JSON.parse(raw) : {};
      } catch (e) {
        console.error('Failed to get overrides', e);
        return {};
      }
    },

    getAddedQuestions(moduleId) {
      try {
        const raw = localStorage.getItem(ADDED_KEY);
        const allAdded = raw ? JSON.parse(raw) : {};
        return allAdded[moduleId] || [];
      } catch (e) {
        console.error('Failed to get added questions', e);
        return [];
      }
    },

    saveAddedQuestion(moduleId, question) {
      try {
        const raw = localStorage.getItem(ADDED_KEY);
        const allAdded = raw ? JSON.parse(raw) : {};
        if (!allAdded[moduleId]) {
          allAdded[moduleId] = [];
        }

        const index = allAdded[moduleId].findIndex(q => q.id === question.id);
        if (index > -1) {
          allAdded[moduleId][index] = question;
        } else {
          allAdded[moduleId].push(question);
        }

        localStorage.setItem(ADDED_KEY, JSON.stringify(allAdded));
        useProgressStore().touchSyncTimestamp();
      } catch (e) {
        console.error('Failed to save added question', e);
      }
    },

    addQuestionToModule(moduleId, questionFields) {
      const newQ = {
        id: `${moduleId}_q_added_${Date.now()}`,
        number: this.questions.length > 0 ? Math.max(...this.questions.map(q => q.number)) + 1 : 1,
        category: questionFields.category || 'Общее',
        title: questionFields.title,
        shortAnswer: questionFields.shortAnswer,
        detailedAnswer: questionFields.detailedAnswer,
        type: questionFields.type || 'free',
        tags: questionFields.tags || [],
        isStarred: false
      };

      this.saveAddedQuestion(moduleId, newQ);
      this.questions.push(newQ);

      // Save alternative answers to progress store stats
      const progressStore = useProgressStore();
      const stats = progressStore.stats;
      if (!stats[newQ.id]) {
        stats[newQ.id] = { correctCount: 0, incorrectCount: 0, acceptedAnswers: [] };
      }
      stats[newQ.id].acceptedAnswers = questionFields.acceptedAnswers || [];
      progressStore.saveStats();

      if (this.activeModule && this.activeModule.isCustom) {
        this.updateCustomModuleMd(moduleId);
      }

      this.categories = Array.from(new Set(this.questions.map(q => q.category || 'Общее')));
      return newQ;
    },

    editQuestionInModule(moduleId, questionId, updatedFields) {
      const qIndex = this.questions.findIndex(q => q.id === questionId);
      if (qIndex === -1) return;

      const q = this.questions[qIndex];
      Object.assign(q, updatedFields);

      try {
        // 1. Check if the question is in the "added" list
        const rawAdded = localStorage.getItem(ADDED_KEY);
        const allAdded = rawAdded ? JSON.parse(rawAdded) : {};
        const addedList = allAdded[moduleId] || [];
        const addedIndex = addedList.findIndex(item => item.id === questionId);

        if (addedIndex > -1) {
          Object.assign(addedList[addedIndex], updatedFields);
          allAdded[moduleId] = addedList;
          localStorage.setItem(ADDED_KEY, JSON.stringify(allAdded));
        } else {
          // It's a base question, update overrides
          const rawOverrides = localStorage.getItem(OVERRIDES_KEY);
          const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
          if (!overrides[questionId]) {
            overrides[questionId] = {};
          }
          Object.assign(overrides[questionId], updatedFields);
          localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
        }

        // Save alternative answers to stats
        const progressStore = useProgressStore();
        const qStat = progressStore.getQuestionStats(questionId);
        qStat.acceptedAnswers = updatedFields.acceptedAnswers || [];
        progressStore.saveStats();

        if (this.activeModule && this.activeModule.isCustom) {
          this.updateCustomModuleMd(moduleId);
        }

        this.categories = Array.from(new Set(this.questions.map(item => item.category || 'Общее')));
      } catch (e) {
        console.error('Failed to save question edit', e);
      }
    },

    createEmptyModule(name, description) {
      const newMod = {
        id: 'custom_' + Date.now(),
        name,
        description: description || 'Пользовательская тема',
        mdText: `# ${name}\n\n## Общее\n`,
        isCustom: true
      };

      const customRaw = localStorage.getItem(CUSTOM_MODS_KEY);
      const list = customRaw ? JSON.parse(customRaw) : [];
      list.push(newMod);
      localStorage.setItem(CUSTOM_MODS_KEY, JSON.stringify(list));

      this.modules.push(newMod);
      useProgressStore().touchSyncTimestamp();
      return newMod;
    },

    deleteCustomModule(moduleId) {
      const customRaw = localStorage.getItem(CUSTOM_MODS_KEY);
      if (customRaw) {
        let list = JSON.parse(customRaw);
        list = list.filter(m => m.id !== moduleId);
        localStorage.setItem(CUSTOM_MODS_KEY, JSON.stringify(list));
      }

      this.modules = this.modules.filter(m => m.id !== moduleId);

      const progressStore = useProgressStore();
      if (progressStore.activeModuleId === moduleId) {
        this.activeModule = null;
        this.questions = [];
        this.categories = [];
        progressStore.setActiveModuleId(null);
        progressStore.clearActiveSession();
        progressStore.currentScreen = 'modules';
      }
      progressStore.touchSyncTimestamp();
    },

    updateCustomModuleMd(moduleId) {
      const mod = this.modules.find(m => m.id === moduleId);
      if (mod && mod.isCustom) {
        const serialized = this.serializeQuestionsToMarkdown(this.questions, mod.name);
        mod.mdText = serialized;

        const customList = this.modules.filter(m => m.isCustom);
        localStorage.setItem(CUSTOM_MODS_KEY, JSON.stringify(customList));
        useProgressStore().touchSyncTimestamp();
      }
    },

    serializeQuestionsToMarkdown(questions, moduleName) {
      let md = '';
      const mod = this.modules.find(m => m.name === moduleName);
      if (mod && mod.settings) {
        md += `<!-- vibe-settings: ${JSON.stringify(mod.settings, null, 2)} -->\n\n`;
      }
      md += `# ${moduleName.toUpperCase()}\n\n`;

      const categories = {};
      questions.forEach(q => {
        const cat = q.category || 'Общее';
        if (!categories[cat]) {
          categories[cat] = [];
        }
        categories[cat].push(q);
      });

      for (const catName in categories) {
        md += `## ${catName}\n\n`;

        categories[catName].forEach(q => {
          const star = q.isStarred ? '[!] ' : '';
          const tagsStr = q.tags && q.tags.length > 0 ? ' ' + q.tags.map(t => '#' + t).join(' ') : '';
          md += `### ${star}${q.number}. ${q.title}${tagsStr}\n`;

          if (q.type === 'choice' && q.choices && q.choices.length > 0) {
            q.choices.forEach(choice => {
              const check = choice.isCorrect ? 'x' : ' ';
              md += `- [${check}] ${choice.text}\n`;
            });
          }

          if (q.shortAnswer) {
            if (q.shortAnswer.includes('\n')) {
              md += `* **Краткий ответ**:\n  ${q.shortAnswer.split('\n').join('\n  ')}\n`;
            } else {
              md += `* **Краткий ответ**: ${q.shortAnswer}\n`;
            }
          }

          if (q.detailedAnswer) {
            if (q.detailedAnswer.includes('\n')) {
              md += `* **Пояснение**:\n  ${q.detailedAnswer.split('\n').join('\n  ')}\n`;
            } else {
              md += `* **Пояснение**: ${q.detailedAnswer}\n`;
            }
          }

          md += `\n`;
        });
      }

      return md;
    },

    async createModuleFromMarkdown(mdText) {
      const parsed = parseMarkdown(mdText);
      if (parsed.length === 0) {
        throw new Error('В сгенерированном ответе не найдено корректных вопросов.');
      }

      let customName = 'Сгенерированная тема';
      const firstLine = mdText.split('\n')[0];
      if (firstLine.startsWith('# ')) {
        customName = firstLine.replace('# ', '').trim();
      }

      const newMod = {
        id: 'custom_' + Date.now(),
        name: customName,
        description: 'Сгенерировано ИИ',
        mdText: mdText,
        isCustom: true
      };

      const customRaw = localStorage.getItem(CUSTOM_MODS_KEY);
      const list = customRaw ? JSON.parse(customRaw) : [];
      list.push(newMod);
      localStorage.setItem(CUSTOM_MODS_KEY, JSON.stringify(list));

      this.modules.push(newMod);
      useProgressStore().touchSyncTimestamp();
      return newMod;
    },

    async handleCustomModuleImport(file, customName, customDesc) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const mdText = e.target.result;
            const parsed = parseMarkdown(mdText);
            if (parsed.length === 0) {
              throw new Error('В файле не найдено корректных вопросов. Проверьте форматирование.');
            }

            const newMod = {
              id: 'custom_' + Date.now(),
              name: customName.trim() || file.name.replace(/\.md$/i, ''),
              description: customDesc.trim() || 'Пользовательская тема',
              mdText: mdText,
              isCustom: true
            };
            if (parsed.metadata) {
              newMod.settings = parsed.metadata;
            }

            const customRaw = localStorage.getItem(CUSTOM_MODS_KEY);
            const list = customRaw ? JSON.parse(customRaw) : [];
            list.push(newMod);
            localStorage.setItem(CUSTOM_MODS_KEY, JSON.stringify(list));

            this.modules.push(newMod);
            useProgressStore().touchSyncTimestamp();
            resolve(newMod);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsText(file);
      });
    }
  }
});
