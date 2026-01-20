import { create } from 'zustand';
import { Character, AttributeType } from '@/types';
import {
  INITIAL_CHARACTER_STATS,
  calculateLevelFromXP,
  XP_REWARDS,
  GOLD_REWARDS,
  TASKS_PER_ATTRIBUTE_POINT,
  HABITS_PER_DISCIPLINE_POINT,
} from '@/constants/gameConfig';

interface CharacterState {
  character: Character | null;
  isLoading: boolean;

  // Actions
  setCharacter: (character: Character) => void;
  createCharacter: (name: string, userId: string) => void;

  // Game actions
  addXP: (amount: number) => void;
  addGold: (amount: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  increaseAttribute: (attribute: AttributeType, amount: number) => void;
  decreaseAttribute: (attribute: AttributeType, amount: number) => void;

  // Tracking для прокачки атрибутов
  taskCompletionCounts: Record<AttributeType, number>;
  incrementTaskCount: (attributes: AttributeType[]) => void;
  incrementHabitCount: () => void;
  habitCompletionCount: number;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: null,
  isLoading: false,
  taskCompletionCounts: {
    strength: 0,
    health: 0,
    intelligence: 0,
    creativity: 0,
    discipline: 0,
  },
  habitCompletionCount: 0,

  setCharacter: (character) => set({ character }),

  createCharacter: (name, userId) => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      user_id: userId,
      name,
      ...INITIAL_CHARACTER_STATS,
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    set({ character: newCharacter });
  },

  addXP: (amount) => {
    const { character } = get();
    if (!character) return;

    const newXP = Math.max(0, character.xp + amount);
    const newLevel = calculateLevelFromXP(newXP);

    set({
      character: {
        ...character,
        xp: newXP,
        level: newLevel,
      },
    });
  },

  addGold: (amount) => {
    const { character } = get();
    if (!character) return;

    set({
      character: {
        ...character,
        gold: Math.max(0, character.gold + amount),
      },
    });
  },

  takeDamage: (amount) => {
    const { character, addXP } = get();
    if (!character) return;

    const newHP = Math.max(0, character.hp - amount);

    // Если HP = 0, теряем XP
    if (newHP === 0) {
      addXP(-Math.floor(character.xp * 0.1)); // Теряем 10% XP
    }

    set({
      character: {
        ...character,
        hp: newHP,
      },
    });
  },

  heal: (amount) => {
    const { character } = get();
    if (!character) return;

    set({
      character: {
        ...character,
        hp: Math.min(character.max_hp, character.hp + amount),
      },
    });
  },

  increaseAttribute: (attribute, amount) => {
    const { character } = get();
    if (!character) return;

    set({
      character: {
        ...character,
        [attribute]: character[attribute] + amount,
      },
    });
  },

  decreaseAttribute: (attribute, amount) => {
    const { character } = get();
    if (!character) return;

    set({
      character: {
        ...character,
        [attribute]: Math.max(1, character[attribute] - amount),
      },
    });
  },

  incrementTaskCount: (attributes) => {
    const { taskCompletionCounts, increaseAttribute } = get();
    const newCounts = { ...taskCompletionCounts };

    attributes.forEach((attr) => {
      newCounts[attr] = (newCounts[attr] || 0) + 1;

      // Проверяем, достигли ли порога для прокачки
      if (newCounts[attr] >= TASKS_PER_ATTRIBUTE_POINT) {
        increaseAttribute(attr, 1);
        newCounts[attr] = 0; // Сбрасываем счётчик
      }
    });

    set({ taskCompletionCounts: newCounts });
  },

  incrementHabitCount: () => {
    const { habitCompletionCount, increaseAttribute } = get();
    const newCount = habitCompletionCount + 1;

    if (newCount >= HABITS_PER_DISCIPLINE_POINT) {
      increaseAttribute('discipline', 1);
      set({ habitCompletionCount: 0 });
    } else {
      set({ habitCompletionCount: newCount });
    }
  },
}));
