import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { UnitStats } from '../types/game';
import UnitSpriteSimple from './UnitSpriteSimple';
import UnitSprite from './UnitSprite';
import UnifiedUnitSprite from './UnifiedUnitSprite';

// Unit stats - should match server
const UNIT_STATS: Record<string, UnitStats> = {
  knight: {
    name: 'Knight',
    cost: 3,
    health: 1200,
    maxHealth: 1200,
    damage: 15,
    attackSpeed: 0.8,
    movementSpeed: 1.0,
    range: 1,
    priority: 3,
    attackType: 'Physical',
    armorType: 'Heavy',
    innatePassive: 'Tank: Reduces damage taken by 20%'
  },
  priest: {
    name: 'Priest',
    cost: 4,
    health: 800,
    maxHealth: 800,
    damage: 10,
    attackSpeed: 1.0,
    movementSpeed: 1.0,
    range: 3,
    priority: 5,
    attackType: 'Magical',
    armorType: 'Light',
    innatePassive: 'Healer: Heals lowest HP ally for 15 HP every 2 seconds'
  },
  bishop: {
    name: 'Bishop',
    cost: 5,
    health: 1000,
    maxHealth: 1000,
    damage: 20,
    attackSpeed: 1.2,
    movementSpeed: 0.8,
    range: 3,
    priority: 4,
    attackType: 'Magical',
    armorType: 'Light',
    innatePassive: 'Holy Shield: Grants 10% damage reduction to nearby allies'
  },
  fighter: {
    name: 'Fighter',
    cost: 2,
    health: 800,
    maxHealth: 800,
    damage: 20,
    attackSpeed: 1.2,
    movementSpeed: 1.2,
    range: 1,
    priority: 2,
    attackType: 'Physical',
    armorType: 'Light',
    innatePassive: 'Berserker: +20% attack speed when below 50% HP'
  },
  goblin: {
    name: 'Goblin',
    cost: 1,
    health: 500,
    maxHealth: 500,
    damage: 15,
    attackSpeed: 1.5,
    movementSpeed: 1.5,
    range: 1,
    priority: 1,
    attackType: 'Physical',
    armorType: 'Light',
    innatePassive: 'Swarm: +5% damage for each allied Goblin'
  },
  wizard: {
    name: 'Wizard',
    cost: 4,
    health: 700,
    maxHealth: 700,
    damage: 25,
    attackSpeed: 0.8,
    movementSpeed: 1.0,
    range: 4,
    priority: 4,
    attackType: 'Magical',
    armorType: 'Light',
    innatePassive: 'Arcane Power: Deals splash damage to nearby enemies'
  },
  gladiator: {
    name: 'Gladiator',
    cost: 3,
    health: 1000,
    maxHealth: 1000,
    damage: 18,
    attackSpeed: 1.0,
    movementSpeed: 1.1,
    range: 1,
    priority: 2,
    attackType: 'Physical',
    armorType: 'Heavy',
    innatePassive: 'Bloodthirst: Heals for 20% of damage dealt'
  },
  'red dragon': {
    name: 'Red Dragon',
    cost: 6,
    health: 1800,
    maxHealth: 1800,
    damage: 25,
    attackSpeed: 0.75,
    movementSpeed: 1.0,
    range: 3,
    priority: 1,
    attackType: 'Magical',
    armorType: 'Heavy',
    innatePassive: 'Flying: Becomes untargetable at 66% and 33% health for 5 seconds'
  }
};

interface UnitSelectionModalProps {
  visible: boolean;
  onComplete: (selectedUnits: string[]) => void;
}

const { width, height } = Dimensions.get('window');

const UnitSelectionModal: React.FC<UnitSelectionModalProps> = ({ visible, onComplete }) => {
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);
  const maxUnits = 5;
  
  // Debug UNIT_STATS structure
  console.log('UNIT_STATS object:', UNIT_STATS);
  console.log('UNIT_STATS keys:', Object.keys(UNIT_STATS));
  console.log('Red Dragon entry:', UNIT_STATS['red dragon']);

  const allUnits = Object.entries(UNIT_STATS).map(([key, stats]) => ({
    ...stats,
    key,
    name: stats.name
  }));
  
  console.log('All units from UNIT_STATS:', allUnits.map(u => `${u.name} (key: ${u.key})`));
  
  // Calculate responsive grid layout for 20+ cards
  const containerPadding = 40;
  const cardMargin = 12;
  const availableWidth = width * 0.9 - containerPadding;
  const cardsPerRow = Math.min(6, Math.max(3, Math.floor(width / 200))); // 3-6 cards per row for larger cards
  const cardWidth = Math.min(240, (availableWidth - (cardMargin * (cardsPerRow - 1))) / cardsPerRow);

  const toggleUnit = (unitName: string) => {
    if (selectedUnits.includes(unitName)) {
      setSelectedUnits(selectedUnits.filter(u => u !== unitName));
    } else if (selectedUnits.length < maxUnits) {
      setSelectedUnits([...selectedUnits, unitName]);
    }
  };

  const handleConfirm = () => {
    if (selectedUnits.length === maxUnits) {
      onComplete(selectedUnits);
    }
  };

  const renderUnitCard = (unit: UnitStats & { name: string, key: string }) => {
    const isSelected = selectedUnits.includes(unit.key);
    const canSelect = selectedUnits.length < maxUnits || isSelected;
    const isHovered = hoveredUnit === unit.key;

    return (
      <View key={unit.key} style={styles.cardContainer}>
        <TouchableOpacity
          style={[
            styles.unitCard,
            isSelected && styles.unitCardSelected,
            !canSelect && styles.unitCardDisabled,
            { width: cardWidth }
          ]}
          onPress={() => toggleUnit(unit.key)}
          onPressIn={() => setHoveredUnit(unit.key)}
          onPressOut={() => setHoveredUnit(null)}
          disabled={!canSelect}
        >
          <Text style={styles.unitName}>{unit.name}</Text>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
          
          <View style={styles.unitImageContainer}>
            {Platform.OS === 'web' ? (
              <UnifiedUnitSprite unitName={unit.key} width={360} height={360} />
            ) : (
              <UnitSpriteSimple unitName={unit.key} width={360} height={360} useGridCellSize={true} />
            )}
          </View>
        </TouchableOpacity>
        
        {isHovered && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>{unit.name}</Text>
            <Text style={styles.tooltipPassive}>{unit.innatePassive}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Choose Your Starting Units</Text>
          <Text style={styles.subtitle}>
            Select {maxUnits} units ({selectedUnits.length}/{maxUnits})
          </Text>
          <Text style={[styles.subtitle, {color: 'yellow', fontSize: 16}]}>
            DEBUG: {allUnits.length} units available: {allUnits.map(u => `${u.name} (${u.key})`).join(', ')}
          </Text>
          
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.unitsGrid}>
            {allUnits.map((unit, index) => {
              console.log(`Rendering unit ${index + 1}: ${unit.name} (key: ${unit.key})`);
              return renderUnitCard(unit);
            })}
          </ScrollView>
          
          <TouchableOpacity
            style={[
              styles.confirmButton,
              selectedUnits.length !== maxUnits && styles.confirmButtonDisabled
            ]}
            onPress={handleConfirm}
            disabled={selectedUnits.length !== maxUnits}
          >
            <Text style={styles.confirmButtonText}>
              Start Game
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: width * 0.95,
    maxHeight: height * 0.9,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  scrollContainer: {
    maxHeight: height * 0.65,
  },
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  cardContainer: {
    position: 'relative',
  },
  unitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    margin: 6,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 440,
  },
  unitCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  unitCardDisabled: {
    opacity: 0.5,
  },
  unitName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  checkmark: {
    position: 'absolute',
    top: 16,
    right: 16,
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
  },
  unitImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tooltip: {
    position: 'absolute',
    top: -150,
    left: '50%',
    transform: [{ translateX: -120 }],
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    zIndex: 1000,
    width: 240,
  },
  tooltipTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  tooltipPassive: {
    color: '#AAA',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  confirmButtonDisabled: {
    backgroundColor: '#666',
    borderColor: '#444',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default UnitSelectionModal;