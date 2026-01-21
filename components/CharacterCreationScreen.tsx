import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCharacterStore } from '@/store/characterStore';

interface CharacterCreationScreenProps {
  userId: string;
  onComplete: () => void;
}

// Простые заглушки для аватаров (emoji/иконки)
const AVATARS = [
  { id: '1', icon: 'account', color: '#E74C3C' },
  { id: '2', icon: 'ninja', color: '#3498DB' },
  { id: '3', icon: 'wizard-hat', color: '#9B59B6' },
  { id: '4', icon: 'shield-sword', color: '#E67E22' },
  { id: '5', icon: 'magic-staff', color: '#1ABC9C' },
  { id: '6', icon: 'bow-arrow', color: '#F39C12' },
  { id: '7', icon: 'chess-knight', color: '#27AE60' },
  { id: '8', icon: 'crown', color: '#F1C40F' },
];

export function CharacterCreationScreen({ userId, onComplete }: CharacterCreationScreenProps) {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0].id);
  const [isCreating, setIsCreating] = useState(false);
  const { createCharacter, syncWithServer } = useCharacterStore();

  const handleCreate = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Ошибка', 'Пожалуйста, введите имя персонажа');
      return;
    }

    if (trimmedName.length < 2) {
      Alert.alert('Ошибка', 'Имя должно быть не короче 2 символов');
      return;
    }

    if (trimmedName.length > 20) {
      Alert.alert('Ошибка', 'Имя должно быть не длиннее 20 символов');
      return;
    }

    setIsCreating(true);
    try {
      // Создаем персонажа с выбранным именем
      createCharacter(trimmedName, userId);

      // Сохраняем выбранный аватар в AsyncStorage (для будущего использования)
      // TODO: добавить поле avatar в Character interface

      // Если пользователь авторизован, синхронизируем с сервером
      if (userId !== 'local-user') {
        await syncWithServer();
      }

      onComplete();
    } catch (error) {
      console.error('Error creating character:', error);
      Alert.alert('Ошибка', 'Не удалось создать персонажа');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Создание персонажа</Text>
          <Text style={styles.subtitle}>
            Выберите аватар и введите имя своего героя
          </Text>
        </View>

        {/* Выбор аватара */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Выберите аватар</Text>
          <View style={styles.avatarsGrid}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarCard,
                  selectedAvatar === avatar.id && styles.avatarCardSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar.id)}
              >
                <View
                  style={[
                    styles.avatarIcon,
                    { backgroundColor: avatar.color },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={avatar.icon as any}
                    size={40}
                    color="#fff"
                  />
                </View>
                {selectedAvatar === avatar.id && (
                  <View style={styles.selectedBadge}>
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Ввод имени */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Имя персонажа</Text>
          <TextInput
            style={styles.input}
            placeholder="Введите имя..."
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            maxLength={20}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Text style={styles.inputHint}>
            {name.length}/20 символов
          </Text>
        </View>

        {/* Кнопка создания */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (!name.trim() || isCreating) && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!name.trim() || isCreating}
        >
          <MaterialCommunityIcons name="sword-cross" size={24} color="#fff" />
          <Text style={styles.createButtonText}>
            {isCreating ? 'Создание...' : 'Начать приключение'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  avatarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarCard: {
    width: '23%',
    aspectRatio: 1,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarCardSelected: {
    borderColor: '#6C5CE7',
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
  },
  avatarIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#2d2d44',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'right',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C5CE7',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
