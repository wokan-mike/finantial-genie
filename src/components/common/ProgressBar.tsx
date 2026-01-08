import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';

interface ProgressBarProps {
  value: number; // 0-100
  color?: string;
  height?: number;
  showLabel?: boolean;
  label?: string;
}

export default function ProgressBar({
  value,
  color,
  height = 8,
  showLabel = false,
  label,
}: ProgressBarProps) {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  const progressColor = color || themeColors.primary;
  const clampedValue = Math.min(Math.max(value, 0), 100);

  const dynamicStyles = StyleSheet.create({
    container: {
      width: '100%',
      marginVertical: spacing.xs,
    },
    labelContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    label: {
      fontSize: 12,
      color: themeColors.textSecondary,
    },
    progressContainer: {
      width: '100%',
      height,
      backgroundColor: themeColors.border + '30',
      borderRadius: height / 2,
      overflow: 'hidden',
      ...(Platform.OS === 'web' && {
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
      }),
    },
    progressBar: {
      height: '100%',
      width: `${clampedValue}%`,
      backgroundColor: progressColor,
      borderRadius: height / 2,
      ...(Platform.OS === 'web' && {
        transition: 'width 0.3s ease',
        boxShadow: `0 0 8px ${progressColor}40`,
      }),
    },
  });

  return (
    <View style={dynamicStyles.container}>
      {showLabel && label && (
        <View style={dynamicStyles.labelContainer}>
          <Text style={dynamicStyles.label}>{label}</Text>
          <Text style={dynamicStyles.label}>{clampedValue.toFixed(0)}%</Text>
        </View>
      )}
      <View style={dynamicStyles.progressContainer}>
        <View style={dynamicStyles.progressBar} />
      </View>
    </View>
  );
}
