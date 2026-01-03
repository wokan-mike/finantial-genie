import { InstallmentPurchaseSchema, InstallmentPaymentSchema } from '../database/schema';
import { addMonths, parseISO, format, isBefore, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export const calculateMonthlyPayment = (totalAmount: number, numberOfMonths: number): number => {
  if (numberOfMonths <= 0) return 0;
  return totalAmount / numberOfMonths;
};

export const generateInstallmentPayments = (
  purchase: InstallmentPurchaseSchema
): Omit<InstallmentPaymentSchema, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const payments: Omit<InstallmentPaymentSchema, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const startDate = parseISO(purchase.startDate);
  const monthlyPayment = purchase.monthlyPayment;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);

  let paymentNumber = 1;
  let monthsGenerated = 0;

  // Calculate how many months have passed since start date (including current month)
  let currentMonth = startDate;
  while (monthsGenerated < purchase.numberOfMonths) {
    const monthDate = addMonths(startDate, monthsGenerated);
    const isInCurrentMonth = isWithinInterval(monthDate, { start: currentMonthStart, end: currentMonthEnd });
    const isPast = isBefore(monthDate, todayStart);
    
    // Skip if it's in the past or current month (those will be transactions, not pending payments)
    if (isPast || isInCurrentMonth) {
      monthsGenerated++;
      paymentNumber++;
    } else {
      break; // We've reached future months
    }
  }

  // Generate only future payments (after current month)
  const remainingMonths = purchase.numberOfMonths - monthsGenerated;
  
  for (let i = 0; i < remainingMonths; i++) {
    const dueDate = addMonths(startDate, monthsGenerated + i);
    // Only add if the due date is after the current month
    if (!isWithinInterval(dueDate, { start: currentMonthStart, end: currentMonthEnd }) && !isBefore(dueDate, todayStart)) {
      payments.push({
        installmentPurchaseId: purchase.id,
        amount: monthlyPayment,
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        paidDate: null,
        status: 'pending',
        paymentNumber: paymentNumber + i,
      });
    }
  }

  return payments;
};

export interface PastMonthTransaction {
  amount: number;
  date: string; // ISO date string
  paymentNumber: number;
}

export const generatePastMonthTransactions = (
  purchase: InstallmentPurchaseSchema
): PastMonthTransaction[] => {
  const transactions: PastMonthTransaction[] = [];
  const startDate = parseISO(purchase.startDate);
  const monthlyPayment = purchase.monthlyPayment;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const currentMonthStart = startOfMonth(today);
  const currentMonthEnd = endOfMonth(today);

  // Generate transactions for past months AND current month
  for (let i = 0; i < purchase.numberOfMonths; i++) {
    const dueDate = addMonths(startDate, i);
    const isInCurrentMonth = isWithinInterval(dueDate, { start: currentMonthStart, end: currentMonthEnd });
    const isPast = isBefore(dueDate, todayStart);
    
    // Add if the due date is in the past OR in the current month
    if (isPast || isInCurrentMonth) {
      transactions.push({
        amount: monthlyPayment,
        date: format(dueDate, 'yyyy-MM-dd'),
        paymentNumber: i + 1,
      });
    }
  }

  return transactions;
};

export const getPaymentsForCurrentMonth = (
  payments: InstallmentPaymentSchema[]
): InstallmentPaymentSchema[] => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  return payments.filter(payment => {
    if (payment.status !== 'pending') return false;
    const dueDate = parseISO(payment.dueDate);
    return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
  });
};

export const calculateTotalPending = (payments: InstallmentPaymentSchema[]): number => {
  return payments
    .filter(payment => payment.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0);
};

export const getPaymentsDueInPeriod = (
  payments: InstallmentPaymentSchema[],
  startDate: string,
  endDate: string
): InstallmentPaymentSchema[] => {
  return payments.filter(payment => {
    return payment.status === 'pending' && payment.dueDate >= startDate && payment.dueDate <= endDate;
  });
};

