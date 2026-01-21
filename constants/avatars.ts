// Константы для аватаров персонажей

export interface Avatar {
  id: string;
  icon: string;
  color: string;
}

export const AVATARS: Avatar[] = [
  { id: '1', icon: 'account', color: '#E74C3C' },
  { id: '2', icon: 'ninja', color: '#3498DB' },
  { id: '3', icon: 'wizard-hat', color: '#9B59B6' },
  { id: '4', icon: 'shield-sword', color: '#E67E22' },
  { id: '5', icon: 'magic-staff', color: '#1ABC9C' },
  { id: '6', icon: 'bow-arrow', color: '#F39C12' },
  { id: '7', icon: 'chess-knight', color: '#27AE60' },
  { id: '8', icon: 'crown', color: '#F1C40F' },
];

// Аватар по умолчанию
export const DEFAULT_AVATAR = AVATARS[0];

// Получить аватар по ID
export function getAvatarById(id?: string): Avatar {
  if (!id) return DEFAULT_AVATAR;
  return AVATARS.find((avatar) => avatar.id === id) || DEFAULT_AVATAR;
}
