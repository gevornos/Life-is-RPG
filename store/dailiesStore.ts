import { create } from 'zustand';
import { Daily, DailyFrequency, AttributeType, TaskDifficulty } from '@/types';
import { XP_REWARDS, PENALTIES } from '@/constants/gameConfig';
import { useCharacterStore } from './characterStore';
import { persist } from './middleware/persist';

const XP_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  easy: XP_REWARDS.task_easy,
  medium: XP_REWARDS.task_medium,
  hard: XP_REWARDS.task_hard,
};

interface DailiesState {
  dailies: Daily[];
  isLoading: boolean;

  // Actions
  setDailies: (dailies: Daily[]) => void;
  addDaily: (daily: Omit<Daily, 'id' | 'created_at' | 'streak' | 'completed_today' | 'last_completed' | 'order'>) => void;
  updateDaily: (id: string, updates: Partial<Daily>) => void;
  deleteDaily: (id: string) => void;
  reorderDailies: (reorderedDailies: Daily[]) => void;

  // Game actions
  completeDaily: (id: string) => void;
  uncompleteDaily: (id: string) => void;
  resetDailies: () => void; // Вызывается в начале нового дня
  applyMissedPenalties: () => void; // Штрафы за пропущенные
}

const isToday = (dateString: string | null | undefined): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const useDailiesStore = create<DailiesState>(
  persist(
    (set, get) => ({
      dailies: [],
      isLoading: false,

  setDailies: (dailies) => {
    // Миграция: добавляем difficulty для старых записей
    const migratedDailies = dailies.map(daily => ({
      ...daily,
      difficulty: daily.difficulty || 'medium' as const,
    }));
    set({ dailies: migratedDailies });
  },

  addDaily: (dailyData) => {
    const { dailies } = get();
    const maxOrder = dailies.length > 0 ? Math.max(...dailies.map(d => d.order || 0)) : -1;
    const newDaily: Daily = {
      ...dailyData,
      id: Date.now().toString(),
      streak: 0,
      completed_today: false,
      last_completed: undefined,
      order: maxOrder + 1,
      created_at: new Date().toISOString(),
      difficulty: dailyData.difficulty || 'medium', // Дефолтное значение
    };
    set((state) => ({ dailies: [...state.dailies, newDaily] }));
  },

  updateDaily: (id, updates) => {
    set((state) => ({
      dailies: state.dailies.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  },

  deleteDaily: (id) => {
    set((state) => ({
      dailies: state.dailies.filter((d) => d.id !== id),
    }));
  },

  reorderDailies: (reorderedDailies) => {
    const dailiesWithNewOrder = reorderedDailies.map((daily, index) => ({
      ...daily,
      order: index,
    }));
    set({ dailies: dailiesWithNewOrder });
  },

  completeDaily: (id) => {
    const { dailies } = get();
    const daily = dailies.find((d) => d.id === id);
    if (!daily || daily.completed_today) return;

    const wasCompletedYesterday = daily.last_completed
      ? (() => {
          const last = new Date(daily.last_completed);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return (
            last.getDate() === yesterday.getDate() &&
            last.getMonth() === yesterday.getMonth() &&
            last.getFullYear() === yesterday.getFullYear()
          );
        })()
      : false;

    const newStreak = wasCompletedYesterday ? daily.streak + 1 : 1;

    // Обновляем ежедневное
    set((state) => ({
      dailies: state.dailies.map((d) =>
        d.id === id
          ? {
              ...d,
              completed_today: true,
              streak: newStreak,
              last_completed: new Date().toISOString(),
            }
          : d
      ),
    }));

    // Применяем награды
    const characterStore = useCharacterStore.getState();
    const baseXP = XP_BY_DIFFICULTY[daily.difficulty];
    const streakBonus = newStreak * XP_REWARDS.daily_streak_bonus;
    const xpReward = baseXP + streakBonus;
    characterStore.addXP(xpReward);

    // Увеличиваем серию для каждого атрибута
    daily.attributes.forEach((attr) => {
      characterStore.incrementAttributeStreak(attr);
    });
  },

  uncompleteDaily: (id) => {
    const { dailies } = get();
    const daily = dailies.find((d) => d.id === id);
    if (!daily || !daily.completed_today) return;

    // Откатываем выполнение
    set((state) => ({
      dailies: state.dailies.map((d) =>
        d.id === id
          ? {
              ...d,
              completed_today: false,
              streak: Math.max(0, d.streak - 1),
            }
          : d
      ),
    }));

    // Откатываем награды
    const characterStore = useCharacterStore.getState();
    const baseXP = XP_BY_DIFFICULTY[daily.difficulty];
    const streakBonus = daily.streak * XP_REWARDS.daily_streak_bonus;
    const xpReward = baseXP + streakBonus;
    characterStore.addXP(-xpReward);
  },

  resetDailies: () => {
    // Вызывается в начале нового дня
    set((state) => ({
      dailies: state.dailies.map((d) => ({
        ...d,
        completed_today: false,
      })),
    }));
  },

  applyMissedPenalties: () => {
    // Применяет штрафы за пропущенные вчера ежедневные
    const { dailies } = get();
    const characterStore = useCharacterStore.getState();

    dailies.forEach((daily) => {
      // Проверяем, было ли пропущено вчера
      const wasCompletedYesterday = daily.last_completed
        ? (() => {
            const last = new Date(daily.last_completed);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return (
              last.getDate() === yesterday.getDate() &&
              last.getMonth() === yesterday.getMonth() &&
              last.getFullYear() === yesterday.getFullYear()
            );
          })()
        : false;

      if (!wasCompletedYesterday && daily.streak > 0) {
        // Обнуляем серию
        set((state) => ({
          dailies: state.dailies.map((d) =>
            d.id === daily.id ? { ...d, streak: 0 } : d
          ),
        }));

        // Штраф XP
        characterStore.addXP(PENALTIES.daily_missed_xp);

        // Сбрасываем серии и штрафуем атрибуты
        daily.attributes.forEach((attr) => {
          characterStore.resetAttributeStreak(attr);
        });
      }
    });
  },
    }),
    { name: 'dailies-storage', version: 1 }
  )
);

// Миграция данных при инициализации
setTimeout(() => {
  const store = useDailiesStore.getState();
  const needsMigration = store.dailies.some(daily => !daily.difficulty);

  if (needsMigration) {
    const migratedDailies = store.dailies.map(daily => ({
      ...daily,
      difficulty: daily.difficulty || ('medium' as const),
    }));
    store.setDailies(migratedDailies);
  }
}, 100);
