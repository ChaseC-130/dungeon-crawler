import * as Phaser from 'phaser';
import { GameState } from '../types/game';
import MainScene from './scenes/MainScene';
import PreloadScene from './scenes/PreloadScene';

export default class PhaserGame {
  private game: Phaser.Game;
  private mainScene: MainScene | null = null;

  constructor(parent: HTMLElement, width: number, height: number) {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: parent,
      width: width,
      height: height,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
      },
      scene: [PreloadScene, MainScene],
    };

    this.game = new Phaser.Game(config);
    
    // Expose game instance globally for HUD access
    (window as any).gameInstance = this.game;
    
    // Get reference to main scene after it's created
    this.game.events.once('ready', () => {
      this.mainScene = this.game.scene.getScene('MainScene') as MainScene;
    });
  }

  updateGameState(gameState: GameState) {
    if (this.mainScene && this.mainScene.scene.isActive()) {
      this.mainScene.updateGameState(gameState);
    }
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}