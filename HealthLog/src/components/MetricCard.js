import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { colors, typography, spacing } from '../constants/theme';

const CHART_W = 120;
const CHART_H = 40;

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return <View style={{ width: CHART_W, height: CHART_H }} />;
  const values = data.map(d => d.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = CHART_W / (data.length - 1);
  const points = data
    .map((d, i) => {
      const x = i * step;
      const y = CHART_H - ((d.y - min) / range) * CHART_H;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <Svg width={CHART_W} height={CHART_H}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function getTrendArrow(history, target) {
  if (history.length < 2) return null;
  const latest = history[0].value;
  const prev = history[1].value;
  const delta = latest - prev;
  if (Math.abs(delta) < 0.0001) return null;

  const goingUp = delta > 0;
  let green;
  if (target != null) {
    // Green if moving toward target
    green = (target - prev) * delta > 0;
  } else {
    // Default: down is green (lower is better for most tracked metrics)
    green = !goingUp;
  }

  return { arrow: goingUp ? '↑' : '↓', green };
}

export default function MetricCard({ definition, history = [], target, onPress }) {
  const latest = history[0];
  const chartData = history
    .slice(0, 14)
    .reverse()
    .map((h, i) => ({ x: i, y: h.value }));

  const trend = getTrendArrow(history, target);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.left}>
        <Text style={styles.label}>{definition.label}</Text>
        <Text style={styles.unit}>{definition.unit}</Text>
        {latest ? (
          <View style={styles.valueRow}>
            <Text style={styles.value}>{latest.value}</Text>
            {trend && (
              <Text style={[styles.arrow, trend.green ? styles.arrowGreen : styles.arrowRed]}>
                {' '}{trend.arrow}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noData}>No data</Text>
        )}
        {target != null && (
          <Text style={styles.goal}>Goal: {target} {definition.unit}</Text>
        )}
      </View>
      <View style={styles.chartWrapper}>
        <Sparkline data={chartData} color={definition.color || colors.accent} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  left: { flex: 1 },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  unit: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginBottom: 4,
  },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
  },
  arrow: { fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold },
  arrowGreen: { color: colors.success },
  arrowRed: { color: colors.error },
  noData: { color: colors.textSecondary, fontSize: typography.fontSizeMD },
  goal: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 4 },
  chartWrapper: { width: CHART_W, height: CHART_H },
});
