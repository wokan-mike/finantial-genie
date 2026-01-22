import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { isDesktop, getShadowStyle } from '../../utils/responsive';
import { SPRING_CONFIG } from '../../utils/animations';

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  marginBottom?: number;
  elevated?: boolean;
  interactive?: boolean;
  delay?: number;
  index?: number; // For stagger animations
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedView = Animated.createAnimatedComponent(View);

export default function AnimatedCard({
  children,
  onPress,
  padding,
  marginBottom = spacing.md,
  elevated = true,
  interactive = false,
  delay = 0,
  index = 0,
}: AnimatedCardProps) {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  
  // Animation values
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);
  const pressed = useSharedValue(0);

  useEffect(() => {
    // Stagger animation based on index
    const startDelay = delay + (index * 50);
    
    opacity.value = withTiming(1, { duration: 400 });
    translateY.value = withSpring(0, SPRING_CONFIG.gentle);
    scale.value = withSpring(1, SPRING_CONFIG.gentle);
  }, []);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(
      pressed.value,
      [0, 1],
      [0.1, 0.2],
      Extrapolate.CLAMP
    );

    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value * (1 - pressed.value * 0.02) },
      ],
      shadowOpacity,
    };
  });

  // Press handlers
  const handlePressIn = () => {
    pressed.value = withSpring(1, SPRING_CONFIG.snappy);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, SPRING_CONFIG.snappy);
  };

  const baseCardStyle: any = {
    backgroundColor: Platform.OS === 'web' 
      ? (theme === 'dark' ? themeColors.surface : themeColors.surface)
      : themeColors.surface,
    borderRadius: isDesktop ? 20 : 16,
    padding: padding || (isDesktop ? spacing.xl : spacing.lg),
    marginBottom,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden',
  };

  // Add shadow/elevation
  if (elevated) {
    if (Platform.OS === 'web') {
      baseCardStyle.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
    } else {
      Object.assign(baseCardStyle, getShadowStyle(8));
    }
  }

  // Web-specific styles
  if (Platform.OS === 'web') {
    baseCardStyle.backdropFilter = 'blur(10px)';
    baseCardStyle.WebkitBackdropFilter = 'blur(10px)';
    if (onPress) {
      baseCardStyle.cursor = 'pointer';
    }
  }

  const cardStyle = [baseCardStyle, animatedStyle];

  if (onPress) {
    return (
      <AnimatedTouchable
        style={cardStyle}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {children}
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedView style={cardStyle}>
      {children}
    </AnimatedView>
  );
}
