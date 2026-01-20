import { create } from 'zustand';
import { Monster, AttributeType } from '@/types';
import { generateRandomMonster } from '@/constants/monsters';
import { calculateDamage } from '@/constants/gameConfig';
import { useCharacterStore } from './characterStore';

interface MonsterState {
  currentMonster: Monster | null;
  isLoading: boolean;

  // Actions
  setMonster: (monster: Monster | null) => void;
  spawnDailyMonster: (userId: string) => void;
  dealDamage: (amount: number) => void;
  defeatMonster: () => void;

  // Auto damage based on character stats
  dealAutoDamage: (taskAttributes: AttributeType[]) => void;
}

const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export const useMonsterStore = create<MonsterState>((set, get) => ({
  currentMonster: null,
  isLoading: false,

  setMonster: (monster) => set({ currentMonster: monster }),

  spawnDailyMonster: (userId) => {
    const { currentMonster } = get();

    // Проверяем, есть ли уже монстр на сегодня
    if (currentMonster && isToday(currentMonster.spawn_date) && !currentMonster.defeated) {
      return; // Монстр уже существует
    }

    // Получаем уровень персонажа для масштабирования
    const characterStore = useCharacterStore.getState();
    const playerLevel = characterStore.character?.level || 1;

    // Генерируем нового монстра
    const template = generateRandomMonster(playerLevel);

    const newMonster: Monster = {
      id: Date.now().toString(),
      user_id: userId,
      name: template.name,
      hp: template.hp,
      max_hp: template.hp,
      weakness: template.weakness,
      reward_gold: template.gold,
      reward_xp: template.xp,
      defeated: false,
      spawn_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    set({ currentMonster: newMonster });
  },

  dealDamage: (amount) => {
    const { currentMonster, defeatMonster } = get();
    if (!currentMonster || currentMonster.defeated) return;

    const newHP = Math.max(0, currentMonster.hp - amount);

    if (newHP === 0) {
      defeatMonster();
    } else {
      set({
        currentMonster: {
          ...currentMonster,
          hp: newHP,
        },
      });
    }
  },

  defeatMonster: () => {
    const { currentMonster } = get();
    if (!currentMonster) return;

    // Выдаём награды
    const characterStore = useCharacterStore.getState();
    characterStore.addXP(currentMonster.reward_xp);
    characterStore.addGold(currentMonster.reward_gold);

    // Помечаем монстра как побеждённого
    set({
      currentMonster: {
        ...currentMonster,
        hp: 0,
        defeated: true,
      },
    });
  },

  dealAutoDamage: (taskAttributes) => {
    const { currentMonster, dealDamage } = get();
    if (!currentMonster || currentMonster.defeated) return;

    const characterStore = useCharacterStore.getState();
    const character = characterStore.character;
    if (!character) return;

    // Базовый урон
    let damage = 10;

    // Бонус от характеристик, связанных с задачей
    taskAttributes.forEach((attr) => {
      damage += character[attr] * 2;
    });

    // Дополнительный бонус, если задача совпадает со слабостью монстра
    const matchingWeaknesses = taskAttributes.filter((attr) =>
      currentMonster.weakness.includes(attr)
    );
    if (matchingWeaknesses.length > 0) {
      damage = Math.floor(damage * 1.5); // +50% урона
    }

    dealDamage(damage);
  },
}));
