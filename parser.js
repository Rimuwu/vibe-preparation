/**
 * Parser module for extracting questions and structures from markdown text.
 */

export function parseMarkdown(mdText) {
  const lines = mdText.split(/\r?\n/);
  const questions = [];
  let currentCategory = 'Общее';
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect Category (## Section name)
    if (trimmed.startsWith('## ')) {
      currentCategory = trimmed.replace(/^##\s+/, '');
      continue;
    }

    // Detect Question (### Header)
    if (trimmed.startsWith('### ')) {
      if (currentQuestion) {
        questions.push(finalizeQuestion(currentQuestion));
      }

      const headerText = trimmed.replace(/^###\s+/, '');
      const isStarred = headerText.includes('[!]');
      const titleClean = headerText.replace(/\[!\]\s*/, '').trim();

      // Extract number if formatted as "1. Title"
      const numberMatch = titleClean.match(/^(\d+)\.\s*(.*)/);
      let num = questions.length + 1;
      let questionText = titleClean;
      if (numberMatch) {
        num = parseInt(numberMatch[1], 10);
        questionText = numberMatch[2];
      }

      currentQuestion = {
        id: `q_${questions.length}_${num}`,
        number: num,
        isStarred: isStarred,
        category: currentCategory,
        title: questionText,
        lines: [],
        type: 'free' // Default type
      };
      continue;
    }

    if (currentQuestion) {
      currentQuestion.lines.push(line);
    }
  }

  if (currentQuestion) {
    questions.push(finalizeQuestion(currentQuestion));
  }

  return questions;
}

function finalizeQuestion(q) {
  const bodyText = q.lines.join('\n').trim();
  delete q.lines;
  q.rawBody = bodyText;

  // Extract short answer (from "Краткий ответ", "Код", or "Ответ")
  const shortAnswerMatch = bodyText.match(/\*\s+\*\*(?:Краткий ответ|Код|Ответ)\*\*:\s*([\s\S]*?)(?=\r?\n\s*\* \*\*(?:Более расширенный ответ|Пояснение|Краткий ответ|Код|Ответ)\*\*:|$)/i);
  if (shortAnswerMatch) {
    q.shortAnswer = shortAnswerMatch[1].trim();
  } else {
    q.shortAnswer = '';
  }

  // Extract detailed answer / explanation (from "Более расширенный ответ" or "Пояснение")
  const detailedAnswerMatch = bodyText.match(/\*\s+\*\*(?:Более расширенный ответ|Пояснение)\*\*:\s*([\s\S]*?)(?=\r?\n\s*\* \*\*(?:Более расширенный ответ|Пояснение|Краткий ответ|Код|Ответ)\*\*:|$)/i);
  if (detailedAnswerMatch) {
    q.detailedAnswer = detailedAnswerMatch[1].trim();
  } else {
    q.detailedAnswer = '';
  }

  // Detect code blocks inside rawBody
  const codeBlockRegex = /```(javascript|typescript|html|css)?\s*([\s\S]*?)```/gi;
  const codes = [];
  let match;
  while ((match = codeBlockRegex.exec(bodyText)) !== null) {
    codes.push({
      lang: match[1] || 'javascript',
      code: match[2].trim()
    });
  }
  q.codeBlocks = codes;

  // Detect if question contains Multiple Choice checklist
  const choiceMatches = [...bodyText.matchAll(/[-*]\s+\[([ xX])\]\s*(.+)/g)];
  if (choiceMatches.length > 0) {
    q.type = 'choice';
    q.choices = choiceMatches.map((m, idx) => ({
      id: idx,
      text: m[2].trim(),
      isCorrect: m[1].toLowerCase() === 'x'
    }));
  }

  return q;
}
