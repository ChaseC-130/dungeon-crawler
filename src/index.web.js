import { AppRegistry } from 'react-native';
import App from '../App';

const appName = 'dungeon-crawler';

// Register the app
AppRegistry.registerComponent(appName, () => App);

// Run the app in web environment
AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});