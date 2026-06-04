import React, { useState, useCallback } from 'react';
import {
  View, Text, Modal, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, typography, spacing } from '../constants/theme';
import { searchFood, getProductByBarcode } from '../api/openFoodFacts';

export default function FoodSearchModal({ visible, meal, onClose, onAddEntry }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '' });
  const [permission, requestPermission] = useCameraPermissions();

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const items = await searchFood(query.trim());
      setResults(items);
    } catch {
      Alert.alert('Error', 'Failed to search. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleBarcode = async ({ data }) => {
    if (!data) return;
    setScanning(false);
    setLoading(true);
    try {
      const product = await getProductByBarcode(data);
      if (product) setResults([product]);
      else Alert.alert('Not found', 'No product found for this barcode.');
    } catch {
      Alert.alert('Error', 'Failed to fetch product.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    const entry = {
      food_name: item.brand ? `${item.name} (${item.brand})` : item.name,
      serving_size: item.serving_size || '100g',
      calories: item.calories_per_100g,
      protein: item.protein_per_100g,
      carbs: item.carbs_per_100g,
      fat: item.fat_per_100g,
      source: 'openfoodfacts',
    };
    onAddEntry?.(meal, entry);
    handleClose();
  };

  const handleManualAdd = () => {
    if (!manual.name || !manual.calories) {
      Alert.alert('Required', 'Food name and calories are required.');
      return;
    }
    onAddEntry?.(meal, {
      food_name: manual.name,
      serving_size: manual.serving || null,
      calories: parseFloat(manual.calories) || 0,
      protein: parseFloat(manual.protein) || 0,
      carbs: parseFloat(manual.carbs) || 0,
      fat: parseFloat(manual.fat) || 0,
      source: 'manual',
    });
    handleClose();
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setScanning(false);
    setManualMode(false);
    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '' });
    onClose?.();
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Permission denied', 'Camera access is required to scan barcodes.'); return; }
    }
    setScanning(true);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Food · {meal}</Text>
          <TouchableOpacity onPress={handleClose}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
        </View>

        {scanning ? (
          <View style={styles.scannerContainer}>
            <CameraView style={styles.camera} onBarcodeScanned={handleBarcode} barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} />
            <TouchableOpacity style={styles.cancelScan} onPress={() => setScanning(false)}>
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : manualMode ? (
          <View style={styles.manualForm}>
            <Text style={styles.sectionTitle}>Manual Entry</Text>
            {[
              { key: 'name', placeholder: 'Food name *', keyboardType: 'default' },
              { key: 'serving', placeholder: 'Serving size (e.g. 100g)', keyboardType: 'default' },
              { key: 'calories', placeholder: 'Calories (kcal) *', keyboardType: 'numeric' },
              { key: 'protein', placeholder: 'Protein (g)', keyboardType: 'numeric' },
              { key: 'carbs', placeholder: 'Carbs (g)', keyboardType: 'numeric' },
              { key: 'fat', placeholder: 'Fat (g)', keyboardType: 'numeric' },
            ].map(field => (
              <TextInput
                key={field.key}
                style={styles.manualInput}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textSecondary}
                value={manual[field.key]}
                onChangeText={v => setManual(p => ({ ...p, [field.key]: v }))}
                keyboardType={field.keyboardType}
              />
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={handleManualAdd}>
              <Text style={styles.addBtnText}>Add Entry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backBtn} onPress={() => setManualMode(false)}>
              <Text style={styles.backBtnText}>← Back to search</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search food…"
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                <Text style={styles.searchBtnText}>Go</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={startScan}>
                <Text style={styles.actionBtnText}>📷 Scan barcode</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setManualMode(true)}>
                <Text style={styles.actionBtnText}>✏️ Manual entry</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item, i) => item.id ?? String(i)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultRow} onPress={() => handleSelect(item)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                      {item.brand ? <Text style={styles.resultBrand}>{item.brand}</Text> : null}
                    </View>
                    <Text style={styles.resultCal}>{Math.round(item.calories_per_100g)} kcal</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold },
  closeText: { color: colors.textSecondary, fontSize: 20 },
  searchRow: { flexDirection: 'row', padding: spacing.lg, gap: spacing.sm },
  searchInput: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.textPrimary, fontSize: typography.fontSizeMD,
  },
  searchBtn: {
    backgroundColor: colors.accent, borderRadius: 10,
    paddingHorizontal: spacing.lg, justifyContent: 'center',
  },
  searchBtnText: { color: colors.background, fontWeight: typography.fontWeightBold },
  actionRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  actionBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, paddingVertical: spacing.sm, alignItems: 'center' },
  actionBtnText: { color: colors.textPrimary, fontSize: typography.fontSizeSM },
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  resultName: { color: colors.textPrimary, fontSize: typography.fontSizeMD },
  resultBrand: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  resultCal: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  scannerContainer: { flex: 1 },
  camera: { flex: 1 },
  cancelScan: {
    position: 'absolute', bottom: 40, alignSelf: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
  },
  cancelScanText: { color: colors.textPrimary, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
  manualForm: { padding: spacing.lg },
  sectionTitle: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.md, textTransform: 'uppercase' },
  manualInput: {
    backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.textPrimary, fontSize: typography.fontSizeMD, marginBottom: spacing.sm,
  },
  addBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  addBtnText: { color: colors.background, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
  backBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  backBtnText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
});
