const Match = require('./Match');
const { GAME_CONFIG, UNIT_STATS } = require('./constants');

class GameManager {
  constructor(io) {
    this.io = io;
    this.matches = new Map();
    this.playerToMatch = new Map();
    this.socketToPlayer = new Map();
    this.pendingPlayers = [];
    this.lobbies = new Map(); // For lobby system
  }

  handleJoinMatch(socket, playerId, playerName) {
    // Store socket-player mapping
    this.socketToPlayer.set(socket.id, playerId);
    
    // Add to pending players
    this.pendingPlayers.push({
      socket,
      playerId,
      playerName
    });
    
    // Try to create a match if we have enough players
    if (this.pendingPlayers.length >= GAME_CONFIG.MIN_PLAYERS) {
      this.createMatch();
    }
    
    // Send waiting status
    socket.emit('waiting-for-players', {
      playersInQueue: this.pendingPlayers.length,
      minPlayers: GAME_CONFIG.MIN_PLAYERS,
      maxPlayers: GAME_CONFIG.MAX_PLAYERS
    });
  }

  createMatch() {
    // Take up to MAX_PLAYERS from pending
    const matchPlayers = this.pendingPlayers.splice(0, GAME_CONFIG.MAX_PLAYERS);
    const matchId = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new match
    const match = new Match(matchId, this.io);
    this.matches.set(matchId, match);
    
    // Add players to match
    matchPlayers.forEach(({ socket, playerId, playerName }) => {
      // Join socket room
      socket.join(matchId);
      
      // Track player-match mapping
      this.playerToMatch.set(playerId, matchId);
      
      // Add player to match
      match.addPlayer(playerId, playerName, socket);
    });
    
    // Start the match
    match.start();
    
    // Notify all players
    this.io.to(matchId).emit('match-started', matchId);
  }

  handlePlaceUnit(socket, unitId, position) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.placeUnit(playerId, unitId, position);
    }
  }

  handleMoveUnit(socket, unitId, position) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.moveUnit(playerId, unitId, position);
    }
  }

  handlePurchaseUnit(socket, unitType) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.purchaseUnit(playerId, unitType);
    }
  }

  handleSellUnit(socket, unitId) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.sellUnit(playerId, unitId);
    }
  }

  handleRerollShop(socket) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.rerollShop(playerId);
    }
  }

  handleSelectUpgrade(socket, upgradeId, targetUnitType) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.selectUpgrade(playerId, upgradeId, targetUnitType);
    }
  }

  handleRerollUpgrades(socket) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.rerollUpgrades(playerId);
    }
  }

  handlePlayerReady(socket) {
    const playerId = this.socketToPlayer.get(socket.id);
    console.log(`handlePlayerReady: playerId=${playerId}, socketId=${socket.id}`);
    
    const matchId = this.playerToMatch.get(playerId);
    console.log(`Player ${playerId} is in match ${matchId}`);
    
    const match = this.matches.get(matchId);
    if (match) {
      console.log(`Found match ${matchId}, calling setPlayerReady`);
      match.setPlayerReady(playerId);
    } else {
      console.error(`No match found for player ${playerId}`);
    }
  }

  handleDisconnect(socket) {
    const playerId = this.socketToPlayer.get(socket.id);
    
    // Remove from pending players
    this.pendingPlayers = this.pendingPlayers.filter(p => p.socket.id !== socket.id);
    
    // Handle match disconnect
    if (playerId) {
      const matchId = this.playerToMatch.get(playerId);
      const match = this.matches.get(matchId);
      
      if (match) {
        match.removePlayer(playerId);
        
        // Clean up empty matches
        if (match.isEmpty()) {
          this.matches.delete(matchId);
        }
      }
      
      // Clean up mappings
      this.playerToMatch.delete(playerId);
      this.socketToPlayer.delete(socket.id);
    }
  }

  getActiveMatchCount() {
    return this.matches.size;
  }

  // New lobby system methods
  handleFindMatch(socket, playerId, playerName) {
    console.log(`Player ${playerName} looking for match`);
    
    // Store socket-player mapping
    this.socketToPlayer.set(socket.id, playerId);
    
    // Look for existing lobby or create new one
    let availableLobby = null;
    for (const [lobbyId, lobby] of this.lobbies) {
      if (lobby.players.length < 4 && !lobby.gameStarted) {
        availableLobby = lobby;
        break;
      }
    }
    
    if (!availableLobby) {
      // Create new lobby
      const lobbyId = `lobby-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      availableLobby = {
        id: lobbyId,
        players: [],
        gameStarted: false
      };
      this.lobbies.set(lobbyId, availableLobby);
    }
    
    // Add player to lobby
    availableLobby.players.push({
      id: playerId,
      name: playerName,
      socket: socket,
      isReady: false,
      selectedUnits: null
    });
    
    // Join socket room
    socket.join(availableLobby.id);
    
    // Send lobby update to all players in lobby
    this.sendLobbyUpdate(availableLobby);
  }

  handleCreatePrivateMatch(socket, playerId, playerName) {
    console.log(`Player ${playerName} creating private match`);
    
    // Store socket-player mapping
    this.socketToPlayer.set(socket.id, playerId);
    
    // Create private lobby
    const lobbyId = `private-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const lobby = {
      id: lobbyId,
      players: [{
        id: playerId,
        name: playerName,
        socket: socket,
        isReady: false,
        selectedUnits: null
      }],
      gameStarted: false,
      isPrivate: true
    };
    
    this.lobbies.set(lobbyId, lobby);
    socket.join(lobbyId);
    
    this.sendLobbyUpdate(lobby);
  }

  handleLobbyReady(socket) {
    const playerId = this.socketToPlayer.get(socket.id);
    const lobby = this.findPlayerLobby(playerId);
    
    if (lobby) {
      const player = lobby.players.find(p => p.id === playerId);
      if (player) {
        player.isReady = true;
        this.sendLobbyUpdate(lobby);
        
        // Check if all players are ready
        const allReady = lobby.players.every(p => p.isReady);
        if (allReady && lobby.players.length >= 1) { // Min 1 for testing
          this.startGameFromLobby(lobby);
        }
      }
    }
  }

  handleSelectStartingUnits(socket, units) {
    const playerId = this.socketToPlayer.get(socket.id);
    const lobby = this.findPlayerLobby(playerId);
    
    if (!lobby) {
      socket.emit('error', { message: 'Lobby not found' });
      return;
    }
    
    console.log(`Player ${playerId} selected units:`, units);
    
    // Store selected units for this player
    const player = lobby.players.find(p => p.id === playerId);
    if (player) {
      player.selectedUnits = units;
    }
    
    // Check if all players have selected units
    const allSelected = lobby.players.every(p => p.selectedUnits && p.selectedUnits.length === 5);
    
    if (allSelected) {
      // Create actual match
      this.createMatchFromLobby(lobby);
    }
  }

  handlePurchaseAndPlaceUnit(socket, unitType, position) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.purchaseAndPlaceUnit(playerId, unitType, position);
    }
  }
  
  createMatchFromLobby(lobby) {
    console.log('Creating match from lobby:', lobby.id);
    
    // Create new match
    const matchId = `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const match = new Match(matchId, this.io);
    this.matches.set(matchId, match);
    
    // Add players to match
    lobby.players.forEach(({ id, name, socket, selectedUnits }) => {
      // Join socket room
      socket.join(matchId);
      
      // Track player-match mapping
      this.playerToMatch.set(id, matchId);
      
      // Add player to match
      match.addPlayer(id, name, socket);
      
      // Store selected units for this player
      const player = match.players.get(id);
      if (player) {
        player.selectedStartingUnits = selectedUnits;
      }
    });
    
    // Clean up lobby
    this.lobbies.delete(lobby.id);
    
    // Start the match
    match.start();
    
    console.log(`Match ${matchId} started with ${lobby.players.length} players`);
    
    // Notify all players that the match has started
    lobby.players.forEach(({ socket }) => {
      socket.emit('matchStarted', matchId);
    });
  }

  findPlayerLobby(playerId) {
    for (const [lobbyId, lobby] of this.lobbies) {
      if (lobby.players.some(p => p.id === playerId)) {
        return lobby;
      }
    }
    return null;
  }

  sendLobbyUpdate(lobby) {
    const lobbyData = {
      id: lobby.id,
      players: lobby.players.map(p => ({
        id: p.id,
        name: p.name,
        isReady: p.isReady
      }))
    };
    
    this.io.to(lobby.id).emit('lobbyUpdate', lobbyData);
  }

  startGameFromLobby(lobby) {
    console.log('Starting game from lobby:', lobby.id);
    lobby.gameStarted = true;
    
    // Notify all players to start unit selection
    this.io.to(lobby.id).emit('lobbyReady');
  }

  getUnitCost(unitName) {
    const costs = {
      knight: 20, priest: 12, fighter: 10, wizard: 12, goblin: 7
    };
    return costs[unitName] || 10;
  }

  getUnitStat(unitName, stat) {
    const stats = {
      knight: { damage: 2, health: 15, movementSpeed: 75 },
      priest: { damage: 1, health: 8, movementSpeed: 60 },
      fighter: { damage: 3, health: 12, movementSpeed: 80 },
      wizard: { damage: 4, health: 7, movementSpeed: 60 },
      goblin: { damage: 3, health: 8, movementSpeed: 70 }
    };
    return stats[unitName]?.[stat] || 1;
  }
  
  getFullUnitStats(unitName) {
    const unitKey = unitName.toLowerCase();
    return UNIT_STATS[unitKey] || UNIT_STATS.fighter; // fallback to fighter
  }

  handleCellHover(socket, position) {
    const playerId = this.socketToPlayer.get(socket.id);
    const matchId = this.playerToMatch.get(playerId);
    const match = this.matches.get(matchId);
    
    if (match) {
      match.handlePlayerHover(playerId, position);
    }
  }
}

module.exports = GameManager;