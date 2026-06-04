import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { colors, typography, spacing } from '../constants/theme';
import useStore from '../store/useStore';
import MetricCard from '../components/MetricCard';
import MetricDetailModal from '../components/MetricDetailModal';
import { METRIC_DEFINITIONS, METRIC_BY_KEY } from '../constants/metrics';
import { getMetricHistory, addMetricEntry, deleteMetricEntry } from '../db/queries/healthMetrics';
import { todayISO } from '../utils/dateUtils';

export default function HealthMetricsScreen() {
  const { settings } = useStore();
  const [histories, setHistories] = useState({});
  const [selectedMetricKey, setSelectedMetricKey] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAllMetrics = async () => {
    const entries = await Promise.all(
      METRIC_DEFINITIONS.map(async (def) => {
        const hist = await getMetricHistory(def.key);
        return [def.key, hist];
      })
    );
    setHistories(Object.fromEntries(entries));
  };

  useFocusEffect(useCallback(() => { loadAllMetrics(); }, []));

  const onRefresh = async () => { setRefreshing(true); await loadAllMetrics(); setRefreshing(false); };

  const handleAddEntry = async (metricKey, value) => {
    const def = METRIC_BY_KEY[metricKey];
    if (!def) return;
    const id = Crypto.randomUUID();
    await addMetricEntry({ id, date: todayISO(), metric: metricKey, value, unit: def.unit });
    await loadAllMetrics();
  };

  const handleDeleteEntry = async (id) => {
    await deleteMetricEntry(id);
    await loadAllMetrics();
  };

  const getTarget = (def) => {
    if (!def.targetKey) return null;
    return settings.metricTargets[def.targetKey] ?? null;
  };

  const selectedDef = selectedMetricKey ? METRIC_BY_KEY[selectedMetricKey] : null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Health Metrics</Text>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {METRIC_DEFINITIONS.map(def => (
          <MetricCard
            key={def.key}
            definition={def}
            history={histories[def.key] || []}
            target={getTarget(def)}
            onPress={() => setSelectedMetricKey(def.key)}
          />
        ))}
      </ScrollView>

      <MetricDetailModal
        visible={!!selectedMetricKey}
        definition={selectedDef}
        history={selectedMetricKey ? (histories[selectedMetricKey] || []) : []}
        target={selectedDef ? getTarget(selectedDef) : null}
        onClose={() => setSelectedMetricKey(null)}
        onAddEntry={(value) => handleAddEntry(selectedMetricKey, value)}
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
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
