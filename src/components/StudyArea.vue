<template>
  <section id="screen-study" class="screen active">
    <div v-if="currentQuestion" style="display:contents">
    <div class="study-area">
      <!-- Top Bar: Progress and Score -->
      <div class="top-bar">
        <div class="progress-container">
          <div class="progress-info">
            <span id="session-progress-text">Карточка {{ currentIndex + 1 }} из {{ total }}</span>
            <span id="session-accuracy-text">Правильно: {{ accuracy }}%</span>
          </div>
          <div class="progress-track">
            <div id="session-progress-bar" class="progress-bar" :style="{ width: progressPercent + '%' }"></div>
          </div>
        </div>
        
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <!-- Edit current question -->
          <button class="btn-icon" title="Редактировать вопрос/ответ" @click="editQuestion">
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          
          <!-- Exit session -->
          <button class="btn-icon" title="Завершить сессию" @click="exitSession">
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Flipper Card Viewport -->
      <div class="card-viewport" @click="onCardClick">
        <div class="card" :class="{ flipped: isFlipped }">
          
          <!-- Card Front -->
          <div class="card-face card-front">
            <div class="card-front-header">
              <div class="q-meta" id="card-front-meta">
                <span>{{ currentQuestion.category }} • Вопрос {{ currentQuestion.number }}</span>
                <div v-if="currentQuestion.tags && currentQuestion.tags.length > 0" class="tags-row">
                  <span v-for="tag in currentQuestion.tags" :key="tag" class="tag-badge">{{ tag }}</span>
                </div>
              </div>
              <div v-if="isQuestionDifficult" class="starred-badge">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                  ></polygon>
                </svg>
              </div>
            </div>
            
            <div class="q-text" id="card-question-text">{{ currentQuestion.title }}</div>
            <div class="card-instructions">Нажмите для переворота</div>
          </div>

          <!-- Card Back -->
          <div class="card-face card-back">
            <div class="answer-section">
              <!-- Short Answer -->
              <div>
                <h4>Краткий ответ / Код</h4>
                <div class="answer-text markdown-body" v-html="renderedShortAnswer"></div>
              </div>
              
              <!-- Detailed Explanation -->
              <div v-if="currentQuestion.detailedAnswer">
                <h4>Подробное пояснение</h4>
                <div class="answer-text markdown-body" v-html="renderedDetailedAnswer"></div>
              </div>
            </div>
            <div class="card-instructions">Нажмите для возврата к вопросу</div>
          </div>

        </div>
      </div>

      <!-- Controls Panel -->
      <div class="panel action-area" style="margin-bottom: 0;">
        <!-- Modes inputs -->
        
        <!-- MODE: Multiple Choice Test Options -->
        <div v-if="qtype === 'choice'" class="options-grid">
          <button
            v-for="(opt, idx) in choiceOptions"
            :key="idx"
            class="option-btn"
            :class="getOptionClass(opt)"
            :disabled="choiceSelected !== null"
            @click="selectChoice(opt)"
          >
            {{ opt.text }}
          </button>
        </div>

        <!-- MODE: Text Input Fuzzy Verifier -->
        <div v-else-if="qtype === 'input'" class="text-input-group">
          <label for="typed-answer" style="font-size: 0.8rem; color: var(--text-muted);">
            Введите ваш ответ:
          </label>
          <textarea
            id="typed-answer"
            class="text-control"
            v-model="typedAnswer"
            placeholder="Напишите ответ своими словами..."
            :disabled="textChecked"
            ref="textInputArea"
          ></textarea>
          
          <button
            v-if="!textChecked"
            class="btn-primary"
            style="padding: 0.6rem; font-size: 0.9rem;"
            @click="checkTypedAnswer"
          >
            Проверить ответ
          </button>
          
          <div
            v-if="textChecked"
            class="input-feedback"
            :class="{ correct: textCorrect, incorrect: !textCorrect }"
          >
            {{ feedbackMessage }}
          </div>
        </div>

        <!-- MODE: Free Oral Self-Study Note -->
        <div v-else-if="qtype === 'free'" class="text-input-group">
          <label for="free-typed-answer" style="font-size: 0.8rem; color: var(--text-muted);">
            Запишите ответ для себя (перед проверкой):
          </label>
          <textarea
            id="free-typed-answer"
            class="text-control"
            v-model="freeNote"
            placeholder="Напишите ответ своими словами перед переворотом карточки..."
          ></textarea>
        </div>

        <!-- Session Controls -->
        <div class="study-controls">
          <!-- Wrong Assessment -->
          <button
            v-if="qtype === 'free'"
            class="btn-action btn-incorrect"
            :disabled="isIncorrectDisabled"
            @click="submitAssessment(false)"
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            Неправильно
          </button>

          <!-- Correct Assessment -->
          <button
            v-if="qtype === 'free'"
            class="btn-action btn-correct"
            :disabled="isCorrectDisabled"
            @click="submitAssessment(true)"
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
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Правильно
          </button>

          <!-- Accept Alternative Answer -->
          <button
            v-if="qtype === 'input' && textChecked && !textCorrect && !alternativeAccepted"
            class="btn-action btn-accept-ans"
            @click="acceptAlternative"
          >
            Мой ответ тоже верный (+ добавить в базу)
          </button>

          <!-- Backtrack Button -->
          <button
            class="btn-action btn-prev-quest"
            title="Вернуться к предыдущему вопросу"
            :disabled="currentIndex === 0"
            @click="prevQuestion"
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
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Назад
          </button>

          <!-- Difficult toggle -->
          <button
            class="btn-action btn-difficult-toggle"
            :class="{ active: isQuestionDifficult }"
            @click="toggleDifficult"
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
              style="margin-right:0.25rem;"
            >
              <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
              ></polygon>
            </svg>
            <span>{{ isQuestionDifficult ? 'Сложный вопрос!' : 'Сложный вопрос' }}</span>
          </button>

          <!-- Next Button (For Choice & Input Mode completed states) -->
          <button
            v-if="(qtype === 'choice' && choiceSelected !== null) || (qtype === 'input' && textChecked)"
            id="btn-next-question"
            class="btn-action btn-primary"
            style="grid-column: span 2;"
            @click="advanceNextQuestion"
          >
            Далее
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
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <!-- Hotkeys Legend -->
      <div class="keyboard-help">
        <p>🖥️ <strong>Горячие клавиши (ПК):</strong></p>
        <div class="keyboard-help-grid">
          <div class="key-tip"><span class="key-btn">Space</span> Перевернуть</div>
          <div class="key-tip"><span class="key-btn">D</span> / <span class="key-btn">↑</span> Сложный</div>
          <div class="key-tip"><span class="key-btn">1</span> / <span class="key-btn">←</span> Неправильно</div>
          <div class="key-tip"><span class="key-btn">2</span> / <span class="key-btn">→</span> Правильно</div>
          <div class="key-tip"><span class="key-btn">Backspace</span> Предыдущий вопрос</div>
        </div>
      </div>
    </div>
    </div>
    <div v-else class="panel" style="text-align: center; padding: 3rem; color: var(--text-muted); margin: auto;">
      <p>Загрузка сессии подготовки...</p>
    </div>
  </section>
</template>

<script>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useProgressStore } from '../stores/progress';
import { useModulesStore } from '../stores/modules';
import { useModal } from '../composables/useModal';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

export default {
  name: 'StudyArea',
  setup(props, { emit }) {
    const progressStore = useProgressStore();
    const modulesStore = useModulesStore();
    const { showAlert, showConfirm, showEditQuestion } = useModal();

    const isFlipped = ref(false);
    const typedAnswer = ref('');
    const freeNote = ref('');
    const choiceOptions = ref([]);
    const choiceSelected = ref(null);
    const textChecked = ref(false);
    const textCorrect = ref(false);
    const feedbackMessage = ref('');
    const alternativeAccepted = ref(false);
    const textInputArea = ref(null);

    const currentIndex = computed(() => progressStore.currentIndex);
    const total = computed(() => progressStore.sessionQueue.length);
    const currentQuestion = computed(() => progressStore.sessionQueue[currentIndex.value] || null);
    
    const qtype = computed(() => progressStore.activeTicketId ? localStorage.getItem('vibe_prep_ticket_solve_mode') || 'free' : progressStore.sessionQueue.length > 0 ? (localStorage.getItem('vibe_prep_active_session') ? JSON.parse(localStorage.getItem('vibe_prep_active_session')).settings.qtype : 'free') : 'free');

    const progressPercent = computed(() => {
      if (total.value === 0) return 0;
      return (currentIndex.value / total.value) * 100;
    });

    const accuracy = computed(() => {
      if (progressStore.sessionAttempts === 0) return 0;
      return Math.round((progressStore.sessionCorrect / progressStore.sessionAttempts) * 100);
    });

    const isQuestionDifficult = computed(() => {
      if (!currentQuestion.value) return false;
      const qStats = progressStore.getQuestionStats(currentQuestion.value.id);
      return qStats.isDifficult !== undefined ? qStatIsDifficult(qStats) : currentQuestion.value.isStarred;
    });

    const qStatIsDifficult = (stat) => stat.isDifficult;

    // Markdown content parsing
    const renderedShortAnswer = computed(() => {
      if (!currentQuestion.value || !currentQuestion.value.shortAnswer) return '<em>Отсутствует</em>';
      return marked.parse(currentQuestion.value.shortAnswer);
    });

    const renderedDetailedAnswer = computed(() => {
      if (!currentQuestion.value || !currentQuestion.value.detailedAnswer) return '';
      return marked.parse(currentQuestion.value.detailedAnswer);
    });

    // Assessment disable logic
    const isIncorrectDisabled = computed(() => {
      if (qtype.value === 'choice') return true;
      if (qtype.value === 'input' && !textChecked.value) return true;
      return false;
    });

    const isCorrectDisabled = computed(() => {
      if (qtype.value === 'choice') return true;
      if (qtype.value === 'input' && !textChecked.value) return true;
      return false;
    });

    // Watch index changes to reset fields
    watch(currentIndex, () => {
      resetCardState();
    }, { immediate: true });

    function resetCardState() {
      isFlipped.value = false;
      typedAnswer.value = '';
      freeNote.value = '';
      choiceSelected.value = null;
      textChecked.value = false;
      textCorrect.value = false;
      feedbackMessage.value = '';
      alternativeAccepted.value = false;

      if (!currentQuestion.value) return;

      // Handle choice options generation
      if (qtype.value === 'choice') {
        generateChoiceOptions();
      }

      // Syntax highlight render hooks
      nextTick(() => {
        Prism.highlightAll();
      });
    }

    function generateChoiceOptions() {
      const q = currentQuestion.value;
      let options = [];

      if (q.type === 'choice' && q.choices && q.choices.length > 0) {
        const correctChoices = q.choices.filter(c => c.isCorrect);
        const incorrectChoices = q.choices.filter(c => !c.isCorrect);

        const correct = correctChoices.length > 0 ? correctChoices[0] : null;
        const neededIncorrect = correct ? 3 : 4;
        const selectedIncorrect = shuffleArray(incorrectChoices).slice(0, neededIncorrect);

        if (correct) {
          options.push({ text: correct.text, isCorrect: true });
        }
        selectedIncorrect.forEach(c => {
          options.push({ text: c.text, isCorrect: false });
        });
      } else {
        const correctAnswerText = stripMarkdown(q.shortAnswer || q.title);
        options.push({ text: correctAnswerText, isCorrect: true });

        // Distractors from other questions in modulesStore
        const distractors = modulesStore.questions
          .filter(other => other.id !== q.id && other.shortAnswer)
          .map(other => stripMarkdown(other.shortAnswer))
          .filter(text => text && text !== correctAnswerText);

        const selectedDistractors = shuffleArray(distractors).slice(0, 3);
        selectedDistractors.forEach(text => {
          options.push({ text, isCorrect: false });
        });

        while (options.length < 4) {
          options.push({ text: `Неправильный вариант ${options.length}`, isCorrect: false });
        }
      }

      choiceOptions.value = shuffleArray(options);
    }

    function stripMarkdown(text) {
      return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/[-*+]\s+/g, '')
        .trim();
    }

    function shuffleArray(array) {
      const result = [...array];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }

    function getOptionClass(opt) {
      if (choiceSelected.value === null) return '';
      if (opt.isCorrect) return 'correct';
      if (choiceSelected.value.text === opt.text && !opt.isCorrect) return 'incorrect';
      return '';
    }

    function selectChoice(opt) {
      choiceSelected.value = opt;

      // Disable buttons immediately, color them, record answer
      progressStore.recordAnswer(currentQuestion.value.id, opt.isCorrect, qtype.value);
      progressStore.sessionAttempts++;
      progressStore.sessionAnswers[currentIndex.value] = opt.isCorrect;
      
      if (opt.isCorrect) {
        progressStore.sessionCorrect++;
        progressStore.saveActiveSession();
        // Auto progress on correct choice
        setTimeout(() => {
          advanceNextQuestion();
        }, 1000);
      } else {
        progressStore.saveActiveSession();
        // Auto flip card to explain distractors on error
        setTimeout(() => {
          if (!isFlipped.value) {
            isFlipped.value = true;
            nextTick(() => {
              Prism.highlightAll();
            });
          }
        }, 1000);
      }
    }

    function advanceNextQuestion() {
      const nextIdx = currentIndex.value + 1;
      if (nextIdx >= total.value) {
        finishSession();
      } else {
        progressStore.currentIndex = nextIdx;
        progressStore.saveActiveSession();
      }
    }

    async function finishSession() {
      showAlert({
        title: 'Завершено!',
        message: `Поздравляем! Сессия завершена.\nРезультат: ${progressStore.sessionCorrect} из ${progressStore.sessionAttempts} правильно (${progressStore.sessionAttempts > 0 ? Math.round(progressStore.sessionCorrect / progressStore.sessionAttempts * 100) : 0}%)`
      });

      if (progressStore.activeTicketId && progressStore.activeModuleId) {
        progressStore.recordTicketStats(
          progressStore.activeModuleId,
          progressStore.activeTicketId,
          progressStore.sessionCorrect,
          progressStore.sessionQueue.length
        );
      }

      if (qtype.value === 'choice' && progressStore.nickname) {
        try {
          const standardMods = modulesStore.modules.filter(m => !m.isCustom);
          const resolvedMods = await Promise.all(
            standardMods.map(async (m) => {
              const qs = await modulesStore.loadQuestionsForModule(m);
              return { id: m.id, name: m.name, questions: qs };
            })
          );
          await progressStore.pushLeaderboardStatsSilently(resolvedMods);
        } catch (e) {
          console.warn('Failed to push leaderboard stats silently after session:', e);
        }
      }

      progressStore.clearActiveSession();
      progressStore.currentScreen = 'dashboard';
    }

    // Fuzzy text verify
    function checkTypedAnswer() {
      const q = currentQuestion.value;
      const typed = typedAnswer.value.trim();
      
      if (!typed) {
        showAlert({
          message: 'Пожалуйста, введите ответ перед проверкой.'
        });
        return;
      }

      const qStats = progressStore.getQuestionStats(q.id);
      let correctTemplate = q.shortAnswer || '';
      
      if (!correctTemplate && q.type === 'choice' && q.choices) {
        const correctChoice = q.choices.find(c => c.isCorrect);
        if (correctChoice) {
          correctTemplate = correctChoice.text;
        }
      }

      const isMatched = fuzzyMatch(typed, correctTemplate, qStats.acceptedAnswers || []);

      textChecked.value = true;
      textCorrect.value = isMatched;

      progressStore.sessionAttempts++;

      if (isMatched) {
        feedbackMessage.value = '🎉 Верно! Отличный результат.';
        progressStore.recordAnswer(q.id, true, qtype.value);
        progressStore.sessionCorrect++;
        progressStore.sessionAnswers[currentIndex.value] = true;
        progressStore.saveActiveSession();

        setTimeout(() => {
          if (!isFlipped.value) {
            isFlipped.value = true;
            nextTick(() => {
              Prism.highlightAll();
            });
          }
        }, 1200);
      } else {
        feedbackMessage.value = '❌ Ответ не совпал с эталонным. Проверьте карточку.';
        progressStore.recordAnswer(q.id, false, qtype.value);
        progressStore.sessionAnswers[currentIndex.value] = false;
        progressStore.saveActiveSession();

        setTimeout(() => {
          if (!isFlipped.value) {
            isFlipped.value = true;
            nextTick(() => {
              Prism.highlightAll();
            });
          }
        }, 1500);
      }
    }

    function acceptAlternative() {
      const q = currentQuestion.value;
      const typed = typedAnswer.value.trim();
      if (!typed) return;

      progressStore.addAcceptedAnswer(q.id, typed);

      // Mutate stats: correct incorrectCount subtraction and correctCount addition
      const qStat = progressStore.getQuestionStats(q.id);
      if (qStat.incorrectCount > 0) qStat.incorrectCount--;
      qStat.correctCount++;
      progressStore.saveStats();

      // Session statistics adjustment
      progressStore.sessionCorrect++;
      progressStore.sessionAnswers[currentIndex.value] = true;
      progressStore.saveActiveSession();

      alternativeAccepted.value = true;
      textCorrect.value = true;
      feedbackMessage.value = '🎉 Ответ зачтен и добавлен в базу правильных альтернатив!';
    }

    function fuzzyMatch(typed, correct, acceptedList = []) {
      const clean = (str) => {
        return str
          .toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      const cleanTyped = clean(typed);
      const cleanCorrect = clean(correct);

      if (!cleanTyped) return false;
      if (cleanTyped === cleanCorrect) return true;

      for (const accepted of acceptedList) {
        if (cleanTyped === clean(accepted)) return true;
      }

      if (cleanCorrect.length > 4) {
        if (cleanTyped.includes(cleanCorrect) || cleanCorrect.includes(cleanTyped)) {
          const lenDiff = Math.abs(cleanTyped.length - cleanCorrect.length);
          if (lenDiff < cleanCorrect.length * 0.3) {
            return true;
          }
        }
      }

      const dist = levenshteinDistance(cleanTyped, cleanCorrect);
      const maxAllowedDist = Math.max(1, Math.floor(cleanCorrect.length * 0.15));
      return dist <= maxAllowedDist;
    }

    function levenshteinDistance(a, b) {
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
    }

    function onCardClick(e) {
      if (
        e.target.closest('button') ||
        e.target.closest('textarea') ||
        e.target.closest('a') ||
        e.target.closest('.options-grid') ||
        e.target.closest('.text-input-group')
      ) {
        return;
      }
      flipCard();
    }

    function flipCard() {
      // Auto scoring choice modes on flip
      if (qtype.value === 'choice' && choiceSelected.value === null) {
        choiceSelected.value = { text: '', isCorrect: false };
        progressStore.recordAnswer(currentQuestion.value.id, false, qtype.value);
        progressStore.sessionAttempts++;
        progressStore.sessionAnswers[currentIndex.value] = false;
        progressStore.saveActiveSession();
      }
      
      isFlipped.value = !isFlipped.value;
      
      if (isFlipped.value) {
        nextTick(() => {
          Prism.highlightAll();
        });
      }
    }

    function toggleDifficult() {
      if (!currentQuestion.value) return;
      progressStore.toggleDifficult(currentQuestion.value.id, currentQuestion.value.isStarred);
    }

    function submitAssessment(isCorrect) {
      progressStore.recordAnswer(currentQuestion.value.id, isCorrect, qtype.value);
      progressStore.sessionAnswers[currentIndex.value] = isCorrect;
      progressStore.sessionAttempts++;
      if (isCorrect) {
        progressStore.sessionCorrect++;
      }
      
      advanceNextQuestion();
    }

    function prevQuestion() {
      if (currentIndex.value === 0) return;
      
      const prevIdx = currentIndex.value - 1;
      progressStore.currentIndex = prevIdx;

      const prevAnswer = progressStore.sessionAnswers[prevIdx];
      if (prevAnswer !== null) {
        progressStore.sessionAttempts--;
        if (prevAnswer === true) {
          progressStore.sessionCorrect--;
        }
        progressStore.sessionAnswers[prevIdx] = null;
      }

      progressStore.saveActiveSession();
    }

    async function exitSession() {
      const confirmed = await showConfirm({
        message: 'Вы уверены, что хотите завершить сессию подготовки? Текущий прогресс сессии будет сброшен.'
      });
      if (confirmed) {
        progressStore.clearActiveSession();
        progressStore.currentScreen = 'dashboard';
      }
    }

    async function editQuestion() {
      const q = currentQuestion.value;
      if (!q) return;

      const updated = await showEditQuestion({ question: q });
      if (updated) {
        modulesStore.editQuestionInModule(progressStore.activeModuleId, q.id, updated);
        resetCardState();
      }
    }

    // Keyboard hotkeys handler
    const handleKeydown = (e) => {
      // Prevent hotkeys during text edits
      if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
        if (e.key === 'Enter' && !e.shiftKey && document.activeElement.id === 'typed-answer') {
          e.preventDefault();
          checkTypedAnswer();
        }
        return;
      }

      switch (e.key) {
        case ' ': // Space key
          e.preventDefault();
          flipCard();
          break;
        case 'd':
        case 'D':
        case 'ArrowUp':
          e.preventDefault();
          toggleDifficult();
          break;
        case '1':
        case 'ArrowLeft':
          e.preventDefault();
          if (!isIncorrectDisabled.value) {
            submitAssessment(false);
          }
          break;
        case '2':
        case 'ArrowRight':
          e.preventDefault();
          if (!isCorrectDisabled.value) {
            submitAssessment(true);
          }
          break;
        case 'Backspace':
          e.preventDefault();
          prevQuestion();
          break;
      }
    };

    onMounted(() => {
      document.addEventListener('keydown', handleKeydown);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('keydown', handleKeydown);
    });

    return {
      progressStore,
      modulesStore,
      currentIndex,
      total,
      currentQuestion,
      qtype,
      progressPercent,
      accuracy,
      isFlipped,
      isQuestionDifficult,
      renderedShortAnswer,
      renderedDetailedAnswer,
      choiceOptions,
      choiceSelected,
      typedAnswer,
      textChecked,
      textCorrect,
      feedbackMessage,
      alternativeAccepted,
      freeNote,
      isIncorrectDisabled,
      isCorrectDisabled,
      textInputArea,
      getOptionClass,
      selectChoice,
      advanceNextQuestion,
      checkTypedAnswer,
      acceptAlternative,
      onCardClick,
      flipCard,
      toggleDifficult,
      submitAssessment,
      prevQuestion,
      exitSession,
      editQuestion
    };
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}

/* Study layout */
.study-area {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.progress-container {
  flex-grow: 1;
  margin-right: 1.5rem;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.4rem;
}

.progress-track {
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0%;
  background: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* 3D Flip card */
.card-viewport {
  perspective: 1000px;
  width: 100%;
  min-height: 160px;
  height: calc(100vh - 450px);
  margin-bottom: 1rem;
  position: relative;
}

@media (max-height: 600px) {
  .card-viewport {
    min-height: 180px;
    height: calc(100vh - 320px);
  }
}

.card {
  width: 100%;
  height: 100%;
  position: absolute;
  transform-style: preserve-3d;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.card.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: var(--radius-lg);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border-color);
  overflow-y: auto;
  background: #1e1f20;
}

.card-front {
  color: var(--text-main);
  justify-content: flex-start;
  align-items: flex-start;
  text-align: left;
  padding: 2.25rem 2rem 1.5rem 2rem;
}

.card-front::before,
.card-front::after {
  content: '';
  margin: auto;
}

.card-back {
  color: var(--text-main);
  transform: rotateY(180deg);
}

.card-front-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  margin-bottom: 1rem;
}

.starred-badge {
  color: var(--warning);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.q-meta {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  color: var(--primary);
  letter-spacing: 0.05em;
  margin-bottom: 0;
  width: 100%;
}

.q-text {
  font-size: 1.2rem;
  font-weight: 400;
  line-height: 1.5;
  color: #ffffff;
  width: 100%;
  text-align: center;
}

@media (min-width: 768px) {
  .q-text {
    font-size: 1.4rem;
  }
}

.card-instructions {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 1.5rem;
  letter-spacing: 0.05em;
  width: 100%;
  text-align: center;
}

/* Back answer area */
.answer-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex-grow: 1;
  text-align: left;
}

.answer-section h4 {
  font-size: 0.8rem;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.35rem;
  margin-bottom: 0.35rem;
}

.answer-text {
  font-size: 0.95rem;
  color: var(--text-main);
}

/* Action area */
.action-area {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: auto;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

@media (min-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.option-btn {
  background: #1f1f1f;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-main);
  padding: 0.85rem 1rem;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: var(--transition);
  text-align: left;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-btn:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--border-hover);
}

.option-btn.correct {
  background: var(--success-dark);
  border-color: var(--success);
  color: var(--success);
}

.option-btn.incorrect {
  background: var(--error-dark);
  border-color: var(--error);
  color: var(--error);
}

.text-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.input-feedback {
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  display: none;
  animation: fadeIn 0.3s ease;
}

.input-feedback.correct {
  display: block;
  background: var(--success-dark);
  border: 1px solid rgba(129, 201, 149, 0.3);
  color: var(--success);
}

.input-feedback.incorrect {
  display: block;
  background: var(--error-dark);
  border: 1px solid rgba(242, 139, 130, 0.3);
  color: var(--error);
}

/* Study controls grid */
.study-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

@media (max-width: 480px) {
  .study-controls {
    gap: 0.5rem;
  }
}

.btn-correct {
  background: var(--success-dark);
  color: var(--success);
  border: 1px solid rgba(129, 201, 149, 0.3);
}

.btn-correct:hover {
  background: rgba(129, 201, 149, 0.25);
  border-color: var(--success);
}

.btn-incorrect {
  background: var(--error-dark);
  color: var(--error);
  border: 1px solid rgba(242, 139, 130, 0.3);
}

.btn-incorrect:hover {
  background: rgba(242, 139, 130, 0.25);
  border-color: var(--error);
}

.btn-difficult-toggle {
  grid-column: span 1;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

.btn-difficult-toggle:hover {
  background: rgba(255, 255, 255, 0.04);
}

.btn-difficult-toggle.active {
  background: var(--warning-dark);
  border-color: var(--warning);
  color: var(--warning);
}

.btn-difficult-toggle.active svg {
  fill: currentColor;
}

.btn-prev-quest {
  grid-column: span 1;
  background: transparent;
  border: 1px solid var(--border-color);
  color: var(--text-main);
}

.btn-prev-quest:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--primary);
  border-color: var(--primary);
}

.btn-accept-ans {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  grid-column: span 2;
  margin-top: 0.25rem;
}

.btn-accept-ans:hover {
  background: var(--primary-dark);
}

/* Edit button on card */
.card-edit-btn {
  background: rgba(0, 0, 0, 0.3) !important;
  color: var(--text-muted) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

.card-edit-btn:hover {
  background: rgba(255, 255, 255, 0.08) !important;
  color: var(--primary) !important;
  border-color: var(--primary) !important;
}

/* Tags row on card front */
.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.4rem;
  justify-content: flex-start;
}

/* Keyboard help section (desktop only) */
.keyboard-help {
  display: none;
}

@media (min-width: 1024px) {
  .keyboard-help {
    display: block;
    margin-top: 0.75rem;
    padding: 0.65rem 1rem;
    background: rgba(255, 255, 255, 0.015);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-sm);
    font-size: 0.78rem;
    color: var(--text-muted);
  }

  .keyboard-help p {
    margin-bottom: 0.4rem;
    font-size: 0.78rem;
  }

  .keyboard-help-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    margin-top: 0.35rem;
  }

  .key-tip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
  }

  .key-btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.76rem;
    color: var(--text-main);
  }
}
</style>

