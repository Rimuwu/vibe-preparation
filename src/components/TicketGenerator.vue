<template>
  <section id="screen-tickets" class="screen active">
    <!-- Rules Configuration Panel -->
    <div class="panel">
      <!-- Header -->
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;"
      >
        <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
          🎫 Генератор билетов
        </h2>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <label for="ticket-module-select" style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
            Модуль:
          </label>
          <select
            id="ticket-module-select"
            class="select-control"
            style="width: auto; padding: 0.4rem 0.75rem; font-size: 0.85rem; height: 36px; border-radius: var(--radius-sm);"
            v-model="selectedModuleId"
            @change="onModuleChange"
          >
            <option v-for="mod in modulesStore.modules" :key="mod.id" :value="mod.id">
              {{ mod.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Config Rows -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;" v-if="selectedModuleId">
        <div class="form-group" style="margin-bottom: 0;">
          <label for="ticket-total-count" style="display: block; margin-bottom: 0.4rem; font-size: 0.85rem; color: var(--text-muted);">
            Количество билетов для генерации
          </label>
          <input
            type="number"
            id="ticket-total-count"
            class="select-control"
            min="1"
            max="100"
            style="padding: 0.5rem 0.75rem; font-size: 0.9rem; height: 38px; border-radius: var(--radius-sm);"
            v-model.number="ticketTotalCount"
          />
        </div>
        
        <div class="form-group" style="margin-bottom: 0;">
          <label for="ticket-solve-mode" style="display: block; margin-bottom: 0.4rem; font-size: 0.85rem; color: var(--text-muted);">
            Режим решения билетов
          </label>
          <select
            id="ticket-solve-mode"
            class="select-control"
            style="padding: 0.5rem 0.75rem; font-size: 0.9rem; height: 38px; border-radius: var(--radius-sm);"
            v-model="solveMode"
            @change="saveSolveMode"
          >
            <option value="free">🗣️ Повторение (Устно)</option>
            <option value="choice">📝 Тест (Выбор варианта)</option>
            <option value="input">⌨️ Ввод текста</option>
          </select>
        </div>
      </div>

      <div style="height: 1px; background: var(--border-color); margin: 1.25rem 0;" v-if="selectedModuleId"></div>

      <!-- Generation Mode Radio Toggles -->
      <div style="display: grid; grid-template-columns: 1fr; gap: 1rem; margin-bottom: 1rem;" v-if="selectedModuleId">
        <div class="form-group" style="margin-bottom: 0;">
          <label style="display: block; margin-bottom: 0.4rem; font-size: 0.85rem; color: var(--text-muted);">
            Режим генерации вопросов
          </label>
          <div style="display: flex; gap: 1.25rem; align-items: center; height: 38px;">
            <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.9rem; cursor: pointer; color: var(--text-main); font-weight: 500;">
              <input type="radio" name="generation-mode" v-model="generationMode" value="by_topic" style="accent-color: var(--primary);" />
              По темам
            </label>
            <label style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.9rem; cursor: pointer; color: var(--text-main); font-weight: 500;">
              <input type="radio" name="generation-mode" v-model="generationMode" value="random" style="accent-color: var(--primary);" />
              Случайный набор
            </label>
          </div>
        </div>
      </div>

      <!-- Category partition count inputs -->
      <div v-if="selectedModuleId">
        <!-- Topic Selection Rules Mode -->
        <div v-if="generationMode === 'by_topic'">
          <h3
            style="font-size: 0.95rem; font-weight: 600; color: var(--text-muted); margin: 0 0 1rem 0; text-transform: uppercase; letter-spacing: 0.05em;"
          >
            Правила выбора вопросов по темам
          </h3>

          <!-- Rules container -->
          <div id="ticket-rules-container" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.25rem;">
            <div
              v-for="rule in rules"
              :key="rule.category"
              class="ticket-rule-row"
            >
              <div class="ticket-rule-info">
                <div class="ticket-rule-title">{{ rule.category }}</div>
                <div class="ticket-rule-badge">Доступно вопросов: {{ rule.availableCount }}</div>
              </div>
              
              <div class="ticket-rule-controls">
                <div class="ticket-rule-control-group">
                  <span class="ticket-rule-control-label">Вопросов:</span>
                  <input
                    type="number"
                    class="select-control ticket-cat-count"
                    min="0"
                    :max="rule.availableCount"
                    style="width: 80px; padding: 0.4rem; font-size: 0.85rem; height: 34px; text-align: center; border-radius: var(--radius-sm);"
                    v-model.number="rule.count"
                  />
                </div>
                
                <div class="ticket-rule-control-group">
                  <span class="ticket-rule-control-label">Логика:</span>
                  <select
                    class="select-control ticket-cat-logic"
                    style="width: 140px; padding: 0.4rem; font-size: 0.85rem; height: 34px; border-radius: var(--radius-sm);"
                    v-model="rule.logic"
                  >
                    <option value="sequential">По порядку</option>
                    <option value="random">Случайно</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Random Mode Questions Count Question -->
        <div v-else-if="generationMode === 'random'" class="form-group" style="margin-bottom: 1.25rem; background: rgba(255, 255, 255, 0.015); border: 1px solid var(--border-color); padding: 1.25rem; border-radius: var(--radius-md);">
          <label for="ticket-questions-count" style="display: block; margin-bottom: 0.6rem; font-size: 0.95rem; font-weight: 600; color: var(--text-main);">
            Сколько вопросов должно быть в одном билете?
          </label>
          <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <input
              type="number"
              id="ticket-questions-count"
              class="select-control"
              min="1"
              :max="moduleQuestions.length"
              style="width: 120px; padding: 0.5rem 0.75rem; font-size: 1rem; height: 40px; text-align: center; border-radius: var(--radius-sm);"
              v-model.number="questionsPerTicket"
            />
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              Доступно всего вопросов: {{ moduleQuestions.length }}
            </span>
          </div>
        </div>

        <button
          id="btn-generate-tickets"
          class="btn-primary"
          style="width: 100%; padding: 0.75rem 1.5rem; font-size: 0.9rem; border-radius: var(--radius-sm); font-weight: 600; margin-top: 1rem;"
          @click="generateTickets"
        >
          Сгенерировать билеты
        </button>
      </div>
    </div>

    <!-- Generated Tickets list panel -->
    <div class="panel" style="flex-grow: 1;" v-if="selectedModuleId">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">Сгенерированные билеты</h2>
      
      <!-- Empty state -->
      <div
        v-if="generatedTickets.length === 0"
        id="tickets-empty"
        style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); background: rgba(255,255,255,0.01); border: 1px dashed var(--border-color); border-radius: var(--radius-md);"
      >
        Билеты ещё не сгенерированы. Настройте параметры выше и нажмите кнопку генерации.
      </div>
      
      <!-- Tickets list grid -->
      <div v-else id="tickets-list-container" class="tickets-grid">
        <div
          v-for="ticket in generatedTickets"
          :key="ticket.ticketId"
          class="ticket-card"
          @click="solveTicket(ticket)"
        >
          <!-- Card Header -->
          <div class="ticket-card-header">
            <div class="ticket-card-num">
              🎫 Билет {{ ticket.ticketId }}
              
              <!-- Completion Stat badge -->
              <span
                v-if="getTicketStat(ticket.ticketId)"
                class="brand-badge"
                :style="getStatBadgeStyle(ticket.ticketId)"
                :title="getStatBadgeTitle(ticket.ticketId)"
              >
                {{ getTicketStat(ticket.ticketId).correct }}/{{ getTicketStat(ticket.ticketId).total }}
              </span>
            </div>
            
            <div class="ticket-card-qcount">
              {{ ticket.questionIds.length }} {{ getQuestionCountLabel(ticket.questionIds.length) }}
            </div>
          </div>

          <!-- Question list details -->
          <div class="ticket-card-questions">
            <div
              v-for="qId in ticket.questionIds.slice(0, 5)"
              :key="qId"
              class="ticket-card-qitem"
            >
              {{ getQuestionTitle(qId) }}
            </div>
            <div v-if="ticket.questionIds.length > 5" class="ticket-card-qitem" style="opacity: 0.5;">
              ... и ещё {{ ticket.questionIds.length - 5 }} вопр.
            </div>
          </div>

          <!-- Bottom progress indicator bar -->
          <div
            v-if="getTicketStat(ticket.ticketId)"
            style="position: absolute; bottom: 0; left: 0; height: 4px; transition: var(--transition);"
            :style="{ width: getTicketPercent(ticket.ticketId) + '%', background: getPercentColor(getTicketPercent(ticket.ticketId)) }"
          ></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { computed, ref, reactive, watch, onMounted } from 'vue';
import { useProgressStore } from '../stores/progress';
import { useModulesStore } from '../stores/modules';
import { useModal } from '../composables/useModal';

export default {
  name: 'TicketGenerator',
  setup(props, { emit }) {
    const progressStore = useProgressStore();
    const modulesStore = useModulesStore();
    const { showAlert } = useModal();

    const selectedModuleId = ref('');
    const ticketTotalCount = ref(35);
    const solveMode = ref('free');
    const rules = ref([]);
    const generatedTickets = ref([]);
    const moduleQuestions = ref([]);
    const generationMode = ref('by_topic');
    const questionsPerTicket = ref(5);

    onMounted(async () => {
      if (modulesStore.modules.length > 0) {
        selectedModuleId.value = progressStore.activeModuleId || modulesStore.modules[0].id;
        await onModuleChange();
      }
      
      const savedSolveMode = localStorage.getItem('vibe_prep_ticket_solve_mode');
      if (savedSolveMode) {
        solveMode.value = savedSolveMode;
      }
    });

    const onModuleChange = async () => {
      const modId = selectedModuleId.value;
      if (!modId) return;

      const mod = modulesStore.modules.find(m => m.id === modId);
      if (!mod) return;

      try {
        // Load module questions
        moduleQuestions.value = await modulesStore.loadQuestionsForModule(mod);
        
        // Extract categories counts
        const catMap = {};
        moduleQuestions.value.forEach(q => {
          const cat = q.category || 'Общее';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });

        const categories = Object.keys(catMap).sort();

        // Restore saved rules if exist
        const savedRulesRaw = localStorage.getItem(`vibe_prep_ticket_rules_${modId}`);
        let savedRules = null;
        if (savedRulesRaw) {
          try {
            savedRules = JSON.parse(savedRulesRaw);
          } catch (e) {}
        }

        const savedGenMode = localStorage.getItem(`vibe_prep_ticket_gen_mode_${modId}`);
        generationMode.value = savedGenMode || 'by_topic';

        const savedCount = localStorage.getItem(`vibe_prep_ticket_qcount_${modId}`);
        if (savedCount) {
          questionsPerTicket.value = parseInt(savedCount, 10);
        } else {
          questionsPerTicket.value = Math.min(5, moduleQuestions.value.length);
        }

        // Initialize rules reactivity array
        rules.value = categories.map(catName => {
          const totalAvailable = catMap[catName];
          
          let count = 1;
          if (categories.length === 2) {
            count = (categories[0] === catName) ? 2 : 1;
          }
          count = Math.min(count, totalAvailable);
          
          let logic = 'sequential';

          if (savedRules) {
            const savedRule = savedRules.find(r => r.category === catName);
            if (savedRule) {
              if (savedRule.count !== undefined) count = Math.min(savedRule.count, totalAvailable);
              if (savedRule.logic !== undefined) logic = savedRule.logic;
            }
          }

          return {
            category: catName,
            availableCount: totalAvailable,
            count,
            logic
          };
        });

        // Restore saved tickets if exist
        const savedTicketsRaw = localStorage.getItem(`vibe_prep_generated_tickets_${modId}`);
        if (savedTicketsRaw) {
          try {
            generatedTickets.value = JSON.parse(savedTicketsRaw);
          } catch (e) {
            generatedTickets.value = [];
          }
        } else {
          generatedTickets.value = [];
        }

      } catch (err) {
        console.error('Failed to load tickets metadata', err);
        showAlert({ message: 'Не удалось загрузить данные вопросов темы.' });
      }
    };

    const saveSolveMode = () => {
      localStorage.setItem('vibe_prep_ticket_solve_mode', solveMode.value);
    };

    const generateTickets = () => {
      const modId = selectedModuleId.value;
      if (!modId) return;

      const numTickets = ticketTotalCount.value;
      if (isNaN(numTickets) || numTickets < 1) {
        showAlert({ message: 'Укажите корректное количество билетов (минимум 1).' });
        return;
      }

      // Check random mode
      if (generationMode.value === 'random') {
        const qCount = questionsPerTicket.value;
        if (isNaN(qCount) || qCount < 1 || qCount > moduleQuestions.value.length) {
          showAlert({ message: `Укажите корректное количество вопросов в билете (от 1 до ${moduleQuestions.value.length}).` });
          return;
        }

        const tickets = [];
        for (let t = 1; t <= numTickets; t++) {
          const ticketQuestionIds = [];
          const shuffled = [...moduleQuestions.value];
          shuffleArray(shuffled);
          for (let j = 0; j < qCount; j++) {
            ticketQuestionIds.push(shuffled[j].id);
          }
          tickets.push({
            ticketId: t,
            name: `Билет ${t}`,
            questionIds: ticketQuestionIds
          });
        }

        // Save to localStorage
        localStorage.setItem(`vibe_prep_generated_tickets_${modId}`, JSON.stringify(tickets));
        localStorage.setItem(`vibe_prep_ticket_gen_mode_${modId}`, 'random');
        localStorage.setItem(`vibe_prep_ticket_qcount_${modId}`, qCount.toString());
        
        // Reset ticket progress stats on regeneration
        localStorage.removeItem(`vibe_prep_ticket_stats_${modId}`);

        generatedTickets.value = tickets;
        progressStore.touchSyncTimestamp();
        return;
      }

      let totalQuestionsPerTicket = 0;
      const parsedRules = [];

      for (const rule of rules.value) {
        const count = rule.count;
        if (isNaN(count) || count < 0) {
          showAlert({ message: `Укажите корректное количество вопросов для темы "${rule.category}".` });
          return;
        }

        const catQuestions = moduleQuestions.value.filter(q => q.category === rule.category);
        if (count > catQuestions.length) {
          showAlert({
            message: `Количество вопросов в теме "${rule.category}" (${catQuestions.length}) меньше, чем указано в билете (${count}).`
          });
          return;
        }

        parsedRules.push({
          category: rule.category,
          count,
          logic: rule.logic,
          questions: catQuestions.sort((a, b) => a.number - b.number)
        });

        totalQuestionsPerTicket += count;
      }

      if (totalQuestionsPerTicket === 0) {
        showAlert({ message: 'В билете должен быть хотя бы один вопрос.' });
        return;
      }

      const tickets = [];
      for (let t = 1; t <= numTickets; t++) {
        const ticketQuestionIds = [];
        
        for (const r of parsedRules) {
          if (r.count === 0) continue;

          const N = r.questions.length;
          if (r.logic === 'sequential') {
            // Index partitioning formula
            for (let j = 0; j < r.count; j++) {
              const idx = ((t - 1) + j * numTickets) % N;
              ticketQuestionIds.push(r.questions[idx].id);
            }
          } else {
            // Random partition pick
            const shuffled = [...r.questions];
            shuffleArray(shuffled);
            for (let j = 0; j < r.count; j++) {
              ticketQuestionIds.push(shuffled[j].id);
            }
          }
        }

        tickets.push({
          ticketId: t,
          name: `Билет ${t}`,
          questionIds: ticketQuestionIds
        });
      }

      // Save to localStorage
      localStorage.setItem(`vibe_prep_generated_tickets_${modId}`, JSON.stringify(tickets));
      localStorage.setItem(`vibe_prep_ticket_gen_mode_${modId}`, 'by_topic');
      const rulesToSave = rules.value.map(r => ({ category: r.category, count: r.count, logic: r.logic }));
      localStorage.setItem(`vibe_prep_ticket_rules_${modId}`, JSON.stringify(rulesToSave));
      
      // Reset ticket progress stats on regeneration
      localStorage.removeItem(`vibe_prep_ticket_stats_${modId}`);

      generatedTickets.value = tickets;
      progressStore.touchSyncTimestamp();
    };

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
    }

    const getTicketStat = (ticketId) => {
      const modId = selectedModuleId.value;
      if (!modId) return null;
      try {
        const raw = localStorage.getItem(`vibe_prep_ticket_stats_${modId}`);
        const stats = raw ? JSON.parse(raw) : {};
        return stats[ticketId] || null;
      } catch (e) {
        return null;
      }
    };

    const getTicketPercent = (ticketId) => {
      const s = getTicketStat(ticketId);
      if (!s) return 0;
      return s.total > 0 ? Math.round(s.correct / s.total * 100) : 0;
    };

    const getPercentColor = (percent) => {
      if (percent >= 80) return 'var(--success)';
      if (percent >= 50) return 'var(--warning)';
      return 'var(--error)';
    };

    const getStatBadgeStyle = (ticketId) => {
      const percent = getTicketPercent(ticketId);
      if (percent >= 80) {
        return {
          background: 'var(--success-dark)',
          color: 'var(--success)',
          borderColor: 'rgba(129, 201, 149, 0.3)',
          marginLeft: '0.5rem'
        };
      }
      if (percent >= 50) {
        return {
          background: 'var(--warning-dark)',
          color: 'var(--warning)',
          borderColor: 'rgba(253, 214, 99, 0.3)',
          marginLeft: '0.5rem'
        };
      }
      return {
        background: 'var(--error-dark)',
        color: 'var(--error)',
        borderColor: 'rgba(242, 139, 130, 0.3)',
        marginLeft: '0.5rem'
      };
    };

    const getStatBadgeTitle = (ticketId) => {
      const s = getTicketStat(ticketId);
      if (!s) return '';
      const percent = getTicketPercent(ticketId);
      return `Решено правильно: ${percent}%\nПопыток: ${s.attempts}`;
    };

    const getQuestionTitle = (qId) => {
      const q = moduleQuestions.value.find(item => item.id === qId);
      if (!q) return 'Загрузка вопроса...';
      const qNumText = q.number ? `${q.number}. ` : '';
      return `${qNumText}${q.title}`;
    };

    const getQuestionCountLabel = (count) => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      if (mod100 >= 11 && mod100 <= 19) {
        return 'вопросов';
      }
      if (mod10 === 1) {
        return 'вопрос';
      }
      if (mod10 >= 2 && mod10 <= 4) {
        return 'вопроса';
      }
      return 'вопросов';
    };

    const solveTicket = async (ticket) => {
      const modId = selectedModuleId.value;
      const mod = modulesStore.modules.find(m => m.id === modId);
      if (!mod) return;

      try {
        await modulesStore.selectModule(mod.id);
        
        const ticketQuestions = ticket.questionIds
          .map(id => modulesStore.questions.find(q => q.id === id))
          .filter(Boolean);

        if (ticketQuestions.length === 0) {
          showAlert({ message: 'В этом билете нет доступных вопросов.' });
          return;
        }

        const settings = {
          category: 'all',
          algorithm: 'sequential',
          qtype: solveMode.value,
          onlyDifficult: false,
          progressFilter: 'all'
        };

        // Override solver solve mode
        progressStore.startStudySession(ticketQuestions, ticket.ticketId, settings);
      } catch (err) {
        showAlert({ message: 'Не удалось загрузить билет.' });
      }
    };

    return {
      modulesStore,
      progressStore,
      selectedModuleId,
      ticketTotalCount,
      solveMode,
      rules,
      generatedTickets,
      moduleQuestions,
      generationMode,
      questionsPerTicket,
      onModuleChange,
      saveSolveMode,
      generateTickets,
      getTicketStat,
      getTicketPercent,
      getPercentColor,
      getStatBadgeStyle,
      getStatBadgeTitle,
      getQuestionTitle,
      getQuestionCountLabel,
      solveTicket
    };
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}

.tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
  margin-top: 1.5rem;
}

.ticket-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
}

.ticket-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.ticket-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 0.5rem;
}

.ticket-card-num {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.ticket-card-qcount {
  font-size: 0.75rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.ticket-card-questions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.ticket-card-qitem {
  font-size: 0.85rem;
  color: var(--text-main);
  opacity: 0.95;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0.15rem 0;
  display: block;
}

.ticket-card-qitem::before {
  content: "•";
  color: var(--primary);
  font-weight: bold;
}

.ticket-rule-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
  transition: var(--transition);
}

.ticket-rule-row:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: var(--border-hover);
}

.ticket-rule-info {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 200px;
}

.ticket-rule-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-main);
}

.ticket-rule-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.ticket-rule-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.ticket-rule-control-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ticket-rule-control-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>

