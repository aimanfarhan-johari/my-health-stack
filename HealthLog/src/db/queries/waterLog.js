import { getDB } from '../database';

export async function getWaterForDate(date) {
  const db = getDB();
  const row = await db.getFirstAsync('SELECT amount_ml FROM water_log WHERE date = ?', [date]);
  return row?.amount_ml ?? 0;
}

export async function addWater(date, addMl) {
  const db = getDB();
  await db.runAsync(
    `INSERT INTO water_log (date, amount_ml) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET amount_ml = amount_ml + excluded.amount_ml`,
    [date, addMl]
  );
}

export async function setWater(date, totalMl) {
  const db = getDB();
  await db.runAsync(
    `INSERT INTO water_log (date, amount_ml) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET amount_ml = excluded.amount_ml`,
    [date, totalMl]
  );
}
