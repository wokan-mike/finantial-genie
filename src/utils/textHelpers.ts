/**
 * Convert string to Title Case
 * Example: "RESUMEN DEL MES" -> "Resumen Del Mes"
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

/**
 * Format currency with better typography
 */
export const formatCurrencyTypography = (amount: number, isLarge: boolean = false): {
  fontSize: number;
  fontWeight: string;
  letterSpacing: number;
} => {
  return {
    fontSize: isLarge ? 36 : 28,
    fontWeight: '700',
    letterSpacing: -0.02,
  };
};
