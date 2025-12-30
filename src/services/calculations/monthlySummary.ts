import { TransactionSchema } from '../database/schema';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export interface MonthlySummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export const calculateMonthlySummary = (
  transactions: TransactionSchema[],
  year: number,
  month: number
): MonthlySummary => {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));

  const monthTransactions = transactions.filter(txn => {
    const txnDate = parseISO(txn.date);
    return isWithinInterval(txnDate, { start: monthStart, end: monthEnd });
  });

  const totalIncome = monthTransactions
    .filter(txn => txn.type === 'income')
    .reduce((sum, txn) => sum + txn.amount, 0);

  const totalExpenses = monthTransactions
    .filter(txn => txn.type === 'expense')
    .reduce((sum, txn) => sum + txn.amount, 0);

  return {
    year,
    month,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: monthTransactions.length,
  };
};

