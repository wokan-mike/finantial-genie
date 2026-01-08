import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRecurringExpenses } from '../../hooks/useRecurringExpenses';
import { useToast } from '../../context/ToastContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import CurrencyInput from './CurrencyInput';
import DatePicker from '../DatePicker';
import { RecurringExpenseSchema } from '../../services/database/schema';

interface RecurringExpenseFormProps {
  onClose: () => void;
  expense?: RecurringExpenseSchema; // For editing
}

const EXPENSE_TYPES = [
  { value: 'rent', label: 'Renta' },
  { value: 'car_loan', label: 'Crédito de Coche' },
  { value: 'mortgage', label: 'Hipoteca' },
  { value: 'other', label: 'Otro' },
] as const;

export default function RecurringExpenseForm({ onClose, expense }: RecurringExpenseFormProps) {
  const { createExpense, updateExpense } = useRecurringExpenses();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const isEditing = !!expense;
  
  const [name, setName] = useState(expense?.name || '');
  const [type, setType] = useState<RecurringExpenseSchema['type']>(expense?.type || 'other');
  const [monthlyAmount, setMonthlyAmount] = useState(expense?.monthlyAmount.toString() || '');
  const [paymentDay, setPaymentDay] = useState(expense?.paymentDay.toString() || '1');
  const [startDate, setStartDate] = useState(
    expense ? new Date(expense.startDate) : new Date()
  );
  const [endDate, setEndDate] = useState<Date | null>(
    expense?.endDate ? new Date(expense.endDate) : null
  );
  const [description, setDescription] = useState(expense?.description || '');
  const [hasEndDate, setHasEndDate] = useState(!!expense?.endDate);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para el cargo');
      return;
    }

    const amountNum = parseFloat(monthlyAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto mensual válido');
      return;
    }

    const dayNum = parseInt(paymentDay);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) {
      Alert.alert('Error', 'Por favor ingresa un día válido (1-31)');
      return;
    }

    if (hasEndDate && endDate && endDate <= startDate) {
      Alert.alert('Error', 'La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      const expenseData = {
        name: name.trim(),
        type,
        monthlyAmount: amountNum,
        paymentDay: dayNum,
        startDate: startDate.toISOString().split('T')[0],
        endDate: hasEndDate && endDate ? endDate.toISOString().split('T')[0] : null,
        description: description.trim() || null,
        isActive: true,
      };

      if (isEditing && expense) {
        await updateExpense(expense.id, expenseData);
        showToast('Cargo recurrente actualizado correctamente', 'success');
        onClose();
      } else {
        await createExpense(expenseData);
        showToast('Cargo recurrente registrado correctamente', 'success');
        onClose();
      }
    } catch (error) {
      console.error('[RecurringExpenseForm] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToast(
        `${isEditing ? 'Error al actualizar' : 'Error al registrar'} el cargo: ${errorMessage}`,
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
      paddingBottom: spacing.xl * 2,
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
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    typeButton: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      borderWidth: 2,
      minWidth: 120,
      alignItems: 'center',
    },
    typeButtonActive: {
      backgroundColor: themeColors.primary,
      borderColor: themeColors.primary,
    },
    typeButtonInactive: {
      backgroundColor: themeColors.surface,
      borderColor: themeColors.border,
    },
    typeButtonText: {
      ...typography.body,
      fontWeight: '600',
    },
    typeButtonTextActive: {
      color: themeColors.background,
    },
    typeButtonTextInactive: {
      color: themeColors.text,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: themeColors.primary,
      marginRight: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxChecked: {
      backgroundColor: themeColors.primary,
    },
    checkboxText: {
      ...typography.body,
      color: themeColors.text,
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
            {isEditing ? 'Editar Cargo Recurrente' : 'Nuevo Cargo Recurrente'}
          </Text>
          <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
            <Text style={dynamicStyles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Nombre</Text>
          <TextInput
            style={dynamicStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Renta departamento, Crédito auto, etc."
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>

        {/* Tipo */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Tipo de Cargo</Text>
          <View style={dynamicStyles.typeContainer}>
            {EXPENSE_TYPES.map(expenseType => {
              const isActive = type === expenseType.value;
              return (
                <TouchableOpacity
                  key={expenseType.value}
                  style={[
                    dynamicStyles.typeButton,
                    isActive ? dynamicStyles.typeButtonActive : dynamicStyles.typeButtonInactive,
                  ]}
                  onPress={() => setType(expenseType.value)}
                >
                  <Text
                    style={[
                      dynamicStyles.typeButtonText,
                      isActive
                        ? dynamicStyles.typeButtonTextActive
                        : dynamicStyles.typeButtonTextInactive,
                    ]}
                  >
                    {expenseType.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Monto Mensual */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Monto Mensual</Text>
          <CurrencyInput
            value={monthlyAmount}
            onChangeText={setMonthlyAmount}
            placeholder="0.00"
          />
        </View>

        {/* Día de Pago */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Día de Pago (1-31)</Text>
          <TextInput
            style={dynamicStyles.input}
            value={paymentDay}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, '');
              if (num === '' || (parseInt(num) >= 1 && parseInt(num) <= 31)) {
                setPaymentDay(num);
              }
            }}
            placeholder="5"
            placeholderTextColor={themeColors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        {/* Fecha de Inicio */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Fecha de Inicio</Text>
          <DatePicker value={startDate} onChange={setStartDate} />
        </View>

        {/* Fecha de Fin (opcional) */}
        <View style={dynamicStyles.section}>
          <TouchableOpacity
            style={dynamicStyles.checkboxContainer}
            onPress={() => {
              setHasEndDate(!hasEndDate);
              if (hasEndDate) {
                setEndDate(null);
              } else if (!endDate) {
                setEndDate(new Date());
              }
            }}
          >
            <View
              style={[
                dynamicStyles.checkbox,
                hasEndDate && dynamicStyles.checkboxChecked,
              ]}
            >
              {hasEndDate && <Text style={{ color: themeColors.background }}>✓</Text>}
            </View>
            <Text style={dynamicStyles.checkboxText}>Tiene fecha de fin</Text>
          </TouchableOpacity>
          {hasEndDate && (
            <View style={{ marginTop: spacing.md }}>
              <DatePicker value={endDate || new Date()} onChange={(date) => setEndDate(date)} />
            </View>
          )}
        </View>

        {/* Descripción */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[dynamicStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Notas adicionales sobre este cargo..."
            placeholderTextColor={themeColors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={dynamicStyles.buttonContainer}>
        <TouchableOpacity style={dynamicStyles.submitButton} onPress={handleSubmit}>
          <Text style={dynamicStyles.submitButtonText}>
            {isEditing ? '💾 Guardar Cambios' : '✨ Registrar Cargo'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
