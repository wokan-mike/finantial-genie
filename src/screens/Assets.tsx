import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useAssets } from '../hooks/useAssets';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { calculateNetWorth, calculateTotalAssets, calculateTotalLiabilities } from '../services/calculations/netWorth';
import { formatCurrency } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export default function Assets() {
  const { assets, liabilities, loading, deleteAsset, deleteLiability } = useAssets();
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

  const totalAssets = calculateTotalAssets(assets);
  const totalLiabilities = calculateTotalLiabilities(liabilities);
  const netWorth = calculateNetWorth(assets, liabilities);

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
      backgroundColor: themeColors.primary + '20',
      padding: spacing.lg,
      borderRadius: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.primary + '40',
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
      fontWeight: '700',
    },
    positive: {
      color: themeColors.accent,
    },
    negative: {
      color: themeColors.secondary,
    },
    section: {
      flex: 1,
      padding: spacing.md,
    },
    sectionTitle: {
      ...typography.h4,
      color: themeColors.text,
      marginBottom: spacing.md,
      fontWeight: '600',
    },
    itemCard: {
      backgroundColor: themeColors.background,
      borderRadius: 16,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
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
      alignItems: 'center',
      marginBottom: spacing.xs,
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
  });

  const renderAsset = ({ item }: { item: typeof assets[0] }) => (
    <View style={dynamicStyles.itemCard}>
      <View style={dynamicStyles.itemContent}>
        <View style={dynamicStyles.itemHeader}>
          <Text style={dynamicStyles.itemName}>{item.name}</Text>
          <Text style={dynamicStyles.itemValue}>{formatCurrency(item.value)}</Text>
        </View>
        <Text style={dynamicStyles.itemType}>{item.type}</Text>
      </View>
      <TouchableOpacity
        style={dynamicStyles.deleteButton}
        onPress={() => handleDeleteAsset(item.id, item.name)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLiability = ({ item }: { item: typeof liabilities[0] }) => (
    <View style={[dynamicStyles.itemCard, dynamicStyles.liabilityCard]}>
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
        style={dynamicStyles.deleteButton}
        onPress={() => handleDeleteLiability(item.id, item.name)}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={dynamicStyles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
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
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Patrimonio</Text>
        <View style={dynamicStyles.summaryCard}>
          <Text style={dynamicStyles.summaryLabel}>Patrimonio Neto</Text>
          <Text style={[dynamicStyles.summaryValue, netWorth >= 0 ? dynamicStyles.positive : dynamicStyles.negative]}>
            {formatCurrency(netWorth)}
          </Text>
        </View>
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Activos ({formatCurrency(totalAssets)})</Text>
        <FlatList
          data={assets}
          renderItem={renderAsset}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={dynamicStyles.emptyText}>No hay activos registrados</Text>
          }
        />
      </View>

      <View style={dynamicStyles.section}>
        <Text style={dynamicStyles.sectionTitle}>Pasivos ({formatCurrency(totalLiabilities)})</Text>
        <FlatList
          data={liabilities}
          renderItem={renderLiability}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={dynamicStyles.emptyText}>No hay pasivos registrados</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.md,
  },
});
