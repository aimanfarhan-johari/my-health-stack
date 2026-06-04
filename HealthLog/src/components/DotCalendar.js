import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';
import { getDaysInMonth } from '../utils/dateUtils';
import useStore from '../store/useStore';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DOT_SIZE = 30;

export default function DotCalendar({ activeDates = [], onDayPress }) {
  const { currentMonth, setCurrentMonth } = useStore();
  const { year, month } = currentMonth;

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const activeSet = useMemo(() => new Set(activeDates), [activeDates]);

  // Monday-based offset
  const firstDow = useMemo(() => {
    const d = new Date(year, month - 1, 1).getDay();
    return d === 0 ? 6 : d - 1;
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) setCurrentMonth({ year: year - 1, month: 12 });
    else setCurrentMonth({ year, month: month - 1 });
  };

  const nextMonth = () => {
    if (month === 12) setCurrentMonth({ year: year + 1, month: 1 });
    else setCurrentMonth({ year, month: month + 1 });
  };

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  days.forEach(d => cells.push(d));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dayRow}>
        {DAY_LABELS.map(l => (
          <View key={l} style={styles.dayCell}>
            <Text style={styles.dayLabel}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={`empty-${i}`} style={styles.dayCell} />;
          const day = Number(iso.split('-')[2]);
          const active = activeSet.has(iso);
          return (
            <TouchableOpacity
              key={iso}
              style={styles.dayCell}
              onPress={() => onDayPress?.(iso)}
              activeOpacity={0.7}
            >
              <View style={[styles.dot, active && styles.dotActive]}>
                <Text style={[styles.dayNum, active && styles.dayNumActive]}>{day}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navBtn: { padding: spacing.sm },
  navArrow: { color: colors.textPrimary, fontSize: 24, fontWeight: '300' },
  monthLabel: { color: colors.textPrimary, fontSize: typography.fontSizeLG, fontWeight: typography.fontWeightSemiBold },
  dayRow: { flexDirection: 'row', marginBottom: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: spacing.xs },
  dayLabel: { color: colors.textSecondary, fontSize: typography.fontSizeXS, marginBottom: 2 },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotActive: { backgroundColor: colors.accent },
  dayNum: { color: colors.textSecondary, fontSize: typography.fontSizeSM },
  dayNumActive: { color: colors.background, fontWeight: typography.fontWeightBold },
});
