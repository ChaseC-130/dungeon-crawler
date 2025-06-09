import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Phaser from 'phaser';

interface UnifiedUnitSpriteProps {
  unitName: string;
  width: number;
  height: number;
}

// This component exactly replicates the main game's sprite rendering approach
const UnifiedUnitSprite: React.FC<UnifiedUnitSpriteProps> = ({ unitName, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    class SpriteScene extends Phaser.Scene {
      constructor() {
        super({ key: 'SpriteScene' });
      }

      preload() {
        const textureKey = unitName.toLowerCase();
        // Check if texture is already loaded in main game
        const mainGame = (window as any).gameInstance;
        if (mainGame && mainGame.textures && mainGame.textures.exists(textureKey)) {
          return;
        }
        // Otherwise load it
        this.load.atlas(
          textureKey,
          `/assets/units/${textureKey}/${textureKey}.png`,
          `/assets/units/${textureKey}/${textureKey}.json`
        );
      }

      create() {
        const textureKey = unitName.toLowerCase();
        
        // Center camera on origin (0,0) where sprite will be
        this.cameras.main.centerOn(0, 0);
        
        if (!this.textures.exists(textureKey)) {
          // Create placeholder sprite exactly like main game
          if (!this.textures.exists('__DEFAULT')) {
            const graphics = this.add.graphics();
            graphics.fillStyle(0x888888);
            graphics.fillRect(0, 0, 64, 64);
            graphics.generateTexture('__DEFAULT', 64, 64);
            graphics.destroy();
          }
          const sprite = this.add.sprite(0, 0, '__DEFAULT');
          sprite.setScale(0.8);
          return;
        }

        // Get frames from atlas
        const texture = this.textures.get(textureKey);
        const frameNames = texture.getFrameNames();
        
        if (frameNames.length === 0) {
          const sprite = this.add.sprite(0, 0, textureKey);
          sprite.setScale(0.8);
          return;
        }

        // Complex frame sorting function from main game
        const sortFrames = (frames: string[]) => {
          return frames.sort((frameA, frameB) => {
            const extractFrameInfo = (frameName: string) => {
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
        };

        // Find and create idle animation exactly like main game
        const idleFrames = frameNames.filter(frame => 
          frame.toLowerCase().includes('idle')
        );

        let animationKey = `${textureKey}_idle`;
        let framesToUse = idleFrames;
        let frameRate = 8; // Idle animations use 8 fps in constructor

        if (idleFrames.length > 0) {
          // Sort idle frames using complex sorting
          framesToUse = sortFrames(idleFrames);
        } else {
          // Fallback: use first 4 frames as idle
          framesToUse = frameNames.slice(0, Math.min(4, frameNames.length));
          frameRate = 10; // Other animations use 10 fps
        }

        // Create animation if it doesn't exist
        if (!this.anims.exists(animationKey)) {
          this.anims.create({
            key: animationKey,
            frames: this.anims.generateFrameNames(textureKey, {
              frames: framesToUse
            }),
            frameRate: frameRate,
            repeat: -1
          });
        }

        // Find first frame to display (prefer idle frame)
        const firstFrame = idleFrames.length > 0 ? 
          idleFrames.find(f => f.toLowerCase().includes('idle')) || frameNames[0] :
          frameNames[0];

        // Create sprite at (0,0) exactly like main game
        const sprite = this.add.sprite(0, 0, textureKey, firstFrame);
        sprite.setScale(0.8);
        
        // Play animation
        sprite.play(animationKey);
      }
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: width,
      height: height,
      transparent: true,
      scene: SpriteScene
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true, true);
        gameRef.current = null;
      }
    };
  }, [unitName, width, height]);

  return (
    <View style={[styles.container, { width, height }]}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default UnifiedUnitSprite;