import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { TransactionSchema } from '../services/database/schema';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<TransactionSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async () => {
    try {
      console.log('[loadTransactions] Starting load...');
      setLoading(true);
      const db = await getDatabase();
      const data = await db.transactions.getAll();
      console.log('[loadTransactions] Loaded transactions:', data.length);
      setTransactions(data);
      setError(null);
    } catch (err) {
      console.error('[loadTransactions] Error:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
    } finally {
      setLoading(false);
      console.log('[loadTransactions] Loading completed');
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const createTransaction = async (data: Omit<TransactionSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const db = await getDatabase();
      const newTransaction = await db.transactions.create(data);
      await loadTransactions(); // Reload to ensure consistency
      return newTransaction;
    } catch (err) {
      console.error('Error creating transaction:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al crear transacción');
    }
  };

  const updateTransaction = async (id: string, data: Partial<TransactionSchema>) => {
    try {
      const db = await getDatabase();
      const updated = await db.transactions.update(id, data);
      setTransactions(prev => prev.map(txn => txn.id === id ? updated : txn));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar transacción');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      console.log('[deleteTransaction] Starting delete for id:', id);
      const db = await getDatabase();
      console.log('[deleteTransaction] Database obtained');
      
      // Verify the transaction exists before deleting
      const existing = await db.transactions.getById(id);
      console.log('[deleteTransaction] Existing transaction:', existing);
      
      if (!existing) {
        console.error('[deleteTransaction] Transaction not found:', id);
        throw new Error('Transacción no encontrada');
      }
      
      console.log('[deleteTransaction] Transaction found, calling delete...');
      await db.transactions.delete(id);
      console.log('[deleteTransaction] Delete call completed');
      
      // Update local state immediately
      console.log('[deleteTransaction] Updating local state, current count:', transactions.length);
      setTransactions(prev => {
        const filtered = prev.filter(txn => txn.id !== id);
        console.log('[deleteTransaction] Previous count:', prev.length, 'New count:', filtered.length);
        return filtered;
      });
      
      // Reload to ensure consistency
      console.log('[deleteTransaction] Reloading transactions...');
      await loadTransactions();
      console.log('[deleteTransaction] Complete');
    } catch (err) {
      console.error('[deleteTransaction] Error:', err);
      console.error('[deleteTransaction] Error stack:', err instanceof Error ? err.stack : 'No stack');
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar transacción');
    }
  };

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: loadTransactions,
  };
};

