import { DEFAULT_INSTRUCTIONS } from './aiInstructions';

let g4fClient = null;

export const getG4FClient = async () => {
  if (typeof window === 'undefined') return null;
  if (g4fClient) return g4fClient;
  
  try {
    const module = await import(/* @vite-ignore */ 'https://g4f.dev/dist/js/providers.js');
    // Using 'pollinations' provider which is free, keyless and natively supported
    g4fClient = module.createClient('pollinations');
    return g4fClient;
  } catch (err) {
    console.error('Failed to load G4F client:', err);
    throw new Error('Не удалось загрузить клиент ИИ (g4f.dev). Проверьте интернет-соединение.');
  }
};

/**
 * Maps standard model names to Pollinations supported models
 */
function mapModel(modelName) {
  const model = modelName || 'openai';
  if (model === 'auto') return 'openai';
  if (model === 'gpt-4o') return 'openai';
  if (model === 'gpt-4o-mini') return 'openai';
  if (model === 'deepseek-v3') return 'deepseek';
  if (model === 'gemini-2.5-flash') return 'gemini';
  return model;
}

/**
 * Runs a streaming chat call to G4F AI
 */
export async function chatStream(messages, options = {}) {
  const client = await getG4FClient();
  const model = mapModel(options.model);
  
  return await client.chat.completions.create({
    model,
    messages,
    stream: true
  });
}

/**
 * Verify student's typed answer against correct template using AI
 */
export async function verifyAnswer(questionText, studentAnswer, correctTemplate, options = {}) {
  const client = await getG4FClient();
  const model = mapModel(options.model);
  const systemPrompt = options.instructions || DEFAULT_INSTRUCTIONS.verifyAnswer;

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Вопрос: "${questionText}"\nЭталонный ответ: "${correctTemplate}"\nОтвет студента: "${studentAnswer}"`
    }
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      messages
    });
    const content = response.choices[0].message.content.trim();
    
    // Clean code fences if AI returns ```json ... ```
    const cleanedContent = content.replace(/^```json\s*/i, '').replace(/```\s*$/g, '').trim();
    return JSON.parse(cleanedContent);
  } catch (err) {
    console.error('verifyAnswer AI error:', err);
    throw err;
  }
}

/**
 * Explain a concept simpler (ELI5)
 */
export async function explainSimpler(question, options = {}) {
  const client = await getG4FClient();
  const model = mapModel(options.model);
  const systemPrompt = options.instructions || DEFAULT_INSTRUCTIONS.explainSimpler;

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Вопрос: "${question.title}"\nКраткий ответ: "${question.shortAnswer || ''}"\nПодробное пояснение: "${question.detailedAnswer || ''}"`
    }
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      messages
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('explainSimpler AI error:', err);
    throw err;
  }
}

/**
 * Generate a much more detailed explanation for a question
 */
export async function makeDetailed(question, options = {}) {
  const client = await getG4FClient();
  const model = mapModel(options.model);
  const systemPrompt = options.instructions || DEFAULT_INSTRUCTIONS.makeDetailed;

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Вопрос: "${question.title}"\nКраткий ответ: "${question.shortAnswer || ''}"\nТекущее краткое пояснение: "${question.detailedAnswer || ''}"`
    }
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      messages
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('makeDetailed AI error:', err);
    throw err;
  }
}

/**
 * Generate a complete module based on prompt and formatting guidelines
 */
export async function generateModule(promptText, formattingRules, options = {}) {
  const client = await getG4FClient();
  const model = mapModel(options.model);
  const systemPrompt = options.instructions || DEFAULT_INSTRUCTIONS.generateModule;

  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Запрос пользователя: "${promptText}"\n\nПравила форматирования (FORMATTING.md):\n${formattingRules}`
    }
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      messages
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('generateModule AI error:', err);
    throw err;
  }
}
