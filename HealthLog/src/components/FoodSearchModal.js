import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, Modal, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, typography, spacing } from '../constants/theme';
import { searchFood, getProductByBarcode } from '../api/openFoodFacts';
import { getDB } from '../db/database';

const TABS = ['Search', 'Barcode', 'Manual', 'Recent'];

const MACRO_COLORS = { protein: '#2196F3', carbs: '#FF9800', fat: '#F44336' };

async function getRecentFoods() {
  const db = getDB();
  return await db.getAllAsync(
    `SELECT food_name, serving_size, calories, protein, carbs, fat, source, MAX(date) as last_used
     FROM food_entries
     GROUP BY food_name
     ORDER BY last_used DESC
     LIMIT 20`
  );
}

export default function FoodSearchModal({ visible, meal, onClose, onAddEntry }) {
  const [activeTab, setActiveTab] = useState('Search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [servingG, setServingG] = useState('100');
  const [recentItems, setRecentItems] = useState([]);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manual, setManual] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '' });
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (visible && activeTab === 'Recent') loadRecent();
  }, [visible, activeTab]);

  // Debounced auto-search: fires 500ms after the user stops typing
  useEffect(() => {
    if (activeTab !== 'Search') return;
    if (!query.trim()) return;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => { handleSearch(); }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [query, activeTab]);

  const loadRecent = async () => {
    try {
      const rows = await getRecentFoods();
      setRecentItems(rows);
    } catch { /* silent */ }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelected(null);
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
    if (!data || scanned) return;
    setScanned(true);
    setLoading(true);
    try {
      const product = await getProductByBarcode(data);
      if (product) {
        setSelected(product);
        setServingG('100');
        setActiveTab('Search');
        setResults([product]);
      } else {
        Alert.alert('Not found', 'No product found for this barcode.');
        setScanned(false);
      }
    } catch {
      Alert.alert('Error', 'Failed to fetch product.');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectResult = (item) => {
    setSelected(item);
    setServingG(item.serving_size ? parseSizeG(item.serving_size) : '100');
  };

  const parseSizeG = (sizeStr) => {
    const match = String(sizeStr).match(/[\d.]+/);
    return match ? match[0] : '100';
  };

  const scaledMacros = useCallback((item) => {
    const g = parseFloat(servingG) || 100;
    const factor = g / 100;
    return {
      calories: Math.round((item.calories_per_100g ?? item.calories ?? 0) * factor),
      protein: Math.round((item.protein_per_100g ?? item.protein ?? 0) * factor),
      carbs: Math.round((item.carbs_per_100g ?? item.carbs ?? 0) * factor),
      fat: Math.round((item.fat_per_100g ?? item.fat ?? 0) * factor),
    };
  }, [servingG]);

  const handleLogFood = (item) => {
    const g = parseFloat(servingG) || 100;
    const macros = scaledMacros(item);
    const entry = {
      food_name: item.brand ? `${item.name} (${item.brand})` : (item.food_name ?? item.name ?? 'Food'),
      serving_size: `${g}g`,
      ...macros,
      source: item.source ?? 'openfoodfacts',
    };
    onAddEntry?.(meal, entry);
    handleClose();
  };

  const handleLogRecent = (item) => {
    onAddEntry?.(meal, {
      food_name: item.food_name,
      serving_size: item.serving_size,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      source: item.source ?? 'manual',
    });
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
    setSelected(null);
    setServingG('100');
    setScanned(false);
    setActiveTab('Search');
    setManual({ name: '', calories: '', protein: '', carbs: '', fat: '', serving: '' });
    onClose?.();
  };

  const startScan = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Permission denied', 'Camera access is required to scan barcodes.'); return; }
    }
    setScanned(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Add Food · {meal}</Text>
          <TouchableOpacity onPress={handleClose}><Text style={styles.closeText}>✕</Text></TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => { setSelected(null); setActiveTab(tab); if (tab === 'Barcode') startScan(); }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search tab */}
        {activeTab === 'Search' && (
          <View style={{ flex: 1 }}>
            {selected ? (
              <ServingPicker
                item={selected}
                servingG={servingG}
                setServingG={setServingG}
                scaledMacros={scaledMacros}
                onLog={() => handleLogFood(selected)}
                onBack={() => setSelected(null)}
              />
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
                {loading ? (
                  <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
                ) : (
                  <FlatList
                    data={results}
                    keyExtractor={(item, i) => item.id ?? String(i)}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.resultRow} onPress={() => handleSelectResult(item)}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                          {item.brand ? <Text style={styles.resultBrand}>{item.brand}</Text> : null}
                        </View>
                        <Text style={styles.resultCal}>{Math.round(item.calories_per_100g)} kcal/100g</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                  />
                )}
              </>
            )}
          </View>
        )}

        {/* Barcode tab */}
        {activeTab === 'Barcode' && (
          <View style={{ flex: 1 }}>
            {loading ? (
              <ActivityIndicator color={colors.accent} style={{ flex: 1 }} />
            ) : (
              <CameraView
                style={{ flex: 1 }}
                onBarcodeScanned={scanned ? undefined : handleBarcode}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              />
            )}
            <View style={styles.barcodeHint}>
              <Text style={styles.barcodeHintText}>Point camera at a barcode</Text>
            </View>
          </View>
        )}

        {/* Manual tab */}
        {activeTab === 'Manual' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.manualForm}>
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
            <TouchableOpacity style={styles.logBtn} onPress={handleManualAdd}>
              <Text style={styles.logBtnText}>Log Food</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Recent tab */}
        {activeTab === 'Recent' && (
          <FlatList
            data={recentItems}
            keyExtractor={(item, i) => item.food_name ?? String(i)}
            ListEmptyComponent={<Text style={styles.emptyText}>No recent foods yet.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.resultRow} onPress={() => handleLogRecent(item)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName} numberOfLines={1}>{item.food_name}</Text>
                  {item.serving_size ? <Text style={styles.resultBrand}>{item.serving_size}</Text> : null}
                </View>
                <Text style={styles.resultCal}>{Math.round(item.calories)} kcal</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ServingPicker({ item, servingG, setServingG, scaledMacros, onLog, onBack }) {
  const macros = scaledMacros(item);

  return (
    <ScrollView contentContainerStyle={styles.pickerContainer}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.pickerTitle} numberOfLines={2}>
        {item.brand ? `${item.name} (${item.brand})` : item.name}
      </Text>

      <View style={styles.servingRow}>
        <Text style={styles.servingLabel}>Serving size (g)</Text>
        <TextInput
          style={styles.servingInput}
          value={servingG}
          onChangeText={setServingG}
          keyboardType="numeric"
          selectTextOnFocus
        />
      </View>

      <View style={styles.macroPreview}>
        <MacroPreviewRow label="Calories" value={`${macros.calories} kcal`} color={colors.textPrimary} />
        <MacroPreviewRow label="Protein" value={`${macros.protein}g`} color="#2196F3" />
        <MacroPreviewRow label="Carbs" value={`${macros.carbs}g`} color="#FF9800" />
        <MacroPreviewRow label="Fat" value={`${macros.fat}g`} color="#F44336" />
      </View>

      <TouchableOpacity style={styles.logBtn} onPress={onLog}>
        <Text style={styles.logBtnText}>Log Food</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function MacroPreviewRow({ label, value, color }) {
  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
    </View>
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
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.accent },
  tabText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  tabTextActive: { color: colors.accent, fontWeight: typography.fontWeightSemiBold },
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
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  resultName: { color: colors.textPrimary, fontSize: typography.fontSizeMD },
  resultBrand: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  resultCal: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  separator: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.lg },
  barcodeHint: {
    position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center',
  },
  barcodeHintText: {
    backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm, borderRadius: 12, fontSize: typography.fontSizeSM,
  },
  manualForm: { padding: spacing.lg },
  sectionTitle: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.md, textTransform: 'uppercase' },
  manualInput: {
    backgroundColor: colors.surface, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.textPrimary, fontSize: typography.fontSizeMD, marginBottom: spacing.sm,
  },
  logBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  logBtnText: { color: colors.background, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
  emptyText: { color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  pickerContainer: { padding: spacing.lg },
  backBtn: { marginBottom: spacing.md },
  backBtnText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  pickerTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightBold, marginBottom: spacing.lg },
  servingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surface, borderRadius: 10, padding: spacing.md, marginBottom: spacing.lg,
  },
  servingLabel: { color: colors.textPrimary, fontSize: typography.fontSizeMD },
  servingInput: {
    backgroundColor: colors.background, borderRadius: 8, width: 80, textAlign: 'center',
    paddingVertical: spacing.xs, color: colors.textPrimary, fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightBold,
  },
  macroPreview: { backgroundColor: colors.surface, borderRadius: 12, padding: spacing.md, marginBottom: spacing.lg },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  macroLabel: { color: colors.textSecondary, fontSize: typography.fontSizeMD },
  macroValue: { fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightSemiBold },
});
