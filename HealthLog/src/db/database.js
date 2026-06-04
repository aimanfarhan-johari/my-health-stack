import * as SQLite from 'expo-sqlite';

let db;

export function getDB() {
  if (!db) {
    db = SQLite.openDatabaseSync('healthlog.db');
  }
  return db;
}

export async function initDatabase() {
  const database = getDB();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      daily_calorie_goal INTEGER DEFAULT 2000,
      protein_goal INTEGER DEFAULT 150,
      carbs_goal INTEGER DEFAULT 200,
      fat_goal INTEGER DEFAULT 65,
      water_goal REAL DEFAULT 3.0,
      weight_unit TEXT DEFAULT 'kg',
      distance_unit TEXT DEFAULT 'km',
      weight_target REAL,
      body_fat_target REAL,
      ldl_target REAL,
      total_cholesterol_target REAL,
      muscle_mass_target REAL
    );

    CREATE TABLE IF NOT EXISTS food_entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      meal TEXT NOT NULL,
      food_name TEXT NOT NULL,
      serving_size TEXT,
      calories REAL NOT NULL,
      protein REAL DEFAULT 0,
      carbs REAL DEFAULT 0,
      fat REAL DEFAULT 0,
      source TEXT DEFAULT 'manual'
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      complete INTEGER DEFAULT 0,
      notes TEXT,
      media_uris TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      sets TEXT DEFAULT '[]',
      duration INTEGER,
      distance REAL,
      cardio_type TEXT,
      FOREIGN KEY(session_id) REFERENCES workout_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS health_metrics (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL
    );
  `);

  // Seed default settings row if not present
  const existing = await database.getFirstAsync('SELECT id FROM settings WHERE id = 1');
  if (!existing) {
    await database.runAsync('INSERT INTO settings (id) VALUES (1)');
  }
}
