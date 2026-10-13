import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const C = {
  primary: '#7C3AED',
  primaryBg: '#F3E8FF',
  surface: '#ffffff',
  bg: '#F8FAFC',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
};

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return toDateKey(new Date());
}

/** Format "YYYY-MM-DD" → "DD MMM" e.g. "27 Aug" */
export function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTH_SHORT[(m || 1) - 1]}`;
}

function buildMonthDays(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = new Array(startWeekday).fill(null);

  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }
  return weeks;
}

type Props = {
  visible: boolean;
  title: string; // e.g. "Set Start Date" or "Set End Date"
  minDate?: string; // YYYY-MM-DD — dates before this are disabled
  onSelect: (dateKey: string) => void;
  onClose: () => void;
};

export default function TimelineDatePicker({
  visible,
  title,
  minDate,
  onSelect,
  onClose,
}: Props) {
  const today = todayKey();
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  const weeks = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // The effective minimum date: at least today (no past dates)
  const effectiveMin = minDate && minDate > today ? minDate : today;

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const isDisabled = (dateKey: string): boolean => {
    return dateKey < effectiveMin;
  };

  const isToday = (dateKey: string): boolean => {
    return dateKey === today;
  };

  // Check if we can go to previous month (don't allow navigating to months fully before today)
  const currentMonthKey = `${viewYear}-${`${viewMonth + 1}`.padStart(2, '0')}`;
  const todayMonthKey = today.substring(0, 7);
  const canGoPrev = currentMonthKey > todayMonthKey;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.overlay}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={goToPrevMonth}
              disabled={!canGoPrev}
              style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
            >
              <ChevronLeft size={18} color={canGoPrev ? C.text : '#CBD5E1'} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn}>
              <ChevronRight size={18} color={C.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View style={styles.weekRow}>
            {WEEK_DAYS.map((d) => (
              <Text key={d} style={styles.weekDay}>
                {d}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((date, di) => {
                if (!date) {
                  return <View key={`empty-${di}`} style={styles.dayCell} />;
                }
                const dk = toDateKey(date);
                const disabled = isDisabled(dk);
                const isTodayDate = isToday(dk);

                return (
                  <TouchableOpacity
                    key={dk}
                    style={[
                      styles.dayCell,
                      isTodayDate && styles.todayCell,
                      disabled && styles.disabledCell,
                    ]}
                    onPress={() => {
                      if (!disabled) {
                        onSelect(dk);
                        onClose();
                      }
                    }}
                    disabled={disabled}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isTodayDate && styles.todayText,
                        disabled && styles.disabledText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          {/* Today shortcut */}
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => {
              onSelect(today);
              onClose();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.todayBtnText}>Select Today</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: { elevation: 12 },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 4,
  },
  weekDay: {
    width: 38,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
    paddingBottom: 6,
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: C.primary,
  },
  disabledCell: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.text,
  },
  todayText: {
    color: C.primary,
    fontWeight: '800',
  },
  disabledText: {
    color: '#CBD5E1',
  },
  todayBtn: {
    marginTop: 12,
    backgroundColor: C.primaryBg,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.primary,
  },
});
