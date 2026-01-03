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
  
  // Transaction is in current cycle if it's after last cut date and before next cut date
  return isAfter(transactionDate, lastCutDate) && isBefore(transactionDate, nextCutDate);
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
 */
export const calculateCreditCardExpenses = (
  transactions: TransactionSchema[],
  installmentPayments: InstallmentPaymentSchema[],
  creditCards: CreditCardSchema[],
  installmentPurchases: InstallmentPurchaseSchema[] = [],
  referenceDate: Date = new Date()
): CreditCardExpenseSummary[] => {
  const summaries: CreditCardExpenseSummary[] = [];
  
  for (const card of creditCards.filter(c => c.isActive)) {
    const lastCutDate = getLastCutDate(card, referenceDate);
    const nextCutDate = getNextCutDate(card, referenceDate);
    const paymentDueDate = getPaymentDueDate(card, nextCutDate);
    
    // Calculate normal expenses (transactions) in current billing cycle
    const normalExpenses = transactions
      .filter(txn => isInCurrentBillingCycle(txn, card, referenceDate))
      .reduce((sum, txn) => sum + txn.amount, 0);
    
    // Calculate installment expenses in current billing cycle
    // Get payments associated with purchases that use this credit card
    const cardPurchases = installmentPurchases.filter(p => p.creditCardId === card.id);
    const cardPaymentIds = new Set(cardPurchases.map(p => p.id));
    
    const installmentExpenses = installmentPayments
      .filter(payment => {
        if (payment.status !== 'pending') return false;
        // Check if payment belongs to a purchase with this card
        if (!cardPaymentIds.has(payment.installmentPurchaseId)) return false;
        const dueDate = parseISO(payment.dueDate);
        // Payment is in current billing cycle if it's after last cut date and before next cut date
        return isAfter(dueDate, lastCutDate) && isBefore(dueDate, nextCutDate);
      })
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const totalExpenses = normalExpenses + installmentExpenses;
    
    // Check if payment is due this month
    const currentMonthStart = startOfMonth(referenceDate);
    const currentMonthEnd = endOfMonth(referenceDate);
    const isDueThisMonth = isWithinInterval(paymentDueDate, { start: currentMonthStart, end: currentMonthEnd });
    
    // Calculate days until due date
    const daysUntilDue = Math.ceil((paymentDueDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
    
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
