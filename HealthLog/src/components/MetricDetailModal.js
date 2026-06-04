import React, { useRef } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Dimensions, Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, typography, spacing } from '../constants/theme';
import { formatChartLabel } from '../utils/dateUtils';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - spacing.lg * 2;
const CHART_H = 200;
const PAD_LEFT = 48;
const PAD_BOTTOM = 36;
const PAD_TOP = 12;
const PAD_RIGHT = 12;

function DetailChart({ data, color, target }) {
  if (!data || data.length < 1) return null;

  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const values = data.map(d => d.y);
  const allValues = target != null ? [...values, target] : values;
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = (rawMax - rawMin) * 0.1 || 1;
  const min = rawMin - padding;
  const max = rawMax + padding;
  const range = max - min;

  const toX = (i) => PAD_LEFT + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const toY = (v) => PAD_TOP + plotH - ((v - min) / range) * plotH;

  const tickCount = Math.min(5, data.length);
  const tickIndices = Array.from({ length: tickCount }, (_, i) =>
    Math.round((i / Math.max(tickCount - 1, 1)) * (data.length - 1))
  );

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks }, (_, i) =>
    rawMin + (i / (yTicks - 1)) * (rawMax - rawMin)
  );

  const linePoints = data.map((d, i) => `${toX(i)},${toY(d.y)}`).join(' ');

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Y gridlines & labels */}
      {yTickValues.map((v, i) => {
        const y = toY(v);
        return (
          <React.Fragment key={i}>
            <Line
              x1={PAD_LEFT} y1={y}
              x2={CHART_W - PAD_RIGHT} y2={y}
              stroke={colors.border} strokeWidth={1}
            />
            <SvgText
              x={PAD_LEFT - 4} y={y + 4}
              fontSize={9} fill={colors.textSecondary} textAnchor="end"
            >
              {v.toFixed(1)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Goal line */}
      {target != null && (
        <Line
          x1={PAD_LEFT} y1={toY(target)}
          x2={CHART_W - PAD_RIGHT} y2={toY(target)}
          stroke="#4CAF50"
          strokeWidth={1.5}
          strokeDasharray="5 3"
        />
      )}

      {/* Data line */}
      {data.length >= 2 && (
        <Polyline
          points={linePoints}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Data points */}
      {data.map((d, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(d.y)} r={3.5} fill={color} />
      ))}

      {/* X tick labels */}
      {tickIndices.map((idx) => (
        <SvgText
          key={idx}
          x={toX(idx)}
          y={CHART_H - 4}
          fontSize={9}
          fill={colors.textSecondary}
          textAnchor="middle"
        >
          {formatChartLabel(data[idx].date)}
        </SvgText>
      ))}
    </Svg>
  );
}

function SwipeableRow({ entry, unit, onDelete }) {
  const swipeableRef = useRef(null);

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => {
          swipeableRef.current?.close();
          Alert.alert(
            'Delete entry?',
            `${entry.value} ${unit} on ${formatChartLabel(entry.date)}`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => swipeableRef.current?.close() },
              { text: 'Delete', style: 'destructive', onPress: () => onDelete(entry.id) },
            ]
          );
        }}
      >
        <Animated.Text style={[styles.deleteActionText, { transform: [{ scale }] }]}>
          Delete
        </Animated.Text>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false}>
      <View style={styles.historyRow}>
        <Text style={styles.historyDate}>{formatChartLabel(entry.date)}</Text>
        <Text style={styles.historyValue}>{entry.value}</Text>
        <Text style={styles.historyUnit}>{unit}</Text>
      </View>
    </Swipeable>
  );
}

export default function MetricDetailModal({ visible, definition, history = [], target, onClose, onDeleteEntry }) {
  if (!definition) return null;

  const chartData = [...history]
    .reverse()
    .map((h, i) => ({ x: i, y: h.value, date: h.date }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{definition.label}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Chart */}
          {chartData.length > 0 ? (
            <View style={styles.chartContainer}>
              <Text style={styles.yAxisLabel}>{definition.unit}</Text>
              <DetailChart
                data={chartData}
                color={definition.color || colors.accent}
                target={target}
              />
              {target != null && (
                <View style={styles.goalLegend}>
                  <View style={styles.goalLegendDash} />
                  <Text style={styles.goalLegendText}>Goal: {target} {definition.unit}</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>No entries yet.</Text>
            </View>
          )}

          {/* History table */}
          <Text style={styles.sectionTitle}>History</Text>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No entries logged.</Text>
          ) : (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Date</Text>
                <Text style={styles.tableHeaderCell}>Value</Text>
                <Text style={styles.tableHeaderCell}>Unit</Text>
              </View>
              {history.map(entry => (
                <SwipeableRow
                  key={entry.id}
                  entry={entry}
                  unit={definition.unit}
                  onDelete={onDeleteEntry}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 56,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
  },
  closeText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMD,
  },
  body: { flex: 1 },
  bodyContent: { paddingBottom: spacing.xxl },
  chartContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    marginVertical: spacing.md,
  },
  yAxisLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginBottom: 4,
  },
  goalLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  goalLegendDash: {
    width: 20,
    height: 2,
    backgroundColor: '#4CAF50',
    marginRight: spacing.sm,
  },
  goalLegendText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: 12,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    textAlign: 'center',
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.accent,
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tableContainer: {
    paddingHorizontal: spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 2,
  },
  tableHeaderCell: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  historyDate: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSM,
  },
  historyValue: {
    flex: 1,
    color: colors.accent,
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
  },
  historyUnit: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  deleteAction: {
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
  },
});
