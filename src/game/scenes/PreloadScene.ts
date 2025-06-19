import * as Phaser from 'phaser';

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 4, height / 2 - 30, width / 2, 50);
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    
    this.load.on('progress', (value: number) => {
      percentText.setText(Math.floor(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 4 + 10, height / 2 - 20, (width / 2 - 20) * value, 30);
    });
    
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load backgrounds
    this.load.image('battle1', '/assets/backgrounds/battle1.png');
    this.load.image('battle2', '/assets/backgrounds/battle2.png');
    this.load.image('battle3', '/assets/backgrounds/battle3.png');
    this.load.image('battle4', '/assets/backgrounds/battle4.png');

    // Load tiles
    for (let i = 1; i <= 96; i++) {
      const num = i.toString().padStart(2, '0');
      this.load.image(`tile_${num}`, `/assets/tileset/tiles/Tile_${num}.png`);
    }

    // Load unit sprites
    const units = [
      'knight', 'priest', 'bishop', 'fighter', 'goblin', 'wizard',
      'gladiator', 'assassin', 'blacksmith', 'druidess', 'earth',
      'fire', 'furry', 'glutton', 'merchant', 'recruiter',
      'red dragon', 'researcher', 'storms', 'vampire', 'werewolf', 'worker'
    ];

    units.forEach(unit => {
      const unitPath = unit.includes(' ') ? unit : unit;
      
      // Custom loader for TexturePacker format
      this.load.json(`${unit}_json`, `/assets/units/${unitPath}/${unitPath}.json`);
      this.load.image(`${unit}_image`, `/assets/units/${unitPath}/${unitPath}.png`);
    });

    // Load audio
    this.load.audio('purchase', '/assets/sounds/purchaseSound.mp3');
    this.load.audio('theme1', '/assets/music/1theme.mp3');
    this.load.audio('theme2', '/assets/music/2theme.mp3');
    this.load.audio('theme3', '/assets/music/3theme.mp3');
    this.load.audio('theme4', '/assets/music/4theme.mp3');
    this.load.audio('battletheme1', '/assets/music/1battletheme.mp3');
    this.load.audio('battletheme2', '/assets/music/2battletheme.mp3');
    this.load.audio('battletheme3', '/assets/music/3battletheme.mp3');
    this.load.audio('battletheme4', '/assets/music/4battletheme.mp3');
    
    // Load unit sounds
    this.load.audio('knightSound', '/assets/units/knight/knightSound.mp3');
    this.load.audio('wizardSound', '/assets/units/wizard/wizardSound.mp3');
    this.load.audio('goblinSound', '/assets/units/goblin/goblinSound.mp3');
    this.load.audio('gladiatorSound', '/assets/units/gladiator/gladiatorSound.mp3');
    this.load.audio('vampireSound', '/assets/units/vampire/vampireSound.mp3');
    this.load.audio('werewolfSound', '/assets/units/werewolf/werewolfSound.mp3');
    this.load.audio('gluttonSound', '/assets/units/glutton/gluttonSound.mp3');
    this.load.audio('furrySound', '/assets/units/furry/furrySound.mp3');
    this.load.audio('redDragonSound', '/assets/units/red dragon/red dragonSound.mp3');
    this.load.audio('explodeSound', '/assets/units/avatars/explode.mp3');
    
    // Load upgrade icons
    const upgradeIcons = [
      'evasive_maneuvers', 'explosive_end', 'final_gift', 'poison_blade',
      'power_surge', 'rapid_strikes', 'slowing_aura', 'swift_boots',
      'taunt', 'vampiric_strike', 'vitality_boost'
    ];
    
    upgradeIcons.forEach(icon => {
      this.load.image(icon, `/assets/upgradeicons/${icon}.png`);
    });
  }

  create() {
    // Process TexturePacker atlases
    const units = [
      'knight', 'priest', 'bishop', 'fighter', 'goblin', 'wizard',
      'gladiator', 'assassin', 'blacksmith', 'druidess', 'earth',
      'fire', 'furry', 'glutton', 'merchant', 'recruiter',
      'red dragon', 'researcher', 'storms', 'vampire', 'werewolf', 'worker'
    ];

    units.forEach(unit => {
      const jsonData = this.cache.json.get(`${unit}_json`);
      const imageTexture = this.textures.get(`${unit}_image`);
      
      if (jsonData && imageTexture) {
        // Convert TexturePacker format to Phaser atlas
        if (jsonData.textures && jsonData.textures[0] && jsonData.textures[0].frames) {
          const frames: any = {};
          jsonData.textures[0].frames.forEach((frame: any) => {
            // Keep the full filename including .png extension
            const frameName = frame.filename;
            frames[frameName] = {
              frame: {
                x: frame.frame.x,
                y: frame.frame.y,
                w: frame.frame.w,
                h: frame.frame.h
              },
              sourceSize: {
                w: frame.sourceSize.w,
                h: frame.sourceSize.h
              },
              spriteSourceSize: frame.spriteSourceSize
            };
          });
          
          // Remove the temporary image texture
          this.textures.remove(`${unit}_image`);
          
          // Add as atlas with converted frames
          this.textures.addAtlas(unit, imageTexture.source[0].source, frames);
          console.log(`Created atlas for ${unit} with ${Object.keys(frames).length} frames`);
        }
      } else {
        console.error(`Failed to load atlas data for ${unit}`);
      }
    });

    this.scene.start('MainScene');
  }
}