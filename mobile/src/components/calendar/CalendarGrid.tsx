import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export type CalendarGridProps = {
  visibleMonth: Date;
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: Date) => void;
  renderDayCell: (date: Date, isSelected: boolean, isMuted: boolean) => React.ReactNode;
  containerStyle?: ViewStyle;
  cellWrapperStyle?: ViewStyle;
  showWeekDaysHeader?: boolean;
};

export function toDate(dateKey: string) {
  const [year = 1970, month = 1, day = 1] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function buildMonthWeeks(monthDate: Date) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstVisible = new Date(firstDay);
  firstVisible.setDate(firstDay.getDate() - firstDay.getDay());
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const lastVisible = new Date(lastDay);
  lastVisible.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  const dayCount = Math.round((lastVisible.getTime() - firstVisible.getTime()) / 86400000) + 1;

  return Array.from({ length: dayCount / 7 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(firstVisible);
      date.setDate(firstVisible.getDate() + weekIndex * 7 + dayIndex);
      return date;
    })
  );
}

export function CalendarGrid({
  visibleMonth,
  selectedDate,
  onSelectDate,
  renderDayCell,
  containerStyle,
  cellWrapperStyle,
  showWeekDaysHeader = true,
}: CalendarGridProps) {
  const monthWeeks = useMemo(() => buildMonthWeeks(visibleMonth), [visibleMonth]);

  return (
    <View style={[styles.container, containerStyle]}>
      {showWeekDaysHeader && (
        <View style={styles.weekHeaderRow}>
          {WEEK_DAYS.map((day) => (
            <Text key={day} style={styles.weekdayLabel}>
              {day}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.gridContainer}>
        {monthWeeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((date, dayIndex) => {
              const dateKey = toDateKey(date);
              const isSelected = dateKey === selectedDate;
              const isMuted = !sameMonth(date, visibleMonth);
              const isLastColumn = dayIndex === 6;
              const isLastRow = weekIndex === monthWeeks.length - 1;

              return (
                <TouchableOpacity
                  key={dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${dateKey}`}
                  style={[
                    styles.cellWrapper,
                    !isLastColumn && styles.borderRight,
                    !isLastRow && styles.borderBottom,
                    cellWrapperStyle,
                  ]}
                  onPress={() => onSelectDate(date)}
                  activeOpacity={0.75}
                >
                  {renderDayCell(date, isSelected, isMuted)}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    color: '#707884', // Standard muted label color
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridContainer: {
    borderWidth: 1,
    borderColor: '#e8e7ee', // Subtle border color matching outline/surfaceHigh
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ffffff', // Standard clean background
  },
  weekRow: {
    flexDirection: 'row',
    width: '100%',
  },
  cellWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 52, // Ensures uniform cell heights
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#e8e7ee',
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#e8e7ee',
  },
});
