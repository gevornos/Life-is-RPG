// Сервис для безопасного начисления наград через Edge Function

import { supabase } from './supabase';

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

      // Вызываем Edge Function
      const { data, error } = await supabase.functions.invoke('grant-reward', {
        body: request,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error granting reward:', error);
        throw error;
      }

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
