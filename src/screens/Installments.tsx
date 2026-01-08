import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Modal } from 'react-native';
import { useInstallments } from '../hooks/useInstallments';
import { useRecurringExpenses } from '../hooks/useRecurringExpenses';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import InstallmentPurchaseForm from '../components/forms/InstallmentPurchaseForm';
import RecurringExpenseForm from '../components/forms/RecurringExpenseForm';
import { InstallmentPurchaseSchema, RecurringExpenseSchema } from '../services/database/schema';
import { getYear, getMonth, setDate, isBefore, isAfter, parseISO } from 'date-fns';
import Card from '../components/common/Card';
import { toTitleCase } from '../utils/textHelpers';
import { isDesktop, getCardPadding } from '../utils/responsive';

type TabType = 'purchases' | 'recurring';

export default function Installments() {
  const { purchases, pendingPayments, totalPending, loading, markPaymentAsPaid, deletePurchase, refresh } = useInstallments();
  const { expenses: recurringExpenses, loading: loadingRecurring, deleteExpense: deleteRecurring, refresh: refreshRecurring } = useRecurringExpenses();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('purchases');
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<InstallmentPurchaseSchema | null>(null);
  const [editingExpense, setEditingExpense] = useState<RecurringExpenseSchema | null>(null);

  const handleDeletePurchase = async (id: string, name: string) => {
    const confirmMessage = `¿Estás seguro de eliminar "${name}"? Esto también eliminará todos los pagos relacionados.`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      // For native, would use Alert.alert
      return;
    }
    
    if (confirmed) {
      try {
        await deletePurchase(id);
        showToast('Compra eliminada correctamente', 'success');
      } catch (error) {
        showToast('Error al eliminar la compra', 'error');
      }
    }
  };

  const handleDeleteRecurring = async (id: string, name: string) => {
    const confirmMessage = `¿Estás seguro de eliminar "${name}"?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      return;
    }
    
    if (confirmed) {
      try {
        await deleteRecurring(id);
        showToast('Cargo recurrente eliminado correctamente', 'success');
      } catch (error) {
        showToast('Error al eliminar el cargo recurrente', 'error');
      }
    }
  };

  // Calculate total monthly recurring expenses for current month
  const getCurrentMonthRecurringTotal = () => {
    const today = new Date();
    const currentYear = getYear(today);
    const currentMonth = getMonth(today) + 1;
    const currentDate = setDate(today, 1);
    
    return recurringExpenses
      .filter(expense => {
        if (!expense.isActive) return false;
        
        const startDate = parseISO(expense.startDate);
        const startMonth = getMonth(startDate) + 1;
        const startYear = getYear(startDate);
        
        // Check if expense has started
        if (startYear > currentYear || (startYear === currentYear && startMonth > currentMonth)) {
          return false;
        }
        
        // Check if expense has ended
        if (expense.endDate) {
          const endDate = parseISO(expense.endDate);
          const endMonth = getMonth(endDate) + 1;
          const endYear = getYear(endDate);
          
          if (endYear < currentYear || (endYear === currentYear && endMonth < currentMonth)) {
            return false;
          }
        }
        
        return true;
      })
      .reduce((sum, expense) => sum + expense.monthlyAmount, 0);
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.surface,
    },
    header: {
      padding: spacing.lg,
      backgroundColor: themeColors.background,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      ...typography.h1,
      color: themeColors.primary,
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    summaryCard: {
      backgroundColor: themeColors.secondary + '20',
      padding: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.secondary + '40',
    },
    summaryLabel: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
      fontWeight: '400',
    },
    summaryValue: {
      fontSize: isDesktop ? 36 : 32,
      color: themeColors.secondary,
      fontWeight: '700',
      letterSpacing: -0.02,
    },
    deleteButton: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
      padding: spacing.sm,
      zIndex: 100,
      backgroundColor: themeColors.error + '40',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
    },
    deleteButtonText: {
      fontSize: 18,
    },
    purchaseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    purchaseName: {
      ...typography.h4,
      color: themeColors.text,
      flex: 1,
      fontWeight: '600',
    },
    purchaseAmount: {
      fontSize: isDesktop ? 20 : 18,
      color: themeColors.primary,
      fontWeight: '700',
      letterSpacing: -0.01,
    },
    purchaseInfo: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
    },
    paymentsContainer: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    paymentsTitle: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
    paymentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      marginBottom: spacing.xs,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    paymentInfo: {
      flex: 1,
    },
    paymentNumber: {
      ...typography.bodySmall,
      color: themeColors.text,
      fontWeight: '600',
    },
    paymentDate: {
      ...typography.caption,
      color: themeColors.textSecondary,
    },
    paymentAmount: {
      ...typography.body,
      color: themeColors.primary,
      fontWeight: '700',
    },
    emptyContainer: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      ...typography.body,
      color: themeColors.textSecondary,
      fontStyle: 'italic',
    },
    addButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    addButtonText: {
      ...typography.body,
      fontWeight: '600',
    },
    tabContainer: {
      flexDirection: 'row',
      marginBottom: spacing.md,
      backgroundColor: themeColors.surface,
      borderRadius: 12,
      padding: spacing.xs,
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: themeColors.primary,
    },
    tabInactive: {
      backgroundColor: 'transparent',
    },
    tabText: {
      ...typography.body,
      fontWeight: '600',
    },
    tabTextActive: {
      color: themeColors.background,
    },
    tabTextInactive: {
      color: themeColors.textSecondary,
    },
    expenseCard: {
      backgroundColor: themeColors.background,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      position: 'relative',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    expenseType: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    expenseAmount: {
      fontSize: isDesktop ? 20 : 18,
      color: themeColors.primary,
      fontWeight: '700',
      letterSpacing: -0.01,
      marginTop: spacing.xs,
    },
    expenseInfo: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginTop: spacing.xs,
    },
  });

  const getExpenseTypeLabel = (type: RecurringExpenseSchema['type']) => {
    const labels = {
      rent: 'Renta',
      car_loan: 'Crédito de Coche',
      mortgage: 'Hipoteca',
      other: 'Otro',
    };
    return labels[type];
  };

  const renderPurchase = ({ item }: { item: typeof purchases[0] }) => {
    const purchasePayments = pendingPayments.filter(p => p.installmentPurchaseId === item.id);
    const paidCount = item.numberOfMonths - purchasePayments.length;

    return (
      <Card padding={getCardPadding()} marginBottom={spacing.lg}>
        <TouchableOpacity
          style={[dynamicStyles.deleteButton, { position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 100 }]}
          onPress={() => handleDeletePurchase(item.id, item.name)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setEditingPurchase(item);
            setShowForm(true);
          }}
        >
          <View style={dynamicStyles.purchaseHeader}>
            <Text style={dynamicStyles.purchaseName}>{item.name}</Text>
            <Text style={dynamicStyles.purchaseAmount}>{formatCurrency(item.totalAmount)}</Text>
          </View>
          <Text style={dynamicStyles.purchaseInfo}>
            {paidCount} / {item.numberOfMonths} pagos realizados
          </Text>
          <Text style={dynamicStyles.purchaseInfo}>
            Pago mensual: {formatCurrency(item.monthlyPayment)}
          </Text>
          {purchasePayments.length > 0 && (
            <View style={dynamicStyles.paymentsContainer}>
              <Text style={dynamicStyles.paymentsTitle}>Próximos pagos:</Text>
              {purchasePayments.slice(0, 3).map(payment => (
                <TouchableOpacity
                  key={payment.id}
                  style={dynamicStyles.paymentItem}
                  onPress={() => markPaymentAsPaid(payment.id)}
                >
                  <View style={dynamicStyles.paymentInfo}>
                    <Text style={dynamicStyles.paymentNumber}>Pago #{payment.paymentNumber}</Text>
                    <Text style={dynamicStyles.paymentDate}>{formatDate(payment.dueDate)}</Text>
                  </View>
                  <Text style={dynamicStyles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  const renderRecurringExpense = ({ item }: { item: RecurringExpenseSchema }) => {
    return (
      <Card padding={getCardPadding()} marginBottom={spacing.lg}>
        <TouchableOpacity
          style={[dynamicStyles.deleteButton, { position: 'absolute', top: spacing.sm, right: spacing.sm, zIndex: 100 }]}
          onPress={() => handleDeleteRecurring(item.id, item.name)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setEditingExpense(item);
            setShowForm(true);
          }}
        >
          <Text style={dynamicStyles.expenseType}>{getExpenseTypeLabel(item.type)}</Text>
          <Text style={dynamicStyles.purchaseName}>{item.name}</Text>
          <Text style={dynamicStyles.expenseAmount}>{formatCurrency(item.monthlyAmount)}</Text>
          <Text style={dynamicStyles.expenseInfo}>
            Pago cada día {item.paymentDay} del mes
          </Text>
          {item.endDate && (
            <Text style={dynamicStyles.expenseInfo}>
              Finaliza: {formatDate(item.endDate)}
            </Text>
          )}
          {item.description && (
            <Text style={[dynamicStyles.expenseInfo, { marginTop: spacing.sm }]}>
              {item.description}
            </Text>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading || loadingRecurring) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.text }}>Cargando...</Text>
      </View>
    );
  }

  const activeRecurringExpenses = recurringExpenses.filter(e => e.isActive);
  const currentMonthRecurringTotal = getCurrentMonthRecurringTotal();

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Pagos a Meses</Text>
        
        {/* Tabs */}
        <View style={dynamicStyles.tabContainer}>
          <TouchableOpacity
            style={[dynamicStyles.tab, activeTab === 'purchases' ? dynamicStyles.tabActive : dynamicStyles.tabInactive]}
            onPress={() => setActiveTab('purchases')}
          >
            <Text style={[
              dynamicStyles.tabText,
              activeTab === 'purchases' ? dynamicStyles.tabTextActive : dynamicStyles.tabTextInactive
            ]}>
              Compras
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.tab, activeTab === 'recurring' ? dynamicStyles.tabActive : dynamicStyles.tabInactive]}
            onPress={() => setActiveTab('recurring')}
          >
            <Text style={[
              dynamicStyles.tabText,
              activeTab === 'recurring' ? dynamicStyles.tabTextActive : dynamicStyles.tabTextInactive
            ]}>
              Recurrentes
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[dynamicStyles.addButton, { backgroundColor: themeColors.primary }]}
          onPress={() => {
            if (activeTab === 'purchases') {
              setEditingPurchase(null);
              setEditingExpense(null);
            } else {
              setEditingExpense(null);
              setEditingPurchase(null);
            }
            setShowForm(true);
          }}
        >
          <Text style={[dynamicStyles.addButtonText, { color: themeColors.background }]}>
            + Agregar {activeTab === 'purchases' ? 'Compra' : 'Cargo'}
          </Text>
        </TouchableOpacity>

        {activeTab === 'purchases' ? (
        <Card padding={getCardPadding()} marginBottom={spacing.lg}>
          <Text style={dynamicStyles.summaryLabel}>{toTitleCase('Total Pendiente')}</Text>
          <Text style={dynamicStyles.summaryValue}>{formatCurrency(totalPending)}</Text>
        </Card>
        ) : (
          <Card padding={getCardPadding()} marginBottom={spacing.lg}>
            <Text style={dynamicStyles.summaryLabel}>{toTitleCase('Total Mensual Actual')}</Text>
            <Text style={dynamicStyles.summaryValue}>{formatCurrency(currentMonthRecurringTotal)}</Text>
          </Card>
        )}
      </View>

      {activeTab === 'purchases' ? (
        <FlatList
          data={purchases}
          renderItem={renderPurchase}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={dynamicStyles.emptyContainer}>
              <Text style={dynamicStyles.emptyText}>No hay compras a meses registradas</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activeRecurringExpenses}
          renderItem={renderRecurringExpense}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={dynamicStyles.emptyContainer}>
              <Text style={dynamicStyles.emptyText}>No hay cargos recurrentes registrados</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowForm(false);
          setEditingPurchase(null);
          setEditingExpense(null);
        }}
      >
        {activeTab === 'purchases' ? (
          <InstallmentPurchaseForm
            onClose={() => {
              setShowForm(false);
              setEditingPurchase(null);
              refresh();
            }}
            purchase={editingPurchase || undefined}
          />
        ) : (
          <RecurringExpenseForm
            onClose={() => {
              setShowForm(false);
              setEditingExpense(null);
              refreshRecurring();
            }}
            expense={editingExpense || undefined}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },
});
