<template>
  <main id="screen-lists" class="screen active">
    <div class="panel">
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;"
      >
        <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0;">Мои наборы вопросов</h2>
        <button
          id="btn-create-list-from-screen"
          class="btn-primary"
          style="width: auto; padding: 0.5rem 1.25rem; font-size: 0.85rem; border-radius: var(--radius-sm);"
          @click="onCreateListClick"
        >
          + Создать набор
        </button>
      </div>

      <!-- Lists container -->
      <div id="lists-container" class="modules-list">
        <div v-if="progressStore.customLists.length === 0" style="text-align:center; padding:2rem 1.5rem; color:var(--text-muted); font-size:0.95rem;">
          У вас пока нет созданных наборов вопросов.<br />
          Вы можете собрать их на странице просмотра вопросов темы.
        </div>
        
        <div
          v-else
          v-for="list in progressStore.customLists"
          :key="list.id"
          class="list-card"
        >
          <div class="list-card-header">
            <div class="list-card-title-group">
              <h3 class="list-card-title">{{ list.name || 'Без названия' }}</h3>
              <span class="list-card-subtitle">
                Тема: {{ list.moduleName || 'Неизвестно' }} • Вопросов: {{ (list.questionIds || []).length }}
              </span>
            </div>
            
            <!-- Delete -->
            <button
              class="btn-module-delete"
              title="Удалить набор"
              @click.stop="confirmDelete(list)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>

          <div class="list-card-actions">
            <!-- Solve -->
            <button
              class="btn-primary"
              style="padding: 0.5rem 1.25rem; font-size: 0.85rem; width: auto;"
              @click="solveList(list)"
            >
              Решать
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import { nextTick } from 'vue';
import { useProgressStore } from '../stores/progress';
import { useModulesStore } from '../stores/modules';
import { useModal } from '../composables/useModal';

export default {
  name: 'CustomLists',
  setup(props, { emit }) {
    const progressStore = useProgressStore();
    const modulesStore = useModulesStore();
    const { showAlert, showConfirm } = useModal();
    return { progressStore, modulesStore, showAlert, showConfirm };
  },
  methods: {
    async onCreateListClick() {
      if (this.progressStore.activeModuleId) {
        this.progressStore.currentScreen = 'viewer';
        // Let viewer auto-open selection mode
        nextTick(() => {
          // Emitting selector modes toggles
          this.$emit('trigger-selection-mode');
        });
      } else {
        await this.showAlert({
          message: 'Пожалуйста, выберите тему для подготовки на главном экране, откройте просмотр темы и соберите набор вопросов.'
        });
        this.progressStore.currentScreen = 'modules';
      }
    },
    async confirmDelete(list) {
      const confirmed = await this.showConfirm({
        message: `Вы уверены, что хотите удалить набор "${list.name || 'Без названия'}"?`
      });
      if (confirmed) {
        this.progressStore.deleteCustomList(list.id);
      }
    },
    async solveList(list) {
      if (!list || !list.moduleId) {
        this.showAlert({ message: 'Неверные данные набора вопросов.' });
        return;
      }
      
      const mod = this.modulesStore.modules.find(m => m.id === list.moduleId);
      if (!mod) {
        this.showAlert({ message: 'Тема, к которой относится этот набор, больше не существует.' });
        return;
      }

      try {
        await this.modulesStore.selectModule(mod.id);
        
        const questionIds = list.questionIds || [];
        const filteredQuestions = this.modulesStore.questions.filter(q => questionIds.includes(q.id));
        
        if (filteredQuestions.length === 0) {
          this.showAlert({
            message: 'В этом наборе не найдено подходящих вопросов. Возможно, они были удалены из темы.'
          });
          return;
        }

        const settings = {
          category: 'all',
          algorithm: 'sequential',
          qtype: 'free',
          onlyDifficult: false,
          progressFilter: 'all'
        };

        this.progressStore.startStudySession(filteredQuestions, null, settings);
      } catch (e) {
        this.showAlert({ message: 'Не удалось загрузить вопросы: ' + e.message });
      }
    }
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}

.list-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;
}

.list-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.list-card-title-group {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.list-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
}

.list-card-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.list-card-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-module-delete {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  transition: var(--transition);
}

.btn-module-delete:hover {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
}
</style>
