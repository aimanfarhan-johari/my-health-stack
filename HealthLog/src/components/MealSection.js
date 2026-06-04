import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { colors, typography, spacing } from '../constants/theme';
import { sumMacros } from '../utils/macroUtils';

const MEAL_ICONS = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙', Snacks: '🍎' };

const MACRO_COLORS = {
  protein: '#2196F3',
  carbs: '#FF9800',
  fat: '#F44336',
};

export default function MealSection({ meal, entries = [], onAdd, onDeleteEntry }) {
  const totals = sumMacros(entries);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mealTitle}>{MEAL_ICONS[meal] || '🍽'} {meal}</Text>
        <Text style={styles.mealCal}>{Math.round(totals.calories)} kcal</Text>
      </View>

      {entries.map(entry => (
        <EntryRow key={entry.id} entry={entry} onDelete={() => onDeleteEntry?.(entry.id)} />
      ))}

      <TouchableOpacity style={styles.addBtn} onPress={() => onAdd?.(meal)}>
        <Text style={styles.addBtnText}>+ Add Food</Text>
      </TouchableOpacity>
    </View>
  );
}

function EntryRow({ entry, onDelete }) {
  const swipeRef = useRef(null);

  const renderRightActions = (progress, dragX) => {
    const opacity = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    return (
      <Animated.View style={[styles.deleteAction, { opacity }]}>
        <TouchableOpacity
          style={styles.deleteActionInner}
          onPress={() => { swipeRef.current?.close(); onDelete(); }}
        >
          <Text style={styles.deleteActionText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} rightThreshold={40}>
      <View style={styles.entryRow}>
        <View style={styles.entryInfo}>
          <Text style={styles.entryName} numberOfLines={1}>{entry.food_name}</Text>
          {entry.serving_size ? <Text style={styles.serving}>{entry.serving_size}</Text> : null}
        </View>
        <View style={styles.entryRight}>
          <Text style={styles.entryCal}>{Math.round(entry.calories)} kcal</Text>
          <View style={styles.chipRow}>
            <MacroChip label="P" value={entry.protein} color={MACRO_COLORS.protein} />
            <MacroChip label="C" value={entry.carbs} color={MACRO_COLORS.carbs} />
            <MacroChip label="F" value={entry.fat} color={MACRO_COLORS.fat} />
          </View>
        </View>
      </View>
    </Swipeable>
  );
}

function MacroChip({ label, value, color }) {
  return (
    <View style={[styles.chip, { borderColor: color }]}>
      <Text style={[styles.chipText, { color }]}>{label} {Math.round(value || 0)}g</Text>
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
    backgroundColor: colors.surface,
  },
  entryInfo: { flex: 1, marginRight: spacing.sm },
  entryName: { color: colors.textPrimary, fontSize: typography.fontSizeSM },
  serving: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  entryRight: { alignItems: 'flex-end' },
  entryCal: { color: colors.textPrimary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  chipRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  chip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  chipText: { fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightMedium },
  deleteAction: {
    width: 80,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deleteActionInner: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  deleteActionText: { color: '#FFFFFF', fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold },
  addBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  addBtnText: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
});
