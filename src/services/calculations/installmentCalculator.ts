import { InstallmentPurchaseSchema, InstallmentPaymentSchema } from '../database/schema';
import { addMonths, parseISO, format } from 'date-fns';

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

  for (let i = 0; i < purchase.numberOfMonths; i++) {
    const dueDate = addMonths(startDate, i);
    payments.push({
      installmentPurchaseId: purchase.id,
      amount: monthlyPayment,
      dueDate: format(dueDate, 'yyyy-MM-dd'),
      paidDate: null,
      status: 'pending',
      paymentNumber: i + 1,
    });
  }

  return payments;
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

