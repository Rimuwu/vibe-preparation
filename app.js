/**
 * Main application script.
 * Integrates parser, stats, algorithms, and updates the DOM.
 */

import { parseMarkdown } from './parser.js';
import { 
  getStats, 
  recordAnswer, 
  toggleDifficult, 
  addAcceptedAnswer, 
  getQuestionStats, 
  getGlobalStats, 
  resetAllStats 
} from './stats.js';
import { prepareSession } from './algorithms.js';

// Application State
let dbQuestions = [];         // All questions parsed
let sessionQueue = [];        // Questions in current study round
let currentIndex = 0;         // Current question index in sessionQueue
let sessionCorrect = 0;       // Correct count in current round
let sessionAttempts = 0;      // Total attempts in current round
let isCardFlipped = false;    // Visual state of the card
let fileLoaded = false;       // If questions are loaded

// DOM Elements
const screenDashboard = document.getElementById('screen-dashboard');
const screenStudy = document.getElementById('screen-study');
const screenStats = document.getElementById('screen-stats');

const btnShowStats = document.getElementById('btn-show-stats');
const btnShowHome = document.getElementById('btn-show-home');
const btnResetStats = document.getElementById('btn-reset-stats');

const selectCategory = document.getElementById('select-category');
const selectAlgorithm = document.getElementById('select-algorithm');
const selectQType = document.getElementById('select-qtype');

const fileDropzone = document.getElementById('file-dropzone');
const fileInput = document.getElementById('file-input');
const dropzoneText = document.getElementById('dropzone-text');
const importStats = document.getElementById('import-stats');
const importedCount = document.getElementById('imported-count');

const btnStartSession = document.getElementById('btn-start-session');
const btnExitStudy = document.getElementById('btn-exit-study');

const studyCard = document.getElementById('study-card');
const cardStarred = document.getElementById('card-starred');
const cardFrontMeta = document.getElementById('card-front-meta');
const cardQuestionText = document.getElementById('card-question-text');
const cardShortAnswer = document.getElementById('card-short-answer');
const cardDetailedAnswer = document.getElementById('card-detailed-answer');

const progressText = document.getElementById('session-progress-text');
const accuracyText = document.getElementById('session-accuracy-text');
const progressBar = document.getElementById('session-progress-bar');

const choiceContainer = document.getElementById('choice-container');
const inputContainer = document.getElementById('input-container');
const typedAnswer = document.getElementById('typed-answer');
const btnSubmitAnswer = document.getElementById('btn-submit-answer');
const inputFeedback = document.getElementById('input-feedback');

const btnCorrect = document.getElementById('btn-correct');
const btnIncorrect = document.getElementById('btn-incorrect');
const btnDifficult = document.getElementById('btn-difficult');
const btnAcceptAlternative = document.getElementById('btn-accept-alternative');

const statsSearch = document.getElementById('stats-search');
const statsList = document.getElementById('stats-list');

// Global Stats elements
const statAccuracy = document.getElementById('stat-accuracy');
const statCompleted = document.getElementById('stat-completed');
const statDifficult = document.getElementById('stat-difficult');
const statAttempts = document.getElementById('stat-attempts');

/* -------------------------------------------------------------
 * 1. Startup & File Loading
 * ------------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupEventListeners();
  
  // Try to load default fr.md
  try {
    const response = await fetch('./fr.md');
    if (response.ok) {
      const text = await response.text();
      loadQuestions(text, 'fr.md (По умолчанию)');
    } else {
      console.log('Default fr.md was not found at root. Waiting for user upload.');
    }
  } catch (e) {
    console.warn('Could not auto-fetch default fr.md. Ready for file drop.', e);
  }
}

function loadQuestions(mdText, filename) {
  try {
    dbQuestions = parseMarkdown(mdText);
    fileLoaded = true;
    
    // Update dropzone UI
    dropzoneText.textContent = `Загружен: ${filename}`;
    importStats.style.display = 'block';
    importedCount.textContent = dbQuestions.length;
    
    // Populate categories
    const categories = new Set(dbQuestions.map(q => q.category));
    
    // Clear and reset select options
    selectCategory.innerHTML = '<option value="all">Все вопросы</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      selectCategory.appendChild(opt);
    });

    // Refresh UI
    updateGlobalStatsUI();
  } catch (err) {
    alert('Ошибка при разборе файла вопросов: ' + err.message);
  }
}

/* -------------------------------------------------------------
 * 2. Setup Events
 * ------------------------------------------------------------- */

function setupEventListeners() {
  // Navigation
  btnShowStats.addEventListener('click', () => {
    switchScreen('stats');
    renderStatsTable();
  });
  
  btnShowHome.addEventListener('click', () => {
    switchScreen('dashboard');
  });

  document.getElementById('brand-home').addEventListener('click', () => {
    switchScreen('dashboard');
  });

  // Drag and drop setup
  fileDropzone.addEventListener('click', () => fileInput.click());
  
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  fileDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropzone.classList.add('dragover');
  });

  fileDropzone.addEventListener('dragleave', () => {
    fileDropzone.classList.remove('dragover');
  });

  fileDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  // Session Start / End
  btnStartSession.addEventListener('click', startStudySession);
  btnExitStudy.addEventListener('click', () => switchScreen('dashboard'));
  
  // Card interaction
  studyCard.addEventListener('click', (e) => {
    // Prevent flipping when clicking on interactive areas or code inside back
    if (e.target.closest('button') || e.target.closest('textarea') || e.target.closest('a') || e.target.closest('.options-grid') || e.target.closest('.text-input-group')) {
      return;
    }
    flipCard();
  });

  // Study evaluation actions
  btnCorrect.addEventListener('click', () => recordSessionProgress(true));
  btnIncorrect.addEventListener('click', () => recordSessionProgress(false));
  btnDifficult.addEventListener('click', toggleCardDifficult);
  btnAcceptAlternative.addEventListener('click', acceptAlternativeAnswer);

  // Stats
  btnResetStats.addEventListener('click', () => {
    if (confirm('Вы уверены, что хотите сбросить всю статистику? Это действие необратимо.')) {
      resetAllStats();
      updateGlobalStatsUI();
      renderStatsTable();
    }
  });

  statsSearch.addEventListener('input', renderStatsTable);

  // Keyboard Shortcuts (PC)
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

function handleFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    loadQuestions(e.target.result, file.name);
  };
  reader.readAsText(file);
}

function switchScreen(screenName) {
  screenDashboard.classList.remove('active');
  screenStudy.classList.remove('active');
  screenStats.classList.remove('active');
  
  btnShowHome.style.display = 'none';
  btnShowStats.style.display = 'none';

  if (screenName === 'dashboard') {
    screenDashboard.classList.add('active');
    btnShowStats.style.display = 'flex';
  } else if (screenName === 'study') {
    screenStudy.classList.add('active');
    btnShowHome.style.display = 'flex';
  } else if (screenName === 'stats') {
    screenStats.classList.add('active');
    btnShowHome.style.display = 'flex';
    updateGlobalStatsUI();
  }
}

/* -------------------------------------------------------------
 * 3. Study Session Management
 * ------------------------------------------------------------- */

function startStudySession() {
  if (!fileLoaded || dbQuestions.length === 0) {
    alert('Пожалуйста, сначала загрузите или импортируйте базу вопросов (.md).');
    return;
  }

  const category = selectCategory.value;
  const algorithm = selectAlgorithm.value;
  
  sessionQueue = prepareSession(dbQuestions, category, algorithm);
  if (sessionQueue.length === 0) {
    alert('Нет вопросов, соответствующих выбранным критериям.');
    return;
  }

  // Reset Session metrics
  currentIndex = 0;
  sessionCorrect = 0;
  sessionAttempts = 0;
  
  switchScreen('study');
  loadCard(currentIndex);
}

function loadCard(index) {
  if (index < 0 || index >= sessionQueue.length) {
    // End of session
    finishSession();
    return;
  }

  const q = sessionQueue[index];
  const qStats = getQuestionStats(q.id);
  const qType = selectQType.value;

  // Visual reset card state
  isCardFlipped = false;
  studyCard.classList.remove('flipped');

  // Populate metadata & question
  cardFrontMeta.textContent = `${q.category} • Вопрос ${q.number}`;
  cardQuestionText.textContent = q.title;

  // Star badge display
  if (q.isStarred || qStats.isDifficult) {
    cardStarred.style.display = 'block';
  } else {
    cardStarred.style.display = 'none';
  }

  // Set Difficult button active state
  if (qStats.isDifficult) {
    btnDifficult.classList.add('active');
    btnDifficult.querySelector('span').textContent = 'Сложный вопрос!';
  } else {
    btnDifficult.classList.remove('active');
    btnDifficult.querySelector('span').textContent = 'Пометить сложным';
  }

  // Parse Markdown Answers for Card Back
  // Render answers safely with Marked library
  cardShortAnswer.innerHTML = q.shortAnswer ? marked.parse(q.shortAnswer) : '<em>Отсутствует</em>';
  cardDetailedAnswer.innerHTML = q.detailedAnswer ? marked.parse(q.detailedAnswer) : '<em>Отсутствует</em>';

  // Format code highlighting
  setTimeout(() => {
    Prism.highlightAllUnder(studyCard);
  }, 50);

  // Setup mode specific panels
  setupQtypeUI(q, qType);

  // Update progress elements
  updateProgressUI();
}

function setupQtypeUI(q, qType) {
  // Hide all panels initially
  choiceContainer.style.display = 'none';
  inputContainer.style.display = 'none';
  btnAcceptAlternative.style.display = 'none';
  
  // Enable standard buttons by default
  btnCorrect.disabled = false;
  btnIncorrect.disabled = false;

  if (qType === 'choice') {
    generateMultipleChoiceOptions(q);
  } else if (qType === 'input') {
    typedAnswer.value = '';
    inputFeedback.style.display = 'none';
    inputFeedback.className = 'input-feedback';
    inputContainer.style.display = 'flex';
    btnCorrect.disabled = true; // Disabled until typed evaluation completes
    btnIncorrect.disabled = true;
  }
}

function flipCard() {
  isCardFlipped = !isCardFlipped;
  if (isCardFlipped) {
    studyCard.classList.add('flipped');
  } else {
    studyCard.classList.remove('flipped');
  }
}

function toggleCardDifficult() {
  const q = sessionQueue[currentIndex];
  if (!q) return;

  const isDiff = toggleDifficult(q.id);
  
  // Update Star icon
  const qStats = getQuestionStats(q.id);
  if (q.isStarred || isDiff) {
    cardStarred.style.display = 'block';
  } else {
    cardStarred.style.display = 'none';
  }

  // Update button visual
  if (isDiff) {
    btnDifficult.classList.add('active');
    btnDifficult.querySelector('span').textContent = 'Сложный вопрос!';
  } else {
    btnDifficult.classList.remove('active');
    btnDifficult.querySelector('span').textContent = 'Пометить сложным';
  }
}

function recordSessionProgress(isCorrect) {
  const q = sessionQueue[currentIndex];
  if (!q) return;

  // Save to stats
  recordAnswer(q.id, isCorrect);
  
  // Update session counters
  sessionAttempts++;
  if (isCorrect) {
    sessionCorrect++;
  }

  // Go to next question
  currentIndex++;
  loadCard(currentIndex);
}

function finishSession() {
  alert(`Поздравляем! Сессия завершена.\nРезультат: ${sessionCorrect} из ${sessionAttempts} правильно (${sessionAttempts > 0 ? Math.round(sessionCorrect / sessionAttempts * 100) : 0}%)`);
  switchScreen('dashboard');
}

/* -------------------------------------------------------------
 * 4. Question Types Logic (Choice & Text Input)
 * ------------------------------------------------------------- */

// Clean text helper for choice matching
function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1')    // Remove inline code ticks
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')     // Remove italics
    .replace(/[-*+]\s+/g, '')          // Remove lists
    .trim();
}

function generateMultipleChoiceOptions(q) {
  choiceContainer.innerHTML = '';
  choiceContainer.style.display = 'grid';

  let options = [];

  if (q.type === 'choice' && q.choices && q.choices.length > 0) {
    // If the question is structured as multiple choice in MD
    options = q.choices.map(c => ({
      text: c.text,
      isCorrect: c.isCorrect
    }));
  } else {
    // Generate distractors using other question answers
    const correctAnswerText = stripMarkdown(q.shortAnswer || q.title);
    options.push({ text: correctAnswerText, isCorrect: true });

    // Fetch other questions as distractors
    const distractors = dbQuestions
      .filter(other => other.id !== q.id && other.shortAnswer)
      .map(other => stripMarkdown(other.shortAnswer))
      .filter(text => text && text !== correctAnswerText);

    // Shuffle and pick 3 distractors
    const shuffledDistractors = shuffleArray(distractors);
    const selectedDistractors = shuffledDistractors.slice(0, 3);

    selectedDistractors.forEach(text => {
      options.push({ text: text, isCorrect: false });
    });

    // Handle case where we don't have enough other questions
    while (options.length < 4) {
      options.push({ text: `Неправильный вариант ${options.length}`, isCorrect: false });
    }
  }

  // Shuffle option items so correct answer isn't always first
  options = shuffleArray(options);

  // Render choice buttons
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    
    btn.addEventListener('click', () => {
      // Disable other choices
      const allBtns = choiceContainer.querySelectorAll('.option-btn');
      allBtns.forEach(b => b.disabled = true);

      // Highlight outcome
      if (opt.isCorrect) {
        btn.classList.add('correct');
        // Pre-enable navigation correct button
        btnCorrect.disabled = false;
        btnIncorrect.disabled = true;
        recordAnswer(q.id, true);
        sessionCorrect++;
        sessionAttempts++;
      } else {
        btn.classList.add('incorrect');
        // Find correct button and color it green
        allBtns.forEach(b => {
          const matchingOpt = options.find(o => o.text === b.textContent);
          if (matchingOpt && matchingOpt.isCorrect) {
            b.classList.add('correct');
          }
        });
        btnCorrect.disabled = true;
        btnIncorrect.disabled = false;
        recordAnswer(q.id, false);
        sessionAttempts++;
      }

      // Auto flip after a small delay to read explanations
      setTimeout(() => {
        if (!isCardFlipped) flipCard();
      }, 1000);
    });

    choiceContainer.appendChild(btn);
  });
}

// Evaluation for typed text inputs
btnSubmitAnswer.addEventListener('click', evaluateTypedAnswer);

function evaluateTypedAnswer() {
  const q = sessionQueue[currentIndex];
  if (!q) return;

  const typed = typedAnswer.value.trim();
  if (!typed) {
    alert('Пожалуйста, введите ответ перед проверкой.');
    return;
  }

  const qStats = getQuestionStats(q.id);
  const correctTemplate = q.shortAnswer || '';

  const isMatched = fuzzyMatch(typed, correctTemplate, qStats.acceptedAnswers || []);

  inputFeedback.style.display = 'block';
  btnSubmitAnswer.disabled = true;
  
  if (isMatched) {
    inputFeedback.textContent = '🎉 Верно! Отличный результат.';
    inputFeedback.className = 'input-feedback correct';
    btnCorrect.disabled = false;
    btnIncorrect.disabled = true;
    
    // Auto record correct answer
    recordAnswer(q.id, true);
    sessionCorrect++;
    sessionAttempts++;
    
    setTimeout(() => {
      if (!isCardFlipped) flipCard();
    }, 1200);
  } else {
    inputFeedback.textContent = `❌ Ответ не совпал с эталонным. Проверьте карточку.`;
    inputFeedback.className = 'input-feedback incorrect';
    btnCorrect.disabled = true;
    btnIncorrect.disabled = false;
    
    // Show manual acceptance button
    btnAcceptAlternative.style.display = 'block';

    // Auto record incorrect answer (user can override with manual button)
    recordAnswer(q.id, false);
    sessionAttempts++;
    
    setTimeout(() => {
      if (!isCardFlipped) flipCard();
    }, 1500);
  }
}

function acceptAlternativeAnswer() {
  const q = sessionQueue[currentIndex];
  if (!q) return;

  const typed = typedAnswer.value.trim();
  if (!typed) return;

  // Add text to accepted alternative list
  addAcceptedAnswer(q.id, typed);

  // Recalculate stats: subtract incorrect attempt and add correct attempt
  const stats = getStats();
  if (stats[q.id]) {
    if (stats[q.id].incorrectCount > 0) stats[q.id].incorrectCount--;
    stats[q.id].correctCount++;
    localStorage.setItem('vibe_prep_stats', JSON.stringify(stats));
  }

  // Correct session statistics
  sessionCorrect++;
  
  // Update feedback UI
  inputFeedback.textContent = '🎉 Ответ зачтен и добавлен в базу правильных альтернатив!';
  inputFeedback.className = 'input-feedback correct';
  btnCorrect.disabled = false;
  btnIncorrect.disabled = true;
  btnAcceptAlternative.style.display = 'none';
}

function fuzzyMatch(typed, correct, acceptedList = []) {
  const clean = (str) => {
    return str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "") // remove punctuation
      .replace(/\s+/g, " ")                           // normalize spaces
      .trim();
  };
  
  const cleanTyped = clean(typed);
  const cleanCorrect = clean(correct);
  
  if (!cleanTyped) return false;
  
  // Check exact cleaned match
  if (cleanTyped === cleanCorrect) return true;
  
  // Check custom accepted answers
  for (const accepted of acceptedList) {
    if (cleanTyped === clean(accepted)) return true;
  }

  // Check substring contains if the answer is moderate length
  if (cleanCorrect.length > 4) {
    if (cleanTyped.includes(cleanCorrect) || cleanCorrect.includes(cleanTyped)) {
      const lenDiff = Math.abs(cleanTyped.length - cleanCorrect.length);
      // If the length discrepancy is under 30%, it is highly likely correct
      if (lenDiff < cleanCorrect.length * 0.3) {
        return true;
      }
    }
  }
  
  // Levenshtein distance for typings with minor typos
  const dist = levenshteinDistance(cleanTyped, cleanCorrect);
  const maxAllowedDist = Math.max(1, Math.floor(cleanCorrect.length * 0.15)); // 15% length tolerance
  if (dist <= maxAllowedDist) {
    return true;
  }
  
  return false;
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/* -------------------------------------------------------------
 * 5. UI Updates & Statistics Rendering
 * ------------------------------------------------------------- */

function updateProgressUI() {
  const total = sessionQueue.length;
  const currentNum = currentIndex + 1;
  const pct = total > 0 ? (currentIndex / total) * 100 : 0;
  
  progressText.textContent = `Карточка ${Math.min(currentNum, total)} из ${total}`;
  progressBar.style.width = `${pct}%`;
  
  const accuracy = sessionAttempts > 0 ? Math.round((sessionCorrect / sessionAttempts) * 100) : 0;
  accuracyText.textContent = `Правильно: ${accuracy}%`;
}

function updateGlobalStatsUI() {
  const global = getGlobalStats(dbQuestions);
  statAccuracy.textContent = `${global.accuracy}%`;
  statCompleted.textContent = `${global.answeredCount}/${global.totalQuestions}`;
  statDifficult.textContent = global.totalDifficult;
  statAttempts.textContent = global.totalCorrect + global.totalIncorrect;
}

function renderStatsTable() {
  statsList.innerHTML = '';
  const query = statsSearch.value.toLowerCase().trim();
  const stats = getStats();

  const filtered = dbQuestions.filter(q => {
    return q.title.toLowerCase().includes(query) || q.category.toLowerCase().includes(query);
  });

  if (filtered.length === 0) {
    statsList.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--text-muted);">Ничего не найдено</div>';
    return;
  }

  filtered.forEach(q => {
    const qStat = stats[q.id] || { correctCount: 0, incorrectCount: 0, isDifficult: false };
    const total = qStat.correctCount + qStat.incorrectCount;
    const accuracy = total > 0 ? Math.round((qStat.correctCount / total) * 100) : 0;

    const row = document.createElement('div');
    row.className = 'stats-row';

    const info = document.createElement('div');
    info.className = 'stats-row-info';

    const title = document.createElement('div');
    title.className = 'stats-row-title';
    title.textContent = `${q.number}. ${q.title}`;
    title.title = q.title;

    const sub = document.createElement('div');
    sub.className = 'stats-row-sub';
    sub.textContent = `${q.category} • Ответы: ${total} (Точность: ${accuracy}%)`;

    info.appendChild(title);
    info.appendChild(sub);

    const meta = document.createElement('div');
    meta.className = 'stats-row-meta';

    if (qStat.correctCount > 0) {
      const bCorrect = document.createElement('span');
      bCorrect.className = 'badge-stat correct';
      bCorrect.textContent = `✓ ${qStat.correctCount}`;
      meta.appendChild(bCorrect);
    }

    if (qStat.incorrectCount > 0) {
      const bIncorrect = document.createElement('span');
      bIncorrect.className = 'badge-stat incorrect';
      bIncorrect.textContent = `✗ ${qStat.incorrectCount}`;
      meta.appendChild(bIncorrect);
    }

    if (qStat.isDifficult || q.isStarred) {
      const bDiff = document.createElement('span');
      bDiff.className = 'badge-stat difficult';
      bDiff.textContent = '★ Сложный';
      meta.appendChild(bDiff);
    }

    row.appendChild(info);
    row.appendChild(meta);
    statsList.appendChild(row);
  });
}

/* -------------------------------------------------------------
 * 6. Keyboard Shortcuts Handler
 * ------------------------------------------------------------- */

function handleKeyboardShortcuts(e) {
  // Only intercept events when study screen is active
  if (!screenStudy.classList.contains('active')) return;
  
  // Disable keyboard shortcuts when user typing in text area
  if (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT') {
    // Let Enter trigger submit in text input
    if (e.key === 'Enter' && !e.shiftKey && document.activeElement.id === 'typed-answer') {
      e.preventDefault();
      evaluateTypedAnswer();
    }
    return;
  }

  switch (e.key) {
    case ' ': // Space bar
      e.preventDefault();
      flipCard();
      break;
    case 'd':
    case 'D':
    case 'ArrowUp':
      e.preventDefault();
      toggleCardDifficult();
      break;
    case '1':
    case 'ArrowLeft':
      e.preventDefault();
      if (!btnIncorrect.disabled) {
        recordSessionProgress(false);
      }
      break;
    case '2':
    case 'ArrowRight':
      e.preventDefault();
      if (!btnCorrect.disabled) {
        recordSessionProgress(true);
      }
      break;
  }
}
