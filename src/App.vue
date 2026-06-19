<template>
  <div class="app-layout">
    <!-- Sidebar navigation for desktop -->
    <aside class="app-sidebar">
      <div class="sidebar-brand" @click="onBrandClick">
        <img src="/icons/icon-192.png" alt="Logo" class="sidebar-logo" />
        <h1 class="sidebar-title">Vibe</h1>
        <span class="brand-badge">AS1</span>
      </div>

      <nav class="sidebar-nav">
        <!-- Dashboard / Modules -->
        <button
          class="sidebar-nav-btn"
          :class="{ active: progressStore.currentScreen === 'modules' || progressStore.currentScreen === 'dashboard' }"
          @click="navigate('home')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span class="nav-text">На главную</span>
        </button>

        <!-- Topic Viewer -->
        <button
          class="sidebar-nav-btn"
          :class="{ active: progressStore.currentScreen === 'viewer' }"
          :disabled="!progressStore.activeModuleId"
          @click="navigate('viewer')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <span class="nav-text">Просмотр темы</span>
        </button>

        <!-- Statistics -->
        <button
          class="sidebar-nav-btn"
          :class="{ active: progressStore.currentScreen === 'stats' }"
          @click="navigate('stats')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span class="nav-text">Статистика</span>
        </button>

        <!-- Custom Lists / My Sets -->
        <button
          class="sidebar-nav-btn"
          :class="{ active: progressStore.currentScreen === 'lists' }"
          @click="navigate('lists')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          <span class="nav-text">Мои наборы</span>
        </button>

        <!-- Leaderboard -->
        <button
          class="sidebar-nav-btn"
          :class="{ active: progressStore.currentScreen === 'leaderboard' }"
          @click="navigate('leaderboard')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span class="nav-text">Лидерборд</span>
        </button>

        <!-- Tickets -->
        <button
          class="sidebar-nav-btn"
          :class="{ active: progressStore.currentScreen === 'tickets' }"
          @click="navigate('tickets')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
            <path d="M13 5v2"></path>
            <path d="M13 17v2"></path>
            <path d="M13 11v2"></path>
          </svg>
          <span class="nav-text">Билеты</span>
        </button>

        <!-- Settings -->
        <button
          class="sidebar-nav-btn"
          :class="{ active: progressStore.currentScreen === 'settings' }"
          @click="navigate('settings')"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l-.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            ></path>
          </svg>
          <span class="nav-text">Настройки</span>
        </button>
      </nav>
    </aside>

    <div class="app-container">
      <!-- Header -->
      <Header
        @show-alert="showAlert"
        @show-confirm="showConfirm"
        @show-prompt="showPrompt"
      />

      <!-- Active Screen Transition -->
      <div class="router-view-wrapper">
      <router-view v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component
            :is="Component"
            @show-alert="showAlert"
            @show-confirm="showConfirm"
            @show-prompt="showPrompt"
            @show-edit-question="showEditQuestion"
            @show-share-card="showShareCard"
            @trigger-selection-mode="triggerSelectionModeInViewer"
            ref="activeScreenRef"
          />
        </Transition>
      </router-view>
    </div>

    <!-- Global Modal dialog component -->
    <Modal
      :visible="modal.visible"
      :title="modal.title"
      :type="modal.type"
      :message="modal.message"
      :defaultValue="modal.defaultValue"
      :questionData="modal.questionData"
      @close="onModalCancel"
      @ok="onModalOk"
      @ok-error="onModalError"
    />

    <!-- Canvas image share card overlay dialog -->
    <Transition name="fade">
      <div v-if="shareCard.visible" class="modal-overlay" @click.self="shareCard.visible = false">
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <h3>Карточка прогресса</h3>
            <button class="modal-close-btn" @click="shareCard.visible = false">&times;</button>
          </div>
          <div class="modal-body" style="text-align: center;">
            <p style="margin-bottom:0.75rem; font-size:0.9rem; color:var(--text-muted);">
              Вот ваша карточка прогресса. Вы можете сохранить её или скопировать в буфер обмена!
            </p>
            <img :src="shareCard.imgUrl" class="share-image-preview" alt="Progress Card" style="max-width: 100%; border-radius: var(--radius-md); border: 1px solid var(--border-color);" />
          </div>
          <div class="modal-footer" id="modal-footer">
            <button
              class="btn-action"
              style="border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: transparent; color: var(--text-main);"
              @click="shareCard.visible = false"
            >
              Закрыть
            </button>
            <button
              v-if="showCopyButton"
              class="btn-action"
              style="border-radius: var(--radius-sm); border: 1px solid var(--primary); background: var(--primary-dark); color: var(--primary); font-size: 0.9rem; padding: 0.6rem 1.25rem;"
              @click="copyShareImage"
            >
              {{ shareCard.copyText }}
            </button>
            <button
              class="btn-primary"
              style="width: auto; border-radius: var(--radius-sm); padding: 0.6rem 1.25rem;"
              @click="downloadShareImage"
            >
              Скачать
            </button>
          </div>
        </div>
      </div>
    </Transition>
    </div>
  </div>
</template>

<script>
import { computed, ref, reactive, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useProgressStore } from './stores/progress';
import { useModulesStore } from './stores/modules';
import { useModal } from './composables/useModal';

// Import Layout Components
import Header from './components/Header.vue';
import Modal from './components/Modal.vue';

export default {
  name: 'App',
  components: {
    Header,
    Modal
  },
  setup() {
    const progressStore = useProgressStore();
    const modulesStore = useModulesStore();
    const activeScreenRef = ref(null);
    const router = useRouter();

    const {
      modal,
      shareCard,
      showAlert,
      showConfirm,
      showPrompt,
      showEditQuestion,
      showShareCard,
      onModalCancel,
      onModalOk
    } = useModal();

    const showCopyButton = computed(() => {
      const hasClipboardSupport = !!(navigator.clipboard && typeof ClipboardItem !== 'undefined');
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) {
        // On PC/Desktop, only show copy button if clipboard image copying is supported
        return hasClipboardSupport;
      }
      return true; // Always show on mobile, as standard modal instruction helper copy fallback is useful
    });

    onMounted(async () => {
      // Initialize stores
      progressStore.init();
      await modulesStore.loadModules();

      // Silent cloud sync on start
      if (progressStore.syncCode) {
        try {
          await progressStore.cloudSyncNow();
          
          // Refresh list of standard modules standard questions on success
          const standardMods = modulesStore.modules.filter(m => !m.isCustom);
          const resolvedMods = await Promise.all(
            standardMods.map(async (m) => {
              const qs = await modulesStore.loadQuestionsForModule(m);
              return { id: m.id, name: m.name, questions: qs };
            })
          );
          
          await progressStore.pushLeaderboardStatsSilently(resolvedMods);
        } catch (e) {
          console.warn('[Cloud Sync Syncing failed silently]', e);
        }
      }

      // Sync initial route based on loaded state if router is at root
      if (router.currentRoute.value.name === 'modules' && progressStore.currentScreen !== 'modules') {
        router.replace({ name: progressStore.currentScreen });
      }
    });

    // Sync store changes to router
    watch(
      () => progressStore.currentScreen,
      (newScreen) => {
        if (router.currentRoute.value.name !== newScreen) {
          router.push({ name: newScreen }).catch(() => {});
        }
      }
    );

    // Sync router changes back to store (e.g. browser back/forward buttons)
    router.afterEach((to) => {
      if (to.name && progressStore.currentScreen !== to.name) {
        progressStore.currentScreen = to.name;
      }
    });

    const onModalError = (errorMsg) => {
      showAlert({ message: errorMsg });
    };

    const triggerSelectionModeInViewer = () => {
      // Triggers custom selections checklist in viewer
      nextTick(() => {
        if (activeScreenRef.value && typeof activeScreenRef.value.toggleSelectionMode === 'function') {
          activeScreenRef.value.toggleSelectionMode();
        }
      });
    };

    const downloadShareImage = () => {
      const a = document.createElement('a');
      a.href = shareCard.value.imgUrl;
      const activeModule = modulesStore.activeModule;
      const safeName = activeModule ? activeModule.name.replace(/[^a-z0-9а-яё_-]/gi, '_') : 'stats';
      a.download = `vibe-prep-progress-${safeName}.png`;
      a.click();
      shareCard.value.visible = false;
    };

    const copyShareImage = () => {
      if (!shareCard.value.canvas) return;
      try {
        shareCard.value.canvas.toBlob((blob) => {
          if (!blob) {
            showAlert({ message: 'Не удалось создать изображение для копирования.' });
            return;
          }
          if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob
              })
            ]).then(() => {
              shareCard.value.copyText = 'Скопировано! ✓';
              setTimeout(() => {
                shareCard.value.copyText = 'Копировать';
              }, 2000);
            }).catch(err => {
              console.error('Clipboard write error:', err);
              fallbackCopyText();
            });
          } else {
            fallbackCopyText();
          }
        }, 'image/png');
      } catch (e) {
        console.error('Canvas toBlob error:', e);
        fallbackCopyText();
      }
    };

    const fallbackCopyText = () => {
      try {
        const url = shareCard.value.imgUrl;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
          shareCard.value.copyText = 'Ссылка скопирована! ✓';
          setTimeout(() => {
            shareCard.value.copyText = 'Копировать';
          }, 2000);
        } else {
          throw new Error('Clipboard text API not available');
        }
      } catch (err) {
        showAlert({ 
          title: 'Копирование',
          message: 'Не удалось скопировать изображение автоматически.\n\nПожалуйста, нажмите правой кнопкой мыши по картинке (или зажмите её пальцем на телефоне) и выберите "Копировать изображение".' 
        });
      }
    };

    const onBrandClick = () => {
      const scr = progressStore.currentScreen;
      const isMainScreen = scr === 'modules' || scr === 'dashboard';
      if (isMainScreen) {
        window.open('https://github.com/Rimuwu/vibe-preparation', '_blank');
      } else {
        if (progressStore.activeModuleId) {
          progressStore.currentScreen = 'dashboard';
        } else {
          progressStore.currentScreen = 'modules';
        }
      }
    };

    const navigate = async (screen) => {
      // Clear user profile inspect data when navigating manually
      progressStore.clearViewingProfileDataOnly();

      if (screen === 'home') {
        if (progressStore.activeModuleId) {
          progressStore.currentScreen = 'dashboard';
        } else {
          progressStore.currentScreen = 'modules';
        }
        return;
      }
      
      if (screen === 'viewer' && !progressStore.activeModuleId) {
        showAlert({
          message: 'Пожалуйста, сначала выберите тему на главном экране.'
        });
        return;
      }
      
      if (progressStore.currentScreen === 'study' && screen !== 'study') {
        const confirmed = await showConfirm({
          message: 'Вы уверены, что хотите завершить сессию подготовки? Текущий прогресс сессии будет сброшен.'
        });
        if (!confirmed) return;
        progressStore.clearActiveSession();
      }
      
      progressStore.currentScreen = screen;
    };

    return {
      progressStore,
      modulesStore,
      activeScreenRef,
      modal,
      shareCard,
      showAlert,
      showConfirm,
      showPrompt,
      showEditQuestion,
      onModalCancel,
      onModalOk,
      onModalError,
      triggerSelectionModeInViewer,
      showShareCard,
      downloadShareImage,
      copyShareImage,
      onBrandClick,
      navigate,
      showCopyButton
    };
  }
};
</script>

<style>
/* Router view wrapper — enforces consistent full width and height for all pages */
.router-view-wrapper {
  width: 100%;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* All screen-level components inherit full width and fill the layout */
.router-view-wrapper > * {
  width: 100%;
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Global styles for transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
  width: 100%;
  min-width: 0;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.share-image-preview {
  margin-top: 0.5rem;
  max-width: 100%;
  max-height: 55vh;
  object-fit: contain;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
}
</style>
