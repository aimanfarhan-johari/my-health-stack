import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { colors, typography, spacing } from '../constants/theme';
import useStore from '../store/useStore';
import WorkoutSessionCard from '../components/WorkoutSessionCard';
import ExerciseRow from '../components/ExerciseRow';
import {
  getSessionsByDate, addWorkoutSession, updateWorkoutSession, deleteWorkoutSession,
  getExercisesBySession, addExercise, updateExercise, deleteExercise,
} from '../db/queries/workouts';
import { todayISO, formatDisplay } from '../utils/dateUtils';

const SESSION_TYPES = ['Strength', 'Cardio', 'Flexibility', 'Sports', 'Other'];
const EXERCISE_TYPES = ['strength', 'cardio'];

export default function WorkoutScreen() {
  const { selectedWorkoutDate, setSelectedWorkoutDate } = useStore();
  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const [newSessionModal, setNewSessionModal] = useState(false);
  const [newSession, setNewSession] = useState({ name: '', type: 'Strength', notes: '' });

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [newExerciseModal, setNewExerciseModal] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', type: 'strength', cardio_type: '', duration: '', distance: '' });

  const today = todayISO();
  const isToday = selectedWorkoutDate === today;

  const loadSessions = async () => {
    const data = await getSessionsByDate(selectedWorkoutDate);
    setSessions(data);
    const exMap = {};
    await Promise.all(data.map(async (s) => {
      exMap[s.id] = await getExercisesBySession(s.id);
    }));
    setExercises(exMap);
  };

  useFocusEffect(useCallback(() => { loadSessions(); }, [selectedWorkoutDate]));

  const onRefresh = async () => { setRefreshing(true); await loadSessions(); setRefreshing(false); };

  const handleAddSession = async () => {
    if (!newSession.name.trim()) { Alert.alert('Required', 'Session name is required.'); return; }
    const id = Crypto.randomUUID();
    await addWorkoutSession({ id, date: selectedWorkoutDate, name: newSession.name.trim(), type: newSession.type, notes: newSession.notes.trim() || null });
    setNewSessionModal(false);
    setNewSession({ name: '', type: 'Strength', notes: '' });
    await loadSessions();
  };

  const handleToggleComplete = async (session) => {
    const exList = exercises[session.id] || [];
    await updateWorkoutSession(session.id, { ...session, complete: !session.complete, media_uris: session.media_uris || '[]' });
    await loadSessions();
  };

  const handleDeleteSession = (sessionId) => {
    Alert.alert('Delete session?', 'This will also delete all exercises in this session.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteWorkoutSession(sessionId);
        if (activeSessionId === sessionId) setActiveSessionId(null);
        await loadSessions();
      }},
    ]);
  };

  const handleAddExercise = async () => {
    if (!newExercise.name.trim()) { Alert.alert('Required', 'Exercise name is required.'); return; }
    const id = Crypto.randomUUID();
    await addExercise({
      id,
      session_id: activeSessionId,
      name: newExercise.name.trim(),
      type: newExercise.type,
      sets: '[]',
      duration: newExercise.duration ? parseInt(newExercise.duration) : null,
      distance: newExercise.distance ? parseFloat(newExercise.distance) : null,
      cardio_type: newExercise.cardio_type || null,
    });
    setNewExerciseModal(false);
    setNewExercise({ name: '', type: 'strength', cardio_type: '', duration: '', distance: '' });
    await loadSessions();
  };

  const handleUpdateSets = async (exerciseId, newSets) => {
    const ex = Object.values(exercises).flat().find(e => e.id === exerciseId);
    if (!ex) return;
    await updateExercise(exerciseId, { ...ex, sets: newSets });
    await loadSessions();
  };

  const handleDeleteExercise = (exerciseId) => {
    Alert.alert('Delete exercise?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteExercise(exerciseId); await loadSessions(); } },
    ]);
  };

  const goToPrevDay = () => {
    const d = new Date(selectedWorkoutDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedWorkoutDate(d.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const d = new Date(selectedWorkoutDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const next = d.toISOString().split('T')[0];
    if (next <= today) setSelectedWorkoutDate(next);
  };

  const getProgress = (sessionId) => {
    const exList = exercises[sessionId] || [];
    let total = 0, done = 0;
    exList.forEach(ex => {
      const sets = JSON.parse(ex.sets || '[]');
      total += sets.length;
      done += sets.filter(s => s.done).length;
    });
    return { total, done };
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goToPrevDay} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedWorkoutDate(today)}>
          <Text style={styles.dateLabel}>{isToday ? 'Today' : formatDisplay(selectedWorkoutDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextDay} style={styles.navBtn} disabled={isToday}>
          <Text style={[styles.navArrow, isToday && styles.navDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {sessions.length === 0 && (
          <Text style={styles.empty}>No workouts logged. Tap + to add a session.</Text>
        )}

        {sessions.map(session => {
          const { total, done } = getProgress(session.id);
          const exList = exercises[session.id] || [];
          const isExpanded = activeSessionId === session.id;

          return (
            <View key={session.id}>
              <WorkoutSessionCard
                session={session}
                exerciseCount={exList.length}
                completedSets={done}
                totalSets={total}
                onPress={() => setActiveSessionId(isExpanded ? null : session.id)}
                onToggleComplete={() => handleToggleComplete(session)}
                onDelete={() => handleDeleteSession(session.id)}
              />

              {isExpanded && (
                <View style={styles.exerciseList}>
                  {exList.map(ex => (
                    <ExerciseRow
                      key={ex.id}
                      exercise={ex}
                      onUpdateSets={(sets) => handleUpdateSets(ex.id, sets)}
                      onDelete={() => handleDeleteExercise(ex.id)}
                    />
                  ))}
                  <TouchableOpacity style={styles.addExBtn} onPress={() => setNewExerciseModal(true)}>
                    <Text style={styles.addExBtnText}>+ Add Exercise</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setNewSessionModal(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* New Session Modal */}
      <Modal visible={newSessionModal} transparent animationType="slide" onRequestClose={() => setNewSessionModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>New Workout Session</Text>
            <TextInput
              style={styles.input}
              placeholder="Session name"
              placeholderTextColor={colors.textSecondary}
              value={newSession.name}
              onChangeText={v => setNewSession(p => ({ ...p, name: v }))}
              autoFocus
            />
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.chipRow}>
              {SESSION_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, newSession.type === t && styles.chipActive]}
                  onPress={() => setNewSession(p => ({ ...p, type: t }))}
                >
                  <Text style={[styles.chipText, newSession.type === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newSession.notes}
              onChangeText={v => setNewSession(p => ({ ...p, notes: v }))}
              multiline
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddSession}>
              <Text style={styles.saveBtnText}>Add Session</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewSessionModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Exercise Modal */}
      <Modal visible={newExerciseModal} transparent animationType="slide" onRequestClose={() => setNewExerciseModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add Exercise</Text>
            <TextInput
              style={styles.input}
              placeholder="Exercise name"
              placeholderTextColor={colors.textSecondary}
              value={newExercise.name}
              onChangeText={v => setNewExercise(p => ({ ...p, name: v }))}
              autoFocus
            />
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.chipRow}>
              {EXERCISE_TYPES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, newExercise.type === t && styles.chipActive]}
                  onPress={() => setNewExercise(p => ({ ...p, type: t }))}
                >
                  <Text style={[styles.chipText, newExercise.type === t && styles.chipTextActive]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {newExercise.type === 'cardio' && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Duration (minutes)"
                  placeholderTextColor={colors.textSecondary}
                  value={newExercise.duration}
                  onChangeText={v => setNewExercise(p => ({ ...p, duration: v }))}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Distance (km)"
                  placeholderTextColor={colors.textSecondary}
                  value={newExercise.distance}
                  onChangeText={v => setNewExercise(p => ({ ...p, distance: v }))}
                  keyboardType="numeric"
                />
              </>
            )}
            <TouchableOpacity style={styles.saveBtn} onPress={handleAddExercise}>
              <Text style={styles.saveBtnText}>Add Exercise</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewExerciseModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dateNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { color: colors.textPrimary, fontSize: 26, fontWeight: '300' },
  navDisabled: { opacity: 0.3 },
  dateLabel: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  empty: { color: colors.textSecondary, fontSize: typography.fontSizeMD, textAlign: 'center', marginTop: spacing.xxl },
  exerciseList: { marginLeft: spacing.md, marginBottom: spacing.md },
  addExBtn: { backgroundColor: colors.surface, borderRadius: 8, paddingVertical: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  addExBtnText: { color: colors.accent, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  fabText: { color: colors.background, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, paddingBottom: 40,
  },
  sheetTitle: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold, marginBottom: spacing.lg },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    color: colors.textPrimary, fontSize: typography.fontSizeMD, marginBottom: spacing.sm,
  },
  fieldLabel: { color: colors.textSecondary, fontSize: typography.fontSizeXS, textTransform: 'uppercase', marginBottom: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: { backgroundColor: colors.background, borderRadius: 20, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  chipTextActive: { color: colors.background, fontWeight: typography.fontWeightSemiBold },
  saveBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  saveBtnText: { color: colors.background, fontSize: typography.fontSizeMD, fontWeight: typography.fontWeightBold },
  cancelBtn: { paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontSize: typography.fontSizeMD },
});
