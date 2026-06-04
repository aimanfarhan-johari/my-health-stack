import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { colors, typography, spacing } from '../constants/theme';
import useStore from '../store/useStore';
import MacroRing from '../components/MacroRing';
import MealSection from '../components/MealSection';
import FoodSearchModal from '../components/FoodSearchModal';
import { getFoodEntriesByDate, addFoodEntry, deleteFoodEntry } from '../db/queries/foodLog';
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

  const loadEntries = async () => {
    const data = await getFoodEntriesByDate(selectedDate);
    setEntries(data);
  };

  useFocusEffect(useCallback(() => { loadEntries(); }, [selectedDate]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEntries();
    setRefreshing(false);
  };

  const handleAddEntry = async (meal, entryData) => {
    const id = generateUUID();
    const entry = { id, date: selectedDate, meal, ...entryData };
    await addFoodEntry(entry);
    await loadEntries();
  };

  const handleDeleteEntry = async (id) => {
    await deleteFoodEntry(id);
    await loadEntries();
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
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    if (next <= today) setSelectedDate(next);
  };

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

        {MEALS.map(meal => (
          <MealSection
            key={meal}
            meal={meal}
            entries={entries.filter(e => e.meal === meal)}
            onAdd={(m) => setSearchMeal(m)}
            onDeleteEntry={handleDeleteEntry}
          />
        ))}
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
});
