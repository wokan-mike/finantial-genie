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
import GradientCard from '../components/common/GradientCard';
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

  // Aplicar gradiente al fondo en web usando ref - DEBE estar antes de cualquier return
  const scrollViewRef = React.useRef<any>(null);
  
  React.useEffect(() => {
    if (Platform.OS === 'web' && scrollViewRef.current) {
      const element = scrollViewRef.current as any;
      const gradientBg = theme === 'dark'
        ? 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 0.98) 50%, rgba(15, 23, 42, 0.95) 100%)'
        : 'linear-gradient(180deg, rgba(248, 250, 252, 1) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(248, 250, 252, 0.95) 100%)';
      
      // Intentar aplicar el gradiente de diferentes formas
      const applyGradient = (el: any) => {
        if (el && el.style) {
          el.style.backgroundImage = gradientBg;
        }
        // También intentar en el elemento padre si existe
        if (el && el.parentElement && el.parentElement.style) {
          el.parentElement.style.backgroundImage = gradientBg;
        }
      };

      // Usar setTimeout para asegurar que el DOM esté listo
      setTimeout(() => {
        if (element._nativeNode) {
          applyGradient(element._nativeNode);
        } else if (element.getNode && element.getNode()) {
          applyGradient(element.getNode());
        } else if (element) {
          applyGradient(element);
        }
      }, 100);
    }
  }, [theme]);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    contentWrapper: {
      maxWidth: getContainerMaxWidth(),
      width: '100%',
      alignSelf: 'center',
      paddingHorizontal: isDesktop ? spacing.xl : spacing.md,
      paddingTop: isDesktop ? spacing.lg : spacing.md,
      paddingBottom: spacing.lg,
    },
    header: {
      marginBottom: isDesktop ? spacing.lg : spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    title: {
      ...typography.h1,
      color: themeColors.primary,
      fontWeight: '700',
      marginBottom: spacing.xs / 2,
      fontSize: isDesktop ? 32 : 26,
    },
    subtitle: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      fontSize: isDesktop ? 15 : 13,
    },
    // Grid system usando Flexbox
    gridContainer: {
      flexDirection: isDesktop ? 'row' : 'column',
      flexWrap: isDesktop ? 'wrap' : 'nowrap',
      marginBottom: isDesktop ? spacing.lg : spacing.md,
      ...(Platform.OS === 'web' && isDesktop && {
        marginLeft: -spacing.md,
        marginRight: -spacing.md,
      }),
    },
    gridItem: {
      ...(isDesktop && Platform.OS === 'web' && {
        width: '50%',
        paddingLeft: spacing.md,
        paddingRight: spacing.md,
        marginBottom: spacing.lg,
      }),
      ...(isDesktop && Platform.OS !== 'web' && {
        flex: 1,
        minWidth: '45%',
        marginHorizontal: spacing.sm,
        marginBottom: spacing.lg,
      }),
      ...(isTablet && Platform.OS === 'web' && {
        width: '50%',
        paddingLeft: spacing.md,
        paddingRight: spacing.md,
        marginBottom: spacing.md,
      }),
      ...(!isDesktop && !isTablet && {
        width: '100%',
        marginBottom: spacing.md,
      }),
    },
    cardTitle: {
      ...typography.h4,
      color: themeColors.text,
      marginBottom: spacing.md,
      fontWeight: '600',
      fontSize: isDesktop ? 20 : 18,
    },
    summaryRow: {
      flexDirection: isDesktop ? 'row' : 'column',
      justifyContent: 'space-around',
      gap: isDesktop ? spacing.lg : spacing.md,
      marginBottom: spacing.sm,
    },
    summaryItem: {
      alignItems: 'center',
      flex: isDesktop ? 1 : undefined,
      paddingVertical: isDesktop ? 0 : spacing.sm,
    },
    summaryLabel: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
      fontSize: isDesktop ? 15 : 13,
      fontWeight: '500',
    },
    summaryValue: {
      fontSize: isDesktop ? 32 : 26,
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
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      marginTop: spacing.sm,
    },
    balanceLabel: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
      fontSize: isDesktop ? 15 : 13,
      fontWeight: '500',
    },
    balanceValue: {
      fontSize: isDesktop ? 36 : 30,
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
      fontSize: isDesktop ? 42 : 36,
      color: themeColors.primary,
      fontWeight: '700',
      letterSpacing: -0.02,
    },
    pendingValue: {
      fontSize: isDesktop ? 36 : 28,
      color: themeColors.secondary,
      fontWeight: '700',
      letterSpacing: -0.02,
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
      fontSize: isDesktop ? 26 : 24,
      marginRight: spacing.sm,
    },
    categoryName: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
      flex: 1,
      fontSize: isDesktop ? 16 : 14,
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
      fontSize: isDesktop ? 13 : 12,
    },
    creditCardItem: {
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    creditCardItemLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    creditCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    creditCardColorBar: {
      width: 4,
      height: 40,
      borderRadius: 2,
      marginRight: spacing.md,
    },
    creditCardDetails: {
      flex: 1,
    },
    creditCardName: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
      fontSize: isDesktop ? 17 : 15,
      marginBottom: spacing.xs / 2,
    },
    creditCardMeta: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      fontSize: isDesktop ? 13 : 12,
      marginBottom: spacing.xs / 2,
    },
    creditCardAmount: {
      fontSize: isDesktop ? 24 : 20,
      fontWeight: '700',
      letterSpacing: -0.01,
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
      ref={scrollViewRef}
      style={dynamicStyles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
    >
      <View style={dynamicStyles.contentWrapper}>
        {/* Header */}
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Dashboard</Text>
          <Text style={dynamicStyles.subtitle}>Resumen financiero</Text>
        </View>

        {/* Grid Layout - Primera fila: Resumen del Mes y Gastos por Categoría */}
        <View style={dynamicStyles.gridContainer}>
          {/* Resumen del Mes */}
          <View style={dynamicStyles.gridItem}>
            <GradientCard padding={getCardPadding()} marginBottom={0} gradient="primary">
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
          </GradientCard>
          </View>

          {/* Gastos por Categoría */}
          {categoryExpenses.length > 0 && (
            <View style={dynamicStyles.gridItem}>
              <GradientCard padding={getCardPadding()} marginBottom={0} gradient="subtle">
              <Text style={dynamicStyles.cardTitle}>{toTitleCase('Gastos por Categoría')}</Text>
              {categoryExpenses.slice(0, 6).map((category, index) => {
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
                      height={isDesktop ? 8 : 6}
                    />
                  </View>
                );
              })}
              </GradientCard>
            </View>
          )}

          {/* Segunda fila: Patrimonio Neto y otras métricas */}
          <View style={dynamicStyles.gridItem}>
            <GradientCard padding={getCardPadding()} marginBottom={0} gradient="accent">
            <Text style={dynamicStyles.cardTitle}>{toTitleCase('Patrimonio Neto')}</Text>
            <Text style={dynamicStyles.netWorthValue}>{formatCurrency(netWorth)}</Text>
          </GradientCard>
          </View>

          {/* Deuda del Mes Actual o Pendiente Total */}
          {currentMonthDebt > 0 ? (
            <View style={dynamicStyles.gridItem}>
              <GradientCard padding={getCardPadding()} marginBottom={0} gradient="secondary">
              <Text style={dynamicStyles.cardTitle}>{toTitleCase('Deuda del Mes Actual')}</Text>
              <Text style={dynamicStyles.pendingValue}>{formatCurrency(currentMonthDebt)}</Text>
              <Text style={[dynamicStyles.emptyText, { marginTop: spacing.sm }]}>
                Pagos a meses vencidos este mes
              </Text>
            </GradientCard>
            </View>
          ) : installmentTotalPending > 0 ? (
            <View style={dynamicStyles.gridItem}>
              <GradientCard padding={getCardPadding()} marginBottom={0} gradient="secondary">
              <Text style={dynamicStyles.cardTitle}>{toTitleCase('Pendiente Total a Meses')}</Text>
              <Text style={dynamicStyles.pendingValue}>{formatCurrency(installmentTotalPending)}</Text>
            </GradientCard>
            </View>
          ) : null}
        </View>

        {/* Gastos de Tarjetas de Crédito - Full Width */}
        {creditCardExpenses.length > 0 && (
          <View style={{ marginTop: isDesktop ? spacing.lg : spacing.md }}>
            <GradientCard padding={getCardPadding()} marginBottom={0} gradient="subtle">
            <Text style={dynamicStyles.cardTitle}>{toTitleCase('Gastos de Tarjetas de Crédito')}</Text>
            {creditCardExpenses.map((summary, index) => (
              <View 
                key={summary.cardId} 
                style={[
                  dynamicStyles.creditCardItem,
                  index === creditCardExpenses.length - 1 && dynamicStyles.creditCardItemLast
                ]}
              >
                <View style={dynamicStyles.creditCardHeader}>
                  <View
                    style={[
                      dynamicStyles.creditCardColorBar,
                      { backgroundColor: summary.cardColor }
                    ]}
                  />
                  <View style={dynamicStyles.creditCardDetails}>
                    <Text style={dynamicStyles.creditCardName}>
                      {summary.cardName} ({summary.bank})
                    </Text>
                    <Text style={dynamicStyles.creditCardMeta}>
                      Vence: {formatDate(summary.paymentDueDate)} ({summary.daysUntilDue} días)
                    </Text>
                    {summary.totalExpenses > 0 && (
                      <Text style={[dynamicStyles.emptyText, { fontSize: isDesktop ? 12 : 11 }]}>
                        {summary.normalExpenses > 0 && summary.installmentExpenses > 0 ? (
                          <>Gastos: {formatCurrency(summary.normalExpenses)} | A meses: {formatCurrency(summary.installmentExpenses)}</>
                        ) : summary.normalExpenses > 0 ? (
                          <>Gastos: {formatCurrency(summary.normalExpenses)}</>
                        ) : summary.installmentExpenses > 0 ? (
                          <>A meses: {formatCurrency(summary.installmentExpenses)}</>
                        ) : null}
                      </Text>
                    )}
                  </View>
                  <Text style={[
                    dynamicStyles.creditCardAmount, 
                    { color: summary.isDueThisMonth ? themeColors.secondary : themeColors.text }
                  ]}>
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
            </GradientCard>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
