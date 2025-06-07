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
    
    // Find projectile frames (e.g., Magic_arrow_1, Magic_arrow_2, etc.)
    const projectileFrames = frameNames.filter(frame => 
      frame.toLowerCase().includes('magic_arrow') || 
      frame.toLowerCase().includes('projectile') ||
      frame.toLowerCase().includes('spell')
    );
    
    if (projectileFrames.length > 0) {
      // Sort frames properly by extracting the frame number
      projectileFrames.sort((a, b) => {
        const matchA = a.match(/Magic_arrow_(\d+)/i);
        const matchB = b.match(/Magic_arrow_(\d+)/i);
        const numA = matchA ? parseInt(matchA[1]) : 0;
        const numB = matchB ? parseInt(matchB[1]) : 0;
        return numA - numB;
      });
      
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