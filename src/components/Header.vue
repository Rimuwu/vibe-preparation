<template>
  <header>
    <!-- Brand Logo / Title -->
    <div
      class="brand"
      :class="{ 'repo-link-active': isMainScreen }"
      id="brand-home"
      @click="onBrandClick"
    >
      <img src="/icons/icon-192.png" alt="Logo" class="brand-logo" />
      <h1>Preparation.vibe</h1>
      <svg
        class="external-link-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="7" y1="17" x2="17" y2="7"></line>
        <polyline points="7 7 17 7 17 17"></polyline>
      </svg>
      <span class="brand-badge">AS1</span>
    </div>

    <!-- Navigation Area -->
    <div class="nav-container" ref="navContainer">
      <!-- Burger Toggle Button (Mobile) -->
      <button id="btn-menu-toggle" class="btn-icon" title="Меню" @click="toggleMenu">
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
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      <!-- Navigation Buttons -->
      <div class="nav-buttons" :class="{ active: menuOpen }">
        <!-- Home / Dashboard -->
        <button
          id="btn-show-home"
          class="btn-icon"
          title="На главную"
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
          id="btn-show-viewer"
          class="btn-icon"
          title="Просмотр темы"
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
          id="btn-show-stats"
          class="btn-icon"
          title="Статистика"
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
          id="btn-show-lists"
          class="btn-icon"
          title="Мои наборы"
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
          id="btn-show-leaderboard"
          class="btn-icon"
          title="Таблица лидеров"
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
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
          </svg>
          <span class="nav-text">Лидеры</span>
        </button>

        <!-- Tickets -->
        <button
          id="btn-show-tickets"
          class="btn-icon"
          title="Билеты"
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

        <!-- Chat -->
        <button
          v-if="progressStore.aiEnabled"
          id="btn-show-chat"
          class="btn-icon"
          title="Чат с ИИ"
          :class="{ active: progressStore.currentScreen === 'chat' }"
          @click="navigate('chat')"
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
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="nav-text">Чат с ИИ</span>
        </button>

        <!-- Settings -->
        <button
          id="btn-show-settings"
          class="btn-icon"
          title="Настройки"
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
      </div>
    </div>
  </header>
</template>

<script>
import { useProgressStore } from '../stores/progress';
import { useModal } from '../composables/useModal';

export default {
  name: 'Header',
  setup() {
    const progressStore = useProgressStore();
    const { showAlert, showConfirm } = useModal();
    return { progressStore, showAlert, showConfirm };
  },
  data() {
    return {
      menuOpen: false
    };
  },
  computed: {
    isMainScreen() {
      const scr = this.progressStore.currentScreen;
      return scr === 'modules' || scr === 'dashboard';
    }
  },
  mounted() {
    document.addEventListener('click', this.handleOutsideClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleOutsideClick);
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen;
    },
    handleOutsideClick(e) {
      if (
        this.menuOpen &&
        this.$refs.navContainer &&
        !this.$refs.navContainer.contains(e.target)
      ) {
        this.menuOpen = false;
      }
    },
    onBrandClick() {
      if (this.isMainScreen) {
        window.open('https://github.com/Rimuwu/vibe-preparation', '_blank');
      } else {
        if (this.progressStore.activeModuleId) {
          this.progressStore.currentScreen = 'dashboard';
        } else {
          this.progressStore.currentScreen = 'modules';
        }
      }
    },
    async navigate(screen) {
      this.menuOpen = false;
      
      // Clear user profile inspect data when navigating manually
      this.progressStore.clearViewingProfileDataOnly();

      if (screen === 'home') {
        if (this.progressStore.activeModuleId) {
          this.progressStore.currentScreen = 'dashboard';
        } else {
          this.progressStore.currentScreen = 'modules';
        }
        return;
      }
      
      // Viewer requires a module to be selected first
      if (screen === 'viewer' && !this.progressStore.activeModuleId) {
        this.showAlert({
          message: 'Пожалуйста, сначала выберите тему на главном экране.'
        });
        return;
      }
      
      // Clean study state if we were studying and decided to navigate away
      if (this.progressStore.currentScreen === 'study' && screen !== 'study') {
        const confirmed = await this.showConfirm({
          message: 'Вы уверены, что хотите завершить сессию подготовки? Текущий прогресс сессии будет сброшен.'
        });
        if (!confirmed) return;
        this.progressStore.clearActiveSession();
      }
      
      this.progressStore.currentScreen = screen;
    }
  }
};
</script>

<style scoped>
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  width: 100%;
}

@media (min-width: 768px) {
  header {
    display: none !important;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.brand-logo {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 6px;
}

.brand h1 {
  font-size: 1.5rem;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: #ffffff;
}

.brand-badge {
  background: var(--primary-dark);
  color: var(--primary);
  border: 1px solid rgba(138, 180, 248, 0.3);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.brand .external-link-icon {
  display: none;
  color: var(--text-muted);
  margin-left: -0.2rem;
  transition: var(--transition);
}

.brand.repo-link-active .external-link-icon {
  display: inline-block;
}

.brand.repo-link-active:hover h1 {
  text-decoration: underline;
  color: var(--primary);
}

.brand.repo-link-active:hover .external-link-icon {
  color: var(--primary);
}

.nav-container {
  position: relative;
}

#btn-menu-toggle {
  display: none;
}

.nav-text {
  display: none;
}

.nav-buttons {
  display: flex;
  gap: 0.5rem;
}

.nav-buttons button.active {
  color: var(--primary);
  border-color: var(--primary);
  background: var(--primary-dark);
}

@media (max-width: 576px) {
  #btn-menu-toggle {
    display: flex;
    z-index: 110;
  }

  .nav-buttons {
    display: none;
    position: absolute;
    top: 45px;
    right: 0;
    background: var(--panel-bg);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.5rem;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
    z-index: 105;
    animation: fadeIn 0.2s ease;
    align-items: stretch;
    min-width: 195px;
  }

  .nav-buttons.active {
    display: flex;
  }

  .nav-buttons .btn-icon {
    border-radius: var(--radius-sm);
    justify-content: flex-start;
    padding: 0.6rem 0.8rem;
    width: 100%;
    border: none;
  }

  .nav-buttons .btn-icon:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .nav-buttons .nav-text {
    display: inline;
    font-size: 0.9rem;
    font-weight: 500;
    margin-left: 0.6rem;
  }
}
</style>
