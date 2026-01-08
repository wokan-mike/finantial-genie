import { Platform } from 'react-native';
import { isDesktop, isTablet } from '../utils/responsive';

// Responsive spacing system
const getResponsiveSpacing = (mobile: number, tablet?: number, desktop?: number): number => {
  if (Platform.OS === 'web') {
    if (isDesktop && desktop) return desktop;
    if (isTablet && tablet) return tablet;
  }
  return mobile;
};

export const spacing = {
  xs: getResponsiveSpacing(4, 6, 8),
  sm: getResponsiveSpacing(8, 10, 12),
  md: getResponsiveSpacing(16, 20, 24),
  lg: getResponsiveSpacing(24, 28, 32),
  xl: getResponsiveSpacing(32, 40, 48),
  xxl: getResponsiveSpacing(48, 56, 64),
};

