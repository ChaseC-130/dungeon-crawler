const { GAME_CONFIG, UNIT_STATS } = require('./constants');

class AIManager {
  constructor() {
    this.archetypeWeights = {
      knight: { aggro: 50, midrange: 30, control: 20 },
      priest: { aggro: 10, midrange: 30, control: 60 },
      bishop: { aggro: 10, midrange: 40, control: 50 },
      fighter: { aggro: 70, midrange: 20, control: 10 },
      goblin: { aggro: 80, midrange: 15, control: 5 },
      wizard: { aggro: 20, midrange: 30, control: 50 },
      gladiator: { aggro: 60, midrange: 30, control: 10 }
    };

    this.counterUnits = {
      aggro: ['priest', 'bishop', 'knight'], // Healers and tanks counter aggro
      midrange: ['fighter', 'gladiator', 'wizard'], // Balanced units
      control: ['goblin', 'fighter', 'gladiator'] // Fast units counter control
    };
  }

  spawnEnemies(floor, playerUnits) {
    // Calculate total player unit cost
    const totalPlayerCost = playerUnits.reduce((sum, unit) => sum + unit.cost, 0);
    
    // Calculate spawn budget
    const baseBudget = floor * GAME_CONFIG.FLOOR_BASE_BUDGET;
    const playerContribution = totalPlayerCost * GAME_CONFIG.AI_BUDGET_MULTIPLIER;
    let targetBudget = baseBudget + playerContribution;
    
    // Reduce spawns significantly on first floor for easier start
    if (floor === 1) {
      targetBudget = targetBudget * 0.4; // 60% reduction for first floor
    }
    
    // Add ±10% variance
    const variance = 0.1;
    const minBudget = targetBudget * (1 - variance);
    const maxBudget = targetBudget * (1 + variance);
    const spawnBudget = minBudget + Math.random() * (maxBudget - minBudget);

    // Determine dominant player archetype
    const playerArchetype = this.determinePlayerArchetype(playerUnits);
    
    // Get counter units
    const counterUnitTypes = this.counterUnits[playerArchetype];
    
    // Spawn units
    const enemyUnits = [];
    let currentBudget = 0;
    let unitId = 0;

    while (currentBudget < spawnBudget) {
      // For now, spawn only goblins
      const unitStats = UNIT_STATS.goblin;
      
      // Check if we can afford another goblin
      if (currentBudget + unitStats.cost > spawnBudget) {
        break;
      }
      
      enemyUnits.push(this.createEnemyUnit(unitStats, unitId++));
      currentBudget += unitStats.cost;
    }

    return enemyUnits;
  }

  determinePlayerArchetype(playerUnits) {
    const aggregateWeights = { aggro: 0, midrange: 0, control: 0 };
    
    playerUnits.forEach(unit => {
      const unitKey = unit.name.toLowerCase();
      const weights = this.archetypeWeights[unitKey];
      
      if (weights) {
        aggregateWeights.aggro += weights.aggro;
        aggregateWeights.midrange += weights.midrange;
        aggregateWeights.control += weights.control;
      }
    });

    // Find dominant archetype
    let dominant = 'midrange';
    let maxWeight = aggregateWeights.midrange;
    
    if (aggregateWeights.aggro > maxWeight) {
      dominant = 'aggro';
      maxWeight = aggregateWeights.aggro;
    }
    
    if (aggregateWeights.control > maxWeight) {
      dominant = 'control';
    }

    return dominant;
  }

  createEnemyUnit(unitStats, id) {
    return {
      id: `enemy-${id}`,
      playerId: 'ai',
      ...unitStats,
      maxHealth: unitStats.health,
      position: null,
      status: 'idle',
      targetId: null,
      attackCooldown: 0,
      buffs: [],
      debuffs: []
    };
  }
}

module.exports = AIManager;