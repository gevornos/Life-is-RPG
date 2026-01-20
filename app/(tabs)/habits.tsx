import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskFormModal } from '@/components/TaskFormModal';
import { useHabitsStore } from '@/store/habitsStore';
import { Habit, AttributeType, TaskDifficulty, HabitType } from '@/types';
import { ATTRIBUTES } from '@/constants/attributes';

function HabitItem({ habit, onPositive, onNegative, onPress }: {
  habit: Habit;
  onPositive: () => void;
  onNegative: () => void;
  onPress: () => void;
}) {
  const showPositive = habit.type === 'positive' || habit.type === 'both';
  const showNegative = habit.type === 'negative' || habit.type === 'both';

  return (
    <View style={styles.habitItem}>
      {showPositive && (
        <TouchableOpacity style={styles.habitButton} onPress={onPositive}>
          <MaterialCommunityIcons name="plus" size={24} color="#27AE60" />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.habitContent} onPress={onPress}>
        <Text style={styles.habitTitle}>{habit.title}</Text>
        <View style={styles.habitMeta}>
          <View style={styles.habitCounters}>
            {showPositive && (
              <View style={styles.counterBadge}>
                <MaterialCommunityIcons name="plus" size={12} color="#27AE60" />
                <Text style={[styles.counterText, { color: '#27AE60' }]}>{habit.counter_up}</Text>
              </View>
            )}
            {showNegative && (
              <View style={styles.counterBadge}>
                <MaterialCommunityIcons name="minus" size={12} color="#E74C3C" />
                <Text style={[styles.counterText, { color: '#E74C3C' }]}>{habit.counter_down}</Text>
              </View>
            )}
          </View>
          <View style={styles.attributeTags}>
            {habit.attributes.map((attr) => (
              <View
                key={attr}
                style={[styles.attributeTag, { backgroundColor: ATTRIBUTES[attr].color + '30' }]}
              >
                <MaterialCommunityIcons
                  name={ATTRIBUTES[attr].icon as any}
                  size={12}
                  color={ATTRIBUTES[attr].color}
                />
              </View>
            ))}
          </View>
        </View>
      </TouchableOpacity>

      {showNegative && (
        <TouchableOpacity style={styles.habitButton} onPress={onNegative}>
          <MaterialCommunityIcons name="minus" size={24} color="#E74C3C" />
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const { habits, addHabit, updateHabit, deleteHabit, incrementPositive, incrementNegative } = useHabitsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handlePositive = (id: string) => {
    incrementPositive(id);
  };

  const handleNegative = (id: string) => {
    incrementNegative(id);
  };

  const handleAddNew = () => {
    setEditingHabit(null);
    setModalVisible(true);
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalVisible(true);
  };

  const handleSave = (data: {
    id?: string;
    title: string;
    notes?: string;
    attributes: AttributeType[];
    difficulty: TaskDifficulty;
    type?: HabitType;
  }) => {
    if (editingHabit) {
      updateHabit(editingHabit.id, {
        title: data.title,
        notes: data.notes,
        attributes: data.attributes,
        difficulty: data.difficulty,
        type: data.type || 'positive',
      });
    } else {
      addHabit({
        user_id: 'local',
        title: data.title,
        notes: data.notes,
        attributes: data.attributes,
        difficulty: data.difficulty,
        type: data.type || 'positive',
      });
    }
  };

  const handleDelete = () => {
    if (editingHabit) {
      deleteHabit(editingHabit.id);
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.description}>
          Отмечай привычки и качай атрибуты
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 80 }}>
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>Нет привычек</Text>
            <Text style={styles.emptySubtext}>Нажми + чтобы добавить</Text>
          </View>
        ) : (
          habits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onPositive={() => handlePositive(habit.id)}
              onNegative={() => handleNegative(habit.id)}
              onPress={() => handleEdit(habit)}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.addButton, { bottom: 20 + insets.bottom }]}
        onPress={handleAddNew}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      <TaskFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        onDelete={editingHabit ? handleDelete : undefined}
        formType="habit"
        initialData={editingHabit ? {
          id: editingHabit.id,
          title: editingHabit.title,
          notes: editingHabit.notes,
          attributes: editingHabit.attributes,
          difficulty: editingHabit.difficulty,
          type: editingHabit.type,
        } : undefined}
        isEditing={!!editingHabit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    color: '#555',
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  habitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitContent: {
    flex: 1,
    paddingHorizontal: 12,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  habitMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  habitCounters: {
    flexDirection: 'row',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  counterText: {
    fontSize: 12,
    marginLeft: 2,
  },
  attributeTags: {
    flexDirection: 'row',
    gap: 4,
  },
  attributeTag: {
    padding: 4,
    borderRadius: 6,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
