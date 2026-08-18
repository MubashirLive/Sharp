import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  Video,
  FileCode,
  Search,
  X,
  Paperclip,
  BookMarked,
  Sparkles,
  Play,
  ArrowDownToLine,
  Check,
  Circle,
} from 'lucide-react-native';
import {
  MOCK_CURRICULUM_DATA,
  Chapter,
  StudyMaterial,
  MaterialType,
} from '@/data/curriculumData';

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

export default function CurriculumBookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ subjectId?: string; bookId?: string }>();

  // Find active subject & book
  const activeSubject =
    MOCK_CURRICULUM_DATA.find((s) => s.id === params.subjectId) || MOCK_CURRICULUM_DATA[0];

  const activeBook =
    activeSubject.books.find((b) => b.id === params.bookId) || activeSubject.books[0];

  // Accordion state
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-3': true,
    'rd-ch-1': true,
  });

  // Material Modal state
  const [activeMaterialChapter, setActiveMaterialChapter] = useState<Chapter | null>(null);
  const [materialFilter, setMaterialFilter] = useState<'all' | MaterialType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const openMaterialsModal = (chapter: Chapter) => {
    setActiveMaterialChapter(chapter);
    setMaterialFilter('all');
    setSearchQuery('');
  };

  const closeMaterialsModal = () => {
    setActiveMaterialChapter(null);
  };

  // Filtered materials
  const filteredMaterials = activeMaterialChapter
    ? activeMaterialChapter.materials.filter((m) => {
        const matchesFilter = materialFilter === 'all' || m.type === materialFilter;
        const matchesSearch =
          !searchQuery.trim() ||
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
      })
    : [];

  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case 'pdf':
        return <FileText size={18} color="#EF4444" />;
      case 'video':
        return <Video size={18} color="#3B82F6" />;
      case 'worksheet':
        return <FileCode size={18} color="#10B981" />;
      case 'note':
        return <BookMarked size={18} color="#8B5CF6" />;
      default:
        return <Paperclip size={18} color="#64748B" />;
    }
  };

  const renderChapterItem = (chapter: Chapter) => {
    const isExpanded = !!expandedChapters[chapter.id];
    const isCompleted = chapter.isCompleted;
    const isStarted = chapter.completionPercentage > 0;

    return (
      <View key={chapter.id} style={styles.chapterCard}>
        {/* Chapter Accordion Header */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.chapterHeader}
          onPress={() => toggleChapter(chapter.id)}
        >
          <View style={styles.chapterHeaderLeft}>
            <View
              style={[
                styles.chapterBadge,
                isCompleted
                  ? styles.badgeSuccess
                  : isStarted
                  ? styles.badgeWarning
                  : styles.badgePending,
              ]}
            >
              <Text
                style={[
                  styles.chapterBadgeText,
                  isCompleted
                    ? styles.badgeSuccessText
                    : isStarted
                    ? styles.badgeWarningText
                    : styles.badgePendingText,
                ]}
              >
                Ch {chapter.chapterNumber}
              </Text>
            </View>

            <View style={styles.chapterTitleWrap}>
              <Text style={styles.chapterTitle}>
                {chapter.chapterNumber}. {chapter.title}
              </Text>
              <View style={styles.chapterSubMetaRow}>
                <View
                  style={[
                    styles.statusPill,
                    isCompleted
                      ? styles.statusPillSuccess
                      : isStarted
                      ? styles.statusPillWarning
                      : styles.statusPillPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      isCompleted
                        ? styles.statusPillSuccessText
                        : isStarted
                        ? styles.statusPillWarningText
                        : styles.statusPillPendingText,
                    ]}
                  >
                    {isCompleted
                      ? 'Taught'
                      : isStarted
                      ? `${chapter.completionPercentage}% Taught`
                      : 'Not Started'}
                  </Text>
                </View>

                {chapter.materials.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.materialsChip}
                    onPress={(e) => {
                      e.stopPropagation();
                      openMaterialsModal(chapter);
                    }}
                  >
                    <Paperclip size={11} color={C.primary} />
                    <Text style={styles.materialsChipText}>
                      {chapter.materials.length} Materials
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {isExpanded ? (
            <ChevronUp size={20} color={C.textMuted} />
          ) : (
            <ChevronDown size={20} color={C.textMuted} />
          )}
        </TouchableOpacity>

        {/* Accordion Content */}
        {isExpanded && (
          <View style={styles.chapterBody}>
            <Text style={styles.chapterDescription}>{chapter.description}</Text>

            {/* Topics & Sub-topics Tree */}
            <View style={styles.topicsSection}>
              <Text style={styles.topicsSectionTitle}>Topics & Sub-topics</Text>

              {chapter.topics.map((topic, tIdx) => (
                <View key={topic.id} style={styles.topicBlock}>
                  {/* Topic Header */}
                  <View style={styles.topicRow}>
                    {topic.isCompleted ? (
                      <CheckCircle2 size={16} color={C.success} strokeWidth={2.2} />
                    ) : (
                      <Circle size={16} color="#CBD5E1" strokeWidth={2} />
                    )}
                    <Text
                      style={[
                        styles.topicTitle,
                        topic.isCompleted && styles.completedText,
                      ]}
                    >
                      {chapter.chapterNumber}.{tIdx + 1} {topic.title}
                    </Text>
                  </View>

                  {/* Sub-topics Tree */}
                  {topic.subTopics && topic.subTopics.length > 0 && (
                    <View style={styles.subTopicsList}>
                      {topic.subTopics.map((subTopic) => (
                        <View key={subTopic.id} style={styles.subTopicRow}>
                          <View style={styles.treeConnector} />
                          {subTopic.isCompleted ? (
                            <CheckCircle2 size={14} color={C.success} strokeWidth={2.2} />
                          ) : (
                            <Circle size={14} color="#CBD5E1" strokeWidth={2} />
                          )}
                          <Text
                            style={[
                              styles.subTopicTitle,
                              subTopic.isCompleted && styles.completedText,
                            ]}
                          >
                            {subTopic.title}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Chapter Materials Button */}
            {chapter.materials.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.viewMaterialsBtn}
                onPress={() => openMaterialsModal(chapter)}
              >
                <View style={styles.viewMaterialsLeft}>
                  <Paperclip size={16} color={C.primary} />
                  <Text style={styles.viewMaterialsText}>
                    View Attached Teacher Materials ({chapter.materials.length})
                  </Text>
                </View>
                <ChevronRight size={16} color={C.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <ChevronLeft size={22} color={C.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeBook.title}
          </Text>
          <Text style={styles.headerSub}>
            {activeSubject.subjectName} · {activeBook.totalChapters} Chapters
          </Text>
        </View>
        <View style={styles.placeholderBtn} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Book Header Card */}
        <View style={styles.bookHeaderCard}>
          <View style={styles.bookHeaderTop}>
            <View
              style={[
                styles.bookCoverIcon,
                { backgroundColor: activeBook.coverColor + '15' },
              ]}
            >
              <BookMarked size={28} color={activeBook.coverColor} strokeWidth={2.2} />
            </View>
            <View style={styles.bookHeaderDetails}>
              <Text style={styles.bookHeaderTitle}>{activeBook.title}</Text>
              <Text style={styles.bookHeaderPublisher}>
                {activeBook.publisher} {activeBook.edition ? `· ${activeBook.edition}` : ''}
              </Text>
              <View style={styles.bookTeacherTag}>
                <Sparkles size={12} color={C.primary} />
                <Text style={styles.bookTeacherTagText}>
                  Teacher: {activeSubject.leadTeacher}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressRowHeader}>
              <Text style={styles.progressLabel}>Teacher Progress</Text>
              <Text style={styles.progressValue}>
                {activeBook.completedChapters} of {activeBook.totalChapters} Chapters Taught (
                {activeBook.progressPercentage}%)
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${activeBook.progressPercentage}%`,
                    backgroundColor: activeBook.coverColor,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Render Parts (if any) or Direct Chapters */}
        {activeBook.parts && activeBook.parts.length > 0 ? (
          activeBook.parts.map((part) => (
            <View key={part.id} style={styles.partBlock}>
              <View style={styles.partHeader}>
                <View style={styles.partTitleRow}>
                  <Layers size={18} color={C.primary} />
                  <Text style={styles.partTitle}>{part.title}</Text>
                </View>
                {part.description && (
                  <Text style={styles.partDescription}>{part.description}</Text>
                )}
              </View>

              {part.chapters.map(renderChapterItem)}
            </View>
          ))
        ) : activeBook.directChapters && activeBook.directChapters.length > 0 ? (
          <View style={styles.directChaptersBlock}>
            {activeBook.directChapters.map(renderChapterItem)}
          </View>
        ) : (
          <Text style={styles.emptyText}>No chapters available for this book.</Text>
        )}
      </ScrollView>

      {/* Teacher Study Materials Bottom Sheet / Modal */}
      <Modal
        visible={!!activeMaterialChapter}
        transparent
        animationType="slide"
        onRequestClose={closeMaterialsModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={closeMaterialsModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <View style={styles.modalDragHandle} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <Paperclip size={22} color={C.primary} strokeWidth={2.2} />
                <View style={styles.sheetTitleWrap}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    Chapter {activeMaterialChapter?.chapterNumber} Study Materials
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {activeMaterialChapter?.materials.length} Notes & Worksheets attached
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={closeMaterialsModal}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBarWrap}>
              <View style={styles.searchBar}>
                <Search size={16} color={C.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search attached notes, videos, PDFs..."
                  placeholderTextColor={C.textMuted}
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

            {/* Material Type Filter Chips */}
            <View style={styles.filterChipsRow}>
              {(['all', 'pdf', 'video', 'worksheet', 'note'] as const).map((filterKey) => {
                const isActive = materialFilter === filterKey;
                const labels: Record<string, string> = {
                  all: 'All Files',
                  pdf: 'PDFs',
                  video: 'Videos',
                  worksheet: 'Worksheets',
                  note: 'Notes',
                };
                return (
                  <TouchableOpacity
                    key={filterKey}
                    activeOpacity={0.8}
                    style={[
                      styles.filterChip,
                      isActive ? styles.filterChipActive : styles.filterChipInactive,
                    ]}
                    onPress={() => setMaterialFilter(filterKey)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive
                          ? styles.filterChipTextActive
                          : styles.filterChipTextInactive,
                      ]}
                    >
                      {labels[filterKey]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Materials List */}
            <ScrollView
              style={styles.materialsList}
              contentContainerStyle={styles.materialsListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((mat) => (
                  <View key={mat.id} style={styles.materialItemCard}>
                    <View style={styles.materialIconWrap}>{getMaterialIcon(mat.type)}</View>

                    <View style={styles.materialItemInfo}>
                      <Text style={styles.materialItemTitle}>{mat.title}</Text>
                      <Text style={styles.materialItemMeta}>
                        {mat.uploadedBy} · {mat.uploadedAt}{' '}
                        {mat.fileSize ? `· ${mat.fileSize}` : mat.duration ? `· ${mat.duration}` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity activeOpacity={0.8} style={styles.downloadBtn}>
                      {mat.type === 'video' ? (
                        <Play size={16} color={C.primary} />
                      ) : (
                        <ArrowDownToLine size={16} color={C.primary} />
                      )}
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyMaterialsState}>
                  <Paperclip size={32} color={C.textMuted} />
                  <Text style={styles.emptyMaterialsTitle}>No Materials Found</Text>
                  <Text style={styles.emptyMaterialsSub}>
                    Try adjusting your search or filter keywords.
                  </Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    flex: 1,
    paddingHorizontal: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: C.textMuted,
    marginTop: 1,
  },
  placeholderBtn: {
    width: 38,
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Book Header Card
  bookHeaderCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 20,
  },
  bookHeaderTop: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  bookCoverIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookHeaderDetails: {
    flex: 1,
  },
  bookHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.text,
  },
  bookHeaderPublisher: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 2,
  },
  bookTeacherTag: {
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
  bookTeacherTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.primary,
  },

  progressContainer: {},
  progressRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textMuted,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Part Block
  partBlock: {
    marginBottom: 20,
  },
  partHeader: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  partTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.primary,
  },
  partDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 2,
  },

  directChaptersBlock: {
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: C.textMuted,
    marginTop: 20,
  },

  // Chapter Card Accordion
  chapterCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  chapterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chapterBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuccess: { backgroundColor: C.successBg },
  badgeWarning: { backgroundColor: C.warningBg },
  badgePending: { backgroundColor: '#F1F5F9' },
  chapterBadgeText: { fontSize: 12, fontWeight: '800' },
  badgeSuccessText: { color: C.success },
  badgeWarningText: { color: C.warning },
  badgePendingText: { color: C.textMuted },

  chapterTitleWrap: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.text,
  },
  chapterSubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillSuccess: { backgroundColor: C.successBg },
  statusPillWarning: { backgroundColor: C.warningBg },
  statusPillPending: { backgroundColor: '#F1F5F9' },
  statusPillText: { fontSize: 10, fontWeight: '700' },
  statusPillSuccessText: { color: C.success },
  statusPillWarningText: { color: C.warning },
  statusPillPendingText: { color: C.textMuted },

  materialsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primaryBg,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  materialsChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.primary,
  },

  // Chapter Body
  chapterBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chapterDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: C.textMuted,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 14,
  },

  topicsSection: {
    marginBottom: 12,
  },
  topicsSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.text,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicBlock: {
    marginBottom: 10,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
    flex: 1,
  },
  completedText: {
    color: C.textMuted,
  },

  subTopicsList: {
    paddingLeft: 22,
    paddingTop: 6,
    gap: 6,
  },
  subTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  treeConnector: {
    width: 6,
    height: 1,
    backgroundColor: C.border,
  },
  subTopicTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: C.text,
  },

  viewMaterialsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.primaryBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  viewMaterialsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewMaterialsText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.primary,
  },

  // Modal / Sheet Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    paddingBottom: 20,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sheetTitleWrap: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.text,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBarWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: C.text,
    padding: 0,
  },

  filterChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: C.primary,
  },
  filterChipInactive: {
    backgroundColor: '#F1F5F9',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  filterChipTextInactive: {
    color: C.textMuted,
  },

  materialsList: {
    maxHeight: 380,
  },
  materialsListContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  materialItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    gap: 12,
  },
  materialIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  materialItemInfo: {
    flex: 1,
  },
  materialItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },
  materialItemMeta: {
    fontSize: 11,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 2,
  },
  downloadBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyMaterialsState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyMaterialsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
    marginTop: 8,
  },
  emptyMaterialsSub: {
    fontSize: 12,
    fontWeight: '500',
    color: C.textMuted,
    marginTop: 2,
  },
});
