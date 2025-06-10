import React, { createContext, useContext, useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { GameState, Player, Unit, Position, UpgradeCard } from '../types/game';

interface GameContextType {
  socket: Socket | null;
  gameState: GameState | null;
  player: Player | null;
  isConnected: boolean;
  
  // Actions
  joinMatch: (playerName: string) => void;
  placeUnit: (unitId: string, position: Position) => void;
  moveUnit: (unitId: string, position: Position) => void;
  purchaseUnit: (unitType: string) => void;
  purchaseAndPlaceUnit: (unitType: string, position: Position) => void;
  sellUnit: (unitId: string) => void;
  rerollShop: () => void;
  selectUpgrade: (upgradeId: string, targetUnitType?: string) => void;
  setReady: () => void;
  selectStartingUnits: (units: string[]) => void;
  sendCellHover: (position: Position | null) => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: React.ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Update global gameContext when player changes
  useEffect(() => {
    if ((window as any).gameContext) {
      (window as any).gameContext.player = player;
    }
  }, [player]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3001');

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('game-state', (state: GameState) => {
      setGameState(state);
      // Update current player data
      if (player && state.players) {
        const updatedPlayer = state.players.find(p => p.id === player.id);
        if (updatedPlayer) {
          setPlayer(updatedPlayer);
        }
      }
      
      // Update game instance with current player ID
      if ((window as any).gameInstance) {
        const scene = (window as any).gameInstance.scene.getScene('MainScene');
        if (scene && scene.currentPlayerId === null && player) {
          scene.currentPlayerId = player.id;
        }
      }
    });

    socketInstance.on('unit-purchased', (unit: Unit) => {
      // When a unit is purchased, check if we have a pending placement
      if ((window as any).pendingPlacement) {
        const position = (window as any).pendingPlacement;
        delete (window as any).pendingPlacement;
        
        // Immediately place the unit
        socketInstance.emit('place-unit', unit.id, position);
      } else {
        // Otherwise enter placement mode for manual placement
        if ((window as any).gameInstance) {
          const scene = (window as any).gameInstance.scene.getScene('MainScene');
          if (scene && scene.enterPlacementModeForUnit) {
            scene.enterPlacementModeForUnit(unit);
          }
        }
      }
    });

    socketInstance.on('error', (message: string) => {
      console.error('Game error:', message);
      // Handle error (show toast, etc.)
    });

    socketInstance.on('combat-update', (playerUnits: Unit[], enemyUnits: Unit[]) => {
      // Update unit positions and states during combat
      if ((window as any).gameInstance) {
        const scene = (window as any).gameInstance.scene.getScene('MainScene');
        if (scene && scene.updateCombatUnits) {
          scene.updateCombatUnits(playerUnits, enemyUnits);
        }
      }
    });

    socketInstance.on('timer-update', (timeLeft: number) => {
      // Update the timer in game state - this will trigger a re-render in GameHUD
      setGameState(prevState => 
        prevState ? { ...prevState, preparationTimeLeft: timeLeft } : null
      );
    });

    socketInstance.on('player-hover', (playerId: string, playerName: string, position: Position | null, playerColor: string) => {
      console.log('Received player-hover event:', { playerId, playerName, position, playerColor });
      // Update other players' hover positions
      if ((window as any).gameInstance) {
        const scene = (window as any).gameInstance.scene.getScene('MainScene');
        if (scene && scene.updatePlayerHover && player && playerId !== player.id) {
          console.log('Updating player hover in scene');
          scene.updatePlayerHover(playerId, playerName, position, playerColor);
        } else {
          console.log('Cannot update player hover:', { 
            hasScene: !!scene, 
            hasUpdateMethod: !!(scene?.updatePlayerHover), 
            hasPlayer: !!player, 
            isDifferentPlayer: player ? playerId !== player.id : false 
          });
        }
      } else {
        console.log('No game instance available for player hover');
      }
    });

    setSocket(socketInstance);

    // Store context reference for game instance
    (window as any).gameContext = { player, socket: socketInstance };

    return () => {
      socketInstance.disconnect();
      delete (window as any).gameContext;
    };
  }, []);

  const joinMatch = (playerName: string) => {
    if (socket && isConnected) {
      const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newPlayer: Player = {
        id: playerId,
        name: playerName,
        gold: 50,
        units: [],
        isReady: false,
      };
      setPlayer(newPlayer);
      socket.emit('join-match', playerId, playerName);
    }
  };

  const placeUnit = (unitId: string, position: Position) => {
    if (socket && isConnected) {
      socket.emit('place-unit', unitId, position);
    }
  };

  const moveUnit = (unitId: string, position: Position) => {
    console.log(`GameContext.moveUnit called with unitId: ${unitId}, position:`, position);
    console.log(`Socket connected: ${isConnected}, socket exists: ${!!socket}`);
    
    if (socket && isConnected) {
      socket.emit('moveUnit', unitId, position);
      console.log(`Emitted moveUnit event to server`);
    } else {
      console.error(`Cannot emit moveUnit - socket: ${!!socket}, connected: ${isConnected}`);
    }
  };

  const purchaseUnit = (unitType: string) => {
    if (socket && isConnected) {
      socket.emit('purchase-unit', unitType);
    }
  };

  const purchaseAndPlaceUnit = (unitType: string, position: Position) => {
    if (socket && isConnected) {
      socket.emit('purchaseAndPlaceUnit', { unitType, position });
    }
  };

  const sellUnit = (unitId: string) => {
    if (socket && isConnected) {
      socket.emit('sell-unit', unitId);
    }
  };

  const rerollShop = () => {
    if (socket && isConnected && player && player.gold >= 10) {
      socket.emit('reroll-shop');
    }
  };

  const selectUpgrade = (upgradeId: string, targetUnitType?: string) => {
    if (socket && isConnected) {
      socket.emit('select-upgrade', upgradeId, targetUnitType);
    }
  };

  const setReady = () => {
    if (socket && isConnected) {
      socket.emit('player-ready');
    }
  };

  const selectStartingUnits = (units: string[]) => {
    if (socket && isConnected) {
      socket.emit('select-starting-units', units);
    }
  };

  const sendCellHover = (position: Position | null) => {
    if (socket && isConnected && player) {
      socket.emit('cell-hover', position);
    }
  };

  return (
    <GameContext.Provider
      value={{
        socket,
        gameState,
        player,
        isConnected,
        joinMatch,
        placeUnit,
        moveUnit,
        purchaseUnit,
        purchaseAndPlaceUnit,
        sellUnit,
        rerollShop,
        selectUpgrade,
        setReady,
        selectStartingUnits,
        sendCellHover,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};