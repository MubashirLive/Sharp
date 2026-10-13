import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Search,
  FileText,
  UploadCloud,
  Tag,
  Download,
  Eye,
  Clock,
  X,
  FileUp,
  User,
  GraduationCap,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  Globe,
  Image as ImageIcon,
  HardDrive,
  ExternalLink,
  BookOpen,
} from 'lucide-react-native';
import { CurriculumStore } from '@/data/curriculumStore';

const C = {
  primary: '#059669',
  primaryDark: '#047857',
  primaryBg: '#D1FAE5',
  primaryLight: '#ECFDF5',
  surface: '#ffffff',
  bg: '#F8FAFC',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  cardBg: '#ffffff',
  indigo: '#4F46E5',
  indigoBg: '#EEF2FF',
  purple: '#7C3AED',
  purpleBg: '#F3E8FF',
  amber: '#D97706',
  amberBg: '#FEF3C7',
  blue: '#0284C7',
  blueBg: '#E0F2FE',
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
};

// Teacher's specific teaching classes and subjects
const TEACHER_ASSIGNMENTS: TeacherAssignment[] = [
  { id: 'asgn-1', grade: 'Grade 10', section: 'Section A', subject: 'Advanced Mathematics', room: 'Room 204', code: '10-A' },
  { id: 'asgn-2', grade: 'Grade 10', section: 'Section B', subject: 'Theoretical Physics', room: 'Room 205', code: '10-B' },
  { id: 'asgn-3', grade: 'Grade 9', section: 'Section C', subject: 'General Mathematics', room: 'Room 108', code: '9-C' },
  { id: 'asgn-4', grade: 'Grade 11', section: 'Section A', subject: 'Applied Physics', room: 'Lab 1', code: '11-A' },
  { id: 'asgn-5', grade: 'Grade 12', section: 'Section B', subject: 'Physics Practical Lab', room: 'Lab 2', code: '12-B' },
];

export type FilterPill = {
  id: string;
  label: string;
  grade?: string;
  section?: string;
  subject?: string;
};

const TEACHER_FILTER_PILLS: FilterPill[] = [
  { id: 'all', label: 'All Resources' },
  { id: 'asgn-1', label: '10-A · Advanced Mathematics', grade: 'Grade 10', section: 'Section A', subject: 'Advanced Mathematics' },
  { id: 'asgn-2', label: '10-B · Theoretical Physics', grade: 'Grade 10', section: 'Section B', subject: 'Theoretical Physics' },
  { id: 'asgn-3', label: '9-C · General Mathematics', grade: 'Grade 9', section: 'Section C', subject: 'General Mathematics' },
  { id: 'asgn-4', label: '11-A · Applied Physics', grade: 'Grade 11', section: 'Section A', subject: 'Applied Physics' },
  { id: 'asgn-5', label: '12-B · Physics Practical Lab', grade: 'Grade 12', section: 'Section B', subject: 'Physics Practical Lab' },
];

const STUDENT_FILTER_PILLS: FilterPill[] = [
  { id: 'all', label: 'All Resources' },
  { id: 'st-math', label: 'Grade 10 · Mathematics', grade: 'Grade 10', subject: 'Mathematics' },
  { id: 'st-phys', label: 'Grade 10 · Physics', grade: 'Grade 10', subject: 'Physics' },
  { id: 'st-chem', label: 'Grade 10 · Chemistry', grade: 'Grade 10', subject: 'Chemistry' },
  { id: 'st-bio', label: 'Grade 10 · Biology', grade: 'Grade 10', subject: 'Biology' },
  { id: 'st-eng', label: 'Grade 10 · English', grade: 'Grade 10', subject: 'English' },
];

type AttachmentMode = 'LINK' | 'IMAGE' | 'DOC' | 'DRIVE';

type MaterialItem = {
  id: string;
  title: string;
  chapter: string;
  subject: string;
  grade: string;
  section: string;
  uploadedBy: string;
  date: string;
  timestamp: number;
  attachmentType: AttachmentMode;
  fileType: 'PDF' | 'DOCX' | 'PPTX' | 'JPG' | 'PNG' | 'LINK' | 'DRIVE';
  fileSize?: string;
  url?: string;
  fileName?: string;
  downloads: number;
  description: string;
};

const INITIAL_MATERIALS: MaterialItem[] = [
  {
    id: 'mat-1',
    title: 'Linear Equations & Matrices - Complete Summary & Practice Set',
    chapter: 'Chapter 3: Pair of Linear Equations in Two Variables',
    subject: 'Advanced Mathematics',
    grade: 'Grade 10',
    section: 'Section A',
    uploadedBy: 'Ms. Priya Singh',
    date: 'Today, 10:15 AM',
    timestamp: 1724750100000,
    attachmentType: 'DOC',
    fileType: 'PDF',
    fileSize: '3.4 MB',
    fileName: 'matrices_summary_chapter3.pdf',
    downloads: 42,
    description: 'Detailed formula sheets, solved exemplar questions, and previous 5 years board problems.',
  },
  {
    id: 'mat-2',
    title: 'Ray Optics Interactive 3D Simulation & Video Lecture',
    chapter: 'Chapter 1: Light - Reflection & Refraction',
    subject: 'Theoretical Physics',
    grade: 'Grade 10',
    section: 'Section B',
    uploadedBy: 'Ms. Priya Singh',
    date: 'Yesterday, 3:45 PM',
    timestamp: 1724683500000,
    attachmentType: 'LINK',
    fileType: 'LINK',
    url: 'https://youtube.com/watch?v=optics-simulation-demo',
    fileName: 'YouTube / Khan Academy Optics Demo',
    downloads: 68,
    description: 'Interactive ray diagrams, focal length derivations, and video walk-through of laboratory optics.',
  },
  {
    id: 'mat-3',
    title: 'Handwritten Whiteboard Derivations & Factorization Chart',
    chapter: 'Chapter 2: Polynomials',
    subject: 'General Mathematics',
    grade: 'Grade 9',
    section: 'Section C',
    uploadedBy: 'Ms. Priya Singh',
    date: '25 Aug 2026',
    timestamp: 1724576400000,
    attachmentType: 'IMAGE',
    fileType: 'JPG',
    fileSize: '2.1 MB',
    fileName: 'polynomials_board_notes.jpg',
    downloads: 51,
    description: 'High-resolution whiteboard captures explaining step-by-step polynomial division and formulas.',
  },
  {
    id: 'mat-4',
    title: 'Genetics, Punnett Squares & Mendel Laws - Practice Notes',
    chapter: 'Chapter 2: Cell Division & Mitosis',
    subject: 'Biology',
    grade: 'Grade 10',
    section: 'Section A',
    uploadedBy: 'Ms. Priya Singh',
    date: '22 Aug 2026',
    timestamp: 1724317200000,
    attachmentType: 'DOC',
    fileType: 'PDF',
    fileSize: '4.8 MB',
    fileName: 'punnett_squares_notes.pdf',
    downloads: 88,
    description: 'Step-by-step monohybrid and dihybrid cross explanations with illustrated Punnett squares.',
  },
  {
    id: 'mat-5',
    title: 'Shakespearean Drama & Tragedy - Critical Analysis Guide',
    chapter: 'Chapter 4: Poetry & Literature Appreciation',
    subject: 'English',
    grade: 'Grade 10',
    section: 'Section A',
    uploadedBy: 'Ms. Priya Singh',
    date: '20 Aug 2026',
    timestamp: 1724144400000,
    attachmentType: 'DOC',
    fileType: 'PDF',
    fileSize: '5.2 MB',
    fileName: 'shakespearean_drama_guide.pdf',
    downloads: 94,
    description: 'In-depth character analysis of Macbeth and Lady Macbeth, dramatic irony techniques, and historical context.',
  },
  {
    id: 'mat-6',
    title: 'Real Numbers Chapter Handout & Formula Sheet',
    chapter: 'Chapter 1: Real Numbers',
    subject: 'Advanced Mathematics',
    grade: 'Grade 10',
    section: 'Section A',
    uploadedBy: 'Mr. Rajesh Gupta',
    date: '12 May 2026',
    timestamp: 1715497200000,
    attachmentType: 'DOC',
    fileType: 'PDF',
    fileSize: '2.4 MB',
    fileName: 'real_numbers_formula_sheet.pdf',
    downloads: 142,
    description: 'Comprehensive formula summary, Euclid division algorithm flowchart, and previous 5 years board exam problems.',
  },
  {
    id: 'mat-7',
    title: 'General Reference & Academic Calendar 2026-27',
    chapter: 'Uncategorised',
    subject: 'Advanced Mathematics',
    grade: 'Grade 10',
    section: 'Section A',
    uploadedBy: 'Ms. Priya Singh',
    date: '15 Aug 2026',
    timestamp: 1723712400000,
    attachmentType: 'DOC',
    fileType: 'PDF',
    fileSize: '1.1 MB',
    fileName: 'academic_schedule_2026.pdf',
    downloads: 74,
    description: 'General course policies, term test schedule, and syllabus distribution roadmap.',
  },
];

export default function StudyMaterialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const isTeacher = role !== 'student';

  // Class + Section + Subject Filter Pills (identical structure to Curriculum)
  const filterPills = isTeacher ? TEACHER_FILTER_PILLS : STUDENT_FILTER_PILLS;
  const [selectedFilterId, setSelectedFilterId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<MaterialItem[]>(INITIAL_MATERIALS);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  const toggleCardExpansion = (id: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Teacher Upload Form State
  const [modalGrade, setModalGrade] = useState('Grade 10');
  const [modalSection, setModalSection] = useState('Section A');
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Advanced Mathematics');
  const [newDescription, setNewDescription] = useState('');

  // Chapter Tag State (Dynamic Curriculum Tagging)
  const [selectedChapterTag, setSelectedChapterTag] = useState('Uncategorised');
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [isChapterPickerOpen, setIsChapterPickerOpen] = useState(false);

  // 4 Attachment Types State
  const [attachmentMode, setAttachmentMode] = useState<AttachmentMode>('DOC');
  const [docFormat, setDocFormat] = useState<'PDF' | 'DOCX' | 'PPTX'>('PDF');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [driveName, setDriveName] = useState('');
  const [imageAttached, setImageAttached] = useState(false);
  const [docAttached, setDocAttached] = useState(true);

  // Curriculum Chapters for the selected subject and grade
  const curriculumChapters = useMemo(() => {
    return CurriculumStore.getChaptersForSubject(newSubject, modalGrade);
  }, [newSubject, modalGrade]);

  // Filtered & Chronologically sorted (Newest first)
  const filteredMaterials = materials
    .filter((m) => {
      // Class + Section + Subject Filter Pill
      if (selectedFilterId !== 'all') {
        const activePill = filterPills.find((p) => p.id === selectedFilterId);
        if (activePill) {
          if (activePill.grade && m.grade !== activePill.grade) {
            return false;
          }
          if (activePill.section && m.section !== activePill.section) {
            return false;
          }
          if (
            activePill.subject &&
            !m.subject.toLowerCase().includes(activePill.subject.toLowerCase()) &&
            !activePill.subject.toLowerCase().includes(m.subject.toLowerCase())
          ) {
            return false;
          }
        }
      }

      // Search Query
      const matchesQuery =
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.chapter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.grade.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesQuery;
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const handleUploadSubmit = () => {
    if (!newTitle.trim()) return;

    let computedFileType: 'PDF' | 'DOCX' | 'PPTX' | 'JPG' | 'PNG' | 'LINK' | 'DRIVE' = 'PDF';
    let computedUrl: string | undefined = undefined;
    let computedFileSize: string | undefined = '2.4 MB';
    let computedFileName: string | undefined = 'uploaded_resource_file';

    if (attachmentMode === 'LINK') {
      computedFileType = 'LINK';
      computedUrl = linkUrl.trim() || 'https://internet-resource.link';
      computedFileName = linkName.trim() || 'Web Link / Video Resource';
      computedFileSize = undefined;
    } else if (attachmentMode === 'IMAGE') {
      computedFileType = 'JPG';
      computedFileSize = '1.8 MB';
      computedFileName = 'notes_photo_attachment.jpg';
    } else if (attachmentMode === 'DRIVE') {
      computedFileType = 'DRIVE';
      computedUrl = driveUrl.trim() || 'https://drive.google.com/drive/folders/resource-share';
      computedFileName = driveName.trim() || 'Google Drive Resource';
      computedFileSize = undefined;
    } else {
      computedFileType = docFormat;
      computedFileSize = docFormat === 'PPTX' ? '4.8 MB' : docFormat === 'DOCX' ? '1.5 MB' : '3.2 MB';
      computedFileName = `resource_material.${docFormat.toLowerCase()}`;
    }

    const newItem: MaterialItem = {
      id: `mat-${Date.now()}`,
      title: newTitle.trim(),
      chapter: selectedChapterTag,
      subject: newSubject,
      grade: modalGrade,
      section: modalSection,
      uploadedBy: 'Ms. Priya Singh',
      date: 'Just now',
      timestamp: Date.now(),
      attachmentType: attachmentMode,
      fileType: computedFileType,
      fileSize: computedFileSize,
      url: computedUrl,
      fileName: computedFileName,
      downloads: 0,
      description: newDescription.trim() || 'Uploaded study notes and reference material.',
    };

    // 1. Add to Resources stream feed
    setMaterials((prev) => [newItem, ...prev]);

    // 2. If tagged with a Curriculum Chapter, attach directly to CurriculumStore
    if (selectedChapterTag !== 'Uncategorised') {
      CurriculumStore.addMaterialToChapter({
        subjectName: newSubject,
        chapterId: selectedChapterId || undefined,
        chapterTitle: selectedChapterTag,
        material: {
          id: newItem.id,
          title: newItem.title,
          type: attachmentMode === 'LINK' ? 'link' : attachmentMode === 'IMAGE' ? 'note' : 'pdf',
          fileSize: computedFileSize,
          uploadedBy: 'Ms. Priya Singh',
          uploadedAt: 'Today',
          timestamp: newItem.timestamp || Date.now(),
          url: computedUrl,
          description: newItem.description,
          downloadCount: 0,
        },
      });
    }

    setNewTitle('');
    setNewDescription('');
    setSelectedChapterTag('Uncategorised');
    setSelectedChapterId(null);
    setLinkUrl('');
    setLinkName('');
    setDriveUrl('');
    setDriveName('');
    setIsUploadModalOpen(false);
  };

  const handleActionPress = (item: MaterialItem) => {
    if (item.attachmentType === 'LINK' || item.attachmentType === 'DRIVE') {
      Alert.alert('External Resource', `Opening URL:\n${item.url || 'https://resource-link.com'}`);
    } else if (item.attachmentType === 'IMAGE') {
      Alert.alert('Image Viewer', `Previewing image:\n${item.fileName || 'notes_photo.jpg'}`);
    } else {
      Alert.alert('Document Viewer', `Downloading and opening:\n${item.fileName || item.title}`);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <ChevronLeft size={22} color={C.text} strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Resources</Text>
        </View>

        <View style={{ width: 38 }} />
      </View>

      {/* ── Search Bar ────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color={C.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              isTeacher
                ? 'Search by chapter, subject, or class...'
                : 'Search by chapter, title or teacher...'
            }
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={C.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Class + Section + Subject Horizontal Scrollable Selector (Identical to Curriculum) ── */}
      <View style={styles.pillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {filterPills.map((item) => {
            const isActive = selectedFilterId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.pill, isActive && styles.pillActive]}
                onPress={() => setSelectedFilterId(item.id)}
                activeOpacity={0.8}
              >
                <BookOpen
                  size={14}
                  color={isActive ? '#ffffff' : C.textMuted}
                  strokeWidth={2.2}
                />
                <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Chronological Stream Feed ─────────────────────── */}
      <ScrollView
        style={styles.feedScroll}
        contentContainerStyle={[
          styles.feedContent,
          !isTeacher && { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Material Cards */}
        {filteredMaterials.map((item) => {
          // Determine visual styling by attachmentType
          const isLink = item.attachmentType === 'LINK';
          const isImg = item.attachmentType === 'IMAGE';
          const isDrive = item.attachmentType === 'DRIVE';
          const isUncategorised = item.chapter === 'Uncategorised';
          const isExpanded = !!expandedCardIds[item.id];

          const iconColor = isLink ? C.indigo : isImg ? C.rose : isDrive ? C.amber : C.primary;
          const iconBg = isLink ? C.indigoBg : isImg ? C.roseBg : isDrive ? C.amberBg : C.primaryBg;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              activeOpacity={0.92}
              onPress={() => toggleCardExpansion(item.id)}
            >
              {/* ── 1. Top Hero Row: Title + Date/Time & Chevron ── */}
              <View style={styles.cardHeaderRow}>
                {/* Title */}
                <Text style={styles.materialTitle} numberOfLines={isExpanded ? undefined : 2}>
                  {item.title}
                </Text>

                {/* Top Right: Date & Time + Subtle Indicator Chevron */}
                <View style={styles.topRightWrap}>
                  <View style={styles.dateWrap}>
                    <Clock size={10} color="#94A3B8" strokeWidth={2} />
                    <Text style={styles.dateText}>{item.date}</Text>
                  </View>
                  <View style={styles.chevronIndicator}>
                    {isExpanded ? (
                      <ChevronUp size={12} color="#94A3B8" strokeWidth={2.4} />
                    ) : (
                      <ChevronDown size={12} color="#94A3B8" strokeWidth={2.4} />
                    )}
                  </View>
                </View>
              </View>

              {/* ── 2. Split Sub-row: Subject · Teacher (Left) & Class/Section Badge (Right) ── */}
              <View style={styles.subjectTeacherRow}>
                <View style={styles.subjectTeacherLeft}>
                  <Text style={styles.cardSubjectName} numberOfLines={1}>
                    {item.subject}
                  </Text>
                  <Text style={styles.dotSeparator}>·</Text>
                  <Text style={styles.cardTeacherName} numberOfLines={1}>
                    {item.uploadedBy}
                  </Text>
                </View>

                <View style={styles.classSectionBadge}>
                  <Text style={styles.classSectionBadgeText}>
                    {item.grade} · {item.section}
                  </Text>
                </View>
              </View>

              {/* ── 3. Dedicated Chapter Tag Row ── */}
              <View style={styles.chapterTagRow}>
                <View
                  style={[
                    styles.chapterBadge,
                    isUncategorised && styles.chapterBadgeUncategorised,
                  ]}
                >
                  <Tag
                    size={10}
                    color={isUncategorised ? '#64748B' : C.primaryDark}
                    strokeWidth={2.2}
                  />
                  <Text
                    style={[
                      styles.chapterBadgeText,
                      isUncategorised && styles.chapterBadgeTextUncategorised,
                    ]}
                    numberOfLines={1}
                  >
                    {item.chapter}
                  </Text>
                </View>
              </View>

              {/* ── 3. Description (Expandable) ── */}
              {item.description ? (
                <View style={[styles.descriptionWrap, isExpanded && styles.descriptionWrapExpanded]}>
                  <Text
                    style={[styles.descriptionText, isExpanded && styles.descriptionTextExpanded]}
                    numberOfLines={isExpanded ? undefined : 1}
                  >
                    {item.description}
                  </Text>
                  {!isExpanded && (
                    <Text style={styles.expandHintText}>More</Text>
                  )}
                </View>
              ) : null}

              {/* ── 4. Card Footer: Meta Badges + Actions ── */}
              <View style={styles.cardFooter}>
                <View style={styles.metaPillsRow}>
                  {/* File Type */}
                  <View style={[styles.metaPill, { backgroundColor: iconBg }]}>
                    <Text style={[styles.metaPillText, { color: iconColor, fontWeight: '700' }]}>
                      {item.fileType}
                    </Text>
                  </View>
                  {item.fileSize ? (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{item.fileSize}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.actionBtnsRow}>
                  {isLink ? (
                    <TouchableOpacity
                      style={[styles.downloadBtn, { backgroundColor: C.indigo }]}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleActionPress(item);
                      }}
                    >
                      <ExternalLink size={13} color="#ffffff" strokeWidth={2.2} />
                      <Text style={styles.downloadBtnText}>Open Link</Text>
                    </TouchableOpacity>
                  ) : isDrive ? (
                    <TouchableOpacity
                      style={[styles.downloadBtn, { backgroundColor: '#D97706' }]}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleActionPress(item);
                      }}
                    >
                      <ExternalLink size={13} color="#ffffff" strokeWidth={2.2} />
                      <Text style={styles.downloadBtnText}>Open Drive</Text>
                    </TouchableOpacity>
                  ) : isImg ? (
                    <TouchableOpacity
                      style={[styles.viewBtn, { backgroundColor: C.roseBg }]}
                      activeOpacity={0.7}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleActionPress(item);
                      }}
                    >
                      <Eye size={14} color={C.rose} />
                      <Text style={[styles.viewBtnText, { color: C.rose }]}>View Image</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.viewBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleActionPress(item);
                        }}
                      >
                        <Eye size={14} color={C.primary} />
                        <Text style={styles.viewBtnText}>Preview</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.downloadBtn}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleActionPress(item);
                        }}
                      >
                        <Download size={14} color="#ffffff" />
                        <Text style={styles.downloadBtnText}>Download</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filteredMaterials.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No resources found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your class, section or subject filter.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Quick Upload Round Floating Button (Teachers only) ── */}
      {isTeacher && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsUploadModalOpen(true)}
          activeOpacity={0.85}
        >
          <UploadCloud size={24} color="#ffffff" strokeWidth={2.4} />
        </TouchableOpacity>
      )}



      {/* ── Chapter Selection Modal (For Resource Tagging) ── */}
      {isTeacher && (
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
                    {newSubject} ({modalGrade})
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
                      General resource not tied to a specific chapter
                    </Text>
                  </View>
                  {selectedChapterTag === 'Uncategorised' && (
                    <Check size={16} color={C.primary} strokeWidth={2.5} />
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
                      {isSelected && <Check size={16} color={C.primary} strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}

                {curriculumChapters.length === 0 && (
                  <View style={{ paddingVertical: 18, alignItems: 'center' }}>
                    <Text style={{ fontSize: 13, color: '#64748B' }}>
                      No curriculum chapters registered yet for {newSubject}.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* ── Upload Resource Modal (Teachers only) ────────── */}
      {isTeacher && (
        <Modal
          visible={isUploadModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsUploadModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderTitleRow}>
                  <View style={styles.modalHeaderIcon}>
                    <FileUp size={18} color={C.primary} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.modalTitle}>Upload Resource</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsUploadModalOpen(false)}
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
                      modalGrade === asgn.grade &&
                      modalSection === asgn.section &&
                      newSubject === asgn.subject;
                    return (
                      <TouchableOpacity
                        key={asgn.id}
                        style={[
                          styles.subjectSelectBtn,
                          isSelected && styles.subjectSelectBtnActive,
                        ]}
                        onPress={() => {
                          setModalGrade(asgn.grade);
                          setModalSection(asgn.section);
                          setNewSubject(asgn.subject);
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
                      color={selectedChapterTag === 'Uncategorised' ? '#94A3B8' : C.primary}
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
                  <ChevronDown size={14} color={C.textMuted} strokeWidth={2.2} />
                </TouchableOpacity>

                {/* 3. Title */}
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Formula Sheet & Exemplar Solutions"
                  placeholderTextColor="#94A3B8"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />

                {/* 4. Attachment Type Selection (Single Row) */}
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
                        { backgroundColor: attachmentMode === 'LINK' ? C.indigo : C.indigoBg },
                      ]}
                    >
                      <Globe
                        size={17}
                        color={attachmentMode === 'LINK' ? '#ffffff' : C.indigo}
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
                        { backgroundColor: attachmentMode === 'IMAGE' ? C.rose : C.roseBg },
                      ]}
                    >
                      <ImageIcon
                        size={17}
                        color={attachmentMode === 'IMAGE' ? '#ffffff' : C.rose}
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
                        { backgroundColor: attachmentMode === 'DOC' ? C.primary : C.primaryBg },
                      ]}
                    >
                      <FileText
                        size={17}
                        color={attachmentMode === 'DOC' ? '#ffffff' : C.primary}
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
                        { backgroundColor: attachmentMode === 'DRIVE' ? '#D97706' : C.amberBg },
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

                {/* 5. Dynamic Attachment Inputs based on mode */}
                {attachmentMode === 'LINK' && (
                  <View style={styles.attachInputBlock}>
                    <Text style={styles.attachInputBlockLabel}>Internet / Video Link URL *</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="https://youtube.com/watch?v=... or website URL"
                      placeholderTextColor="#94A3B8"
                      value={linkUrl}
                      onChangeText={setLinkUrl}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={[styles.modalInput, { marginTop: 8 }]}
                      placeholder="Link Label (e.g. Khan Academy Simulation Video)"
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
                    <ImageIcon size={26} color={C.rose} />
                    <Text style={[styles.dropzoneTitle, { color: C.rose }]}>
                      {imageAttached
                        ? 'Selected: formula_notes_page1.jpg'
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
                      <FileText size={26} color={C.primary} />
                      <Text style={styles.dropzoneTitle}>
                        {docAttached
                          ? `Ready: resource_material.${docFormat.toLowerCase()}`
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
                      placeholder="Folder Label (e.g. Unit 3 Master Class Drive)"
                      placeholderTextColor="#94A3B8"
                      value={driveName}
                      onChangeText={setDriveName}
                    />
                  </View>
                )}

                {/* 6. Description */}
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                  Description / Notes (Optional)
                </Text>
                <TextInput
                  style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Brief summary of topics covered, homework questions..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={newDescription}
                  onChangeText={setNewDescription}
                />
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsUploadModalOpen(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    !newTitle.trim() && styles.submitBtnDisabled,
                  ]}
                  onPress={handleUploadSubmit}
                  disabled={!newTitle.trim()}
                >
                  <Text style={styles.submitBtnText}>Post Resource</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },

  // Search
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: C.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
  },

  // Dropdowns (Teacher Only)
  dropdownsContainer: {
    backgroundColor: C.surface,
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.75,
  },
  dropdownIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTextWrap: {
    flex: 1,
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dropdownValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: C.text,
    marginTop: 1,
  },
  dropdownValueDisabled: {
    color: '#94A3B8',
  },

  // Pills (Horizontal Scrollable Selector)
  pillsContainer: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pillsScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  pillActive: {
    backgroundColor: C.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textMuted,
  },
  pillTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },

  // Feed
  feedScroll: {
    flex: 1,
  },
  feedContent: {
    padding: 16,
    paddingBottom: 90,
  },

  // Material Card
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  materialTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '700',
    color: C.text,
    lineHeight: 20,
  },
  topRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
    alignSelf: 'flex-start',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dateText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  chevronIndicator: {
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Split Sub-row: Subject · Teacher (Left) & Class/Section Badge (Right)
  subjectTeacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    gap: 8,
  },
  subjectTeacherLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardSubjectName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  dotSeparator: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '700',
  },
  cardTeacherName: {
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  classSectionBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  classSectionBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4338CA',
  },

  // Chapter Tag Row
  chapterTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    color: C.primaryDark,
  },
  chapterBadgeTextUncategorised: {
    color: '#64748B',
  },

  // Description
  descriptionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 7,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  descriptionWrapExpanded: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  descriptionText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  descriptionTextExpanded: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18.5,
  },
  expandHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  actionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.primaryBg,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primaryDark,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: C.primary,
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.text,
  },
  emptySub: {
    fontSize: 13,
    color: C.textMuted,
    textAlign: 'center',
  },

  // FAB (Round icon button)
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
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

  // Picker Modal (Class, Section, Chapter)
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
    color: C.text,
  },
  pickerModalSub: {
    fontSize: 11.5,
    color: C.primary,
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
    backgroundColor: C.primaryLight,
  },
  pickerOptionText: {
    fontSize: 13.5,
    color: '#334155',
    fontWeight: '600',
  },
  pickerOptionTextActive: {
    color: C.primaryDark,
    fontWeight: '700',
  },
  pickerOptionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Upload Modal
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.text,
  },
  modalCloseBtn: {
    padding: 6,
  },
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
    color: C.primary,
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
    backgroundColor: C.primary,
    borderColor: C.primary,
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

  // Chapter Selector Button in Modal
  chapterSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chapterSelectorBtnActive: {
    borderColor: '#A7F3D0',
    backgroundColor: C.primaryLight,
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
    color: C.primaryDark,
  },
  chapterSelectorTextUncategorised: {
    color: '#64748B',
    fontWeight: '500',
  },

  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: C.text,
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
    borderColor: C.primary,
    backgroundColor: C.primaryLight,
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
    color: C.primaryDark,
  },

  // Attachment input block
  attachInputBlock: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: C.border,
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
    backgroundColor: C.primary,
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
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.primary,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
