import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { colors, typography, spacing } from '../constants/theme';
import useStore from '../store/useStore';
import MacroRing from '../components/MacroRing';
import MealSection from '../components/MealSection';
import FoodSearchModal from '../components/FoodSearchModal';
import { getFoodEntriesByDate, addFoodEntry, deleteFoodEntry } from '../db/queries/foodLog';
import { getWaterForDate, addWater } from '../db/queries/waterLog';
import { todayISO, formatDisplay } from '../utils/dateUtils';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

function generateUUID() {
  return Crypto.randomUUID();
}

export default function FoodLogScreen() {
  const { settings, selectedDate, setSelectedDate } = useStore();
  const [entries, setEntries] = useState([]);
  const [searchMeal, setSearchMeal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [waterMl, setWaterMl] = useState(0);

  const loadData = async () => {
    try {
      const [data, water] = await Promise.all([
        getFoodEntriesByDate(selectedDate),
        getWaterForDate(selectedDate),
      ]);
      setEntries(data);
      setWaterMl(water);
    } catch (err) {
      Alert.alert('Error', 'Failed to load food log data.');
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [selectedDate]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddEntry = async (meal, entryData) => {
    try {
      const id = generateUUID();
      const entry = { id, date: selectedDate, meal, ...entryData };
      await addFoodEntry(entry);
      await loadData();
    } catch {
      Alert.alert('Error', 'Failed to save food entry.');
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await deleteFoodEntry(id);
      await loadData();
    } catch {
      Alert.alert('Error', 'Failed to delete food entry.');
    }
  };

  const handleAddWater = async () => {
    await addWater(selectedDate, 250);
    const updated = await getWaterForDate(selectedDate);
    setWaterMl(updated);
  };

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const today = todayISO();
  const isToday = selectedDate === today;

  const goToPrevDay = () => {
    const [y, mo, dy] = selectedDate.split('-').map(Number);
    const d = new Date(y, mo - 1, dy - 1);
    const py = d.getFullYear();
    const pm = String(d.getMonth() + 1).padStart(2, '0');
    const pd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${py}-${pm}-${pd}`);
  };

  const goToNextDay = () => {
    const [y, mo, dy] = selectedDate.split('-').map(Number);
    const d = new Date(y, mo - 1, dy + 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    const nd = String(d.getDate()).padStart(2, '0');
    const next = `${ny}-${nm}-${nd}`;
    if (next <= today) setSelectedDate(next);
  };

  const waterGoalMl = (settings.waterGoal || 3.0) * 1000;
  const waterL = (waterMl / 1000).toFixed(1);
  const waterGoalL = (settings.waterGoal || 3.0).toFixed(1);
  const waterPct = Math.min(1, waterMl / waterGoalMl);

  return (
    <View style={styles.container}>
      {/* Date navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goToPrevDay} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedDate(today)}>
          <Text style={styles.dateLabel}>{isToday ? 'Today' : formatDisplay(selectedDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextDay} style={styles.navBtn} disabled={isToday}>
          <Text style={[styles.navArrow, isToday && styles.navDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        <MacroRing
          calories={totals.calories}
          calorieGoal={settings.dailyCalorieGoal}
          protein={totals.protein}
          proteinGoal={settings.proteinGoal}
          carbs={totals.carbs}
          carbsGoal={settings.carbsGoal}
          fat={totals.fat}
          fatGoal={settings.fatGoal}
        />

        {entries.length === 0 && (
          <Text style={styles.emptyHint}>No meals logged yet. Tap + to add food.</Text>
        )}

        {MEALS.map(meal => (
          <MealSection
            key={meal}
            meal={meal}
            entries={entries.filter(e => e.meal === meal)}
            onAdd={(m) => setSearchMeal(m)}
            onDeleteEntry={handleDeleteEntry}
          />
        ))}

        {/* Water Tracker */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>💧 Water</Text>
            <Text style={styles.waterAmount}>{waterL} / {waterGoalL} L</Text>
          </View>
          <View style={styles.waterTrack}>
            <View style={[styles.waterFill, { width: `${waterPct * 100}%` }]} />
          </View>
          <TouchableOpacity style={styles.waterBtn} onPress={handleAddWater}>
            <Text style={styles.waterBtnText}>+ 250 ml</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FoodSearchModal
        visible={!!searchMeal}
        meal={searchMeal}
        onClose={() => setSearchMeal(null)}
        onAddEntry={handleAddEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { color: colors.textPrimary, fontSize: 26, fontWeight: '300' },
  navDisabled: { opacity: 0.3 },
  dateLabel: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  waterCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  waterTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
  waterAmount: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  waterTrack: {
    height: 8, backgroundColor: colors.border, borderRadius: 4,
    overflow: 'hidden', marginBottom: spacing.md,
  },
  waterFill: { height: '100%', backgroundColor: colors.water, borderRadius: 4 },
  waterBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.waterTint,
    borderWidth: 1,
    borderColor: colors.water,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  waterBtnText: { color: colors.water, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
});
