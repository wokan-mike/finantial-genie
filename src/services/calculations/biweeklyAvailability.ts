import { FixedExpenseSchema } from '../database/schema';
import { InstallmentPaymentSchema } from '../database/schema';
import { TransactionSchema } from '../database/schema';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { FREQUENCY_TYPES } from '../../utils/constants';

interface BiweeklyPeriod {
  start: Date;
  end: Date;
}

const getBiweeklyPeriods = (year: number, month: number): [BiweeklyPeriod, BiweeklyPeriod] => {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const midMonth = new Date(year, month - 1, 15);

  return [
    { start: monthStart, end: endOfDay(midMonth) },
    { start: startOfDay(new Date(year, month - 1, 16)), end: monthEnd },
  ];
};

export const calculateBiweeklyIncome = (monthlyIncome: number): number => {
  return monthlyIncome / 2;
};

export const calculateFixedExpensesForPeriod = (
  fixedExpenses: FixedExpenseSchema[],
  periodStart: Date,
  periodEnd: Date
): number => {
  let total = 0;

  for (const expense of fixedExpenses) {
    const expenseStart = parseISO(expense.startDate);
    const expenseEnd = expense.endDate ? parseISO(expense.endDate) : null;

    // Check if expense is active in this period
    if (expenseEnd && expenseEnd < periodStart) continue;
    if (expenseStart > periodEnd) continue;

    if (expense.frequency === FREQUENCY_TYPES.MONTHLY) {
      total += expense.amount / 2; // Half for biweekly
    } else if (expense.frequency === FREQUENCY_TYPES.BIWEEKLY) {
      total += expense.amount;
    } else if (expense.frequency === FREQUENCY_TYPES.YEARLY) {
      total += expense.amount / 24; // Approximate biweekly
    }
  }

  return total;
};

export const calculateInstallmentPaymentsForPeriod = (
  payments: InstallmentPaymentSchema[],
  periodStart: Date,
  periodEnd: Date
): number => {
  return payments
    .filter(payment => {
      if (payment.status !== 'pending') return false;
      const dueDate = parseISO(payment.dueDate);
      return isWithinInterval(dueDate, { start: periodStart, end: periodEnd });
    })
    .reduce((sum, payment) => sum + payment.amount, 0);
};

export const calculateBiweeklyAvailability = (
  monthlyIncome: number,
  fixedExpenses: FixedExpenseSchema[],
  installmentPayments: InstallmentPaymentSchema[],
  year: number,
  month: number,
  periodNumber: 1 | 2
): number => {
  const periods = getBiweeklyPeriods(year, month);
  const period = periods[periodNumber - 1];

  const biweeklyIncome = calculateBiweeklyIncome(monthlyIncome);
  const fixedExpensesAmount = calculateFixedExpensesForPeriod(fixedExpenses, period.start, period.end);
  const installmentPaymentsAmount = calculateInstallmentPaymentsForPeriod(
    installmentPayments,
    period.start,
    period.end
  );

  return biweeklyIncome - fixedExpensesAmount - installmentPaymentsAmount;
};

export const getMonthlyIncome = (transactions: TransactionSchema[], year: number, month: number): number => {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));

  return transactions
    .filter(txn => {
      if (txn.type !== 'income') return false;
      const txnDate = parseISO(txn.date);
      return isWithinInterval(txnDate, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, txn) => sum + txn.amount, 0);
};

