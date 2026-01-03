import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Modal } from 'react-native';
import { useInstallments } from '../hooks/useInstallments';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import InstallmentPurchaseForm from '../components/forms/InstallmentPurchaseForm';
import { InstallmentPurchaseSchema } from '../services/database/schema';

export default function Installments() {
  const { purchases, pendingPayments, totalPending, loading, markPaymentAsPaid, deletePurchase, refresh } = useInstallments();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<InstallmentPurchaseSchema | null>(null);

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
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryValue: {
      ...typography.h1,
      color: themeColors.secondary,
      fontWeight: '700',
    },
    purchaseCard: {
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
      ...typography.h4,
      color: themeColors.primary,
      fontWeight: '700',
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
  });

  const renderPurchase = ({ item }: { item: typeof purchases[0] }) => {
    const purchasePayments = pendingPayments.filter(p => p.installmentPurchaseId === item.id);
    const paidCount = item.numberOfMonths - purchasePayments.length;

    return (
      <View style={dynamicStyles.purchaseCard}>
        <TouchableOpacity
          style={dynamicStyles.deleteButton}
          onPress={() => handleDeletePurchase(item.id, item.name)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
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
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.text }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Compras a Meses</Text>
        <TouchableOpacity
          style={[dynamicStyles.addButton, { backgroundColor: themeColors.primary }]}
          onPress={() => {
            setEditingPurchase(null);
            setShowForm(true);
          }}
        >
          <Text style={[dynamicStyles.addButtonText, { color: themeColors.background }]}>
            + Agregar
          </Text>
        </TouchableOpacity>
        <View style={dynamicStyles.summaryCard}>
          <Text style={dynamicStyles.summaryLabel}>Total Pendiente</Text>
          <Text style={dynamicStyles.summaryValue}>{formatCurrency(totalPending)}</Text>
        </View>
      </View>

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

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowForm(false);
          setEditingPurchase(null);
        }}
      >
        <InstallmentPurchaseForm
          onClose={() => {
            setShowForm(false);
            setEditingPurchase(null);
            refresh();
          }}
          purchase={editingPurchase || undefined}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },
});
