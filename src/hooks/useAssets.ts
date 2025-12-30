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
      setAssets(assetsData);
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

