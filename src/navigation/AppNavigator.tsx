import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useTheme, getThemeColors } from '../context/ThemeContext';

// Screens
import Dashboard from '../screens/Dashboard';
import Transactions from '../screens/Transactions';
import Installments from '../screens/Installments';
import ExpenseAnalysis from '../screens/ExpenseAnalysis';
import Assets from '../screens/Assets';
import Investments from '../screens/Investments';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const { theme } = useTheme();
  const themeColors = getThemeColors(theme);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.primary,
        tabBarInactiveTintColor: themeColors.textSecondary,
        tabBarStyle: {
          backgroundColor: themeColors.background,
          borderTopColor: themeColors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={Transactions}
        options={{
          tabBarLabel: 'Transacciones',
        }}
      />
      <Tab.Screen 
        name="Installments" 
        component={Installments}
        options={{
          tabBarLabel: 'A Meses',
        }}
      />
      <Tab.Screen 
        name="Analysis" 
        component={ExpenseAnalysis}
        options={{
          tabBarLabel: 'Análisis',
        }}
      />
      <Tab.Screen 
        name="Assets" 
        component={Assets}
        options={{
          tabBarLabel: 'Patrimonio',
        }}
      />
      <Tab.Screen 
        name="Investments" 
        component={Investments}
        options={{
          tabBarLabel: 'Inversiones',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

