import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import {
  BookOpen,
  User,
  MapPin,
  Clock,
  ChevronDown,
  X,
  GraduationCap,
  Sparkles,
  ChevronLeft,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

// ─── Color & Design Tokens ───────────────────────────────────────────
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
  activeDot: '#22c55e',
};

export type PeriodSlot = {
  id: string;
  numeral: string; // e.g. "I", "II", "VI"
  time: string;    // e.g. "8:00 - 8:40"
};

export type TimetableCellData = {
  subject: string;
  shortSubject: string;
  teacher: string;
  room: string;
  color: string;
  badgeBg: string;
  badgeFg: string;
  note?: string;
};

export type ClassOption = {
  id: string;
  label: string;
  section: string;
  classTeacher: string;
};

const CLASS_OPTIONS: ClassOption[] = [
  { id: '10-A', label: 'Class 10', section: 'Sec A', classTeacher: 'Mrs. Roberts' },
  { id: '10-B', label: 'Class 10', section: 'Sec B', classTeacher: 'Mr. Kapoor' },
  { id: '9-A',  label: 'Class 9',  section: 'Sec A', classTeacher: 'Dr. Ramesh Kumar' },
  { id: '8-C',  label: 'Class 8',  section: 'Sec C', classTeacher: 'Ms. Iyer' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Section 1 Periods (Lectures I to V)
const SECTION_1_PERIODS: PeriodSlot[] = [
  { id: 'p1', numeral: 'I',   time: '8:00 - 8:40' },
  { id: 'p2', numeral: 'II',  time: '8:40 - 9:20' },
  { id: 'p3', numeral: 'III', time: '9:20 - 10:00' },
  { id: 'p4', numeral: 'IV',  time: '10:00 - 10:40' },
  { id: 'p5', numeral: 'V',   time: '10:40 - 11:20' },
];

// Section 2 Periods (Lectures VI to X)
const SECTION_2_PERIODS: PeriodSlot[] = [
  { id: 'p6',  numeral: 'VI',   time: '11:50 - 12:30' },
  { id: 'p7',  numeral: 'VII',  time: '12:30 - 1:10' },
  { id: 'p8',  numeral: 'VIII', time: '1:10 - 1:50' },
  { id: 'p9',  numeral: 'IX',   time: '1:50 - 2:30' },
  { id: 'p10', numeral: 'X',    time: '2:30 - 3:10' },
];

// ─── Timetable Master Matrix Data (30 cells for Sec 1, 30 cells for Sec 2) ───
const TIMETABLE_DATA: Record<string, Record<string, TimetableCellData>> = {
  Mon: {
    p1: { subject: 'Mathematics', shortSubject: 'MATH', teacher: 'Mr. Kapoor', room: 'Room 204', color: '#1E293B', badgeBg: '#F1F5F9', badgeFg: '#0F172A', note: 'Bring scientific calculator for trigonometry' },
    p2: { subject: 'Physics', shortSubject: 'PHYS', teacher: 'Dr. Ramesh', room: 'Lab 3', color: '#0284C7', badgeBg: '#E0F2FE', badgeFg: '#0369A1', note: 'Optics experiment preparation' },
    p3: { subject: 'English Lit.', shortSubject: 'ENG', teacher: 'Mrs. Roberts', room: 'Room 108', color: '#E11D48', badgeBg: '#FFE4E6', badgeFg: '#BE123C', note: 'Chapter 5 essay discussion' },
    p4: { subject: 'Chemistry', shortSubject: 'CHEM', teacher: 'Dr. S. Mehta', room: 'Lab 1', color: '#0D9488', badgeBg: '#CCFBF1', badgeFg: '#0F766E', note: 'Periodic table classification test' },
    p5: { subject: 'Physical Ed.', shortSubject: 'P.E.', teacher: 'Coach Davis', room: 'Ground', color: '#EA580C', badgeBg: '#FFEDD5', badgeFg: '#C2410C', note: 'Basketball practice & athletic drills' },
    p6: { subject: 'Computer Sci.', shortSubject: 'C.S.', teacher: 'Mr. V. Anand', room: 'Comp Lab', color: '#2563EB', badgeBg: '#DBEAFE', badgeFg: '#1D4ED8', note: 'Java arrays & logic loops lab' },
    p7: { subject: 'Social Studies', shortSubject: 'S.S.', teacher: 'Ms. Iyer', room: 'Room 201', color: '#7C3AED', badgeBg: '#EDE9FE', badgeFg: '#6D28D9', note: 'Indian Constitution & Rights' },
    p8: { subject: 'Biology', shortSubject: 'BIO', teacher: 'Dr. Ramesh', room: 'Lab 2', color: '#15803D', badgeBg: '#DCFCE7', badgeFg: '#15803D', note: 'Plant cell mitosis slides review' },
    p9: { subject: 'Hindi', shortSubject: 'HIN', teacher: 'Mrs. Sharma', room: 'Room 104', color: '#B45309', badgeBg: '#FEF3C7', badgeFg: '#B45309', note: 'Kavita path recitation' },
    p10: { subject: 'Library / Self', shortSubject: 'LIB', teacher: 'Ms. Roberts', room: 'Central Lib', color: '#64748B', badgeBg: '#F1F5F9', badgeFg: '#475569', note: 'Reference books reading hour' },
  },
  Tue: {
    p1: { subject: 'Physics', shortSubject: 'PHYS', teacher: 'Dr. Ramesh', room: 'Lab 3', color: '#0284C7', badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p2: { subject: 'Mathematics', shortSubject: 'MATH', teacher: 'Mr. Kapoor', room: 'Room 204', color: '#1E293B', badgeBg: '#F1F5F9', badgeFg: '#0F172A' },
    p3: { subject: 'Computer Sci.', shortSubject: 'C.S.', teacher: 'Mr. V. Anand', room: 'Comp Lab', color: '#2563EB', badgeBg: '#DBEAFE', badgeFg: '#1D4ED8' },
    p4: { subject: 'Biology', shortSubject: 'BIO', teacher: 'Dr. Ramesh', room: 'Lab 2', color: '#15803D', badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p5: { subject: 'Hindi', shortSubject: 'HIN', teacher: 'Mrs. Sharma', room: 'Room 104', color: '#B45309', badgeBg: '#FEF3C7', badgeFg: '#B45309' },
    p6: { subject: 'English Lit.', shortSubject: 'ENG', teacher: 'Mrs. Roberts', room: 'Room 108', color: '#E11D48', badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p7: { subject: 'Chemistry', shortSubject: 'CHEM', teacher: 'Dr. S. Mehta', room: 'Lab 1', color: '#0D9488', badgeBg: '#CCFBF1', badgeFg: '#0F766E' },
    p8: { subject: 'Environmental', shortSubject: 'E.V.S.', teacher: 'Mrs. Menon', room: 'Room 202', color: '#0F766E', badgeBg: '#E6FFFA', badgeFg: '#0D9488' },
    p9: { subject: 'Mathematics', shortSubject: 'MATH', teacher: 'Mr. Kapoor', room: 'Room 204', color: '#1E293B', badgeBg: '#F1F5F9', badgeFg: '#0F172A' },
    p10: { subject: 'Art & Craft', shortSubject: 'ART', teacher: 'Mr. Jenkins', room: 'Art Studio', color: '#AD2274', badgeBg: '#FCE7F3', badgeFg: '#BE185D' },
  },
  Wed: {
    p1: { subject: 'Chemistry', shortSubject: 'CHEM', teacher: 'Dr. S. Mehta', room: 'Lab 1', color: '#0D9488', badgeBg: '#CCFBF1', badgeFg: '#0F766E' },
    p2: { subject: 'English Lit.', shortSubject: 'ENG', teacher: 'Mrs. Roberts', room: 'Room 108', color: '#E11D48', badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p3: { subject: 'Mathematics', shortSubject: 'MATH', teacher: 'Mr. Kapoor', room: 'Room 204', color: '#1E293B', badgeBg: '#F1F5F9', badgeFg: '#0F172A' },
    p4: { subject: 'Social Studies', shortSubject: 'S.S.', teacher: 'Ms. Iyer', room: 'Room 201', color: '#7C3AED', badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p5: { subject: 'Art & Craft', shortSubject: 'ART', teacher: 'Mr. Jenkins', room: 'Art Studio', color: '#AD2274', badgeBg: '#FCE7F3', badgeFg: '#BE185D' },
    p6: { subject: 'Physics', shortSubject: 'PHYS', teacher: 'Dr. Ramesh', room: 'Lab 3', color: '#0284C7', badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p7: { subject: 'Biology', shortSubject: 'BIO', teacher: 'Dr. Ramesh', room: 'Lab 2', color: '#15803D', badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p8: { subject: 'Physical Ed.', shortSubject: 'P.E.', teacher: 'Coach Davis', room: 'Ground', color: '#EA580C', badgeBg: '#FFEDD5', badgeFg: '#C2410C' },
    p9: { subject: 'Computer Sci.', shortSubject: 'C.S.', teacher: 'Mr. V. Anand', room: 'Comp Lab', color: '#2563EB', badgeBg: '#DBEAFE', badgeFg: '#1D4ED8' },
    p10: { subject: 'Hindi', shortSubject: 'HIN', teacher: 'Mrs. Sharma', room: 'Room 104', color: '#B45309', badgeBg: '#FEF3C7', badgeFg: '#B45309' },
  },
  Thu: {
    p1: { subject: 'English Lit.', shortSubject: 'ENG', teacher: 'Mrs. Roberts', room: 'Room 108', color: '#E11D48', badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p2: { subject: 'Environmental', shortSubject: 'E.V.S.', teacher: 'Mrs. Menon', room: 'Room 202', color: '#0F766E', badgeBg: '#E6FFFA', badgeFg: '#0D9488' },
    p3: { subject: 'Physics', shortSubject: 'PHYS', teacher: 'Dr. Ramesh', room: 'Lab 3', color: '#0284C7', badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p4: { subject: 'Mathematics', shortSubject: 'MATH', teacher: 'Mr. Kapoor', room: 'Room 204', color: '#1E293B', badgeBg: '#F1F5F9', badgeFg: '#0F172A' },
    p5: { subject: 'Social Studies', shortSubject: 'S.S.', teacher: 'Ms. Iyer', room: 'Room 201', color: '#7C3AED', badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p6: { subject: 'Chemistry', shortSubject: 'CHEM', teacher: 'Dr. S. Mehta', room: 'Lab 1', color: '#0D9488', badgeBg: '#CCFBF1', badgeFg: '#0F766E' },
    p7: { subject: 'Computer Sci.', shortSubject: 'C.S.', teacher: 'Mr. V. Anand', room: 'Comp Lab', color: '#2563EB', badgeBg: '#DBEAFE', badgeFg: '#1D4ED8' },
    p8: { subject: 'Hindi', shortSubject: 'HIN', teacher: 'Mrs. Sharma', room: 'Room 104', color: '#B45309', badgeBg: '#FEF3C7', badgeFg: '#B45309' },
    p9: { subject: 'Biology', shortSubject: 'BIO', teacher: 'Dr. Ramesh', room: 'Lab 2', color: '#15803D', badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p10: { subject: 'Physical Ed.', shortSubject: 'P.E.', teacher: 'Coach Davis', room: 'Ground', color: '#EA580C', badgeBg: '#FFEDD5', badgeFg: '#C2410C' },
  },
  Fri: {
    p1: { subject: 'Mathematics', shortSubject: 'MATH', teacher: 'Mr. Kapoor', room: 'Room 204', color: '#1E293B', badgeBg: '#F1F5F9', badgeFg: '#0F172A' },
    p2: { subject: 'Chemistry', shortSubject: 'CHEM', teacher: 'Dr. S. Mehta', room: 'Lab 1', color: '#0D9488', badgeBg: '#CCFBF1', badgeFg: '#0F766E' },
    p3: { subject: 'Biology', shortSubject: 'BIO', teacher: 'Dr. Ramesh', room: 'Lab 2', color: '#15803D', badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p4: { subject: 'Physical Ed.', shortSubject: 'P.E.', teacher: 'Coach Davis', room: 'Ground', color: '#EA580C', badgeBg: '#FFEDD5', badgeFg: '#C2410C' },
    p5: { subject: 'Social Studies', shortSubject: 'S.S.', teacher: 'Ms. Iyer', room: 'Room 201', color: '#7C3AED', badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p6: { subject: 'English Lit.', shortSubject: 'ENG', teacher: 'Mrs. Roberts', room: 'Room 108', color: '#E11D48', badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p7: { subject: 'Physics', shortSubject: 'PHYS', teacher: 'Dr. Ramesh', room: 'Lab 3', color: '#0284C7', badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p8: { subject: 'Art & Craft', shortSubject: 'ART', teacher: 'Mr. Jenkins', room: 'Art Studio', color: '#AD2274', badgeBg: '#FCE7F3', badgeFg: '#BE185D' },
    p9: { subject: 'Hindi', shortSubject: 'HIN', teacher: 'Mrs. Sharma', room: 'Room 104', color: '#B45309', badgeBg: '#FEF3C7', badgeFg: '#B45309' },
    p10: { subject: 'Library / Self', shortSubject: 'LIB', teacher: 'Ms. Roberts', room: 'Central Lib', color: '#64748B', badgeBg: '#F1F5F9', badgeFg: '#475569' },
  },
  Sat: {
    p1: { subject: 'Computer Sci.', shortSubject: 'C.S.', teacher: 'Mr. V. Anand', room: 'Comp Lab', color: '#2563EB', badgeBg: '#DBEAFE', badgeFg: '#1D4ED8' },
    p2: { subject: 'Mathematics', shortSubject: 'MATH', teacher: 'Mr. Kapoor', room: 'Room 204', color: '#1E293B', badgeBg: '#F1F5F9', badgeFg: '#0F172A' },
    p3: { subject: 'Hindi', shortSubject: 'HIN', teacher: 'Mrs. Sharma', room: 'Room 104', color: '#B45309', badgeBg: '#FEF3C7', badgeFg: '#B45309' },
    p4: { subject: 'Library / Self', shortSubject: 'LIB', teacher: 'Ms. Roberts', room: 'Central Lib', color: '#64748B', badgeBg: '#F1F5F9', badgeFg: '#475569' },
    p5: { subject: 'General Sci.', shortSubject: 'SCI', teacher: 'Dr. Ramesh', room: 'Lab 3', color: '#16A34A', badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p6: { subject: 'Social Studies', shortSubject: 'S.S.', teacher: 'Ms. Iyer', room: 'Room 201', color: '#7C3AED', badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p7: { subject: 'English Lit.', shortSubject: 'ENG', teacher: 'Mrs. Roberts', room: 'Room 108', color: '#E11D48', badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p8: { subject: 'Physics', shortSubject: 'PHYS', teacher: 'Dr. Ramesh', room: 'Lab 3', color: '#0284C7', badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p9: { subject: 'Chemistry', shortSubject: 'CHEM', teacher: 'Dr. S. Mehta', room: 'Lab 1', color: '#0D9488', badgeBg: '#CCFBF1', badgeFg: '#0F766E' },
    p10: { subject: 'Club Activity', shortSubject: 'CLUB', teacher: 'Coordinator', room: 'Auditorium', color: '#AD2274', badgeBg: '#FCE7F3', badgeFg: '#BE185D' },
  },
};

export function TimetableGrid() {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState<ClassOption>(CLASS_OPTIONS[0]);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    period: PeriodSlot;
    cellData: TimetableCellData;
  } | null>(null);

  // Compute current day of week (e.g., 'Mon')
  const currentDayName = useMemo(() => {
    const dayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
    if (dayIndex >= 1 && dayIndex <= 6) {
      return DAYS[dayIndex - 1];
    }
    return 'Mon';
  }, []);

  // Helper renderer for a single Timetable Section (7 rows * 6 columns total)
  const renderTableSection = (periods: PeriodSlot[]) => {
    return (
      <View style={styles.sectionContainer}>
        {/* Non-scrollable 7-row x 6-column Matrix fitting 100% width & height */}
        <View style={styles.tableMatrix}>
          {/* ── ROW 0: Header Row (1 Day header col + 5 Period cols = 6 columns) ── */}
          <View style={styles.headerRow}>
            {/* Top-Left Corner Header Cell */}
            <View style={[styles.cell, styles.cornerHeaderCell]}>
              <Text style={styles.cornerHeaderLabel}>DAY</Text>
            </View>

            {/* 5 Period Header Cells */}
            {periods.map((period) => (
              <View key={period.id} style={[styles.cell, styles.periodHeaderCell]}>
                <View style={styles.periodNumeralBadge}>
                  <Text style={styles.periodNumeralText}>{period.numeral}</Text>
                </View>
                <Text style={styles.periodTimeText} numberOfLines={1}>
                  {period.time}
                </Text>
              </View>
            ))}
          </View>

          {/* ── ROWS 1 - 6: Day Rows (Mon to Sat) ── */}
          {DAYS.map((day) => {
            const isToday = day === currentDayName;

            return (
              <View
                key={day}
                style={[
                  styles.dataRow,
                  isToday && styles.todayRow,
                ]}
              >
                {/* Header Column: Day Name */}
                <View
                  style={[
                    styles.cell,
                    styles.dayHeaderCell,
                    isToday && styles.todayDayHeaderCell,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayHeaderLabel,
                      isToday && styles.todayDayHeaderLabel,
                    ]}
                  >
                    {day}
                  </Text>
                </View>

                {/* 5 Period Data Cells (Each day * 5 periods) */}
                {periods.map((period) => {
                  const cellData = TIMETABLE_DATA[day]?.[period.id];

                  if (!cellData) {
                    return (
                      <View key={period.id} style={[styles.cell, styles.emptyDataCell]}>
                        <Text style={styles.emptyText}>-</Text>
                      </View>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={period.id}
                      activeOpacity={0.75}
                      style={[styles.cell, styles.dataCell]}
                      onPress={() => setSelectedCell({ day, period, cellData })}
                    >
                      {/* Subject Name Tag */}
                      <View style={[styles.subjectTag, { backgroundColor: cellData.badgeBg }]}>
                        <Text
                          style={[styles.subjectTagText, { color: cellData.badgeFg }]}
                          numberOfLines={1}
                        >
                          {cellData.subject}
                        </Text>
                      </View>

                      {/* Teacher Name */}
                      <Text style={styles.teacherText} numberOfLines={1}>
                        {cellData.teacher}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* ── Top Header Bar ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <ChevronLeft size={22} color={COLORS.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            Timetable
          </Text>
        </View>

        {/* Center/Right: Class & Section selector (Replaces Month & Chevrons) */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.classSectionSelector}
          onPress={() => setIsClassModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Select Class and Section"
        >
          <GraduationCap size={15} color={COLORS.primary} strokeWidth={2.2} />
          <Text style={styles.classSectionText}>
            {selectedClass.label} · {selectedClass.section}
          </Text>
          <ChevronDown size={14} color={COLORS.secondary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── Main Viewport (Fixed single-screen layout, no scrolling) ── */}
      <View style={styles.mainContainer}>
        {/* Section 1: Morning Session (Lectures I to V) */}
        {renderTableSection(SECTION_1_PERIODS)}

        {/* Section 2: Afternoon Session (Lectures VI to X) */}
        {renderTableSection(SECTION_2_PERIODS)}
      </View>

      {/* ── Class & Section Switcher Modal ───────────────────── */}
      <Modal
        visible={isClassModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsClassModalOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setIsClassModalOpen(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class & Section</Text>
              <TouchableOpacity onPress={() => setIsClassModalOpen(false)}>
                <X size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.classList}>
              {CLASS_OPTIONS.map((item) => {
                const isSelected = item.id === selectedClass.id;

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    style={[
                      styles.classOptionCard,
                      isSelected && styles.classOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedClass(item);
                      setIsClassModalOpen(false);
                    }}
                  >
                    <View style={styles.classOptionIcon}>
                      <GraduationCap
                        size={20}
                        color={isSelected ? COLORS.onPrimary : COLORS.secondary}
                      />
                    </View>

                    <View style={styles.classOptionInfo}>
                      <Text
                        style={[
                          styles.classOptionTitle,
                          isSelected && styles.classOptionTitleSelected,
                        ]}
                      >
                        {item.label} ({item.section})
                      </Text>
                      <Text
                        style={[
                          styles.classOptionSub,
                          isSelected && styles.classOptionSubSelected,
                        ]}
                      >
                        Class Teacher: {item.classTeacher}
                      </Text>
                    </View>

                    {isSelected && (
                      <View style={styles.selectedCheck}>
                        <Sparkles size={14} color={COLORS.onPrimary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Period Detail Bottom Sheet Modal ──────────────────── */}
      <Modal
        visible={Boolean(selectedCell)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCell(null)}
      >
        {selectedCell && (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalOverlay}
            onPress={() => setSelectedCell(null)}
          >
            <View style={styles.detailSheet} onStartShouldSetResponder={() => true}>
              <View style={styles.modalDragHandle} />

              <View style={styles.detailHeader}>
                <View style={styles.detailHeaderLeft}>
                  <View
                    style={[
                      styles.detailCategoryPill,
                      { backgroundColor: selectedCell.cellData.badgeBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.detailCategoryText,
                        { color: selectedCell.cellData.badgeFg },
                      ]}
                    >
                      {selectedCell.cellData.shortSubject}
                    </Text>
                  </View>

                  <Text style={styles.detailDayText}>
                    {selectedCell.day} · Period {selectedCell.period.numeral}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => setSelectedCell(null)}>
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.detailSubjectTitle}>
                {selectedCell.cellData.subject}
              </Text>

              <View style={styles.detailMetaCard}>
                <View style={styles.detailMetaRow}>
                  <Clock size={16} color={COLORS.secondary} />
                  <Text style={styles.detailMetaLabel}>Time Slot:</Text>
                  <Text style={styles.detailMetaValue}>
                    {selectedCell.period.time}
                  </Text>
                </View>

                <View style={styles.detailMetaDivider} />

                <View style={styles.detailMetaRow}>
                  <User size={16} color={COLORS.secondary} />
                  <Text style={styles.detailMetaLabel}>Teacher:</Text>
                  <Text style={styles.detailMetaValue}>
                    {selectedCell.cellData.teacher}
                  </Text>
                </View>

                <View style={styles.detailMetaDivider} />

                <View style={styles.detailMetaRow}>
                  <MapPin size={16} color={COLORS.secondary} />
                  <Text style={styles.detailMetaLabel}>Location:</Text>
                  <Text style={styles.detailMetaValue}>
                    {selectedCell.cellData.room}
                  </Text>
                </View>
              </View>

              {selectedCell.cellData.note ? (
                <View style={styles.noteBox}>
                  <BookOpen size={15} color={COLORS.tertiary} />
                  <Text style={styles.noteText}>{selectedCell.cellData.note}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.closeSheetBtn}
                onPress={() => setSelectedCell(null)}
              >
                <Text style={styles.closeSheetBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      </Modal>
    </View>
  );
}

// ─── Single-Screen Styles (No Scroll, Fixed Percentage Grid) ─────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // Header (Top Bar with Title and Class/Sec Selector)
  header: {
    height: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  titleColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },

  // Class & Section Selector Pill
  classSectionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: 1,
    borderColor: COLORS.outline,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  classSectionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },

  // Main Viewport (Divides height evenly into Part 1 and Part 2)
  mainContainer: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 6,
  },

  // Section Container (Flex: 1 so each part gets 50% height)
  sectionContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    overflow: 'hidden',
  },

  // Table Matrix (Fills entire section container, 7 rows x 6 columns)
  tableMatrix: {
    flex: 1,
    flexDirection: 'column',
  },

  // Cell Baseline
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    justifyContent: 'center',
  },

  // ROW 0: Header Row (1 Day col [12% width] + 5 Period cols [17.6% width each])
  headerRow: {
    height: 32,
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceHigh,
  },
  cornerHeaderCell: {
    width: '12%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainer,
  },
  cornerHeaderLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  periodHeaderCell: {
    width: '17.6%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 1,
  },
  periodNumeralBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 5,
    paddingVertical: 0.5,
    borderRadius: 3,
  },
  periodNumeralText: {
    color: COLORS.onPrimary,
    fontSize: 9,
    fontWeight: '900',
  },
  periodTimeText: {
    fontSize: 7.5,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 1,
  },

  // ROWS 1 - 6: Day Rows (Mon - Sat)
  dataRow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLowest,
  },
  todayRow: {
    backgroundColor: '#F0F9FF',
  },
  dayHeaderCell: {
    width: '12%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLow,
  },
  todayDayHeaderCell: {
    backgroundColor: COLORS.primary,
  },
  dayHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
  },
  todayDayHeaderLabel: {
    color: COLORS.onPrimary,
  },

  // Data Cell (Subject Name Tag + Teacher Name)
  dataCell: {
    width: '17.6%',
    paddingHorizontal: 2,
    paddingVertical: 2,
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLowest,
  },
  emptyDataCell: {
    width: '17.6%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLow,
  },
  emptyText: {
    color: COLORS.outline,
    fontSize: 11,
  },

  subjectTag: {
    paddingHorizontal: 3,
    paddingVertical: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1.5,
  },
  subjectTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    textAlign: 'center',
  },
  teacherText: {
    fontSize: 8,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '88%',
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  classList: {
    gap: 10,
  },
  classOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    backgroundColor: COLORS.surfaceLow,
  },
  classOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  classOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classOptionInfo: {
    flex: 1,
  },
  classOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  classOptionTitleSelected: {
    color: COLORS.onPrimary,
  },
  classOptionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  classOptionSubSelected: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Detail Sheet Modal
  detailSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  modalDragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.outline,
    alignSelf: 'center',
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailCategoryText: {
    fontSize: 11,
    fontWeight: '900',
  },
  detailDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  detailSubjectTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  detailMetaCard: {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  detailMetaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    width: 76,
  },
  detailMetaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  detailMetaDivider: {
    height: 1,
    backgroundColor: COLORS.outline,
    opacity: 0.5,
    marginVertical: 4,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  noteText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.tertiary,
    flex: 1,
  },
  closeSheetBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeSheetBtnText: {
    color: COLORS.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
});
