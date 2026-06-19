import { createRouter, createWebHashHistory } from 'vue-router';
import ModuleSelector from './components/ModuleSelector.vue';
import Dashboard from './components/Dashboard.vue';
import StudyArea from './components/StudyArea.vue';
import Statistics from './components/Statistics.vue';
import ModuleViewer from './components/ModuleViewer.vue';
import CustomLists from './components/CustomLists.vue';
import Leaderboard from './components/Leaderboard.vue';
import Settings from './components/Settings.vue';
import TicketGenerator from './components/TicketGenerator.vue';
import Chat from './components/Chat.vue';
import { useProgressStore } from './stores/progress';
import { useModulesStore } from './stores/modules';

const routes = [
  { path: '/', name: 'modules', component: ModuleSelector },
  { path: '/dashboard', name: 'dashboard', component: Dashboard },
  { path: '/study', name: 'study', component: StudyArea },
  { path: '/stats', name: 'stats', component: Statistics },
  { path: '/viewer', name: 'viewer', component: ModuleViewer },
  { path: '/lists', name: 'lists', component: CustomLists },
  { path: '/leaderboard', name: 'leaderboard', component: Leaderboard },
  { path: '/settings', name: 'settings', component: Settings },
  { path: '/tickets', name: 'tickets', component: TicketGenerator },
  { path: '/chat', name: 'chat', component: Chat },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const progressStore = useProgressStore();
  const modulesStore = useModulesStore();
  
  // Clear user profile inspect data when navigating away from stats
  if (to.name !== 'stats') {
    progressStore.clearViewingProfileDataOnly();
  }
  
  // Ensure modules are loaded on initial navigation
  if (modulesStore.modules.length === 0) {
    try {
      await modulesStore.loadModules();
    } catch (e) {
      console.warn('[Router] Failed to load modules manifest', e);
    }
  }

  // If activeModuleId is set but modulesStore does not have it loaded, select it
  if (progressStore.activeModuleId) {
    if (!modulesStore.activeModule || modulesStore.activeModule.id !== progressStore.activeModuleId) {
      try {
        await modulesStore.selectModule(progressStore.activeModuleId);
      } catch (e) {
        console.warn('[Router] Could not select module', e);
      }
    }
  }

  if (to.name === 'chat') {
    if (!progressStore.aiEnabled) {
      next({ name: 'modules' });
      return;
    }
  }

  if (to.name === 'dashboard' || to.name === 'viewer') {
    if (!progressStore.activeModuleId) {
      next({ name: 'modules' });
      return;
    }
  }
  
  if (to.name === 'study') {
    if (!progressStore.activeModuleId || progressStore.sessionQueue.length === 0) {
      next({ name: 'modules' });
      return;
    }
  }

  next();
});
