import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';
import { sumMacros } from '../utils/macroUtils';

const MEAL_ICONS = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍎' };

export default function MealSection({ meal, entries = [], onAdd, onDeleteEntry }) {
  const totals = sumMacros(entries);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mealTitle}>{MEAL_ICONS[meal] || '🍽'} {meal}</Text>
        <Text style={styles.mealCal}>{Math.round(totals.calories)} kcal</Text>
      </View>

      {entries.map(entry => (
        <View key={entry.id} style={styles.entryRow}>
          <View style={styles.entryInfo}>
            <Text style={styles.entryName} numberOfLines={1}>{entry.food_name}</Text>
            {entry.serving_size ? <Text style={styles.serving}>{entry.serving_size}</Text> : null}
          </View>
          <View style={styles.entryRight}>
            <Text style={styles.entryCal}>{Math.round(entry.calories)} kcal</Text>
            <Text style={styles.entryMacros}>
              P:{Math.round(entry.protein)}g · C:{Math.round(entry.carbs)}g · F:{Math.round(entry.fat)}g
            </Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => onDeleteEntry?.(entry.id)}>
            <Text style={styles.deleteIcon}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={() => onAdd?.(meal)}>
        <Text style={styles.addBtnText}>+ Add food</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  mealTitle: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
  mealCal: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  entryInfo: { flex: 1 },
  entryName: { color: colors.textPrimary, fontSize: typography.fontSizeSM },
  serving: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  entryRight: { marginRight: spacing.md },
  entryCal: { color: colors.textPrimary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, textAlign: 'right' },
  entryMacros: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  deleteBtn: { padding: spacing.xs },
  deleteIcon: { color: colors.textSecondary, fontSize: 20, lineHeight: 20 },
  addBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  addBtnText: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
});
