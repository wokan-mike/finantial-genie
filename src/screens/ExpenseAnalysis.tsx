import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useExpenseAnalysis } from '../hooks/useExpenseAnalysis';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { getYear, getMonth } from 'date-fns';

export default function ExpenseAnalysis() {
  const currentYear = getYear(new Date());
  const currentMonth = getMonth(new Date()) + 1;
  const { categoryExpenses, topCategories, loading } = useExpenseAnalysis(currentYear, currentMonth);
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  const totalExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.total, 0);

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
      ...typography.body,
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
    categoryItem: {
      marginBottom: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '40',
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
    categoryRank: {
      ...typography.h4,
      color: themeColors.primary,
      marginRight: spacing.sm,
      width: 30,
      fontWeight: '700',
    },
    categoryName: {
      ...typography.body,
      color: themeColors.text,
      flex: 1,
      fontWeight: '600',
    },
    categoryAmount: {
      ...typography.h4,
      color: themeColors.text,
      fontWeight: '700',
    },
    progressBarContainer: {
      height: 10,
      backgroundColor: themeColors.border,
      borderRadius: 5,
      marginBottom: spacing.xs,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 5,
    },
    categoryPercentage: {
      ...typography.caption,
      color: themeColors.textSecondary,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '40',
    },
    categoryNameSmall: {
      ...typography.bodySmall,
      color: themeColors.text,
      flex: 1,
    },
    categoryDetails: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    categoryAmountSmall: {
      ...typography.bodySmall,
      color: themeColors.text,
      fontWeight: '600',
    },
    categoryPercentageSmall: {
      ...typography.caption,
      color: themeColors.textSecondary,
    },
    emptyText: {
      ...typography.body,
      color: themeColors.textSecondary,
      textAlign: 'center',
      padding: spacing.md,
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
        <Text style={dynamicStyles.title}>Análisis de Gastos</Text>
        <Text style={dynamicStyles.subtitle}>
          Total del mes: {formatCurrency(totalExpenses)}
        </Text>
      </View>

      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.cardTitle}>Top 5 Categorías</Text>
        {topCategories.map((category, index) => (
          <View key={category.categoryId} style={dynamicStyles.categoryItem}>
            <View style={dynamicStyles.categoryHeader}>
              <View style={dynamicStyles.categoryInfo}>
                <Text style={dynamicStyles.categoryRank}>#{index + 1}</Text>
                <Text style={dynamicStyles.categoryName}>{category.categoryName}</Text>
              </View>
              <Text style={dynamicStyles.categoryAmount}>{formatCurrency(category.total)}</Text>
            </View>
            <View style={dynamicStyles.progressBarContainer}>
              <View
                style={[
                  dynamicStyles.progressBar,
                  { width: `${category.percentage}%`, backgroundColor: themeColors.primary },
                ]}
              />
            </View>
            <Text style={dynamicStyles.categoryPercentage}>{category.percentage.toFixed(1)}%</Text>
          </View>
        ))}
      </View>

      <View style={dynamicStyles.card}>
        <Text style={dynamicStyles.cardTitle}>Todas las Categorías</Text>
        {categoryExpenses.map(category => (
          <View key={category.categoryId} style={dynamicStyles.categoryRow}>
            <Text style={dynamicStyles.categoryNameSmall}>{category.categoryName}</Text>
            <View style={dynamicStyles.categoryDetails}>
              <Text style={dynamicStyles.categoryAmountSmall}>{formatCurrency(category.total)}</Text>
              <Text style={dynamicStyles.categoryPercentageSmall}>({category.percentage.toFixed(1)}%)</Text>
            </View>
          </View>
        ))}
        {categoryExpenses.length === 0 && (
          <Text style={dynamicStyles.emptyText}>No hay gastos registrados este mes</Text>
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
