import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ATTRIBUTE_LIST } from '@/constants/attributes';
import { AttributeType, TaskDifficulty, HabitType } from '@/types';

export type FormType = 'habit' | 'daily' | 'task';

interface FormData {
  id?: string;
  title: string;
  notes?: string;
  attributes: AttributeType[];
  difficulty: TaskDifficulty;
  type?: HabitType; // Только для привычек
}

interface TaskFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: FormData) => void;
  onDelete?: () => void;
  formType: FormType;
  initialData?: Partial<FormData>;
  isEditing?: boolean;
}

const DIFFICULTY_OPTIONS: { key: TaskDifficulty; label: string; color: string }[] = [
  { key: 'easy', label: 'Легко', color: '#27AE60' },
  { key: 'medium', label: 'Средне', color: '#F39C12' },
  { key: 'hard', label: 'Сложно', color: '#E74C3C' },
];

const HABIT_TYPE_OPTIONS: { key: HabitType; label: string; icon: string }[] = [
  { key: 'positive', label: 'Положительная', icon: 'plus' },
  { key: 'negative', label: 'Отрицательная', icon: 'minus' },
  { key: 'both', label: 'Обе стороны', icon: 'plus-minus' },
];

const FORM_TITLES: Record<FormType, string> = {
  habit: 'Привычка',
  daily: 'Ежедневное',
  task: 'Задача',
};

export function TaskFormModal({
  visible,
  onClose,
  onSave,
  onDelete,
  formType,
  initialData,
  isEditing = false,
}: TaskFormModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [attributes, setAttributes] = useState<AttributeType[]>(['discipline']);
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium');
  const [habitType, setHabitType] = useState<HabitType>('positive');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setNotes(initialData.notes || '');
      setAttributes(initialData.attributes || ['discipline']);
      setDifficulty(initialData.difficulty || 'medium');
      setHabitType(initialData.type || 'positive');
    } else {
      // Reset form
      setTitle('');
      setNotes('');
      setAttributes(['discipline']);
      setDifficulty('medium');
      setHabitType('positive');
    }
  }, [initialData, visible]);

  const toggleAttribute = (attr: AttributeType) => {
    setAttributes((prev) => {
      if (prev.includes(attr)) {
        // Не даём убрать последний атрибут
        if (prev.length === 1) return prev;
        return prev.filter((a) => a !== attr);
      }
      // Максимум 2 атрибута
      if (prev.length >= 2) {
        return [prev[1], attr];
      }
      return [...prev, attr];
    });
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const data: FormData = {
      id: initialData?.id,
      title: title.trim(),
      notes: notes.trim() || undefined,
      attributes,
      difficulty,
    };

    if (formType === 'habit') {
      data.type = habitType;
    }

    onSave(data);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay]}>
        <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#999" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditing ? 'Редактировать' : 'Новая'} {FORM_TITLES[formType].toLowerCase()}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
              disabled={!title.trim()}
            >
              <Text style={[styles.saveText, !title.trim() && styles.saveTextDisabled]}>
                {isEditing ? 'Сохранить' : 'Создать'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Название</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={`Название ${FORM_TITLES[formType].toLowerCase()}...`}
                placeholderTextColor="#666"
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Заметки (опционально)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Дополнительные заметки..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Habit Type (only for habits) */}
            {formType === 'habit' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Тип привычки</Text>
                <View style={styles.optionsRow}>
                  {HABIT_TYPE_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.habitTypeOption,
                        habitType === option.key && styles.habitTypeOptionSelected,
                      ]}
                      onPress={() => setHabitType(option.key)}
                    >
                      <MaterialCommunityIcons
                        name={option.icon as any}
                        size={20}
                        color={habitType === option.key ? '#fff' : '#999'}
                      />
                      <Text
                        style={[
                          styles.habitTypeText,
                          habitType === option.key && styles.habitTypeTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Difficulty */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Сложность</Text>
              <View style={styles.difficultyRow}>
                {DIFFICULTY_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.difficultyOption,
                      difficulty === option.key && {
                        backgroundColor: option.color,
                        borderColor: option.color,
                      },
                    ]}
                    onPress={() => setDifficulty(option.key)}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        difficulty === option.key && styles.difficultyTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Attributes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Качает атрибуты (1-2)</Text>
              <View style={styles.attributesGrid}>
                {ATTRIBUTE_LIST.map((attr) => (
                  <TouchableOpacity
                    key={attr.key}
                    style={[
                      styles.attributeOption,
                      attributes.includes(attr.key) && {
                        backgroundColor: attr.color + '30',
                        borderColor: attr.color,
                      },
                    ]}
                    onPress={() => toggleAttribute(attr.key)}
                  >
                    <MaterialCommunityIcons
                      name={attr.icon as any}
                      size={24}
                      color={attributes.includes(attr.key) ? attr.color : '#666'}
                    />
                    <Text
                      style={[
                        styles.attributeText,
                        attributes.includes(attr.key) && { color: attr.color },
                      ]}
                    >
                      {attr.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Delete button (only when editing) */}
            {isEditing && onDelete && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <MaterialCommunityIcons name="delete" size={20} color="#E74C3C" />
                <Text style={styles.deleteText}>Удалить</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: '#666',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  habitTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  habitTypeOptionSelected: {
    backgroundColor: '#6C5CE7',
    borderColor: '#6C5CE7',
  },
  habitTypeText: {
    fontSize: 12,
    color: '#999',
  },
  habitTypeTextSelected: {
    color: '#fff',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  difficultyOption: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  difficultyTextSelected: {
    color: '#fff',
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attributeOption: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  attributeText: {
    fontSize: 14,
    color: '#999',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  deleteText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: '500',
  },
});
