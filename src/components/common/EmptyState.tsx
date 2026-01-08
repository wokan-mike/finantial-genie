import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { isMobile, isDesktop } from '../../utils/responsive';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: compact ? spacing.lg : (isDesktop ? spacing.xxl * 2 : spacing.xl),
      minHeight: compact ? 200 : (isDesktop ? 400 : 300),
    },
    iconContainer: {
      width: compact ? 64 : (isDesktop ? 120 : 80),
      height: compact ? 64 : (isDesktop ? 120 : 80),
      borderRadius: compact ? 32 : (isDesktop ? 60 : 40),
      backgroundColor: themeColors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: compact ? spacing.md : spacing.lg,
    },
    icon: {
      fontSize: compact ? 32 : (isDesktop ? 56 : 40),
    },
    title: {
      ...typography.h3,
      color: themeColors.text,
      fontWeight: '600',
      marginBottom: spacing.sm,
      textAlign: 'center',
      maxWidth: isDesktop ? 600 : '100%',
    },
    message: {
      ...typography.body,
      color: themeColors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      maxWidth: isDesktop ? 500 : '100%',
      lineHeight: isDesktop ? 28 : 24,
    },
    actionButton: {
      backgroundColor: themeColors.primary,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: 12,
      minWidth: isDesktop ? 200 : 160,
      alignItems: 'center',
      ...(Platform.OS === 'web' && {
        cursor: 'pointer',
        transition: 'all 300ms ease',
      }),
    },
    actionButtonText: {
      ...typography.button,
      color: themeColors.background,
    },
  });

  // Web hover styles
  const webStyles = Platform.OS === 'web' ? {
    actionButton: {
      ...dynamicStyles.actionButton,
      ':hover': {
        backgroundColor: themeColors.primaryDark,
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${themeColors.primary}40`,
      },
    },
  } : {};

  return (
    <View style={dynamicStyles.container}>
      {icon && (
        <View style={dynamicStyles.iconContainer}>
          <Text style={dynamicStyles.icon}>{icon}</Text>
        </View>
      )}
      <Text style={dynamicStyles.title}>{title}</Text>
      <Text style={dynamicStyles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={dynamicStyles.actionButton}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={dynamicStyles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
