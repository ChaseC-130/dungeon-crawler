import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Platform, Dimensions } from 'react-native';

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

interface UnitSpriteSimpleProps {
  unitName: string;
  width: number;
  height: number;
  useGridCellSize?: boolean; // If true, calculate size like grid cells
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

const UnitSpriteSimple: React.FC<UnitSpriteSimpleProps> = ({ unitName, width, height, useGridCellSize = false }) => {
  const [spriteDataUrl, setSpriteDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const animationRef = useRef<number | null>(null);
  const idleFramesRef = useRef<any[]>([]);
  const currentFrameRef = useRef(0);

  // Use grid cell size if requested, otherwise use provided dimensions
  const finalWidth = useGridCellSize ? calculateGridCellSize() : width;
  const finalHeight = useGridCellSize ? calculateGridCellSize() : height;

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
          ctx.clearRect(0, 0, finalWidth, finalHeight);

          // Find idle frames (TexturePacker or Phaser atlas formats)
          let frameData: any = null;
          let idleFrames: any[] = [];

          // Complex frame sorting function matching main game exactly
          const extractFrameInfo = (frameName: string) => {
            // Matches: (Action)_ (MainFrameNumber) _ (SubFrameNumber) (AnythingElse) .png
            // Or:      (Action)_ (MainFrameNumber) (AnythingElse) .png
            const match = frameName.match(/^([a-zA-Z]+)_(\d+)(?:_(\d+))?.*?\.png$/i);
            if (match) {
              const mainFrame = parseInt(match[2], 10);
              const subFrame = match[3] ? parseInt(match[3], 10) : 0;
              return { mainFrame, subFrame };
            }
            // Fallback: try to find any number if the pattern is different
            const fallbackMatch = frameName.match(/(\d+)/);
            if (fallbackMatch) {
              return { mainFrame: parseInt(fallbackMatch[1], 10), subFrame: 0 };
            }
            return { mainFrame: Infinity, subFrame: Infinity };
          };

          const sortFrames = (frameA: any, frameB: any, getNameFn: (f: any) => string) => {
            const infoA = extractFrameInfo(getNameFn(frameA));
            const infoB = extractFrameInfo(getNameFn(frameB));

            if (infoA.mainFrame === infoB.mainFrame) {
              return infoA.subFrame - infoB.subFrame;
            }
            return infoA.mainFrame - infoB.mainFrame;
          };

          if (jsonData.textures && jsonData.textures[0] && jsonData.textures[0].frames) {
            // TexturePacker format
            const frames = jsonData.textures[0].frames;
            idleFrames = frames.filter((f: any) => f.filename.toLowerCase().includes('idle'));
            if (idleFrames.length > 0) {
              // Sort idle frames using exact same complex sorting as main game
              idleFrames.sort((a: any, b: any) => sortFrames(a, b, (f) => f.filename));
            } else {
              // Use all frames as fallback, limit to 4 like main game
              idleFrames = frames.slice(0, Math.min(4, frames.length));
            }
            frameData = idleFrames[0];
          } else if (jsonData.frames) {
            // Phaser atlas format
            const frames = Object.entries(jsonData.frames);
            const idlePairs = frames.filter(([key]) => key.toLowerCase().includes('idle'));
            if (idlePairs.length > 0) {
              // Sort idle frames using exact same complex sorting as main game
              idlePairs.sort(([keyA], [keyB]) => {
                const infoA = extractFrameInfo(keyA);
                const infoB = extractFrameInfo(keyB);
                if (infoA.mainFrame === infoB.mainFrame) {
                  return infoA.subFrame - infoB.subFrame;
                }
                return infoA.mainFrame - infoB.mainFrame;
              });
              idleFrames = idlePairs.map(([, val]) => val);
            } else {
              // Use all frames as fallback, limit to 4 like main game
              const allFrames = Object.values(jsonData.frames);
              idleFrames = allFrames.slice(0, Math.min(4, allFrames.length));
            }
            frameData = idleFrames[0];
          }

          idleFramesRef.current = idleFrames;

          const renderFrame = (frame: any) => {
            const frameWidth = frame.frame.w;
            const frameHeight = frame.frame.h;
            // Use exact same scaling as main game grid (0.8 scale factor)
            const scale = 0.8;

            const destWidth = frameWidth * scale;
            const destHeight = frameHeight * scale;
            // Position sprite like main game (accounting for sprite source positioning)
            const destX = (finalWidth - destWidth) / 2 - (frame.spriteSourceSize?.x || 0) * scale;
            const destY = (finalHeight - destHeight) / 2 - (frame.spriteSourceSize?.y || 0) * scale;

            ctx.clearRect(0, 0, finalWidth, finalHeight);
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
                  // Match frame rate 10 from main game: 1000ms / 10 = 100ms per frame
                  setTimeout(animate, 100);
                });
              };
              animationRef.current = requestAnimationFrame(() => {
                // Match frame rate 10 from main game: 1000ms / 10 = 100ms per frame
                setTimeout(animate, 100);
              });
            }
            console.log(`Successfully loaded sprite for ${unitName}: ${frameData.filename || frameData.name || 'unknown frame'}`);
          } else {
            // Fallback: draw the entire image with exact same scaling as main game
            const scale = 0.8;
            const destWidth = img.width * scale;
            const destHeight = img.height * scale;
            const destX = (finalWidth - destWidth) / 2;
            const destY = (finalHeight - destHeight) / 2;

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
  }, [unitName, finalWidth, finalHeight]);


  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { width: finalWidth, height: finalHeight }]}>
        <canvas
          ref={canvasRef as any}
          width={finalWidth}
          height={finalHeight}
          style={{ display: 'none' }}
        />
        {isLoading && !error && (
          <View style={[styles.placeholder, { width: finalWidth, height: finalHeight }]}>
            <View style={styles.loadingBox} />
          </View>
        )}
        {error && (
          <View style={[styles.placeholder, { width: finalWidth, height: finalHeight }]}>
            <View style={[styles.errorBox, { backgroundColor: getUnitColor(unitName) }]} />
          </View>
        )}
        {spriteDataUrl && !error && (
          <Image
            source={{ uri: spriteDataUrl }}
            style={[styles.sprite, { width: finalWidth, height: finalHeight }]}
            resizeMode="contain"
          />
        )}
      </View>
    );
  }

  // Fallback for non-web platforms
  return (
    <View style={[styles.container, { width: finalWidth, height: finalHeight }]}>
      <Image
        source={{ uri: `/assets/units/${unitName.toLowerCase()}/${unitName.toLowerCase()}.png` }}
        style={[styles.sprite, { width: finalWidth * 0.8, height: finalHeight * 0.8 }]}
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