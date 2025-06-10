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
    
    this.targetX = config.targetX;
    this.targetY = config.targetY;
    this.speed = config.speed || 400; // pixels per second
    this.onComplete = config.onComplete;
    this.startTime = scene.time.now;
    
    // Create the projectile sprite
    this.projectileSprite = scene.add.sprite(0, 0, config.texture, config.frame);
    this.projectileSprite.setScale(config.scale || 0.8);
    
    // Add sprite to container
    this.add(this.projectileSprite);
    
    // Calculate angle to target
    const angle = Phaser.Math.Angle.Between(
      config.startX,
      config.startY,
      config.targetX,
      config.targetY
    );
    
    // Rotate projectile to face target (add 90 degrees for proper orientation)
    this.setRotation(angle + Math.PI / 2);
    
    // Set depth based on starting Y position
    this.setDepth(config.startY + 100); // Above units
    
    // Add to scene
    scene.add.existing(this);
    
    // Create animation if texture has multiple frames
    this.createAnimation();
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
    // Debug: check all frame names that contain 'charge'
    const allChargeFrames = frameNames.filter(frame => frame.toLowerCase().includes('charge'));
    console.log('All frames containing "charge":', allChargeFrames);
    
    const chargeFrames = frameNames.filter(frame => 
      frame.toLowerCase().includes('charge_1_') && frame.toLowerCase().includes('.png')
    );
    
    console.log('Available frame names:', frameNames.slice(0, 10)); // Debug: show first 10 frame names
    console.log('Filtered charge frames:', chargeFrames);
    
    const magicArrowFrames = frameNames.filter(frame => 
      frame.toLowerCase().includes('magic_arrow') || 
      frame.toLowerCase().includes('projectile') ||
      frame.toLowerCase().includes('spell')
    );
    
    // Use Charge_1_X frames if available, otherwise use Magic_arrow frames
    const projectileFrames = chargeFrames.length > 0 ? chargeFrames : magicArrowFrames;
    
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
    
    this.x += Math.cos(angle) * step;
    this.y += Math.sin(angle) * step;
    
    // Update depth based on current Y position
    this.setDepth(this.y + 100);
  }
}