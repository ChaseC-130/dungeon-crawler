import React, { useContext } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { GameContext } from '../contexts/GameContext';

const RedDragonDebug: React.FC = () => {
  const { socket, gameState } = useContext(GameContext);

  const triggerDragonFlying = (threshold: string) => {
    // Find a red dragon in the game
    const redDragon = gameState?.players
      .flatMap(p => p.units)
      .concat(gameState.enemyUnits || [])
      .find(u => u.name.toLowerCase() === 'red dragon');

    if (redDragon && socket) {
      console.log(`🐉 Triggering dragon flying at ${threshold} for ${redDragon.id}`);
      // Emit a debug event to trigger flying
      socket.emit('debug-dragon-fly', {
        dragonId: redDragon.id,
        threshold: threshold
      });
    } else {
      console.log('No red dragon found in game');
    }
  };

  const forceAttackAnimation = () => {
    const redDragon = gameState?.players
      .flatMap(p => p.units)
      .concat(gameState.enemyUnits || [])
      .find(u => u.name.toLowerCase() === 'red dragon');

    if (redDragon && socket) {
      console.log(`🐉 Forcing attack animation for ${redDragon.id}`);
      socket.emit('debug-dragon-attack', {
        dragonId: redDragon.id
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Red Dragon Debug</Text>
      <Button title="Trigger Flying (66%)" onPress={() => triggerDragonFlying('66%')} />
      <Button title="Trigger Flying (33%)" onPress={() => triggerDragonFlying('33%')} />
      <Button title="Force Attack Animation" onPress={forceAttackAnimation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 5,
  },
  title: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
});

export default RedDragonDebug;