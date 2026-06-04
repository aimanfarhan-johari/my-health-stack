import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { colors, typography, spacing } from '../constants/theme';

const CHART_W = 100;
const CHART_H = 40;

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
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
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export default function MetricCard({ definition, history = [], target, onPress }) {
  const latest = history[0];
  const chartData = history
    .slice(0, 14)
    .reverse()
    .map((h, i) => ({ x: i, y: h.value }));

  const delta = history.length >= 2 ? (history[0].value - history[1].value) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.left}>
        <Text style={styles.label}>{definition.label}</Text>
        {latest ? (
          <View style={styles.valueRow}>
            <Text style={styles.value}>{latest.value}</Text>
            <Text style={styles.unit}> {definition.unit}</Text>
          </View>
        ) : (
          <Text style={styles.noData}>No data</Text>
        )}
        {delta !== null && (
          <Text style={[styles.delta, delta > 0 ? styles.deltaUp : styles.deltaDown]}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} {definition.unit}
          </Text>
        )}
        {target != null && latest && (
          <Text style={styles.target}>Target: {target} {definition.unit}</Text>
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
  label: { color: colors.textSecondary, fontSize: typography.fontSizeXS, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline' },
  value: { color: colors.textPrimary, fontSize: typography.fontSizeXXL, fontWeight: typography.fontWeightBold },
  unit: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  noData: { color: colors.textSecondary, fontSize: typography.fontSizeMD },
  delta: { fontSize: typography.fontSizeXS, marginTop: 2 },
  deltaUp: { color: '#F44336' },
  deltaDown: { color: colors.accent },
  target: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  chartWrapper: { width: CHART_W, height: CHART_H },
});
