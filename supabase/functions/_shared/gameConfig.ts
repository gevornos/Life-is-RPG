// Игровая конфигурация (синхронизировано с клиентом)

import rewardsConfig from './rewards.json' assert { type: 'json' };

// XP награды за действия
export const XP_REWARDS = rewardsConfig.XP_REWARDS;

// Золото за действия
export const GOLD_REWARDS = rewardsConfig.GOLD_REWARDS;

// Прогрессия уровней
export const LEVEL_PROGRESSION: Array<{
  level: number;
  required_xp_total: number;
  required_xp_for_level: number;
}> = rewardsConfig.LEVEL_PROGRESSION;

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
export const STREAK_DAYS_FOR_ATTRIBUTE_POINT = rewardsConfig.STREAK_DAYS_FOR_ATTRIBUTE_POINT;

// Штрафы
export const PENALTIES = {
  daily_missed_xp: -25,
  daily_missed_attribute: -1,
};
