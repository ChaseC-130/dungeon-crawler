import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { UpgradeCard } from '../types/game';

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 768;
const isMediumScreen = width >= 768 && width < 1024;

// Map upgrade names to icon files
const UPGRADE_ICONS: { [key: string]: any } = {
  'Vampiric Strike': require('../../assets/upgradeicons/vampiric_strike.png'),
  'Swift Boots': require('../../assets/upgradeicons/swift_boots.png'),
  'Vitality Boost': require('../../assets/upgradeicons/vitality_boost.png'),
  'Power Surge': require('../../assets/upgradeicons/power_surge.png'),
  'Rapid Strikes': require('../../assets/upgradeicons/rapid_strikes.png'),
  'Evasive Maneuvers': require('../../assets/upgradeicons/evasive_maneuvers.png'),
  'Taunt': require('../../assets/upgradeicons/taunt.png'),
  'Final Gift': require('../../assets/upgradeicons/final_gift.png'),
  'Explosive End': require('../../assets/upgradeicons/explosive_end.png'),
  'Poison Blade': require('../../assets/upgradeicons/poison_blade.png'),
  'Slowing Aura': require('../../assets/upgradeicons/slowing_aura.png'),
};

interface UpgradePanelProps {
  onClose?: () => void;
}

const UpgradePanel: React.FC<UpgradePanelProps> = ({ onClose }) => {
  const { gameState, player, selectUpgrade, rerollShop } = useGame();
  
  // State for the current view mode
  const [viewMode, setViewMode] = useState<'cards' | 'unitSelection'>('cards');
  const [selectedCard, setSelectedCard] = useState<UpgradeCard | null>(null);
  const [hoveredUnitType, setHoveredUnitType] = useState<string | null>(null);
  
  // Get player's upgrade cards - limit to 1 high-potency and up to 3 normal upgrades
  const allUpgradeCards = player?.upgradeCards || [];
  
  // Reset state when upgrade cards change (indicating an upgrade was applied)
  const prevUpgradeCardIds = React.useRef<string>('');
  React.useEffect(() => {
    const currentCardIds = allUpgradeCards.map(c => c.id).sort().join(',');
    if (prevUpgradeCardIds.current && prevUpgradeCardIds.current !== currentCardIds) {
      console.log('UpgradePanel: Upgrade cards changed, resetting state');
      setViewMode('cards');
      setSelectedCard(null);
      setHoveredUnitType(null);
    }
    prevUpgradeCardIds.current = currentCardIds;
  }, [allUpgradeCards]);
  
  // Clear selection if the selected card is no longer available
  React.useEffect(() => {
    if (selectedCard && !allUpgradeCards.find(c => c.id === selectedCard.id)) {
      console.log('UpgradePanel: Selected card no longer available, clearing selection');
      setSelectedCard(null);
      setViewMode('cards');
    }
  }, [selectedCard, allUpgradeCards]);
  console.log('UpgradePanel: All upgrade cards:', allUpgradeCards.length, allUpgradeCards.map(c => ({ id: c.id, name: c.name, isHighPotency: c.isHighPotency })));
  
  const highPotencyCards = allUpgradeCards.filter(card => card.isHighPotency).slice(0, 1);
  const normalCards = allUpgradeCards.filter(card => !card.isHighPotency).slice(0, 3);
  const upgradeCards = [...highPotencyCards, ...normalCards];
  
  console.log('UpgradePanel: Displayed upgrade cards:', upgradeCards.length, upgradeCards.map(c => ({ id: c.id, name: c.name })));
  
  // Calculate responsive card dimensions based on screen size
  const numberOfCards = upgradeCards.length || 4;
  const cardMargin = isSmallScreen ? 6 : 10;
  const containerPadding = isSmallScreen ? 15 : 25;
  const availableWidth = width - containerPadding * 2;
  
  // Adjust card sizes based on screen size
  const maxCardWidth = isSmallScreen ? 180 : isMediumScreen ? 220 : 260;
  const minCardWidth = isSmallScreen ? 140 : isMediumScreen ? 160 : 180;
  
  const calculatedWidth = (availableWidth - (cardMargin * (numberOfCards - 1))) / numberOfCards;
  const cardWidth = Math.min(maxCardWidth, Math.max(minCardWidth, calculatedWidth));
  
  // Calculate responsive font sizes
  const titleFontSize = isSmallScreen ? 20 : 26;
  const cardNameFontSize = isSmallScreen ? 14 : 16;
  const cardDescFontSize = isSmallScreen ? 12 : 14;
  const iconSize = isSmallScreen ? 50 : 65;

  if (!gameState || !player) {
    return null;
  }
  
  // Don't show panel if no upgrade cards available
  if (!upgradeCards || upgradeCards.length === 0) {
    return null;
  }

  const canAffordReroll = player.gold >= 10;
  const ownedUnitTypes = Array.from(new Set(player.units.map(u => u.name)));

  const handleUpgradeSelect = (card: UpgradeCard) => {
    console.log('UpgradePanel: handleUpgradeSelect called', { 
      cardId: card.id, 
      cardName: card.name,
      isHighPotency: card.isHighPotency,
      targetUnitType: card.targetUnitType,
    });
    
    if (card.isHighPotency) {
      // High potency upgrades are auto-assigned
      console.log('UpgradePanel: Selecting high-potency upgrade directly');
      console.log('UpgradePanel: About to call selectUpgrade with:', card.id);
      try {
        selectUpgrade(card.id);
        console.log('UpgradePanel: selectUpgrade called successfully');
      } catch (error) {
        console.error('UpgradePanel: Error calling selectUpgrade:', error);
      }
      // Don't close or change view - let the user continue selecting if they have more cards
    } else {
      // Normal upgrades need unit type selection
      console.log('UpgradePanel: Switching to unit type selection');
      setSelectedCard(card);
      setViewMode('unitSelection');
    }
  };

  const handleUnitTypeSelect = (unitType: string) => {
    console.log('UpgradePanel: handleUnitTypeSelect called', { 
      selectedCard: selectedCard?.id, 
      unitType,
    });
    
    if (selectedCard) {
      console.log('UpgradePanel: About to call selectUpgrade with:', { upgradeId: selectedCard.id, unitType });
      try {
        selectUpgrade(selectedCard.id, unitType);
        console.log('UpgradePanel: selectUpgrade called successfully for normal upgrade');
      } catch (error) {
        console.error('UpgradePanel: Error calling selectUpgrade:', error);
      }
      // Reset to card view for next selection
      setSelectedCard(null);
      setViewMode('cards');
    }
  };

  const handleCancel = () => {
    console.log('UpgradePanel: Cancelling unit type selection');
    setSelectedCard(null);
    setViewMode('cards');
  };

  const renderUpgradeCard = (card: UpgradeCard) => {
    const isSelected = selectedCard?.id === card.id;
    
    return (
      <TouchableOpacity
        key={card.id}
        style={[
          styles.upgradeCard,
          card.isHighPotency && styles.highPotencyCard,
          isSelected && styles.selectedCard,
          { width: cardWidth }
        ]}
        onPress={() => handleUpgradeSelect(card)}
      >
        {card.isHighPotency && (
          <View style={styles.highPotencyBadge}>
            <Text style={styles.highPotencyText}>×3 POWER</Text>
          </View>
        )}
        
        {UPGRADE_ICONS[card.name] && (
          <Image 
            source={UPGRADE_ICONS[card.name]} 
            style={[styles.upgradeIcon, { width: iconSize, height: iconSize }]}
            resizeMode="contain"
          />
        )}
        
        <Text style={[styles.upgradeName, { fontSize: cardNameFontSize }]}>{card.name}</Text>
        <Text style={[styles.upgradeDescription, { fontSize: cardDescFontSize }]}>{card.description}</Text>
        
        {card.targetUnitType && (
          <View style={styles.targetContainer}>
            <Text style={styles.targetLabel}>Auto-assigned to:</Text>
            <Text style={styles.targetUnit}>{card.targetUnitType}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Unit selection view
  if (viewMode === 'unitSelection' && selectedCard) {
    return (
      <View style={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>SELECT UNIT TYPE</Text>
          <Text style={styles.subtitle}>Choose which unit type to upgrade with {selectedCard.name}</Text>
          
          <View style={styles.unitTypeContainer}>
            {ownedUnitTypes.map(unitType => {
              const unitTypeWidth = Math.max(120, Math.min(200, (availableWidth - (12 * (ownedUnitTypes.length - 1))) / ownedUnitTypes.length));
              const sampleUnit = player.units.find(u => u.name === unitType);
              return (
                <TouchableOpacity
                  key={unitType}
                  style={[styles.unitTypeButton, { width: unitTypeWidth }, hoveredUnitType === unitType && styles.unitTypeButtonHover]}
                  onPress={() => handleUnitTypeSelect(unitType)}
                  onPressIn={() => setHoveredUnitType(unitType)}
                  onPressOut={() => setHoveredUnitType(null)}
                >
                  <Text style={styles.unitTypeText}>{unitType}</Text>
                  <Text style={styles.unitCount}>
                    {player.units.filter(u => u.name === unitType).length} owned
                  </Text>
                  {sampleUnit && hoveredUnitType === unitType && (
                    <View style={styles.unitTooltip}>
                      <Text style={styles.tooltipText}>HP: {sampleUnit.health}/{sampleUnit.maxHealth}</Text>
                      <Text style={styles.tooltipText}>Damage: {sampleUnit.damage}</Text>
                      <Text style={styles.tooltipText}>Attack Speed: {sampleUnit.attackSpeed.toFixed(1)}</Text>
                      <Text style={styles.tooltipText}>Range: {sampleUnit.range}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Main card selection view
  return (
    <View style={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { fontSize: titleFontSize }]}>Choose Your Upgrades</Text>
          <TouchableOpacity
            style={[styles.rerollButton, !canAffordReroll && styles.rerollButtonDisabled]}
            onPress={rerollShop}
            disabled={!canAffordReroll}
          >
            <Text style={styles.rerollIcon}>🎲</Text>
            <Text style={styles.rerollText}>Reroll Upgrades (10)</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.upgradeContainer}>
          {upgradeCards.map(renderUpgradeCard)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: Math.min(height * 0.8, 600),
  },
  container: {
    padding: 15,
    paddingBottom: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  upgradeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    paddingHorizontal: 5,
  },
  upgradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    minHeight: 180,
  },
  unitTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 6,
  },
  highPotencyText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
  },
  upgradeIcon: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  upgradeName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  upgradeDescription: {
    color: '#CCC',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  targetContainer: {
    marginTop: 8,
    paddingTop: 8,
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
    borderRadius: 10,
    padding: 12,
    marginRight: 8,
    marginBottom: 8,
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
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F44336',
    alignSelf: 'center',
    paddingHorizontal: 30,
  },
  cancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unitTypeButtonHover: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)',
    borderColor: '#81C784',
  },
  unitTooltip: {
    position: 'absolute',
    top: -120,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
    zIndex: 1000,
  },
  tooltipText: {
    color: '#FFF',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default UpgradePanel;