import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { RecurringExpenseSchema } from '../services/database/schema';
import { generatePastMonthTransactions, generateFutureMonthTransactions } from '../services/calculations/recurringExpenseCalculator';

export const useRecurringExpenses = () => {
  const [expenses, setExpenses] = useState<RecurringExpenseSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      const expensesData = await db.recurringExpenses.getAll();
      setExpenses(expensesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cargos recurrentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createExpense = async (data: Omit<RecurringExpenseSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('[useRecurringExpenses.createExpense] Starting with data:', data);
      const db = await getDatabase();
      const expense = await db.recurringExpenses.create(data);
      console.log('[useRecurringExpenses.createExpense] Expense created:', expense);

      // Generate transactions for past months (including current month)
      const pastTransactions = generatePastMonthTransactions(expense);
      console.log('[useRecurringExpenses.createExpense] Generated past month transactions:', pastTransactions.length);
      
      if (pastTransactions.length > 0) {
        const createdPastTransactions = await Promise.all(
          pastTransactions.map(pastTxn => db.transactions.create({
            type: 'expense',
            amount: pastTxn.amount,
            description: expense.name,
            tags: [],
            date: pastTxn.date,
            isRecurring: true,
            creditCardId: null,
          }))
        );
        console.log('[useRecurringExpenses.createExpense] Past transactions created:', createdPastTransactions.length);
      }

      // Generate transactions for future months (up to 12 months ahead)
      const futureTransactions = generateFutureMonthTransactions(expense, 12);
      console.log('[useRecurringExpenses.createExpense] Generated future month transactions:', futureTransactions.length);
      
      if (futureTransactions.length > 0) {
        const createdFutureTransactions = await Promise.all(
          futureTransactions.map(futureTxn => db.transactions.create({
            type: 'expense',
            amount: futureTxn.amount,
            description: expense.name,
            tags: [],
            date: futureTxn.date,
            isRecurring: true,
            creditCardId: null,
          }))
        );
        console.log('[useRecurringExpenses.createExpense] Future transactions created:', createdFutureTransactions.length);
      }

      setExpenses(prev => [...prev, expense]);
      await loadData();
      return expense;
    } catch (err) {
      console.error('[useRecurringExpenses.createExpense] Error:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al crear cargo recurrente');
    }
  };

  const updateExpense = async (id: string, data: Partial<RecurringExpenseSchema>) => {
    try {
      console.log('[useRecurringExpenses.updateExpense] Starting update for expense:', id, 'with data:', data);
      const db = await getDatabase();
      
      // Get the existing expense
      const existingExpense = await db.recurringExpenses.getById(id);
      if (!existingExpense) {
        throw new Error('Cargo recurrente no encontrado');
      }
      
      const updated = await db.recurringExpenses.update(id, data);
      console.log('[useRecurringExpenses.updateExpense] Expense updated:', updated);
      
      // Check if any critical fields changed that would require regenerating transactions
      const needsRegeneration = 
        data.monthlyAmount !== undefined ||
        data.paymentDay !== undefined ||
        data.startDate !== undefined ||
        data.endDate !== undefined ||
        data.name !== undefined;
      
      if (needsRegeneration) {
        console.log('[useRecurringExpenses.updateExpense] Regenerating transactions...');
        
        // Delete old transactions
        const allTransactions = await db.transactions.getAll();
        const relatedTransactions = allTransactions.filter(txn => 
          txn.type === 'expense' && 
          txn.isRecurring &&
          txn.description === existingExpense.name
        );
        
        console.log('[useRecurringExpenses.updateExpense] Found old transactions to delete:', relatedTransactions.length);
        
        for (const txn of relatedTransactions) {
          await db.transactions.delete(txn.id);
        }
        
        // Generate new transactions with updated data
        const mergedExpense = { ...existingExpense, ...updated };
        
        // Generate past transactions
        const pastTransactions = generatePastMonthTransactions(mergedExpense);
        console.log('[useRecurringExpenses.updateExpense] Generated past transactions:', pastTransactions.length);
        
        if (pastTransactions.length > 0) {
          await Promise.all(
            pastTransactions.map(pastTxn => db.transactions.create({
              type: 'expense',
              amount: pastTxn.amount,
              description: mergedExpense.name,
              tags: [],
              date: pastTxn.date,
              isRecurring: true,
              creditCardId: null,
            }))
          );
        }
        
        // Generate future transactions
        const futureTransactions = generateFutureMonthTransactions(mergedExpense, 12);
        console.log('[useRecurringExpenses.updateExpense] Generated future transactions:', futureTransactions.length);
        
        if (futureTransactions.length > 0) {
          await Promise.all(
            futureTransactions.map(futureTxn => db.transactions.create({
              type: 'expense',
              amount: futureTxn.amount,
              description: mergedExpense.name,
              tags: [],
              date: futureTxn.date,
              isRecurring: true,
              creditCardId: null,
            }))
          );
        }
      }
      
      setExpenses(prev => prev.map(e => e.id === id ? updated : e));
      await loadData();
      return updated;
    } catch (err) {
      console.error('[useRecurringExpenses.updateExpense] Error:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar cargo recurrente');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      console.log('[useRecurringExpenses.deleteExpense] Starting deletion for expense:', id);
      const db = await getDatabase();
      
      // Get the expense first to find related transactions
      const expense = await db.recurringExpenses.getById(id);
      if (!expense) {
        throw new Error('Cargo recurrente no encontrado');
      }
      
      console.log('[useRecurringExpenses.deleteExpense] Expense found:', expense.name);
      
      // Find and delete related transactions
      // Transactions are created with description matching the expense name
      const allTransactions = await db.transactions.getAll();
      const relatedTransactions = allTransactions.filter(txn => 
        txn.type === 'expense' && 
        txn.isRecurring &&
        txn.description === expense.name
      );
      
      console.log('[useRecurringExpenses.deleteExpense] Found related transactions:', relatedTransactions.length);
      
      // Delete related transactions
      for (const txn of relatedTransactions) {
        await db.transactions.delete(txn.id);
        console.log('[useRecurringExpenses.deleteExpense] Deleted transaction:', txn.id);
      }
      
      // Delete the expense
      await db.recurringExpenses.delete(id);
      console.log('[useRecurringExpenses.deleteExpense] Expense deleted');
      
      setExpenses(prev => prev.filter(e => e.id !== id));
      await loadData();
      console.log('[useRecurringExpenses.deleteExpense] Deletion completed');
    } catch (err) {
      console.error('[useRecurringExpenses.deleteExpense] Error:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar cargo recurrente');
    }
  };

  const activeExpenses = expenses.filter(e => e.isActive);

  return {
    expenses,
    activeExpenses,
    loading,
    error,
    createExpense,
    updateExpense,
    deleteExpense,
    refresh: loadData,
  };
};
