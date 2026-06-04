import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, typography, spacing } from '../constants/theme';

const SIZE = 200;
const STROKE = 16;
const R = (SIZE - STROKE) / 2;
const CX = SIZE / 2;
const CY = SIZE / 2;

const PROTEIN_COLOR = colors.protein;
const CARBS_COLOR = colors.carbs;
const FAT_COLOR = colors.fat;
const REMAINING_COLOR = colors.border;

function toRad(deg) {
  return ((deg - 90) * Math.PI) / 180;
}

function polarXY(angleDeg) {
  const a = toRad(angleDeg);
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
}

function arcPath(startDeg, endDeg) {
  if (Math.abs(endDeg - startDeg) < 0.01) return '';
  // Clamp to just under 360 to avoid degenerate full-circle arc
  const sweep = Math.min(endDeg - startDeg, 359.99);
  const end = endDeg;
  const start = startDeg;
  const s = polarXY(start);
  const e = polarXY(start + sweep);
  const large = sweep > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function MacroRing({
  calories, calorieGoal,
  protein, proteinGoal,
  carbs, carbsGoal,
  fat, fatGoal,
}) {
  const goal = calorieGoal || 2000;
  const cal = calories || 0;
  const pro = protein || 0;
  const carb = carbs || 0;
  const fa = fat || 0;

  // Calories from each macro
  const proKcal = pro * 4;
  const carbKcal = carb * 4;
  const fatKcal = fa * 9;
  const remaining = Math.max(0, goal - cal);

  // Fraction of ring per macro (based on their contribution to total goal)
  const toAngle = (kcal) => (kcal / goal) * 360;

  const proAngle = toAngle(Math.min(proKcal, goal));
  const carbAngle = toAngle(Math.min(carbKcal, goal - proKcal));
  const fatAngle = toAngle(Math.min(fatKcal, goal - proKcal - carbKcal));
  const remAngle = 360 - proAngle - carbAngle - fatAngle;

  let cursor = 0;
  const proPath = arcPath(cursor, cursor + proAngle); cursor += proAngle;
  const carbPath = arcPath(cursor, cursor + carbAngle); cursor += carbAngle;
  const fatPath = arcPath(cursor, cursor + fatAngle); cursor += fatAngle;
  const remPath = arcPath(cursor, cursor + remAngle);

  return (
    <View style={styles.container}>
      <View style={styles.ringWrapper}>
        <Svg width={SIZE} height={SIZE}>
          {/* Background ring */}
          <Circle cx={CX} cy={CY} r={R} stroke={REMAINING_COLOR} strokeWidth={STROKE} fill="none" />
          {/* Remaining arc (drawn first so others go on top) */}
          {remPath ? (
            <Path d={remPath} stroke={REMAINING_COLOR} strokeWidth={STROKE} fill="none" strokeLinecap="butt" />
          ) : null}
          {fatPath ? (
            <Path d={fatPath} stroke={FAT_COLOR} strokeWidth={STROKE} fill="none" strokeLinecap="butt" />
          ) : null}
          {carbPath ? (
            <Path d={carbPath} stroke={CARBS_COLOR} strokeWidth={STROKE} fill="none" strokeLinecap="butt" />
          ) : null}
          {proPath ? (
            <Path d={proPath} stroke={PROTEIN_COLOR} strokeWidth={STROKE} fill="none" strokeLinecap="butt" />
          ) : null}
        </Svg>
        <View style={styles.center}>
          <Text style={styles.calValue}>{Math.round(cal)}</Text>
          <Text style={styles.calSep}>of {goal}</Text>
          <Text style={styles.calUnit}>kcal</Text>
        </View>
      </View>

      <View style={styles.pillRow}>
        <MacroPill label="Protein" value={pro} goal={proteinGoal} color={PROTEIN_COLOR} />
        <MacroPill label="Carbs" value={carb} goal={carbsGoal} color={CARBS_COLOR} />
        <MacroPill label="Fat" value={fa} goal={fatGoal} color={FAT_COLOR} />
      </View>
    </View>
  );
}

function MacroPill({ label, value, goal, color }) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
      <Text style={styles.pillValue}>
        {Math.round(value || 0)}
        <Text style={styles.pillGoal}>/{goal}g</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: spacing.lg },
  ringWrapper: { alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  calValue: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
  },
  calSep: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  calUnit: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  pill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    minWidth: 90,
  },
  pillLabel: { fontSize: typography.fontSizeXS, fontWeight: typography.fontWeightSemiBold },
  pillValue: { color: colors.textPrimary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightBold, marginTop: 2 },
  pillGoal: { color: colors.textSecondary, fontWeight: typography.fontWeightRegular },
});
