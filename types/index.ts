// Атрибуты персонажа
export type AttributeType = 'strength' | 'health' | 'intelligence' | 'creativity' | 'discipline';

// Тип привычки
export type HabitType = 'positive' | 'negative' | 'both';

// Сложность задачи
export type TaskDifficulty = 'easy' | 'medium' | 'hard';

// Частота ежедневных заданий
export type DailyFrequency = 'daily' | 'weekly';

// Персонаж
export interface Character {
  id: string;
  user_id: string;
  name: string;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  gold: number;
  gems: number; // Алмазы - премиум валюта
  strength: number;
  health: number;
  intelligence: number;
  creativity: number;
  discipline: number;
  last_active: string;
  created_at: string;
}

// Привычка
export interface Habit {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  type: HabitType;
  attributes: AttributeType[]; // Какие атрибуты качает (включая discipline)
  difficulty: TaskDifficulty;
  counter_up: number;
  counter_down: number;
  order: number;
  created_at: string;
}

// Ежедневное задание
export interface Daily {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  attributes: AttributeType[];
  frequency: DailyFrequency;
  days_of_week?: number[]; // 0-6, где 0 = воскресенье
  streak: number;
  last_completed?: string;
  completed_today: boolean;
  order: number;
  created_at: string;
}

// Задача (To-Do)
export interface Task {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  attributes: AttributeType[];
  difficulty: TaskDifficulty;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  order: number;
  created_at: string;
}

// Монстр
export interface Monster {
  id: string;
  user_id: string;
  name: string;
  hp: number;
  max_hp: number;
  weakness: AttributeType[];
  reward_gold: number;
  reward_xp: number;
  defeated: boolean;
  spawn_date: string;
  created_at: string;
}

// Информация об атрибуте для UI
export interface AttributeInfo {
  key: AttributeType;
  name: string;
  icon: string;
  color: string;
  description: string;
}

// XP награды
export interface XPReward {
  xp: number;
  gold: number;
  attributeGain?: {
    attribute: AttributeType;
    amount: number;
  }[];
}
