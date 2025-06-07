import * as Phaser from 'phaser';
import { GameState, Unit, GridCell, Position, UnitStats, Player } from '../../types/game';
import Grid from '../objects/Grid';
import UnitSprite from '../objects/UnitSprite';
import { Projectile, ProjectileConfig } from '../objects/Projectile';
import UnitTooltip from '../objects/UnitTooltip';

export default class MainScene extends Phaser.Scene {
  public grid!: Grid;
  private unitSprites: Map<string, UnitSprite> = new Map();
  private gameState: GameState | null = null;
  private backgroundMusic: Phaser.Sound.BaseSound | null = null;
  private selectedUnit: UnitSprite | null = null;
  private isDragging: boolean = false;
  private placementMode: boolean = false;
  private placementUnit: UnitStats | null = null;
  private placedUnit: Unit | null = null;
  private placementGhost: Phaser.GameObjects.Sprite | null = null;
  private projectiles: Projectile[] = [];
  private lastAttackTime: Map<string, number> = new Map();
  private tooltip: UnitTooltip | null = null;
  private currentPlayerId: string | null = null;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Set background based on floor
    this.updateBackground();
    
    // Create grid - 20 columns x 8 rows
    const gridWidth = 20;
    const gridHeight = 8;
    const cellSize = Math.min(
      (this.cameras.main.width * 0.9) / gridWidth,
      (this.cameras.main.height * 0.7) / gridHeight
    );
    
    this.grid = new Grid(
      this,
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      gridWidth,
      gridHeight,
      cellSize
    );

    // Create tooltip
    this.tooltip = new UnitTooltip(this);

    // Get current player ID from the game context
    if ((window as any).gameContext) {
      const player = (window as any).gameContext.player;
      if (player) {
        this.currentPlayerId = player.id;
      }
    }

    // Setup input
    this.setupInput();
    
    // Start background music
    this.playBackgroundMusic();
  }

  private setupInput() {
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointercancel', this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.gameState) return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Handle placement mode
    if (this.placementMode && this.gameState.phase === 'preparation') {
      const gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
      
      if (this.grid.isValidPlacement(gridPos.x, gridPos.y, this.currentPlayerId || undefined)) {
        if (this.placedUnit) {
          // Place an already purchased unit
          this.events.emit('place-unit', this.placedUnit.id, gridPos);
        } else if (this.placementUnit) {
          // Purchase and place a new unit
          // First purchase the unit
          if ((window as any).purchaseUnit) {
            (window as any).purchaseUnit(this.placementUnit.name);
          }
          // The server will respond with the purchased unit, which will trigger placement
          // Store the position for when the unit is purchased
          (window as any).pendingPlacement = gridPos;
        }
        this.exitPlacementMode();
        
        // Play purchase sound
        if (this.sound.get('purchase')) {
          this.sound.play('purchase', { volume: 0.5 });
        }
      }
      return;
    }
    
    // Check if clicking on a unit
    let clickedUnit: Unit | null = null;
    let clickedSprite: UnitSprite | null = null;
    
    for (const [id, sprite] of this.unitSprites) {
      const bounds = sprite.getBounds();
      if (bounds.contains(worldPoint.x, worldPoint.y)) {
        // Find the unit
        clickedUnit = this.gameState.players
          .flatMap(p => p.units)
          .find(u => u.id === id) || 
          this.gameState.enemyUnits.find(u => u.id === id) || null;
        
        clickedSprite = sprite;
        break;
      }
    }
    
    if (clickedUnit) {
      // Show tooltip on click
      if (this.tooltip) {
        const owner = this.gameState.players.find(p => 
          p.units.some(u => u.id === clickedUnit!.id)
        );
        const ownerName = owner ? owner.name : 'Enemy';
        this.tooltip.showForUnit(clickedUnit, ownerName, worldPoint.x, worldPoint.y);
        
        // Hide tooltip after 3 seconds
        this.time.delayedCall(3000, () => {
          if (this.tooltip) {
            this.tooltip.hide();
          }
        });
      }
      
      // Only allow dragging own units during preparation phase
      if (this.gameState.phase === 'preparation' && 
          clickedUnit.playerId === this.currentPlayerId &&
          clickedSprite) {
        this.selectedUnit = clickedSprite;
        this.isDragging = true;
        clickedSprite.setScale(1.1); // Visual feedback
      }
    } else {
      // Hide tooltip when clicking empty space
      if (this.tooltip) {
        this.tooltip.hide();
      }
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);

    // Broadcast hover position
    this.events.emit('hover-cell', gridPos);
    
    // Handle placement mode
    if (this.placementMode && this.placementGhost) {
      const worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
      this.placementGhost.setPosition(worldPos.x, worldPos.y);
      
      // Update ghost alpha based on validity
      if (this.grid.isValidPlacement(gridPos.x, gridPos.y, this.currentPlayerId || undefined)) {
        this.placementGhost.setAlpha(0.8);
      } else {
        this.placementGhost.setAlpha(0.3);
      }
      
      this.grid.highlightCell(gridPos.x, gridPos.y, this.currentPlayerId || undefined);
      return;
    }
    
    // Handle unit dragging
    if (this.isDragging && this.selectedUnit) {
      this.selectedUnit.setPosition(worldPoint.x, worldPoint.y);
      
      // Highlight grid cell under pointer
      this.grid.highlightCell(gridPos.x, gridPos.y, this.currentPlayerId || undefined);
      return;
    }
    
    // Handle tooltip on hover (only when not dragging)
    if (!this.isDragging) {
      this.handleTooltipHover(worldPoint);
    }
  }

  private handleTooltipHover(worldPoint: Phaser.Math.Vector2) {
    if (!this.gameState || !this.tooltip) return;
    
    // Check if hovering over a unit
    for (const [id, sprite] of this.unitSprites) {
      const bounds = sprite.getBounds();
      if (bounds.contains(worldPoint.x, worldPoint.y)) {
        // Find the unit
        const hoveredUnit = this.gameState.players
          .flatMap(p => p.units)
          .find(u => u.id === id) || 
          this.gameState.enemyUnits.find(u => u.id === id) || null;
        
        if (hoveredUnit) {
          const owner = this.gameState.players.find(p => 
            p.units.some(u => u.id === hoveredUnit.id)
          );
          const ownerName = owner ? owner.name : 'Enemy';
          this.tooltip.showForUnit(hoveredUnit, ownerName, worldPoint.x, worldPoint.y);
        }
        return;
      }
    }
    
    // If not hovering over any unit, hide tooltip
    this.tooltip.hide();
  }


  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging || !this.selectedUnit || !this.gameState) {
      this.isDragging = false;
      this.selectedUnit = null;
      return;
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
    
    // Check if valid placement
    if (this.grid.isValidPlacement(gridPos.x, gridPos.y, this.currentPlayerId || undefined)) {
      // Emit placement event
      this.events.emit('place-unit', this.selectedUnit.unitId, gridPos);
      
      // Snap to grid
      const worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
      this.selectedUnit.setPosition(worldPos.x, worldPos.y);
    } else {
      // Return to original position
      const unit = this.gameState.players
        .flatMap(p => p.units)
        .find(u => u.id === this.selectedUnit!.unitId);
      
      if (unit && unit.position) {
        const worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
        this.selectedUnit.setPosition(worldPos.x, worldPos.y);
      }
    }

    this.selectedUnit.setScale(1); // Reset scale
    this.selectedUnit = null;
    this.isDragging = false;
    this.grid.clearHighlight();
  }

  updateGameState(gameState: GameState) {
    this.gameState = gameState;
    
    // Update current player ID if not set
    if (!this.currentPlayerId && (window as any).gameContext?.player) {
      this.currentPlayerId = (window as any).gameContext.player.id;
    }
    
    // Update background if floor changed
    this.updateBackground();
    
    // Update grid state
    this.grid.updateGrid(gameState.grid);
    
    // Update units
    this.updateUnits();
    
    // Handle phase changes
    if (gameState.phase === 'combat') {
      this.startCombat();
    } else if (gameState.phase === 'preparation' || gameState.phase === 'post-combat') {
      this.stopCombat();
    }

    this.playBackgroundMusic();
  }

  private updateBackground() {
    if (!this.gameState) return;
    
    const floor = this.gameState.currentFloor;
    let backgroundKey = 'battle1';
    
    if (floor <= 3) backgroundKey = 'battle1';
    else if (floor <= 6) backgroundKey = 'battle2';
    else if (floor <= 8) backgroundKey = 'battle3';
    else backgroundKey = 'battle4';
    
    // Remove existing background
    const existingBg = this.children.getByName('background');
    if (existingBg) existingBg.destroy();
    
    // Add new background
    const bg = this.add.image(0, 0, backgroundKey);
    bg.setOrigin(0, 0);
    bg.setName('background');
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    bg.setDepth(-100);
  }

  private updateUnits() {
    if (!this.gameState) return;
    
    // Get all units (player and enemy)
    const allUnits = [
      ...this.gameState.players.flatMap(p => p.units),
      ...this.gameState.enemyUnits
    ];
    
    // Remove sprites for units that no longer exist
    for (const [id, sprite] of this.unitSprites) {
      if (!allUnits.find(u => u.id === id)) {
        sprite.destroy();
        this.unitSprites.delete(id);
      }
    }
    
    // Update or create sprites for existing units
    for (const unit of allUnits) {
      // Skip units without positions during preparation phase
      if (!unit.position) {
        continue;
      }
      
      let sprite = this.unitSprites.get(unit.id);
      
      if (!sprite) {
        // Create new sprite
        const worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
        sprite = new UnitSprite(this, worldPos.x, worldPos.y, unit);
        this.unitSprites.set(unit.id, sprite);

        // Listen for death animation completion
        sprite.on('death_animation_complete', (unitId: string) => {
          const मृतSprite = this.unitSprites.get(unitId); // "मृतSprite" means "deadSprite" in Hindi
          if (मृतSprite) {
            मृतSprite.destroy();
            this.unitSprites.delete(unitId);
          }
        });
      } else if (unit.position) {
        // Update position if unit has moved
        const worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
        if (sprite.x !== worldPos.x || sprite.y !== worldPos.y) {
          sprite.setPosition(worldPos.x, worldPos.y);
        }
      }
      
      // Update sprite state
      sprite.updateUnit(unit);
    }
  }

  private playBackgroundMusic() {
    if (!this.gameState) return;
    
    // Stop current music
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
    
    const floor = this.gameState.currentFloor;
    const phase = this.gameState.phase;
    let musicKey = '';
    
    if (phase === 'combat') {
      if (floor <= 3) musicKey = 'battletheme1';
      else if (floor <= 6) musicKey = 'battletheme2';
      else if (floor <= 8) musicKey = 'battletheme3';
      else musicKey = 'battletheme4';
    } else {
      if (floor <= 3) musicKey = 'theme1';
      else if (floor <= 6) musicKey = 'theme2';
      else if (floor <= 8) musicKey = 'theme3';
      else musicKey = 'theme4';
    }
    
    this.backgroundMusic = this.sound.add(musicKey, {
      loop: true,
      volume: 0.3
    });
    this.backgroundMusic.play();
  }

  private startCombat() {
    // Disable unit dragging
    this.input.enabled = false;
    
    // Hide grid during combat
    this.grid.setGridVisible(false);
    
    // Start combat animations and AI
    for (const [id, sprite] of this.unitSprites) {
      sprite.startCombat();
    }
  }

  private stopCombat() {
    // Re-enable unit dragging
    this.input.enabled = true;
    
    // Show grid again during preparation
    this.grid.setGridVisible(true);
    
    // Stop combat animations
    for (const [id, sprite] of this.unitSprites) {
      sprite.stopCombat();
    }
    
    // Clear any remaining projectiles
    for (const projectile of this.projectiles) {
      projectile.destroy();
    }
    this.projectiles = [];
  }

  update(time: number, delta: number) {
    // Update unit sprites
    for (const [id, sprite] of this.unitSprites) {
      sprite.update(time, delta);
    }
    
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      if (projectile.active) {
        projectile.update(time, delta);
      } else {
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateCombatUnits(playerUnits: Unit[], enemyUnits: Unit[]) {
    const allUnits = [...playerUnits, ...enemyUnits];
    
    // Update existing units with new combat data
    for (const unit of allUnits) {
      const sprite = this.unitSprites.get(unit.id);
      if (sprite) {
        // Update position with smooth interpolation
        const worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
        
        // Calculate distance for dynamic duration
        const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, worldPos.x, worldPos.y);
        const duration = Math.min(500, Math.max(200, distance * 2)); // 200-500ms based on distance
        
        // Smooth movement to new position
        this.tweens.add({
          targets: sprite,
          x: worldPos.x,
          y: worldPos.y,
          duration: duration,
          ease: 'Power2.InOut'
        });
        
        // Check if unit just started attacking (for projectile creation)
        const oldUnit = sprite.unit;
        const justStartedAttacking = oldUnit.status !== 'attacking' && unit.status === 'attacking';
        
        // Debug logging
        if (unit.status === 'attacking' && this.isRangedUnit(unit)) {
          console.log(`${unit.name} is attacking, old status: ${oldUnit.status}, new status: ${unit.status}`);
        }
        
        // Update unit data (health, status, etc.)
        sprite.updateUnit(unit);
        
        // Create projectile for ranged attackers
        if (justStartedAttacking && this.isRangedUnit(unit)) {
          // Check cooldown to avoid duplicate projectiles
          const lastAttack = this.lastAttackTime.get(unit.id) || 0;
          const now = this.time.now;
          
          if (now - lastAttack > 500) { // 500ms cooldown between projectiles
            this.createProjectileForAttack(unit, allUnits);
            this.lastAttackTime.set(unit.id, now);
          }
        }
      }
    }
    
    // Remove sprites for units that are no longer in the state (e.g. sold)
    // Dead units' sprites are removed by the 'death_animation_complete' event.
    for (const [id, sprite] of this.unitSprites) {
      const unitIsStillInState = allUnits.find(u => u.id === id);
      if (!unitIsStillInState) {
        // Unit is gone for reasons other than ongoing death animation (e.g., sold during prep, or some other removal logic)
        // Or if it's a unit that was part of a previous state but not in `allUnits` from combat update.
        sprite.destroy();
        this.unitSprites.delete(id);
      }
      // If unitIsStillInState and is dead, its sprite.updateUnit() call from the previous loop
      // would have started the death animation. The event listener will handle its removal.
    }
  }

  shutdown() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop();
    }
    
    for (const [id, sprite] of this.unitSprites) {
      sprite.destroy();
    }
    this.unitSprites.clear();
  }

  enterPlacementMode(unit: UnitStats) {
    if (this.gameState?.phase !== 'preparation') return;
    
    this.placementMode = true;
    this.placementUnit = unit;
    
    // Create ghost sprite
    const textureKey = unit.name.toLowerCase();
    if (this.textures.exists(textureKey)) {
      const frameNames = this.textures.get(textureKey).getFrameNames();
      if (frameNames.length > 0) {
        this.placementGhost = this.add.sprite(0, 0, textureKey, frameNames[0]);
      } else {
        this.placementGhost = this.add.sprite(0, 0, textureKey);
      }
    } else {
      // Create a placeholder if texture is missing
      this.placementGhost = this.add.sprite(0, 0, '__DEFAULT');
    }
    
    this.placementGhost.setScale(0.8);
    this.placementGhost.setAlpha(0.6);
    this.placementGhost.setTint(0x00ff00);
    this.placementGhost.setDepth(1000);
    
    // Disable normal unit dragging
    this.input.enabled = true;
    
    // Add escape key to cancel
    this.input.keyboard?.once('keydown-ESC', () => {
      this.exitPlacementMode();
    });
  }

  exitPlacementMode() {
    this.placementMode = false;
    this.placementUnit = null;
    this.placedUnit = null;
    
    if (this.placementGhost) {
      this.placementGhost.destroy();
      this.placementGhost = null;
    }
    
    this.grid.clearHighlight();
  }

  enterPlacementModeForUnit(unit: Unit) {
    if (this.gameState?.phase !== 'preparation') return;
    
    this.placementMode = true;
    this.placementUnit = null; // We're placing an already purchased unit
    this.placedUnit = unit; // Store the unit to place
    
    // Create ghost sprite
    const textureKey = unit.name.toLowerCase();
    if (this.textures.exists(textureKey)) {
      const frameNames = this.textures.get(textureKey).getFrameNames();
      if (frameNames.length > 0) {
        this.placementGhost = this.add.sprite(0, 0, textureKey, frameNames[0]);
      } else {
        this.placementGhost = this.add.sprite(0, 0, textureKey);
      }
    } else {
      // Create a placeholder if texture is missing
      this.placementGhost = this.add.sprite(0, 0, '__DEFAULT');
    }
    
    this.placementGhost.setScale(0.8);
    this.placementGhost.setAlpha(0.6);
    this.placementGhost.setTint(0x00ff00);
    this.placementGhost.setDepth(1000);
    
    // Add escape key to cancel
    this.input.keyboard?.once('keydown-ESC', () => {
      this.exitPlacementMode();
    });
  }
  
  private isRangedUnit(unit: Unit): boolean {
    const rangedUnitTypes = ['wizard', 'priest', 'druidess', 'storms'];
    const isRanged = rangedUnitTypes.includes(unit.name.toLowerCase());
    console.log(`Checking if ${unit.name} is ranged: ${isRanged}`);
    return isRanged;
  }
  
  private createProjectileForAttack(attacker: Unit, allUnits: Unit[]) {
    // Find the closest enemy unit as the target
    const isPlayerUnit = this.gameState?.players.some(p => 
      p.units.some(u => u.id === attacker.id)
    ) || false;
    
    const enemies = allUnits.filter(u => {
      const isEnemy = isPlayerUnit ? 
        this.gameState?.enemyUnits.some(e => e.id === u.id) :
        this.gameState?.players.some(p => p.units.some(pu => pu.id === u.id));
      return isEnemy && u.status !== 'dead';
    });
    
    if (enemies.length === 0) return;
    
    // Find closest enemy
    let closestEnemy: Unit | null = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      const distance = Math.abs(enemy.position.x - attacker.position.x) + 
                      Math.abs(enemy.position.y - attacker.position.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    
    if (!closestEnemy) return;
    
    console.log(`Creating projectile: ${attacker.name} attacking ${closestEnemy.name}`);
    
    // Get world positions
    const startPos = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
    const targetPos = this.grid.gridToWorld(closestEnemy.position.x, closestEnemy.position.y);
    
    // Determine projectile texture based on unit type
    let textureKey = attacker.name.toLowerCase();
    let projectileScale = 0.6;
    
    if (attacker.name.toLowerCase() === 'priest') {
      // For priest, we'll create a generic holy projectile effect
      // Since priest doesn't have projectile frames, we'll use a particle effect
      this.createHolyProjectileEffect(startPos.x, startPos.y, targetPos.x, targetPos.y);
      return;
    }
    
    // For wizard, make sure we use the first magic arrow frame
    let initialFrame = undefined;
    if (attacker.name.toLowerCase() === 'wizard') {
      initialFrame = 'Magic_arrow_1 #6.png';
    }
    
    // Create projectile
    const projectile = new Projectile(this, {
      startX: startPos.x,
      startY: startPos.y - 20, // Start from unit's upper body
      targetX: targetPos.x,
      targetY: targetPos.y - 20,
      texture: textureKey,
      frame: initialFrame,
      speed: 600,
      scale: projectileScale
    });
    
    this.projectiles.push(projectile);
  }
  
  private createHolyProjectileEffect(startX: number, startY: number, targetX: number, targetY: number) {
    // Create a simple holy light effect for priest attacks
    const light = this.add.circle(startX, startY - 20, 8, 0xffff88, 1);
    light.setDepth(startY + 100);
    
    // Add glow effect
    const glow = this.add.circle(startX, startY - 20, 12, 0xffff88, 0.3);
    glow.setDepth(startY + 99);
    
    // Animate to target
    const duration = 400;
    
    this.tweens.add({
      targets: [light, glow],
      x: targetX,
      y: targetY - 20,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        // Create impact effect
        const impact = this.add.circle(targetX, targetY - 20, 20, 0xffff88, 0.5);
        impact.setDepth(targetY + 101);

        this.tweens.add({
          targets: impact,
          scale: 2,
          alpha: 0,
          duration: 200,
          onComplete: () => {
            impact.destroy();
          }
        });

        light.destroy();
        glow.destroy();
      }
    });
  }

  showRemoteHover(playerId: string, position: Position) {
    if (!this.grid) return;
    const color = this.getPlayerColor(playerId);
    this.grid.highlightCellForPlayer(playerId, position.x, position.y, color);
  }

  private getPlayerColor(playerId: string): number {
    if (!this.gameState) return 0xffffff;
    const idx = this.gameState.players.findIndex(p => p.id === playerId);
    const colors = [0x2196F3, 0xFF9800, 0x9C27B0, 0xE91E63];
    const color = colors[idx % colors.length] || 0x2196F3;
    return color;
  }
}