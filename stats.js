/**
 * Statistics and localStorage management module.
 */

const STORAGE_KEY = 'vibe_prep_stats';

export function getStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
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
