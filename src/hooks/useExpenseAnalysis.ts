import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { useTransactions } from './useTransactions';
import { analyzeExpensesByCategory, getTopCategories, compareMonthToMonth } from '../services/calculations/expenseAnalysis';
import { CategoryExpense } from '../services/calculations/expenseAnalysis';
import { CategorySchema } from '../services/database/schema';

export const useExpenseAnalysis = (year?: number, month?: number) => {
  const { transactions } = useTransactions();
  const [categories, setCategories] = useState<CategorySchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const db = await getDatabase();
        const data = await db.categories.getAll();
        setCategories(data);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  const categoryExpenses = analyzeExpensesByCategory(
    transactions,
    categories.map(cat => ({ id: cat.id, name: cat.name })),
    year,
    month
  );

  const topCategories = getTopCategories(categoryExpenses, 5);

  const getMonthComparison = (currentYear: number, currentMonth: number) => {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const current = analyzeExpensesByCategory(
      transactions,
      categories.map(cat => ({ id: cat.id, name: cat.name })),
      currentYear,
      currentMonth
    );

    const previous = analyzeExpensesByCategory(
      transactions,
      categories.map(cat => ({ id: cat.id, name: cat.name })),
      prevYear,
      prevMonth
    );

    return compareMonthToMonth(current, previous);
  };

  return {
    categoryExpenses,
    topCategories,
    getMonthComparison,
    loading,
  };
};

