<template>
  <section id="screen-viewer" class="screen active">
    <div v-if="modulesStore.activeModule" :class="{ 'select-mode-active': isSelectionMode }" style="display:contents">
    <!-- Header panel -->
    <div class="panel" style="margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2
          id="viewer-title"
          style="font-size: 1.25rem; font-weight: 700; margin-right: 1rem; color: #ffffff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
        >
          Просмотр темы: {{ modulesStore.activeModule.name }}
        </h2>
        <button
          id="btn-viewer-back"
          class="btn-action"
          style="padding: 0.4rem 0.75rem; font-size: 0.8rem; border-color: var(--border-color); flex-shrink: 0; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main); display: flex; align-items: center; gap: 0.25rem;"
          @click="goBack"
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
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Назад
        </button>
      </div>
      <p id="viewer-desc" style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
        {{ modulesStore.activeModule.description }}
      </p>

      <!-- Viewer Actions Row -->
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap;">
        <!-- Toggle expanded -->
        <button class="btn-action" style="padding: 0.6rem 1rem; font-size: 0.85rem; border-color: var(--border-color); border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main); white-space: nowrap; display: flex; align-items: center; gap: 0.25rem;" @click="toggleAllExpanded">
          {{ isAllExpanded ? 'Свернуть все' : 'Развернуть все' }}
        </button>
        
        <!-- Export Markdown -->
        <button class="btn-action" style="padding: 0.6rem 1rem; font-size: 0.85rem; border-color: var(--border-color); border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main); white-space: nowrap; display: flex; align-items: center; gap: 0.25rem;" @click="exportMarkdown">
          Экспорт в .md
        </button>
        
        <!-- Selection mode toggle -->
        <button
          class="btn-action"
          :class="{ active: isSelectionMode }"
          :style="selectionModeBtnStyle"
          @click="toggleSelectionMode"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M9 11l3 3L22 4"></path>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
          </svg>
          <span>{{ isSelectionMode ? 'Отменить выбор' : 'Собрать набор' }}</span>
        </button>
        
        <!-- Add Question -->
        <button class="btn-action" style="padding: 0.6rem 1rem; font-size: 0.85rem; border-color: var(--primary); border-radius: var(--radius-sm); border: 1px solid var(--primary); background: var(--primary-dark); color: var(--primary); white-space: nowrap; display: flex; align-items: center; gap: 0.25rem;" @click="addQuestion">
          + Вопрос
        </button>
      </div>
    </div>

    <!-- Search & Filter Panel -->
    <div class="panel" style="margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.75rem; padding: 1.25rem;">
      <h3 style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.15rem;">
        Поиск и фильтрация
      </h3>

      <!-- Select filters row -->
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <!-- Category -->
        <select
          class="select-control"
          style="flex: 1; min-width: 120px; padding: 0.5rem 0.75rem; font-size: 0.85rem;"
          v-model="filterCategory"
        >
          <option value="all">Все разделы</option>
          <option v-for="cat in modulesStore.categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
        
        <!-- Correctness -->
        <select
          class="select-control"
          style="flex: 1; min-width: 120px; padding: 0.5rem 0.75rem; font-size: 0.85rem;"
          v-model="filterCorrectness"
        >
          <option value="all">Все по правильности</option>
          <option value="correct">Изученные (Верно)</option>
          <option value="incorrect">Неизученные (С ошибками)</option>
          <option value="unanswered">Не отвеченные (Новые)</option>
        </select>
        
        <!-- Difficulty -->
        <select
          class="select-control"
          style="flex: 1; min-width: 120px; padding: 0.5rem 0.75rem; font-size: 0.85rem;"
          v-model="filterDifficulty"
        >
          <option value="all">Все по сложности</option>
          <option value="difficult">Сложные</option>
          <option value="normal">Обычные</option>
        </select>
        
        <!-- Sorting -->
        <select
          class="select-control"
          style="flex: 1; min-width: 120px; padding: 0.5rem 0.75rem; font-size: 0.85rem;"
          v-model="sortBy"
        >
          <option value="number_asc">По номеру ↑</option>
          <option value="number_desc">По номеру ↓</option>
          <option value="accuracy_asc">По точности ↑</option>
          <option value="accuracy_desc">По точности ↓</option>
          <option value="attempts_asc">По попыткам ↑</option>
          <option value="attempts_desc">По попыткам ↓</option>
          <option value="difficult_first">Сначала сложные</option>
          <option value="easy_first">Сначала простые</option>
          <option value="tags_asc">По тегам ↑</option>
          <option value="tags_desc">По тегам ↓</option>
        </select>
      </div>

      <!-- Collapsible Tag Filter Container -->
      <div v-if="allTags.size > 0" class="tag-filter-container" style="border-top: 1px solid var(--border-color); padding-top: 0.5rem; margin-top: 0.25rem;">
        <div 
          @click="tagFilterCollapsed = !tagFilterCollapsed" 
          style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;"
        >
          <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500; display: flex; align-items: center; gap: 0.25rem;">
            🏷️ Фильтр по тегам
            <span v-if="activeTagFilter" class="brand-badge" style="font-size: 0.7rem; padding: 0.05rem 0.3rem;">
              #{{ activeTagFilter }}
            </span>
          </span>
          <div style="color: var(--text-muted); transition: transform 0.2s;" :style="{ transform: tagFilterCollapsed ? '' : 'rotate(180deg)' }">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
        
        <div v-show="!tagFilterCollapsed" class="tag-filter-bar" style="margin-top: 0.5rem; border-top: none; padding-top: 0; margin-bottom: 0.25rem;">
          <span
            v-for="tag in allTags"
            :key="tag"
            class="tag-badge"
            :class="['tag-' + tag, { active: activeTagFilter === tag }]"
            @click="toggleTagFilter(tag)"
          >
            {{ tag }}
          </span>
        </div>
      </div>

      <!-- Search input container with reset button -->
      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; width: 100%;">
        <div style="position: relative; flex-grow: 1; display: flex; align-items: center;">
          <input
            type="text"
            class="search-input"
            placeholder="Поиск по вопросам и тегам..."
            style="width: 100%; padding-right: 2.5rem;"
            v-model="searchQuery"
          />
          <button
            v-if="searchQuery"
            style="position: absolute; right: 0.75rem; background: transparent; border: none; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.25rem; transition: color 0.2s;"
            title="Очистить поиск"
            @click="searchQuery = ''"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Questions list -->
    <div id="viewer-questions-list" class="stats-list" style="max-height: none; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-bottom: 1rem;">
      <div v-if="filteredQuestions.length === 0" style="text-align:center; padding:1.5rem; color:var(--text-muted);">
        Ничего не найдено
      </div>
      
      <!-- Collapsible Card Item -->
      <div
        v-for="q in filteredQuestions"
        :key="q.id"
        class="viewer-card"
        :class="{
          selected: isSelectionMode && selectedQuestionIds.has(q.id),
          expanded: expandedQuestionIds.has(q.id)
        }"
        @click="toggleCardExpand(q, $event)"
      >
        <!-- Header -->
        <div class="viewer-card-header">
          <div class="viewer-card-title-row" style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
            <div style="display: flex; align-items: flex-start; gap: 0.6rem; flex-grow: 1; min-width: 0;">
              <!-- Select Checkbox -->
              <input
                type="checkbox"
                class="viewer-select-checkbox"
                v-if="isSelectionMode"
                :checked="selectedQuestionIds.has(q.id)"
                @change.stop="toggleQuestionSelect(q.id, $event.target.checked)"
              />
              
              <h3 class="viewer-card-title">{{ q.number }}. {{ q.title }}</h3>
            </div>

            <div class="viewer-card-meta-right" style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; margin-left: 0.5rem;">
              <!-- Accuracy tag -->
              <span class="badge-stat" :class="getAccuracyClass(q.id)">
                {{ getAccuracyLabel(q.id) }}
              </span>
              
              <!-- Difficult Star -->
              <button
                class="viewer-star-btn"
                :class="{ active: isQuestionDifficult(q) }"
                :title="isQuestionDifficult(q) ? 'Сложный вопрос!' : 'Пометить сложным'"
                @click.stop="toggleDifficult(q)"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  :fill="isQuestionDifficult(q) ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </button>
              
              <!-- Edit Question -->
              <button
                class="viewer-star-btn viewer-edit-btn"
                title="Редактировать вопрос / ответ"
                @click.stop="editQuestion(q)"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              
              <!-- Chevron expand -->
              <div class="viewer-card-toggle-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <!-- Bottom Row: Tags & Category -->
          <div class="viewer-card-bottom-row" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.35rem; border-top: 1px dashed rgba(255, 255, 255, 0.05); padding-top: 0.35rem;">
            <!-- Tags inside bottom header -->
            <div v-if="q.tags && q.tags.length > 0" class="tags-row" style="margin-top: 0;">
              <span
                v-for="tag in q.tags"
                :key="tag"
                class="tag-badge"
                :class="['tag-' + tag, { active: activeTagFilter === tag }]"
                @click.stop="toggleTagFilter(tag)"
              >
                {{ tag }}
              </span>
            </div>
            <div v-else></div>

            <span class="brand-badge" style="font-size: 0.75rem; background: rgba(255, 255, 255, 0.04); color: var(--text-muted); border-color: rgba(255,255,255,0.08);">
              {{ q.category }}
            </span>
          </div>
        </div>

        <!-- Collapsible Content Body -->
        <div class="viewer-card-body">
          <div class="viewer-card-body-section" v-if="expandedQuestionIds.has(q.id)">
            <!-- Short Answer -->
            <div>
              <h4 style="font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; margin-bottom: 0.5rem;">
                Краткий ответ / Код
              </h4>
              <div class="answer-text markdown-body" v-html="renderQuestionShortAnswer(q)"></div>
            </div>
            
            <!-- Detailed Answer -->
            <div style="margin-top: 0.75rem;">
              <h4 style="font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
                <span>Подробное пояснение</span>
                <button
                  v-if="progressStore.aiEnabled"
                  type="button"
                  class="btn-action"
                  style="font-size: 0.7rem; padding: 0.2rem 0.5rem; border: 1px solid var(--primary); background: transparent; color: var(--primary); border-radius: 4px; height: auto;"
                  :disabled="regeneratingDetailedIds.has(q.id)"
                  @click.stop="handleMakeDetailed(q)"
                >
                  {{ regeneratingDetailedIds.has(q.id) ? 'Генерирую...' : 'Сделать подробнее' }}
                </button>
              </h4>
              <div v-if="q.detailedAnswer" class="answer-text markdown-body" v-html="renderQuestionDetailedAnswer(q)"></div>
              <div v-else style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">
                Пояснение отсутствует. Нажмите «Сделать подробнее», чтобы сгенерировать его.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Selection Mode Panel -->
    <div id="viewer-selection-panel" class="selection-panel" v-if="isSelectionMode" style="display: flex;">
      <div class="selection-panel-content">
        <span id="viewer-selection-count">Выбрано вопросов: {{ selectedQuestionIds.size }}</span>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
          <!-- Select filtered questions -->
          <button class="btn-action" style="border-radius: var(--radius-sm); border: 1px solid var(--primary); background: var(--primary-dark); color: var(--primary); font-size: 0.82rem; padding: 0.5rem 0.85rem; white-space: nowrap;" @click="selectAllFiltered">
            + Все фильтры
          </button>
          
          <!-- Clear selection -->
          <button class="btn-action" style="border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-muted); font-size: 0.82rem; padding: 0.5rem 0.85rem;" @click="clearSelection">
            Очистить
          </button>
          
          <!-- Cancel selection mode -->
          <button class="btn-action" style="border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main); font-size: 0.85rem; padding: 0.5rem 1rem;" @click="cancelSelectionMode">
            Отмена
          </button>
          
          <!-- Save list -->
          <button class="btn-primary" style="width: auto; border-radius: var(--radius-sm); font-size: 0.85rem; padding: 0.5rem 1rem;" @click="createCustomList">
            Создать список
          </button>
        </div>
      </div>
    </div>
    </div>
  </section>
</template>

<script>
import { computed, ref, reactive, watch, nextTick } from 'vue';
import { useModulesStore } from '../stores/modules';
import { useProgressStore } from '../stores/progress';
import { useModal } from '../composables/useModal';
import { marked } from 'marked';
import Prism from 'prismjs';
import { makeDetailed } from '../utils/ai';

export default {
  name: 'ModuleViewer',
  setup(props, { emit }) {
    const modulesStore = useModulesStore();
    const progressStore = useProgressStore();
    const { showAlert, showPrompt, showEditQuestion } = useModal();

    const searchQuery = ref('');
    const filterCategory = ref('all');
    const filterCorrectness = ref('all');
    const filterDifficulty = ref('all');
    const sortBy = ref('number_asc');
    const activeTagFilter = ref(null);
    const tagFilterCollapsed = ref(true);

    watch(activeTagFilter, (newVal) => {
      if (newVal) {
        tagFilterCollapsed.value = false;
      }
    });

    const isSelectionMode = ref(false);
    const selectedQuestionIds = ref(new Set());
    const expandedQuestionIds = ref(new Set());
    const isAllExpanded = ref(true);
    const regeneratingDetailedIds = ref(new Set());

    // Filter tags cloud
    const allTags = computed(() => {
      const tags = new Set();
      modulesStore.questions.forEach(q => {
        if (q.tags) {
          q.tags.forEach(t => tags.add(t));
        }
      });
      return tags;
    });

    // Toggle selection mode styling classes
    const selectionModeBtnStyle = computed(() => {
      if (isSelectionMode.value) {
        return {
          borderColor: 'var(--error)',
          background: 'var(--error-dark)',
          color: 'var(--error)'
        };
      }
      return {
        borderColor: 'var(--warning)',
        background: 'var(--warning-dark)',
        color: 'var(--warning)',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem'
      };
    });

    const goBack = () => {
      progressStore.currentScreen = 'dashboard';
    };

    const toggleAllExpanded = () => {
      isAllExpanded.value = !isAllExpanded.value;
      if (isAllExpanded.value) {
        // Expand all visible
        filteredQuestions.value.forEach(q => {
          expandedQuestionIds.value.add(q.id);
        });
      } else {
        expandedQuestionIds.value.clear();
      }
      
      nextTick(() => {
        Prism.highlightAll();
      });
    };

    const toggleSelectionMode = () => {
      isSelectionMode.value = !isSelectionMode.value;
      if (!isSelectionMode.value) {
        selectedQuestionIds.value.clear();
      }
    };

    const toggleTagFilter = (tag) => {
      if (activeTagFilter.value === tag) {
        activeTagFilter.value = null;
      } else {
        activeTagFilter.value = tag;
      }
    };

    const isQuestionDifficult = (q) => {
      const qStat = progressStore.stats[q.id] || {};
      return qStat.isDifficult !== undefined ? qStat.isDifficult : q.isStarred;
    };

    const toggleDifficult = (q) => {
      progressStore.toggleDifficult(q.id, q.isStarred);
    };

    // Accuracy badges helpers
    const getAccuracyClass = (qId) => {
      const qStat = progressStore.stats[qId] || {};
      const tot = (qStat.correctCount || 0) + (qStat.incorrectCount || 0);
      if (tot === 0) return 'neutral';
      const acc = Math.round((qStat.correctCount / tot) * 100);
      if (acc >= 70) return 'correct';
      if (acc >= 40) return 'warning';
      return 'incorrect';
    };

    const getAccuracyLabel = (qId) => {
      const qStat = progressStore.stats[qId] || {};
      const tot = (qStat.correctCount || 0) + (qStat.incorrectCount || 0);
      if (tot === 0) return 'Нет попыток';
      const acc = Math.round((qStat.correctCount / tot) * 100);
      return `${acc}% (${qStat.correctCount}/${tot})`;
    };

    // Marked rendering wrappers
    const renderQuestionShortAnswer = (q) => {
      return q.shortAnswer ? marked.parse(q.shortAnswer) : '<em>Отсутствует</em>';
    };

    const renderQuestionDetailedAnswer = (q) => {
      return q.detailedAnswer ? marked.parse(q.detailedAnswer) : '';
    };

    // Expand collapse individual
    const toggleCardExpand = (q, event) => {
      // Avoid expanding when interacting with actions
      if (
        event.target.closest('button') ||
        event.target.closest('a') ||
        event.target.closest('textarea') ||
        event.target.closest('.viewer-select-checkbox')
      ) {
        return;
      }

      if (isSelectionMode.value) {
        toggleQuestionSelect(q.id, !selectedQuestionIds.value.has(q.id));
        return;
      }

      if (expandedQuestionIds.value.has(q.id)) {
        expandedQuestionIds.value.delete(q.id);
      } else {
        expandedQuestionIds.value.add(q.id);
        nextTick(() => {
          Prism.highlightAll();
        });
      }
    };

    const toggleQuestionSelect = (qId, checked) => {
      if (checked) {
        selectedQuestionIds.value.add(qId);
      } else {
        selectedQuestionIds.value.delete(qId);
      }
    };

    const selectAllFiltered = () => {
      filteredQuestions.value.forEach(q => {
        selectedQuestionIds.value.add(q.id);
      });
    };

    const clearSelection = () => {
      selectedQuestionIds.value.clear();
    };

    const cancelSelectionMode = () => {
      isSelectionMode.value = false;
      selectedQuestionIds.value.clear();
    };

    // Creating lists
    const createCustomList = async () => {
      if (selectedQuestionIds.value.size === 0) {
        showAlert({
          message: 'Пожалуйста, выберите хотя бы один вопрос.'
        });
        return;
      }

      const defaultListName = `Набор: ${modulesStore.activeModule.name} (${selectedQuestionIds.value.size} вопр.)`;
      
      const listName = await showPrompt({
        title: 'Новый список',
        message: 'Введите название для нового списка вопросов:',
        defaultValue: defaultListName
      });

      if (listName === null || listName === undefined) {
        return;
      }

      const name = listName.trim() || defaultListName;
      
      try {
        progressStore.createCustomList(
          name,
          modulesStore.activeModule.id,
          modulesStore.activeModule.name,
          Array.from(selectedQuestionIds.value)
        );

        isSelectionMode.value = false;
        selectedQuestionIds.value.clear();

        showAlert({
          title: 'Успех',
          message: `Набор вопросов "${name}" успешно создан!`
        });

        progressStore.currentScreen = 'lists';
      } catch (e) {
        showAlert({
          message: 'Не удалось сохранить список: ' + e.message
        });
      }
    };

    // Filter questions list
    const filteredQuestions = computed(() => {
      const query = searchQuery.value.toLowerCase().trim();
      const catFilter = filterCategory.value;
      const corrFilter = filterCorrectness.value;
      const diffFilter = filterDifficulty.value;
      const sortVal = sortBy.value;
      const tagVal = activeTagFilter.value;
      const stats = progressStore.stats;

      let list = modulesStore.questions.filter(q => {
        if (!progressStore.isQueryMatch(q, searchQuery.value)) return false;

        if (tagVal && (!q.tags || !q.tags.includes(tagVal))) return false;

        if (catFilter !== 'all' && q.category !== catFilter) return false;

        const qStat = stats[q.id] || { correctCount: 0, incorrectCount: 0 };
        const hasCorrect = qStat.correctCount > 0;
        const hasIncorrect = qStat.incorrectCount > 0;
        const isUnanswered = qStat.correctCount === 0 && qStat.incorrectCount === 0;

        if (corrFilter === 'correct' && !hasCorrect) return false;
        if (corrFilter === 'incorrect' && !hasIncorrect) return false;
        if (corrFilter === 'unanswered' && !isUnanswered) return false;

        const isDiff = qStat.isDifficult !== undefined ? qStat.isDifficult : q.isStarred;
        if (diffFilter === 'difficult' && !isDiff) return false;
        if (diffFilter === 'normal' && isDiff) return false;

        return true;
      });

      // Sorting
      return list.sort((a, b) => {
        const statA = stats[a.id] || { correctCount: 0, incorrectCount: 0 };
        const statB = stats[b.id] || { correctCount: 0, incorrectCount: 0 };

        const totalA = statA.correctCount + statA.incorrectCount;
        const totalB = statB.correctCount + statB.incorrectCount;
        const accA = totalA > 0 ? (statA.correctCount / totalA) : 0;
        const accB = totalB > 0 ? (statB.correctCount / totalB) : 0;

        const isDiffA = (statA.isDifficult !== undefined ? statA.isDifficult : a.isStarred) ? 1 : 0;
        const isDiffB = (statB.isDifficult !== undefined ? statB.isDifficult : b.isStarred) ? 1 : 0;

        switch (sortVal) {
          case 'number_asc':
            return a.number - b.number;
          case 'number_desc':
            return b.number - a.number;
          case 'accuracy_asc':
            if (accA !== accB) return accA - accB;
            return a.number - b.number;
          case 'accuracy_desc':
            if (accA !== accB) return accB - accA;
            return a.number - b.number;
          case 'attempts_asc':
            if (totalA !== totalB) return totalA - totalB;
            return a.number - b.number;
          case 'attempts_desc':
            if (totalA !== totalB) return totalB - totalA;
            return a.number - b.number;
          case 'difficult_first':
            if (isDiffA !== isDiffB) return isDiffB - isDiffA;
            return a.number - b.number;
          case 'easy_first':
            if (isDiffA !== isDiffB) return isDiffA - isDiffB;
            return a.number - b.number;
          case 'tags_asc':
            const tagsStrA_asc = (a.tags && a.tags.length > 0) ? a.tags.join(', ') : '';
            const tagsStrB_asc = (b.tags && b.tags.length > 0) ? b.tags.join(', ') : '';
            if (tagsStrA_asc !== tagsStrB_asc) return tagsStrA_asc.localeCompare(tagsStrB_asc);
            return a.number - b.number;
          case 'tags_desc':
            const tagsStrA_desc = (a.tags && a.tags.length > 0) ? a.tags.join(', ') : '';
            const tagsStrB_desc = (b.tags && b.tags.length > 0) ? b.tags.join(', ') : '';
            if (tagsStrA_desc !== tagsStrB_desc) return tagsStrB_desc.localeCompare(tagsStrA_desc);
            return a.number - b.number;
          default:
            return a.number - b.number;
        }
      });
    });

    // Export module to markdown
    const exportMarkdown = () => {
      if (!modulesStore.activeModule) return;
      try {
        const mdText = modulesStore.serializeQuestionsToMarkdown(
          modulesStore.questions,
          modulesStore.activeModule.name
        );
        const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeName = modulesStore.activeModule.name.replace(/[^a-z0-9а-яё_-]/gi, '_');
        a.download = `${safeName}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        showAlert({
          message: 'Не удалось экспортировать файл: ' + e.message
        });
      }
    };

    // Add / Edit Question Modals
    const addQuestion = async () => {
      const fields = await showEditQuestion({
        question: { isNew: true }
      });

      if (fields) {
        modulesStore.addQuestionToModule(modulesStore.activeModule.id, fields);
        
        // Expand newly added questions automatically
        nextTick(() => {
          Prism.highlightAll();
        });
        
        showAlert({
          title: 'Успех',
          message: 'Новый вопрос успешно добавлен!'
        });
      }
    };

    const editQuestion = async (q) => {
      const fields = await showEditQuestion({
        question: q
      });

      if (fields) {
        modulesStore.editQuestionInModule(modulesStore.activeModule.id, q.id, fields);
        
        nextTick(() => {
          Prism.highlightAll();
        });
        
        showAlert({
          title: 'Успех',
          message: 'Вопрос успешно сохранен!'
        });
      }
    };

    const handleMakeDetailed = async (q) => {
      regeneratingDetailedIds.value.add(q.id);
      try {
        const detailedText = await makeDetailed(q, {
          model: progressStore.aiModel,
          instructions: progressStore.aiInstructions.makeDetailed
        });
        
        modulesStore.editQuestionInModule(modulesStore.activeModule.id, q.id, {
          detailedAnswer: detailedText
        });
        
        nextTick(() => {
          Prism.highlightAll();
        });
        
        showAlert({
          title: 'Успех',
          message: 'Подробное пояснение успешно сгенерировано!'
        });
      } catch (err) {
        showAlert({
          message: 'Не удалось сгенерировать подробное пояснение: ' + err.message
        });
      } finally {
        regeneratingDetailedIds.value.delete(q.id);
      }
    };

    // Synchronize expanded state list when visible list changes
    watch(filteredQuestions, (newVal) => {
      if (isAllExpanded.value) {
        newVal.forEach(q => {
          expandedQuestionIds.value.add(q.id);
        });
        nextTick(() => {
          Prism.highlightAll();
        });
      }
    }, { immediate: true });

    return {
      modulesStore,
      progressStore,
      searchQuery,
      filterCategory,
      filterCorrectness,
      filterDifficulty,
      sortBy,
      activeTagFilter,
      tagFilterCollapsed,
      isSelectionMode,
      selectedQuestionIds,
      expandedQuestionIds,
      isAllExpanded,
      allTags,
      selectionModeBtnStyle,
      goBack,
      toggleAllExpanded,
      toggleSelectionMode,
      toggleTagFilter,
      isQuestionDifficult,
      toggleDifficult,
      getAccuracyClass,
      getAccuracyLabel,
      renderQuestionShortAnswer,
      renderQuestionDetailedAnswer,
      toggleCardExpand,
      toggleQuestionSelect,
      selectAllFiltered,
      clearSelection,
      cancelSelectionMode,
      createCustomList,
      filteredQuestions,
      exportMarkdown,
      addQuestion,
      editQuestion,
      regeneratingDetailedIds,
      handleMakeDetailed
    };
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}

/* Tag filter bar */
.tag-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.5rem 0;
  border-top: 1px solid var(--border-color);
  margin-top: 0.25rem;
  animation: fadeIn 0.2s ease;
}

/* Viewer card items */
.viewer-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  transition: var(--transition);
  cursor: pointer;
}

.viewer-card:hover {
  border-color: var(--border-hover);
  background: rgba(255, 255, 255, 0.03);
}

.viewer-card.selected {
  border-color: var(--primary);
  background: rgba(138, 180, 248, 0.05);
}

.viewer-card-header {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
  width: 100%;
}

.viewer-card-title-row {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  width: 100%;
}

.viewer-card-title {
  font-size: 0.95rem;
  font-weight: 500;
  color: #ffffff;
  line-height: 1.4;
  flex-grow: 1;
}

.viewer-card-meta {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.viewer-card-meta-right {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.viewer-card-toggle-icon {
  color: var(--text-muted);
  transition: transform 0.2s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.viewer-card.expanded .viewer-card-toggle-icon {
  transform: rotate(180deg);
}

.viewer-card-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  padding-top: 0;
}

.viewer-card.expanded .viewer-card-body {
  max-height: 2000px;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  margin-top: 0.75rem;
}

.viewer-card-body-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Star / edit button inside viewer card */
.viewer-star-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: var(--transition);
  outline: none;
}

.viewer-star-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--warning-hover);
}

.viewer-star-btn.active {
  color: var(--warning);
}

.viewer-edit-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--primary-hover) !important;
}

/* Viewer checkbox */
.viewer-select-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--warning);
  margin-right: 0.75rem;
  flex-shrink: 0;
  display: none;
}

.select-mode-active .viewer-select-checkbox {
  display: inline-block;
}

.select-mode-active .viewer-card {
  border-color: rgba(253, 214, 99, 0.2);
}

.select-mode-active .viewer-card:hover {
  border-color: var(--warning);
  background: rgba(253, 214, 99, 0.02);
}

.select-mode-active .viewer-card.selected {
  border-color: var(--warning);
  background: rgba(253, 214, 99, 0.06);
}

.select-mode-active .viewer-card.selected:hover {
  background: rgba(253, 214, 99, 0.08);
}

/* Bottom sticky selection panel */
.selection-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(30, 31, 32, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
  z-index: 100;
  display: flex;
  justify-content: center;
  animation: slideUp 0.25s ease-out;
}

.selection-panel-content {
  width: 100%;
  max-width: 700px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

#viewer-selection-count {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--warning);
}

@media (max-width: 480px) {
  .selection-panel-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .selection-panel-content > div {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

