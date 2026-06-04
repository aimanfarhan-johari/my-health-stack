export function calcCaloriesFromMacros(protein, carbs, fat) {
  return protein * 4 + carbs * 4 + fat * 9;
}

export function macroPercent(value, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

export function remainingMacros(entries, goals) {
  const totals = sumMacros(entries);
  return {
    calories: goals.calories - totals.calories,
    protein: goals.protein - totals.protein,
    carbs: goals.carbs - totals.carbs,
    fat: goals.fat - totals.fat,
  };
}

export function sumMacros(entries) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      carbs: acc.carbs + (e.carbs || 0),
      fat: acc.fat + (e.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
