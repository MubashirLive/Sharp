import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  BookOpen,
  Award,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  GraduationCap,
} from 'lucide-react-native';

// ─── Data Models ─────────────────────────────────────────────────────
export type ExamSeries = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  countdownDays: number;
  totalSubjects: number;
  totalMarks: number;
};

export type ExamPaper = {
  id: string;
  seriesId: string;
  subject: string;
  subjectColor: string;
  date: string;
  day: string;
  timeSlot: string;
  duration: string;
  location: string;
  maxMarks: number;
  isCompleted: boolean;
  isNext: boolean;
};

export type SubjectSyllabus = {
  subject: string;
  subjectColor: string;
  examDate: string;
  chapters: {
    chNo: number;
    title: string;
    topics: string[];
  }[];
};

// ─── Mock Data ───────────────────────────────────────────────────────
const EXAM_SERIES_LIST: ExamSeries[] = [
  {
    id: 'mid-term-2026',
    name: 'Mid-Term Examination 2026',
    startDate: '18 Aug 2026',
    endDate: '28 Aug 2026',
    status: 'Upcoming',
    countdownDays: 9,
    totalSubjects: 6,
    totalMarks: 480,
  },
  {
    id: 'pre-board-2027',
    name: 'Pre-Board Examination 2027',
    startDate: '12 Jan 2027',
    endDate: '22 Jan 2027',
    status: 'Upcoming',
    countdownDays: 156,
    totalSubjects: 6,
    totalMarks: 480,
  },
  {
    id: 'annual-finals-2027',
    name: 'Annual Board Examination 2027',
    startDate: '10 Mar 2027',
    endDate: '25 Mar 2027',
    status: 'Upcoming',
    countdownDays: 213,
    totalSubjects: 6,
    totalMarks: 600,
  },
];

const EXAM_PAPERS: Record<string, ExamPaper[]> = {
  'mid-term-2026': [
    {
      id: 'paper-1',
      seriesId: 'mid-term-2026',
      subject: 'Mathematics',
      subjectColor: '#4F46E5',
      date: '18 Aug 2026',
      day: 'Monday',
      timeSlot: '9:00 AM - 12:00 PM',
      duration: '3 Hours',
      location: 'Hall A (Seat #14)',
      maxMarks: 80,
      isCompleted: false,
      isNext: true,
    },
    {
      id: 'paper-2',
      seriesId: 'mid-term-2026',
      subject: 'Science & Physics',
      subjectColor: '#059669',
      date: '20 Aug 2026',
      day: 'Wednesday',
      timeSlot: '9:00 AM - 12:00 PM',
      duration: '3 Hours',
      location: 'Science Lab Block',
      maxMarks: 80,
      isCompleted: false,
      isNext: false,
    },
    {
      id: 'paper-3',
      seriesId: 'mid-term-2026',
      subject: 'English Literature',
      subjectColor: '#EC4899',
      date: '22 Aug 2026',
      day: 'Friday',
      timeSlot: '9:00 AM - 12:00 PM',
      duration: '3 Hours',
      location: 'Room 204',
      maxMarks: 80,
      isCompleted: false,
      isNext: false,
    },
    {
      id: 'paper-4',
      seriesId: 'mid-term-2026',
      subject: 'Social Studies',
      subjectColor: '#8B5CF6',
      date: '25 Aug 2026',
      day: 'Monday',
      timeSlot: '9:00 AM - 12:00 PM',
      duration: '3 Hours',
      location: 'Hall B',
      maxMarks: 80,
      isCompleted: false,
      isNext: false,
    },
    {
      id: 'paper-5',
      seriesId: 'mid-term-2026',
      subject: 'Hindi Language',
      subjectColor: '#EF4444',
      date: '27 Aug 2026',
      day: 'Wednesday',
      timeSlot: '9:00 AM - 12:00 PM',
      duration: '3 Hours',
      location: 'Room 108',
      maxMarks: 80,
      isCompleted: false,
      isNext: false,
    },
    {
      id: 'paper-6',
      seriesId: 'mid-term-2026',
      subject: 'Computer Science',
      subjectColor: '#3B82F6',
      date: '28 Aug 2026',
      day: 'Thursday',
      timeSlot: '9:00 AM - 11:30 AM',
      duration: '2.5 Hours',
      location: 'Computer Lab 2',
      maxMarks: 80,
      isCompleted: false,
      isNext: false,
    },
  ],
  'pre-board-2027': [
    {
      id: 'pb-1',
      seriesId: 'pre-board-2027',
      subject: 'Mathematics',
      subjectColor: '#4F46E5',
      date: '12 Jan 2027',
      day: 'Tuesday',
      timeSlot: '9:00 AM - 12:00 PM',
      duration: '3 Hours',
      location: 'Main Auditorium',
      maxMarks: 80,
      isCompleted: false,
      isNext: false,
    },
    {
      id: 'pb-2',
      seriesId: 'pre-board-2027',
      subject: 'Science & Physics',
      subjectColor: '#059669',
      date: '15 Jan 2027',
      day: 'Friday',
      timeSlot: '9:00 AM - 12:00 PM',
      duration: '3 Hours',
      location: 'Main Auditorium',
      maxMarks: 80,
      isCompleted: false,
      isNext: false,
    },
  ],
};

const SYLLABUS_DATA: SubjectSyllabus[] = [
  {
    subject: 'Mathematics',
    subjectColor: '#4F46E5',
    examDate: '18 Aug 2026',
    chapters: [
      {
        chNo: 1,
        title: 'Real Numbers & Fundamental Theorem of Arithmetic',
        topics: ['Euclid Division Lemma', 'Irrational Numbers Proof', 'LCM & HCF Word Problems'],
      },
      {
        chNo: 2,
        title: 'Polynomials & Quadratic Equations',
        topics: ['Zeroes of Polynomials', 'Relationship between Coefficients & Roots', 'Splitting the Middle Term'],
      },
      {
        chNo: 3,
        title: 'Pair of Linear Equations in Two Variables',
        topics: ['Graphical Method', 'Substitution & Elimination', 'Cross-Multiplication Method'],
      },
      {
        chNo: 4,
        title: 'Triangles & Similarity Theorems',
        topics: ['Basic Proportionality Theorem (BPT)', 'Converse of BPT', 'Areas of Similar Triangles'],
      },
      {
        chNo: 5,
        title: 'Coordinate Geometry & Distance Formula',
        topics: ['Distance between Two Points', 'Section Formula', 'Centroid of a Triangle'],
      },
    ],
  },
  {
    subject: 'Science & Physics',
    subjectColor: '#059669',
    examDate: '20 Aug 2026',
    chapters: [
      {
        chNo: 1,
        title: 'Chemical Reactions and Equations',
        topics: ['Types of Reactions (Combination, Decomposition)', 'Oxidation and Reduction', 'Balancing Equations'],
      },
      {
        chNo: 2,
        title: 'Acids, Bases and Salts',
        topics: ['pH Scale Applications', 'Properties of Acids & Bases', 'Preparation of Bleaching Powder & Plaster of Paris'],
      },
      {
        chNo: 3,
        title: 'Light – Reflection and Refraction',
        topics: ['Spherical Mirrors & Ray Diagrams', 'Mirror Formula & Magnification', 'Refractive Index & Lens Formula'],
      },
      {
        chNo: 4,
        title: 'Human Eye and Colorful World',
        topics: ['Defects of Vision & Corrections', 'Prism Dispersion', 'Atmospheric Refraction & Tyndall Effect'],
      },
    ],
  },
  {
    subject: 'English Literature',
    subjectColor: '#EC4899',
    examDate: '22 Aug 2026',
    chapters: [
      {
        chNo: 1,
        title: 'A Letter to God (Prose)',
        topics: ['Character sketch of Lencho', 'Theme of faith', 'Postmaster contribution'],
      },
      {
        chNo: 2,
        title: 'Nelson Mandela: Long Walk to Freedom',
        topics: ['Apartheid struggle', 'Inauguration ceremony speeches', 'Twin obligations'],
      },
      {
        chNo: 3,
        title: 'Dust of Snow & Fire and Ice (Poetry)',
        topics: ['Symbolism of Hemlock tree', 'Poetic devices (Alliteration, Metaphor)', 'Central theme'],
      },
    ],
  },
  {
    subject: 'Social Studies',
    subjectColor: '#8B5CF6',
    examDate: '25 Aug 2026',
    chapters: [
      {
        chNo: 1,
        title: 'The Rise of Nationalism in Europe',
        topics: ['French Revolution & Idea of Nation', 'Unification of Germany & Italy', 'Visualizing the Nation'],
      },
      {
        chNo: 2,
        title: 'Resources and Development (Geography)',
        topics: ['Types of Resources', 'Soil Erosion & Conservation', 'Land Use Pattern in India'],
      },
      {
        chNo: 3,
        title: 'Power Sharing (Civics)',
        topics: ['Belgium and Sri Lanka Case Studies', 'Majoritarianism vs Accommodation', 'Forms of Power Sharing'],
      },
    ],
  },
];

type ViewTab = 'schedule' | 'syllabus';

export default function ExamScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('mid-term-2026');
  const [activeTab, setActiveTab] = useState<ViewTab>('schedule');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    Mathematics: true, // First subject open by default
  });

  // Selected series info
  const selectedSeries = useMemo(() => {
    return EXAM_SERIES_LIST.find((s) => s.id === selectedSeriesId) || EXAM_SERIES_LIST[0];
  }, [selectedSeriesId]);

  // Current series papers
  const papers = useMemo(() => {
    return EXAM_PAPERS[selectedSeriesId] || [];
  }, [selectedSeriesId]);

  const toggleSubjectExpand = (subject: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subject]: !prev[subject],
    }));
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#191b20" strokeWidth={2.5} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Examinations</Text>
          <Text style={styles.headerSub}>Schedules & Syllabus</Text>
        </View>

        <View style={styles.headerBadge}>
          <GraduationCap size={16} color="#4F46E5" />
          <Text style={styles.headerBadgeText}>Class 10</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Exam Series Selector Chips ───────────────────────────── */}
        <View style={styles.seriesSelectorWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seriesScroll}>
            {EXAM_SERIES_LIST.map((series) => {
              const isSelected = series.id === selectedSeriesId;
              return (
                <TouchableOpacity
                  key={series.id}
                  activeOpacity={0.8}
                  style={[styles.seriesChip, isSelected && styles.seriesChipSelected]}
                  onPress={() => setSelectedSeriesId(series.id)}
                >
                  <Text style={[styles.seriesChipText, isSelected && styles.seriesChipTextSelected]}>
                    {series.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Hero Summary Card ────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{selectedSeries.status}</Text>
            </View>

            {selectedSeries.countdownDays > 0 ? (
              <View style={styles.countdownPill}>
                <Clock size={12} color="#D97706" />
                <Text style={styles.countdownText}>Starts in {selectedSeries.countdownDays} Days</Text>
              </View>
            ) : (
              <View style={styles.completedPill}>
                <CheckCircle2 size={12} color="#047857" />
                <Text style={styles.completedPillText}>Finished</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroTitle}>{selectedSeries.name}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Calendar size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroMetaText}>
                {selectedSeries.startDate} – {selectedSeries.endDate}
              </Text>
            </View>

            <View style={styles.heroMetaItem}>
              <Award size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroMetaText}>
                {selectedSeries.totalSubjects} Subjects · {selectedSeries.totalMarks} Marks
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tab Switcher (Schedule vs Syllabus) ────────────────── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'schedule' && styles.tabBtnActive]}
            onPress={() => setActiveTab('schedule')}
          >
            <Calendar size={15} color={activeTab === 'schedule' ? '#ffffff' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
              Exam Schedule ({papers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'syllabus' && styles.tabBtnActive]}
            onPress={() => setActiveTab('syllabus')}
          >
            <BookOpen size={15} color={activeTab === 'syllabus' ? '#ffffff' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'syllabus' && styles.tabTextActive]}>
              Syllabus ({SYLLABUS_DATA.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB 1: SCHEDULE VIEW ─────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <View style={styles.scheduleSection}>
            {papers.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AlertCircle size={28} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No schedule available</Text>
                <Text style={styles.emptySub}>Schedule details for this exam series have not been released yet.</Text>
              </View>
            ) : (
              papers.map((paper) => (
                <View
                  key={paper.id}
                  style={[
                    styles.paperCard,
                    paper.isNext && styles.nextPaperCard,
                    paper.isCompleted && styles.completedPaperCard,
                  ]}
                >
                  {/* Next / Status Banner Header */}
                  {paper.isNext && (
                    <View style={styles.nextBanner}>
                      <Clock size={12} color="#4F46E5" />
                      <Text style={styles.nextBannerText}>NEXT UPCOMING EXAM PAPER</Text>
                    </View>
                  )}

                  <View style={styles.paperHeaderRow}>
                    <View style={styles.subjectRow}>
                      <View style={[styles.subjectDot, { backgroundColor: paper.subjectColor }]} />
                      <Text style={styles.paperSubject}>{paper.subject}</Text>
                    </View>

                    {paper.isCompleted ? (
                      <View style={styles.paperCompletedBadge}>
                        <CheckCircle2 size={12} color="#047857" />
                        <Text style={styles.paperCompletedText}>Completed</Text>
                      </View>
                    ) : (
                      <View style={styles.marksBadge}>
                        <Text style={styles.marksBadgeText}>{paper.maxMarks} Marks</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.paperGrid}>
                    <View style={styles.paperGridCell}>
                      <Calendar size={13} color="#6B7280" />
                      <Text style={styles.cellText}>{paper.day}, {paper.date}</Text>
                    </View>

                    <View style={styles.paperGridCell}>
                      <Clock size={13} color="#6B7280" />
                      <Text style={styles.cellText}>{paper.timeSlot} ({paper.duration})</Text>
                    </View>

                    <View style={styles.paperGridCell}>
                      <MapPin size={13} color="#6B7280" />
                      <Text style={styles.cellText}>{paper.location}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ── TAB 2: SYLLABUS VIEW ─────────────────────────────────── */}
        {activeTab === 'syllabus' && (
          <View style={styles.syllabusSection}>
            {SYLLABUS_DATA.map((item) => {
              const isExpanded = Boolean(expandedSubjects[item.subject]);

              return (
                <View key={item.subject} style={styles.syllabusCard}>
                  {/* Subject Header Accordion Toggle */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.syllabusHeader}
                    onPress={() => toggleSubjectExpand(item.subject)}
                  >
                    <View style={styles.subjectRow}>
                      <View style={[styles.subjectDot, { backgroundColor: item.subjectColor }]} />
                      <View>
                        <Text style={styles.syllabusSubjectTitle}>{item.subject}</Text>
                        <Text style={styles.syllabusSubjectSub}>
                          {item.chapters.length} Chapters · Exam Date: {item.examDate}
                        </Text>
                      </View>
                    </View>

                    {isExpanded ? (
                      <ChevronUp size={20} color="#6B7280" />
                    ) : (
                      <ChevronDown size={20} color="#6B7280" />
                    )}
                  </TouchableOpacity>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <View style={styles.syllabusContent}>
                      {item.chapters.map((ch) => (
                        <View key={ch.chNo} style={styles.chapterCard}>
                          <View style={styles.chapterHeader}>
                            <View style={styles.chNumberBadge}>
                              <Text style={styles.chNumberText}>Ch {ch.chNo}</Text>
                            </View>
                            <Text style={styles.chapterTitle}>{ch.title}</Text>
                          </View>

                          <View style={styles.topicsWrap}>
                            {ch.topics.map((topic, index) => (
                              <View key={index} style={styles.topicRow}>
                                <View style={styles.topicDot} />
                                <Text style={styles.topicText}>{topic}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9FF',
  },

  // Header Bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#191b20',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4F46E5',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },

  // Series Selector
  seriesSelectorWrap: {
    marginBottom: 4,
  },
  seriesScroll: {
    gap: 8,
  },
  seriesChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  seriesChipSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  seriesChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#4B5563',
  },
  seriesChipTextSelected: {
    color: '#ffffff',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#B45309',
  },
  completedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedPillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#047857',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 12,
  },
  heroMetaRow: {
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 14,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroMetaText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Tab Switcher
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 13,
  },
  tabBtnActive: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4B5563',
  },
  tabTextActive: {
    color: '#ffffff',
  },

  // Schedule View
  scheduleSection: {
    gap: 12,
  },
  paperCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  nextPaperCard: {
    borderColor: '#4F46E5',
    borderWidth: 2,
    backgroundColor: '#FAF5FF',
  },
  completedPaperCard: {
    opacity: 0.8,
    backgroundColor: '#FAFAFA',
  },
  nextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  nextBannerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  paperHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  subjectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paperSubject: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  marksBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  marksBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#374151',
  },
  paperCompletedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  paperCompletedText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#047857',
  },
  paperGrid: {
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 14,
  },
  paperGridCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },

  // Syllabus View
  syllabusSection: {
    gap: 12,
  },
  syllabusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  syllabusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  syllabusSubjectTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#111827',
  },
  syllabusSubjectSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  syllabusContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  chapterCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chNumberBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chNumberText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  chapterTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },
  topicsWrap: {
    gap: 6,
    paddingLeft: 4,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  topicText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#4B5563',
    flex: 1,
  },

  // Empty State
  emptyWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});
