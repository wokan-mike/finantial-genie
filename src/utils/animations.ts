import { withTiming, withSpring, Easing, SharedValue } from 'react-native-reanimated';

/**
 * Animation presets for consistent animations across the app
 */

// Timing configurations
export const ANIMATION_CONFIG = {
  fast: { duration: 200, easing: Easing.out(Easing.cubic) },
  normal: { duration: 300, easing: Easing.out(Easing.cubic) },
  slow: { duration: 500, easing: Easing.out(Easing.cubic) },
};

// Spring configurations
export const SPRING_CONFIG = {
  gentle: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
  snappy: {
    damping: 20,
    stiffness: 300,
    mass: 0.5,
  },
};

/**
 * Fade in animation
 */
export const fadeIn = (value: SharedValue<number>, duration = 300) => {
  'worklet';
  return withTiming(1, { duration, easing: Easing.out(Easing.cubic) });
};

/**
 * Fade out animation
 */
export const fadeOut = (value: SharedValue<number>, duration = 200) => {
  'worklet';
  return withTiming(0, { duration, easing: Easing.in(Easing.cubic) });
};

/**
 * Slide in from bottom
 */
export const slideInBottom = (value: SharedValue<number>, distance = 50) => {
  'worklet';
  return withSpring(0, SPRING_CONFIG.gentle);
};

/**
 * Slide out to bottom
 */
export const slideOutBottom = (value: SharedValue<number>, distance = 50) => {
  'worklet';
  return withSpring(distance, SPRING_CONFIG.gentle);
};

/**
 * Scale in animation
 */
export const scaleIn = (value: SharedValue<number>, from = 0.8) => {
  'worklet';
  return withSpring(1, SPRING_CONFIG.gentle);
};

/**
 * Scale out animation
 */
export const scaleOut = (value: SharedValue<number>, to = 0.8) => {
  'worklet';
  return withTiming(to, ANIMATION_CONFIG.fast);
};

/**
 * Slide in from right
 */
export const slideInRight = (value: SharedValue<number>, distance = 100) => {
  'worklet';
  return withSpring(0, SPRING_CONFIG.gentle);
};

/**
 * Slide in from left
 */
export const slideInLeft = (value: SharedValue<number>, distance = 100) => {
  'worklet';
  return withSpring(0, SPRING_CONFIG.gentle);
};

/**
 * Bounce animation
 */
export const bounce = (value: SharedValue<number>) => {
  'worklet';
  return withSpring(1, SPRING_CONFIG.bouncy);
};

/**
 * Pulse animation (for loading states)
 */
export const pulse = (value: SharedValue<number>) => {
  'worklet';
  return withTiming(0.5, { duration: 1000, easing: Easing.inOut(Easing.ease) });
};

/**
 * Shake animation (for errors)
 */
export const shake = (value: SharedValue<number>) => {
  'worklet';
  return withSpring(0, SPRING_CONFIG.snappy);
};
