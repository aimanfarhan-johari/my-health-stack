import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../constants/theme';
import { getDaysInMonth, todayISO } from '../utils/dateUtils';
import useStore from '../store/useStore';

const DOT_SIZE = 36;
const DOT_GAP = 8;
const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function TodayDot({ day, iso, isGreen, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <TouchableOpacity onPress={() => onPress?.(iso)} activeOpacity={0.7}>
      <Animated.View
        style={[
          styles.dot,
          isGreen ? styles.dotGreen : styles.dotGrey,
          styles.dotTodayBorder,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={[styles.dayNum, isGreen ? styles.dayNumGreen : styles.dayNumToday]}>
          {day}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function DotCalendar({ greenDates = new Set(), onDayPress }) {
  const { currentMonth, setCurrentMonth } = useStore();
  const { year, month } = currentMonth;
  const today = todayISO();

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);

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

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  days.forEach(d => cells.push(d));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.labelRow}>
        {DAY_LABELS.map(l => (
          <View key={l} style={styles.labelCell}>
            <Text style={styles.dayLabel}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((iso, i) => {
          if (!iso) return <View key={`e-${i}`} style={styles.emptyCell} />;

          const day = Number(iso.split('-')[2]);
          const isToday = iso === today;
          const isGreen = greenDates.has(iso);

          if (isToday) {
            return (
              <TodayDot key={iso} day={day} iso={iso} isGreen={isGreen} onPress={onDayPress} />
            );
          }

          return (
            <TouchableOpacity key={iso} onPress={() => onDayPress?.(iso)} activeOpacity={0.7}>
              <View style={[styles.dot, isGreen ? styles.dotGreen : styles.dotGrey]}>
                <Text style={[styles.dayNum, isGreen && styles.dayNumGreen]}>{day}</Text>
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
  navBtn: { padding: spacing.xs },
  navArrow: { color: colors.textPrimary, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  monthLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSizeLG,
    fontWeight: typography.fontWeightSemiBold,
  },
  labelRow: {
    flexDirection: 'row',
    gap: DOT_GAP,
    marginBottom: spacing.sm,
  },
  labelCell: {
    width: DOT_SIZE,
    alignItems: 'center',
  },
  dayLabel: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXS,
    fontWeight: typography.fontWeightMedium,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DOT_GAP,
  },
  emptyCell: { width: DOT_SIZE, height: DOT_SIZE },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotGrey: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dotGreen: {
    backgroundColor: colors.accent,
    borderWidth: 0,
  },
  dotTodayBorder: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  dayNum: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSM,
  },
  dayNumGreen: {
    color: colors.background,
    fontWeight: typography.fontWeightBold,
  },
  dayNumToday: {
    color: colors.accent,
    fontWeight: typography.fontWeightSemiBold,
  },
});
