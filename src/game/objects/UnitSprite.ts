import * as Phaser from 'phaser';
import { Unit } from '../../types/game';

export default class UnitSprite extends Phaser.GameObjects.Container {
  public unitId: string;
  private sprite: Phaser.GameObjects.Sprite;
  private healthBar: Phaser.GameObjects.Graphics;
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private nameText: Phaser.GameObjects.Text;
  public unit: Unit;  // Made public so MainScene can access it
  private isPlayerUnit: boolean;
  private lastStatus: string = 'idle';
  private lastSoundTime: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, unit: Unit) {
    super(scene, x, y);
    
    this.unitId = unit.id;
    this.unit = unit;
    this.isPlayerUnit = !unit.id.startsWith('enemy-');
    
    // Create sprite - use the unit name as is since that's how it's loaded
    const textureKey = unit.name.toLowerCase();
    
    // Check if texture exists
    if (!scene.textures.exists(textureKey)) {
      console.error(`Texture not found for unit: ${textureKey}`);
      // Create a placeholder rectangle if texture is missing
      this.sprite = scene.add.sprite(0, 0, '__DEFAULT');
      if (!scene.textures.exists('__DEFAULT')) {
        const graphics = scene.add.graphics();
        graphics.fillStyle(0x888888);
        graphics.fillRect(0, 0, 64, 64);
        graphics.generateTexture('__DEFAULT', 64, 64);
        graphics.destroy();
      }
    } else {
      // Get the first frame from the texture atlas
      const texture = scene.textures.get(textureKey);
      const frameNames = texture.getFrameNames();
      
      console.log(`Loading sprite for ${textureKey}, found ${frameNames.length} frames`);
      
      if (frameNames.length > 0) {
        // Try to find an idle frame first
        const idleFrame = frameNames.find(frame => {
          // Handle both "Idle_1.png" and "Idle_1" formats
          const frameName = frame.toLowerCase();
          return frameName.includes('idle');
        });
        
        const firstFrame = idleFrame || frameNames[0];
        console.log(`Using frame: ${firstFrame} for ${textureKey}`);
        this.sprite = scene.add.sprite(0, 0, textureKey, firstFrame);
        
        // If we found an idle frame, try to create/play idle animation
        if (idleFrame) {
          const idleFrames = frameNames.filter(f => f.toLowerCase().includes('idle'));
          if (idleFrames.length > 1 && !scene.anims.exists(`${textureKey}_idle`)) {
            scene.anims.create({
              key: `${textureKey}_idle`,
              frames: scene.anims.generateFrameNames(textureKey, {
                frames: idleFrames
              }),
              frameRate: 8,
              repeat: -1
            });
            this.sprite.play(`${textureKey}_idle`);
          }
        }
      } else {
        console.warn(`No frames found for ${textureKey}, using base texture`);
        this.sprite = scene.add.sprite(0, 0, textureKey);
      }
    }
    
    this.sprite.setScale(0.8);
    
    // Tint enemy units
    if (!this.isPlayerUnit) {
      this.sprite.setTint(0xff6666);
    }
    
    // Create health bar background
    this.healthBarBg = scene.add.rectangle(0, -40, 50, 6, 0x000000);
    this.healthBarBg.setStrokeStyle(1, 0x333333);
    
    // Create health bar
    this.healthBar = scene.add.graphics();
    this.updateHealthBar();
    
    // Create name text
    this.nameText = scene.add.text(0, 25, unit.name, {
      fontSize: '12px',
      color: this.isPlayerUnit ? '#ffffff' : '#ff6666',
      stroke: '#000000',
      strokeThickness: 2
    });
    this.nameText.setOrigin(0.5);
    
    // Add all components to container
    this.add([this.sprite, this.healthBarBg, this.healthBar, this.nameText]);
    
    // Set depth based on y position
    this.setDepth(y);
    
    // Play idle animation
    this.playAnimation('idle');
    
    scene.add.existing(this);

    this.sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (animation: Phaser.Animations.Animation) => {
      if (animation.key === `${this.unit.name.toLowerCase()}_dead`) {
        // Keep the last frame of death animation visible
        // but darken it and reduce opacity slightly
        // Clear any existing tint first before applying death tint
        this.sprite.clearTint();
        this.sprite.setTint(0x444444);
        this.setAlpha(0.5);
        
        // Hide health bar and name for dead units
        this.healthBarBg.setVisible(false);
        this.healthBar.setVisible(false);
        this.nameText.setVisible(false);
        
        // Emit event after a delay to show the death state
        this.scene.time.delayedCall(1000, () => {
          this.emit('death_animation_complete', this.unitId);
        });
      }
    }, this);
  }

  updateUnit(unit: Unit) {
    this.unit = unit;
    
    // Update health bar
    this.updateHealthBar();
    
    // Update position if needed
    if (unit.status === 'moving' || unit.status === 'attacking') {
      // Position is updated by the server during combat
    }
    
    // Update animation based on status
    const statusChanged = unit.status !== this.lastStatus;
    
    switch (unit.status) {
      case 'idle':
        this.playAnimation('idle');
        break;
      case 'moving':
        this.playAnimation('walk');
        break;
      case 'attacking':
        this.playAnimation('attack');
        if (statusChanged) {
          this.playAttackSound();
        }
        break;
      case 'dead':
        this.playAnimation('dead');
        if (statusChanged) {
          this.playDeathSound();
        }
        break;
    }
    
    this.lastStatus = unit.status;
    
    // Update depth based on y position
    this.setDepth(this.y);
  }

  private updateHealthBar() {
    this.healthBar.clear();
    
    const healthPercent = this.unit.health / this.unit.maxHealth;
    const barWidth = 50 * healthPercent;
    
    // Choose color based on health percentage
    let color = 0x4CAF50; // Green
    if (healthPercent < 0.3) {
      color = 0xF44336; // Red
    } else if (healthPercent < 0.6) {
      color = 0xFF9800; // Orange
    }
    
    this.healthBar.fillStyle(color);
    this.healthBar.fillRect(-25, -43, barWidth, 6);
  }

  private playAnimation(animKey: string) {
    // Check if animation exists for this unit
    const textureKey = this.unit.name.toLowerCase();
    if (!this.scene.textures.exists(textureKey)) {
      return;
    }
    const frameNames = this.scene.textures.get(textureKey).getFrameNames();
    
    // Create animation if it doesn't exist
    const animationKey = `${this.unit.name.toLowerCase()}_${animKey}`;
    
    if (!this.scene.anims.exists(animationKey)) {
      // Find frames that match the animation pattern
      const animFrames = frameNames.filter(frame => {
        const frameLower = frame.toLowerCase();
        if (animKey === 'idle') {
          return frameLower.includes('idle');
        } else if (animKey === 'walk') {
          return frameLower.includes('walk') || frameLower.includes('run');
        } else if (animKey === 'attack') {
          return frameLower.includes('attack');
        } else if (animKey === 'dead') {
          return frameLower.includes('dead');
        }
        return false;
      });
      
      if (animFrames.length > 0) {
        // Sort frames to ensure proper order using a custom sort
        animFrames.sort((frameA, frameB) => {
          const extractFrameInfo = (frameName) => {
            // Matches: (Action)_ (MainFrameNumber) _ (SubFrameNumber) (AnythingElse) .png
            // Or:      (Action)_ (MainFrameNumber) (AnythingElse) .png
            const match = frameName.match(/^([a-zA-Z]+)_(\d+)(?:_(\d+))?.*?\.png$/i);
            if (match) {
              const mainFrame = parseInt(match[2], 10);
              const subFrame = match[3] ? parseInt(match[3], 10) : 0; // Default subFrame to 0 if not present
              return { mainFrame, subFrame };
            }
            // Fallback: try to find any number if the pattern is different
            const fallbackMatch = frameName.match(/(\d+)/);
            if (fallbackMatch) {
              return { mainFrame: parseInt(fallbackMatch[1], 10), subFrame: 0 };
            }
            return { mainFrame: Infinity, subFrame: Infinity }; // Should not happen if frames are named with numbers
          };

          const infoA = extractFrameInfo(frameA);
          const infoB = extractFrameInfo(frameB);

          if (infoA.mainFrame === infoB.mainFrame) {
            return infoA.subFrame - infoB.subFrame;
          }
          return infoA.mainFrame - infoB.mainFrame;
        });
        
        this.scene.anims.create({
          key: animationKey,
          frames: this.scene.anims.generateFrameNames(textureKey, {
            frames: animFrames
          }),
          frameRate: animKey === 'dead' ? 6 : 10,
          repeat: animKey === 'dead' ? 0 : -1
        });
      } else if (animKey === 'idle' && frameNames.length > 0) {
        // If no idle frames found, use all frames as idle animation
        this.scene.anims.create({
          key: animationKey,
          frames: this.scene.anims.generateFrameNames(textureKey, {
            frames: frameNames.slice(0, Math.min(4, frameNames.length))
          }),
          frameRate: 10,
          repeat: -1
        });
      }
    }
    
    // Play the animation
    if (this.scene.anims.exists(animationKey)) {
      this.sprite.play(animationKey);
    }
  }

  startCombat() {
    // Combat is handled by server updates
  }

  stopCombat() {
    // Return to idle
    if (this.unit.status !== 'dead') {
      this.playAnimation('idle');
    }
  }

  update(time: number, delta: number) {
    // Update depth based on current Y position for proper layering
    this.setDepth(this.y);
  }

  private playAttackSound() {
    const currentTime = this.scene.time.now;
    if (currentTime - this.lastSoundTime < 500) return; // Debounce 500ms
    
    const soundKey = `${this.unit.name.toLowerCase()}Sound`;
    if (this.scene.sound.get(soundKey)) {
      this.scene.sound.play(soundKey, { volume: 0.3 });
      this.lastSoundTime = currentTime;
    }
  }

  private playDeathSound() {
    // Play explosion sound for death
    if (this.scene.sound.get('explodeSound')) {
      this.scene.sound.play('explodeSound', { volume: 0.2 });
    }
  }

  destroy() {
    super.destroy();
  }
}