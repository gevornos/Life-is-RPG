import { create } from 'zustand';
import { Task, TaskDifficulty, AttributeType } from '@/types';
import { XP_REWARDS } from '@/constants/gameConfig';
import { useCharacterStore } from './characterStore';
import { persist } from './middleware/persist';
import { rewardsService } from '@/lib/rewardsService';

interface TasksState {
  tasks: Task[];
  isLoading: boolean;

  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'completed' | 'completed_at' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (reorderedTasks: Task[]) => void;

  // Game actions
  completeTask: (id: string) => Promise<void>;
  uncompleteTask: (id: string) => void;

  // Filters
  getActiveTasks: () => Task[];
  getCompletedTasks: () => Task[];
}

const XP_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  easy: XP_REWARDS.task_easy,
  medium: XP_REWARDS.task_medium,
  hard: XP_REWARDS.task_hard,
};

export const useTasksStore = create<TasksState>(
  persist(
    (set, get) => ({
      tasks: [],
      isLoading: false,

  setTasks: (tasks) => set({ tasks }),

  addTask: (taskData) => {
    const { tasks } = get();
    const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : -1;
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      completed: false,
      completed_at: undefined,
      order: maxOrder + 1,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  reorderTasks: (reorderedTasks) => {
    const tasksWithNewOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
    }));
    set({ tasks: tasksWithNewOrder });
  },

  completeTask: async (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task || task.completed) return;

    const oldCompletedAt = task.completed_at;

    // Обновляем задачу
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: true,
              completed_at: new Date().toISOString(),
            }
          : t
      ),
    }));

    // Применяем награды через защищенную серверную функцию
    try {
      const reward = await rewardsService.grantTaskReward(
        id,
        task.difficulty,
        task.attributes[0] // используем первый атрибут
      );

      console.log('Task reward granted:', reward);

      // Обновляем персонажа с сервера
      const characterStore = useCharacterStore.getState();
      await characterStore.loadFromServer();

      // Увеличиваем серию для каждого атрибута (локально)
      task.attributes.forEach((attr) => {
        characterStore.incrementAttributeStreak(attr);
      });
    } catch (error) {
      console.error('Failed to grant task reward:', error);
      // Откатываем локальные изменения при ошибке
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: false,
                completed_at: oldCompletedAt,
              }
            : t
        ),
      }));
    }
  },

  uncompleteTask: (id) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === id);
    if (!task || !task.completed) return;

    // Откатываем выполнение
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: false,
              completed_at: undefined,
            }
          : t
      ),
    }));

    // Откатываем награды
    const characterStore = useCharacterStore.getState();
    characterStore.addXP(-XP_BY_DIFFICULTY[task.difficulty]);

    // Сбрасываем серии и штрафуем атрибуты
    task.attributes.forEach((attr) => {
      characterStore.resetAttributeStreak(attr);
    });
  },

  getActiveTasks: () => {
    return get().tasks.filter((t) => !t.completed);
  },

  getCompletedTasks: () => {
    return get().tasks.filter((t) => t.completed);
  },
    }),
    { name: 'tasks-storage', version: 1 }
  )
);
