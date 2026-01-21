// Конфигурация игровой механики

// Импортируем сгенерированные конфиги из CSV
import xpRewardsData from './generated/xp-rewards.json';
import levelProgressionData from './generated/level-progression.json';

// Вспомогательная функция для поиска значения XP
const getXPValue = (actionType: string, difficulty: string): number => {
  const reward = xpRewardsData.find(
    (r: any) => r.action_type === actionType && r.difficulty === difficulty
  );
  return reward?.xp_value ?? 0;
};

// XP награды за действия (загружаются из CSV)
export const XP_REWARDS = {
  habit_positive: getXPValue('habit', 'positive'),
  habit_negative: getXPValue('habit', 'negative'),
  daily_base: getXPValue('daily', 'base'),
  daily_streak_bonus: getXPValue('daily', 'streak_bonus'),
  task_easy: getXPValue('task', 'easy'),
  task_medium: getXPValue('task', 'medium'),
  task_hard: getXPValue('task', 'hard'),
  monster_defeat_min: 50,
  monster_defeat_max: 200,
};

// Прогрессия уровней (загружается из CSV)
export const LEVEL_PROGRESSION: Array<{
  level: number;
  required_xp_total: number;
  required_xp_for_level: number;
}> = levelProgressionData;

// Золото за действия (больше не начисляется автоматически за задания)
// export const GOLD_REWARDS = {
//   habit_positive: 2,
//   daily_base: 3,
//   task_easy: 5,
//   task_medium: 10,
//   task_hard: 20,
// };

// Штрафы
export const PENALTIES = {
  daily_missed_xp: -25,
  daily_missed_attribute: -1,
  inactive_1_day_xp_percent: 0.1, // 10% от текущего XP
  inactive_3_days_attribute_percent: 0.05, // 5% характеристик
};

// XP для конкретного уровня (из таблицы прогрессии)
export const calculateXPForLevel = (level: number): number => {
  const levelData = LEVEL_PROGRESSION.find(l => l.level === level);
  return levelData?.required_xp_for_level ?? level * 100; // Fallback на старую формулу
};

// Расчёт уровня из XP (используя таблицу)
export const calculateLevelFromXP = (xp: number): number => {
  // Ищем максимальный уровень, который можно достичь с текущим XP
  for (let i = LEVEL_PROGRESSION.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_PROGRESSION[i].required_xp_total) {
      return LEVEL_PROGRESSION[i].level;
    }
  }
  return 1; // Минимальный уровень
};

// XP до следующего уровня (используя таблицу)
export const calculateXPToNextLevel = (currentXP: number, currentLevel: number): number => {
  const currentLevelData = LEVEL_PROGRESSION.find(l => l.level === currentLevel);
  const nextLevelData = LEVEL_PROGRESSION.find(l => l.level === currentLevel + 1);

  if (!currentLevelData || !nextLevelData) {
    // Fallback если уровень не найден в таблице
    return calculateXPForLevel(currentLevel) - (currentXP - (currentLevelData?.required_xp_total ?? 0));
  }

  return nextLevelData.required_xp_total - currentXP;
};

// Прогресс в текущем уровне (0-1, используя таблицу)
export const calculateLevelProgress = (currentXP: number, currentLevel: number): number => {
  const currentLevelData = LEVEL_PROGRESSION.find(l => l.level === currentLevel);
  const nextLevelData = LEVEL_PROGRESSION.find(l => l.level === currentLevel + 1);

  if (!currentLevelData || !nextLevelData) {
    return 0;
  }

  const xpInCurrentLevel = currentXP - currentLevelData.required_xp_total;
  const xpNeededForLevel = nextLevelData.required_xp_total - currentLevelData.required_xp_total;

  return xpInCurrentLevel / xpNeededForLevel;
};

// Урон монстрам
export const calculateDamage = (
  baseStats: { strength: number; health: number; intelligence: number; creativity: number; discipline: number },
  monsterWeakness: string[]
): number => {
  const baseDamage = 10;
  let bonus = 0;

  monsterWeakness.forEach((weakness) => {
    const stat = baseStats[weakness as keyof typeof baseStats];
    if (stat) {
      bonus += stat * 2;
    }
  });

  return baseDamage + bonus;
};

// Начальные характеристики персонажа
export const INITIAL_CHARACTER_STATS = {
  level: 1,
  xp: 0,
  hp: 100,
  max_hp: 100,
  gold: 0,
  gems: 0, // Алмазы - премиум валюта
  strength: 1,
  health: 1,
  intelligence: 1,
  creativity: 1,
  discipline: 1,
};

// Прокачка характеристик: +1 за каждые 3 дня серии для конкретного атрибута
export const STREAK_DAYS_FOR_ATTRIBUTE_POINT = 3;
