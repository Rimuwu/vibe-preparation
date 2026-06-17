/**
 * Statistics and localStorage management module.
 */

const STORAGE_KEY = 'vibe_prep_stats';

export function getStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stats = raw ? JSON.parse(raw) : {};

    // Migrate legacy non-namespaced keys (e.g., q_0_1 -> fr_q_0_1)
    let migrated = false;
    for (const key in stats) {
      if (/^q_\d+_\d+$/.test(key)) {
        const newKey = `fr_${key}`;
        if (!stats[newKey]) {
          stats[newKey] = stats[key];
        } else {
          // Merge old stats into the new namespace
          stats[newKey].correctCount = (stats[newKey].correctCount || 0) + (stats[key].correctCount || 0);
          stats[newKey].incorrectCount = (stats[newKey].incorrectCount || 0) + (stats[key].incorrectCount || 0);
          stats[newKey].isDifficult = stats[newKey].isDifficult || stats[key].isDifficult;
          if (stats[key].acceptedAnswers) {
            stats[newKey].acceptedAnswers = Array.from(new Set([
              ...(stats[newKey].acceptedAnswers || []),
              ...stats[key].acceptedAnswers
            ]));
          }
        }
        delete stats[key];
        migrated = true;
      }
    }

    if (migrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    }

    return stats;
  } catch (e) {
    console.error('Failed to parse localStorage stats', e);
    return {};
  }
}

export function saveStats(stats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

export function getQuestionStats(qId) {
  const stats = getStats();
  if (!stats[qId]) {
    stats[qId] = {
      correctCount: 0,
      incorrectCount: 0,
      isDifficult: false,
      acceptedAnswers: []
    };
  }
  return stats[qId];
}

export function recordAnswer(qId, isCorrect) {
  const stats = getStats();
  if (!stats[qId]) {
    stats[qId] = {
      correctCount: 0,
      incorrectCount: 0,
      isDifficult: false,
      acceptedAnswers: []
    };
  }

  if (isCorrect) {
    stats[qId].correctCount++;
  } else {
    stats[qId].incorrectCount++;
  }

  saveStats(stats);
  return stats[qId];
}

export function toggleDifficult(qId) {
  const stats = getStats();
  if (!stats[qId]) {
    stats[qId] = {
      correctCount: 0,
      incorrectCount: 0,
      isDifficult: false,
      acceptedAnswers: []
    };
  }

  stats[qId].isDifficult = !stats[qId].isDifficult;
  saveStats(stats);
  return stats[qId].isDifficult;
}

export function setDifficult(qId, isDiff) {
  const stats = getStats();
  if (!stats[qId]) {
    stats[qId] = {
      correctCount: 0,
      incorrectCount: 0,
      isDifficult: false,
      acceptedAnswers: []
    };
  }

  stats[qId].isDifficult = isDiff;
  saveStats(stats);
}

export function addAcceptedAnswer(qId, answer) {
  const stats = getStats();
  if (!stats[qId]) {
    stats[qId] = {
      correctCount: 0,
      incorrectCount: 0,
      isDifficult: false,
      acceptedAnswers: []
    };
  }

  const cleanAns = answer.trim().toLowerCase();
  if (cleanAns && !stats[qId].acceptedAnswers.includes(cleanAns)) {
    stats[qId].acceptedAnswers.push(cleanAns);
    saveStats(stats);
  }
}

export function resetAllStats() {
  saveStats({});
}

export function getGlobalStats(questions) {
  const stats = getStats();
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalDifficult = 0;
  let answeredCount = 0;

  questions.forEach(q => {
    const qStat = stats[q.id];
    if (qStat) {
      totalCorrect += qStat.correctCount || 0;
      totalIncorrect += qStat.incorrectCount || 0;
      if (qStat.isDifficult) {
        totalDifficult++;
      }
      if ((qStat.correctCount || 0) + (qStat.incorrectCount || 0) > 0) {
        answeredCount++;
      }
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
}

export function getQuestionOverrides() {
  try {
    const raw = localStorage.getItem('vibe_prep_question_overrides');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Failed to get question overrides', e);
    return {};
  }
}

export function getAddedQuestions(moduleId) {
  try {
    const raw = localStorage.getItem('vibe_prep_question_added');
    const allAdded = raw ? JSON.parse(raw) : {};
    return allAdded[moduleId] || [];
  } catch (e) {
    console.error('Failed to get added questions', e);
    return [];
  }
}

export function saveQuestionEdit(moduleId, questionId, updatedFields) {
  try {
    // 1. Check if the question is in the "added" list
    const rawAdded = localStorage.getItem('vibe_prep_question_added');
    const allAdded = rawAdded ? JSON.parse(rawAdded) : {};
    const addedList = allAdded[moduleId] || [];
    const addedIndex = addedList.findIndex(q => q.id === questionId);
    
    if (addedIndex > -1) {
      // It's an added question, update it directly
      Object.assign(addedList[addedIndex], updatedFields);
      allAdded[moduleId] = addedList;
      localStorage.setItem('vibe_prep_question_added', JSON.stringify(allAdded));
    } else {
      // It's a base question, update overrides
      const rawOverrides = localStorage.getItem('vibe_prep_question_overrides');
      const overrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      if (!overrides[questionId]) {
        overrides[questionId] = {};
      }
      Object.assign(overrides[questionId], updatedFields);
      localStorage.setItem('vibe_prep_question_overrides', JSON.stringify(overrides));
    }
  } catch (e) {
    console.error('Failed to save question edit', e);
  }
}

export function saveAddedQuestion(moduleId, question) {
  try {
    const raw = localStorage.getItem('vibe_prep_question_added');
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
    
    localStorage.setItem('vibe_prep_question_added', JSON.stringify(allAdded));
  } catch (e) {
    console.error('Failed to save added question', e);
  }
}

export function exportProgressJSON() {
  const stats = getStats();
  const customModules = localStorage.getItem('vibe_prep_custom_modules') || '[]';
  const overrides = localStorage.getItem('vibe_prep_question_overrides') || '{}';
  const added = localStorage.getItem('vibe_prep_question_added') || '{}';

  const backup = {
    version: '1.0',
    stats: stats,
    customModules: JSON.parse(customModules),
    overrides: JSON.parse(overrides),
    added: JSON.parse(added)
  };

  return JSON.stringify(backup, null, 2);
}

export function importProgressJSON(jsonString) {
  try {
    const backup = JSON.parse(jsonString);
    if (!backup || typeof backup !== 'object') {
      throw new Error('Неверный формат резервной копии');
    }

    // Check if stats exist
    if (backup.stats && typeof backup.stats === 'object') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(backup.stats));
    }

    // Check if customModules exist
    if (Array.isArray(backup.customModules)) {
      localStorage.setItem('vibe_prep_custom_modules', JSON.stringify(backup.customModules));
    }

    // Check if overrides exist
    if (backup.overrides && typeof backup.overrides === 'object') {
      localStorage.setItem('vibe_prep_question_overrides', JSON.stringify(backup.overrides));
    }

    // Check if added questions exist
    if (backup.added && typeof backup.added === 'object') {
      localStorage.setItem('vibe_prep_question_added', JSON.stringify(backup.added));
    }

    return true;
  } catch (e) {
    console.error('Import failed', e);
    throw new Error('Не удалось разобрать файл резервной копии: ' + e.message);
  }
}
