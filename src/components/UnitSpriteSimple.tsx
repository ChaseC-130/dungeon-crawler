import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';

interface UnitSpriteSimpleProps {
  unitName: string;
  width: number;
  height: number;
}

function getUnitColor(unitName: string): string {
  const colors: Record<string, string> = {
    knight: '#4CAF50',
    priest: '#2196F3',
    fighter: '#FF5722',
    wizard: '#9C27B0',
    goblin: '#8BC34A',
    gladiator: '#FFC107',
    assassin: '#795548',
    bishop: '#00BCD4',
    blacksmith: '#607D8B',
    druidess: '#4CAF50',
    vampire: '#9C27B0',
    werewolf: '#795548',
  };
  return colors[unitName.toLowerCase()] || '#666666';
}

const UnitSpriteSimple: React.FC<UnitSpriteSimpleProps> = ({ unitName, width, height }) => {
  const [spriteDataUrl, setSpriteDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const animationRef = useRef<number | null>(null);
  const idleFramesRef = useRef<any[]>([]);
  const currentFrameRef = useRef(0);

  useEffect(() => {
    const loadSprite = async () => {
      try {
        // Load both the image and JSON data
        const [imgResponse, jsonResponse] = await Promise.all([
          fetch(`/assets/units/${unitName.toLowerCase()}/${unitName.toLowerCase()}.png`),
          fetch(`/assets/units/${unitName.toLowerCase()}/${unitName.toLowerCase()}.json`)
        ]);

        if (!imgResponse.ok || !jsonResponse.ok) {
          console.error('Failed to load sprite assets for:', unitName);
          setError(true);
          setIsLoading(false);
          return;
        }

        const jsonData = await jsonResponse.json();
        const imgBlob = await imgResponse.blob();
        const imgUrl = URL.createObjectURL(imgBlob);

        // Create image element
        const img = new Image();
        img.onload = () => {
          if (!canvasRef.current) return;

          const ctx = canvasRef.current.getContext('2d');
          if (!ctx) return;

          // Clear canvas
          ctx.clearRect(0, 0, width, height);

          // Find idle frames (TexturePacker or Phaser atlas formats)
          let frameData: any = null;
          let idleFrames: any[] = [];

          if (jsonData.textures && jsonData.textures[0] && jsonData.textures[0].frames) {
            // TexturePacker format
            const frames = jsonData.textures[0].frames;
            idleFrames = frames.filter((f: any) => f.filename.toLowerCase().includes('idle'));
            if (idleFrames.length > 0) {
              idleFrames.sort((a: any, b: any) => a.filename.localeCompare(b.filename));
            } else {
              idleFrames = [frames[0]];
            }
            frameData = idleFrames[0];
          } else if (jsonData.frames) {
            // Phaser atlas format
            const frames = Object.entries(jsonData.frames);
            const idlePairs = frames.filter(([key]) => key.toLowerCase().includes('idle'));
            if (idlePairs.length > 0) {
              idlePairs.sort(([a], [b]) => a.localeCompare(b));
              idleFrames = idlePairs.map(([, val]) => val);
            } else {
              idleFrames = [Object.values(jsonData.frames)[0]];
            }
            frameData = idleFrames[0];
          }

          idleFramesRef.current = idleFrames;

          const renderFrame = (frame: any) => {
            const frameWidth = frame.frame.w;
            const frameHeight = frame.frame.h;
            const scale = Math.min(width / frameWidth, height / frameHeight) * 0.8;

            const destWidth = frameWidth * scale;
            const destHeight = frameHeight * scale;
            const destX = (width - destWidth) / 2 - (frame.spriteSourceSize?.x || 0) * scale;
            const destY = (height - destHeight) / 2 - (frame.spriteSourceSize?.y || 0) * scale;

            ctx.clearRect(0, 0, width, height);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
              img,
              frame.frame.x,
              frame.frame.y,
              frame.frame.w,
              frame.frame.h,
              destX,
              destY,
              destWidth,
              destHeight
            );

            setSpriteDataUrl(canvasRef.current!.toDataURL());
          };

          if (frameData && frameData.frame) {
            renderFrame(frameData);
            setIsLoading(false);

            if (idleFrames.length > 1) {
              const animate = () => {
                currentFrameRef.current = (currentFrameRef.current + 1) % idleFramesRef.current.length;
                const frame = idleFramesRef.current[currentFrameRef.current];
                renderFrame(frame);
                animationRef.current = requestAnimationFrame(() => {
                  setTimeout(animate, 150);
                });
              };
              animationRef.current = requestAnimationFrame(() => {
                setTimeout(animate, 150);
              });
            }
            console.log(`Successfully loaded sprite for ${unitName}: ${frameData.filename || frameData.name || 'unknown frame'}`);
          } else {
            // Fallback: draw the entire image
            const scale = Math.min(width / img.width, height / img.height) * 0.8;
            const destWidth = img.width * scale;
            const destHeight = img.height * scale;
            const destX = (width - destWidth) / 2;
            const destY = (height - destHeight) / 2;

            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, destX, destY, destWidth, destHeight);
            setSpriteDataUrl(canvasRef.current.toDataURL());
            setIsLoading(false);
            console.log(`Used fallback rendering for ${unitName}`);
          }

          // Clean up
          URL.revokeObjectURL(imgUrl);
        };

        img.onerror = () => {
          console.error('Failed to load sprite image:', unitName);
          URL.revokeObjectURL(imgUrl);
          setError(true);
          setIsLoading(false);
        };

        img.src = imgUrl;
      } catch (error) {
        console.error('Error loading sprite:', error);
        setError(true);
        setIsLoading(false);
      }
    };

    loadSprite();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [unitName, width, height]);


  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width, height }]}>
        <canvas
          ref={canvasRef as any}
          width={width}
          height={height}
          style={{ display: 'none' }}
        />
        {isLoading && !error && (
          <View style={[styles.placeholder, { width, height }]}>
            <View style={styles.loadingBox} />
          </View>
        )}
        {error && (
          <View style={[styles.placeholder, { width, height }]}>
            <View style={[styles.errorBox, { backgroundColor: getUnitColor(unitName) }]} />
          </View>
        )}
        {spriteDataUrl && !error && (
          <Image
            source={{ uri: spriteDataUrl }}
            style={[styles.sprite, { width, height }]}
            resizeMode="contain"
          />
        )}
      </View>
    );
  }

  // Fallback for non-web platforms
  return (
    <View style={[styles.container, { width, height }]}>
      <Image
        source={{ uri: `/assets/units/${unitName.toLowerCase()}/${unitName.toLowerCase()}.png` }}
        style={[styles.sprite, { width: width * 0.8, height: height * 0.8 }]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    imageRendering: 'pixelated' as any,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    width: '60%',
    height: '60%',
    backgroundColor: '#ccc',
    borderRadius: 8,
  },
  errorBox: {
    width: '60%',
    height: '60%',
    borderRadius: 8,
    opacity: 0.7,
  },
});

export default UnitSpriteSimple;