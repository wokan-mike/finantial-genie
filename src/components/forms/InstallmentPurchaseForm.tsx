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
import { useInstallments } from '../../hooks/useInstallments';
import { useToast } from '../../context/ToastContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import CurrencyInput from './CurrencyInput';
import DatePicker from '../DatePicker';
import CreditCardPicker from '../CreditCardPicker';
import { InstallmentPurchaseSchema } from '../../services/database/schema';

interface InstallmentPurchaseFormProps {
  onClose: () => void;
  purchase?: InstallmentPurchaseSchema; // For editing
}

export default function InstallmentPurchaseForm({ onClose, purchase }: InstallmentPurchaseFormProps) {
  const { createPurchase, updatePurchase } = useInstallments();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const isEditing = !!purchase;
  
  const [name, setName] = useState(purchase?.name || '');
  const [totalAmount, setTotalAmount] = useState(purchase?.totalAmount.toString() || '');
  const [numberOfMonths, setNumberOfMonths] = useState(purchase?.numberOfMonths.toString() || '');
  const [startDate, setStartDate] = useState(
    purchase ? new Date(purchase.startDate) : new Date()
  );
  const [description, setDescription] = useState(purchase?.description || '');
  const [creditCardId, setCreditCardId] = useState<string | null>(purchase?.creditCardId || null);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la compra');
      return;
    }

    const amountNum = parseFloat(totalAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Por favor ingresa un monto total válido');
      return;
    }

    const monthsNum = parseInt(numberOfMonths);
    if (isNaN(monthsNum) || monthsNum <= 0) {
      Alert.alert('Error', 'Por favor ingresa un número de meses válido');
      return;
    }

    try {
      if (isEditing && purchase) {
        await updatePurchase(purchase.id, {
          name: name.trim(),
          totalAmount: amountNum,
          numberOfMonths: monthsNum,
          monthlyPayment: amountNum / monthsNum,
          startDate: startDate.toISOString().split('T')[0],
          description: description.trim() || null,
          creditCardId,
        });
        showToast('Compra a meses actualizada correctamente', 'success');
        onClose();
      } else {
        console.log('[InstallmentPurchaseForm] Creating purchase...', {
          name: name.trim(),
          totalAmount: amountNum,
          numberOfMonths: monthsNum,
          startDate: startDate.toISOString().split('T')[0],
          description: description.trim() || null,
          creditCardId,
        });
        const newPurchase = await createPurchase({
          name: name.trim(),
          totalAmount: amountNum,
          numberOfMonths: monthsNum,
          startDate: startDate.toISOString().split('T')[0],
          description: description.trim() || null,
          creditCardId,
        });
        console.log('[InstallmentPurchaseForm] Purchase created:', newPurchase);
        showToast('Compra a meses registrada correctamente', 'success');
        onClose();
      }
    } catch (error) {
      console.error('[InstallmentPurchaseForm] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToast(
        `${isEditing ? 'Error al actualizar' : 'Error al registrar'} la compra: ${errorMessage}`,
        'error'
      );
    }
  };

  const monthlyPayment = totalAmount && numberOfMonths
    ? parseFloat(totalAmount) / parseInt(numberOfMonths)
    : 0;

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
    infoBox: {
      backgroundColor: themeColors.primary + '20',
      borderRadius: 12,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    infoText: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
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
            {isEditing ? 'Editar Compra a Meses' : 'Nueva Compra a Meses'}
          </Text>
          <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
            <Text style={dynamicStyles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Nombre */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Nombre de la Compra</Text>
          <TextInput
            style={dynamicStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Laptop, Refrigerador, etc."
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>

        {/* Monto Total */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Monto Total</Text>
          <CurrencyInput
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholder="0.00"
          />
        </View>

        {/* Número de Meses */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Número de Meses</Text>
          <TextInput
            style={dynamicStyles.input}
            value={numberOfMonths}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, '');
              setNumberOfMonths(num);
            }}
            placeholder="12"
            placeholderTextColor={themeColors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        {/* Fecha de Inicio */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Fecha de Inicio</Text>
          <DatePicker value={startDate} onChange={setStartDate} />
        </View>

        {/* Tarjeta de Crédito */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Tarjeta de Crédito (opcional)</Text>
          <CreditCardPicker
            value={creditCardId}
            onChange={setCreditCardId}
            placeholder="Seleccionar tarjeta"
          />
        </View>

        {/* Descripción */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Descripción (opcional)</Text>
          <TextInput
            style={[dynamicStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Notas adicionales sobre esta compra..."
            placeholderTextColor={themeColors.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Resumen de Pago Mensual */}
        {monthlyPayment > 0 && (
          <View style={dynamicStyles.section}>
            <View style={dynamicStyles.infoBox}>
              <Text style={dynamicStyles.infoText}>
                Pago mensual estimado: ${monthlyPayment.toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={dynamicStyles.buttonContainer}>
        <TouchableOpacity style={dynamicStyles.submitButton} onPress={handleSubmit}>
          <Text style={dynamicStyles.submitButtonText}>
            {isEditing ? '💾 Guardar Cambios' : '✨ Registrar Compra'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
