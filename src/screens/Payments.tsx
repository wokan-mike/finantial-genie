import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { usePayments } from '../hooks/usePayments';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getYear, getMonth } from 'date-fns';

export default function Payments() {
  const currentYear = getYear(new Date());
  const currentMonth = getMonth(new Date()) + 1;
  const { paymentSummary, loading, error } = usePayments(currentYear, currentMonth);
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.surface,
    },
    content: {
      padding: spacing.md,
    },
    header: {
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h1,
      color: themeColors.primary,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    subtitle: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
    },
    card: {
      backgroundColor: themeColors.background,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cardTitle: {
      ...typography.h4,
      color: themeColors.textSecondary,
      marginBottom: spacing.md,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    summaryLabel: {
      ...typography.body,
      color: themeColors.text,
      flex: 1,
    },
    summaryValue: {
      ...typography.h4,
      fontWeight: '700',
    },
    income: {
      color: themeColors.accent,
    },
    expense: {
      color: themeColors.secondary,
    },
    balanceContainer: {
      alignItems: 'center',
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      marginTop: spacing.sm,
    },
    balanceLabel: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
    },
    balanceValue: {
      ...typography.h1,
      fontWeight: '700',
    },
    positive: {
      color: themeColors.accent,
    },
    negative: {
      color: themeColors.secondary,
    },
    paymentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: themeColors.surface,
      borderRadius: 8,
      marginBottom: spacing.sm,
      borderLeftWidth: 4,
    },
    paymentInfo: {
      flex: 1,
      marginLeft: spacing.sm,
    },
    paymentName: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    paymentDetails: {
      ...typography.caption,
      color: themeColors.textSecondary,
    },
    paymentAmount: {
      ...typography.h4,
      color: themeColors.text,
      fontWeight: '700',
    },
    emptyText: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      padding: spacing.md,
    },
    daysBadge: {
      backgroundColor: themeColors.primary + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: spacing.xs,
      alignSelf: 'flex-start',
    },
    daysBadgeText: {
      ...typography.caption,
      color: themeColors.primary,
      fontWeight: '600',
    },
    urgentBadge: {
      backgroundColor: themeColors.error + '20',
    },
    urgentBadgeText: {
      color: themeColors.error,
    },
  });

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.text }}>Cargando...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.error }}>Error: {error}</Text>
      </View>
    );
  }

  if (!paymentSummary) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.text }}>No hay datos disponibles</Text>
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.content}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Pagos del Mes</Text>
        <Text style={dynamicStyles.subtitle}>
          {new Date(currentYear, currentMonth - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {/* Resumen General */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.cardTitle}>Resumen</Text>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Ingresos del Mes</Text>
          <Text style={[dynamicStyles.summaryValue, dynamicStyles.income]}>
            {formatCurrency(paymentSummary.monthIncome)}
          </Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Pagos de Tarjetas</Text>
          <Text style={[dynamicStyles.summaryValue, dynamicStyles.expense]}>
            -{formatCurrency(paymentSummary.totalCreditCardPayments)}
          </Text>
        </View>
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Pagos a Meses</Text>
          <Text style={[dynamicStyles.summaryValue, dynamicStyles.expense]}>
            -{formatCurrency(paymentSummary.totalInstallmentPayments)}
          </Text>
        </View>
        <View style={dynamicStyles.balanceContainer}>
          <Text style={dynamicStyles.balanceLabel}>Disponible Después de Pagos</Text>
          <Text
            style={[
              dynamicStyles.balanceValue,
              paymentSummary.availableAfterPayments >= 0 ? dynamicStyles.positive : dynamicStyles.negative,
            ]}
          >
            {formatCurrency(paymentSummary.availableAfterPayments)}
          </Text>
        </View>
      </View>

      {/* Pagos de Tarjetas de Crédito */}
      {paymentSummary.creditCardPayments.length > 0 && (
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>Pagos de Tarjetas de Crédito</Text>
          {paymentSummary.creditCardPayments.map((payment) => (
            <View
              key={payment.cardId}
              style={[dynamicStyles.paymentItem, { borderLeftColor: payment.cardColor }]}
            >
              <View style={dynamicStyles.paymentInfo}>
                <Text style={dynamicStyles.paymentName}>
                  {payment.cardName} ({payment.bank})
                </Text>
                <Text style={dynamicStyles.paymentDetails}>
                  Vence: {formatDate(payment.dueDate.toISOString())}
                </Text>
                {payment.normalExpenses > 0 && payment.installmentExpenses > 0 && (
                  <Text style={[dynamicStyles.paymentDetails, { marginTop: spacing.xs }]}>
                    Gastos: {formatCurrency(payment.normalExpenses)} | A meses: {formatCurrency(payment.installmentExpenses)}
                  </Text>
                )}
                <View
                  style={[
                    dynamicStyles.daysBadge,
                    payment.daysUntilDue <= 7 && dynamicStyles.urgentBadge,
                  ]}
                >
                  <Text
                    style={[
                      dynamicStyles.daysBadgeText,
                      payment.daysUntilDue <= 7 && dynamicStyles.urgentBadgeText,
                    ]}
                  >
                    {payment.daysUntilDue > 0
                      ? `${payment.daysUntilDue} días restantes`
                      : payment.daysUntilDue === 0
                      ? 'Vence hoy'
                      : `Vencido hace ${Math.abs(payment.daysUntilDue)} días`}
                  </Text>
                </View>
              </View>
              <Text style={dynamicStyles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Pagos a Meses (sin tarjeta) */}
      {paymentSummary.installmentPayments.length > 0 && (
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>Pagos a Meses</Text>
          {paymentSummary.installmentPayments.map((payment, index) => (
            <View
              key={`${payment.purchaseId}-${payment.paymentNumber}-${index}`}
              style={[dynamicStyles.paymentItem, { borderLeftColor: themeColors.primary }]}
            >
              <View style={dynamicStyles.paymentInfo}>
                <Text style={dynamicStyles.paymentName}>
                  {payment.purchaseName} - Pago #{payment.paymentNumber}
                </Text>
                <Text style={dynamicStyles.paymentDetails}>
                  Vence: {formatDate(payment.dueDate.toISOString())}
                </Text>
                <View
                  style={[
                    dynamicStyles.daysBadge,
                    payment.daysUntilDue <= 7 && dynamicStyles.urgentBadge,
                  ]}
                >
                  <Text
                    style={[
                      dynamicStyles.daysBadgeText,
                      payment.daysUntilDue <= 7 && dynamicStyles.urgentBadgeText,
                    ]}
                  >
                    {payment.daysUntilDue > 0
                      ? `${payment.daysUntilDue} días restantes`
                      : payment.daysUntilDue === 0
                      ? 'Vence hoy'
                      : `Vencido hace ${Math.abs(payment.daysUntilDue)} días`}
                  </Text>
                </View>
              </View>
              <Text style={dynamicStyles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Mensaje si no hay pagos */}
      {paymentSummary.creditCardPayments.length === 0 &&
        paymentSummary.installmentPayments.length === 0 && (
          <View style={dynamicStyles.card}>
            <Text style={dynamicStyles.emptyText}>
              No hay pagos programados para este mes
            </Text>
          </View>
        )}
    </ScrollView>
  );
}
