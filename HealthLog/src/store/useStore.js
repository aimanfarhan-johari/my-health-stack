import { create } from 'zustand';
import { getDB } from '../db/database';
import { todayISO } from '../utils/dateUtils';

const today = todayISO();
const now = new Date();

const useStore = create((set, get) => ({
  settings: {
    dailyCalorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 65,
    waterGoal: 3.0,
    weightUnit: 'kg',
    distanceUnit: 'km',
    metricTargets: {
      weight: null,
      bodyFat: null,
      ldl: null,
      totalCholesterol: null,
      muscleMass: null,
    },
  },
  selectedDate: today,
  selectedWorkoutDate: today,
  currentMonth: { year: now.getFullYear(), month: now.getMonth() + 1 },

  loadSettings: async () => {
    const db = getDB();
    const row = await db.getFirstAsync('SELECT * FROM settings WHERE id = 1');
    if (!row) return;
    set({
      settings: {
        dailyCalorieGoal: row.daily_calorie_goal,
        proteinGoal: row.protein_goal,
        carbsGoal: row.carbs_goal,
        fatGoal: row.fat_goal,
        waterGoal: row.water_goal,
        weightUnit: row.weight_unit,
        distanceUnit: row.distance_unit,
        metricTargets: {
          weight: row.weight_target,
          bodyFat: row.body_fat_target,
          ldl: row.ldl_target,
          totalCholesterol: row.total_cholesterol_target,
          muscleMass: row.muscle_mass_target,
        },
      },
    });
  },

  updateSettings: async (partial) => {
    const db = getDB();
    const { settings } = get();
    const merged = {
      ...settings,
      ...partial,
      metricTargets: { ...settings.metricTargets, ...(partial.metricTargets || {}) },
    };
    set({ settings: merged });
    await db.runAsync(
      `UPDATE settings SET
        daily_calorie_goal=?, protein_goal=?, carbs_goal=?, fat_goal=?,
        water_goal=?, weight_unit=?, distance_unit=?,
        weight_target=?, body_fat_target=?, ldl_target=?,
        total_cholesterol_target=?, muscle_mass_target=?
       WHERE id=1`,
      [
        merged.dailyCalorieGoal,
        merged.proteinGoal,
        merged.carbsGoal,
        merged.fatGoal,
        merged.waterGoal,
        merged.weightUnit,
        merged.distanceUnit,
        merged.metricTargets.weight ?? null,
        merged.metricTargets.bodyFat ?? null,
        merged.metricTargets.ldl ?? null,
        merged.metricTargets.totalCholesterol ?? null,
        merged.metricTargets.muscleMass ?? null,
      ]
    );
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedWorkoutDate: (date) => set({ selectedWorkoutDate: date }),
  setCurrentMonth: ({ year, month }) => set({ currentMonth: { year, month } }),
}));

export default useStore;
