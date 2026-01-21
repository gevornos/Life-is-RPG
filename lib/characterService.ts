import { supabase } from './supabase';
import { Character } from '@/types';

/**
 * Сервис для работы с персонажами на сервере
 */
export const characterService = {
  /**
   * Получить персонажа текущего пользователя
   */
  async fetchCharacter(): Promise<Character | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Персонаж не найден - это нормально
        return null;
      }
      console.error('Error fetching character:', error);
      throw error;
    }

    return data as Character;
  },

  /**
   * Создать нового персонажа на сервере
   */
  async createCharacter(character: Omit<Character, 'id' | 'created_at' | 'updated_at'>): Promise<Character> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('characters')
      .insert({
        ...character,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating character:', error);
      throw error;
    }

    return data as Character;
  },

  /**
   * Обновить персонажа на сервере
   */
  async updateCharacter(character: Partial<Character>): Promise<Character> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('characters')
      .update(character)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating character:', error);
      throw error;
    }

    return data as Character;
  },

  /**
   * Синхронизировать локального персонажа с сервером
   * Стратегия: сервер - источник истины для gold и gems,
   * клиент - источник истины для остальных данных
   */
  async syncCharacter(localCharacter: Character): Promise<Character> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Получаем серверную версию
    const serverCharacter = await this.fetchCharacter();

    if (!serverCharacter) {
      // Создаем нового персонажа на сервере
      // Убираем id, created_at, updated_at - Supabase сам их сгенерирует
      const { id, created_at, updated_at, ...characterData } = localCharacter;
      return await this.createCharacter(characterData);
    }

    // Мерджим данные:
    // - gold и gems берем с сервера (источник истины)
    // - остальные данные (xp, level, hp, attributes, streaks) берем с клиента
    const mergedCharacter: Character = {
      ...localCharacter,
      id: serverCharacter.id,
      gold: serverCharacter.gold, // Сервер - источник истины
      gems: serverCharacter.gems, // Сервер - источник истины
      updated_at: new Date().toISOString(),
    };

    // Обновляем на сервере
    return await this.updateCharacter(mergedCharacter);
  },
};
