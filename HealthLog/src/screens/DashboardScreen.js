import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import DotCalendar from '../components/DotCalendar';
import DayDetailModal from '../components/DayDetailModal';
import { getFoodEntriesByDate, getFoodSummaryForMonth } from '../db/queries/foodLog';
import { getSessionsByDate, getWorkoutSummaryForMonth } from '../db/queries/workouts';
import useStore from '../store/useStore';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { currentMonth, settings } = useStore();
  const { year, month } = currentMonth;
  const calorieGoal = settings.dailyCalorieGoal || 2000;

  const [greenDates, setGreenDates] = useState(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayFood, setDayFood] = useState([]);
  const [daySessions, setDaySessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

  const loadMonthData = useCallback(async () => {
    const [foodSummary, workoutSummary] = await Promise.all([
      getFoodSummaryForMonth(yearMonth),
      getWorkoutSummaryForMonth(yearMonth),
    ]);

    const foodMap = {};
    foodSummary.forEach(r => { foodMap[r.date] = r.totalCalories || 0; });

    const workoutMap = {};
    workoutSummary.forEach(r => { workoutMap[r.date] = r; });

    const threshold = calorieGoal * 0.8;
    const green = new Set();

    Object.keys(foodMap).forEach(date => {
      if (foodMap[date] >= threshold) {
        const workout = workoutMap[date];
        if (!workout || workout.allComplete === 1) {
          green.add(date);
        }
      }
    });

    setGreenDates(green);
  }, [yearMonth, calorieGoal]);

  useFocusEffect(useCallback(() => { loadMonthData(); }, [loadMonthData]));

  useEffect(() => { loadMonthData(); }, [yearMonth]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMonthData();
    setRefreshing(false);
  };

  const handleDayPress = async (date) => {
    setSelectedDate(date);
    const [food, sessions] = await Promise.all([
      getFoodEntriesByDate(date),
      getSessionsByDate(date),
    ]);
    setDayFood(food);
    setDaySessions(sessions);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Activity</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.gearBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={styles.gearIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        <Text style={styles.subheading}>Tap a day to see what was logged</Text>
        <DotCalendar greenDates={greenDates} onDayPress={handleDayPress} />
      </ScrollView>

      <DayDetailModal
        visible={modalVisible}
        date={selectedDate}
        foodEntries={dayFood}
        workoutSessions={daySessions}
        calorieGoal={calorieGoal}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.sm,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
  },
  gearBtn: { padding: 4 },
  gearIcon: { fontSize: 22 },
  scrollContent: { paddingBottom: spacing.xxl },
  subheading: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
});
