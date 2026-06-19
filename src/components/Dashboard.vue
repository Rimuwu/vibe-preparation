<template>
  <main id="screen-dashboard" class="screen active">
    <div v-if="modulesStore.activeModule" style="display:contents">
    <!-- Active Module Title Panel -->
    <div class="panel">
      <div style="display: flex; justify-content: space-between; align-items: start; gap: 1rem;">
        <div style="min-width: 0;">
          <span class="brand-badge" style="margin-bottom: 0.5rem; display: inline-block;">Тема</span>
          <h2
            id="current-module-title"
            style="font-size: 1.2rem; font-weight: 700; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
          >
            {{ modulesStore.activeModule.name }}
          </h2>
          <p
            id="current-module-desc"
            style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;"
          >
            {{ modulesStore.activeModule.description }}
          </p>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; flex-shrink: 0;">
          <!-- View topic questions -->
          <button
            id="btn-view-module"
            class="btn-action"
            style="padding: 0.4rem 0.75rem; font-size: 0.8rem; border-color: var(--border-color); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.25rem; background: transparent; color: var(--text-main);"
            @click="viewModule"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            Просмотр
          </button>
          
          <!-- Change active module -->
          <button
            id="btn-change-module"
            class="btn-action"
            style="padding: 0.4rem 0.75rem; font-size: 0.8rem; border-color: var(--border-color); border-radius: var(--radius-sm); border: 1px solid var(--border-color); display: flex; align-items: center; gap: 0.25rem; background: transparent; color: var(--text-main);"
            @click="changeModule"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="16 3 21 8 16 13"></polyline>
              <line x1="21" y1="8" x2="9" y2="8"></line>
              <polyline points="8 21 3 16 8 11"></polyline>
              <line x1="3" y1="16" x2="15" y2="16"></line>
            </svg>
            Сменить
          </button>
        </div>
      </div>
    </div>

    <!-- Training Settings Panel -->
    <div class="panel">
      <h2 style="font-size: 1.25rem; margin-bottom: 1rem; font-weight: 700;">Настройки обучения</h2>

      <!-- Category Filter -->
      <div class="form-group">
        <label>Раздел / Категория</label>
        <div id="card-selector-category" class="card-radio-group">
          <!-- "Все вопросы" card -->
          <div
            class="radio-card"
            :class="{ active: settings.category === 'all' }"
            @click="setCategory('all')"
          >
            <div class="radio-card-icon">📂</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Все вопросы</div>
              <div class="radio-card-desc">Все категории вместе</div>
            </div>
          </div>
          
          <!-- Dynamic categories -->
          <div
            v-for="cat in modulesStore.categories"
            :key="cat"
            class="radio-card"
            :class="{ active: settings.category === cat }"
            @click="setCategory(cat)"
          >
            <div class="radio-card-icon">📁</div>
            <div class="radio-card-content">
              <div class="radio-card-title">{{ cat }}</div>
              <div class="radio-card-desc">Категория вопросов</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sorting/Algorithm Selector -->
      <div class="form-group">
        <label>Алгоритм обучения</label>
        <div id="card-selector-algorithm" class="card-radio-group">
          <div
            class="radio-card"
            :class="{ active: settings.algorithm === 'sequential' }"
            @click="settings.algorithm = 'sequential'"
          >
            <div class="radio-card-icon">🔄</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Все подряд</div>
              <div class="radio-card-desc">Вопросы по порядку</div>
            </div>
          </div>
          
          <div
            class="radio-card"
            :class="{ active: settings.algorithm === 'random' }"
            @click="settings.algorithm = 'random'"
          >
            <div class="radio-card-icon">🔀</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Случайные</div>
              <div class="radio-card-desc">Вопросы вразнобой</div>
            </div>
          </div>
          
          <div
            class="radio-card"
            :class="{ active: settings.algorithm === 'difficult_first' }"
            @click="settings.algorithm = 'difficult_first'"
          >
            <div class="radio-card-icon">🔥</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Сложные сначала</div>
              <div class="radio-card-desc">От трудных к легким</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Question Type Selector -->
      <div class="form-group">
        <label>Вид вопросов</label>
        <div id="card-selector-qtype" class="card-radio-group">
          <div
            class="radio-card"
            :class="{ active: settings.qtype === 'free' }"
            @click="settings.qtype = 'free'"
          >
            <div class="radio-card-icon">🗣️</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Свободный ответ</div>
              <div class="radio-card-desc">Устный самоконтроль</div>
            </div>
          </div>
          
          <div
            class="radio-card"
            :class="{ active: settings.qtype === 'choice' }"
            @click="settings.qtype = 'choice'"
          >
            <div class="radio-card-icon">📝</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Тест</div>
              <div class="radio-card-desc">
                Выбор из 4 вариантов (в среднем {{ avgChoices }} в базе)
              </div>
            </div>
          </div>
          
          <div
            class="radio-card"
            :class="{ active: settings.qtype === 'input' }"
            @click="settings.qtype = 'input'"
          >
            <div class="radio-card-icon">⌨️</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Ввод текста</div>
              <div class="radio-card-desc">
                Эталон у {{ referenceCount }} из {{ totalCategoryQuestions }} заданий
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Filter Selector -->
      <div class="form-group">
        <label>Фильтр по прогрессу</label>
        <div id="card-selector-progress-filter" class="card-radio-group">
          <div
            class="radio-card"
            :class="{ active: settings.progressFilter === 'all' }"
            @click="settings.progressFilter = 'all'"
          >
            <div class="radio-card-icon">📋</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Все вопросы</div>
              <div class="radio-card-desc">Без фильтрации</div>
            </div>
          </div>
          
          <div
            class="radio-card"
            :class="{ active: settings.progressFilter === 'no_correct' }"
            @click="settings.progressFilter = 'no_correct'"
          >
            <div class="radio-card-icon">❌</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Без верных</div>
              <div class="radio-card-desc">Только нерешенные</div>
            </div>
          </div>
          
          <div
            class="radio-card"
            :class="{ active: settings.progressFilter === 'no_attempts' }"
            @click="settings.progressFilter = 'no_attempts'"
          >
            <div class="radio-card-icon">✨</div>
            <div class="radio-card-content">
              <div class="radio-card-title">Новые</div>
              <div class="radio-card-desc">Без попыток ответа</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Only Difficult Toggle -->
      <div
        class="form-group"
        style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; margin-bottom: 1.25rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.75rem 1rem;"
      >
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 1.25rem; color: var(--warning); line-height: 1;">★</div>
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; font-size: 0.85rem; color: var(--text-main); line-height: 1.2;">
              Сложные вопросы
            </span>
            <span style="font-size: 0.7rem; color: var(--text-muted); line-height: 1.2; margin-top: 2px;">
              Показывать только отмеченные звездой
            </span>
          </div>
        </div>
        
        <button
          type="button"
          class="btn-toggle-only-difficult"
          :class="{ active: settings.onlyDifficult }"
          @click="settings.onlyDifficult = !settings.onlyDifficult"
        >
          {{ settings.onlyDifficult ? 'Только сложные' : 'Не только сложные' }}
        </button>
      </div>
    </div>

    <!-- GitHub Star Banner -->
    <div id="github-star-banner" class="github-star-banner">
      <div class="github-star-banner-content">
        <div class="github-star-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon
              points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
            ></polygon>
          </svg>
        </div>
        <div class="github-star-text">
          <p>Нравится проект? Поставьте звезду на <strong>GitHub</strong> — это помогает проекту развиваться! 🚀</p>
        </div>
        <div class="github-star-actions">
          <a
            href="https://github.com/Rimuwu/vibe-preparation"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-star-github"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              ></polygon>
            </svg>
            Поставить звезду
          </a>
        </div>
      </div>
    </div>

    <!-- Start Session Button -->
    <button id="btn-start-session" class="btn-primary" @click="startSession">
      Начать подготовку
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </button>
    </div>
    <div v-else class="panel" style="text-align: center; padding: 3rem; color: var(--text-muted); margin: auto;">
      <p>Загрузка темы...</p>
    </div>
  </main>
</template>

<script>
import { reactive, computed, watch, onMounted } from 'vue';
import { useModulesStore } from '../stores/modules';
import { useProgressStore } from '../stores/progress';
import { prepareSession } from '../utils/algorithms';

export default {
  name: 'Dashboard',
  setup(props, { emit }) {
    const modulesStore = useModulesStore();
    const progressStore = useProgressStore();
    
    const settings = reactive({
      category: 'all',
      algorithm: 'sequential',
      qtype: 'free',
      progressFilter: 'all',
      onlyDifficult: false
    });

    // Load session settings if they exist
    onMounted(() => {
      const savedSession = localStorage.getItem('vibe_prep_active_session');
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (session.settings) {
            Object.assign(settings, session.settings);
          }
        } catch (e) {}
      }
    });

    // Helper statistics metrics based on settings
    const filteredQuestions = computed(() => {
      const cat = settings.category;
      if (cat === 'all') return modulesStore.questions;
      return modulesStore.questions.filter(q => q.category === cat);
    });

    const totalCategoryQuestions = computed(() => filteredQuestions.value.length);

    const avgChoices = computed(() => {
      const choiceQs = filteredQuestions.value.filter(q => q.choices && q.choices.length > 0);
      if (choiceQs.length === 0) return 0;
      return (
        choiceQs.reduce((sum, q) => sum + q.choices.length, 0) / choiceQs.length
      ).toFixed(1);
    });

    const referenceCount = computed(() => {
      return filteredQuestions.value.filter(
        q => q.shortAnswer && q.shortAnswer.trim() !== ''
      ).length;
    });

    const changeModule = () => {
      progressStore.currentScreen = 'modules';
    };

    const viewModule = () => {
      progressStore.currentScreen = 'viewer';
    };

    const setCategory = (cat) => {
      settings.category = cat;
    };

    const startSession = () => {
      if (modulesStore.questions.length === 0) {
        emit('show-alert', {
          message: 'В этой теме пока нет вопросов. Вы можете добавить вопросы на странице просмотра темы.'
        });
        return;
      }

      // Filter queue using algorithms module
      const queue = prepareSession(
        modulesStore.questions,
        settings.category,
        settings.algorithm,
        settings.onlyDifficult,
        settings.progressFilter,
        progressStore.stats
      );

      if (queue.length === 0) {
        if (settings.onlyDifficult) {
          emit('show-alert', {
            message: 'Нет сложных вопросов в выбранной категории.'
          });
        } else {
          emit('show-alert', {
            message: 'Нет вопросов, соответствующих выбранным критериям.'
          });
        }
        return;
      }

      progressStore.startStudySession(queue, null, settings);
    };

    return {
      modulesStore,
      progressStore,
      settings,
      totalCategoryQuestions,
      avgChoices,
      referenceCount,
      changeModule,
      viewModule,
      setCategory,
      startSession
    };
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}

/* Premium card radio selectors */
.card-radio-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
  margin-bottom: 1.25rem;
}

.radio-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  position: relative;
  overflow: hidden;
}

.radio-card:hover {
  border-color: rgba(138, 180, 248, 0.4);
  background: rgba(255, 255, 255, 0.04);
  transform: translateY(-2px);
}

.radio-card.active {
  border-color: var(--primary);
  background: rgba(138, 180, 248, 0.08);
  box-shadow: 0 4px 15px rgba(138, 180, 248, 0.12);
}

.radio-card-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.05rem;
}

.radio-card-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.radio-card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.radio-card-desc {
  font-size: 0.7rem;
  color: var(--text-muted);
  line-height: 1.3;
}

.btn-toggle-only-difficult {
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.5rem 1.25rem;
  border-radius: 100px;
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 170px;
  user-select: none;
}

.btn-toggle-only-difficult:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-main);
  border-color: var(--border-hover);
}

.btn-toggle-only-difficult.active {
  background: var(--warning-dark);
  border-color: var(--warning);
  color: var(--warning);
  font-weight: 600;
  box-shadow: 0 0 10px rgba(253, 214, 99, 0.1);
}
</style>

