import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { useTransactions } from './useTransactions';
import { useCreditCards } from './useCreditCards';
import { useInstallments } from './useInstallments';
import { useRecurringExpenses } from './useRecurringExpenses';
import { calculatePaymentsForMonth, PaymentSummary } from '../services/calculations/payments';
import { getYear, getMonth } from 'date-fns';

export const usePayments = (year?: number, month?: number) => {
  const { transactions } = useTransactions();
  const { creditCards } = useCreditCards();
  const { purchases, payments } = useInstallments();
  const { expenses: recurringExpenses } = useRecurringExpenses();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const currentYear = year || getYear(new Date());
        const currentMonth = month || getMonth(new Date()) + 1;
        
        const summary = calculatePaymentsForMonth(
          transactions,
          payments,
          purchases,
          creditCards,
          recurringExpenses,
          currentYear,
          currentMonth
        );
        
        setPaymentSummary(summary);
        setError(null);
      } catch (err) {
        console.error('Error loading payments:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar pagos');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, [transactions, payments, purchases, creditCards, recurringExpenses, year, month]);

  return {
    paymentSummary,
    loading,
    error,
  };
};
