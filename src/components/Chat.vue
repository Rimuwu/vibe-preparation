<template>
  <section id="screen-chat" class="screen active">
    <div class="panel chat-panel">
      <!-- Chat Header -->
      <div class="chat-header">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0;">💬 Чат с ИИ</h2>
          <span v-if="activeContextLabel" class="brand-badge" style="font-size: 0.72rem; padding: 0.15rem 0.4rem;">
            Контекст: {{ activeContextLabel }}
          </span>
        </div>
        
        <!-- Controls row -->
        <div class="chat-controls">
          <!-- Model Selection -->
          <select class="select-control chat-select" v-model="selectedModel">
            <option value="auto">Auto (g4f)</option>
            <option value="gpt-4o">GPT-4o (g4f)</option>
            <option value="gpt-4o-mini">GPT-4o-Mini (g4f)</option>
            <option value="deepseek-v3">DeepSeek V3 (g4f)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (g4f)</option>
          </select>

          <!-- Web Search Toggle -->
          <label class="web-search-toggle" title="Поиск в интернете">
            <input type="checkbox" v-model="webSearchEnabled" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span style="font-size: 0.8rem; font-weight: 500;">Веб-поиск</span>
          </label>
        </div>
      </div>

      <!-- Context Toggle Button -->
      <div style="margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        <button 
          type="button" 
          class="btn-action" 
          style="padding: 0.25rem 0.6rem; font-size: 0.78rem; border: 1px solid var(--border-color); background: rgba(255,255,255,0.02); color: var(--text-muted); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 0.35rem;"
          @click="contextExpanded = !contextExpanded"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          <span>Параметры контекста {{ contextExpanded ? '▲' : '▼' }}</span>
          <span v-if="!contextExpanded && activeContextLabel" style="color: var(--primary); font-weight: 600;">
            ({{ activeContextLabel }})
          </span>
        </button>
      </div>

      <!-- Context Config Area -->
      <div v-if="contextExpanded" class="context-config-bar">
        <div class="form-group" style="margin-bottom: 0; flex-grow: 1;">
          <label style="margin-bottom: 0.25rem;">Контекст для беседы</label>
          <select class="select-control" style="padding: 0.4rem 0.75rem; font-size: 0.82rem;" v-model="contextType" @change="onContextTypeChange">
            <option value="none">Без контекста</option>
            <option value="question" :disabled="!modulesStore.activeModule">Контекст: Вопрос</option>
            <option value="module_questions" :disabled="!modulesStore.activeModule">Контекст: Весь модуль (только вопросы)</option>
            <option value="module_full" :disabled="!modulesStore.activeModule">Контекст: Тема (вопросы + ответы)</option>
          </select>
        </div>

        <!-- Question picker if contextType is 'question' -->
        <div v-if="contextType === 'question' && modulesStore.activeModule" class="form-group" style="margin-bottom: 0; flex-grow: 2; min-width: 200px;">
          <label style="margin-bottom: 0.25rem;">Выберите вопрос</label>
          <select class="select-control" style="padding: 0.4rem 0.75rem; font-size: 0.82rem;" v-model="selectedContextQuestionId">
            <option v-for="q in modulesStore.questions" :key="q.id" :value="q.id">
              {{ q.number }}. {{ q.title }}
            </option>
          </select>
        </div>
      </div>

      <!-- Messages Viewport -->
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="chat-empty">
          <p style="font-size: 0.95rem; color: var(--text-muted);">Напишите сообщение, чтобы начать беседу.</p>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">
            Используйте <strong>#</strong> для быстрого выбора вопроса из текущей темы.
          </p>
        </div>
        
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="chat-message-row"
          :class="msg.role"
        >
          <div class="chat-bubble">
            <div class="message-meta">
              <span>{{ msg.role === 'user' ? 'Вы' : 'ИИ (' + msg.model + ')' }}</span>
            </div>
            <div class="message-content markdown-body" v-html="renderMessage(msg.content)"></div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="chat-input-container">
        <!-- Autocomplete Suggestions Dropdown -->
        <div v-if="showSuggestions && filteredQuestions.length > 0" class="autocomplete-dropdown" ref="suggestionsDropdown">
          <div
            v-for="q in filteredQuestions"
            :key="q.id"
            class="autocomplete-item"
            @click="selectQuestionSuggestion(q)"
          >
            {{ q.number }}. {{ q.title }}
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: flex-end; width: 100%;">
          <textarea
            class="text-control chat-input"
            v-model="messageInput"
            @keydown.enter.prevent="sendMessage"
            @input="onInput"
            placeholder="Задайте вопрос ИИ (Enter для отправки, Shift+Enter для новой строки, # для поиска вопроса)..."
            :disabled="generating"
            ref="chatTextarea"
            style="flex-grow: 1; min-height: 48px; max-height: 150px; resize: vertical;"
          ></textarea>

          <div style="display: flex; gap: 0.4rem; flex-shrink: 0; height: 48px; align-items: center;">
            <!-- Speech recognition -->
            <button
              v-if="speechSupported && !generating"
              type="button"
              class="btn-icon voice-input-btn"
              :class="{ 
                listening: isListening,
                transitioning: speechState === 'starting' || speechState === 'stopping'
              }"
              :disabled="speechState === 'starting' || speechState === 'stopping'"
              title="Голосовой ввод"
              @click="toggleVoiceInput"
              style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: var(--radius-md); transition: var(--transition);"
            >
              <svg v-if="!isListening" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="pulse-mic">
                <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </button>

            <!-- Send button -->
            <button
              class="btn-primary"
              style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md);"
              :disabled="generating || !messageInput.trim()"
              @click="sendMessage"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useProgressStore } from '../stores/progress';
import { useModulesStore } from '../stores/modules';
import { useModal } from '../composables/useModal';
import { chatStream } from '../utils/ai';
import { marked } from 'marked';
import Prism from 'prismjs';

export default {
  name: 'Chat',
  setup() {
    const progressStore = useProgressStore();
    const modulesStore = useModulesStore();
    const { showAlert } = useModal();

    const messages = ref([]);
    const messageInput = ref('');
    const generating = ref(false);
    const selectedModel = ref(progressStore.aiModel);
    const webSearchEnabled = ref(false);

    // Context states
    const contextType = ref('none');
    const selectedContextQuestionId = ref(null);

    // Voice states
    const speechSupported = ref('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    const isListening = ref(false);
    const speechState = ref('idle'); // 'idle', 'starting', 'listening', 'stopping'
    let recognition = null;
    let startTimeout = null;
    const contextExpanded = ref(false);

    // Autocomplete states
    const showSuggestions = ref(false);
    const suggestionQuery = ref('');
    const suggestionsDropdown = ref(null);
    const chatTextarea = ref(null);
    const messagesContainer = ref(null);

    // Auto set model from store
    watch(() => progressStore.aiModel, (newVal) => {
      selectedModel.value = newVal;
    });

    watch(selectedModel, (newVal) => {
      progressStore.setAiModel(newVal);
    });

    // Default select first question if context question is active
    watch(() => modulesStore.questions, (newVal) => {
      if (newVal.length > 0 && !selectedContextQuestionId.value) {
        selectedContextQuestionId.value = newVal[0].id;
      }
    }, { immediate: true });

    const activeContextLabel = computed(() => {
      if (contextType.value === 'none') return '';
      if (!modulesStore.activeModule) return '';
      
      if (contextType.value === 'question') {
        const q = modulesStore.questions.find(item => item.id === selectedContextQuestionId.value);
        return q ? `Вопрос ${q.number}` : 'Вопрос';
      }
      if (contextType.value === 'module_questions') return 'Вопросы модуля';
      if (contextType.value === 'module_full') return 'Тема полностью';
      return '';
    });

    // Suggestion logic when typing '#'
    const filteredQuestions = computed(() => {
      if (!modulesStore.activeModule) return [];
      const query = suggestionQuery.value.toLowerCase().trim();
      if (!query) return modulesStore.questions;
      return modulesStore.questions.filter(q => 
        q.title.toLowerCase().includes(query) || 
        q.number.toString().includes(query)
      );
    });

    const onContextTypeChange = () => {
      if (contextType.value === 'question' && modulesStore.questions.length > 0 && !selectedContextQuestionId.value) {
        selectedContextQuestionId.value = modulesStore.questions[0].id;
      }
    };

    const renderMessage = (content) => {
      return marked.parse(content);
    };

    const scrollChatToBottom = () => {
      nextTick(() => {
        if (messagesContainer.value) {
          messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
        }
      });
    };

    const onInput = (event) => {
      const value = event.target.value;
      const cursorPosition = event.target.selectionStart;
      
      // Look back from cursor to see if we typed '#'
      const lastHashIndex = value.lastIndexOf('#', cursorPosition - 1);
      
      if (lastHashIndex !== -1 && !value.slice(lastHashIndex, cursorPosition).includes(' ')) {
        showSuggestions.value = true;
        suggestionQuery.value = value.slice(lastHashIndex + 1, cursorPosition);
      } else {
        showSuggestions.value = false;
      }
    };

    const selectQuestionSuggestion = (question) => {
      const value = messageInput.value;
      const textarea = chatTextarea.value;
      if (!textarea) return;
      
      const cursorPosition = textarea.selectionStart;
      const lastHashIndex = value.lastIndexOf('#', cursorPosition - 1);
      
      if (lastHashIndex !== -1) {
        const before = value.slice(0, lastHashIndex);
        const after = value.slice(cursorPosition);
        messageInput.value = `${before}#${question.number} (${question.title}) ${after}`;
        
        // Auto set context to question
        contextType.value = 'question';
        selectedContextQuestionId.value = question.id;
      }
      
      showSuggestions.value = false;
      nextTick(() => {
        textarea.focus();
      });
    };

    // Close suggestions on outside clicks
    const handleOutsideClick = (e) => {
      if (suggestionsDropdown.value && !suggestionsDropdown.value.contains(e.target) && e.target !== chatTextarea.value) {
        showSuggestions.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleOutsideClick);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('click', handleOutsideClick);
      if (startTimeout) clearTimeout(startTimeout);
      if (recognition) {
        try {
          recognition.abort();
        } catch (e) {
          console.warn('SpeechRecognition abort error:', e);
        }
      }
    });

    // Voice dictation
    const toggleVoiceInput = async () => {
      if (!speechSupported.value) return;
      
      if (speechState.value === 'starting' || speechState.value === 'stopping') return;

      if (speechState.value === 'listening') {
        speechState.value = 'stopping';
        try {
          if (recognition) recognition.stop();
        } catch (e) {
          console.warn('SpeechRecognition stop error:', e);
          speechState.value = 'idle';
        }
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      try {
        if (recognition) {
          try { recognition.abort(); } catch(e) {}
        }
        
        recognition = new SpeechRecognition();
        recognition.lang = 'ru-RU';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
          speechState.value = 'listening';
          isListening.value = true;
          if (startTimeout) clearTimeout(startTimeout);
        };

        recognition.onresult = (event) => {
          const resultText = event.results[0][0].transcript;
          messageInput.value = (messageInput.value + ' ' + resultText).trim();
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error', event);
          speechState.value = 'idle';
          isListening.value = false;
          if (startTimeout) clearTimeout(startTimeout);
          if (event.error === 'not-allowed') {
            showAlert({
              message: 'Доступ к микрофону заблокирован. Пожалуйста, разрешите доступ к микрофону в настройках браузера для использования голосового ввода.'
            });
          }
        };

        recognition.onend = () => {
          speechState.value = 'idle';
          isListening.value = false;
          if (startTimeout) clearTimeout(startTimeout);
        };

        speechState.value = 'starting';
        
        if (startTimeout) clearTimeout(startTimeout);
        startTimeout = setTimeout(() => {
          if (speechState.value === 'starting') {
            console.warn('SpeechRecognition start timeout');
            speechState.value = 'idle';
            try { recognition.abort(); } catch(e) {}
          }
        }, 5000);

        recognition.start();
      } catch (e) {
        console.warn('SpeechRecognition start error:', e);
        speechState.value = 'idle';
      }
    };

    // Main send message
    const sendMessage = async () => {
      const userText = messageInput.value.trim();
      if (!userText || generating.value) return;

      // Reset voice recording if any
      if (isListening.value && recognition) {
        recognition.stop();
      }

      // Add user message
      messages.value.push({
        role: 'user',
        content: userText
      });

      messageInput.value = '';
      showSuggestions.value = false;
      generating.value = true;
      scrollChatToBottom();

      // Add placeholder for AI response
      const aiMessageIndex = messages.value.length;
      messages.value.push({
        role: 'assistant',
        model: selectedModel.value,
        content: ''
      });

      // Prepare context block
      let systemContext = '';
      if (contextType.value !== 'none' && modulesStore.activeModule) {
        systemContext += `Вы общаетесь в контексте модуля "${modulesStore.activeModule.name}".\n`;
        
        if (contextType.value === 'question') {
          const q = modulesStore.questions.find(item => item.id === selectedContextQuestionId.value);
          if (q) {
            systemContext += `Текущий обсуждаемый вопрос:\nВопрос №${q.number}: "${q.title}"\nКраткий ответ: "${q.shortAnswer || ''}"\nПодробное пояснение: "${q.detailedAnswer || ''}"\n`;
          }
        } else if (contextType.value === 'module_questions') {
          systemContext += `Список всех вопросов в этом модуле:\n`;
          modulesStore.questions.forEach(q => {
            systemContext += `- Вопрос №${q.number}: "${q.title}"\n`;
          });
        } else if (contextType.value === 'module_full') {
          systemContext += `Содержимое модуля (вопросы с ответами):\n`;
          modulesStore.questions.forEach(q => {
            systemContext += `### Вопрос №${q.number}: "${q.title}"\nКраткий ответ: "${q.shortAnswer || ''}"\nПояснение: "${q.detailedAnswer || ''}"\n\n`;
          });
        }
      }

      // Build chat messages payload
      const chatMessages = [];
      if (systemContext) {
        chatMessages.push({
          role: 'system',
          content: `${systemContext}\nПожалуйста, отвечайте на русском языке. Используйте разметку markdown.`
        });
      }

      // Map last 8 messages for history to avoid context overflow
      const history = messages.value.slice(0, -1).slice(-8).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      chatMessages.push(...history);

      try {
        const stream = await chatStream(chatMessages, {
          model: selectedModel.value,
          webSearch: webSearchEnabled.value
        });

        // Loop over stream chunks
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || '';
          if (delta) {
            messages.value[aiMessageIndex].content += delta;
            scrollChatToBottom();
          }
        }

        // Highlight syntax inside stream after complete
        nextTick(() => {
          Prism.highlightAll();
        });
      } catch (err) {
        messages.value[aiMessageIndex].content = `❌ Ошибка генерации: ${err.message}. Пожалуйста, попробуйте другую модель или проверьте подключение.`;
        scrollChatToBottom();
      } finally {
        generating.value = false;
      }
    };

    return {
      progressStore,
      modulesStore,
      messages,
      messageInput,
      generating,
      selectedModel,
      webSearchEnabled,
      contextType,
      selectedContextQuestionId,
      activeContextLabel,
      contextExpanded,
      speechSupported,
      isListening,
      speechState,
      showSuggestions,
      filteredQuestions,
      chatTextarea,
      messagesContainer,
      suggestionsDropdown,
      onInput,
      selectQuestionSuggestion,
      toggleVoiceInput,
      sendMessage,
      renderMessage,
      onContextTypeChange
    };
  }
};
</script>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: calc(100vh - 110px);
  padding: 1.25rem;
  margin-bottom: 0;
  min-height: 480px;
}

.app-container {
  padding: 0 !important;
  padding-bottom: 0 !important;
}

@media (max-height: 600px) {
  .chat-panel {
    height: calc(100vh - 90px);
  }
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 0.75rem;
}

.chat-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.chat-select {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
  width: auto;
  min-width: 170px;
}

.web-search-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
  user-select: none;
  color: var(--text-muted);
  transition: var(--transition);
}

.web-search-toggle:hover {
  color: var(--text-main);
}

.web-search-toggle input {
  cursor: pointer;
}

.context-config-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid var(--border-color);
  padding: 0.75rem;
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
  margin-bottom: 0.75rem;
  background: rgba(0, 0, 0, 0.1);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255,255,255,0.02);
}

.chat-empty {
  margin: auto;
  text-align: center;
  padding: 2rem;
}

.chat-message-row {
  display: flex;
  width: 100%;
}

.chat-message-row.user {
  justify-content: flex-end;
}

.chat-bubble {
  max-width: 85%;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: rgba(255, 255, 255, 0.02);
}

.user .chat-bubble {
  background: var(--primary-dark);
  border-color: rgba(138, 180, 248, 0.3);
  color: #ffffff;
}

.message-meta {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user .message-meta {
  color: rgba(138, 180, 248, 0.85);
  text-align: right;
}

.chat-input-container {
  position: relative;
  width: 100%;
}

.chat-input {
  min-height: 48px;
  resize: none;
  font-size: 0.92rem;
}

/* Autocomplete suggestion dropdown */
.autocomplete-dropdown {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #1f1f1f;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 -4px 15px rgba(0,0,0,0.5);
  margin-bottom: 4px;
}

.autocomplete-item {
  padding: 0.6rem 1rem;
  font-size: 0.85rem;
  color: var(--text-main);
  cursor: pointer;
  transition: var(--transition);
  border-bottom: 1px solid rgba(255,255,255,0.02);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.autocomplete-item:hover {
  background: rgba(138, 180, 248, 0.1);
  color: var(--primary);
}

.pulse-mic {
  animation: pulse 1.2s infinite ease-in-out;
  color: var(--error);
}

.voice-input-btn.listening {
  border-color: var(--error) !important;
  background: var(--error-dark) !important;
}
</style>
