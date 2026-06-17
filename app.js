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
  resetAllStats,
  exportProgressJSON,
  importProgressJSON
} from './stats.js';
import { prepareSession } from './algorithms.js';

// Application State
let dbQuestions = [];         // All questions parsed
let sessionQueue = [];        // Questions in current study round
let currentIndex = 0;         // Current question index in sessionQueue
let sessionCorrect = 0;       // Correct count in current round
let sessionAttempts = 0;      // Total attempts in current round
let sessionAnswers = [];      // Array of true/false/null to track answers in this session
let isCardFlipped = false;    // Visual state of the card
let fileLoaded = false;       // If questions are loaded
let activeModule = null;      // Selected module metadata
let allModules = [];          // Combined list of standard and custom modules

// DOM Elements
const screenModules = document.getElementById('screen-modules');
const screenDashboard = document.getElementById('screen-dashboard');
const screenStudy = document.getElementById('screen-study');
const screenStats = document.getElementById('screen-stats');

const btnShowStats = document.getElementById('btn-show-stats');
const btnShowHome = document.getElementById('btn-show-home');
const btnResetStats = document.getElementById('btn-reset-stats');

const modulesList = document.getElementById('modules-list');
const inputModuleName = document.getElementById('input-module-name');
const inputModuleDesc = document.getElementById('input-module-desc');
const moduleDropzone = document.getElementById('module-dropzone');
const moduleFileInput = document.getElementById('module-file-input');
const moduleDropzoneText = document.getElementById('module-dropzone-text');

const btnChangeModule = document.getElementById('btn-change-module');
const currentModuleTitle = document.getElementById('current-module-title');
const currentModuleDesc = document.getElementById('current-module-desc');

const selectCategory = document.getElementById('select-category');
const selectAlgorithm = document.getElementById('select-algorithm');
const selectQType = document.getElementById('select-qtype');
const chkOnlyDifficult = document.getElementById('chk-only-difficult');

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
const btnPrevQuestion = document.getElementById('btn-prev-question');
const btnDifficult = document.getElementById('btn-difficult');
const btnAcceptAlternative = document.getElementById('btn-accept-alternative');

const btnExportProgress = document.getElementById('btn-export-progress');
const btnImportProgressTrigger = document.getElementById('btn-import-progress-trigger');
const importProgressInput = document.getElementById('import-progress-input');

const statsSearch = document.getElementById('stats-search');
const statsList = document.getElementById('stats-list');

// Global Stats elements
const statAccuracy = document.getElementById('stat-accuracy');
const statCompleted = document.getElementById('stat-completed');
const statDifficult = document.getElementById('stat-difficult');
const statAttempts = document.getElementById('stat-attempts');

/* -------------------------------------------------------------
 * 1. Startup & Module Loading
 * ------------------------------------------------------------- */

window.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupEventListeners();
  
  // 1. Load modules manifest and custom modules
  await loadModules();
  
  // 2. Check for active session
  const savedSession = localStorage.getItem('vibe_prep_active_session');
  if (savedSession) {
    try {
      const state = JSON.parse(savedSession);
      if (state && state.sessionQueue && state.sessionQueue.length > 0) {
        const mod = allModules.find(m => m.id === state.moduleId);
        if (mod) {
          activeModule = mod;
          // Load questions for the active module
          let mdText = '';
          if (activeModule.isCustom) {
            mdText = activeModule.mdText;
          } else {
            const resp = await fetch(activeModule.file);
            if (!resp.ok) throw new Error('Файл не найден');
            mdText = await resp.text();
          }
          
          dbQuestions = parseMarkdown(mdText);
          dbQuestions.forEach(q => {
            q.id = `${activeModule.id}_${q.id}`;
          });
          
          fileLoaded = true;
          sessionQueue = state.sessionQueue;
          currentIndex = state.currentIndex;
          sessionCorrect = state.sessionCorrect;
          sessionAttempts = state.sessionAttempts;
          sessionAnswers = state.sessionAnswers || new Array(sessionQueue.length).fill(null);
          
          // Restore settings
          if (state.settings) {
            selectCategory.value = state.settings.category || 'all';
            selectAlgorithm.value = state.settings.algorithm || 'sequential';
            selectQType.value = state.settings.qtype || 'free';
            chkOnlyDifficult.checked = !!state.settings.onlyDifficult;
          }
          
          populateCategories();
          
          // Update details in dashboard in case they go back
          currentModuleTitle.textContent = activeModule.name;
          currentModuleDesc.textContent = activeModule.description || '';
          
          switchScreen('study');
          loadCard(currentIndex);
          return;
        }
      }
    } catch (e) {
      console.error('Failed to restore active session', e);
      localStorage.removeItem('vibe_prep_active_session');
    }
  }
  
  // 3. Check for selected active module
  const savedModuleId = localStorage.getItem('vibe_prep_active_module_id');
  if (savedModuleId) {
    const mod = allModules.find(m => m.id === savedModuleId);
    if (mod) {
      await selectModule(mod);
      return;
    }
  }
  
  // Default: go to modules screen
  switchScreen('modules');
}

async function loadModules() {
  allModules = [];
  
  // Load standard modules from manifest
  try {
    const resp = await fetch('modules/modules.json');
    if (resp.ok) {
      const standard = await resp.json();
      allModules.push(...standard.map(m => ({ ...m, isCustom: false })));
    }
  } catch (e) {
    console.warn('Could not load standard modules manifest', e);
  }
  
  // Load custom modules from localStorage
  try {
    const custom = localStorage.getItem('vibe_prep_custom_modules');
    if (custom) {
      allModules.push(...JSON.parse(custom).map(m => ({ ...m, isCustom: true })));
    }
  } catch (e) {
    console.error('Failed to parse custom modules', e);
  }
  
  renderModulesList();
}

function renderModulesList() {
  modulesList.innerHTML = '';
  
  if (allModules.length === 0) {
    modulesList.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.9rem;">Нет доступных тем</div>';
    return;
  }
  
  allModules.forEach(mod => {
    const card = document.createElement('div');
    card.className = 'module-card';
    
    const header = document.createElement('div');
    header.className = 'module-card-header';
    
    const title = document.createElement('h3');
    title.className = 'module-card-title';
    title.textContent = mod.name;
    
    header.appendChild(title);
    
    if (mod.isCustom) {
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-module-delete';
      delBtn.title = 'Удалить тему';
      delBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card selection
        if (confirm(`Вы уверены, что хотите удалить тему "${mod.name}"? Все ее данные будут стерты.`)) {
          deleteCustomModule(mod.id);
        }
      });
      header.appendChild(delBtn);
    }
    
    const desc = document.createElement('p');
    desc.className = 'module-card-desc';
    desc.textContent = mod.description || 'Без описания';
    
    const footer = document.createElement('div');
    footer.className = 'module-card-footer';
    
    const typeLabel = document.createElement('span');
    typeLabel.className = 'brand-badge';
    typeLabel.style.fontSize = '0.7rem';
    typeLabel.textContent = mod.isCustom ? 'Пользовательская' : 'Стандартная';
    
    footer.appendChild(typeLabel);
    
    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(footer);
    
    card.addEventListener('click', () => {
      selectModule(mod);
    });
    
    modulesList.appendChild(card);
  });
}

async function selectModule(mod) {
  activeModule = mod;
  localStorage.setItem('vibe_prep_active_module_id', mod.id);
  
  // Set details in dashboard
  currentModuleTitle.textContent = mod.name;
  currentModuleDesc.textContent = mod.description || '';
  
  // Load questions
  try {
    let mdText = '';
    if (mod.isCustom) {
      mdText = mod.mdText;
    } else {
      const resp = await fetch(mod.file);
      if (!resp.ok) throw new Error('Файл не найден');
      mdText = await resp.text();
    }
    
    dbQuestions = parseMarkdown(mdText);
    dbQuestions.forEach(q => {
      q.id = `${mod.id}_${q.id}`;
    });
    
    fileLoaded = true;
    
    // Populate category dropdown
    populateCategories();
    
    switchScreen('dashboard');
  } catch (err) {
    alert(`Ошибка при загрузке темы: ${err.message}`);
    switchScreen('modules');
  }
}

function populateCategories() {
  const categories = new Set(dbQuestions.map(q => q.category));
  selectCategory.innerHTML = '<option value="all">Все вопросы</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    selectCategory.appendChild(opt);
  });
}

function deleteCustomModule(id) {
  try {
    const custom = localStorage.getItem('vibe_prep_custom_modules');
    if (custom) {
      let list = JSON.parse(custom);
      list = list.filter(m => m.id !== id);
      localStorage.setItem('vibe_prep_custom_modules', JSON.stringify(list));
      
      // If the deleted module was active, reset active module
      if (activeModule && activeModule.id === id) {
        activeModule = null;
        localStorage.removeItem('vibe_prep_active_module_id');
      }
      
      loadModules();
    }
  } catch (e) {
    console.error('Failed to delete custom module', e);
  }
}

function handleCustomModuleFile(file) {
  const name = inputModuleName.value.trim();
  const desc = inputModuleDesc.value.trim();
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const mdText = e.target.result;
      const questions = parseMarkdown(mdText);
      if (questions.length === 0) {
        throw new Error('В файле не найдено корректных вопросов. Проверьте форматирование.');
      }
      
      const newMod = {
        id: 'custom_' + Date.now(),
        name: name || file.name.replace(/\.md$/i, ''),
        description: desc || 'Пользовательская тема',
        mdText: mdText,
        isCustom: true
      };
      
      const custom = localStorage.getItem('vibe_prep_custom_modules');
      const list = custom ? JSON.parse(custom) : [];
      list.push(newMod);
      localStorage.setItem('vibe_prep_custom_modules', JSON.stringify(list));
      
      inputModuleName.value = '';
      inputModuleDesc.value = '';
      moduleDropzoneText.textContent = 'Нажмите или перетащите .md файл';
      
      loadModules();
      
      alert(`Тема "${newMod.name}" успешно загружена! (Вопросов: ${questions.length})`);
    } catch (err) {
      alert('Ошибка при разборе файла вопросов: ' + err.message);
    }
  };
  reader.readAsText(file);
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
    if (activeModule) {
      switchScreen('dashboard');
    } else {
      switchScreen('modules');
    }
  });

  document.getElementById('brand-home').addEventListener('click', () => {
    if (activeModule) {
      switchScreen('dashboard');
    } else {
      switchScreen('modules');
    }
  });

  btnChangeModule.addEventListener('click', () => {
    switchScreen('modules');
  });

  // Custom module file drag and drop
  moduleDropzone.addEventListener('click', () => moduleFileInput.click());
  
  moduleFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleCustomModuleFile(file);
  });

  moduleDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    moduleDropzone.classList.add('dragover');
  });

  moduleDropzone.addEventListener('dragleave', () => {
    moduleDropzone.classList.remove('dragover');
  });

  moduleDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    moduleDropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleCustomModuleFile(file);
  });

  // Session Start / End
  btnStartSession.addEventListener('click', startStudySession);
  btnExitStudy.addEventListener('click', () => {
    clearActiveSession();
    switchScreen('dashboard');
  });
  
  // Card interaction
  studyCard.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('textarea') || e.target.closest('a') || e.target.closest('.options-grid') || e.target.closest('.text-input-group')) {
      return;
    }
    flipCard();
  });

  // Study evaluation actions
  btnCorrect.addEventListener('click', () => recordSessionProgress(true));
  btnIncorrect.addEventListener('click', () => recordSessionProgress(false));
  btnPrevQuestion.addEventListener('click', goToPrevQuestion);
  btnDifficult.addEventListener('click', toggleCardDifficult);
  btnAcceptAlternative.addEventListener('click', acceptAlternativeAnswer);

  // Export / Import progress
  btnExportProgress.addEventListener('click', exportProgress);
  btnImportProgressTrigger.addEventListener('click', () => importProgressInput.click());
  importProgressInput.addEventListener('change', importProgress);

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
  screenModules.classList.remove('active');
  screenDashboard.classList.remove('active');
  screenStudy.classList.remove('active');
  screenStats.classList.remove('active');
  
  btnShowHome.style.display = 'none';
  btnShowStats.style.display = 'none';

  if (screenName === 'modules') {
    screenModules.classList.add('active');
  } else if (screenName === 'dashboard') {
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
    alert('Пожалуйста, сначала выберите тему.');
    return;
  }

  const category = selectCategory.value;
  const algorithm = selectAlgorithm.value;
  const onlyDifficult = chkOnlyDifficult.checked;
  
  sessionQueue = prepareSession(dbQuestions, category, algorithm, onlyDifficult);
  if (sessionQueue.length === 0) {
    if (onlyDifficult) {
      alert('Нет сложных вопросов в выбранной категории.');
    } else {
      alert('Нет вопросов, соответствующих выбранным критериям.');
    }
    return;
  }

  // Reset Session metrics
  currentIndex = 0;
  sessionCorrect = 0;
  sessionAttempts = 0;
  sessionAnswers = new Array(sessionQueue.length).fill(null);
  
  switchScreen('study');
  loadCard(currentIndex);
  saveActiveSession();
}

function saveActiveSession() {
  if (!activeModule) return;
  const sessionState = {
    moduleId: activeModule.id,
    sessionQueue,
    currentIndex,
    sessionCorrect,
    sessionAttempts,
    sessionAnswers,
    settings: {
      category: selectCategory.value,
      algorithm: selectAlgorithm.value,
      qtype: selectQType.value,
      onlyDifficult: chkOnlyDifficult.checked
    }
  };
  localStorage.setItem('vibe_prep_active_session', JSON.stringify(sessionState));
}

function clearActiveSession() {
  localStorage.removeItem('vibe_prep_active_session');
}

function goToPrevQuestion() {
  if (currentIndex <= 0) return;
  
  currentIndex--;
  
  const prevAnswer = sessionAnswers[currentIndex];
  if (prevAnswer !== null) {
    sessionAttempts--;
    if (prevAnswer === true) {
      sessionCorrect--;
    }
    sessionAnswers[currentIndex] = null;
  }
  
  loadCard(currentIndex);
  saveActiveSession();
}

function loadCard(index) {
  if (index < 0 || index >= sessionQueue.length) {
    finishSession();
    return;
  }

  const q = sessionQueue[index];
  const qStats = getQuestionStats(q.id);
  const qType = selectQType.value;

  isCardFlipped = false;
  studyCard.classList.remove('flipped');

  cardFrontMeta.textContent = `${q.category} • Вопрос ${q.number}`;
  cardQuestionText.textContent = q.title;

  if (q.isStarred || qStats.isDifficult) {
    cardStarred.style.display = 'block';
  } else {
    cardStarred.style.display = 'none';
  }

  if (qStats.isDifficult) {
    btnDifficult.classList.add('active');
    btnDifficult.querySelector('span').textContent = 'Сложный вопрос!';
  } else {
    btnDifficult.classList.remove('active');
    btnDifficult.querySelector('span').textContent = 'Пометить сложным';
  }

  cardShortAnswer.innerHTML = q.shortAnswer ? marked.parse(q.shortAnswer) : '<em>Отсутствует</em>';
  cardDetailedAnswer.innerHTML = q.detailedAnswer ? marked.parse(q.detailedAnswer) : '<em>Отсутствует</em>';

  setTimeout(() => {
    Prism.highlightAllUnder(studyCard);
  }, 50);

  setupQtypeUI(q, qType);
  updateProgressUI();
}

function setupQtypeUI(q, qType) {
  choiceContainer.style.display = 'none';
  inputContainer.style.display = 'none';
  btnAcceptAlternative.style.display = 'none';
  
  btnCorrect.disabled = false;
  btnIncorrect.disabled = false;

  if (qType === 'choice') {
    generateMultipleChoiceOptions(q);
  } else if (qType === 'input') {
    typedAnswer.value = '';
    inputFeedback.style.display = 'none';
    inputFeedback.className = 'input-feedback';
    inputContainer.style.display = 'flex';
    btnCorrect.disabled = true;
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
  
  const qStats = getQuestionStats(q.id);
  if (q.isStarred || isDiff) {
    cardStarred.style.display = 'block';
  } else {
    cardStarred.style.display = 'none';
  }

  if (isDiff) {
    btnDifficult.classList.add('active');
    btnDifficult.querySelector('span').textContent = 'Сложный вопрос!';
  } else {
    btnDifficult.classList.remove('active');
    btnDifficult.querySelector('span').textContent = 'Пометить сложным';
  }
  
  saveActiveSession();
}

function recordSessionProgress(isCorrect) {
  const q = sessionQueue[currentIndex];
  if (!q) return;

  recordAnswer(q.id, isCorrect);
  
  sessionAnswers[currentIndex] = isCorrect;
  sessionAttempts++;
  if (isCorrect) {
    sessionCorrect++;
  }

  currentIndex++;
  saveActiveSession();
  loadCard(currentIndex);
}

function finishSession() {
  alert(`Поздравляем! Сессия завершена.\nРезультат: ${sessionCorrect} из ${sessionAttempts} правильно (${sessionAttempts > 0 ? Math.round(sessionCorrect / sessionAttempts * 100) : 0}%)`);
  clearActiveSession();
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

    // Clicking on stats row starts study session at this question sequentially
    row.addEventListener('click', () => {
      sessionQueue = [...dbQuestions];
      const qIndex = dbQuestions.indexOf(q);
      if (qIndex === -1) return;

      currentIndex = qIndex;
      sessionCorrect = 0;
      sessionAttempts = 0;
      sessionAnswers = new Array(sessionQueue.length).fill(null);
      
      selectCategory.value = 'all';
      selectAlgorithm.value = 'sequential';
      chkOnlyDifficult.checked = false;

      switchScreen('study');
      loadCard(currentIndex);
      saveActiveSession();
    });

    statsList.appendChild(row);
  });
}

/* -------------------------------------------------------------
 * 6. Keyboard Shortcuts Handler
 * ------------------------------------------------------------- */

function exportProgress() {
  try {
    const json = exportProgressJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibe-prep-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Не удалось экспортировать прогресс: ' + e.message);
  }
}

function importProgress(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const jsonText = evt.target.result;
      importProgressJSON(jsonText);
      alert('Данные прогресса и тем успешно импортированы!');
      window.location.reload();
    } catch (err) {
      alert('Ошибка при импорте: ' + err.message);
    }
  };
  reader.readAsText(file);
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
    case 'Backspace':
      e.preventDefault();
      goToPrevQuestion();
      break;
  }
}
