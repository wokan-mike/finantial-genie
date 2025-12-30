import React, { useState } from 'react';
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
import { formatCurrency } from '../../utils/formatters';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { TRANSACTION_TYPES } from '../../utils/constants';
import { format } from 'date-fns';
import CurrencyInput from './CurrencyInput';

interface TransactionFormProps {
  onClose: () => void;
  initialDate?: Date;
}

export default function TransactionForm({ onClose, initialDate }: TransactionFormProps) {
  const { createTransaction } = useTransactions();
  const { categories } = useCategories();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const [type, setType] = useState<'income' | 'expense'>(TRANSACTION_TYPES.EXPENSE);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [date, setDate] = useState(initialDate || new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [isPaid, setIsPaid] = useState(true);

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
      await createTransaction({
        type,
        amount: amountNum,
        description: description.trim(),
        tags: selectedTags,
        date: date.toISOString().split('T')[0],
        isRecurring,
      });

      showToast('Transacción agregada correctamente', 'success');
      onClose();
    } catch (error) {
      showToast('Error al agregar la transacción', 'error');
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    title: {
      ...typography.h1,
      color: themeColors.primary,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: themeColors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeText: {
      fontSize: 20,
      color: themeColors.textSecondary,
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
      borderRadius: 8,
      padding: spacing.md,
      color: themeColors.text,
    },
    typeButton: {
      flex: 1,
      padding: spacing.md,
      borderRadius: 8,
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
    dateText: {
      ...typography.body,
      color: themeColors.text,
      padding: spacing.md,
      backgroundColor: themeColors.surface,
      borderRadius: 8,
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
    submitButton: {
      backgroundColor: themeColors.primary,
      padding: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.xl,
    },
    submitButtonText: {
      ...typography.button,
      color: themeColors.background,
    },
  });

  return (
    <ScrollView style={dynamicStyles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={dynamicStyles.title}>Nueva Transacción</Text>
        <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
          <Text style={dynamicStyles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Tipo de transacción */}
      <View style={styles.section}>
        <Text style={dynamicStyles.label}>Tipo</Text>
        <View style={styles.typeContainer}>
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
      <View style={styles.section}>
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
      <View style={styles.section}>
        <Text style={dynamicStyles.label}>Monto</Text>
        <CurrencyInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
        />
      </View>

      {/* Fecha */}
      <View style={styles.section}>
        <Text style={dynamicStyles.label}>Fecha</Text>
        <Text style={dynamicStyles.dateText}>{format(date, 'dd/MM/yyyy')}</Text>
      </View>

      {/* Categorías/Etiquetas */}
      <View style={styles.section}>
        <Text style={dynamicStyles.label}>Categorías</Text>
        <View style={styles.tagsContainer}>
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
      <View style={styles.section}>
        <View style={styles.switchRow}>
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
        <View style={styles.section}>
          <View style={styles.switchRow}>
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

      {/* Botón de guardar */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Guardar</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

