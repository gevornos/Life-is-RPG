// Игровая конфигурация (синхронизировано с клиентом)

import xpRewardsData from '../../../constants/generated/xp-rewards.json' assert { type: 'json' };
import levelProgressionData from '../../../constants/generated/level-progression.json' assert { type: 'json' };

// Вспомогательная функция для поиска значения XP
const getXPValue = (actionType: string, difficulty: string): number => {
  const reward = xpRewardsData.find(
    (r: any) => r.action_type === actionType && r.difficulty === difficulty
  );
  return reward?.xp_value ?? 0;
};

// XP награды за действия
export const XP_REWARDS = {
  habit_positive: getXPValue('habit', 'positive'),
  habit_negative: getXPValue('habit', 'negative'),
  daily_base: getXPValue('daily', 'base'),
  daily_streak_bonus: getXPValue('daily', 'streak_bonus'),
  task_easy: getXPValue('task', 'easy'),
  task_medium: getXPValue('task', 'medium'),
  task_hard: getXPValue('task', 'hard'),
};

// Золото за действия
export const GOLD_REWARDS = {
  habit_positive: 2,
  daily_base: 3,
  daily_streak_bonus: 1, // За каждый день серии
  task_easy: 5,
  task_medium: 10,
  task_hard: 20,
};

// Прогрессия уровней
export const LEVEL_PROGRESSION: Array<{
  level: number;
  required_xp_total: number;
  required_xp_for_level: number;
}> = levelProgressionData;

// XP для конкретного уровня
export const calculateXPForLevel = (level: number): number => {
  const levelData = LEVEL_PROGRESSION.find(l => l.level === level);
  return levelData?.required_xp_for_level ?? level * 100;
};

// Расчёт уровня из XP
export const calculateLevelFromXP = (xp: number): number => {
  for (let i = LEVEL_PROGRESSION.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_PROGRESSION[i].required_xp_total) {
      return LEVEL_PROGRESSION[i].level;
    }
  }
  return 1;
};

// Прокачка характеристик: +1 за каждые 3 дня серии
export const STREAK_DAYS_FOR_ATTRIBUTE_POINT = 3;

// Штрафы
export const PENALTIES = {
  daily_missed_xp: -25,
  daily_missed_attribute: -1,
};
