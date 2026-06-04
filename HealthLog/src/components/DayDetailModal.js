import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';
import { formatDisplay } from '../utils/dateUtils';
import { sumMacros } from '../utils/macroUtils';

export default function DayDetailModal({
  visible,
  date,
  foodEntries = [],
  workoutSessions = [],
  calorieGoal = 2000,
  onClose,
}) {
  const macros = sumMacros(foodEntries);
  const caloriesLogged = Math.round(macros.calories);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Text style={styles.dateTitle}>{date ? formatDisplay(date) : ''}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Food summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Food</Text>
              {foodEntries.length === 0 ? (
                <Text style={styles.empty}>No food logged</Text>
              ) : (
                <>
                  <View style={styles.calorieRow}>
                    <Text style={styles.calorieValue}>{caloriesLogged}</Text>
                    <Text style={styles.calorieGoal}> / {calorieGoal} kcal</Text>
                  </View>
                  <View style={styles.macroRow}>
                    <MacroChip label="Protein" value={Math.round(macros.protein)} unit="g" />
                    <MacroChip label="Carbs" value={Math.round(macros.carbs)} unit="g" />
                    <MacroChip label="Fat" value={Math.round(macros.fat)} unit="g" />
                  </View>
                </>
              )}
            </View>

            {/* Workout summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workout</Text>
              {workoutSessions.length === 0 ? (
                <Text style={styles.empty}>No workout scheduled</Text>
              ) : (
                workoutSessions.map(s => (
                  <View key={s.id} style={styles.workoutRow}>
                    <Text style={styles.workoutName}>{s.name}</Text>
                    <View style={[styles.badge, s.complete && styles.badgeComplete]}>
                      <Text style={styles.badgeText}>{s.complete ? 'Complete' : 'Planned'}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MacroChip({ label, value, unit }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}<Text style={styles.chipUnit}>{unit}</Text></Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlayDark },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  dateTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: typography.fontWeightBold,
    lineHeight: 16,
  },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.accent,
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  empty: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  calorieValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
  },
  calorieGoal: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightRegular,
  },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  chipValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightBold,
  },
  chipUnit: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightRegular,
  },
  chipLabel: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  workoutName: { color: colors.textPrimary, fontSize: typography.fontSizeMD, flex: 1 },
  badge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeComplete: { backgroundColor: colors.accent },
  badgeText: {
    color: colors.background,
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold,
  },
});
