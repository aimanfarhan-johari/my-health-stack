import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { colors, typography } from '../constants/theme';
import DashboardScreen from '../screens/DashboardScreen';
import FoodLogScreen from '../screens/FoodLogScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import HealthMetricsScreen from '../screens/HealthMetricsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TABS = [
  { name: 'Dashboard', label: 'Calendar', icon: '📅', component: DashboardScreen },
  { name: 'Food Log', label: 'Food Log', icon: '🍴', component: FoodLogScreen },
  { name: 'Workout', label: 'Workout', icon: '🏋️', component: WorkoutScreen },
  { name: 'Health', label: 'Health', icon: '♥', component: HealthMetricsScreen },
];

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => {
          const tab = TABS.find(t => t.name === route.name);
          return (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.55 }}>
              {tab?.icon}
            </Text>
          );
        },
      })}
    >
      {TABS.map(tab => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{ tabBarLabel: tab.label }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0D0D0D',
    borderTopColor: '#2A2A2A',
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold,
  },
});
