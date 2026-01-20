import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Замените на свои данные из Supabase Dashboard
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Типы для базы данных
export type Database = {
  public: {
    Tables: {
      characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          level: number;
          xp: number;
          hp: number;
          max_hp: number;
          gold: number;
          strength: number;
          health: number;
          intelligence: number;
          creativity: number;
          discipline: number;
          last_active: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['characters']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['characters']['Insert']>;
      };
      habits: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          type: 'positive' | 'negative' | 'both';
          counter_up: number;
          counter_down: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['habits']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['habits']['Insert']>;
      };
      dailies: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          attributes: string[];
          frequency: 'daily' | 'weekly';
          days_of_week: number[] | null;
          streak: number;
          last_completed: string | null;
          completed_today: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['dailies']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['dailies']['Insert']>;
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          notes: string | null;
          attributes: string[];
          difficulty: 'easy' | 'medium' | 'hard';
          due_date: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tasks']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['tasks']['Insert']>;
      };
      monsters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          hp: number;
          max_hp: number;
          weakness: string[];
          reward_gold: number;
          reward_xp: number;
          defeated: boolean;
          spawn_date: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['monsters']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['monsters']['Insert']>;
      };
    };
  };
};
