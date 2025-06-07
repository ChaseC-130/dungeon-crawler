import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { UpgradeCard } from '../types/game';

const UpgradePanel: React.FC = () => {
  const { gameState, player, selectUpgrade, rerollShop } = useGame();
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<string | null>(null);

  if (!gameState || !player) {
    return null;
  }

  const canAffordReroll = player.gold >= 10;
  const ownedUnitTypes = Array.from(new Set(player.units.map(u => u.name)));

  const handleUpgradeSelect = (card: UpgradeCard) => {
    if (card.isHighPotency) {
      // High potency upgrades are auto-assigned
      selectUpgrade(card.id);
    } else {
      // Normal upgrades need unit type selection
      setSelectedCard(card.id);
    }
  };

  const handleUnitTypeSelect = (unitType: string) => {
    if (selectedCard) {
      selectUpgrade(selectedCard, unitType);
      setSelectedCard(null);
      setSelectedUnitType(null);
    }
  };

  const renderUpgradeCard = (card: UpgradeCard) => {
    const isSelected = selectedCard === card.id;
    
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.upgradeCard,
          card.isHighPotency && styles.highPotencyCard,
          isSelected && styles.selectedCard
        ]}
        onPress={() => handleUpgradeSelect(card)}
      >
        {card.isHighPotency && (
          <View style={styles.highPotencyBadge}>
            <Text style={styles.highPotencyText}>×3 POWER</Text>
          </View>
        )}
        
        <Text style={styles.upgradeName}>{card.name}</Text>
        <Text style={styles.upgradeDescription}>{card.description}</Text>
        
        {card.targetUnitType && (
          <View style={styles.targetContainer}>
            <Text style={styles.targetLabel}>Auto-assigned to:</Text>
            <Text style={styles.targetUnit}>{card.targetUnitType}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (selectedCard && !gameState.upgradeCards.find(c => c.id === selectedCard)?.isHighPotency) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>SELECT UNIT TYPE</Text>
        <Text style={styles.subtitle}>Choose which unit type to upgrade</Text>
        
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {ownedUnitTypes.map(unitType => (
            <TouchableOpacity
              key={unitType}
              style={styles.unitTypeButton}
              onPress={() => handleUnitTypeSelect(unitType)}
            >
              <Text style={styles.unitTypeText}>{unitType}</Text>
              <Text style={styles.unitCount}>
                {player.units.filter(u => u.name === unitType).length} owned
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => {
            setSelectedCard(null);
            setSelectedUnitType(null);
          }}
        >
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>CHOOSE UPGRADE</Text>
        <TouchableOpacity
          style={[styles.rerollButton, !canAffordReroll && styles.rerollButtonDisabled]}
          onPress={rerollShop}
          disabled={!canAffordReroll}
        >
          <Text style={styles.rerollIcon}>🎲</Text>
          <Text style={styles.rerollText}>Reroll (10g)</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {gameState.upgradeCards.map(renderUpgradeCard)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    maxHeight: 250,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 15,
  },
  rerollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.3)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  rerollButtonDisabled: {
    opacity: 0.5,
    borderColor: '#666',
  },
  rerollIcon: {
    fontSize: 18,
    marginRight: 5,
  },
  rerollText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollContent: {
    paddingRight: 15,
  },
  upgradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    width: 200,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  highPotencyCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: '#FFD700',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  highPotencyBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  highPotencyText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  upgradeName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  upgradeDescription: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
  },
  targetContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  targetLabel: {
    color: '#AAA',
    fontSize: 12,
  },
  targetUnit: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  unitTypeButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  unitTypeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unitCount: {
    color: '#AAA',
    fontSize: 12,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 12,
    padding: 15,
    marginTop: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F44336',
  },
  cancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UpgradePanel;