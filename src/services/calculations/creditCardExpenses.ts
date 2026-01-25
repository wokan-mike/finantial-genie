import { TransactionSchema, InstallmentPaymentSchema, InstallmentPurchaseSchema, CreditCardSchema } from '../database/schema';
import { parseISO, addDays, isBefore, isAfter, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface CreditCardExpenseSummary {
  cardId: string;
  cardName: string;
  cardColor: string;
  bank: string;
  cutDate: number;
  paymentDueDate: Date;
  totalExpenses: number;
  normalExpenses: number;
  installmentExpenses: number;
  isDueThisMonth: boolean;
  daysUntilDue: number;
}

/**
 * Calculate the next cut date for a credit card
 */
export const getNextCutDate = (card: CreditCardSchema, referenceDate: Date = new Date()): Date => {
  const currentMonth = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();
  const cutDay = card.cutDate;
  
  // Get the cut date for the current month
  const cutDateThisMonth = new Date(currentYear, currentMonth, cutDay);
  
  // If the cut date has already passed this month, use next month's cut date
  if (cutDateThisMonth < referenceDate) {
    return new Date(currentYear, currentMonth + 1, cutDay);
  }
  
  return cutDateThisMonth;
};

/**
 * Calculate the payment due date for a credit card based on cut date
 */
export const getPaymentDueDate = (card: CreditCardSchema, cutDate: Date): Date => {
  return addDays(cutDate, card.paymentDays);
};

/**
 * Check if a transaction should be included in the current billing cycle
 */
export const isInCurrentBillingCycle = (
  transaction: TransactionSchema,
  card: CreditCardSchema,
  referenceDate: Date = new Date()
): boolean => {
  if (!transaction.creditCardId || transaction.creditCardId !== card.id) {
    return false;
  }
  
  if (transaction.type !== 'expense') {
    return false;
  }
  
  const transactionDate = parseISO(transaction.date);
  const lastCutDate = getLastCutDate(card, referenceDate);
  const nextCutDate = getNextCutDate(card, referenceDate);
  
  // Billing cycle starts the day AFTER the last cut date and includes up to and including the next cut date
  // Set lastCutDate to end of day, and nextCutDate to end of day for inclusive comparison
  const cycleStart = new Date(lastCutDate);
  cycleStart.setDate(cycleStart.getDate() + 1); // Day after last cut
  cycleStart.setHours(0, 0, 0, 0);
  
  const cycleEnd = new Date(nextCutDate);
  cycleEnd.setHours(23, 59, 59, 999); // End of cut day
  
  // Transaction is in current cycle if it's on or after cycle start and on or before cycle end
  return transactionDate >= cycleStart && transactionDate <= cycleEnd;
};

/**
 * Get the last cut date before the reference date
 */
export const getLastCutDate = (card: CreditCardSchema, referenceDate: Date = new Date()): Date => {
  const currentMonth = referenceDate.getMonth();
  const currentYear = referenceDate.getFullYear();
  const cutDay = card.cutDate;
  
  // Get the cut date for the current month
  const cutDateThisMonth = new Date(currentYear, currentMonth, cutDay);
  
  // If the cut date hasn't passed yet, use last month's cut date
  if (cutDateThisMonth > referenceDate) {
    return new Date(currentYear, currentMonth - 1, cutDay);
  }
  
  return cutDateThisMonth;
};

/**
 * Calculate expenses for all credit cards
 * Now finds the billing cycle whose payment is due in the current month (like calculatePaymentsForMonth)
 */
export const calculateCreditCardExpenses = (
  transactions: TransactionSchema[],
  installmentPayments: InstallmentPaymentSchema[],
  creditCards: CreditCardSchema[],
  installmentPurchases: InstallmentPurchaseSchema[] = [],
  referenceDate: Date = new Date()
): CreditCardExpenseSummary[] => {
  const summaries: CreditCardExpenseSummary[] = [];
  const today = referenceDate;
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  for (const card of creditCards.filter(c => c.isActive)) {
    // Find the billing cycle whose payment is due in the current month
    // This is the same logic as calculatePaymentsForMonth
    let foundCycle = false;
    let cycleCutDate: Date | null = null;
    let paymentDueDate: Date | null = null;
    let cycleStartDate: Date | null = null;
    let cycleEndDate: Date | null = null;
    
    // Try cut dates from 2 months before to 1 month after the current month
    for (let monthOffset = -2; monthOffset <= 1; monthOffset++) {
      const testMonth = currentMonth - 1 + monthOffset;
      const testYear = currentYear + Math.floor(testMonth / 12);
      const adjustedMonth = ((testMonth % 12) + 12) % 12;
      
      const testCutDate = new Date(testYear, adjustedMonth, card.cutDate);
      const testPaymentDueDate = getPaymentDueDate(card, testCutDate);
      
      // Check if this payment due date falls within the current month
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
    
    // If no cycle found with payment due in current month, skip this card
    if (!foundCycle || !cycleCutDate || !paymentDueDate || !cycleStartDate || !cycleEndDate) {
      continue;
    }
    
    // Calculate normal expenses in this billing cycle
    const normalExpenses = transactions
      .filter(txn => {
        if (!txn.creditCardId || txn.creditCardId !== card.id || txn.type !== 'expense') {
          return false;
        }
        const txnDate = parseISO(txn.date);
        // Transaction must be on or after cycle start and on or before cycle end
        return txnDate >= cycleStartDate && txnDate <= cycleEndDate;
      })
      .reduce((sum, txn) => sum + txn.amount, 0);
    
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
    
    // Payment is due this month (we already verified this above)
    const isDueThisMonth = true;
    
    // Calculate days until due date
    const daysUntilDue = Math.ceil((paymentDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    summaries.push({
      cardId: card.id,
      cardName: card.name,
      cardColor: card.color,
      bank: card.bank,
      cutDate: card.cutDate,
      paymentDueDate,
      totalExpenses,
      normalExpenses,
      installmentExpenses,
      isDueThisMonth,
      daysUntilDue,
    });
  }
  
  return summaries;
};
