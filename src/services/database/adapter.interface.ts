import {
  TransactionSchema,
  CategorySchema,
  FixedExpenseSchema,
  InstallmentPurchaseSchema,
  InstallmentPaymentSchema,
  AssetSchema,
  LiabilitySchema,
  InvestmentSchema,
  InvestmentOpportunitySchema,
  CreditCardSchema,
  RecurringExpenseSchema,
} from './schema';

export interface TransactionRepository {
  getAll(): Promise<TransactionSchema[]>;
  getById(id: string): Promise<TransactionSchema | null>;
  create(data: Omit<TransactionSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransactionSchema>;
  update(id: string, data: Partial<TransactionSchema>): Promise<TransactionSchema>;
  delete(id: string): Promise<void>;
  getByDateRange(startDate: string, endDate: string): Promise<TransactionSchema[]>;
  getByTags(tags: string[]): Promise<TransactionSchema[]>;
}

export interface CategoryRepository {
  getAll(): Promise<CategorySchema[]>;
  getById(id: string): Promise<CategorySchema | null>;
  create(data: Omit<CategorySchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategorySchema>;
  update(id: string, data: Partial<CategorySchema>): Promise<CategorySchema>;
  delete(id: string): Promise<void>;
}

export interface FixedExpenseRepository {
  getAll(): Promise<FixedExpenseSchema[]>;
  getById(id: string): Promise<FixedExpenseSchema | null>;
  create(data: Omit<FixedExpenseSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<FixedExpenseSchema>;
  update(id: string, data: Partial<FixedExpenseSchema>): Promise<FixedExpenseSchema>;
  delete(id: string): Promise<void>;
}

export interface InstallmentPurchaseRepository {
  getAll(): Promise<InstallmentPurchaseSchema[]>;
  getById(id: string): Promise<InstallmentPurchaseSchema | null>;
  create(data: Omit<InstallmentPurchaseSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<InstallmentPurchaseSchema>;
  update(id: string, data: Partial<InstallmentPurchaseSchema>): Promise<InstallmentPurchaseSchema>;
  delete(id: string): Promise<void>;
}

export interface InstallmentPaymentRepository {
  getAll(): Promise<InstallmentPaymentSchema[]>;
  getByPurchaseId(purchaseId: string): Promise<InstallmentPaymentSchema[]>;
  getById(id: string): Promise<InstallmentPaymentSchema | null>;
  create(data: Omit<InstallmentPaymentSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<InstallmentPaymentSchema>;
  update(id: string, data: Partial<InstallmentPaymentSchema>): Promise<InstallmentPaymentSchema>;
  delete(id: string): Promise<void>;
  getPending(): Promise<InstallmentPaymentSchema[]>;
}

export interface AssetRepository {
  getAll(): Promise<AssetSchema[]>;
  getById(id: string): Promise<AssetSchema | null>;
  create(data: Omit<AssetSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssetSchema>;
  update(id: string, data: Partial<AssetSchema>): Promise<AssetSchema>;
  delete(id: string): Promise<void>;
}

export interface LiabilityRepository {
  getAll(): Promise<LiabilitySchema[]>;
  getById(id: string): Promise<LiabilitySchema | null>;
  create(data: Omit<LiabilitySchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiabilitySchema>;
  update(id: string, data: Partial<LiabilitySchema>): Promise<LiabilitySchema>;
  delete(id: string): Promise<void>;
}

export interface InvestmentRepository {
  getAll(): Promise<InvestmentSchema[]>;
  getById(id: string): Promise<InvestmentSchema | null>;
  create(data: Omit<InvestmentSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvestmentSchema>;
  update(id: string, data: Partial<InvestmentSchema>): Promise<InvestmentSchema>;
  delete(id: string): Promise<void>;
}

export interface InvestmentOpportunityRepository {
  getAll(): Promise<InvestmentOpportunitySchema[]>;
  getActive(): Promise<InvestmentOpportunitySchema[]>;
  getById(id: string): Promise<InvestmentOpportunitySchema | null>;
  create(data: Omit<InvestmentOpportunitySchema, 'id' | 'createdAt'>): Promise<InvestmentOpportunitySchema>;
  update(id: string, data: Partial<InvestmentOpportunitySchema>): Promise<InvestmentOpportunitySchema>;
  delete(id: string): Promise<void>;
}

export interface CreditCardRepository {
  getAll(): Promise<CreditCardSchema[]>;
  getActive(): Promise<CreditCardSchema[]>;
  getById(id: string): Promise<CreditCardSchema | null>;
  create(data: Omit<CreditCardSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreditCardSchema>;
  update(id: string, data: Partial<CreditCardSchema>): Promise<CreditCardSchema>;
  delete(id: string): Promise<void>;
}

export interface RecurringExpenseRepository {
  getAll(): Promise<RecurringExpenseSchema[]>;
  getActive(): Promise<RecurringExpenseSchema[]>;
  getById(id: string): Promise<RecurringExpenseSchema | null>;
  create(data: Omit<RecurringExpenseSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringExpenseSchema>;
  update(id: string, data: Partial<RecurringExpenseSchema>): Promise<RecurringExpenseSchema>;
  delete(id: string): Promise<void>;
}

export interface DatabaseAdapter {
  transactions: TransactionRepository;
  categories: CategoryRepository;
  fixedExpenses: FixedExpenseRepository;
  installmentPurchases: InstallmentPurchaseRepository;
  installmentPayments: InstallmentPaymentRepository;
  assets: AssetRepository;
  liabilities: LiabilityRepository;
  investments: InvestmentRepository;
  investmentOpportunities: InvestmentOpportunityRepository;
  creditCards: CreditCardRepository;
  recurringExpenses: RecurringExpenseRepository;
  initialize(): Promise<void>;
}

