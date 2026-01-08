import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useInvestments } from '../hooks/useInvestments';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { calculateTotalPortfolioValue, calculateTotalPortfolioReturn } from '../services/calculations/investmentReturns';
import { formatCurrency } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Card from '../components/common/Card';
import { toTitleCase } from '../utils/textHelpers';
import { isDesktop, getCardPadding } from '../utils/responsive';

export default function Investments() {
  const { investments, opportunities, loading, deleteInvestment } = useInvestments();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { showToast } = useToast();

  const handleDeleteInvestment = async (id: string, symbol: string) => {
    const confirmMessage = `¿Estás seguro de eliminar la inversión "${symbol || 'Sin símbolo'}"?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      return;
    }
    
    if (confirmed) {
      try {
        await deleteInvestment(id);
        showToast('Inversión eliminada correctamente', 'success');
      } catch (error) {
        showToast('Error al eliminar la inversión', 'error');
      }
    }
  };

  const portfolioValue = calculateTotalPortfolioValue(investments);
  const portfolioReturn = calculateTotalPortfolioReturn(investments);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.surface,
    },
    title: {
      ...typography.h1,
      color: themeColors.primary,
      fontWeight: '700',
      marginBottom: spacing.md,
    },
    summaryLabel: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
      fontWeight: '400',
    },
    summaryValue: {
      fontSize: isDesktop ? 36 : 32,
      color: themeColors.primary,
      marginBottom: spacing.xs,
      fontWeight: '700',
      letterSpacing: -0.02,
    },
    summaryReturn: {
      ...typography.h4,
      fontWeight: '600',
    },
    positive: {
      color: themeColors.accent,
    },
    negative: {
      color: themeColors.secondary,
    },
    section: {
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.h4,
      color: themeColors.text,
      marginBottom: spacing.md,
      fontWeight: '600',
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
    investmentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    investmentName: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
      flex: 1,
    },
    investmentValue: {
      fontSize: isDesktop ? 20 : 18,
      color: themeColors.primary,
      fontWeight: '700',
      letterSpacing: -0.01,
    },
    investmentDetails: {
      marginTop: spacing.xs,
    },
    investmentDetail: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
    },
    investmentReturn: {
      ...typography.bodySmall,
      fontWeight: '600',
    },
    opportunityCard: {
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
    opportunityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    opportunityName: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
      flex: 1,
    },
    riskBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
    },
    riskText: {
      ...typography.caption,
      fontWeight: '600',
    },
    opportunityReturn: {
      ...typography.bodySmall,
      color: themeColors.text,
      marginBottom: spacing.xs,
    },
    opportunityMin: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
    },
    opportunityDescription: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginTop: spacing.xs,
    },
    emptyText: {
      ...typography.body,
      color: themeColors.textSecondary,
      textAlign: 'center',
      padding: spacing.md,
      fontStyle: 'italic',
    },
  });

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return themeColors.accent + '40';
      case 'medium':
        return themeColors.secondary + '40';
      case 'high':
        return themeColors.secondary + '60';
      default:
        return themeColors.border;
    }
  };

  const renderInvestment = ({ item }: { item: typeof investments[0] }) => {
    const currentValue = item.currentPrice * item.quantity;
    const purchaseValue = item.purchasePrice * item.quantity;
    const returnAmount = currentValue - purchaseValue;
    const returnPercentage = purchaseValue > 0 ? (returnAmount / purchaseValue) * 100 : 0;

    return (
      <Card padding={getCardPadding()} marginBottom={spacing.lg}>
        <TouchableOpacity
          style={[dynamicStyles.deleteButton, { position: 'absolute', top: spacing.sm, right: spacing.sm }]}
          onPress={() => handleDeleteInvestment(item.id, item.symbol || '')}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
        <View style={dynamicStyles.investmentHeader}>
          <Text style={dynamicStyles.investmentName}>
            {item.symbol || item.type}
          </Text>
          <Text style={dynamicStyles.investmentValue}>{formatCurrency(currentValue)}</Text>
        </View>
        <View style={dynamicStyles.investmentDetails}>
          <Text style={dynamicStyles.investmentDetail}>
            Cantidad: {item.quantity} | Precio: {formatCurrency(item.currentPrice)}
          </Text>
          <Text
            style={[
              dynamicStyles.investmentReturn,
              returnAmount >= 0 ? dynamicStyles.positive : dynamicStyles.negative,
            ]}
          >
            {returnAmount >= 0 ? '+' : ''}
            {formatCurrency(returnAmount)} ({returnPercentage.toFixed(2)}%)
          </Text>
        </View>
      </Card>
    );
  };

  const renderOpportunity = ({ item }: { item: typeof opportunities[0] }) => {
    return (
      <Card padding={getCardPadding()} marginBottom={spacing.lg}>
        <View style={dynamicStyles.opportunityHeader}>
          <Text style={dynamicStyles.opportunityName}>{item.name}</Text>
          <View style={[dynamicStyles.riskBadge, { backgroundColor: getRiskColor(item.riskLevel) }]}>
            <Text style={dynamicStyles.riskText}>{toTitleCase(item.riskLevel)}</Text>
          </View>
        </View>
        <Text style={dynamicStyles.opportunityReturn}>
          Rendimiento esperado: {item.expectedReturn}%
        </Text>
        <Text style={dynamicStyles.opportunityMin}>
          Inversión mínima: {formatCurrency(item.minAmount)}
        </Text>
        {item.description && (
          <Text style={dynamicStyles.opportunityDescription}>{item.description}</Text>
        )}
      </Card>
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
    <ScrollView style={dynamicStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={dynamicStyles.title}>Inversiones</Text>
        <Card padding={getCardPadding()} marginBottom={spacing.lg}>
          <Text style={dynamicStyles.summaryLabel}>{toTitleCase('Valor del Portafolio')}</Text>
          <Text style={dynamicStyles.summaryValue}>{formatCurrency(portfolioValue)}</Text>
          <Text
            style={[
              dynamicStyles.summaryReturn,
              portfolioReturn >= 0 ? dynamicStyles.positive : dynamicStyles.negative,
            ]}
          >
            {portfolioReturn >= 0 ? '+' : ''}
            {formatCurrency(portfolioReturn)}
          </Text>
        </Card>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Mis Inversiones</Text>
        {investments.length > 0 ? (
          investments.map(inv => renderInvestment({ item: inv }))
        ) : (
          <Text style={dynamicStyles.emptyText}>No hay inversiones registradas</Text>
        )}
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Oportunidades</Text>
        {opportunities.length > 0 ? (
          opportunities.map(opp => renderOpportunity({ item: opp }))
        ) : (
          <Text style={dynamicStyles.emptyText}>No hay oportunidades disponibles</Text>
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
