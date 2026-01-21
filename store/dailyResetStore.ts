import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDailiesStore } from './dailiesStore';
import { useHabitsStore } from './habitsStore';

const LAST_RESET_DATE_KEY = 'last_reset_date';

interface DailyResetState {
  lastResetDate: string | null;
  isChecking: boolean;

  // Actions
  checkAndResetIfNeeded: () => Promise<void>;
  setLastResetDate: (date: string) => void;
}

const getToday = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const useDailyResetStore = create<DailyResetState>((set, get) => ({
  lastResetDate: null,
  isChecking: false,

  setLastResetDate: (date) => set({ lastResetDate: date }),

  checkAndResetIfNeeded: async () => {
    set({ isChecking: true });

    try {
      // Получаем последнюю дату сброса из AsyncStorage
      const storedDate = await AsyncStorage.getItem(LAST_RESET_DATE_KEY);
      const today = getToday();

      set({ lastResetDate: storedDate });

      // Если это первый запуск или новый день
      if (!storedDate || storedDate !== today) {
        const dailiesStore = useDailiesStore.getState();
        const habitsStore = useHabitsStore.getState();

        // Применяем штрафы за пропущенные ежедневные (только если был предыдущий день)
        if (storedDate) {
          dailiesStore.applyMissedPenalties();
          habitsStore.applyMissedHabitPenalties();
        }

        // Сбрасываем статус выполнения
        dailiesStore.resetDailies();

        // Сохраняем новую дату
        await AsyncStorage.setItem(LAST_RESET_DATE_KEY, today);
        set({ lastResetDate: today });

        console.log(`Daily reset completed for ${today}`);
      }
    } catch (error) {
      console.error('Error during daily reset:', error);
    } finally {
      set({ isChecking: false });
    }
  },
}));
