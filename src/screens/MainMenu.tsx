import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';

type MainMenuNavigationProp = StackNavigationProp<RootStackParamList, 'MainMenu'>;

const { width, height } = Dimensions.get('window');

const MainMenu: React.FC = () => {
  const navigation = useNavigation<MainMenuNavigationProp>();

  const handlePlayPress = () => {
    navigation.navigate('Lobby');
  };

  return (
    <ImageBackground
      source={require('../../assets/backgrounds/battle1.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>DUNGEON</Text>
          <Text style={styles.title}>CRAWLER</Text>
          <Text style={styles.subtitle}>Autobattler Adventure</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.button} onPress={handlePlayPress}>
            <Text style={styles.buttonText}>PLAY</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>TUTORIAL</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>SETTINGS</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.exitButton]}>
            <Text style={styles.buttonText}>EXIT</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  titleContainer: {
    marginBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFF',
    marginTop: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
  menuContainer: {
    width: 300,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  exitButton: {
    backgroundColor: '#B71C1C',
    borderColor: '#7F0000',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },
  version: {
    position: 'absolute',
    bottom: 20,
    color: '#AAA',
    fontSize: 12,
  },
});

export default MainMenu;