// Edge Function: Сброс ежедневных заданий
// Вызывается по расписанию (cron) каждый день в полночь

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { Daily } from '../_shared/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Создаем Supabase клиент с правами service_role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Получаем текущую дату в формате YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    console.log(`Starting daily tasks reset for date: ${today}`);

    // Получаем все ежедневные задания, которые были выполнены не сегодня
    const { data: dailies, error: fetchError } = await supabase
      .from('dailies')
      .select('*')
      .or(`last_completed_date.neq.${today},last_completed_date.is.null`)
      .eq('completed_today', true);

    if (fetchError) {
      console.error('Error fetching dailies:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dailies?.length || 0} dailies to reset`);

    if (dailies && dailies.length > 0) {
      // Сбрасываем completed_today для всех этих заданий
      const { error: updateError } = await supabase
        .from('dailies')
        .update({ completed_today: false })
        .or(`last_completed_date.neq.${today},last_completed_date.is.null`)
        .eq('completed_today', true);

      if (updateError) {
        console.error('Error updating dailies:', updateError);
        throw updateError;
      }

      console.log(`Successfully reset ${dailies.length} daily tasks`);
    }

    // Также проверяем задания, которые НЕ были выполнены вчера
    // и обнуляем их серию (streak)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: missedDailies, error: missedError } = await supabase
      .from('dailies')
      .select('*')
      .eq('completed_today', false)
      .or(`last_completed_date.lt.${yesterdayStr},last_completed_date.is.null`)
      .neq('streak', 0);

    if (missedError) {
      console.error('Error fetching missed dailies:', missedError);
      throw missedError;
    }

    console.log(`Found ${missedDailies?.length || 0} missed dailies with broken streaks`);

    if (missedDailies && missedDailies.length > 0) {
      // Сбрасываем серию для пропущенных заданий
      const { error: streakResetError } = await supabase
        .from('dailies')
        .update({ streak: 0 })
        .in('id', missedDailies.map(d => d.id));

      if (streakResetError) {
        console.error('Error resetting streaks:', streakResetError);
        throw streakResetError;
      }

      console.log(`Reset streaks for ${missedDailies.length} missed daily tasks`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        reset_count: dailies?.length || 0,
        streak_reset_count: missedDailies?.length || 0,
        date: today,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in reset-daily-tasks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
