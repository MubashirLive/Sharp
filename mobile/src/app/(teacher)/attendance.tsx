import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  Edit3,
  Eye,
  Filter,
  GraduationCap,
  Lock,
  PenTool,
  Percent,
  Plus,
  Search,
  Users,
  X,
} from 'lucide-react-native';
import { CalendarGrid, toDate, toDateKey, sameMonth } from '@/components/calendar/CalendarGrid';

// ─── Theme & Colors (Identical to Student App) ──────────────────────────────
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
  presentBg: '#e8f9ed',
  presentText: '#14532d',
  absent: '#ef3d3d',
  absentBg: '#fee2e2',
  absentText: '#7f1d1d',
  leave: '#f3ce28',
  leaveBg: '#fef9c3',
  leaveText: '#713f12',
  sunday: '#dfe3ea',
  sundayText: '#8b929d',
  warning: '#b45309',
  tertiary: '#ad2274',
};

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

export type Student = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  avatarBg: string;
  initials: string;
  attendanceByDate: Record<string, AttendanceRecord>;
};

// ─── School Structure Constants ─────────────────────────────────────────────
const CLASSES = ['Grade 10', 'Grade 9', 'Grade 12', 'Grade 8'];
const SECTIONS_BY_CLASS: Record<string, string[]> = {
  'Grade 10': ['Section A', 'Section B'],
  'Grade 9': ['Section A', 'Section B', 'Section C'],
  'Grade 12': ['Section A', 'Section B'],
  'Grade 8': ['Section A', 'Section B'],
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

// ─── Helper for Double-Digit Formatting ──────────────────────────────────────
const to2Digits = (num: number): string => String(num).padStart(2, '0');

// ─── Deterministic Seeded Generator for Roster Data ──────────────────────────
function generateStudentAttendance(seedStr: string): Record<string, AttendanceRecord> {
  const records: Record<string, AttendanceRecord> = {};
  const seedNum = seedStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const months = [
    { year: 2026, month: 3, days: 30 }, // April
    { year: 2026, month: 4, days: 31 }, // May
    { year: 2026, month: 5, days: 30 }, // June
    { year: 2026, month: 6, days: 31 }, // July
  ];

  months.forEach(({ year, month, days }) => {
    for (let day = 1; day <= days; day++) {
      const d = new Date(year, month, day);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (dateKey > TODAY_KEY) continue;
      if (d.getDay() === 0) continue; // Sunday
      if (HOLIDAYS[dateKey]) continue; // Holiday

      const val = (seedNum * 17 + day * 13 + (month + 1) * 31) % 100;
      if (val < 85) {
        records[dateKey] = { status: 'present' };
      } else if (val < 94) {
        records[dateKey] = { status: 'absent', note: 'Absent without notice.' };
      } else {
        records[dateKey] = { status: 'leave', note: 'Leave approved by class teacher.' };
      }
    }
  });

  return records;
}

// ─── Comprehensive Multi-Class Student Database ─────────────────────────────
const MOCK_STUDENTS: Student[] = [
  // Grade 10 - Section A (36 students)
  { id: '10A-01', name: 'Aarav Sharma', rollNo: '01', className: 'Grade 10', section: 'Section A', avatarBg: '#3B82F6', initials: 'AS', attendanceByDate: generateStudentAttendance('10A-01-Aarav') },
  { id: '10A-02', name: 'Aditi Patel', rollNo: '02', className: 'Grade 10', section: 'Section A', avatarBg: '#EC4899', initials: 'AP', attendanceByDate: generateStudentAttendance('10A-02-Aditi') },
  { id: '10A-03', name: 'Alex Johnson', rollNo: '03', className: 'Grade 10', section: 'Section A', avatarBg: '#000000', initials: 'AJ', attendanceByDate: generateStudentAttendance('10A-03-Alex') },
  { id: '10A-04', name: 'Ananya Verma', rollNo: '04', className: 'Grade 10', section: 'Section A', avatarBg: '#10B981', initials: 'AV', attendanceByDate: generateStudentAttendance('10A-04-Ananya') },
  { id: '10A-05', name: 'Devansh Gupta', rollNo: '05', className: 'Grade 10', section: 'Section A', avatarBg: '#F59E0B', initials: 'DG', attendanceByDate: generateStudentAttendance('10A-05-Devansh') },
  { id: '10A-06', name: 'Diya Kapoor', rollNo: '06', className: 'Grade 10', section: 'Section A', avatarBg: '#8B5CF6', initials: 'DK', attendanceByDate: generateStudentAttendance('10A-06-Diya') },
  { id: '10A-07', name: 'Ishan Kumar', rollNo: '07', className: 'Grade 10', section: 'Section A', avatarBg: '#059669', initials: 'IK', attendanceByDate: generateStudentAttendance('10A-07-Ishan') },
  { id: '10A-08', name: 'Kabir Singh', rollNo: '08', className: 'Grade 10', section: 'Section A', avatarBg: '#EF4444', initials: 'KS', attendanceByDate: generateStudentAttendance('10A-08-Kabir') },
  { id: '10A-09', name: 'Kavya Roy', rollNo: '09', className: 'Grade 10', section: 'Section A', avatarBg: '#6366F1', initials: 'KR', attendanceByDate: generateStudentAttendance('10A-09-Kavya') },
  { id: '10A-10', name: 'Marcus Johnson', rollNo: '10', className: 'Grade 10', section: 'Section A', avatarBg: '#10B981', initials: 'MJ', attendanceByDate: generateStudentAttendance('10A-10-Marcus') },
  { id: '10A-11', name: 'Meera Das', rollNo: '11', className: 'Grade 10', section: 'Section A', avatarBg: '#EC4899', initials: 'MD', attendanceByDate: generateStudentAttendance('10A-11-Meera') },
  { id: '10A-12', name: 'Nikhil Mehta', rollNo: '12', className: 'Grade 10', section: 'Section A', avatarBg: '#3B82F6', initials: 'NM', attendanceByDate: generateStudentAttendance('10A-12-Nikhil') },
  { id: '10A-13', name: 'Riya Bose', rollNo: '13', className: 'Grade 10', section: 'Section A', avatarBg: '#8B5CF6', initials: 'RB', attendanceByDate: generateStudentAttendance('10A-13-Riya') },
  { id: '10A-14', name: 'Siddharth Rao', rollNo: '14', className: 'Grade 10', section: 'Section A', avatarBg: '#F59E0B', initials: 'SR', attendanceByDate: generateStudentAttendance('10A-14-Siddharth') },
  { id: '10A-15', name: 'Vihaan Joshi', rollNo: '15', className: 'Grade 10', section: 'Section A', avatarBg: '#000000', initials: 'VJ', attendanceByDate: generateStudentAttendance('10A-15-Vihaan') },
  { id: '10A-16', name: 'Zoya Khan', rollNo: '16', className: 'Grade 10', section: 'Section A', avatarBg: '#EC4899', initials: 'ZK', attendanceByDate: generateStudentAttendance('10A-16-Zoya') },
  { id: '10A-17', name: 'Yashwardhan Roy', rollNo: '17', className: 'Grade 10', section: 'Section A', avatarBg: '#3B82F6', initials: 'YR', attendanceByDate: generateStudentAttendance('10A-17-Yash') },
  { id: '10A-18', name: 'Tanya Malhotra', rollNo: '18', className: 'Grade 10', section: 'Section A', avatarBg: '#8B5CF6', initials: 'TM', attendanceByDate: generateStudentAttendance('10A-18-Tanya') },
  { id: '10A-19', name: 'Samar Pratap', rollNo: '19', className: 'Grade 10', section: 'Section A', avatarBg: '#F59E0B', initials: 'SP', attendanceByDate: generateStudentAttendance('10A-19-Samar') },
  { id: '10A-20', name: 'Rohan Mehra', rollNo: '20', className: 'Grade 10', section: 'Section A', avatarBg: '#10B981', initials: 'RM', attendanceByDate: generateStudentAttendance('10A-20-Rohan') },
  { id: '10A-21', name: 'Pooja Hegde', rollNo: '21', className: 'Grade 10', section: 'Section A', avatarBg: '#EF4444', initials: 'PH', attendanceByDate: generateStudentAttendance('10A-21-Pooja') },
  { id: '10A-22', name: 'Omkar Salvi', rollNo: '22', className: 'Grade 10', section: 'Section A', avatarBg: '#6366F1', initials: 'OS', attendanceByDate: generateStudentAttendance('10A-22-Omkar') },
  { id: '10A-23', name: 'Neha Kakkar', rollNo: '23', className: 'Grade 10', section: 'Section A', avatarBg: '#EC4899', initials: 'NK', attendanceByDate: generateStudentAttendance('10A-23-Neha') },
  { id: '10A-24', name: 'Manish Pandey', rollNo: '24', className: 'Grade 10', section: 'Section A', avatarBg: '#059669', initials: 'MP', attendanceByDate: generateStudentAttendance('10A-24-Manish') },
  { id: '10A-25', name: 'Lakshya Sen', rollNo: '25', className: 'Grade 10', section: 'Section A', avatarBg: '#3B82F6', initials: 'LS', attendanceByDate: generateStudentAttendance('10A-25-Lakshya') },
  { id: '10A-26', name: 'Kriti Sanon', rollNo: '26', className: 'Grade 10', section: 'Section A', avatarBg: '#F59E0B', initials: 'KS', attendanceByDate: generateStudentAttendance('10A-26-Kriti') },
  { id: '10A-27', name: 'Jatin Sapru', rollNo: '27', className: 'Grade 10', section: 'Section A', avatarBg: '#8B5CF6', initials: 'JS', attendanceByDate: generateStudentAttendance('10A-27-Jatin') },
  { id: '10A-28', name: 'Hitesh Modi', rollNo: '28', className: 'Grade 10', section: 'Section A', avatarBg: '#000000', initials: 'HM', attendanceByDate: generateStudentAttendance('10A-28-Hitesh') },
  { id: '10A-29', name: 'Garima Sharma', rollNo: '29', className: 'Grade 10', section: 'Section A', avatarBg: '#10B981', initials: 'GS', attendanceByDate: generateStudentAttendance('10A-29-Garima') },
  { id: '10A-30', name: 'Faisal Khan', rollNo: '30', className: 'Grade 10', section: 'Section A', avatarBg: '#EF4444', initials: 'FK', attendanceByDate: generateStudentAttendance('10A-30-Faisal') },
  { id: '10A-31', name: 'Ekta Kapoor', rollNo: '31', className: 'Grade 10', section: 'Section A', avatarBg: '#EC4899', initials: 'EK', attendanceByDate: generateStudentAttendance('10A-31-Ekta') },
  { id: '10A-32', name: 'Danish Sait', rollNo: '32', className: 'Grade 10', section: 'Section A', avatarBg: '#6366F1', initials: 'DS', attendanceByDate: generateStudentAttendance('10A-32-Danish') },
  { id: '10A-33', name: 'Chetan Hans', rollNo: '33', className: 'Grade 10', section: 'Section A', avatarBg: '#059669', initials: 'CH', attendanceByDate: generateStudentAttendance('10A-33-Chetan') },
  { id: '10A-34', name: 'Bhumika Chawla', rollNo: '34', className: 'Grade 10', section: 'Section A', avatarBg: '#F59E0B', initials: 'BC', attendanceByDate: generateStudentAttendance('10A-34-Bhumika') },
  { id: '10A-35', name: 'Armaan Malik', rollNo: '35', className: 'Grade 10', section: 'Section A', avatarBg: '#3B82F6', initials: 'AM', attendanceByDate: generateStudentAttendance('10A-35-Armaan') },
  { id: '10A-36', name: 'Alia Bhatt', rollNo: '36', className: 'Grade 10', section: 'Section A', avatarBg: '#8B5CF6', initials: 'AB', attendanceByDate: generateStudentAttendance('10A-36-Alia') },

  // Grade 10 - Section B
  { id: '10B-01', name: 'Aakash Nair', rollNo: '01', className: 'Grade 10', section: 'Section B', avatarBg: '#3B82F6', initials: 'AN', attendanceByDate: generateStudentAttendance('10B-01-Aakash') },
  { id: '10B-02', name: 'Bhavna Chawla', rollNo: '02', className: 'Grade 10', section: 'Section B', avatarBg: '#EC4899', initials: 'BC', attendanceByDate: generateStudentAttendance('10B-02-Bhavna') },
  { id: '10B-03', name: 'Chirag Sethi', rollNo: '03', className: 'Grade 10', section: 'Section B', avatarBg: '#F59E0B', initials: 'CS', attendanceByDate: generateStudentAttendance('10B-03-Chirag') },
  { id: '10B-04', name: 'Deepika Sen', rollNo: '04', className: 'Grade 10', section: 'Section B', avatarBg: '#10B981', initials: 'DS', attendanceByDate: generateStudentAttendance('10B-04-Deepika') },
  { id: '10B-05', name: 'Farhan Ali', rollNo: '05', className: 'Grade 10', section: 'Section B', avatarBg: '#6366F1', initials: 'FA', attendanceByDate: generateStudentAttendance('10B-05-Farhan') },
  { id: '10B-06', name: 'Gauri Shinde', rollNo: '06', className: 'Grade 10', section: 'Section B', avatarBg: '#8B5CF6', initials: 'GS', attendanceByDate: generateStudentAttendance('10B-06-Gauri') },
  { id: '10B-07', name: 'Harsh Vardhan', rollNo: '07', className: 'Grade 10', section: 'Section B', avatarBg: '#EF4444', initials: 'HV', attendanceByDate: generateStudentAttendance('10B-07-Harsh') },
  { id: '10B-08', name: 'Isha Reddy', rollNo: '08', className: 'Grade 10', section: 'Section B', avatarBg: '#059669', initials: 'IR', attendanceByDate: generateStudentAttendance('10B-08-Isha') },

  // Grade 9 - Section A
  { id: '9A-01', name: 'Abhinav Tyagi', rollNo: '01', className: 'Grade 9', section: 'Section A', avatarBg: '#3B82F6', initials: 'AT', attendanceByDate: generateStudentAttendance('9A-01-Abhinav') },
  { id: '9A-02', name: 'Bani Khurana', rollNo: '02', className: 'Grade 9', section: 'Section A', avatarBg: '#EC4899', initials: 'BK', attendanceByDate: generateStudentAttendance('9A-02-Bani') },
  { id: '9A-03', name: 'Chetan Bhagat', rollNo: '03', className: 'Grade 9', section: 'Section A', avatarBg: '#F59E0B', initials: 'CB', attendanceByDate: generateStudentAttendance('9A-03-Chetan') },
  { id: '9A-04', name: 'Divya Dutta', rollNo: '04', className: 'Grade 9', section: 'Section A', avatarBg: '#10B981', initials: 'DD', attendanceByDate: generateStudentAttendance('9A-04-Divya') },
  { id: '9A-05', name: 'Ehsan Mani', rollNo: '05', className: 'Grade 9', section: 'Section A', avatarBg: '#6366F1', initials: 'EM', attendanceByDate: generateStudentAttendance('9A-05-Ehsan') },

  // Grade 9 - Section B
  { id: '9B-01', name: 'Gautam Gambhir', rollNo: '01', className: 'Grade 9', section: 'Section B', avatarBg: '#059669', initials: 'GG', attendanceByDate: generateStudentAttendance('9B-01-Gautam') },
  { id: '9B-02', name: 'Hansika Motwani', rollNo: '02', className: 'Grade 9', section: 'Section B', avatarBg: '#EC4899', initials: 'HM', attendanceByDate: generateStudentAttendance('9B-02-Hansika') },
  { id: '9B-03', name: 'Inderjeet Singh', rollNo: '03', className: 'Grade 9', section: 'Section B', avatarBg: '#3B82F6', initials: 'IS', attendanceByDate: generateStudentAttendance('9B-03-Inderjeet') },

  // Grade 12 - Section A
  { id: '12A-01', name: 'Arjun Rampal', rollNo: '01', className: 'Grade 12', section: 'Section A', avatarBg: '#000000', initials: 'AR', attendanceByDate: generateStudentAttendance('12A-01-Arjun') },
  { id: '12A-02', name: 'Bipasha Basu', rollNo: '02', className: 'Grade 12', section: 'Section A', avatarBg: '#EC4899', initials: 'BB', attendanceByDate: generateStudentAttendance('12A-02-Bipasha') },
  { id: '12A-03', name: 'Charu Asopa', rollNo: '03', className: 'Grade 12', section: 'Section A', avatarBg: '#F59E0B', initials: 'CA', attendanceByDate: generateStudentAttendance('12A-03-Charu') },
  { id: '12A-04', name: 'Dhruv Rathee', rollNo: '04', className: 'Grade 12', section: 'Section A', avatarBg: '#10B981', initials: 'DR', attendanceByDate: generateStudentAttendance('12A-04-Dhruv') },

  // Grade 8 - Section A
  { id: '8A-01', name: 'Aryan Khan', rollNo: '01', className: 'Grade 8', section: 'Section A', avatarBg: '#8B5CF6', initials: 'AK', attendanceByDate: generateStudentAttendance('8A-01-Aryan') },
  { id: '8A-02', name: 'Barkha Singh', rollNo: '02', className: 'Grade 8', section: 'Section A', avatarBg: '#EC4899', initials: 'BS', attendanceByDate: generateStudentAttendance('8A-02-Barkha') },
  { id: '8A-03', name: 'Chaitanya Sharma', rollNo: '03', className: 'Grade 8', section: 'Section A', avatarBg: '#3B82F6', initials: 'CS', attendanceByDate: generateStudentAttendance('8A-03-Chaitanya') },
];

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

function statusMeta(status: AttendanceStatus) {
  switch (status) {
    case 'present':
      return { label: 'Present', color: COLORS.present, text: COLORS.presentText, bg: COLORS.presentBg };
    case 'absent':
      return { label: 'Absent', color: COLORS.absent, text: COLORS.absentText, bg: COLORS.absentBg };
    case 'leave':
      return { label: 'Leave', color: COLORS.leave, text: COLORS.leaveText, bg: COLORS.leaveBg };
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

export default function TeacherAttendanceScreen() {
  const router = useRouter();

  // ─── Dropdowns & Search State ─────────────────────────────────────────────
  const [selectedClass, setSelectedClass] = useState<string | null>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string | null>('Section A');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Dropdown Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);

  // ─── Calendar & Date State ────────────────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(TODAY_KEY);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = toDate(TODAY_KEY);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });
  const [statsTab, setStatsTab] = useState<'month' | 'overall'>('month');

  // Available sections based on selected class
  const availableSections = useMemo(() => {
    if (!selectedClass) return [];
    return SECTIONS_BY_CLASS[selectedClass] || [];
  }, [selectedClass]);

  // Handle Class Selection
  const handleSelectClass = (cls: string | null) => {
    setSelectedClass(cls);
    setSelectedSection(null);
    setSelectedStudent(null);
    setIsClassModalOpen(false);
  };

  // Handle Section Selection
  const handleSelectSection = (sec: string | null) => {
    setSelectedSection(sec);
    setSelectedStudent(null);
    setIsSectionModalOpen(false);
  };

  // ─── Scoped Student Search Filter ─────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    let pool = MOCK_STUDENTS;

    if (selectedClass && selectedSection) {
      pool = pool.filter((s) => s.className === selectedClass && s.section === selectedSection);
    } else if (selectedClass) {
      pool = pool.filter((s) => s.className === selectedClass);
    }

    if (!searchQuery.trim()) {
      return pool;
    }

    const q = searchQuery.toLowerCase().trim();
    return pool.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.rollNo.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q)
    );
  }, [selectedClass, selectedSection, searchQuery]);

  // Dynamic search placeholder text
  const searchPlaceholder = useMemo(() => {
    if (selectedClass && selectedSection) {
      return `Search in ${selectedClass}-${selectedSection.replace('Section ', '')}...`;
    }
    if (selectedClass) {
      return `Search in ${selectedClass}...`;
    }
    return 'Search all students in school...';
  }, [selectedClass, selectedSection]);

  // Search scope badge text
  const searchScopeBadge = useMemo(() => {
    if (selectedClass && selectedSection) {
      return `${selectedClass} • ${selectedSection}`;
    }
    if (selectedClass) {
      return `${selectedClass} (All Sections)`;
    }
    return 'Global Search';
  }, [selectedClass, selectedSection]);

  // ─── Pool of Students for Current View ────────────────────────────────────
  const activeStudentPool = useMemo(() => {
    if (selectedClass && selectedSection) {
      return MOCK_STUDENTS.filter((s) => s.className === selectedClass && s.section === selectedSection);
    }
    if (selectedClass) {
      return MOCK_STUDENTS.filter((s) => s.className === selectedClass);
    }
    return MOCK_STUDENTS;
  }, [selectedClass, selectedSection]);

  // ─── Date Aggregate Calculator (P, A, L, %) for Class/Section ─────────────
  const getClassDateStats = (dateKey: string) => {
    const total = activeStudentPool.length;
    if (total === 0) return { total: 0, present: 0, absent: 0, leave: 0, pct: 0 };

    let present = 0;
    let absent = 0;
    let leave = 0;

    activeStudentPool.forEach((student) => {
      const rec = student.attendanceByDate[dateKey];
      if (rec?.status === 'present') present++;
      else if (rec?.status === 'absent') absent++;
      else if (rec?.status === 'leave') leave++;
    });

    const recorded = present + absent + leave;
    const pct = recorded === 0 ? 0 : Math.round((present / recorded) * 100);

    return { total, present, absent, leave, pct };
  };

  // ─── Summary Calculations (For Individual Student or Class) ────────────────
  const studentSummaryMonth = useMemo(() => {
    if (!selectedStudent) return null;
    const records = Object.entries(selectedStudent.attendanceByDate)
      .filter(([d]) => sameMonth(toDate(d), visibleMonth))
      .map(([, r]) => r);

    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const leave = records.filter((r) => r.status === 'leave').length;
    const total = present + absent + leave;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    return {
      label: 'This Month',
      rangeLabel: formatMonthHeader(visibleMonth),
      total,
      present,
      absent,
      leave,
      percentage,
    };
  }, [selectedStudent, visibleMonth]);

  const studentSummaryTillToday = useMemo(() => {
    if (!selectedStudent) return null;
    const records = Object.entries(selectedStudent.attendanceByDate)
      .filter(([d]) => d <= TODAY_KEY)
      .map(([, r]) => r);

    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const leave = records.filter((r) => r.status === 'leave').length;
    const total = present + absent + leave;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    return {
      label: 'Till Today',
      rangeLabel: `Session through ${formatDateLabel(TODAY_KEY)}`,
      total,
      present,
      absent,
      leave,
      percentage,
    };
  }, [selectedStudent]);

  // Aggregated Class Summary for Month & Till Today
  const classSummaryMonth = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    activeStudentPool.forEach((student) => {
      Object.entries(student.attendanceByDate).forEach(([d, r]) => {
        if (sameMonth(toDate(d), visibleMonth)) {
          if (r.status === 'present') present++;
          else if (r.status === 'absent') absent++;
          else if (r.status === 'leave') leave++;
        }
      });
    });

    const total = present + absent + leave;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    return {
      label: 'This Month (Class)',
      rangeLabel: formatMonthHeader(visibleMonth),
      total,
      present,
      absent,
      leave,
      percentage,
    };
  }, [activeStudentPool, visibleMonth]);

  const classSummaryTillToday = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;

    activeStudentPool.forEach((student) => {
      Object.entries(student.attendanceByDate).forEach(([d, r]) => {
        if (d <= TODAY_KEY) {
          if (r.status === 'present') present++;
          else if (r.status === 'absent') absent++;
          else if (r.status === 'leave') leave++;
        }
      });
    });

    const total = present + absent + leave;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    return {
      label: 'Till Today (Class)',
      rangeLabel: `Session through ${formatDateLabel(TODAY_KEY)}`,
      total,
      present,
      absent,
      leave,
      percentage,
    };
  }, [activeStudentPool]);

  // Current Summary Object to display in Stats Card
  const currentSummary: AttendanceSummary = useMemo(() => {
    if (selectedStudent) {
      return statsTab === 'month' ? (studentSummaryMonth as AttendanceSummary) : (studentSummaryTillToday as AttendanceSummary);
    }
    return statsTab === 'month' ? classSummaryMonth : classSummaryTillToday;
  }, [selectedStudent, statsTab, studentSummaryMonth, studentSummaryTillToday, classSummaryMonth, classSummaryTillToday]);

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

  // ─── Selected Date Card Details ───────────────────────────────────────────
  const isSelectedSunday = useMemo(() => toDate(selectedDate).getDay() === 0, [selectedDate]);
  const holidayReason = useMemo(() => {
    if (isSelectedSunday || selectedDate > TODAY_KEY) return null;
    return HOLIDAYS[selectedDate] ?? null;
  }, [selectedDate, isSelectedSunday]);

  // ─── Precise Check for Whether Date is Already Marked ─────────────────────
  const isDateAlreadyMarked = useMemo(() => {
    if (selectedDate > TODAY_KEY) return false;
    if (isSelectedSunday || holidayReason) return false;

    if (selectedStudent) {
      return !!selectedStudent.attendanceByDate[selectedDate];
    }
    const stats = getClassDateStats(selectedDate);
    return stats.total > 0 && (stats.present + stats.absent + stats.leave > 0);
  }, [selectedDate, selectedStudent, activeStudentPool, isSelectedSunday, holidayReason]);

  const selectedDateCardData = useMemo(() => {
    if (selectedStudent) {
      const record = selectedStudent.attendanceByDate[selectedDate];
      let statusLabel = 'No attendance record';
      let statusColor = COLORS.textMuted;
      let noteText = record?.note;
      let iconType = 'default';

      if (record) {
        const meta = statusMeta(record.status);
        statusLabel = meta.label;
        statusColor = meta.text;
        iconType = record.status;
        if (record.status === 'absent') noteText = undefined;
      } else if (isSelectedSunday) {
        statusLabel = 'Sunday';
        statusColor = COLORS.sundayText;
        iconType = 'sunday';
      } else if (holidayReason) {
        statusLabel = 'Holiday';
        statusColor = COLORS.tertiary;
        iconType = 'holiday';
        noteText = holidayReason;
      }

      return {
        title: selectedStudent.name,
        subTitle: `Roll #${selectedStudent.rollNo} • ${selectedStudent.className} ${selectedStudent.section}`,
        statusLabel,
        statusColor,
        noteText,
        iconType,
        isClassView: false,
        stats: null,
      };
    }

    // Class View
    const stats = getClassDateStats(selectedDate);
    const classTitle = selectedClass
      ? selectedSection
        ? `${selectedClass} - ${selectedSection}`
        : `${selectedClass} (All Sections)`
      : 'All Classes (School View)';

    if (isSelectedSunday) {
      return {
        title: classTitle,
        subTitle: 'Weekly School Holiday',
        statusLabel: 'Sunday',
        statusColor: COLORS.sundayText,
        noteText: undefined,
        iconType: 'sunday',
        isClassView: true,
        stats: null,
      };
    }

    if (holidayReason) {
      return {
        title: classTitle,
        subTitle: holidayReason,
        statusLabel: 'Holiday',
        statusColor: COLORS.tertiary,
        noteText: holidayReason,
        iconType: 'holiday',
        isClassView: true,
        stats: null,
      };
    }

    return {
      title: classTitle,
      subTitle: undefined,
      statusLabel: `${stats.pct}% Attendance`,
      statusColor: stats.pct >= 85 ? COLORS.presentText : stats.pct >= 70 ? COLORS.warning : COLORS.absentText,
      noteText: `Total: ${to2Digits(stats.total)}  |  Present: ${to2Digits(stats.present)}  |  Absent: ${to2Digits(stats.absent)}  |  Leave: ${to2Digits(stats.leave)}`,
      iconType: 'classStats',
      isClassView: true,
      stats,
    };
  }, [selectedStudent, selectedDate, isSelectedSunday, holidayReason, selectedClass, selectedSection, activeStudentPool]);

  // Navigate to Mark / View Attendance Screen
  const handleOpenMarkAttendance = () => {
    const targetClass = selectedClass || selectedStudent?.className || 'Grade 10';
    const targetSection = selectedSection || selectedStudent?.section || 'Section A';

    router.push({
      pathname: '/mark-attendance',
      params: {
        className: targetClass,
        section: targetSection,
        date: selectedDate,
        isMarked: isDateAlreadyMarked ? 'true' : 'false',
        mode: isDateAlreadyMarked ? 'view' : 'edit',
      },
    });
  };

  // Format Dynamic Button Texts
  const formattedSelectedDate = useMemo(() => {
    return toDate(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }, [selectedDate]);

  const formattedSelectedDateFull = useMemo(() => {
    return toDate(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
  }, [selectedDate]);

  const classBadgeText = useMemo(() => {
    if (selectedStudent) {
      return `${selectedStudent.className} (${selectedStudent.section.replace('Section ', 'Sec ')})`;
    }
    if (selectedClass) {
      const secStr = selectedSection ? selectedSection.replace('Section ', 'Sec ') : 'All Sec';
      return `${selectedClass} (${secStr})`;
    }
    return 'Grade 10 (Sec A)';
  }, [selectedClass, selectedSection, selectedStudent]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ─── Screen Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.titleColumn}>
          <Text style={styles.title} numberOfLines={1}>
            Attendance
          </Text>
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
            <Text style={styles.dateTitle} numberOfLines={1}>
              {formatMonthHeader(visibleMonth)}
            </Text>
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
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Top Filter Controls: Two Dropdowns & Search Box ─────────── */}
        <View style={styles.filterSection}>
          {/* Dropdown Row */}
          <View style={styles.dropdownRow}>
            {/* 1st Dropdown: Class */}
            <TouchableOpacity
              style={styles.dropdownButton}
              activeOpacity={0.8}
              onPress={() => setIsClassModalOpen(true)}
            >
              <View style={styles.dropdownIconWrapper}>
                <GraduationCap size={16} color={selectedClass ? COLORS.primary : COLORS.textMuted} />
              </View>
              <View style={styles.dropdownTextWrapper}>
                <Text style={styles.dropdownLabel}>Class</Text>
                <Text style={styles.dropdownValue} numberOfLines={1}>
                  {selectedClass ?? 'All Classes'}
                </Text>
              </View>
              <ChevronDown size={16} color={COLORS.textMuted} />
            </TouchableOpacity>

            {/* 2nd Dropdown: Section (Enabled only when Class is selected) */}
            <TouchableOpacity
              style={[
                styles.dropdownButton,
                !selectedClass && styles.dropdownButtonDisabled,
              ]}
              activeOpacity={selectedClass ? 0.8 : 1}
              onPress={() => {
                if (selectedClass) setIsSectionModalOpen(true);
              }}
            >
              <View style={styles.dropdownIconWrapper}>
                {!selectedClass ? (
                  <Lock size={15} color={COLORS.outline} />
                ) : (
                  <Users size={16} color={selectedSection ? COLORS.primary : COLORS.textMuted} />
                )}
              </View>
              <View style={styles.dropdownTextWrapper}>
                <Text style={styles.dropdownLabel}>Section</Text>
                <Text
                  style={[
                    styles.dropdownValue,
                    !selectedClass && styles.dropdownValueDisabled,
                  ]}
                  numberOfLines={1}
                >
                  {!selectedClass
                    ? 'Select Class first'
                    : selectedSection ?? 'All Sections'}
                </Text>
              </View>
              <ChevronDown size={16} color={selectedClass ? COLORS.textMuted : COLORS.outline} />
            </TouchableOpacity>
          </View>

          {/* Student Search Box with Live Scoped Autocomplete */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <Search size={17} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.trim().length > 0) setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }}
                  style={styles.clearSearchBtn}
                >
                  <X size={15} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : (
                <View style={styles.scopeBadge}>
                  <Text style={styles.scopeBadgeText}>{searchScopeBadge}</Text>
                </View>
              )}
            </View>

            {/* Live Autocomplete Results Dropdown */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <View style={styles.searchDropdown}>
                <View style={styles.searchDropdownHeader}>
                  <Text style={styles.searchDropdownTitle}>
                    Matching Students ({filteredStudents.length})
                  </Text>
                  <TouchableOpacity onPress={() => setIsSearchFocused(false)}>
                    <Text style={styles.searchDropdownClose}>Close</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  style={{ maxHeight: 210 }}
                  nestedScrollEnabled={true}
                  keyboardShouldPersistTaps="handled"
                >
                  {filteredStudents.length === 0 ? (
                    <View style={styles.noStudentsBox}>
                      <Text style={styles.noStudentsText}>
                        No student found matching "{searchQuery}" in {searchScopeBadge}.
                      </Text>
                    </View>
                  ) : (
                    filteredStudents.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.studentResultItem}
                        onPress={() => {
                          setSelectedStudent(item);
                          setSelectedClass(item.className);
                          setSelectedSection(item.section);
                          setIsSearchFocused(false);
                          setSearchQuery('');
                        }}
                      >
                        <View style={[styles.studentAvatar, { backgroundColor: item.avatarBg }]}>
                          <Text style={styles.avatarInitials}>{item.initials}</Text>
                        </View>
                        <View style={styles.studentResultInfo}>
                          <Text style={styles.studentResultName}>{item.name}</Text>
                          <Text style={styles.studentResultSub}>
                            Roll #{item.rollNo} • {item.className} ({item.section})
                          </Text>
                        </View>
                        <ChevronRight size={16} color={COLORS.textMuted} />
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Active Selected Student Banner */}
          {selectedStudent && (
            <View style={styles.activeStudentBanner}>
              <View style={styles.activeStudentLeft}>
                <View style={[styles.activeStudentAvatar, { backgroundColor: selectedStudent.avatarBg }]}>
                  <Text style={styles.avatarInitials}>{selectedStudent.initials}</Text>
                </View>
                <View>
                  <View style={styles.viewingPill}>
                    <Text style={styles.viewingPillText}>Viewing Student Attendance</Text>
                  </View>
                  <Text style={styles.activeStudentName}>{selectedStudent.name}</Text>
                  <Text style={styles.activeStudentSub}>
                    Roll #{selectedStudent.rollNo} • {selectedStudent.className} - {selectedStudent.section}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.clearStudentBtn}
                onPress={() => setSelectedStudent(null)}
              >
                <X size={14} color="#ffffff" />
                <Text style={styles.clearStudentText}>Class View</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ─── Calendar Panel (100% Full Height & Width) ───────────────── */}
        <View style={styles.calendarPanel}>
          <CalendarGrid
            visibleMonth={visibleMonth}
            selectedDate={selectedDate}
            cellWrapperStyle={styles.calendarCellWrapper}
            onSelectDate={(date) => {
              setSelectedDate(toDateKey(date));
              setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }}
            renderDayCell={(date, selected, muted) => {
              const dateKey = toDateKey(date);
              const sunday = date.getDay() === 0;
              const isFuture = dateKey > TODAY_KEY;
              const isHoliday = !sunday && HOLIDAYS[dateKey] && !isFuture;

              // ─── Mode A: Single Student Selected (Identical to Student App)
              if (selectedStudent) {
                const record = selectedStudent.attendanceByDate[dateKey];
                const meta = record ? statusMeta(record.status) : null;

                return (
                  <View style={styles.studentCellContainer}>
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
                          styles.studentDateNumber,
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
                  </View>
                );
              }

              // ─── Mode B: Clean Class Cell with Double-Digit P, A, L
              const stats = getClassDateStats(dateKey);

              return (
                <View
                  style={[
                    styles.classDateCell,
                    sunday && styles.sundayCellBg,
                    isHoliday && styles.holidayCellBg,
                    selected && styles.classCellSelected,
                  ]}
                >
                  {/* Top Row: Bigger Bold Date & Smaller Compact % Pill */}
                  <View style={styles.cellHeaderRow}>
                    <Text
                      style={[
                        styles.cellDateText,
                        muted && styles.mutedDateNumber,
                        sunday && styles.sundayDateNumber,
                        isHoliday && styles.holidayDateNumber,
                        selected && styles.selectedDateText,
                      ]}
                    >
                      {date.getDate()}
                    </Text>

                    {!sunday && !isHoliday && !isFuture && stats.total > 0 && (
                      <View
                        style={[
                          styles.badgePill,
                          {
                            backgroundColor:
                              stats.pct >= 85 ? '#e6f7ec' : stats.pct >= 70 ? '#fef3c7' : '#fee2e2',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.badgePillText,
                            {
                              color:
                                stats.pct >= 85
                                  ? '#15803d'
                                  : stats.pct >= 70
                                    ? '#b45309'
                                    : '#b91c1c',
                            },
                          ]}
                        >
                          {stats.pct}%
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Bottom Row: Clean Double-Digit Precision Figures (e.g. ● 33  ● 02  ● 01) */}
                  {sunday ? (
                    <View style={styles.specialDayContainer}>
                      <Text style={styles.sundayBadgeText}>SUN</Text>
                    </View>
                  ) : isHoliday ? (
                    <View style={styles.specialHolidayContainer}>
                      <Text style={styles.holidayBadgeText}>OFF</Text>
                    </View>
                  ) : isFuture ? (
                    <View style={styles.futureContainer}>
                      <Text style={styles.futureDashText}>—</Text>
                    </View>
                  ) : stats.total > 0 ? (
                    <View style={styles.figuresRow}>
                      {/* Present (Double Digit) */}
                      <View style={styles.figureItem}>
                        <View style={[styles.microDot, { backgroundColor: '#29b85d' }]} />
                        <Text style={[styles.figureValue, { color: '#14532d' }]}>
                          {to2Digits(stats.present)}
                        </Text>
                      </View>

                      {/* Absent (Double Digit, Muted if 00, prominent if > 0) */}
                      <View style={styles.figureItem}>
                        <View
                          style={[
                            styles.microDot,
                            { backgroundColor: stats.absent > 0 ? '#ef3d3d' : '#d1d5db' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.figureValue,
                            stats.absent > 0
                              ? { color: '#b91c1c', fontWeight: '900' }
                              : styles.dimmedFigureValue,
                          ]}
                        >
                          {to2Digits(stats.absent)}
                        </Text>
                      </View>

                      {/* Leave (Double Digit, Muted if 00, prominent if > 0) */}
                      <View style={styles.figureItem}>
                        <View
                          style={[
                            styles.microDot,
                            { backgroundColor: stats.leave > 0 ? '#f59e0b' : '#d1d5db' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.figureValue,
                            stats.leave > 0
                              ? { color: '#b45309', fontWeight: '900' }
                              : styles.dimmedFigureValue,
                          ]}
                        >
                          {to2Digits(stats.leave)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.futureContainer}>
                      <Text style={styles.futureDashText}>—</Text>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </View>

        {/* ─── Selected Date Card (With In-Card Action Trigger) ────────── */}
        {selectedDate <= TODAY_KEY && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedCardMain}>
              <View style={styles.selectedIcon}>
                {selectedDateCardData.iconType === 'absent' ? (
                  <CircleX size={22} color={COLORS.absent} />
                ) : selectedDateCardData.iconType === 'leave' ? (
                  <Clock3 size={22} color={COLORS.warning} />
                ) : selectedDateCardData.iconType === 'sunday' ? (
                  <CalendarCheck size={22} color={COLORS.sundayText} />
                ) : selectedDateCardData.iconType === 'holiday' ? (
                  <CalendarCheck size={22} color={COLORS.tertiary} />
                ) : selectedDateCardData.iconType === 'classStats' ? (
                  <Users size={22} color={COLORS.primary} />
                ) : (
                  <CircleCheck size={22} color={COLORS.present} />
                )}
              </View>
              <View style={styles.selectedTextColumn}>
                <View style={styles.selectedTitleRow}>
                  <Text style={styles.selectedDate}>{formatDateLabel(selectedDate)}</Text>
                  <Text style={[styles.selectedStatus, { color: selectedDateCardData.statusColor }]}>
                    {selectedDateCardData.statusLabel}
                  </Text>
                </View>
                <Text style={styles.selectedSub}>
                  {selectedDateCardData.title}
                  {selectedDateCardData.subTitle ? ` • ${selectedDateCardData.subTitle}` : ''}
                </Text>
                {selectedDateCardData.noteText ? (
                  <Text style={styles.selectedNote}>{selectedDateCardData.noteText}</Text>
                ) : null}
              </View>
            </View>

            {/* Contextual Action Button (Trigger A: Inside Selected Date Card) */}
            {!isSelectedSunday && !holidayReason && (
              <TouchableOpacity
                style={styles.cardActionBtn}
                onPress={handleOpenMarkAttendance}
                activeOpacity={0.8}
              >
                {isDateAlreadyMarked ? (
                  <Eye size={15} color="#000000" />
                ) : (
                  <PenTool size={15} color="#000000" />
                )}
                <Text style={styles.cardActionBtnText}>
                  {isDateAlreadyMarked
                    ? `View Attendance ${formattedSelectedDateFull}`
                    : `Mark Attendance ${formattedSelectedDateFull}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ─── Attendance Stats Section Header ─────────────────────────── */}
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Attendance Stats</Text>
          <View style={styles.ratePill}>
            <Percent size={14} color={COLORS.primary} />
            <Text style={styles.ratePillText}>
              {selectedStudent ? 'Student Attendance' : 'Class Attendance'}
            </Text>
          </View>
        </View>

        {/* ─── Attendance Stats Card (Identical UI to Student App) ──────── */}
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
                <Text style={styles.insightText}>{currentSummary.total} total instances</Text>
              </View>
              <View style={styles.insightItem}>
                <Clock3 size={15} color={COLORS.textMuted} />
                <Text style={styles.insightText}>
                  {currentSummary.absent + currentSummary.leave} away instances
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.callout}>
              <Text style={styles.calloutText}>
                {selectedStudent
                  ? `Best streak: 9 present days for ${selectedStudent.name}. Leave is tracked separately from absence.`
                  : `Overall attendance rate across ${activeStudentPool.length} students in ${selectedClass ?? 'school'} stands at ${currentSummary.percentage}%.`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── Floating Action Bar (Trigger B: Dynamic with Class & Date) ── */}
      <View style={styles.floatingActionWrapper}>
        <TouchableOpacity
          style={styles.floatingActionBtn}
          onPress={handleOpenMarkAttendance}
          activeOpacity={0.88}
        >
          {isDateAlreadyMarked ? (
            <Eye size={16} color="#ffffff" style={{ marginRight: 6 }} />
          ) : (
            <PenTool size={16} color="#ffffff" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.floatingActionText}>
            {isDateAlreadyMarked ? 'View Attendance' : 'Mark Attendance'} • {classBadgeText} • {formattedSelectedDate}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Class Picker Modal ────────────────────────────────────────── */}
      <Modal visible={isClassModalOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsClassModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Class / Grade</Text>
                  <TouchableOpacity onPress={() => setIsClassModalOpen(false)}>
                    <X size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  <TouchableOpacity
                    style={[styles.modalOption, selectedClass === null && styles.modalOptionActive]}
                    onPress={() => handleSelectClass(null)}
                  >
                    <Text style={[styles.modalOptionText, selectedClass === null && styles.modalOptionTextActive]}>
                      All Classes (Global School View)
                    </Text>
                  </TouchableOpacity>
                  {CLASSES.map((cls) => (
                    <TouchableOpacity
                      key={cls}
                      style={[styles.modalOption, selectedClass === cls && styles.modalOptionActive]}
                      onPress={() => handleSelectClass(cls)}
                    >
                      <Text style={[styles.modalOptionText, selectedClass === cls && styles.modalOptionTextActive]}>
                        {cls}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Section Picker Modal ──────────────────────────────────────── */}
      <Modal visible={isSectionModalOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsSectionModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Section ({selectedClass})</Text>
                  <TouchableOpacity onPress={() => setIsSectionModalOpen(false)}>
                    <X size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  <TouchableOpacity
                    style={[styles.modalOption, selectedSection === null && styles.modalOptionActive]}
                    onPress={() => handleSelectSection(null)}
                  >
                    <Text style={[styles.modalOptionText, selectedSection === null && styles.modalOptionTextActive]}>
                      All Sections in {selectedClass}
                    </Text>
                  </TouchableOpacity>
                  {availableSections.map((sec) => (
                    <TouchableOpacity
                      key={sec}
                      style={[styles.modalOption, selectedSection === sec && styles.modalOptionActive]}
                      onPress={() => handleSelectSection(sec)}
                    >
                      <Text style={[styles.modalOptionText, selectedSection === sec && styles.modalOptionTextActive]}>
                        {sec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles matching Student Attendance UI/UX with Clean Full-Height Cells ───
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
  scrollContent: { paddingBottom: 130 },

  // Filter Section Styles
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownButtonDisabled: {
    backgroundColor: COLORS.surfaceLow,
    opacity: 0.65,
  },
  dropdownIconWrapper: {
    marginRight: 8,
  },
  dropdownTextWrapper: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dropdownValue: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 1,
  },
  dropdownValueDisabled: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Search Box Styles
  searchContainer: {
    position: 'relative',
    zIndex: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  scopeBadge: {
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scopeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },

  // Search Autocomplete Dropdown
  searchDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.outline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 99,
    overflow: 'hidden',
  },
  searchDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceContainer,
    backgroundColor: COLORS.surfaceLow,
  },
  searchDropdownTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textMuted,
  },
  searchDropdownClose: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  studentResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.surfaceContainer,
    gap: 10,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  studentResultInfo: {
    flex: 1,
  },
  studentResultName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentResultSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  noStudentsBox: {
    padding: 16,
    alignItems: 'center',
  },
  noStudentsText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Active Student Banner
  activeStudentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 2,
  },
  activeStudentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  activeStudentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewingPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  viewingPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  activeStudentName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  activeStudentSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  clearStudentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  clearStudentText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // Calendar Panel Styles
  calendarPanel: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  calendarCellWrapper: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    minHeight: 60,
    alignItems: 'stretch',
    justifyContent: 'stretch',
  },

  // Single Student Cell Styles (Identical to Student App)
  studentCellContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dateCircle: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sundayCircle: { backgroundColor: COLORS.sunday },
  holidayCircle: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  dateCircleSelected: { borderWidth: 3, borderColor: COLORS.primary },
  dateNumber: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  studentDateNumber: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: '700' },
  mutedDateNumber: { color: COLORS.outline },
  sundayDateNumber: { color: COLORS.sundayText },
  holidayDateNumber: { color: '#6d28d9' },
  statusDateNumber: { color: COLORS.onPrimary },
  selectedDateNumber: { fontWeight: '900' },

  // ─── Clean Full-Height Class Cell Styles ──────────────────────────────────
  classDateCell: {
    flex: 1,
    width: '100%',
    minHeight: 60,
    paddingHorizontal: 3,
    paddingVertical: 5,
    justifyContent: 'space-between',
  },
  sundayCellBg: {
    backgroundColor: '#f8fafc',
  },
  holidayCellBg: {
    backgroundColor: '#faf5ff',
  },
  classCellSelected: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
  },

  // Header Row (Bigger Date + Smaller % Badge)
  cellHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cellDateText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  selectedDateText: {
    fontWeight: '900',
    color: '#000000',
  },
  badgePill: {
    paddingHorizontal: 2.5,
    paddingVertical: 0.5,
    borderRadius: 3,
  },
  badgePillText: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Bottom Figures Row (Compact Double Digits)
  figuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 4,
  },
  figureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  microDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  figureValue: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '800',
  },
  dimmedFigureValue: {
    color: '#9ca3af',
    fontWeight: '600',
  },

  // Special State Badges
  specialDayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  sundayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.sundayText,
    letterSpacing: 0.2,
  },
  specialHolidayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  holidayBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.tertiary,
    letterSpacing: 0.2,
  },
  futureContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  futureDashText: {
    fontSize: 10,
    color: COLORS.outline,
    fontWeight: '600',
  },

  // Selected Date Card Styles (With Action Trigger)
  selectedCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  selectedCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
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
  selectedTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDate: { color: COLORS.text, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  selectedStatus: { color: COLORS.textMuted, fontSize: 13, lineHeight: 17, fontWeight: '800' },
  selectedSub: { marginTop: 2, color: COLORS.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  selectedNote: { marginTop: 4, color: COLORS.text, fontSize: 12, lineHeight: 16, fontWeight: '700' },

  // In-Card Action Button
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  cardActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },

  // Floating Action Button Pill
  floatingActionWrapper: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Stats Section Header
  statsHeader: {
    marginHorizontal: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsTitle: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  ratePill: {
    borderRadius: 999,
    backgroundColor: COLORS.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratePillText: { marginLeft: 5, color: COLORS.primary, fontSize: 12, lineHeight: 16, fontWeight: '800' },

  // Stats Card (Identical to Student App)
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
  callout: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
  },
  calloutText: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '600' },

  // Modal Styles for Pickers
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outline,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalScroll: {
    maxHeight: 280,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 2,
  },
  modalOptionActive: {
    backgroundColor: COLORS.surfaceLow,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalOptionTextActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
});
