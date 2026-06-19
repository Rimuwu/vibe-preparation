<template>
  <main id="screen-modules" class="screen active">
    <!-- Topics List Panel -->
    <div class="panel">
      <h2 style="font-size: 1.25rem; margin-bottom: 1rem; font-weight: 700;">Выберите тему для подготовки</h2>
      
      <div v-if="modulesStore.loading" style="text-align: center; padding: 2rem; color: var(--text-muted);">
        Загрузка тем...
      </div>
      
      <div v-else-if="modulesStore.modules.length === 0" class="modules-list">
        <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.9rem;">
          Нет доступных тем
        </div>
      </div>
      
      <div v-else class="modules-list">
        <div
          v-for="mod in modulesStore.modules"
          :key="mod.id"
          class="module-card"
          @click="selectModule(mod)"
        >
          <div class="module-card-header">
            <h3 class="module-card-title">{{ mod.name }}</h3>
            <!-- Delete button for custom modules -->
            <button
              v-if="mod.isCustom"
              class="btn-module-delete"
              title="Удалить тему"
              @click.stop="confirmDelete(mod)"
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
          
          <p class="module-card-desc">{{ mod.description || 'Без описания' }}</p>
          
          <div class="module-card-footer">
            <span
              class="brand-badge"
              :style="{ fontSize: '0.7rem', color: mod.isCustom ? 'var(--warning)' : 'var(--primary)', borderColor: mod.isCustom ? 'rgba(253,214,99,0.3)' : 'rgba(138,180,248,0.3)', background: mod.isCustom ? 'var(--warning-dark)' : 'var(--primary-dark)' }"
            >
              {{ mod.isCustom ? 'Пользовательская' : 'Стандартная' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Module Importer Dropzone Panel -->
    <div class="panel">
      <h3 style="font-size: 1rem; margin-bottom: 0.75rem; font-weight: 600;">Загрузить свою тему (.md)</h3>

      <div class="form-group">
        <label for="input-module-name">Название темы</label>
        <input
          type="text"
          id="input-module-name"
          class="search-input"
          v-model="newModuleName"
          placeholder="Например: Основы SQL"
        />
      </div>

      <div class="form-group">
        <label for="input-module-desc">Описание темы</label>
        <textarea
          id="input-module-desc"
          class="text-control"
          v-model="newModuleDesc"
          placeholder="Краткое описание того, о чем эти вопросы..."
          style="min-height: 50px;"
        ></textarea>
      </div>

      <!-- Drag & Drop Zone -->
      <div
        id="module-dropzone"
        class="file-dropzone"
        :class="{ dragover: isDragOver }"
        style="padding: 1.25rem 1rem; margin-bottom: 0.75rem;"
        @click="triggerFileInput"
        @dragover.prevent="isDragOver = true"
        @dragleave.prevent="isDragOver = false"
        @drop.prevent="onFileDrop"
      >
        <svg
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style="width: 24px; height: 24px; margin-bottom: 0.25rem;"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
          ></path>
        </svg>
        <p style="font-size: 0.85rem;">
          {{ selectedFileName || 'Нажмите или перетащите .md файл' }}
        </p>
        <input
          type="file"
          ref="fileInput"
          accept=".md"
          style="display: none;"
          @change="onFileSelected"
        />
      </div>

      <!-- GitHub Template Banner -->
      <div class="github-star-banner" style="margin-top: 0.5rem; margin-bottom: 0.75rem;">
        <div
          style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;"
        >
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              style="color: var(--primary);"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span style="font-size: 0.85rem; color: var(--text-main);">Используйте правила создания файлов</span>
          </div>
          <a
            href="https://github.com/Rimuwu/vibe-preparation/blob/main/FORMATTING.md"
            target="_blank"
            class="btn-star-github"
            style="background: rgba(138, 180, 248, 0.15); color: var(--primary); border-color: rgba(138, 180, 248, 0.4); font-size: 0.8rem; text-decoration: none;"
          >
            Шаблон на GitHub
          </a>
        </div>
      </div>

      <!-- Create Empty Module Button -->
      <button
        id="btn-create-empty-module"
        class="btn-action"
        style="padding: 0.6rem; font-size: 0.85rem; border-color: var(--border-color); border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main); width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.25rem;"
        @click="createEmpty"
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
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Создать пустую тему
      </button>
    </div>
  </main>
</template>

<script>
import { useModulesStore } from '../stores/modules';
import { useProgressStore } from '../stores/progress';
import { useModal } from '../composables/useModal';

export default {
  name: 'ModuleSelector',
  setup() {
    const modulesStore = useModulesStore();
    const progressStore = useProgressStore();
    const { showAlert, showConfirm } = useModal();
    return { modulesStore, progressStore, showAlert, showConfirm };
  },
  data() {
    return {
      newModuleName: '',
      newModuleDesc: '',
      isDragOver: false,
      selectedFileName: ''
    };
  },
  methods: {
    async selectModule(mod) {
      try {
        await this.modulesStore.selectModule(mod.id);
        this.progressStore.currentScreen = 'dashboard';
      } catch (err) {
        this.showAlert({
          message: `Ошибка при загрузке темы: ${err.message}`
        });
      }
    },
    async confirmDelete(mod) {
      const confirmed = await this.showConfirm({
        message: `Вы уверены, что хотите удалить тему "${mod.name}"? Все ее данные будут стерты.`
      });
      if (confirmed) {
        this.modulesStore.deleteCustomModule(mod.id);
      }
    },
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    onFileSelected(e) {
      const file = e.target.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
    },
    onFileDrop(e) {
      this.isDragOver = false;
      const file = e.dataTransfer.files[0];
      if (file) {
        this.handleFileUpload(file);
      }
    },
    async handleFileUpload(file) {
      if (!file.name.endsWith('.md')) {
        this.showAlert({
          message: 'Допускаются только файлы разметки .md!'
        });
        return;
      }
      
      this.selectedFileName = file.name;
      
      try {
        const newMod = await this.modulesStore.handleCustomModuleImport(
          file,
          this.newModuleName,
          this.newModuleDesc
        );
        this.newModuleName = '';
        this.newModuleDesc = '';
        this.selectedFileName = '';
        
        this.showAlert({
          title: 'Успех',
          message: `Тема "${newMod.name}" успешно загружена! (Вопросов: ${this.modulesStore.modules.find(m => m.id === newMod.id)?.questionsCount || 0 || 'загружены'})`
        });
        
        // Auto select newly uploaded module
        await this.selectModule(newMod);
      } catch (err) {
        this.showAlert({
          message: `Ошибка при разборе файла вопросов: ${err.message}`
        });
        this.selectedFileName = '';
      }
    },
    async createEmpty() {
      const name = this.newModuleName.trim();
      const desc = this.newModuleDesc.trim();
      if (!name) {
        this.showAlert({
          message: 'Пожалуйста, введите название темы.'
        });
        return;
      }
      
      const newMod = this.modulesStore.createEmptyModule(name, desc);
      this.newModuleName = '';
      this.newModuleDesc = '';
      
      this.showAlert({
        title: 'Успех',
        message: `Тема "${newMod.name}" успешно создана! Вы можете перейти в просмотр темы, чтобы добавить вопросы.`
      });
      
      await this.selectModule(newMod);
    }
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.module-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  transition: var(--transition);
  cursor: pointer;
  position: relative;
}

.module-card:hover {
  border-color: var(--primary);
  background: rgba(138, 180, 248, 0.02);
}

.module-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.module-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #ffffff;
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

.module-card-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.4;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-card-footer {
  display: flex;
  justify-content: flex-start;
  margin-top: 0.25rem;
}
</style>
