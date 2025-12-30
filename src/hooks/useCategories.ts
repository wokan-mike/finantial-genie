import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { CategorySchema } from '../services/database/schema';

export const useCategories = () => {
  const [categories, setCategories] = useState<CategorySchema[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      const data = await db.categories.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    loading,
    refresh: loadCategories,
  };
};

