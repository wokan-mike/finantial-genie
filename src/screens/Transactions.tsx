import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useTransactions } from '../hooks/useTransactions';
import { useCreditCards } from '../hooks/useCreditCards';
import { useInstallments } from '../hooks/useInstallments';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import MonthSelector from '../components/MonthSelector';
import TransactionForm from '../components/forms/TransactionForm';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, isSameMonth } from 'date-fns';
import { getPaymentsForCurrentMonth } from '../services/calculations/installmentCalculator';
import { isInCurrentBillingCycle, getLastCutDate, getNextCutDate } from '../services/calculations/creditCardExpenses';
import { TransactionSchema } from '../services/database/schema';
import Card from '../components/common/Card';
import { isDesktop, getCardPadding } from '../utils/responsive';

export default function Transactions() {
  const { transactions, loading, deleteTransaction, refresh } = useTransactions();
  const { creditCards } = useCreditCards();
  const { payments } = useInstallments();
  const { theme, isDark } = useTheme();
  const themeColors = getThemeColors(theme);
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<typeof transactions[0] | null>(null);

  // Get installment payments for the selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const monthPayments = payments.filter(payment => {
    if (payment.status !== 'pending') return false;
    const dueDate = parseISO(payment.dueDate);
    return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
  });

  // Get the purchase for each payment to get credit card association
  const { purchases } = useInstallments();
  
  // Convert installment payments to virtual transactions for display
  const virtualTransactions: (TransactionSchema & { isInstallment?: boolean; paymentId?: string })[] = monthPayments.map(payment => {
    const purchase = purchases.find(p => p.id === payment.installmentPurchaseId);
    return {
      id: `installment_${payment.id}`,
      type: 'expense' as const,
      amount: payment.amount,
      description: `Pago a meses - Pago #${payment.paymentNumber}`,
      tags: [],
      date: payment.dueDate,
      isRecurring: false,
      creditCardId: purchase?.creditCardId || null,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
      isInstallment: true,
      paymentId: payment.id,
    };
  });

  // Combine real transactions with virtual installment transactions
  const allTransactions = [...transactions, ...virtualTransactions];

  const filteredTransactions = allTransactions.filter(txn => {
    // Filter by type
    if (filter !== 'all' && txn.type !== filter) return false;
    
    // Filter by month
    const txnDate = parseISO(txn.date);
    const isInSelectedMonth = isWithinInterval(txnDate, { start: monthStart, end: monthEnd });
    
    // If transaction is associated with a credit card, check if it should be shown
    if (txn.creditCardId && txn.type === 'expense' && !(txn as any).isInstallment) {
      const card = creditCards.find(c => c.id === txn.creditCardId);
      if (card) {
        const transactionDate = parseISO(txn.date);
        const today = new Date();
        
        // Get the cut date that applies to this transaction
        // If viewing current month, only show transactions that have passed their cut date
        const isCurrentMonth = isSameMonth(selectedMonth, today);
        
        if (isCurrentMonth) {
          // For current month, only show if the cut date has passed
          const lastCutDate = getLastCutDate(card, today);
          // Show if transaction is after the last cut date (it's been billed)
          return isInSelectedMonth && transactionDate >= lastCutDate;
        } else {
          // For past/future months, show all transactions in that month
          return isInSelectedMonth;
        }
      }
    }
    
    // For non-credit card transactions, show normally
    return isInSelectedMonth;
  });

  const handleDelete = async (id: string, description: string) => {
    console.log('[handleDelete] Called with id:', id, 'description:', description);
    
    // Use window.confirm for web, Alert.alert for native
    const confirmMessage = `¿Estás seguro de eliminar "${description}"?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      // For native, use Alert.alert
      return new Promise<void>((resolve) => {
        Alert.alert(
          'Eliminar Transacción',
          confirmMessage,
          [
            { 
              text: 'Cancelar', 
              style: 'cancel',
              onPress: () => resolve()
            },
            {
              text: 'Eliminar',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('[handleDelete] User confirmed deletion for:', id);
                  await deleteTransaction(id);
                  console.log('[handleDelete] deleteTransaction completed');
                  showToast('Transacción eliminada correctamente', 'success');
                  await refresh();
                  console.log('[handleDelete] Refresh completed');
                  resolve();
                } catch (error) {
                  console.error('[handleDelete] Error:', error);
                  showToast('Error al eliminar la transacción', 'error');
                  resolve();
                }
              },
            },
          ]
        );
      });
    }
    
    if (confirmed) {
      try {
        console.log('[handleDelete] User confirmed deletion for:', id);
        await deleteTransaction(id);
        console.log('[handleDelete] deleteTransaction completed');
        showToast('Transacción eliminada correctamente', 'success');
        await refresh();
        console.log('[handleDelete] Refresh completed');
      } catch (error) {
        console.error('[handleDelete] Error:', error);
        showToast('Error al eliminar la transacción', 'error');
      }
    } else {
      console.log('[handleDelete] User cancelled deletion');
    }
  };

  const renderTransaction = ({ item }: { item: typeof transactions[0] }) => {
    // Check if this is an installment payment
    const isInstallment = (item as any).isInstallment === true;
    
    // Get credit card color if transaction is associated with a card
    const associatedCard = item.creditCardId 
      ? creditCards.find(card => card.id === item.creditCardId)
      : null;
    const cardColor = associatedCard?.color || null;

    const dynamicItemStyles = StyleSheet.create({
      transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
        borderLeftWidth: cardColor ? 4 : 0,
        borderLeftColor: cardColor || 'transparent',
      },
      transactionDescription: {
        ...typography.body,
        color: themeColors.text,
        marginBottom: spacing.xs,
      },
      transactionDate: {
        ...typography.caption,
        color: themeColors.textSecondary,
        marginBottom: spacing.xs,
      },
      tag: {
        backgroundColor: themeColors.primary + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 4,
      },
      tagText: {
        ...typography.caption,
        color: themeColors.primary,
      },
    });

    return (
      <Card padding={getCardPadding()} marginBottom={spacing.md}>
        <View style={dynamicItemStyles.transactionItem}>
          <View style={styles.transactionContent}>
          <View style={styles.transactionInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
              <Text style={dynamicItemStyles.transactionDescription}>{item.description}</Text>
              {isInstallment && (
                <View style={{
                  backgroundColor: themeColors.secondary + '30',
                  paddingHorizontal: spacing.xs,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}>
                  <Text style={{
                    ...typography.caption,
                    color: themeColors.secondary,
                    fontWeight: '600',
                  }}>
                    A Meses
                  </Text>
                </View>
              )}
            </View>
            <Text style={dynamicItemStyles.transactionDate}>{formatDate(item.date)}</Text>
            {!isInstallment && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.slice(0, 3).map(tag => (
                  <View key={tag} style={dynamicItemStyles.tag}>
                    <Text style={dynamicItemStyles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          <Text
            style={[
              styles.transactionAmount,
              { color: item.type === 'income' ? themeColors.accent : themeColors.secondary },
            ]}
          >
            {item.type === 'income' ? '+' : '-'}
            {formatCurrency(item.amount)}
          </Text>
        </View>
        {!isInstallment && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: themeColors.primary + '40' }]}
              onPress={(e?: any) => {
                if (e) {
                  e.stopPropagation();
                }
                setEditingTransaction(item);
                setShowForm(true);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.editButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, { backgroundColor: themeColors.error + '40' }]}
              onPress={(e?: any) => {
                if (e) {
                  e.stopPropagation();
                }
                console.log('Delete button pressed for:', item.id);
                handleDelete(item.id, item.description);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.surface,
    },
    header: {
      padding: spacing.md,
      backgroundColor: themeColors.background,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      ...typography.h1,
      color: themeColors.primary,
    },
    addButton: {
      backgroundColor: themeColors.secondary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
    },
    addButtonText: {
      ...typography.button,
      color: themeColors.background,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Transacciones</Text>
        <TouchableOpacity style={dynamicStyles.addButton} onPress={() => setShowForm(true)}>
          <Text style={dynamicStyles.addButtonText}>+ Agregar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.monthSelectorContainer}>
        <MonthSelector selectedDate={selectedMonth} onDateChange={setSelectedMonth} />
      </View>

      <View style={[styles.filtersContainer, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
        <View style={styles.filters}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              filter === 'all' && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
            ]}
            onPress={() => setFilter('all')}
          >
            <Text style={[
              styles.filterText,
              { color: themeColors.text },
              filter === 'all' && { color: themeColors.background }
            ]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              filter === 'income' && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
            ]}
            onPress={() => setFilter('income')}
          >
            <Text style={[
              styles.filterText,
              { color: themeColors.text },
              filter === 'income' && { color: themeColors.background }
            ]}>
              Ingresos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              filter === 'expense' && { backgroundColor: themeColors.primary, borderColor: themeColors.primary }
            ]}
            onPress={() => setFilter('expense')}
          >
            <Text style={[
              styles.filterText,
              { color: themeColors.text },
              filter === 'expense' && { color: themeColors.background }
            ]}>
              Gastos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay transacciones</Text>
          </View>
        }
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowForm(false);
          setEditingTransaction(null);
        }}
      >
        <TransactionForm
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
            refresh();
          }}
          initialDate={selectedMonth}
          transaction={editingTransaction || undefined}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  monthSelectorContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  filtersContainer: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterText: {
    ...typography.bodySmall,
  },
  listContent: {
    padding: spacing.md,
  },
  transactionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
  },
  editButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    width: 40,
    height: 40,
    zIndex: 10,
  },
  editButtonText: {
    fontSize: 18,
  },
  deleteButton: {
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    width: 40,
    height: 40,
    zIndex: 10,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  transactionInfo: {
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  transactionAmount: {
    fontSize: isDesktop ? 18 : 16,
    fontWeight: '700',
    letterSpacing: -0.01,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
  },
});

