import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing } from '../constants/theme';
import useStore from '../store/useStore';

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function NumberField({ label, unit, value, onChangeText }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRight}>
        <TextInput
          style={styles.numberInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          placeholderTextColor={colors.textSecondary}
          placeholder="—"
          selectTextOnFocus
        />
        {unit ? <Text style={styles.fieldUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

function ToggleField({ label, options, value, onChange }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.toggleGroup}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[styles.toggleBtn, value === opt && styles.toggleBtnActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.toggleBtnText, value === opt && styles.toggleBtnTextActive]}>
              {opt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { settings, updateSettings } = useStore();

  // Local form state — strings for all number inputs
  const [calorieGoal, setCalorieGoal] = useState(String(settings.dailyCalorieGoal ?? 2000));
  const [proteinGoal, setProteinGoal] = useState(String(settings.proteinGoal ?? 150));
  const [carbsGoal, setCarbsGoal] = useState(String(settings.carbsGoal ?? 200));
  const [fatGoal, setFatGoal] = useState(String(settings.fatGoal ?? 65));
  const [waterGoal, setWaterGoal] = useState(String(settings.waterGoal ?? 3.0));
  const [weightUnit, setWeightUnit] = useState(settings.weightUnit ?? 'kg');
  const [distanceUnit, setDistanceUnit] = useState(settings.distanceUnit ?? 'km');
  const [weightTarget, setWeightTarget] = useState(
    settings.metricTargets.weight != null ? String(settings.metricTargets.weight) : ''
  );
  const [bodyFatTarget, setBodyFatTarget] = useState(
    settings.metricTargets.bodyFat != null ? String(settings.metricTargets.bodyFat) : ''
  );
  const [ldlTarget, setLdlTarget] = useState(
    settings.metricTargets.ldl != null ? String(settings.metricTargets.ldl) : ''
  );
  const [totalCholesterolTarget, setTotalCholesterolTarget] = useState(
    settings.metricTargets.totalCholesterol != null ? String(settings.metricTargets.totalCholesterol) : ''
  );
  const [muscleMassTarget, setMuscleMassTarget] = useState(
    settings.metricTargets.muscleMass != null ? String(settings.metricTargets.muscleMass) : ''
  );

  // Sync unit toggles to store immediately (skip the first render)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    updateSettings({ weightUnit, distanceUnit });
  }, [weightUnit, distanceUnit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    const parsed = {
      dailyCalorieGoal: parseInt(calorieGoal, 10),
      proteinGoal: parseInt(proteinGoal, 10),
      carbsGoal: parseInt(carbsGoal, 10),
      fatGoal: parseInt(fatGoal, 10),
      waterGoal: parseFloat(waterGoal),
      weightUnit,
      distanceUnit,
      metricTargets: {
        weight: weightTarget !== '' ? parseFloat(weightTarget) : null,
        bodyFat: bodyFatTarget !== '' ? parseFloat(bodyFatTarget) : null,
        ldl: ldlTarget !== '' ? parseFloat(ldlTarget) : null,
        totalCholesterol: totalCholesterolTarget !== '' ? parseFloat(totalCholesterolTarget) : null,
        muscleMass: muscleMassTarget !== '' ? parseFloat(muscleMassTarget) : null,
      },
    };

    const numericFields = [
      parsed.dailyCalorieGoal, parsed.proteinGoal, parsed.carbsGoal,
      parsed.fatGoal, parsed.waterGoal,
    ];
    if (numericFields.some(v => isNaN(v) || v < 0)) {
      Alert.alert('Invalid values', 'Please check your nutrition goals — all must be positive numbers.');
      return;
    }

    await updateSettings(parsed);
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Settings</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Nutrition Goals */}
        <SectionHeader title="Nutrition Goals" />
        <View style={styles.card}>
          <NumberField label="Daily Calories" unit="kcal" value={calorieGoal} onChangeText={setCalorieGoal} />
          <NumberField label="Protein" unit="g" value={proteinGoal} onChangeText={setProteinGoal} />
          <NumberField label="Carbs" unit="g" value={carbsGoal} onChangeText={setCarbsGoal} />
          <NumberField label="Fat" unit="g" value={fatGoal} onChangeText={setFatGoal} />
          <NumberField label="Water" unit="L" value={waterGoal} onChangeText={setWaterGoal} />
        </View>

        {/* Units */}
        <SectionHeader title="Units" />
        <View style={styles.card}>
          <ToggleField
            label="Weight"
            options={['kg', 'lbs']}
            value={weightUnit}
            onChange={setWeightUnit}
          />
          <ToggleField
            label="Distance"
            options={['km', 'miles']}
            value={distanceUnit}
            onChange={setDistanceUnit}
          />
        </View>

        {/* Health Metric Targets */}
        <SectionHeader title="Health Metric Targets" />
        <View style={styles.card}>
          <NumberField
            label="Weight Target"
            unit={weightUnit}
            value={weightTarget}
            onChangeText={setWeightTarget}
          />
          <NumberField label="Body Fat % Target" unit="%" value={bodyFatTarget} onChangeText={setBodyFatTarget} />
          <NumberField label="LDL Target" unit="mmol/L" value={ldlTarget} onChangeText={setLdlTarget} />
          <NumberField
            label="Total Cholesterol Target"
            unit="mmol/L"
            value={totalCholesterolTarget}
            onChangeText={setTotalCholesterolTarget}
          />
          <NumberField
            label="Muscle Mass Target"
            unit="kg"
            value={muscleMassTarget}
            onChangeText={setMuscleMassTarget}
          />
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  backBtn: { minWidth: 60 },
  backText: { color: colors.accent, fontSize: typography.fontSizeMD },
  heading: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
  },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  sectionHeader: {
    color: colors.accent,
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightSemiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    flex: 1,
  },
  fieldRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  numberInput: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    textAlign: 'right',
    minWidth: 64,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fieldUnit: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
    minWidth: 40,
  },
  toggleGroup: { flexDirection: 'row', gap: spacing.xs },
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  toggleBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  toggleBtnText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  toggleBtnTextActive: { color: colors.background, fontWeight: typography.fontWeightSemiBold },
  saveBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.background,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightBold,
  },
});
