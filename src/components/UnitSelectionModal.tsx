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
  const [hoveredUnit, setHoveredUnit] = useState<string | null>(null);
  const maxUnits = 5;

  const allUnits = Object.entries(UNIT_STATS).map(([name, stats]) => ({
    name,
    ...stats
  }));
  
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

  const renderUnitCard = (unit: UnitStats & { name: string }) => {
    const isSelected = selectedUnits.includes(unit.name);
    const canSelect = selectedUnits.length < maxUnits || isSelected;
    const isHovered = hoveredUnit === unit.name;

    return (
      <View key={unit.name} style={styles.cardContainer}>
        <TouchableOpacity
          style={[
            styles.unitCard,
            isSelected && styles.unitCardSelected,
            !canSelect && styles.unitCardDisabled,
            { width: cardWidth }
          ]}
          onPress={() => toggleUnit(unit.name)}
          onPressIn={() => setHoveredUnit(unit.name)}
          onPressOut={() => setHoveredUnit(null)}
          disabled={!canSelect}
        >
          <Text style={styles.unitName}>{unit.name}</Text>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
          
          <View style={styles.unitImageContainer}>
            {Platform.OS === 'web' ? (
              <UnifiedUnitSprite unitName={unit.name} width={360} height={360} />
            ) : (
              <UnitSpriteSimple unitName={unit.name} width={360} height={360} useGridCellSize={true} />
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
          
          <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.unitsGrid}>
            {allUnits.map(renderUnitCard)}
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