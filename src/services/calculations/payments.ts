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
  cardId: string;
  cardName: string;
  cardColor: string;
  bank: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  normalExpenses: number;
  installmentExpenses: number;
}

export interface InstallmentPayment {
  purchaseId: string;
  purchaseName: string;
  amount: number;
  dueDate: Date;
  paymentNumber: number;
  daysUntilDue: number;
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
  
  // Calculate credit card payments that are due this month
  // For each card, we need to find the billing cycle that ended in the previous month
  // and whose payment is due in this month
  const creditCardPayments: CreditCardPayment[] = [];
  
  for (const card of creditCards.filter(c => c.isActive)) {
    // Find the cut date in the previous month that would result in payment due this month
    // Payment due date = cut date + payment days
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthCutDate = new Date(prevYear, prevMonth - 1, card.cutDate);
    const paymentDueDate = getPaymentDueDate(card, prevMonthCutDate);
    
    // Check if this payment is due in the target month
    if (isWithinInterval(paymentDueDate, { start: monthStart, end: monthEnd })) {
      // Calculate expenses for the billing cycle that ended at prevMonthCutDate
      // The cycle is from the day AFTER the previous cut date to the prevMonthCutDate (inclusive)
      // Example: If cut is on 17th, cycle is from 18th of previous month to 17th of current month
      
      // Calculate the previous cut date (one month before prevMonthCutDate)
      const previousCutMonth = prevMonth === 1 ? 12 : prevMonth - 1;
      const previousCutYear = prevMonth === 1 ? prevYear - 1 : prevYear;
      const previousCutDate = new Date(previousCutYear, previousCutMonth - 1, card.cutDate);
      
      // Cycle starts the day AFTER the previous cut date
      const cycleStartDate = new Date(previousCutDate);
      cycleStartDate.setDate(cycleStartDate.getDate() + 1);
      cycleStartDate.setHours(0, 0, 0, 0);
      
      // Cycle ends on the cut date (inclusive)
      const cycleEndDate = new Date(prevMonthCutDate);
      cycleEndDate.setHours(23, 59, 59, 999);
      
      console.log(`[Payments] Card: ${card.name}, Cut date: ${card.cutDate}`);
      console.log(`[Payments] Card: ${card.name}, Previous cut: ${previousCutDate.toISOString().split('T')[0]}`);
      console.log(`[Payments] Card: ${card.name}, Current cut: ${prevMonthCutDate.toISOString().split('T')[0]}`);
      console.log(`[Payments] Card: ${card.name}, Cycle: ${cycleStartDate.toISOString().split('T')[0]} to ${cycleEndDate.toISOString().split('T')[0]}, Payment due: ${paymentDueDate.toISOString().split('T')[0]}`);
      
      // Calculate normal expenses in this billing cycle
      // Transactions must be >= cycleStartDate and <= cycleEndDate
      const relevantTransactions = transactions.filter(txn => {
        if (!txn.creditCardId || txn.creditCardId !== card.id || txn.type !== 'expense') {
          return false;
        }
        const txnDate = parseISO(txn.date);
        // Transaction must be on or after cycle start and on or before cycle end
        return txnDate >= cycleStartDate && txnDate <= cycleEndDate;
      });
      
      console.log(`[Payments] Card: ${card.name}, Relevant transactions: ${relevantTransactions.length}`);
      relevantTransactions.forEach(txn => {
        console.log(`[Payments] Transaction: ${txn.description} - ${txn.amount} on ${parseISO(txn.date).toISOString().split('T')[0]}`);
      });
      
      const normalExpenses = relevantTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      
      console.log(`[Payments] Card: ${card.name}, Normal expenses: ${normalExpenses}`);
      
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
      
      console.log(`[Payments] Card: ${card.name}, Installment expenses: ${installmentExpenses}`);
      
      const totalExpenses = normalExpenses + installmentExpenses;
      const daysUntilDue = Math.ceil((paymentDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`[Payments] Card: ${card.name}, Total expenses: ${totalExpenses}`);
      
      // Include payment even if totalExpenses is 0, as there might be minimum payments
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
      });
    }
  }
  
  // Calculate installment payments (not associated with credit cards) that are due this month
  const installmentPaymentsWithoutCard: InstallmentPayment[] = installmentPayments
    .filter(payment => {
      if (payment.status !== 'pending') return false;
      
      // Check if payment is due this month
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
        purchaseId: payment.installmentPurchaseId,
        purchaseName: purchase?.name || 'Compra desconocida',
        amount: payment.amount,
        dueDate,
        paymentNumber: payment.paymentNumber,
        daysUntilDue,
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
