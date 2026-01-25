import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_PAID_CREDIT_CARD = '@FinancialGenie:paidCreditCardPayments';
const STORAGE_KEY_PAID_RECURRING = '@FinancialGenie:paidRecurringExpensePayments';

/**
 * Helper to get paid credit card payments
 */
export async function getPaidCreditCardPayments(): Promise<Set<string>> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEY_PAID_CREDIT_CARD);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } else {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_PAID_CREDIT_CARD);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
  } catch {
    return new Set();
  }
}

/**
 * Helper to save paid credit card payments
 */
export async function savePaidCreditCardPayments(payments: Set<string>): Promise<void> {
  try {
    const array = Array.from(payments);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY_PAID_CREDIT_CARD, JSON.stringify(array));
    } else {
      await AsyncStorage.setItem(STORAGE_KEY_PAID_CREDIT_CARD, JSON.stringify(array));
    }
  } catch (error) {
    console.error('Error saving paid credit card payments:', error);
  }
}

/**
 * Helper to get paid recurring expense payments
 */
export async function getPaidRecurringExpensePayments(): Promise<Set<string>> {
  try {
    if (Platform.OS === 'web') {
      const stored = localStorage.getItem(STORAGE_KEY_PAID_RECURRING);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } else {
      const stored = await AsyncStorage.getItem(STORAGE_KEY_PAID_RECURRING);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
  } catch {
    return new Set();
  }
}

/**
 * Helper to save paid recurring expense payments
 */
export async function savePaidRecurringExpensePayments(payments: Set<string>): Promise<void> {
  try {
    const array = Array.from(payments);
    if (Platform.OS === 'web') {
      localStorage.setItem(STORAGE_KEY_PAID_RECURRING, JSON.stringify(array));
    } else {
      await AsyncStorage.setItem(STORAGE_KEY_PAID_RECURRING, JSON.stringify(array));
    }
  } catch (error) {
    console.error('Error saving paid recurring expense payments:', error);
  }
}
