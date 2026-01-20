import { create } from 'zustand';
import { Daily, DailyFrequency, AttributeType } from '@/types';
import { XP_REWARDS, GOLD_REWARDS, PENALTIES } from '@/constants/gameConfig';
import { useCharacterStore } from './characterStore';

interface DailiesState {
  dailies: Daily[];
  isLoading: boolean;

  // Actions
  setDailies: (dailies: Daily[]) => void;
  addDaily: (daily: Omit<Daily, 'id' | 'created_at' | 'streak' | 'completed_today' | 'last_completed'>) => void;
  updateDaily: (id: string, updates: Partial<Daily>) => void;
  deleteDaily: (id: string) => void;

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

export const useDailiesStore = create<DailiesState>((set, get) => ({
  dailies: [],
  isLoading: false,

  setDailies: (dailies) => set({ dailies }),

  addDaily: (dailyData) => {
    const newDaily: Daily = {
      ...dailyData,
      id: Date.now().toString(),
      streak: 0,
      completed_today: false,
      last_completed: undefined,
      created_at: new Date().toISOString(),
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
    const xpReward = XP_REWARDS.daily_base + newStreak * XP_REWARDS.daily_streak_bonus;
    characterStore.addXP(xpReward);
    characterStore.addGold(GOLD_REWARDS.daily_base);
    characterStore.incrementTaskCount(daily.attributes);
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
    const xpReward = XP_REWARDS.daily_base + daily.streak * XP_REWARDS.daily_streak_bonus;
    characterStore.addXP(-xpReward);
    characterStore.addGold(-GOLD_REWARDS.daily_base);
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

        // Штраф к характеристикам
        daily.attributes.forEach((attr) => {
          characterStore.decreaseAttribute(attr, PENALTIES.daily_missed_attribute);
        });
      }
    });
  },
}));
