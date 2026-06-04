import { getDB } from '../database';

export async function getFoodEntriesByDate(date) {
  const db = getDB();
  return await db.getAllAsync('SELECT * FROM food_entries WHERE date = ? ORDER BY rowid ASC', [date]);
}

export async function addFoodEntry(entry) {
  const db = getDB();
  const { id, date, meal, food_name, serving_size, calories, protein, carbs, fat, source } = entry;
  await db.runAsync(
    'INSERT INTO food_entries (id, date, meal, food_name, serving_size, calories, protein, carbs, fat, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, date, meal, food_name, serving_size ?? null, calories, protein ?? 0, carbs ?? 0, fat ?? 0, source ?? 'manual']
  );
}

export async function updateFoodEntry(id, updates) {
  const db = getDB();
  const { food_name, serving_size, calories, protein, carbs, fat } = updates;
  await db.runAsync(
    'UPDATE food_entries SET food_name=?, serving_size=?, calories=?, protein=?, carbs=?, fat=? WHERE id=?',
    [food_name, serving_size ?? null, calories, protein ?? 0, carbs ?? 0, fat ?? 0, id]
  );
}

export async function deleteFoodEntry(id) {
  const db = getDB();
  await db.runAsync('DELETE FROM food_entries WHERE id = ?', [id]);
}

export async function getFoodLogDates() {
  const db = getDB();
  const rows = await db.getAllAsync('SELECT DISTINCT date FROM food_entries ORDER BY date DESC');
  return rows.map(r => r.date);
}

export async function getFoodSummaryForMonth(yearMonth) {
  const db = getDB();
  return await db.getAllAsync(
    'SELECT date, SUM(calories) as totalCalories, SUM(protein) as totalProtein, SUM(carbs) as totalCarbs, SUM(fat) as totalFat FROM food_entries WHERE date LIKE ? GROUP BY date',
    [`${yearMonth}%`]
  );
}
