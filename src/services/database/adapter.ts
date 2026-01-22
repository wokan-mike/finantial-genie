import { Platform } from 'react-native';
import { DatabaseAdapter } from './adapter.interface';
import { DexieAdapter } from './dexieAdapter';
import { AsyncStorageAdapter } from './asyncStorageAdapter';

let databaseAdapter: DatabaseAdapter | null = null;

export const getDatabase = async (): Promise<DatabaseAdapter> => {
  if (databaseAdapter) {
    return databaseAdapter;
  }

  // Use Dexie (IndexedDB) for web, AsyncStorage for mobile
  if (Platform.OS === 'web') {
    databaseAdapter = new DexieAdapter();
  } else {
    // Use AsyncStorage for mobile (works with Expo Go)
    databaseAdapter = new AsyncStorageAdapter();
  }

  await databaseAdapter.initialize();
  return databaseAdapter;
};

export const resetDatabase = (): void => {
  databaseAdapter = null;
};

