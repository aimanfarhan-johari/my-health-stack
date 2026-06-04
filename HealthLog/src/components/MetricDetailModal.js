import React, { useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity,
  ScrollView, TextInput, Alert, Dimensions,
} from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors, typography, spacing } from '../constants/theme';
import { formatChartLabel } from '../utils/dateUtils';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - spacing.lg * 2;
const CHART_H = 180;
const PAD_LEFT = 44;
const PAD_BOTTOM = 36;
const PAD_TOP = 10;
const PAD_RIGHT = 10;

function DetailChart({ data, color }) {
  if (!data || data.length < 2) return null;

  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const values = data.map(d => d.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i) => PAD_LEFT + (i / (data.length - 1)) * plotW;
  const toY = (v) => PAD_TOP + plotH - ((v - min) / range) * plotH;

  const points = data.map((d, i) => `${toX(i)},${toY(d.y)}`).join(' ');

  // Tick labels: show up to 5 evenly spaced
  const tickIndices = [];
  const tickCount = Math.min(5, data.length);
  for (let i = 0; i < tickCount; i++) {
    tickIndices.push(Math.round((i / (tickCount - 1)) * (data.length - 1)));
  }

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks }, (_, i) =>
    min + (i / (yTicks - 1)) * range
  );

  return (
    <Svg width={CHART_W} height={CHART_H}>
      {/* Y gridlines & labels */}
      {yTickValues.map((v, i) => {
        const y = toY(v);
        return (
          <React.Fragment key={i}>
            <Line x1={PAD_LEFT} y1={y} x2={CHART_W - PAD_RIGHT} y2={y} stroke={colors.border} strokeWidth={1} />
            <SvgText x={PAD_LEFT - 4} y={y + 4} fontSize={9} fill={colors.textSecondary} textAnchor="end">
              {v.toFixed(1)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Line */}
      <Polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {data.map((d, i) => (
        <Circle key={i} cx={toX(i)} cy={toY(d.y)} r={3} fill={color} />
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

export default function MetricDetailModal({ visible, definition, history = [], target, onClose, onAddEntry, onDeleteEntry }) {
  const [inputValue, setInputValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  if (!definition) return null;

  const chartData = [...history]
    .reverse()
    .map((h, i) => ({ x: i, y: h.value, date: h.date }));

  const handleAdd = () => {
    const v = parseFloat(inputValue);
    if (isNaN(v)) { Alert.alert('Invalid', 'Please enter a valid number.'); return; }
    onAddEntry?.(v);
    setInputValue('');
    setShowAdd(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{definition.label}</Text>
          <TouchableOpacity onPress={() => setShowAdd(s => !s)} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+ Log</Text>
          </TouchableOpacity>
        </View>

        {showAdd && (
          <View style={styles.addForm}>
            <TextInput
              style={styles.input}
              placeholder={`Value (${definition.unit})`}
              placeholderTextColor={colors.textSecondary}
              value={inputValue}
              onChangeText={setInputValue}
              keyboardType="numeric"
              autoFocus
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}

        {chartData.length >= 2 && (
          <View style={styles.chartContainer}>
            <DetailChart data={chartData} color={definition.color || colors.accent} />
          </View>
        )}

        <ScrollView style={styles.historyList}>
          <Text style={styles.historyTitle}>History</Text>
          {history.length === 0 ? (
            <Text style={styles.empty}>No entries yet. Tap "+ Log" to add your first.</Text>
          ) : (
            history.map(entry => (
              <View key={entry.id} style={styles.historyRow}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                <Text style={styles.historyValue}>{entry.value} {definition.unit}</Text>
                <TouchableOpacity onPress={() => {
                  Alert.alert('Delete entry?', `${entry.value} ${definition.unit} on ${entry.date}`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => onDeleteEntry?.(entry.id) },
                  ]);
                }}>
                  <Text style={styles.deleteText}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { minWidth: 60 },
  backText: { color: colors.accent, fontSize: typography.fontSizeMD },
  title: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold },
  addBtn: { minWidth: 60, alignItems: 'flex-end' },
  addBtnText: { color: colors.accent, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
  addForm: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.background, borderRadius: 8,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.textPrimary, fontSize: typography.fontSizeMD,
  },
  saveBtn: {
    backgroundColor: colors.accent, borderRadius: 8,
    paddingHorizontal: spacing.lg, justifyContent: 'center',
  },
  saveBtnText: { color: colors.background, fontWeight: typography.fontWeightBold },
  chartContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.surface, marginVertical: spacing.md },
  historyList: { flex: 1, paddingHorizontal: spacing.lg },
  historyTitle: {
    color: colors.accent, fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: spacing.sm,
  },
  historyRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  historyDate: { color: colors.textPrimary, fontSize: typography.fontSizeSM, flex: 1 },
  historyValue: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, marginRight: spacing.lg },
  deleteText: { color: colors.textSecondary, fontSize: 20, paddingLeft: spacing.sm },
  empty: { color: colors.textSecondary, fontSize: typography.fontSizeSM, marginTop: spacing.lg },
});
