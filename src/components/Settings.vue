<template>
  <section id="screen-settings" class="screen active">
    <div class="panel">
      <!-- Title header -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1.25rem;">
        <h2 style="font-size: 1.25rem; font-weight: 700; margin:0;">⚙️ Настройки</h2>
        <button
          id="btn-settings-back"
          class="btn-action"
          style="padding: 0.4rem 0.75rem; font-size: 0.8rem; border: 1px solid var(--border-color); background: transparent; color: var(--text-main); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 0.25rem;"
          @click="goBack"
        >
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
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Назад
        </button>
      </div>

      <!-- Cloud Sync Section -->
      <div style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
        <h3
          style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0;"
        >
          Облачная синхронизация
        </h3>

        <!-- Sync badge status -->
        <div
          style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--radius-md);"
        >
          <span style="font-size: 0.9rem; color: var(--text-muted);">Статус:</span>
          <span id="sync-status-badge" class="brand-badge" :style="badgeStyle">
            {{ statusText }}
          </span>
        </div>

        <!-- NOT CONNECTED: code inputs/generates -->
        <div
          v-if="!progressStore.syncCode"
          id="sync-setup-actions"
          style="display: flex; gap: 0.75rem; flex-wrap: wrap;"
        >
          <button
            class="btn-primary"
            style="flex: 1; min-width: 160px; border-radius: var(--radius-sm); font-size: 0.85rem; padding: 0.6rem 1rem;"
            :disabled="progressStore.isSyncing"
            @click="generateSyncCode"
          >
            {{ progressStore.isSyncing ? 'Выгрузка...' : 'Передать данные (Сгенерировать код)' }}
          </button>
          
          <button
            class="btn-action"
            style="flex: 1; min-width: 160px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main); font-size: 0.85rem; padding: 0.6rem 1rem;"
            :disabled="progressStore.isSyncing"
            @click="enterSyncCode"
          >
            Принять данные (Ввести код)
          </button>
        </div>

        <!-- CONNECTED: manual sync, disconnect -->
        <div
          v-else
          id="sync-connected-actions"
          style="display: flex; flex-direction: column; gap: 0.75rem;"
        >
          <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
            Код синхронизации:
            <strong
              id="sync-code-display"
              style="color: var(--primary); font-size: 1rem; letter-spacing: 0.05em;"
            >
              {{ progressStore.syncCode }}
            </strong>
            <br />Используйте этот код на других устройствах, чтобы связать их с этим прогрессом.
          </div>
          
          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.25rem;">
            <button
              class="btn-primary"
              style="flex: 1; min-width: 160px; border-radius: var(--radius-sm); font-size: 0.85rem; padding: 0.6rem 1rem;"
              :disabled="progressStore.isSyncing"
              @click="syncCloud"
            >
              {{ progressStore.isSyncing ? 'Синхронизация...' : 'Обновить (Синхронизировать)' }}
            </button>
            
            <button
              class="btn-action"
              style="flex: 1; min-width: 160px; border-radius: var(--radius-sm); border: 1px solid var(--error); background: var(--error-dark); color: var(--error); font-size: 0.85rem; padding: 0.6rem 1rem;"
              @click="disconnectSync"
            >
              Отключить синхронизацию
            </button>
          </div>
        </div>
      </div>

      <div style="height: 1px; background: var(--border-color); margin-bottom: 1.25rem;"></div>

      <!-- Local Backup section -->
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        <h3
          style="font-size: 0.9rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.25rem 0;"
        >
          Локальный бэкап
        </h3>
        
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button
            class="btn-primary"
            style="padding: 0.6rem 1rem; font-size: 0.85rem; width: auto; flex-grow: 1; border-radius: 100px;"
            @click="exportLocalProgress"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Экспорт прогресса
          </button>
          
          <button
            class="btn-action"
            style="padding: 0.6rem 1rem; font-size: 0.85rem; border-color: var(--border-color); flex-grow: 1; border-radius: 100px; background: transparent; color: var(--text-main); border: 1px solid var(--border-color);"
            @click="triggerImportInput"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Импорт прогресса
          </button>
          
          <input
            type="file"
            ref="importInput"
            accept=".json"
            style="display: none;"
            @change="importLocalProgress"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { computed, ref } from 'vue';
import { useProgressStore } from '../stores/progress';
import { useModulesStore } from '../stores/modules';
import { useModal } from '../composables/useModal';

export default {
  name: 'Settings',
  setup(props, { emit }) {
    const progressStore = useProgressStore();
    const modulesStore = useModulesStore();
    const { showAlert, showConfirm, showPrompt } = useModal();
    const importInput = ref(null);

    const isConnected = computed(() => !!progressStore.syncCode);

    const statusText = computed(() => {
      if (progressStore.isSyncing) return 'Синхронизация...';
      if (progressStore.syncError) return 'Ошибка синхронизации';
      if (isConnected.value) return 'Синхронизировано по коду';
      return 'Локальный режим';
    });

    const badgeStyle = computed(() => {
      if (progressStore.isSyncing) {
        return {
          color: 'var(--warning)',
          borderColor: 'rgba(253, 214, 99, 0.3)',
          background: 'var(--warning-dark)'
        };
      }
      if (progressStore.syncError) {
        return {
          color: 'var(--error)',
          borderColor: 'rgba(242, 139, 130, 0.3)',
          background: 'var(--error-dark)'
        };
      }
      if (isConnected.value) {
        return {
          color: 'var(--success)',
          borderColor: 'rgba(129, 201, 149, 0.3)',
          background: 'var(--success-dark)'
        };
      }
      return {
        color: 'var(--text-muted)',
        borderColor: 'rgba(158, 158, 158, 0.3)',
        background: 'rgba(158, 158, 158, 0.15)'
      };
    });

    const goBack = () => {
      if (progressStore.activeModuleId) {
        progressStore.currentScreen = 'dashboard';
      } else {
        progressStore.currentScreen = 'modules';
      }
    };

    const generateSyncCode = async () => {
      const confirm = await showConfirm({
        message: 'Вы действительно хотите выгрузить свои данные в облако и создать код синхронизации? Все локальные данные на другом устройстве будут заменены вашими при вводе этого кода.'
      });
      if (!confirm) return;

      try {
        const code = await progressStore.cloudGenerateSyncCode();
        showAlert({
          title: 'Успех',
          message: `Синхронизация успешно создана!\n\nВаш код: ${code}\n\nВведите этот код на другом устройстве для переноса данных.`
        });
      } catch (err) {
        showAlert({
          message: 'Не удалось сгенерировать код синхронизации: ' + err.message
        });
      }
    };

    const enterSyncCode = async () => {
      const code = await showPrompt({
        title: 'Ввод кода',
        message: 'Введите код синхронизации (например, VIBE-ABCD-1234):'
      });
      if (!code) return;

      const confirm = await showConfirm({
        message: 'Вы уверены? Импорт данных заменит ваш текущий локальный прогресс данными из облака.'
      });
      if (!confirm) return;

      try {
        await progressStore.cloudConnectWithSyncCode(code);
        showAlert({
          title: 'Успех',
          message: 'Данные успешно импортированы и устройства связаны!'
        });
        
        // Reload all modules and category configs
        await modulesStore.loadModules();
      } catch (err) {
        showAlert({
          message: 'Не удалось подключиться к синхронизации: ' + err.message
        });
      }
    };

    const syncCloud = async () => {
      try {
        // Run compare sync
        const status = await progressStore.cloudSyncNow();
        
        if (status === 'pulled') {
          showAlert({
            title: 'Успех',
            message: 'Данные успешно загружены из облака!'
          });
          await modulesStore.loadModules();
        } else if (status === 'pushed') {
          showAlert({
            title: 'Успех',
            message: 'Данные успешно выгружены в облако!'
          });
        } else if (status === 'synced') {
          showAlert({
            title: 'Синхронно',
            message: 'Локальные данные уже полностью соответствуют облачной копии!'
          });
        }
      } catch (err) {
        showAlert({
          message: 'Ошибка во время синхронизации: ' + err.message
        });
      }
    };

    const disconnectSync = async () => {
      const confirm = await showConfirm({
        message: 'Вы уверены, что хотите отключить синхронизацию? Устройства больше не будут обмениваться данными, но ваш локальный прогресс сохранится.'
      });
      if (confirm) {
        progressStore.disconnectSync();
        showAlert({
          title: 'Готово',
          message: 'Синхронизация отключена.'
        });
      }
    };

    // Exports imports logic
    const exportLocalProgress = () => {
      try {
        const json = progressStore.exportProgressJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibe-prep-progress-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        showAlert({ message: 'Не удалось экспортировать прогресс: ' + err.message });
      }
    };

    const triggerImportInput = () => {
      if (importInput.value) {
        importInput.value.click();
      }
    };

    const importLocalProgress = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const jsonText = evt.target.result;
          progressStore.importProgressJSON(jsonText);
          await showAlert({
            title: 'Импорт завершен',
            message: 'Данные прогресса и тем успешно импортированы!'
          });
          // Reload page/data
          window.location.reload();
        } catch (err) {
          showAlert({ message: 'Ошибка при импорте: ' + err.message });
        }
      };
      reader.readAsText(file);
    };

    return {
      progressStore,
      modulesStore,
      importInput,
      isConnected,
      statusText,
      badgeStyle,
      goBack,
      generateSyncCode,
      enterSyncCode,
      syncCloud,
      disconnectSync,
      exportLocalProgress,
      triggerImportInput,
      importLocalProgress
    };
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}
</style>

