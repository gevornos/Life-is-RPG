import { AttributeInfo, AttributeType } from '@/types';

export const ATTRIBUTES: Record<AttributeType, AttributeInfo> = {
  strength: {
    key: 'strength',
    name: 'Сила',
    icon: 'arm-flex',
    color: '#E74C3C',
    description: 'Тренировки, спорт, физическая активность',
  },
  health: {
    key: 'health',
    name: 'Здоровье',
    icon: 'heart',
    color: '#E91E63',
    description: 'Режим сна, питание, медитация',
  },
  intelligence: {
    key: 'intelligence',
    name: 'Интеллект',
    icon: 'brain',
    color: '#9B59B6',
    description: 'Учёба, программирование, чтение',
  },
  creativity: {
    key: 'creativity',
    name: 'Творчество',
    icon: 'palette',
    color: '#F39C12',
    description: 'Хобби, искусство, музыка',
  },
  discipline: {
    key: 'discipline',
    name: 'Дисциплина',
    icon: 'target',
    color: '#3498DB',
    description: 'Привычки и регулярность',
  },
};

export const ATTRIBUTE_LIST = Object.values(ATTRIBUTES);
