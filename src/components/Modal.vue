<template>
  <Transition name="fade">
    <div v-if="visible" class="modal-overlay" @click.self="onCancel">
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header">
          <h3>{{ title || defaultTitle }}</h3>
          <button class="modal-close-btn" @click="onCancel">&times;</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <!-- Type: Alert / Confirm -->
          <div v-if="type === 'alert' || type === 'confirm'">
            <p v-html="formattedMessage"></p>
          </div>

          <!-- Type: Prompt -->
          <div v-else-if="type === 'prompt'" class="form-group">
            <label for="prompt-input">{{ message }}</label>
            <input
              id="prompt-input"
              ref="promptInput"
              type="text"
              class="search-input"
              v-model="promptValue"
              @keyup.enter="onOk"
            />
          </div>

          <!-- Type: Edit-Question -->
          <div v-else-if="type === 'edit-question'" class="edit-question-form">
            <div class="form-group">
              <label for="edit-q-category">Раздел / Категория</label>
              <input
                id="edit-q-category"
                type="text"
                class="search-input"
                v-model="questionForm.category"
              />
            </div>
            <div class="form-group">
              <label for="edit-q-title">Вопрос</label>
              <textarea
                id="edit-q-title"
                class="text-control"
                style="min-height: 80px;"
                v-model="questionForm.title"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="edit-q-tags">Теги (через пробел или запятую)</label>
              <input
                id="edit-q-tags"
                type="text"
                class="search-input"
                v-model="questionForm.tagsText"
                placeholder="например: js, basics"
              />
            </div>
            <div class="form-group">
              <label for="edit-q-short">Краткий ответ / Код</label>
              <textarea
                id="edit-q-short"
                class="text-control"
                style="min-height: 120px; font-family: monospace;"
                v-model="questionForm.shortAnswer"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="edit-q-detailed">Подробное пояснение</label>
              <textarea
                id="edit-q-detailed"
                class="text-control"
                style="min-height: 150px;"
                v-model="questionForm.detailedAnswer"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="edit-q-accepted">
                База знаний: альтернативные правильные ответы (каждый с новой строки)
              </label>
              <textarea
                id="edit-q-accepted"
                class="text-control"
                style="min-height: 80px;"
                placeholder="Впишите варианты правильных ответов для проверки на совпадение..."
                v-model="questionForm.acceptedText"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button
            v-if="type !== 'alert'"
            class="btn-action"
            style="border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main);"
            @click="onCancel"
          >
            Отмена
          </button>
          
          <button
            class="btn-primary"
            style="width: auto; border-radius: var(--radius-sm); padding: 0.6rem 1.25rem;"
            @click="onOk"
          >
            {{ okBtnText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script>
import { nextTick } from 'vue';

export default {
  name: 'Modal',
  props: {
    visible: Boolean,
    title: String,
    type: {
      type: String,
      default: 'alert' // alert, confirm, prompt, edit-question
    },
    message: String,
    defaultValue: {
      type: String,
      default: ''
    },
    questionData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'ok'],
  data() {
    return {
      promptValue: '',
      questionForm: {
        category: 'Общее',
        title: '',
        tagsText: '',
        shortAnswer: '',
        detailedAnswer: '',
        acceptedText: ''
      }
    };
  },
  computed: {
    defaultTitle() {
      if (this.type === 'confirm') return 'Подтверждение';
      if (this.type === 'prompt') return 'Ввод';
      if (this.type === 'edit-question') return this.questionData.isNew ? 'Добавить вопрос' : 'Редактировать вопрос';
      return 'Внимание';
    },
    formattedMessage() {
      if (!this.message) return '';
      return this.message.replace(/\n/g, '<br>');
    },
    okBtnText() {
      if (this.type === 'edit-question') return 'Сохранить';
      if (this.type === 'prompt') return 'Сохранить';
      return 'ОК';
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        if (this.type === 'prompt') {
          this.promptValue = this.defaultValue;
          nextTick(() => {
            if (this.$refs.promptInput) {
              this.$refs.promptInput.focus();
              this.$refs.promptInput.select();
            }
          });
        } else if (this.type === 'edit-question') {
          const q = this.questionData || {};
          this.questionForm.category = q.category || 'Общее';
          this.questionForm.title = q.title || '';
          this.questionForm.tagsText = (q.tags || []).join(', ');
          this.questionForm.shortAnswer = q.shortAnswer || '';
          this.questionForm.detailedAnswer = q.detailedAnswer || '';
          this.questionForm.acceptedText = (q.acceptedAnswers || []).join('\n');
        }
      }
    }
  },
  methods: {
    onCancel() {
      this.$emit('close');
    },
    onOk() {
      if (this.type === 'prompt') {
        this.$emit('ok', this.promptValue.trim());
      } else if (this.type === 'edit-question') {
        if (!this.questionForm.title.trim()) {
          this.$emit('ok-error', 'Заголовок вопроса не может быть пустым.');
          return;
        }
        
        const tags = this.questionForm.tagsText
          .split(/[\s,]+/)
          .map(t => t.replace(/^#/, '').trim().toLowerCase())
          .filter(t => t.length > 0);
          
        const acceptedAnswers = this.questionForm.acceptedText
          .split('\n')
          .map(a => a.trim())
          .filter(a => a.length > 0);
          
        this.$emit('ok', {
          category: this.questionForm.category.trim() || 'Общее',
          title: this.questionForm.title.trim(),
          shortAnswer: this.questionForm.shortAnswer.trim(),
          detailedAnswer: this.questionForm.detailedAnswer.trim(),
          tags,
          acceptedAnswers
        });
      } else {
        this.$emit('ok', true);
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1rem;
}

.modal-content {
  background: var(--panel-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 580px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  animation: modalScale 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalScale {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.15rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  transition: var(--transition);
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.modal-close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  font-size: 0.95rem;
  color: var(--text-main);
  line-height: 1.5;
}

.modal-body p {
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.1);
}

.edit-question-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
