import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, ScrollView } from 'react-native';
import { useAssets } from '../hooks/useAssets';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { calculateNetWorth, calculateTotalAssets, calculateTotalLiabilities } from '../services/calculations/netWorth';
import { formatCurrency } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import Card from '../components/common/Card';
import { toTitleCase } from '../utils/textHelpers';
import { isDesktop, getCardPadding } from '../utils/responsive';
import AssetForm from '../components/forms/AssetForm';
import { AssetSchema } from '../services/database/schema';
import { parseISO, differenceInMonths } from 'date-fns';

export default function Assets() {
  const { assets, liabilities, loading, deleteAsset, deleteLiability, refresh } = useAssets();
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetSchema | null>(null);
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { showToast } = useToast();

  const handleDeleteAsset = async (id: string, name: string) => {
    const confirmMessage = `¿Estás seguro de eliminar "${name}"?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      return;
    }
    
    if (confirmed) {
      try {
        await deleteAsset(id);
        showToast('Activo eliminado correctamente', 'success');
      } catch (error) {
        showToast('Error al eliminar el activo', 'error');
      }
    }
  };

  const handleDeleteLiability = async (id: string, name: string) => {
    const confirmMessage = `¿Estás seguro de eliminar "${name}"?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      return;
    }
    
    if (confirmed) {
      try {
        await deleteLiability(id);
        showToast('Pasivo eliminado correctamente', 'success');
      } catch (error) {
        showToast('Error al eliminar el pasivo', 'error');
      }
    }
  };

  // Calculate current value based on depreciation/appreciation
  // MUST be defined before using it in totalAssets calculation
  const calculateCurrentValue = (asset: AssetSchema): number => {
    if (!asset.annualValueChange || !asset.purchaseDate) {
      return asset.value;
    }

    const purchaseDate = parseISO(asset.purchaseDate);
    const monthsSincePurchase = differenceInMonths(new Date(), purchaseDate);
    const yearsSincePurchase = monthsSincePurchase / 12;

    if (yearsSincePurchase <= 0) {
      return asset.value;
    }

    // Apply annual change: negative = depreciation, positive = appreciation
    const annualMultiplier = 1 + (asset.annualValueChange / 100);
    const currentValue = asset.value * Math.pow(annualMultiplier, yearsSincePurchase);
    
    return Math.max(0, currentValue); // Don't allow negative values
  };

  const handleEditAsset = (asset: AssetSchema) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAsset(null);
    refresh();
  };

  // Calculate total assets using current values (with depreciation/appreciation)
  const totalAssets = assets.reduce((sum, asset) => sum + calculateCurrentValue(asset), 0);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const netWorth = totalAssets - totalLiabilities;

  // Get type label in Spanish
  const getTypeLabel = (type: AssetSchema['type']): string => {
    const labels: Record<AssetSchema['type'], string> = {
      real_estate: 'Bien Inmueble',
      vehicle: 'Automóvil',
      motorcycle: 'Moto',
      cash: 'Dinero Líquido',
      bank: 'Cuenta Bancaria',
      investment: 'Inversión',
      other: 'Otro',
    };
    return labels[type] || type;
  };

  // Get liquidity label
  const getLiquidityLabel = (liquidity: number): string => {
    const labels: Record<number, string> = {
      1: 'Muy Líquido',
      2: 'Líquido',
      3: 'Moderado',
      4: 'Poco Líquido',
      5: 'Ilíquido',
    };
    return labels[liquidity] || 'N/A';
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.surface,
    },
    header: {
      padding: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: themeColors.background,
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
      fontWeight: '700',
      letterSpacing: -0.02,
    },
    positive: {
      color: themeColors.accent,
    },
    negative: {
      color: themeColors.secondary,
    },
    section: {
      padding: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.h4,
      color: themeColors.text,
      marginBottom: spacing.md,
      fontWeight: '600',
    },
    itemContent: {
      flex: 1,
    },
    deleteButton: {
      padding: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.error + '40',
      borderRadius: 20,
      width: 40,
      height: 40,
      zIndex: 10,
    },
    deleteButtonText: {
      fontSize: 18,
    },
    liabilityCard: {
      borderLeftWidth: 4,
      borderLeftColor: themeColors.secondary,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
      minHeight: 50, // Ensure enough space for value display
    },
    itemName: {
      ...typography.body,
      color: themeColors.text,
      flex: 1,
      fontWeight: '600',
    },
    itemValue: {
      ...typography.h4,
      color: themeColors.accent,
      fontWeight: '700',
    },
    liabilityValue: {
      color: themeColors.secondary,
    },
    itemType: {
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
    addButton: {
      backgroundColor: themeColors.primary,
      padding: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    addButtonText: {
      ...typography.body,
      color: themeColors.background,
      fontWeight: '600',
      fontSize: isDesktop ? 16 : 14,
    },
    infoCard: {
      backgroundColor: themeColors.background,
      padding: spacing.md,
      borderRadius: 8,
      marginBottom: spacing.md,
    },
    infoTitle: {
      ...typography.h4,
      color: themeColors.primary,
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
    infoText: {
      ...typography.bodySmall,
      color: themeColors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.xs,
    },
    assetDetail: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginTop: spacing.xs,
    },
    valueChange: {
      ...typography.caption,
      marginTop: spacing.xs,
    },
    valueChangePositive: {
      color: themeColors.accent,
    },
    valueChangeNegative: {
      color: themeColors.secondary,
    },
    liquidityBadge: {
      backgroundColor: themeColors.primary + '20',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
    },
    liquidityBadgeText: {
      ...typography.caption,
      color: themeColors.primary,
      fontSize: 10,
      fontWeight: '600',
    },
    editButton: {
      padding: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: themeColors.primary + '40',
      borderRadius: 20,
      width: 40,
      height: 40,
    },
  });

  const renderAsset = ({ item }: { item: typeof assets[0] }) => {
    const currentValue = calculateCurrentValue(item);
    const valueChange = currentValue - item.value;
    const valueChangePercent = item.value > 0 ? ((valueChange / item.value) * 100) : 0;

    return (
      <Card padding={getCardPadding()} marginBottom={spacing.lg}>
        <View style={dynamicStyles.itemContent}>
          <View style={dynamicStyles.itemHeader}>
            <View style={{ flex: 1, marginRight: spacing.md }}>
              <Text style={dynamicStyles.itemName}>{item.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', marginRight: 100, minWidth: 120 }}>
              <Text style={dynamicStyles.itemValue}>{formatCurrency(currentValue)}</Text>
              {valueChange !== 0 && (
                <Text style={[
                  dynamicStyles.valueChange,
                  valueChange >= 0 ? dynamicStyles.valueChangePositive : dynamicStyles.valueChangeNegative
                ]}>
                  {valueChange >= 0 ? '+' : ''}{formatCurrency(valueChange)} ({valueChangePercent >= 0 ? '+' : ''}{valueChangePercent.toFixed(1)}%)
                </Text>
              )}
            </View>
          </View>
          <Text style={dynamicStyles.itemType}>{getTypeLabel(item.type)}</Text>
          {item.annualValueChange !== null ? (
            <Text style={dynamicStyles.assetDetail}>
              Cambio anual automático: {item.annualValueChange >= 0 ? '+' : ''}{item.annualValueChange}%
              {item.annualValueChange < 0 
                ? ` (${item.type === 'cash' || item.type === 'bank' ? 'pérdida por inflación' : 'depreciación'})` 
                : item.annualValueChange > 0 
                ? ' (apreciación)' 
                : ' (sin cambio)'}
            </Text>
          ) : item.type === 'investment' ? (
            <Text style={dynamicStyles.assetDetail}>
              Cambio de valor: Se calcula desde la página de Inversiones
            </Text>
          ) : null}
          <View style={dynamicStyles.liquidityBadge}>
            <Text style={dynamicStyles.liquidityBadgeText}>
              Liquidez: {item.liquidity} - {getLiquidityLabel(item.liquidity)}
            </Text>
          </View>
          {item.purchaseDate && (
            <Text style={dynamicStyles.assetDetail}>
              Valor original: {formatCurrency(item.value)}
            </Text>
          )}
        </View>
        <View style={{ position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
          <TouchableOpacity
            style={[dynamicStyles.editButton, { marginRight: spacing.xs }]}
            onPress={() => handleEditAsset(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 16 }}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={dynamicStyles.deleteButton}
            onPress={() => handleDeleteAsset(item.id, item.name)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderLiability = ({ item }: { item: typeof liabilities[0] }) => (
    <Card padding={getCardPadding()} marginBottom={spacing.lg}>
      <View style={dynamicStyles.itemContent}>
        <View style={dynamicStyles.itemHeader}>
          <Text style={dynamicStyles.itemName}>{item.name}</Text>
          <Text style={[dynamicStyles.itemValue, dynamicStyles.liabilityValue]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
        <Text style={dynamicStyles.itemType}>{item.type}</Text>
      </View>
      <TouchableOpacity
        style={[dynamicStyles.deleteButton, { position: 'absolute', top: spacing.sm, right: spacing.sm }]}
        onPress={() => handleDeleteLiability(item.id, item.name)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </Card>
  );

  if (loading) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: themeColors.text }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={dynamicStyles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingBottom: spacing.xl * 2,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
      >
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>Patrimonio</Text>
          
          {/* Info Card explaining Assets vs Liabilities */}
          <Card padding={getCardPadding()} marginBottom={spacing.md}>
            <Text style={dynamicStyles.infoTitle}>¿Qué son Activos y Pasivos?</Text>
            <Text style={dynamicStyles.infoText}>
              <Text style={{ fontWeight: '600', color: themeColors.accent }}>Activos:</Text> Son bienes y recursos que posees y que tienen valor económico. Pueden ganar valor (apreciación) o perderlo (depreciación) con el tiempo.
            </Text>
            <Text style={dynamicStyles.infoText}>
              <Text style={{ fontWeight: '600', color: themeColors.secondary }}>Pasivos:</Text> Son deudas y obligaciones que debes pagar. Reducen tu patrimonio neto.
            </Text>
            <Text style={dynamicStyles.infoText}>
              <Text style={{ fontWeight: '600', color: themeColors.primary }}>Patrimonio Neto:</Text> Es la diferencia entre tus activos y pasivos. Representa tu riqueza real.
            </Text>
          </Card>

          <Card padding={getCardPadding()} marginBottom={spacing.lg}>
            <Text style={dynamicStyles.summaryLabel}>{toTitleCase('Patrimonio Neto')}</Text>
            <Text style={[dynamicStyles.summaryValue, netWorth >= 0 ? dynamicStyles.positive : dynamicStyles.negative]}>
              {formatCurrency(netWorth)}
            </Text>
          </Card>

          <TouchableOpacity
            style={dynamicStyles.addButton}
            onPress={() => {
              setEditingAsset(null);
              setShowForm(true);
            }}
          >
            <Text style={dynamicStyles.addButtonText}>+ Agregar Activo</Text>
          </TouchableOpacity>
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Activos ({formatCurrency(totalAssets)})</Text>
          <Text style={[dynamicStyles.assetDetail, { marginBottom: spacing.md, fontSize: 12, fontStyle: 'italic' }]}>
            * Valores mostrados incluyen depreciación/apreciación calculada
          </Text>
          {assets.length === 0 ? (
            <Card padding={getCardPadding()} marginBottom={spacing.lg}>
              <Text style={dynamicStyles.emptyText}>No hay activos registrados</Text>
            </Card>
          ) : (
            assets.map((item) => (
              <View key={item.id}>
                {renderAsset({ item })}
              </View>
            ))
          )}
        </View>

        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.sectionTitle}>Pasivos ({formatCurrency(totalLiabilities)})</Text>
          {liabilities.length === 0 ? (
            <Card padding={getCardPadding()} marginBottom={spacing.lg}>
              <Text style={dynamicStyles.emptyText}>No hay pasivos registrados</Text>
            </Card>
          ) : (
            liabilities.map((item) => (
              <View key={item.id}>
                {renderLiability({ item })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseForm}
      >
        <AssetForm
          onClose={handleCloseForm}
          asset={editingAsset || undefined}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // Removed - no longer using FlatList
});
