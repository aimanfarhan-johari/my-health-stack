import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Modal, TextInput, Alert,
  TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { colors, typography, spacing } from '../constants/theme';
import useStore from '../store/useStore';
import MetricCard from '../components/MetricCard';
import MetricDetailModal from '../components/MetricDetailModal';
import { METRIC_DEFINITIONS, METRIC_BY_KEY } from '../constants/metrics';
import { getMetricHistory, addMetricEntry, deleteMetricEntry } from '../db/queries/healthMetrics';
import { todayISO } from '../utils/dateUtils';

const TRACKED_KEYS = ['weight', 'body_fat', 'ldl', 'total_cholesterol', 'muscle_mass'];
const TRACKED_METRICS = METRIC_DEFINITIONS.filter(m => TRACKED_KEYS.includes(m.key));

export default function HealthMetricsScreen() {
  const { settings } = useStore();
  const [histories, setHistories] = useState({});
  const [selectedMetricKey, setSelectedMetricKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Add-reading sheet state
  const [showSheet, setShowSheet] = useState(false);
  const [sheetMetric, setSheetMetric] = useState(TRACKED_METRICS[0]?.key ?? '');
  const [sheetValue, setSheetValue] = useState('');
  const [sheetDate, setSheetDate] = useState(todayISO());

  const loadAllMetrics = async () => {
    const entries = await Promise.all(
      TRACKED_METRICS.map(async (def) => {
        const hist = await getMetricHistory(def.key);
        return [def.key, hist];
      })
    );
    setHistories(Object.fromEntries(entries));
    setIsLoading(false);
  };

  useFocusEffect(useCallback(() => { loadAllMetrics(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllMetrics();
    setRefreshing(false);
  };

  const getTarget = (def) => {
    if (!def.targetKey) return null;
    return settings.metricTargets[def.targetKey] ?? null;
  };

  const handleSaveReading = async () => {
    const v = parseFloat(sheetValue);
    if (isNaN(v) || sheetValue.trim() === '') {
      Alert.alert('Invalid', 'Please enter a numeric value.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sheetDate)) {
      Alert.alert('Invalid date', 'Date must be in YYYY-MM-DD format.');
      return;
    }
    const def = METRIC_BY_KEY[sheetMetric];
    if (!def) return;
    const id = Crypto.randomUUID();
    await addMetricEntry({ id, date: sheetDate, metric: sheetMetric, value: v, unit: def.unit });
    await loadAllMetrics();
    setSheetValue('');
    setSheetDate(todayISO());
    setShowSheet(false);
  };

  const handleDeleteEntry = async (id) => {
    await deleteMetricEntry(id);
    await loadAllMetrics();
  };

  const openSheet = () => {
    setSheetValue('');
    setSheetDate(todayISO());
    setSheetMetric(TRACKED_METRICS[0]?.key ?? '');
    setShowSheet(true);
  };

  const selectedDef = selectedMetricKey ? METRIC_BY_KEY[selectedMetricKey] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Health Metrics</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
        ) : (
          TRACKED_METRICS.map(def => {
            const hist = histories[def.key] || [];
            return (
              <View key={def.key}>
                <MetricCard
                  definition={def}
                  history={hist}
                  target={getTarget(def)}
                  onPress={() => setSelectedMetricKey(def.key)}
                />
                {hist.length === 0 && (
                  <Text style={styles.emptyHint}>No readings yet. Tap + to log your first entry.</Text>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={openSheet} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add-reading bottom sheet */}
      <Modal visible={showSheet} transparent animationType="slide" onRequestClose={() => setShowSheet(false)}>
        <TouchableWithoutFeedback onPress={() => setShowSheet(false)}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.sheet}
              >
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>Log a Reading</Text>

                {/* Metric picker */}
                <Text style={styles.fieldLabel}>Metric</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {TRACKED_METRICS.map(m => (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.chip, sheetMetric === m.key && styles.chipActive]}
                      onPress={() => setSheetMetric(m.key)}
                    >
                      <Text style={[styles.chipText, sheetMetric === m.key && styles.chipTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Value input */}
                <Text style={styles.fieldLabel}>
                  Value ({METRIC_BY_KEY[sheetMetric]?.unit ?? ''})
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 75.5"
                  placeholderTextColor={colors.textSecondary}
                  value={sheetValue}
                  onChangeText={setSheetValue}
                  keyboardType="numeric"
                />

                {/* Date input */}
                <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2024-06-04"
                  placeholderTextColor={colors.textSecondary}
                  value={sheetDate}
                  onChangeText={setSheetDate}
                />

                {/* Buttons */}
                <View style={styles.sheetButtons}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowSheet(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleSaveReading}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Detail modal */}
      <MetricDetailModal
        visible={!!selectedMetricKey}
        definition={selectedDef}
        history={selectedMetricKey ? (histories[selectedMetricKey] || []) : []}
        target={selectedDef ? getTarget(selectedDef) : null}
        onClose={() => setSelectedMetricKey(null)}
        onDeleteEntry={handleDeleteEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  heading: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeXXL,
    fontWeight: typography.fontWeightBold,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    textAlign: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: {
    color: colors.background,
    fontSize: 28,
    fontWeight: typography.fontWeightBold,
    lineHeight: 32,
  },

  // Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  chipRow: { flexDirection: 'row', marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.background,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  chipTextActive: { color: colors.background, fontWeight: typography.fontWeightSemiBold },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: typography.fontWeightSemiBold },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.background, fontWeight: typography.fontWeightBold },
});
