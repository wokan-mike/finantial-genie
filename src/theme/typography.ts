import { Platform } from 'react-native';
import { isDesktop, isTablet, isMobile } from '../utils/responsive';

// Responsive typography system
const getResponsiveFontSize = (mobile: number, tablet?: number, desktop?: number): number => {
  if (Platform.OS === 'web') {
    if (isDesktop && desktop) return desktop;
    if (isTablet && tablet) return tablet;
  }
  return mobile;
};

export const typography = {
  h1: {
    fontSize: getResponsiveFontSize(28, 32, 40),
    fontWeight: '700' as const,
    lineHeight: getResponsiveFontSize(36, 40, 48),
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: getResponsiveFontSize(24, 28, 32),
    fontWeight: '600' as const,
    lineHeight: getResponsiveFontSize(32, 36, 40),
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: getResponsiveFontSize(20, 22, 24),
    fontWeight: '600' as const,
    lineHeight: getResponsiveFontSize(28, 30, 32),
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: getResponsiveFontSize(18, 20, 22),
    fontWeight: '600' as const,
    lineHeight: getResponsiveFontSize(24, 26, 28),
  },
  body: {
    fontSize: getResponsiveFontSize(16, 16, 16),
    fontWeight: '400' as const,
    lineHeight: getResponsiveFontSize(24, 24, 24),
  },
  bodySmall: {
    fontSize: getResponsiveFontSize(14, 14, 14),
    fontWeight: '400' as const,
    lineHeight: getResponsiveFontSize(20, 20, 20),
  },
  caption: {
    fontSize: getResponsiveFontSize(12, 12, 12),
    fontWeight: '400' as const,
    lineHeight: getResponsiveFontSize(16, 16, 16),
  },
  button: {
    fontSize: getResponsiveFontSize(16, 16, 16),
    fontWeight: '600' as const,
    lineHeight: getResponsiveFontSize(24, 24, 24),
    letterSpacing: 0.5,
  },
  // New responsive utilities
  display: {
    fontSize: getResponsiveFontSize(36, 48, 56),
    fontWeight: '700' as const,
    lineHeight: getResponsiveFontSize(44, 56, 64),
    letterSpacing: -1,
  },
};

