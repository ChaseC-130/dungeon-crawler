import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../contexts/GameContext';
import GameHUD from '../components/GameHUD';
import PhaserGame from '../game/PhaserGame';
import UnitSelectionModal from '../components/UnitSelectionModal';

type GameScreenProps = StackScreenProps<RootStackParamList, 'Game'>;

const { width, height } = Dimensions.get('window');

const Game: React.FC = () => {
  const route = useRoute<GameScreenProps['route']>();
  const { gameState, player, placeUnit, purchaseUnit, purchaseAndPlaceUnit, selectStartingUnits, hoverCell } = useGame();
  const gameRef = useRef<PhaserGame | null>(null);
  const containerRef = useRef<View>(null);
  const [showUnitSelection, setShowUnitSelection] = useState(true);
  const [hasSelectedUnits, setHasSelectedUnits] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      // Initialize Phaser game for web
      const container = containerRef.current as any;
      gameRef.current = new PhaserGame(
        container,
        width,
        height
      );
      
      // Add drag and drop support to the container
      if (container) {
        container.addEventListener('dragover', (e: DragEvent) => {
          e.preventDefault();
          e.dataTransfer!.dropEffect = 'copy';
        });
        
        container.addEventListener('drop', (e: DragEvent) => {
          e.preventDefault();
          const unitType = e.dataTransfer!.getData('unitType');
          const action = e.dataTransfer!.getData('action');
          
          if (unitType && action === 'purchase') {
            // Let the MainScene handle the drop through its existing pointer events
            console.log('Dropped unit:', unitType);
          }
        });
      }
      
      // Expose functions globally for Phaser to access
      (window as any).purchaseAndPlaceUnit = purchaseAndPlaceUnit;
      (window as any).placeUnit = placeUnit;
      (window as any).purchaseUnit = purchaseUnit;
      (window as any).hoverCell = hoverCell;
      
      // Listen for game events
      const game = (window as any).gameInstance;
      if (game) {
        // Wait for scene to be ready
        game.events.once('ready', () => {
          const scene = game.scene.getScene('MainScene');
          if (scene) {
            scene.events.on('purchase-and-place', (unitType: string, position: any) => {
              purchaseAndPlaceUnit(unitType, position);
            });

            scene.events.on('place-unit', (unitId: string, position: any) => {
              placeUnit(unitId, position);
            });

            scene.events.on('hover-cell', (pos: any) => {
              hoverCell(pos);
            });
          }
        });
      }
    }

    return () => {
      // Cleanup Phaser game
      if (gameRef.current) {
        gameRef.current.destroy();
      }
      
      // Cleanup global functions
      delete (window as any).purchaseAndPlaceUnit;
      delete (window as any).placeUnit;
      delete (window as any).purchaseUnit;
      delete (window as any).hoverCell;
    };
  }, [placeUnit, purchaseUnit, purchaseAndPlaceUnit, hoverCell]);

  useEffect(() => {
    // Update Phaser game state when React state changes
    if (gameRef.current && gameState) {
      gameRef.current.updateGameState(gameState);
    }
  }, [gameState]);

  const handleUnitSelection = (units: string[]) => {
    selectStartingUnits(units);
    setShowUnitSelection(false);
    setHasSelectedUnits(true);
  };

  return (
    <View style={styles.container}>
      <View
        ref={containerRef}
        style={styles.gameContainer}
      />
      <GameHUD />
      {gameState && gameState.currentFloor === 1 && !hasSelectedUnits && (
        <UnitSelectionModal
          visible={showUnitSelection}
          onComplete={handleUnitSelection}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default Game;