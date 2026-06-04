import { getDB } from '../database';

export async function getSessionsByDate(date) {
  const db = getDB();
  return await db.getAllAsync('SELECT * FROM workout_sessions WHERE date = ? ORDER BY rowid ASC', [date]);
}

export async function addWorkoutSession(session) {
  const db = getDB();
  const { id, date, name, type, notes } = session;
  await db.runAsync(
    'INSERT INTO workout_sessions (id, date, name, type, notes, complete, media_uris) VALUES (?, ?, ?, ?, ?, 0, ?)',
    [id, date, name, type, notes ?? null, '[]']
  );
}

export async function updateWorkoutSession(id, updates) {
  const db = getDB();
  const { name, type, complete, notes, media_uris } = updates;
  await db.runAsync(
    'UPDATE workout_sessions SET name=?, type=?, complete=?, notes=?, media_uris=? WHERE id=?',
    [name, type, complete ? 1 : 0, notes ?? null, media_uris ?? '[]', id]
  );
}

export async function deleteWorkoutSession(id) {
  const db = getDB();
  await db.runAsync('DELETE FROM exercises WHERE session_id = ?', [id]);
  await db.runAsync('DELETE FROM workout_sessions WHERE id = ?', [id]);
}

export async function getExercisesBySession(sessionId) {
  const db = getDB();
  return await db.getAllAsync('SELECT * FROM exercises WHERE session_id = ? ORDER BY rowid ASC', [sessionId]);
}

export async function addExercise(exercise) {
  const db = getDB();
  const { id, session_id, name, type, sets, duration, distance, cardio_type } = exercise;
  await db.runAsync(
    'INSERT INTO exercises (id, session_id, name, type, sets, duration, distance, cardio_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, session_id, name, type, sets ?? '[]', duration ?? null, distance ?? null, cardio_type ?? null]
  );
}

export async function updateExercise(id, updates) {
  const db = getDB();
  const { name, type, sets, duration, distance, cardio_type } = updates;
  await db.runAsync(
    'UPDATE exercises SET name=?, type=?, sets=?, duration=?, distance=?, cardio_type=? WHERE id=?',
    [name, type, sets ?? '[]', duration ?? null, distance ?? null, cardio_type ?? null, id]
  );
}

export async function deleteExercise(id) {
  const db = getDB();
  await db.runAsync('DELETE FROM exercises WHERE id = ?', [id]);
}

export async function getWorkoutDates() {
  const db = getDB();
  const rows = await db.getAllAsync('SELECT DISTINCT date FROM workout_sessions ORDER BY date DESC');
  return rows.map(r => r.date);
}

export async function getWorkoutSummaryForMonth(yearMonth) {
  const db = getDB();
  return await db.getAllAsync(
    'SELECT date, MIN(complete) as allComplete, COUNT(*) as sessionCount FROM workout_sessions WHERE date LIKE ? GROUP BY date',
    [`${yearMonth}%`]
  );
}

export async function getWorkoutDotDataForDates(dates) {
  if (!dates || dates.length === 0) return {};
  const db = getDB();
  const placeholders = dates.map(() => '?').join(',');
  const rows = await db.getAllAsync(
    `SELECT date, MIN(complete) as allComplete, COUNT(*) as sessionCount FROM workout_sessions WHERE date IN (${placeholders}) GROUP BY date`,
    dates
  );
  const map = {};
  rows.forEach(r => {
    map[r.date] = { hasSessions: r.sessionCount > 0, allComplete: r.allComplete === 1 };
  });
  return map;
}

export async function getPreviousSetsForExercise(name, beforeDate) {
  const db = getDB();
  const row = await db.getFirstAsync(
    `SELECT e.sets FROM exercises e
     JOIN workout_sessions ws ON e.session_id = ws.id
     WHERE e.name = ? AND ws.date < ? AND e.type = 'strength'
     ORDER BY ws.date DESC LIMIT 1`,
    [name, beforeDate]
  );
  return row ? JSON.parse(row.sets || '[]') : [];
}
