import { create } from 'zustand';
import { Habit, HabitType, TaskDifficulty } from '@/types';
import { XP_REWARDS, GOLD_REWARDS } from '@/constants/gameConfig';
import { useCharacterStore } from './characterStore';

const XP_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  easy: XP_REWARDS.habit_positive,
  medium: Math.floor(XP_REWARDS.habit_positive * 1.5),
  hard: XP_REWARDS.habit_positive * 2,
};

const GOLD_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  easy: GOLD_REWARDS.habit_positive,
  medium: Math.floor(GOLD_REWARDS.habit_positive * 1.5),
  hard: GOLD_REWARDS.habit_positive * 2,
};

interface HabitsState {
  habits: Habit[];
  isLoading: boolean;

  // Actions
  setHabits: (habits: Habit[]) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'created_at' | 'counter_up' | 'counter_down' | 'order'>) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (reorderedHabits: Habit[]) => void;

  // Game actions
  incrementPositive: (id: string) => void;
  incrementNegative: (id: string) => void;
}

export const useHabitsStore = create<HabitsState>((set, get) => ({
  habits: [],
  isLoading: false,

  setHabits: (habits) => set({ habits }),

  addHabit: (habitData) => {
    const { habits } = get();
    const maxOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order || 0)) : -1;
    const newHabit: Habit = {
      ...habitData,
      id: Date.now().toString(),
      counter_up: 0,
      counter_down: 0,
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

  incrementPositive: (id) => {
    const { habits } = get();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    // Обновляем счётчик
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, counter_up: h.counter_up + 1 } : h
      ),
    }));

    // Применяем награды через characterStore
    const characterStore = useCharacterStore.getState();
    characterStore.addXP(XP_BY_DIFFICULTY[habit.difficulty]);
    characterStore.addGold(GOLD_BY_DIFFICULTY[habit.difficulty]);
    // Прокачиваем все выбранные атрибуты (включая discipline)
    characterStore.incrementTaskCount(habit.attributes);
  },

  incrementNegative: (id) => {
    const { habits } = get();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;

    // Обновляем счётчик
    set((state) => ({
      habits: state.habits.map((h) =>
        h.id === id ? { ...h, counter_down: h.counter_down + 1 } : h
      ),
    }));

    // Применяем штраф
    const characterStore = useCharacterStore.getState();
    characterStore.addXP(XP_REWARDS.habit_negative);
  },
}));
