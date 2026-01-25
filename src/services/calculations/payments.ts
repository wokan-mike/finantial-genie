import { TransactionSchema, InstallmentPaymentSchema, InstallmentPurchaseSchema, CreditCardSchema, RecurringExpenseSchema } from '../database/schema';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval, getYear, getMonth, addDays, subMonths, isAfter, isBefore, setDate } from 'date-fns';
import { getPaymentDueDate, getLastCutDate, getNextCutDate } from './creditCardExpenses';
import { getMonthlyIncome } from './biweeklyAvailability';

export interface RecurringExpensePayment {
  expenseId: string;
  expenseName: string;
  expenseType: RecurringExpenseSchema['type'];
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
}

export interface PaymentSummary {
  monthIncome: number;
  creditCardPayments: CreditCardPayment[];
  installmentPayments: InstallmentPayment[];
  recurringExpensePayments: RecurringExpensePayment[];
  totalCreditCardPayments: number;
  totalInstallmentPayments: number;
  totalRecurringExpensePayments: number;
  totalPayments: number;
  availableAfterPayments: number;
}

export interface CreditCardPayment {
  paymentId?: string; // ID if payment is tracked in database
  cardId: string;
  cardName: string;
  cardColor: string;
  bank: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  normalExpenses: number;
  installmentExpenses: number;
  status?: 'pending' | 'paid';
  paidDate?: string | null;
  billingCycleStart: Date;
  billingCycleEnd: Date;
}

export interface InstallmentPayment {
  paymentId: string; // ID of the InstallmentPaymentSchema
  purchaseId: string;
  purchaseName: string;
  amount: number;
  dueDate: Date;
  paymentNumber: number;
  daysUntilDue: number;
  status: 'pending' | 'paid';
  paidDate: string | null;
}

/**
 * Calculate payments due this month
 */
export const calculatePaymentsForMonth = (
  transactions: TransactionSchema[],
  installmentPayments: InstallmentPaymentSchema[],
  installmentPurchases: InstallmentPurchaseSchema[],
  creditCards: CreditCardSchema[],
  recurringExpenses: RecurringExpenseSchema[],
  year: number,
  month: number
): PaymentSummary => {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const today = new Date();
  
  // Calculate monthly income
  const monthIncome = getMonthlyIncome(transactions, year, month);
  
  // Calculate credit card payments for the SELECTED month
  // We need to find the billing cycle whose payment is due in the selected month
  const referenceDate = new Date(year, month - 1, 15); // Use middle of month as reference
  const creditCardPayments: CreditCardPayment[] = [];
  
  for (const card of creditCards.filter(c => c.isActive)) {
    // Work backwards: find the cut date that results in a payment due in the selected month
    // Payment due date = cut date + paymentDays
    // So we need: cut date = payment due date - paymentDays
    
    // Try to find a cut date in the selected month or previous month that results in payment due in selected month
    // We'll check a few potential cut dates around the estimated date
    
    let foundCycle = false;
    let cycleCutDate: Date | null = null;
    let paymentDueDate: Date | null = null;
    let cycleStartDate: Date | null = null;
    let cycleEndDate: Date | null = null;
    
    // Try cut dates from 2 months before to 1 month after the selected month
    for (let monthOffset = -2; monthOffset <= 1; monthOffset++) {
      const testMonth = month - 1 + monthOffset;
      const testYear = year + Math.floor(testMonth / 12);
      const adjustedMonth = ((testMonth % 12) + 12) % 12;
      
      const testCutDate = new Date(testYear, adjustedMonth, card.cutDate);
      const testPaymentDueDate = getPaymentDueDate(card, testCutDate);
      
      // Check if this payment due date falls within the selected month
      if (isWithinInterval(testPaymentDueDate, { start: monthStart, end: monthEnd })) {
        cycleCutDate = testCutDate;
        paymentDueDate = testPaymentDueDate;
        
        // Calculate the billing cycle for this cut date
        const previousCutDate = new Date(testCutDate);
        if (previousCutDate.getMonth() === 0) {
          previousCutDate.setFullYear(previousCutDate.getFullYear() - 1);
          previousCutDate.setMonth(11);
        } else {
          previousCutDate.setMonth(previousCutDate.getMonth() - 1);
        }
        
        // Cycle starts the day AFTER the previous cut date
        cycleStartDate = new Date(previousCutDate);
        cycleStartDate.setDate(cycleStartDate.getDate() + 1);
        cycleStartDate.setHours(0, 0, 0, 0);
        
        // Cycle ends on the cut date (inclusive)
        cycleEndDate = new Date(testCutDate);
        cycleEndDate.setHours(23, 59, 59, 999);
        
        foundCycle = true;
        break;
      }
    }
    
    // If no cycle found with payment due in selected month, skip this card
    if (!foundCycle || !cycleCutDate || !paymentDueDate || !cycleStartDate || !cycleEndDate) {
      continue;
    }
    
    // Calculate normal expenses in this billing cycle
    const relevantTransactions = transactions.filter(txn => {
      if (!txn.creditCardId || txn.creditCardId !== card.id || txn.type !== 'expense') {
        return false;
      }
      const txnDate = parseISO(txn.date);
      // Transaction must be on or after cycle start and on or before cycle end
      return txnDate >= cycleStartDate && txnDate <= cycleEndDate;
    });
    
    const normalExpenses = relevantTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    
    // Calculate installment expenses in this billing cycle
    const cardPurchases = installmentPurchases.filter(p => p.creditCardId === card.id);
    const cardPaymentIds = new Set(cardPurchases.map(p => p.id));
    
    const installmentExpenses = installmentPayments
      .filter(payment => {
        if (payment.status !== 'pending') return false;
        if (!cardPaymentIds.has(payment.installmentPurchaseId)) return false;
        const dueDate = parseISO(payment.dueDate);
        // Payment must be in the billing cycle (>= cycle start, <= cycle end)
        return dueDate >= cycleStartDate && dueDate <= cycleEndDate;
      })
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const totalExpenses = normalExpenses + installmentExpenses;
    
    // Calculate days until due based on today's date (not the selected month reference)
    const daysUntilDue = Math.ceil((paymentDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Include payment if it has expenses OR if the payment is due in the selected month
    if (totalExpenses > 0 || isWithinInterval(paymentDueDate, { start: monthStart, end: monthEnd })) {
      creditCardPayments.push({
        cardId: card.id,
        cardName: card.name,
        cardColor: card.color,
        bank: card.bank,
        amount: totalExpenses,
        dueDate: paymentDueDate,
        daysUntilDue,
        normalExpenses,
        installmentExpenses,
        status: 'pending', // Default, will be updated from database if tracked
        paidDate: null,
        billingCycleStart: cycleStartDate,
        billingCycleEnd: cycleEndDate,
      });
    }
  }
  
  // Calculate installment payments (not associated with credit cards) that are due this month
  // Include both pending and paid payments so user can see and manage them
  const installmentPaymentsWithoutCard: InstallmentPayment[] = installmentPayments
    .filter(payment => {
      // Check if payment is due this month (include both pending and paid)
      const dueDate = parseISO(payment.dueDate);
      const isDueThisMonth = isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
      
      if (!isDueThisMonth) return false;
      
      // Check if the purchase is NOT associated with a credit card
      const purchase = installmentPurchases.find(p => p.id === payment.installmentPurchaseId);
      return !purchase?.creditCardId;
    })
    .map(payment => {
      const purchase = installmentPurchases.find(p => p.id === payment.installmentPurchaseId);
      const dueDate = parseISO(payment.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        paymentId: payment.id, // Include payment ID for marking as paid
        purchaseId: payment.installmentPurchaseId,
        purchaseName: purchase?.name || 'Compra desconocida',
        amount: payment.amount,
        dueDate,
        paymentNumber: payment.paymentNumber,
        daysUntilDue,
        status: payment.status,
        paidDate: payment.paidDate,
      };
    });
  
  // Calculate recurring expense payments due this month
  const recurringExpensePayments: RecurringExpensePayment[] = [];
  
  for (const expense of recurringExpenses.filter(e => e.isActive)) {
    const startDate = parseISO(expense.startDate);
    const startYear = getYear(startDate);
    const startMonth = getMonth(startDate) + 1;
    
    // Check if expense has started
    if (startYear > year || (startYear === year && startMonth > month)) {
      continue; // Expense hasn't started yet
    }
    
    // Check if expense has ended
    if (expense.endDate) {
      const endDate = parseISO(expense.endDate);
      const endYear = getYear(endDate);
      const endMonth = getMonth(endDate) + 1;
      
      if (endYear < year || (endYear === year && endMonth < month)) {
        continue; // Expense has ended
      }
    }
    
    // Calculate payment due date for this month
    // Use the payment day, but if it's beyond the last day of the month, use the last day
    const lastDayOfMonth = endOfMonth(new Date(year, month - 1)).getDate();
    const paymentDay = Math.min(expense.paymentDay, lastDayOfMonth);
    const dueDate = setDate(new Date(year, month - 1), paymentDay);
    dueDate.setHours(23, 59, 59, 999);
    
    // Only include if due date is within the month
    if (isWithinInterval(dueDate, { start: monthStart, end: monthEnd })) {
      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      recurringExpensePayments.push({
        expenseId: expense.id,
        expenseName: expense.name,
        expenseType: expense.type,
        amount: expense.monthlyAmount,
        dueDate,
        daysUntilDue,
      });
    }
  }
  
  const totalCreditCardPayments = creditCardPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalInstallmentPayments = installmentPaymentsWithoutCard.reduce((sum, p) => sum + p.amount, 0);
  const totalRecurringExpensePayments = recurringExpensePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPayments = totalCreditCardPayments + totalInstallmentPayments + totalRecurringExpensePayments;
  const availableAfterPayments = monthIncome - totalPayments;
  
  return {
    monthIncome,
    creditCardPayments,
    installmentPayments: installmentPaymentsWithoutCard,
    recurringExpensePayments,
    totalCreditCardPayments,
    totalInstallmentPayments,
    totalRecurringExpensePayments,
    totalPayments,
    availableAfterPayments,
  };
};
