// Edge Function: Начисление наград за выполнение заданий
// Защищенная функция - вызывается с клиента, но валидация на сервере

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Character, RewardResult } from '../_shared/types.ts';
import {
  XP_REWARDS,
  GOLD_REWARDS,
  calculateLevelFromXP,
  STREAK_DAYS_FOR_ATTRIBUTE_POINT,
} from '../_shared/gameConfig.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrantRewardRequest {
  action_type: 'habit' | 'daily' | 'task';
  difficulty?: 'easy' | 'medium' | 'hard' | 'positive' | 'negative';
  attribute: 'strength' | 'health' | 'intelligence' | 'creativity' | 'discipline';
  streak?: number;
  item_id?: string; // ID привычки/задания для валидации
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Получаем токен пользователя из заголовков
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Используем токен пользователя для авторизации
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Проверяем авторизацию
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Парсим тело запроса
    const body: GrantRewardRequest = await req.json();
    const { action_type, difficulty, attribute, streak = 0, item_id } = body;

    console.log('Grant reward request:', { user_id: user.id, action_type, difficulty, attribute, streak });

    // Валидация: проверяем, что задание действительно принадлежит пользователю
    if (item_id) {
      let tableName = '';
      if (action_type === 'habit') tableName = 'habits';
      else if (action_type === 'daily') tableName = 'dailies';
      else if (action_type === 'task') tableName = 'tasks';

      if (tableName) {
        const { data: item, error: itemError } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', item_id)
          .eq('user_id', user.id)
          .single();

        if (itemError || !item) {
          throw new Error('Invalid item or unauthorized');
        }
      }
    }

    // Рассчитываем награды
    let xpGained = 0;
    let goldGained = 0;

    if (action_type === 'habit') {
      if (difficulty === 'positive') {
        xpGained = XP_REWARDS.habit_positive;
        goldGained = GOLD_REWARDS.habit_positive;
      } else if (difficulty === 'negative') {
        xpGained = XP_REWARDS.habit_negative;
      }
    } else if (action_type === 'daily') {
      xpGained = XP_REWARDS.daily_base + (XP_REWARDS.daily_streak_bonus * streak);
      goldGained = GOLD_REWARDS.daily_base + (GOLD_REWARDS.daily_streak_bonus * streak);
    } else if (action_type === 'task') {
      if (difficulty === 'easy') {
        xpGained = XP_REWARDS.task_easy;
        goldGained = GOLD_REWARDS.task_easy;
      } else if (difficulty === 'medium') {
        xpGained = XP_REWARDS.task_medium;
        goldGained = GOLD_REWARDS.task_medium;
      } else if (difficulty === 'hard') {
        xpGained = XP_REWARDS.task_hard;
        goldGained = GOLD_REWARDS.task_hard;
      }
    }

    // Получаем текущего персонажа
    const { data: character, error: charError } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (charError || !character) {
      throw new Error('Character not found');
    }

    const oldLevel = character.level;
    const newXP = character.xp + xpGained;
    const newGold = character.gold + goldGained;
    const newLevel = calculateLevelFromXP(newXP);
    const leveledUp = newLevel > oldLevel;

    // Проверяем, нужно ли повысить атрибут (каждые 3 дня серии)
    let attributeGained = 0;
    const updates: any = {
      xp: newXP,
      gold: newGold,
      level: newLevel,
      updated_at: new Date().toISOString(),
    };

    if (action_type === 'daily' && streak > 0 && streak % STREAK_DAYS_FOR_ATTRIBUTE_POINT === 0) {
      attributeGained = 1;
      updates[attribute] = character[attribute] + 1;
    }

    // Обновляем персонажа
    const { error: updateError } = await supabase
      .from('characters')
      .update(updates)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating character:', updateError);
      throw updateError;
    }

    const result: RewardResult = {
      xp_gained: xpGained,
      gold_gained: goldGained,
      attribute_gained: attributeGained,
      level_up: leveledUp,
      new_level: leveledUp ? newLevel : undefined,
    };

    console.log('Reward granted successfully:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in grant-reward:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
