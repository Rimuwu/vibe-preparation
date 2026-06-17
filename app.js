/**
 * Main application script.
 * Integrates parser, stats, algorithms, and updates the DOM.
 */

console.log('Preparation.vibe: app.js loaded and executing...');
window.addEventListener('error', (e) => {
  console.error('Preparation.vibe Global Error Captured:', e.message, 'at', e.filename, ':', e.lineno);
});


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
  importProgressJSON,
  getQuestionOverrides,
  getAddedQuestions,
  saveQuestionEdit,
  saveAddedQuestion
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
const screenViewer = document.getElementById('screen-viewer');
const screenLists = document.getElementById('screen-lists');

const btnShowStats = document.getElementById('btn-show-stats');
const btnShowHome = document.getElementById('btn-show-home');
const btnShowViewer = document.getElementById('btn-show-viewer');
const btnMenuToggle = document.getElementById('btn-menu-toggle');
const navButtons = document.getElementById('nav-buttons');
const btnResetStats = document.getElementById('btn-reset-stats');
const btnShareStats = document.getElementById('btn-share-stats');
const btnEditCurrentQuestion = document.getElementById('btn-edit-current-question');

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
const selectProgressFilter = document.getElementById('select-progress-filter');
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

const btnViewModule = document.getElementById('btn-view-module');
const btnViewerBack = document.getElementById('btn-viewer-back');
const viewerTitle = document.getElementById('viewer-title');
const viewerDesc = document.getElementById('viewer-desc');
const viewerQuestionsList = document.getElementById('viewer-questions-list');
const viewerSearch = document.getElementById('viewer-search');
const btnViewerToggleAll = document.getElementById('btn-viewer-toggle-all');
let isAllExpanded = true;

const btnShowLists = document.getElementById('btn-show-lists');
const listsContainer = document.getElementById('lists-container');
const btnCreateListFromScreen = document.getElementById('btn-create-list-from-screen');
const btnViewerSelectMode = document.getElementById('btn-viewer-select-mode');
const viewerSelectionPanel = document.getElementById('viewer-selection-panel');
const viewerSelectionCount = document.getElementById('viewer-selection-count');
const btnViewerCancelSelection = document.getElementById('btn-viewer-cancel-selection');
const btnViewerCreateList = document.getElementById('btn-viewer-create-list');

let isSelectionMode = false;
let selectedQuestionIds = new Set();

// Global Stats elements
const statAccuracy = document.getElementById('stat-accuracy');
const statCompleted = document.getElementById('stat-completed');
const statDifficult = document.getElementById('stat-difficult');
const statAttempts = document.getElementById('stat-attempts');

// Custom Modal & New buttons
const btnCreateEmptyModule = document.getElementById('btn-create-empty-module');
const btnViewerExportMd = document.getElementById('btn-viewer-export-md');
const btnViewerAddQuestion = document.getElementById('btn-viewer-add-question');
const viewerCategoryFilter = document.getElementById('viewer-category-filter');
const viewerDifficultyFilter = document.getElementById('viewer-difficulty-filter');
const statsCorrectFilter = document.getElementById('stats-correct-filter');
const statsDifficultyFilter = document.getElementById('stats-difficulty-filter');
const viewerCorrectFilter = document.getElementById('viewer-correct-filter');
const viewerSortBy = document.getElementById('viewer-sort-by');
const statsCategoryFilter = document.getElementById('stats-category-filter');
const statsSortBy = document.getElementById('stats-sort-by');

const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');
const modalBtnCancel = document.getElementById('modal-btn-cancel');
const modalBtnOk = document.getElementById('modal-btn-ok');

/* -------------------------------------------------------------
 * 1. Startup & Module Loading
 * ------------------------------------------------------------- */

/* -------------------------------------------------------------
 * 0. Modal & Alert/Confirm Custom Dialogs & Loading Helpers
 * ------------------------------------------------------------- */

function showModalAlert(message, title = 'Внимание') {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalBody.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
    modalBtnCancel.style.display = 'none';
    modalBtnOk.style.display = 'block';
    modalBtnOk.textContent = 'ОК';
    customModal.style.display = 'flex';
    customModal.classList.add('active');

    const cleanUp = () => {
      customModal.style.display = 'none';
      customModal.classList.remove('active');
      modalBtnOk.removeEventListener('click', onOk);
      modalClose.removeEventListener('click', onClose);
    };

    function onOk() {
      cleanUp();
      resolve();
    }
    function onClose() {
      cleanUp();
      resolve();
    }

    modalBtnOk.addEventListener('click', onOk);
    modalClose.addEventListener('click', onClose);
  });
}

function showModalConfirm(message, title = 'Подтверждение') {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalBody.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
    modalBtnCancel.style.display = 'block';
    modalBtnCancel.textContent = 'Отмена';
    modalBtnOk.style.display = 'block';
    modalBtnOk.textContent = 'ОК';
    customModal.style.display = 'flex';
    customModal.classList.add('active');

    const cleanUp = (result) => {
      customModal.style.display = 'none';
      customModal.classList.remove('active');
      modalBtnOk.removeEventListener('click', onOk);
      modalBtnCancel.removeEventListener('click', onCancel);
      modalClose.removeEventListener('click', onClose);
      resolve(result);
    };

    function onOk() {
      cleanUp(true);
    }
    function onCancel() {
      cleanUp(false);
    }
    function onClose() {
      cleanUp(false);
    }

    modalBtnOk.addEventListener('click', onOk);
    modalBtnCancel.addEventListener('click', onCancel);
    modalClose.addEventListener('click', onClose);
  });
}

function showModalEditQuestion(q, isNew = false) {
  return new Promise((resolve) => {
    modalTitle.textContent = isNew ? 'Добавить вопрос' : 'Редактировать вопрос/ответ';

    // Generate form
    modalBody.innerHTML = `
      <div class="form-group">
        <label for="edit-q-category">Раздел / Категория</label>
        <input type="text" id="edit-q-category" class="search-input" value="${q.category || 'Общее'}">
      </div>
      <div class="form-group">
        <label for="edit-q-title">Вопрос</label>
        <textarea id="edit-q-title" class="text-control" style="min-height: 80px;">${q.title || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-q-short">Краткий ответ / Код</label>
        <textarea id="edit-q-short" class="text-control" style="min-height: 120px; font-family: monospace;">${q.shortAnswer || ''}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-q-detailed">Подробное пояснение</label>
        <textarea id="edit-q-detailed" class="text-control" style="min-height: 150px;">${q.detailedAnswer || ''}</textarea>
      </div>
    `;

    modalBtnCancel.style.display = 'block';
    modalBtnCancel.textContent = 'Отмена';
    modalBtnOk.style.display = 'block';
    modalBtnOk.textContent = 'Сохранить';
    customModal.style.display = 'flex';
    customModal.classList.add('active');

    const cleanUp = (savedData) => {
      customModal.style.display = 'none';
      customModal.classList.remove('active');
      modalBtnOk.removeEventListener('click', onSave);
      modalBtnCancel.removeEventListener('click', onCancel);
      modalClose.removeEventListener('click', onClose);
      resolve(savedData);
    };

    function onSave() {
      const category = document.getElementById('edit-q-category').value.trim();
      const title = document.getElementById('edit-q-title').value.trim();
      const shortAnswer = document.getElementById('edit-q-short').value.trim();
      const detailedAnswer = document.getElementById('edit-q-detailed').value.trim();

      if (!title) {
        showModalAlert('Заголовок вопроса не может быть пустым.');
        return;
      }

      cleanUp({
        category: category || 'Общее',
        title,
        shortAnswer,
        detailedAnswer
      });
    }

    function onCancel() {
      cleanUp(null);
    }
    function onClose() {
      cleanUp(null);
    }

    modalBtnOk.addEventListener('click', onSave);
    modalBtnCancel.addEventListener('click', onCancel);
    modalClose.addEventListener('click', onClose);
  });
}

async function loadQuestionsForModule(mod) {
  let mdText = '';
  if (mod.isCustom) {
    mdText = mod.mdText;
  } else {
    const resp = await fetch(mod.file);
    if (!resp.ok) throw new Error('Файл не найден');
    mdText = await resp.text();
  }

  const questions = parseMarkdown(mdText);
  questions.forEach(q => {
    q.id = `${mod.id}_${q.id}`;
    // Apply overrides
    const overrides = getQuestionOverrides();
    if (overrides[q.id]) {
      Object.assign(q, overrides[q.id]);
    }
  });

  // Append added questions
  const added = getAddedQuestions(mod.id);
  questions.push(...added);

  return questions;
}

function updateCustomModuleMd(moduleId) {
  const mod = allModules.find(m => m.id === moduleId);
  if (mod && mod.isCustom) {
    const serialized = serializeQuestionsToMarkdown(dbQuestions, mod.name);
    mod.mdText = serialized;

    // Save to localStorage custom modules list
    const customList = allModules.filter(m => m.isCustom);
    localStorage.setItem('vibe_prep_custom_modules', JSON.stringify(customList));
  }
}

function serializeQuestionsToMarkdown(questions, moduleName) {
  let md = `# ${moduleName.toUpperCase()}\n\n`;

  // Group by category
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
      md += `### ${star}${q.number}. ${q.title}\n`;

      // If it's a multiple choice question
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
}

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

          // Load questions for the active module using helper
          dbQuestions = await loadQuestionsForModule(activeModule);

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
            if (selectProgressFilter) {
              selectProgressFilter.value = state.settings.progressFilter || 'all';
            }
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
    card.appendChild(header); // Wait, this needs module-card-header styling class!
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
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent card selection
        if (await showModalConfirm(`Вы уверены, что хотите удалить тему "${mod.name}"? Все ее данные будут стерты.`)) {
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

  // Load questions using helper
  try {
    dbQuestions = await loadQuestionsForModule(mod);
    fileLoaded = true;

    // Populate category dropdown
    populateCategories();

    switchScreen('dashboard');
  } catch (err) {
    showModalAlert(`Ошибка при загрузке темы: ${err.message}`);
    switchScreen('modules');
  }
}

function populateCategories() {
  const categories = Array.from(new Set(dbQuestions.map(q => q.category || 'Общее')));

  // Dashboard category select
  selectCategory.innerHTML = '<option value="all">Все вопросы</option>';
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    selectCategory.appendChild(opt);
  });

  // Viewer category select
  if (viewerCategoryFilter) {
    viewerCategoryFilter.innerHTML = '<option value="all">Все разделы</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      viewerCategoryFilter.appendChild(opt);
    });
  }

  // Stats category select
  if (statsCategoryFilter) {
    statsCategoryFilter.innerHTML = '<option value="all">Все разделы</option>';
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      statsCategoryFilter.appendChild(opt);
    });
  }
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
  reader.onload = async (e) => {
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

      showModalAlert(`Тема "${newMod.name}" успешно загружена! (Вопросов: ${questions.length})`);
    } catch (err) {
      showModalAlert('Ошибка при разборе файла вопросов: ' + err.message);
    }
  };
  reader.readAsText(file);
}

/* -------------------------------------------------------------
 * 2. Setup Events
 * ------------------------------------------------------------- */

function setupEventListeners() {
  if (btnShowLists) {
    btnShowLists.addEventListener('click', () => {
      switchScreen('lists');
    });
  }

  if (btnCreateListFromScreen) {
    btnCreateListFromScreen.addEventListener('click', () => {
      if (activeModule) {
        switchScreen('viewer');
        viewerTitle.textContent = `Просмотр темы: ${activeModule.name}`;
        viewerDesc.textContent = activeModule.description || '';
        viewerSearch.value = '';
        viewerCategoryFilter.value = 'all';
        viewerCorrectFilter.value = 'all';
        viewerDifficultyFilter.value = 'all';
        viewerSortBy.value = 'number_asc';
        isAllExpanded = true;
        btnViewerToggleAll.textContent = 'Свернуть все';

        // Trigger selection mode
        isSelectionMode = true;
        screenViewer.classList.add('select-mode-active');
        if (btnViewerSelectMode) {
          btnViewerSelectMode.classList.add('active');
          const span = btnViewerSelectMode.querySelector('span');
          if (span) span.textContent = 'Отменить выбор';
          btnViewerSelectMode.style.borderColor = 'var(--error)';
          btnViewerSelectMode.style.background = 'var(--error-dark)';
          btnViewerSelectMode.style.color = 'var(--error)';
        }
        selectedQuestionIds.clear();
        if (viewerSelectionCount) viewerSelectionCount.textContent = 'Выбрано вопросов: 0';
        if (viewerSelectionPanel) viewerSelectionPanel.style.display = 'flex';

        renderViewerList();
      } else {
        showModalAlert('Пожалуйста, выберите тему для подготовки на главном экране, откройте просмотр темы и соберите набор вопросов.').then(() => {
          switchScreen('modules');
        });
      }
    });
  }

  btnShowStats.addEventListener('click', () => {
    switchScreen('stats');
    // Reset filters
    statsCategoryFilter.value = 'all';
    statsCorrectFilter.value = 'all';
    statsDifficultyFilter.value = 'all';
    statsSortBy.value = 'number_asc';
    statsSearch.value = '';
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
    const isMainScreen = (screenModules && screenModules.classList.contains('active')) || 
                         (screenDashboard && screenDashboard.classList.contains('active'));
    
    if (isMainScreen) {
      window.open('https://github.com/Rimuwu/vibe-preparation', '_blank');
    } else {
      if (activeModule) {
        switchScreen('dashboard');
      } else {
        switchScreen('modules');
      }
    }
  });

  btnChangeModule.addEventListener('click', () => {
    switchScreen('modules');
  });

  btnViewModule.addEventListener('click', () => {
    switchScreen('viewer');
    viewerTitle.textContent = activeModule ? `Просмотр темы: ${activeModule.name}` : 'Просмотр темы';
    viewerDesc.textContent = activeModule ? (activeModule.description || '') : '';
    viewerSearch.value = '';
    viewerCategoryFilter.value = 'all';
    viewerCorrectFilter.value = 'all';
    viewerDifficultyFilter.value = 'all';
    viewerSortBy.value = 'number_asc';
    isAllExpanded = true;
    btnViewerToggleAll.textContent = 'Свернуть все';
    renderViewerList();
  });

  btnViewerBack.addEventListener('click', () => {
    switchScreen('dashboard');
  });

  if (btnViewerSelectMode) {
    btnViewerSelectMode.addEventListener('click', () => {
      if (!activeModule) return;
      isSelectionMode = !isSelectionMode;
      if (isSelectionMode) {
        screenViewer.classList.add('select-mode-active');
        btnViewerSelectMode.classList.add('active');
        const span = btnViewerSelectMode.querySelector('span');
        if (span) span.textContent = 'Отменить выбор';
        btnViewerSelectMode.style.borderColor = 'var(--error)';
        btnViewerSelectMode.style.background = 'var(--error-dark)';
        btnViewerSelectMode.style.color = 'var(--error)';
        selectedQuestionIds.clear();
        if (viewerSelectionCount) viewerSelectionCount.textContent = 'Выбрано вопросов: 0';
        if (viewerSelectionPanel) viewerSelectionPanel.style.display = 'flex';
        renderViewerList();
      } else {
        deactivateSelectionMode();
        renderViewerList();
      }
    });
  }

  if (btnViewerCancelSelection) {
    btnViewerCancelSelection.addEventListener('click', () => {
      deactivateSelectionMode();
      renderViewerList();
    });
  }

  if (btnViewerCreateList) {
    btnViewerCreateList.addEventListener('click', async () => {
      if (selectedQuestionIds.size === 0) {
        showModalAlert('Пожалуйста, выберите хотя бы один вопрос.');
        return;
      }

      const defaultListName = `Набор: ${activeModule.name} (${selectedQuestionIds.size} вопр.)`;
      const listName = await showModalPrompt('Введите название для нового списка вопросов:', defaultListName, 'Новый список');
      if (listName === null) {
        return;
      }

      const name = listName.trim() || defaultListName;
      try {
        const raw = localStorage.getItem('vibe_prep_custom_lists');
        const lists = raw ? JSON.parse(raw) : [];

        const newList = {
          id: 'list_' + Date.now(),
          name: name,
          moduleId: activeModule.id,
          moduleName: activeModule.name,
          questionIds: Array.from(selectedQuestionIds),
          created: Date.now()
        };

        lists.push(newList);
        localStorage.setItem('vibe_prep_custom_lists', JSON.stringify(lists));

        deactivateSelectionMode();
        showModalAlert(`Набор вопросов "${name}" успешно создан!`);
        switchScreen('lists');
      } catch (e) {
        showModalAlert('Не удалось сохранить список: ' + e.message);
      }
    });
  }

  viewerSearch.addEventListener('input', renderViewerList);
  viewerCategoryFilter.addEventListener('change', renderViewerList);
  viewerCorrectFilter.addEventListener('change', renderViewerList);
  viewerDifficultyFilter.addEventListener('change', renderViewerList);
  viewerSortBy.addEventListener('change', renderViewerList);

  statsSearch.addEventListener('input', renderStatsTable);
  statsCategoryFilter.addEventListener('change', renderStatsTable);
  statsCorrectFilter.addEventListener('change', renderStatsTable);
  statsDifficultyFilter.addEventListener('change', renderStatsTable);
  statsSortBy.addEventListener('change', renderStatsTable);

  btnViewerToggleAll.addEventListener('click', () => {
    isAllExpanded = !isAllExpanded;
    btnViewerToggleAll.textContent = isAllExpanded ? 'Свернуть все' : 'Развернуть все';

    const cards = viewerQuestionsList.querySelectorAll('.viewer-card');
    cards.forEach(card => {
      const isExpanded = card.classList.contains('expanded');
      if (isAllExpanded !== isExpanded) {
        card.click();
      }
    });
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

  // Create empty module
  btnCreateEmptyModule.addEventListener('click', async () => {
    const name = inputModuleName.value.trim();
    const desc = inputModuleDesc.value.trim();
    if (!name) {
      showModalAlert('Пожалуйста, введите название темы.');
      return;
    }

    const newMod = {
      id: 'custom_' + Date.now(),
      name: name,
      description: desc || 'Пользовательская тема',
      mdText: `# ${name}\n\n## Общее\n`,
      isCustom: true
    };

    const custom = localStorage.getItem('vibe_prep_custom_modules');
    const list = custom ? JSON.parse(custom) : [];
    list.push(newMod);
    localStorage.setItem('vibe_prep_custom_modules', JSON.stringify(list));

    inputModuleName.value = '';
    inputModuleDesc.value = '';

    await loadModules();
    showModalAlert(`Тема "${newMod.name}" успешно создана! Вы можете перейти в просмотр темы, чтобы добавить вопросы.`);
  });

  // Export module questions as MD file
  btnViewerExportMd.addEventListener('click', () => {
    if (!activeModule) return;
    try {
      const mdText = serializeQuestionsToMarkdown(dbQuestions, activeModule.name);
      const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = activeModule.name.replace(/[^a-z0-9а-яё_-]/gi, '_');
      a.download = `${safeName}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showModalAlert('Не удалось экспортировать файл: ' + e.message);
    }
  });

  // Add new question button inside viewer screen
  btnViewerAddQuestion.addEventListener('click', async () => {
    if (!activeModule) return;
    const newQ = {
      id: `${activeModule.id}_q_added_${Date.now()}`,
      number: dbQuestions.length > 0 ? Math.max(...dbQuestions.map(q => q.number)) + 1 : 1,
      category: 'Общее',
      title: '',
      shortAnswer: '',
      detailedAnswer: '',
      type: 'free',
      isStarred: false
    };

    const updated = await showModalEditQuestion(newQ, true);
    if (updated) {
      Object.assign(newQ, updated);
      dbQuestions.push(newQ);
      saveAddedQuestion(activeModule.id, newQ);

      if (activeModule.isCustom) {
        updateCustomModuleMd(activeModule.id);
      }

      populateCategories();
      renderViewerList();
      showModalAlert('Новый вопрос успешно добавлен!');
    }
  });

  // Session Start / End
  btnStartSession.addEventListener('click', startStudySession);
  btnExitStudy.addEventListener('click', async () => {
    if (await showModalConfirm('Вы уверены, что хотите завершить сессию подготовки? Текущий прогресс сессии будет сброшен.')) {
      clearActiveSession();
      switchScreen('dashboard');
    }
  });

  // Card interaction
  studyCard.addEventListener('click', (e) => {
    if (e.target.closest('button') || e.target.closest('textarea') || e.target.closest('a') || e.target.closest('.options-grid') || e.target.closest('.text-input-group')) {
      return;
    }
    flipCard();
  });

  // Edit current question/answer
  if (btnEditCurrentQuestion) {
    btnEditCurrentQuestion.addEventListener('click', async () => {
      const q = sessionQueue[currentIndex];
      if (!q) return;

      const updated = await showModalEditQuestion(q, false);
      if (updated) {
        Object.assign(q, updated);
        saveQuestionEdit(activeModule.id, q.id, updated);
        
        if (activeModule.isCustom) {
          updateCustomModuleMd(activeModule.id);
        }
        
        loadCard(currentIndex);
        showModalAlert('Вопрос успешно сохранен!');
      }
    });
  }

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

  // Stats Reset
  btnResetStats.addEventListener('click', async () => {
    if (await showModalConfirm('Вы уверены, что хотите сбросить всю статистику? Это действие необратимо.')) {
      resetAllStats();
      updateGlobalStatsUI();
      renderStatsTable();
    }
  });

  // Share Progress Image
  btnShareStats.addEventListener('click', generateStatsShareCard);

  // Keyboard Shortcuts (PC)
  document.addEventListener('keydown', handleKeyboardShortcuts);

  // Close modal when clicking on the overlay (outside the content area)
  customModal.addEventListener('click', (e) => {
    if (e.target === customModal) {
      modalClose.click();
    }
  });

  // Show active module viewer screen from header navigation
  if (btnShowViewer) {
    btnShowViewer.addEventListener('click', () => {
      if (!activeModule) {
        showModalAlert('Пожалуйста, сначала выберите тему на главном экране.');
        return;
      }

      switchScreen('viewer');
      viewerTitle.textContent = `Просмотр темы: ${activeModule.name}`;
      viewerDesc.textContent = activeModule.description || '';
      viewerSearch.value = '';
      viewerCategoryFilter.value = 'all';
      viewerCorrectFilter.value = 'all';
      viewerDifficultyFilter.value = 'all';
      viewerSortBy.value = 'number_asc';
      isAllExpanded = true;
      btnViewerToggleAll.textContent = 'Свернуть все';
      renderViewerList();

      if (navButtons) navButtons.classList.remove('active');
    });
  }

  // Toggle burger menu on mobile
  if (btnMenuToggle && navButtons) {
    btnMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navButtons.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!navButtons.contains(e.target) && e.target !== btnMenuToggle) {
        navButtons.classList.remove('active');
      }
    });
  }

  // Auto-close mobile burger menu when other top navigation buttons are clicked
  if (navButtons) {
    const navBtnElements = navButtons.querySelectorAll('button');
    navBtnElements.forEach(btn => {
      if (btn.id !== 'btn-show-viewer') {
        btn.addEventListener('click', () => {
          navButtons.classList.remove('active');
        });
      }
    });
  }
}


function switchScreen(screenName) {
  console.log(`[Preparation.vibe] switchScreen: switching to "${screenName}"`);

  const brandHome = document.getElementById('brand-home');
  if (brandHome) {
    const isMainScreen = (screenName === 'modules' || screenName === 'dashboard');
    if (isMainScreen) {
      brandHome.classList.add('repo-link-active');
    } else {
      brandHome.classList.remove('repo-link-active');
    }
  }

  // Clear study session when navigating away from the study screen
  if (screenStudy && screenStudy.classList.contains('active') && screenName !== 'study') {
    clearActiveSession();
  }

  if (screenModules) screenModules.classList.remove('active');
  if (screenDashboard) screenDashboard.classList.remove('active');
  if (screenStudy) screenStudy.classList.remove('active');
  if (screenStats) screenStats.classList.remove('active');
  if (screenViewer) screenViewer.classList.remove('active');
  if (screenLists) screenLists.classList.remove('active');

  if (screenName === 'modules') {
    if (screenModules) screenModules.classList.add('active');
    console.log('[Preparation.vibe] screenModules activated');
  } else if (screenName === 'dashboard') {
    if (screenDashboard) screenDashboard.classList.add('active');
    console.log('[Preparation.vibe] screenDashboard activated');
  } else if (screenName === 'study') {
    if (screenStudy) screenStudy.classList.add('active');
    console.log('[Preparation.vibe] screenStudy activated');
  } else if (screenName === 'stats') {
    if (screenStats) screenStats.classList.add('active');
    updateGlobalStatsUI();
    console.log('[Preparation.vibe] screenStats activated');
  } else if (screenName === 'viewer') {
    if (screenViewer) screenViewer.classList.add('active');
    console.log('[Preparation.vibe] screenViewer activated');
  } else if (screenName === 'lists') {
    if (screenLists) screenLists.classList.add('active');
    console.log('[Preparation.vibe] screenLists activated. Rendering lists...');
    renderListsScreen();
  } else {
    console.warn(`[Preparation.vibe] Unknown screen: "${screenName}"`);
  }
}

/* -------------------------------------------------------------
 * 3. Study Session Management
 * ------------------------------------------------------------- */

function startStudySession() {
  if (!fileLoaded) {
    showModalAlert('Пожалуйста, сначала выберите тему.');
    return;
  }
  if (dbQuestions.length === 0) {
    showModalAlert('В этой теме пока нет вопросов. Вы можете добавить вопросы на странице просмотра темы.');
    return;
  }

  const category = selectCategory.value;
  const algorithm = selectAlgorithm.value;
  const onlyDifficult = chkOnlyDifficult.checked;
  const progressFilter = selectProgressFilter.value;

  sessionQueue = prepareSession(dbQuestions, category, algorithm, onlyDifficult, progressFilter);
  if (sessionQueue.length === 0) {
    if (onlyDifficult) {
      showModalAlert('Нет сложных вопросов в выбранной категории.');
    } else {
      showModalAlert('Нет вопросов, соответствующих выбранным критериям.');
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
      onlyDifficult: chkOnlyDifficult.checked,
      progressFilter: selectProgressFilter.value
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

  const isDiff = qStats.isDifficult !== undefined ? qStats.isDifficult : q.isStarred;

  if (isDiff) {
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

  // Clear answers immediately to avoid spoilers during flip back transition
  cardShortAnswer.innerHTML = '';
  cardDetailedAnswer.innerHTML = '';

  // Populate answers after flip transition is complete (invisible to user)
  setTimeout(() => {
    if (sessionQueue[currentIndex] && sessionQueue[currentIndex].id === q.id) {
      cardShortAnswer.innerHTML = q.shortAnswer ? marked.parse(q.shortAnswer) : '<em>Отсутствует</em>';
      cardDetailedAnswer.innerHTML = q.detailedAnswer ? marked.parse(q.detailedAnswer) : '<em>Отсутствует</em>';
      Prism.highlightAllUnder(studyCard);
    }
  }, 400);

  setTimeout(() => {
    Prism.highlightAllUnder(studyCard);
  }, 50);

  setupQtypeUI(q, qType);
  updateProgressUI();
}

function setupQtypeUI(q, qType) {
  choiceContainer.style.display = 'none';
  inputContainer.style.display = 'none';
  document.getElementById('free-input-container').style.display = 'none';
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
  } else if (qType === 'free') {
    document.getElementById('free-typed-answer').value = '';
    document.getElementById('free-input-container').style.display = 'flex';
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

  const isDiff = toggleDifficult(q.id, q.isStarred);

  if (isDiff) {
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
  showModalAlert(`Поздравляем! Сессия завершена.\nРезультат: ${sessionCorrect} из ${sessionAttempts} правильно (${sessionAttempts > 0 ? Math.round(sessionCorrect / sessionAttempts * 100) : 0}%)`);
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
    showModalAlert('Пожалуйста, введите ответ перед проверкой.');
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

function sortQuestions(questions, sortBy, stats) {
  return [...questions].sort((a, b) => {
    const statA = stats[a.id] || { correctCount: 0, incorrectCount: 0 };
    const statB = stats[b.id] || { correctCount: 0, incorrectCount: 0 };

    const totalA = statA.correctCount + statA.incorrectCount;
    const totalB = statB.correctCount + statB.incorrectCount;
    const accA = totalA > 0 ? (statA.correctCount / totalA) : 0;
    const accB = totalB > 0 ? (statB.correctCount / totalB) : 0;

    const isDiffA = (statA.isDifficult !== undefined ? statA.isDifficult : a.isStarred) ? 1 : 0;
    const isDiffB = (statB.isDifficult !== undefined ? statB.isDifficult : b.isStarred) ? 1 : 0;

    switch (sortBy) {
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
}

function renderStatsTable() {
  statsList.innerHTML = '';
  const query = statsSearch.value.toLowerCase().trim();
  const categoryFilter = statsCategoryFilter.value;
  const correctFilter = statsCorrectFilter.value;
  const diffFilter = statsDifficultyFilter.value;
  const sortBy = statsSortBy.value;
  const stats = getStats();

  let filtered = dbQuestions.filter(q => {
    // 1. Text Search query
    const matchQuery = q.title.toLowerCase().includes(query) || q.category.toLowerCase().includes(query);
    if (!matchQuery) return false;

    // 2. Category Filter
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;

    const qStat = stats[q.id] || { correctCount: 0, incorrectCount: 0 };
    const hasCorrect = qStat.correctCount > 0;
    const hasIncorrect = qStat.incorrectCount > 0;
    const isUnanswered = qStat.correctCount === 0 && qStat.incorrectCount === 0;

    // 3. Correctness Filter
    if (correctFilter === 'correct' && !hasCorrect) return false;
    if (correctFilter === 'incorrect' && !hasIncorrect) return false;
    if (correctFilter === 'unanswered' && !isUnanswered) return false;

    // 4. Difficulty Filter
    const isDiff = qStat.isDifficult !== undefined ? qStat.isDifficult : q.isStarred;
    if (diffFilter === 'difficult' && !isDiff) return false;
    if (diffFilter === 'normal' && isDiff) return false;

    return true;
  });

  // Apply Sorting
  filtered = sortQuestions(filtered, sortBy, stats);

  if (filtered.length === 0) {
    statsList.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--text-muted);">Ничего не найдено</div>';
    return;
  }

  filtered.forEach(q => {
    const qStat = stats[q.id] || { correctCount: 0, incorrectCount: 0 };
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

    const isDiff = qStat.isDifficult !== undefined ? qStat.isDifficult : q.isStarred;
    if (isDiff) {
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
    showModalAlert('Не удалось экспортировать прогресс: ' + e.message);
  }
}

function importProgress(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const jsonText = evt.target.result;
      importProgressJSON(jsonText);
      await showModalAlert('Данные прогресса и тем успешно импортированы!');
      window.location.reload();
    } catch (err) {
      showModalAlert('Ошибка при импорте: ' + err.message);
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

function renderViewerList() {
  viewerQuestionsList.innerHTML = '';
  const query = viewerSearch.value.toLowerCase().trim();
  const categoryFilter = viewerCategoryFilter.value;
  const correctFilter = viewerCorrectFilter.value;
  const diffFilter = viewerDifficultyFilter.value;
  const sortBy = viewerSortBy.value;
  const stats = getStats();

  let filtered = dbQuestions.filter(q => {
    // 1. Text Search query
    const matchQuery = q.title.toLowerCase().includes(query) || q.category.toLowerCase().includes(query);
    if (!matchQuery) return false;

    // 2. Category Filter
    if (categoryFilter !== 'all' && q.category !== categoryFilter) return false;

    const qStats = getQuestionStats(q.id);
    const hasCorrect = qStats.correctCount > 0;
    const hasIncorrect = qStats.incorrectCount > 0;
    const isUnanswered = qStats.correctCount === 0 && qStats.incorrectCount === 0;

    // 3. Correctness Filter
    if (correctFilter === 'correct' && !hasCorrect) return false;
    if (correctFilter === 'incorrect' && !hasIncorrect) return false;
    if (correctFilter === 'unanswered' && !isUnanswered) return false;

    // 4. Difficulty Filter
    const isDiff = qStats.isDifficult !== undefined ? qStats.isDifficult : q.isStarred;
    if (diffFilter === 'difficult' && !isDiff) return false;
    if (diffFilter === 'normal' && isDiff) return false;

    return true;
  });

  // Apply Sorting
  filtered = sortQuestions(filtered, sortBy, stats);

  if (filtered.length === 0) {
    viewerQuestionsList.innerHTML = '<div style="text-align:center; padding:1.5rem; color:var(--text-muted);">Ничего не найдено</div>';
    return;
  }

  filtered.forEach(q => {
    const qStats = getQuestionStats(q.id);
    const total = qStats.correctCount + qStats.incorrectCount;
    const accuracy = total > 0 ? Math.round((qStats.correctCount / total) * 100) : null;

    const card = document.createElement('div');
    card.className = 'viewer-card';
    card.dataset.id = q.id;
    if (isSelectionMode && selectedQuestionIds.has(q.id)) {
      card.classList.add('selected');
    }

    // Header
    const header = document.createElement('div');
    header.className = 'viewer-card-header';

    const titleRow = document.createElement('div');
    titleRow.className = 'viewer-card-title-row';
    header.appendChild(titleRow);

    // Checkbox for selection mode
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'viewer-select-checkbox';
    chk.checked = selectedQuestionIds.has(q.id);
    chk.addEventListener('change', (e) => {
      e.stopPropagation();
      toggleQuestionSelection(q.id, chk.checked, card);
    });
    titleRow.appendChild(chk);

    const title = document.createElement('h3');
    title.className = 'viewer-card-title';
    title.textContent = `${q.number}. ${q.title}`;
    titleRow.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'viewer-card-meta';

    // Category badge goes to the meta row now
    const categoryBadge = document.createElement('span');
    categoryBadge.className = 'brand-badge';
    categoryBadge.style.fontSize = '0.75rem';
    categoryBadge.textContent = q.category;
    meta.appendChild(categoryBadge);

    // Accuracy badge
    const accuracyBadge = document.createElement('span');
    if (accuracy !== null) {
      accuracyBadge.className = `badge-stat ${accuracy >= 70 ? 'correct' : (accuracy >= 40 ? 'warning' : 'incorrect')}`;
      accuracyBadge.textContent = `${accuracy}% (${qStats.correctCount}/${total})`;
    } else {
      accuracyBadge.className = 'badge-stat neutral';
      accuracyBadge.textContent = 'Нет попыток';
    }

    // Difficulty star toggle button
    const starBtn = document.createElement('button');
    const isDiff = qStats.isDifficult !== undefined ? qStats.isDifficult : q.isStarred;
    starBtn.className = `viewer-star-btn ${isDiff ? 'active' : ''}`;
    starBtn.title = isDiff ? 'Сложный вопрос!' : 'Пометить сложным';
    starBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${isDiff ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `;

    starBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevent card toggling
      const isDiffVal = toggleDifficult(q.id, q.isStarred);
      qStats.isDifficult = isDiffVal;

      // Update star button state
      starBtn.className = `viewer-star-btn ${isDiffVal ? 'active' : ''}`;
      starBtn.title = isDiffVal ? 'Сложный вопрос!' : 'Пометить сложным';
      const svg = starBtn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', isDiffVal ? 'currentColor' : 'none');
      }

      // Update global stats UI
      updateGlobalStatsUI();
    });

    // Question edit button next to starBtn
    const editBtn = document.createElement('button');
    editBtn.className = 'viewer-star-btn viewer-edit-btn';
    editBtn.title = 'Редактировать вопрос / ответ';
    editBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', async (e) => {
      e.stopPropagation(); // prevent card toggling
      const updated = await showModalEditQuestion(q, false);
      if (updated) {
        Object.assign(q, updated);
        saveQuestionEdit(activeModule.id, q.id, updated);

        if (activeModule.isCustom) {
          updateCustomModuleMd(activeModule.id);
        }

        populateCategories();
        renderViewerList();
        showModalAlert('Вопрос успешно сохранен!');
      }
    });

    // Expand/Collapse Chevron icon
    const toggleIcon = document.createElement('div');
    toggleIcon.className = 'viewer-card-toggle-icon';
    toggleIcon.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    `;

    const metaRight = document.createElement('div');
    metaRight.className = 'viewer-card-meta-right';
    metaRight.appendChild(accuracyBadge);
    metaRight.appendChild(starBtn);
    metaRight.appendChild(editBtn);
    metaRight.appendChild(toggleIcon);

    meta.appendChild(metaRight);

    header.appendChild(meta);

    // Body
    const body = document.createElement('div');
    body.className = 'viewer-card-body';

    const bodySection = document.createElement('div');
    bodySection.className = 'viewer-card-body-section';

    // Flag to track if markdown is parsed for this card
    let isParsed = false;

    const parseAndRenderContent = () => {
      if (isParsed) return;
      isParsed = true;
      bodySection.innerHTML = '';

      // Short Answer
      const shortSec = document.createElement('div');
      shortSec.innerHTML = `<h4 style="font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; margin-bottom: 0.5rem;">Краткий ответ / Код</h4>`;
      const shortText = document.createElement('div');
      shortText.className = 'answer-text markdown-body';
      shortText.innerHTML = q.shortAnswer ? marked.parse(q.shortAnswer) : '<em>Отсутствует</em>';
      shortSec.appendChild(shortText);
      bodySection.appendChild(shortSec);

      // Detailed Answer
      if (q.detailedAnswer) {
        const detailedSec = document.createElement('div');
        detailedSec.innerHTML = `<h4 style="font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; margin-bottom: 0.5rem; margin-top: 0.75rem;">Подробное пояснение</h4>`;
        const detailedText = document.createElement('div');
        detailedText.className = 'answer-text markdown-body';
        detailedText.innerHTML = marked.parse(q.detailedAnswer);
        detailedSec.appendChild(detailedText);
        bodySection.appendChild(detailedSec);
      }

      // If it's a multiple choice question, list the choices
      if (q.type === 'choice' && q.choices && q.choices.length > 0) {
        const choiceSec = document.createElement('div');
        choiceSec.innerHTML = `<h4 style="font-size: 0.75rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.25rem; margin-bottom: 0.5rem; margin-top: 0.75rem;">Варианты ответа</h4>`;
        const choiceList = document.createElement('ul');
        choiceList.style.listStyleType = 'none';
        choiceList.style.paddingLeft = '0';
        choiceList.style.display = 'flex';
        choiceList.style.flexDirection = 'column';
        choiceList.style.gap = '0.35rem';
        q.choices.forEach(c => {
          const item = document.createElement('li');
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '0.5rem';
          item.style.fontSize = '0.9rem';
          item.innerHTML = `
            <span style="color: ${c.isCorrect ? 'var(--success)' : 'var(--error)'}; font-weight: bold;">
              ${c.isCorrect ? '✓' : '✗'}
            </span>
            <span style="color: ${c.isCorrect ? '#ffffff' : 'var(--text-muted)'};">
              ${c.text}
            </span>
          `;
          choiceList.appendChild(item);
        });
        choiceSec.appendChild(choiceList);
        bodySection.appendChild(choiceSec);
      }

      // Highlight syntax inside this card
      Prism.highlightAllUnder(bodySection);
    };

    body.appendChild(bodySection);

    card.appendChild(header);
    card.appendChild(body);

    // Toggle expand collapse
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a') || e.target.closest('textarea') || e.target.closest('.viewer-select-checkbox')) {
        return;
      }
      if (isSelectionMode) {
        const checkbox = card.querySelector('.viewer-select-checkbox');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          toggleQuestionSelection(q.id, checkbox.checked, card);
        }
        return;
      }
      const isExpanded = card.classList.toggle('expanded');
      if (isExpanded) {
        parseAndRenderContent();
      }
    });

    if (isAllExpanded) {
      card.classList.add('expanded');
      parseAndRenderContent();
    }

    viewerQuestionsList.appendChild(card);
  });
}

function deactivateSelectionMode() {
  isSelectionMode = false;
  selectedQuestionIds.clear();
  if (btnViewerSelectMode) {
    btnViewerSelectMode.classList.remove('active');
    btnViewerSelectMode.querySelector('span').textContent = 'Собрать набор';
    btnViewerSelectMode.style.borderColor = 'var(--warning)';
    btnViewerSelectMode.style.background = 'var(--warning-dark)';
    btnViewerSelectMode.style.color = 'var(--warning)';
  }
  if (viewerSelectionPanel) {
    viewerSelectionPanel.style.display = 'none';
  }
  if (screenViewer) {
    screenViewer.classList.remove('select-mode-active');
  }
}

function toggleQuestionSelection(qId, isChecked, cardElement) {
  if (isChecked) {
    selectedQuestionIds.add(qId);
    if (cardElement) cardElement.classList.add('selected');
  } else {
    selectedQuestionIds.delete(qId);
    if (cardElement) cardElement.classList.remove('selected');
  }
  viewerSelectionCount.textContent = `Выбрано вопросов: ${selectedQuestionIds.size}`;
}

function showModalPrompt(message, defaultValue = '', title = 'Ввод') {
  return new Promise((resolve) => {
    modalTitle.textContent = title;
    modalBody.innerHTML = `
      <div class="form-group">
        <label for="prompt-input">${message}</label>
        <input type="text" id="prompt-input" class="search-input" value="${defaultValue}">
      </div>
    `;
    modalBtnCancel.style.display = 'block';
    modalBtnCancel.textContent = 'Отмена';
    modalBtnOk.style.display = 'block';
    modalBtnOk.textContent = 'Сохранить';
    customModal.style.display = 'flex';
    customModal.classList.add('active');

    setTimeout(() => {
      const input = document.getElementById('prompt-input');
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);

    const cleanUp = (value) => {
      customModal.style.display = 'none';
      customModal.classList.remove('active');
      modalBtnOk.removeEventListener('click', onSave);
      modalBtnCancel.removeEventListener('click', onCancel);
      modalClose.removeEventListener('click', onClose);
      resolve(value);
    };

    function onSave() {
      const val = document.getElementById('prompt-input').value.trim();
      cleanUp(val);
    }
    function onCancel() {
      cleanUp(null);
    }
    function onClose() {
      cleanUp(null);
    }

    modalBtnOk.addEventListener('click', onSave);
    modalBtnCancel.addEventListener('click', onCancel);
    modalClose.addEventListener('click', onClose);
  });
}

function renderListsScreen() {
  const container = listsContainer || document.getElementById('lists-container');
  if (!container) {
    console.error('listsContainer element not found');
    return;
  }
  container.innerHTML = '';

  let lists = [];
  try {
    const raw = localStorage.getItem('vibe_prep_custom_lists');
    console.log('raw custom lists data from localStorage:', raw);
    lists = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load custom lists', e);
  }

  console.log('Parsed custom lists count:', Array.isArray(lists) ? lists.length : 'not an array');


  if (!Array.isArray(lists) || lists.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:2rem 1.5rem; color:var(--text-muted); font-size:0.95rem;">
        У вас пока нет созданных наборов вопросов.<br>
        Вы можете собрать их на странице просмотра вопросов темы.
      </div>
    `;
    return;
  }

  lists.forEach(list => {
    try {
      if (!list || typeof list !== 'object') return;

      const card = document.createElement('div');
      card.className = 'list-card';
      card.dataset.id = list.id || '';

      const header = document.createElement('div');
      header.className = 'list-card-header';

      const titleGroup = document.createElement('div');
      titleGroup.className = 'list-card-title-group';

      const title = document.createElement('h3');
      title.className = 'list-card-title';
      title.textContent = list.name || 'Без названия';

      const subtitle = document.createElement('span');
      subtitle.className = 'list-card-subtitle';
      const count = (list.questionIds || []).length;
      subtitle.textContent = `Тема: ${list.moduleName || 'Неизвестно'} • Вопросов: ${count}`;

      titleGroup.appendChild(title);
      titleGroup.appendChild(subtitle);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-module-delete';
      delBtn.title = 'Удалить набор';
      delBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (await showModalConfirm(`Вы уверены, что хотите удалить набор "${list.name || 'Без названия'}"?`)) {
          deleteCustomList(list.id);
        }
      });

      header.appendChild(titleGroup);
      header.appendChild(delBtn);

      const actions = document.createElement('div');
      actions.className = 'list-card-actions';

      const solveBtn = document.createElement('button');
      solveBtn.className = 'btn-primary';
      solveBtn.style.padding = '0.5rem 1.25rem';
      solveBtn.style.fontSize = '0.85rem';
      solveBtn.style.width = 'auto';
      solveBtn.innerHTML = `
        Решать
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      `;
      solveBtn.addEventListener('click', () => {
        startCustomListSession(list);
      });

      actions.appendChild(solveBtn);

      card.appendChild(header);
      card.appendChild(actions);

      container.appendChild(card);
    } catch (err) {
      console.error('Error rendering individual list card:', err, list);
    }
  });
}

function deleteCustomList(listId) {
  try {
    const raw = localStorage.getItem('vibe_prep_custom_lists');
    let lists = raw ? JSON.parse(raw) : [];
    if (Array.isArray(lists)) {
      lists = lists.filter(l => l && l.id !== listId);
      localStorage.setItem('vibe_prep_custom_lists', JSON.stringify(lists));
    }
    renderListsScreen();
  } catch (e) {
    console.error('Failed to delete custom list', e);
  }
}

async function startCustomListSession(list) {
  if (!list || !list.moduleId) {
    showModalAlert('Неверные данные набора вопросов.');
    return;
  }
  const mod = allModules.find(m => m.id === list.moduleId);
  if (!mod) {
    showModalAlert('Тема, к которой относится этот набор, больше не существует.');
    return;
  }

  try {
    dbQuestions = await loadQuestionsForModule(mod);
    fileLoaded = true;
    activeModule = mod;
    localStorage.setItem('vibe_prep_active_module_id', mod.id);
    populateCategories();

    const questionIds = list.questionIds || [];
    const filteredQuestions = dbQuestions.filter(q => questionIds.includes(q.id));
    if (filteredQuestions.length === 0) {
      showModalAlert('В этом наборе не найдено подходящих вопросов. Возможно, они были удалены из темы.');
      return;
    }

    sessionQueue = filteredQuestions;
    currentIndex = 0;
    sessionCorrect = 0;
    sessionAttempts = 0;
    sessionAnswers = new Array(sessionQueue.length).fill(null);

    selectCategory.value = 'all';
    selectAlgorithm.value = 'sequential';
    if (selectProgressFilter) selectProgressFilter.value = 'all';
    chkOnlyDifficult.checked = false;

    switchScreen('study');
    loadCard(currentIndex);
    saveActiveSession();
  } catch (e) {
    showModalAlert('Не удалось загрузить вопросы: ' + e.message);
  }
}

function generateStatsShareCard() {
  if (!activeModule) {
    showModalAlert('Сначала выберите тему для подготовки.');
    return;
  }

  const global = getGlobalStats(dbQuestions);

  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, 1200, 900);
  grad.addColorStop(0, '#121212');
  grad.addColorStop(1, '#1e1f20');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 900);

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

  ctx.strokeStyle = '#3c4043';
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 1140, 840);

  ctx.fillStyle = '#8ab4f8';
  ctx.fillRect(30, 30, 12, 840);

  ctx.font = 'bold 36px Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const logoText = 'Preparation.vibe';
  ctx.fillText(logoText, 80, 100);
  const logoWidth = ctx.measureText(logoText).width;

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

  ctx.textAlign = 'right';
  ctx.font = '30px Roboto, sans-serif';
  ctx.fillStyle = '#9e9e9e';
  const dateStr = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.fillText(dateStr, 1130, 96);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#9e9e9e';
  ctx.font = '30px Roboto, sans-serif';
  ctx.fillText('ТЕМА ПОДГОТОВКИ', 80, 200);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Roboto, sans-serif';
  const moduleTitle = activeModule.name;
  wrapText(ctx, moduleTitle, 80, 265, 1040, 64);

  ctx.strokeStyle = 'rgba(60, 64, 67, 0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 370);
  ctx.lineTo(1120, 370);
  ctx.stroke();

  const completionPct = global.totalQuestions > 0 ? Math.round((global.answeredCount / global.totalQuestions) * 100) : 0;
  const ringX = 300;
  const ringY = 620;
  const radius = 150;

  ctx.strokeStyle = '#2d2e30';
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(ringX, ringY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#81c995';
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * (completionPct / 100));
  ctx.arc(ringX, ringY, radius, startAngle, endAngle);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 78px Roboto, sans-serif';
  ctx.fillText(`${completionPct}%`, ringX, ringY - 15);

  ctx.font = '28px Roboto, sans-serif';
  ctx.fillStyle = '#9e9e9e';
  ctx.fillText('Изучено', ringX, ringY + 45);

  const startX = 600;
  const startY = 460;
  const rowHeight = 100;

  const items = [
    { label: 'Точность ответов', value: `${global.accuracy}%`, color: '#8ab4f8' },
    { label: 'Вопросов изучено', value: `${global.answeredCount} из ${global.totalQuestions}`, color: '#ffffff' },
    { label: 'Сложные вопросы', value: `${global.totalDifficult}`, color: '#fdd663' },
    { label: 'Всего попыток', value: `${global.totalCorrect + global.totalIncorrect}`, color: '#ffffff' }
  ];

  ctx.textAlign = 'left';
  items.forEach((item, idx) => {
    const y = startY + (idx * rowHeight);

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(startX, y - 12, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '30px Roboto, sans-serif';
    ctx.fillStyle = '#9e9e9e';
    ctx.fillText(item.label, startX + 30, y);

    ctx.font = 'bold 36px Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(item.value, startX + 370, y);
  });

  ctx.textAlign = 'center';
  ctx.font = '26px Roboto, sans-serif';
  ctx.fillStyle = '#5f6368';
  ctx.fillText('Подготовлено на платформе rimuwu.github.io/vibe-preparation/', 600, 840);

  const imgUrl = canvas.toDataURL('image/png');
  showModalShareCard(imgUrl, canvas);
}

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

function showModalShareCard(imgUrl, canvasElement) {
  modalTitle.textContent = 'Карточка прогресса';
  modalBody.innerHTML = `
    <p style="margin-bottom:0.75rem; font-size:0.9rem; color:var(--text-muted);">
      Вот ваша карточка прогресса. Вы можете сохранить её или скопировать в буфер обмена!
    </p>
    <img src="${imgUrl}" class="share-image-preview" alt="Preparation.vibe Progress">
  `;
  modalBtnCancel.style.display = 'block';
  modalBtnCancel.textContent = 'Закрыть';
  modalBtnOk.style.display = 'block';
  modalBtnOk.textContent = 'Скачать';

  // Create and insert a Copy button in the footer dynamically
  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn-action';
  copyBtn.style.borderRadius = 'var(--radius-sm)';
  copyBtn.style.border = '1px solid var(--primary)';
  copyBtn.style.background = 'var(--primary-dark)';
  copyBtn.style.color = 'var(--primary)';
  copyBtn.style.fontSize = '0.9rem';
  copyBtn.style.padding = '0.6rem 1.25rem';
  copyBtn.textContent = 'Копировать';

  const footer = document.getElementById('modal-footer');
  footer.insertBefore(copyBtn, modalBtnOk);

  customModal.style.display = 'flex';
  customModal.classList.add('active');

  const cleanUp = () => {
    customModal.style.display = 'none';
    customModal.classList.remove('active');
    modalBtnOk.removeEventListener('click', onDownload);
    modalBtnCancel.removeEventListener('click', onClose);
    modalClose.removeEventListener('click', onClose);
    copyBtn.remove();
  };

  function onDownload() {
    const a = document.createElement('a');
    a.href = imgUrl;
    const safeName = activeModule ? activeModule.name.replace(/[^a-z0-9а-яё_-]/gi, '_') : 'stats';
    a.download = `vibe-prep-progress-${safeName}.png`;
    a.click();
    cleanUp();
  }

  function onCopy() {
    canvasElement.toBlob((blob) => {
      if (!blob) {
        showModalAlert('Не удалось создать изображение для копирования.');
        return;
      }
      navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]).then(() => {
        copyBtn.textContent = 'Скопировано! ✓';
        copyBtn.style.color = 'var(--success)';
        copyBtn.style.borderColor = 'var(--success)';
        copyBtn.style.background = 'var(--success-dark)';
        setTimeout(() => {
          if (document.body.contains(copyBtn)) {
            copyBtn.textContent = 'Копировать';
            copyBtn.style.color = 'var(--primary)';
            copyBtn.style.borderColor = 'var(--primary)';
            copyBtn.style.background = 'var(--primary-dark)';
          }
        }, 2000);
      }).catch(err => {
        console.error(err);
        showModalAlert('Не удалось скопировать в буфер. Проверьте разрешения браузера.');
      });
    }, 'image/png');
  }

  function onClose() {
    cleanUp();
  }

  copyBtn.addEventListener('click', onCopy);
  modalBtnOk.addEventListener('click', onDownload);
  modalBtnCancel.addEventListener('click', onClose);
  modalClose.addEventListener('click', onClose);
}

