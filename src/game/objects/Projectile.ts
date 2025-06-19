import * as Phaser from 'phaser';

export interface ProjectileConfig {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  texture: string;
  frame?: string;
  speed?: number;
  scale?: number;
  onComplete?: () => void;
}

export class Projectile extends Phaser.GameObjects.Container {
  private targetX: number;
  private targetY: number;
  private speed: number;
  private onComplete?: () => void;
  private startTime: number;
  private projectileSprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, config: ProjectileConfig) {
    super(scene, config.startX, config.startY);
    
    console.log(`🎯 PROJECTILE CONSTRUCTOR: Creating projectile from (${config.startX}, ${config.startY}) to (${config.targetX}, ${config.targetY}) with texture: ${config.texture}`);
    console.log(`🎯 Scene info: active=${scene.scene.isActive()}, cameras=${scene.cameras ? 'OK' : 'NULL'}`);
    
    this.targetX = config.targetX;
    this.targetY = config.targetY;
    this.speed = config.speed || 400; // pixels per second
    this.onComplete = config.onComplete;
    this.startTime = scene.time.now;
    
    // Create the projectile sprite
    console.log(`🎯 Creating sprite with texture: ${config.texture}, frame: ${config.frame}`);
    console.log(`🎯 Texture exists: ${scene.textures.exists(config.texture)}`);
    
    // If no frame specified, try to find a suitable projectile frame
    let frameToUse = config.frame;
    if (!frameToUse && scene.textures.exists(config.texture)) {
      const frameNames = scene.textures.get(config.texture).getFrameNames();
      // Look for Charge_1_1 frame for wizard
      if (config.texture === 'wizard') {
        frameToUse = frameNames.find(f => f.includes('Charge_1_1')) || frameNames[0];
        console.log(`🎯 Auto-selected wizard frame: ${frameToUse}`);
      } else {
        frameToUse = frameNames[0];
      }
    }
    
    try {
      this.projectileSprite = scene.add.sprite(0, 0, config.texture, frameToUse);
      this.projectileSprite.setScale(config.scale || 0.8);
      
      // Fix rotation artifacts by setting proper blend mode and alpha handling
      this.projectileSprite.setBlendMode(Phaser.BlendModes.NORMAL);
      
      // Disable texture smoothing to prevent white edge artifacts during rotation
      if (this.projectileSprite.texture && this.projectileSprite.texture.source) {
        this.projectileSprite.texture.source[0].setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
      
      // Ensure the sprite doesn't have any tint that might cause color issues
      this.projectileSprite.clearTint();
      
      // Set proper origin for rotation
      this.projectileSprite.setOrigin(0.5, 0.5);
      
      // Ensure the sprite is visible and positioned properly
      this.projectileSprite.setVisible(true);
      this.projectileSprite.setAlpha(1.0);
      this.projectileSprite.setRoundPixels(true);
      
      console.log(`🎯 Sprite created: width=${this.projectileSprite.width}, height=${this.projectileSprite.height}, visible=${this.projectileSprite.visible}, frame=${frameToUse}`);
      
      // If sprite has no dimensions, it probably failed to load
      if (this.projectileSprite.width === 0 || this.projectileSprite.height === 0) {
        console.warn(`🎯 Sprite has zero dimensions, creating fallback`);
        this.projectileSprite.destroy();
        throw new Error('Sprite has zero dimensions');
      }
    } catch (error) {
      console.error(`🎯 Failed to create sprite with texture, creating fallback graphics:`, error);
      
      // Create a simple graphics object as fallback
      const graphics = scene.add.graphics();
      graphics.fillStyle(0x00ffff, 1.0);
      graphics.fillCircle(0, 0, 12);
      graphics.lineStyle(2, 0xffffff, 1.0);
      graphics.strokeCircle(0, 0, 12);
      
      // Cast to sprite-like object for compatibility
      this.projectileSprite = graphics as any;
      this.projectileSprite.setVisible(true);
      this.projectileSprite.setAlpha(1.0);
      
      console.log(`🎯 Fallback graphics created: visible=${this.projectileSprite.visible}`);
    }
    
    // Add sprite to container
    this.add(this.projectileSprite);
    
    console.log(`🎯 Sprite added to container, container children: ${this.list.length}`);
    
    // Calculate angle to target
    const angle = Phaser.Math.Angle.Between(
      config.startX,
      config.startY,
      config.targetX,
      config.targetY
    );
    
    // Rotate the sprite directly instead of the container to avoid double rendering
    // For wizard projectiles, the sprite faces right by default, so we don't need to add 90 degrees
    if (config.texture === 'wizard') {
      this.projectileSprite.setRotation(angle);
    } else {
      // For other projectiles, add 90 degrees for proper orientation
      this.projectileSprite.setRotation(angle + Math.PI / 2);
    }
    
    // Don't rotate the container itself
    this.setRotation(0);
    
    // Set round pixels to prevent sub-pixel positioning artifacts
    this.setRoundPixels(true);
    
    // Set depth based on starting Y position
    this.setDepth(config.startY + 100); // Above units
    
    // Add to scene
    scene.add.existing(this);
    
    // Log final container state
    console.log(`🎯 Container created: x=${this.x}, y=${this.y}, depth=${this.depth}, visible=${this.visible}, alpha=${this.alpha}`);
    console.log(`🎯 Container children count: ${this.list.length}`);
    console.log(`🎯 Scene children count: ${scene.children.length}`);
    
    // Make container extra visible for debugging
    this.setVisible(true);
    this.setAlpha(1.0);
    
    // Don't create animations to avoid frame conflicts - use single frame for projectiles
    // this.createAnimation();
  }
  
  private createAnimation() {
    const textureKey = this.projectileSprite.texture.key;
    const animKey = `${textureKey}_projectile`;
    
    // Check if animation already exists
    if (this.scene.anims.exists(animKey)) {
      this.projectileSprite.play(animKey);
      return;
    }
    
    // Check if texture has frames
    if (!this.scene.textures.exists(textureKey)) {
      return;
    }
    
    const frameNames = this.scene.textures.get(textureKey).getFrameNames();
    
    // Find projectile frames - prioritize Charge_1_X frames for wizards, fallback to Magic_arrow
    let projectileFrames: string[] = [];
    
    if (textureKey === 'wizard') {
      // For wizard, use Charge_1_X frames (excluding Charge_1_9 which is a different animation)
      const chargeFrames = frameNames.filter(frame => 
        frame.includes('Charge_1_') && 
        frame.includes('.png') &&
        !frame.includes('Charge_1_9') && // Exclude frame 9 which looks different
        !frame.includes('Charge_1_8') && // Exclude frame 8 which looks different
        !frame.includes('Charge_1_7') && // Exclude frame 7 which looks different
        !frame.includes('Charge_1_6')    // Exclude frame 6 which looks different
      );
      console.log('Wizard Charge frames found:', chargeFrames.length, chargeFrames);
      projectileFrames = chargeFrames;
    }
    
    // Fallback to Magic_arrow or other projectile frames
    if (projectileFrames.length === 0) {
      const magicArrowFrames = frameNames.filter(frame => 
        frame.toLowerCase().includes('magic_arrow') || 
        frame.toLowerCase().includes('projectile') ||
        frame.toLowerCase().includes('spell')
      );
      projectileFrames = magicArrowFrames;
    }
    
    // Skip if we already have projectile frames
    
    if (projectileFrames.length > 0) {
      // Sort frames properly by extracting the frame number
      projectileFrames.sort((a, b) => {
        // Handle both Charge_1_X and Magic_arrow_X patterns, accounting for space and #number format
        // Examples: "Charge_1_1 #10.png", "Magic_arrow_1 #6.png"
        const chargeMatchA = a.match(/Charge_1_(\d+)\s*/i);
        const chargeMatchB = b.match(/Charge_1_(\d+)\s*/i);
        const magicMatchA = a.match(/Magic_arrow_(\d+)\s*/i);
        const magicMatchB = b.match(/Magic_arrow_(\d+)\s*/i);
        
        const numA = chargeMatchA ? parseInt(chargeMatchA[1]) : (magicMatchA ? parseInt(magicMatchA[1]) : 0);
        const numB = chargeMatchB ? parseInt(chargeMatchB[1]) : (magicMatchB ? parseInt(magicMatchB[1]) : 0);
        return numA - numB;
      });
      
      console.log('Sorted projectile frames:', projectileFrames);
      
      console.log('Creating projectile animation with frames:', projectileFrames);
      
      this.scene.anims.create({
        key: animKey,
        frames: this.scene.anims.generateFrameNames(textureKey, {
          frames: projectileFrames
        }),
        frameRate: 12,
        repeat: -1
      });
      
      this.projectileSprite.play(animKey);
    }
  }
  
  update(time: number, delta: number) {
    // Calculate distance to target
    const distance = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.targetX,
      this.targetY
    );
    
    // Check if reached target
    if (distance < 5) {
      this.destroy();
      if (this.onComplete) {
        this.onComplete();
      }
      return;
    }
    
    // Move towards target
    const step = (this.speed * delta) / 1000;
    const angle = Phaser.Math.Angle.Between(
      this.x,
      this.y,
      this.targetX,
      this.targetY
    );
    
    this.x = Math.round(this.x + Math.cos(angle) * step);
    this.y = Math.round(this.y + Math.sin(angle) * step);
    
    // Update depth based on current Y position
    this.setDepth(this.y + 100);
  }
}