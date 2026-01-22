// Сервис для безопасного начисления наград через Edge Function

import { supabase } from './supabase';

// Proxy URL для Edge Functions
const PROXY_URL = 'https://proxy-server-two-omega.vercel.app';

export interface GrantRewardRequest {
  action_type: 'habit' | 'daily' | 'task';
  difficulty?: 'easy' | 'medium' | 'hard' | 'positive' | 'negative';
  attribute: 'strength' | 'health' | 'intelligence' | 'creativity' | 'discipline';
  streak?: number;
  item_id?: string;
}

export interface RewardResult {
  xp_gained: number;
  gold_gained: number;
  attribute_gained?: number;
  level_up?: boolean;
  new_level?: number;
}

class RewardsService {
  /**
   * Начислить награду за выполнение задания (защищенная серверная функция)
   */
  async grantReward(request: GrantRewardRequest): Promise<RewardResult> {
    try {
      // Получаем токен текущего пользователя
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Делаем прямой fetch через proxy
      console.log('Calling grant-reward with:', request);
      console.log('Proxy URL:', `${PROXY_URL}/functions/v1/grant-reward`);

      const response = await fetch(`${PROXY_URL}/functions/v1/grant-reward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(request),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', JSON.stringify([...response.headers.entries()]));

      const responseText = await response.text();
      console.log('Response body:', responseText);

      if (!response.ok) {
        console.error('Error granting reward:', response.status, responseText);
        throw new Error(`Failed to grant reward: ${response.status} ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed reward data:', data);
      return data as RewardResult;
    } catch (error) {
      console.error('Failed to grant reward:', error);
      throw error;
    }
  }

  /**
   * Начислить награду за выполнение привычки
   */
  async grantHabitReward(
    habitId: string,
    isPositive: boolean,
    attribute: GrantRewardRequest['attribute']
  ): Promise<RewardResult> {
    return this.grantReward({
      action_type: 'habit',
      difficulty: isPositive ? 'positive' : 'negative',
      attribute,
      item_id: habitId,
    });
  }

  /**
   * Начислить награду за выполнение ежедневного задания
   */
  async grantDailyReward(
    dailyId: string,
    streak: number,
    attribute: GrantRewardRequest['attribute']
  ): Promise<RewardResult> {
    return this.grantReward({
      action_type: 'daily',
      streak,
      attribute,
      item_id: dailyId,
    });
  }

  /**
   * Начислить награду за выполнение задачи
   */
  async grantTaskReward(
    taskId: string,
    difficulty: 'easy' | 'medium' | 'hard',
    attribute: GrantRewardRequest['attribute']
  ): Promise<RewardResult> {
    return this.grantReward({
      action_type: 'task',
      difficulty,
      attribute,
      item_id: taskId,
    });
  }
}

export const rewardsService = new RewardsService();
