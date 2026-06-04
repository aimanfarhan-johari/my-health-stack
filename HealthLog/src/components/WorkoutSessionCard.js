import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

const TYPE_COLORS = {
  Strength: colors.sessionStrength,
  Cardio: colors.sessionCardio,
  Mixed: colors.sessionMixed,
  Flexibility: colors.sessionFlexibility,
  Sports: colors.sessionSports,
  Other: colors.sessionOther,
};

export default function WorkoutSessionCard({
  session,
  exerciseCount,
  completedSets,
  totalSets,
  isExpanded,
  onPress,
  onToggleComplete,
  onDelete,
}) {
  const progress = totalSets > 0 ? completedSets / totalSets : 0;
  const badgeColor = TYPE_COLORS[session.type] || TYPE_COLORS.Other;

  return (
    <TouchableOpacity style={[styles.card, session.complete && styles.cardDone]} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{session.name}</Text>
            <View style={[styles.badge, { backgroundColor: badgeColor + '33', borderColor: badgeColor }]}>
              <Text style={[styles.badgeText, { color: badgeColor }]}>{session.type}</Text>
            </View>
          </View>
          <Text style={styles.meta}>
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
            {totalSets > 0 ? ` · ${completedSets}/${totalSets} sets` : ''}
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={e => { e.stopPropagation?.(); onToggleComplete?.(); }} style={styles.iconBtn}>
            <Text style={[styles.checkIcon, session.complete && styles.checkDone]}>
              {session.complete ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={e => { e.stopPropagation?.(); onDelete?.(); }} style={styles.iconBtn}>
            <Text style={styles.deleteIcon}>⋯</Text>
          </TouchableOpacity>
        </View>
      </View>

      {totalSets > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{Math.round(progress * 100)}%</Text>
        </View>
      )}

      {session.notes ? (
        <Text style={styles.notes} numberOfLines={2}>{session.notes}</Text>
      ) : null}

      <View style={styles.expandHint}>
        <Text style={styles.expandHintText}>{isExpanded ? '▲ collapse' : '▼ expand'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDone: {
    borderColor: colors.accent + '66',
  },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
  },
  badge: {
    borderRadius: 4,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginTop: 4,
  },
  actions: { flexDirection: 'row', gap: spacing.xs },
  iconBtn: { padding: spacing.xs },
  checkIcon: { color: colors.textSecondary, fontSize: 22 },
  checkDone: { color: colors.accent },
  deleteIcon: { color: colors.textSecondary, fontSize: 20 },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    width: 34,
    textAlign: 'right',
  },
  notes: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginTop: spacing.sm,
  },
  expandHint: { alignItems: 'flex-end', marginTop: spacing.xs },
  expandHintText: { color: colors.textSecondary, fontSize: 9 },
});
