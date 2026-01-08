import { RecurringExpenseSchema, TransactionSchema } from '../database/schema';
import { parseISO, format, isBefore, startOfMonth, endOfMonth, isWithinInterval, addMonths, setDate, getYear, getMonth, isAfter } from 'date-fns';

export interface RecurringExpenseTransaction {
  amount: number;
  date: string; // ISO date string
  month: number; // Month number (1-12)
  year: number;
}

/**
 * Generate transactions for past months (from start date to current month)
 */
export const generatePastMonthTransactions = (
  expense: RecurringExpenseSchema
): RecurringExpenseTransaction[] => {
  const transactions: RecurringExpenseTransaction[] = [];
  const startDate = parseISO(expense.startDate);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);

  // Start from the first month of the expense
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  // Generate transactions for all months from start date to current month (inclusive)
  while (currentMonth <= currentMonthEnd) {
    // Check if we've passed the end date
    if (expense.endDate) {
      const endDate = parseISO(expense.endDate);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      if (currentMonth > endMonth) {
        break;
      }
    }

    // Calculate the payment date for this month
    // Use the payment day, but if it's beyond the last day of the month, use the last day
    const lastDayOfMonth = endOfMonth(currentMonth).getDate();
    const paymentDay = Math.min(expense.paymentDay, lastDayOfMonth);
    const paymentDate = setDate(new Date(currentMonth), paymentDay);
    paymentDate.setHours(0, 0, 0, 0);

    // Only add if the payment date is in the past or current month
    if (isBefore(paymentDate, todayStart) || isWithinInterval(paymentDate, { start: currentMonthStart, end: currentMonthEnd })) {
      transactions.push({
        amount: expense.monthlyAmount,
        date: format(paymentDate, 'yyyy-MM-dd'),
        month: getMonth(currentMonth) + 1,
        year: getYear(currentMonth),
      });
    }

    // Move to next month
    currentMonth = addMonths(currentMonth, 1);
  }

  return transactions;
};

/**
 * Generate transactions for future months (from next month to end date or a reasonable limit)
 */
export const generateFutureMonthTransactions = (
  expense: RecurringExpenseSchema,
  maxMonthsAhead: number = 12
): RecurringExpenseTransaction[] => {
  const transactions: RecurringExpenseTransaction[] = [];
  const today = new Date();
  const currentMonthEnd = endOfMonth(today);
  const nextMonthStart = addMonths(startOfMonth(today), 1);
  
  // Start from the expense start date or next month, whichever is later
  const startDate = parseISO(expense.startDate);
  const expenseStartMonth = startOfMonth(startDate);
  
  // Determine starting month: use the later of expense start month or next month
  let currentMonth = expenseStartMonth > nextMonthStart ? expenseStartMonth : nextMonthStart;
  
  // Determine end date: use expense.endDate if available, otherwise use maxMonthsAhead months from now
  let endDate: Date;
  if (expense.endDate) {
    endDate = parseISO(expense.endDate);
  } else {
    endDate = addMonths(today, maxMonthsAhead);
  }
  
  const endMonth = endOfMonth(endDate);

  // Generate transactions for future months
  while (currentMonth <= endMonth) {
    // Check if we've passed the end date
    if (expense.endDate) {
      const endDateParsed = parseISO(expense.endDate);
      const endMonthParsed = new Date(endDateParsed.getFullYear(), endDateParsed.getMonth(), 1);
      if (currentMonth > endMonthParsed) {
        break;
      }
    }

    // Calculate the payment date for this month
    const lastDayOfMonth = endOfMonth(currentMonth).getDate();
    const paymentDay = Math.min(expense.paymentDay, lastDayOfMonth);
    const paymentDate = setDate(new Date(currentMonth), paymentDay);
    paymentDate.setHours(0, 0, 0, 0);

    // Only add if the payment date is in the future (after current month end)
    if (isAfter(paymentDate, currentMonthEnd)) {
      transactions.push({
        amount: expense.monthlyAmount,
        date: format(paymentDate, 'yyyy-MM-dd'),
        month: getMonth(currentMonth) + 1,
        year: getYear(currentMonth),
      });
    }

    // Move to next month
    currentMonth = addMonths(currentMonth, 1);
  }

  return transactions;
};
