import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ATTRIBUTES } from '@/constants/attributes';
import { useTasksStore } from '@/store/tasksStore';
import { TaskFormModal } from '@/components/TaskFormModal';
import { CharacterHeader } from '@/components/CharacterHeader';
import { CharacterModal } from '@/components/CharacterModal';
import { Task, AttributeType, TaskDifficulty } from '@/types';

const DIFFICULTY_CONFIG = {
  easy: { label: 'Легко', color: '#27AE60', xp: 20 },
  medium: { label: 'Средне', color: '#F39C12', xp: 50 },
  hard: { label: 'Сложно', color: '#E74C3C', xp: 100 },
};

function TaskItem({ task, onToggle, onPress }: {
  task: Task;
  onToggle: () => void;
  onPress: () => void;
}) {
  const diffConfig = DIFFICULTY_CONFIG[task.difficulty];

  return (
    <TouchableOpacity
      style={[
        styles.taskItem,
        task.completed && styles.taskItemCompleted,
      ]}
      onPress={onPress}
    >
      <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
        {task.completed ? (
          <MaterialCommunityIcons name="checkbox-marked" size={28} color="#27AE60" />
        ) : (
          <MaterialCommunityIcons name="checkbox-blank-outline" size={28} color="#95A5A6" />
        )}
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskTitle,
            task.completed && styles.taskTitleCompleted,
          ]}
        >
          {task.title}
        </Text>

        <View style={styles.taskMeta}>
          {/* Атрибуты */}
          <View style={styles.attributeTags}>
            {task.attributes.map((attr) => (
              <View
                key={attr}
                style={[
                  styles.attributeTag,
                  { backgroundColor: ATTRIBUTES[attr].color + '20' },
                ]}
              >
                <MaterialCommunityIcons
                  name={ATTRIBUTES[attr].icon as any}
                  size={14}
                  color={ATTRIBUTES[attr].color}
                />
              </View>
            ))}
          </View>

          {/* Сложность */}
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: diffConfig.color + '20' },
            ]}
          >
            <Text style={[styles.difficultyText, { color: diffConfig.color }]}>
              {diffConfig.label}
            </Text>
            <Text style={[styles.xpText, { color: diffConfig.color }]}>
              +{diffConfig.xp} XP
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const { tasks, addTask, updateTask, deleteTask, completeTask, uncompleteTask, reorderTasks } = useTasksStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [characterModalVisible, setCharacterModalVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Сортируем tasks по order и фильтруем
  const sortedTasks = [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleToggle = (task: Task) => {
    if (task.completed) {
      uncompleteTask(task.id);
    } else {
      completeTask(task.id);
    }
  };

  const handleAddNew = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleSave = (data: {
    id?: string;
    title: string;
    notes?: string;
    attributes: AttributeType[];
    difficulty: TaskDifficulty;
  }) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        title: data.title,
        notes: data.notes,
        attributes: data.attributes,
        difficulty: data.difficulty,
      });
    } else {
      addTask({
        user_id: 'local',
        title: data.title,
        notes: data.notes,
        attributes: data.attributes,
        difficulty: data.difficulty,
      });
    }
  };

  const handleDelete = () => {
    if (editingTask) {
      deleteTask(editingTask.id);
      setModalVisible(false);
    }
  };

  const filteredTasks = sortedTasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const renderTaskItem = ({ item, drag, isActive }: RenderItemParams<Task>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity onLongPress={drag} disabled={isActive} activeOpacity={1}>
          <TaskItem
            task={item}
            onToggle={() => handleToggle(item)}
            onPress={() => handleEdit(item)}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Плашка персонажа сверху */}
        <CharacterHeader onPress={() => setCharacterModalVisible(true)} />

        {/* Фильтры */}
        <View style={styles.filterContainer}>
          {(['active', 'all', 'completed'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterButton,
                filter === f && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f === 'active' ? 'Активные' : f === 'completed' ? 'Выполненные' : 'Все'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="format-list-checks" size={64} color="#666" />
            <Text style={styles.emptyText}>
              {filter === 'active' ? 'Нет активных задач' : 'Нет задач'}
            </Text>
            <Text style={styles.emptySubtext}>Нажми + чтобы добавить</Text>
          </View>
        ) : (
          <DraggableFlatList
            data={filteredTasks}
            onDragEnd={({ data }) => reorderTasks(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderTaskItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          />
        )}

        <TouchableOpacity
          style={[styles.addButton, { bottom: insets.bottom }]}
          onPress={handleAddNew}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#FFF" />
        </TouchableOpacity>

        <TaskFormModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSave}
          onDelete={editingTask ? handleDelete : undefined}
          formType="task"
          initialData={editingTask ? {
            id: editingTask.id,
            title: editingTask.title,
            notes: editingTask.notes,
            attributes: editingTask.attributes,
            difficulty: editingTask.difficulty,
          } : undefined}
          isEditing={!!editingTask}
        />

        {/* Модалка с информацией о персонаже */}
        <CharacterModal
          visible={characterModalVisible}
          onClose={() => setCharacterModalVisible(false)}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  filterButtonActive: {
    backgroundColor: 'rgba(108, 92, 231, 0.2)',
  },
  filterText: {
    fontSize: 14,
    color: '#95A5A6',
  },
  filterTextActive: {
    color: '#6C5CE7',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: 12,
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributeTags: {
    flexDirection: 'row',
  },
  attributeTag: {
    padding: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  difficultyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  xpText: {
    fontSize: 12,
    marginLeft: 6,
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
