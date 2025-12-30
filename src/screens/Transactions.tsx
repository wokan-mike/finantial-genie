import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import MonthSelector from '../components/MonthSelector';
import TransactionForm from '../components/forms/TransactionForm';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export default function Transactions() {
  const { transactions, loading, deleteTransaction, refresh } = useTransactions();
  const { theme, isDark } = useTheme();
  const themeColors = getThemeColors(theme);
  const { showToast } = useToast();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const filteredTransactions = transactions.filter(txn => {
    // Filter by type
    if (filter !== 'all' && txn.type !== filter) return false;
    
    // Filter by month
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const txnDate = parseISO(txn.date);
    return isWithinInterval(txnDate, { start: monthStart, end: monthEnd });
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
    const dynamicItemStyles = StyleSheet.create({
      transactionItem: {
        backgroundColor: themeColors.background,
        borderRadius: 8,
        padding: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
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
      <View style={dynamicItemStyles.transactionItem}>
        <View style={styles.transactionContent}>
          <View style={styles.transactionInfo}>
            <Text style={dynamicItemStyles.transactionDescription}>{item.description}</Text>
            <Text style={dynamicItemStyles.transactionDate}>{formatDate(item.date)}</Text>
            {item.tags.length > 0 && (
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
        onRequestClose={() => setShowForm(false)}
      >
        <TransactionForm
          onClose={() => {
            setShowForm(false);
            refresh();
          }}
          initialDate={selectedMonth}
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
    ...typography.h4,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.body,
  },
});

