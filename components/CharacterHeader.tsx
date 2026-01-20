import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCharacterStore } from '@/store/characterStore';
import { calculateXPForLevel } from '@/constants/gameConfig';

interface CharacterHeaderProps {
  onPress: () => void;
}

export function CharacterHeader({ onPress }: CharacterHeaderProps) {
  const insets = useSafeAreaInsets();
  const { character } = useCharacterStore();

  if (!character) return null;

  // Рассчитываем XP для текущего уровня
  let xpForPreviousLevels = 0;
  for (let i = 1; i < character.level; i++) {
    xpForPreviousLevels += calculateXPForLevel(i);
  }
  const xpInCurrentLevel = character.xp - xpForPreviousLevels;
  const xpNeededForLevel = calculateXPForLevel(character.level);
  const hpPercent = (character.hp / character.max_hp) * 100;
  const xpPercent = (xpInCurrentLevel / xpNeededForLevel) * 100;

  return (
    <TouchableOpacity
      style={[styles.container, { paddingTop: insets.top + 8 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Левая часть: Аватар */}
      <View style={styles.avatarContainer}>
        <MaterialCommunityIcons name="account-circle" size={50} color="#6C5CE7" />
      </View>

      {/* Центральная часть: Полоски HP и XP */}
      <View style={styles.barsContainer}>
        {/* HP Bar */}
        <View style={styles.barRow}>
          <MaterialCommunityIcons name="heart" size={16} color="#E74C3C" />
          <View style={styles.barBackground}>
            <View style={[styles.barFill, styles.hpBar, { width: `${hpPercent}%` }]} />
          </View>
          <Text style={styles.barText}>
            {character.hp}/{character.max_hp}
          </Text>
        </View>

        {/* XP Bar */}
        <View style={styles.barRow}>
          <MaterialCommunityIcons name="star" size={16} color="#F39C12" />
          <View style={styles.barBackground}>
            <View style={[styles.barFill, styles.xpBar, { width: `${xpPercent}%` }]} />
          </View>
          <Text style={styles.barText}>
            {xpInCurrentLevel}/{xpNeededForLevel}
          </Text>
        </View>
      </View>

      {/* Правая часть: Уровень и золото */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Text style={styles.levelText}>Ур. {character.level}</Text>
        </View>
        <View style={styles.statRow}>
          <MaterialCommunityIcons name="gold" size={14} color="#F1C40F" />
          <Text style={styles.goldText}>{character.gold}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatarContainer: {
    marginRight: 8,
  },
  barsContainer: {
    flex: 1,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  hpBar: {
    backgroundColor: '#E74C3C',
  },
  xpBar: {
    backgroundColor: '#F39C12',
  },
  barText: {
    fontSize: 11,
    minWidth: 50,
    textAlign: 'right',
  },
  statsContainer: {
    marginLeft: 8,
    alignItems: 'flex-end',
    gap: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  goldText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1C40F',
  },
});
