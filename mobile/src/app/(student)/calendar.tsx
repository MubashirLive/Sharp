import { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from 'lucide-react-native';
import {
  CalendarGrid,
  toDate,
  toDateKey,
} from '@/components/calendar/CalendarGrid';

type EventItem = {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // For sorting chronologically, e.g. "09:00 AM" or "02:30 PM"
  title: string; // Event Name (e.g. "Doctors Day Celebration")
  eventDate: string; // Formatted date string (e.g. "July 1, 2026")
  publishedAt: string; // Publish timestamp (e.g. "June 28, 2026 · 10:00 AM")
  description: string;
  category: 'event' | 'announcement' | 'holiday';
};

const COLORS = {
  surface: '#f9f9ff',
  surfaceLow: '#f3f3f9',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#edecef',
  surfaceHigh: '#e8e7ee',
  text: '#191b20',
  textMuted: '#707884',
  outline: '#c3c6cf',
  primary: '#000000',
  primaryContainer: '#d1e4ff',
  secondary: '#575e6c',
  tertiary: '#ad2274',
  onPrimary: '#ffffff',
};

const TODAY_KEY = '2026-07-29';

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

const ATTENDANCE_BY_DATE: Record<string, { status: string }> = {
  '2026-04-01': { status: 'present' },
  '2026-04-02': { status: 'present' },
  '2026-04-03': { status: 'absent' },
  '2026-04-04': { status: 'present' },
  '2026-04-06': { status: 'present' },
  '2026-04-07': { status: 'present' },
  '2026-04-08': { status: 'leave' },
  '2026-04-09': { status: 'present' },
  '2026-04-10': { status: 'present' },
  '2026-05-04': { status: 'present' },
  '2026-05-05': { status: 'present' },
  '2026-05-06': { status: 'present' },
  '2026-05-07': { status: 'present' },
  '2026-05-08': { status: 'leave' },
  '2026-05-09': { status: 'present' },
  '2026-05-11': { status: 'present' },
  '2026-05-12': { status: 'absent' },
  '2026-05-13': { status: 'present' },
  '2026-05-14': { status: 'present' },
  '2026-05-15': { status: 'present' },
  '2026-05-16': { status: 'present' },
  '2026-06-01': { status: 'present' },
  '2026-06-02': { status: 'present' },
  '2026-06-03': { status: 'present' },
  '2026-06-04': { status: 'absent' },
  '2026-06-05': { status: 'present' },
  '2026-06-06': { status: 'present' },
  '2026-06-08': { status: 'present' },
  '2026-06-09': { status: 'present' },
  '2026-06-10': { status: 'leave' },
  '2026-06-11': { status: 'present' },
  '2026-06-12': { status: 'present' },
  '2026-06-13': { status: 'present' },
  '2026-06-15': { status: 'present' },
  '2026-06-16': { status: 'absent' },
  '2026-06-17': { status: 'present' },
  '2026-06-18': { status: 'present' },
  '2026-06-19': { status: 'present' },
  '2026-06-20': { status: 'leave' },
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
  '2026-07-08': { status: 'absent' },
  '2026-07-09': { status: 'present' },
  '2026-07-10': { status: 'present' },
  '2026-07-11': { status: 'present' },
  '2026-07-14': { status: 'absent' },
  '2026-07-15': { status: 'present' },
  '2026-07-16': { status: 'present' },
  '2026-07-17': { status: 'leave' },
  '2026-07-18': { status: 'present' },
  '2026-07-20': { status: 'present' },
  '2026-07-21': { status: 'present' },
  '2026-07-22': { status: 'present' },
  '2026-07-23': { status: 'present' },
  '2026-07-24': { status: 'leave' },
  '2026-07-25': { status: 'present' },
  '2026-07-28': { status: 'present' },
  '2026-07-29': { status: 'leave' },
};

function getHolidayReason(dateKey: string): string | null {
  const date = toDate(dateKey);
  const isSunday = date.getDay() === 0;
  if (isSunday || dateKey > TODAY_KEY) return null;
  if (ATTENDANCE_BY_DATE[dateKey]) return null;
  return HOLIDAYS[dateKey] ?? 'School Holiday';
}

const MOCK_EVENTS: EventItem[] = [
  {
    id: '1',
    date: '2026-07-01',
    time: '09:00 AM',
    title: "Doctors' Day Celebration",
    eventDate: 'July 1, 2026',
    publishedAt: 'June 28, 2026 · 10:00 AM',
    description: 'We will be celebrating Doctors Day to honor our healthcare professionals. Students are requested to participate in the poster-making activity.',
    category: 'event',
  },
  {
    id: '2',
    date: '2026-07-04',
    time: '10:00 AM',
    title: 'Independence Day Special Planning',
    eventDate: 'July 4, 2026',
    publishedAt: 'July 2, 2026 · 09:30 AM',
    description: 'Students from Classes 8-10 are requested to gather in the auditorium for the choir selection and dance rehearsal assignments.',
    category: 'event',
  },
  {
    id: '3',
    date: '2026-07-15',
    time: '09:00 AM',
    title: 'Summer Camp Briefing',
    eventDate: 'July 15, 2026',
    publishedAt: 'July 12, 2026 · 02:00 PM',
    description: 'Parents and students are requested to attend the online briefing session for details regarding schedules, locations, and kit lists.',
    category: 'announcement',
  },
  {
    id: '4',
    date: '2026-07-15',
    time: '02:00 PM',
    title: 'Annual Sports Meet Setup',
    eventDate: 'July 15, 2026',
    publishedAt: 'July 14, 2026 · 08:00 AM',
    description: 'P.E. teachers and house captains will coordinate the ground layout and distribution of sports materials after lunch.',
    category: 'event',
  },
  {
    id: '5',
    date: '2026-07-20',
    time: '11:00 AM',
    title: 'Science Exhibition Announcement',
    eventDate: 'July 20, 2026',
    publishedAt: 'July 18, 2026 · 11:30 AM',
    description: 'Registration is open for the upcoming annual science exhibition. Submit your project abstracts to your science teacher.',
    category: 'announcement',
  },
  {
    id: '6',
    date: '2026-07-25',
    time: '03:00 PM',
    title: 'Parent-Teacher Association Meet',
    eventDate: 'July 25, 2026',
    publishedAt: 'July 23, 2026 · 04:00 PM',
    description: 'PTA meeting will be conducted in the main hall. Discussion topics include curriculum updates and the upcoming sports meet planning.',
    category: 'event',
  },
];

function timeToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  const normalizedHour = period === 'AM' ? hour % 12 : (hour % 12) + 12;
  return normalizedHour * 60 + minute;
}

function sortByTime(items: EventItem[]) {
  return [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatMonthHeader(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatDayHeader(dateKey: string) {
  const date = toDate(dateKey);
  return {
    date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

function HolidayCard({ dateKey, reason }: { dateKey: string; reason: string }) {
  const date = toDate(dateKey);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={styles.holidayStatusCard}>
      <View style={styles.holidayStatusIcon}>
        <CalendarCheck size={22} color={COLORS.tertiary} />
      </View>
      <View style={styles.holidayStatusTextColumn}>
        <Text style={styles.holidayStatusDate}>{formattedDate}</Text>
        <Text style={styles.holidayStatusTitle}>Holiday</Text>
        <Text style={styles.holidayStatusNote}>{reason}</Text>
      </View>
    </View>
  );
}

function EventCard({
  item,
  expanded,
  onToggle,
}: {
  item: EventItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isHoliday = item.category === 'holiday';

  return (
    <View style={[styles.card, isHoliday && styles.holidayCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardMain}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.eventDateText}>{item.eventDate}</Text>
        </View>

        <View style={styles.cardMeta}>
          <Text
            style={[
              styles.publishedText,
              isHoliday && styles.holidayPublishedText,
            ]}
          >
            {item.publishedAt}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={expanded ? 'Collapse details' : 'Expand details'}
            style={styles.chevronButton}
            onPress={onToggle}
          >
            {expanded ? (
              <ChevronUp size={18} color={COLORS.textMuted} />
            ) : (
              <ChevronDown size={18} color={COLORS.textMuted} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {expanded ? (
        <View style={styles.details}>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState('2026-07-01');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = toDate('2026-07-01');
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const eventsByDate = useMemo(() => {
    return MOCK_EVENTS.reduce<Record<string, EventItem[]>>((acc, event) => {
      acc[event.date] = acc[event.date] ?? [];
      acc[event.date].push(event);
      return acc;
    }, {});
  }, []);

  const selectedHolidayReason = useMemo(() => {
    return getHolidayReason(selectedDate);
  }, [selectedDate]);

  const selectedItems = useMemo(() => {
    return sortByTime(eventsByDate[selectedDate] ?? []);
  }, [eventsByDate, selectedDate]);

  const totalCount = (selectedHolidayReason ? 1 : 0) + selectedItems.length;

  const selectedHeader = formatDayHeader(selectedDate);

  const moveBackward = () => {
    setVisibleMonth((current) => addMonths(current, -1));
  };

  const moveForward = () => {
    setVisibleMonth((current) => addMonths(current, 1));
  };

  const selectDate = (date: Date) => {
    setSelectedDate(toDateKey(date));
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>Calendar</Text>
        </View>

        <View style={styles.dateControls}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={styles.navButton}
            onPress={moveBackward}
          >
            <ChevronLeft size={22} color={COLORS.secondary} />
          </TouchableOpacity>

          <View style={styles.dateButton}>
            <Text style={styles.dateTitle} numberOfLines={1}>
              {formatMonthHeader(visibleMonth)}
            </Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={styles.navButton}
            onPress={moveForward}
          >
            <ChevronRight size={22} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Grid Container (Always Collapsed Month Grid) */}
      <View style={styles.calendarPanel}>
        <CalendarGrid
          visibleMonth={visibleMonth}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          renderDayCell={(date, selected, muted) => {
            const dateKey = toDateKey(date);
            const dayEvents = eventsByDate[dateKey] ?? [];
            const isSunday = date.getDay() === 0;
            const isHoliday = Boolean(getHolidayReason(dateKey));

            return (
              <View
                style={[
                  styles.dateCircle,
                  isSunday && styles.sundayCircle,
                  isHoliday && styles.holidayCircle,
                  selected && styles.dateCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dateNumber,
                    muted && styles.mutedDateNumber,
                    isSunday && styles.sundayDateNumber,
                    isHoliday && styles.holidayDateNumber,
                    selected && styles.selectedDateNumber,
                  ]}
                >
                  {date.getDate()}
                </Text>
                {(dayEvents.length > 0 || isHoliday) && !selected ? (
                  <View style={[styles.eventDot, isHoliday && styles.holidayDot]} />
                ) : null}
              </View>
            );
          }}
        />
      </View>

      {/* Agenda/List Panel */}
      <View style={styles.agendaPanel}>
        <View style={styles.agendaHeader}>
          <Text style={styles.agendaDate}>{selectedHeader.date}</Text>
          <Text style={styles.countPill}>
            {totalCount} Item{totalCount !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            totalCount === 0 && styles.emptyScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {selectedHolidayReason ? (
            <HolidayCard dateKey={selectedDate} reason={selectedHolidayReason} />
          ) : null}

          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <EventCard
                key={item.id}
                item={item}
                expanded={Boolean(expandedCards[item.id])}
                onToggle={() =>
                  setExpandedCards((current) => ({
                    ...current,
                    [item.id]: !current[item.id],
                  }))
                }
              />
            ))
          ) : !selectedHolidayReason ? (
            <View style={styles.emptyState}>
              <CalendarDays size={28} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Nothing scheduled</Text>
              <Text style={styles.emptyText}>
                Select another date to see school events or announcements.
              </Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
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
  titleColumn: {
    width: 96,
  },
  title: {
    color: COLORS.text,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '800',
  },
  dateControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButton: {
    width: 36,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: {
    width: 136,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dateTitle: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    textAlign: 'center',
  },
  calendarPanel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCircleSelected: {
    backgroundColor: COLORS.primary,
  },
  sundayCircle: {
    backgroundColor: '#dfe3ea',
  },
  sundayDateNumber: {
    color: '#8b929d',
  },
  holidayCircle: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  holidayDateNumber: {
    color: '#6d28d9',
  },
  dateNumber: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  mutedDateNumber: {
    color: COLORS.outline,
  },
  selectedDateNumber: {
    color: COLORS.onPrimary,
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tertiary,
  },
  holidayDot: {
    backgroundColor: '#6d28d9',
  },
  agendaPanel: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  agendaHeader: {
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agendaDate: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  countPill: {
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: COLORS.surfaceHigh,
    color: COLORS.textMuted,
    paddingHorizontal: 9,
    paddingVertical: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 96,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    paddingHorizontal: 16,
    paddingVertical: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  holidayCard: {
    borderColor: '#ddd6fe',
    backgroundColor: '#faf8ff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardMain: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 4,
  },
  eventDateText: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
  cardMeta: {
    alignItems: 'flex-end',
  },
  publishedText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  holidayPublishedText: {
    color: '#6d28d9',
    fontWeight: '700',
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outline,
    paddingTop: 10,
  },
  description: {
    color: COLORS.secondary,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400',
  },
  holidayStatusCard: {
    marginBottom: 12,
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
  holidayStatusIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  holidayStatusTextColumn: { flex: 1 },
  holidayStatusDate: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  holidayStatusTitle: { marginTop: 1, color: COLORS.tertiary, fontSize: 13, lineHeight: 17, fontWeight: '800' },
  holidayStatusNote: { marginTop: 4, color: COLORS.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 6,
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
  },
});
