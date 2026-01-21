import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ATTRIBUTES } from '@/constants/attributes';
import { useDailiesStore } from '@/store/dailiesStore';
import { TaskFormModal } from '@/components/TaskFormModal';
import { CharacterHeader } from '@/components/CharacterHeader';
import { CharacterModal } from '@/components/CharacterModal';
import { Daily, AttributeType, TaskDifficulty } from '@/types';

function DailyItem({ daily, onToggle, onPress }: {
  daily: Daily;
  onToggle: () => void;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.dailyItem,
        daily.completed_today && styles.dailyItemCompleted,
      ]}
      onPress={onPress}
    >
      <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
        {daily.completed_today ? (
          <MaterialCommunityIcons name="checkbox-marked" size={28} color="#27AE60" />
        ) : (
          <MaterialCommunityIcons name="checkbox-blank-outline" size={28} color="#95A5A6" />
        )}
      </TouchableOpacity>

      <View style={styles.dailyContent}>
        <Text
          style={[
            styles.dailyTitle,
            daily.completed_today && styles.dailyTitleCompleted,
          ]}
        >
          {daily.title}
        </Text>

        <View style={styles.dailyMeta}>
          {/* Атрибуты */}
          <View style={styles.attributeTags}>
            {daily.attributes.map((attr) => (
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
                <Text style={[styles.attributeTagText, { color: ATTRIBUTES[attr].color }]}>
                  {ATTRIBUTES[attr].name}
                </Text>
              </View>
            ))}
          </View>

          {/* Серия */}
          {daily.streak > 0 && (
            <View style={styles.streakBadge}>
              <MaterialCommunityIcons name="fire" size={14} color="#F39C12" />
              <Text style={styles.streakText}>{daily.streak}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function DailiesScreen() {
  const insets = useSafeAreaInsets();
  const { dailies, addDaily, updateDaily, deleteDaily, completeDaily, uncompleteDaily, reorderDailies } = useDailiesStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDaily, setEditingDaily] = useState<Daily | null>(null);
  const [characterModalVisible, setCharacterModalVisible] = useState(false);

  // Сортируем dailies по order
  const sortedDailies = [...dailies].sort((a, b) => (a.order || 0) - (b.order || 0));

  const handleToggle = (daily: Daily) => {
    if (daily.completed_today) {
      uncompleteDaily(daily.id);
    } else {
      completeDaily(daily.id);
    }
  };

  const handleAddNew = () => {
    setEditingDaily(null);
    setModalVisible(true);
  };

  const handleEdit = (daily: Daily) => {
    setEditingDaily(daily);
    setModalVisible(true);
  };

  const handleSave = (data: {
    id?: string;
    title: string;
    notes?: string;
    attributes: AttributeType[];
    difficulty: TaskDifficulty;
  }) => {
    if (editingDaily) {
      updateDaily(editingDaily.id, {
        title: data.title,
        notes: data.notes,
        attributes: data.attributes,
        difficulty: data.difficulty,
      });
    } else {
      addDaily({
        user_id: 'local',
        title: data.title,
        notes: data.notes,
        attributes: data.attributes,
        difficulty: data.difficulty,
        frequency: 'daily',
      });
    }
  };

  const handleDelete = () => {
    if (editingDaily) {
      deleteDaily(editingDaily.id);
      setModalVisible(false);
    }
  };

  const renderDailyItem = ({ item, drag, isActive }: RenderItemParams<Daily>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity onLongPress={drag} disabled={isActive} activeOpacity={1}>
          <DailyItem
            daily={item}
            onToggle={() => handleToggle(item)}
            onPress={() => handleEdit(item)}
          />
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const completedCount = sortedDailies.filter(d => d.completed_today).length;

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container}>
        {/* Плашка персонажа сверху */}
        <CharacterHeader onPress={() => setCharacterModalVisible(true)} />

        <View style={styles.header}>
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {completedCount} / {sortedDailies.length} выполнено
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: sortedDailies.length > 0 ? `${(completedCount / sortedDailies.length) * 100}%` : '0%' },
                ]}
              />
            </View>
          </View>
        </View>

        {sortedDailies.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="calendar-check" size={64} color="#666" />
            <Text style={styles.emptyText}>Нет ежедневных заданий</Text>
            <Text style={styles.emptySubtext}>Нажми + чтобы добавить</Text>
          </View>
        ) : (
          <DraggableFlatList
            data={sortedDailies}
            onDragEnd={({ data }) => reorderDailies(data)}
            keyExtractor={(item) => item.id}
            renderItem={renderDailyItem}
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
          onDelete={editingDaily ? handleDelete : undefined}
          formType="daily"
          initialData={editingDaily ? {
            id: editingDaily.id,
            title: editingDaily.title,
            notes: editingDaily.notes,
            attributes: editingDaily.attributes,
            difficulty: editingDaily.difficulty,
          } : undefined}
          isEditing={!!editingDaily}
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 4,
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
  dailyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  dailyItemCompleted: {
    opacity: 0.6,
  },
  checkbox: {
    marginRight: 12,
    paddingTop: 2,
  },
  dailyContent: {
    flex: 1,
  },
  dailyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  dailyTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  dailyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attributeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  attributeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  attributeTagText: {
    fontSize: 12,
    marginLeft: 4,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(243, 156, 18, 0.2)',
    borderRadius: 12,
  },
  streakText: {
    fontSize: 12,
    color: '#F39C12',
    fontWeight: 'bold',
    marginLeft: 4,
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
