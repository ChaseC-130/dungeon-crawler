import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useGame } from '../contexts/GameContext';
import ShopPanel from './ShopPanel';
import UpgradePanel from './UpgradePanel';

const GameHUD: React.FC = () => {
  const { gameState, player, setReady } = useGame();
  const [showGridToggle, setShowGridToggle] = React.useState(false);

  if (!gameState || !player) {
    return null;
  }

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
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.unitCount}>Units: {player.units.length}</Text>
        </View>
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
        {gameState.phase === 'post-combat' && <UpgradePanel />}
      </View>
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
});

export default GameHUD;