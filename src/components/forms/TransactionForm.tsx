import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useToast } from '../../context/ToastContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { TRANSACTION_TYPES } from '../../utils/constants';
import CurrencyInput from './CurrencyInput';
import DatePicker from '../DatePicker';
import CreditCardPicker from '../CreditCardPicker';
import { TransactionSchema } from '../../services/database/schema';

interface TransactionFormProps {
  onClose: () => void;
  initialDate?: Date;
  transaction?: TransactionSchema; // For editing
}

export default function TransactionForm({ onClose, initialDate, transaction }: TransactionFormProps) {
  const { createTransaction, updateTransaction } = useTransactions();
  const { categories } = useCategories();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const isEditing = !!transaction;
  
  const [type, setType] = useState<'income' | 'expense'>(
    transaction?.type || TRANSACTION_TYPES.EXPENSE
  );
  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(transaction?.amount.toString() || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(transaction?.tags || []);
  const [date, setDate] = useState(
    transaction ? new Date(transaction.date) : (initialDate || new Date())
  );
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring || false);
  const [isPaid, setIsPaid] = useState(true);
  const [creditCardId, setCreditCardId] = useState<string | null>(transaction?.creditCardId || null);

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Por favor ingresa un concepto');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto válido');
      return;
    }

    try {
      if (isEditing && transaction) {
        await updateTransaction(transaction.id, {
          type,
          amount: amountNum,
          description: description.trim(),
          tags: selectedTags,
          date: date.toISOString().split('T')[0],
          isRecurring,
          creditCardId: type === TRANSACTION_TYPES.EXPENSE ? creditCardId : null,
        });
        showToast('Transacción actualizada correctamente', 'success');
      } else {
        await createTransaction({
          type,
          amount: amountNum,
          description: description.trim(),
          tags: selectedTags,
          date: date.toISOString().split('T')[0],
          isRecurring,
          creditCardId: type === TRANSACTION_TYPES.EXPENSE ? creditCardId : null,
        });
        showToast('Transacción agregada correctamente', 'success');
      }
      onClose();
    } catch (error) {
      showToast(
        isEditing ? 'Error al actualizar la transacción' : 'Error al agregar la transacción',
        'error'
      );
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xl * 2, // Extra space for button
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.h1,
      color: themeColors.primary,
      fontWeight: '700',
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    closeText: {
      fontSize: 24,
      color: themeColors.textSecondary,
      lineHeight: 24,
    },
    section: {
      marginBottom: spacing.lg,
    },
    label: {
      ...typography.body,
      color: themeColors.text,
      marginBottom: spacing.sm,
      fontWeight: '600',
    },
    input: {
      ...typography.body,
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
      padding: spacing.md,
      color: themeColors.text,
    },
    typeContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    typeButton: {
      flex: 1,
      padding: spacing.md,
      borderRadius: 12,
      backgroundColor: themeColors.surface,
      borderWidth: 2,
      borderColor: themeColors.border,
      alignItems: 'center',
    },
    typeButtonActive: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    typeButtonText: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
    },
    typeButtonTextActive: {
      color: themeColors.background,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    tag: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      borderWidth: 2,
      backgroundColor: themeColors.surface,
    },
    tagSelected: {
      backgroundColor: themeColors.primary + '20',
    },
    tagText: {
      ...typography.bodySmall,
      color: themeColors.text,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    submitButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: spacing.xl,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
      borderWidth: 2,
      borderColor: themeColors.primaryLight,
    },
    submitButtonText: {
      ...typography.h4,
      color: themeColors.background,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: themeColors.background,
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
    },
  });

  return (
    <View style={dynamicStyles.container}>
      <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.content}>
        <View style={dynamicStyles.header}>
          <Text style={dynamicStyles.title}>
            {isEditing ? 'Editar Transacción' : 'Nueva Transacción'}
          </Text>
          <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
            <Text style={dynamicStyles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Tipo de transacción */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Tipo</Text>
          <View style={dynamicStyles.typeContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.typeButton,
                type === TRANSACTION_TYPES.INCOME && dynamicStyles.typeButtonActive,
              ]}
              onPress={() => setType(TRANSACTION_TYPES.INCOME)}
            >
              <Text
                style={[
                  dynamicStyles.typeButtonText,
                  type === TRANSACTION_TYPES.INCOME && dynamicStyles.typeButtonTextActive,
                ]}
              >
                Ingreso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                dynamicStyles.typeButton,
                type === TRANSACTION_TYPES.EXPENSE && dynamicStyles.typeButtonActive,
              ]}
              onPress={() => setType(TRANSACTION_TYPES.EXPENSE)}
            >
              <Text
                style={[
                  dynamicStyles.typeButtonText,
                  type === TRANSACTION_TYPES.EXPENSE && dynamicStyles.typeButtonTextActive,
                ]}
              >
                Gasto
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Concepto */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Concepto</Text>
          <TextInput
            style={dynamicStyles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Ej: Comida, Salario, etc."
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>

        {/* Monto */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Monto</Text>
          <CurrencyInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
          />
        </View>

        {/* Fecha */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Fecha</Text>
          <DatePicker value={date} onChange={setDate} />
        </View>

        {/* Tarjeta de Crédito (solo para gastos) */}
        {type === TRANSACTION_TYPES.EXPENSE && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.label}>Tarjeta de Crédito (opcional)</Text>
            <CreditCardPicker
              value={creditCardId}
              onChange={setCreditCardId}
              placeholder="Seleccionar tarjeta"
            />
          </View>
        )}

        {/* Categorías/Etiquetas */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Categorías</Text>
          <View style={dynamicStyles.tagsContainer}>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  dynamicStyles.tag,
                  selectedTags.includes(category.id) && dynamicStyles.tagSelected,
                  { borderColor: category.color },
                ]}
                onPress={() => toggleTag(category.id)}
              >
                <Text
                  style={[
                    dynamicStyles.tagText,
                    selectedTags.includes(category.id) && { color: category.color },
                  ]}
                >
                  {category.icon} {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recurrente */}
        <View style={dynamicStyles.section}>
          <View style={dynamicStyles.switchRow}>
            <Text style={dynamicStyles.label}>Gasto recurrente</Text>
            <Switch
              value={isRecurring}
              onValueChange={setIsRecurring}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.background}
            />
          </View>
        </View>

        {/* Pagado (solo para gastos) */}
        {type === TRANSACTION_TYPES.EXPENSE && (
          <View style={dynamicStyles.section}>
            <View style={dynamicStyles.switchRow}>
              <Text style={dynamicStyles.label}>¿Ya se pagó?</Text>
              <Switch
                value={isPaid}
                onValueChange={setIsPaid}
                trackColor={{ false: themeColors.border, true: themeColors.accent }}
                thumbColor={themeColors.background}
              />
            </View>
          </View>
        )}

        {/* Spacer for fixed button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón de guardar fijo en la parte inferior */}
      <View style={dynamicStyles.buttonContainer}>
        <TouchableOpacity style={dynamicStyles.submitButton} onPress={handleSubmit}>
          <Text style={dynamicStyles.submitButtonText}>
            {isEditing ? '💾 Guardar Cambios' : '✨ Guardar Transacción'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
