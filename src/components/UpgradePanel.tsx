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
  
  // Use refs to persist state across re-renders
  const selectedCardRef = React.useRef<string | null>(null);
  const selectedUnitTypeRef = React.useRef<string | null>(null);
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  const [hoveredUnitType, setHoveredUnitType] = useState<string | null>(null);
  
  console.log(`UpgradePanel render - selectedCard: ${selectedCardRef.current}, upgradeCards count: ${player?.upgradeCards?.length || 0}`);
  
  // Log component lifecycle
  React.useEffect(() => {
    console.log('UpgradePanel mounted');
    return () => {
      console.log('UpgradePanel unmounted - clearing selection state');
      selectedCardRef.current = null;
      selectedUnitTypeRef.current = null;
    };
  }, []);
  
  // Helper functions to update ref state and trigger re-render
  const setSelectedCard = (value: string | null) => {
    selectedCardRef.current = value;
    forceUpdate();
  };
  
  const setSelectedUnitType = (value: string | null) => {
    selectedUnitTypeRef.current = value;
    forceUpdate();
  };
  
  // Get player's upgrade cards - limit to 1 high-potency and up to 3 normal upgrades
  const allUpgradeCards = player?.upgradeCards || [];
  const highPotencyCards = allUpgradeCards.filter(card => card.isHighPotency).slice(0, 1);
  const normalCards = allUpgradeCards.filter(card => !card.isHighPotency).slice(0, 3);
  const upgradeCards = [...highPotencyCards, ...normalCards];
  
  // Create a stable identifier for the upgrade cards to prevent unnecessary clears
  const upgradeCardIds = upgradeCards.map(card => card.id).sort().join(',');
  
  // Clear selection only when the selected card is no longer available
  React.useEffect(() => {
    if (selectedCardRef.current && !upgradeCards.find(c => c.id === selectedCardRef.current)) {
      console.log(`Clearing selection - card ${selectedCardRef.current} no longer available`);
      setSelectedCard(null);
      setSelectedUnitType(null);
    }
  }, [upgradeCardIds]); // Use card IDs instead of the array reference
  
  // Calculate responsive card dimensions based on screen size
  const numberOfCards = upgradeCards.length || 3;
  const cardMargin = isSmallScreen ? 4 : 8;
  const containerPadding = isSmallScreen ? 10 : 20;
  const availableWidth = width - containerPadding * 2;
  
  // Adjust card sizes based on screen size
  const maxCardWidth = isSmallScreen ? 150 : isMediumScreen ? 180 : 200;
  const minCardWidth = isSmallScreen ? 100 : isMediumScreen ? 120 : 140;
  
  const calculatedWidth = (availableWidth - (cardMargin * (numberOfCards - 1))) / numberOfCards;
  const cardWidth = Math.min(maxCardWidth, Math.max(minCardWidth, calculatedWidth));
  
  // Calculate responsive font sizes
  const titleFontSize = isSmallScreen ? 18 : 24;
  const cardNameFontSize = isSmallScreen ? 13 : 15;
  const cardDescFontSize = isSmallScreen ? 11 : 13;
  const iconSize = isSmallScreen ? 45 : 60;

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
      upgradeCardsCount: player?.upgradeCards?.length 
    });
    
    if (card.isHighPotency) {
      // High potency upgrades are auto-assigned
      console.log('UpgradePanel: Selecting high-potency upgrade directly');
      selectUpgrade(card.id);
      // Force close the panel after selecting high-potency upgrade
      if (onClose) {
        console.log('UpgradePanel: Calling onClose for high-potency upgrade');
        onClose();
      }
    } else {
      // Normal upgrades need unit type selection
      console.log('UpgradePanel: Setting card for unit type selection');
      setSelectedCard(card.id);
    }
  };

  const handleUnitTypeSelect = (unitType: string) => {
    console.log('UpgradePanel: handleUnitTypeSelect called', { 
      selectedCard: selectedCardRef.current, 
      unitType,
      upgradeCardsCount: player?.upgradeCards?.length 
    });
    
    if (selectedCardRef.current) {
      console.log('UpgradePanel: Calling selectUpgrade', { upgradeId: selectedCardRef.current, unitType });
      selectUpgrade(selectedCardRef.current, unitType);
      // Clear selection immediately to prevent re-renders
      setSelectedCard(null);
      setSelectedUnitType(null);
      // Force close the panel after selecting unit type
      if (onClose) {
        console.log('UpgradePanel: Calling onClose to close panel');
        onClose();
      }
    }
  };

  const renderUpgradeCard = (card: UpgradeCard) => {
    const isSelected = selectedCardRef.current === card.id;
    
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

  if (selectedCardRef.current && !upgradeCards.find(c => c.id === selectedCardRef.current)?.isHighPotency) {
    return (
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}>
        <Text style={styles.title}>SELECT UNIT TYPE</Text>
        <Text style={styles.subtitle}>Choose which unit type to upgrade</Text>
        
        <View style={styles.unitTypeContainer}>
          {ownedUnitTypes.map(unitType => {
            const unitTypeWidth = Math.max(110, Math.min(180, (availableWidth - (8 * (ownedUnitTypes.length - 1))) / ownedUnitTypes.length));
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
          onPress={() => {
            setSelectedCard(null);
            setSelectedUnitType(null);
          }}
        >
          <Text style={styles.cancelText}>CANCEL</Text>
        </TouchableOpacity>

        {selectedCardRef.current && selectedUnitTypeRef.current && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => {
              if (selectedCardRef.current) {
                selectUpgrade(selectedCardRef.current, selectedUnitTypeRef.current || undefined);
                setSelectedCard(null);
                setSelectedUnitType(null);
                if (onClose) {
                  onClose();
                }
              }
            }}
          >
            <Text style={styles.confirmText}>SELECT UPGRADE</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      style={styles.scrollContainer} 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    maxHeight: Math.min(height * 0.45, 350),
  },
  container: {
    padding: 10,
    paddingBottom: 20,
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
  },
  upgradeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
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
  confirmButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignSelf: 'center',
    paddingHorizontal: 30,
  },
  confirmText: {
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