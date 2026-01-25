import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useAssets } from '../../hooks/useAssets';
import { useToast } from '../../context/ToastContext';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { AssetSchema } from '../../services/database/schema';
import CurrencyInput from './CurrencyInput';
import { isDesktop, getCardPadding } from '../../utils/responsive';
import { format } from 'date-fns';
import { formatCurrency } from '../../utils/formatters';

interface AssetFormProps {
  onClose: () => void;
  asset?: AssetSchema; // For editing
}

// Asset type definitions with default values
// Annual value change rates based on typical market behavior:
// - Vehicles: ~15-20% depreciation per year
// - Motorcycles: ~20-25% depreciation per year  
// - Real estate: varies, but typically 0-3% appreciation (using 0% as neutral)
// - Cash: loses value due to inflation (~4-6% annually in Mexico)
// - Bank accounts: loses value due to inflation (same as cash)
// - Investments: should be calculated from investments page (not here)
// - Other: no change
const ASSET_TYPES = [
  { value: 'real_estate', label: 'Bien Inmueble', defaultDepreciation: 0, defaultLiquidity: 5 },
  { value: 'vehicle', label: 'Automóvil', defaultDepreciation: -15, defaultLiquidity: 4 },
  { value: 'motorcycle', label: 'Moto', defaultDepreciation: -20, defaultLiquidity: 4 },
  { value: 'cash', label: 'Dinero Líquido', defaultDepreciation: -5, defaultLiquidity: 1 }, // Inflation loss
  { value: 'bank', label: 'Cuenta Bancaria', defaultDepreciation: -5, defaultLiquidity: 1 }, // Inflation loss
  { value: 'investment', label: 'Inversión', defaultDepreciation: null, defaultLiquidity: 2 }, // Should come from investments page
  { value: 'other', label: 'Otro', defaultDepreciation: 0, defaultLiquidity: 3 },
] as const;

const LIQUIDITY_LABELS = {
  1: 'Muy Líquido (Efectivo)',
  2: 'Líquido (Fácil de convertir)',
  3: 'Moderadamente Líquido',
  4: 'Poco Líquido',
  5: 'Ilíquido (Difícil de convertir)',
};

export default function AssetForm({ onClose, asset }: AssetFormProps) {
  const { createAsset, updateAsset } = useAssets();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const isEditing = !!asset;
  
  const [assetType, setAssetType] = useState<AssetSchema['type']>(asset?.type || 'cash');
  const [name, setName] = useState(asset?.name || '');
  const [value, setValue] = useState(asset?.value?.toString() || '0');
  const [liquidity, setLiquidity] = useState<1 | 2 | 3 | 4 | 5>(
    asset?.liquidity || 1
  );
  const [purchaseDate, setPurchaseDate] = useState(
    asset?.purchaseDate ? format(new Date(asset.purchaseDate), 'yyyy-MM-dd') : ''
  );
  const [notes, setNotes] = useState(asset?.notes || '');
  
  // Allow user to override the automatic annual value change
  const getSuggestedValue = () => {
    const typeInfo = ASSET_TYPES.find(t => t.value === assetType);
    return typeInfo?.defaultDepreciation ?? 0;
  };
  
  const [useCustomValueChange, setUseCustomValueChange] = useState(() => {
    if (isEditing && asset?.annualValueChange !== null && asset?.annualValueChange !== undefined) {
      const suggested = getSuggestedValue();
      // If the asset has a custom value different from suggested, use custom
      return asset.annualValueChange !== suggested;
    }
    return false;
  });
  const [customAnnualValueChange, setCustomAnnualValueChange] = useState(() => {
    if (isEditing && asset?.annualValueChange !== null && asset?.annualValueChange !== undefined) {
      const suggested = getSuggestedValue();
      // If different from suggested, show the custom value
      if (asset.annualValueChange !== suggested) {
        return asset.annualValueChange.toString();
      }
    }
    return '';
  });

  // Get suggested annual value change based on asset type
  const getSuggestedAnnualValueChange = (): number | null => {
    const typeInfo = ASSET_TYPES.find(t => t.value === assetType);
    if (!typeInfo) return 0;
    
    // For investments, return null (should come from investments page)
    if (assetType === 'investment') {
      return null;
    }
    
    return typeInfo.defaultDepreciation;
  };

  // Get final annual value change (custom if user overrode, otherwise suggested)
  const getAnnualValueChange = (): number | null => {
    if (assetType === 'investment') {
      return null;
    }
    
    if (useCustomValueChange && customAnnualValueChange) {
      const customValue = parseFloat(customAnnualValueChange);
      return isNaN(customValue) ? getSuggestedAnnualValueChange() : customValue;
    }
    
    return getSuggestedAnnualValueChange();
  };

  // Calculate suggested current value based on purchase date and annual change
  const calculateSuggestedCurrentValue = (): number | null => {
    if (!purchaseDate || !value) return null;
    
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const yearsSincePurchase = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    if (yearsSincePurchase <= 0) return parseFloat(value) || 0;
    
    const annualChange = getAnnualValueChange();
    if (annualChange === null) return null;
    
    const valueNum = parseFloat(value) || 0;
    const annualMultiplier = 1 + (annualChange / 100);
    const suggestedValue = valueNum * Math.pow(annualMultiplier, yearsSincePurchase);
    
    return Math.max(0, suggestedValue);
  };

  // Update default values when asset type changes
  useEffect(() => {
    const typeInfo = ASSET_TYPES.find(t => t.value === assetType);
    if (typeInfo) {
      setLiquidity(typeInfo.defaultLiquidity);
      // If not using custom value, reset to suggested when type changes
      if (!useCustomValueChange) {
        setCustomAnnualValueChange('');
      }
    }
  }, [assetType]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast('El nombre es requerido', 'error');
      return;
    }

    const valueNum = parseFloat(value);
    if (isNaN(valueNum) || valueNum < 0) {
      showToast('El valor debe ser un número válido mayor o igual a 0', 'error');
      return;
    }

    // Get automatic annual value change based on type
    const annualChangeNum = getAnnualValueChange();
    
    // For investments, warn user that it should come from investments page
    if (assetType === 'investment' && annualChangeNum === null) {
      showToast('Nota: El cambio de valor de inversiones se calcula desde la página de Inversiones', 'info');
    }

    const purchaseDateISO = purchaseDate ? new Date(purchaseDate).toISOString() : null;

    try {
      if (isEditing && asset) {
        await updateAsset(asset.id, {
          type: assetType,
          name: name.trim(),
          value: valueNum,
          currency: asset.currency || 'MXN',
          annualValueChange: annualChangeNum,
          liquidity,
          purchaseDate: purchaseDateISO,
          notes: notes.trim() || null,
        });
        showToast('Activo actualizado correctamente', 'success');
      } else {
        await createAsset({
          type: assetType,
          name: name.trim(),
          value: valueNum,
          currency: 'MXN',
          annualValueChange: annualChangeNum,
          liquidity,
          purchaseDate: purchaseDateISO,
          notes: notes.trim() || null,
        });
        showToast('Activo registrado correctamente', 'success');
      }
      onClose();
    } catch (error) {
      showToast(
        isEditing ? 'Error al actualizar el activo' : 'Error al registrar el activo',
        'error'
      );
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.surface,
    },
    scrollContent: {
      padding: spacing.md,
    },
    title: {
      ...typography.h2,
      color: themeColors.primary,
      marginBottom: spacing.lg,
      fontWeight: '700',
    },
    label: {
      ...typography.body,
      color: themeColors.text,
      marginBottom: spacing.xs,
      fontWeight: '600',
    },
    input: {
      ...typography.body,
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: spacing.md,
      color: themeColors.text,
      marginBottom: spacing.md,
      fontSize: isDesktop ? 16 : 14,
    },
    textArea: {
      ...typography.body,
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: spacing.md,
      color: themeColors.text,
      marginBottom: spacing.md,
      minHeight: 80,
      textAlignVertical: 'top',
      fontSize: isDesktop ? 16 : 14,
    },
    selectButton: {
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 8,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    selectButtonActive: {
      backgroundColor: themeColors.primary + '20',
      borderColor: themeColors.primary,
    },
    selectButtonText: {
      ...typography.body,
      color: themeColors.text,
      flex: 1,
    },
    selectButtonTextActive: {
      color: themeColors.primary,
      fontWeight: '600',
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    button: {
      flex: 1,
      padding: spacing.md,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    submitButton: {
      backgroundColor: themeColors.primary,
    },
    buttonText: {
      ...typography.body,
      fontWeight: '600',
      fontSize: isDesktop ? 16 : 14,
    },
    cancelButtonText: {
      color: themeColors.text,
    },
    submitButtonText: {
      color: themeColors.background,
    },
    infoText: {
      ...typography.caption,
      color: themeColors.textSecondary,
      marginTop: -spacing.sm,
      marginBottom: spacing.md,
      fontStyle: 'italic',
    },
    liquidityContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    liquidityButton: {
      flex: 1,
      minWidth: '30%',
      padding: spacing.sm,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: themeColors.border,
      backgroundColor: themeColors.background,
      alignItems: 'center',
    },
    liquidityButtonActive: {
      backgroundColor: themeColors.primary + '20',
      borderColor: themeColors.primary,
    },
    liquidityButtonText: {
      ...typography.caption,
      color: themeColors.text,
      fontSize: 11,
      textAlign: 'center',
    },
    liquidityButtonTextActive: {
      color: themeColors.primary,
      fontWeight: '600',
    },
    infoCard: {
      backgroundColor: themeColors.background,
      padding: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    infoTitle: {
      ...typography.body,
      color: themeColors.primary,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
  });

  const selectedTypeInfo = ASSET_TYPES.find(t => t.value === assetType);

  return (
    <View style={dynamicStyles.container}>
      <ScrollView style={dynamicStyles.container} contentContainerStyle={dynamicStyles.scrollContent}>
        <Text style={dynamicStyles.title}>
          {isEditing ? 'Editar Activo' : 'Agregar Activo'}
        </Text>

        <Text style={dynamicStyles.label}>Tipo de Activo *</Text>
        {ASSET_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              dynamicStyles.selectButton,
              assetType === type.value && dynamicStyles.selectButtonActive,
            ]}
            onPress={() => setAssetType(type.value)}
          >
            <Text
              style={[
                dynamicStyles.selectButtonText,
                assetType === type.value && dynamicStyles.selectButtonTextActive,
              ]}
            >
              {type.label}
            </Text>
            {assetType === type.value && <Text>✓</Text>}
          </TouchableOpacity>
        ))}

        <Text style={dynamicStyles.label}>Nombre *</Text>
        <TextInput
          style={dynamicStyles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Casa en CDMX, Toyota Corolla 2020, etc."
          placeholderTextColor={themeColors.textSecondary}
        />

        <Text style={dynamicStyles.label}>Valor Actual *</Text>
        <CurrencyInput
          value={value}
          onChangeText={setValue}
          placeholder="0.00"
        />

        {/* Show suggested annual value change and allow override */}
        {assetType !== 'investment' && (
          <View style={[dynamicStyles.infoCard, { marginBottom: spacing.md }]}>
            <Text style={dynamicStyles.infoTitle}>Cambio Anual de Valor</Text>
            <Text style={dynamicStyles.infoText}>
              {selectedTypeInfo?.defaultDepreciation && selectedTypeInfo.defaultDepreciation < 0 ? (
                <>
                  <Text style={{ fontWeight: '600' }}>Sugerencia (depreciación anual):</Text> {Math.abs(selectedTypeInfo.defaultDepreciation)}%
                  {assetType === 'cash' || assetType === 'bank' ? ' (pérdida por inflación)' : ''}
                </>
              ) : selectedTypeInfo?.defaultDepreciation && selectedTypeInfo.defaultDepreciation > 0 ? (
                <>
                  <Text style={{ fontWeight: '600' }}>Sugerencia (apreciación anual):</Text> +{selectedTypeInfo.defaultDepreciation}%
                </>
              ) : (
                <>
                  <Text style={{ fontWeight: '600' }}>Sugerencia:</Text> 0% (sin cambio)
                </>
              )}
            </Text>
            
            <TouchableOpacity
              style={[dynamicStyles.selectButton, { marginTop: spacing.sm }]}
              onPress={() => setUseCustomValueChange(!useCustomValueChange)}
            >
              <Text style={dynamicStyles.selectButtonText}>
                {useCustomValueChange ? '✓ Usar valor personalizado' : 'Usar valor sugerido'}
              </Text>
            </TouchableOpacity>
            
            {useCustomValueChange && (
              <>
                <TextInput
                  style={[dynamicStyles.input, { marginTop: spacing.sm }]}
                  value={customAnnualValueChange}
                  onChangeText={setCustomAnnualValueChange}
                  placeholder={selectedTypeInfo?.defaultDepreciation?.toString() || "0"}
                  keyboardType="numeric"
                  placeholderTextColor={themeColors.textSecondary}
                />
                <Text style={dynamicStyles.infoText}>
                  Ingresa el cambio anual en % (negativo = depreciación, positivo = apreciación)
                </Text>
              </>
            )}
            
            {/* Show calculated current value if purchase date is set */}
            {purchaseDate && value && parseFloat(value) > 0 && (
              <View style={{ marginTop: spacing.md, padding: spacing.sm, backgroundColor: themeColors.primary + '10', borderRadius: 6 }}>
                <Text style={[dynamicStyles.infoText, { fontWeight: '600', marginBottom: spacing.xs }]}>
                  Valor Actual Calculado (Sugerido):
                </Text>
                <Text style={[dynamicStyles.infoText, { fontSize: 18, fontWeight: '700', color: themeColors.primary }]}>
                  {(() => {
                    const suggested = calculateSuggestedCurrentValue();
                    if (suggested === null) return 'N/A';
                    return formatCurrency(suggested);
                  })()}
                </Text>
                <Text style={[dynamicStyles.infoText, { fontSize: 12, marginTop: spacing.xs, color: themeColors.textSecondary }]}>
                  Basado en: Valor original {formatCurrency(parseFloat(value) || 0)}, 
                  cambio anual {getAnnualValueChange() !== null ? `${getAnnualValueChange()}%` : 'N/A'},
                  desde {purchaseDate}
                </Text>
                <Text style={[dynamicStyles.infoText, { fontSize: 11, marginTop: spacing.xs, fontStyle: 'italic' }]}>
                  Este es el valor sugerido. Si tu activo tiene un valor diferente, puedes ajustar el cambio anual arriba.
                </Text>
              </View>
            )}
          </View>
        )}
        
        {assetType === 'investment' && (
          <View style={[dynamicStyles.infoCard, { marginBottom: spacing.md }]}>
            <Text style={dynamicStyles.infoTitle}>Inversión</Text>
            <Text style={dynamicStyles.infoText}>
              El cambio de valor se calculará desde la página de Inversiones cuando esté disponible.
            </Text>
          </View>
        )}

        <Text style={dynamicStyles.label}>Liquidez</Text>
        <View style={dynamicStyles.liquidityContainer}>
          {[1, 2, 3, 4, 5].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                dynamicStyles.liquidityButton,
                liquidity === level && dynamicStyles.liquidityButtonActive,
              ]}
              onPress={() => setLiquidity(level as 1 | 2 | 3 | 4 | 5)}
            >
              <Text
                style={[
                  dynamicStyles.liquidityButtonText,
                  liquidity === level && dynamicStyles.liquidityButtonTextActive,
                ]}
              >
                {level}
              </Text>
              <Text
                style={[
                  dynamicStyles.liquidityButtonText,
                  liquidity === level && dynamicStyles.liquidityButtonTextActive,
                ]}
              >
                {LIQUIDITY_LABELS[level as keyof typeof LIQUIDITY_LABELS]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={dynamicStyles.infoText}>
          {selectedTypeInfo?.defaultLiquidity && `Valor por defecto: ${selectedTypeInfo.defaultLiquidity} - ${LIQUIDITY_LABELS[selectedTypeInfo.defaultLiquidity]}`}
        </Text>

        <Text style={dynamicStyles.label}>Fecha de Adquisición</Text>
        <TextInput
          style={dynamicStyles.input}
          value={purchaseDate}
          onChangeText={setPurchaseDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={themeColors.textSecondary}
        />
        <Text style={dynamicStyles.infoText}>
          Fecha en que adquiriste el activo (opcional)
        </Text>

        <Text style={dynamicStyles.label}>Notas</Text>
        <TextInput
          style={dynamicStyles.textArea}
          value={notes}
          onChangeText={setNotes}
          placeholder="Información adicional sobre este activo..."
          placeholderTextColor={themeColors.textSecondary}
          multiline
          numberOfLines={3}
        />

        <View style={dynamicStyles.buttonContainer}>
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.cancelButton]}
            onPress={onClose}
          >
            <Text style={[dynamicStyles.buttonText, dynamicStyles.cancelButtonText]}>
              Cancelar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dynamicStyles.button, dynamicStyles.submitButton]}
            onPress={handleSubmit}
          >
            <Text style={[dynamicStyles.buttonText, dynamicStyles.submitButtonText]}>
              {isEditing ? 'Actualizar' : 'Agregar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
