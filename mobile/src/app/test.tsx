import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  ClipboardList,
  AlertCircle,
  Check,
} from 'lucide-react-native';

// ─── Data Models ─────────────────────────────────────────────────────
export type TestSeries = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  totalTests: number;
  totalMarks: number;
};

export type TestPaper = {
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
  obtainedScore?: number;
  isCompleted: boolean;
  isNext: boolean;
};

export type TestSyllabus = {
  subject: string;
  subjectColor: string;
  testDate: string;
  chapters: {
    chNo: number;
    title: string;
    topics: string[];
  }[];
};

// ─── Mock Test Data ──────────────────────────────────────────────────
const TEST_SERIES_LIST: TestSeries[] = [
  {
    id: 'unit-test-1',
    name: 'Unit Test 1 (July Assessment)',
    startDate: '10 Jul 2026',
    endDate: '15 Jul 2026',
    status: 'Completed',
    totalTests: 5,
    totalMarks: 250,
  },
  {
    id: 'unit-test-2',
    name: 'Unit Test 2 (August Assessment)',
    startDate: '11 Aug 2026',
    endDate: '14 Aug 2026',
    status: 'Upcoming',
    totalTests: 4,
    totalMarks: 200,
  },
  {
    id: 'weekly-class-tests',
    name: 'Weekly Class Evaluation Tests',
    startDate: '01 Aug 2026',
    endDate: '31 Aug 2026',
    status: 'Ongoing',
    totalTests: 8,
    totalMarks: 160,
  },
];

const TEST_PAPERS: Record<string, TestPaper[]> = {
  'unit-test-1': [
    {
      id: 'ut-101',
      seriesId: 'unit-test-1',
      subject: 'Mathematics',
      subjectColor: '#4F46E5',
      date: '10 Jul 2026',
      day: 'Friday',
      timeSlot: '8:30 AM - 9:30 AM',
      duration: '1 Hour',
      location: 'Classroom 204',
      maxMarks: 50,
      obtainedScore: 46,
      isCompleted: true,
      isNext: false,
    },
    {
      id: 'ut-102',
      seriesId: 'unit-test-1',
      subject: 'Science',
      subjectColor: '#059669',
      date: '13 Jul 2026',
      day: 'Monday',
      timeSlot: '8:30 AM - 9:30 AM',
      duration: '1 Hour',
      location: 'Classroom 204',
      maxMarks: 50,
      obtainedScore: 44,
      isCompleted: true,
      isNext: false,
    },
    {
      id: 'ut-103',
      seriesId: 'unit-test-1',
      subject: 'English',
      subjectColor: '#EC4899',
      date: '14 Jul 2026',
      day: 'Tuesday',
      timeSlot: '8:30 AM - 9:30 AM',
      duration: '1 Hour',
      location: 'Classroom 204',
      maxMarks: 50,
      obtainedScore: 48,
      isCompleted: true,
      isNext: false,
    },
    {
      id: 'ut-104',
      seriesId: 'unit-test-1',
      subject: 'Social Science',
      subjectColor: '#8B5CF6',
      date: '15 Jul 2026',
      day: 'Wednesday',
      timeSlot: '8:30 AM - 9:30 AM',
      duration: '1 Hour',
      location: 'Classroom 204',
      maxMarks: 50,
      obtainedScore: 42,
      isCompleted: true,
      isNext: false,
    },
  ],
  'unit-test-2': [
    {
      id: 'ut-201',
      seriesId: 'unit-test-2',
      subject: 'Mathematics',
      subjectColor: '#4F46E5',
      date: '11 Aug 2026',
      day: 'Tuesday',
      timeSlot: '8:30 AM - 9:30 AM',
      duration: '1 Hour',
      location: 'Classroom 204',
      maxMarks: 50,
      isCompleted: false,
      isNext: true,
    },
    {
      id: 'ut-202',
      seriesId: 'unit-test-2',
      subject: 'Science',
      subjectColor: '#059669',
      date: '12 Aug 2026',
      day: 'Wednesday',
      timeSlot: '8:30 AM - 9:30 AM',
      duration: '1 Hour',
      location: 'Science Lab 1',
      maxMarks: 50,
      isCompleted: false,
      isNext: false,
    },
    {
      id: 'ut-203',
      seriesId: 'unit-test-2',
      subject: 'English Literature',
      subjectColor: '#EC4899',
      date: '13 Aug 2026',
      day: 'Thursday',
      timeSlot: '8:30 AM - 9:30 AM',
      duration: '1 Hour',
      location: 'Classroom 204',
      maxMarks: 50,
      isCompleted: false,
      isNext: false,
    },
    {
      id: 'ut-204',
      seriesId: 'unit-test-2',
      subject: 'Computer Science',
      subjectColor: '#3B82F6',
      date: '14 Aug 2026',
      day: 'Friday',
      timeSlot: '8:30 AM - 9:30 AM',
      duration: '1 Hour',
      location: 'Computer Lab 1',
      maxMarks: 50,
      isCompleted: false,
      isNext: false,
    },
  ],
  'weekly-class-tests': [
    {
      id: 'wt-1',
      seriesId: 'weekly-class-tests',
      subject: 'Physics Problem Solving',
      subjectColor: '#059669',
      date: '04 Aug 2026',
      day: 'Tuesday',
      timeSlot: '10:00 AM - 10:45 AM',
      duration: '45 Mins',
      location: 'Classroom 204',
      maxMarks: 20,
      obtainedScore: 19,
      isCompleted: true,
      isNext: false,
    },
    {
      id: 'wt-2',
      seriesId: 'weekly-class-tests',
      subject: 'Algebra & Matrices',
      subjectColor: '#4F46E5',
      date: '12 Aug 2026',
      day: 'Wednesday',
      timeSlot: '10:00 AM - 10:45 AM',
      duration: '45 Mins',
      location: 'Classroom 204',
      maxMarks: 20,
      isCompleted: false,
      isNext: true,
    },
  ],
};

const TEST_SYLLABUS_DATA: Record<string, TestSyllabus[]> = {
  'unit-test-2': [
    {
      subject: 'Mathematics',
      subjectColor: '#4F46E5',
      testDate: '11 Aug 2026',
      chapters: [
        {
          chNo: 3,
          title: 'Pair of Linear Equations in Two Variables',
          topics: ['Elimination Method', 'Word Problems on Speed & Distance'],
        },
        {
          chNo: 4,
          title: 'Quadratic Equations (Basics)',
          topics: ['Finding Roots by Factorisation', 'Discriminant Nature of Roots'],
        },
      ],
    },
    {
      subject: 'Science',
      subjectColor: '#059669',
      testDate: '12 Aug 2026',
      chapters: [
        {
          chNo: 2,
          title: 'Acids, Bases and Salts',
          topics: ['Chemical properties of Acids', 'pH scale applications in daily life'],
        },
      ],
    },
    {
      subject: 'English Literature',
      subjectColor: '#EC4899',
      testDate: '13 Aug 2026',
      chapters: [
        {
          chNo: 2,
          title: 'Nelson Mandela: Long Walk to Freedom',
          topics: ['Short Q&A', 'Extract based comprehension questions'],
        },
      ],
    },
  ],
  'unit-test-1': [
    {
      subject: 'Mathematics',
      subjectColor: '#4F46E5',
      testDate: '10 Jul 2026',
      chapters: [
        {
          chNo: 1,
          title: 'Real Numbers',
          topics: ['HCF & LCM by Prime Factorisation', 'Irrationality Proofs'],
        },
      ],
    },
  ],
};

type ViewTab = 'schedule' | 'syllabus';

export default function TestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('unit-test-2');
  const [activeTab, setActiveTab] = useState<ViewTab>('schedule');
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    Mathematics: true,
  });

  const selectedSeries = useMemo(() => {
    return TEST_SERIES_LIST.find((s) => s.id === selectedSeriesId) || TEST_SERIES_LIST[0];
  }, [selectedSeriesId]);

  const papers = useMemo(() => {
    return TEST_PAPERS[selectedSeriesId] || [];
  }, [selectedSeriesId]);

  const syllabusList = useMemo(() => {
    return TEST_SYLLABUS_DATA[selectedSeriesId] || TEST_SYLLABUS_DATA['unit-test-2'];
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
          <Text style={styles.headerTitle}>Class & Unit Tests</Text>
          <Text style={styles.headerSub}>Periodic assessments & test syllabus</Text>
        </View>

        <View style={styles.headerBadge}>
          <ClipboardList size={16} color="#DB2777" />
          <Text style={styles.headerBadgeText}>Class 10</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Test Series Selector Chips ───────────────────────────── */}
        <View style={styles.seriesSelectorWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seriesScroll}>
            {TEST_SERIES_LIST.map((series) => {
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

            {selectedSeries.status === 'Completed' ? (
              <View style={styles.completedPill}>
                <CheckCircle2 size={12} color="#047857" />
                <Text style={styles.completedPillText}>Test Series Completed</Text>
              </View>
            ) : (
              <View style={styles.activePill}>
                <Clock size={12} color="#BE185D" />
                <Text style={styles.activePillText}>Active Assessment</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroTitle}>{selectedSeries.name}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Calendar size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaText}>
                {selectedSeries.startDate} – {selectedSeries.endDate}
              </Text>
            </View>

            <View style={styles.heroMetaItem}>
              <Award size={14} color="rgba(255,255,255,0.85)" />
              <Text style={styles.heroMetaText}>
                {selectedSeries.totalTests} Papers · {selectedSeries.totalMarks} Total Marks
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
              Test Schedule ({papers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'syllabus' && styles.tabBtnActive]}
            onPress={() => setActiveTab('syllabus')}
          >
            <BookOpen size={15} color={activeTab === 'syllabus' ? '#ffffff' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'syllabus' && styles.tabTextActive]}>
              Test Syllabus
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB 1: SCHEDULE VIEW ─────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <View style={styles.scheduleSection}>
            {papers.length === 0 ? (
              <View style={styles.emptyWrap}>
                <AlertCircle size={28} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No test schedule available</Text>
                <Text style={styles.emptySub}>Schedule details for this test series are not available.</Text>
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
                  {/* Next / Upcoming Banner Header */}
                  {paper.isNext && (
                    <View style={styles.nextBanner}>
                      <Clock size={12} color="#DB2777" />
                      <Text style={styles.nextBannerText}>NEXT UPCOMING TEST</Text>
                    </View>
                  )}

                  <View style={styles.paperHeaderRow}>
                    <View style={styles.subjectRow}>
                      <View style={[styles.subjectDot, { backgroundColor: paper.subjectColor }]} />
                      <Text style={styles.paperSubject}>{paper.subject}</Text>
                    </View>

                    {paper.isCompleted ? (
                      <View style={styles.scorePill}>
                        <Check size={12} color="#047857" strokeWidth={3} />
                        <Text style={styles.scoreText}>
                          Score: {paper.obtainedScore} / {paper.maxMarks}
                        </Text>
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
            {syllabusList.map((item) => {
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
                          {item.chapters.length} Unit Chapters · Test Date: {item.testDate}
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
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DB2777',
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
    backgroundColor: '#831843',
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#831843',
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
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activePillText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#BE185D',
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
    borderColor: '#DB2777',
    borderWidth: 2,
    backgroundColor: '#FDF2F8',
  },
  completedPaperCard: {
    opacity: 0.85,
    backgroundColor: '#FAFAFA',
  },
  nextBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  nextBannerText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#BE185D',
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
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  scoreText: {
    fontSize: 12,
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
