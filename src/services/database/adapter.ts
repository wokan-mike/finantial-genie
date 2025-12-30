import { Platform } from 'react-native';
import { DatabaseAdapter } from './adapter.interface';
import { DexieAdapter } from './dexieAdapter';

// For now, we'll use Dexie for both platforms
// WatermelonDB adapter can be added later for better mobile performance
let databaseAdapter: DatabaseAdapter | null = null;

export const getDatabase = async (): Promise<DatabaseAdapter> => {
  if (databaseAdapter) {
    return databaseAdapter;
  }

  // For now, use Dexie for both web and mobile
  // TODO: Add WatermelonDB adapter for mobile when needed
  if (Platform.OS === 'web') {
    databaseAdapter = new DexieAdapter();
  } else {
    // For mobile, we can use Dexie for now, or implement WatermelonDB later
    // WatermelonDB requires more setup with @nozbe/watermelondb models
    databaseAdapter = new DexieAdapter();
  }

  await databaseAdapter.initialize();
  return databaseAdapter;
};

export const resetDatabase = (): void => {
  databaseAdapter = null;
};

