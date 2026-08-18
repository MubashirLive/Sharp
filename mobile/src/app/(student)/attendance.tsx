import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  Percent,
  TrendingUp,
} from 'lucide-react-native';
import { CalendarGrid, toDate, toDateKey, sameMonth } from '@/components/calendar/CalendarGrid';

type AttendanceStatus = 'present' | 'absent' | 'leave';

type AttendanceRecord = {
  status: AttendanceStatus;
  note?: string;
};

type AttendanceSummary = {
  label: string;
  rangeLabel: string;
  total: number;
  present: number;
  absent: number;
  leave: number;
  percentage: number;
};

const COLORS = {
  surface: '#f9f9ff',
  surfaceLow: '#f3f3f9',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#edecef',
  text: '#191b20',
  textMuted: '#707884',
  outline: '#c3c6cf',
  primary: '#000000',
  primaryContainer: '#d1e4ff',
  onPrimary: '#ffffff',
  present: '#29b85d',
  absent: '#ef3d3d',
  leave: '#f3ce28',
  sunday: '#dfe3ea',
  sundayText: '#8b929d',
  warning: '#b45309',
  tertiary: '#ad2274',
};

const HOLIDAYS: Record<string, string> = {
  '2026-07-01': "Doctors' Day Celebration",
  '2026-07-13': 'Summer Vacation',
  '2026-07-27': 'Summer Vacation',
  '2026-04-11': 'Spring Festival',
  '2026-04-12': 'Spring Break',
  '2026-04-13': 'Spring Break',
  '2026-04-14': 'Spring Break',
  '2026-04-15': 'Spring Break',
  '2026-04-16': 'Spring Break',
  '2026-04-17': 'Spring Break',
  '2026-04-18': 'Spring Break',
  '2026-04-19': 'Spring Break',
  '2026-04-20': 'Spring Break',
  '2026-04-21': 'Spring Break',
  '2026-04-22': 'Spring Break',
  '2026-04-23': 'Spring Break',
  '2026-04-24': 'Spring Break',
  '2026-04-25': 'Spring Break',
  '2026-04-26': 'Spring Break',
  '2026-04-27': 'Spring Break',
  '2026-04-28': 'Spring Break',
  '2026-04-29': 'Spring Break',
  '2026-04-30': 'Spring Break',
  '2026-05-01': 'May Day Holiday',
  '2026-05-02': 'School Holiday',
  '2026-05-03': 'School Holiday',
  '2026-05-17': 'Summer Break',
  '2026-05-18': 'Summer Break',
  '2026-05-19': 'Summer Break',
  '2026-05-20': 'Summer Break',
  '2026-05-21': 'Summer Break',
  '2026-05-22': 'Summer Break',
  '2026-05-23': 'Summer Break',
  '2026-05-24': 'Summer Break',
  '2026-05-25': 'Summer Break',
  '2026-05-26': 'Summer Break',
  '2026-05-27': 'Summer Break',
  '2026-05-28': 'Summer Break',
  '2026-05-29': 'Summer Break',
  '2026-05-30': 'Summer Break',
  '2026-05-31': 'Summer Break',
};

const TODAY_KEY = '2026-07-29';

const ATTENDANCE_BY_DATE: Record<string, AttendanceRecord> = {
  '2026-04-01': { status: 'present' },
  '2026-04-02': { status: 'present' },
  '2026-04-03': { status: 'absent', note: 'Absent - not marked present in register.' },
  '2026-04-04': { status: 'present' },
  '2026-04-06': { status: 'present' },
  '2026-04-07': { status: 'present' },
  '2026-04-08': { status: 'leave', note: 'Leave approved.' },
  '2026-04-09': { status: 'present' },
  '2026-04-10': { status: 'present' },
  '2026-05-04': { status: 'present' },
  '2026-05-05': { status: 'present' },
  '2026-05-06': { status: 'present' },
  '2026-05-07': { status: 'present' },
  '2026-05-08': { status: 'leave', note: 'Family function leave.' },
  '2026-05-09': { status: 'present' },
  '2026-05-11': { status: 'present' },
  '2026-05-12': { status: 'absent', note: 'Absent.' },
  '2026-05-13': { status: 'present' },
  '2026-05-14': { status: 'present' },
  '2026-05-15': { status: 'present' },
  '2026-05-16': { status: 'present' },
  '2026-06-01': { status: 'present' },
  '2026-06-02': { status: 'present' },
  '2026-06-03': { status: 'present' },
  '2026-06-04': { status: 'absent', note: 'Absent.' },
  '2026-06-05': { status: 'present' },
  '2026-06-06': { status: 'present' },
  '2026-06-08': { status: 'present' },
  '2026-06-09': { status: 'present' },
  '2026-06-10': { status: 'leave', note: 'Medical leave approved.' },
  '2026-06-11': { status: 'present' },
  '2026-06-12': { status: 'present' },
  '2026-06-13': { status: 'present' },
  '2026-06-15': { status: 'present' },
  '2026-06-16': { status: 'absent', note: 'Absent.' },
  '2026-06-17': { status: 'present' },
  '2026-06-18': { status: 'present' },
  '2026-06-19': { status: 'present' },
  '2026-06-20': { status: 'leave', note: 'Leave approved.' },
  '2026-06-22': { status: 'present' },
  '2026-06-23': { status: 'present' },
  '2026-06-24': { status: 'present' },
  '2026-06-25': { status: 'present' },
  '2026-06-26': { status: 'present' },
  '2026-06-27': { status: 'present' },
  '2026-06-29': { status: 'present' },
  '2026-06-30': { status: 'present' },
  '2026-07-02': { status: 'present' },
  '2026-07-03': { status: 'present' },
  '2026-07-04': { status: 'present' },
  '2026-07-06': { status: 'present' },
  '2026-07-07': { status: 'present' },
  '2026-07-08': { status: 'absent', note: 'Absent - class teacher marked full day absent.' },
  '2026-07-09': { status: 'present' },
  '2026-07-10': { status: 'present' },
  '2026-07-11': { status: 'present' },
  '2026-07-14': { status: 'absent', note: 'Absent.' },
  '2026-07-15': { status: 'present' },
  '2026-07-16': { status: 'present' },
  '2026-07-17': { status: 'leave', note: 'Approved leave.' },
  '2026-07-18': { status: 'present' },
  '2026-07-20': { status: 'present' },
  '2026-07-21': { status: 'present' },
  '2026-07-22': { status: 'present' },
  '2026-07-23': { status: 'present' },
  '2026-07-24': { status: 'leave', note: 'Medical leave approved.' },
  '2026-07-25': { status: 'present' },
  '2026-07-28': { status: 'present' },
  '2026-07-29': { status: 'leave', note: 'Leave approved for personal work.' },
};

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthHeader(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDateLabel(dateKey: string) {
  return toDate(dateKey).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function calculateSummary(label: string, rangeLabel: string, records: AttendanceRecord[]): AttendanceSummary {
  const present = records.filter((record) => record.status === 'present').length;
  const absent = records.filter((record) => record.status === 'absent').length;
  const leave = records.filter((record) => record.status === 'leave').length;
  const total = present + absent + leave;
  const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

  return { label, rangeLabel, total, present, absent, leave, percentage };
}

function recordsForMonth(monthDate: Date) {
  return Object.entries(ATTENDANCE_BY_DATE)
    .filter(([dateKey]) => sameMonth(toDate(dateKey), monthDate))
    .map(([, record]) => record);
}

function recordsTillToday() {
  return Object.entries(ATTENDANCE_BY_DATE)
    .filter(([dateKey]) => dateKey <= TODAY_KEY)
    .map(([, record]) => record);
}

function statusMeta(status: AttendanceStatus) {
  switch (status) {
    case 'present':
      return { label: 'Present', color: COLORS.present, text: '#14532d' };
    case 'absent':
      return { label: 'Absent', color: COLORS.absent, text: '#7f1d1d' };
    case 'leave':
      return { label: 'Leave', color: COLORS.leave, text: '#713f12' };
  }
}


function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={[styles.metricLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function AttendanceScreen() {
  const [selectedDate, setSelectedDate] = useState(TODAY_KEY);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = toDate(TODAY_KEY);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const selectedRecord = ATTENDANCE_BY_DATE[selectedDate];
  const selectedMeta = selectedRecord ? statusMeta(selectedRecord.status) : null;

  const isSelectedSunday = useMemo(() => {
    return toDate(selectedDate).getDay() === 0;
  }, [selectedDate]);

  const holidayReason = useMemo(() => {
    if (selectedRecord || isSelectedSunday || selectedDate > TODAY_KEY) return null;
    return HOLIDAYS[selectedDate] ?? 'School Holiday';
  }, [selectedDate, selectedRecord, isSelectedSunday]);

  const shouldShowCard = useMemo(() => {
    return selectedDate <= TODAY_KEY;
  }, [selectedDate]);

  const cardData = useMemo(() => {
    let statusLabel = 'No attendance record';
    let statusColor = COLORS.textMuted;
    let noteText = selectedRecord?.note || undefined;
    let statusIconType = 'default';

    if (selectedRecord) {
      const meta = statusMeta(selectedRecord.status);
      statusLabel = meta.label;
      statusColor = meta.text;
      statusIconType = selectedRecord.status;
      if (selectedRecord.status === 'absent') {
        noteText = undefined;
      }
    } else if (isSelectedSunday) {
      statusLabel = 'Sunday';
      statusColor = COLORS.sundayText;
      statusIconType = 'sunday';
    } else if (holidayReason) {
      statusLabel = 'Holiday';
      statusColor = COLORS.tertiary;
      statusIconType = 'holiday';
      noteText = holidayReason;
    }

    return { statusLabel, statusColor, noteText, statusIconType };
  }, [selectedRecord, isSelectedSunday, holidayReason]);

  const summaries = useMemo(
    () => [
      calculateSummary('This Month', formatMonthHeader(visibleMonth), recordsForMonth(visibleMonth)),
      calculateSummary('Till Today', `Session through ${formatDateLabel(TODAY_KEY)}`, recordsTillToday()),
    ],
    [visibleMonth]
  );

  const [statsTab, setStatsTab] = useState<'month' | 'overall'>('month');

  const currentSummary = useMemo(() => {
    return statsTab === 'month' ? summaries[0] : summaries[1];
  }, [statsTab, summaries]);

  const { presentWidth, absentWidth, leaveWidth } = useMemo(() => {
    const total = currentSummary.total;
    if (total === 0) {
      return { presentWidth: '0%', absentWidth: '0%', leaveWidth: '0%' };
    }
    const pPercent = (currentSummary.present / total) * 100;
    const aPercent = (currentSummary.absent / total) * 100;
    const lPercent = (currentSummary.leave / total) * 100;

    return {
      presentWidth: `${pPercent}%` as any,
      absentWidth: `${aPercent}%` as any,
      leaveWidth: `${lPercent}%` as any,
    };
  }, [currentSummary]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>Attendance</Text>
        </View>

        <View style={styles.dateControls}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={styles.navButton}
            onPress={() => setVisibleMonth((current) => addMonths(current, -1))}
          >
            <ChevronLeft size={22} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.dateButton}>
            <Text style={styles.dateTitle} numberOfLines={1}>{formatMonthHeader(visibleMonth)}</Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={styles.navButton}
            onPress={() => setVisibleMonth((current) => addMonths(current, 1))}
          >
            <ChevronRight size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.calendarPanel}>
          <CalendarGrid
            visibleMonth={visibleMonth}
            selectedDate={selectedDate}
            onSelectDate={(date) => {
              setSelectedDate(toDateKey(date));
              setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
            renderDayCell={(date, selected, muted) => {
              const dateKey = toDateKey(date);
              const sunday = date.getDay() === 0;
              const record = ATTENDANCE_BY_DATE[dateKey];
              const meta = record ? statusMeta(record.status) : null;
              const isHoliday = !record && !sunday && dateKey <= TODAY_KEY;

              return (
                <View
                  style={[
                    styles.dateCircle,
                    sunday && styles.sundayCircle,
                    isHoliday && styles.holidayCircle,
                    meta && !sunday && { backgroundColor: meta.color },
                    selected && styles.dateCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dateNumber,
                      muted && styles.mutedDateNumber,
                      sunday && styles.sundayDateNumber,
                      isHoliday && styles.holidayDateNumber,
                      meta && !sunday && styles.statusDateNumber,
                      selected && styles.selectedDateNumber,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                </View>
              );
            }}
          />
        </View>

        {shouldShowCard ? (
          <View style={styles.selectedCard}>
            <View style={styles.selectedIcon}>
              {cardData.statusIconType === 'absent' ? (
                <CircleX size={22} color={COLORS.absent} />
              ) : cardData.statusIconType === 'leave' ? (
                <Clock3 size={22} color={COLORS.warning} />
              ) : cardData.statusIconType === 'sunday' ? (
                <CalendarCheck size={22} color={COLORS.sundayText} />
              ) : cardData.statusIconType === 'holiday' ? (
                <CalendarCheck size={22} color={COLORS.tertiary} />
              ) : (
                <CircleCheck size={22} color={selectedRecord ? COLORS.present : COLORS.textMuted} />
              )}
            </View>
            <View style={styles.selectedTextColumn}>
              <Text style={styles.selectedDate}>{formatDateLabel(selectedDate)}</Text>
              <Text style={[styles.selectedStatus, { color: cardData.statusColor }]}>
                {cardData.statusLabel}
              </Text>
              {cardData.noteText ? (
                <Text style={styles.selectedNote}>{cardData.noteText}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Attendance Stats</Text>
          <View style={styles.ratePill}>
            <Percent size={14} color={COLORS.primary} />
            <Text style={styles.ratePillText}>Present / Total</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentButton, statsTab === 'month' && styles.segmentButtonActive]}
              onPress={() => setStatsTab('month')}
            >
              <Text style={[styles.segmentText, statsTab === 'month' && styles.segmentTextActive]}>
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, statsTab === 'overall' && styles.segmentButtonActive]}
              onPress={() => setStatsTab('overall')}
            >
              <Text style={[styles.segmentText, statsTab === 'overall' && styles.segmentTextActive]}>
                Till Today
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.summaryTopRow}>
            <View>
              <Text style={styles.summaryLabel}>{currentSummary.label}</Text>
              <Text style={styles.summaryRange}>{currentSummary.rangeLabel}</Text>
            </View>
            <View style={[styles.percentageBadge, { backgroundColor: COLORS.primary }]}>
              <Text style={styles.percentageValue}>{currentSummary.percentage}%</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressSegment, { width: presentWidth, backgroundColor: COLORS.present }]} />
            <View style={[styles.progressSegment, { width: absentWidth, backgroundColor: COLORS.absent }]} />
            <View style={[styles.progressSegment, { width: leaveWidth, backgroundColor: COLORS.leave }]} />
          </View>

          <View style={styles.metricGrid}>
            <Metric label="Total" value={currentSummary.total} color={COLORS.text} />
            <Metric label="Present" value={currentSummary.present} color={COLORS.present} />
            <Metric label="Absent" value={currentSummary.absent} color={COLORS.absent} />
            <Metric label="Leave" value={currentSummary.leave} color={COLORS.warning} />
          </View>

          {statsTab === 'month' ? (
            <View style={styles.insightRow}>
              <View style={styles.insightItem}>
                <CalendarCheck size={15} color={COLORS.textMuted} />
                <Text style={styles.insightText}>{currentSummary.total} recorded days</Text>
              </View>
              <View style={styles.insightItem}>
                <Clock3 size={15} color={COLORS.textMuted} />
                <Text style={styles.insightText}>
                  {currentSummary.absent + currentSummary.leave} away days
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.callout}>
              <Text style={styles.calloutText}>
                Best streak: 9 present days. Leave is tracked separately from absence, so attendance warnings can stay fair.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    minHeight: 62,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  titleColumn: { width: 112 },
  title: { color: COLORS.text, fontSize: 21, lineHeight: 27, fontWeight: '800' },
  dateControls: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  navButton: { width: 36, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  dateButton: { width: 136, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  dateTitle: { color: COLORS.text, fontSize: 16, lineHeight: 21, fontWeight: '800', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 104 },
  calendarPanel: { backgroundColor: COLORS.surface, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  weekRow: { flexDirection: 'row', marginBottom: 2 },
  weekdayLabel: {
    width: `${100 / 7}%`,
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  monthGrid: { width: '100%' },
  weekGridRow: { flexDirection: 'row', width: '100%' },
  dateCellWrapper: { flex: 1, alignItems: 'center', paddingVertical: 7 },
  dateCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sundayCircle: { backgroundColor: COLORS.sunday },
  holidayCircle: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  dateCircleSelected: { borderWidth: 3, borderColor: COLORS.primary },
  dateNumber: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  mutedDateNumber: { color: COLORS.outline },
  sundayDateNumber: { color: COLORS.sundayText },
  holidayDateNumber: { color: '#6d28d9' },
  statusDateNumber: { color: COLORS.onPrimary },
  selectedDateNumber: { fontWeight: '900' },
  selectedCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedTextColumn: { flex: 1 },
  selectedDate: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  selectedStatus: { marginTop: 1, color: COLORS.textMuted, fontSize: 13, lineHeight: 17, fontWeight: '800' },
  selectedNote: { marginTop: 4, color: COLORS.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  statsHeader: { marginHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  ratePill: { borderRadius: 999, backgroundColor: COLORS.primaryContainer, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5 },
  ratePillText: { marginLeft: 5, color: COLORS.primary, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 12,
    padding: 3,
    marginBottom: 15,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.surfaceLowest,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    color: COLORS.text,
    fontWeight: '800',
  },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  summaryLabel: { color: COLORS.text, fontSize: 16, lineHeight: 22, fontWeight: '900' },
  summaryRange: { marginTop: 2, color: COLORS.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  percentageBadge: { minWidth: 68, borderRadius: 16, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7 },
  percentageValue: { color: COLORS.onPrimary, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  progressTrack: { overflow: 'hidden', height: 10, borderRadius: 999, backgroundColor: COLORS.surfaceContainer, flexDirection: 'row', marginTop: 14 },
  progressSegment: { height: '100%' },
  metricGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  metricItem: { minWidth: 60 },
  metricValue: { color: COLORS.text, fontSize: 20, lineHeight: 25, fontWeight: '900' },
  metricLabel: { marginTop: 2, fontSize: 11, lineHeight: 14, fontWeight: '800' },
  insightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  insightItem: { borderRadius: 999, backgroundColor: COLORS.surfaceLow, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  insightText: { marginLeft: 6, color: COLORS.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  callout: { marginTop: 14, borderRadius: 14, backgroundColor: COLORS.surfaceLow, paddingHorizontal: 12, paddingVertical: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: COLORS.outline },
  calloutText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
});
