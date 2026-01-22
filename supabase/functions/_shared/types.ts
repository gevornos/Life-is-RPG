// Общие типы для Edge Functions

export interface Character {
  id: string;
  user_id: string;
  name: string;
  level: number;
  xp: number;
  hp: number;
  max_hp: number;
  gold: number;
  gems: number;
  strength: number;
  health: number;
  intelligence: number;
  creativity: number;
  discipline: number;
  created_at: string;
  updated_at?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  attribute: 'strength' | 'health' | 'intelligence' | 'creativity' | 'discipline';
  is_positive: boolean;
  streak: number;
  last_completed_date?: string;
  created_at: string;
}

export interface Daily {
  id: string;
  user_id: string;
  title: string;
  attribute: 'strength' | 'health' | 'intelligence' | 'creativity' | 'discipline';
  streak: number;
  completed_today: boolean;
  last_completed_date?: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  attribute: 'strength' | 'health' | 'intelligence' | 'creativity' | 'discipline';
  due_date?: string;
  is_completed: boolean;
  created_at: string;
}

export interface RewardResult {
  xp_gained: number;
  gold_gained: number;
  attribute_gained?: number;
  new_level?: number;
  level_up?: boolean;
}
