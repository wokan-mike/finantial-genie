// No polyfills needed - using AsyncStorage for mobile and Dexie (IndexedDB) for web

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);

