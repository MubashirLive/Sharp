import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Paperclip,
  Tag,
} from 'lucide-react-native';
import { CalendarGrid, toDate, toDateKey, sameMonth } from './CalendarGrid';

export type AgendaCalendarMode = 'hidden' | 'collapsed' | 'expanded' | 'full';

export type AgendaCategory = {
  id: string;
  label: string;
  shortLabel: string;
  iconColor: string;
  badgeClassName: string;
};

export type AgendaAttachment = {
  id: string;
  label: string;
  kind: 'file' | 'link';
};

export type AgendaItem = {
  id: string;
  date: string;
  time: string;
  categoryId: string;
  title: string;
  description: string;
  owner: string;
  className?: string;
  section?: string;
  teacherName?: string;
  chapter?: string;
  chapterId?: string;
  attachments?: AgendaAttachment[];
};

type AgendaCalendarProps = {
  title: string;
  items: AgendaItem[];
  categories: AgendaCategory[];
  initialDate?: string;
  itemCountLabel?: string;
  subHeader?: React.ReactNode;
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

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const FULL_CELL_SUBJECT_LIMIT = 8;
const FULL_CELL_OVERFLOW_LIMIT = FULL_CELL_SUBJECT_LIMIT - 1;

const FALLBACK_CATEGORY: AgendaCategory = {
  id: 'default',
  label: 'Schedule',
  shortLabel: 'Item',
  iconColor: COLORS.secondary,
  badgeClassName: '',
};

function addDays(dateKey: string, amount: number) {
  const date = toDate(dateKey);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDayHeader(dateKey: string) {
  const date = toDate(dateKey);
  return {
    date: date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

function formatMonthHeader(date: Date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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

function timeToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();
  const normalizedHour = period === 'AM' ? hour % 12 : (hour % 12) + 12;

  return normalizedHour * 60 + minute;
}

function sortByTime(items: AgendaItem[]) {
  return [...items].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
}

function categoryFor(categories: AgendaCategory[], categoryId: string) {
  return categories.find((category) => category.id === categoryId) ?? categories[0] ?? FALLBACK_CATEGORY;
}

function compactSubjectLabel(label: string) {
  return label.trim().toUpperCase().slice(0, 3);
}

function getAttachmentMeta(attachment: AgendaAttachment) {
  const lower = attachment.label.toLowerCase();
  const isLink =
    attachment.kind === 'link' ||
    attachment.label.startsWith('http') ||
    lower.includes('video') ||
    lower.includes('link') ||
    lower.includes('guide');

  if (isLink) {
    return {
      type: 'LINK',
      icon: Globe,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
      actionLabel: 'Open Link',
    };
  }
  if (lower.endsWith('.pdf') || lower.includes('pdf')) {
    return {
      type: 'PDF',
      icon: FileText,
      color: '#DC2626',
      bgColor: '#FEE2E2',
      actionLabel: 'Preview',
    };
  }
  if (lower.endsWith('.doc') || lower.endsWith('.docx') || lower.includes('doc')) {
    return {
      type: 'DOC',
      icon: FileText,
      color: '#2563EB',
      bgColor: '#DBEAFE',
      actionLabel: 'Download',
    };
  }
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    return {
      type: 'IMAGE',
      icon: ImageIcon,
      color: '#059669',
      bgColor: '#D1FAE5',
      actionLabel: 'View Image',
    };
  }
  return {
    type: 'FILE',
    icon: Paperclip,
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    actionLabel: 'Open File',
  };
}

function AgendaCard({
  item,
  category,
  expanded,
  onToggle,
}: {
  item: AgendaItem;
  category: AgendaCategory;
  expanded: boolean;
  onToggle: () => void;
}) {
  const attachmentCount = item.attachments?.length ?? 0;
  const classSectionText = item.className && item.section ? `${item.className} · ${item.section}` : (item.className || item.owner || 'Grade 10 · Section A');
  const teacherName = item.teacherName || 'Ms. Priya Singh';
  const chapterName = item.chapter || 'Chapter 3: Quadratic Equations';
  const isUncategorised = chapterName === 'Uncategorised';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onToggle}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={expanded ? 'Collapse details' : 'Expand details'}
    >
      {/* ── Top Header: Subject - Class/Section + (Time & Chevron on Top Right) ── */}
      <View style={styles.cardHeader}>
        <View style={styles.cardMain}>
          {/* 1. In place where teacher is written, write the class and section */}
          <View style={styles.subjectRow}>
            <BookOpen size={14} color={category.iconColor} strokeWidth={2.2} />
            <Text style={styles.subjectText}>{category.label}</Text>
            <Text style={styles.subjectDash}>-</Text>
            <Text style={styles.classSectionText}>{classSectionText}</Text>
          </View>

          {/* 2. Below the subject: Name of the teacher in small font */}
          <Text style={styles.teacherNameText}>{teacherName}</Text>
        </View>

        {/* 4 & 5. Top Right: Time in short, small font + Small Chevron indicator */}
        <View style={styles.topRightWrap}>
          <View style={styles.timeWrap}>
            <Clock size={10} color={COLORS.textMuted} strokeWidth={2} />
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <View style={styles.chevronIndicator}>
            {expanded ? (
              <ChevronUp size={12} color={COLORS.textMuted} strokeWidth={2.4} />
            ) : (
              <ChevronDown size={12} color={COLORS.textMuted} strokeWidth={2.4} />
            )}
          </View>
        </View>
      </View>

      {/* 3. Title of the Homework */}
      <Text style={styles.cardTitle}>{item.title}</Text>

      {/* 6. Below the title: Curriculum tag */}
      <View style={styles.chapterRow}>
        <View
          style={[
            styles.chapterBadge,
            isUncategorised && styles.chapterBadgeUncategorised,
          ]}
        >
          <Tag
            size={10}
            color={isUncategorised ? '#64748B' : '#047857'}
            strokeWidth={2.2}
          />
          <Text
            style={[
              styles.chapterBadgeText,
              isUncategorised && styles.chapterBadgeTextUncategorised,
            ]}
            numberOfLines={1}
          >
            {chapterName}
          </Text>
        </View>
      </View>

      {/* ── Attachments Bar (Visible at glance) ── */}
      {attachmentCount > 0 && !expanded ? (
        <View style={styles.attachmentPillsRow}>
          {item.attachments?.slice(0, 2).map((att) => {
            const meta = getAttachmentMeta(att);
            const IconComp = meta.icon;
            return (
              <TouchableOpacity
                key={att.id}
                style={[styles.attachmentChip, { backgroundColor: meta.bgColor }]}
                activeOpacity={0.75}
                onPress={() => {
                  Alert.alert('Attachment', `Opening ${att.label}...`);
                }}
              >
                <IconComp size={11} color={meta.color} strokeWidth={2.4} />
                <Text style={[styles.attachmentChipText, { color: meta.color }]} numberOfLines={1}>
                  {att.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {attachmentCount > 2 && (
            <View style={styles.moreAttachmentsChip}>
              <Text style={styles.moreAttachmentsText}>+{attachmentCount - 2} more</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* ── Expandable Details (Description + Full Rich Attachment Tiles) ── */}
      {expanded ? (
        <View style={styles.expandedContent}>
          {/* Description */}
          {item.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          ) : null}

          {/* Attachments Section */}
          {attachmentCount > 0 && (
            <View style={styles.attachmentsSection}>
              <View style={styles.attachmentsSectionHeader}>
                <Paperclip size={12} color="#64748B" strokeWidth={2.2} />
                <Text style={styles.attachmentsSectionTitle}>
                  Attached Materials ({attachmentCount})
                </Text>
              </View>

              <View style={styles.attachmentCardsList}>
                {item.attachments?.map((att) => {
                  const meta = getAttachmentMeta(att);
                  const IconComp = meta.icon;
                  return (
                    <TouchableOpacity
                      key={att.id}
                      style={styles.attachmentCard}
                      activeOpacity={0.75}
                      onPress={() => Alert.alert('Attachment', `Opening ${att.label}...`)}
                    >
                      <View style={[styles.attachmentIconBox, { backgroundColor: meta.bgColor }]}>
                        <IconComp size={15} color={meta.color} strokeWidth={2.2} />
                      </View>
                      <View style={styles.attachmentCardInfo}>
                        <Text style={styles.attachmentCardName} numberOfLines={1}>
                          {att.label}
                        </Text>
                        <Text style={styles.attachmentCardType}>{meta.type}</Text>
                      </View>
                      <View style={[styles.attachmentActionBtn, { borderColor: meta.color }]}>
                        <Text style={[styles.attachmentActionText, { color: meta.color }]}>
                          {meta.actionLabel}
                        </Text>
                        <ExternalLink size={10} color={meta.color} strokeWidth={2.4} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export function AgendaCalendar({
  title,
  items,
  categories,
  initialDate = toDateKey(new Date()),
  itemCountLabel = 'Assignments',
  subHeader,
}: AgendaCalendarProps) {
  const [mode, setMode] = useState<AgendaCalendarMode>('hidden');
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = toDate(initialDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const setCalendarMode = useCallback(
    (nextMode: AgendaCalendarMode | ((current: AgendaCalendarMode) => AgendaCalendarMode)) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMode(nextMode);
    },
    []
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dy) > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 18) {
            setCalendarMode((current) => (current === 'collapsed' || current === 'hidden' ? 'full' : current));
            return;
          }

          if (gesture.dy < -18) {
            setCalendarMode((current) => {
              if (current === 'full') return 'collapsed';
              if (current === 'collapsed') return 'hidden';
              return current;
            });
          }
        },
      }),
    [setCalendarMode]
  );

  const itemsByDate = useMemo(() => {
    return items.reduce<Record<string, AgendaItem[]>>((acc, item) => {
      acc[item.date] = acc[item.date] ?? [];
      acc[item.date].push(item);
      return acc;
    }, {});
  }, [items]);

  const selectedItems = sortByTime(itemsByDate[selectedDate] ?? []);
  const selectedHeader = formatDayHeader(selectedDate);
  const monthWeeks = buildMonthWeeks(visibleMonth);
  const isFull = mode === 'full';
  const isHidden = mode === 'hidden';
  const isExpanded = mode !== 'collapsed' && mode !== 'hidden';

  const moveBackward = () => {
    if (mode === 'collapsed' || mode === 'hidden') {
      const nextDate = addDays(selectedDate, -1);
      const next = toDate(nextDate);
      setSelectedDate(nextDate);
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      return;
    }
    setVisibleMonth((current) => addMonths(current, -1));
  };

  const moveForward = () => {
    if (mode === 'collapsed' || mode === 'hidden') {
      const nextDate = addDays(selectedDate, 1);
      const next = toDate(nextDate);
      setSelectedDate(nextDate);
      setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
      return;
    }
    setVisibleMonth((current) => addMonths(current, 1));
  };

  const selectDate = (date: Date) => {
    setSelectedDate(toDateKey(date));
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
  };

  const toggleCalendar = () => {
    setCalendarMode((current) => {
      if (current === 'hidden') return 'collapsed';
      if (current === 'collapsed') return 'hidden';
      if (current === 'full') return 'collapsed';
      return 'hidden';
    });
  };


  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        </View>

        <View style={styles.dateControls}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={mode === 'collapsed' || mode === 'hidden' ? 'Previous day' : 'Previous month'}
            style={styles.navButton}
            onPress={moveBackward}
          >
            <ChevronLeft size={22} color={COLORS.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isHidden ? 'Show collapsed calendar' : 'Hide calendar'}
            style={styles.dateButton}
            onPress={toggleCalendar}
          >
            <Text style={styles.dateTitle} numberOfLines={1}>
              {isExpanded ? formatMonthHeader(visibleMonth) : selectedHeader.date}
            </Text>
            {!isExpanded ? <Text style={styles.weekday}>{selectedHeader.weekday}</Text> : null}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={mode === 'collapsed' || mode === 'hidden' ? 'Next day' : 'Next month'}
            style={styles.navButton}
            onPress={moveForward}
          >
            <ChevronRight size={22} color={COLORS.secondary} />
          </TouchableOpacity>
        </View>

      </View>

      {subHeader}

      {!isHidden ? (
        isFull ? (
          <View style={styles.fullCalendarPanel} {...panResponder.panHandlers}>
            <View style={styles.weekRow}>
              {WEEK_DAYS.map((day) => (
                <Text key={day} style={styles.weekdayLabel}>{day}</Text>
              ))}
            </View>

            <View style={[styles.monthGrid, styles.fullMonthGrid]}>
              {monthWeeks.map((week, weekIndex) => (
                <View
                  key={`week-${weekIndex}`}
                  style={styles.fullWeekRow}
                >
                  {week.map((date) => {
                    const dateKey = toDateKey(date);
                    const dayItems = sortByTime(itemsByDate[dateKey] ?? []);
                    const selected = dateKey === selectedDate;
                    const muted = !sameMonth(date, visibleMonth);

                    return (
                      <TouchableOpacity
                        key={dateKey}
                        accessibilityRole="button"
                        accessibilityLabel={`Select ${formatDayHeader(dateKey).date}`}
                        style={styles.fullDateCellWrapper}
                        onPress={() => selectDate(date)}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            styles.fullDateCell,
                            selected && styles.fullDateCellSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.fullDateNumber,
                              muted && styles.mutedDateNumber,
                              selected && styles.fullSelectedDateNumber,
                            ]}
                          >
                            {date.getDate()}
                          </Text>

                          <View style={styles.subjectLabelGrid}>
                            {Array.from({
                              length: Math.ceil(
                                (dayItems.length > FULL_CELL_SUBJECT_LIMIT
                                  ? FULL_CELL_SUBJECT_LIMIT
                                  : dayItems.length) / 2
                              ),
                            }).map((_, rowIndex) => {
                              const visibleItems = dayItems.slice(
                                0,
                                dayItems.length > FULL_CELL_SUBJECT_LIMIT
                                  ? FULL_CELL_OVERFLOW_LIMIT
                                  : FULL_CELL_SUBJECT_LIMIT
                              );
                              const rowItems = visibleItems.slice(rowIndex * 2, rowIndex * 2 + 2);
                              const showOverflow =
                                dayItems.length > FULL_CELL_SUBJECT_LIMIT && rowIndex === FULL_CELL_SUBJECT_LIMIT / 2 - 1;

                              return (
                                <View key={`subject-row-${dateKey}-${rowIndex}`} style={styles.subjectLabelRow}>
                                  {rowItems.map((item) => {
                                    const category = categoryFor(categories, item.categoryId);
                                    return (
                                      <View
                                        key={item.id}
                                        style={[styles.subjectLabel, { backgroundColor: category.iconColor }]}
                                      >
                                        <Text style={styles.subjectLabelText} numberOfLines={1}>
                                          {compactSubjectLabel(category.shortLabel)}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                  {showOverflow ? (
                                    <View style={[styles.subjectLabel, styles.moreSubjectLabel]}>
                                      <Text style={styles.moreSubjectLabelText} numberOfLines={1}>
                                        +{dayItems.length - FULL_CELL_OVERFLOW_LIMIT}
                                      </Text>
                                    </View>
                                  ) : null}
                                  {rowItems.length === 1 && !showOverflow ? <View style={styles.subjectLabelPlaceholder} /> : null}
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.calendarPanel} {...panResponder.panHandlers}>
            <CalendarGrid
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              onSelectDate={selectDate}
              renderDayCell={(date, selected, muted) => {
                const dateKey = toDateKey(date);
                const dayItems = sortByTime(itemsByDate[dateKey] ?? []);

                return (
                  <View style={[styles.dateCircle, selected && styles.dateCircleSelected]}>
                    <Text
                      style={[
                        styles.dateNumber,
                        muted && styles.mutedDateNumber,
                        selected && styles.selectedDateNumber,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {dayItems.length > 0 && !selected ? (
                      <View style={styles.agendaDot} />
                    ) : null}
                  </View>
                );
              }}
            />
          </View>
        )
      ) : null}

      {!isFull ? (
        <View style={[styles.agendaPanel, !isExpanded && styles.collapsedAgendaPanel, isHidden && styles.hiddenAgendaPanel]}>
          {isExpanded ? (
            <View style={styles.agendaHeader}>
              <Text style={styles.agendaDate}>{selectedHeader.date}</Text>
              <Text style={styles.countPill}>{selectedItems.length} {itemCountLabel}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              selectedItems.length === 0 && styles.emptyScrollContent,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {selectedItems.length > 0 ? (
              selectedItems.map((item) => {
                const category = categoryFor(categories, item.categoryId);
                return (
                  <AgendaCard
                    key={item.id}
                    item={item}
                    category={category}
                    expanded={Boolean(expandedCards[item.id])}
                    onToggle={() =>
                      setExpandedCards((current) => ({
                        ...current,
                        [item.id]: !current[item.id],
                      }))
                    }
                  />
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <CalendarDays size={28} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>Nothing scheduled</Text>
                <Text style={styles.emptyText}>
                  Select another date to see class work, events, attendance notes, or notices.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
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
  weekday: {
    marginTop: 2,
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  calendarPanel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 0,
  },
  fullCalendarPanel: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingTop: 0,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekdayLabel: {
    width: `${100 / 7}%`,
    color: COLORS.secondary,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  monthGrid: {
    width: '100%',
  },
  fullMonthGrid: {
    flex: 1,
  },
  weekGridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  fullWeekRow: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  dateCellWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  fullDateCellWrapper: {
    flex: 1,
    paddingHorizontal: 1.5,
    paddingVertical: 2,
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
  agendaDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tertiary,
  },
  fullDateCell: {
    flex: 1,
    minHeight: 70,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 11,
    backgroundColor: COLORS.surfaceLowest,
    paddingHorizontal: 3,
    paddingVertical: 4,
  },
  fullDateCellSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryContainer,
  },
  fullDateNumber: {
    color: COLORS.text,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
  },
  fullSelectedDateNumber: {
    color: COLORS.primary,
  },
  subjectLabelGrid: {
    marginTop: 4,
    rowGap: 2,
  },
  subjectLabelRow: {
    flexDirection: 'row',
    columnGap: 2,
  },
  subjectLabel: {
    flex: 1,
    minWidth: 0,
    minHeight: 12,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  subjectLabelPlaceholder: {
    flex: 1,
    minWidth: 0,
  },
  subjectLabelText: {
    color: COLORS.onPrimary,
    fontSize: 8.5,
    lineHeight: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  moreSubjectLabel: {
    backgroundColor: COLORS.surfaceHigh,
  },
  moreSubjectLabelText: {
    color: COLORS.secondary,
    fontSize: 8.5,
    lineHeight: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  agendaPanel: {
    flex: 1,
    minHeight: 280,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  collapsedAgendaPanel: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    backgroundColor: COLORS.surface,
    paddingTop: 16,
  },
  hiddenAgendaPanel: {
    paddingTop: 8,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardMain: {
    flex: 1,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  subjectText: {
    color: COLORS.text,
    fontSize: 13.5,
    lineHeight: 18,
    fontWeight: '800',
  },
  subjectDash: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  classSectionText: {
    color: '#4338CA',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  teacherNameText: {
    color: COLORS.textMuted,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  topRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
    alignSelf: 'flex-start',
  },
  timeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    color: COLORS.textMuted,
    fontSize: 10.5,
    fontWeight: '500',
  },
  chevronIndicator: {
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  chapterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3.5,
    maxWidth: '100%',
  },
  chapterBadgeUncategorised: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  chapterBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#047857',
  },
  chapterBadgeTextUncategorised: {
    color: '#64748B',
  },
  // Attachments Chips (Collapsed Glance)
  attachmentPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    maxWidth: 180,
  },
  attachmentChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  moreAttachmentsChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  moreAttachmentsText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },

  // Expanded View
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  descriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#334155',
    fontSize: 12.5,
    lineHeight: 18.5,
  },
  attachmentsSection: {
    marginTop: 4,
  },
  attachmentsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  attachmentsSectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  attachmentCardsList: {
    gap: 6,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 8,
    gap: 8,
  },
  attachmentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentCardInfo: {
    flex: 1,
  },
  attachmentCardName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 16,
  },
  attachmentCardType: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 1,
  },
  attachmentActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
  },
  attachmentActionText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  emptyState: {
    marginTop: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    borderColor: COLORS.outline,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLowest,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyTitle: {
    marginTop: 12,
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    textAlign: 'center',
  },
});
