import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Platform } from 'react-native';
import { useCreditCards } from '../hooks/useCreditCards';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatters';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import CreditCardForm from '../components/forms/CreditCardForm';
import { CreditCardSchema } from '../services/database/schema';
import Card from '../components/common/Card';
import { toTitleCase } from '../utils/textHelpers';
import { isDesktop, getCardPadding } from '../utils/responsive';

export default function CreditCards() {
  const { creditCards, loading, deleteCreditCard, refresh } = useCreditCards();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardSchema | null>(null);

  const handleDeleteCard = async (id: string, name: string) => {
    const confirmMessage = `¿Estás seguro de eliminar la tarjeta "${name}"?`;
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm(confirmMessage);
    } else {
      return;
    }
    
    if (confirmed) {
      try {
        await deleteCreditCard(id);
        showToast('Tarjeta eliminada correctamente', 'success');
        refresh();
      } catch (error) {
        showToast('Error al eliminar la tarjeta', 'error');
      }
    }
  };

  const handleEditCard = (card: CreditCardSchema) => {
    setEditingCard(card);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCard(null);
    refresh();
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
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    cardName: {
      ...typography.h4,
      color: themeColors.text,
      fontWeight: '600',
      flex: 1,
    },
    cardActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    actionButton: {
      padding: spacing.sm,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    editButton: {
      backgroundColor: themeColors.primary + '40',
    },
    deleteButton: {
      backgroundColor: themeColors.error + '40',
    },
    actionButtonText: {
      fontSize: 18,
    },
    cardDetails: {
      marginBottom: spacing.sm,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    detailLabel: {
      ...typography.caption,
      color: themeColors.textSecondary,
    },
    detailValue: {
      ...typography.bodySmall,
      color: themeColors.text,
      fontWeight: '600',
    },
    creditInfo: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
    },
    creditItem: {
      alignItems: 'center',
    },
    creditLabel: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
    },
    creditValue: {
      fontSize: isDesktop ? 18 : 16,
      fontWeight: '700',
    },
    available: {
      color: themeColors.accent,
    },
    used: {
      color: themeColors.secondary,
    },
    limit: {
      color: themeColors.text,
    },
    inactiveBadge: {
      backgroundColor: themeColors.textSecondary + '40',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
    },
    inactiveText: {
      ...typography.caption,
      color: themeColors.textSecondary,
      fontWeight: '600',
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
      backgroundColor: themeColors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: spacing.md,
    },
    addButtonText: {
      ...typography.body,
      color: themeColors.background,
      fontWeight: '600',
    },
  });

  const renderCard = ({ item }: { item: CreditCardSchema }) => {
    const usagePercentage = item.creditLimit > 0 
      ? (item.currentBalance / item.creditLimit) * 100 
      : 0;

    return (
      <Card padding={getCardPadding()} marginBottom={spacing.lg}>
        <View style={dynamicStyles.cardHeader}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 4,
                height: 40,
                backgroundColor: item.color || themeColors.primary,
                borderRadius: 2,
                marginRight: spacing.md,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.cardName}>{item.name}</Text>
              <Text style={dynamicStyles.detailLabel}>
                {item.bank} •••• {item.last4Digits}
              </Text>
            </View>
          </View>
          <View style={dynamicStyles.cardActions}>
            <TouchableOpacity
              style={[dynamicStyles.actionButton, dynamicStyles.editButton]}
              onPress={() => handleEditCard(item)}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.actionButtonText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dynamicStyles.actionButton, dynamicStyles.deleteButton]}
              onPress={() => handleDeleteCard(item.id, item.name)}
              activeOpacity={0.7}
            >
              <Text style={dynamicStyles.actionButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={dynamicStyles.cardDetails}>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Fecha de corte:</Text>
            <Text style={dynamicStyles.detailValue}>Día {item.cutDate}</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Días para pagar:</Text>
            <Text style={dynamicStyles.detailValue}>{item.paymentDays} días</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Tasa de interés:</Text>
            <Text style={dynamicStyles.detailValue}>{item.annualInterestRate}%</Text>
          </View>
          <View style={dynamicStyles.detailRow}>
            <Text style={dynamicStyles.detailLabel}>Tasa moratoria:</Text>
            <Text style={dynamicStyles.detailValue}>{item.moratoryInterestRate}%</Text>
          </View>
        </View>

        <View style={dynamicStyles.creditInfo}>
          <View style={dynamicStyles.creditItem}>
            <Text style={dynamicStyles.creditLabel}>Límite</Text>
            <Text style={[dynamicStyles.creditValue, dynamicStyles.limit]}>
              {formatCurrency(item.creditLimit)}
            </Text>
          </View>
          <View style={dynamicStyles.creditItem}>
            <Text style={dynamicStyles.creditLabel}>Usado</Text>
            <Text style={[dynamicStyles.creditValue, dynamicStyles.used]}>
              {formatCurrency(item.currentBalance)}
            </Text>
            <Text style={dynamicStyles.detailLabel}>
              ({usagePercentage.toFixed(1)}%)
            </Text>
          </View>
          <View style={dynamicStyles.creditItem}>
            <Text style={dynamicStyles.creditLabel}>Disponible</Text>
            <Text style={[dynamicStyles.creditValue, dynamicStyles.available]}>
              {formatCurrency(item.availableCredit)}
            </Text>
          </View>
        </View>

        {!item.isActive && (
          <View style={dynamicStyles.inactiveBadge}>
            <Text style={dynamicStyles.inactiveText}>{toTitleCase('Inactiva')}</Text>
          </View>
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
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Text style={dynamicStyles.title}>Tarjetas de Crédito</Text>
        <TouchableOpacity
          style={dynamicStyles.addButton}
          onPress={() => {
            setEditingCard(null);
            setShowForm(true);
          }}
        >
          <Text style={dynamicStyles.addButtonText}>+ Agregar Tarjeta</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={creditCards}
        renderItem={renderCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={dynamicStyles.emptyContainer}>
            <Text style={dynamicStyles.emptyText}>
              No hay tarjetas registradas
            </Text>
            <Text style={[dynamicStyles.emptyText, { marginTop: spacing.sm }]}>
              Agrega una tarjeta para comenzar
            </Text>
          </View>
        }
      />

      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseForm}
      >
        <CreditCardForm
          onClose={handleCloseForm}
          card={editingCard || undefined}
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
