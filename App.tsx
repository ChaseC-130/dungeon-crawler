import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import MainMenu from './src/screens/MainMenu';
import Lobby from './src/screens/Lobby';
import Game from './src/screens/Game';
import { GameProvider } from './src/contexts/GameContext';

SplashScreen.preventAutoHideAsync();

export type RootStackParamList = {
  MainMenu: undefined;
  Lobby: undefined;
  Game: { matchId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  React.useEffect(() => {
    async function prepare() {
      try {
        // Pre-load assets
        const imageAssets = Asset.loadAsync([
          require('./assets/backgrounds/battle1.png'),
          require('./assets/backgrounds/battle2.png'),
          require('./assets/backgrounds/battle3.png'),
          require('./assets/backgrounds/battle4.png'),
        ]);

        await Promise.all([imageAssets]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <GameProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="MainMenu"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainMenu" component={MainMenu} />
          <Stack.Screen name="Lobby" component={Lobby} />
          <Stack.Screen name="Game" component={Game} />
        </Stack.Navigator>
        <StatusBar style="light" />
      </NavigationContainer>
    </GameProvider>
  );
}