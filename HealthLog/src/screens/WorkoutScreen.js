import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
  TextInput, Alert, RefreshControl, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing } from '../constants/theme';
import useStore from '../store/useStore';
import WorkoutSessionCard from '../components/WorkoutSessionCard';
import ExerciseRow from '../components/ExerciseRow';
import {
  getSessionsByDate,
  addWorkoutSession,
  updateWorkoutSession,
  deleteWorkoutSession,
  getExercisesBySession,
  addExercise,
  updateExercise,
  deleteExercise,
  getWorkoutDotDataForDates,
} from '../db/queries/workouts';
import { todayISO } from '../utils/dateUtils';

const SESSION_TYPES = ['Strength', 'Cardio', 'Mixed'];
const CARDIO_TYPES = ['Run', 'Cycle', 'Row', 'Walk', 'HIIT', 'Other'];
const STRENGTH_PRESETS = [
  'Bench Press', 'Squat', 'Deadlift', 'Pull-Up', 'Push-Up',
  'Shoulder Press', 'Barbell Row', 'Lat Pulldown', 'Leg Press',
  'Bicep Curl', 'Tricep Pushdown', 'Lunge', 'Hip Thrust',
  'Romanian Deadlift', 'Incline Bench Press', 'Cable Row',
  'Face Pull', 'Lateral Raise', 'Calf Raise', 'Plank',
];
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const EMPTY_EX = { name: '', type: 'strength', cardio_type: 'Run', duration: '', distance: '' };

function getWeekDays(weekOffset) {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMon + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function weekMonthLabel(weekDays) {
  const d1 = new Date(weekDays[0] + 'T00:00:00');
  const d2 = new Date(weekDays[6] + 'T00:00:00');
  const m1 = d1.toLocaleDateString('en-GB', { month: 'short' });
  const m2 = d2.toLocaleDateString('en-GB', { month: 'short' });
  return `${m1 === m2 ? m1 : `${m1} – ${m2}`} ${d1.getFullYear()}`;
}

export default function WorkoutScreen() {
  const { selectedWorkoutDate, setSelectedWorkoutDate } = useStore();
  const today = todayISO();

  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDays, setWeekDays] = useState(() => getWeekDays(0));
  const [dotData, setDotData] = useState({});

  const [sessions, setSessions] = useState([]);
  const [exercises, setExercises] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState(null);

  // New session creation (3-step)
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionStep, setSessionStep] = useState(1);
  const [draftName, setDraftName] = useState('');
  const [draftType, setDraftType] = useState('Strength');
  const [pendingExercises, setPendingExercises] = useState([]);
  const [exSubform, setExSubform] = useState(false);
  const [draftEx, setDraftEx] = useState(EMPTY_EX);
  const [exNameQuery, setExNameQuery] = useState('');

  // Add exercise to existing session
  const [addExState, setAddExState] = useState({ sessionId: null, form: EMPTY_EX, nameQuery: '' });

  // Fullscreen media viewer
  const [mediaUri, setMediaUri] = useState(null);

  const loadDotData = async (days) => {
    const data = await getWorkoutDotDataForDates(days);
    setDotData(prev => ({ ...prev, ...data }));
  };

  const loadSessions = useCallback(async () => {
    const data = await getSessionsByDate(selectedWorkoutDate);
    setSessions(data);
    const exMap = {};
    await Promise.all(data.map(async (s) => {
      exMap[s.id] = await getExercisesBySession(s.id);
    }));
    setExercises(exMap);
  }, [selectedWorkoutDate]);

  useFocusEffect(useCallback(() => {
    loadSessions();
    loadDotData(weekDays);
  }, [selectedWorkoutDate, weekDays]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    await loadDotData(weekDays);
    setRefreshing(false);
  };

  const changeWeek = (delta) => {
    const newOffset = weekOffset + delta;
    const newDays = getWeekDays(newOffset);
    if (delta > 0 && newDays[0] > today) return;
    setWeekOffset(newOffset);
    setWeekDays(newDays);
    loadDotData(newDays);
  };

  // Session creation helpers
  const openSessionModal = () => {
    setDraftName('');
    setDraftType('Strength');
    setPendingExercises([]);
    setExSubform(false);
    setDraftEx(EMPTY_EX);
    setExNameQuery('');
    setSessionStep(1);
    setSessionModal(true);
  };

  const handleSessionStep1Next = () => {
    if (!draftName.trim()) { Alert.alert('Required', 'Session name is required.'); return; }
    setSessionStep(2);
  };

  const handleAddPendingEx = () => {
    if (!draftEx.name.trim()) { Alert.alert('Required', 'Exercise name is required.'); return; }
    setPendingExercises(prev => [...prev, { ...draftEx, tempId: Crypto.randomUUID() }]);
    setDraftEx(EMPTY_EX);
    setExNameQuery('');
    setExSubform(false);
  };

  const handleSaveSession = async () => {
    const sessionId = Crypto.randomUUID();
    await addWorkoutSession({
      id: sessionId,
      date: selectedWorkoutDate,
      name: draftName.trim(),
      type: draftType,
      notes: null,
    });
    for (const ex of pendingExercises) {
      const initSets = ex.type === 'cardio' ? '[{"done":false}]' : '[]';
      await addExercise({
        id: Crypto.randomUUID(),
        session_id: sessionId,
        name: ex.name,
        type: ex.type,
        sets: initSets,
        duration: ex.duration ? parseInt(ex.duration) : null,
        distance: ex.distance ? parseFloat(ex.distance) : null,
        cardio_type: ex.cardio_type || null,
      });
    }
    setSessionModal(false);
    setExpandedSessionId(sessionId);
    await loadSessions();
    await loadDotData(weekDays);
  };

  const handleToggleComplete = async (session) => {
    await updateWorkoutSession(session.id, {
      ...session,
      complete: !session.complete,
      media_uris: session.media_uris || '[]',
    });
    await loadSessions();
    await loadDotData(weekDays);
  };

  const handleDeleteSession = (sessionId) => {
    Alert.alert('Delete session?', 'This will also delete all exercises in this session.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteWorkoutSession(sessionId);
          if (expandedSessionId === sessionId) setExpandedSessionId(null);
          await loadSessions();
          await loadDotData(weekDays);
        },
      },
    ]);
  };

  const handleAddExerciseToSession = async (sessionId) => {
    const ex = addExState.form;
    if (!ex.name.trim()) { Alert.alert('Required', 'Exercise name is required.'); return; }
    const initSets = ex.type === 'cardio' ? '[{"done":false}]' : '[]';
    await addExercise({
      id: Crypto.randomUUID(),
      session_id: sessionId,
      name: ex.name.trim(),
      type: ex.type,
      sets: initSets,
      duration: ex.duration ? parseInt(ex.duration) : null,
      distance: ex.distance ? parseFloat(ex.distance) : null,
      cardio_type: ex.cardio_type || null,
    });
    setAddExState({ sessionId: null, form: EMPTY_EX, nameQuery: '' });
    await loadSessions();
  };

  const handleUpdateSets = async (exerciseId, newSets) => {
    const ex = Object.values(exercises).flat().find(e => e.id === exerciseId);
    if (!ex) return;
    await updateExercise(exerciseId, { ...ex, sets: newSets });
    await loadSessions();
  };

  const handleUpdateExercise = async (exerciseId, updates) => {
    await updateExercise(exerciseId, updates);
    await loadSessions();
  };

  const handleDeleteExercise = (exerciseId) => {
    Alert.alert('Delete exercise?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteExercise(exerciseId);
          await loadSessions();
        },
      },
    ]);
  };

  const handleAddMedia = async (session) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to your photo library to attach media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (result.canceled) return;
    const existing = JSON.parse(session.media_uris || '[]');
    const merged = [...existing, ...result.assets.map(a => a.uri)];
    await updateWorkoutSession(session.id, {
      ...session,
      media_uris: JSON.stringify(merged),
    });
    await loadSessions();
  };

  const handleDeleteMedia = async (session, index) => {
    Alert.alert('Remove media?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          const existing = JSON.parse(session.media_uris || '[]');
          existing.splice(index, 1);
          await updateWorkoutSession(session.id, {
            ...session,
            media_uris: JSON.stringify(existing),
          });
          await loadSessions();
        },
      },
    ]);
  };

  const getProgress = (sessionId) => {
    const exList = exercises[sessionId] || [];
    let total = 0, done = 0;
    exList.forEach(ex => {
      const sets = JSON.parse(ex.sets || '[]');
      if (ex.type === 'strength') {
        total += sets.length;
        done += sets.filter(s => s.done).length;
      } else {
        total += 1;
        if (sets.length > 0 && sets[0].done) done += 1;
      }
    });
    return { total, done };
  };

  const filteredPresetsModal = exNameQuery.length > 0
    ? STRENGTH_PRESETS.filter(p => p.toLowerCase().includes(exNameQuery.toLowerCase()))
    : [];

  const filteredPresetsInline = (addExState.nameQuery || '').length > 0
    ? STRENGTH_PRESETS.filter(p => p.toLowerCase().includes(addExState.nameQuery.toLowerCase()))
    : [];

  const canNextWeek = weekDays[6] < today;

  return (
    <View style={styles.container}>
      {/* ── Weekly strip ── */}
      <View style={styles.weekStripWrapper}>
        <View style={styles.weekHeader}>
          <TouchableOpacity onPress={() => changeWeek(-1)} style={styles.weekNavBtn}>
            <Text style={styles.weekNavArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{weekMonthLabel(weekDays)}</Text>
          <TouchableOpacity onPress={() => changeWeek(1)} style={styles.weekNavBtn} disabled={!canNextWeek}>
            <Text style={[styles.weekNavArrow, !canNextWeek && styles.navDisabled]}>›</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.weekDaysRow}>
          {weekDays.map((day, i) => {
            const isSelected = day === selectedWorkoutDate;
            const isToday = day === today;
            const isFuture = day > today;
            const dot = dotData[day];
            const dateNum = new Date(day + 'T00:00:00').getDate();
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayCell, isSelected && styles.dayCellSelected, isFuture && styles.dayCellFuture]}
                onPress={() => !isFuture && setSelectedWorkoutDate(day)}
                disabled={isFuture}
              >
                <Text style={[styles.dayLetter, isSelected && styles.dayTextSelected, isFuture && styles.futureText]}>
                  {DAY_LETTERS[i]}
                </Text>
                <Text style={[
                  styles.dayNum,
                  isSelected && styles.dayTextSelected,
                  isToday && !isSelected && styles.todayNum,
                  isFuture && styles.futureText,
                ]}>
                  {dateNum}
                </Text>
                <View style={[
                  styles.dot,
                  dot?.hasSessions && dot?.allComplete && styles.dotGreen,
                  dot?.hasSessions && !dot?.allComplete && styles.dotOrange,
                ]} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Session list ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      >
        {sessions.length === 0 && (
          <Text style={styles.empty}>No workouts logged for this day.</Text>
        )}

        {sessions.map(session => {
          const { total, done } = getProgress(session.id);
          const exList = exercises[session.id] || [];
          const isExpanded = expandedSessionId === session.id;
          const mediaUris = JSON.parse(session.media_uris || '[]');
          const isAddingEx = addExState.sessionId === session.id;

          return (
            <View key={session.id}>
              <WorkoutSessionCard
                session={session}
                exerciseCount={exList.length}
                completedSets={done}
                totalSets={total}
                isExpanded={isExpanded}
                onPress={() => setExpandedSessionId(isExpanded ? null : session.id)}
                onToggleComplete={() => handleToggleComplete(session)}
                onDelete={() => handleDeleteSession(session.id)}
              />

              {isExpanded && (
                <View style={styles.expandedContent}>
                  {/* Exercises */}
                  {exList.map(ex => (
                    <ExerciseRow
                      key={ex.id}
                      exercise={ex}
                      sessionDate={selectedWorkoutDate}
                      onUpdateSets={(sets) => handleUpdateSets(ex.id, sets)}
                      onUpdate={(updates) => handleUpdateExercise(ex.id, updates)}
                      onDelete={() => handleDeleteExercise(ex.id)}
                    />
                  ))}

                  {/* Inline add exercise form */}
                  {isAddingEx ? (
                    <View style={styles.addExForm}>
                      <Text style={styles.addExFormTitle}>Add Exercise</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Exercise name"
                        placeholderTextColor={colors.textSecondary}
                        value={addExState.form.name}
                        onChangeText={v => setAddExState(p => ({ ...p, form: { ...p.form, name: v }, nameQuery: v }))}
                        autoFocus
                      />
                      {filteredPresetsInline.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                          {filteredPresetsInline.map(p => (
                            <TouchableOpacity
                              key={p}
                              style={styles.presetChip}
                              onPress={() => setAddExState(prev => ({ ...prev, form: { ...prev.form, name: p }, nameQuery: '' }))}
                            >
                              <Text style={styles.presetChipText}>{p}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                      <View style={styles.chipRow}>
                        {['strength', 'cardio'].map(t => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.chip, addExState.form.type === t && styles.chipActive]}
                            onPress={() => setAddExState(p => ({ ...p, form: { ...p.form, type: t } }))}
                          >
                            <Text style={[styles.chipText, addExState.form.type === t && styles.chipTextActive]}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {addExState.form.type === 'cardio' && (
                        <>
                          <View style={styles.chipRow}>
                            {CARDIO_TYPES.map(ct => (
                              <TouchableOpacity
                                key={ct}
                                style={[styles.chip, addExState.form.cardio_type === ct && styles.chipActive]}
                                onPress={() => setAddExState(p => ({ ...p, form: { ...p.form, cardio_type: ct } }))}
                              >
                                <Text style={[styles.chipText, addExState.form.cardio_type === ct && styles.chipTextActive]}>{ct}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <View style={styles.inputRow}>
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              placeholder="Duration (min)"
                              placeholderTextColor={colors.textSecondary}
                              value={addExState.form.duration}
                              onChangeText={v => setAddExState(p => ({ ...p, form: { ...p.form, duration: v } }))}
                              keyboardType="numeric"
                            />
                            <TextInput
                              style={[styles.input, { flex: 1 }]}
                              placeholder="Distance (km)"
                              placeholderTextColor={colors.textSecondary}
                              value={addExState.form.distance}
                              onChangeText={v => setAddExState(p => ({ ...p, form: { ...p.form, distance: v } }))}
                              keyboardType="numeric"
                            />
                          </View>
                        </>
                      )}
                      <View style={styles.btnRow}>
                        <TouchableOpacity
                          style={styles.ghostBtn}
                          onPress={() => setAddExState({ sessionId: null, form: EMPTY_EX, nameQuery: '' })}
                        >
                          <Text style={styles.ghostBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.solidBtn, { flex: 1 }]}
                          onPress={() => handleAddExerciseToSession(session.id)}
                        >
                          <Text style={styles.solidBtnText}>Add Exercise</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addExBtn}
                      onPress={() => setAddExState({ sessionId: session.id, form: EMPTY_EX, nameQuery: '' })}
                    >
                      <Text style={styles.addExBtnText}>+ Add Exercise</Text>
                    </TouchableOpacity>
                  )}

                  {/* Media gallery */}
                  <View style={styles.mediaSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {mediaUris.map((uri, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setMediaUri(uri)}
                          onLongPress={() => handleDeleteMedia(session, idx)}
                          style={styles.thumbWrapper}
                        >
                          <Image source={{ uri }} style={styles.thumbnail} />
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity style={styles.addMediaBtn} onPress={() => handleAddMedia(session)}>
                        <Text style={styles.addMediaIcon}>+</Text>
                        <Text style={styles.addMediaLabel}>Photo{'\n'}/ Video</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>

                  {/* Mark Complete */}
                  <TouchableOpacity
                    style={[styles.completeBtn, session.complete && styles.completeBtnDone]}
                    onPress={() => handleToggleComplete(session)}
                  >
                    <Text style={[styles.completeBtnText, session.complete && styles.completeBtnTextDone]}>
                      {session.complete ? '✓  Session Complete' : 'Mark Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.newSessionBtn} onPress={openSessionModal}>
          <Text style={styles.newSessionBtnText}>+ New Session</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Session creation modal (3 steps) ── */}
      <Modal visible={sessionModal} transparent animationType="slide" onRequestClose={() => setSessionModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            {/* Step indicator */}
            <View style={styles.stepsRow}>
              {[1, 2, 3].map(s => (
                <View key={s} style={[styles.stepDot, sessionStep >= s && styles.stepDotActive]} />
              ))}
            </View>

            {sessionStep === 1 && (
              <>
                <Text style={styles.sheetTitle}>Session Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Morning Lift"
                  placeholderTextColor={colors.textSecondary}
                  value={draftName}
                  onChangeText={setDraftName}
                  autoFocus
                />
                <TouchableOpacity style={styles.solidBtn} onPress={handleSessionStep1Next}>
                  <Text style={styles.solidBtnText}>Next →</Text>
                </TouchableOpacity>
              </>
            )}

            {sessionStep === 2 && (
              <>
                <Text style={styles.sheetTitle}>Session Type</Text>
                <View style={styles.typeGrid}>
                  {SESSION_TYPES.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.typeBtn, draftType === t && styles.typeBtnActive]}
                      onPress={() => setDraftType(t)}
                    >
                      <Text style={[styles.typeBtnText, draftType === t && styles.typeBtnTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.ghostBtn} onPress={() => setSessionStep(1)}>
                    <Text style={styles.ghostBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.solidBtn, { flex: 1 }]} onPress={() => setSessionStep(3)}>
                    <Text style={styles.solidBtnText}>Next →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {sessionStep === 3 && (
              <>
                <Text style={styles.sheetTitle}>Add Exercises</Text>
                <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                  {pendingExercises.map((ex, i) => (
                    <View key={ex.tempId} style={styles.pendingExItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pendingExName}>{ex.name}</Text>
                        <Text style={styles.pendingExMeta}>
                          {ex.type === 'cardio'
                            ? [ex.cardio_type, ex.duration && `${ex.duration}min`, ex.distance && `${ex.distance}km`].filter(Boolean).join(' · ')
                            : 'Strength'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setPendingExercises(prev => prev.filter((_, j) => j !== i))}>
                        <Text style={styles.removeExText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>

                {!exSubform ? (
                  <TouchableOpacity style={styles.addExBtn} onPress={() => setExSubform(true)}>
                    <Text style={styles.addExBtnText}>+ Add Exercise</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.exSubform}>
                    <TextInput
                      style={styles.input}
                      placeholder="Exercise name"
                      placeholderTextColor={colors.textSecondary}
                      value={draftEx.name}
                      onChangeText={v => { setDraftEx(p => ({ ...p, name: v })); setExNameQuery(v); }}
                      autoFocus
                    />
                    {filteredPresetsModal.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                        {filteredPresetsModal.map(p => (
                          <TouchableOpacity
                            key={p}
                            style={styles.presetChip}
                            onPress={() => { setDraftEx(prev => ({ ...prev, name: p })); setExNameQuery(''); }}
                          >
                            <Text style={styles.presetChipText}>{p}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                    <View style={styles.chipRow}>
                      {['strength', 'cardio'].map(t => (
                        <TouchableOpacity
                          key={t}
                          style={[styles.chip, draftEx.type === t && styles.chipActive]}
                          onPress={() => setDraftEx(p => ({ ...p, type: t }))}
                        >
                          <Text style={[styles.chipText, draftEx.type === t && styles.chipTextActive]}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {draftEx.type === 'cardio' && (
                      <>
                        <View style={styles.chipRow}>
                          {CARDIO_TYPES.map(ct => (
                            <TouchableOpacity
                              key={ct}
                              style={[styles.chip, draftEx.cardio_type === ct && styles.chipActive]}
                              onPress={() => setDraftEx(p => ({ ...p, cardio_type: ct }))}
                            >
                              <Text style={[styles.chipText, draftEx.cardio_type === ct && styles.chipTextActive]}>{ct}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.inputRow}>
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Duration (min)"
                            placeholderTextColor={colors.textSecondary}
                            value={draftEx.duration}
                            onChangeText={v => setDraftEx(p => ({ ...p, duration: v }))}
                            keyboardType="numeric"
                          />
                          <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Distance (km)"
                            placeholderTextColor={colors.textSecondary}
                            value={draftEx.distance}
                            onChangeText={v => setDraftEx(p => ({ ...p, distance: v }))}
                            keyboardType="numeric"
                          />
                        </View>
                      </>
                    )}
                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.ghostBtn}
                        onPress={() => { setExSubform(false); setDraftEx(EMPTY_EX); setExNameQuery(''); }}
                      >
                        <Text style={styles.ghostBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.solidBtn, { flex: 1 }]} onPress={handleAddPendingEx}>
                        <Text style={styles.solidBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={[styles.btnRow, { marginTop: spacing.md }]}>
                  <TouchableOpacity style={styles.ghostBtn} onPress={() => setSessionStep(2)}>
                    <Text style={styles.ghostBtnText}>← Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.solidBtn, { flex: 1 }]} onPress={handleSaveSession}>
                    <Text style={styles.solidBtnText}>Save Session</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.ghostBtn} onPress={() => setSessionModal(false)}>
              <Text style={[styles.ghostBtnText, { textAlign: 'center' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Fullscreen media viewer ── */}
      <Modal visible={!!mediaUri} transparent animationType="fade" onRequestClose={() => setMediaUri(null)}>
        <TouchableOpacity style={styles.mediaViewer} onPress={() => setMediaUri(null)} activeOpacity={1}>
          {mediaUri && (
            <Image source={{ uri: mediaUri }} style={styles.mediaFullscreen} resizeMode="contain" />
          )}
          <Text style={styles.mediaViewerClose}>✕  tap to close</Text>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Week strip
  weekStripWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: 52,
    paddingBottom: spacing.sm,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  weekNavBtn: { padding: spacing.sm },
  weekNavArrow: { color: colors.textPrimary, fontSize: 24, fontWeight: '300' },
  navDisabled: { opacity: 0.25 },
  monthLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  dayCell: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: 10,
    minWidth: 38,
  },
  dayCellSelected: { backgroundColor: colors.accent },
  dayCellFuture: { opacity: 0.3 },
  dayLetter: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightMedium,
  },
  dayNum: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
    marginTop: 2,
  },
  dayTextSelected: { color: colors.background },
  todayNum: { color: colors.accent },
  futureText: { color: colors.textSecondary },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  dotGreen: { backgroundColor: colors.accent },
  dotOrange: { backgroundColor: '#FF9800' },

  // Content
  scrollContent: { padding: spacing.lg, paddingBottom: 40 },
  empty: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMD,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },

  // Expanded session
  expandedContent: {
    marginHorizontal: spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
  },

  // Add exercise
  addExBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent + '55',
    borderStyle: 'dashed',
    marginBottom: spacing.sm,
  },
  addExBtnText: {
    color: colors.accent,
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
  },
  addExForm: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addExFormTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightSemiBold,
    marginBottom: spacing.sm,
  },

  // Media
  mediaSection: { marginVertical: spacing.sm },
  thumbWrapper: { marginRight: spacing.sm },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  addMediaBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMediaIcon: {
    color: colors.textSecondary,
    fontSize: 20,
  },
  addMediaLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },

  // Complete button
  completeBtn: {
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  completeBtnDone: {
    backgroundColor: colors.accent + '22',
  },
  completeBtnText: {
    color: colors.accent,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
  },
  completeBtnTextDone: {
    color: colors.accent,
  },

  // New session
  newSessionBtn: {
    marginTop: spacing.md,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
  },
  newSessionBtnText: {
    color: colors.accent,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightSemiBold,
  },

  // Modal / sheet
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: { backgroundColor: colors.accent },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
    marginBottom: spacing.lg,
  },

  // Type grid (step 2)
  typeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  typeBtnText: { color: colors.textSecondary, fontSize: typography.fontSizeSM, fontWeight: typography.fontWeightSemiBold },
  typeBtnTextActive: { color: colors.background },

  // Pending exercises list (step 3)
  pendingExItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pendingExName: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeSM,
    fontWeight: typography.fontWeightMedium,
  },
  pendingExMeta: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginTop: 2 },
  removeExText: { color: colors.textSecondary, fontSize: 22, paddingHorizontal: spacing.xs },

  exSubform: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: spacing.md,
    marginVertical: spacing.sm,
  },

  // Preset chips
  presetScroll: { marginBottom: spacing.sm },
  presetChip: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  presetChipText: { color: colors.accent, fontSize: typography.fontSizeXS },

  // Generic form elements
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSizeMD,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputRow: { flexDirection: 'row', gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: typography.fontSizeXS },
  chipTextActive: { color: colors.background, fontWeight: typography.fontWeightSemiBold },

  btnRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  solidBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  solidBtnText: {
    color: colors.background,
    fontSize: typography.fontSizeMD,
    fontWeight: typography.fontWeightBold,
  },
  ghostBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  ghostBtnText: { color: colors.textSecondary, fontSize: typography.fontSizeMD },

  // Media fullscreen
  mediaViewer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaFullscreen: { width: '100%', height: '85%' },
  mediaViewerClose: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    marginTop: spacing.lg,
  },
});
