export const METRIC_DEFINITIONS = [
  { key: 'weight', label: 'Weight', unit: 'kg', color: '#4CAF50', targetKey: 'weight' },
  { key: 'body_fat', label: 'Body Fat', unit: '%', color: '#FF9800', targetKey: 'bodyFat' },
  { key: 'muscle_mass', label: 'Muscle Mass', unit: 'kg', color: '#2196F3', targetKey: 'muscleMass' },
  { key: 'ldl', label: 'LDL Cholesterol', unit: 'mmol/L', color: '#F44336', targetKey: 'ldl' },
  { key: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mmol/L', color: '#E91E63', targetKey: 'totalCholesterol' },
  { key: 'blood_pressure_sys', label: 'Blood Pressure (Sys)', unit: 'mmHg', color: '#9C27B0', targetKey: null },
  { key: 'blood_pressure_dia', label: 'Blood Pressure (Dia)', unit: 'mmHg', color: '#673AB7', targetKey: null },
  { key: 'resting_heart_rate', label: 'Resting Heart Rate', unit: 'bpm', color: '#FF5722', targetKey: null },
  { key: 'blood_glucose', label: 'Blood Glucose', unit: 'mmol/L', color: '#FF9800', targetKey: null },
  { key: 'vo2_max', label: 'VO2 Max', unit: 'ml/kg/min', color: '#00BCD4', targetKey: null },
  { key: 'sleep_hours', label: 'Sleep', unit: 'hrs', color: '#3F51B5', targetKey: null },
  { key: 'steps', label: 'Steps', unit: 'steps', color: '#8BC34A', targetKey: null },
  { key: 'water', label: 'Water', unit: 'L', color: '#03A9F4', targetKey: null },
];

export const METRIC_BY_KEY = Object.fromEntries(METRIC_DEFINITIONS.map(m => [m.key, m]));
