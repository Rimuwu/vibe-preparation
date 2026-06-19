<template>
  <section id="screen-leaderboard" class="screen active">
    <!-- Top Section: Username Config -->
    <div class="panel">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 1rem;">Никнейм для лидерборда</h2>
      <div style="display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap;">
        <div class="form-group" style="flex-grow: 1; margin-bottom: 0; min-width: 200px;">
          <label for="input-nickname">Ваше имя в таблице</label>
          <input
            type="text"
            id="input-nickname"
            class="search-input"
            placeholder="Например: Ivan_JS"
            style="width: 100%;"
            v-model="tempNickname"
            @keyup.enter="saveNickname"
          />
        </div>
        
        <button
          id="btn-save-nickname"
          class="btn-primary"
          style="width: auto; padding: 0.75rem 1.5rem; height: 46px; border-radius: var(--radius-sm); font-size: 0.9rem;"
          :disabled="savingNickname"
          @click="saveNickname"
        >
          {{ savingNickname ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>

    <!-- Leaderboard Panel -->
    <div class="panel" style="flex-grow: 1; display: flex; flex-direction: column;">
      <div
        style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;"
      >
        <h2 style="font-size: 1.25rem; font-weight: 700; margin: 0;">Таблица лидеров</h2>
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-grow: 1; justify-content: flex-end;">
          <label
            for="leaderboard-module-select"
            style="font-size: 0.8rem; color: var(--text-muted); margin: 0; white-space: nowrap;"
          >
            Тема:
          </label>
          <select
            id="leaderboard-module-select"
            class="select-control"
            style="width: auto; max-width: 250px; padding: 0.4rem 0.75rem; font-size: 0.85rem; height: 36px; border-radius: var(--radius-sm);"
            v-model="selectedModuleId"
            @change="loadLeaderboard"
          >
            <option v-for="mod in standardModules" :key="mod.id" :value="mod.id">
              {{ mod.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Table -->
      <div id="leaderboard-container" style="overflow-x: auto; flex-grow: 1;">
        <table
          class="leaderboard-table"
          style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;"
        >
          <thead>
            <tr
              style="border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase;"
            >
              <th style="padding: 0.75rem 0.5rem; width: 60px;">Место</th>
              <th style="padding: 0.75rem 0.5rem;">Пользователь</th>
              <th style="padding: 0.75rem 0.5rem; text-align: center; width: 100px;">Пройдено</th>
              <th style="padding: 0.75rem 0.5rem; text-align: center; width: 100px;">Точность</th>
              <th style="padding: 0.75rem 0.5rem; text-align: right; width: 150px;">Обновлено</th>
            </tr>
          </thead>
          
          <tbody v-if="entries.length > 0">
            <tr
              v-for="entry in entries"
              :key="entry.rank + entry.nickname"
              :class="{ 'current-user': entry.nickname === progressStore.nickname, 'clickable': entry.id }"
              @click="viewProfile(entry)"
            >
              <td :class="getRankClass(entry.rank)" style="padding: 0.75rem 0.5rem;">
                {{ entry.rank }}
              </td>
              <td style="padding: 0.75rem 0.5rem; word-break: break-all;">
                {{ entry.nickname }}
              </td>
              <td style="padding: 0.75rem 0.5rem; text-align: center;">
                {{ entry.completedCount }} / {{ entry.totalCount }}
              </td>
              <td style="padding: 0.75rem 0.5rem; text-align: center;">
                {{ Math.round(entry.accuracy) }}%
              </td>
              <td style="padding: 0.75rem 0.5rem; text-align: right; font-size: 0.8rem; color: var(--text-muted);">
                {{ formatDate(entry.updatedAt) }}
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="loading" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Загрузка таблицы лидеров...
        </div>
        
        <div v-else-if="entries.length === 0" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          {{ emptyMessage }}
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProgressStore } from '../stores/progress';
import { useModulesStore } from '../stores/modules';
import { useModal } from '../composables/useModal';

export default {
  name: 'Leaderboard',
  setup(props, { emit }) {
    const progressStore = useProgressStore();
    const modulesStore = useModulesStore();
    const router = useRouter();
    const { showAlert } = useModal();

    const tempNickname = ref(progressStore.nickname);
    const selectedModuleId = ref('');
    const entries = ref([]);
    const loading = ref(false);
    const savingNickname = ref(false);
    const emptyMessage = ref('В этой теме пока нет участников. Будьте первым!');

    const standardModules = computed(() => {
      return modulesStore.modules.filter(m => !m.isCustom);
    });

    onMounted(async () => {
      console.log('[Leaderboard] onMounted, apiUrl:', progressStore.apiUrl, 'nickname:', progressStore.nickname);
      // Fetch details from modules list if loaded
      if (standardModules.value.length > 0) {
        // Find default selection
        const activeMod = modulesStore.activeModule;
        if (activeMod && !activeMod.isCustom) {
          selectedModuleId.value = activeMod.id;
        } else {
          selectedModuleId.value = standardModules.value[0].id;
        }

        // Auto push latest test statistics on screen enter
        if (progressStore.nickname) {
          try {
            console.log('[Leaderboard] Auto-pushing stats for', progressStore.nickname);
            const mods = await Promise.all(
              standardModules.value.map(async (m) => {
                const qs = await modulesStore.loadQuestionsForModule(m);
                return { id: m.id, name: m.name, questions: qs };
              })
            );
            await progressStore.pushLeaderboardStatsSilently(mods);
          } catch (e) {
            console.warn('[Leaderboard] Auto-push failed:', e);
          }
        }

        loadLeaderboard();
      }
    });

    const loadLeaderboard = async () => {
      const modId = selectedModuleId.value;
      if (!modId) return;

      loading.value = true;
      entries.value = [];
      emptyMessage.value = 'Загрузка таблицы лидеров...';

      try {
        const res = await fetch(`${progressStore.apiUrl}/api/leaderboard/${modId}`);
        if (!res.ok) throw new Error('Не удалось загрузить таблицу лидеров с сервера');

        const data = await res.json();
        entries.value = data;
        if (data.length === 0) {
          emptyMessage.value = 'В этой теме пока нет участников. Будьте первым!';
        }
      } catch (err) {
        console.error('Leaderboard error:', err);
        emptyMessage.value = 'Ошибка загрузки: проверьте подключение к бэкенду';
      } finally {
        loading.value = false;
      }
    };

    const saveNickname = async () => {
      const nickname = tempNickname.value.trim();
      if (!nickname) {
        showAlert({ message: 'Пожалуйста, введите никнейм.' });
        return;
      }

      console.log('[Leaderboard] saveNickname called', { nickname, apiUrl: progressStore.apiUrl });
      savingNickname.value = true;

      try {
        // Standard modules validation
        const mods = await Promise.all(
          standardModules.value.map(async (m) => {
            const qs = await modulesStore.loadQuestionsForModule(m);
            return { id: m.id, name: m.name, questions: qs };
          })
        );
        console.log('[Leaderboard] Loaded modules for submit:', mods.map(m => m.id));

        const res = await progressStore.submitLeaderboardStats(nickname, mods);
        console.log('[Leaderboard] submitLeaderboardStats result:', res);
        if (res.success) {
          progressStore.saveNickname(nickname);
          showAlert({
            title: 'Успех',
            message: 'Никнейм успешно сохранен и статистика отправлена в таблицу лидеров!'
          });
          loadLeaderboard();
        } else {
          showAlert({
            title: 'Ошибка',
            message: 'Не удалось сохранить никнейм:\n\n' + res.error
          });
        }
      } catch (e) {
        console.error('[Leaderboard] saveNickname exception:', e);
        showAlert({ message: 'Ошибка при сохранении никнейма: ' + e.message });
      } finally {
        savingNickname.value = false;
      }
    };

    const getRankClass = (rank) => {
      let cls = 'rank-col';
      if (rank === 1) return cls + ' rank-1';
      if (rank === 2) return cls + ' rank-2';
      if (rank === 3) return cls + ' rank-3';
      return cls;
    };

    const formatDate = (isoString) => {
      if (!isoString) return '—';
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const viewProfile = (entry) => {
      if (!entry.id) return;
      router.push({ name: 'stats', query: { user: entry.id } });
    };

    return {
      progressStore,
      modulesStore,
      tempNickname,
      selectedModuleId,
      entries,
      loading,
      savingNickname,
      emptyMessage,
      standardModules,
      loadLeaderboard,
      saveNickname,
      getRankClass,
      formatDate,
      viewProfile
    };
  }
};
</script>

<style scoped>
.screen {
  width: 100%;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 0.85rem 0.75rem;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.9rem;
}

.leaderboard-table th {
  color: var(--text-muted);
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.leaderboard-table tbody tr {
  transition: var(--transition);
}

.leaderboard-table tbody tr.clickable {
  cursor: pointer;
}

.leaderboard-table tbody tr.clickable:hover {
  background: rgba(138, 180, 248, 0.04);
}

.leaderboard-table tbody tr.current-user {
  background: var(--primary-dark);
  color: var(--primary);
  font-weight: 500;
}

.leaderboard-table tbody tr.current-user td {
  border-bottom-color: rgba(138, 180, 248, 0.3);
}

.leaderboard-table .rank-col {
  font-weight: 600;
}

.leaderboard-table .rank-1 {
  color: #ffca28;
}

.leaderboard-table .rank-2 {
  color: #b0bec5;
}

.leaderboard-table .rank-3 {
  color: #ff8a65;
}
</style>

