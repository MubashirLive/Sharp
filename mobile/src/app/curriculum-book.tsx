import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  Alert,
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
  CalendarDays,
  PenTool,
  Globe,
  Users,
  GraduationCap,
  Tag,
  Eye,
} from 'lucide-react-native';
import {
  MOCK_CURRICULUM_DATA,
  Chapter,
  Topic,
  SubTopic,
  StudyMaterial,
  MaterialType,
  ChapterHomework,
  TimelineHistoryEntry,
} from '@/data/curriculumData';
import { useCurriculumStore, CurriculumStore } from '@/data/curriculumStore';
import SyllabusTimelineButton from '@/components/SyllabusTimelineButton';
import TimelineDatePicker, { formatDateShort } from '@/components/TimelineDatePicker';
import TimelineHistoryModal from '@/components/TimelineHistoryModal';
import AutoCompleteDialog from '@/components/AutoCompleteDialog';

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

// Helper: find the partId for a chapter within a book
function findPartIdForChapter(book: typeof MOCK_CURRICULUM_DATA[0]['books'][0], chapterId: string): string | null {
  if (book.parts) {
    for (const part of book.parts) {
      if (part.chapters.some((c) => c.id === chapterId)) return part.id;
    }
  }
  return null;
}

// Helper: parse date string into timestamp for chronological sorting
function parseUploadDate(dateStr: string | undefined): number {
  if (!dateStr) return 0;
  const lower = dateStr.toLowerCase().trim();
  const now = Date.now();
  if (lower.startsWith('today') || lower.startsWith('just now')) {
    return now;
  }
  if (lower.startsWith('yesterday')) {
    return now - 24 * 60 * 60 * 1000;
  }
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    return parsed;
  }
  return 0;
}

function formatPublishDate(dateStr: string | undefined): string {
  if (!dateStr) return 'Today';
  if (dateStr.includes('-') && dateStr.length === 10) {
    return formatDateShort(dateStr);
  }
  return dateStr;
}

// ─── Chapter Material Card (Title, description, attachment, date only) ─────────
function ChapterMaterialCard({ item }: { item: StudyMaterial }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLink = item.type === 'link' || item.type === 'video' || (item.url && item.url.startsWith('http'));
  const isVideo = item.type === 'video';
  const typeLabel = item.type.toUpperCase();
  const iconColor =
    item.type === 'pdf'
      ? '#DC2626'
      : item.type === 'video'
      ? '#2563EB'
      : item.type === 'worksheet'
      ? '#059669'
      : item.type === 'link'
      ? '#4F46E5'
      : '#7C3AED';

  const iconBg =
    item.type === 'pdf'
      ? '#FEE2E2'
      : item.type === 'video'
      ? '#DBEAFE'
      : item.type === 'worksheet'
      ? '#D1FAE5'
      : item.type === 'link'
      ? '#EEF2FF'
      : '#F3E8FF';

  return (
    <TouchableOpacity
      style={styles.chapterResourceCard}
      activeOpacity={0.92}
      onPress={() => setIsExpanded((prev) => !prev)}
    >
      {/* ── 1. Top Row: Title + Date & Chevron ── */}
      <View style={styles.crCardHeaderRow}>
        <Text style={styles.crMaterialTitle} numberOfLines={isExpanded ? undefined : 2}>
          {item.title}
        </Text>
        <View style={styles.crTopRightWrap}>
          <View style={styles.crDateWrap}>
            <Clock size={10} color="#94A3B8" strokeWidth={2} />
            <Text style={styles.crDateText}>{item.uploadedAt}</Text>
          </View>
          <View style={styles.crChevronIndicator}>
            {isExpanded ? (
              <ChevronUp size={12} color="#94A3B8" strokeWidth={2.4} />
            ) : (
              <ChevronDown size={12} color="#94A3B8" strokeWidth={2.4} />
            )}
          </View>
        </View>
      </View>

      {/* ── 2. Description (Expandable) ── */}
      {item.description ? (
        <View style={[styles.crDescriptionWrap, isExpanded && styles.crDescriptionWrapExpanded]}>
          <Text
            style={[styles.crDescriptionText, isExpanded && styles.crDescriptionTextExpanded]}
            numberOfLines={isExpanded ? undefined : 1}
          >
            {item.description}
          </Text>
          {!isExpanded && <Text style={styles.crExpandHintText}>More</Text>}
        </View>
      ) : null}

      {/* ── 3. Footer: File Badges + Actions ── */}
      <View style={styles.crCardFooter}>
        <View style={styles.crMetaPillsRow}>
          <View style={[styles.crMetaPill, { backgroundColor: iconBg }]}>
            <Text style={[styles.crMetaPillText, { color: iconColor, fontWeight: '700' }]}>
              {typeLabel}
            </Text>
          </View>
          {item.fileSize ? (
            <View style={styles.crMetaPill}>
              <Text style={styles.crMetaPillText}>{item.fileSize}</Text>
            </View>
          ) : item.duration ? (
            <View style={styles.crMetaPill}>
              <Text style={styles.crMetaPillText}>{item.duration}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.crActionBtnsRow}>
          {isLink ? (
            <TouchableOpacity
              style={[styles.crDownloadBtn, { backgroundColor: '#4F46E5' }]}
              activeOpacity={0.75}
              onPress={(e) => {
                e.stopPropagation?.();
                Alert.alert('Opening Resource', `Opening ${item.title}...`);
              }}
            >
              <Globe size={11} color="#ffffff" strokeWidth={2.4} />
              <Text style={styles.crDownloadBtnText}>Open Link</Text>
            </TouchableOpacity>
          ) : isVideo ? (
            <TouchableOpacity
              style={[styles.crDownloadBtn, { backgroundColor: '#2563EB' }]}
              activeOpacity={0.75}
              onPress={(e) => {
                e.stopPropagation?.();
                Alert.alert('Playing Video', `Playing ${item.title}...`);
              }}
            >
              <Play size={11} color="#ffffff" strokeWidth={2.4} />
              <Text style={styles.crDownloadBtnText}>Watch Video</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.crPreviewBtn}
                activeOpacity={0.75}
                onPress={(e) => {
                  e.stopPropagation?.();
                  Alert.alert('Preview Document', `Opening preview for ${item.title}...`);
                }}
              >
                <Eye size={12} color="#059669" strokeWidth={2.2} />
                <Text style={styles.crPreviewBtnText}>Preview</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.crDownloadIconBtn}
                activeOpacity={0.75}
                onPress={(e) => {
                  e.stopPropagation?.();
                  Alert.alert('Download File', `Downloading ${item.title}...`);
                }}
              >
                <Download size={13} color="#059669" strokeWidth={2.4} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Chapter Homework Card (Title, description, attachment, date only) ─────────
function ChapterHomeworkCard({ item }: { item: ChapterHomework }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const attachments = item.attachments || [];
  const hasAttachments = attachments.length > 0;
  const primaryAtt = attachments[0];
  const isLink = primaryAtt?.kind === 'link' || (primaryAtt?.url && primaryAtt.url.startsWith('http'));
  const isVideo = primaryAtt?.label?.toLowerCase().includes('video') || primaryAtt?.label?.toLowerCase().includes('youtube');

  const dateLabel = formatPublishDate(item.assignedDate);

  return (
    <TouchableOpacity
      style={styles.chapterHomeworkCard}
      activeOpacity={0.92}
      onPress={() => setIsExpanded((prev) => !prev)}
    >
      {/* ── 1. Top Row: Title + Date & Chevron ── */}
      <View style={styles.crCardHeaderRow}>
        <Text style={styles.crMaterialTitle} numberOfLines={isExpanded ? undefined : 2}>
          {item.title}
        </Text>
        <View style={styles.crTopRightWrap}>
          <View style={styles.crDateWrap}>
            <Clock size={10} color="#94A3B8" strokeWidth={2} />
            <Text style={styles.crDateText}>{dateLabel}</Text>
          </View>
          <View style={styles.crChevronIndicator}>
            {isExpanded ? (
              <ChevronUp size={12} color="#94A3B8" strokeWidth={2.4} />
            ) : (
              <ChevronDown size={12} color="#94A3B8" strokeWidth={2.4} />
            )}
          </View>
        </View>
      </View>

      {/* ── 2. Description (Expandable) ── */}
      {item.description ? (
        <View style={[styles.crDescriptionWrap, isExpanded && styles.crDescriptionWrapExpanded]}>
          <Text
            style={[styles.crDescriptionText, isExpanded && styles.crDescriptionTextExpanded]}
            numberOfLines={isExpanded ? undefined : 1}
          >
            {item.description}
          </Text>
          {!isExpanded && <Text style={styles.crExpandHintTextPurple}>More</Text>}
        </View>
      ) : null}

      {/* ── 3. Footer: Attachment Badges + Action Buttons ── */}
      {hasAttachments ? (
        <View style={styles.crCardFooter}>
          <View style={styles.crMetaPillsRow}>
            {attachments.map((att, idx) => {
              const attIsLink = att.kind === 'link';
              const attIsPdf = att.label.toLowerCase().includes('.pdf');
              return (
                <View
                  key={att.id || idx}
                  style={[
                    styles.crMetaPill,
                    {
                      backgroundColor: attIsLink ? '#EEF2FF' : attIsPdf ? '#FEE2E2' : '#F3E8FF',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.crMetaPillText,
                      {
                        color: attIsLink ? '#4F46E5' : attIsPdf ? '#DC2626' : '#7C3AED',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {attIsLink ? 'LINK' : attIsPdf ? 'PDF' : 'DOC'}
                  </Text>
                </View>
              );
            })}
            {primaryAtt && (
              <View style={[styles.crMetaPill, { maxWidth: 140 }]}>
                <Text style={styles.crMetaPillText} numberOfLines={1}>
                  {primaryAtt.label}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.crActionBtnsRow}>
            {isLink ? (
              <TouchableOpacity
                style={[styles.crDownloadBtn, { backgroundColor: '#4F46E5' }]}
                activeOpacity={0.75}
                onPress={(e) => {
                  e.stopPropagation?.();
                  Alert.alert('Opening Link', `Opening ${primaryAtt.label}...`);
                }}
              >
                <Globe size={11} color="#ffffff" strokeWidth={2.4} />
                <Text style={styles.crDownloadBtnText}>Open Link</Text>
              </TouchableOpacity>
            ) : isVideo ? (
              <TouchableOpacity
                style={[styles.crDownloadBtn, { backgroundColor: '#2563EB' }]}
                activeOpacity={0.75}
                onPress={(e) => {
                  e.stopPropagation?.();
                  Alert.alert('Playing Video', `Playing ${primaryAtt.label}...`);
                }}
              >
                <Play size={11} color="#ffffff" strokeWidth={2.4} />
                <Text style={styles.crDownloadBtnText}>Watch Video</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.crPreviewBtn, { borderColor: '#DDD6FE', backgroundColor: '#FAF5FF' }]}
                  activeOpacity={0.75}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Alert.alert('Preview Document', `Opening preview for ${primaryAtt?.label || item.title}...`);
                  }}
                >
                  <Eye size={12} color="#7C3AED" strokeWidth={2.2} />
                  <Text style={[styles.crPreviewBtnText, { color: '#7C3AED' }]}>Preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.crDownloadIconBtn, { borderColor: '#DDD6FE', backgroundColor: '#FAF5FF' }]}
                  activeOpacity={0.75}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    Alert.alert('Download File', `Downloading ${primaryAtt?.label || item.title}...`);
                  }}
                >
                  <Download size={13} color="#7C3AED" strokeWidth={2.4} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export default function CurriculumBookScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ subjectId?: string; bookId?: string }>();
  const curriculumData = useCurriculumStore();

  // Find active subject & book
  const activeSubject =
    curriculumData.find((s) => s.id === params.subjectId) || curriculumData[0] || MOCK_CURRICULUM_DATA[0];

  const activeBook =
    activeSubject.books.find((b) => b.id === params.bookId) || activeSubject.books[0];

  // Accordion state
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-3': true,
    'rd-ch-1': true,
  });

  // Attached Resource Modal state
  const [activeMaterialChapter, setActiveMaterialChapter] = useState<Chapter | null>(null);
  const [materialFilter, setMaterialFilter] = useState<'all' | 'pdf' | 'video' | 'link'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Homework Modal state
  const [activeHomeworkChapter, setActiveHomeworkChapter] = useState<Chapter | null>(null);
  const [homeworkFilter, setHomeworkFilter] = useState<'all' | 'pdf' | 'video' | 'link'>('all');
  const [homeworkSearchQuery, setHomeworkSearchQuery] = useState('');

  // ── Syllabus Timeline State ────────────────────────────────────────
  const [isTimelineMode, setIsTimelineMode] = useState(false);
  const CHANGED_BY = activeSubject.leadTeacher;

  // Date picker modal
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTitle, setDatePickerTitle] = useState('');
  const [datePickerMinDate, setDatePickerMinDate] = useState<string | undefined>(undefined);
  const [datePickerCallback, setDatePickerCallback] = useState<((dateKey: string) => void) | null>(null);

  // Auto-complete dialog
  const [autoCompleteVisible, setAutoCompleteVisible] = useState(false);
  const [autoCompleteInfo, setAutoCompleteInfo] = useState<{
    parentType: 'topic' | 'chapter';
    parentName: string;
    childType: string;
    endDate: string;
    chapterId: string;
    topicId: string | null;
  } | null>(null);

  // History modal
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyNodeName, setHistoryNodeName] = useState('');
  const [historyNodeType, setHistoryNodeType] = useState<'Chapter' | 'Topic' | 'Subtopic'>('Chapter');
  const [historyEntries, setHistoryEntries] = useState<TimelineHistoryEntry[]>([]);

  // ── Timeline Handlers ──────────────────────────────────────────────
  const openDatePicker = useCallback(
    (title: string, minDate: string | undefined, callback: (dateKey: string) => void) => {
      setDatePickerTitle(title);
      setDatePickerMinDate(minDate);
      setDatePickerCallback(() => callback);
      setDatePickerVisible(true);
    },
    []
  );

  const openHistory = useCallback(
    (chapterId: string, topicId: string | null, subTopicId: string | null, nodeName: string, nodeType: 'Chapter' | 'Topic' | 'Subtopic') => {
      const partId = findPartIdForChapter(activeBook, chapterId);
      const entries = CurriculumStore.getTimelineHistory(
        activeSubject.id, activeBook.id, partId, chapterId, topicId, subTopicId
      );
      setHistoryNodeName(nodeName);
      setHistoryNodeType(nodeType);
      setHistoryEntries(entries);
      setHistoryVisible(true);
    },
    [activeSubject.id, activeBook]
  );

  // Chapter: Set Start Date
  const handleSetChapterStart = useCallback(
    (chapterId: string, chapterTitle: string) => {
      const partId = findPartIdForChapter(activeBook, chapterId);
      openDatePicker(`Start: ${chapterTitle}`, undefined, (dateKey) => {
        CurriculumStore.setChapterStartDate(
          activeSubject.id, activeBook.id, partId, chapterId, dateKey, CHANGED_BY
        );
      });
    },
    [activeSubject.id, activeBook, CHANGED_BY, openDatePicker]
  );

  // Chapter: Set End Date
  const handleSetChapterEnd = useCallback(
    (chapterId: string, chapterTitle: string, startDate?: string) => {
      const partId = findPartIdForChapter(activeBook, chapterId);
      openDatePicker(`End: ${chapterTitle}`, startDate, (dateKey) => {
        CurriculumStore.setChapterEndDate(
          activeSubject.id, activeBook.id, partId, chapterId, dateKey, CHANGED_BY
        );
      });
    },
    [activeSubject.id, activeBook, CHANGED_BY, openDatePicker]
  );

  // Topic: Mark Completed (single completion date)
  const handleSetTopicDone = useCallback(
    (chapterId: string, topicId: string, topicTitle: string, chapterStartDate?: string) => {
      if (!chapterStartDate) {
        Alert.alert(
          'Chapter Not Started',
          'Please set the Chapter Start Date first before completing topics.'
        );
        return;
      }
      const partId = findPartIdForChapter(activeBook, chapterId);
      openDatePicker(`Completed: ${topicTitle}`, chapterStartDate, (dateKey) => {
        const result = CurriculumStore.setTopicCompleted(
          activeSubject.id, activeBook.id, partId, chapterId, topicId, dateKey, CHANGED_BY
        );
        if (result.shouldAutoComplete) {
          setAutoCompleteInfo({
            parentType: 'chapter',
            parentName: result.shouldAutoComplete.name,
            childType: 'topics',
            endDate: result.shouldAutoComplete.date,
            chapterId: chapterId,
            topicId: null,
          });
          setAutoCompleteVisible(true);
        }
      });
    },
    [activeSubject.id, activeBook, CHANGED_BY, openDatePicker]
  );

  // SubTopic: Mark Completed (single completion date)
  const handleSetSubTopicDone = useCallback(
    (chapterId: string, topicId: string, subTopicId: string, subTopicTitle: string, chapterStartDate?: string) => {
      if (!chapterStartDate) {
        Alert.alert(
          'Chapter Not Started',
          'Please set the Chapter Start Date first before completing subtopics.'
        );
        return;
      }
      const partId = findPartIdForChapter(activeBook, chapterId);
      openDatePicker(`Completed: ${subTopicTitle}`, chapterStartDate, (dateKey) => {
        const result = CurriculumStore.setSubTopicCompleted(
          activeSubject.id, activeBook.id, partId, chapterId, topicId, subTopicId, dateKey, CHANGED_BY
        );
        if (result.shouldAutoComplete) {
          setAutoCompleteInfo({
            parentType: 'topic',
            parentName: result.shouldAutoComplete.name,
            childType: 'subtopics',
            endDate: result.shouldAutoComplete.date,
            chapterId: chapterId,
            topicId: topicId,
          });
          setAutoCompleteVisible(true);
        }
      });
    },
    [activeSubject.id, activeBook, CHANGED_BY, openDatePicker]
  );

  // Auto-complete confirmation handler
  const handleConfirmAutoComplete = useCallback(() => {
    if (!autoCompleteInfo) return;
    const partId = findPartIdForChapter(activeBook, autoCompleteInfo.chapterId);
    const result = CurriculumStore.confirmAutoComplete(
      activeSubject.id,
      activeBook.id,
      partId,
      autoCompleteInfo.chapterId,
      autoCompleteInfo.topicId,
      autoCompleteInfo.endDate,
      CHANGED_BY
    );
    setAutoCompleteVisible(false);
    setAutoCompleteInfo(null);

    // If auto-completing topic also finished the entire chapter, trigger chapter dialog next
    if (result.shouldAutoComplete) {
      setTimeout(() => {
        setAutoCompleteInfo({
          parentType: 'chapter',
          parentName: result.shouldAutoComplete!.name,
          childType: 'topics',
          endDate: result.shouldAutoComplete!.date,
          chapterId: autoCompleteInfo.chapterId,
          topicId: null,
        });
        setAutoCompleteVisible(true);
      }, 350);
    }
  }, [autoCompleteInfo, activeSubject.id, activeBook, CHANGED_BY]);

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

  const openHomeworkModal = (chapter: Chapter) => {
    setActiveHomeworkChapter(chapter);
    setHomeworkFilter('all');
    setHomeworkSearchQuery('');
  };

  const closeHomeworkModal = () => {
    setActiveHomeworkChapter(null);
  };

  // Filtered materials (ordered recent to oldest)
  const filteredMaterials = activeMaterialChapter
    ? activeMaterialChapter.materials
        .filter((m) => {
          const matchesFilter =
            materialFilter === 'all' ||
            (materialFilter === 'pdf' && (m.type === 'pdf' || m.type === 'worksheet' || m.type === 'note')) ||
            (materialFilter === 'video' && m.type === 'video') ||
            (materialFilter === 'link' && (m.type === 'link' || (!['pdf', 'worksheet', 'note', 'video'].includes(m.type) && !!m.url)));
          const matchesSearch =
            !searchQuery.trim() ||
            m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            m.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesFilter && matchesSearch;
        })
        .sort((a, b) => {
          const timeA = a.timestamp || parseUploadDate(a.uploadedAt);
          const timeB = b.timestamp || parseUploadDate(b.uploadedAt);
          return timeB - timeA;
        })
    : [];

  // Filtered homework (ordered recent to oldest)
  const filteredHomeworks = activeHomeworkChapter?.homeworks
    ? activeHomeworkChapter.homeworks
        .filter((hw) => {
          const hasPdf = hw.attachments?.some(
            (a) => a.label.toLowerCase().includes('.pdf') || a.kind === 'file'
          );
          const hasVideo = hw.attachments?.some(
            (a) =>
              a.label.toLowerCase().includes('video') ||
              a.label.toLowerCase().includes('youtube') ||
              a.label.toLowerCase().includes('mp4')
          );
          const hasLink = hw.attachments?.some(
            (a) => a.kind === 'link' || (!!a.url && !a.label.toLowerCase().includes('.pdf'))
          );

          const matchesFilter =
            homeworkFilter === 'all' ||
            (homeworkFilter === 'pdf' && hasPdf) ||
            (homeworkFilter === 'video' && hasVideo) ||
            (homeworkFilter === 'link' && hasLink);

          const matchesSearch =
            !homeworkSearchQuery.trim() ||
            hw.title.toLowerCase().includes(homeworkSearchQuery.toLowerCase()) ||
            (hw.description && hw.description.toLowerCase().includes(homeworkSearchQuery.toLowerCase())) ||
            hw.assignedBy.toLowerCase().includes(homeworkSearchQuery.toLowerCase());
          return matchesFilter && matchesSearch;
        })
        .sort((a, b) => {
          const dateA = Date.parse(a.assignedDate || a.dueDate || '') || 0;
          const dateB = Date.parse(b.assignedDate || b.dueDate || '') || 0;
          return dateB - dateA;
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

  // ── Render Chapter Item ────────────────────────────────────────────
  const renderChapterItem = (chapter: Chapter) => {
    const isExpanded = !!expandedChapters[chapter.id];
    const isCompleted = !!chapter.endDate || chapter.timelineStatus === 'COMPLETED';
    const isStarted = !!chapter.startDate || chapter.timelineStatus === 'RUNNING';

    // Real-time dynamic calculation of chapter taught percentage
    let totalItems = 0;
    let completedItems = 0;
    chapter.topics.forEach((t) => {
      const tDone =
        !!t.completedDate ||
        !!t.endDate ||
        t.timelineStatus === 'COMPLETED' ||
        t.timelineStatus === 'COMPLETED_VIA_PARENT';
      if (t.subTopics && t.subTopics.length > 0) {
        t.subTopics.forEach((s) => {
          totalItems += 1;
          if (
            tDone ||
            !!s.completedDate ||
            !!s.endDate ||
            s.timelineStatus === 'COMPLETED' ||
            s.timelineStatus === 'COMPLETED_VIA_PARENT'
          ) {
            completedItems += 1;
          }
        });
      } else {
        totalItems += 1;
        if (tDone) completedItems += 1;
      }
    });

    const chapterProgress = isCompleted
      ? 100
      : totalItems > 0
      ? Math.round((completedItems / totalItems) * 100)
      : chapter.completionPercentage || 0;

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
              <View style={styles.tlTitleRow}>
                <Text style={[styles.chapterTitle, { flex: 1 }]}>
                  {chapter.chapterNumber}. {chapter.title}
                </Text>

                {/* Chapter Dates & Right Status Icon */}
                <View style={styles.tlRightSection}>
                  {/* Start / End Date Display */}
                  {chapter.startDate ? (
                    <TouchableOpacity
                      style={styles.tlDateBadge}
                      onPress={() => openHistory(chapter.id, null, null, chapter.title, 'Chapter')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tlDateText}>{formatDateShort(chapter.startDate)}</Text>
                    </TouchableOpacity>
                  ) : isTimelineMode && !chapter.endDate ? (
                    <TouchableOpacity
                      style={styles.tlSetBtn}
                      onPress={() => handleSetChapterStart(chapter.id, chapter.title)}
                      activeOpacity={0.7}
                    >
                      <CalendarDays size={10} color={C.primary} />
                      <Text style={styles.tlSetBtnText}>Start</Text>
                    </TouchableOpacity>
                  ) : null}

                  {chapter.startDate && <Text style={styles.tlDateSep}>–</Text>}

                  {chapter.endDate ? (
                    <TouchableOpacity
                      style={styles.tlDateBadge}
                      onPress={() => openHistory(chapter.id, null, null, chapter.title, 'Chapter')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.tlDateText}>{formatDateShort(chapter.endDate)}</Text>
                    </TouchableOpacity>
                  ) : chapter.startDate && !chapter.endDate ? (
                    isTimelineMode ? (
                      <TouchableOpacity
                        style={styles.tlSetBtn}
                        onPress={() => handleSetChapterEnd(chapter.id, chapter.title, chapter.startDate)}
                        activeOpacity={0.7}
                      >
                        <CalendarDays size={10} color={C.success} />
                        <Text style={[styles.tlSetBtnText, { color: C.success }]}>End</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.tlRunningBadge}>
                        <Text style={styles.tlRunningText}>Running</Text>
                      </View>
                    )
                  ) : null}

                  {/* Right Status Icon: CheckCircle2 if completed, Circle if uncompleted */}
                  {isCompleted ? (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => openHistory(chapter.id, null, null, chapter.title, 'Chapter')}
                    >
                      <CheckCircle2 size={16} color={C.success} strokeWidth={2.2} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={isTimelineMode ? 0.7 : 1}
                      onPress={() => {
                        if (isTimelineMode) {
                          if (!chapter.startDate) {
                            handleSetChapterStart(chapter.id, chapter.title);
                          } else if (!chapter.endDate) {
                            handleSetChapterEnd(chapter.id, chapter.title, chapter.startDate);
                          }
                        }
                      }}
                    >
                      <Circle size={16} color="#CBD5E1" strokeWidth={2} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

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
                      ? `${chapterProgress}% Taught`
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
                    <Paperclip size={11} color="#059669" />
                    <Text style={[styles.materialsChipText, { color: '#059669' }]}>
                      {chapter.materials.length} Resources
                    </Text>
                  </TouchableOpacity>
                )}

                {chapter.homeworks && chapter.homeworks.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.materialsChip, { backgroundColor: '#F3E8FF' }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      openHomeworkModal(chapter);
                    }}
                  >
                    <PenTool size={11} color="#7C3AED" />
                    <Text style={[styles.materialsChipText, { color: '#7C3AED' }]}>
                      {chapter.homeworks.length} Homework
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

              {chapter.topics.map((topic, tIdx) => {
                const topicDate = topic.completedDate || topic.endDate;
                const topicCompleted =
                  !!topicDate ||
                  topic.timelineStatus === 'COMPLETED' ||
                  topic.timelineStatus === 'COMPLETED_VIA_PARENT';

                return (
                  <View key={topic.id} style={styles.topicBlock}>
                    {/* Topic Header */}
                    <View style={styles.topicRow}>
                      <Text
                        style={[
                          styles.topicTitle,
                          topicCompleted && styles.completedText,
                        ]}
                      >
                        {chapter.chapterNumber}.{tIdx + 1} {topic.title}
                      </Text>

                      {/* Topic Dates & Right Status Icon */}
                      <View style={styles.tlRightSection}>
                        {topicDate ? (
                          <TouchableOpacity
                            style={styles.tlDateBadge}
                            onPress={() => openHistory(chapter.id, topic.id, null, topic.title, 'Topic')}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.tlDateText}>{formatDateShort(topicDate)}</Text>
                          </TouchableOpacity>
                        ) : isTimelineMode ? (
                          <TouchableOpacity
                            style={styles.tlSetBtn}
                            onPress={() =>
                              handleSetTopicDone(chapter.id, topic.id, topic.title, chapter.startDate)
                            }
                            activeOpacity={0.7}
                          >
                            <CalendarDays size={10} color={chapter.startDate ? C.success : C.textMuted} />
                            <Text
                              style={[
                                styles.tlSetBtnText,
                                { color: chapter.startDate ? C.success : C.textMuted },
                              ]}
                            >
                              Done
                            </Text>
                          </TouchableOpacity>
                        ) : null}

                        {/* Status Icon */}
                        {topicCompleted ? (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => openHistory(chapter.id, topic.id, null, topic.title, 'Topic')}
                          >
                            <CheckCircle2 size={16} color={C.success} strokeWidth={2.2} />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            activeOpacity={isTimelineMode ? 0.7 : 1}
                            onPress={() => {
                              if (isTimelineMode) {
                                handleSetTopicDone(chapter.id, topic.id, topic.title, chapter.startDate);
                              }
                            }}
                          >
                            <Circle size={16} color="#CBD5E1" strokeWidth={2} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Sub-topics Tree */}
                    {topic.subTopics && topic.subTopics.length > 0 && (
                      <View style={styles.subTopicsList}>
                        {topic.subTopics.map((subTopic) => {
                          const subDate = subTopic.completedDate || subTopic.endDate;
                          const subCompleted =
                            !!subDate ||
                            subTopic.timelineStatus === 'COMPLETED' ||
                            subTopic.timelineStatus === 'COMPLETED_VIA_PARENT';

                          return (
                            <View key={subTopic.id} style={styles.subTopicRow}>
                              <View style={styles.treeConnector} />
                              <Text
                                style={[
                                  styles.subTopicTitle,
                                  subCompleted && styles.completedText,
                                ]}
                              >
                                {subTopic.title}
                              </Text>

                              {/* Subtopic Dates & Right Status Icon */}
                              <View style={styles.tlRightSection}>
                                {subDate ? (
                                  <TouchableOpacity
                                    style={styles.tlDateBadge}
                                    onPress={() =>
                                      openHistory(chapter.id, topic.id, subTopic.id, subTopic.title, 'Subtopic')
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <Text style={styles.tlDateText}>{formatDateShort(subDate)}</Text>
                                  </TouchableOpacity>
                                ) : isTimelineMode ? (
                                  <TouchableOpacity
                                    style={styles.tlSetBtn}
                                    onPress={() =>
                                      handleSetSubTopicDone(
                                        chapter.id,
                                        topic.id,
                                        subTopic.id,
                                        subTopic.title,
                                        chapter.startDate
                                      )
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <CalendarDays size={10} color={chapter.startDate ? C.success : C.textMuted} />
                                    <Text
                                      style={[
                                        styles.tlSetBtnText,
                                        { color: chapter.startDate ? C.success : C.textMuted },
                                      ]}
                                    >
                                      Done
                                    </Text>
                                  </TouchableOpacity>
                                ) : null}

                                {/* Status Icon */}
                                {subCompleted ? (
                                  <TouchableOpacity
                                    activeOpacity={0.7}
                                    onPress={() =>
                                      openHistory(chapter.id, topic.id, subTopic.id, subTopic.title, 'Subtopic')
                                    }
                                  >
                                    <CheckCircle2 size={14} color={C.success} strokeWidth={2.2} />
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity
                                    activeOpacity={isTimelineMode ? 0.7 : 1}
                                    onPress={() => {
                                      if (isTimelineMode) {
                                        handleSetSubTopicDone(
                                          chapter.id,
                                          topic.id,
                                          subTopic.id,
                                          subTopic.title,
                                          chapter.startDate
                                        );
                                      }
                                    }}
                                  >
                                    <Circle size={14} color="#CBD5E1" strokeWidth={2} />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Chapter Footer Actions: Attached Resource & Homework Buttons */}
            <View style={styles.chapterFooterActionsRow}>
              {/* Attached Resource Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.chapterActionPill,
                  styles.resourceActionPill,
                  chapter.materials.length === 0 && styles.chapterActionPillEmpty,
                ]}
                onPress={() => openMaterialsModal(chapter)}
              >
                <View style={styles.chapterActionPillLeft}>
                  <View style={[styles.actionIconWrap, styles.resourceIconWrap]}>
                    <Paperclip size={13} color="#059669" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.resourceActionText} numberOfLines={1}>
                    Attached Resource
                  </Text>
                  <View style={[styles.actionCountBadge, styles.resourceCountBadge]}>
                    <Text style={styles.resourceCountText}>
                      {chapter.materials.length}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={13} color="#059669" strokeWidth={2.2} />
              </TouchableOpacity>

              {/* Homework Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.chapterActionPill,
                  styles.homeworkActionPill,
                  (!chapter.homeworks || chapter.homeworks.length === 0) &&
                    styles.chapterActionPillEmpty,
                ]}
                onPress={() => openHomeworkModal(chapter)}
              >
                <View style={styles.chapterActionPillLeft}>
                  <View style={[styles.actionIconWrap, styles.homeworkIconWrap]}>
                    <PenTool size={13} color="#7C3AED" strokeWidth={2.4} />
                  </View>
                  <Text style={styles.homeworkActionText} numberOfLines={1}>
                    Homework
                  </Text>
                  <View style={[styles.actionCountBadge, styles.homeworkCountBadge]}>
                    <Text style={styles.homeworkCountText}>
                      {chapter.homeworks ? chapter.homeworks.length : 0}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={13} color="#7C3AED" strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Dynamic progress calculation based on actual timeline completion
  const allBookChapters = activeBook.parts
    ? activeBook.parts.flatMap((p) => p.chapters)
    : activeBook.directChapters || [];
  const taughtChaptersCount = allBookChapters.filter(
    (c) => !!c.endDate || c.timelineStatus === 'COMPLETED'
  ).length;
  const totalChaptersCount = allBookChapters.length || activeBook.totalChapters;
  const dynamicProgressPct =
    totalChaptersCount > 0 ? Math.round((taughtChaptersCount / totalChaptersCount) * 100) : 0;

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
            {activeSubject.subjectName} · {totalChaptersCount} Chapters
          </Text>
        </View>

        {/* Header Right Space (balances back button for perfect centering) */}
        <View style={styles.headerRightSpace} />
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
                {taughtChaptersCount} of {totalChaptersCount} Chapters Taught ({dynamicProgressPct}%)
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${dynamicProgressPct}%`,
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

      {/* ─── Chapter Attached Resources Bottom Sheet / Modal ───────── */}
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
                <View style={styles.sheetTitleWrap}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    Chapter {activeMaterialChapter?.chapterNumber}: {activeMaterialChapter?.title}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {activeMaterialChapter?.materials?.[0]?.uploadedBy || activeSubject?.leadTeacher || 'Ms. Priya Singh'}
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
                  placeholder="Search attached notes, videos, PDFs, links..."
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
              {(['all', 'pdf', 'video', 'link'] as const).map((filterKey) => {
                const isActive = materialFilter === filterKey;
                const labels: Record<string, string> = {
                  all: 'All Files',
                  pdf: 'PDFs',
                  video: 'Videos',
                  link: 'Links',
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
                  <ChapterMaterialCard key={mat.id} item={mat} />
                ))
              ) : (
                <View style={styles.emptyMaterialsState}>
                  <Paperclip size={32} color={C.textMuted} />
                  <Text style={styles.emptyMaterialsTitle}>No Resources Attached</Text>
                  <Text style={styles.emptyMaterialsSub}>
                    Try adjusting your search or upload materials tagged to this chapter.
                  </Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── Chapter Homework Bottom Sheet / Modal ────────────────────── */}
      <Modal
        visible={!!activeHomeworkChapter}
        transparent
        animationType="slide"
        onRequestClose={closeHomeworkModal}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={closeHomeworkModal}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <View style={styles.modalDragHandle} />

            {/* Header */}
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={styles.sheetTitleWrap}>
                  <Text style={styles.sheetTitle} numberOfLines={1}>
                    Chapter {activeHomeworkChapter?.chapterNumber}: {activeHomeworkChapter?.title}
                  </Text>
                  <Text style={styles.sheetSubtitle}>
                    {activeHomeworkChapter?.homeworks?.[0]?.assignedBy || activeSubject?.leadTeacher || 'Ms. Priya Singh'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={closeHomeworkModal}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarWrap}>
              <View style={styles.searchBar}>
                <Search size={16} color={C.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search attached notes, videos, PDFs, links..."
                  placeholderTextColor={C.textMuted}
                  value={homeworkSearchQuery}
                  onChangeText={setHomeworkSearchQuery}
                />
                {homeworkSearchQuery ? (
                  <TouchableOpacity onPress={() => setHomeworkSearchQuery('')}>
                    <X size={16} color={C.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Homework Filter Chips: All Files, PDFs, Videos, Links */}
            <View style={styles.filterChipsRow}>
              {(['all', 'pdf', 'video', 'link'] as const).map((filterKey) => {
                const isActive = homeworkFilter === filterKey;
                const labels: Record<string, string> = {
                  all: 'All Files',
                  pdf: 'PDFs',
                  video: 'Videos',
                  link: 'Links',
                };
                return (
                  <TouchableOpacity
                    key={filterKey}
                    activeOpacity={0.8}
                    style={[
                      styles.filterChip,
                      isActive ? styles.homeworkFilterChipActive : styles.filterChipInactive,
                    ]}
                    onPress={() => setHomeworkFilter(filterKey)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        isActive
                          ? styles.homeworkFilterChipTextActive
                          : styles.filterChipTextInactive,
                      ]}
                    >
                      {labels[filterKey]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Homework List */}
            <ScrollView
              style={styles.materialsList}
              contentContainerStyle={styles.materialsListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredHomeworks.length > 0 ? (
                filteredHomeworks.map((hw) => (
                  <ChapterHomeworkCard key={hw.id} item={hw} />
                ))
              ) : (
                <View style={styles.emptyHomeworkState}>
                  <PenTool size={30} color="#7C3AED" />
                  <Text style={styles.emptyMaterialsTitle}>No Homework Assigned</Text>
                  <Text style={styles.emptyMaterialsSub}>
                    Any homework assigned and tagged to Chapter {activeHomeworkChapter?.chapterNumber} will automatically appear here.
                  </Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Syllabus Timeline — Date Picker Modal */}
      <TimelineDatePicker
        visible={datePickerVisible}
        title={datePickerTitle}
        minDate={datePickerMinDate}
        onSelect={(dateKey) => {
          if (datePickerCallback) datePickerCallback(dateKey);
        }}
        onClose={() => {
          setDatePickerVisible(false);
          setDatePickerCallback(null);
        }}
      />

      {/* Syllabus Timeline — Auto-Complete Confirmation Dialog */}
      <AutoCompleteDialog
        visible={autoCompleteVisible}
        parentType={autoCompleteInfo?.parentType || 'topic'}
        parentName={autoCompleteInfo?.parentName || ''}
        childType={autoCompleteInfo?.childType || 'subtopics'}
        endDate={autoCompleteInfo?.endDate || ''}
        onConfirm={handleConfirmAutoComplete}
        onCancel={() => {
          setAutoCompleteVisible(false);
          setAutoCompleteInfo(null);
        }}
      />

      {/* Syllabus Timeline — History Modal */}
      <TimelineHistoryModal
        visible={historyVisible}
        nodeName={historyNodeName}
        nodeType={historyNodeType}
        entries={historyEntries}
        onClose={() => setHistoryVisible(false)}
      />

      {/* Floating Action Button (FAB) for Syllabus Timeline */}
      <SyllabusTimelineButton
        isActive={isTimelineMode}
        onToggle={() => setIsTimelineMode((v) => !v)}
      />
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
  headerRightSpace: {
    width: 38,
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

  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
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
    flex: 1,
  },

  // Chapter Footer Dual Action Pills (Attached Resource & Homework)
  chapterFooterActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  chapterActionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  resourceActionPill: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  homeworkActionPill: {
    backgroundColor: '#FAF5FF',
    borderColor: '#DDD6FE',
  },
  chapterActionPillEmpty: {
    opacity: 0.85,
  },
  chapterActionPillLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 4,
  },
  actionIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceIconWrap: {
    backgroundColor: '#D1FAE5',
  },
  homeworkIconWrap: {
    backgroundColor: '#EDE9FE',
  },
  resourceActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#047857',
    flexShrink: 1,
  },
  homeworkActionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6D28D9',
    flexShrink: 1,
  },
  actionCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 8,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCountBadge: {
    backgroundColor: '#D1FAE5',
  },
  homeworkCountBadge: {
    backgroundColor: '#EDE9FE',
  },
  resourceCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  homeworkCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
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
  resourceModalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeworkModalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitleWrap: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: C.text,
  },
  sheetSubtitle: {
    fontSize: 11.5,
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
  chapterResourceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chapterHomeworkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  crCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  crMaterialTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },
  crTopRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
    alignSelf: 'flex-start',
  },
  crDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  crDateText: {
    fontSize: 10.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  crChevronIndicator: {
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crDescriptionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  crDescriptionWrapExpanded: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 7,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  crDescriptionText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  crDescriptionTextExpanded: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  crExpandHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 6,
  },
  crExpandHintTextPurple: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
    marginLeft: 6,
  },
  crCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  crMetaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crMetaPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  crMetaPillText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  crActionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  crPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  crPreviewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  crDownloadIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 7,
  },
  crDownloadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
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
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // ── Homework Modal Styles ───────────────────────────────────────────
  homeworkFilterChipActive: {
    backgroundColor: '#7C3AED',
  },
  homeworkFilterChipTextActive: {
    color: '#ffffff',
  },
  homeworkCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  hwCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hwClassBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hwClassBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  hwStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hwStatusActive: {
    backgroundColor: '#D1FAE5',
  },
  hwStatusScheduled: {
    backgroundColor: '#EDE9FE',
  },
  hwStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  hwStatusActiveText: {
    color: '#047857',
  },
  hwStatusScheduledText: {
    color: '#6D28D9',
  },
  hwCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  hwCardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  hwMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 2,
  },
  hwMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hwMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  hwAttachmentsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
  },
  hwAttachmentsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  hwAttachmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hwAttachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  hwAttachmentChipText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    maxWidth: 160,
  },
  hwCardFooter: {
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  hwSubmissionStats: {
    gap: 4,
  },
  hwSubmissionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  hwProgressBarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  hwProgressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: 3,
  },
  emptyHomeworkState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
  },
  emptyHomeworkIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  // ── Syllabus Timeline Styles ────────────────────────────────────────
  tlTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tlRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  tlDateBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tlDateText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tlDateSep: {
    fontSize: 9,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  tlRunningBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tlRunningText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D97706',
  },
  tlSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tlSetBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#7C3AED',
  },
});
