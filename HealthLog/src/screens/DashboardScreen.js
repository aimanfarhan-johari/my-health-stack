import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import DotCalendar from '../components/DotCalendar';
import DayDetailModal from '../components/DayDetailModal';
import { getFoodLogDates, getFoodEntriesByDate } from '../db/queries/foodLog';
import { getWorkoutDates, getSessionsByDate } from '../db/queries/workouts';
import { getMetricDates, getMetricsByDate } from '../db/queries/healthMetrics';
import { todayISO } from '../utils/dateUtils';

export default function DashboardScreen() {
  const [activeDates, setActiveDates] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayFood, setDayFood] = useState([]);
  const [daySessions, setDaySessions] = useState([]);
  const [dayMetrics, setDayMetrics] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadActiveDates = async () => {
    const [foodDates, workoutDates, metricDates] = await Promise.all([
      getFoodLogDates(),
      getWorkoutDates(),
      getMetricDates(),
    ]);
    const all = new Set([...foodDates, ...workoutDates, ...metricDates]);
    setActiveDates([...all]);
  };

  useFocusEffect(useCallback(() => { loadActiveDates(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActiveDates();
    setRefreshing(false);
  };

  const handleDayPress = async (date) => {
    setSelectedDate(date);
    const [food, sessions, metrics] = await Promise.all([
      getFoodEntriesByDate(date),
      getSessionsByDate(date),
      getMetricsByDate(date),
    ]);
    setDayFood(food);
    setDaySessions(sessions);
    setDayMetrics(metrics);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <Text style={styles.heading}>Activity</Text>
        <Text style={styles.subheading}>Tap a day to see what was logged</Text>

        <DotCalendar activeDates={activeDates} onDayPress={handleDayPress} />
      </ScrollView>

      <DayDetailModal
        visible={modalVisible}
        date={selectedDate}
        foodEntries={dayFood}
        workoutSessions={daySessions}
        metrics={dayMetrics}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingTop: 60, paddingBottom: spacing.xxl },
  heading: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    paddingHorizontal: spacing.lg,
    marginBottom: 4,
  },
  subheading: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
});
