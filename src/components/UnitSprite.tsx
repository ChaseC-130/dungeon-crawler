import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import * as Phaser from 'phaser';

// Calculate grid cell size to match main game
const calculateGridCellSize = () => {
  const { width, height } = Dimensions.get('window');
  const gridWidth = 20;
  const gridHeight = 8;
  return Math.min(
    (width * 0.9) / gridWidth,
    (height * 0.7) / gridHeight
  );
};

interface UnitSpriteProps {
  unitName: string;
  width: number;
  height: number;
  useGridCellSize?: boolean; // If true, calculate size like grid cells
}

const UnitSprite: React.FC<UnitSpriteProps> = React.memo(({ unitName, width, height, useGridCellSize = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  // Use grid cell size if requested, otherwise use provided dimensions
  const finalWidth = useGridCellSize ? calculateGridCellSize() : width;
  const finalHeight = useGridCellSize ? calculateGridCellSize() : height;

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a mini Phaser game just for this sprite
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: finalWidth,
      height: finalHeight,
      transparent: true,
      scene: {
        preload: function() {
          // Check if texture is already loaded in main game
          const mainGame = (window as any).gameInstance;
          if (mainGame && mainGame.textures && mainGame.textures.exists(unitName.toLowerCase())) {
            // Texture already loaded, we can use it
            return;
          }
          // Otherwise load it
          this.load.atlas(
            unitName.toLowerCase(),
            `/assets/units/${unitName.toLowerCase()}/${unitName.toLowerCase()}.png`,
            `/assets/units/${unitName.toLowerCase()}/${unitName.toLowerCase()}.json`
          );
        },
        create: function() {
          const textureKey = unitName.toLowerCase();
          
          // Center camera on origin
          this.cameras.main.centerOn(0, 0);
          
          // Check if texture exists
          if (!this.textures.exists(textureKey)) {
            console.error(`Texture not found for unit: ${textureKey}`);
            return;
          }

          // Get frames from atlas
          const frames = this.textures.get(textureKey).getFrameNames();
          
          // Find idle frames using exact same logic as main game
          const idleFrames = frames.filter(frame => {
            const frameLower = frame.toLowerCase();
            return frameLower.includes('idle');
          });
          
          console.log(`Found ${idleFrames.length} idle frames for ${unitName}:`, idleFrames);
          
          // Use exact same animation creation logic as main game
          const animationKey = `${unitName.toLowerCase()}_idle`;
          
          if (idleFrames.length > 0) {
            // Sort idle frames to ensure consistent order across all contexts (simple sort like main game)
            idleFrames.sort();
            
            console.log(`Sorted idle frames for ${unitName}:`, idleFrames);
            
            // Create animation with exact same settings as main game
            if (!this.anims.exists(animationKey)) {
              console.log(`Creating animation ${animationKey}`);
              this.anims.create({
                key: animationKey,
                frames: this.anims.generateFrameNames(textureKey, {
                  frames: idleFrames
                }),
                frameRate: 8, // Exact same as main game idle animation
                repeat: -1
              });
            }
            
            // Try to find first idle frame like main game does
            const idleFrame = frames.find(frame => {
              const frameName = frame.toLowerCase();
              return frameName.includes('idle');
            });
            const firstFrame = idleFrame || frames[0];
            
            // Create sprite at (0,0) exactly like main game
            const sprite = this.add.sprite(0, 0, textureKey, firstFrame);
            sprite.setScale(0.8); // Scale before playing animation
            sprite.setDepth(1); // Ensure sprite is on top
            
            // Play animation after all setup
            sprite.play(animationKey);
            
            console.log(`Created sprite for ${unitName} at (0,0) with scale 0.8`);
          } else if (frames.length > 0) {
            // No idle frames found, use all frames as idle animation (same as main game fallback)
            if (!this.anims.exists(animationKey)) {
              this.anims.create({
                key: animationKey,
                frames: this.anims.generateFrameNames(textureKey, {
                  frames: frames.slice(0, Math.min(4, frames.length))
                }),
                frameRate: 8,
                repeat: -1
              });
            }
            
            const sprite = this.add.sprite(0, 0, textureKey, frames[0]);
            sprite.setScale(0.8);
            sprite.setDepth(1);
            sprite.play(animationKey);
          }
        }
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true, true); // Clear cache as well
        gameRef.current = null;
      }
    };
  }, [unitName, finalWidth, finalHeight]);

  return (
    <View style={[styles.container, { width: finalWidth, height: finalHeight }]}>
      <div ref={containerRef} style={{ 
        width: '100%', 
        height: '100%'
      }} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

export default UnitSprite;