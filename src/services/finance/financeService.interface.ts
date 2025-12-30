import { InvestmentOpportunitySchema } from '../database/schema';

export interface FinanceService {
  getInvestmentOpportunities(): Promise<InvestmentOpportunitySchema[]>;
  getOpportunityById(id: string): Promise<InvestmentOpportunitySchema | null>;
}

