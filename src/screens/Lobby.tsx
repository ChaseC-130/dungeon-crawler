import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import { useGame } from '../contexts/GameContext';

type LobbyNavigationProp = StackNavigationProp<RootStackParamList, 'Lobby'>;

const Lobby: React.FC = () => {
  const navigation = useNavigation<LobbyNavigationProp>();
  const { joinMatch, gameState, player, isConnected, socket } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleMatchStarted = (matchId: string) => {
      navigation.navigate('Game', { matchId });
    };

    socket.on('match-started', handleMatchStarted);

    return () => {
      socket.off('match-started', handleMatchStarted);
    };
  }, [socket, navigation]);

  const handleJoinMatch = () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!isConnected) {
      Alert.alert('Error', 'Not connected to server');
      return;
    }

    setIsJoining(true);
    joinMatch(playerName);
  };

  const renderPlayer = ({ item }: { item: any }) => (
    <View style={styles.playerItem}>
      <Text style={[styles.playerName, { color: item.color || '#FFF' }]}>{item.name}</Text>
      <Text style={styles.playerStatus}>
        {item.isReady ? '✓ Ready' : 'Waiting...'}
      </Text>
    </View>
  );

  if (isJoining && gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Waiting for Players</Text>
        <Text style={styles.subtitle}>
          {gameState.players.length}/4 Players
        </Text>

        <FlatList
          data={gameState.players}
          renderItem={renderPlayer}
          keyExtractor={(item) => item.id}
          style={styles.playerList}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setIsJoining(false);
            // TODO: Leave match
          }}
        >
          <Text style={styles.buttonText}>LEAVE LOBBY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Join Game</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor="#999"
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleJoinMatch}
          disabled={!isConnected}
        >
          {!isConnected ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>FIND MATCH</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => Alert.alert('Coming Soon', 'Private matches coming soon!')}
        >
          <Text style={styles.buttonText}>JOIN WITH CODE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>BACK</Text>
        </TouchableOpacity>
      </View>

      {!isConnected && (
        <Text style={styles.connectionStatus}>Connecting to server...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 30,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 15,
    fontSize: 18,
    color: '#FFF',
    borderWidth: 2,
    borderColor: '#0f3460',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#1B5E20',
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: '#1565C0',
    borderColor: '#0D47A1',
  },
  backButton: {
    backgroundColor: '#616161',
    borderColor: '#424242',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  playerList: {
    width: '100%',
    maxWidth: 400,
    marginVertical: 20,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213e',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  playerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerStatus: {
    color: '#4CAF50',
    fontSize: 14,
  },
  connectionStatus: {
    position: 'absolute',
    bottom: 20,
    color: '#FF9800',
    fontSize: 14,
  },
});

export default Lobby;