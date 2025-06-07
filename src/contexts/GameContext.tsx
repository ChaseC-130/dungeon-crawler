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
  purchaseUnit: (unitType: string) => void;
  purchaseAndPlaceUnit: (unitType: string, position: Position) => void;
  sellUnit: (unitId: string) => void;
  rerollShop: () => void;
  selectUpgrade: (upgradeId: string, targetUnitType?: string) => void;
  setReady: () => void;
  selectStartingUnits: (units: string[]) => void;
  hoverCell: (position: Position | null) => void;
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

    socketInstance.on('cell-hover', (data: { playerId: string; position: Position }) => {
      if ((window as any).gameInstance) {
        const scene = (window as any).gameInstance.scene.getScene('MainScene');
        if (scene && scene.showRemoteHover) {
          scene.showRemoteHover(data.playerId, data.position);
        }
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

  const hoverCell = (position: Position | null) => {
    if (socket && isConnected) {
      socket.emit('hover-cell', position);
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
        purchaseUnit,
        purchaseAndPlaceUnit,
        sellUnit,
        rerollShop,
        selectUpgrade,
        setReady,
        selectStartingUnits,
        hoverCell,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};