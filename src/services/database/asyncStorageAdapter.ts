import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CATEGORIES } from '../../utils/categories';
import {
  DatabaseAdapter,
  TransactionRepository,
  CategoryRepository,
  FixedExpenseRepository,
  InstallmentPurchaseRepository,
  InstallmentPaymentRepository,
  AssetRepository,
  LiabilityRepository,
  InvestmentRepository,
  InvestmentOpportunityRepository,
  CreditCardRepository,
  RecurringExpenseRepository,
} from './adapter.interface';
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

// Convert Category to CategorySchema format
const convertCategoryToSchema = (cat: { id: string; name: string; color: string; icon: string; isCustom: boolean }): Omit<CategorySchema, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    name: cat.name,
    color: cat.color,
    icon: cat.icon,
    isCustom: cat.isCustom,
  };
};

// Storage keys
const STORAGE_KEYS = {
  transactions: '@FinancialGenie:transactions',
  categories: '@FinancialGenie:categories',
  fixedExpenses: '@FinancialGenie:fixedExpenses',
  installmentPurchases: '@FinancialGenie:installmentPurchases',
  installmentPayments: '@FinancialGenie:installmentPayments',
  assets: '@FinancialGenie:assets',
  liabilities: '@FinancialGenie:liabilities',
  investments: '@FinancialGenie:investments',
  investmentOpportunities: '@FinancialGenie:investmentOpportunities',
  creditCards: '@FinancialGenie:creditCards',
  recurringExpenses: '@FinancialGenie:recurringExpenses',
};

// Helper functions for AsyncStorage operations
async function getAll<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error getting all ${key}:`, error);
    return [];
  }
}

async function saveAll<T>(key: string, items: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error saving all ${key}:`, error);
    throw error;
  }
}

async function getById<T extends { id: string }>(key: string, id: string): Promise<T | null> {
  const items = await getAll<T>(key);
  return items.find(item => item.id === id) || null;
}

async function create<T extends { id: string }>(key: string, item: T): Promise<T> {
  const items = await getAll<T>(key);
  items.push(item);
  await saveAll(key, items);
  return item;
}

async function update<T extends { id: string }>(key: string, id: string, data: Partial<T>): Promise<T> {
  const items = await getAll<T>(key);
  const index = items.findIndex(item => item.id === id);
  if (index === -1) throw new Error(`Item with id ${id} not found`);
  items[index] = { ...items[index], ...data };
  await saveAll(key, items);
  return items[index];
}

async function remove(key: string, id: string): Promise<void> {
  const items = await getAll<any>(key);
  const filtered = items.filter((item: any) => item.id !== id);
  if (filtered.length === items.length) {
    throw new Error(`Item with id ${id} not found`);
  }
  await saveAll(key, filtered);
}

// Transaction Repository
class AsyncStorageTransactionRepository implements TransactionRepository {
  async getAll(): Promise<TransactionSchema[]> {
    return getAll<TransactionSchema>(STORAGE_KEYS.transactions);
  }

  async getById(id: string): Promise<TransactionSchema | null> {
    return getById<TransactionSchema>(STORAGE_KEYS.transactions, id);
  }

  async create(data: Omit<TransactionSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<TransactionSchema> {
    const now = new Date().toISOString();
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: TransactionSchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.transactions, record);
  }

  async update(id: string, data: Partial<TransactionSchema>): Promise<TransactionSchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Transaction not found');
    return update(STORAGE_KEYS.transactions, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.transactions, id);
  }

  async getByDateRange(startDate: string, endDate: string): Promise<TransactionSchema[]> {
    const all = await this.getAll();
    return all.filter(txn => txn.date >= startDate && txn.date <= endDate);
  }

  async getByTags(tags: string[]): Promise<TransactionSchema[]> {
    const all = await this.getAll();
    return all.filter(txn => tags.some(tag => txn.tags.includes(tag)));
  }
}

// Category Repository
class AsyncStorageCategoryRepository implements CategoryRepository {
  async getAll(): Promise<CategorySchema[]> {
    return getAll<CategorySchema>(STORAGE_KEYS.categories);
  }

  async getById(id: string): Promise<CategorySchema | null> {
    return getById<CategorySchema>(STORAGE_KEYS.categories, id);
  }

  async create(data: Omit<CategorySchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<CategorySchema> {
    const now = new Date().toISOString();
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: CategorySchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.categories, record);
  }

  async update(id: string, data: Partial<CategorySchema>): Promise<CategorySchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Category not found');
    return update(STORAGE_KEYS.categories, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.categories, id);
  }
}

// Fixed Expense Repository
class AsyncStorageFixedExpenseRepository implements FixedExpenseRepository {
  async getAll(): Promise<FixedExpenseSchema[]> {
    return getAll<FixedExpenseSchema>(STORAGE_KEYS.fixedExpenses);
  }

  async getById(id: string): Promise<FixedExpenseSchema | null> {
    return getById<FixedExpenseSchema>(STORAGE_KEYS.fixedExpenses, id);
  }

  async create(data: Omit<FixedExpenseSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<FixedExpenseSchema> {
    const now = new Date().toISOString();
    const id = `fixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: FixedExpenseSchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.fixedExpenses, record);
  }

  async update(id: string, data: Partial<FixedExpenseSchema>): Promise<FixedExpenseSchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Fixed expense not found');
    return update(STORAGE_KEYS.fixedExpenses, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.fixedExpenses, id);
  }
}

// Installment Purchase Repository
class AsyncStorageInstallmentPurchaseRepository implements InstallmentPurchaseRepository {
  async getAll(): Promise<InstallmentPurchaseSchema[]> {
    return getAll<InstallmentPurchaseSchema>(STORAGE_KEYS.installmentPurchases);
  }

  async getById(id: string): Promise<InstallmentPurchaseSchema | null> {
    return getById<InstallmentPurchaseSchema>(STORAGE_KEYS.installmentPurchases, id);
  }

  async create(data: Omit<InstallmentPurchaseSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<InstallmentPurchaseSchema> {
    const now = new Date().toISOString();
    const id = `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: InstallmentPurchaseSchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.installmentPurchases, record);
  }

  async update(id: string, data: Partial<InstallmentPurchaseSchema>): Promise<InstallmentPurchaseSchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Installment purchase not found');
    return update(STORAGE_KEYS.installmentPurchases, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.installmentPurchases, id);
  }
}

// Installment Payment Repository
class AsyncStorageInstallmentPaymentRepository implements InstallmentPaymentRepository {
  async getAll(): Promise<InstallmentPaymentSchema[]> {
    return getAll<InstallmentPaymentSchema>(STORAGE_KEYS.installmentPayments);
  }

  async getByPurchaseId(purchaseId: string): Promise<InstallmentPaymentSchema[]> {
    const all = await this.getAll();
    return all.filter(payment => payment.installmentPurchaseId === purchaseId);
  }

  async getById(id: string): Promise<InstallmentPaymentSchema | null> {
    return getById<InstallmentPaymentSchema>(STORAGE_KEYS.installmentPayments, id);
  }

  async create(data: Omit<InstallmentPaymentSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<InstallmentPaymentSchema> {
    const now = new Date().toISOString();
    const id = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: InstallmentPaymentSchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.installmentPayments, record);
  }

  async update(id: string, data: Partial<InstallmentPaymentSchema>): Promise<InstallmentPaymentSchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Installment payment not found');
    return update(STORAGE_KEYS.installmentPayments, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.installmentPayments, id);
  }

  async getPending(): Promise<InstallmentPaymentSchema[]> {
    const all = await this.getAll();
    return all.filter(payment => payment.status === 'pending');
  }
}

// Asset Repository
class AsyncStorageAssetRepository implements AssetRepository {
  async getAll(): Promise<AssetSchema[]> {
    return getAll<AssetSchema>(STORAGE_KEYS.assets);
  }

  async getById(id: string): Promise<AssetSchema | null> {
    return getById<AssetSchema>(STORAGE_KEYS.assets, id);
  }

  async create(data: Omit<AssetSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssetSchema> {
    const now = new Date().toISOString();
    const id = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: AssetSchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.assets, record);
  }

  async update(id: string, data: Partial<AssetSchema>): Promise<AssetSchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Asset not found');
    return update(STORAGE_KEYS.assets, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.assets, id);
  }
}

// Liability Repository
class AsyncStorageLiabilityRepository implements LiabilityRepository {
  async getAll(): Promise<LiabilitySchema[]> {
    return getAll<LiabilitySchema>(STORAGE_KEYS.liabilities);
  }

  async getById(id: string): Promise<LiabilitySchema | null> {
    return getById<LiabilitySchema>(STORAGE_KEYS.liabilities, id);
  }

  async create(data: Omit<LiabilitySchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiabilitySchema> {
    const now = new Date().toISOString();
    const id = `liab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: LiabilitySchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.liabilities, record);
  }

  async update(id: string, data: Partial<LiabilitySchema>): Promise<LiabilitySchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Liability not found');
    return update(STORAGE_KEYS.liabilities, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.liabilities, id);
  }
}

// Investment Repository
class AsyncStorageInvestmentRepository implements InvestmentRepository {
  async getAll(): Promise<InvestmentSchema[]> {
    return getAll<InvestmentSchema>(STORAGE_KEYS.investments);
  }

  async getById(id: string): Promise<InvestmentSchema | null> {
    return getById<InvestmentSchema>(STORAGE_KEYS.investments, id);
  }

  async create(data: Omit<InvestmentSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvestmentSchema> {
    const now = new Date().toISOString();
    const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: InvestmentSchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.investments, record);
  }

  async update(id: string, data: Partial<InvestmentSchema>): Promise<InvestmentSchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Investment not found');
    return update(STORAGE_KEYS.investments, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.investments, id);
  }
}

// Investment Opportunity Repository
class AsyncStorageInvestmentOpportunityRepository implements InvestmentOpportunityRepository {
  async getAll(): Promise<InvestmentOpportunitySchema[]> {
    return getAll<InvestmentOpportunitySchema>(STORAGE_KEYS.investmentOpportunities);
  }

  async getActive(): Promise<InvestmentOpportunitySchema[]> {
    const all = await this.getAll();
    return all.filter(opp => opp.isActive);
  }

  async getById(id: string): Promise<InvestmentOpportunitySchema | null> {
    return getById<InvestmentOpportunitySchema>(STORAGE_KEYS.investmentOpportunities, id);
  }

  async create(data: Omit<InvestmentOpportunitySchema, 'id' | 'createdAt'>): Promise<InvestmentOpportunitySchema> {
    const now = new Date().toISOString();
    const id = `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: InvestmentOpportunitySchema = {
      ...data,
      id,
      createdAt: now,
    };
    return create(STORAGE_KEYS.investmentOpportunities, record);
  }

  async update(id: string, data: Partial<InvestmentOpportunitySchema>): Promise<InvestmentOpportunitySchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Investment opportunity not found');
    return update(STORAGE_KEYS.investmentOpportunities, id, data);
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.investmentOpportunities, id);
  }
}

// Credit Card Repository
class AsyncStorageCreditCardRepository implements CreditCardRepository {
  async getAll(): Promise<CreditCardSchema[]> {
    return getAll<CreditCardSchema>(STORAGE_KEYS.creditCards);
  }

  async getActive(): Promise<CreditCardSchema[]> {
    const all = await this.getAll();
    return all.filter(card => card.isActive);
  }

  async getById(id: string): Promise<CreditCardSchema | null> {
    return getById<CreditCardSchema>(STORAGE_KEYS.creditCards, id);
  }

  async create(data: Omit<CreditCardSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<CreditCardSchema> {
    const now = new Date().toISOString();
    const id = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: CreditCardSchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.creditCards, record);
  }

  async update(id: string, data: Partial<CreditCardSchema>): Promise<CreditCardSchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Credit card not found');
    return update(STORAGE_KEYS.creditCards, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.creditCards, id);
  }
}

// Recurring Expense Repository
class AsyncStorageRecurringExpenseRepository implements RecurringExpenseRepository {
  async getAll(): Promise<RecurringExpenseSchema[]> {
    return getAll<RecurringExpenseSchema>(STORAGE_KEYS.recurringExpenses);
  }

  async getActive(): Promise<RecurringExpenseSchema[]> {
    const all = await this.getAll();
    return all.filter(expense => expense.isActive);
  }

  async getById(id: string): Promise<RecurringExpenseSchema | null> {
    return getById<RecurringExpenseSchema>(STORAGE_KEYS.recurringExpenses, id);
  }

  async create(data: Omit<RecurringExpenseSchema, 'id' | 'createdAt' | 'updatedAt'>): Promise<RecurringExpenseSchema> {
    const now = new Date().toISOString();
    const id = `recur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const record: RecurringExpenseSchema = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    return create(STORAGE_KEYS.recurringExpenses, record);
  }

  async update(id: string, data: Partial<RecurringExpenseSchema>): Promise<RecurringExpenseSchema> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Recurring expense not found');
    return update(STORAGE_KEYS.recurringExpenses, id, { ...data, updatedAt: new Date().toISOString() });
  }

  async delete(id: string): Promise<void> {
    return remove(STORAGE_KEYS.recurringExpenses, id);
  }
}

// Main AsyncStorage Adapter
export class AsyncStorageAdapter implements DatabaseAdapter {
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

  constructor() {
    this.transactions = new AsyncStorageTransactionRepository();
    this.categories = new AsyncStorageCategoryRepository();
    this.fixedExpenses = new AsyncStorageFixedExpenseRepository();
    this.installmentPurchases = new AsyncStorageInstallmentPurchaseRepository();
    this.installmentPayments = new AsyncStorageInstallmentPaymentRepository();
    this.assets = new AsyncStorageAssetRepository();
    this.liabilities = new AsyncStorageLiabilityRepository();
    this.investments = new AsyncStorageInvestmentRepository();
    this.investmentOpportunities = new AsyncStorageInvestmentOpportunityRepository();
    this.creditCards = new AsyncStorageCreditCardRepository();
    this.recurringExpenses = new AsyncStorageRecurringExpenseRepository();
  }

  async initialize(): Promise<void> {
    // Initialize default categories if they don't exist
    const existingCategories = await this.categories.getAll();
    if (existingCategories.length === 0) {
      console.log('Initializing default categories...');
      for (const category of DEFAULT_CATEGORIES) {
        // Check if category already exists by ID
        const existing = await this.categories.getById(category.id);
        if (!existing) {
          const categoryData = convertCategoryToSchema(category);
          // Create with the same ID as the default category
          const now = new Date().toISOString();
          const record: CategorySchema = {
            ...categoryData,
            id: category.id,
            createdAt: now,
            updatedAt: now,
          };
          await create(STORAGE_KEYS.categories, record);
        }
      }
      console.log('Default categories initialized');
    }
  }
}
