import { create } from 'zustand';
import { Character, AttributeType } from '@/types';
import {
  INITIAL_CHARACTER_STATS,
  calculateLevelFromXP,
  XP_REWARDS,
  STREAK_DAYS_FOR_ATTRIBUTE_POINT,
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

  // Tracking серий для прокачки атрибутов
  attributeStreaks: Record<AttributeType, number>;
  incrementAttributeStreak: (attribute: AttributeType) => void;
  resetAttributeStreak: (attribute: AttributeType) => void;
}

export const useCharacterStore = create<CharacterState>((set, get) => ({
  character: null,
  isLoading: false,
  attributeStreaks: {
    strength: 0,
    health: 0,
    intelligence: 0,
    creativity: 0,
    discipline: 0,
  },

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

  incrementAttributeStreak: (attribute) => {
    const { attributeStreaks, increaseAttribute } = get();
    const newStreaks = { ...attributeStreaks };

    newStreaks[attribute] = (newStreaks[attribute] || 0) + 1;

    // Если серия достигла 3 дней, награждаем атрибутом и сбрасываем
    if (newStreaks[attribute] >= STREAK_DAYS_FOR_ATTRIBUTE_POINT) {
      increaseAttribute(attribute, 1);
      newStreaks[attribute] = 0;
    }

    set({ attributeStreaks: newStreaks });
  },

  resetAttributeStreak: (attribute) => {
    const { attributeStreaks, decreaseAttribute } = get();
    const newStreaks = { ...attributeStreaks };

    // Сбрасываем серию и применяем штраф -1 к атрибуту
    newStreaks[attribute] = 0;
    decreaseAttribute(attribute, 1);

    set({ attributeStreaks: newStreaks });
  },
}));
