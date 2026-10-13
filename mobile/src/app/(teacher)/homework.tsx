import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  Paperclip,
  PenTool,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
  Check,
  Tag,
  Image as ImageIcon,
  HardDrive,
  ExternalLink,
} from 'lucide-react-native';
import {
  AgendaCalendar,
  type AgendaCategory,
  type AgendaItem,
  type AgendaAttachment,
} from '@/components/calendar/agenda-calendar';
import { CurriculumStore } from '@/data/curriculumStore';

// ─── Theme & Colors (Identical to Student App) ──────────────────────────────
const COLORS = {
  surface: '#f9f9ff',
  surfaceLow: '#f3f3f9',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#edecef',
  text: '#191b20',
  textMuted: '#707884',
  outline: '#c3c6cf',
  primary: '#059669',
  primaryDark: '#047857',
  primaryBg: '#D1FAE5',
  primaryLight: '#ECFDF5',
  primaryContainer: '#d1e4ff',
  onPrimary: '#ffffff',
  indigo: '#4F46E5',
  indigoBg: '#EEF2FF',
  purple: '#7C3AED',
  purpleBg: '#F3E8FF',
  amber: '#D97706',
  amberBg: '#FEF3C7',
  rose: '#E11D48',
  roseBg: '#FFE4E6',
};

type TeacherAssignment = {
  id: string;
  grade: string;
  section: string;
  subject: string;
  room: string;
  code: string;
  categoryId: string;
};

const TEACHER_ASSIGNMENTS: TeacherAssignment[] = [
  { id: 'asgn-1', grade: 'Grade 10', section: 'Section A', subject: 'Advanced Mathematics', room: 'Room 204', code: '10-A', categoryId: 'mathematics' },
  { id: 'asgn-2', grade: 'Grade 10', section: 'Section B', subject: 'Theoretical Physics', room: 'Room 205', code: '10-B', categoryId: 'science' },
  { id: 'asgn-3', grade: 'Grade 9',  section: 'Section C', subject: 'General Mathematics', room: 'Room 108', code: '9-C', categoryId: 'mathematics' },
  { id: 'asgn-4', grade: 'Grade 11', section: 'Section A', subject: 'Applied Physics', room: 'Lab 1', code: '11-A', categoryId: 'science' },
  { id: 'asgn-5', grade: 'Grade 12', section: 'Section B', subject: 'Physics Practical Lab', room: 'Lab 2', code: '12-B', categoryId: 'science' },
];

// ─── School Structure Constants ─────────────────────────────────────────────
const CLASSES = ['Grade 10', 'Grade 9', 'Grade 11', 'Grade 12', 'Grade 8'];
const SECTIONS_BY_CLASS: Record<string, string[]> = {
  'Grade 10': ['Section A', 'Section B'],
  'Grade 9': ['Section A', 'Section B', 'Section C'],
  'Grade 11': ['Section A', 'Section B'],
  'Grade 12': ['Section A', 'Section B'],
  'Grade 8': ['Section A', 'Section B'],
};

// ─── Categories Identical to Student App ────────────────────────────────────
const HOMEWORK_CATEGORIES: AgendaCategory[] = [
  {
    id: 'science',
    label: 'Science',
    shortLabel: 'Sci',
    iconColor: '#16a34a',
    badgeClassName: 'bg-green-600',
  },
  {
    id: 'english',
    label: 'English',
    shortLabel: 'Eng',
    iconColor: '#ba1a1a',
    badgeClassName: 'bg-error',
  },
  {
    id: 'mathematics',
    label: 'Mathematics',
    shortLabel: 'Math',
    iconColor: '#000000',
    badgeClassName: 'bg-primary',
  },
  {
    id: 'art',
    label: 'Art',
    shortLabel: 'Art',
    iconColor: '#ad2274',
    badgeClassName: 'bg-tertiary',
  },
  {
    id: 'social-studies',
    label: 'Social Studies',
    shortLabel: 'SS',
    iconColor: '#7c3aed',
    badgeClassName: 'bg-secondary',
  },
];

type AttachmentMode = 'DOC' | 'LINK' | 'IMAGE' | 'DRIVE';

export interface TeacherAgendaItem extends AgendaItem {
  className: string;
  section: string;
  submittedCount?: number;
  totalStudents?: number;
  status?: 'active' | 'scheduled' | 'draft';
}

const INITIAL_HOMEWORK_ITEMS: TeacherAgendaItem[] = [
  {
    id: 'hw-1',
    date: '2026-07-12',
    time: '09:00 AM',
    categoryId: 'science',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Cell Division Worksheet & Mitosis Phases',
    description: 'Complete the diagram labeling for Anaphase and Metaphase. Submit before 4 PM.',
    owner: 'Teacher',
    teacherName: 'Ms. Priya Singh',
    chapter: 'Chapter 2: Cell Division & Mitosis',
    attachments: [
      { id: 'att-1', kind: 'file', label: 'mitosis_diagram_worksheet.pdf' },
      { id: 'att-2', kind: 'link', label: 'Khan Academy Mitosis Video' },
    ],
    submittedCount: 28,
    totalStudents: 36,
    status: 'active',
  },
  {
    id: 'hw-2',
    date: '2026-07-12',
    time: '11:00 AM',
    categoryId: 'mathematics',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Quadratic Equations Exercise 4.2 Proofs',
    description: 'Solve problems 1 to 15 in homework notebook with all steps shown.',
    owner: 'Teacher',
    teacherName: 'Ms. Priya Singh',
    chapter: 'Chapter 4: Quadratic Equations',
    attachments: [
      { id: 'att-3', kind: 'file', label: 'ncert_ex_4.2_solutions.pdf' },
    ],
    submittedCount: 34,
    totalStudents: 36,
    status: 'active',
  },
  {
    id: 'hw-4',
    date: '2026-07-11',
    time: '04:00 PM',
    categoryId: 'mathematics',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Linear Equations Graphing & Substitution Practice',
    description: 'Solve problems 1 to 12 from practice set using substitution and graphical verification.',
    owner: 'Teacher',
    teacherName: 'Ms. Priya Singh',
    chapter: 'Chapter 3: Pair of Linear Equations in Two Variables',
    attachments: [
      { id: 'att-le-1', kind: 'file', label: 'linear_equations_practice_set.pdf' },
    ],
    submittedCount: 31,
    totalStudents: 36,
    status: 'active',
  },
  {
    id: 'hw-5',
    date: '2026-07-12',
    time: '03:00 PM',
    categoryId: 'science',
    className: 'Grade 10',
    section: 'Section B',
    title: 'Spherical Mirrors Ray Diagram & Focal Length Drill',
    description: 'Draw 6 ray diagram cases for concave mirror and calculate focal lengths for given object distances.',
    owner: 'Teacher',
    teacherName: 'Ms. Priya Singh',
    chapter: 'Chapter 1: Light - Reflection & Refraction',
    attachments: [
      { id: 'att-p1', kind: 'file', label: 'ray_diagrams_worksheet.pdf' },
    ],
    submittedCount: 30,
    totalStudents: 36,
    status: 'active',
  },
  {
    id: 'hw-3',
    date: '2026-07-13',
    time: '09:30 AM',
    categoryId: 'english',
    className: 'Grade 9',
    section: 'Section C',
    title: 'Essay: The Road Not Taken Analysis',
    description: 'Write a 300-word critical appreciation of Robert Frost poem focusing on symbolism.',
    owner: 'Teacher',
    teacherName: 'Ms. Priya Singh',
    chapter: 'Chapter 4: Poetry & Literature Appreciation',
    attachments: [],
    submittedCount: 18,
    totalStudents: 40,
    status: 'active',
  },
];

const getTodayDateStr = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateReadable = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const buildMonthWeeks = (monthDate: Date) => {
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
};

const WEEK_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TIME_HOURS = [
  '01:00', '02:00', '03:00', '04:00',
  '05:00', '06:00', '07:00', '08:00',
  '09:00', '10:00', '11:00', '12:00',
];

export type HomeworkFilterPill = {
  id: string;
  label: string;
  grade?: string;
  section?: string;
  categoryId?: string;
};

const TEACHER_HOMEWORK_FILTERS: HomeworkFilterPill[] = [
  { id: 'all', label: 'All Homework' },
  { id: 'asgn-1', label: '10-A · Advanced Mathematics', grade: 'Grade 10', section: 'Section A', categoryId: 'mathematics' },
  { id: 'asgn-2', label: '10-B · Theoretical Physics', grade: 'Grade 10', section: 'Section B', categoryId: 'physics' },
  { id: 'asgn-3', label: '9-C · General Mathematics', grade: 'Grade 9', section: 'Section C', categoryId: 'mathematics' },
  { id: 'asgn-4', label: '11-A · Applied Physics', grade: 'Grade 11', section: 'Section A', categoryId: 'physics' },
  { id: 'asgn-5', label: '12-B · Physics Practical Lab', grade: 'Grade 12', section: 'Section B', categoryId: 'physics' },
];

export default function TeacherHomeworkScreen() {
  const router = useRouter();

  // ─── Main Screen Class + Section + Subject Selector (Identical to Curriculum) ───
  const [selectedFilterId, setSelectedFilterId] = useState<string>('all');

  // ─── Assign Homework Modal State ──────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modal Form State
  const [modalClass, setModalClass] = useState<string>('Grade 10');
  const [modalSection, setModalSection] = useState<string>('Section A');
  const [modalSubject, setModalSubject] = useState<string>('mathematics');
  const [modalSubjectName, setModalSubjectName] = useState<string>('Advanced Mathematics');

  // Chapter Tag State (Dynamic Curriculum Tagging)
  const [selectedChapterTag, setSelectedChapterTag] = useState('Uncategorised');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState(false);

  // Title & Description
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // 4 Attachment Types State
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('DOC');
  const [docFormat, setDocFormat] = useState<'PDF' | 'DOCX' | 'PPTX'>('PDF');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [driveName, setDriveName] = useState('');
  const [imageAttached, setImageAttached] = useState(false);
  const [docAttached, setDocAttached] = useState(true);

  // ─── Schedule Modal & Calendar Picker State ────────────────────────────────
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => getTodayDateStr());
  const [scheduledTime, setScheduledTime] = useState('09:00 AM');
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [datePickerMonth, setDatePickerMonth] = useState<Date>(() => new Date());

  // Homework Dataset State
  const [homeworkList, setHomeworkList] = useState<TeacherAgendaItem[]>(INITIAL_HOMEWORK_ITEMS);

  // Curriculum Chapters for modal subject
  const curriculumChapters = useMemo(() => {
    return CurriculumStore.getChaptersForSubject(modalSubjectName, modalClass);
  }, [modalSubjectName, modalClass]);

  // Open Assign Homework Modal
  const handleOpenAssignModal = () => {
    const activePill = TEACHER_HOMEWORK_FILTERS.find((p) => p.id === selectedFilterId && p.id !== 'all');
    const matchedAsgn = activePill
      ? TEACHER_ASSIGNMENTS.find((a) => a.id === activePill.id) || TEACHER_ASSIGNMENTS[0]
      : TEACHER_ASSIGNMENTS[0];

    setModalClass(matchedAsgn.grade);
    setModalSection(matchedAsgn.section);
    setModalSubject(matchedAsgn.categoryId);
    setModalSubjectName(matchedAsgn.subject);
    setSelectedChapterTag('Uncategorised');
    setSelectedChapterId(null);
    setNewTitle('');
    setNewDescription('');
    setAttachmentMode('DOC');
    setDocFormat('PDF');
    setLinkUrl('');
    setLinkName('');
    setDriveUrl('');
    setDriveName('');
    setShowCreateModal(true);
  };

  // ─── Dynamic Class + Section + Subject Filtering Logic ─────────────────────
  const filteredHomeworkItems = useMemo(() => {
    if (selectedFilterId === 'all') {
      return homeworkList;
    }
    const activePill = TEACHER_HOMEWORK_FILTERS.find((p) => p.id === selectedFilterId);
    if (!activePill) return homeworkList;

    return homeworkList.filter((item) => {
      if (activePill.grade && item.className !== activePill.grade) return false;
      if (activePill.section && item.section !== activePill.section) return false;
      if (activePill.categoryId && item.categoryId !== activePill.categoryId) return false;
      return true;
    });
  }, [homeworkList, selectedFilterId]);

  // Validation before Publishing / Scheduling
  const validateForm = () => {
    if (!newTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a Title for this homework assignment.');
      return false;
    }
    return true;
  };

  const buildAttachments = (): AgendaAttachment[] => {
    if (attachmentMode === 'LINK') {
      return [
        {
          id: `att-${Date.now()}`,
          kind: 'link',
          label: linkName.trim() || linkUrl.trim() || 'Internet Resource Link',
        },
      ];
    } else if (attachmentMode === 'IMAGE') {
      return [
        {
          id: `att-${Date.now()}`,
          kind: 'file',
          label: 'homework_problem_diagram.jpg',
        },
      ];
    } else if (attachmentMode === 'DRIVE') {
      return [
        {
          id: `att-${Date.now()}`,
          kind: 'link',
          label: driveName.trim() || 'Google Drive Assignment Reference',
        },
      ];
    } else {
      return [
        {
          id: `att-${Date.now()}`,
          kind: 'file',
          label: `homework_sheet.${docFormat.toLowerCase()}`,
        },
      ];
    }
  };

  // Immediate Publish Handler
  const handlePublishNow = () => {
    if (!validateForm()) return;

    const computedAttachments = buildAttachments();

    const newAssignment: TeacherAgendaItem = {
      id: `hw-${Date.now()}`,
      date: getTodayDateStr(),
      time: '09:00 AM',
      categoryId: modalSubject,
      className: modalClass,
      section: modalSection,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Complete the assigned exercises and show clear steps.',
      owner: 'Teacher',
      teacherName: 'Ms. Priya Singh',
      chapter: selectedChapterTag,
      chapterId: selectedChapterId || undefined,
      attachments: computedAttachments,
      submittedCount: 0,
      totalStudents: 36,
      status: 'active',
    };

    setHomeworkList([newAssignment, ...homeworkList]);

    // Sync to CurriculumStore if tagged to a chapter
    if (selectedChapterTag !== 'Uncategorised') {
      CurriculumStore.addHomeworkToChapter({
        subjectName: modalSubjectName,
        chapterId: selectedChapterId || undefined,
        chapterTitle: selectedChapterTag,
        homework: {
          id: newAssignment.id,
          title: newTitle.trim(),
          assignedDate: getTodayDateStr(),
          dueDate: getTodayDateStr(),
          dueTime: '04:00 PM',
          assignedBy: 'Ms. Priya Singh',
          description: newDescription.trim(),
          grade: modalClass,
          section: modalSection,
          attachments: computedAttachments,
          submittedCount: 0,
          totalStudents: 36,
          status: 'active',
        },
      });
    }

    setShowCreateModal(false);
    Alert.alert('Homework Published! 🚀', `Assignment released immediately for ${modalClass} - ${modalSection}.`);
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = () => {
    if (!validateForm()) return;
    const todayStr = getTodayDateStr();
    if (scheduledDate < todayStr) {
      setScheduledDate(todayStr);
    }
    setShowScheduleModal(true);
  };

  // Shift Scheduled Date (+1 or -1 days, min today)
  const handleShiftScheduledDate = (deltaDays: number) => {
    const todayStr = getTodayDateStr();
    const [y, m, d] = scheduledDate.split('-').map(Number);
    const curr = new Date(y, m - 1, d);
    curr.setDate(curr.getDate() + deltaDays);
    const nextYear = curr.getFullYear();
    const nextMonth = `${curr.getMonth() + 1}`.padStart(2, '0');
    const nextDay = `${curr.getDate()}`.padStart(2, '0');
    const nextDateStr = `${nextYear}-${nextMonth}-${nextDay}`;
    if (nextDateStr < todayStr) return;
    setScheduledDate(nextDateStr);
  };

  const isScheduledDateAtToday = scheduledDate <= getTodayDateStr();

  // Time parsing helper
  const parsedTime = useMemo(() => {
    const parts = scheduledTime.trim().split(' ');
    let hour = parts[0] || '09:00';
    if (hour.length === 4) hour = `0${hour}`;
    const period = (parts[1] || 'AM').toUpperCase() as 'AM' | 'PM';
    return { hour, period };
  }, [scheduledTime]);

  const handleSelectPeriod = (period: 'AM' | 'PM') => {
    setScheduledTime(`${parsedTime.hour} ${period}`);
  };

  const handleSelectHour = (hour: string) => {
    setScheduledTime(`${hour} ${parsedTime.period}`);
  };

  // Calendar month navigation
  const isAtCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      datePickerMonth.getFullYear() === now.getFullYear() &&
      datePickerMonth.getMonth() <= now.getMonth()
    );
  }, [datePickerMonth]);

  const handlePrevMonth = () => {
    if (isAtCurrentMonth) return;
    setDatePickerMonth(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDatePickerMonth(new Date(datePickerMonth.getFullYear(), datePickerMonth.getMonth() + 1, 1));
  };

  // Confirm Schedule Handler
  const handleConfirmSchedule = () => {
    const todayStr = getTodayDateStr();
    if (scheduledDate < todayStr) {
      Alert.alert(
        'Invalid Date',
        'Cannot schedule homework in the past. Please select today or a future date.'
      );
      return;
    }

    const computedAttachments = buildAttachments();

    const newAssignment: TeacherAgendaItem = {
      id: `hw-sched-${Date.now()}`,
      date: scheduledDate,
      time: scheduledTime,
      categoryId: modalSubject,
      className: modalClass,
      section: modalSection,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Complete the assigned exercises and show clear steps.',
      owner: 'Teacher',
      teacherName: 'Ms. Priya Singh',
      chapter: selectedChapterTag,
      chapterId: selectedChapterId || undefined,
      attachments: computedAttachments,
      submittedCount: 0,
      totalStudents: 36,
      status: 'scheduled',
    };

    setHomeworkList([newAssignment, ...homeworkList]);

    // Sync to CurriculumStore if tagged to a chapter
    if (selectedChapterTag !== 'Uncategorised') {
      CurriculumStore.addHomeworkToChapter({
        subjectName: modalSubjectName,
        chapterId: selectedChapterId || undefined,
        chapterTitle: selectedChapterTag,
        homework: {
          id: newAssignment.id,
          title: newTitle.trim(),
          assignedDate: scheduledDate,
          dueDate: scheduledDate,
          dueTime: scheduledTime,
          assignedBy: 'Ms. Priya Singh',
          description: newDescription.trim(),
          grade: modalClass,
          section: modalSection,
          attachments: computedAttachments,
          submittedCount: 0,
          totalStudents: 36,
          status: 'scheduled',
        },
      });
    }

    setShowScheduleModal(false);
    setShowCreateModal(false);
    Alert.alert(
      'Homework Scheduled! ⏱️',
      `Assignment scheduled to publish on ${scheduledDate} at ${scheduledTime} for ${modalClass} - ${modalSection}.`
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ─── Embedded Agenda Calendar (Top Title & Date Navigation with Filter Subheader) ─── */}
      <View style={{ flex: 1 }}>
        <AgendaCalendar
          title="Homework"
          initialDate="2026-07-12"
          categories={HOMEWORK_CATEGORIES}
          items={filteredHomeworkItems}
          itemCountLabel="Homework Items"
          subHeader={
            <View style={styles.pillsContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pillsScroll}
              >
                {TEACHER_HOMEWORK_FILTERS.map((item) => {
                  const isActive = selectedFilterId === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => setSelectedFilterId(item.id)}
                      activeOpacity={0.8}
                    >
                      <BookOpen
                        size={14}
                        color={isActive ? '#ffffff' : COLORS.textMuted}
                        strokeWidth={2.2}
                      />
                      <Text
                        style={[
                          styles.filterPillText,
                          isActive && styles.filterPillTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
        />
      </View>

      {/* ─── Floating Action Button (Assign Homework) ───────────────────── */}
      <View style={styles.floatingActionWrapper}>
        <TouchableOpacity
          style={styles.floatingActionBtn}
          activeOpacity={0.85}
          onPress={handleOpenAssignModal}
        >
          <Plus size={22} color="#ffffff" strokeWidth={2.6} />
        </TouchableOpacity>
      </View>

      {/* ─── Assign Homework Modal (Matched to Upload Resources Experience) ── */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.createModalHeaderRow}>
              <View style={styles.modalHeaderTitleRow}>
                <View style={styles.modalHeaderIcon}>
                  <PenTool size={18} color="#059669" strokeWidth={2.4} />
                </View>
                <Text style={styles.createModalTitleText}>Assign Homework</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* 1. Subject Badge Selector */}
              <Text style={styles.inputLabel}>Select Subject *</Text>
              <View style={styles.subjectRow}>
                {TEACHER_ASSIGNMENTS.map((asgn) => {
                  const isSelected =
                    modalClass === asgn.grade &&
                    modalSection === asgn.section &&
                    modalSubject === asgn.categoryId;
                  return (
                    <TouchableOpacity
                      key={asgn.id}
                      style={[
                        styles.subjectSelectBtn,
                        isSelected && styles.subjectSelectBtnActive,
                      ]}
                      onPress={() => {
                        setModalClass(asgn.grade);
                        setModalSection(asgn.section);
                        setModalSubject(asgn.categoryId);
                        setModalSubjectName(asgn.subject);
                        setSelectedChapterTag('Uncategorised');
                        setSelectedChapterId(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.subjectSelectText,
                          isSelected && styles.subjectSelectTextActive,
                        ]}
                      >
                        {asgn.code} · {asgn.subject}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Chapter Tag (Dynamic Selector linked to Curriculum) */}
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>Chapter Tag</Text>
                <Text style={styles.inputLabelHint}>Links to Curriculum</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.chapterSelectorBtn,
                  selectedChapterTag !== 'Uncategorised' && styles.chapterSelectorBtnActive,
                ]}
                onPress={() => setIsChapterPickerOpen(true)}
                activeOpacity={0.8}
              >
                <View style={styles.chapterSelectorLeft}>
                  <Tag
                    size={15}
                    color={selectedChapterTag === 'Uncategorised' ? '#94A3B8' : '#059669'}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.chapterSelectorText,
                      selectedChapterTag === 'Uncategorised' &&
                        styles.chapterSelectorTextUncategorised,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedChapterTag}
                  </Text>
                </View>
                <ChevronDown size={14} color="#64748B" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* 3. Title */}
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Worksheet & Formula Application Drill"
                placeholderTextColor="#94A3B8"
                value={newTitle}
                onChangeText={setNewTitle}
              />

              {/* 4. Attachment Source (Single Row of 4 items) */}
              <Text style={styles.inputLabel}>Attachment Source *</Text>
              <View style={styles.attachRow}>
                {/* Option 1: Web / Video Link */}
                <TouchableOpacity
                  style={[
                    styles.attachBtn,
                    attachmentMode === 'LINK' && styles.attachBtnActive,
                  ]}
                  onPress={() => setAttachmentMode('LINK')}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.attachIconWrap,
                      { backgroundColor: attachmentMode === 'LINK' ? '#4F46E5' : '#EEF2FF' },
                    ]}
                  >
                    <Globe
                      size={17}
                      color={attachmentMode === 'LINK' ? '#ffffff' : '#4F46E5'}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.attachBtnTitle,
                      attachmentMode === 'LINK' && styles.attachBtnTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    Link
                  </Text>
                </TouchableOpacity>

                {/* Option 2: Upload Images */}
                <TouchableOpacity
                  style={[
                    styles.attachBtn,
                    attachmentMode === 'IMAGE' && styles.attachBtnActive,
                  ]}
                  onPress={() => {
                    setAttachmentMode('IMAGE');
                    setImageAttached(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.attachIconWrap,
                      { backgroundColor: attachmentMode === 'IMAGE' ? '#E11D48' : '#FFE4E6' },
                    ]}
                  >
                    <ImageIcon
                      size={17}
                      color={attachmentMode === 'IMAGE' ? '#ffffff' : '#E11D48'}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.attachBtnTitle,
                      attachmentMode === 'IMAGE' && styles.attachBtnTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    Images
                  </Text>
                </TouchableOpacity>

                {/* Option 3: Upload Document */}
                <TouchableOpacity
                  style={[
                    styles.attachBtn,
                    attachmentMode === 'DOC' && styles.attachBtnActive,
                  ]}
                  onPress={() => {
                    setAttachmentMode('DOC');
                    setDocAttached(true);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.attachIconWrap,
                      { backgroundColor: attachmentMode === 'DOC' ? '#059669' : '#D1FAE5' },
                    ]}
                  >
                    <FileText
                      size={17}
                      color={attachmentMode === 'DOC' ? '#ffffff' : '#059669'}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.attachBtnTitle,
                      attachmentMode === 'DOC' && styles.attachBtnTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    Doc / PDF
                  </Text>
                </TouchableOpacity>

                {/* Option 4: Add from Google Drive */}
                <TouchableOpacity
                  style={[
                    styles.attachBtn,
                    attachmentMode === 'DRIVE' && styles.attachBtnActive,
                  ]}
                  onPress={() => setAttachmentMode('DRIVE')}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.attachIconWrap,
                      { backgroundColor: attachmentMode === 'DRIVE' ? '#D97706' : '#FEF3C7' },
                    ]}
                  >
                    <HardDrive
                      size={17}
                      color={attachmentMode === 'DRIVE' ? '#ffffff' : '#D97706'}
                      strokeWidth={2.2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.attachBtnTitle,
                      attachmentMode === 'DRIVE' && styles.attachBtnTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    Drive
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 5. Dynamic Attachment Inputs */}
              {attachmentMode === 'LINK' && (
                <View style={styles.attachInputBlock}>
                  <Text style={styles.attachInputBlockLabel}>Internet / Video Link URL *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="https://youtube.com/watch?v=... or reference link"
                    placeholderTextColor="#94A3B8"
                    value={linkUrl}
                    onChangeText={setLinkUrl}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.modalInput, { marginTop: 8 }]}
                    placeholder="Link Label (e.g. Chapter Practice Video)"
                    placeholderTextColor="#94A3B8"
                    value={linkName}
                    onChangeText={setLinkName}
                  />
                </View>
              )}

              {attachmentMode === 'IMAGE' && (
                <TouchableOpacity
                  style={styles.dropzone}
                  onPress={() => setImageAttached(true)}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={26} color="#E11D48" />
                  <Text style={[styles.dropzoneTitle, { color: '#E11D48' }]}>
                    {imageAttached
                      ? 'Selected: homework_problem_diagram.jpg'
                      : 'Choose Images from Gallery / Camera'}
                  </Text>
                  <Text style={styles.dropzoneSub}>Supports JPG, PNG up to 15MB</Text>
                </TouchableOpacity>
              )}

              {attachmentMode === 'DOC' && (
                <View style={styles.attachInputBlock}>
                  <View style={styles.formatPillRow}>
                    {(['PDF', 'DOCX', 'PPTX'] as const).map((fmt) => (
                      <TouchableOpacity
                        key={fmt}
                        style={[
                          styles.formatPill,
                          docFormat === fmt && styles.formatPillActive,
                        ]}
                        onPress={() => setDocFormat(fmt)}
                      >
                        <Text
                          style={[
                            styles.formatPillText,
                            docFormat === fmt && styles.formatPillTextActive,
                          ]}
                        >
                          {fmt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={styles.dropzone}
                    onPress={() => setDocAttached(true)}
                    activeOpacity={0.8}
                  >
                    <FileText size={26} color="#059669" />
                    <Text style={styles.dropzoneTitle}>
                      {docAttached
                        ? `Ready: homework_problem_sheet.${docFormat.toLowerCase()}`
                        : `Select ${docFormat} Document`}
                    </Text>
                    <Text style={styles.dropzoneSub}>Supports {docFormat} up to 25MB</Text>
                  </TouchableOpacity>
                </View>
              )}

              {attachmentMode === 'DRIVE' && (
                <View style={styles.attachInputBlock}>
                  <Text style={styles.attachInputBlockLabel}>Google Drive Link / Folder *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="https://drive.google.com/file/d/... or shared folder link"
                    placeholderTextColor="#94A3B8"
                    value={driveUrl}
                    onChangeText={setDriveUrl}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={[styles.modalInput, { marginTop: 8 }]}
                    placeholder="Folder Label (e.g. Chapter 3 Problems Folder)"
                    placeholderTextColor="#94A3B8"
                    value={driveName}
                    onChangeText={setDriveName}
                  />
                </View>
              )}

              {/* 6. Instructions / Description */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                Instructions / Description (Optional)
              </Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Detailed instructions or problem numbers..."
                placeholderTextColor="#94A3B8"
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
              />
            </ScrollView>

            {/* 7. Bottom Action Buttons: Schedule & Publish Now */}
            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={handleOpenScheduleModal}
                activeOpacity={0.85}
              >
                <Clock size={16} color="#7c3aed" />
                <Text style={styles.scheduleBtnText}>Schedule</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.publishNowBtn,
                  !newTitle.trim() && styles.publishNowBtnDisabled,
                ]}
                onPress={handlePublishNow}
                disabled={!newTitle.trim()}
                activeOpacity={0.85}
              >
                <Send size={15} color="#ffffff" />
                <Text style={styles.publishNowBtnText}>Publish Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Chapter Selection Modal ────────────────────────────────────── */}
      <Modal
        visible={isChapterPickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsChapterPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalOverlay}
          activeOpacity={1}
          onPress={() => setIsChapterPickerOpen(false)}
        >
          <View style={styles.pickerModalCard}>
            <View style={styles.pickerModalHeader}>
              <View>
                <Text style={styles.pickerModalTitle}>Tag Curriculum Chapter</Text>
                <Text style={styles.pickerModalSub}>
                  {modalSubjectName} ({modalClass})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsChapterPickerOpen(false)}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {/* Uncategorised Option */}
              <TouchableOpacity
                style={[
                  styles.pickerOptionRow,
                  selectedChapterTag === 'Uncategorised' && styles.pickerOptionRowActive,
                ]}
                onPress={() => {
                  setSelectedChapterTag('Uncategorised');
                  setSelectedChapterId(null);
                  setIsChapterPickerOpen(false);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selectedChapterTag === 'Uncategorised' && styles.pickerOptionTextActive,
                    ]}
                  >
                    🚫 Uncategorised
                  </Text>
                  <Text style={styles.pickerOptionSub}>
                    General homework not tied to a specific chapter
                  </Text>
                </View>
                {selectedChapterTag === 'Uncategorised' && (
                  <Check size={16} color="#059669" strokeWidth={2.5} />
                )}
              </TouchableOpacity>

              {/* List of Chapters for this Subject */}
              {curriculumChapters.map((ch) => {
                const tagText = `Chapter ${ch.chapterNumber}: ${ch.title}`;
                const isSelected =
                  selectedChapterTag === tagText || selectedChapterId === ch.id;
                return (
                  <TouchableOpacity
                    key={ch.id}
                    style={[
                      styles.pickerOptionRow,
                      isSelected && styles.pickerOptionRowActive,
                    ]}
                    onPress={() => {
                      setSelectedChapterTag(tagText);
                      setSelectedChapterId(ch.id);
                      setIsChapterPickerOpen(false);
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text
                        style={[
                          styles.pickerOptionText,
                          isSelected && styles.pickerOptionTextActive,
                        ]}
                      >
                        Ch {ch.chapterNumber}: {ch.title}
                      </Text>
                      <Text style={styles.pickerOptionSub} numberOfLines={1}>
                        {ch.bookTitle}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color="#059669" strokeWidth={2.5} />}
                  </TouchableOpacity>
                );
              })}

              {curriculumChapters.length === 0 && (
                <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#64748B' }}>
                    No curriculum chapters registered yet for {modalSubjectName}.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── Schedule Assignment Sheet Modal ────────────────────────────── */}
      <Modal visible={showScheduleModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowScheduleModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.scheduleModalSheet}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.createModalTitle}>Schedule Release</Text>
                    <Text style={styles.scheduleSubTitle}>Set exact publish date & time for students</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowScheduleModal(false)}>
                    <X size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 14, marginVertical: 12 }}>
                  {/* Select Publish Date with Left/Right Buttons & Calendar Trigger */}
                  <View>
                    <Text style={styles.inputLabel}>Publish Date</Text>
                    <View style={styles.dateNavContainer}>
                      <TouchableOpacity
                        style={[
                          styles.dateNavArrowBtn,
                          isScheduledDateAtToday && styles.dateNavArrowBtnDisabled,
                        ]}
                        disabled={isScheduledDateAtToday}
                        onPress={() => handleShiftScheduledDate(-1)}
                        activeOpacity={0.7}
                      >
                        <ChevronLeft
                          size={18}
                          color={isScheduledDateAtToday ? COLORS.outline : COLORS.text}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.publishDateDisplayBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          const [y, m] = scheduledDate.split('-').map(Number);
                          setDatePickerMonth(new Date(y, m - 1, 1));
                          setShowDatePickerModal(true);
                        }}
                      >
                        <Calendar size={16} color="#7c3aed" style={{ marginRight: 6 }} />
                        <Text style={styles.publishDateDisplayText}>
                          {formatDateReadable(scheduledDate)}
                        </Text>
                        <ChevronDown size={14} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.dateNavArrowBtn}
                        onPress={() => handleShiftScheduledDate(1)}
                        activeOpacity={0.7}
                      >
                        <ChevronRight size={18} color={COLORS.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Select Publish Time */}
                  <View>
                    <View style={styles.timeHeaderRow}>
                      <Text style={styles.inputLabel}>Publish Time</Text>
                      <View style={styles.periodToggleWrapper}>
                        <TouchableOpacity
                          style={[
                            styles.periodToggleBtn,
                            parsedTime.period === 'AM' && styles.periodToggleBtnActive,
                          ]}
                          onPress={() => handleSelectPeriod('AM')}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.periodToggleText,
                              parsedTime.period === 'AM' && styles.periodToggleTextActive,
                            ]}
                          >
                            AM
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.periodToggleBtn,
                            parsedTime.period === 'PM' && styles.periodToggleBtnActive,
                          ]}
                          onPress={() => handleSelectPeriod('PM')}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.periodToggleText,
                              parsedTime.period === 'PM' && styles.periodToggleTextActive,
                            ]}
                          >
                            PM
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* 12-Hour Selection Grid */}
                    <View style={styles.hoursGrid}>
                      {TIME_HOURS.map((hour) => {
                        const isSelected = parsedTime.hour === hour;
                        return (
                          <TouchableOpacity
                            key={hour}
                            style={[
                              styles.hourCellBtn,
                              isSelected && styles.hourCellBtnActive,
                            ]}
                            onPress={() => handleSelectHour(hour)}
                            activeOpacity={0.75}
                          >
                            <Text
                              style={[
                                styles.hourCellText,
                                isSelected && styles.hourCellTextActive,
                              ]}
                            >
                              {hour}
                            </Text>
                            <Text
                              style={[
                                styles.hourCellSubText,
                                isSelected && styles.hourCellSubTextActive,
                              ]}
                            >
                              {parsedTime.period}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Summary Banner */}
                  <View style={styles.scheduleSummaryBanner}>
                    <Clock size={16} color="#7c3aed" />
                    <Text style={styles.scheduleSummaryText}>
                      Will auto-publish on {scheduledDate} at {scheduledTime}
                    </Text>
                  </View>
                </View>

                {/* Footer Buttons */}
                <View style={styles.createModalFooter}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowScheduleModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, { backgroundColor: '#7c3aed' }]}
                    onPress={handleConfirmSchedule}
                  >
                    <Text style={styles.modalSubmitText}>Confirm Schedule</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Calendar Date Picker Modal ────────────────────────────────── */}
      <Modal visible={showDatePickerModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDatePickerModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.datePickerModalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.createModalTitle}>Select Publish Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePickerModal(false)}>
                    <X size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                {/* Month Navigation */}
                <View style={styles.monthHeaderRow}>
                  <TouchableOpacity
                    style={[styles.monthNavBtn, isAtCurrentMonth && styles.monthNavBtnDisabled]}
                    disabled={isAtCurrentMonth}
                    onPress={handlePrevMonth}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft
                      size={18}
                      color={isAtCurrentMonth ? COLORS.outline : COLORS.text}
                    />
                  </TouchableOpacity>

                  <Text style={styles.monthYearTitle}>
                    {MONTH_NAMES[datePickerMonth.getMonth()]} {datePickerMonth.getFullYear()}
                  </Text>

                  <TouchableOpacity
                    style={styles.monthNavBtn}
                    onPress={handleNextMonth}
                    activeOpacity={0.7}
                  >
                    <ChevronRight size={18} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                {/* Weekday Row */}
                <View style={styles.weekDaysRow}>
                  {WEEK_DAYS.map((wd) => (
                    <Text key={wd} style={styles.weekDayHeaderLabel}>
                      {wd}
                    </Text>
                  ))}
                </View>

                {/* Calendar Days Grid */}
                <View style={styles.calendarPickerGrid}>
                  {buildMonthWeeks(datePickerMonth).map((week, wIndex) => (
                    <View key={`pw-${wIndex}`} style={styles.calendarPickerWeekRow}>
                      {week.map((date) => {
                        const y = date.getFullYear();
                        const m = `${date.getMonth() + 1}`.padStart(2, '0');
                        const d = `${date.getDate()}`.padStart(2, '0');
                        const dateKey = `${y}-${m}-${d}`;
                        const todayKey = getTodayDateStr();
                        const isPast = dateKey < todayKey;
                        const isCurrentMonth = date.getMonth() === datePickerMonth.getMonth();
                        const isSelected = dateKey === scheduledDate;
                        const isToday = dateKey === todayKey;

                        if (isPast) {
                          return (
                            <View key={dateKey} style={styles.calendarDayCellWrapper}>
                              <View style={styles.calendarDayCellDisabled}>
                                <Text style={styles.calendarDayTextDisabled}>
                                  {date.getDate()}
                                </Text>
                              </View>
                            </View>
                          );
                        }

                        return (
                          <View key={dateKey} style={styles.calendarDayCellWrapper}>
                            <TouchableOpacity
                              style={[
                                styles.calendarDayCell,
                                isToday && !isSelected && styles.calendarDayCellToday,
                                isSelected && styles.calendarDayCellSelected,
                              ]}
                              onPress={() => {
                                setScheduledDate(dateKey);
                                setShowDatePickerModal(false);
                              }}
                              activeOpacity={0.75}
                            >
                              <Text
                                style={[
                                  styles.calendarDayText,
                                  !isCurrentMonth && styles.calendarDayTextMuted,
                                  isToday && !isSelected && styles.calendarDayTextToday,
                                  isSelected && styles.calendarDayTextSelected,
                                ]}
                              >
                                {date.getDate()}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  // Pills (Horizontal Scrollable Selector)
  pillsContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pillsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: '#7C3AED',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Floating Action Button
  floatingActionWrapper: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    zIndex: 999,
  },
  floatingActionBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  // Modal Overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 20,
    padding: 16,
    alignSelf: 'center',
    marginVertical: 'auto',
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
  createModalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createModalTitleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  createModalTitle: {
    fontSize: 17,
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
  subjectOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // Subject Row Badges
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  inputLabelHint: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  subjectSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subjectSelectBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  subjectSelectText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  subjectSelectTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Chapter Selector
  chapterSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chapterSelectorBtnActive: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  chapterSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  chapterSelectorText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#047857',
  },
  chapterSelectorTextUncategorised: {
    color: '#64748B',
    fontWeight: '500',
  },

  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
  },

  // 4 Attachments Single Row
  attachRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  attachBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  attachBtnActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  attachIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBtnTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  attachBtnTitleActive: {
    color: '#047857',
  },

  // Attachment input block
  attachInputBlock: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    gap: 8,
  },
  attachInputBlockLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  formatPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  formatPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  formatPillActive: {
    backgroundColor: '#059669',
  },
  formatPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  formatPillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  dropzone: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dropzoneTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  dropzoneSub: {
    fontSize: 11,
    color: '#64748B',
  },

  // Modal Footer: Schedule & Publish Now
  modalFooterRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  scheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FAF5FF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    gap: 6,
  },
  scheduleBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#7C3AED',
  },
  publishNowBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#059669',
    gap: 6,
  },
  publishNowBtnDisabled: {
    opacity: 0.5,
  },
  publishNowBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Chapter Picker Modal Sheet
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pickerModalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pickerModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  pickerModalSub: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  pickerOptionRowActive: {
    backgroundColor: '#ECFDF5',
  },
  pickerOptionText: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: '#047857',
    fontWeight: '700',
  },
  pickerOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Schedule Modal Sheet
  scheduleModalSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 22,
    padding: 18,
    alignSelf: 'center',
    marginVertical: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  scheduleSubTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  // Date Navigation Bar
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginTop: 2,
  },
  dateNavArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
  },
  dateNavArrowBtnDisabled: {
    opacity: 0.35,
    backgroundColor: COLORS.surfaceLow,
  },
  publishDateDisplayBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  publishDateDisplayText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },

  // Time Header & Period Toggle
  timeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  periodToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    padding: 2,
  },
  periodToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  periodToggleBtnActive: {
    backgroundColor: '#7c3aed',
  },
  periodToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  periodToggleTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // 12-Hour Grid
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hourCellBtn: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
  },
  hourCellBtnActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  hourCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  hourCellTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  hourCellSubText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  hourCellSubTextActive: {
    color: '#ede9fe',
    fontWeight: '700',
  },

  // Schedule Summary Banner
  scheduleSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scheduleSummaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },

  // Calendar Date Picker Modal Sheet
  datePickerModalSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 22,
    padding: 18,
    alignSelf: 'center',
    marginVertical: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  monthHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavBtnDisabled: {
    opacity: 0.35,
  },
  monthYearTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  weekDayHeaderLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  calendarPickerGrid: {
    gap: 4,
  },
  calendarPickerWeekRow: {
    flexDirection: 'row',
    width: '100%',
  },
  calendarDayCellWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  calendarDayCell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayCellSelected: {
    backgroundColor: '#7c3aed',
  },
  calendarDayCellToday: {
    borderWidth: 1.5,
    borderColor: '#7c3aed',
  },
  calendarDayCellDisabled: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  calendarDayTextToday: {
    color: '#7c3aed',
    fontWeight: '800',
  },
  calendarDayTextMuted: {
    color: '#9ca3af',
  },
  calendarDayTextDisabled: {
    color: '#9ca3af',
  },

  // Modal Cancel & Submit
  createModalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceContainer,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modalSubmitBtn: {
    flex: 1.2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
