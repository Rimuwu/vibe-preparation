/**
 * Algorithms module for sorting and shuffling question indexes.
 */

import { getStats } from './stats.js';

// Shuffle helper using Fisher-Yates algorithm
function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Prepares the queue of questions based on filters and chosen algorithm.
 * @param {Array} questions - Raw list of parsed questions.
 * @param {String} category - Selected category ('all' or specific category name).
 * @param {String} algorithm - Selected algorithm ('sequential', 'random', 'difficult_first').
 * @returns {Array} - Ordered array of questions to study.
 */
export function prepareSession(questions, category, algorithm) {
  // 1. Filter by category
  let filtered = questions;
  if (category && category !== 'all') {
    filtered = questions.filter(q => q.category === category);
  }

  if (filtered.length === 0) {
    return [];
  }

  // 2. Order by algorithm
  if (algorithm === 'random') {
    return shuffle(filtered);
  }

  if (algorithm === 'difficult_first') {
    const stats = getStats();
    
    // Sort questions by computed difficulty score descending
    return [...filtered].sort((a, b) => {
      const statA = stats[a.id] || {};
      const statB = stats[b.id] || {};

      const isDiffA = statA.isDifficult ? 1 : 0;
      const isDiffB = statB.isDifficult ? 1 : 0;

      const incA = statA.incorrectCount || 0;
      const incB = statB.incorrectCount || 0;

      const corA = statA.correctCount || 0;
      const corB = statB.correctCount || 0;

      // Weight calculation:
      // - Starred as difficult: +1000 points
      // - Starred in md: +500 points
      // - Incorrect attempts: +10 points each
      // - Correct attempts: -2 points each
      const weightA = (isDiffA * 1000) + (a.isStarred ? 500 : 0) + (incA * 10) - (corA * 2);
      const weightB = (isDiffB * 1000) + (b.isStarred ? 500 : 0) + (incB * 10) - (corB * 2);

      // Descending order of weights (heavier = more difficult)
      if (weightB !== weightA) {
        return weightB - weightA;
      }
      
      // If weights are equal, maintain numeric/index order
      return a.number - b.number;
    });
  }

  // 'sequential'
  return [...filtered];
}
