const { GAME_CONFIG, UNIT_STATS, UPGRADE_TEMPLATES } = require('./constants');
const CombatEngine = require('./CombatEngine');
const AIManager = require('./AIManager');

class Match {
  constructor(matchId, io) {
    this.matchId = matchId;
    this.io = io;
    this.players = new Map();
    this.currentFloor = 1;
    this.phase = 'preparation';
    this.grid = this.createEmptyGrid();
    this.shopUnits = [];
    this.upgradeCards = [];
    this.enemyUnits = [];
    this.combatEngine = new CombatEngine(this);
    this.aiManager = new AIManager();
    
    // Timer properties
    this.preparationTimer = null;
    this.preparationTimeLeft = GAME_CONFIG.PREPARATION_TIME;
    this.timerInterval = null;
    
    this.generateShop();
  }

  createEmptyGrid() {
    const grid = [];
    for (let y = 0; y < GAME_CONFIG.GRID_HEIGHT; y++) {
      grid[y] = [];
      for (let x = 0; x < GAME_CONFIG.GRID_WIDTH; x++) {
        grid[y][x] = {
          x,
          y,
          occupied: false,
          unitId: null
        };
      }
    }
    return grid;
  }

  addPlayer(playerId, playerName, socket) {
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      socket: socket,
      gold: GAME_CONFIG.STARTING_GOLD,
      units: [],
      isReady: false
    });
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      // Remove player's units from grid
      player.units.forEach(unit => {
        if (unit.position) {
          this.grid[unit.position.y][unit.position.x].occupied = false;
          this.grid[unit.position.y][unit.position.x].unitId = null;
        }
      });
      
      this.players.delete(playerId);
      
      // Clean up timers if no players left
      if (this.players.size === 0) {
        this.stopPreparationTimer();
        this.combatEngine.stopCombat();
      }
      
      this.broadcastGameState();
    }
  }

  start() {
    console.log(`Match ${this.matchId} starting with ${this.players.size} players`);
    // Add selected starting units to shop
    this.updateShopWithStartingUnits();
    this.startPreparationTimer();
    this.broadcastGameState();
    console.log(`Match ${this.matchId} started - timer: ${this.preparationTimeLeft}s, shop units:`, this.shopUnits.length);
  }
  
  updateShopWithStartingUnits() {
    // Collect all unique starting units from all players
    const startingUnits = new Set();
    this.players.forEach(player => {
      if (player.selectedStartingUnits) {
        player.selectedStartingUnits.forEach(unitName => {
          startingUnits.add(unitName);
        });
      }
    });
    
    // If we have starting units, use them as the shop
    if (startingUnits.size > 0) {
      this.shopUnits = Array.from(startingUnits).map(unitName => {
        const unitKey = unitName.toLowerCase();
        const unitStats = UNIT_STATS[unitKey];
        return unitStats ? { ...unitStats } : null;
      }).filter(Boolean); // Remove any null values
    }
  }

  placeUnit(playerId, unitId, position) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'preparation') return;

    const unit = player.units.find(u => u.id === unitId);
    if (!unit) return;

    // Check if position is valid
    if (position.x < 0 || position.x >= GAME_CONFIG.GRID_WIDTH ||
        position.y < 0 || position.y >= GAME_CONFIG.GRID_HEIGHT) {
      this.sendError(player.socket, 'Invalid position');
      return;
    }

    // Clear old position
    if (unit.position) {
      this.grid[unit.position.y][unit.position.x].occupied = false;
      this.grid[unit.position.y][unit.position.x].unitId = null;
    }

    // Check if new position is occupied
    if (this.grid[position.y][position.x].occupied) {
      this.sendError(player.socket, 'Position already occupied');
      return;
    }

    // Place unit
    unit.position = position;
    this.grid[position.y][position.x].occupied = true;
    this.grid[position.y][position.x].unitId = unitId;

    this.broadcastGameState();
  }

  purchaseUnit(playerId, unitType) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'preparation') return;

    const unitStats = this.shopUnits.find(u => u.name === unitType);
    if (!unitStats) {
      this.sendError(player.socket, 'Unit not available in shop');
      return;
    }

    if (player.gold < unitStats.cost) {
      this.sendError(player.socket, 'Not enough gold');
      return;
    }

    // Create new unit
    const unit = {
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: playerId,
      ...unitStats,
      maxHealth: unitStats.health,
      position: null,
      status: 'idle',
      targetId: null,
      attackCooldown: 0,
      buffs: [],
      debuffs: []
    };

    // Deduct gold and add unit
    player.gold -= unitStats.cost;
    player.units.push(unit);

    // Play purchase sound
    player.socket.emit('play-sound', 'purchase');

    this.broadcastGameState();
  }

  sellUnit(playerId, unitId) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'preparation') return;

    const unitIndex = player.units.findIndex(u => u.id === unitId);
    if (unitIndex === -1) return;

    const unit = player.units[unitIndex];

    // Remove from grid
    if (unit.position) {
      this.grid[unit.position.y][unit.position.x].occupied = false;
      this.grid[unit.position.y][unit.position.x].unitId = null;
    }

    // Refund gold
    player.gold += Math.floor(unit.cost * GAME_CONFIG.SELL_REFUND_RATE);

    // Remove unit
    player.units.splice(unitIndex, 1);

    this.broadcastGameState();
  }
  
  purchaseAndPlaceUnit(playerId, unitType, position) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'preparation') return;

    const unitStats = this.shopUnits.find(u => u.name.toLowerCase() === unitType.toLowerCase());
    if (!unitStats) {
      this.sendError(player.socket, 'Unit not available in shop');
      return;
    }

    if (player.gold < unitStats.cost) {
      this.sendError(player.socket, 'Not enough gold');
      return;
    }

    // Check if position is valid
    if (position.x < 0 || position.x >= GAME_CONFIG.GRID_WIDTH ||
        position.y < 0 || position.y >= GAME_CONFIG.GRID_HEIGHT) {
      this.sendError(player.socket, 'Invalid position');
      return;
    }

    // Check if position is occupied
    if (this.grid[position.y][position.x].occupied) {
      this.sendError(player.socket, 'Position already occupied');
      return;
    }

    // Create new unit
    const unit = {
      id: `unit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerId: playerId,
      ...unitStats,
      maxHealth: unitStats.health,
      position: position,
      status: 'idle',
      targetId: null,
      attackCooldown: 0,
      buffs: [],
      debuffs: []
    };

    // Deduct gold and add unit
    player.gold -= unitStats.cost;
    player.units.push(unit);

    // Place on grid
    this.grid[position.y][position.x].occupied = true;
    this.grid[position.y][position.x].unitId = unit.id;

    // Play purchase sound
    player.socket.emit('play-sound', 'purchase');

    this.broadcastGameState();
  }

  rerollShop(playerId) {
    const player = this.players.get(playerId);
    if (!player || player.gold < GAME_CONFIG.REROLL_COST) return;

    player.gold -= GAME_CONFIG.REROLL_COST;
    this.generateShop();
    this.broadcastGameState();
  }

  generateShop() {
    // Get available units based on floor
    const availableUnits = Object.values(UNIT_STATS).filter(unit => {
      return unit.cost <= this.currentFloor * 15; // Scale availability with floor
    });

    // Select 5 random units for shop
    this.shopUnits = [];
    for (let i = 0; i < 5; i++) {
      const randomUnit = availableUnits[Math.floor(Math.random() * availableUnits.length)];
      this.shopUnits.push({...randomUnit});
    }
  }

  selectUpgrade(playerId, upgradeId, targetUnitType) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'post-combat') return;

    const upgrade = this.upgradeCards.find(u => u.id === upgradeId);
    if (!upgrade) return;

    // Apply upgrade to units
    const unitsToUpgrade = player.units.filter(u => {
      if (upgrade.isHighPotency && upgrade.targetUnitType) {
        return u.name === upgrade.targetUnitType;
      } else if (targetUnitType) {
        return u.name === targetUnitType;
      }
      return false;
    });

    unitsToUpgrade.forEach(unit => {
      this.applyUpgrade(unit, upgrade);
    });

    // Clear all upgrade cards after selecting one
    this.upgradeCards = [];

    // Start next floor immediately after selecting any upgrade
    this.startNewFloor();

    this.broadcastGameState();
  }

  applyUpgrade(unit, upgrade) {
    const multiplier = upgrade.isHighPotency ? 3 : 1;

    switch (upgrade.effect) {
      case 'health':
        const healthIncrease = Math.ceil(unit.maxHealth * upgrade.value * multiplier);
        unit.maxHealth += healthIncrease;
        unit.health += healthIncrease;
        break;
      case 'damage':
        unit.damage += Math.ceil(unit.damage * upgrade.value * multiplier);
        break;
      case 'attackSpeed':
        unit.attackSpeed *= (1 + upgrade.value * multiplier);
        break;
      case 'movementSpeed':
        unit.movementSpeed *= (1 + upgrade.value * multiplier);
        break;
      case 'priority':
        unit.priority += upgrade.value * multiplier;
        break;
      default:
        // Special passives are handled in combat
        unit.buffs.push({
          id: `buff-${Date.now()}`,
          type: upgrade.effect,
          value: upgrade.value * multiplier
        });
    }
  }

  setPlayerReady(playerId) {
    console.log(`Player ${playerId} set ready in match ${this.matchId}`);
    const player = this.players.get(playerId);
    if (!player) {
      console.error(`Player ${playerId} not found in match`);
      return;
    }
    if (this.phase !== 'preparation') {
      console.error(`Cannot set ready, current phase: ${this.phase}`);
      return;
    }

    player.isReady = true;
    console.log(`Player ${playerId} marked as ready`);
    
    // Check if all players are ready
    const allReady = Array.from(this.players.values()).every(p => p.isReady);
    console.log(`All players ready: ${allReady}`);
    
    if (allReady) {
      console.log('All players ready, stopping timer and starting combat');
      this.stopPreparationTimer();
      this.startCombat();
    }

    this.broadcastGameState();
  }

  startCombat() {
    this.phase = 'combat';
    
    // Spawn enemy units
    this.enemyUnits = this.aiManager.spawnEnemies(
      this.currentFloor,
      this.getAllPlayerUnits()
    );
    
    // Position enemy units on the top/north side of the grid
    this.enemyUnits.forEach((unit, index) => {
      const col = index % GAME_CONFIG.GRID_WIDTH; // Spread across width
      const row = Math.floor(index / GAME_CONFIG.GRID_WIDTH);
      const y = Math.min(row, 2); // Start from top, max 3 rows
      const x = col;
      unit.position = { x, y };
    });
    
    this.broadcastGameState();
    
    // Start combat simulation
    this.combatEngine.startCombat();
  }

  endCombat(winner) {
    if (winner === 'players') {
      this.phase = 'post-combat';
      
      // Generate upgrade cards
      this.generateUpgradeCards();
      
      // Reset player ready status
      this.players.forEach(player => {
        player.isReady = false;
      });
      
      this.broadcastGameState();
    } else {
      // Game over
      this.phase = 'game-over';
      this.broadcastGameState();
      this.io.to(this.matchId).emit('game-over', 'enemies');
    }
  }

  generateUpgradeCards() {
    this.upgradeCards = [];
    
    // Get owned unit types
    const ownedUnitTypes = new Set();
    this.players.forEach(player => {
      player.units.forEach(unit => {
        if (unit.status !== 'dead') {
          ownedUnitTypes.add(unit.name);
        }
      });
    });
    
    if (ownedUnitTypes.size === 0) return;
    
    // Generate 1 high-potency upgrade
    const highPotencyUpgrade = {
      id: `upgrade-${Date.now()}-high`,
      ...UPGRADE_TEMPLATES[Math.floor(Math.random() * UPGRADE_TEMPLATES.length)],
      isHighPotency: true,
      targetUnitType: Array.from(ownedUnitTypes)[Math.floor(Math.random() * ownedUnitTypes.size)]
    };
    this.upgradeCards.push(highPotencyUpgrade);
    
    // Generate 3 normal upgrades
    for (let i = 0; i < 3; i++) {
      const normalUpgrade = {
        id: `upgrade-${Date.now()}-${i}`,
        ...UPGRADE_TEMPLATES[Math.floor(Math.random() * UPGRADE_TEMPLATES.length)],
        isHighPotency: false
      };
      this.upgradeCards.push(normalUpgrade);
    }
  }

  rerollUpgrades(playerId) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'post-combat') return;

    if (player.gold < GAME_CONFIG.REROLL_COST) {
      this.sendError(player.socket, 'Not enough gold to reroll');
      return;
    }

    player.gold -= GAME_CONFIG.REROLL_COST;
    this.generateUpgradeCards();
    this.broadcastGameState();
  }

  startNewFloor() {
    this.currentFloor++;
    
    if (this.currentFloor > GAME_CONFIG.MAX_FLOORS) {
      // Victory!
      this.phase = 'game-over';
      this.io.to(this.matchId).emit('game-over', 'players');
    } else {
      this.phase = 'preparation';
      this.enemyUnits = [];
      this.updateShopWithStartingUnits(); // Keep original 5 units, don't reroll
      
      // Reset player ready status and timer
      this.players.forEach(player => {
        player.isReady = false;
      });
      
      this.preparationTimeLeft = GAME_CONFIG.PREPARATION_TIME;
      this.startPreparationTimer();
    }
    
    this.broadcastGameState();
  }

  getAllPlayerUnits() {
    const units = [];
    this.players.forEach(player => {
      units.push(...player.units);
    });
    return units;
  }

  // Timer methods
  startPreparationTimer() {
    this.stopPreparationTimer(); // Clear any existing timer
    
    this.timerInterval = setInterval(() => {
      this.preparationTimeLeft--;
      
      // Broadcast timer update
      this.io.to(this.matchId).emit('timer-update', this.preparationTimeLeft);
      
      if (this.preparationTimeLeft <= 0) {
        this.stopPreparationTimer();
        console.log(`Floor ${this.currentFloor}: Timer expired, starting combat automatically`);
        this.startCombat();
      }
    }, 1000); // Update every second
    
    console.log(`Floor ${this.currentFloor}: Started preparation timer (${this.preparationTimeLeft} seconds)`);
  }
  
  stopPreparationTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  broadcastGameState() {
    const gameState = {
      matchId: this.matchId,
      currentFloor: this.currentFloor,
      phase: this.phase,
      preparationTimeLeft: this.preparationTimeLeft,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        gold: p.gold,
        units: p.units,
        isReady: p.isReady
      })),
      enemyUnits: this.enemyUnits,
      grid: this.grid,
      shopUnits: this.shopUnits,
      upgradeCards: this.upgradeCards,
      winner: this.phase === 'game-over' ? (this.currentFloor > GAME_CONFIG.MAX_FLOORS ? 'players' : 'enemies') : null
    };
    
    this.io.to(this.matchId).emit('game-state', gameState);
  }

  sendError(socket, message) {
    socket.emit('error', message);
  }

  isEmpty() {
    return this.players.size === 0;
  }
}

module.exports = Match;