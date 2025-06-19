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
          unitId: null,
          playerId: null
        };
      }
    }
    return grid;
  }

  addPlayer(playerId, playerName, socket) {
    // Assign player colors
    const playerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3'];
    const assignedColors = Array.from(this.players.values()).map(p => p.color);
    const availableColor = playerColors.find(color => !assignedColors.includes(color)) || '#888888';
    
    this.players.set(playerId, {
      id: playerId,
      name: playerName,
      socket: socket,
      gold: GAME_CONFIG.STARTING_GOLD,
      units: [],
      isReady: false,
      initialUnitPositions: new Map(), // unitId -> position
      upgradeCards: [], // Individual upgrade cards for this player
      hasSelectedUpgrade: false, // Track if player has selected upgrade this round
      color: availableColor
    });
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      // Remove player's units from grid
      player.units.forEach(unit => {
        if (unit.position && 
            unit.position.y >= 0 && 
            unit.position.y < this.grid.length &&
            unit.position.x >= 0 && 
            unit.position.x < this.grid[0].length &&
            this.grid[unit.position.y] &&
            this.grid[unit.position.y][unit.position.x]) {
          this.grid[unit.position.y][unit.position.x].occupied = false;
          this.grid[unit.position.y][unit.position.x].unitId = null;
          this.grid[unit.position.y][unit.position.x].playerId = null;
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
    // Each player should have their own selected units as their personal shop
    // Instead of a global shop, we'll store each player's available units
    this.players.forEach(player => {
      if (player.selectedStartingUnits) {
        // Convert selected unit names to full unit stats for this player
        player.availableUnits = player.selectedStartingUnits.map(unitName => {
          const unitKey = unitName.toLowerCase();
          const unitStats = UNIT_STATS[unitKey];
          return unitStats ? { ...unitStats } : null;
        }).filter(Boolean); // Remove any null values
      } else {
        // Fallback: give all units if no selection was made
        player.availableUnits = Object.values(UNIT_STATS);
      }
    });
    
    // For backward compatibility, still maintain a global shop with all unique units
    // This can be used as fallback or for enemy encounters
    const allUnits = new Set();
    this.players.forEach(player => {
      if (player.selectedStartingUnits) {
        player.selectedStartingUnits.forEach(unitName => {
          allUnits.add(unitName);
        });
      }
    });
    
    if (allUnits.size > 0) {
      this.shopUnits = Array.from(allUnits).map(unitName => {
        const unitKey = unitName.toLowerCase();
        const unitStats = UNIT_STATS[unitKey];
        return unitStats ? { ...unitStats } : null;
      }).filter(Boolean);
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

    // Check if new position is occupied by another player's unit
    if (this.grid[position.y][position.x].occupied) {
      const occupyingUnitId = this.grid[position.y][position.x].unitId;
      // Check if it's occupied by another player's unit
      let isOwnUnit = false;
      for (const [pid, p] of this.players) {
        if (p.units.some(u => u.id === occupyingUnitId)) {
          if (pid === playerId) {
            isOwnUnit = true;
          }
          break;
        }
      }
      
      if (!isOwnUnit) {
        this.sendError(player.socket, 'Position already occupied by another player');
        return;
      }
    }

    // Clear old position
    if (unit.position) {
      this.grid[unit.position.y][unit.position.x].occupied = false;
      this.grid[unit.position.y][unit.position.x].unitId = null;
      this.grid[unit.position.y][unit.position.x].playerId = null;
    }

    // Place unit
    unit.position = position;
    this.grid[position.y][position.x].occupied = true;
    this.grid[position.y][position.x].unitId = unitId;
    this.grid[position.y][position.x].playerId = playerId; // Track owner
    player.initialUnitPositions.set(unit.id, { ...position }); // Store a copy

    this.broadcastGameState();
  }

  purchaseUnit(playerId, unitType) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'preparation') return;

    // Use player's personal available units instead of global shop
    const unitStats = player.availableUnits ? 
      player.availableUnits.find(u => u.name === unitType) :
      this.shopUnits.find(u => u.name === unitType);
      
    if (!unitStats) {
      this.sendError(player.socket, 'Unit not available for purchase');
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
      debuffs: [],
      deathAnimationComplete: false
    };

    // Deduct gold and add unit
    player.gold -= unitStats.cost;
    player.units.push(unit);

    // Play purchase sound
    player.socket.emit('play-sound', 'purchase');
    
    // Emit unit-purchased event for placement handling
    player.socket.emit('unit-purchased', unit);

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
      this.grid[unit.position.y][unit.position.x].playerId = null;
    }

    // Refund gold
    player.gold += Math.floor(unit.cost * GAME_CONFIG.SELL_REFUND_RATE);

    // Remove unit
    player.units.splice(unitIndex, 1);
    player.initialUnitPositions.delete(unit.id);

    this.broadcastGameState();
  }

  moveUnit(playerId, unitId, newPosition) {
    const player = this.players.get(playerId);
    if (!player || (this.phase !== 'preparation' && this.phase !== 'post-combat')) return;

    const unit = player.units.find(u => u.id === unitId);
    if (!unit) return;

    // Check if new position is valid
    if (newPosition.x < 0 || newPosition.x >= GAME_CONFIG.GRID_WIDTH ||
        newPosition.y < 0 || newPosition.y >= GAME_CONFIG.GRID_HEIGHT) {
      console.log(`Invalid move position for unit ${unitId}: (${newPosition.x}, ${newPosition.y})`);
      return;
    }

    // Check if new position is occupied by another player's unit
    const targetCell = this.grid[newPosition.y][newPosition.x];
    if (targetCell.occupied && targetCell.playerId !== playerId) {
      console.log(`Position (${newPosition.x}, ${newPosition.y}) occupied by another player`);
      return;
    }

    // Clear old position
    if (unit.position) {
      this.grid[unit.position.y][unit.position.x].occupied = false;
      this.grid[unit.position.y][unit.position.x].unitId = null;
      this.grid[unit.position.y][unit.position.x].playerId = null;
    }

    // Set new position
    unit.position = newPosition;
    this.grid[newPosition.y][newPosition.x].occupied = true;
    this.grid[newPosition.y][newPosition.x].unitId = unitId;
    this.grid[newPosition.y][newPosition.x].playerId = playerId;
    
    // Update initial position tracking
    player.initialUnitPositions.set(unit.id, { ...newPosition });

    console.log(`Moved unit ${unitId} from player ${playerId} to position (${newPosition.x}, ${newPosition.y})`);
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
      debuffs: [],
      deathAnimationComplete: false
    };

    // Deduct gold and add unit
    player.gold -= unitStats.cost;
    player.units.push(unit);

    // Place on grid
    this.grid[position.y][position.x].occupied = true;
    this.grid[position.y][position.x].unitId = unit.id;
    this.grid[position.y][position.x].playerId = playerId; // Track owner
    player.initialUnitPositions.set(unit.id, { ...unit.position }); // Store a copy

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
    console.log(`selectUpgrade called:`, { playerId, upgradeId, targetUnitType, phase: this.phase });
    
    const player = this.players.get(playerId);
    if (!player) {
      console.log(`Player ${playerId} not found`);
      return;
    }
    
    if (this.phase !== 'post-combat' && this.phase !== 'preparation') {
      console.log(`Invalid phase for upgrade selection: ${this.phase}`);
      return;
    }

    // Find upgrade in this player's individual upgrade cards
    const upgrade = player.upgradeCards.find(u => u.id === upgradeId);
    if (!upgrade) {
      console.log(`Upgrade ${upgradeId} not found in player's upgrade cards`);
      return;
    }

    // Players can now use multiple upgrades, no restriction on selection

    // Apply upgrade to units
    const unitsToUpgrade = player.units.filter(u => {
      if (upgrade.isHighPotency && upgrade.targetUnitType) {
        return u.name === upgrade.targetUnitType;
      } else if (targetUnitType) {
        return u.name === targetUnitType;
      }
      return false;
    });

    console.log(`Applying upgrade ${upgrade.name} to ${unitsToUpgrade.length} units of type ${targetUnitType || upgrade.targetUnitType}`);
    unitsToUpgrade.forEach(unit => {
      this.applyUpgrade(unit, upgrade);
    });

    // Remove all 4 cards from this upgrade opportunity (high-potency + 3 normal)
    const upgradeIndex = player.upgradeCards.findIndex(u => u.id === upgradeId);
    if (upgradeIndex !== -1) {
      // Find the group this upgrade belongs to (every 4 cards = 1 opportunity)
      const groupStart = Math.floor(upgradeIndex / 4) * 4;
      const cardsBeforeRemoval = player.upgradeCards.length;
      // Remove the entire group of 4 cards
      player.upgradeCards.splice(groupStart, 4);
      console.log(`Player ${playerId} used upgrade opportunity:`, {
        selectedUpgradeId: upgradeId,
        selectedUpgradeName: upgrade.name,
        targetUnitType: targetUnitType || upgrade.targetUnitType,
        cardsBeforeRemoval,
        cardsAfterRemoval: player.upgradeCards.length,
        opportunitiesRemaining: Math.ceil(player.upgradeCards.length / 4)
      });
    }

    // No need to check for "all players selected" - upgrades are now independent
    // Players can use upgrades during preparation phase whenever they want
    this.broadcastGameState();
  }

  applyUpgrade(unit, upgrade) {
    const multiplier = upgrade.isHighPotency ? 3 : 1;
    
    // Ensure unit has buffs array
    if (!unit.buffs) {
      unit.buffs = [];
    }

    console.log(`Applying upgrade effect ${upgrade.effect} to unit ${unit.name} with multiplier ${multiplier}`);

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

  // TODO: Handle this in startCombat instead, to ensure final positions are captured
  // setPlayerReady(playerId) {
  //   console.log(`Player ${playerId} set ready in match ${this.matchId}`);
  //   const player = this.players.get(playerId);
  //   if (!player) {
  //     console.error(`Player ${playerId} not found in match`);
  //     return;
  //   }
  //   if (this.phase !== 'preparation') {
  //     console.error(`Cannot set ready, current phase: ${this.phase}`);
  //     return;
  //   }

  //   player.isReady = true;
  //   console.log(`Player ${playerId} marked as ready`);

  //   // Store initial positions when player is ready
  //   // player.units.forEach(unit => {
  //   //   if (unit.position) {
  //   //     player.initialUnitPositions.set(unit.id, { ...unit.position });
  //   //   }
  //   // });

  //   // Check if all players are ready
  //   const allReady = Array.from(this.players.values()).every(p => p.isReady);
  //   console.log(`All players ready: ${allReady}`);

  //   if (allReady) {
  //     console.log('All players ready, stopping timer and starting combat');
  //     this.stopPreparationTimer();
  //     this.startCombat();
  //   }

  //   this.broadcastGameState();
  // }

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
    // Save initial positions for all player units at the start of combat
    this.players.forEach(player => {
      player.units.forEach(unit => {
        if (unit.position) { // Only save if currently placed
          player.initialUnitPositions.set(unit.id, { ...unit.position });
        } else {
          // If unit is not placed, ensure it's not in initialUnitPositions
          player.initialUnitPositions.delete(unit.id);
        }
      });
    });

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
    console.log(`🏁 COMBAT ENDED - Winner: ${winner}, Floor: ${this.currentFloor}`);
    if (winner === 'players') {
      // IMMEDIATELY start preparation phase with timer instead of post-combat
      this.phase = 'preparation'; 
      console.log(`📋 Phase changed to: ${this.phase} (immediate timer start)`);
      
      // Reset unit positions to initial positions immediately for next round
      this.resetUnitsToInitialPositions();
      
      // Reset player ready status but keep upgrade selection status
      this.players.forEach(player => {
        player.isReady = false;
        // Don't reset hasSelectedUpgrade - let players accumulate upgrades
      });
      console.log(`🔄 Reset players ready status, keeping upgrade selection status`);
      
      // Generate upgrade cards for players who don't have any yet (accumulate upgrades)
      this.generateUpgradeCards();
      
      // Log each player's upgrade status
      this.players.forEach(player => {
        console.log(`👤 Player ${player.name}: upgradeCards=${player.upgradeCards?.length || 0}, hasSelected=${player.hasSelectedUpgrade}`);
      });
      
      // Start timer immediately for preparation phase
      this.preparationTimeLeft = GAME_CONFIG.PREPARATION_TIME;
      console.log(`⏰ Starting preparation timer immediately: ${this.preparationTimeLeft} seconds`);
      this.startPreparationTimer();
      
      console.log(`📡 Broadcasting preparation state to all clients`);
      console.log(`🔌 Active players with sockets: ${this.players.size}`);
      this.players.forEach(player => {
        console.log(`   👤 Player ${player.name} (${player.id}): Socket connected = ${player.socket.connected}`);
      });
      this.broadcastGameState();
    } else {
      // Game over
      this.phase = 'game-over';
      console.log(`💀 Game Over - Phase: ${this.phase}`);
      this.broadcastGameState();
      this.io.to(this.matchId).emit('game-over', 'enemies');
    }
  }

  resetUnitsToInitialPositions() {
    console.log(`🔄 Resetting units to initial positions for ${this.players.size} players`);
    
    // Clear current grid state related to player units
    this.players.forEach(player => {
      player.units.forEach(unit => {
        if (unit.position && this.grid[unit.position.y] && this.grid[unit.position.y][unit.position.x]) {
          this.grid[unit.position.y][unit.position.x].occupied = false;
          this.grid[unit.position.y][unit.position.x].unitId = null;
          this.grid[unit.position.y][unit.position.x].playerId = null;
        }
      });
    });

    // Heal dead units instead of removing them (they should respawn for next battle)
    this.players.forEach(player => {
      console.log(`🏥 Checking units for player ${player.name} - Total units: ${player.units.length}`);
      let deadCount = 0;
      let aliveCount = 0;
      
      player.units.forEach(unit => {
        if (unit.status === 'dead') {
          deadCount++;
          unit.status = 'idle';
          unit.health = unit.maxHealth; // Heal to full health
          console.log(`💊 Respawning unit: ${unit.name} (${unit.id}) with full health`);
        } else {
          aliveCount++;
          console.log(`✅ Unit already alive: ${unit.name} (${unit.id}) - Status: ${unit.status}`);
        }
      });
      
      console.log(`👤 Player ${player.name}: ${deadCount} revived, ${aliveCount} already alive`);
    });

    // Reset unit positions to initial and update grid
    this.players.forEach(player => {
      let unitsWithPosition = 0;
      let unitsWithoutPosition = 0;
      
      player.units.forEach(unit => {
        const initialPos = player.initialUnitPositions.get(unit.id);
        if (initialPos) {
          unitsWithPosition++;
          unit.position = { ...initialPos }; // Restore position
          console.log(`📍 Restored position for ${unit.name} (${unit.id}) to (${initialPos.x}, ${initialPos.y})`);
          // Update the grid with the restored position
          if (this.grid[initialPos.y] && this.grid[initialPos.y][initialPos.x]) {
            this.grid[initialPos.y][initialPos.x].occupied = true;
            this.grid[initialPos.y][initialPos.x].unitId = unit.id;
            this.grid[initialPos.y][initialPos.x].playerId = unit.playerId;
          }
        } else {
          unitsWithoutPosition++;
          // If a unit doesn't have an initial position, ensure its position is null
          unit.position = null;
          console.log(`❌ No initial position found for ${unit.name} (${unit.id}) - setting position to null`);
        }
        // Reset status to idle
        unit.status = 'idle';
        // Reset any combat-specific temporary state
        unit.targetId = null;
        unit.attackCooldown = 0;
        unit.deathAnimationComplete = false;
        // Heal unit to full health
        unit.health = unit.maxHealth;
      });
      
      console.log(`📊 Player ${player.name}: ${unitsWithPosition} units positioned, ${unitsWithoutPosition} units without position`);
    });
    
    console.log(`✅ Unit revival and positioning complete`);
  }

  generateUpgradeCards() {
    console.log(`🎁 Generating upgrade cards for ${this.players.size} players`);
    // Generate individual upgrade cards for each player
    this.players.forEach(player => {
      this.generateUpgradeCardsForPlayer(player.id);
    });
    
    // Check if all players have been auto-marked as selected (no alive units)
    const allPlayersSelected = Array.from(this.players.values()).every(p => p.hasSelectedUpgrade);
    console.log(`🔍 Auto-selection check: ${allPlayersSelected ? 'All players auto-selected' : 'Some players need to select upgrades'}`);
    
    if (allPlayersSelected) {
      console.log('⚡ All players auto-selected upgrades (no alive units), starting next floor immediately');
      // Reset upgrade selection status for all players
      this.players.forEach(player => {
        player.hasSelectedUpgrade = false;
      });
      // Start next floor immediately
      this.startNewFloor();
      return; // Don't broadcast post-combat state, go straight to preparation
    }
    
    console.log(`✅ Upgrade generation complete - staying in post-combat phase`);
  }

  generateUpgradeCardsForPlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    // Don't clear existing upgrade cards - let them accumulate across rounds
    if (!player.upgradeCards) {
      player.upgradeCards = [];
    }
    
    // Get owned unit types for this specific player
    const ownedUnitTypes = new Set();
    player.units.forEach(unit => {
      if (unit.status !== 'dead') {
        ownedUnitTypes.add(unit.name);
      }
    });
    
    if (ownedUnitTypes.size === 0) {
      // Player has no alive units, but don't auto-select if they have upgrade cards
      if (player.upgradeCards.length === 0) {
        player.hasSelectedUpgrade = true;
      }
      return;
    }
    
    // Generate 1 high-potency upgrade and add to existing cards
    const highPotencyUpgrade = {
      id: `upgrade-${playerId}-${Date.now()}-high`,
      ...UPGRADE_TEMPLATES[Math.floor(Math.random() * UPGRADE_TEMPLATES.length)],
      isHighPotency: true,
      targetUnitType: Array.from(ownedUnitTypes)[Math.floor(Math.random() * ownedUnitTypes.size)]
    };
    player.upgradeCards.push(highPotencyUpgrade);
    
    // Generate 3 normal upgrades and add to existing cards
    for (let i = 0; i < 3; i++) {
      const normalUpgrade = {
        id: `upgrade-${playerId}-${Date.now()}-${i}`,
        ...UPGRADE_TEMPLATES[Math.floor(Math.random() * UPGRADE_TEMPLATES.length)],
        isHighPotency: false
      };
      player.upgradeCards.push(normalUpgrade);
    }
    
    console.log(`📈 Player ${player.name} now has ${player.upgradeCards.length} total upgrade cards`);
  }

  rerollUpgrades(playerId) {
    const player = this.players.get(playerId);
    if (!player || this.phase !== 'post-combat') return;

    if (player.gold < GAME_CONFIG.REROLL_COST) {
      this.sendError(player.socket, 'Not enough gold to reroll');
      return;
    }

    if (player.hasSelectedUpgrade) {
      this.sendError(player.socket, 'Cannot reroll after selecting an upgrade');
      return;
    }

    player.gold -= GAME_CONFIG.REROLL_COST;
    this.generateUpgradeCardsForPlayer(playerId); // Generate new cards only for this player
    this.broadcastGameState();
  }

  startNewFloor() {
    this.currentFloor++;
    console.log(`🎯 STARTING NEW FLOOR ${this.currentFloor}/${GAME_CONFIG.MAX_FLOORS}`);
    
    if (this.currentFloor > GAME_CONFIG.MAX_FLOORS) {
      // Victory!
      this.phase = 'game-over';
      console.log(`🏆 VICTORY! Phase: ${this.phase}`);
      this.io.to(this.matchId).emit('game-over', 'players');
    } else {
      this.phase = 'preparation';
      console.log(`📋 Phase changed to: ${this.phase}`);
      this.enemyUnits = [];

      // Units are already reset to initial positions in endCombat()
      // Just ensure they're in the correct state for preparation phase

      this.updateShopWithStartingUnits(); // Keep original 5 units, don't reroll
      
      // Reset player ready status and timer
      this.players.forEach(player => {
        player.isReady = false;
      });
      
      this.preparationTimeLeft = GAME_CONFIG.PREPARATION_TIME;
      console.log(`⏰ Timer set to: ${this.preparationTimeLeft} seconds`);
      this.startPreparationTimer();
    }
    
    console.log(`📡 Broadcasting preparation state to all clients`);
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
      console.log(`⏰ Timer tick: ${this.preparationTimeLeft}s remaining`);
      
      // Broadcast timer update
      this.io.to(this.matchId).emit('timer-update', this.preparationTimeLeft);
      console.log(`📡 Sent timer-update event: ${this.preparationTimeLeft}s`);
      
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
    const baseGameState = {
      matchId: this.matchId,
      currentFloor: this.currentFloor,
      phase: this.phase,
      preparationTimeLeft: this.preparationTimeLeft,
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        gold: p.gold,
        units: p.units,
        isReady: p.isReady,
        upgradeCards: p.upgradeCards,
        hasSelectedUpgrade: p.hasSelectedUpgrade,
        color: p.color
      })),
      enemyUnits: this.enemyUnits,
      grid: this.grid,
      // Keep legacy upgradeCards for backward compatibility
      upgradeCards: this.upgradeCards || [],
      winner: this.phase === 'game-over' ? (this.currentFloor > GAME_CONFIG.MAX_FLOORS ? 'players' : 'enemies') : null
    };
    
    console.log(`📺 broadcastGameState() called - Phase: ${this.phase}, Players: ${this.players.size}`);
    
    // Send personalized game state to each player with their own available units
    this.players.forEach(player => {
      const personalizedGameState = {
        ...baseGameState,
        shopUnits: player.availableUnits || this.shopUnits // Use personal units if available, fallback to global
      };
      
      console.log(`📤 Sending game-state to ${player.name} (${player.id}): Phase=${this.phase}, UpgradeCards=${player.upgradeCards?.length || 0}`);
      player.socket.emit('game-state', personalizedGameState);
    });
    
    console.log(`✅ broadcastGameState() complete`);
  }

  sendError(socket, message) {
    socket.emit('error', message);
  }

  isEmpty() {
    return this.players.size === 0;
  }

  handlePlayerHover(playerId, position) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    // Only send hover updates during preparation phase
    if (this.phase !== 'preparation') return;
    
    // Broadcast this player's hover position to all other players in the match
    for (const [otherPlayerId, otherPlayer] of this.players) {
      if (otherPlayerId !== playerId) {
        otherPlayer.socket.emit('player-hover', playerId, player.name, position, player.color);
      }
    }
  }
}

module.exports = Match;