import * as Phaser from 'phaser';
import { GameState, Unit, GridCell, Position, UnitStats } from '../../types/game';
import Grid from '../objects/Grid';
import UnitSprite from '../objects/UnitSprite';

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

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Set background based on floor
    this.updateBackground();
    
    // Create grid - 20 columns x 10 rows
    const gridWidth = 20;
    const gridHeight = 10;
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
    if (!this.gameState || this.gameState.phase !== 'preparation') return;

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    
    // Handle placement mode
    if (this.placementMode) {
      const gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
      
      if (this.grid.isValidPlacement(gridPos.x, gridPos.y)) {
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
    for (const [id, sprite] of this.unitSprites) {
      const bounds = sprite.getBounds();
      if (bounds.contains(worldPoint.x, worldPoint.y)) {
        // Only allow dragging player units during preparation phase
        const unit = this.gameState.players
          .flatMap(p => p.units)
          .find(u => u.id === id);
        
        if (unit) {
          this.selectedUnit = sprite;
          this.isDragging = true;
          sprite.setScale(1.1); // Visual feedback
          break;
        }
      }
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
    
    // Handle placement mode
    if (this.placementMode && this.placementGhost) {
      const worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
      this.placementGhost.setPosition(worldPos.x, worldPos.y);
      
      // Update ghost alpha based on validity
      if (this.grid.isValidPlacement(gridPos.x, gridPos.y)) {
        this.placementGhost.setAlpha(0.8);
      } else {
        this.placementGhost.setAlpha(0.3);
      }
      
      this.grid.highlightCell(gridPos.x, gridPos.y);
      return;
    }
    
    // Handle unit dragging
    if (!this.isDragging || !this.selectedUnit) return;

    this.selectedUnit.setPosition(worldPoint.x, worldPoint.y);
    
    // Highlight grid cell under pointer
    this.grid.highlightCell(gridPos.x, gridPos.y);
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
    if (this.grid.isValidPlacement(gridPos.x, gridPos.y)) {
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
      
      if (unit) {
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
    
    // Update background if floor changed
    this.updateBackground();
    
    // Update grid state
    this.grid.updateGrid(gameState.grid);
    
    // Update units
    this.updateUnits();
    
    // Handle phase changes
    if (gameState.phase === 'combat') {
      this.startCombat();
    } else if (gameState.phase === 'preparation') {
      this.stopCombat();
    }
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
  }

  update(time: number, delta: number) {
    // Update unit sprites
    for (const [id, sprite] of this.unitSprites) {
      sprite.update(time, delta);
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
        
        // Smooth movement to new position
        this.tweens.add({
          targets: sprite,
          x: worldPos.x,
          y: worldPos.y,
          duration: 200,
          ease: 'Power2'
        });
        
        // Update unit data (health, status, etc.)
        sprite.updateUnit(unit);
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
}