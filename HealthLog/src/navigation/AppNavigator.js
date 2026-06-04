import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, typography } from '../constants/theme';
import DashboardScreen from '../screens/DashboardScreen';
import FoodLogScreen from '../screens/FoodLogScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import HealthMetricsScreen from '../screens/HealthMetricsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: '📅',
  Nutrition: '🥗',
  Workout: '💪',
  Health: '❤️',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111111',
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 80,
            paddingBottom: 16,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarLabelStyle: { fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightSemiBold },
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>
              {TAB_ICONS[route.name]}
            </Text>
          ),
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Nutrition" component={FoodLogScreen} />
        <Tab.Screen name="Workout" component={WorkoutScreen} />
        <Tab.Screen name="Health" component={HealthMetricsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
