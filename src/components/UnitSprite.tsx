import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import * as Phaser from 'phaser';

interface UnitSpriteProps {
  unitName: string;
  width: number;
  height: number;
}

const UnitSprite: React.FC<UnitSpriteProps> = ({ unitName, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create a mini Phaser game just for this sprite
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: width,
      height: height,
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
          
          // Check if texture exists
          if (!this.textures.exists(textureKey)) {
            console.error(`Texture not found for unit: ${textureKey}`);
            return;
          }

          // Get frames from atlas
          const frames = this.textures.get(textureKey).getFrameNames();
          
          // Find idle frames
          const idleFrames = frames.filter(frame => frame.toLowerCase().includes('idle'));
          
          if (idleFrames.length > 0) {
            // Create idle animation
            this.anims.create({
              key: 'idle',
              frames: this.anims.generateFrameNames(textureKey, {
                frames: idleFrames
              }),
              frameRate: 8,
              repeat: -1
            });
            
            // Create sprite
            const sprite = this.add.sprite(width / 2, height / 2, textureKey);
            sprite.play('idle');
            
            // Scale to fit container
            const scale = Math.min(width / sprite.width, height / sprite.height) * 0.8;
            sprite.setScale(scale);
          } else if (frames.length > 0) {
            // No idle animation, just show first frame
            const sprite = this.add.sprite(width / 2, height / 2, textureKey, frames[0]);
            const scale = Math.min(width / sprite.width, height / sprite.height) * 0.8;
            sprite.setScale(scale);
          }
        }
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
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

export default UnitSprite;