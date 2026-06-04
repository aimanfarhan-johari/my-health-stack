import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography, spacing } from '../constants/theme';

const SIZE = 140;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function MacroRing({ calories, calorieGoal, protein, proteinGoal, carbs, carbsGoal, fat, fatGoal }) {
  const pct = Math.min(1, (calories || 0) / (calorieGoal || 2000));
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  return (
    <View style={styles.container}>
      <View style={styles.ringWrapper}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} stroke={colors.border} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            stroke={colors.accent}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.calValue}>{Math.round(calories || 0)}</Text>
          <Text style={styles.calLabel}>of {calorieGoal} kcal</Text>
        </View>
      </View>

      <View style={styles.macroRow}>
        <MacroBar label="Protein" value={protein} goal={proteinGoal} color="#2196F3" />
        <MacroBar label="Carbs" value={carbs} goal={carbsGoal} color="#FF9800" />
        <MacroBar label="Fat" value={fat} goal={fatGoal} color="#F44336" />
      </View>
    </View>
  );
}

function MacroBar({ label, value, goal, color }) {
  const pct = Math.min(1, (value || 0) / (goal || 1));
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.bar}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.macroValues}>{Math.round(value || 0)}<Text style={styles.macroGoal}>/{goal}g</Text></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.lg },
  ringWrapper: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  calValue: { color: colors.textPrimary, fontSize: typography.fontSizeXL, fontWeight: typography.fontWeightBold },
  calLabel: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  macroRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  macroItem: { alignItems: 'center', width: 90 },
  macroLabel: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginBottom: 4 },
  bar: { width: 90, height: 4, backgroundColor: colors.border, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  macroValues: { color: colors.textPrimary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, marginTop: 4 },
  macroGoal: { color: colors.textSecondary, fontWeight: typography.fontWeightRegular },
});
