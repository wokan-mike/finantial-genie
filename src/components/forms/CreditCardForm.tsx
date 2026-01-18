import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useCreditCards } from '../../hooks/useCreditCards';
import { useToast } from '../../context/ToastContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { getCreditCardTemplate, getBanks, getCreditCardsByBank, CREDIT_CARD_TEMPLATES } from '../../utils/creditCards';
import CurrencyInput from './CurrencyInput';
import ColorPicker from '../ColorPicker';
import { CreditCardSchema } from '../../services/database/schema';

interface CreditCardFormProps {
  onClose: () => void;
  card?: CreditCardSchema; // For editing
}

export default function CreditCardForm({ onClose, card }: CreditCardFormProps) {
  const { createCreditCard, updateCreditCard } = useCreditCards();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const isEditing = !!card;
  const banks = getBanks();
  
  const [selectedBank, setSelectedBank] = useState(card?.bank || banks[0] || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(card?.templateId || '');
  const [customName, setCustomName] = useState(card?.name || '');
  const [last4Digits, setLast4Digits] = useState(card?.last4Digits || '');
  const [cardColor, setCardColor] = useState(card?.color || '#1a237e');
  const [cutDate, setCutDate] = useState(card?.cutDate?.toString() || '15');
  const [paymentDays, setPaymentDays] = useState(card?.paymentDays?.toString() || '');
  const [creditLimit, setCreditLimit] = useState(card?.creditLimit?.toString() || '');
  const [currentBalance, setCurrentBalance] = useState(card?.currentBalance?.toString() || '0');

  const availableTemplates = selectedBank ? getCreditCardsByBank(selectedBank) : [];
  const selectedTemplate = selectedTemplateId ? getCreditCardTemplate(selectedTemplateId) : null;

  // Update paymentDays when template changes (only for new cards, not when editing)
  useEffect(() => {
    if (selectedTemplate && !isEditing && !paymentDays) {
      setPaymentDays(selectedTemplate.paymentDays.toString());
    }
  }, [selectedTemplateId, selectedTemplate, isEditing]);

  const handleSubmit = async () => {
    if (!selectedBank) {
      Alert.alert('Error', 'Por favor selecciona un banco');
      return;
    }

    if (!selectedTemplateId) {
      Alert.alert('Error', 'Por favor selecciona un tipo de tarjeta');
      return;
    }

    if (!customName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la tarjeta');
      return;
    }

    if (!last4Digits || last4Digits.length !== 4 || !/^\d+$/.test(last4Digits)) {
      Alert.alert('Error', 'Por favor ingresa los últimos 4 dígitos de la tarjeta');
      return;
    }

    const cutDateNum = parseInt(cutDate);
    if (isNaN(cutDateNum) || cutDateNum < 1 || cutDateNum > 31) {
      Alert.alert('Error', 'La fecha de corte debe ser entre 1 y 31');
      return;
    }

    // Use custom paymentDays if provided, otherwise use template default
    const paymentDaysNum = paymentDays ? parseInt(paymentDays) : (selectedTemplate?.paymentDays || 20);
    if (isNaN(paymentDaysNum) || paymentDaysNum < 1 || paymentDaysNum > 60) {
      Alert.alert('Error', 'Los días para pagar deben ser entre 1 y 60');
      return;
    }

    const limitNum = parseFloat(creditLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      Alert.alert('Error', 'Por favor ingresa un límite de crédito válido');
      return;
    }

    const balanceNum = parseFloat(currentBalance) || 0;
    const availableCredit = limitNum - balanceNum;

    if (!selectedTemplate) {
      Alert.alert('Error', 'Plantilla de tarjeta no encontrada');
      return;
    }

    try {
      if (isEditing && card) {
        await updateCreditCard(card.id, {
          templateId: selectedTemplateId,
          bank: selectedBank,
          name: customName.trim(),
          last4Digits,
          color: cardColor,
          cutDate: cutDateNum,
          paymentDays: paymentDaysNum,
          annualInterestRate: selectedTemplate.annualInterestRate,
          moratoryInterestRate: selectedTemplate.moratoryInterestRate,
          minPaymentPercentage: selectedTemplate.minPaymentPercentage,
          creditLimit: limitNum,
          currentBalance: balanceNum,
          availableCredit,
        });
        showToast('Tarjeta actualizada correctamente', 'success');
      } else {
        await createCreditCard({
          templateId: selectedTemplateId,
          bank: selectedBank,
          name: customName.trim(),
          last4Digits,
          color: cardColor,
          cutDate: cutDateNum,
          paymentDays: paymentDaysNum,
          annualInterestRate: selectedTemplate.annualInterestRate,
          moratoryInterestRate: selectedTemplate.moratoryInterestRate,
          minPaymentPercentage: selectedTemplate.minPaymentPercentage,
          creditLimit: limitNum,
          currentBalance: balanceNum,
          availableCredit,
          isActive: true,
        });
        showToast('Tarjeta registrada correctamente', 'success');
      }
      onClose();
    } catch (error) {
      showToast(
        isEditing ? 'Error al actualizar la tarjeta' : 'Error al registrar la tarjeta',
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
    pickerButton: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
      padding: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pickerText: {
      ...typography.body,
      color: themeColors.text,
    },
    templateCard: {
      backgroundColor: themeColors.surface,
      borderWidth: 2,
      borderColor: themeColors.border,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    templateCardSelected: {
      borderColor: themeColors.primary,
      backgroundColor: themeColors.primary + '10',
    },
    templateName: {
      ...typography.body,
      color: themeColors.text,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    templateDetails: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginBottom: spacing.xs,
    },
    infoBox: {
      backgroundColor: themeColors.primary + '20',
      borderRadius: 12,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    infoText: {
      ...typography.caption,
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
            {isEditing ? 'Editar Tarjeta' : 'Registrar Tarjeta'}
          </Text>
          <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
            <Text style={dynamicStyles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Banco */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Banco</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {banks.map(bank => (
              <TouchableOpacity
                key={bank}
                style={[
                  dynamicStyles.pickerButton,
                  { marginRight: spacing.sm },
                  selectedBank === bank && {
                    backgroundColor: themeColors.primary,
                    borderColor: themeColors.primary,
                  },
                ]}
                onPress={() => {
                  setSelectedBank(bank);
                  setSelectedTemplateId(''); // Reset template when bank changes
                }}
              >
                <Text
                  style={[
                    dynamicStyles.pickerText,
                    selectedBank === bank && { color: themeColors.background },
                  ]}
                >
                  {bank}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tipo de Tarjeta */}
        {selectedBank && (
          <View style={dynamicStyles.section}>
            <Text style={dynamicStyles.label}>Tipo de Tarjeta</Text>
            {availableTemplates.map(template => (
              <TouchableOpacity
                key={template.id}
                style={[
                  dynamicStyles.templateCard,
                  selectedTemplateId === template.id && dynamicStyles.templateCardSelected,
                ]}
                onPress={() => setSelectedTemplateId(template.id)}
              >
                <Text style={dynamicStyles.templateName}>{template.name}</Text>
                <Text style={dynamicStyles.templateDetails}>
                  CAT: {template.annualInterestRate}% | Interés Moratorio: {template.moratoryInterestRate}%
                </Text>
                <Text style={dynamicStyles.templateDetails}>
                  Pago mínimo: {template.minPaymentPercentage}% | Días de pago: {template.paymentDays}
                </Text>
                {template.benefits.length > 0 && (
                  <Text style={dynamicStyles.templateDetails}>
                    Beneficios: {template.benefits.join(', ')}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Nombre Personalizado */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Nombre de la Tarjeta</Text>
          <TextInput
            style={dynamicStyles.input}
            value={customName}
            onChangeText={setCustomName}
            placeholder="Ej: Mi Tarjeta BBVA"
            placeholderTextColor={themeColors.textSecondary}
          />
        </View>

        {/* Últimos 4 Dígitos */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Últimos 4 Dígitos</Text>
          <TextInput
            style={dynamicStyles.input}
            value={last4Digits}
            onChangeText={(text) => {
              const digits = text.replace(/[^0-9]/g, '').slice(0, 4);
              setLast4Digits(digits);
            }}
            placeholder="1234"
            placeholderTextColor={themeColors.textSecondary}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        {/* Color de la Tarjeta */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Color de Identificación</Text>
          <ColorPicker value={cardColor} onChange={setCardColor} />
        </View>

        {/* Fecha de Corte */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Fecha de Corte (día del mes)</Text>
          <TextInput
            style={dynamicStyles.input}
            value={cutDate}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, '');
              if (num === '' || (parseInt(num) >= 1 && parseInt(num) <= 31)) {
                setCutDate(num);
              }
            }}
            placeholder="15"
            placeholderTextColor={themeColors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        {/* Días para Pagar */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Días para Pagar (después del corte)</Text>
          <TextInput
            style={dynamicStyles.input}
            value={paymentDays}
            onChangeText={(text) => {
              const num = text.replace(/[^0-9]/g, '');
              if (num === '' || (parseInt(num) >= 1 && parseInt(num) <= 60)) {
                setPaymentDays(num);
              }
            }}
            placeholder={selectedTemplate?.paymentDays?.toString() || '20'}
            placeholderTextColor={themeColors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
          />
          {selectedTemplate && !paymentDays && (
            <Text style={[dynamicStyles.infoText, { marginTop: spacing.xs, fontSize: 12 }]}>
              Valor por defecto del template: {selectedTemplate.paymentDays} días
            </Text>
          )}
        </View>

        {/* Límite de Crédito */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Límite de Crédito</Text>
          <CurrencyInput
            value={creditLimit}
            onChangeText={setCreditLimit}
            placeholder="0.00"
          />
        </View>

        {/* Saldo Actual */}
        <View style={dynamicStyles.section}>
          <Text style={dynamicStyles.label}>Saldo Actual</Text>
          <CurrencyInput
            value={currentBalance}
            onChangeText={setCurrentBalance}
            placeholder="0.00"
          />
        </View>

        {/* Información de la Tarjeta Seleccionada */}
        {selectedTemplate && (
          <View style={dynamicStyles.section}>
            <View style={dynamicStyles.infoBox}>
              <Text style={[dynamicStyles.infoText, { fontWeight: '600', marginBottom: spacing.xs }]}>
                Características de la Tarjeta:
              </Text>
              <Text style={dynamicStyles.infoText}>
                • Tasa de interés anual: {selectedTemplate.annualInterestRate}%
              </Text>
              <Text style={dynamicStyles.infoText}>
                • Tasa moratoria: {selectedTemplate.moratoryInterestRate}%
              </Text>
              <Text style={dynamicStyles.infoText}>
                • Pago mínimo: {selectedTemplate.minPaymentPercentage}% del saldo
              </Text>
              <Text style={dynamicStyles.infoText}>
                • Días para pagar sin intereses: {selectedTemplate.paymentDays} días después del corte
              </Text>
              {selectedTemplate.annualFee > 0 && (
                <Text style={dynamicStyles.infoText}>
                  • Anualidad: ${selectedTemplate.annualFee.toLocaleString('es-MX')}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={dynamicStyles.buttonContainer}>
        <TouchableOpacity style={dynamicStyles.submitButton} onPress={handleSubmit}>
          <Text style={dynamicStyles.submitButtonText}>
            {isEditing ? '💾 Guardar Cambios' : '✨ Registrar Tarjeta'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
