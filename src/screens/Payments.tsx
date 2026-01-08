import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { usePayments } from '../hooks/usePayments';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getYear, getMonth } from 'date-fns';
import Card from '../components/common/Card';
import { toTitleCase } from '../utils/textHelpers';
import { isDesktop, getCardPadding, getContainerMaxWidth } from '../utils/responsive';

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
    contentWrapper: {
      maxWidth: getContainerMaxWidth(),
      width: '100%',
      alignSelf: 'center',
      ...(Platform.OS === 'web' && {
        paddingLeft: isDesktop ? spacing.xl : spacing.md,
        paddingRight: isDesktop ? spacing.xl : spacing.md,
      }),
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
      fontWeight: '400',
    },
    cardTitle: {
      ...typography.h4,
      color: themeColors.text,
      marginBottom: spacing.md,
      fontWeight: '600',
      fontSize: isDesktop ? 18 : 16,
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
      fontWeight: '400',
    },
    summaryValue: {
      fontSize: isDesktop ? 20 : 18,
      fontWeight: '700',
      letterSpacing: -0.01,
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
      fontSize: isDesktop ? 36 : 32,
      fontWeight: '700',
      letterSpacing: -0.02,
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
      fontSize: isDesktop ? 20 : 18,
      color: themeColors.text,
      fontWeight: '700',
      letterSpacing: -0.01,
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
    <ScrollView 
      style={dynamicStyles.container} 
      contentContainerStyle={dynamicStyles.content}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
    >
      <View style={dynamicStyles.contentWrapper}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Pagos del Mes</Text>
          <Text style={dynamicStyles.subtitle}>
            {new Date(currentYear, currentMonth - 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </Text>
        </View>

        {/* Resumen General */}
        <Card padding={getCardPadding()} marginBottom={spacing.lg}>
          <Text style={dynamicStyles.cardTitle}>{toTitleCase('Resumen')}</Text>
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
        <View style={dynamicStyles.summaryRow}>
          <Text style={dynamicStyles.summaryLabel}>Cargos Recurrentes</Text>
          <Text style={[dynamicStyles.summaryValue, dynamicStyles.expense]}>
            -{formatCurrency(paymentSummary.totalRecurringExpensePayments)}
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
        </Card>

        {/* Pagos de Tarjetas de Crédito */}
        {paymentSummary.creditCardPayments.length > 0 && (
          <Card padding={getCardPadding()} marginBottom={spacing.lg}>
            <Text style={dynamicStyles.cardTitle}>{toTitleCase('Pagos de Tarjetas de Crédito')}</Text>
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
          </Card>
        )}

        {/* Pagos a Meses (sin tarjeta) */}
        {paymentSummary.installmentPayments.length > 0 && (
          <Card padding={getCardPadding()} marginBottom={spacing.lg}>
            <Text style={dynamicStyles.cardTitle}>{toTitleCase('Pagos a Meses')}</Text>
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
          </Card>
        )}

        {/* Cargos Recurrentes */}
        {paymentSummary.recurringExpensePayments.length > 0 && (
          <Card padding={getCardPadding()} marginBottom={spacing.lg}>
            <Text style={dynamicStyles.cardTitle}>{toTitleCase('Cargos Recurrentes')}</Text>
          {paymentSummary.recurringExpensePayments.map((payment) => {
            const getTypeLabel = (type: string) => {
              const labels: Record<string, string> = {
                rent: 'Renta',
                car_loan: 'Crédito de Coche',
                mortgage: 'Hipoteca',
                other: 'Otro',
              };
              return labels[type] || 'Otro';
            };
            
            return (
              <View
                key={payment.expenseId}
                style={[dynamicStyles.paymentItem, { borderLeftColor: themeColors.secondary }]}
              >
                <View style={dynamicStyles.paymentInfo}>
                  <Text style={dynamicStyles.paymentName}>
                    {payment.expenseName}
                  </Text>
                  <Text style={dynamicStyles.paymentDetails}>
                    {getTypeLabel(payment.expenseType)} • Vence: {formatDate(payment.dueDate.toISOString())}
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
            );
          })}
          </Card>
        )}

        {/* Mensaje si no hay pagos */}
        {paymentSummary.creditCardPayments.length === 0 &&
          paymentSummary.installmentPayments.length === 0 &&
          paymentSummary.recurringExpensePayments.length === 0 && (
            <Card padding={getCardPadding()}>
              <Text style={dynamicStyles.emptyText}>
                No hay pagos programados para este mes
              </Text>
            </Card>
          )}
      </View>
    </ScrollView>
  );
}
