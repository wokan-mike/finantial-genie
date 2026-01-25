import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { AssetSchema, LiabilitySchema } from '../services/database/schema';

export const useAssets = () => {
  const [assets, setAssets] = useState<AssetSchema[]>([]);
  const [liabilities, setLiabilities] = useState<LiabilitySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      const [assetsData, liabilitiesData] = await Promise.all([
        db.assets.getAll(),
        db.liabilities.getAll(),
      ]);
      
      // Migrate old assets to new schema with default values
      const assetsToMigrate: Array<{ id: string; updates: Partial<AssetSchema> }> = [];
      const migratedAssets = assetsData.map(asset => {
        // If asset doesn't have new fields, add defaults based on type
        if (asset.liquidity === undefined || asset.annualValueChange === undefined || asset.purchaseDate === undefined) {
          // Determine defaults based on type (matching AssetForm defaults)
          let defaultLiquidity: 1 | 2 | 3 | 4 | 5 = 3;
          let defaultAnnualChange: number | null = 0;
          
          if (asset.type === 'cash' || asset.type === 'bank') {
            defaultLiquidity = 1;
            defaultAnnualChange = -5; // Inflation loss
          } else if (asset.type === 'real_estate') {
            defaultLiquidity = 5;
            defaultAnnualChange = 0;
          } else if (asset.type === 'vehicle') {
            defaultLiquidity = 4;
            defaultAnnualChange = -15; // Depreciation
          } else if (asset.type === 'motorcycle') {
            defaultLiquidity = 4;
            defaultAnnualChange = -20; // Depreciation
          } else if (asset.type === 'investment') {
            defaultLiquidity = 2;
            defaultAnnualChange = null; // Should come from investments page
          } else if (asset.type === 'other') {
            defaultLiquidity = 3;
            defaultAnnualChange = 0;
          }
          
          const updates: Partial<AssetSchema> = {
            liquidity: asset.liquidity ?? defaultLiquidity,
            annualValueChange: asset.annualValueChange ?? defaultAnnualChange,
            purchaseDate: asset.purchaseDate ?? null,
          };
          
          assetsToMigrate.push({ id: asset.id, updates });
          
          return {
            ...asset,
            ...updates,
          };
        }
        return asset;
      });
      
      // Update assets in database if needed
      if (assetsToMigrate.length > 0) {
        Promise.all(
          assetsToMigrate.map(({ id, updates }) => db.assets.update(id, updates))
        ).catch(console.error);
      }
      
      setAssets(migratedAssets);
      setLiabilities(liabilitiesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar patrimonio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createAsset = async (data: Omit<AssetSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const db = await getDatabase();
      const newAsset = await db.assets.create(data);
      setAssets(prev => [...prev, newAsset]);
      return newAsset;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear activo');
    }
  };

  const updateAsset = async (id: string, data: Partial<AssetSchema>) => {
    try {
      const db = await getDatabase();
      const updated = await db.assets.update(id, data);
      setAssets(prev => prev.map(asset => asset.id === id ? updated : asset));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar activo');
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.assets.delete(id);
      setAssets(prev => prev.filter(asset => asset.id !== id));
      // Reload to ensure consistency
      await loadData();
    } catch (err) {
      console.error('Error deleting asset:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar activo');
    }
  };

  const createLiability = async (data: Omit<LiabilitySchema, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const db = await getDatabase();
      const newLiability = await db.liabilities.create(data);
      setLiabilities(prev => [...prev, newLiability]);
      return newLiability;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear pasivo');
    }
  };

  const updateLiability = async (id: string, data: Partial<LiabilitySchema>) => {
    try {
      const db = await getDatabase();
      const updated = await db.liabilities.update(id, data);
      setLiabilities(prev => prev.map(liab => liab.id === id ? updated : liab));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar pasivo');
    }
  };

  const deleteLiability = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.liabilities.delete(id);
      setLiabilities(prev => prev.filter(liab => liab.id !== id));
      // Reload to ensure consistency
      await loadData();
    } catch (err) {
      console.error('Error deleting liability:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar pasivo');
    }
  };

  return {
    assets,
    liabilities,
    loading,
    error,
    createAsset,
    updateAsset,
    deleteAsset,
    createLiability,
    updateLiability,
    deleteLiability,
    refresh: loadData,
  };
};

