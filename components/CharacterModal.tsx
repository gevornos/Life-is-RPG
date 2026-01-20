import React, { useEffect } from 'react';
import { Modal, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ATTRIBUTES, ATTRIBUTE_LIST } from '@/constants/attributes';
import { calculateXPForLevel } from '@/constants/gameConfig';
import { useCharacterStore } from '@/store/characterStore';
import { useMonsterStore } from '@/store/monsterStore';

interface CharacterModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CharacterModal({ visible, onClose }: CharacterModalProps) {
  const insets = useSafeAreaInsets();
  const { character, createCharacter } = useCharacterStore();
  const { currentMonster, spawnDailyMonster } = useMonsterStore();

  useEffect(() => {
    if (!character) {
      createCharacter('Герой', 'local-user');
    }
  }, [character, createCharacter]);

  useEffect(() => {
    if (character && !currentMonster) {
      spawnDailyMonster(character.user_id);
    }
  }, [character, currentMonster, spawnDailyMonster]);

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

          {/* Текущий монстр */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сегодняшний монстр</Text>
            {currentMonster && !currentMonster.defeated ? (
              <View style={styles.monsterCard}>
                <View style={styles.monsterHeader}>
                  <MaterialCommunityIcons name="ghost" size={40} color="#9B59B6" />
                  <View style={styles.monsterInfo}>
                    <Text style={styles.monsterName}>{currentMonster.name}</Text>
                    <Text style={styles.monsterWeakness}>
                      Слабость: {currentMonster.weakness.map((w) => ATTRIBUTES[w]?.name).join(', ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.monsterHpContainer}>
                  <View style={styles.barBackground}>
                    <View
                      style={[
                        styles.barFill,
                        styles.monsterHpBar,
                        { width: `${(currentMonster.hp / currentMonster.max_hp) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.monsterHpText}>
                    {currentMonster.hp}/{currentMonster.max_hp} HP
                  </Text>
                </View>
                <Text style={styles.monsterReward}>
                  Награда: {currentMonster.reward_xp} XP, {currentMonster.reward_gold} золота
                </Text>
              </View>
            ) : currentMonster?.defeated ? (
              <View style={styles.monsterDefeated}>
                <MaterialCommunityIcons name="trophy" size={40} color="#F39C12" />
                <Text style={styles.defeatedText}>Монстр побеждён!</Text>
                <Text style={styles.defeatedSubtext}>Завтра появится новый</Text>
              </View>
            ) : (
              <View style={styles.noMonster}>
                <Text>Монстр скоро появится...</Text>
              </View>
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
  monsterReward: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 12,
    opacity: 0.7,
  },
  monsterDefeated: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
  },
  defeatedText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#F39C12',
  },
  defeatedSubtext: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  noMonster: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
});
