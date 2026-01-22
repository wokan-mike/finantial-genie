import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useTheme, getThemeColors } from '../../context/ThemeContext';
import { spacing } from '../../theme/spacing';
import { isDesktop, getShadowStyle, TRANSITION_DURATION } from '../../utils/responsive';

// Intentar importar LinearGradient, si no está disponible usar fallback
let LinearGradient: any = null;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch (e) {
  // LinearGradient no está instalado, usaremos fallback
}

interface GradientCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  marginBottom?: number;
  elevated?: boolean;
  interactive?: boolean;
  gradient?: 'primary' | 'secondary' | 'accent' | 'subtle';
}

export default function GradientCard({
  children,
  onPress,
  padding,
  marginBottom = spacing.md,
  elevated = true,
  interactive = false,
  gradient = 'subtle',
}: GradientCardProps) {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);
  const isDark = theme === 'dark';
  const viewRef = useRef<any>(null);

  // Definir gradientes según el tema - más visibles y contrastados
  const gradients = {
    primary: isDark
      ? ['rgba(99, 102, 241, 0.4)', 'rgba(139, 92, 246, 0.3)', 'rgba(99, 102, 241, 0.2)'] // Indigo to Purple
      : ['rgba(99, 102, 241, 0.15)', 'rgba(139, 92, 246, 0.1)', 'rgba(99, 102, 241, 0.08)'],
    secondary: isDark
      ? ['rgba(245, 158, 11, 0.4)', 'rgba(249, 115, 22, 0.3)', 'rgba(245, 158, 11, 0.2)'] // Amber to Orange
      : ['rgba(245, 158, 11, 0.15)', 'rgba(249, 115, 22, 0.1)', 'rgba(245, 158, 11, 0.08)'],
    accent: isDark
      ? ['rgba(16, 185, 129, 0.4)', 'rgba(20, 184, 166, 0.3)', 'rgba(16, 185, 129, 0.2)'] // Emerald to Teal
      : ['rgba(16, 185, 129, 0.15)', 'rgba(20, 184, 166, 0.1)', 'rgba(16, 185, 129, 0.08)'],
    subtle: isDark
      ? ['rgba(30, 41, 59, 1)', 'rgba(20, 30, 50, 0.95)', 'rgba(15, 23, 42, 0.9)'] // Slate-800 to Slate-900
      : ['rgba(255, 255, 255, 1)', 'rgba(245, 247, 250, 0.98)', 'rgba(248, 250, 252, 0.95)'], // White to Slate-50
  };

  const selectedGradient = gradients[gradient];
  const [color1, color2, color3] = selectedGradient;

  // Crear el gradiente como string para web
  const gradientString = `linear-gradient(135deg, ${color1} 0%, ${color2} 50%, ${color3 || color2} 100%)`;

  // Aplicar gradiente directamente al DOM en web
  useEffect(() => {
    if (Platform.OS === 'web' && viewRef.current) {
      const element = viewRef.current as any;
      // Obtener el nodo DOM real
      let domNode: any = null;
      if (element._nativeNode) {
        domNode = element._nativeNode;
      } else if (element.getNode && element.getNode()) {
        domNode = element.getNode();
      } else if (element.style) {
        domNode = element;
      }
      
      if (domNode && domNode.style) {
        domNode.style.backgroundImage = gradientString;
      }
    }
  }, [gradientString]);

  const baseCardStyle: any = {
    borderRadius: isDesktop ? 20 : 16,
    padding: padding || (isDesktop ? spacing.xl : spacing.lg),
    marginBottom,
    borderWidth: 1,
    borderColor: Platform.OS === 'web' 
      ? 'rgba(255,255,255,0.1)'
      : themeColors.border,
    overflow: 'hidden',
    ...(elevated && getShadowStyle(6)),
  };

  // Para móvil sin LinearGradient, usar color sólido
  if (Platform.OS !== 'web' && !LinearGradient) {
    baseCardStyle.backgroundColor = isDark 
      ? 'rgba(30, 41, 59, 0.95)'
      : 'rgba(255, 255, 255, 0.98)';
  }

  // Para web, agregar propiedades CSS directamente
  if (Platform.OS === 'web') {
    baseCardStyle.position = 'relative';
    baseCardStyle.backdropFilter = 'blur(20px)';
    baseCardStyle.WebkitBackdropFilter = 'blur(20px)';
    if (elevated) {
      baseCardStyle.boxShadow = '0 8px 32px rgba(0,0,0,0.15)';
    }
    if (onPress) {
      baseCardStyle.cursor = 'pointer';
    }
    baseCardStyle.transition = `all ${TRANSITION_DURATION}ms ease`;
  }

  const dynamicStyles = StyleSheet.create({
    card: baseCardStyle,
    content: {
      position: 'relative',
      zIndex: 1,
    },
  });

  // Web hover handlers
  const webHandlers = Platform.OS === 'web' && interactive && onPress ? {
    onMouseEnter: (e: any) => {
      if (e.currentTarget) {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 12px 40px ${themeColors.primary}20`;
      }
    },
    onMouseLeave: (e: any) => {
      if (e.currentTarget) {
        e.currentTarget.style.transform = 'translateY(0px) scale(1)';
        e.currentTarget.style.boxShadow = elevated ? '0 8px 32px rgba(0,0,0,0.15)' : '';
      }
    },
  } : {};

  // Si LinearGradient está disponible y no es web, usarlo
  const cardContent = LinearGradient && Platform.OS !== 'web' ? (
    <LinearGradient
      colors={selectedGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.5, 1]}
      style={dynamicStyles.card}
    >
      <View style={dynamicStyles.content}>
        {children}
      </View>
    </LinearGradient>
  ) : (
    <View 
      ref={viewRef}
      style={dynamicStyles.card}
    >
      <View style={dynamicStyles.content}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.95}
        {...webHandlers}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
}
