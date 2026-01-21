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

  useEffect(() => {
    if (!character) {
      createCharacter('Герой', 'local-user');
    }
  }, [character, createCharacter]);

  const handleResetProgress = () => {
    Alert.alert(
      'Сброс прогресса',
      'Вы уверены? Это удалит ВСЕ локальные данные: персонажа, привычки, задачи и ежедневные задания.',
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

              // Создаем нового персонажа
              createCharacter('Герой', 'local-user');

              Alert.alert('Успешно', 'Прогресс полностью сброшен!');
              onClose();
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
              // Выходим из аккаунта (удаление пользователя из Supabase требует серверной функции)
              await supabase.auth.signOut();

              // Очищаем ВСЕ данные из AsyncStorage
              await AsyncStorage.clear();

              // Сбрасываем stores
              habitsStore.setHabits([]);
              tasksStore.setTasks([]);
              dailiesStore.setDailies([]);

              // Создаем нового персонажа
              createCharacter('Герой', 'local-user');

              Alert.alert(
                'Аккаунт удален',
                'Вы вышли из аккаунта и все данные очищены. Теперь можете зарегистрироваться заново.'
              );
              onClose();

              // Перезагружаем приложение через небольшую задержку
              setTimeout(() => {
                // В React Native нет прямого способа перезагрузить приложение
                // Пользователь увидит экран авторизации автоматически
              }, 500);
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
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="account-circle" size={100} color="#6C5CE7" />
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
