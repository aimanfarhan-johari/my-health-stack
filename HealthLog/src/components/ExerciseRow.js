import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';
import { getPreviousSetsForExercise } from '../db/queries/workouts';

const CARDIO_TYPES = ['Run', 'Cycle', 'Row', 'Walk', 'HIIT', 'Other'];

export default function ExerciseRow({ exercise, sessionDate, onUpdateSets, onUpdate, onDelete }) {
  const sets = JSON.parse(exercise.sets || '[]');
  const [expanded, setExpanded] = useState(false);
  const [previousSets, setPreviousSets] = useState([]);
  const [localDuration, setLocalDuration] = useState(String(exercise.duration ?? ''));
  const [localDistance, setLocalDistance] = useState(String(exercise.distance ?? ''));

  const isCardio = exercise.type === 'cardio';

  useEffect(() => {
    if (!isCardio && expanded && sessionDate) {
      getPreviousSetsForExercise(exercise.name, sessionDate).then(setPreviousSets);
    }
  }, [expanded, exercise.name, isCardio, sessionDate]);

  const updateSet = (index, field, value) => {
    const updated = sets.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    onUpdateSets?.(JSON.stringify(updated));
  };

  const addSet = () => {
    onUpdateSets?.(JSON.stringify([...sets, { reps: '', weight: '', done: false }]));
  };

  const toggleSetDone = (index) => {
    const updated = sets.map((s, i) => (i === index ? { ...s, done: !s.done } : s));
    onUpdateSets?.(JSON.stringify(updated));
  };

  const toggleCardioDone = () => {
    const current = sets.length > 0 ? sets[0].done : false;
    onUpdateSets?.(JSON.stringify([{ done: !current }]));
  };

  const cardioDone = isCardio && sets.length > 0 && sets[0].done;

  const persistCardio = () => {
    onUpdate?.({
      ...exercise,
      duration: localDuration ? parseInt(localDuration) : null,
      distance: localDistance ? parseFloat(localDistance) : null,
    });
  };

  const setCardioType = (ct) => {
    onUpdate?.({ ...exercise, cardio_type: ct });
  };

  const completedCount = isCardio ? (cardioDone ? 1 : 0) : sets.filter(s => s.done).length;
  const totalCount = isCardio ? 1 : sets.length;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.meta}>
            {isCardio
              ? [exercise.cardio_type, exercise.duration && `${exercise.duration}min`, exercise.distance && `${exercise.distance}km`].filter(Boolean).join(' · ') || 'Cardio'
              : `${sets.length} set${sets.length !== 1 ? 's' : ''}${sets.length > 0 ? ` · ${completedCount}/${totalCount} done` : ''}`}
          </Text>
        </View>
        {isCardio && (
          <TouchableOpacity onPress={toggleCardioDone} style={styles.cardioDoneBtn}>
            <Text style={[styles.checkIcon, cardioDone && styles.checkDone]}>
              {cardioDone ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => onDelete?.()} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && isCardio && (
        <View style={styles.cardioContainer}>
          <View style={styles.cardioTypeRow}>
            {CARDIO_TYPES.map(ct => (
              <TouchableOpacity
                key={ct}
                style={[styles.ctChip, exercise.cardio_type === ct && styles.ctChipActive]}
                onPress={() => setCardioType(ct)}
              >
                <Text style={[styles.ctChipText, exercise.cardio_type === ct && styles.ctChipTextActive]}>{ct}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.cardioInputRow}>
            <View style={styles.cardioInputGroup}>
              <Text style={styles.cardioInputLabel}>Duration (min)</Text>
              <TextInput
                style={styles.cardioInput}
                value={localDuration}
                onChangeText={setLocalDuration}
                onBlur={persistCardio}
                placeholder="—"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.cardioInputGroup}>
              <Text style={styles.cardioInputLabel}>Distance (km)</Text>
              <TextInput
                style={styles.cardioInput}
                value={localDistance}
                onChangeText={setLocalDistance}
                onBlur={persistCardio}
                placeholder="—"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity onPress={toggleCardioDone} style={styles.cardioDoneToggle}>
              <Text style={[styles.cardioDoneLabel, cardioDone && styles.cardioDoneLabelActive]}>
                {cardioDone ? '✓ Done' : 'Mark\nDone'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {expanded && !isCardio && (
        <View style={styles.setsContainer}>
          {previousSets.length > 0 && (
            <View style={styles.prevSection}>
              <Text style={styles.prevLabel}>Previous session</Text>
              <View style={styles.setHeader}>
                <Text style={[styles.setHeaderText, { width: 30 }]}>Set</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight</Text>
                <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
                <View style={{ width: 32 }} />
              </View>
              {previousSets.map((s, i) => (
                <View key={i} style={styles.setRow}>
                  <Text style={[styles.setNum, styles.prevText, { width: 30 }]}>{i + 1}</Text>
                  <Text style={[styles.prevValue, { flex: 1 }]}>{s.weight || '—'}</Text>
                  <Text style={[styles.prevValue, { flex: 1 }]}>{s.reps || '—'}</Text>
                  <View style={{ width: 32 }} />
                </View>
              ))}
              <View style={styles.prevDivider} />
            </View>
          )}

          <View style={styles.setHeader}>
            <Text style={[styles.setHeaderText, { width: 30 }]}>Set</Text>
            <Text style={[styles.setHeaderText, { flex: 1 }]}>Weight (kg)</Text>
            <Text style={[styles.setHeaderText, { flex: 1 }]}>Reps</Text>
            <View style={{ width: 32 }} />
          </View>

          {sets.map((set, i) => (
            <View key={i} style={styles.setRow}>
              <Text style={[styles.setNum, { width: 30 }]}>{i + 1}</Text>
              <TextInput
                style={[styles.setInput, { flex: 1 }]}
                value={String(set.weight || '')}
                onChangeText={v => updateSet(i, 'weight', v)}
                placeholder={previousSets[i]?.weight ? String(previousSets[i].weight) : '—'}
                placeholderTextColor={colors.textSecondary + '88'}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.setInput, { flex: 1 }]}
                value={String(set.reps || '')}
                onChangeText={v => updateSet(i, 'reps', v)}
                placeholder={previousSets[i]?.reps ? String(previousSets[i].reps) : '—'}
                placeholderTextColor={colors.textSecondary + '88'}
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={() => toggleSetDone(i)} style={styles.doneBtn}>
                <Text style={[styles.doneIcon, set.done && styles.doneDone]}>
                  {set.done ? '✓' : '○'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity style={styles.addSetBtn} onPress={addSet}>
            <Text style={styles.addSetText}>+ Add Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  name: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
  },
  meta: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  cardioDoneBtn: { padding: spacing.xs, marginRight: spacing.xs },
  checkIcon: { color: colors.textSecondary, fontSize: 20 },
  checkDone: { color: colors.accent },
  deleteBtn: { padding: spacing.xs },
  deleteText: { color: colors.textSecondary, fontSize: 20 },
  chevron: { color: colors.textSecondary, fontSize: 10, marginLeft: spacing.xs },

  cardioContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  cardioTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  ctChip: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  ctChipText: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  ctChipTextActive: { color: colors.background, fontWeight: typography.fontWeightSemiBold },
  cardioInputRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  cardioInputGroup: { flex: 1 },
  cardioInputLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginBottom: spacing.xs,
  },
  cardioInput: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    textAlign: 'center',
  },
  cardioDoneToggle: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardioDoneLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    textAlign: 'center',
  },
  cardioDoneLabelActive: { color: colors.accent },

  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  prevSection: { marginTop: spacing.sm },
  prevLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  prevText: { color: colors.textSecondary + '88' },
  prevValue: {
    color: colors.textSecondary + '88',
    fontSize: typography.fontSizeSM,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
  prevDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: spacing.sm,
    borderStyle: 'dashed',
  },
  setHeader: { flexDirection: 'row', paddingTop: spacing.sm, paddingBottom: spacing.xs },
  setHeaderText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    textAlign: 'center',
  },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  setNum: { color: colors.textSecondary, fontSize: typography.fontSizeSM, textAlign: 'center' },
  setInput: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSM,
    textAlign: 'center',
    marginHorizontal: spacing.xs,
  },
  doneBtn: { width: 32, alignItems: 'center' },
  doneIcon: { color: colors.textSecondary, fontSize: 16 },
  doneDone: { color: colors.accent },
  addSetBtn: { paddingTop: spacing.sm },
  addSetText: {
    color: colors.accent,
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
  },
});
