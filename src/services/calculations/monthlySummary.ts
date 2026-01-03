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
  const today = new Date();
  const isCurrentMonth = isSameMonth(new Date(year, month - 1), today);

  const monthTransactions = transactions.filter(txn => {
    const txnDate = parseISO(txn.date);
    const isInMonth = isWithinInterval(txnDate, { start: monthStart, end: monthEnd });
    
    // If it's a credit card expense in the current month, check if it has passed the cut date
    if (txn.creditCardId && txn.type === 'expense' && isCurrentMonth) {
      const card = creditCards.find(c => c.id === txn.creditCardId);
      if (card) {
        const lastCutDate = getLastCutDate(card, today);
        // Only include if transaction date is after the last cut date
        return isInMonth && txnDate >= lastCutDate;
      }
    }
    
    return isInMonth;
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

