// Конфигурация игровой механики

// XP награды за действия
export const XP_REWARDS = {
  habit_positive: 10,
  habit_negative: -15,
  daily_base: 20,
  daily_streak_bonus: 2, // За каждый день серии
  task_easy: 20,
  task_medium: 50,
  task_hard: 100,
  monster_defeat_min: 50,
  monster_defeat_max: 200,
};

// Золото за действия
export const GOLD_REWARDS = {
  habit_positive: 2,
  daily_base: 3,
  task_easy: 5,
  task_medium: 10,
  task_hard: 20,
};

// Штрафы
export const PENALTIES = {
  daily_missed_xp: -25,
  daily_missed_attribute: -1,
  inactive_1_day_xp_percent: 0.1, // 10% от текущего XP
  inactive_3_days_attribute_percent: 0.05, // 5% характеристик
};

// Формула уровня: XP для уровня N = N * 100
export const calculateXPForLevel = (level: number): number => level * 100;

// Расчёт уровня из XP
export const calculateLevelFromXP = (xp: number): number => {
  let level = 1;
  let totalXP = 0;
  while (totalXP + calculateXPForLevel(level) <= xp) {
    totalXP += calculateXPForLevel(level);
    level++;
  }
  return level;
};

// XP до следующего уровня
export const calculateXPToNextLevel = (currentXP: number, currentLevel: number): number => {
  let xpForPreviousLevels = 0;
  for (let i = 1; i < currentLevel; i++) {
    xpForPreviousLevels += calculateXPForLevel(i);
  }
  const xpInCurrentLevel = currentXP - xpForPreviousLevels;
  const xpNeededForNextLevel = calculateXPForLevel(currentLevel);
  return xpNeededForNextLevel - xpInCurrentLevel;
};

// Прогресс в текущем уровне (0-1)
export const calculateLevelProgress = (currentXP: number, currentLevel: number): number => {
  let xpForPreviousLevels = 0;
  for (let i = 1; i < currentLevel; i++) {
    xpForPreviousLevels += calculateXPForLevel(i);
  }
  const xpInCurrentLevel = currentXP - xpForPreviousLevels;
  const xpNeededForLevel = calculateXPForLevel(currentLevel);
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

// Прокачка характеристик: +1 за каждые N выполненных задач
export const TASKS_PER_ATTRIBUTE_POINT = 5;
export const HABITS_PER_DISCIPLINE_POINT = 10;
