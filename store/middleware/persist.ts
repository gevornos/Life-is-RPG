import AsyncStorage from '@react-native-async-storage/async-storage';
import { StateCreator, StoreMutatorIdentifier } from 'zustand';

type PersistOptions = {
  name: string;
  version?: number;
};

type Persist = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
  config: StateCreator<T, Mps, Mcs>,
  options: PersistOptions
) => StateCreator<T, Mps, Mcs>;

// Функция для фильтрации только данных (без функций)
const filterOnlyData = (state: any): any => {
  const filtered: any = {};
  for (const key in state) {
    if (typeof state[key] !== 'function') {
      filtered[key] = state[key];
    }
  }
  return filtered;
};

export const persist: Persist = (config, options) => (set, get, api) => {
  const { name, version = 1 } = options;
  const storageKey = `${name}_v${version}`;

  // Создаем начальное состояние
  const initialState = config(set, get, api);

  // Загружаем данные из AsyncStorage при инициализации
  AsyncStorage.getItem(storageKey)
    .then((storedValue) => {
      if (storedValue) {
        try {
          const parsedValue = JSON.parse(storedValue);
          // Мержим только данные, не трогаем функции
          set(parsedValue, false); // replace: false - мержим с текущим состоянием
        } catch (error) {
          console.error(`Failed to parse stored data for ${name}:`, error);
        }
      }
    })
    .catch((error) => {
      console.error(`Failed to load data for ${name}:`, error);
    });

  // Оборачиваем set, чтобы сохранять при каждом изменении
  const wrappedSet: typeof set = (...args) => {
    set(...args);

    // Асинхронно сохраняем в AsyncStorage только данные (без функций)
    const state = get();
    const dataOnly = filterOnlyData(state);
    AsyncStorage.setItem(storageKey, JSON.stringify(dataOnly)).catch((error) => {
      console.error(`Failed to save data for ${name}:`, error);
    });
  };

  return config(wrappedSet, get, api);
};
