import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';

export default function ExerciseRow({ exercise, onUpdateSets, onDelete }) {
  const sets = JSON.parse(exercise.sets || '[]');
  const [expanded, setExpanded] = useState(false);

  const updateSet = (index, field, value) => {
    const updated = sets.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onUpdateSets?.(JSON.stringify(updated));
  };

  const addSet = () => {
    const newSet = { reps: '', weight: '', done: false };
    onUpdateSets?.(JSON.stringify([...sets, newSet]));
  };

  const toggleSetDone = (index) => {
    const updated = sets.map((s, i) => i === index ? { ...s, done: !s.done } : s);
    onUpdateSets?.(JSON.stringify(updated));
  };

  const isCardio = exercise.type === 'cardio';

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{exercise.name}</Text>
          <Text style={styles.meta}>
            {isCardio
              ? [exercise.duration && `${exercise.duration}min`, exercise.distance && `${exercise.distance}km`].filter(Boolean).join(' · ')
              : `${sets.length} set${sets.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onDelete?.()} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && !isCardio && (
        <View style={styles.setsContainer}>
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
                placeholder="—"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.setInput, { flex: 1 }]}
                value={String(set.reps || '')}
                onChangeText={v => updateSet(i, 'reps', v)}
                placeholder="—"
                placeholderTextColor={colors.textSecondary}
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
  container: { backgroundColor: colors.surface, borderRadius: 8, marginBottom: spacing.sm, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  name: { color: colors.textPrimary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  meta: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  deleteBtn: { padding: spacing.xs },
  deleteText: { color: colors.textSecondary, fontSize: 20 },
  chevron: { color: colors.textSecondary, fontSize: 10, marginLeft: spacing.xs },
  setsContainer: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  setHeader: { flexDirection: 'row', paddingVertical: spacing.xs },
  setHeaderText: { color: colors.textSecondary, fontSize: typography.fontSizeXS, textAlign: 'center' },
  setRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  setNum: { color: colors.textSecondary, fontSize: typography.fontSizeSM, textAlign: 'center' },
  setInput: {
    backgroundColor: colors.background, borderRadius: 6,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    color: colors.textPrimary, fontSize: typography.fontSizeSM,
    textAlign: 'center', marginHorizontal: spacing.xs,
  },
  doneBtn: { width: 32, alignItems: 'center' },
  doneIcon: { color: colors.textSecondary, fontSize: 16 },
  doneDone: { color: colors.accent },
  addSetBtn: { paddingTop: spacing.sm },
  addSetText: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
});
