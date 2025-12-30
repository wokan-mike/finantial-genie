import { InvestmentSchema } from '../database/schema';

export const calculateInvestmentReturn = (investment: InvestmentSchema): number => {
  const currentValue = investment.currentPrice * investment.quantity;
  const purchaseValue = investment.purchasePrice * investment.quantity;
  return currentValue - purchaseValue;
};

export const calculateInvestmentReturnPercentage = (investment: InvestmentSchema): number => {
  if (investment.purchasePrice === 0) return 0;
  const returnAmount = calculateInvestmentReturn(investment);
  const purchaseValue = investment.purchasePrice * investment.quantity;
  return (returnAmount / purchaseValue) * 100;
};

export const calculateTotalPortfolioValue = (investments: InvestmentSchema[]): number => {
  return investments.reduce((sum, inv) => sum + inv.currentPrice * inv.quantity, 0);
};

export const calculateTotalPortfolioCost = (investments: InvestmentSchema[]): number => {
  return investments.reduce((sum, inv) => sum + inv.purchasePrice * inv.quantity, 0);
};

export const calculateTotalPortfolioReturn = (investments: InvestmentSchema[]): number => {
  return calculateTotalPortfolioValue(investments) - calculateTotalPortfolioCost(investments);
};

