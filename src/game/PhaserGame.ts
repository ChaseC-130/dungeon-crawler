import * as Phaser from 'phaser';
import { GameState } from '../types/game';
import MainScene from './scenes/MainScene';
import PreloadScene from './scenes/PreloadScene';

export default class PhaserGame {
  private game: Phaser.Game;
  private mainScene: MainScene | null = null;

  constructor(parent: HTMLElement, width: number, height: number) {
    console.log('=== PHASER GAME DEBUG ===');
    console.log('Input dimensions:', { width, height });
    console.log('Window dimensions:', { 
      innerWidth: window.innerWidth, 
      innerHeight: window.innerHeight,
      ratio: window.innerWidth / window.innerHeight 
    });
    console.log('Parent element:', parent);
    console.log('Parent computed style:', parent ? window.getComputedStyle(parent) : 'No parent');
    
    // Use the provided parent element and respect React Native layout
    if (parent) {
      parent.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        background-color: #000 !important;
      `;
    }
    
    console.log('Using parent element for game container');
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: parent,
      width: width,
      height: height,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: width,
        height: height,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        mouse: {
          target: parent,
        },
        touch: {
          target: parent,
        },
        smoothFactor: 0,
        queue: true,
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scene: [PreloadScene, MainScene],
    };

    console.log('Creating Phaser.Game with config:', config);
    
    this.game = new Phaser.Game(config);
    
    console.log('Phaser.Game created:', this.game);
    console.log('Game canvas:', this.game.canvas);
    console.log('Game renderer:', this.game.renderer);
    console.log('Game scene manager:', this.game.scene);
    
    // Expose game instance globally for HUD access
    (window as any).gameInstance = this.game;
    
    // Get reference to main scene after it's created
    this.game.events.once('ready', () => {
      this.mainScene = this.game.scene.getScene('MainScene') as MainScene;
      
      // Expose test functions globally for console access
      if (this.mainScene) {
        (window as any).testWizardProjectile = () => this.mainScene!.testWizardProjectile();
        (window as any).addTestWizard = () => this.mainScene!.addTestWizard();
        console.log('🧙 Global functions available: testWizardProjectile(), addTestWizard()');
      }
    });
  }

  updateGameState(gameState: GameState) {
    if (this.mainScene && this.mainScene.scene.isActive()) {
      this.mainScene.updateGameState(gameState);
    }
  }

  resize(width: number, height: number) {
    if (this.game && this.game.scale) {
      this.game.scale.resize(width, height);
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}