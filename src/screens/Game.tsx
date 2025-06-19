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

const Game: React.FC = () => {
  const route = useRoute<GameScreenProps['route']>();
  const { gameState, player, placeUnit, moveUnit, purchaseUnit, purchaseAndPlaceUnit, selectStartingUnits } = useGame();
  const gameRef = useRef<PhaserGame | null>(null);
  const containerRef = useRef<View>(null);
  const [showUnitSelection, setShowUnitSelection] = useState(true);
  const [hasSelectedUnits, setHasSelectedUnits] = useState(false);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions(window);
      
      // Trigger game resize if game exists
      if (gameRef.current && Platform.OS === 'web') {
        gameRef.current.resize(window.width, window.height);
      }
    });

    // Add web-specific resize listener
    const handleWebResize = () => {
      if (Platform.OS === 'web') {
        const newDimensions = {
          width: window.innerWidth,
          height: window.innerHeight
        };
        setDimensions(newDimensions);
        
        if (gameRef.current) {
          gameRef.current.resize(newDimensions.width, newDimensions.height);
        }
      }
    };

    if (Platform.OS === 'web') {
      window.addEventListener('resize', handleWebResize);
    }

    return () => {
      subscription?.remove();
      if (Platform.OS === 'web') {
        window.removeEventListener('resize', handleWebResize);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      // Initialize Phaser game for web
      const container = containerRef.current as any;
      gameRef.current = new PhaserGame(
        container,
        dimensions.width,
        dimensions.height
      );
      
      // Add touch and drag support to the container
      if (container) {
        // Prevent default touch behaviors to allow Phaser to handle them
        container.style.touchAction = 'none';
        container.style.userSelect = 'none';
        container.style.webkitUserSelect = 'none';
        
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
        
        // Prevent context menu on touch devices
        container.addEventListener('contextmenu', (e: Event) => {
          e.preventDefault();
        });
      }
      
      // Expose functions globally for Phaser to access
      (window as any).purchaseAndPlaceUnit = purchaseAndPlaceUnit;
      (window as any).placeUnit = placeUnit;
      (window as any).moveUnit = moveUnit;
      (window as any).purchaseUnit = purchaseUnit;
      
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
              console.log('Game.tsx received place-unit event:', { unitId, position });
              placeUnit(unitId, position);
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
      delete (window as any).moveUnit;
      delete (window as any).purchaseUnit;
    };
  }, [placeUnit, moveUnit, purchaseUnit, purchaseAndPlaceUnit]);

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
    backgroundColor: '#000',
  },
});

export default Game;