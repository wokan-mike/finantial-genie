import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format, addMonths, subMonths } from 'date-fns';
import { useTheme, getThemeColors } from '../context/ThemeContext';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface MonthSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function MonthSelector({ selectedDate, onDateChange }: MonthSelectorProps) {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  const handlePreviousMonth = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  }

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <TouchableOpacity onPress={handlePreviousMonth} style={[styles.button, { backgroundColor: themeColors.primary }]}>
        <Text style={[styles.buttonText, { color: themeColors.background }]}>‹</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleToday} style={styles.monthContainer}>
        <Text style={[styles.monthText, { color: themeColors.primary }]}>{format(selectedDate, 'MMMM yyyy')}</Text>
        <Text style={[styles.todayText, { color: themeColors.textSecondary }]}>Hoy</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleNextMonth} style={[styles.button, { backgroundColor: themeColors.primary }]}>
        <Text style={[styles.buttonText, { color: themeColors.background }]}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  monthContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  monthText: {
    ...typography.h4,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  todayText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
});

