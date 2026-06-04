import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';
import { formatDisplay } from '../utils/dateUtils';
import { sumMacros } from '../utils/macroUtils';

export default function DayDetailModal({ visible, date, foodEntries = [], workoutSessions = [], metrics = [], onClose }) {
  const macros = sumMacros(foodEntries);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.dateTitle}>{date ? formatDisplay(date) : ''}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Nutrition summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nutrition</Text>
              {foodEntries.length === 0 ? (
                <Text style={styles.empty}>No food logged</Text>
              ) : (
                <View style={styles.macroRow}>
                  <MacroChip label="Calories" value={Math.round(macros.calories)} unit="kcal" />
                  <MacroChip label="Protein" value={Math.round(macros.protein)} unit="g" />
                  <MacroChip label="Carbs" value={Math.round(macros.carbs)} unit="g" />
                  <MacroChip label="Fat" value={Math.round(macros.fat)} unit="g" />
                </View>
              )}
            </View>

            {/* Workouts */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Workouts</Text>
              {workoutSessions.length === 0 ? (
                <Text style={styles.empty}>No workouts logged</Text>
              ) : (
                workoutSessions.map(s => (
                  <View key={s.id} style={styles.workoutRow}>
                    <Text style={styles.workoutName}>{s.name}</Text>
                    <View style={[styles.badge, s.complete && styles.badgeComplete]}>
                      <Text style={styles.badgeText}>{s.complete ? 'Done' : 'Planned'}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Health Metrics</Text>
              {metrics.length === 0 ? (
                <Text style={styles.empty}>No metrics logged</Text>
              ) : (
                metrics.map(m => (
                  <View key={m.id} style={styles.metricRow}>
                    <Text style={styles.metricName}>{m.metric.replace(/_/g, ' ')}</Text>
                    <Text style={styles.metricValue}>{m.value} {m.unit}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function MacroChip({ label, value, unit }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipUnit}>{unit}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: spacing.md,
  },
  dateTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.8 },
  empty: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  chip: { flex: 1, backgroundColor: colors.background, borderRadius: 8, padding: spacing.sm, alignItems: 'center' },
  chipValue: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
  chipUnit: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  chipLabel: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  workoutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  workoutName: { color: colors.textPrimary, fontSize: typography.fontSizeMD },
  badge: { backgroundColor: colors.border, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 10 },
  badgeComplete: { backgroundColor: colors.accent },
  badgeText: { color: colors.background, fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightSemiBold },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  metricName: { color: colors.textPrimary, fontSize: typography.fontSizeSM, textTransform: 'capitalize' },
  metricValue: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  closeBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  closeBtnText: { color: colors.background, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
});
