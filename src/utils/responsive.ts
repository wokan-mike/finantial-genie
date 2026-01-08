import { Platform, Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Breakpoints (mobile-first approach)
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

// Check if running on web
export const isWeb = Platform.OS === 'web';

// Check if running on mobile
export const isMobile = Platform.OS !== 'web' || SCREEN_WIDTH < BREAKPOINTS.tablet;

// Check if running on tablet
export const isTablet = isWeb && SCREEN_WIDTH >= BREAKPOINTS.tablet && SCREEN_WIDTH < BREAKPOINTS.desktop;

// Check if running on desktop
export const isDesktop = isWeb && SCREEN_WIDTH >= BREAKPOINTS.desktop;

// Responsive width calculation
export const wp = (percentage: number): number => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Responsive height calculation
export const hp = (percentage: number): number => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Responsive font size (mobile-first)
export const getResponsiveFontSize = (mobile: number, tablet?: number, desktop?: number): number => {
  if (isDesktop && desktop) return desktop;
  if (isTablet && tablet) return tablet;
  return mobile;
};

// Responsive spacing
export const getResponsiveSpacing = (mobile: number, tablet?: number, desktop?: number): number => {
  if (isDesktop && desktop) return desktop;
  if (isTablet && tablet) return tablet;
  return mobile;
};

// Get container max width
export const getContainerMaxWidth = (): number => {
  if (isDesktop) return BREAKPOINTS.wide;
  if (isTablet) return BREAKPOINTS.desktop;
  return SCREEN_WIDTH;
};

// Get grid columns based on screen size
export const getGridColumns = (): number => {
  if (isDesktop) return 3;
  if (isTablet) return 2;
  return 1;
};

// Get card padding based on screen size
export const getCardPadding = (): number => {
  if (isDesktop) return 32;
  if (isTablet) return 24;
  return 16;
};

// Check if device supports haptic feedback
export const supportsHaptic = Platform.OS === 'ios';

// Get transition duration
export const TRANSITION_DURATION = 300;

// Get shadow styles based on platform
export const getShadowStyle = (elevation: number = 4) => {
  if (Platform.OS === 'ios') {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.15,
      shadowRadius: elevation * 1.5,
    };
  }
  return {
    elevation: elevation,
    shadowColor: '#000',
  };
};

// Get hover styles for web
export const getHoverStyle = (baseStyle: any, hoverStyle: any) => {
  if (isWeb) {
    return {
      ...baseStyle,
      transition: `all ${TRANSITION_DURATION}ms ease`,
      ':hover': hoverStyle,
    };
  }
  return baseStyle;
};
