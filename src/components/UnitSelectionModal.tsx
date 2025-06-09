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
    cost: 3,
    health: 1200,
    damage: 15,
    attackSpeed: 0.8,
    movementSpeed: 1.0,
    range: 1,
    priority: 3,
    attackType: 'melee',
    armorType: 'heavy',
    innatePassive: 'Tank: Reduces damage taken by 20%'
  },
  priest: {
    cost: 4,
    health: 800,
    damage: 10,
    attackSpeed: 1.0,
    movementSpeed: 1.0,
    range: 3,
    priority: 5,
    attackType: 'magic',
    armorType: 'light',
    innatePassive: 'Healer: Heals lowest HP ally for 15 HP every 2 seconds'
  },
  bishop: {
    cost: 5,
    health: 1000,
    damage: 20,
    attackSpeed: 1.2,
    movementSpeed: 0.8,
    range: 3,
    priority: 4,
    attackType: 'magic',
    armorType: 'medium',
    innatePassive: 'Holy Shield: Grants 10% damage reduction to nearby allies'
  },
  fighter: {
    cost: 2,
    health: 800,
    damage: 20,
    attackSpeed: 1.2,
    movementSpeed: 1.2,
    range: 1,
    priority: 2,
    attackType: 'melee',
    armorType: 'medium',
    innatePassive: 'Berserker: +20% attack speed when below 50% HP'
  },
  goblin: {
    cost: 1,
    health: 500,
    damage: 15,
    attackSpeed: 1.5,
    movementSpeed: 1.5,
    range: 1,
    priority: 1,
    attackType: 'melee',
    armorType: 'light',
    innatePassive: 'Swarm: +5% damage for each allied Goblin'
  },
  wizard: {
    cost: 4,
    health: 700,
    damage: 25,
    attackSpeed: 0.8,
    movementSpeed: 1.0,
    range: 4,
    priority: 4,
    attackType: 'magic',
    armorType: 'light',
    innatePassive: 'Arcane Power: Deals splash damage to nearby enemies'
  },
  gladiator: {
    cost: 3,
    health: 1000,
    damage: 18,
    attackSpeed: 1.0,
    movementSpeed: 1.1,
    range: 1,
    priority: 2,
    attackType: 'melee',
    armorType: 'heavy',
    innatePassive: 'Bloodthirst: Heals for 20% of damage dealt'
  }
};

interface UnitSelectionModalProps {
  visible: boolean;
  onComplete: (selectedUnits: string[]) => void;
}

const { width, height } = Dimensions.get('window');

const UnitSelectionModal: React.FC<UnitSelectionModalProps> = ({ visible, onComplete }) => {
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const maxUnits = 5;

  const allUnits = Object.entries(UNIT_STATS).map(([name, stats]) => ({
    name,
    ...stats
  }));
  
  // Calculate responsive grid layout
  const containerPadding = 40;
  const cardMargin = 16;
  const availableWidth = width * 0.9 - containerPadding;
  const cardsPerRow = Math.min(3, Math.max(2, Math.floor(width / 200))); // 2-3 cards per row based on screen size
  const cardWidth = (availableWidth - (cardMargin * (cardsPerRow - 1))) / cardsPerRow;

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

  const renderUnitCard = (unit: UnitStats & { name: string }) => {
    const isSelected = selectedUnits.includes(unit.name);
    const canSelect = selectedUnits.length < maxUnits || isSelected;

    return (
      <TouchableOpacity
        key={unit.name}
        style={[
          styles.unitCard,
          isSelected && styles.unitCardSelected,
          !canSelect && styles.unitCardDisabled,
          { width: cardWidth }
        ]}
        onPress={() => toggleUnit(unit.name)}
        disabled={!canSelect}
      >
        <View style={styles.unitHeader}>
          <Text style={styles.unitName}>{unit.name}</Text>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        
        <View style={styles.unitImageContainer}>
          {Platform.OS === 'web' ? (
            <UnifiedUnitSprite unitName={unit.name} width={100} height={100} />
          ) : (
            <UnitSpriteSimple unitName={unit.name} width={100} height={100} useGridCellSize={true} />
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⚔️</Text>
            <Text style={styles.statText}>{unit.damage}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statText}>{unit.health}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🏃</Text>
            <Text style={styles.statText}>{unit.movementSpeed}</Text>
          </View>
        </View>
        
        <View style={styles.typeContainer}>
          <Text style={styles.typeText}>{unit.attackType}</Text>
          <Text style={styles.typeText}>{unit.armorType}</Text>
        </View>
      </TouchableOpacity>
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
          
          <View style={styles.unitsGrid}>
            {allUnits.map(renderUnitCard)}
          </View>
          
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
    width: width * 0.9,
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
  unitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  unitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  unitCardSelected: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  unitCardDisabled: {
    opacity: 0.5,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  unitImageContainer: {
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // Container will adjust to sprite size automatically
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  statRow: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 14,
    marginBottom: 2,
  },
  statText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeText: {
    color: '#AAA',
    fontSize: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
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