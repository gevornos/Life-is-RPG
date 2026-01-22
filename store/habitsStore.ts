import { create } from 'zustand';
import { Habit, HabitType, TaskDifficulty } from '@/types';
import { XP_REWARDS } from '@/constants/gameConfig';
import { useCharacterStore } from './characterStore';
import { persist } from './middleware/persist';
import { rewardsService } from '@/lib/rewardsService';

const XP_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  easy: XP_REWARDS.habit_positive,
  medium: Math.floor(XP_REWARDS.habit_positive * 1.5),
  hard: XP_REWARDS.habit_positive * 2,
};

interface HabitsState {
  habits: Habit[];
  isLoading: boolean;

  // Actions
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'streak' | 'negative_streak' | 'last_completed' | 'last_action_date' | 'order'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (reorderedHabits: Habit[]) => void;

  // Game actions
  completeHabit: (id: string) => Promise<void>;
  failHabit: (id: string) => Promise<void>;
  applyMissedHabitPenalties: () => void;
}

export const useHabitsStore = create<HabitsState>(
  persist(
    (set, get) => ({
      habits: [],
      isLoading: false,

  setHabits: (habits) => set({ habits }),

  addHabit: (habitData) => {
    const { habits } = get();
    const maxOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order || 0)) : -1;
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      streak: 0,
      negative_streak: 0,
      last_completed: undefined,
      last_action_date: undefined,
      order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ habits: [...state.habits, newHabit] }));
  },

  updateHabit: (id, updates) => {
    set((state) => ({
      habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    }));
  },

  deleteHabit: (id) => {
    set((state) => ({
      habits: state.habits.filter((h) => h.id !== id),
    }));
  },

  reorderHabits: (reorderedHabits) => {
    const habitsWithNewOrder = reorderedHabits.map((habit, index) => ({
      ...habit,
      order: index,
    }));
    set({ habits: habitsWithNewOrder });
  },

  completeHabit: async (id) => {
    const { habits } = get();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const today = new Date().toISOString().split('T')[0];

    // Серия всегда увеличивается на 1
    const newStreak = habit.streak + 1;

    // Обновляем привычку
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id
          ? {
              ...h,
              streak: newStreak,
              negative_streak: 0,
              last_completed: new Date().toISOString(),
              last_action_date: new Date().toISOString(),
            }
          : h
      ),
    }));

    // Применяем награды через защищенную серверную функцию
    try {
      const reward = await rewardsService.grantHabitReward(
        id,
        true, // is_positive
        habit.attributes[0] // используем первый атрибут для награды
      );

      console.log('Habit reward granted:', reward);

      // Обновляем персонажа с сервера после начисления
      const characterStore = useCharacterStore.getState();
      await characterStore.loadFromServer();

      // Увеличиваем серию для каждого атрибута (локально)
      habit.attributes.forEach((attr) => {
        characterStore.incrementAttributeStreak(attr);
      });
    } catch (error) {
      console.error('Failed to grant habit reward:', error);
      // Откатываем локальные изменения при ошибке
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id
            ? {
                ...h,
                streak: habit.streak,
                negative_streak: habit.negative_streak,
                last_completed: habit.last_completed,
                last_action_date: habit.last_action_date,
              }
            : h
        ),
      }));
    }
  },

  failHabit: async (id) => {
    const { habits } = get();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    const oldNegativeStreak = habit.negative_streak;

    // Обновляем привычку - сбрасываем положительную серию, увеличиваем отрицательную
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id
          ? {
              ...h,
              streak: 0,
              negative_streak: h.negative_streak + 1,
              last_action_date: new Date().toISOString(),
            }
          : h
      ),
    }));

    // Применяем штраф через защищенную серверную функцию
    try {
      const reward = await rewardsService.grantHabitReward(
        id,
        false, // is_positive (negative habit)
        habit.attributes[0]
      );

      console.log('Habit penalty applied:', reward);

      // Обновляем персонажа с сервера
      const characterStore = useCharacterStore.getState();
      await characterStore.loadFromServer();

      // Сбрасываем серии и штрафуем каждый атрибут на -1 (локально)
      habit.attributes.forEach((attr) => {
        characterStore.resetAttributeStreak(attr);
      });
    } catch (error) {
      console.error('Failed to apply habit penalty:', error);
      // Откатываем локальные изменения при ошибке
      set((state) => ({
        habits: state.habits.map((h) =>
          h.id === id
            ? {
                ...h,
                streak: habit.streak,
                negative_streak: oldNegativeStreak,
                last_action_date: habit.last_action_date,
              }
            : h
        ),
      }));
    }
  },

  applyMissedHabitPenalties: () => {
    const { habits } = get();
    const today = new Date().toISOString().split('T')[0];

    habits.forEach((habit) => {
      const lastActionDate = habit.last_action_date?.split('T')[0];

      // Если привычка была использована и сегодня не было действий
      if (habit.last_action_date && lastActionDate !== today) {
        // Применяем тот же эффект, что и при нажатии на "-"
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === habit.id
              ? {
                  ...h,
                  streak: 0,
                  negative_streak: h.negative_streak + 1,
                  last_action_date: new Date().toISOString(),
                }
              : h
          ),
        }));

        const characterStore = useCharacterStore.getState();
        characterStore.addXP(XP_REWARDS.habit_negative);

        habit.attributes.forEach((attr) => {
          characterStore.resetAttributeStreak(attr);
        });
      }
    });
  },
    }),
    { name: 'habits-storage', version: 1 }
  )
);
