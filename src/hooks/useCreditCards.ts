import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { CreditCardSchema } from '../services/database/schema';

export const useCreditCards = () => {
  const [creditCards, setCreditCards] = useState<CreditCardSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCreditCards = async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      const data = await db.creditCards.getAll();
      setCreditCards(data);
      setError(null);
    } catch (err) {
      console.error('Error loading credit cards:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar tarjetas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreditCards();
  }, []);

  const createCreditCard = async (data: Omit<CreditCardSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const db = await getDatabase();
      const newCard = await db.creditCards.create(data);
      await loadCreditCards();
      return newCard;
    } catch (err) {
      console.error('Error creating credit card:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al crear tarjeta');
    }
  };

  const updateCreditCard = async (id: string, data: Partial<CreditCardSchema>) => {
    try {
      const db = await getDatabase();
      const updated = await db.creditCards.update(id, data);
      setCreditCards(prev => prev.map(card => card.id === id ? updated : card));
      return updated;
    } catch (err) {
      console.error('Error updating credit card:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar tarjeta');
    }
  };

  const deleteCreditCard = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.creditCards.delete(id);
      setCreditCards(prev => prev.filter(card => card.id !== id));
    } catch (err) {
      console.error('Error deleting credit card:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar tarjeta');
    }
  };

  const getActiveCards = () => {
    return creditCards.filter(card => card.isActive);
  };

  return {
    creditCards,
    activeCards: getActiveCards(),
    loading,
    error,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    refresh: loadCreditCards,
  };
};
