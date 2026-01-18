import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { InstallmentPurchaseSchema, InstallmentPaymentSchema, TransactionSchema } from '../services/database/schema';
import { generateInstallmentPayments, generatePastMonthTransactions, calculateTotalPending } from '../services/calculations/installmentCalculator';

export const useInstallments = () => {
  const [purchases, setPurchases] = useState<InstallmentPurchaseSchema[]>([]);
  const [payments, setPayments] = useState<InstallmentPaymentSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      const [purchasesData, paymentsData] = await Promise.all([
        db.installmentPurchases.getAll(),
        db.installmentPayments.getAll(),
      ]);
      setPurchases(purchasesData);
      setPayments(paymentsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar compras a meses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createPurchase = async (data: Omit<InstallmentPurchaseSchema, 'id' | 'createdAt' | 'updatedAt' | 'monthlyPayment'>) => {
    try {
      console.log('[useInstallments.createPurchase] Starting with data:', data);
      const db = await getDatabase();
      const monthlyPayment = data.totalAmount / data.numberOfMonths;
      console.log('[useInstallments.createPurchase] Calculated monthly payment:', monthlyPayment);
      
      const purchase = await db.installmentPurchases.create({
        ...data,
        monthlyPayment,
      });
      console.log('[useInstallments.createPurchase] Purchase created:', purchase);

      // Generate payment records for future months
      const paymentRecords = generateInstallmentPayments(purchase);
      console.log('[useInstallments.createPurchase] Generated payment records:', paymentRecords.length);
      
      const createdPayments = await Promise.all(
        paymentRecords.map(payment => db.installmentPayments.create(payment))
      );
      console.log('[useInstallments.createPurchase] Payments created:', createdPayments.length);

      // Generate transactions for past months
      const pastTransactions = generatePastMonthTransactions(purchase);
      console.log('[useInstallments.createPurchase] Generated past month transactions:', pastTransactions.length);
      
      if (pastTransactions.length > 0) {
        const createdTransactions = await Promise.all(
          pastTransactions.map(pastTxn => db.transactions.create({
            type: 'expense',
            amount: pastTxn.amount,
            description: `${purchase.name} - Pago #${pastTxn.paymentNumber}`,
            tags: [],
            date: pastTxn.date,
            isRecurring: false,
            creditCardId: purchase.creditCardId,
          }))
        );
        console.log('[useInstallments.createPurchase] Past transactions created:', createdTransactions.length);
      }

      setPurchases(prev => [...prev, purchase]);
      setPayments(prev => [...prev, ...createdPayments]);
      
      // Reload to ensure consistency
      await loadData();
      
      return purchase;
    } catch (err) {
      console.error('[useInstallments.createPurchase] Error:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al crear compra a meses');
    }
  };

  const updatePurchase = async (id: string, data: Partial<InstallmentPurchaseSchema>) => {
    try {
      const db = await getDatabase();
      const updated = await db.installmentPurchases.update(id, data);
      setPurchases(prev => prev.map(p => p.id === id ? updated : p));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar compra');
    }
  };

  const deletePurchase = async (id: string) => {
    try {
      console.log('[useInstallments.deletePurchase] Starting deletion for purchase:', id);
      const db = await getDatabase();
      
      // Get the purchase first to find related transactions
      const purchase = await db.installmentPurchases.getById(id);
      if (!purchase) {
        throw new Error('Compra a meses no encontrada');
      }
      
      console.log('[useInstallments.deletePurchase] Purchase found:', purchase.name);
      
      // Find and delete related transactions (those created for past months)
      // Transactions are created with pattern: "[Purchase Name] - Pago #X"
      const allTransactions = await db.transactions.getAll();
      const relatedTransactions = allTransactions.filter(txn => 
        txn.type === 'expense' && 
        txn.description.startsWith(`${purchase.name} - Pago #`)
      );
      
      console.log('[useInstallments.deletePurchase] Found related transactions:', relatedTransactions.length);
      
      // Delete related transactions
      for (const txn of relatedTransactions) {
        await db.transactions.delete(txn.id);
        console.log('[useInstallments.deletePurchase] Deleted transaction:', txn.id);
      }
      
      // Delete the purchase (this will also delete related payments via cascade)
      await db.installmentPurchases.delete(id);
      console.log('[useInstallments.deletePurchase] Purchase deleted');
      
      setPurchases(prev => prev.filter(p => p.id !== id));
      setPayments(prev => prev.filter(p => p.installmentPurchaseId !== id));
      
      // Reload to ensure consistency
      await loadData();
      console.log('[useInstallments.deletePurchase] Deletion completed');
    } catch (err) {
      console.error('[useInstallments.deletePurchase] Error:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar compra');
    }
  };

  const markPaymentAsPaid = async (paymentId: string) => {
    try {
      const db = await getDatabase();
      const payment = await db.installmentPayments.getById(paymentId);
      if (!payment) {
        throw new Error('Pago no encontrado');
      }
      
      const updated = await db.installmentPayments.update(paymentId, {
        status: payment.status === 'paid' ? 'pending' : 'paid',
        paidDate: payment.status === 'paid' ? null : new Date().toISOString(),
      });
      setPayments(prev => prev.map(p => p.id === paymentId ? updated : p));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al marcar pago');
    }
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const totalPending = calculateTotalPending(payments);

  return {
    purchases,
    payments,
    pendingPayments,
    totalPending,
    loading,
    error,
    createPurchase,
    updatePurchase,
    deletePurchase,
    markPaymentAsPaid,
    refresh: loadData,
  };
};

