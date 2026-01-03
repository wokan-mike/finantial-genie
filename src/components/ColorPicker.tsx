import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  style?: any;
}

// Paleta de colores elegantes y sutiles
const COLOR_PALETTE = [
  '#1a237e', // Azul galáctico
  '#3949ab', // Azul medio
  '#5c6bc0', // Azul claro
  '#ff6f00', // Naranja
  '#ff9800', // Naranja claro
  '#2e7d32', // Verde
  '#4caf50', // Verde claro
  '#9c27b0', // Morado
  '#ba68c8', // Morado claro
  '#e91e63', // Rosa
  '#f06292', // Rosa claro
  '#00bcd4', // Cyan
  '#4dd0e1', // Cyan claro
  '#ff5722', // Naranja oscuro
  '#795548', // Marrón
  '#607d8b', // Azul gris
  '#455a64', // Azul gris oscuro
  '#ffc107', // Ámbar
  '#ffeb3b', // Amarillo
  '#8bc34a', // Verde lima
];

export default function ColorPicker({ value, onChange, style }: ColorPickerProps) {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const [showPicker, setShowPicker] = useState(false);

  const dynamicStyles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: 12,
      padding: spacing.md,
      minHeight: 50,
    },
    colorPreview: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: themeColors.border,
      marginRight: spacing.md,
    },
    label: {
      ...typography.body,
      color: themeColors.text,
      flex: 1,
    },
    icon: {
      ...typography.body,
      color: themeColors.textSecondary,
      marginLeft: spacing.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      maxHeight: '70%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      ...typography.h4,
      color: themeColors.text,
      fontWeight: '600',
    },
    closeButton: {
      padding: spacing.sm,
    },
    closeButtonText: {
      ...typography.body,
      color: themeColors.primary,
      fontWeight: '600',
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      justifyContent: 'center',
    },
    colorOption: {
      width: 50,
      height: 50,
      borderRadius: 25,
      borderWidth: 3,
      borderColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorOptionSelected: {
      borderColor: themeColors.primary,
      transform: [{ scale: 1.1 }],
    },
    checkmark: {
      color: '#ffffff',
      fontSize: 24,
      fontWeight: 'bold',
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  });

  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  };

  const isColorLight = (hex: string): boolean => {
    return getLuminance(hex) > 0.5;
  };

  return (
    <>
      <TouchableOpacity
        style={[dynamicStyles.container, style]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <View style={[dynamicStyles.colorPreview, { backgroundColor: value || themeColors.primary }]} />
        <Text style={dynamicStyles.label}>
          {value ? 'Color seleccionado' : 'Seleccionar color'}
        </Text>
        <Text style={dynamicStyles.icon}>🎨</Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(false)}
      >
        <TouchableOpacity
          style={dynamicStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPicker(false)}
        >
          <View style={dynamicStyles.modalContent}>
            <View style={dynamicStyles.modalHeader}>
              <Text style={dynamicStyles.modalTitle}>Seleccionar Color</Text>
              <TouchableOpacity
                style={dynamicStyles.closeButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={dynamicStyles.closeButtonText}>Listo</Text>
              </TouchableOpacity>
            </View>

            <View style={dynamicStyles.colorGrid}>
              {COLOR_PALETTE.map((color) => {
                const isSelected = value === color;
                const showCheckmark = isSelected && !isColorLight(color);
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      dynamicStyles.colorOption,
                      { backgroundColor: color },
                      isSelected && dynamicStyles.colorOptionSelected,
                    ]}
                    onPress={() => {
                      onChange(color);
                      setShowPicker(false);
                    }}
                  >
                    {showCheckmark && <Text style={dynamicStyles.checkmark}>✓</Text>}
                    {isSelected && isColorLight(color) && (
                      <Text style={[dynamicStyles.checkmark, { color: '#000000' }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
