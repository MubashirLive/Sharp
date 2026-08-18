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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  Link,
  Lock,
  Paperclip,
  PenTool,
  Plus,
  Search,
  Send,
  Trash2,
  Users,
  X,
} from 'lucide-react-native';
import {
  AgendaCalendar,
  type AgendaCategory,
  type AgendaItem,
  type AgendaAttachment,
} from '@/components/calendar/agenda-calendar';

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
};

// ─── School Structure Constants ─────────────────────────────────────────────
const CLASSES = ['Grade 10', 'Grade 9', 'Grade 12', 'Grade 8'];
const SECTIONS_BY_CLASS: Record<string, string[]> = {
  'Grade 10': ['Section A', 'Section B'],
  'Grade 9': ['Section A', 'Section B', 'Section C'],
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
    badgeClassName: 'bg-violet-600',
  },
  {
    id: 'environmental-studies',
    label: 'Environmental Studies',
    shortLabel: 'EVS',
    iconColor: '#0f766e',
    badgeClassName: 'bg-teal-700',
  },
  {
    id: 'hindi',
    label: 'Hindi',
    shortLabel: 'Hin',
    iconColor: '#b45309',
    badgeClassName: 'bg-amber-700',
  },
  {
    id: 'biology',
    label: 'Biology',
    shortLabel: 'Bio',
    iconColor: '#15803d',
    badgeClassName: 'bg-green-700',
  },
  {
    id: 'physical-education',
    label: 'Physical Education',
    shortLabel: 'PE',
    iconColor: '#c2410c',
    badgeClassName: 'bg-orange-600',
  },
];

type TeacherAgendaItem = AgendaItem & {
  className: string;
  section: string;
  submittedCount?: number;
  totalStudents?: number;
  status?: 'active' | 'scheduled';
};

// ─── Initial Homework Dataset ────────────────────────────────────────────────
const INITIAL_HOMEWORK_ITEMS: TeacherAgendaItem[] = [
  // Grade 10 - Section A
  {
    id: '2026-07-12-science-10a',
    date: '2026-07-12',
    time: '09:00 AM',
    categoryId: 'science',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Cell Mitosis Worksheet',
    description:
      'Label the stages of mitosis and answer the short response questions. Use colored pencils for the chromosome diagrams.',
    owner: 'Dr. Ramesh Kumar',
    submittedCount: 28,
    totalStudents: 36,
  },
  {
    id: '2026-07-12-english-10a',
    date: '2026-07-12',
    time: '09:15 AM',
    categoryId: 'english',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Essay Draft 2',
    description:
      'Revise the introduction and conclusion of your essay. Bring one printed copy for peer review and upload the digital draft before class.',
    owner: 'Mrs. Roberts',
    attachments: [{ id: 'essay-rubric', kind: 'file', label: 'Essay rubric.pdf' }],
    submittedCount: 32,
    totalStudents: 36,
  },
  {
    id: '2026-07-12-math-10a',
    date: '2026-07-12',
    time: '09:30 AM',
    categoryId: 'mathematics',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Trigonometric Identities',
    description:
      'Complete the review exercises for trigonometric identities. Show each proof step clearly and mark the formulas used beside the solution.',
    owner: 'Mr. Kapoor',
    attachments: [{ id: 'math-formula-sheet', kind: 'file', label: 'Formula sheet.pdf' }],
    submittedCount: 35,
    totalStudents: 36,
  },
  {
    id: '2026-07-12-art-10a',
    date: '2026-07-12',
    time: '09:45 AM',
    categoryId: 'art',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Color Theory Assignment',
    description:
      'Create a six-panel color harmony study using complementary, analogous, and triadic combinations.',
    owner: 'Mr. Jenkins',
    attachments: [{ id: 'palette-guide', kind: 'link', label: 'Digital palette guide' }],
    submittedCount: 24,
    totalStudents: 36,
  },
  {
    id: '2026-07-12-ss-10a',
    date: '2026-07-12',
    time: '10:00 AM',
    categoryId: 'social-studies',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Map Skills Worksheet',
    description:
      'Complete the map-reading worksheet and mark the requested rivers, plateaus, and neighboring states clearly.',
    owner: 'Ms. Iyer',
    submittedCount: 30,
    totalStudents: 36,
  },
  {
    id: '2026-07-12-evs-10a',
    date: '2026-07-12',
    time: '10:15 AM',
    categoryId: 'environmental-studies',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Water Conservation Notes',
    description:
      'Write five points on water conservation and paste one local newspaper clipping related to the topic.',
    owner: 'Mrs. Menon',
    submittedCount: 31,
    totalStudents: 36,
  },
  {
    id: '2026-07-12-hindi-10a',
    date: '2026-07-12',
    time: '10:30 AM',
    categoryId: 'hindi',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Poem Recitation Prep',
    description:
      'Practice the assigned poem and write the meanings of the highlighted words in your notebook.',
    owner: 'Mrs. Sharma',
    submittedCount: 33,
    totalStudents: 36,
  },
  {
    id: '2026-07-12-bio-10a',
    date: '2026-07-12',
    time: '10:45 AM',
    categoryId: 'biology',
    className: 'Grade 10',
    section: 'Section A',
    title: 'Plant Tissue Diagram',
    description:
      'Draw and label the plant tissue diagram, then answer the two short questions below it.',
    owner: 'Dr. Ramesh Kumar',
    submittedCount: 29,
    totalStudents: 36,
  },

  // Grade 10 - Section B
  {
    id: '2026-07-15-math-10b',
    date: '2026-07-15',
    time: '09:45 AM',
    categoryId: 'mathematics',
    className: 'Grade 10',
    section: 'Section B',
    title: 'Quadratic Equations Set #2',
    description:
      'Solve problems 1 through 15 on quadratic factorisation and check roots using quadratic formula.',
    owner: 'Mr. Kapoor',
    submittedCount: 20,
    totalStudents: 28,
  },

  // Grade 9 - Section A
  {
    id: '2026-07-17-math-9a',
    date: '2026-07-17',
    time: '09:15 AM',
    categoryId: 'mathematics',
    className: 'Grade 9',
    section: 'Section A',
    title: 'Complete Algebra Chapter 4 Review Exercises',
    description:
      'Finish the chapter review exercises and show all working steps. Mark any difficult questions for discussion in the next class.',
    owner: 'Mr. Kapoor',
    attachments: [{ id: 'algebra-review', kind: 'file', label: 'Chapter 4 review worksheet.pdf' }],
    submittedCount: 25,
    totalStudents: 30,
  },
];

const SAMPLE_FILES = [
  'Worksheet_Practice_Set.pdf',
  'Reference_Study_Notes.docx',
  'Lab_Experiment_Diagram.pdf',
  'Formula_Sheet_Review.pdf',
];

const TIME_SLOTS = ['08:00 AM', '09:00 AM', '10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM'];

export default function TeacherHomeworkScreen() {
  const router = useRouter();

  // ─── Main Screen Top Dropdowns (Class ➔ Section ➔ Subject) ─────────────────
  const [selectedClass, setSelectedClass] = useState<string | null>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string | null>('Section A');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Main Screen Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);

  // ─── Assign Homework Modal State ──────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Modal Dropdowns (Class, Section, Subject) - Inherited from previous screen
  const [modalClass, setModalClass] = useState<string | null>(null);
  const [modalSection, setModalSection] = useState<string | null>(null);
  const [modalSubject, setModalSubject] = useState<string | null>(null);

  // Inline Picker State inside Assign Homework Modal ('class' | 'section' | 'subject' | null)
  const [activeAssignPicker, setActiveAssignPicker] = useState<'class' | 'section' | 'subject' | null>(null);

  // Assignment Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [attachments, setAttachments] = useState<AgendaAttachment[]>([]);

  // Add Link Modal State
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // ─── Schedule Modal State ──────────────────────────────────────────────────
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('2026-07-13');
  const [scheduledTime, setScheduledTime] = useState('08:00 AM');

  // Homework Dataset State
  const [homeworkList, setHomeworkList] = useState<TeacherAgendaItem[]>(INITIAL_HOMEWORK_ITEMS);

  // Available sections based on modal class selection
  const modalAvailableSections = useMemo(() => {
    if (!modalClass) return [];
    return SECTIONS_BY_CLASS[modalClass] || [];
  }, [modalClass]);

  // Main screen available sections
  const mainAvailableSections = useMemo(() => {
    if (!selectedClass) return [];
    return SECTIONS_BY_CLASS[selectedClass] || [];
  }, [selectedClass]);

  // Open Assign Homework Modal & Inherit Filter Settings
  const handleOpenAssignModal = () => {
    // Inherit Class, Section, Subject if set in previous screen, else leave unset (null)
    setModalClass(selectedClass);
    setModalSection(selectedSection);
    setModalSubject(selectedSubject);
    setActiveAssignPicker(null);
    setNewTitle('');
    setNewDescription('');
    setAttachments([]);
    setShowCreateModal(true);
  };

  // Main Dropdown Handlers
  const handleSelectClass = (cls: string | null) => {
    setSelectedClass(cls);
    setSelectedSection(null);
    setIsClassModalOpen(false);
  };

  const handleSelectSection = (sec: string | null) => {
    setSelectedSection(sec);
    setIsSectionModalOpen(false);
  };

  const handleSelectSubject = (subjId: string | null) => {
    setSelectedSubject(subjId);
    setIsSubjectModalOpen(false);
  };

  // Attachment Handlers
  const handleAddFile = () => {
    const fileIndex = attachments.filter((a) => a.kind === 'file').length % SAMPLE_FILES.length;
    const fileName = SAMPLE_FILES[fileIndex];
    const newFile: AgendaAttachment = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kind: 'file',
      label: fileName,
    };
    setAttachments((prev) => [...prev, newFile]);
  };

  const handleConfirmAddLink = () => {
    if (!linkUrl.trim()) {
      Alert.alert('Missing Link', 'Please enter a web URL (e.g. https://google.com)');
      return;
    }
    const cleanUrl = linkUrl.trim();
    const titleText = linkLabel.trim() || cleanUrl.replace(/^https?:\/\/(www\.)?/, '');
    const newLink: AgendaAttachment = {
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kind: 'link',
      label: `${titleText} (${cleanUrl})`,
    };
    setAttachments((prev) => [...prev, newLink]);
    setLinkLabel('');
    setLinkUrl('');
    setShowAddLinkModal(false);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // ─── Dynamic Multi-Tier Filtering Logic ────────────────────────────────────
  const filteredHomeworkItems = useMemo(() => {
    let items = homeworkList;

    if (selectedClass) {
      items = items.filter((item) => item.className === selectedClass);
    }

    if (selectedClass && selectedSection) {
      items = items.filter((item) => item.section === selectedSection);
    }

    if (selectedSubject) {
      items = items.filter((item) => item.categoryId === selectedSubject);
    }

    return items;
  }, [homeworkList, selectedClass, selectedSection, selectedSubject]);

  const selectedSubjectObj = useMemo(() => {
    if (!selectedSubject) return null;
    return HOMEWORK_CATEGORIES.find((c) => c.id === selectedSubject);
  }, [selectedSubject]);

  const modalSubjectObj = useMemo(() => {
    if (!modalSubject) return null;
    return HOMEWORK_CATEGORIES.find((c) => c.id === modalSubject);
  }, [modalSubject]);

  // Validation before Publishing / Scheduling
  const validateForm = () => {
    if (!modalClass) {
      Alert.alert('Class Required', 'Please select a Class for this assignment.');
      return false;
    }
    if (!modalSection) {
      Alert.alert('Section Required', 'Please select a Section for this assignment.');
      return false;
    }
    if (!modalSubject) {
      Alert.alert('Subject Required', 'Please select a Subject for this assignment.');
      return false;
    }
    if (!newTitle.trim()) {
      Alert.alert('Title Required', 'Please enter an Assignment Title.');
      return false;
    }
    return true;
  };

  // Immediate Publish Handler
  const handlePublishNow = () => {
    if (!validateForm()) return;

    const newAssignment: TeacherAgendaItem = {
      id: `hw-${Date.now()}`,
      date: '2026-07-12',
      time: '09:00 AM',
      categoryId: modalSubject!,
      className: modalClass!,
      section: modalSection!,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Complete the assigned exercises and show clear steps.',
      owner: 'Teacher',
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      submittedCount: 0,
      totalStudents: 36,
      status: 'active',
    };

    setHomeworkList([newAssignment, ...homeworkList]);
    setShowCreateModal(false);
    Alert.alert('Homework Published! 🚀', `Assignment released immediately for ${modalClass} - ${modalSection}.`);
  };

  // Open Schedule Modal
  const handleOpenScheduleModal = () => {
    if (!validateForm()) return;
    setShowScheduleModal(true);
  };

  // Confirm Schedule Handler
  const handleConfirmSchedule = () => {
    const newAssignment: TeacherAgendaItem = {
      id: `hw-sched-${Date.now()}`,
      date: scheduledDate,
      time: scheduledTime,
      categoryId: modalSubject!,
      className: modalClass!,
      section: modalSection!,
      title: newTitle.trim(),
      description: newDescription.trim() || 'Complete the assigned exercises and show clear steps.',
      owner: 'Teacher',
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      submittedCount: 0,
      totalStudents: 36,
      status: 'scheduled',
    };

    setHomeworkList([newAssignment, ...homeworkList]);
    setShowScheduleModal(false);
    setShowCreateModal(false);
    Alert.alert(
      'Homework Scheduled! ⏱️',
      `Assignment scheduled to publish on ${scheduledDate} at ${scheduledTime} for ${modalClass} - ${modalSection}.`
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ─── Top 3-Dropdown Selection Bar (Class ➔ Section ➔ Subject) ────── */}
      <View style={styles.filterSection}>
        <View style={styles.dropdownRow}>
          {/* 1st Dropdown: Class */}
          <TouchableOpacity
            style={styles.dropdownButton}
            activeOpacity={0.8}
            onPress={() => setIsClassModalOpen(true)}
          >
            <View style={styles.dropdownIconWrapper}>
              <GraduationCap size={15} color={selectedClass ? COLORS.primary : COLORS.textMuted} />
            </View>
            <View style={styles.dropdownTextWrapper}>
              <Text style={styles.dropdownLabel}>Class</Text>
              <Text style={styles.dropdownValue} numberOfLines={1}>
                {selectedClass ?? 'All Classes'}
              </Text>
            </View>
            <ChevronDown size={15} color={COLORS.textMuted} />
          </TouchableOpacity>

          {/* 2nd Dropdown: Section */}
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
                <Lock size={14} color={COLORS.outline} />
              ) : (
                <Users size={15} color={selectedSection ? COLORS.primary : COLORS.textMuted} />
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
                  ? 'All Sec'
                  : selectedSection ?? 'All Sections'}
              </Text>
            </View>
            <ChevronDown size={15} color={selectedClass ? COLORS.textMuted : COLORS.outline} />
          </TouchableOpacity>

          {/* 3rd Dropdown: Subject */}
          <TouchableOpacity
            style={styles.dropdownButton}
            activeOpacity={0.8}
            onPress={() => setIsSubjectModalOpen(true)}
          >
            <View style={styles.dropdownIconWrapper}>
              <BookOpen
                size={15}
                color={selectedSubjectObj ? selectedSubjectObj.iconColor : COLORS.textMuted}
              />
            </View>
            <View style={styles.dropdownTextWrapper}>
              <Text style={styles.dropdownLabel}>Subject</Text>
              <Text
                style={[
                  styles.dropdownValue,
                  selectedSubjectObj && { color: selectedSubjectObj.iconColor },
                ]}
                numberOfLines={1}
              >
                {selectedSubjectObj ? selectedSubjectObj.label : 'All Subjects'}
              </Text>
            </View>
            <ChevronDown size={15} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Embedded Agenda Calendar (Identical UI/UX to Student App) ────── */}
      <View style={{ flex: 1 }}>
        <AgendaCalendar
          title="Homework"
          initialDate="2026-07-12"
          categories={HOMEWORK_CATEGORIES}
          items={filteredHomeworkItems}
          itemCountLabel="Homework Items"
        />
      </View>

      {/* ─── Floating Action Button: Assign New Homework ───────────────── */}
      <View style={styles.floatingActionWrapper} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.floatingActionBtn}
          onPress={handleOpenAssignModal}
          activeOpacity={0.88}
        >
          <Plus size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.floatingActionText}>
            Assign Homework • {selectedClass ? `${selectedClass} (${selectedSection || 'All Sec'})` : 'Global'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Main Screen Class Picker Modal ────────────────────────────── */}
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
                      All Classes (School View)
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

      {/* ─── Main Screen Section Picker Modal ──────────────────────────── */}
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
                  {mainAvailableSections.map((sec) => (
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

      {/* ─── Main Screen Subject Picker Modal ──────────────────────────── */}
      <Modal visible={isSubjectModalOpen} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setIsSubjectModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Filter by Subject</Text>
                  <TouchableOpacity onPress={() => setIsSubjectModalOpen(false)}>
                    <X size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalScroll}>
                  <TouchableOpacity
                    style={[styles.modalOption, selectedSubject === null && styles.modalOptionActive]}
                    onPress={() => handleSelectSubject(null)}
                  >
                    <Text style={[styles.modalOptionText, selectedSubject === null && styles.modalOptionTextActive]}>
                      All Subjects
                    </Text>
                  </TouchableOpacity>
                  {HOMEWORK_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.modalOption, selectedSubject === cat.id && styles.modalOptionActive]}
                      onPress={() => handleSelectSubject(cat.id)}
                    >
                      <View style={styles.subjectOptionRow}>
                        <View style={[styles.subjectDot, { backgroundColor: cat.iconColor }]} />
                        <Text
                          style={[
                            styles.modalOptionText,
                            selectedSubject === cat.id && { color: cat.iconColor, fontWeight: '800' },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Assign Homework Modal ────────────────────────────────────── */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setShowCreateModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.createModalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.createModalTitle}>Assign Homework</Text>
                  <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                    <X size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={{ maxHeight: 440 }} contentContainerStyle={{ gap: 12 }}>
                  {/* 1. Class ➔ Section ➔ Subject Dropdowns (Top Row) */}
                  <View style={styles.assignDropdownRow}>
                    {/* Class Dropdown */}
                    <TouchableOpacity
                      style={[
                        styles.assignDropdownBtn,
                        activeAssignPicker === 'class' && styles.assignDropdownBtnActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() =>
                        setActiveAssignPicker(activeAssignPicker === 'class' ? null : 'class')
                      }
                    >
                      <Text style={styles.assignDropdownLabel}>Class</Text>
                      <View style={styles.assignDropdownValueRow}>
                        <Text
                          style={[
                            styles.assignDropdownValue,
                            !modalClass && styles.assignDropdownValueUnset,
                          ]}
                          numberOfLines={1}
                        >
                          {modalClass ?? 'Select Class'}
                        </Text>
                        <ChevronDown size={14} color={COLORS.textMuted} />
                      </View>
                    </TouchableOpacity>

                    {/* Section Dropdown */}
                    <TouchableOpacity
                      style={[
                        styles.assignDropdownBtn,
                        !modalClass && styles.assignDropdownBtnDisabled,
                        activeAssignPicker === 'section' && styles.assignDropdownBtnActive,
                      ]}
                      activeOpacity={modalClass ? 0.8 : 1}
                      onPress={() => {
                        if (modalClass) {
                          setActiveAssignPicker(activeAssignPicker === 'section' ? null : 'section');
                        }
                      }}
                    >
                      <Text style={styles.assignDropdownLabel}>Section</Text>
                      <View style={styles.assignDropdownValueRow}>
                        <Text
                          style={[
                            styles.assignDropdownValue,
                            !modalSection && styles.assignDropdownValueUnset,
                          ]}
                          numberOfLines={1}
                        >
                          {!modalClass
                            ? 'Select Sec'
                            : modalSection ?? 'Select Sec'}
                        </Text>
                        <ChevronDown size={14} color={COLORS.textMuted} />
                      </View>
                    </TouchableOpacity>

                    {/* Subject Dropdown */}
                    <TouchableOpacity
                      style={[
                        styles.assignDropdownBtn,
                        activeAssignPicker === 'subject' && styles.assignDropdownBtnActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() =>
                        setActiveAssignPicker(activeAssignPicker === 'subject' ? null : 'subject')
                      }
                    >
                      <Text style={styles.assignDropdownLabel}>Subject</Text>
                      <View style={styles.assignDropdownValueRow}>
                        <Text
                          style={[
                            styles.assignDropdownValue,
                            !modalSubject && styles.assignDropdownValueUnset,
                            modalSubjectObj && { color: modalSubjectObj.iconColor, fontWeight: '800' },
                          ]}
                          numberOfLines={1}
                        >
                          {modalSubjectObj ? modalSubjectObj.label : 'Select Subject'}
                        </Text>
                        <ChevronDown size={14} color={COLORS.textMuted} />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* ─── Inline Pickers inside Assign Homework Modal ─────────────── */}
                  {activeAssignPicker === 'class' && (
                    <View style={styles.inlinePickerBox}>
                      <Text style={styles.inlinePickerHeader}>Choose Class:</Text>
                      <View style={styles.inlineOptionGrid}>
                        {CLASSES.map((cls) => (
                          <TouchableOpacity
                            key={cls}
                            style={[
                              styles.inlineOptionPill,
                              modalClass === cls && styles.inlineOptionPillActive,
                            ]}
                            onPress={() => {
                              setModalClass(cls);
                              setModalSection(null);
                              setActiveAssignPicker(null);
                            }}
                          >
                            <Text
                              style={[
                                styles.inlineOptionText,
                                modalClass === cls && styles.inlineOptionTextActive,
                              ]}
                            >
                              {cls}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {activeAssignPicker === 'section' && (
                    <View style={styles.inlinePickerBox}>
                      <Text style={styles.inlinePickerHeader}>Choose Section ({modalClass}):</Text>
                      <View style={styles.inlineOptionGrid}>
                        {modalAvailableSections.map((sec) => (
                          <TouchableOpacity
                            key={sec}
                            style={[
                              styles.inlineOptionPill,
                              modalSection === sec && styles.inlineOptionPillActive,
                            ]}
                            onPress={() => {
                              setModalSection(sec);
                              setActiveAssignPicker(null);
                            }}
                          >
                            <Text
                              style={[
                                styles.inlineOptionText,
                                modalSection === sec && styles.inlineOptionTextActive,
                              ]}
                            >
                              {sec}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {activeAssignPicker === 'subject' && (
                    <View style={styles.inlinePickerBox}>
                      <Text style={styles.inlinePickerHeader}>Choose Subject:</Text>
                      <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                        <View style={{ gap: 6 }}>
                          {HOMEWORK_CATEGORIES.map((cat) => (
                            <TouchableOpacity
                              key={cat.id}
                              style={[
                                styles.inlineSubjectRow,
                                modalSubject === cat.id && styles.inlineSubjectRowActive,
                              ]}
                              onPress={() => {
                                setModalSubject(cat.id);
                                setActiveAssignPicker(null);
                              }}
                            >
                              <View style={[styles.subjectDot, { backgroundColor: cat.iconColor }]} />
                              <Text
                                style={[
                                  styles.inlineOptionText,
                                  modalSubject === cat.id && { color: cat.iconColor, fontWeight: '800' },
                                ]}
                              >
                                {cat.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {/* 2. Assignment Title */}
                  <View>
                    <Text style={styles.inputLabel}>Assignment Title</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Cell Mitosis & Diagram Review"
                      placeholderTextColor={COLORS.textMuted}
                      value={newTitle}
                      onChangeText={setNewTitle}
                    />
                  </View>

                  {/* 3. Instruction / Description */}
                  <View>
                    <Text style={styles.inputLabel}>Instructions / Description</Text>
                    <TextInput
                      style={[styles.input, { height: 74, textAlignVertical: 'top' }]}
                      placeholder="Detailed instructions or problem numbers..."
                      placeholderTextColor={COLORS.textMuted}
                      multiline
                      value={newDescription}
                      onChangeText={setNewDescription}
                    />
                  </View>

                  {/* 4. Attachment (Files & Web Links) */}
                  <View style={styles.attachmentSection}>
                    <View style={styles.attachmentHeaderRow}>
                      <Text style={styles.attachmentSectionLabel}>
                        Attachments ({attachments.length})
                      </Text>
                      <Text style={styles.attachmentSectionSub}>Optional</Text>
                    </View>

                    <View style={styles.attachmentActionsRow}>
                      <TouchableOpacity
                        style={styles.attachFileBtn}
                        onPress={handleAddFile}
                        activeOpacity={0.8}
                      >
                        <Paperclip size={14} color="#000000" />
                        <Text style={styles.attachFileBtnText}>+ Attach File</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.addLinkBtn}
                        onPress={() => setShowAddLinkModal(true)}
                        activeOpacity={0.8}
                      >
                        <Globe size={14} color="#7c3aed" />
                        <Text style={styles.addLinkBtnText}>+ Add Web Link</Text>
                      </TouchableOpacity>
                    </View>

                    {attachments.length > 0 && (
                      <View style={styles.attachmentItemsList}>
                        {attachments.map((att) => (
                          <View key={att.id} style={styles.attachmentItemCard}>
                            <View style={styles.attachmentItemLeft}>
                              {att.kind === 'file' ? (
                                <FileText size={15} color="#2563eb" />
                              ) : (
                                <Globe size={15} color="#7c3aed" />
                              )}
                              <Text style={styles.attachmentItemText} numberOfLines={1}>
                                {att.label}
                              </Text>
                            </View>
                            <TouchableOpacity
                              onPress={() => handleRemoveAttachment(att.id)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <X size={15} color={COLORS.textMuted} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </ScrollView>

                {/* 5. Footer Action Buttons: Schedule & Publish Now */}
                <View style={styles.createModalFooter}>
                  <TouchableOpacity
                    style={styles.scheduleFooterBtn}
                    onPress={handleOpenScheduleModal}
                    activeOpacity={0.85}
                  >
                    <Clock size={16} color="#7c3aed" />
                    <Text style={styles.scheduleFooterText}>Schedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.publishNowFooterBtn}
                    onPress={handlePublishNow}
                    activeOpacity={0.85}
                  >
                    <Send size={15} color="#ffffff" />
                    <Text style={styles.publishNowFooterText}>Publish Now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Add Web Link Modal Sheet ──────────────────────────────────── */}
      <Modal visible={showAddLinkModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowAddLinkModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.linkModalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.createModalTitle}>Add Web Link</Text>
                  <TouchableOpacity onPress={() => setShowAddLinkModal(false)}>
                    <X size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 10, marginVertical: 10 }}>
                  <View>
                    <Text style={styles.inputLabel}>Link Title / Name (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Video Tutorial or Reference Article"
                      placeholderTextColor={COLORS.textMuted}
                      value={linkLabel}
                      onChangeText={setLinkLabel}
                    />
                  </View>

                  <View>
                    <Text style={styles.inputLabel}>Web URL / Address</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="https://..."
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="url"
                      autoCapitalize="none"
                      value={linkUrl}
                      onChangeText={setLinkUrl}
                    />
                  </View>
                </View>

                <View style={styles.createModalFooter}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowAddLinkModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalSubmitBtn, { backgroundColor: '#7c3aed' }]}
                    onPress={handleConfirmAddLink}
                  >
                    <Text style={styles.modalSubmitText}>Add Link</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
                  {/* Select Date */}
                  <View>
                    <Text style={styles.inputLabel}>Publish Date</Text>
                    <TextInput
                      style={styles.input}
                      value={scheduledDate}
                      onChangeText={setScheduledDate}
                      placeholder="YYYY-MM-DD"
                    />
                    <View style={styles.presetDateRow}>
                      <TouchableOpacity
                        style={[
                          styles.presetDatePill,
                          scheduledDate === '2026-07-13' && styles.presetDatePillActive,
                        ]}
                        onPress={() => setScheduledDate('2026-07-13')}
                      >
                        <Text style={[styles.presetDateText, scheduledDate === '2026-07-13' && styles.presetDateTextActive]}>
                          Tomorrow
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.presetDatePill,
                          scheduledDate === '2026-07-14' && styles.presetDatePillActive,
                        ]}
                        onPress={() => setScheduledDate('2026-07-14')}
                      >
                        <Text style={[styles.presetDateText, scheduledDate === '2026-07-14' && styles.presetDateTextActive]}>
                          In 2 Days
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.presetDatePill,
                          scheduledDate === '2026-07-15' && styles.presetDatePillActive,
                        ]}
                        onPress={() => setScheduledDate('2026-07-15')}
                      >
                        <Text style={[styles.presetDateText, scheduledDate === '2026-07-15' && styles.presetDateTextActive]}>
                          In 3 Days
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Select Time Slot */}
                  <View>
                    <Text style={styles.inputLabel}>Publish Time</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {TIME_SLOTS.map((t) => (
                        <TouchableOpacity
                          key={t}
                          style={[
                            styles.timeSlotPill,
                            scheduledTime === t && styles.timeSlotPillActive,
                          ]}
                          onPress={() => setScheduledTime(t)}
                        >
                          <Text
                            style={[
                              styles.timeSlotText,
                              scheduledTime === t && styles.timeSlotTextActive,
                            ]}
                          >
                            {t}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
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
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: COLORS.surface,
    zIndex: 100,
    elevation: 10,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
    marginRight: 6,
  },
  dropdownTextWrapper: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  dropdownValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 1,
  },
  dropdownValueDisabled: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Floating Action Pill - Elevated safely above teacher bottom tab bar
  floatingActionWrapper: {
    position: 'absolute',
    bottom: 85,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999,
    elevation: 10,
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

  // Modal Styles
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

  // Create Assignment Modal Sheet
  createModalSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  createModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },

  // Assign Modal Top Dropdowns Row
  assignDropdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  assignDropdownBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  assignDropdownBtnActive: {
    borderColor: '#000000',
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  assignDropdownBtnDisabled: {
    opacity: 0.5,
  },
  assignDropdownLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  assignDropdownValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  assignDropdownValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    marginRight: 4,
  },
  assignDropdownValueUnset: {
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  // Inline Picker Styles
  inlinePickerBox: {
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 14,
    padding: 12,
    marginVertical: 4,
  },
  inlinePickerHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inlineOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  inlineOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
  },
  inlineOptionPillActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  inlineOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  inlineOptionTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  inlineSubjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLowest,
  },
  inlineSubjectRowActive: {
    backgroundColor: COLORS.surfaceContainer,
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 4,
    marginBottom: 2,
  },
  input: {
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: COLORS.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
  },

  // Attachment Section
  attachmentSection: {
    marginTop: 4,
    gap: 8,
  },
  attachmentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attachmentSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  attachmentSectionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  attachmentActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachFileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  attachFileBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  addLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  addLinkBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7c3aed',
  },
  attachmentItemsList: {
    gap: 6,
    marginTop: 4,
  },
  attachmentItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  attachmentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  attachmentItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Link Modal Sheet
  linkModalSheet: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },

  // Footer Action Buttons
  createModalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.surfaceContainer,
  },
  scheduleFooterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#ddd6fe',
    gap: 6,
  },
  scheduleFooterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#7c3aed',
  },
  publishNowFooterBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#000000',
    gap: 6,
  },
  publishNowFooterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  modalCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceLow,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSubmitBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Schedule Modal Sheet
  scheduleModalSheet: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 22,
    padding: 18,
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
  presetDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  presetDatePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
  },
  presetDatePillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  presetDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
  },
  presetDateTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  timeSlotPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
  },
  timeSlotPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeSlotTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
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
});
