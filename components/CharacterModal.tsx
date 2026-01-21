import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ATTRIBUTES, ATTRIBUTE_LIST } from '@/constants/attributes';
import { calculateXPForLevel } from '@/constants/gameConfig';
import { useCharacterStore } from '@/store/characterStore';
import { useHabitsStore } from '@/store/habitsStore';
import { useTasksStore } from '@/store/tasksStore';
import { useDailiesStore } from '@/store/dailiesStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { getAvatarById } from '@/constants/avatars';

interface CharacterModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CharacterModal({ visible, onClose }: CharacterModalProps) {
  const insets = useSafeAreaInsets();
  const { character, createCharacter } = useCharacterStore();
  const habitsStore = useHabitsStore();
  const tasksStore = useTasksStore();
  const dailiesStore = useDailiesStore();
  const [isResetting, setIsResetting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Проверяем авторизацию при открытии модального окна
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    if (visible) {
      checkAuth();
    }
  }, [visible]);

  const handleResetProgress = () => {
    Alert.alert(
      'Сброс прогресса',
      'Вы уверены? Это удалит ВСЕ локальные данные: персонажа, привычки, задачи и ежедневные задания. Покажется экран создания персонажа.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Сбросить',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              console.log('Resetting local progress...');

              // Очищаем AsyncStorage
              await AsyncStorage.multiRemove([
                'habits-storage_v1',
                'tasks-storage_v1',
                'dailies-storage_v1',
                'character-storage_v1',
              ]);

              // Сбрасываем stores в начальное состояние
              habitsStore.setHabits([]);
              tasksStore.setTasks([]);
              dailiesStore.setDailies([]);

              // НЕ создаем персонажа! Должен показаться экран создания
              useCharacterStore.setState({ character: null });

              onClose();

              setTimeout(() => {
                Alert.alert('Успешно', 'Прогресс полностью сброшен! Создайте нового персонажа.');
              }, 300);
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Ошибка', 'Не удалось сбросить прогресс');
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleLoginToAccount = async () => {
    Alert.alert(
      'Войти в аккаунт',
      'Хотите привязать свой прогресс к аккаунту? После входа данные синхронизируются с сервером.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Войти',
          onPress: async () => {
            // Удаляем флаг пропуска авторизации
            await AsyncStorage.removeItem('auth_skipped');
            // Перезагружаем приложение - покажется экран авторизации
            Alert.alert(
              'Перезапустите приложение',
              'Закройте и откройте приложение заново, чтобы войти в аккаунт.',
              [{ text: 'OK', onPress: onClose }]
            );
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Удаление аккаунта',
      'Это удалит ВСЁ: аккаунт Supabase, персонажа на сервере и все локальные данные. Действие НЕОБРАТИМО! Вы потеряете все свои данные навсегда.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить навсегда',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              console.log('Step 1: Removing auth_skipped flag...');
              // Шаг 1: Удаляем флаг auth_skipped ПЕРЕД выходом
              // чтобы onAuthStateChange показал экран авторизации
              await AsyncStorage.removeItem('auth_skipped');

              console.log('Step 2: Calling delete_own_account RPC...');
              // Шаг 2: Вызываем функцию удаления аккаунта на сервере
              // (пока сессия ещё активна!)
              const rpcPromise = supabase.rpc('delete_own_account');
              const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('RPC timeout after 10s')), 10000)
              );

              try {
                const { error: rpcError } = await Promise.race([rpcPromise, timeoutPromise]) as any;
                if (rpcError) {
                  console.error('RPC error:', rpcError);
                  // Продолжаем даже если RPC failed - просто выйдем из аккаунта
                  console.warn('Continuing despite RPC error...');
                }
              } catch (timeoutError) {
                console.error('RPC timeout:', timeoutError);
                console.warn('Continuing despite timeout...');
              }

              console.log('Step 3: Signing out...');
              // Шаг 3: Явно выходим из аккаунта чтобы сработал onAuthStateChange
              // (даже если RPC успешен, нужно явно очистить локальную сессию)
              await supabase.auth.signOut();

              console.log('Step 4: Clearing local storage...');
              // Шаг 4: Очищаем остальные локальные данные
              await AsyncStorage.multiRemove([
                'habits-storage_v1',
                'tasks-storage_v1',
                'dailies-storage_v1',
                'character-storage_v1',
                'persist_migration_v2',
              ]);

              console.log('Step 5: Resetting stores...');
              // Сбрасываем stores
              habitsStore.setHabits([]);
              tasksStore.setTasks([]);
              dailiesStore.setDailies([]);

              // НЕ создаем персонажа! Должен показаться экран создания
              useCharacterStore.setState({ character: null });

              console.log('Account deletion complete');
              onClose();

              // Показываем сообщение после закрытия модального окна
              setTimeout(() => {
                Alert.alert(
                  'Аккаунт удален',
                  'Все данные очищены. Теперь можете зарегистрироваться заново.',
                  [{ text: 'OK' }]
                );
              }, 300);
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('Ошибка', 'Не удалось удалить аккаунт: ' + (error as Error).message);
            } finally {
              setIsResetting(false);
            }
          },
        },
      ]
    );
  };

  if (!character) return null;

  // Получаем аватар персонажа
  const avatar = getAvatarById(character.avatar);

  // Рассчитываем XP для текущего уровня
  let xpForPreviousLevels = 0;
  for (let i = 1; i < character.level; i++) {
    xpForPreviousLevels += calculateXPForLevel(i);
  }
  const xpInCurrentLevel = character.xp - xpForPreviousLevels;
  const xpNeededForLevel = calculateXPForLevel(character.level);
  const levelProgress = xpInCurrentLevel / xpNeededForLevel;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header с кнопкой закрытия */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Персонаж</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Аватар и основные статы */}
          <View style={styles.heroSection}>
            <View style={[styles.avatarContainer, { backgroundColor: avatar.color }]}>
              <MaterialCommunityIcons name={avatar.icon as any} size={80} color="#fff" />
            </View>
            <Text style={styles.name}>{character.name}</Text>
            <Text style={styles.level}>Уровень {character.level}</Text>
          </View>

          {/* Полоски HP и XP */}
          <View style={styles.barsContainer}>
            {/* HP Bar */}
            <View style={styles.barRow}>
              <MaterialCommunityIcons name="heart" size={24} color="#E74C3C" />
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    styles.hpBar,
                    { width: `${(character.hp / character.max_hp) * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.barText}>
                {character.hp}/{character.max_hp}
              </Text>
            </View>

            {/* XP Bar */}
            <View style={styles.barRow}>
              <MaterialCommunityIcons name="star" size={24} color="#F39C12" />
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    styles.xpBar,
                    { width: `${Math.min(levelProgress * 100, 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.barText}>
                {xpInCurrentLevel}/{xpNeededForLevel}
              </Text>
            </View>

            {/* Gold */}
            <View style={styles.goldRow}>
              <MaterialCommunityIcons name="gold" size={24} color="#F1C40F" />
              <Text style={styles.goldText}>{character.gold}</Text>
            </View>
          </View>

          {/* Характеристики */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Характеристики</Text>
            <View style={styles.attributesGrid}>
              {ATTRIBUTE_LIST.map((attr) => (
                <View key={attr.key} style={styles.attributeCard}>
                  <MaterialCommunityIcons name={attr.icon as any} size={28} color={attr.color} />
                  <Text style={styles.attributeValue}>
                    {character[attr.key as keyof typeof character]}
                  </Text>
                  <Text style={styles.attributeName}>{attr.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Кнопка входа для локальных игроков */}
          {!isLoggedIn && (
            <View style={styles.accountSection}>
              <Text style={styles.accountTitle}>Аккаунт</Text>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLoginToAccount}
              >
                <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                <Text style={styles.loginButtonText}>
                  Войти в аккаунт
                </Text>
              </TouchableOpacity>
              <Text style={styles.accountHint}>
                Привяжите прогресс к аккаунту для синхронизации между устройствами
              </Text>
            </View>
          )}

          {/* Debug: Кнопки для тестирования */}
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Debug</Text>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetProgress}
              disabled={isResetting}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
              <Text style={styles.resetButtonText}>
                {isResetting ? 'Сброс...' : 'Сбросить локальный прогресс'}
              </Text>
            </TouchableOpacity>

            {isLoggedIn && (
              <TouchableOpacity
                style={[styles.resetButton, styles.deleteAccountButton]}
                onPress={handleDeleteAccount}
                disabled={isResetting}
              >
                <MaterialCommunityIcons name="account-remove" size={20} color="#fff" />
                <Text style={styles.resetButtonText}>
                  {isResetting ? 'Удаление...' : 'Удалить аккаунт полностью'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 8,
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  level: {
    fontSize: 16,
    opacity: 0.7,
  },
  barsContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  barBackground: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  hpBar: {
    backgroundColor: '#E74C3C',
  },
  xpBar: {
    backgroundColor: '#F39C12',
  },
  barText: {
    width: 70,
    textAlign: 'right',
    fontSize: 14,
  },
  goldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  goldText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#F1C40F',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  attributeCard: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  attributeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  attributeName: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  accountSection: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.3)',
  },
  accountTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#6C5CE7',
    opacity: 0.9,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  accountHint: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 4,
  },
  debugSection: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#E74C3C',
    opacity: 0.8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  deleteAccountButton: {
    backgroundColor: '#C0392B', // Более темный красный для удаления аккаунта
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
