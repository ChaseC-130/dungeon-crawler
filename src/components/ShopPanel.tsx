import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  PanResponder,
  Animated,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import { UnitStats } from '../types/game';
import UnitSpriteSimple from './UnitSpriteSimple';

const ShopPanel: React.FC = () => {
  const { gameState, player, purchaseUnit, rerollShop } = useGame();
  const [draggedUnit, setDraggedUnit] = React.useState<UnitStats | null>(null);
  const draggedUnitRef = React.useRef<UnitStats | null>(null);

  if (!gameState || !player) {
    return null;
  }

  const canAffordReroll = player.gold >= 10;

  const handleDragStart = (unit: UnitStats, event: any) => {
    if (player.gold < unit.cost) return;
    
    draggedUnitRef.current = unit;
    setDraggedUnit(unit);
    
    // For web, create a drag image
    if (Platform.OS === 'web' && event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('unitType', unit.name);
      event.dataTransfer.setData('action', 'purchase');
      
      // Create custom drag image
      const dragImage = document.createElement('div');
      dragImage.style.position = 'absolute';
      dragImage.style.pointerEvents = 'none';
      dragImage.style.left = '-9999px';
      dragImage.style.width = '64px';
      dragImage.style.height = '64px';
      dragImage.style.background = 'rgba(255,215,0,0.3)';
      dragImage.style.borderRadius = '8px';
      dragImage.style.display = 'flex';
      dragImage.style.alignItems = 'center';
      dragImage.style.justifyContent = 'center';
      dragImage.innerHTML = `<img src="/assets/units/${unit.name.toLowerCase()}/${unit.name.toLowerCase()}.png" style="width: 48px; height: 48px;">`;
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 32, 32);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
    
    // Enter placement mode in game
    if ((window as any).gameInstance) {
      const scene = (window as any).gameInstance.scene.getScene('MainScene');
      if (scene && scene.enterPlacementMode) {
        scene.enterPlacementMode(unit);
      }
    }
  };

  const handleDragEnd = () => {
    draggedUnitRef.current = null;
    setDraggedUnit(null);
  };

  const renderUnitCard = (unit: UnitStats) => {
    const canAfford = player.gold >= unit.cost;
    
    return Platform.OS === 'web' ? (
      <div
        key={unit.name}
        draggable={canAfford}
        onDragStart={(e) => handleDragStart(unit, e)}
        onDragEnd={handleDragEnd}
        style={{
          opacity: canAfford ? 1 : 0.6,
          cursor: canAfford ? 'grab' : 'not-allowed',
          userSelect: 'none',
        }}
      >
        <View style={[styles.unitCard, !canAfford && styles.unitCardDisabled]}>
          <View style={styles.unitHeader}>
            <Text style={styles.unitName}>{unit.name}</Text>
            <View style={styles.costContainer}>
              <Text style={styles.costIcon}>💰</Text>
              <Text style={[styles.costText, !canAfford && styles.costTextDisabled]}>
                {unit.cost}
              </Text>
            </View>
          </View>
          
          <View style={styles.unitImageContainer}>
            <UnitSpriteSimple unitName={unit.name} width={80} height={80} />
          </View>
        
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>⚔️</Text>
              <Text style={styles.statText}>{unit.damage}</Text>
              <Text style={styles.statLabel}>DMG</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>❤️</Text>
              <Text style={styles.statText}>{unit.health}</Text>
              <Text style={styles.statLabel}>HP</Text>
            </View>
            
            <View style={styles.statRow}>
              <Text style={styles.statIcon}>🏃</Text>
              <Text style={styles.statText}>{unit.movementSpeed}</Text>
              <Text style={styles.statLabel}>SPD</Text>
            </View>
          </View>
          
          <View style={styles.typeContainer}>
            <Text style={styles.typeText}>{unit.attackType}</Text>
            <Text style={styles.typeText}>{unit.armorType}</Text>
          </View>
          
          {unit.innatePassive && (
            <Text style={styles.passiveText} numberOfLines={2}>
              {unit.innatePassive}
            </Text>
          )}
          
          {canAfford && (
            <Text style={styles.dragHint}>Drag to place</Text>
          )}
        </View>
      </div>
    ) : (
      <TouchableOpacity
        key={unit.name}
        style={[styles.unitCard, !canAfford && styles.unitCardDisabled]}
        onPress={() => {
          if (canAfford && (window as any).gameInstance) {
            const scene = (window as any).gameInstance.scene.getScene('MainScene');
            if (scene && scene.enterPlacementMode) {
              purchaseUnit(unit.name);
            }
          }
        }}
        disabled={!canAfford}
      >
        <View style={styles.unitHeader}>
          <Text style={styles.unitName}>{unit.name}</Text>
          <View style={styles.costContainer}>
            <Text style={styles.costIcon}>💰</Text>
            <Text style={[styles.costText, !canAfford && styles.costTextDisabled]}>
              {unit.cost}
            </Text>
          </View>
        </View>
        
        <View style={styles.unitImageContainer}>
          <UnitSpriteSimple unitName={unit.name} width={80} height={80} />
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>⚔️</Text>
            <Text style={styles.statText}>{unit.damage}</Text>
            <Text style={styles.statLabel}>DMG</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statText}>{unit.health}</Text>
            <Text style={styles.statLabel}>HP</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statIcon}>🏃</Text>
            <Text style={styles.statText}>{unit.movementSpeed}</Text>
            <Text style={styles.statLabel}>SPD</Text>
          </View>
        </View>
        
        <View style={styles.typeContainer}>
          <Text style={styles.typeText}>{unit.attackType}</Text>
          <Text style={styles.typeText}>{unit.armorType}</Text>
        </View>
        
        {unit.innatePassive && (
          <Text style={styles.passiveText} numberOfLines={2}>
            {unit.innatePassive}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SHOP</Text>
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
        {gameState.shopUnits.map(renderUnitCard)}
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
  scrollContent: {
    paddingRight: 15,
  },
  unitCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 160,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  unitCardDisabled: {
    opacity: 0.6,
  },
  unitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  unitName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  costIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  costText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 14,
  },
  costTextDisabled: {
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statRow: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  statText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statLabel: {
    color: '#AAA',
    fontSize: 10,
    marginTop: 2,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeText: {
    color: '#AAA',
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  passiveText: {
    color: '#4CAF50',
    fontSize: 11,
    fontStyle: 'italic',
  },
  unitImageContainer: {
    height: 80,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitImage: {
    width: 60,
    height: 60,
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
  dragHint: {
    color: '#4CAF50',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default ShopPanel;