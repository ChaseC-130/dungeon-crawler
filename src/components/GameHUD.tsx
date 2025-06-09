import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import ShopPanel from './ShopPanel';
import UpgradePanel from './UpgradePanel';

const GameHUD: React.FC = () => {
  const { gameState, player, setReady } = useGame();
  const [showGridToggle, setShowGridToggle] = React.useState(false);
  const [showPlayerTooltip, setShowPlayerTooltip] = useState(false);

  if (!gameState || !player) {
    return null;
  }

  // Get unit counts by type
  const getUnitCounts = () => {
    const counts: { [key: string]: number } = {};
    player.units.forEach(unit => {
      counts[unit.name] = (counts[unit.name] || 0) + 1;
    });
    return counts;
  };

  // Get all upgrades applied to player's units
  const getAllUpgrades = () => {
    const upgrades: { [key: string]: string[] } = {};
    player.units.forEach(unit => {
      if (unit.buffs && unit.buffs.length > 0) {
        const unitUpgrades = unit.buffs.map(buff => {
          // Convert buff type to readable upgrade name
          switch (buff.type) {
            case 'lifesteal': return 'Vampiric Strike';
            case 'movementSpeed': return 'Swift Boots';
            case 'health': return 'Vitality Boost';
            case 'damage': return 'Power Surge';
            case 'attackSpeed': return 'Rapid Strikes';
            case 'priority': return buff.value > 0 ? 'Evasive Maneuvers' : 'Taunt';
            case 'deathHeal': return 'Final Gift';
            case 'deathExplosion': return 'Explosive End';
            case 'poison': return 'Poison Blade';
            case 'slowAura': return 'Slowing Aura';
            default: return buff.type;
          }
        });
        upgrades[unit.name] = unitUpgrades;
      }
    });
    return upgrades;
  };

  const renderPhaseInfo = () => {
    switch (gameState.phase) {
      case 'preparation':
        return (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseText}>Preparation Phase</Text>
            <Text style={styles.floorText}>Floor {gameState.currentFloor}/10</Text>
            <TouchableOpacity
              style={[styles.readyButton, player.isReady && styles.readyButtonActive]}
              onPress={setReady}
              disabled={player.isReady}
            >
              <Text style={styles.readyButtonText}>
                {player.isReady ? 'READY!' : 'READY'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      case 'combat':
        return (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseText}>Combat Phase</Text>
            <Text style={styles.floorText}>Floor {gameState.currentFloor}/10</Text>
            <TouchableOpacity
              style={styles.gridToggleButton}
              onPress={() => {
                // Emit event to toggle grid
                if ((window as any).gameInstance) {
                  const scene = (window as any).gameInstance.scene.getScene('MainScene');
                  if (scene && scene.grid) {
                    scene.grid.toggleGridVisibility();
                  }
                }
              }}
            >
              <Text style={styles.gridToggleText}>Toggle Grid</Text>
            </TouchableOpacity>
          </View>
        );
      case 'post-combat':
        return (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseText}>Victory!</Text>
            <Text style={styles.floorText}>Choose Upgrades</Text>
          </View>
        );
      case 'game-over':
        return (
          <View style={styles.phaseContainer}>
            <Text style={styles.phaseText}>
              {gameState.winner === 'players' ? 'Victory!' : 'Defeat'}
            </Text>
          </View>
        );
    }
  };

  // Get unplaced units
  const unplacedUnits = player.units.filter(unit => !unit.position);

  return (
    <View style={styles.container}>
      {/* Top HUD */}
      <View style={styles.topHUD}>
        <View style={styles.goldContainer}>
          <Text style={styles.goldIcon}>💰</Text>
          <Text style={styles.goldText}>{player.gold}</Text>
        </View>
        {renderPhaseInfo()}
        <TouchableOpacity 
          style={styles.playerInfo}
          onPress={() => setShowPlayerTooltip(true)}
        >
          <Text style={[styles.playerName, { color: player.color || '#FFF' }]}>{player.name}</Text>
          <Text style={styles.unitCount}>Units: {player.units.length}</Text>
        </TouchableOpacity>
      </View>

      {/* Unplaced Units */}
      {unplacedUnits.length > 0 && gameState.phase === 'preparation' && (
        <View style={styles.unplacedUnitsContainer}>
          <Text style={styles.unplacedUnitsTitle}>Unplaced Units (Click to place):</Text>
          <ScrollView horizontal style={styles.unplacedUnitsScroll}>
            {unplacedUnits.map(unit => (
              <TouchableOpacity
                key={unit.id}
                style={styles.unplacedUnit}
                onPress={() => {
                  if ((window as any).gameInstance) {
                    const scene = (window as any).gameInstance.scene.getScene('MainScene');
                    if (scene && scene.enterPlacementModeForUnit) {
                      scene.enterPlacementModeForUnit(unit);
                    }
                  }
                }}
              >
                <Text style={styles.unplacedUnitName}>{unit.name}</Text>
                <Text style={styles.unplacedUnitStats}>
                  ⚔️{unit.damage} ❤️{unit.health}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom HUD */}
      <View style={styles.bottomHUD}>
        {gameState.phase === 'preparation' && <ShopPanel />}
        {gameState.phase === 'post-combat' && player?.upgradeCards && player.upgradeCards.length > 0 && <UpgradePanel />}
      </View>

      {/* Player Info Tooltip Modal */}
      <Modal
        visible={showPlayerTooltip}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPlayerTooltip(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowPlayerTooltip(false)}
        >
          <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipTitle}>{player.name}'s Army</Text>
            
            <View style={styles.tooltipSection}>
              <Text style={styles.tooltipSectionTitle}>Unit Counts:</Text>
              {Object.entries(getUnitCounts()).map(([unitType, count]) => (
                <Text key={unitType} style={styles.tooltipItem}>
                  • {unitType}: {count}
                </Text>
              ))}
            </View>

            <View style={styles.tooltipSection}>
              <Text style={styles.tooltipSectionTitle}>Upgrades:</Text>
              {Object.keys(getAllUpgrades()).length > 0 ? (
                Object.entries(getAllUpgrades()).map(([unitType, upgrades]) => (
                  <View key={unitType} style={styles.upgradeGroup}>
                    <Text style={styles.upgradeUnitType}>{unitType}:</Text>
                    {upgrades.map((upgrade, index) => (
                      <Text key={index} style={styles.tooltipItem}>
                        • {upgrade}
                      </Text>
                    ))}
                  </View>
                ))
              ) : (
                <Text style={styles.tooltipItem}>No upgrades yet</Text>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPlayerTooltip(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  topHUD: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingTop: 40, // Account for status bar
  },
  goldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  goldIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  goldText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  phaseContainer: {
    alignItems: 'center',
  },
  phaseText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  floorText: {
    color: '#CCC',
    fontSize: 14,
    marginTop: 4,
  },
  readyButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 2,
    borderColor: '#1B5E20',
  },
  readyButtonActive: {
    backgroundColor: '#66BB6A',
    borderColor: '#4CAF50',
  },
  readyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  playerInfo: {
    alignItems: 'flex-end',
  },
  playerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  unitCount: {
    color: '#CCC',
    fontSize: 12,
    marginTop: 2,
  },
  bottomHUD: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  gridToggleButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0D47A1',
  },
  gridToggleText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  unplacedUnitsContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
  },
  unplacedUnitsTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  unplacedUnitsScroll: {
    flexDirection: 'row',
  },
  unplacedUnit: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
  },
  unplacedUnitName: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  unplacedUnitStats: {
    color: '#CCC',
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  tooltipTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  tooltipSection: {
    marginBottom: 15,
  },
  tooltipSectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tooltipItem: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 4,
    paddingLeft: 10,
  },
  upgradeGroup: {
    marginBottom: 8,
  },
  upgradeUnitType: {
    color: '#4CAF50',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  closeButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#0D47A1',
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default GameHUD;