import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useFinancialSummary } from '../hooks/useFinancialSummary';
import { useExpenseAnalysis } from '../hooks/useExpenseAnalysis';
import { useCategories } from '../hooks/useCategories';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getYear, getMonth } from 'date-fns';
import Card from '../components/common/Card';
import ProgressBar from '../components/common/ProgressBar';
import { isDesktop, isTablet, getCardPadding, getContainerMaxWidth } from '../utils/responsive';

// Helper function to convert to Title Case
const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

export default function Dashboard() {
  const { monthlySummary, netWorth, installmentTotalPending, currentMonthDebt, creditCardExpenses, totalCreditCardDebt, loading } = useFinancialSummary();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { categories } = useCategories();
  
  // Get current year and month
  const currentYear = getYear(new Date());
  const currentMonth = getMonth(new Date()) + 1; // getMonth returns 0-11, we need 1-12
  
  // Use expense analysis for current month only
  const { categoryExpenses } = useExpenseAnalysis(currentYear, currentMonth);
  
  // Helper to get category icon and color
  const getCategoryInfo = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return {
      icon: category?.icon || '📦',
      color: category?.color || themeColors.textSecondary,
    };
  };
  
  // Calculate total for percentage calculation
  const totalCategoryExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.total, 0);

  // Calculate available amount (income - expenses)
  const availableAmount = monthlySummary.totalIncome - monthlySummary.totalExpenses;

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
    cardTitle: {
      ...typography.h4,
      color: themeColors.text,
      marginBottom: spacing.md,
      fontWeight: '600',
      fontSize: isDesktop ? 18 : 16,
    },
    summaryRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      justifyContent: 'space-around',
      marginBottom: spacing.md,
      gap: isDesktop ? spacing.lg : spacing.md,
    },
    summaryItem: {
      alignItems: 'center',
      flex: isDesktop ? 1 : undefined,
      paddingVertical: isDesktop ? 0 : spacing.sm,
    },
    gridContainer: {
      flexDirection: isDesktop ? 'row' : 'column',
      flexWrap: isDesktop ? 'wrap' : 'nowrap',
      gap: isDesktop ? spacing.xl : spacing.lg,
      ...(isDesktop && {
        marginHorizontal: -spacing.lg,
      }),
    },
    gridItem: {
      ...(isDesktop && {
        flex: '0 0 calc(50% - 24px)',
        marginHorizontal: spacing.lg,
      }),
    },
    summaryLabel: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
      fontSize: 14,
      fontWeight: '400',
    },
    summaryValue: {
      fontSize: isDesktop ? 36 : 28,
      fontWeight: '700',
      letterSpacing: -0.02,
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
    netWorthValue: {
      fontSize: isDesktop ? 36 : 32,
      color: themeColors.primary,
      fontWeight: '700',
      letterSpacing: -0.02,
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
      marginBottom: spacing.md,
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    categoryInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryIcon: {
      fontSize: 24,
      marginRight: spacing.sm,
    },
    categoryName: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
      flex: 1,
    },
    categoryAmount: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
      fontSize: isDesktop ? 18 : 16,
      letterSpacing: -0.01,
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
    <ScrollView 
      style={dynamicStyles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
    >
      <View style={dynamicStyles.contentWrapper}>
        <View style={styles.header}>
          <Text style={dynamicStyles.title}>Dashboard</Text>
          <Text style={dynamicStyles.subtitle}>Resumen financiero</Text>
        </View>

        {/* Grid layout for desktop */}
        <View style={dynamicStyles.gridContainer}>
          {/* Resumen del Mes */}
          <View style={dynamicStyles.gridItem}>
            <Card padding={getCardPadding()} marginBottom={0}>
              <Text style={dynamicStyles.cardTitle}>{toTitleCase('Resumen del Mes')}</Text>
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
            </Card>
          </View>

          {/* Gastos por Categoría */}
          {categoryExpenses.length > 0 && (
            <View style={dynamicStyles.gridItem}>
              <Card padding={getCardPadding()} marginBottom={0}>
                <Text style={dynamicStyles.cardTitle}>{toTitleCase('Gastos por Categoría')}</Text>
                {categoryExpenses.slice(0, 5).map((category, index) => {
                  const categoryInfo = getCategoryInfo(category.categoryId);
                  const percentage = totalCategoryExpenses > 0 
                    ? (category.total / totalCategoryExpenses) * 100 
                    : 0;
                  
                  return (
                    <View key={category.categoryId || index} style={dynamicStyles.categoryItem}>
                      <View style={dynamicStyles.categoryHeader}>
                        <View style={dynamicStyles.categoryInfo}>
                          <Text style={dynamicStyles.categoryIcon}>{categoryInfo.icon}</Text>
                          <Text style={dynamicStyles.categoryName}>{category.categoryName}</Text>
                        </View>
                        <Text style={dynamicStyles.categoryAmount}>{formatCurrency(category.total)}</Text>
                      </View>
                      <ProgressBar
                        value={percentage}
                        color={categoryInfo.color}
                        height={6}
                      />
                    </View>
                  );
                })}
              </Card>
            </View>
          )}

          {/* Patrimonio Neto */}
          <View style={dynamicStyles.gridItem}>
            <Card padding={getCardPadding()} marginBottom={0}>
              <Text style={dynamicStyles.cardTitle}>{toTitleCase('Patrimonio Neto')}</Text>
              <Text style={dynamicStyles.netWorthValue}>{formatCurrency(netWorth)}</Text>
            </Card>
          </View>

          {/* Deuda del Mes Actual */}
          {currentMonthDebt > 0 && (
            <View style={dynamicStyles.gridItem}>
              <Card padding={getCardPadding()} marginBottom={0}>
                <Text style={dynamicStyles.cardTitle}>{toTitleCase('Deuda del Mes Actual')}</Text>
                <Text style={dynamicStyles.pendingValue}>{formatCurrency(currentMonthDebt)}</Text>
                <Text style={[dynamicStyles.emptyText, { marginTop: spacing.sm, fontWeight: '400' }]}>
                  Pagos a meses vencidos este mes
                </Text>
              </Card>
            </View>
          )}

          {/* Pendiente Total a Meses */}
          {installmentTotalPending > 0 && (
            <View style={dynamicStyles.gridItem}>
              <Card padding={getCardPadding()} marginBottom={0}>
                <Text style={dynamicStyles.cardTitle}>{toTitleCase('Pendiente Total a Meses')}</Text>
                <Text style={dynamicStyles.pendingValue}>{formatCurrency(installmentTotalPending)}</Text>
              </Card>
            </View>
          )}
        </View>

        {/* Gastos de Tarjetas de Crédito */}
        {creditCardExpenses.length > 0 && (
          <Card padding={getCardPadding()} marginBottom={0}>
            <Text style={dynamicStyles.cardTitle}>{toTitleCase('Gastos de Tarjetas de Crédito')}</Text>
          {creditCardExpenses
            .map((summary) => (
              <View key={summary.cardId} style={dynamicStyles.categoryItem}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 4,
                      height: 30,
                      backgroundColor: summary.cardColor,
                      borderRadius: 2,
                      marginRight: spacing.sm,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={dynamicStyles.categoryName}>
                      {summary.cardName} ({summary.bank})
                    </Text>
                    <Text style={[dynamicStyles.emptyText, { marginTop: spacing.xs }]}>
                      Vence: {formatDate(summary.paymentDueDate)} ({summary.daysUntilDue} días)
                    </Text>
                    {summary.normalExpenses > 0 && summary.installmentExpenses > 0 && (
                      <Text style={[dynamicStyles.emptyText, { fontSize: 11 }]}>
                        Gastos: {formatCurrency(summary.normalExpenses)} | A meses: {formatCurrency(summary.installmentExpenses)}
                      </Text>
                    )}
                  </View>
                  <Text style={[dynamicStyles.categoryAmount, { color: summary.isDueThisMonth ? themeColors.secondary : themeColors.text }]}>
                    {formatCurrency(summary.totalExpenses)}
                  </Text>
                </View>
              </View>
            ))}
          {totalCreditCardDebt > 0 && (
            <View style={[dynamicStyles.balanceContainer, { marginTop: spacing.md }]}>
              <Text style={dynamicStyles.balanceLabel}>Total a Pagar este Mes</Text>
              <Text style={[dynamicStyles.balanceValue, { color: themeColors.secondary }]}>
                {formatCurrency(totalCreditCardDebt)}
              </Text>
            </View>
          )}
          </Card>
        )}
      </View>
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
