const GAME_CONFIG = {
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 4,
  STARTING_GOLD: 50,
  MAX_FLOORS: 10,
  GRID_WIDTH: 20,
  GRID_HEIGHT: 8,
  REROLL_COST: 10,
  SELL_REFUND_RATE: 0.75,
  KILL_BOUNTY_RATE: 0.25,
  AI_BUDGET_MULTIPLIER: 0.6,
  FLOOR_BASE_BUDGET: 25,
  PREPARATION_TIME: 60, // 60 seconds for preparation phase
};

const UNIT_STATS = {
  knight: {
    name: 'Knight',
    cost: 20,
    damage: 2,
    attackSpeed: 1.00,
    attackType: 'Physical',
    health: 38, // Reduced by another 50% for much faster combat
    range: 8, // Increased from 3 to 8 to prevent collision circling
    priority: 1,
    movementSpeed: 48, // Increased by 25% from 38
    armorType: 'Heavy',
    innatePassive: 'Gains ×2 effectiveness from heals'
  },
  priest: {
    name: 'Priest',
    cost: 12,
    damage: 1,
    attackSpeed: 0.5, // 0.5 attacks per second = heals every 2 seconds
    attackType: 'Magical',
    health: 20, // Reduced by another 50% for much faster combat
    range: 10, // Slightly higher than knight's 8, but much lower than 50
    priority: 4,
    movementSpeed: 38, // Increased by 25% from 30
    armorType: 'Unarmored',
    innatePassive: 'Heals friendly units instead of attacking enemies'
  },
  bishop: {
    name: 'Bishop',
    cost: 15,
    damage: 2,
    attackSpeed: 1.00,
    attackType: 'Magical',
    health: 30, // Reduced by another 50% for much faster combat
    range: 40,
    priority: 3,
    movementSpeed: 38, // Reduced by 50% for slower tactical movement
    armorType: 'Unarmored',
    innatePassive: 'Heals a nearby damaged friendly Unit for 1 HP every 2 seconds'
  },
  fighter: {
    name: 'Fighter',
    cost: 10,
    damage: 3,
    attackSpeed: 1.00,
    attackType: 'Physical',
    health: 30, // Reduced by another 50% for much faster combat
    range: 8, // Increased from 3 to 8 to prevent collision circling
    priority: 3,
    movementSpeed: 50, // Increased by 25% from 40
    armorType: 'Light',
    innatePassive: null
  },
  goblin: {
    name: 'Goblin',
    cost: 7,
    damage: 3,
    attackSpeed: 1.00,
    attackType: 'Physical',
    health: 20, // Reduced by another 50% for much faster combat
    range: 8, // Increased from 3 to 8 to prevent collision circling
    priority: 3,
    movementSpeed: 44, // Increased by 25% from 35
    armorType: 'Unarmored',
    innatePassive: null
  },
  wizard: {
    name: 'Wizard',
    cost: 12,
    damage: 4,
    attackSpeed: 0.25, // Significantly reduced: 1 attack every 4 seconds instead of every second
    attackType: 'Magical',
    health: 18, // Reduced by another 50% for much faster combat
    range: 50,
    priority: 3,
    movementSpeed: 38, // Increased by 25% from 30
    armorType: 'Unarmored',
    innatePassive: null
  },
  gladiator: {
    name: 'Gladiator',
    cost: 12,
    damage: 3,
    attackSpeed: 1.00,
    attackType: 'Physical',
    health: 25, // Reduced by another 50% for much faster combat
    range: 8, // Increased from 3 to 8 to prevent collision circling
    priority: 2,
    movementSpeed: 38, // Increased by 25% from 30
    armorType: 'Heavy',
    innatePassive: 'Units damaged by this Unit grant +10% extra gold (stacks once per Gladiator)'
  },
  'red dragon': {
    name: 'Red Dragon',
    cost: 25,
    damage: 4,
    attackSpeed: 0.25, // Slowed by 200% (3x slower) from 0.75
    attackType: 'Physical', // Changed to Physical for melee
    health: 45,
    range: 9, // Reduced by 75% from 35
    priority: 1,
    movementSpeed: 42,
    armorType: 'Heavy',
    innatePassive: 'Starts flying and untargetable. Uses 3 special attacks, then lands and becomes targetable with normal abilities'
  }
};

const UPGRADE_TEMPLATES = [
  {
    name: 'Vampiric Strike',
    description: '10% Damage dealt is restored as health',
    effect: 'lifesteal',
    value: 0.1
  },
  {
    name: 'Swift Boots',
    description: '20% Increased Movement Speed',
    effect: 'movementSpeed',
    value: 0.2
  },
  {
    name: 'Vitality Boost',
    description: '10% Increased Health',
    effect: 'health',
    value: 0.1
  },
  {
    name: 'Power Surge',
    description: '10% Increased Damage',
    effect: 'damage',
    value: 0.1
  },
  {
    name: 'Rapid Strikes',
    description: '10% Increased Attack Speed',
    effect: 'attackSpeed',
    value: 0.1
  },
  {
    name: 'Evasive Maneuvers',
    description: '+1 Priority (less likely to be targeted)',
    effect: 'priority',
    value: 1
  },
  {
    name: 'Taunt',
    description: '-1 Priority (more likely to be targeted)',
    effect: 'priority',
    value: -1
  },
  {
    name: 'Final Gift',
    description: 'Heal nearby Units for 25% of max health on death',
    effect: 'deathHeal',
    value: 0.25
  },
  {
    name: 'Explosive End',
    description: 'Explode on death, dealing 20% of max health as damage',
    effect: 'deathExplosion',
    value: 0.2
  },
  {
    name: 'Poison Blade',
    description: 'Poison damaged enemies, causing 1 HP/sec',
    effect: 'poison',
    value: 1
  },
  {
    name: 'Slowing Aura',
    description: 'Slow nearby enemies, decreasing attack speed by 10%',
    effect: 'slowAura',
    value: 0.1
  }
];

const ARMOR_DAMAGE_MODIFIERS = {
  Unarmored: {
    Physical: 1.5,
    Magical: 1.0
  },
  Light: {
    Physical: 1.0,
    Magical: 1.0
  },
  Heavy: {
    Physical: 0.5,
    Magical: 1.5
  }
};

module.exports = {
  GAME_CONFIG,
  UNIT_STATS,
  UPGRADE_TEMPLATES,
  ARMOR_DAMAGE_MODIFIERS
};