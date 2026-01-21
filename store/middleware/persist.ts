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

export const persist: Persist = (config, options) => (set, get, api) => {
  const { name, version = 1 } = options;
  const storageKey = `${name}_v${version}`;

  // Загружаем данные из AsyncStorage при инициализации
  AsyncStorage.getItem(storageKey)
    .then((storedValue) => {
      if (storedValue) {
        try {
          const parsedValue = JSON.parse(storedValue);
          set(parsedValue, true); // replace: true - полностью заменяем состояние
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

    // Асинхронно сохраняем в AsyncStorage
    const state = get();
    AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch((error) => {
      console.error(`Failed to save data for ${name}:`, error);
    });
  };

  return config(wrappedSet, get, api);
};
