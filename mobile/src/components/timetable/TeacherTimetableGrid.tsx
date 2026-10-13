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
  Users,
  Award,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';

// ─── Color & Design Tokens (Identical to Student Timetable) ───────────
const COLORS = {
  surface: '#f9f9ff',
  surfaceLow: '#f3f3f9',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#edecef',
  surfaceHigh: '#e8e7ee',
  text: '#191b20',
  textMuted: '#707884',
  outline: '#c3c6cf', // Thin crisp grey grid border
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

export type TeacherCellData = {
  className: string;   // e.g. "10-A", "12-B"
  fullClass: string;   // e.g. "Grade 10 - Section A"
  subject: string;     // e.g. "Accountancy", "Mathematics"
  shortSubject: string; // e.g. "ACCT", "MATH"
  room: string;        // e.g. "Room 204", "Lab 2"
  totalStudents: number;
  badgeBg: string;
  badgeFg: string;
  note?: string;
};

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

// ─── Teacher Timetable Master Matrix (Providing Class, Subject, and Room in every cell) ───
const TEACHER_TIMETABLE_DATA: Record<string, Record<string, TeacherCellData>> = {
  Mon: {
    p1: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-204', totalStudents: 36, badgeBg: '#E0F2FE', badgeFg: '#0369A1', note: 'Calculus and coordinate geometry exercises' },
    p2: { className: '12-B', fullClass: 'Grade 12 - Section B', subject: 'Physics Lab', shortSubject: 'PHYS', room: 'Lab 2', totalStudents: 28, badgeBg: '#DCFCE7', badgeFg: '#15803D', note: 'Optics and refraction experiment setup' },
    p3: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Commerce', shortSubject: 'COMM', room: 'R-204', totalStudents: 36, badgeBg: '#FEF3C7', badgeFg: '#B45309', note: 'Business transactions and ledger bookkeeping' },
    p4: { className: 'Staff', fullClass: 'Staff Room / Prep', subject: 'Free Prep', shortSubject: 'PREP', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B', note: 'Lesson planning & student homework checking' },
    p5: { className: '9-C', fullClass: 'Grade 9 - Section C', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-108', totalStudents: 40, badgeBg: '#E0F2FE', badgeFg: '#0369A1', note: 'Algebraic polynomials & factoring theorem' },
    p6: { className: '10-B', fullClass: 'Grade 10 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'R-205', totalStudents: 34, badgeBg: '#EDE9FE', badgeFg: '#6D28D9', note: 'Electromagnetism and Ohm’s law principles' },
    p7: { className: '11-A', fullClass: 'Grade 11 - Section A', subject: 'Accountancy', shortSubject: 'ACCT', room: 'R-302', totalStudents: 32, badgeBg: '#FFE4E6', badgeFg: '#BE123C', note: 'Balance sheet reconciliation & ledger posting' },
    p8: { className: 'Staff', fullClass: 'Staff Room / Mentoring', subject: 'Office Hours', shortSubject: 'OFFC', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B', note: 'Student queries and parent communication window' },
    p9: { className: '12-A', fullClass: 'Grade 12 - Section A', subject: 'Economics', shortSubject: 'ECON', room: 'R-305', totalStudents: 35, badgeBg: '#FFEDD5', badgeFg: '#C2410C', note: 'Macroeconomics & National income accounting' },
    p10: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Remedial', shortSubject: 'REMD', room: 'R-204', totalStudents: 15, badgeBg: '#F3E8FF', badgeFg: '#7C3AED', note: 'Doubt clearing session for upcoming board tests' },
  },
  Tue: {
    p1: { className: '12-B', fullClass: 'Grade 12 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'Lab 2', totalStudents: 28, badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p2: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-204', totalStudents: 36, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p3: { className: '11-A', fullClass: 'Grade 11 - Section A', subject: 'Accountancy', shortSubject: 'ACCT', room: 'R-302', totalStudents: 32, badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p4: { className: '9-C', fullClass: 'Grade 9 - Section C', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-108', totalStudents: 40, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p5: { className: 'Staff', fullClass: 'Staff Room / Prep', subject: 'Free Period', shortSubject: 'FREE', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
    p6: { className: '10-B', fullClass: 'Grade 10 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'R-205', totalStudents: 34, badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p7: { className: '12-A', fullClass: 'Grade 12 - Section A', subject: 'Business St.', shortSubject: 'BST', room: 'R-305', totalStudents: 35, badgeBg: '#FFEDD5', badgeFg: '#C2410C' },
    p8: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Commerce', shortSubject: 'COMM', room: 'R-204', totalStudents: 36, badgeBg: '#FEF3C7', badgeFg: '#B45309' },
    p9: { className: 'Staff', fullClass: 'Faculty Meeting', subject: 'Dept Meet', shortSubject: 'MEET', room: 'Conf Rm', totalStudents: 0, badgeBg: '#E2E8F0', badgeFg: '#334155' },
    p10: { className: '11-A', fullClass: 'Grade 11 - Section A', subject: 'Economics', shortSubject: 'ECON', room: 'R-302', totalStudents: 32, badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
  },
  Wed: {
    p1: { className: '9-C', fullClass: 'Grade 9 - Section C', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-108', totalStudents: 40, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p2: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-204', totalStudents: 36, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p3: { className: '10-B', fullClass: 'Grade 10 - Section B', subject: 'Physics Lab', shortSubject: 'PHYS', room: 'Lab 3', totalStudents: 34, badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p4: { className: '12-A', fullClass: 'Grade 12 - Section A', subject: 'Accountancy', shortSubject: 'ACCT', room: 'R-305', totalStudents: 35, badgeBg: '#FFEDD5', badgeFg: '#C2410C' },
    p5: { className: 'Staff', fullClass: 'Staff Room / Prep', subject: 'Free Period', shortSubject: 'FREE', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
    p6: { className: '12-B', fullClass: 'Grade 12 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'Lab 2', totalStudents: 28, badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p7: { className: '11-A', fullClass: 'Grade 11 - Section A', subject: 'Commerce', shortSubject: 'COMM', room: 'R-302', totalStudents: 32, badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p8: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Assembly', shortSubject: 'ASSM', room: 'R-204', totalStudents: 36, badgeBg: '#FEF3C7', badgeFg: '#B45309' },
    p9: { className: '9-C', fullClass: 'Grade 9 - Section C', subject: 'Problem Solve', shortSubject: 'PRBL', room: 'R-108', totalStudents: 40, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p10: { className: 'Staff', fullClass: 'Evaluation Room', subject: 'Paper Check', shortSubject: 'EVAL', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
  },
  Thu: {
    p1: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-204', totalStudents: 36, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p2: { className: '11-A', fullClass: 'Grade 11 - Section A', subject: 'Economics', shortSubject: 'ECON', room: 'R-302', totalStudents: 32, badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p3: { className: '12-B', fullClass: 'Grade 12 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'Lab 2', totalStudents: 28, badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p4: { className: '10-B', fullClass: 'Grade 10 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'R-205', totalStudents: 34, badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p5: { className: 'Staff', fullClass: 'Staff Room / Prep', subject: 'Free Period', shortSubject: 'FREE', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
    p6: { className: '9-C', fullClass: 'Grade 9 - Section C', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-108', totalStudents: 40, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p7: { className: '12-A', fullClass: 'Grade 12 - Section A', subject: 'Business St.', shortSubject: 'BST', room: 'R-305', totalStudents: 35, badgeBg: '#FFEDD5', badgeFg: '#C2410C' },
    p8: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Commerce', shortSubject: 'COMM', room: 'R-204', totalStudents: 36, badgeBg: '#FEF3C7', badgeFg: '#B45309' },
    p9: { className: 'Staff', fullClass: 'Staff Room / Prep', subject: 'Free Period', shortSubject: 'FREE', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
    p10: { className: '11-A', fullClass: 'Grade 11 - Section A', subject: 'Accountancy', shortSubject: 'ACCT', room: 'R-302', totalStudents: 32, badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
  },
  Fri: {
    p1: { className: '12-A', fullClass: 'Grade 12 - Section A', subject: 'Accountancy', shortSubject: 'ACCT', room: 'R-305', totalStudents: 35, badgeBg: '#FFEDD5', badgeFg: '#C2410C' },
    p2: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-204', totalStudents: 36, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p3: { className: '9-C', fullClass: 'Grade 9 - Section C', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-108', totalStudents: 40, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p4: { className: '12-B', fullClass: 'Grade 12 - Section B', subject: 'Physics Lab', shortSubject: 'PHYS', room: 'Lab 2', totalStudents: 28, badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p5: { className: 'Staff', fullClass: 'Staff Room / Prep', subject: 'Free Period', shortSubject: 'FREE', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
    p6: { className: '10-B', fullClass: 'Grade 10 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'R-205', totalStudents: 34, badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p7: { className: '11-A', fullClass: 'Grade 11 - Section A', subject: 'Economics', shortSubject: 'ECON', room: 'R-302', totalStudents: 32, badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p8: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Commerce', shortSubject: 'COMM', room: 'R-204', totalStudents: 36, badgeBg: '#FEF3C7', badgeFg: '#B45309' },
    p9: { className: 'Staff', fullClass: 'Activity Hour', subject: 'Club Mentor', shortSubject: 'CLUB', room: 'Auditorium', totalStudents: 45, badgeBg: '#F3E8FF', badgeFg: '#7C3AED' },
    p10: { className: 'Staff', fullClass: 'Weekly Wrap', subject: 'Staff Wrap', shortSubject: 'WRAP', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
  },
  Sat: {
    p1: { className: '10-A', fullClass: 'Grade 10 - Section A', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-204', totalStudents: 36, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p2: { className: '11-A', fullClass: 'Grade 11 - Section A', subject: 'Accountancy', shortSubject: 'ACCT', room: 'R-302', totalStudents: 32, badgeBg: '#FFE4E6', badgeFg: '#BE123C' },
    p3: { className: '12-B', fullClass: 'Grade 12 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'Lab 2', totalStudents: 28, badgeBg: '#DCFCE7', badgeFg: '#15803D' },
    p4: { className: '9-C', fullClass: 'Grade 9 - Section C', subject: 'Mathematics', shortSubject: 'MATH', room: 'R-108', totalStudents: 40, badgeBg: '#E0F2FE', badgeFg: '#0369A1' },
    p5: { className: '10-B', fullClass: 'Grade 10 - Section B', subject: 'Physics', shortSubject: 'PHYS', room: 'R-205', totalStudents: 34, badgeBg: '#EDE9FE', badgeFg: '#6D28D9' },
    p6: { className: 'Staff', fullClass: 'PTA / Parent Desk', subject: 'Parent Meet', shortSubject: 'PTA', room: 'Main Hall', totalStudents: 0, badgeBg: '#FFEDD5', badgeFg: '#C2410C' },
    p7: { className: 'Staff', fullClass: 'Weekend Planning', subject: 'Planning', shortSubject: 'PLAN', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
    p8: { className: 'Staff', fullClass: 'Free Period', subject: 'Free Period', shortSubject: 'FREE', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
    p9: { className: 'Staff', fullClass: 'Free Period', subject: 'Free Period', shortSubject: 'FREE', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
    p10: { className: 'Staff', fullClass: 'Free Period', subject: 'Free Period', shortSubject: 'FREE', room: 'Cabin 3', totalStudents: 0, badgeBg: '#F1F5F9', badgeFg: '#64748B' },
  },
};

export function TeacherTimetableGrid() {
  const router = useRouter();
  const [selectedCell, setSelectedCell] = useState<{
    day: string;
    period: PeriodSlot;
    cellData: TeacherCellData;
  } | null>(null);

  // Compute current day of week (e.g., 'Mon')
  const currentDayName = useMemo(() => {
    const dayIndex = new Date().getDay();
    if (dayIndex >= 1 && dayIndex <= 6) {
      return DAYS[dayIndex - 1];
    }
    return 'Mon';
  }, []);

  // Helper renderer for a single Timetable Section (7 rows * 6 columns total)
  const renderTableSection = (periods: PeriodSlot[]) => {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.tableMatrix}>
          {/* ── ROW 0: Header Row ── */}
          <View style={styles.headerRow}>
            <View style={[styles.cell, styles.cornerHeaderCell]}>
              <Text style={styles.cornerHeaderLabel}>DAY</Text>
            </View>

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

                {/* 5 Period Data Cells: Providing Class, Subject, and Room No. in every cell */}
                {periods.map((period) => {
                  const cellData = TEACHER_TIMETABLE_DATA[day]?.[period.id];

                  if (!cellData) {
                    return (
                      <View key={period.id} style={[styles.cell, styles.emptyDataCell]}>
                        <Text style={styles.emptyText}>-</Text>
                      </View>
                    );
                  }

                  const isFree = cellData.className === 'Staff';

                  return (
                    <TouchableOpacity
                      key={period.id}
                      activeOpacity={0.75}
                      style={[styles.cell, styles.dataCell, isFree && styles.freeDataCell]}
                      onPress={() => setSelectedCell({ day, period, cellData })}
                    >
                      {/* 1. Class Badge */}
                      <View style={[styles.classTag, { backgroundColor: cellData.badgeBg }]}>
                        <Text
                          style={[styles.classTagText, { color: cellData.badgeFg }]}
                          numberOfLines={1}
                        >
                          {cellData.className}
                        </Text>
                      </View>

                      {/* 2. Subject Name */}
                      <Text style={styles.subjectText} numberOfLines={1}>
                        {cellData.subject}
                      </Text>

                      {/* 3. Room No */}
                      <Text style={styles.roomText} numberOfLines={1}>
                        {cellData.room}
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
            Teacher Schedule
          </Text>
        </View>

        {/* Center/Right: Teacher Badge */}
        <View style={styles.teacherBadge}>
          <Award size={14} color="#1B8CC4" strokeWidth={2.2} />
          <Text style={styles.teacherBadgeText} numberOfLines={1}>
            Mrs. Priya Sharma · 10-A
          </Text>
        </View>
      </View>

      {/* ── Main Viewport (Fixed single-screen layout, no scrolling) ── */}
      <View style={styles.mainContainer}>
        {/* Section 1: Morning Session (Lectures I to V) */}
        {renderTableSection(SECTION_1_PERIODS)}

        {/* Section 2: Afternoon Session (Lectures VI to X) */}
        {renderTableSection(SECTION_2_PERIODS)}
      </View>

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
                      {selectedCell.cellData.className}
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
                    {selectedCell.period.time} ({selectedCell.period.numeral})
                  </Text>
                </View>

                <View style={styles.detailMetaDivider} />

                <View style={styles.detailMetaRow}>
                  <GraduationCap size={16} color={COLORS.secondary} />
                  <Text style={styles.detailMetaLabel}>Class & Sec:</Text>
                  <Text style={styles.detailMetaValue}>
                    {selectedCell.cellData.fullClass}
                  </Text>
                </View>

                <View style={styles.detailMetaDivider} />

                <View style={styles.detailMetaRow}>
                  <MapPin size={16} color={COLORS.secondary} />
                  <Text style={styles.detailMetaLabel}>Room / Venue:</Text>
                  <Text style={styles.detailMetaValue}>
                    {selectedCell.cellData.room}
                  </Text>
                </View>

                {selectedCell.cellData.totalStudents > 0 ? (
                  <>
                    <View style={styles.detailMetaDivider} />
                    <View style={styles.detailMetaRow}>
                      <Users size={16} color={COLORS.secondary} />
                      <Text style={styles.detailMetaLabel}>Roster Count:</Text>
                      <Text style={styles.detailMetaValue}>
                        {selectedCell.cellData.totalStudents} Students
                      </Text>
                    </View>
                  </>
                ) : null}
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

// ─── Single-Screen Styles (Identical Grid Outline Architecture to Student) ───
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },

  // ── Header (Top Bar with Title and Badge) ──
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
    backgroundColor: COLORS.surfaceLow,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
  },
  teacherBadge: {
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
  teacherBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },

  // ── Main Viewport (Divides height evenly into Part 1 and Part 2) ──
  mainContainer: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 6,
  },

  // ── Section Container (Flex: 1 so each part gets 50% height) ──
  sectionContainer: {
    flex: 1,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    overflow: 'hidden',
  },

  // ── Table Matrix (Fills entire section container, 7 rows x 6 columns) ──
  tableMatrix: {
    flex: 1,
    flexDirection: 'column',
  },

  // ── Cell Baseline (Thin grey lines on every cell separating all rows & columns) ──
  cell: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    justifyContent: 'center',
  },

  // ── ROW 0: Header Row (1 Day col [12% width] + 5 Period cols [17.6% width each]) ──
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

  // ── ROWS 1 - 6: Day Rows (Mon - Sat) ──
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

  // ── Columns 1-5: Period Data Cells (Providing Class, Subject, Room No) ──
  dataCell: {
    width: '17.6%',
    paddingHorizontal: 1.5,
    paddingVertical: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
  },
  freeDataCell: {
    backgroundColor: '#FAFAFA',
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

  // 1. Class Tag
  classTag: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    alignSelf: 'stretch',
  },
  classTagText: {
    fontSize: 7.5,
    fontWeight: '800',
    textAlign: 'center',
  },

  // 2. Subject Text
  subjectText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 0.5,
  },

  // 3. Room Text
  roomText: {
    fontSize: 7,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // ── Bottom Sheet Period Detail Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  detailSheet: {
    backgroundColor: COLORS.surfaceLowest,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 12,
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
    marginBottom: 10,
  },
  detailHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailCategoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailCategoryText: {
    fontSize: 12,
    fontWeight: '800',
  },
  detailDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  detailSubjectTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 16,
  },
  detailMetaCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailMetaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    width: 95,
  },
  detailMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  detailMetaDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: '#9A3412',
    fontWeight: '500',
  },
  closeSheetBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSheetBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
