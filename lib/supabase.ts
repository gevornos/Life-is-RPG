import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Proxy URL для доступа из России
const PROXY_URL = "https://proxy-server-two-omega.vercel.app";

// Supabase credentials
const SUPABASE_URL = "https://vrfabgvwrracgeirmptm.supabase.co"; // Реальный URL для JWT валидации
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyZmFiZ3Z3cnJhY2dlaXJtcHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDQ2ODcsImV4cCI6MjA4NDU4MDY4N30.JjsQUvfMWhdtXXANdn-LIpDRB6oj5BAVgg-LlteJT64";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    // Переопределяем fetch для перенаправления через proxy
    fetch: (url, options = {}) => {
      // Заменяем Supabase URL на proxy URL
      const proxyUrl = url.toString().replace(SUPABASE_URL, PROXY_URL);
      return fetch(proxyUrl, options);
    },
  },
});

// Типы для базы данных (соответствуют schema.sql)
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
          gems: number;
          strength: number;
          health: number;
          intelligence: number;
          creativity: number;
          discipline: number;
          attribute_streaks: {
            strength: number;
            health: number;
            intelligence: number;
            creativity: number;
            discipline: number;
          };
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["characters"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["characters"]["Insert"]>;
      };
    };
  };
};
