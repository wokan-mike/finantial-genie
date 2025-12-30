import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useFinancialSummary } from '../hooks/useFinancialSummary';
import { useExpenseAnalysis } from '../hooks/useExpenseAnalysis';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export default function Dashboard() {
  const { monthlySummary, netWorth, installmentTotalPending, loading } = useFinancialSummary();
  const { categoryExpenses } = useExpenseAnalysis();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  // Calculate available amount (income - expenses)
  const availableAmount = monthlySummary.totalIncome - monthlySummary.totalExpenses;

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.surface,
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
      justifyContent: 'space-around',
      marginBottom: spacing.md,
    },
    summaryItem: {
      alignItems: 'center',
      flex: 1,
    },
    summaryLabel: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
      fontSize: 12,
    },
    summaryValue: {
      ...typography.h3,
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
    netWorthValue: {
      ...typography.h1,
      color: themeColors.primary,
      fontWeight: '700',
    },
    availableValue: {
      ...typography.h1,
      fontWeight: '700',
    },
    pendingValue: {
      ...typography.h2,
      color: themeColors.secondary,
      fontWeight: '600',
    },
    categoryItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '40',
    },
    categoryName: {
      ...typography.body,
      color: themeColors.text,
      flex: 1,
    },
    categoryAmount: {
      ...typography.body,
      color: themeColors.textSecondary,
      fontWeight: '600',
    },
    emptyText: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      fontStyle: 'italic',
    },
  });

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.text }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={dynamicStyles.title}>Dashboard</Text>
        <Text style={dynamicStyles.subtitle}>Resumen financiero</Text>
      </View>

      {/* Resumen del Mes */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.cardTitle}>Resumen del Mes</Text>
        <View style={dynamicStyles.summaryRow}>
          <View style={dynamicStyles.summaryItem}>
            <Text style={dynamicStyles.summaryLabel}>Ingresos</Text>
            <Text style={[dynamicStyles.summaryValue, dynamicStyles.income]}>
              {formatCurrency(monthlySummary.totalIncome)}
            </Text>
          </View>
          <View style={dynamicStyles.summaryItem}>
            <Text style={dynamicStyles.summaryLabel}>Gastos</Text>
            <Text style={[dynamicStyles.summaryValue, dynamicStyles.expense]}>
              {formatCurrency(monthlySummary.totalExpenses)}
            </Text>
          </View>
        </View>
        <View style={dynamicStyles.balanceContainer}>
          <Text style={dynamicStyles.balanceLabel}>Disponible</Text>
          <Text style={[dynamicStyles.balanceValue, availableAmount >= 0 ? dynamicStyles.positive : dynamicStyles.negative]}>
            {formatCurrency(availableAmount)}
          </Text>
        </View>
      </View>

      {/* Gastos por Categoría */}
      {categoryExpenses.length > 0 && (
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>Gastos por Categoría</Text>
          {categoryExpenses.slice(0, 5).map((category, index) => (
            <View key={category.categoryId || index} style={dynamicStyles.categoryItem}>
              <Text style={dynamicStyles.categoryName}>{category.categoryName}</Text>
              <Text style={dynamicStyles.categoryAmount}>{formatCurrency(category.total)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Patrimonio Neto */}
      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.cardTitle}>Patrimonio Neto</Text>
        <Text style={dynamicStyles.netWorthValue}>{formatCurrency(netWorth)}</Text>
      </View>

      {/* Pendiente a Meses */}
      {installmentTotalPending > 0 && (
        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>Pendiente a Meses</Text>
          <Text style={dynamicStyles.pendingValue}>{formatCurrency(installmentTotalPending)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
});
