import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ATTRIBUTES, ATTRIBUTE_LIST } from '@/constants/attributes';
import { calculateLevelProgress } from '@/constants/gameConfig';

// Временные данные для отображения (позже заменим на данные из store)
const mockCharacter = {
  name: 'Герой',
  level: 5,
  xp: 350,
  hp: 85,
  max_hp: 100,
  gold: 150,
  strength: 8,
  health: 6,
  intelligence: 12,
  creativity: 4,
  discipline: 10,
};

const mockMonster = {
  name: 'Гоблин-лентяй',
  hp: 45,
  max_hp: 80,
  weakness: ['discipline', 'strength'],
};

export default function CharacterScreen() {
  const levelProgress = calculateLevelProgress(mockCharacter.xp, mockCharacter.level);

  return (
    <ScrollView style={styles.container}>
      {/* Аватар и основные статы */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <MaterialCommunityIcons name="account-circle" size={100} color="#6C5CE7" />
        </View>
        <Text style={styles.name}>{mockCharacter.name}</Text>
        <Text style={styles.level}>Уровень {mockCharacter.level}</Text>
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
                { width: `${(mockCharacter.hp / mockCharacter.max_hp) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.barText}>
            {mockCharacter.hp}/{mockCharacter.max_hp}
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
                { width: `${levelProgress * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.barText}>{Math.round(levelProgress * 100)}%</Text>
        </View>

        {/* Gold */}
        <View style={styles.goldRow}>
          <MaterialCommunityIcons name="gold" size={24} color="#F1C40F" />
          <Text style={styles.goldText}>{mockCharacter.gold}</Text>
        </View>
      </View>

      {/* Характеристики */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Характеристики</Text>
        <View style={styles.attributesGrid}>
          {ATTRIBUTE_LIST.map((attr) => (
            <View key={attr.key} style={styles.attributeCard}>
              <MaterialCommunityIcons
                name={attr.icon as any}
                size={28}
                color={attr.color}
              />
              <Text style={styles.attributeValue}>
                {mockCharacter[attr.key as keyof typeof mockCharacter]}
              </Text>
              <Text style={styles.attributeName}>{attr.name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Текущий монстр */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Сегодняшний монстр</Text>
        <View style={styles.monsterCard}>
          <View style={styles.monsterHeader}>
            <MaterialCommunityIcons name="ghost" size={40} color="#9B59B6" />
            <View style={styles.monsterInfo}>
              <Text style={styles.monsterName}>{mockMonster.name}</Text>
              <Text style={styles.monsterWeakness}>
                Слабость: {mockMonster.weakness.map((w) => ATTRIBUTES[w as keyof typeof ATTRIBUTES]?.name).join(', ')}
              </Text>
            </View>
          </View>
          {/* Monster HP Bar */}
          <View style={styles.monsterHpContainer}>
            <View style={styles.barBackground}>
              <View
                style={[
                  styles.barFill,
                  styles.monsterHpBar,
                  { width: `${(mockMonster.hp / mockMonster.max_hp) * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.monsterHpText}>
              {mockMonster.hp}/{mockMonster.max_hp} HP
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
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
    width: 60,
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
  monsterCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
  },
  monsterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  monsterInfo: {
    marginLeft: 12,
    flex: 1,
  },
  monsterName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  monsterWeakness: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  monsterHpContainer: {
    marginTop: 8,
  },
  monsterHpBar: {
    backgroundColor: '#9B59B6',
  },
  monsterHpText: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 14,
  },
});
