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
  private projectiles: Projectile[] = [];
  private lastAttackTime: Map<string, number> = new Map();
  private tooltip: UnitTooltip | null = null;
  private currentPlayerId: string | null = null;
  private dragPreview: Phaser.GameObjects.Container | null = null;
  private sellZone: Phaser.GameObjects.Container | null = null;
  private isOverSellZone: boolean = false;
  private draggedUnit: Unit | null = null;
  private dragInstruction: Phaser.GameObjects.Container | null = null;
  private originalDragPosition: Phaser.Math.Vector2 | null = null;
  private dragShadow: Phaser.GameObjects.Ellipse | null = null;

  constructor() {
    super({ key: 'MainScene' });
  }

  create() {
    // Initialize all state variables to prevent random highlighting
    this.isDragging = false;
    this.placementMode = false;
    this.placementUnit = null;
    this.placedUnit = null;
    this.selectedUnit = null;
    this.dragPreview = null;
    
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

    // Ensure highlight starts cleared and placement mode is disabled
    this.grid.clearHighlight();
    this.grid.clearAllPlayerHovers();
    this.placementMode = false;
    this.placementUnit = null;
    this.placedUnit = null;
    this.isDragging = false;
    this.selectedUnit = null;

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
    this.input.on('pointercancel', this.cancelDrag, this);
    
    // Add keyboard support for canceling drag
    this.input.keyboard?.on('keydown-ESC', this.cancelDrag, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (!this.gameState) return;

    // Check for right-click to cancel drag
    if (pointer.rightButtonDown() && this.isDragging) {
      this.cancelDrag();
      return;
    }

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
    
    // Check if clicking on a unit using Phaser's built-in system
    let clickedUnit: Unit | null = null;
    let clickedSprite: UnitSprite | null = null;
    
    // Get all interactive objects under the pointer
    const hitObjects = this.input.hitTestPointer(pointer);
    
    // Also check unit sprites directly
    for (const [id, sprite] of this.unitSprites) {
      if (sprite && sprite.active && !sprite.getData('destroying')) {
        const bounds = sprite.getBounds();
        if (bounds.contains(worldPoint.x, worldPoint.y)) {
          clickedSprite = sprite;
          clickedUnit = this.gameState.players
            .flatMap(p => p.units)
            .find(u => u.id === sprite.unitId) || 
            this.gameState.enemyUnits.find(u => u.id === sprite.unitId) || null;
          console.log(`Clicked on unit via bounds check: ${sprite.unitId}`);
          break;
        }
      }
    }
    
    // Fallback to hit test if bounds check didn't find anything
    if (!clickedSprite) {
      for (const obj of hitObjects) {
        // Check if this is a UnitSprite instance
        if (obj instanceof UnitSprite) {
          const unitSprite = obj;
          // Find the unit data for this sprite
          clickedUnit = this.gameState.players
            .flatMap(p => p.units)
            .find(u => u.id === unitSprite.unitId) || 
            this.gameState.enemyUnits.find(u => u.id === unitSprite.unitId) || null;
          
          clickedSprite = unitSprite;
          console.log(`Clicked on unit via instanceof: ${unitSprite.unitId}`);
          break;
        }
      }
    }
    
    if (clickedUnit) {
      // Show tooltip on click
      if (this.tooltip && clickedUnit.position) {
        const owner = this.gameState.players.find(p => 
          p.units.some(u => u.id === clickedUnit!.id)
        );
        const ownerName = owner ? owner.name : 'Enemy';
        
        // Position tooltip at the unit's grid cell center, not mouse cursor
        const unitWorldPos = this.grid.gridToWorld(clickedUnit.position.x, clickedUnit.position.y);
        this.tooltip.showForUnit(clickedUnit, ownerName, unitWorldPos.x, unitWorldPos.y);
        
        // Hide tooltip after 3 seconds
        this.time.delayedCall(3000, () => {
          // Check if scene is still active before accessing tooltip
          if (this.scene && this.tooltip) {
            this.tooltip.hide();
          }
        });
      }
      
      // Only allow dragging own units during preparation phase
      console.log(`Drag check - Phase: ${this.gameState.phase}, Unit Player: ${clickedUnit.playerId}, Current Player: ${this.currentPlayerId}, Has Sprite: ${!!clickedSprite}`);
      
      if (this.gameState.phase === 'preparation' && 
          clickedUnit.playerId === this.currentPlayerId &&
          clickedSprite) {
        this.selectedUnit = clickedSprite;
        this.isDragging = true;
        this.draggedUnit = clickedUnit;
        
        // Store original position for potential snap-back
        this.originalDragPosition = clickedSprite.position.clone();
        
        // Lift the unit sprite above everything else
        clickedSprite.setDepth(2000);
        
        // Add enhanced visual effects to show it's being picked up
        if ((clickedSprite as any).pickup) {
          (clickedSprite as any).pickup();
        }
        
        // Add a pulsing glow effect around the unit
        const glowEffect = this.add.circle(clickedSprite.x, clickedSprite.y, 40, 0xffffff, 0.3);
        glowEffect.setDepth(1999); // Just below the unit
        clickedSprite.setData('glowEffect', glowEffect);
        
        this.tweens.add({
          targets: glowEffect,
          scaleX: 1.3,
          scaleY: 1.3,
          alpha: 0.1,
          duration: 800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Add a shadow beneath the unit
        this.createDragShadow(clickedSprite);
        
        // Show sell zone when dragging a unit
        this.showSellZone();
        
        // Show helpful instruction
        this.showDragInstruction();
        
        console.log(`✅ DRAG STARTED: ${clickedUnit.name} (${clickedUnit.id})`);
        console.log(`Unit current position:`, clickedUnit.position);
      } else {
        console.log(`❌ Cannot drag - Phase: ${this.gameState.phase}, Player match: ${clickedUnit.playerId === this.currentPlayerId}, Has sprite: ${!!clickedSprite}`);
      }
    } else {
      // Hide tooltip when clicking empty space
      if (this.tooltip) {
        this.tooltip.hide();
      }
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    // Safety check: ensure we have a valid game state and proper phase before processing pointer moves
    if (!this.gameState || this.gameState.phase !== 'preparation') {
      this.grid.clearHighlight();
      return;
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
    
    // Don't send hover position to other players - highlighting is local only
    
    // Handle placement mode - only during preparation phase
    if (this.placementMode && this.dragPreview && this.gameState.phase === 'preparation') {
      // Update drag preview position to follow cursor
      this.dragPreview.setPosition(worldPoint.x, worldPoint.y);
      
      // Add visual feedback for valid/invalid drop zones
      const isValid = this.grid.isValidPlacement(gridPos.x, gridPos.y, this.currentPlayerId || undefined);
      this.updateDragPreviewValidation(isValid);
      
      // Grid highlighting is now disabled at the Grid level to remove green debug boxes
      this.grid.highlightCell(gridPos.x, gridPos.y, this.currentPlayerId || undefined);
      return;
    }
    
    // Handle unit dragging - only during preparation phase
    if (this.isDragging && this.selectedUnit && this.gameState.phase === 'preparation') {
      // Update unit sprite position to follow cursor with enhanced offset
      this.selectedUnit.setPosition(worldPoint.x, worldPoint.y - 25); // Higher lift for better visibility
      
      // Update glow effect position if it exists
      const glowEffect = this.selectedUnit.getData('glowEffect');
      if (glowEffect) {
        glowEffect.setPosition(worldPoint.x, worldPoint.y - 25);
      }
      
      // Update shadow position if it exists
      if (this.dragShadow) {
        this.dragShadow.setPosition(worldPoint.x, worldPoint.y + 15);
      }
      
      // Check if over sell zone
      this.checkSellZoneHover(pointer.x, pointer.y);
      
      // Grid highlighting is now disabled at the Grid level to remove green debug boxes
      this.grid.highlightCell(gridPos.x, gridPos.y, this.currentPlayerId || undefined);
      
      // Add visual feedback for valid/invalid drop zones
      const isValid = this.grid.isValidPlacement(gridPos.x, gridPos.y, this.currentPlayerId || undefined) && !this.isOverSellZone;
      
      // Change tint based on validity with enhanced visual feedback
      if (this.isOverSellZone) {
        this.selectedUnit.setTint(0xff4444); // Red tint for sell zone
        // Make glow effect red too
        if (glowEffect) {
          glowEffect.setTint(0xff4444);
        }
      } else if (isValid) {
        this.selectedUnit.clearTint(); // Clear tint for valid placement
        // Make glow effect green for valid placement
        if (glowEffect) {
          glowEffect.clearTint();
          glowEffect.setTint(0x44ff44);
        }
      } else {
        this.selectedUnit.setTint(0xffaa00); // Orange tint for invalid placement
        // Make glow effect orange too
        if (glowEffect) {
          glowEffect.setTint(0xffaa00);
        }
      }
      
      console.log(`Dragging to grid (${gridPos.x}, ${gridPos.y}), valid: ${isValid}, over sell zone: ${this.isOverSellZone}`);
      
      return;
    }
    
    // Handle tooltip on hover (only when not dragging)
    if (!this.isDragging) {
      this.handleTooltipHover(worldPoint);
    }
  }

  private handleTooltipHover(worldPoint: Phaser.Math.Vector2) {
    if (!this.gameState || !this.tooltip) return;
    
    // Check if hovering over a unit using more efficient hit testing
    const pointer = this.input.activePointer;
    const hitObjects = this.input.hitTestPointer(pointer);
    
    for (const obj of hitObjects) {
      if (obj instanceof UnitSprite) {
        // Find the unit data for this sprite
        const hoveredUnit = this.gameState.players
          .flatMap(p => p.units)
          .find(u => u.id === obj.unitId) || 
          this.gameState.enemyUnits.find(u => u.id === obj.unitId) || null;
        
        if (hoveredUnit && hoveredUnit.position) {
          const owner = this.gameState.players.find(p => 
            p.units.some(u => u.id === hoveredUnit.id)
          );
          const ownerName = owner ? owner.name : 'Enemy';
          
          // Position tooltip at the unit's grid cell center, not mouse cursor
          const unitWorldPos = this.grid.gridToWorld(hoveredUnit.position.x, hoveredUnit.position.y);
          // Show owner info for placed units (units with positions)
          this.tooltip.showForUnit(hoveredUnit, ownerName, unitWorldPos.x, unitWorldPos.y, true);
        }
        return;
      }
    }
    
    // If not hovering over any unit, hide tooltip
    this.tooltip.hide();
  }


  private onPointerUp(pointer: Phaser.Input.Pointer) {
    console.log(`🎯 POINTER UP - isDragging: ${this.isDragging}, hasUnit: ${!!this.selectedUnit}, hasState: ${!!this.gameState}`);
    
    if (!this.isDragging || !this.selectedUnit || !this.gameState) {
      this.isDragging = false;
      this.selectedUnit = null;
      this.hideSellZone();
      return;
    }

    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gridPos = this.grid.worldToGrid(worldPoint.x, worldPoint.y);
    
    // Get the unit data
    const unit = this.gameState.players
      .flatMap(p => p.units)
      .find(u => u.id === this.selectedUnit!.unitId);
    
    console.log(`🎯 Drop target: grid(${gridPos.x}, ${gridPos.y}), unit current pos:`, unit?.position);
    
    // Check if dropped in sell zone
    if (this.isOverSellZone && this.draggedUnit) {
      console.log(`💰 Selling unit ${this.draggedUnit.name} for 75% refund`);
      this.sellUnit(this.draggedUnit.id);
      // Hide the unit sprite after selling
      this.selectedUnit.setVisible(false);
    }
    // Check if valid placement
    else if (this.grid.isValidPlacement(gridPos.x, gridPos.y, this.currentPlayerId || undefined)) {
      // Check if position actually changed
      const positionChanged = !unit?.position || 
        unit.position.x !== gridPos.x || 
        unit.position.y !== gridPos.y;
      
      console.log(`🎯 Position changed: ${positionChanged}`);
      
      if (positionChanged) {
        console.log(`📤 CALLING moveUnit: ${this.selectedUnit.unitId} to (${gridPos.x}, ${gridPos.y})`);
        console.log(`📤 moveUnit function exists: ${!!(window as any).moveUnit}`);
        console.log(`📤 gameContext exists: ${!!(window as any).gameContext}`);
        
        // Use moveUnit for repositioning
        if ((window as any).moveUnit) {
          console.log(`📤 Calling (window as any).moveUnit with:`, {
            unitId: this.selectedUnit.unitId,
            position: gridPos
          });
          (window as any).moveUnit(this.selectedUnit.unitId, gridPos);
          console.log(`📤 moveUnit call completed`);
        } else {
          console.error('❌ moveUnit function not available on window');
        }
        
        // Optimistically update position while waiting for server confirmation
        const worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
        this.selectedUnit.setPosition(worldPos.x, worldPos.y);
      } else {
        // No movement needed, just snap back to current position
        const worldPos = this.grid.gridToWorld(gridPos.x, gridPos.y);
        this.selectedUnit.setPosition(worldPos.x, worldPos.y);
        console.log(`🎯 No position change needed`);
      }
    } else {
      // Invalid placement - return to original position
      if (unit && unit.position) {
        const worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
        this.selectedUnit.setPosition(worldPos.x, worldPos.y);
        console.log(`❌ Invalid placement, returning unit ${this.selectedUnit.unitId} to original position`);
      } else {
        // Unit has no position, remove it from the grid visually
        console.log(`❌ Unit ${this.selectedUnit.unitId} has no valid position, moving off grid`);
        this.selectedUnit.setPosition(-100, -100); // Move off screen
      }
    }

    // Reset visual state
    this.selectedUnit.clearTint(); // Clear any tint
    
    // Clean up glow effect
    const glowEffect = this.selectedUnit.getData('glowEffect');
    if (glowEffect) {
      this.tweens.killTweensOf(glowEffect);
      glowEffect.destroy();
      this.selectedUnit.setData('glowEffect', null);
    }
    
    // Restore original scale and position with animation
    if ((this.selectedUnit as any).drop) {
      (this.selectedUnit as any).drop();
    }
    
    // Restore original depth based on y position
    this.selectedUnit.setDepth(this.selectedUnit.y);
    
    // Destroy drag shadow
    this.destroyDragShadow();
    
    // Hide sell zone
    this.hideSellZone();
    
    // Hide drag instruction
    this.hideDragInstruction();
    
    this.selectedUnit = null;
    this.isDragging = false;
    this.draggedUnit = null;
    this.originalDragPosition = null;
    this.grid.clearHighlight();
  }

  private createDragPreview(unit: Unit, x: number, y: number) {
    // Create drag preview container
    this.dragPreview = this.add.container(x, y);
    this.dragPreview.setDepth(2000); // Very high depth to appear above everything
    
    // Create the box background
    const boxWidth = 80;
    const boxHeight = 80;
    const cornerRadius = 12;
    
    // Create box graphics
    const box = this.add.graphics();
    
    // Box shadow (slight offset for 3D effect)
    box.fillStyle(0x000000, 0.3);
    box.fillRoundedRect(-boxWidth/2 + 2, -boxHeight/2 + 2, boxWidth, boxHeight, cornerRadius);
    
    // Main box background
    box.fillStyle(0x2a2a2a, 0.95);
    box.fillRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, cornerRadius);
    
    // Golden border
    box.lineStyle(3, 0xFFD700, 1);
    box.strokeRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, cornerRadius);
    
    // Inner highlight border
    box.lineStyle(1, 0xFFFFFF, 0.3);
    box.strokeRoundedRect(-boxWidth/2 + 4, -boxHeight/2 + 4, boxWidth - 8, boxHeight - 8, cornerRadius - 2);
    
    this.dragPreview.add(box);
    
    // Create unit sprite inside the box
    const textureKey = unit.name.toLowerCase();
    let unitSprite: Phaser.GameObjects.Sprite;
    
    if (this.textures.exists(textureKey)) {
      const texture = this.textures.get(textureKey);
      const frameNames = texture.getFrameNames();
      
      // Find idle frame or use first frame
      const idleFrame = frameNames.find(frame => 
        frame.toLowerCase().includes('idle')
      ) || frameNames[0];
      
      unitSprite = this.add.sprite(0, -5, textureKey, idleFrame);
    } else {
      // Fallback sprite
      unitSprite = this.add.sprite(0, -5, '__DEFAULT');
    }
    
    unitSprite.setScale(0.6); // Slightly smaller to fit nicely in the box
    
    // Add unit name below the sprite
    const nameText = this.add.text(0, 25, unit.name, {
      fontSize: '10px',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2
    });
    nameText.setOrigin(0.5);
    
    this.dragPreview.add([unitSprite, nameText]);
    
    // Add subtle floating animation
    this.tweens.add({
      targets: this.dragPreview,
      y: this.dragPreview.y - 3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add gentle rotation
    this.tweens.add({
      targets: this.dragPreview,
      angle: { from: -2, to: 2 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private destroyDragPreview() {
    if (this.dragPreview) {
      // Stop any tweens on the drag preview
      this.tweens.killTweensOf(this.dragPreview);
      this.dragPreview.destroy();
      this.dragPreview = null;
    }
  }

  private updateDragPreviewValidation(isValid: boolean) {
    if (!this.dragPreview) return;
    
    // Get the graphics object (first child)
    const box = this.dragPreview.getAt(0) as Phaser.GameObjects.Graphics;
    if (!box) return;
    
    box.clear();
    
    const boxWidth = 80;
    const boxHeight = 80;
    const cornerRadius = 12;
    
    // Box shadow (slight offset for 3D effect)
    box.fillStyle(0x000000, 0.3);
    box.fillRoundedRect(-boxWidth/2 + 2, -boxHeight/2 + 2, boxWidth, boxHeight, cornerRadius);
    
    // Change box color based on validity
    if (isValid) {
      // Valid placement - keep golden theme
      box.fillStyle(0x2a2a2a, 0.95);
      box.fillRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, cornerRadius);
      box.lineStyle(3, 0xFFD700, 1); // Golden border
      box.strokeRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, cornerRadius);
      box.lineStyle(1, 0xFFFFFF, 0.3); // Inner highlight
      box.strokeRoundedRect(-boxWidth/2 + 4, -boxHeight/2 + 4, boxWidth - 8, boxHeight - 8, cornerRadius - 2);
    } else {
      // Invalid placement - red theme
      box.fillStyle(0x3a1a1a, 0.95); // Dark red background
      box.fillRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, cornerRadius);
      box.lineStyle(3, 0xFF4444, 1); // Red border
      box.strokeRoundedRect(-boxWidth/2, -boxHeight/2, boxWidth, boxHeight, cornerRadius);
      box.lineStyle(1, 0xFF8888, 0.3); // Light red inner highlight
      box.strokeRoundedRect(-boxWidth/2 + 4, -boxHeight/2 + 4, boxWidth - 8, boxHeight - 8, cornerRadius - 2);
    }
  }

  private cancelDrag() {
    if (!this.isDragging || !this.selectedUnit || !this.gameState) {
      return;
    }

    // Return unit to its original position
    const unit = this.gameState.players
      .flatMap(p => p.units)
      .find(u => u.id === this.selectedUnit!.unitId);
    
    if (unit && unit.position) {
      const worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
      this.selectedUnit.setPosition(worldPos.x, worldPos.y);
    }

    // Reset visual state
    this.selectedUnit.setAlpha(1);
    this.selectedUnit.clearTint();
    
    // Clean up glow effect
    const glowEffect = this.selectedUnit.getData('glowEffect');
    if (glowEffect) {
      this.tweens.killTweensOf(glowEffect);
      glowEffect.destroy();
      this.selectedUnit.setData('glowEffect', null);
    }
    
    // Restore original scale and position
    if ((this.selectedUnit as any).drop) {
      (this.selectedUnit as any).drop();
    }
    
    // Destroy drag preview
    this.destroyDragPreview();
    
    // Destroy drag shadow
    this.destroyDragShadow();
    
    // Clear drag state
    this.selectedUnit = null;
    this.isDragging = false;
    this.draggedUnit = null;
    this.grid.clearHighlight();
    
    // Hide sell zone
    this.hideSellZone();
    
    // Hide drag instruction
    this.hideDragInstruction();

    console.log('Drag operation cancelled');
  }

  updateGameState(gameState: GameState) {
    console.log(`MainScene.updateGameState called - phase: ${gameState.phase}, players: ${gameState.players.length}`);
    this.gameState = gameState;
    
    // Clear any stray highlights when game state updates
    this.grid.clearHighlight();
    
    // Update current player ID if not set
    if (!this.currentPlayerId && (window as any).gameContext?.player) {
      this.currentPlayerId = (window as any).gameContext.player.id;
    }
    
    // Handle phase changes first
    if (gameState.phase === 'combat') {
      this.startCombat();
    } else if (gameState.phase === 'preparation' || gameState.phase === 'post-combat') {
      this.stopCombat();
    }
    
    // Update background after phase change
    this.updateBackground();
    
    // Update grid state
    this.grid.updateGrid(gameState.grid);
    
    // Update units
    this.updateUnits();
  }

  private updateBackground() {
    if (!this.gameState) return;
    
    console.log('Updating background for phase:', this.gameState.phase, 'floor:', this.gameState.currentFloor);
    
    let backgroundKey = 'battle1';
    
    // During preparation or post-combat phase, use a neutral/preparation background
    if (this.gameState.phase === 'preparation' || this.gameState.phase === 'post-combat') {
      // Use a darker, more subdued version for preparation
      backgroundKey = 'battle1'; // Keep using battle1 but will add a dark overlay
      console.log('Using preparation background');
    } else {
      // During combat, use floor-based backgrounds
      const floor = this.gameState.currentFloor;
      if (floor <= 3) backgroundKey = 'battle1';
      else if (floor <= 6) backgroundKey = 'battle2';
      else if (floor <= 8) backgroundKey = 'battle3';
      else backgroundKey = 'battle4';
      console.log('Using combat background:', backgroundKey);
    }
    
    // Remove existing background elements
    const existingBg = this.children.getByName('background');
    if (existingBg) existingBg.destroy();
    const existingOverlay = this.children.getByName('phase-overlay');
    if (existingOverlay) existingOverlay.destroy();
    
    // Add new background
    const bg = this.add.image(0, 0, backgroundKey);
    bg.setOrigin(0, 0);
    bg.setName('background');
    bg.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    bg.setDepth(-100);
    
    // Add phase-specific overlay
    if (this.gameState.phase === 'preparation' || this.gameState.phase === 'post-combat') {
      // Add a blue-tinted overlay for preparation phase
      const overlay = this.add.rectangle(
        0, 0,
        this.cameras.main.width,
        this.cameras.main.height,
        0x1a1a2e,
        0.6
      );
      overlay.setOrigin(0, 0);
      overlay.setName('phase-overlay');
      overlay.setDepth(-90);
    }
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
            console.log('Death animation complete for unit', unitId, ', removing from battlefield');
            मृतSprite.setData('destroying', true); // Mark as being destroyed
            मृतSprite.destroy();
            this.unitSprites.delete(unitId);
          }
        });
      } else if (unit.position) {
        // Update position if unit has moved
        const worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
        const distanceThreshold = 1; // Only update if moved significantly
        const dx = Math.abs(sprite.x - worldPos.x);
        const dy = Math.abs(sprite.y - worldPos.y);
        
        if (dx > distanceThreshold || dy > distanceThreshold) {
          console.log(`Moving sprite ${unit.id} from (${sprite.x}, ${sprite.y}) to (${worldPos.x}, ${worldPos.y})`);
          sprite.setPosition(worldPos.x, worldPos.y);
        }
      }
      
      // Update sprite state only if sprite still exists and is active
      if (sprite && sprite.active && !sprite.getData('destroying')) {
        sprite.updateUnit(unit);
      }
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
    
    // Ensure background is updated for preparation phase
    this.updateBackground();
    
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
      // Skip units without positions
      if (!unit.position) {
        continue;
      }
      
      const sprite = this.unitSprites.get(unit.id);
      if (sprite && sprite.active && !sprite.getData('destroying')) {
        // Update position with smooth interpolation
        const worldPos = this.grid.gridToWorld(unit.position.x, unit.position.y);
        
        // Calculate distance for dynamic duration
        const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, worldPos.x, worldPos.y);
        const duration = Math.min(500, Math.max(200, distance * 2)); // 200-500ms based on distance
        
        // Smooth movement to new position (only if sprite is still active)
        if (sprite.active) {
          this.tweens.add({
            targets: sprite,
            x: worldPos.x,
            y: worldPos.y,
            duration: duration,
            ease: 'Power2.InOut'
          });
        }
        
        // Check if unit just started attacking (for projectile creation)
        const oldUnit = sprite.unit;
        const justStartedAttacking = oldUnit && oldUnit.status !== 'attacking' && unit.status === 'attacking';
        
        // Debug logging
        if (unit.status === 'attacking' && this.isRangedUnit(unit)) {
          console.log(`${unit.name} is attacking, old status: ${oldUnit ? oldUnit.status : 'unknown'}, new status: ${unit.status}`);
        }
        
        // Update unit data (health, status, etc.) - this has its own safety checks
        sprite.updateUnit(unit);
        
        // Create projectile for ranged attackers
        if (justStartedAttacking && this.isRangedUnit(unit)) {
          // Check cooldown to avoid duplicate projectiles
          const lastAttack = this.lastAttackTime.get(unit.id) || 0;
          const now = this.time.now;
          
          if (now - lastAttack > 500) { // 500ms cooldown between projectiles
            console.log(`🎯 Creating projectile for ${unit.name} (${unit.id})`);
            if (unit.name.toLowerCase() === 'wizard') {
              // Create enhanced blue orb projectile for wizard
              console.log(`🧙 Creating wizard projectile for ${unit.name}`);
              this.createWizardProjectile(unit, allUnits);
            } else {
              // Immediate projectile for other ranged units
              console.log(`🏹 Creating standard projectile for ${unit.name}`);
              this.createProjectileForAttack(unit, allUnits);
            }
            this.lastAttackTime.set(unit.id, now);
          } else {
            console.log(`⏰ Projectile on cooldown for ${unit.name}, last attack: ${now - lastAttack}ms ago`);
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
    
    // Create drag preview for placement (start off-screen until first mouse move)
    const placementUnit = {
      id: 'placement-preview',
      name: unit.name,
      playerId: this.currentPlayerId || '',
      health: unit.health,
      maxHealth: unit.health,
      damage: unit.damage,
      speed: unit.speed,
      status: 'idle' as const,
      position: null,
      buffs: []
    };
    
    this.createDragPreview(placementUnit, -100, -100);
    
    // Add escape key to cancel
    this.input.keyboard?.once('keydown-ESC', () => {
      this.exitPlacementMode();
    });
  }

  exitPlacementMode() {
    this.placementMode = false;
    this.placementUnit = null;
    this.placedUnit = null;
    
    // Destroy drag preview
    this.destroyDragPreview();

    this.grid.clearHighlight();
  }

  enterPlacementModeForUnit(unit: Unit) {
    if (this.gameState?.phase !== 'preparation') return;
    
    this.placementMode = true;
    this.placementUnit = null; // We're placing an already purchased unit
    this.placedUnit = unit; // Store the unit to place
    
    // Create drag preview for placement (start off-screen until first mouse move)
    this.createDragPreview(unit, -100, -100);
    
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

  private createWizardProjectile(attacker: Unit, allUnits: Unit[]) {
    console.log(`🧙 Creating wizard projectile for ${attacker.name} (${attacker.id})`);
    
    // Check if attacker has a valid position
    if (!attacker.position) {
      console.log(`❌ Wizard ${attacker.id} has no position`);
      return;
    }
    
    // Find the closest enemy unit as the target
    const isPlayerUnit = this.gameState?.players.some(p => 
      p.units.some(u => u.id === attacker.id)
    ) || false;
    
    const enemies = allUnits.filter(u => {
      const isEnemy = isPlayerUnit ? 
        this.gameState?.enemyUnits.some(e => e.id === u.id) :
        this.gameState?.players.some(p => p.units.some(pu => pu.id === u.id));
      return isEnemy && u.status !== 'dead' && u.position;
    });
    
    console.log(`🎯 Found ${enemies.length} potential targets for wizard`);
    
    if (enemies.length === 0) {
      console.log(`❌ No valid targets for wizard projectile`);
      return;
    }
    
    // Find closest enemy
    let closestEnemy: Unit | null = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      if (!enemy.position) continue;
      const distance = Math.abs(enemy.position.x - attacker.position.x) + 
                      Math.abs(enemy.position.y - attacker.position.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    
    if (!closestEnemy || !closestEnemy.position) {
      console.log(`❌ No closest enemy found for wizard projectile`);
      return;
    }
    
    console.log(`🎯 Wizard targeting ${closestEnemy.name} at (${closestEnemy.position.x}, ${closestEnemy.position.y})`);
    
    // Get world positions
    const startPos = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
    const targetPos = this.grid.gridToWorld(closestEnemy.position.x, closestEnemy.position.y);
    
    console.log(`🚀 Creating projectile from (${startPos.x}, ${startPos.y}) to (${targetPos.x}, ${targetPos.y})`);

    const projectile = new Projectile(this, {
      startX: startPos.x,
      startY: startPos.y - 20,
      targetX: targetPos.x,
      targetY: targetPos.y - 20,
      texture: 'wizard',
      frame: 'Charge_1_1 #10.png',
      speed: 400,
      scale: 1.2,
      onComplete: () => {
        const impact = this.add.circle(targetPos.x, targetPos.y - 20, 12, 0x3366ff, 0.9);
        impact.setDepth(1002);
        this.tweens.add({
          targets: impact,
          scale: 3,
          alpha: 0,
          duration: 300,
          onComplete: () => impact.destroy()
        });
      }
    });

    if (this.sound.get('wizardSound')) {
      this.sound.play('wizardSound', { volume: 0.4 });
    }

    this.projectiles.push(projectile);
    console.log(`🧙 Wizard projectile creation complete`);
  }
  
  private createProjectileForAttack(attacker: Unit, allUnits: Unit[]) {
    // Check if attacker has a valid position
    if (!attacker.position) return;
    
    // Find the closest enemy unit as the target
    const isPlayerUnit = this.gameState?.players.some(p => 
      p.units.some(u => u.id === attacker.id)
    ) || false;
    
    const enemies = allUnits.filter(u => {
      const isEnemy = isPlayerUnit ? 
        this.gameState?.enemyUnits.some(e => e.id === u.id) :
        this.gameState?.players.some(p => p.units.some(pu => pu.id === u.id));
      return isEnemy && u.status !== 'dead' && u.position; // Also filter out enemies without positions
    });
    
    if (enemies.length === 0) return;
    
    // Find closest enemy
    let closestEnemy: Unit | null = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      // Enemy position is guaranteed to exist due to filter above, but double-check for safety
      if (!enemy.position) continue;
      
      const distance = Math.abs(enemy.position.x - attacker.position.x) + 
                      Math.abs(enemy.position.y - attacker.position.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    
    if (!closestEnemy || !closestEnemy.position) return;
    
    console.log(`Creating projectile: ${attacker.name} attacking ${closestEnemy.name}`);
    
    // Get world positions
    const startPos = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
    const targetPos = this.grid.gridToWorld(closestEnemy.position.x, closestEnemy.position.y);
    
    // Determine projectile texture based on unit type
    let textureKey = attacker.name.toLowerCase();
    let projectileScale = 3.0; // Increased even more for better visibility of smaller Charge_1_X frames
    
    if (attacker.name.toLowerCase() === 'priest') {
      // For priest, we'll create a generic holy projectile effect
      // Since priest doesn't have projectile frames, we'll use a particle effect
      this.createHolyProjectileEffect(startPos.x, startPos.y, targetPos.x, targetPos.y);
      return;
    }
    
    // For wizard, use the charge frame
    let initialFrame = undefined;
    if (attacker.name.toLowerCase() === 'wizard') {
      initialFrame = 'Charge_1_1 #10.png';
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
  
  private handleWizardAttack(attacker: Unit, allUnits: Unit[]) {
    console.log(`🧙 Wizard ${attacker.name} starting charging sequence`);
    console.log(`🧙 Attacker details:`, { id: attacker.id, position: attacker.position, health: attacker.health });
    
    // Find the target first
    if (!attacker.position) return;
    
    const isPlayerUnit = this.gameState?.players.some(p => 
      p.units.some(u => u.id === attacker.id)
    ) || false;
    
    const enemies = allUnits.filter(u => {
      const isEnemy = isPlayerUnit ? 
        this.gameState?.enemyUnits.some(e => e.id === u.id) :
        this.gameState?.players.some(p => p.units.some(pu => pu.id === u.id));
      return isEnemy && u.status !== 'dead' && u.position;
    });
    
    if (enemies.length === 0) return;
    
    // Find closest enemy
    let closestEnemy: Unit | null = null;
    let closestDistance = Infinity;
    
    for (const enemy of enemies) {
      if (!enemy.position) continue;
      const distance = Math.abs(enemy.position.x - attacker.position.x) + 
                      Math.abs(enemy.position.y - attacker.position.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }
    
    if (!closestEnemy || !closestEnemy.position) return;
    
    // Start the charging animation and delayed projectile launch
    const attackerSprite = this.unitSprites.get(attacker.id);
    if (attackerSprite) {
      this.startWizardChargingAnimation(attackerSprite, attacker, closestEnemy, allUnits);
    }
  }
  
  private startWizardChargingAnimation(attackerSprite: any, attacker: Unit, target: Unit, allUnits: Unit[]) {
    console.log(`🔮 Starting wizard charging animation for ${attacker.name}`);
    
    // Get wizard attack frames
    const wizardTextureKey = attacker.name.toLowerCase();
    if (!this.textures.exists(wizardTextureKey)) {
      console.error(`Wizard texture ${wizardTextureKey} not found`);
      return;
    }
    
    const frameNames = this.textures.get(wizardTextureKey).getFrameNames();
    const attackFrames = frameNames.filter(frame => 
      frame.toLowerCase().includes('attack')
    );
    
    // Sort attack frames to get proper order
    attackFrames.sort((frameA, frameB) => {
      const extractFrameInfo = (frameName) => {
        const match = frameName.match(/^([a-zA-Z]+)_(\d+)(?:_(\d+))?.*?\.png$/i);
        if (match) {
          const mainFrame = parseInt(match[2], 10);
          const subFrame = match[3] ? parseInt(match[3], 10) : 0;
          return { mainFrame, subFrame };
        }
        const fallbackMatch = frameName.match(/(\d+)/);
        if (fallbackMatch) {
          return { mainFrame: parseInt(fallbackMatch[1], 10), subFrame: 0 };
        }
        return { mainFrame: Infinity, subFrame: Infinity };
      };

      const infoA = extractFrameInfo(frameA);
      const infoB = extractFrameInfo(frameB);

      if (infoA.mainFrame === infoB.mainFrame) {
        return infoA.subFrame - infoB.subFrame;
      }
      return infoA.mainFrame - infoB.mainFrame;
    });
    
    if (attackFrames.length < 9) {
      console.error(`Not enough attack frames for wizard charging animation (need at least 9)`);
      return;
    }
    
    // Use frames 5-9 for charging loop (0-indexed: frames 4-8)
    const chargingFrames = attackFrames.slice(4, 9);
    console.log(`🔮 Using charging frames:`, chargingFrames);
    
    // Create custom charging animation
    const chargingAnimKey = `wizard_charging_${attacker.id}`;
    
    if (!this.anims.exists(chargingAnimKey)) {
      this.anims.create({
        key: chargingAnimKey,
        frames: this.anims.generateFrameNames(wizardTextureKey, { 
          frames: chargingFrames 
        }),
        frameRate: 8, // Slower animation for charging effect
        repeat: -1 // Loop indefinitely
      });
    }
    
    // Play charging animation
    attackerSprite.play(chargingAnimKey);
    
    // Create charging effect around wizard
    this.createChargingEffect(attackerSprite);
    
    // After 2.5 seconds of charging, launch the blue orb
    console.log(`⏱️ Starting 2.5 second countdown for wizard orb launch`);
    this.time.delayedCall(2500, () => {
      console.log(`🚀 LAUNCHING BLUE ORB PROJECTILE NOW!`);
      console.log(`📍 Current scene active:`, this.scene.isActive());
      console.log(`📍 Scene cameras:`, this.cameras.main.width, 'x', this.cameras.main.height);
      
      // Play wizard sound effect
      if (this.sound.get('wizardSound')) {
        this.sound.play('wizardSound', { volume: 0.6 });
      }
      
      // Create the enhanced blue orb projectile
      this.createBlueOrbProjectile(attacker, target, allUnits);
      
      // Play remaining attack animation frames (frames 10+)
      const launchAnimKey = `wizard_launch_${attacker.id}`;
      const launchFrames = attackFrames.slice(9); // frames 10+ (0-indexed: frames 9+)
      
      if (launchFrames.length > 0 && !this.anims.exists(launchAnimKey)) {
        this.anims.create({
          key: launchAnimKey,
          frames: this.anims.generateFrameNames(wizardTextureKey, { 
            frames: launchFrames 
          }),
          frameRate: 10,
          repeat: 0 // Play once
        });
      }
      
      if (this.anims.exists(launchAnimKey)) {
        attackerSprite.play(launchAnimKey);
      } else {
        // Fallback to normal attack animation if no launch frames
        const normalAttackKey = `${attacker.name.toLowerCase()}_attack`;
        if (this.anims.exists(normalAttackKey)) {
          attackerSprite.play(normalAttackKey);
        }
      }
    });
  }
  
  private createChargingEffect(wizardSprite: any) {
    console.log(`✨ Creating charging effect around wizard`);
    
    // Create a charging circle that grows and pulses around the wizard
    const chargingCircle = this.add.circle(wizardSprite.x, wizardSprite.y - 10, 10, 0x4444ff, 0.3);
    chargingCircle.setDepth(wizardSprite.depth + 1);
    
    // Create particle effect for charging
    const particles = this.add.particles(wizardSprite.x, wizardSprite.y - 10, 'wizard', {
      frame: 'Charge_1_1 #10.png', // Use existing charge frame as particle
      scale: { start: 0.1, end: 0.3 },
      alpha: { start: 0.8, end: 0 },
      speed: { min: 20, max: 40 },
      lifespan: 800,
      quantity: 2,
      frequency: 100
    });
    particles.setDepth(wizardSprite.depth + 2);
    
    // Animate charging circle
    this.tweens.add({
      targets: chargingCircle,
      radius: { from: 10, to: 25 },
      alpha: { from: 0.3, to: 0.8 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Store effects to clean them up later
    wizardSprite.chargingEffects = {
      circle: chargingCircle,
      particles: particles
    };
    
    // Clean up charging effects after 3 seconds
    this.time.delayedCall(3000, () => {
      if (wizardSprite.chargingEffects) {
        wizardSprite.chargingEffects.circle.destroy();
        wizardSprite.chargingEffects.particles.destroy();
        wizardSprite.chargingEffects = null;
      }
    });
  }
  
  private createBlueOrbProjectile(attacker: Unit, target: Unit, allUnits: Unit[]) {
    console.log(`🔵 Creating blue orb projectile from ${attacker.name} to ${target.name}`);
    console.log(`🎯 Attacker position:`, attacker.position, `Target position:`, target.position);
    
    if (!attacker.position || !target.position) {
      console.error(`❌ Missing positions - Attacker: ${attacker.position}, Target: ${target.position}`);
      return;
    }
    
    // Get world positions
    const startPos = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
    const targetPos = this.grid.gridToWorld(target.position.x, target.position.y);
    
    console.log(`🚀 Orb traveling from (${startPos.x}, ${startPos.y}) to (${targetPos.x}, ${targetPos.y})`);
    
    // Create container for the orb and all its effects
    const orbContainer = this.add.container(startPos.x, startPos.y - 20);
    orbContainer.setDepth(1000); // High depth to ensure visibility
    console.log(`✨ Orb container created at depth ${orbContainer.depth}`);
    
    // Create multiple orb layers for visual depth - made larger and more visible
    const outerGlow = this.add.circle(0, 0, 35, 0x0066ff, 0.3);
    const middleRing = this.add.circle(0, 0, 25, 0x3388ff, 0.6);
    const innerOrb = this.add.circle(0, 0, 18, 0x88ccff, 0.9);
    const core = this.add.circle(0, 0, 12, 0xaaccff, 1.0);
    const center = this.add.circle(0, 0, 6, 0xffffff, 1.0);
    
    // Add bright outline for better visibility
    const outline = this.add.graphics();
    outline.lineStyle(3, 0xffffff, 0.8);
    outline.strokeCircle(0, 0, 30);
    console.log(`✨ Created orb layers with improved visibility`);
    
    // Add all layers to container
    orbContainer.add([outerGlow, middleRing, innerOrb, core, center, outline]);
    
    // Create pulsing animation for each layer
    this.tweens.add({
      targets: outerGlow,
      scaleX: { from: 1, to: 1.3 },
      scaleY: { from: 1, to: 1.3 },
      alpha: { from: 0.2, to: 0.4 },
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.tweens.add({
      targets: [middleRing, innerOrb],
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.tweens.add({
      targets: [core, center],
      scaleX: { from: 1, to: 1.2 },
      scaleY: { from: 1, to: 1.2 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Animate outline
    this.tweens.add({
      targets: outline,
      alpha: { from: 0.3, to: 1 },
      duration: 350,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add rotation to make it more dynamic
    this.tweens.add({
      targets: orbContainer,
      rotation: { from: 0, to: Math.PI * 2 },
      duration: 1000,
      repeat: -1,
      ease: 'Linear'
    });
    
    // Create particle trail system
    let trailParticles;
    try {
      // Try to use wizard texture for particles
      if (this.textures.exists('wizard')) {
        trailParticles = this.add.particles(0, 0, 'wizard', {
          frame: 'Charge_1_1 #10.png', // Use wizard charge frame as particle
          scale: { start: 0.1, end: 0 },
          alpha: { start: 0.8, end: 0 },
          tint: [0x3388ff, 0x88ccff, 0xaaccff],
          speed: { min: 20, max: 40 },
          lifespan: 800,
          quantity: 3,
          frequency: 50,
          emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 15), quantity: 2 }
        });
        console.log(`🎆 Created wizard particle trail`);
      } else {
        console.warn(`⚠️ Wizard texture not found, skipping particle trail`);
      }
    } catch (error) {
      console.error(`❌ Failed to create particle trail:`, error);
    }
    
    if (trailParticles) {
      trailParticles.setDepth(orbContainer.depth - 1);
      trailParticles.startFollow(orbContainer);
    }
    
    // Create target indicator at destination to show where the explosion will be
    const targetIndicator = this.add.graphics();
    targetIndicator.lineStyle(2, 0x3388ff, 0.4);
    targetIndicator.strokeCircle(targetPos.x, targetPos.y - 20, 80); // Show the damage radius
    targetIndicator.setDepth(targetPos.y - 10);
    
    // Pulse the target indicator
    this.tweens.add({
      targets: targetIndicator,
      alpha: { from: 0.2, to: 0.6 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Calculate travel time based on distance
    const distance = Phaser.Math.Distance.Between(startPos.x, startPos.y, targetPos.x, targetPos.y);
    const travelTime = Math.max(1000, distance * 2); // Minimum 1 second, dramatic timing
    
    console.log(`⏱️ Orb will travel for ${travelTime}ms over distance ${distance} pixels`);
    
    // Animate orb to target with smooth curve
    this.tweens.add({
      targets: orbContainer,
      x: targetPos.x,
      y: targetPos.y - 20,
      duration: travelTime,
      ease: 'Power2.easeOut',
      onComplete: () => {
        console.log(`💥 Blue orb reached target at (${targetPos.x}, ${targetPos.y})`);
        
        // Stop particle trail
        if (trailParticles) {
          trailParticles.destroy();
        }
        
        // Remove target indicator
        targetIndicator.destroy();
        
        // Create explosion at impact point
        this.createBlueOrbExplosion(targetPos.x, targetPos.y - 20, attacker, allUnits);
        
        // Destroy orb container
        orbContainer.destroy();
      }
    });
    
    // Add a subtle trail effect by scaling the orb as it travels
    this.tweens.add({
      targets: orbContainer,
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      duration: travelTime * 0.5,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });
  }
  
  private createSimpleWizardProjectile(attacker: Unit, target: Unit, allUnits: Unit[]) {
    console.log(`🔷 Creating simple wizard projectile as fallback`);
    
    if (!attacker.position || !target.position) {
      console.error(`❌ Missing positions for simple projectile`);
      return;
    }
    
    // Get world positions
    const startPos = this.grid.gridToWorld(attacker.position.x, attacker.position.y);
    const targetPos = this.grid.gridToWorld(target.position.x, target.position.y);
    
    // Create a simple but bright projectile using standard Projectile class
    const projectileConfig = {
      startX: startPos.x,
      startY: startPos.y - 20,
      targetX: targetPos.x,
      targetY: targetPos.y - 20,
      texture: 'wizard',
      frame: 'Charge_1_1 #10.png',
      speed: 300,
      scale: 0.8,
      onComplete: () => {
        console.log(`🔷 Simple wizard projectile reached target`);
        this.createBlueOrbExplosion(targetPos.x, targetPos.y - 20, attacker, allUnits);
      }
    };
    
    // Use the standard Projectile class which should definitely work
    const projectile = new Projectile(this, projectileConfig);
    
    // Add bright tint to make it very visible  
    projectile.setTint(0x88ccff); // Apply tint to entire container
    projectile.setScale(1.5); // Make it bigger
    
    this.projectiles.push(projectile);
    console.log(`🔷 Simple projectile added to projectiles array, total: ${this.projectiles.length}`);
  }
  
  private createBlueOrbExplosion(x: number, y: number, attacker: Unit, allUnits: Unit[]) {
    console.log(`💥 Creating enhanced blue orb explosion at (${x}, ${y})`);
    
    // Create main explosion container
    const explosionContainer = this.add.container(x, y);
    explosionContainer.setDepth(y + 200);
    
    // Define the damage radius
    const damageRadius = 80;
    
    // FIRST: Create damage radius indicator BEFORE explosion
    const radiusIndicator = this.add.graphics();
    radiusIndicator.lineStyle(3, 0x88ccff, 0.8);
    radiusIndicator.strokeCircle(x, y, damageRadius);
    radiusIndicator.setDepth(y + 195);
    
    // Pulse the radius indicator
    this.tweens.add({
      targets: radiusIndicator,
      alpha: { from: 0.3, to: 1 },
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut'
    });
    
    // Create inner filled radius preview
    const radiusFill = this.add.circle(x, y, damageRadius, 0x3388ff, 0.15);
    radiusFill.setDepth(y + 194);
    
    // Animate radius fill
    this.tweens.add({
      targets: radiusFill,
      scaleX: { from: 0.8, to: 1 },
      scaleY: { from: 0.8, to: 1 },
      alpha: { from: 0, to: 0.3 },
      duration: 400,
      ease: 'Power2.easeOut'
    });
    
    // Create multiple explosion rings with different animations
    const rings = [];
    const ringColors = [0xffffff, 0xaaccff, 0x88ccff, 0x3388ff, 0x0066ff];
    
    for (let i = 0; i < 5; i++) {
      const ring = this.add.circle(0, 0, 5, ringColors[i], 0.9 - (i * 0.15));
      rings.push(ring);
      explosionContainer.add(ring);
    }
    
    // Animate rings expanding outward in sequence
    rings.forEach((ring, index) => {
      this.tweens.add({
        targets: ring,
        scaleX: { from: 0.2, to: 12 + (index * 1.5) },
        scaleY: { from: 0.2, to: 12 + (index * 1.5) },
        alpha: { from: 0.9, to: 0 },
        duration: 1000 + (index * 100),
        ease: 'Power2.easeOut',
        delay: index * 60
      });
    });
    
    // Create inner flash effect
    const flash = this.add.circle(0, 0, 20, 0xffffff, 1);
    explosionContainer.add(flash);
    
    this.tweens.add({
      targets: flash,
      scaleX: { from: 0.1, to: 6 },
      scaleY: { from: 0.1, to: 6 },
      alpha: { from: 1, to: 0 },
      duration: 400,
      ease: 'Power3.easeOut'
    });
    
    // Create spectacular particle burst
    const burstParticles = this.add.particles(x, y, '__DEFAULT', {
      scale: { start: 1.0, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0x0066ff, 0x3388ff, 0x88ccff, 0xaaccff, 0xffffff],
      speed: { min: 150, max: 350 },
      lifespan: 1500,
      quantity: 30,
      frequency: -1, // Burst all at once
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 8), quantity: 30 }
    });
    burstParticles.setDepth(y + 202);
    burstParticles.explode(30);
    
    // Create secondary particle ring
    const ringParticles = this.add.particles(x, y, '__DEFAULT', {
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: [0x3388ff, 0x88ccff],
      speed: { min: 80, max: 150 },
      lifespan: 1000,
      quantity: 20,
      frequency: -1,
      emitZone: { type: 'edge', source: new Phaser.Geom.Circle(0, 0, 25), quantity: 20 }
    });
    ringParticles.setDepth(y + 201);
    ringParticles.explode(20);
    
    // Add screen shake for impact
    this.cameras.main.shake(300, 0.015);
    
    // Calculate area damage after showing the radius
    this.calculateAreaDamage(x, y, damageRadius, attacker, allUnits);
    
    // Clean up explosion effects
    this.time.delayedCall(1200, () => {
      explosionContainer.destroy();
      radiusIndicator.destroy();
      radiusFill.destroy();
    });
    
    this.time.delayedCall(2000, () => {
      if (burstParticles && burstParticles.active) burstParticles.destroy();
      if (ringParticles && ringParticles.active) ringParticles.destroy();
    });
  }
  
  private calculateAreaDamage(explosionX: number, explosionY: number, radius: number, attacker: Unit, allUnits: Unit[]) {
    console.log(`⚡ Calculating area damage from wizard explosion`);
    
    // Find all enemy units within the blast radius
    const isPlayerUnit = this.gameState?.players.some(p => 
      p.units.some(u => u.id === attacker.id)
    ) || false;
    
    const enemies = allUnits.filter(u => {
      const isEnemy = isPlayerUnit ? 
        this.gameState?.enemyUnits.some(e => e.id === u.id) :
        this.gameState?.players.some(p => p.units.some(pu => pu.id === u.id));
      return isEnemy && u.status !== 'dead' && u.position;
    });
    
    const affectedEnemies = [];
    
    for (const enemy of enemies) {
      if (!enemy.position) continue;
      
      const enemyPos = this.grid.gridToWorld(enemy.position.x, enemy.position.y);
      const distance = Phaser.Math.Distance.Between(explosionX, explosionY, enemyPos.x, enemyPos.y);
      
      if (distance <= radius) {
        affectedEnemies.push(enemy);
        console.log(`🎯 Enemy ${enemy.name} caught in blast (distance: ${distance.toFixed(1)})`);
      }
    }
    
    // Apply damage to all affected enemies
    if (affectedEnemies.length > 0) {
      console.log(`💀 Wizard explosion affecting ${affectedEnemies.length} enemies`);
      
      // Create damage indicators for affected enemies with cascade effect
      affectedEnemies.forEach((enemy, index) => {
        if (enemy.position) {
          const enemyWorldPos = this.grid.gridToWorld(enemy.position.x, enemy.position.y);
          
          // Delayed damage indicators for dramatic cascade effect
          this.time.delayedCall(index * 80, () => {
            this.createDamageIndicator(enemyWorldPos.x, enemyWorldPos.y, attacker.damage || 4, 'magic');
            
            // Add individual hit effect on each enemy
            const enemyHitEffect = this.add.circle(enemyWorldPos.x, enemyWorldPos.y, 12, 0x88ccff, 0.7);
            enemyHitEffect.setDepth(enemyWorldPos.y + 50);
            
            this.tweens.add({
              targets: enemyHitEffect,
              scaleX: { from: 0.3, to: 4 },
              scaleY: { from: 0.3, to: 4 },
              alpha: { from: 0.7, to: 0 },
              duration: 500,
              ease: 'Power2.easeOut',
              onComplete: () => enemyHitEffect.destroy()
            });
            
            // Add small particle burst on each enemy hit
            const hitParticles = this.add.particles(enemyWorldPos.x, enemyWorldPos.y, '__DEFAULT', {
              scale: { start: 0.4, end: 0 },
              alpha: { start: 0.8, end: 0 },
              tint: [0x88ccff, 0xaaccff],
              speed: { min: 30, max: 80 },
              lifespan: 600,
              quantity: 8,
              frequency: -1
            });
            hitParticles.setDepth(enemyWorldPos.y + 51);
            hitParticles.explode(8);
            
            this.time.delayedCall(800, () => {
              if (hitParticles && hitParticles.active) hitParticles.destroy();
            });
          });
        }
      });
    }
  }

  private createDamageIndicator(x: number, y: number, damage: number, type: string = 'physical') {
    // Create damage text with appropriate color
    const color = type === 'magic' ? '#88ccff' : type === 'heal' ? '#4CAF50' : '#ffffff';
    const text = this.add.text(x, y - 20, `-${Math.round(damage)}`, {
      fontSize: '16px',
      color: color,
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold'
    });
    text.setOrigin(0.5);
    text.setDepth(y + 100);

    // Animate damage text
    this.tweens.add({
      targets: text,
      y: y - 60,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 1.2 },
      duration: 1000,
      ease: 'Power2.easeOut',
      onComplete: () => text.destroy()
    });
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

  private lastHoverPosition: Position | null = null;
  private hoverDebounceTime = 100; // 100ms debounce
  private lastHoverSentTime = 0;

  private sendHoverPosition(gridPos: Position | null) {
    const currentTime = this.time.now;
    
    // Debounce hover events to avoid spam
    if (currentTime - this.lastHoverSentTime < this.hoverDebounceTime) {
      return;
    }
    
    // Only send if position actually changed
    if (gridPos && this.lastHoverPosition &&
        this.lastHoverPosition.x === gridPos.x &&
        this.lastHoverPosition.y === gridPos.y) {
      return;
    }

    this.lastHoverPosition = gridPos ? { x: gridPos.x, y: gridPos.y } : null;
    this.lastHoverSentTime = currentTime;
    
    // Send hover event via GameContext
    if ((window as any).gameContext?.socket) {
      console.log('Sending cell-hover event:', gridPos);
      (window as any).gameContext.socket.emit('cell-hover', gridPos);
    } else {
      console.log('No socket available to send hover event');
    }
  }

  updatePlayerHover(playerId: string, playerName: string, position: Position | null, playerColor: string) {
    this.grid.updatePlayerHover(playerId, playerName, position, playerColor);
  }

  private showSellZone() {
    if (this.sellZone) return; // Already visible
    
    // Create sell zone container
    this.sellZone = this.add.container(this.cameras.main.width - 150, this.cameras.main.height / 2);
    this.sellZone.setDepth(1900); // Below drag preview but above most things
    
    // Create background panel with gradient
    const zoneHeight = 200;
    const zoneWidth = 120;
    const bg = this.add.graphics();
    
    // Draw gradient background
    bg.fillGradientStyle(0xff0000, 0xff0000, 0xcc0000, 0xcc0000, 0.8, 0.9, 0.7, 0.8);
    bg.fillRoundedRect(-zoneWidth/2, -zoneHeight/2, zoneWidth, zoneHeight, 16);
    
    // Draw border
    bg.lineStyle(3, 0xffffff, 0.8);
    bg.strokeRoundedRect(-zoneWidth/2, -zoneHeight/2, zoneWidth, zoneHeight, 16);
    
    // Add pulsing border effect
    const pulsingBorder = this.add.graphics();
    pulsingBorder.lineStyle(3, 0xff6666, 0.6);
    pulsingBorder.strokeRoundedRect(-zoneWidth/2, -zoneHeight/2, zoneWidth, zoneHeight, 16);
    
    this.tweens.add({
      targets: pulsingBorder,
      alpha: { from: 0.3, to: 0.8 },
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add sell icon
    const sellIcon = this.add.text(0, -40, '💰', {
      fontSize: '48px'
    });
    sellIcon.setOrigin(0.5);
    
    // Add text
    const sellText = this.add.text(0, 10, 'SELL', {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: 'bold'
    });
    sellText.setOrigin(0.5);
    
    const refundText = this.add.text(0, 40, '75% Refund', {
      fontSize: '14px',
      color: '#ffff88',
      stroke: '#000000',
      strokeThickness: 2
    });
    refundText.setOrigin(0.5);
    
    // Add all elements to container
    this.sellZone.add([bg, pulsingBorder, sellIcon, sellText, refundText]);
    
    // Animate sell zone sliding in
    this.sellZone.x = this.cameras.main.width + 100;
    this.tweens.add({
      targets: this.sellZone,
      x: this.cameras.main.width - 100,
      duration: 300,
      ease: 'Power2.easeOut'
    });
  }

  private hideSellZone() {
    if (!this.sellZone) return;
    
    // Animate sell zone sliding out
    this.tweens.add({
      targets: this.sellZone,
      x: this.cameras.main.width + 100,
      duration: 300,
      ease: 'Power2.easeIn',
      onComplete: () => {
        if (this.sellZone) {
          this.sellZone.destroy();
          this.sellZone = null;
        }
      }
    });
    
    this.isOverSellZone = false;
  }

  private checkSellZoneHover(pointerX: number, pointerY: number) {
    if (!this.sellZone) {
      this.isOverSellZone = false;
      return;
    }
    
    // Check if pointer is over sell zone
    const sellZoneBounds = {
      x: this.sellZone.x - 60,
      y: this.sellZone.y - 100,
      width: 120,
      height: 200
    };
    
    const wasOverSellZone = this.isOverSellZone;
    this.isOverSellZone = pointerX >= sellZoneBounds.x && 
                          pointerX <= sellZoneBounds.x + sellZoneBounds.width &&
                          pointerY >= sellZoneBounds.y && 
                          pointerY <= sellZoneBounds.y + sellZoneBounds.height;
    
    // Update visual feedback when entering/leaving sell zone
    if (this.isOverSellZone !== wasOverSellZone) {
      if (this.isOverSellZone) {
        // Entering sell zone - make it glow more
        this.tweens.add({
          targets: this.sellZone,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 200,
          ease: 'Power2.easeOut'
        });
        
        // Update drag preview to show sell indication
        if (this.dragPreview && this.draggedUnit) {
          const unitStats = this.getUnitStats(this.draggedUnit.name);
          const refundAmount = Math.floor((unitStats?.cost || 0) * 0.75);
          
          // Add refund amount text to drag preview if not already there
          const refundIndicator = this.add.text(0, -40, `+${refundAmount}g`, {
            fontSize: '16px',
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
          });
          refundIndicator.setOrigin(0.5);
          refundIndicator.setName('refundIndicator');
          this.dragPreview.add(refundIndicator);
        }
      } else {
        // Leaving sell zone
        this.tweens.add({
          targets: this.sellZone,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
          ease: 'Power2.easeOut'
        });
        
        // Remove refund indicator from drag preview
        if (this.dragPreview) {
          const refundIndicator = this.dragPreview.getByName('refundIndicator');
          if (refundIndicator) {
            refundIndicator.destroy();
          }
        }
      }
    }
  }

  private sellUnit(unitId: string) {
    // Use the game context to emit sell event
    if ((window as any).gameContext?.socket) {
      (window as any).gameContext.socket.emit('sell-unit', unitId);
      
      // Play sell sound if available
      if (this.sound.get('purchase')) {
        this.sound.play('purchase', { volume: 0.7, rate: 1.2 });
      }
    }
  }

  private getUnitStats(unitName: string): UnitStats | null {
    // Find unit stats from shop units or a predefined list
    if (this.gameState?.shopUnits) {
      return this.gameState.shopUnits.find(u => u.name === unitName) || null;
    }
    return null;
  }

  private showDragInstruction() {
    if (this.dragInstruction) return;
    
    // Create instruction container at top of screen
    this.dragInstruction = this.add.container(this.cameras.main.centerX, 100);
    this.dragInstruction.setDepth(2100);
    
    // Create background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRoundedRect(-200, -30, 400, 60, 12);
    
    // Create instruction text
    const instructionText = this.add.text(0, 0, '🎯 Drag to reposition  |  💰 Drop in red zone to sell (75% refund)', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    });
    instructionText.setOrigin(0.5);
    
    this.dragInstruction.add([bg, instructionText]);
    
    // Fade in animation
    this.dragInstruction.setAlpha(0);
    this.tweens.add({
      targets: this.dragInstruction,
      alpha: 1,
      duration: 300,
      ease: 'Power2.easeOut'
    });
  }

  private hideDragInstruction() {
    if (!this.dragInstruction) return;
    
    this.tweens.add({
      targets: this.dragInstruction,
      alpha: 0,
      duration: 200,
      ease: 'Power2.easeIn',
      onComplete: () => {
        if (this.dragInstruction) {
          this.dragInstruction.destroy();
          this.dragInstruction = null;
        }
      }
    });
  }

  private createDragShadow(unitSprite: UnitSprite) {
    // Create an ellipse shadow beneath the unit
    this.dragShadow = this.add.ellipse(
      unitSprite.x, 
      unitSprite.y + 30, 
      50, 
      20, 
      0x000000, 
      0.3
    );
    this.dragShadow.setDepth(unitSprite.depth - 1);
    
    // Add pulsing animation to the shadow
    this.tweens.add({
      targets: this.dragShadow,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0.2,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private destroyDragShadow() {
    if (this.dragShadow) {
      this.tweens.killTweensOf(this.dragShadow);
      this.dragShadow.destroy();
      this.dragShadow = null;
    }
  }
}