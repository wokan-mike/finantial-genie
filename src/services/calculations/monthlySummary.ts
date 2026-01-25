import { TransactionSchema, CreditCardSchema } from '../database/schema';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, isSameMonth } from 'date-fns';
import { getLastCutDate } from './creditCardExpenses';

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
  month: number,
  creditCards: CreditCardSchema[] = []
): MonthlySummary => {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));

  // Include ALL transactions that occurred in the month, regardless of credit card billing cycles
  // The monthly summary should show actual cash flow for the month
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

