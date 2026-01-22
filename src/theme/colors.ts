// Modern color palette inspired by contemporary financial apps
export const colors = {
  light: {
    // Primary - Modern blue gradient
    primary: '#6366f1', // Indigo-500
    primaryDark: '#4f46e5', // Indigo-600
    primaryLight: '#818cf8', // Indigo-400
    primaryGradient: ['#6366f1', '#8b5cf6'], // Indigo to Purple
    
    // Secondary - Vibrant accent
    secondary: '#f59e0b', // Amber-500
    secondaryDark: '#d97706', // Amber-600
    secondaryLight: '#fbbf24', // Amber-400
    secondaryGradient: ['#f59e0b', '#f97316'], // Amber to Orange
    
    // Accent - Success green
    accent: '#10b981', // Emerald-500
    accentDark: '#059669', // Emerald-600
    accentLight: '#34d399', // Emerald-400
    accentGradient: ['#10b981', '#14b8a6'], // Emerald to Teal
    
    // Background & Surface
    background: '#ffffff',
    backgroundSecondary: '#f8fafc', // Slate-50
    surface: '#ffffff',
    surfaceElevated: '#ffffff',
    
    // Text
    text: '#0f172a', // Slate-900
    textSecondary: '#64748b', // Slate-500
    textTertiary: '#94a3b8', // Slate-400
    textInverse: '#ffffff',
    
    // Borders & Dividers
    border: '#e2e8f0', // Slate-200
    borderLight: '#f1f5f9', // Slate-100
    divider: '#e2e8f0',
    
    // Status colors
    error: '#ef4444', // Red-500
    errorLight: '#fee2e2', // Red-100
    success: '#10b981', // Emerald-500
    successLight: '#d1fae5', // Emerald-100
    warning: '#f59e0b', // Amber-500
    warningLight: '#fef3c7', // Amber-100
    info: '#3b82f6', // Blue-500
    infoLight: '#dbeafe', // Blue-100
    
    // Special effects
    overlay: 'rgba(15, 23, 42, 0.5)', // Slate-900 with opacity
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowStrong: 'rgba(0, 0, 0, 0.2)',
  },
  dark: {
    // Primary - Modern blue gradient (brighter for dark mode)
    primary: '#818cf8', // Indigo-400
    primaryDark: '#6366f1', // Indigo-500
    primaryLight: '#a5b4fc', // Indigo-300
    primaryGradient: ['#818cf8', '#a78bfa'], // Indigo to Purple
    
    // Secondary - Vibrant accent
    secondary: '#fbbf24', // Amber-400
    secondaryDark: '#f59e0b', // Amber-500
    secondaryLight: '#fcd34d', // Amber-300
    secondaryGradient: ['#fbbf24', '#fb923c'], // Amber to Orange
    
    // Accent - Success green
    accent: '#34d399', // Emerald-400
    accentDark: '#10b981', // Emerald-500
    accentLight: '#6ee7b7', // Emerald-300
    accentGradient: ['#34d399', '#5eead4'], // Emerald to Teal
    
    // Background & Surface - Modern dark theme
    background: '#0f172a', // Slate-900
    backgroundSecondary: '#1e293b', // Slate-800
    surface: '#1e293b', // Slate-800
    surfaceElevated: '#334155', // Slate-700
    
    // Text
    text: '#f8fafc', // Slate-50
    textSecondary: '#cbd5e1', // Slate-300
    textTertiary: '#94a3b8', // Slate-400
    textInverse: '#0f172a',
    
    // Borders & Dividers
    border: '#334155', // Slate-700
    borderLight: '#475569', // Slate-600
    divider: '#334155',
    
    // Status colors
    error: '#f87171', // Red-400
    errorLight: '#7f1d1d', // Red-900 with opacity
    success: '#34d399', // Emerald-400
    successLight: '#064e3b', // Emerald-900 with opacity
    warning: '#fbbf24', // Amber-400
    warningLight: '#78350f', // Amber-900 with opacity
    info: '#60a5fa', // Blue-400
    infoLight: '#1e3a8a', // Blue-900 with opacity
    
    // Special effects
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',
  },
};

export type ColorScheme = 'light' | 'dark';
