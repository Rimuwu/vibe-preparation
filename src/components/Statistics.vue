<template>
  <section id="screen-stats" class="screen active">
    <!-- Public profile loading state -->
    <div v-if="progressStore.isSyncing && !progressStore.viewingProfileData" class="panel" style="text-align: center; padding: 3rem; color: var(--text-muted); margin: auto;">
      <p>Загрузка данных профиля...</p>
    </div>

    <div v-else-if="modulesStore.activeModule" style="display:contents">
      <!-- Inspect Mode Banner -->
      <div v-if="progressStore.viewingProfileData" class="panel inspect-banner" style="background: rgba(138, 180, 248, 0.08); border-color: rgba(138, 180, 248, 0.3); display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding: 1rem 1.25rem; border-radius: var(--radius-md); border-width: 1px; border-style: solid;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.5rem;">👤</span>
          <div>
            <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Просмотр профиля</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #ffffff; margin-top: 0.15rem;">{{ progressStore.viewingProfileNickname }}</div>
          </div>
        </div>
        <button 
          class="btn-primary" 
          style="width: auto; padding: 0.5rem 1.25rem; font-size: 0.85rem; border-radius: var(--radius-sm); border: none; height: 38px; display: flex; align-items: center; justify-content: center;"
          @click="goBackFromProfile"
        >
          Вернуться
        </button>
      </div>

      <div class="panel">
      <!-- Stats Header -->
      <div class="stats-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0;">Общая статистика</h2>
        <div v-if="!progressStore.viewingProfileData" style="display: flex; gap: 0.5rem; align-items: center;">
          <!-- Share -->
          <button
            id="btn-share-stats"
            class="btn-icon"
            style="color: var(--primary); border-color: rgba(138, 180, 248, 0.2);"
            title="Поделиться прогрессом"
            @click="generateShareCard"
          >
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
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16 6 12 2 8 6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </button>
          
          <!-- Reset -->
          <button
            id="btn-reset-stats"
            class="btn-icon"
            style="color: var(--error); border-color: rgba(239, 68, 68, 0.2);"
            title="Сбросить прогресс"
            @click="resetStats"
          >
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
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="num">{{ globalStats.accuracy }}%</div>
          <div class="label">Точность</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ globalStats.answeredCount }}/{{ globalStats.totalQuestions }}</div>
          <div class="label">Изучено</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ themesStats.averagePct }}%</div>
          <div class="label">Изучено тем</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ globalStats.totalDifficult }}</div>
          <div class="label">Сложные</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ globalStats.totalAttempts }}</div>
          <div class="label">Ответы</div>
        </div>
        <div v-if="allTags.size > 0" class="stat-card">
          <div class="num">{{ learnedTagsCount }}/{{ allTags.size }}</div>
          <div class="label">Изучено тегов</div>
        </div>
        <div class="stat-card">
          <div class="num">{{ streakCount }}🔥</div>
          <div class="label">Дней подряд</div>
        </div>
      </div>
      
      <div style="margin-top: 1.25rem; font-size: 0.85rem; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
        <span>Последняя активность по теме:</span>
        <span style="font-weight: 500; color: #ffffff;">{{ lastActiveDate }}</span>
      </div>
    </div>

    <!-- Rating Panel (Test Mode Stats for Leaderboard) -->
    <div class="panel rating-panel">
      <h3 style="font-size: 0.95rem; font-weight: 600; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; color: #ffffff;">
        🏆 Рейтинговые данные
        <span style="font-size: 0.75rem; font-weight: 400; color: var(--text-muted); margin-left: auto;">учитывается в лидерборде</span>
      </h3>

      <div v-if="testStats.totalAttempts === 0" style="text-align: center; padding: 1.25rem 0; color: var(--text-muted); font-size: 0.875rem;">
        Нет данных тестового режима — пройдите хотя бы один вопрос в режиме «Тест»
      </div>

      <div v-else>
        <!-- Rating Stats Grid -->
        <div class="rating-grid-wrapper" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1rem;">
          <div class="rating-stat-card rank-card" :class="['rank-' + userRank]">
            <div class="rating-num">
              <span v-if="userRank === 1">🥇 1</span>
              <span v-else-if="userRank === 2">🥈 2</span>
              <span v-else-if="userRank === 3">🥉 3</span>
              <span v-else-if="userRank">{{ userRank }}</span>
              <span v-else>—</span>
            </div>
            <div class="rating-label">Место</div>
          </div>
          <div class="rating-stat-card">
            <div class="rating-num">{{ testStats.accuracy }}%</div>
            <div class="rating-label">Точность</div>
          </div>
          <div class="rating-stat-card">
            <div class="rating-num">{{ testStats.answeredCount }}<span style="font-size: 0.7em; color: var(--text-muted);">/{{ testStats.totalQuestions }}</span></div>
            <div class="rating-label">Пройдено</div>
          </div>
          <div class="rating-stat-card">
            <div class="rating-num">{{ testStats.totalAttempts }}</div>
            <div class="rating-label">Ответов</div>
          </div>
        </div>

        <!-- Accuracy progress bar -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.4rem; color: var(--text-muted);">
            <span>Точность в тестовом режиме</span>
            <span style="color: #ffffff; font-weight: 600;">{{ testStats.accuracy }}%</span>
          </div>
          <div style="height: 8px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-sm); overflow: hidden;">
            <div
              style="height: 100%; border-radius: var(--radius-sm); transition: width 0.8s cubic-bezier(0.4,0,0.2,1);"
              :style="{
                width: testStats.accuracy + '%',
                background: testStats.accuracy >= 80
                  ? 'linear-gradient(90deg, #81c995 0%, #a8dab5 100%)'
                  : testStats.accuracy >= 50
                    ? 'linear-gradient(90deg, #fbbc04 0%, #fdd663 100%)'
                    : 'linear-gradient(90deg, #f28b82 0%, #fcb6b0 100%)'
              }"
            ></div>
          </div>
        </div>

        <!-- Share Rating Card Button -->
        <button
          class="btn-action"
          style="width: 100%; margin-top: 1.25rem; border-radius: var(--radius-sm); font-size: 0.85rem; padding: 0.65rem 1.25rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border: 1px solid rgba(138, 180, 248, 0.25); background: rgba(138, 180, 248, 0.06); color: #8ab4f8; font-weight: 500;"
          @click="generateRatingShareCard"
        >
          <span>🏆</span> Поделиться карточкой рейтинга
        </button>
      </div>
    </div>

    <!-- Overall Study Progress Panel -->
    <div class="panel">
      <h3 style="font-size: 0.95rem; font-weight: 600; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; color: #ffffff;">
        🎯 Общий прогресс обучения
      </h3>
      <div style="display: flex; flex-direction: column; gap: 1.25rem;">
        <!-- Themes Progress -->
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; align-items: center;">
            <span style="color: var(--text-muted); font-weight: 500;">Изучение тем</span>
            <span style="color: #ffffff; font-weight: 600;">
              {{ themesStats.averagePct }}%
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400; margin-left: 0.25rem;">
                ({{ themesStats.completedCount }} из {{ themesStats.totalCount }})
              </span>
            </span>
          </div>
          <div style="height: 10px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-sm); overflow: hidden; position: relative;">
            <div 
              style="height: 100%; background: linear-gradient(90deg, #81c995 0%, #a8dab5 100%); border-radius: var(--radius-sm); transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"
              :style="{ width: themesStats.averagePct + '%' }"
            ></div>
          </div>
        </div>

        <!-- Tags Progress -->
        <div v-if="allTags.size > 0">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem; align-items: center;">
            <span style="color: var(--text-muted); font-weight: 500;">Изучение тегов</span>
            <span style="color: #ffffff; font-weight: 600;">
              {{ Math.round((learnedTagsCount / allTags.size) * 100) }}%
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 400; margin-left: 0.25rem;">
                ({{ learnedTagsCount }} из {{ allTags.size }})
              </span>
            </span>
          </div>
          <div style="height: 10px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: var(--radius-sm); overflow: hidden; position: relative;">
            <div 
              style="height: 100%; background: linear-gradient(90deg, #8ab4f8 0%, #c2dbff 100%); border-radius: var(--radius-sm); transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);"
              :style="{ width: (allTags.size > 0 ? Math.round((learnedTagsCount / allTags.size) * 100) : 0) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity Chart Panel -->
    <div class="panel">
      <h3 style="font-size: 0.95rem; font-weight: 600; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem; color: #ffffff;">
        📊 Активность по дням (за неделю)
      </h3>
      <div style="position: relative; height: 260px; width: 100%;">
        <canvas id="activity-chart" ref="activityChartCanvas"></canvas>
      </div>
    </div>

    <!-- Sync Shortcut Link Card -->
    <div v-if="!progressStore.viewingProfileData" class="panel settings-link-panel">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem;">
        <div>
          <h3 style="font-size:0.95rem; font-weight:600; margin-bottom:0.2rem;">Синхронизация и резервная копия</h3>
          <p style="font-size:0.8rem; color:var(--text-muted); margin:0;">
            Управляйте синхронизацией и экспортом прогресса в настройках
          </p>
        </div>
        <button
          class="btn-action"
          style="padding:0.5rem 1rem; font-size:0.82rem; white-space:nowrap; border:1px solid var(--border-color); background:transparent; color:var(--text-main); border-radius:var(--radius-sm); display:flex; align-items:center; gap:0.35rem; flex-shrink:0;"
          @click="goToSettings"
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
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            ></path>
          </svg>
          Настройки
        </button>
      </div>
    </div>

    <!-- Category Progress Breakdown Panel -->
    <div class="panel" id="stats-categories-panel">
      <div class="breakdown-panel-header">
        <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">📂 Прогресс по разделам</h3>
        <button
          class="btn-collapse-breakdown"
          title="Свернуть/развернуть"
          @click="categoriesCollapsed = !categoriesCollapsed"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="collapse-icon"
            :style="{ transform: categoriesCollapsed ? 'rotate(180deg)' : '' }"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>
      
      <div
        id="stats-categories-breakdown"
        class="breakdown-collapsible"
        :class="{ collapsed: categoriesCollapsed }"
      >
        <div v-for="cat in categoryBreakdown" :key="cat.name" class="breakdown-item">
          <div class="breakdown-label">
            <span class="breakdown-name">{{ cat.name }}</span>
            <span class="breakdown-stats">{{ cat.answered }}/{{ cat.total }} изучено</span>
          </div>
          <div class="breakdown-bars">
            <div class="breakdown-bar-row">
              <span class="breakdown-bar-label">Изучение</span>
              <div class="breakdown-bar-track">
                <div class="breakdown-bar-fill study" :style="{ width: cat.studyPct + '%' }"></div>
              </div>
              <span class="breakdown-bar-pct">{{ cat.studyPct }}%</span>
            </div>
            <div class="breakdown-bar-row">
              <span class="breakdown-bar-label">Точность</span>
              <div class="breakdown-bar-track">
                <div
                  class="breakdown-bar-fill"
                  :class="getAccuracyClass(cat.accuracyPct)"
                  :style="{ width: cat.accuracyPct + '%' }"
                ></div>
              </div>
              <span class="breakdown-bar-pct">{{ cat.accuracyPct }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tag Progress Breakdown Panel -->
    <div class="panel" id="stats-tags-panel" v-if="allTags.size > 0">
      <div class="breakdown-panel-header">
        <h3 style="font-size: 1rem; font-weight: 600; margin: 0;">🏷️ Прогресс по тегам</h3>
        <button
          class="btn-collapse-breakdown"
          title="Свернуть/развернуть"
          @click="tagsCollapsed = !tagsCollapsed"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="collapse-icon"
            :style="{ transform: tagsCollapsed ? 'rotate(180deg)' : '' }"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
      </div>
      
      <div
        id="stats-tags-breakdown"
        class="breakdown-collapsible"
        :class="{ collapsed: tagsCollapsed }"
      >
        <div v-for="tag in tagBreakdown" :key="tag.name" class="breakdown-item">
          <div class="breakdown-label">
            <span class="breakdown-name">
              <span class="tag-prefix">#</span>{{ tag.name }}
            </span>
            <span class="breakdown-stats">{{ tag.answered }}/{{ tag.total }} изучено</span>
          </div>
          <div class="breakdown-bars">
            <div class="breakdown-bar-row">
              <span class="breakdown-bar-label">Изучение</span>
              <div class="breakdown-bar-track">
                <div class="breakdown-bar-fill study" :style="{ width: tag.studyPct + '%' }"></div>
              </div>
              <span class="breakdown-bar-pct">{{ tag.studyPct }}%</span>
            </div>
            <div class="breakdown-bar-row">
              <span class="breakdown-bar-label">Точность</span>
              <div class="breakdown-bar-track">
                <div
                  class="breakdown-bar-fill"
                  :class="getAccuracyClass(tag.accuracyPct)"
                  :style="{ width: tag.accuracyPct + '%' }"
                ></div>
              </div>
              <span class="breakdown-bar-pct">{{ tag.accuracyPct }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Questions list table panel -->
    <div v-if="!progressStore.viewingProfileData" class="panel" style="flex-grow: 1;">
      <h3 style="font-size: 1rem; margin-bottom: 0.75rem; font-weight: 600;">Детализация по вопросам</h3>

      <!-- Search query -->
      <div class="search-box">
        <input
          type="text"
          class="search-input"
          placeholder="Поиск по вопросам и тегам..."
          v-model="searchQuery"
        />
      </div>

      <!-- Filters Row -->
      <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
        <!-- Categories -->
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
          <option value="correct">Верно отвеченные</option>
          <option value="incorrect">Неверно отвеченные</option>
          <option value="unanswered">Не отвеченные</option>
        </select>
        
        <!-- Difficulty -->
        <select
          class="select-control"
          style="flex: 1; min-width: 120px; padding: 0.5rem 0.75rem; font-size: 0.85rem;"
          v-model="filterDifficulty"
        >
          <option value="all">Все по сложности</option>
          <option value="difficult">Сложные</option>
          <option value="normal">Не сложные</option>
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
        </select>
      </div>

      <!-- Tag chip filtering cloud -->
      <div v-if="allTags.size > 0" class="tag-filter-bar">
        <span
          v-for="tag in allTags"
          :key="tag"
          class="tag-badge"
          :class="{ active: activeTagFilter === tag }"
          @click="toggleTagFilter(tag)"
        >
          {{ tag }}
        </span>
      </div>

      <!-- Questions List container -->
      <div id="stats-list" class="stats-list">
        <div v-if="filteredQuestions.length === 0" style="text-align:center; padding:1.5rem; color:var(--text-muted);">
          Ничего не найдено
        </div>
        
        <div
          v-for="q in filteredQuestions"
          :key="q.id"
          class="stats-row"
          :class="{ 'read-only': progressStore.viewingProfileData }"
          @click="startQuickSession(q)"
        >
          <div class="stats-row-info">
            <div class="stats-row-title" :title="q.title">
              {{ q.number }}. {{ q.title }}
            </div>
            <div class="stats-row-sub">
              {{ q.category }} • Ответы: {{ getQuestionTotal(q.id) }} 
              (Точность: {{ getQuestionAccuracy(q.id) }}%)
            </div>
            
            <div v-if="q.tags && q.tags.length > 0" class="tags-row">
              <span
                v-for="tag in q.tags"
                :key="tag"
                class="tag-badge"
                :class="{ active: activeTagFilter === tag }"
                @click.stop="toggleTagFilter(tag)"
              >
                {{ tag }}
              </span>
            </div>
          </div>
          
          <div class="stats-row-meta">
            <span v-if="targetStats[q.id]?.correctCount > 0" class="badge-stat correct">
              ✓ {{ targetStats[q.id].correctCount }}
            </span>
            <span v-if="targetStats[q.id]?.incorrectCount > 0" class="badge-stat incorrect">
              ✗ {{ targetStats[q.id].incorrectCount }}
            </span>
            <span v-if="isQuestionDifficult(q)" class="badge-stat difficult">
              ★ Сложный
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
    <div v-else class="panel" style="text-align: center; padding: 3rem; color: var(--text-muted); margin: auto;">
      <p>Пожалуйста, выберите тему на панели управления, чтобы просмотреть статистику.</p>
    </div>
  </section>
</template>

<script>
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProgressStore } from '../stores/progress';
import { useModulesStore } from '../stores/modules';
import { useModal } from '../composables/useModal';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: 'Statistics',
  setup(props, { emit }) {
    const progressStore = useProgressStore();
    const modulesStore = useModulesStore();
    const { showConfirm, showShareCard } = useModal();
    const route = useRoute();
    const router = useRouter();

    const goBackFromProfile = () => {
      progressStore.clearViewingProfileDataOnly();
      router.push({ name: 'leaderboard' });
    };

    const checkQueryUser = async () => {
      const userId = route.query.user;
      if (userId) {
        if (progressStore.viewingProfileData && progressStore.viewingProfileNickname && progressStore.viewingProfileData._id === userId) {
          return;
        }
        try {
          await progressStore.viewUserProfileStats(userId, 'Пользователь');
        } catch (e) {
          console.error('Failed to load user stats from query:', e);
          router.replace({ name: 'stats' });
        }
      } else {
        progressStore.clearViewingProfileDataOnly();
      }
    };

    watch(() => route.query.user, () => {
      checkQueryUser();
    }, { immediate: true });

    const targetStats = computed(() => {
      return progressStore.viewingProfileData ? (progressStore.viewingProfileData.stats || {}) : progressStore.stats;
    });

    const targetActivityLog = computed(() => {
      return progressStore.viewingProfileData ? (progressStore.viewingProfileData.activityLog || {}) : progressStore.activityLog;
    });

    const categoriesCollapsed = ref(false);
    const tagsCollapsed = ref(false);
    
    // Table filter states
    const searchQuery = ref('');
    const filterCategory = ref('all');
    const filterCorrectness = ref('all');
    const filterDifficulty = ref('all');
    const sortBy = ref('number_asc');
    const activeTagFilter = ref(null);

    // Global Statistics Calculations
    const globalStats = computed(() => {
      const g = progressStore.getGlobalStats(modulesStore.questions);
      return {
        accuracy: g.accuracy,
        answeredCount: g.answeredCount,
        totalQuestions: g.totalQuestions,
        totalDifficult: g.totalDifficult,
        totalAttempts: g.totalCorrect + g.totalIncorrect
      };
    });

    // Test-mode statistics (used for leaderboard rating)
    const testStats = computed(() => {
      const questions = modulesStore.questions;
      const stats = targetStats.value;
      let totalCorrect = 0;
      let totalIncorrect = 0;
      let answeredCount = 0;
      questions.forEach(q => {
        const qStat = stats[q.id] || {};
        const c = qStat.testCorrectCount || 0;
        const w = qStat.testIncorrectCount || 0;
        totalCorrect += c;
        totalIncorrect += w;
        if (c + w > 0) answeredCount++;
      });
      const totalAttempts = totalCorrect + totalIncorrect;
      const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
      return { totalCorrect, totalIncorrect, answeredCount, totalQuestions: questions.length, totalAttempts, accuracy };
    });

    const userRank = ref(null);
    const isLoadingRank = ref(false);

    const fetchUserRank = async () => {
      userRank.value = null;
      const activeMod = modulesStore.activeModule;
      if (!activeMod || activeMod.isCustom) return;

      isLoadingRank.value = true;
      try {
        const res = await fetch(`${progressStore.apiUrl}/api/leaderboard/${activeMod.id}`);
        if (res.ok) {
          const entries = await res.json();
          let match = null;
          if (progressStore.viewingProfileData) {
            const userId = route.query.user;
            match = entries.find(e => e.id === userId);
          } else {
            if (progressStore.nickname) {
              match = entries.find(e => e.nickname === progressStore.nickname);
            }
          }
          if (match) {
            userRank.value = match.rank;
          }
        }
      } catch (e) {
        console.error('Failed to fetch user rank:', e);
      } finally {
        isLoadingRank.value = false;
      }
    };

    watch(
      [
        () => modulesStore.activeModule,
        () => progressStore.viewingProfileData,
        () => route.query.user
      ],
      () => {
        fetchUserRank();
      }
    );

    const streakCount = computed(() => {
      return progressStore.getStreak();
    });

    const lastActiveDate = computed(() => {
      const activeModId = modulesStore.activeModule?.id;
      if (!activeModId || !targetActivityLog.value) return 'Никогда';
      
      const dates = Object.keys(targetActivityLog.value).filter(date => {
        const log = targetActivityLog.value[date];
        return log && log.modules && log.modules[activeModId] && log.modules[activeModId].total > 0;
      });
      
      if (dates.length === 0) return 'Никогда';
      
      dates.sort();
      const lastDateStr = dates[dates.length - 1]; // e.g. "2026-06-19"
      const [y, m, d] = lastDateStr.split('-');
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    });

    // Load and cache questions for all modules asynchronously
    const allModulesQuestions = ref({});
    const isLoadingQuestions = ref(true);

    const loadAllQuestions = async () => {
      isLoadingQuestions.value = true;
      const questionsMap = {};
      
      const loadPromises = modulesStore.modules.map(async (mod) => {
        try {
          if (modulesStore.activeModule && mod.id === modulesStore.activeModule.id) {
            questionsMap[mod.id] = modulesStore.questions;
          } else {
            questionsMap[mod.id] = await modulesStore.loadQuestionsForModule(mod);
          }
        } catch (e) {
          console.error(`Failed to load questions for module ${mod.id}:`, e);
          questionsMap[mod.id] = [];
        }
      });

      await Promise.all(loadPromises);
      allModulesQuestions.value = questionsMap;
      isLoadingQuestions.value = false;
    };

    // Watch for modules or active module's questions changes
    watch(() => modulesStore.modules, () => {
      loadAllQuestions();
    }, { immediate: true });

    watch(() => modulesStore.questions, (newVal) => {
      if (modulesStore.activeModule) {
        allModulesQuestions.value[modulesStore.activeModule.id] = newVal;
      }
    }, { deep: true });

    // Themes Study Stats
    const themesStats = computed(() => {
      let totalPctSum = 0;
      let completedCount = 0;
      const modules = modulesStore.modules;
      if (modules.length === 0) {
        return { averagePct: 0, completedCount: 0, totalCount: 0 };
      }

      modules.forEach(mod => {
        const qs = allModulesQuestions.value[mod.id] || [];
        if (qs.length === 0) return;
        let answered = 0;
        qs.forEach(q => {
          const qStat = targetStats.value[q.id] || {};
          if ((qStat.correctCount || 0) + (qStat.incorrectCount || 0) > 0) {
            answered++;
          }
        });
        const pct = (answered / qs.length) * 100;
        totalPctSum += pct;
        if (answered === qs.length) {
          completedCount++;
        }
      });

      const averagePct = Math.round(totalPctSum / modules.length);
      return {
        averagePct,
        completedCount,
        totalCount: modules.length
      };
    });

    // Chart.js rendering setup
    const activityChartCanvas = ref(null);
    let chartInstance = null;

    const renderActivityChart = () => {
      if (!activityChartCanvas.value) return;
      if (chartInstance) {
        chartInstance.destroy();
      }

      const labels = [];
      const totalData = [];
      const correctData = [];
      const incorrectData = [];

      const activeModId = modulesStore.activeModule?.id;

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('en-CA');
        const label = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        labels.push(label);

        const log = targetActivityLog.value?.[dateStr];
        if (log) {
          const modLog = log.modules?.[activeModId] || { total: 0, correct: 0, incorrect: 0 };
          totalData.push(modLog.total);
          correctData.push(modLog.correct);
          incorrectData.push(modLog.incorrect);
        } else {
          totalData.push(0);
          correctData.push(0);
          incorrectData.push(0);
        }
      }

      const ctx = activityChartCanvas.value.getContext('2d');
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Всего ответов',
              data: totalData,
              backgroundColor: 'rgba(138, 180, 248, 0.35)',
              borderColor: '#8ab4f8',
              borderWidth: 1.5,
              borderRadius: 4,
            },
            {
              label: 'Верно',
              data: correctData,
              backgroundColor: 'rgba(129, 201, 149, 0.35)',
              borderColor: '#81c995',
              borderWidth: 1.5,
              borderRadius: 4,
            },
            {
              label: 'Неверно',
              data: incorrectData,
              backgroundColor: 'rgba(242, 139, 130, 0.35)',
              borderColor: '#f28b82',
              borderWidth: 1.5,
              borderRadius: 4,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#e3e3e3',
                boxWidth: 12,
                padding: 15,
                font: { family: 'Roboto', size: 11 }
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: '#1e1f20',
              titleColor: '#ffffff',
              bodyColor: '#e3e3e3',
              borderColor: '#3c4043',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)', drawOnChartArea: true },
              ticks: { color: '#9e9e9e', font: { size: 10 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9e9e9e', font: { size: 10 }, precision: 0 },
              beginAtZero: true
            }
          }
        }
      });
    };

    watch(
      [
        () => modulesStore.activeModule,
        () => progressStore.activityLog,
        () => progressStore.viewingProfileData,
        activityChartCanvas
      ],
      () => {
        nextTick(() => {
          renderActivityChart();
        });
      },
      { deep: true }
    );

    onMounted(() => {
      renderActivityChart();
      fetchUserRank();
    });

    onUnmounted(() => {
      if (chartInstance) {
        chartInstance.destroy();
        chartInstance = null;
      }
    });

    // Tag cloud
    const allTags = computed(() => {
      const tags = new Set();
      modulesStore.questions.forEach(q => {
        if (q.tags) {
          q.tags.forEach(t => tags.add(t));
        }
      });
      return tags;
    });

    const learnedTagsCount = computed(() => {
      const learned = new Set();
      modulesStore.questions.forEach(q => {
        if (q.tags) {
          q.tags.forEach(t => {
            const qStat = targetStats.value[q.id] || {};
            if ((qStat.correctCount || 0) > 0) learned.add(t);
          });
        }
      });
      return learned.size;
    });

    // Breakdown lists
    const categoryBreakdown = computed(() => {
      const catMap = {};
      modulesStore.questions.forEach(q => {
        const cat = q.category || 'Общее';
        if (!catMap[cat]) {
          catMap[cat] = [];
        }
        catMap[cat].push(q);
      });

      return Object.keys(catMap).sort().map(catName => {
        const qList = catMap[catName];
        let answered = 0;
        let correctAttempts = 0;
        let totalAttempts = 0;

        qList.forEach(q => {
          const qStat = targetStats.value[q.id] || {};
          const c = qStat.correctCount || 0;
          const ic = qStat.incorrectCount || 0;
          if (c + ic > 0) {
            answered++;
            correctAttempts += c;
            totalAttempts += (c + ic);
          }
        });

        return {
          name: catName,
          total: qList.length,
          answered,
          studyPct: qList.length > 0 ? Math.round((answered / qList.length) * 100) : 0,
          accuracyPct: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
        };
      });
    });

    const tagBreakdown = computed(() => {
      const tagMap = {};
      modulesStore.questions.forEach(q => {
        if (q.tags) {
          q.tags.forEach(t => {
            if (!tagMap[t]) tagMap[t] = [];
            tagMap[t].push(q);
          });
        }
      });

      return Object.keys(tagMap).sort().map(tagName => {
        const qList = tagMap[tagName];
        let answered = 0;
        let correctAttempts = 0;
        let totalAttempts = 0;

        qList.forEach(q => {
          const qStat = targetStats.value[q.id] || {};
          const c = qStat.correctCount || 0;
          const ic = qStat.incorrectCount || 0;
          if (c + ic > 0) {
            answered++;
            correctAttempts += c;
            totalAttempts += (c + ic);
          }
        });

        return {
          name: tagName,
          total: qList.length,
          answered,
          studyPct: qList.length > 0 ? Math.round((answered / qList.length) * 100) : 0,
          accuracyPct: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0
        };
      });
    });

    const getAccuracyClass = (pct) => {
      if (pct < 40) return 'accuracy very-low';
      if (pct < 70) return 'accuracy low';
      return 'accuracy';
    };

    const isQuestionDifficult = (q) => {
      const qStat = targetStats.value[q.id] || {};
      return qStat.isDifficult !== undefined ? qStat.isDifficult : q.isStarred;
    };

    const getQuestionTotal = (qId) => {
      const qStat = targetStats.value[qId] || {};
      return (qStat.correctCount || 0) + (qStat.incorrectCount || 0);
    };

    const getQuestionAccuracy = (qId) => {
      const qStat = targetStats.value[qId] || {};
      const tot = (qStat.correctCount || 0) + (qStat.incorrectCount || 0);
      if (tot === 0) return 0;
      return Math.round((qStat.correctCount / tot) * 100);
    };

    const toggleTagFilter = (tag) => {
      if (activeTagFilter.value === tag) {
        activeTagFilter.value = null;
      } else {
        activeTagFilter.value = tag;
      }
    };

    const goToSettings = () => {
      progressStore.currentScreen = 'settings';
    };

    // Reset progress action
    const resetStats = async () => {
      const confirmed = await showConfirm({
        message: 'Вы уверены, что хотите сбросить всю статистику? Это действие необратимо.'
      });
      if (confirmed) {
        progressStore.resetAllStats();
      }
    };

    // Filter and Sort core table questions
    const filteredQuestions = computed(() => {
      const query = searchQuery.value.toLowerCase().trim();
      const catFilter = filterCategory.value;
      const corrFilter = filterCorrectness.value;
      const diffFilter = filterDifficulty.value;
      const sortVal = sortBy.value;
      const tagVal = activeTagFilter.value;
      const stats = targetStats.value;

      let list = modulesStore.questions.filter(q => {
        const tagsStr = (q.tags || []).join(' ');
        const matchQuery = q.title.toLowerCase().includes(query) || q.category.toLowerCase().includes(query) || tagsStr.includes(query);
        if (!matchQuery) return false;

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
          default:
            return a.number - b.number;
        }
      });
    });

    const startQuickSession = (q) => {
      if (progressStore.viewingProfileData) return; // Disable starting quick study session
      const qIndex = modulesStore.questions.indexOf(q);
      if (qIndex === -1) return;

      const queue = [...modulesStore.questions];
      
      const settings = {
        category: 'all',
        algorithm: 'sequential',
        qtype: 'free',
        onlyDifficult: false,
        progressFilter: 'all'
      };

      progressStore.startStudySession(queue, null, settings);
      progressStore.currentIndex = qIndex;
      progressStore.saveActiveSession(settings);
    };

    // Canvas Share Progress Image Card Generator
    const generateShareCard = () => {
      const global = globalStats.value;
      const activeModule = modulesStore.activeModule;
      if (!activeModule) return;

      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');

      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 1200, 900);
      grad.addColorStop(0, '#121212');
      grad.addColorStop(1, '#1e1f20');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 900);

      // Grid decoration
      ctx.strokeStyle = 'rgba(138, 180, 248, 0.03)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 1200; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 900);
        ctx.stroke();
      }
      for (let j = 0; j < 900; j += 60) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(1200, j);
        ctx.stroke();
      }

      // Glow spots
      const glow1 = ctx.createRadialGradient(200, 200, 0, 200, 200, 300);
      glow1.addColorStop(0, 'rgba(138, 180, 248, 0.08)');
      glow1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, 1200, 900);

      const glow2 = ctx.createRadialGradient(1000, 700, 0, 1000, 700, 300);
      glow2.addColorStop(0, 'rgba(129, 201, 149, 0.06)');
      glow2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, 1200, 900);

      // Outer border frame
      ctx.strokeStyle = '#3c4043';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1140, 840);

      // Left blue accent indicator
      ctx.fillStyle = '#8ab4f8';
      ctx.fillRect(30, 30, 12, 840);

      // Title/Logo
      ctx.font = 'bold 36px Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const logoText = 'Preparation.vibe';
      ctx.fillText(logoText, 80, 100);
      const logoWidth = ctx.measureText(logoText).width;

      // Badge AS1
      ctx.font = 'bold 20px Roboto, sans-serif';
      ctx.fillStyle = '#8ab4f8';
      ctx.strokeStyle = 'rgba(138, 180, 248, 0.3)';
      ctx.lineWidth = 2;
      const badgeX = 80 + logoWidth + 15;
      const badgeY = 72;
      const badgeW = 70;
      const badgeH = 36;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(138, 180, 248, 0.1)';
      ctx.fill();
      ctx.fillStyle = '#8ab4f8';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AS1', badgeX + badgeW / 2, badgeY + badgeH / 2);

      // Date string
      ctx.textAlign = 'right';
      ctx.font = '30px Roboto, sans-serif';
      ctx.fillStyle = '#9e9e9e';
      const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      ctx.fillText(dateStr, 1130, 96);

      // Category Section
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#9e9e9e';
      ctx.font = '30px Roboto, sans-serif';
      ctx.fillText('ТЕМА ПОДГОТОВКИ', 80, 200);

      // Topic Module Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px Roboto, sans-serif';
      wrapText(ctx, activeModule.name, 80, 265, 1040, 64);

      // Horizontal separator line
      ctx.strokeStyle = 'rgba(60, 64, 67, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 370);
      ctx.lineTo(1120, 370);
      ctx.stroke();

      // Circular Ring completion indicator
      const completionPct = global.totalQuestions > 0 ? Math.round((global.answeredCount / global.totalQuestions) * 100) : 0;
      const ringX = 300;
      const ringY = 620;
      const radius = 150;

      // Unfilled ring tract
      ctx.strokeStyle = '#2d2e30';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.arc(ringX, ringY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Colored filled circle progress
      ctx.strokeStyle = '#81c995';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * (completionPct / 100));
      ctx.arc(ringX, ringY, radius, startAngle, endAngle);
      ctx.stroke();

      // Inner text score inside completion circle
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 78px Roboto, sans-serif';
      ctx.fillText(`${completionPct}%`, ringX, ringY - 15);

      ctx.font = '28px Roboto, sans-serif';
      ctx.fillStyle = '#9e9e9e';
      ctx.fillText('Изучено', ringX, ringY + 45);

      // Small Circular Progress Bars to the top right of the main one
      const tagStudyPct = allTags.value.size > 0 ? Math.round((learnedTagsCount.value / allTags.value.size) * 100) : 0;

      // Small Circle 1: Themes Progress
      const smRingX1 = 445;
      const smRingY1 = 460;
      const smRadius = 32;
      const smThemesPct = themesStats.value.averagePct;

      // Label above Themes circle
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#9e9e9e';
      ctx.font = '16px Roboto, sans-serif';
      ctx.fillText('ТЕМЫ', smRingX1, smRingY1 - 50);

      // Themes circle track
      ctx.strokeStyle = '#2d2e30';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(smRingX1, smRingY1, smRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Themes active fill
      ctx.strokeStyle = '#81c995';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(smRingX1, smRingY1, smRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (smThemesPct / 100)));
      ctx.stroke();

      // Themes percentage inside
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Roboto, sans-serif';
      ctx.fillText(`${smThemesPct}%`, smRingX1, smRingY1);

      // Small Circle 2: Tags Progress
      const smRingX2 = 525;
      const smRingY2 = 460;
      const smTagsPct = tagStudyPct;

      // Label above Tags circle
      ctx.fillStyle = '#9e9e9e';
      ctx.font = '16px Roboto, sans-serif';
      ctx.fillText('ТЕГИ', smRingX2, smRingY2 - 50);

      // Tags circle track
      ctx.strokeStyle = '#2d2e30';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(smRingX2, smRingY2, smRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Tags active fill
      ctx.strokeStyle = '#8ab4f8';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(smRingX2, smRingY2, smRadius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (smTagsPct / 100)));
      ctx.stroke();

      // Tags percentage inside
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Roboto, sans-serif';
      ctx.fillText(`${smTagsPct}%`, smRingX2, smRingY2);

      // Data statistics list fields
      const startX = 600;
      const startY = 410;
      const rowHeight = 62;

      const items = [
        { label: 'Точность ответов', value: `${global.accuracy}%`, color: '#8ab4f8' },
        { label: 'Вопросов изучено', value: `${global.answeredCount} из ${global.totalQuestions}`, color: '#ffffff' },
        { label: 'Изучено тем', value: `${themesStats.value.averagePct}%`, color: '#81c995' },
        { label: 'Изучено тегов', value: `${tagStudyPct}%`, color: '#8ab4f8' },
        { label: 'Сложные вопросы', value: `${global.totalDifficult}`, color: '#fdd663' },
        { label: 'Всего попыток', value: `${global.totalAttempts}`, color: '#ffffff' },
        { label: 'Ударный режим', value: `${streakCount.value} дн.`, color: '#81c995' }
      ];

      ctx.textAlign = 'left';
      items.forEach((item, idx) => {
        const y = startY + (idx * rowHeight);

        // Dot bullet
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(startX, y - 10, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '30px Roboto, sans-serif';
        ctx.fillStyle = '#9e9e9e';
        ctx.fillText(item.label, startX + 30, y);

        ctx.font = 'bold 36px Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.value, startX + 370, y);
      });

      // Bottom URL note
      ctx.textAlign = 'center';
      ctx.font = '26px Roboto, sans-serif';
      ctx.fillStyle = '#5f6368';
      ctx.fillText('Подготовлено на платформе rimuwu.github.io/vibe-preparation/', 600, 840);

      const imgUrl = canvas.toDataURL('image/png');
      
      showShareCard({
        imgUrl,
        canvas
      });
    };

    const generateRatingShareCard = () => {
      const activeModule = modulesStore.activeModule;
      if (!activeModule) return;

      const stats = testStats.value;
      const rank = userRank.value;
      const nickname = progressStore.viewingProfileData ? progressStore.viewingProfileNickname : progressStore.nickname;

      let primaryColor = '#8ab4f8';
      let bgGradStart = '#121212';
      let bgGradEnd = '#1e1f20';
      let glowColor = 'rgba(138, 180, 248, 0.08)';
      let rankText = 'ВНЕ РЕЙТИНГА';
      let rankEmoji = '🏆';

      if (rank === 1) {
        primaryColor = '#fbbc04';
        bgGradStart = '#1a1300';
        bgGradEnd = '#0d0a00';
        glowColor = 'rgba(251, 188, 4, 0.16)';
        rankText = '1 МЕСТО';
        rankEmoji = '🥇';
      } else if (rank === 2) {
        primaryColor = '#bcc0c4';
        bgGradStart = '#121417';
        bgGradEnd = '#08090a';
        glowColor = 'rgba(188, 192, 196, 0.16)';
        rankText = '2 МЕСТО';
        rankEmoji = '🥈';
      } else if (rank === 3) {
        primaryColor = '#d7785c';
        bgGradStart = '#16110f';
        bgGradEnd = '#0b0807';
        glowColor = 'rgba(215, 120, 92, 0.16)';
        rankText = '3 МЕСТО';
        rankEmoji = '🥉';
      } else if (rank) {
        rankText = `${rank} МЕСТО`;
        rankEmoji = '🎖️';
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 1200, 900);
      grad.addColorStop(0, bgGradStart);
      grad.addColorStop(1, bgGradEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 900);

      ctx.strokeStyle = rank ? `rgba(${rank === 1 ? '251, 188, 4' : rank === 2 ? '188, 192, 196' : '215, 120, 92'}, 0.02)` : 'rgba(138, 180, 248, 0.02)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 1200; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 900);
        ctx.stroke();
      }
      for (let j = 0; j < 900; j += 60) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(1200, j);
        ctx.stroke();
      }

      const glow = ctx.createRadialGradient(600, 450, 0, 600, 450, 500);
      glow.addColorStop(0, glowColor);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 1200, 900);

      ctx.strokeStyle = rank ? primaryColor : '#3c4043';
      ctx.lineWidth = 6;
      ctx.strokeRect(30, 30, 1140, 840);

      ctx.fillStyle = primaryColor;
      ctx.fillRect(30, 30, 12, 840);

      ctx.font = 'bold 36px Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const logoText = 'Preparation.vibe';
      ctx.fillText(logoText, 80, 100);
      const logoWidth = ctx.measureText(logoText).width;

      ctx.font = 'bold 20px Roboto, sans-serif';
      ctx.strokeStyle = rank ? `rgba(${rank === 1 ? '251, 188, 4' : rank === 2 ? '188, 192, 196' : '215, 120, 92'}, 0.3)` : 'rgba(138, 180, 248, 0.3)';
      ctx.lineWidth = 2;
      const badgeX = 80 + logoWidth + 15;
      const badgeY = 72;
      const badgeW = 70;
      const badgeH = 36;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.stroke();
      ctx.fillStyle = rank ? `rgba(${rank === 1 ? '251, 188, 4' : rank === 2 ? '188, 192, 196' : '215, 120, 92'}, 0.1)` : 'rgba(138, 180, 248, 0.1)';
      ctx.fill();
      ctx.fillStyle = primaryColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AS1', badgeX + badgeW / 2, badgeY + badgeH / 2);

      ctx.textAlign = 'right';
      ctx.font = '30px Roboto, sans-serif';
      ctx.fillStyle = '#9e9e9e';
      const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      ctx.fillText(dateStr, 1130, 96);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = primaryColor;
      ctx.font = 'bold 24px Roboto, sans-serif';
      ctx.fillText('РЕЙТИНГОВАЯ КАРТОЧКА', 80, 190);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 64px Roboto, sans-serif';
      ctx.fillText(nickname || 'Аноним', 80, 260);

      ctx.fillStyle = '#9e9e9e';
      ctx.font = '30px Roboto, sans-serif';
      wrapText(ctx, `Тема: ${activeModule.name}`, 80, 315, 1040, 42);

      ctx.strokeStyle = rank ? `rgba(${rank === 1 ? '251, 188, 4' : rank === 2 ? '188, 192, 196' : '215, 120, 92'}, 0.2)` : 'rgba(60, 64, 67, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 390);
      ctx.lineTo(1120, 390);
      ctx.stroke();

      const ringX = 300;
      const ringY = 620;
      const radius = 140;

      ctx.strokeStyle = rank ? `rgba(${rank === 1 ? '251, 188, 4' : rank === 2 ? '188, 192, 196' : '215, 120, 92'}, 0.05)` : 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 32;
      ctx.beginPath();
      ctx.arc(ringX, ringY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#2d2e30';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(ringX, ringY, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * (stats.accuracy / 100));
      ctx.arc(ringX, ringY, radius, startAngle, endAngle);
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '84px Roboto, sans-serif';
      ctx.fillText(rankEmoji, ringX, ringY - 20);

      ctx.font = 'bold 24px Roboto, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(rankText, ringX, ringY + 45);

      const startX = 580;
      const startY = 475;
      const rowHeight = 65;

      const items = [
        { label: 'Место в рейтинге', value: rank ? `${rank} место` : 'Вне рейтинга', color: primaryColor },
        { label: 'Точность ответов', value: `${stats.accuracy}%`, color: '#81c995' },
        { label: 'Вопросов пройдено', value: `${stats.answeredCount} из ${stats.totalQuestions}`, color: '#ffffff' },
        { label: 'Всего попыток (ответов)', value: `${stats.totalAttempts}`, color: '#9e9e9e' },
        { label: 'Правильных ответов', value: `${stats.totalCorrect}`, color: '#81c995' }
      ];

      ctx.textAlign = 'left';
      items.forEach((item, idx) => {
        const y = startY + (idx * rowHeight);

        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(startX, y - 8, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '28px Roboto, sans-serif';
        ctx.fillStyle = '#9e9e9e';
        ctx.fillText(item.label, startX + 30, y);

        ctx.font = 'bold 32px Roboto, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.value, startX + 390, y);
      });

      ctx.textAlign = 'center';
      ctx.font = '26px Roboto, sans-serif';
      ctx.fillStyle = '#5f6368';
      ctx.fillText('Подготовлено на платформе rimuwu.github.io/vibe-preparation/', 600, 845);

      const imgUrl = canvas.toDataURL('image/png');
      showShareCard({
        imgUrl,
        canvas
      });
    };

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
      const words = text.split(' ');
      let line = '';
      let currentY = y;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + ' ';
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    }

    return {
      progressStore,
      modulesStore,
      categoriesCollapsed,
      tagsCollapsed,
      searchQuery,
      filterCategory,
      filterCorrectness,
      filterDifficulty,
      sortBy,
      activeTagFilter,
      globalStats,
      testStats,
      themesStats,
      allTags,
      learnedTagsCount,
      categoryBreakdown,
      tagBreakdown,
      getAccuracyClass,
      isQuestionDifficult,
      getQuestionTotal,
      getQuestionAccuracy,
      toggleTagFilter,
      goToSettings,
      resetStats,
      filteredQuestions,
      startQuickSession,
      generateShareCard,
      streakCount,
      lastActiveDate,
      activityChartCanvas,
      targetStats,
      goBackFromProfile,
      userRank,
      generateRatingShareCard
    };
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}

/* Stats header & grid */
.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(7, 1fr);
  }
}

.stat-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem;
  text-align: center;
}

.stat-card .num {
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--primary);
}

.stat-card .label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-top: 0.25rem;
  letter-spacing: 0.05em;
}

/* Search & filters */
.search-box {
  margin-bottom: 1rem;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.stats-row {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: var(--transition);
}

.stats-row:hover {
  border-color: var(--primary);
  background: rgba(138, 180, 248, 0.02);
}

.stats-row-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.stats-row-title {
  font-size: 0.9rem;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stats-row-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.stats-row-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Settings link shortcut panel */
.settings-link-panel {
  background: rgba(138, 180, 248, 0.03);
  border-color: rgba(138, 180, 248, 0.15);
  transition: var(--transition);
}

.settings-link-panel:hover {
  border-color: rgba(138, 180, 248, 0.3);
  background: rgba(138, 180, 248, 0.05);
}

/* Breakdown panels */
.breakdown-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.85rem;
}

.btn-collapse-breakdown {
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-muted);
  padding: 0.35rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);
  flex-shrink: 0;
}

.btn-collapse-breakdown:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-main);
  border-color: var(--border-hover);
}

.btn-collapse-breakdown .collapse-icon {
  transition: transform 0.25s ease;
}

.breakdown-collapsible {
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 9999px;
  opacity: 1;
}

.breakdown-collapsible.collapsed {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.breakdown-grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.breakdown-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  transition: var(--transition);
}

.breakdown-item:hover {
  border-color: var(--border-hover);
  background: rgba(255, 255, 255, 0.03);
}

.breakdown-collapsible .breakdown-item + .breakdown-item {
  margin-top: 0.5rem;
}

.breakdown-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.breakdown-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-main);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 0.5rem;
}

.breakdown-name .tag-prefix {
  color: var(--primary);
  opacity: 0.7;
  font-size: 0.8rem;
}

.breakdown-stats {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.breakdown-bars {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.breakdown-bar-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.breakdown-bar-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  width: 55px;
  flex-shrink: 0;
}

.breakdown-bar-track {
  flex: 1;
  height: 5px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
}

.breakdown-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.breakdown-bar-fill.study {
  background: linear-gradient(90deg, var(--primary) 0%, #a8c7fa 100%);
}

.breakdown-bar-fill.accuracy {
  background: linear-gradient(90deg, var(--success) 0%, #a3e2b7 100%);
}

.breakdown-bar-fill.accuracy.low {
  background: linear-gradient(90deg, var(--warning) 0%, #ffe082 100%);
}

.breakdown-bar-fill.accuracy.very-low {
  background: linear-gradient(90deg, var(--error) 0%, #f6aea9 100%);
}

.breakdown-bar-pct {
  font-size: 0.7rem;
  color: var(--text-muted);
  width: 32px;
  text-align: right;
  flex-shrink: 0;
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

.tag-filter-bar .tag-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
}

@media (max-width: 480px) {
  .stats-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .stats-row-meta {
    align-self: flex-end;
  }
}

.stats-row.read-only {
  cursor: default;
}
.stats-row.read-only:hover {
  border-color: var(--border-color);
  background: rgba(255, 255, 255, 0.01);
}
</style>

