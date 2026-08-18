import React, { useState } from 'react';
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
  BookOpen,
  ChevronRight,
  Sparkles,
  Layers,
  FileText,
  CheckCircle2,
  Library,
  BookMarked,
  Download,
  Paperclip,
} from 'lucide-react-native';
import { MOCK_CURRICULUM_DATA, SubjectCurriculumData } from '@/data/curriculumData';

const C = {
  primary: '#7C3AED',
  primaryBg: '#F3E8FF',
  surface: '#ffffff',
  bg: '#F8FAFC',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  accent: '#3B82F6',
};

export default function CurriculumScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-math');

  const activeSubject: SubjectCurriculumData =
    MOCK_CURRICULUM_DATA.find((s) => s.id === selectedSubjectId) || MOCK_CURRICULUM_DATA[0];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <ChevronLeft size={22} color={C.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Curriculum & Syllabus</Text>
          <Text style={styles.headerSub}>Teacher Completion Tracking</Text>
        </View>
        <TouchableOpacity style={styles.downloadHeaderBtn} activeOpacity={0.75}>
          <Download size={18} color={C.primary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Subject Filter Pills */}
      <View style={styles.pillScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillScrollContent}
        >
          {MOCK_CURRICULUM_DATA.map((item) => {
            const isSelected = item.id === selectedSubjectId;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[
                  styles.pill,
                  isSelected ? styles.pillActive : styles.pillInactive,
                ]}
                onPress={() => setSelectedSubjectId(item.id)}
              >
                <BookOpen
                  size={15}
                  color={isSelected ? '#ffffff' : C.textMuted}
                  strokeWidth={2.2}
                />
                <Text
                  style={[
                    styles.pillText,
                    isSelected ? styles.pillTextActive : styles.pillTextInactive,
                  ]}
                >
                  {item.subjectName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subject Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <View style={styles.flex1}>
              <View style={styles.subjectBadgeRow}>
                <Text style={styles.subjectTitle}>{activeSubject.subjectName}</Text>
                <View style={styles.codeTag}>
                  <Text style={styles.codeTagText}>{activeSubject.subjectCode}</Text>
                </View>
              </View>
              <Text style={styles.subjectMeta}>
                {activeSubject.grade} · Lead Teacher: {activeSubject.leadTeacher}
              </Text>
            </View>

            <View style={styles.badgeProgress}>
              <Sparkles size={13} color={C.primary} />
              <Text style={styles.badgeProgressText}>
                {activeSubject.overallProgress}% Covered
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${activeSubject.overallProgress}%` },
              ]}
            />
          </View>

          {/* Overall Stats */}
          <View style={styles.overviewStatsRow}>
            <View style={styles.statBox}>
              <Library size={16} color={C.primary} />
              <Text style={styles.statValue}>{activeSubject.totalBooks}</Text>
              <Text style={styles.statLabel}>Books / References</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <CheckCircle2 size={16} color={C.success} />
              <Text style={styles.statValue}>
                {activeSubject.completedChapters}/{activeSubject.totalChapters}
              </Text>
              <Text style={styles.statLabel}>Chapters Taught</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Paperclip size={16} color={C.accent} />
              <Text style={styles.statValue}>{activeSubject.totalMaterials}</Text>
              <Text style={styles.statLabel}>Study Materials</Text>
            </View>
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Prescribed Books & Syllabus</Text>
            <Text style={styles.sectionSub}>Select a book to explore chapters and study notes</Text>
          </View>
        </View>

        {/* Books List */}
        {activeSubject.books.map((book) => {
          return (
            <TouchableOpacity
              key={book.id}
              activeOpacity={0.85}
              style={styles.bookCard}
              onPress={() =>
                router.push({
                  pathname: '/curriculum-book',
                  params: { subjectId: activeSubject.id, bookId: book.id },
                })
              }
            >
              <View style={styles.bookTopRow}>
                <View style={[styles.bookIconBadge, { backgroundColor: book.coverColor + '15' }]}>
                  <BookMarked size={24} color={book.coverColor} strokeWidth={2.2} />
                </View>
                <View style={styles.bookMainInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  {book.publisher && (
                    <Text style={styles.bookPublisher}>
                      {book.publisher} {book.edition ? `· ${book.edition}` : ''}
                    </Text>
                  )}
                  {book.parts && book.parts.length > 0 && (
                    <View style={styles.partsBadge}>
                      <Layers size={11} color={C.primary} />
                      <Text style={styles.partsBadgeText}>
                        {book.parts.length} Parts Structured
                      </Text>
                    </View>
                  )}
                </View>
                <ChevronRight size={20} color={C.textMuted} />
              </View>

              {/* Book Progress Bar */}
              <View style={styles.bookProgressSection}>
                <View style={styles.bookProgressHeader}>
                  <Text style={styles.bookProgressLabel}>Syllabus Completion</Text>
                  <Text style={styles.bookProgressFraction}>
                    {book.completedChapters} of {book.totalChapters} Chapters ({book.progressPercentage}%)
                  </Text>
                </View>
                <View style={styles.bookProgressTrack}>
                  <View
                    style={[
                      styles.bookProgressFill,
                      { width: `${book.progressPercentage}%`, backgroundColor: book.coverColor },
                    ]}
                  />
                </View>
              </View>

              {/* Bottom Meta Bar */}
              <View style={styles.bookFooter}>
                <View style={styles.materialChip}>
                  <Paperclip size={12} color={C.primary} />
                  <Text style={styles.materialChipText}>
                    {book.totalMaterials} Teacher Materials Attached
                  </Text>
                </View>

                <Text style={styles.exploreText}>View Syllabus →</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Global Materials Handout Banner */}
        <View style={styles.infoBanner}>
          <FileText size={20} color={C.primary} />
          <View style={styles.infoBannerTextWrap}>
            <Text style={styles.infoBannerTitle}>Organized Teacher Study Hub</Text>
            <Text style={styles.infoBannerSub}>
              All uploaded notes, worksheets, and videos are linked to their respective chapters.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    marginTop: 1,
  },
  downloadHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pill Bar
  pillScrollWrap: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 10,
  },
  pillScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pillActive: {
    backgroundColor: C.primary,
  },
  pillInactive: {
    backgroundColor: '#F1F5F9',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  pillTextInactive: {
    color: C.textMuted,
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  flex1: {
    flex: 1,
  },

  // Overview Card
  overviewCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  subjectBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
  },
  codeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  subjectMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 4,
  },
  badgeProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryBg,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeProgressText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: C.primary,
    borderRadius: 4,
  },
  overviewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: C.border,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
    marginTop: 3,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },

  // Section Header
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: C.text,
  },
  sectionSub: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 1,
  },

  // Book Card
  bookCard: {
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
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
  bookTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  bookIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookMainInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  bookPublisher: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 2,
  },
  partsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryBg,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginTop: 6,
  },
  partsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
  },

  bookProgressSection: {
    marginBottom: 12,
  },
  bookProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  bookProgressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.text,
  },
  bookProgressFraction: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  bookProgressTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bookProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  bookFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  materialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  materialChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.text,
  },
  exploreText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryBg,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginTop: 6,
  },
  infoBannerTextWrap: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: C.primary,
  },
  infoBannerSub: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
});
