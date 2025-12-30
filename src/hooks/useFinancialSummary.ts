import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { useTransactions } from './useTransactions';
import { calculateMonthlySummary } from '../services/calculations/monthlySummary';
import { calculateNetWorth } from '../services/calculations/netWorth';
import { useInstallments } from './useInstallments';
import { calculateBiweeklyAvailability, getMonthlyIncome } from '../services/calculations/biweeklyAvailability';
import { getMonth, getYear } from 'date-fns';

export const useFinancialSummary = () => {
  const { transactions } = useTransactions();
  const { totalPending: installmentTotalPending } = useInstallments();
  const [assets, setAssets] = useState([]);
  const [liabilities, setLiabilities] = useState([]);
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const db = await getDatabase();
        const [assetsData, liabilitiesData, fixedExpensesData] = await Promise.all([
          db.assets.getAll(),
          db.liabilities.getAll(),
          db.fixedExpenses.getAll(),
        ]);
        setAssets(assetsData);
        setLiabilities(liabilitiesData);
        setFixedExpenses(fixedExpensesData);
      } catch (err) {
        console.error('Error loading summary data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const currentYear = getYear(new Date());
  const currentMonth = getMonth(new Date()) + 1; // getMonth returns 0-11, we need 1-12

  const monthlySummary = calculateMonthlySummary(transactions, currentYear, currentMonth);
  const netWorth = calculateNetWorth(assets, liabilities);
  const monthlyIncome = getMonthlyIncome(transactions, currentYear, currentMonth);

  // Calculate biweekly availability for current period
  const biweeklyAvailability = calculateBiweeklyAvailability(
    monthlyIncome,
    fixedExpenses,
    [], // installment payments will be loaded separately
    currentYear,
    currentMonth,
    1 // First biweekly period
  );

  return {
    monthlySummary,
    netWorth,
    monthlyIncome,
    biweeklyAvailability,
    installmentTotalPending,
    loading,
  };
};

