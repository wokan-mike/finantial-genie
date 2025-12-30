import { useState, useEffect } from 'react';
import { getDatabase } from '../services/database/adapter';
import { InvestmentSchema, InvestmentOpportunitySchema } from '../services/database/schema';
import { mockFinanceService } from '../services/finance/mockFinanceService';

export const useInvestments = () => {
  const [investments, setInvestments] = useState<InvestmentSchema[]>([]);
  const [opportunities, setOpportunities] = useState<InvestmentOpportunitySchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const db = await getDatabase();
      const [investmentsData, opportunitiesData] = await Promise.all([
        db.investments.getAll(),
        mockFinanceService.getInvestmentOpportunities(),
      ]);
      setInvestments(investmentsData);
      setOpportunities(opportunitiesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inversiones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createInvestment = async (data: Omit<InvestmentSchema, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const db = await getDatabase();
      const newInvestment = await db.investments.create(data);
      setInvestments(prev => [...prev, newInvestment]);
      return newInvestment;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al crear inversión');
    }
  };

  const updateInvestment = async (id: string, data: Partial<InvestmentSchema>) => {
    try {
      const db = await getDatabase();
      const updated = await db.investments.update(id, data);
      setInvestments(prev => prev.map(inv => inv.id === id ? updated : inv));
      return updated;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Error al actualizar inversión');
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      const db = await getDatabase();
      await db.investments.delete(id);
      setInvestments(prev => prev.filter(inv => inv.id !== id));
      // Reload to ensure consistency
      await loadData();
    } catch (err) {
      console.error('Error deleting investment:', err);
      throw new Error(err instanceof Error ? err.message : 'Error al eliminar inversión');
    }
  };

  return {
    investments,
    opportunities,
    loading,
    error,
    createInvestment,
    updateInvestment,
    deleteInvestment,
    refresh: loadData,
  };
};

