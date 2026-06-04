import { getDB } from '../database';

export async function getMetricsByDate(date) {
  const db = getDB();
  return await db.getAllAsync('SELECT * FROM health_metrics WHERE date = ? ORDER BY rowid ASC', [date]);
}

export async function getMetricHistory(metric, limit = 90) {
  const db = getDB();
  return await db.getAllAsync(
    'SELECT * FROM health_metrics WHERE metric = ? ORDER BY date DESC LIMIT ?',
    [metric, limit]
  );
}

export async function addMetricEntry(entry) {
  const db = getDB();
  const { id, date, metric, value, unit } = entry;
  await db.runAsync(
    'INSERT INTO health_metrics (id, date, metric, value, unit) VALUES (?, ?, ?, ?, ?)',
    [id, date, metric, value, unit]
  );
}

export async function updateMetricEntry(id, value) {
  const db = getDB();
  await db.runAsync('UPDATE health_metrics SET value = ? WHERE id = ?', [value, id]);
}

export async function deleteMetricEntry(id) {
  const db = getDB();
  await db.runAsync('DELETE FROM health_metrics WHERE id = ?', [id]);
}

export async function getMetricDates() {
  const db = getDB();
  const rows = await db.getAllAsync('SELECT DISTINCT date FROM health_metrics ORDER BY date DESC');
  return rows.map(r => r.date);
}

export async function getLatestMetricValue(metric) {
  const db = getDB();
  return await db.getFirstAsync(
    'SELECT * FROM health_metrics WHERE metric = ? ORDER BY date DESC LIMIT 1',
    [metric]
  );
}
