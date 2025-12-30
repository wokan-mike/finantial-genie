import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { InstallmentPurchaseSchema, InstallmentPaymentSchema } from '../services/database/schema';
import { generateInstallmentPayments, calculateTotalPending } from '../services/calculations/installmentCalculator';

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
      const db = await getDatabase();
      const monthlyPayment = data.totalAmount / data.numberOfMonths;
      const purchase = await db.installmentPurchases.create({
        ...data,
        monthlyPayment,
      });

      // Generate payment records
      const paymentRecords = generateInstallmentPayments(purchase);
      const createdPayments = await Promise.all(
        paymentRecords.map(payment => db.installmentPayments.create(payment))
      );

      setPurchases(prev => [...prev, purchase]);
      setPayments(prev => [...prev, ...createdPayments]);
      return purchase;
    } catch (err) {
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
      const db = await getDatabase();
      await db.installmentPurchases.delete(id);
      setPurchases(prev => prev.filter(p => p.id !== id));
      setPayments(prev => prev.filter(p => p.installmentPurchaseId !== id));
      // Reload to ensure consistency
      await loadData();
    } catch (err) {
      console.error('Error deleting purchase:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar compra');
    }
  };

  const markPaymentAsPaid = async (paymentId: string) => {
    try {
      const db = await getDatabase();
      const updated = await db.installmentPayments.update(paymentId, {
        status: 'paid',
        paidDate: new Date().toISOString(),
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

