import { AttributeType } from '@/types';

export interface MonsterTemplate {
  name: string;
  minHp: number;
  maxHp: number;
  weakness: AttributeType[];
  goldMin: number;
  goldMax: number;
  xpMin: number;
  xpMax: number;
}

// Шаблоны монстров для генерации
export const MONSTER_TEMPLATES: MonsterTemplate[] = [
  {
    name: 'Гоблин-лентяй',
    minHp: 50,
    maxHp: 80,
    weakness: ['discipline', 'strength'],
    goldMin: 20,
    goldMax: 40,
    xpMin: 50,
    xpMax: 80,
  },
  {
    name: 'Слизень прокрастинации',
    minHp: 40,
    maxHp: 60,
    weakness: ['discipline'],
    goldMin: 15,
    goldMax: 30,
    xpMin: 40,
    xpMax: 60,
  },
  {
    name: 'Скелет-бездельник',
    minHp: 60,
    maxHp: 100,
    weakness: ['strength', 'health'],
    goldMin: 30,
    goldMax: 50,
    xpMin: 60,
    xpMax: 100,
  },
  {
    name: 'Тень усталости',
    minHp: 70,
    maxHp: 110,
    weakness: ['health', 'discipline'],
    goldMin: 35,
    goldMax: 55,
    xpMin: 70,
    xpMax: 110,
  },
  {
    name: 'Дракон невежества',
    minHp: 100,
    maxHp: 150,
    weakness: ['intelligence', 'creativity'],
    goldMin: 50,
    goldMax: 80,
    xpMin: 100,
    xpMax: 150,
  },
  {
    name: 'Орк-обжора',
    minHp: 80,
    maxHp: 120,
    weakness: ['health', 'strength'],
    goldMin: 40,
    goldMax: 60,
    xpMin: 80,
    xpMax: 120,
  },
  {
    name: 'Паук сомнений',
    minHp: 55,
    maxHp: 85,
    weakness: ['intelligence', 'discipline'],
    goldMin: 25,
    goldMax: 45,
    xpMin: 55,
    xpMax: 85,
  },
  {
    name: 'Призрак скуки',
    minHp: 45,
    maxHp: 75,
    weakness: ['creativity'],
    goldMin: 20,
    goldMax: 35,
    xpMin: 45,
    xpMax: 75,
  },
  {
    name: 'Тролль упрямства',
    minHp: 90,
    maxHp: 140,
    weakness: ['intelligence', 'creativity'],
    goldMin: 45,
    goldMax: 70,
    xpMin: 90,
    xpMax: 140,
  },
  {
    name: 'Вампир времени',
    minHp: 75,
    maxHp: 115,
    weakness: ['discipline', 'health'],
    goldMin: 35,
    goldMax: 60,
    xpMin: 75,
    xpMax: 115,
  },
];

// Генерация случайного монстра
export const generateRandomMonster = (playerLevel: number = 1): MonsterTemplate & { hp: number; gold: number; xp: number } => {
  const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];

  // Масштабирование по уровню игрока
  const levelMultiplier = 1 + (playerLevel - 1) * 0.1;

  const hp = Math.floor(
    (template.minHp + Math.random() * (template.maxHp - template.minHp)) * levelMultiplier
  );
  const gold = Math.floor(
    (template.goldMin + Math.random() * (template.goldMax - template.goldMin)) * levelMultiplier
  );
  const xp = Math.floor(
    (template.xpMin + Math.random() * (template.xpMax - template.xpMin)) * levelMultiplier
  );

  return {
    ...template,
    hp,
    gold,
    xp,
  };
};
