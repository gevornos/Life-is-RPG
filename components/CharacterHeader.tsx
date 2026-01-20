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
      style={[styles.container, { paddingTop: insets.top + 12 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Левая часть: Аватар, Имя + Уровень */}
      <View style={styles.leftSection}>
        <MaterialCommunityIcons name="account-circle" size={60} color="#6C5CE7" />
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{character.name}</Text>
          <Text style={styles.level}>, Ур. {character.level}</Text>
        </View>
      </View>

      {/* Центральная часть: Полоски HP и XP с центрированными счетчиками */}
      <View style={styles.centerSection}>
        {/* HP Bar */}
        <View style={styles.statRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="heart" size={14} color="#E74C3C" />
          </View>
          <View style={styles.barWrapper}>
            <View style={styles.barBackground}>
              <View style={[styles.barFill, styles.hpBar, { width: `${hpPercent}%` }]} />
            </View>
            <Text style={styles.barTextCentered}>
              {character.hp}/{character.max_hp}
            </Text>
          </View>
        </View>

        {/* XP Bar */}
        <View style={styles.statRow}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="star" size={14} color="#F39C12" />
          </View>
          <View style={styles.barWrapper}>
            <View style={styles.barBackground}>
              <View style={[styles.barFill, styles.xpBar, { width: `${xpPercent}%` }]} />
            </View>
            <Text style={styles.barTextCentered}>
              {xpInCurrentLevel}/{xpNeededForLevel}
            </Text>
          </View>
        </View>
      </View>

      {/* Правая часть: Золото и Алмазы */}
      <View style={styles.rightSection}>
        {/* Золото */}
        <View style={styles.currencyRow}>
          <MaterialCommunityIcons name="gold" size={16} color="#F1C40F" />
          <Text style={styles.goldText}>{character.gold}</Text>
        </View>
        {/* Алмазы */}
        <View style={styles.currencyRow}>
          <MaterialCommunityIcons name="diamond-stone" size={16} color="#3498DB" />
          <Text style={styles.gemsText}>{character.gems}</Text>
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
    paddingBottom: 12,
    backgroundColor: '#1a1a2e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  leftSection: {
    alignItems: 'center',
    width: 80,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  name: {
    fontSize: 11,
    fontWeight: '600',
  },
  level: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6C5CE7',
  },
  centerSection: {
    flex: 1,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconContainer: {
    width: 18,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    position: 'relative',
  },
  barBackground: {
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 7,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 7,
  },
  hpBar: {
    backgroundColor: '#E74C3C',
  },
  xpBar: {
    backgroundColor: '#F39C12',
  },
  barTextCentered: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rightSection: {
    gap: 6,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goldText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F1C40F',
    minWidth: 40,
  },
  gemsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3498DB',
    minWidth: 40,
  },
});
