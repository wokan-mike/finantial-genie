import { FinanceService } from './financeService.interface';
import { InvestmentOpportunitySchema } from '../database/schema';

export class MockFinanceService implements FinanceService {
  private mockOpportunities: Omit<InvestmentOpportunitySchema, 'id' | 'createdAt'>[] = [
    {
      type: 'fixed_income',
      name: 'CETES 28 días',
      expectedReturn: 11.5,
      riskLevel: 'low',
      minAmount: 100,
      description: 'Certificados de la Tesorería de la Federación a 28 días',
      isActive: true,
    },
    {
      type: 'fixed_income',
      name: 'CETES 91 días',
      expectedReturn: 11.8,
      riskLevel: 'low',
      minAmount: 100,
      description: 'Certificados de la Tesorería de la Federación a 91 días',
      isActive: true,
    },
    {
      type: 'fixed_income',
      name: 'Bonos Gubernamentales',
      expectedReturn: 10.5,
      riskLevel: 'low',
      minAmount: 1000,
      description: 'Bonos del gobierno mexicano',
      isActive: true,
    },
    {
      type: 'variable_income',
      name: 'S&P 500 ETF',
      expectedReturn: 12.0,
      riskLevel: 'medium',
      minAmount: 500,
      description: 'Fondo indexado que replica el S&P 500',
      isActive: true,
    },
    {
      type: 'variable_income',
      name: 'Acciones Individuales',
      expectedReturn: 15.0,
      riskLevel: 'high',
      minAmount: 1000,
      description: 'Inversión en acciones individuales de empresas',
      isActive: true,
    },
    {
      type: 'variable_income',
      name: 'Fondos de Inversión',
      expectedReturn: 10.0,
      riskLevel: 'medium',
      minAmount: 5000,
      description: 'Fondos de inversión diversificados',
      isActive: true,
    },
  ];

  async getInvestmentOpportunities(): Promise<InvestmentOpportunitySchema[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const now = new Date().toISOString();
    return this.mockOpportunities.map((opp, index) => ({
      ...opp,
      id: `opp_mock_${index}`,
      createdAt: now,
    }));
  }

  async getOpportunityById(id: string): Promise<InvestmentOpportunitySchema | null> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const opportunities = await this.getInvestmentOpportunities();
    return opportunities.find(opp => opp.id === id) || null;
  }
}

export const mockFinanceService = new MockFinanceService();

