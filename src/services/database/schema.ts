// Schema definitions for both WatermelonDB and Dexie.js

export interface TransactionSchema {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  tags: string[]; // Array of category IDs
  description: string;
  date: string; // ISO date string
  isRecurring: boolean;
  creditCardId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySchema {
  id: string;
  name: string;
  color: string;
  icon: string;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FixedExpenseSchema {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'biweekly';
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPurchaseSchema {
  id: string;
  name: string;
  totalAmount: number;
  numberOfMonths: number;
  monthlyPayment: number;
  startDate: string;
  description: string | null;
  creditCardId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPaymentSchema {
  id: string;
  installmentPurchaseId: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: 'pending' | 'paid';
  paymentNumber: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssetSchema {
  id: string;
  type: 'cash' | 'bank' | 'investment' | 'other';
  name: string;
  value: number;
  currency: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiabilitySchema {
  id: string;
  type: 'credit_card' | 'loan' | 'mortgage' | 'other';
  name: string;
  amount: number;
  interestRate: number | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentSchema {
  id: string;
  symbol: string | null;
  type: 'stock' | 'bond' | 'fund' | 'other';
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
  currentPrice: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentOpportunitySchema {
  id: string;
  type: 'fixed_income' | 'variable_income';
  name: string;
  expectedReturn: number; // percentage
  riskLevel: 'low' | 'medium' | 'high';
  minAmount: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreditCardSchema {
  id: string;
  templateId: string; // ID from creditCards.ts templates
  bank: string;
  name: string; // Custom name for the card (e.g., "Mi Tarjeta BBVA")
  last4Digits: string; // Last 4 digits of the card
  color: string; // Color hex code for card identification
  cutDate: number; // Day of month for cut date (1-31)
  paymentDays: number; // Days after cut date to pay without interest
  annualInterestRate: number;
  moratoryInterestRate: number;
  minPaymentPercentage: number;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number; // creditLimit - currentBalance
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExpenseSchema {
  id: string;
  name: string; // e.g., "Renta departamento", "Crédito auto", "Hipoteca casa"
  type: 'rent' | 'car_loan' | 'mortgage' | 'other';
  monthlyAmount: number;
  paymentDay: number; // Day of month (1-31) when payment is due
  startDate: string; // ISO date string
  endDate: string | null; // ISO date string or null if indefinite
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
