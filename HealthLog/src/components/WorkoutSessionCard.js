import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

export default function WorkoutSessionCard({ session, exerciseCount, completedSets, totalSets, onPress, onToggleComplete, onDelete }) {
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{session.name}</Text>
          <Text style={styles.meta}>{session.type} · {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => onToggleComplete?.()} style={styles.iconBtn}>
            <Text style={[styles.checkIcon, session.complete && styles.checkDone]}>
              {session.complete ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete?.()} style={styles.iconBtn}>
            <Text style={styles.deleteIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {totalSets > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{completedSets}/{totalSets} sets</Text>
        </View>
      )}

      {session.notes ? <Text style={styles.notes} numberOfLines={2}>{session.notes}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  name: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
  meta: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 4 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { padding: spacing.xs },
  checkIcon: { color: colors.textSecondary, fontSize: 20 },
  checkDone: { color: colors.accent },
  deleteIcon: { color: colors.textSecondary, fontSize: 20 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm },
  progressBar: { flex: 1, height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  progressLabel: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  notes: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: spacing.sm },
});
