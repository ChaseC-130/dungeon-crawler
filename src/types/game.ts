export type AttackType = 'Physical' | 'Magical';
export type ArmorType = 'Unarmored' | 'Light' | 'Heavy';
export type UnitStatus = 'idle' | 'moving' | 'attacking' | 'dead';

export interface Position {
  x: number;
  y: number;
}

export interface GridCell {
  x: number;
  y: number;
  occupied: boolean;
  unitId?: string;
  playerId?: string;
}

export interface UnitStats {
  name: string;
  cost: number;
  damage: number;
  attackSpeed: number;
  attackType: AttackType;
  health: number;
  maxHealth: number;
  range: number;
  priority: number;
  movementSpeed: number;
  armorType: ArmorType;
  innatePassive?: string;
}

export interface Unit extends UnitStats {
  id: string;
  playerId: string;
  position: Position;
  status: UnitStatus;
  targetId?: string;
  attackCooldown: number;
  buffs: Buff[];
  debuffs: Debuff[];
}

export interface Buff {
  id: string;
  type: string;
  value: number;
  duration?: number;
}

export interface Debuff {
  id: string;
  type: string;
  value: number;
  duration?: number;
}

export interface UpgradeCard {
  id: string;
  name: string;
  description: string;
  effect: string;
  value: number;
  targetUnitType?: string;
  isHighPotency: boolean;
}

export interface Player {
  id: string;
  name: string;
  gold: number;
  units: Unit[];
  isReady: boolean;
}

export interface GameState {
  matchId: string;
  currentFloor: number;
  phase: 'preparation' | 'combat' | 'post-combat' | 'game-over';
  players: Player[];
  enemyUnits: Unit[];
  grid: GridCell[][];
  shopUnits: UnitStats[];
  upgradeCards: UpgradeCard[];
  winner?: 'players' | 'enemies';
}

export interface SocketEvents {
  // Client -> Server
  'join-match': (playerId: string, playerName: string) => void;
  'place-unit': (unitId: string, position: Position) => void;
  'purchase-unit': (unitType: string) => void;
  'sell-unit': (unitId: string) => void;
  'reroll-shop': () => void;
  'select-upgrade': (upgradeId: string, targetUnitType?: string) => void;
  'player-ready': () => void;

  // Server -> Client
  'game-state': (state: GameState) => void;
  'match-started': (matchId: string) => void;
  'floor-complete': (floor: number, gold: number) => void;
  'combat-update': (units: Unit[], enemyUnits: Unit[]) => void;
  'game-over': (winner: 'players' | 'enemies') => void;
  'error': (message: string) => void;
}