import React, { useState, useMemo, useRef } from 'react';
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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit3,
  Pencil,
  ArrowUp,
  ArrowDown,
  BookOpen,
  BookMarked,
  Layers,
  FileText,
  Eye,
  Check,
  X,
  Sparkles,
  Info,
  AlertTriangle,
} from 'lucide-react-native';
import {
  CurriculumStore,
  useCurriculumStore,
} from '@/data/curriculumStore';
import {
  SubjectCurriculumData,
  Book,
  Part,
  Chapter,
  Topic,
  SubTopic,
} from '@/data/curriculumData';

type ModalType =
  | 'add-subject'
  | 'add-book'
  | 'add-part'
  | 'add-chapter'
  | 'add-topic'
  | 'add-subtopic'
  | 'edit-book'
  | 'edit-part'
  | 'edit-chapter'
  | 'edit-topic'
  | 'edit-subtopic';

type DeleteTarget = {
  type: 'book' | 'part' | 'chapter' | 'topic' | 'subtopic';
  badgeLabel: string;
  title: string;
  subtitle: string;
  itemCountDesc?: string;
  onConfirm: () => void;
};

export default function CurriculumBuilderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const curriculumData = useCurriculumStore();

  // Custom Delete Modal state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Subject Dropdown state
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  // Active selections
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    curriculumData[0]?.id || 'subj-math'
  );
  const [selectedBookId, setSelectedBookId] = useState<string>(
    curriculumData[0]?.books[0]?.id || 'book-ncert-math'
  );

  // Accordion states
  const [expandedParts, setExpandedParts] = useState<Record<string, boolean>>({
    'part-1': true,
  });
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'ch-1': true,
    'ch-2': true,
  });

  // Modal form states
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [targetBookId, setTargetBookId] = useState<string | null>(null);
  const [targetPartId, setTargetPartId] = useState<string | null>(null);
  const [targetPartTitle, setTargetPartTitle] = useState<string>('');
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const [targetChapterNumber, setTargetChapterNumber] = useState<number>(1);
  const [targetTopicId, setTargetTopicId] = useState<string | null>(null);
  const [targetTopicTitle, setTargetTopicTitle] = useState<string>('');
  const [targetSubTopicId, setTargetSubTopicId] = useState<string | null>(null);

  // Input ref for instant keyboard activation
  const titleInputRef = useRef<TextInput>(null);

  // View vs Edit Mode for Curriculum Canvas
  const [isEditMode, setIsEditMode] = useState(false);

  // Form Inputs
  const [inputTitle, setInputTitle] = useState('');
  const [inputSubtitle, setInputSubtitle] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [inputGrade, setInputGrade] = useState('Grade 10');
  const [bookHasParts, setBookHasParts] = useState(false);

  // Resolved active subject and book
  const activeSubject: SubjectCurriculumData = useMemo(() => {
    return (
      curriculumData.find((s) => s.id === selectedSubjectId) ||
      curriculumData[0] || {
        id: 'default',
        subjectName: 'Mathematics',
        subjectCode: 'MATH-101',
        grade: 'Grade 10',
        leadTeacher: 'Faculty Lead',
        overallProgress: 0,
        totalBooks: 0,
        totalChapters: 0,
        completedChapters: 0,
        totalMaterials: 0,
        books: [],
      }
    );
  }, [curriculumData, selectedSubjectId]);

  const activeBook: Book | undefined = useMemo(() => {
    return (
      activeSubject.books.find((b) => b.id === selectedBookId) ||
      activeSubject.books[0]
    );
  }, [activeSubject, selectedBookId]);

  // Handlers for accordions
  const togglePart = (partId: string) => {
    setExpandedParts((prev) => ({ ...prev, [partId]: !prev[partId] }));
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  // Open modal helpers
  const openAddSubject = () => {
    setInputTitle('');
    setInputCode('');
    setInputGrade('Grade 10');
    setModalType('add-subject');
  };

  const openAddBook = () => {
    setInputTitle('');
    setInputSubtitle('');
    setBookHasParts(false);
    setModalType('add-book');
    setTimeout(() => titleInputRef.current?.focus(), 80);
  };

  const openAddPart = () => {
    setInputTitle('');
    setInputSubtitle('');
    setModalType('add-part');
  };

  const openAddChapter = (partId: string | null, partTitle?: string) => {
    setTargetPartId(partId);
    setTargetPartTitle(partTitle || '');
    setInputTitle('');
    setInputSubtitle('');
    setModalType('add-chapter');
  };

  const openAddTopic = (
    partId: string | null,
    chapterId: string,
    chapterNumber?: number
  ) => {
    setTargetPartId(partId);
    setTargetChapterId(chapterId);
    setTargetChapterNumber(chapterNumber || 1);
    setInputTitle('');
    setModalType('add-topic');
  };

  const openAddSubTopic = (
    partId: string | null,
    chapterId: string,
    topicId: string,
    topicTitle?: string
  ) => {
    setTargetPartId(partId);
    setTargetChapterId(chapterId);
    setTargetTopicId(topicId);
    setTargetTopicTitle(topicTitle || '');
    setInputTitle('');
    setModalType('add-subtopic');
  };

  // Open Edit modal helpers with instant keyboard focus
  const openEditBook = (book: Book) => {
    setTargetBookId(book.id);
    setInputTitle(book.title);
    setInputSubtitle(book.publisher || '');
    setModalType('edit-book');
    setTimeout(() => titleInputRef.current?.focus(), 80);
  };

  const openEditPart = (part: Part) => {
    setTargetPartId(part.id);
    setInputTitle(
      part.title.replace(/^Part\s+[IVX0-9]+[:\s-]*/i, '').trim() || part.title
    );
    setInputSubtitle('');
    setModalType('edit-part');
    setTimeout(() => titleInputRef.current?.focus(), 80);
  };

  const openEditChapter = (partId: string | null, chapter: Chapter) => {
    setTargetPartId(partId);
    setTargetChapterId(chapter.id);
    setTargetChapterNumber(chapter.chapterNumber);
    setInputTitle(chapter.title);
    setInputSubtitle('');
    setModalType('edit-chapter');
    setTimeout(() => titleInputRef.current?.focus(), 80);
  };

  const openEditTopic = (
    partId: string | null,
    chapterId: string,
    topic: Topic
  ) => {
    setTargetPartId(partId);
    setTargetChapterId(chapterId);
    setTargetTopicId(topic.id);
    setInputTitle(topic.title);
    setModalType('edit-topic');
    setTimeout(() => titleInputRef.current?.focus(), 80);
  };

  const openEditSubTopic = (
    partId: string | null,
    chapterId: string,
    topicId: string,
    subTopic: SubTopic
  ) => {
    setTargetPartId(partId);
    setTargetChapterId(chapterId);
    setTargetTopicId(topicId);
    setTargetSubTopicId(subTopic.id);
    setInputTitle(subTopic.title);
    setModalType('edit-subtopic');
    setTimeout(() => titleInputRef.current?.focus(), 80);
  };

  const closeModal = () => {
    titleInputRef.current?.blur();
    setModalType(null);
    setInputTitle('');
    setInputSubtitle('');
    setInputCode('');
    setTargetBookId(null);
    setTargetPartId(null);
    setTargetPartTitle('');
    setTargetChapterId(null);
    setTargetTopicId(null);
    setTargetTopicTitle('');
    setTargetSubTopicId(null);
  };

  // Modal Meta configuration for modern header styling
  const modalMeta = useMemo(() => {
    switch (modalType) {
      case 'edit-book':
        return {
          badge: 'TEXTBOOK',
          title: 'Edit Book Details',
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          label: 'Book Name',
        };
      case 'edit-part':
        return {
          badge: 'PART / MODULE',
          title: 'Edit Part Title',
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          label: 'Part Title',
        };
      case 'edit-chapter':
        return {
          badge: 'CHAPTER',
          title: `Edit Chapter ${targetChapterNumber}`,
          iconBg: '#ECFDF5',
          iconColor: '#059669',
          label: 'Chapter Title',
        };
      case 'edit-topic':
        return {
          badge: 'TOPIC',
          title: 'Edit Topic Title',
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          label: 'Topic Title',
        };
      case 'edit-subtopic':
        return {
          badge: 'SUB-TOPIC',
          title: 'Edit Sub-topic Title',
          iconBg: '#F1F5F9',
          iconColor: '#475569',
          label: 'Sub-topic Title',
        };
      case 'add-subject':
        return {
          badge: 'NEW SUBJECT',
          title: 'Add New Subject',
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          label: 'Subject Name',
        };
      case 'add-book':
        return {
          badge: 'NEW BOOK',
          title: 'Add Textbook',
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          label: 'Book Name',
        };
      case 'add-part':
        return {
          badge: 'NEW PART',
          title: 'Add New Part',
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          label: 'Part Title',
        };
      case 'add-chapter':
        return {
          badge: 'NEW CHAPTER',
          title: targetPartTitle
            ? `Add Chapter to ${targetPartTitle}`
            : 'Add New Chapter',
          iconBg: '#ECFDF5',
          iconColor: '#059669',
          label: 'Chapter Title',
        };
      case 'add-topic':
        return {
          badge: 'NEW TOPIC',
          title: `Add Topic to Chapter ${targetChapterNumber}`,
          iconBg: '#EEF2FF',
          iconColor: '#4F46E5',
          label: 'Topic Title',
        };
      case 'add-subtopic':
        return {
          badge: 'NEW SUB-TOPIC',
          title: targetTopicTitle
            ? `Add Sub-topic to "${targetTopicTitle}"`
            : 'Add Sub-topic',
          iconBg: '#F1F5F9',
          iconColor: '#475569',
          label: 'Sub-topic Title',
        };
      default:
        return null;
    }
  }, [modalType, targetChapterNumber, targetPartTitle, targetTopicTitle]);

  // Submit Modal Action
  const handleSaveModal = () => {
    if (!inputTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a title to continue.');
      return;
    }

    if (modalType === 'add-subject') {
      const newSubj = CurriculumStore.addSubject({
        name: inputTitle.trim(),
        code: inputCode.trim() || 'SUBJ-101',
        grade: inputGrade,
        leadTeacher: 'Faculty Lead',
      });
      setSelectedSubjectId(newSubj.id);
      closeModal();
    } else if (modalType === 'add-book') {
      const newBook = CurriculumStore.addBook(activeSubject.id, {
        title: inputTitle.trim(),
        publisher: inputSubtitle.trim() || 'Official Curriculum',
        edition: '2026 Academic Year',
        hasParts: bookHasParts,
      });
      if (newBook) {
        setSelectedBookId(newBook.id);
      }
      closeModal();
    } else if (modalType === 'add-part') {
      if (activeBook) {
        const newPart = CurriculumStore.addPart(activeSubject.id, activeBook.id, {
          title: inputTitle.trim(),
          description: inputSubtitle.trim(),
        });
        if (newPart) {
          setExpandedParts((prev) => ({ ...prev, [newPart.id]: true }));
        }
      }
      closeModal();
    } else if (modalType === 'add-chapter') {
      if (activeBook) {
        const newCh = CurriculumStore.addChapter(activeSubject.id, activeBook.id, targetPartId, {
          title: inputTitle.trim(),
          description: inputSubtitle.trim(),
        });
        if (newCh) {
          setExpandedChapters((prev) => ({ ...prev, [newCh.id]: true }));
          if (targetPartId) {
            setExpandedParts((prev) => ({ ...prev, [targetPartId]: true }));
          }
        }
      }
      closeModal();
    } else if (modalType === 'add-topic') {
      if (activeBook && targetChapterId) {
        CurriculumStore.addTopic(
          activeSubject.id,
          activeBook.id,
          targetPartId,
          targetChapterId,
          inputTitle.trim()
        );
        setExpandedChapters((prev) => ({ ...prev, [targetChapterId]: true }));
      }
      closeModal();
    } else if (modalType === 'add-subtopic') {
      if (activeBook && targetChapterId && targetTopicId) {
        CurriculumStore.addSubTopic(
          activeSubject.id,
          activeBook.id,
          targetPartId,
          targetChapterId,
          targetTopicId,
          inputTitle.trim()
        );
        setExpandedChapters((prev) => ({ ...prev, [targetChapterId]: true }));
      }
      closeModal();
    } else if (modalType === 'edit-book') {
      if (targetBookId) {
        CurriculumStore.updateBook(activeSubject.id, targetBookId, {
          title: inputTitle.trim(),
          publisher: inputSubtitle.trim() || 'School Curriculum',
        });
      }
      closeModal();
    } else if (modalType === 'edit-part') {
      if (activeBook && targetPartId) {
        CurriculumStore.updatePart(
          activeSubject.id,
          activeBook.id,
          targetPartId,
          {
            title: inputTitle.trim(),
          }
        );
      }
      closeModal();
    } else if (modalType === 'edit-chapter') {
      if (activeBook && targetChapterId) {
        CurriculumStore.updateChapter(
          activeSubject.id,
          activeBook.id,
          targetPartId,
          targetChapterId,
          {
            title: inputTitle.trim(),
            chapterNumber: targetChapterNumber,
          }
        );
      }
      closeModal();
    } else if (modalType === 'edit-topic') {
      if (activeBook && targetChapterId && targetTopicId) {
        CurriculumStore.updateTopic(
          activeSubject.id,
          activeBook.id,
          targetPartId,
          targetChapterId,
          targetTopicId,
          {
            title: inputTitle.trim(),
          }
        );
      }
      closeModal();
    } else if (modalType === 'edit-subtopic') {
      if (activeBook && targetChapterId && targetTopicId && targetSubTopicId) {
        CurriculumStore.updateSubTopic(
          activeSubject.id,
          activeBook.id,
          targetPartId,
          targetChapterId,
          targetTopicId,
          targetSubTopicId,
          {
            title: inputTitle.trim(),
          }
        );
      }
      closeModal();
    }
  };

  // ── Custom Delete Confirmation Handlers ────────────────────────────
  const confirmDeleteBook = (book: Book) => {
    setDeleteTarget({
      type: 'book',
      badgeLabel: 'Textbook',
      title: book.title,
      subtitle: `Are you sure you want to remove this textbook from ${activeSubject.subjectName}?`,
      itemCountDesc: book.parts
        ? `${book.parts.length} structured Parts and all contained chapters will be permanently removed.`
        : `${(book.directChapters || []).length} Chapters will be permanently removed.`,
      onConfirm: () => {
        CurriculumStore.deleteBook(activeSubject.id, book.id);
        const remaining = activeSubject.books.filter((b) => b.id !== book.id);
        if (remaining.length > 0) {
          setSelectedBookId(remaining[0].id);
        }
        setDeleteTarget(null);
      },
    });
  };

  const confirmDeletePart = (part: Part) => {
    setDeleteTarget({
      type: 'part',
      badgeLabel: 'Module / Part',
      title: part.title,
      subtitle: 'Are you sure you want to remove this structured part?',
      itemCountDesc: `All ${part.chapters.length} chapters inside this part will be deleted.`,
      onConfirm: () => {
        if (activeBook) {
          CurriculumStore.deletePart(activeSubject.id, activeBook.id, part.id);
        }
        setDeleteTarget(null);
      },
    });
  };

  const confirmDeleteChapter = (partId: string | null, chapter: Chapter) => {
    setDeleteTarget({
      type: 'chapter',
      badgeLabel: `Chapter ${chapter.chapterNumber}`,
      title: chapter.title,
      subtitle: 'Are you sure you want to delete this chapter from the syllabus?',
      itemCountDesc: `${(chapter.topics || []).length} learning topics and all micro-concepts will be deleted.`,
      onConfirm: () => {
        if (activeBook) {
          CurriculumStore.deleteChapter(activeSubject.id, activeBook.id, partId, chapter.id);
        }
        setDeleteTarget(null);
      },
    });
  };

  const confirmDeleteTopic = (partId: string | null, chapterId: string, topic: Topic) => {
    setDeleteTarget({
      type: 'topic',
      badgeLabel: 'Topic',
      title: topic.title,
      subtitle: 'Are you sure you want to remove this topic?',
      itemCountDesc: `${(topic.subTopics || []).length} sub-topic micro-concepts will also be removed.`,
      onConfirm: () => {
        if (activeBook) {
          CurriculumStore.deleteTopic(activeSubject.id, activeBook.id, partId, chapterId, topic.id);
        }
        setDeleteTarget(null);
      },
    });
  };

  const confirmDeleteSubTopic = (
    partId: string | null,
    chapterId: string,
    topicId: string,
    subTopic: SubTopic
  ) => {
    setDeleteTarget({
      type: 'subtopic',
      badgeLabel: 'Sub-topic',
      title: subTopic.title,
      subtitle: 'Are you sure you want to remove this sub-topic micro-concept?',
      itemCountDesc: 'This concept will be removed from student and teacher curriculum.',
      onConfirm: () => {
        if (activeBook) {
          CurriculumStore.deleteSubTopic(activeSubject.id, activeBook.id, partId, chapterId, topicId, subTopic.id);
        }
        setDeleteTarget(null);
      },
    });
  };

  // Render a Single Chapter and its Topics & Sub-topics
  const renderChapter = (
    chapter: Chapter,
    partId: string | null,
    chapterIdx: number = 0,
    totalChapters: number = 1
  ) => {
    const isExpanded = Boolean(expandedChapters[chapter.id]);
    const topicCount = (chapter.topics || []).length;
    const subTopicCount = (chapter.topics || []).flatMap((t) => t.subTopics || []).length;

    return (
      <View key={chapter.id} style={styles.chapterCard}>
        {/* Chapter Header Row */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.chapterHeader}
          onPress={() => toggleChapter(chapter.id)}
        >
          <View style={styles.chapterHeaderLeft}>
            <View style={styles.chBadge}>
              <Text style={styles.chBadgeText}>Ch {chapter.chapterNumber}</Text>
            </View>
            <View style={styles.chTitleWrap}>
              <Text style={styles.chTitle}>{chapter.title}</Text>
              <Text style={styles.chSub}>
                {topicCount} Topics · {subTopicCount} Sub-topics
              </Text>
            </View>
          </View>

          <View style={styles.chapterHeaderRight}>
            {isEditMode && totalChapters > 1 && (
              <View style={styles.reorderArrowsRow}>
                <TouchableOpacity
                  disabled={chapterIdx === 0}
                  style={[
                    styles.reorderArrowBtn,
                    chapterIdx === 0 && styles.reorderArrowBtnDisabled,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (chapterIdx > 0) {
                      CurriculumStore.moveChapter(
                        activeSubject.id,
                        activeBook.id,
                        partId,
                        chapterIdx,
                        'up'
                      );
                    }
                  }}
                  accessibilityLabel="Move Chapter Up"
                >
                  <ArrowUp
                    size={12}
                    color={chapterIdx === 0 ? '#CBD5E1' : '#475569'}
                    strokeWidth={2.4}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={chapterIdx === totalChapters - 1}
                  style={[
                    styles.reorderArrowBtn,
                    chapterIdx === totalChapters - 1 &&
                      styles.reorderArrowBtnDisabled,
                  ]}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    if (chapterIdx < totalChapters - 1) {
                      CurriculumStore.moveChapter(
                        activeSubject.id,
                        activeBook.id,
                        partId,
                        chapterIdx,
                        'down'
                      );
                    }
                  }}
                  accessibilityLabel="Move Chapter Down"
                >
                  <ArrowDown
                    size={12}
                    color={
                      chapterIdx === totalChapters - 1
                        ? '#CBD5E1'
                        : '#475569'
                    }
                    strokeWidth={2.4}
                  />
                </TouchableOpacity>
              </View>
            )}

            {isEditMode && (
              <TouchableOpacity
                style={styles.editIconBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  openEditChapter(partId, chapter);
                }}
                accessibilityLabel="Edit Chapter"
              >
                <Pencil size={13.5} color="#4F46E5" />
              </TouchableOpacity>
            )}

            {isEditMode && (
              <TouchableOpacity
                style={styles.trashIconBtn}
                onPress={(e) => {
                  e.stopPropagation?.();
                  confirmDeleteChapter(partId, chapter);
                }}
              >
                <Trash2 size={15} color="#EF4444" />
              </TouchableOpacity>
            )}

            <View style={styles.chevronWrap}>
              {isExpanded ? (
                <ChevronUp size={18} color="#6B7280" />
              ) : (
                <ChevronDown size={18} color="#6B7280" />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Chapter Expanded Body: Topics & Sub-topics */}
        {isExpanded && (
          <View style={styles.chapterBody}>
            {/* Topics list */}
            {(chapter.topics || []).length === 0 ? (
              <View style={styles.emptyTopicsBox}>
                <Text style={styles.emptyTopicsText}>
                  No topics added yet. Add topics to complete this chapter.
                </Text>
              </View>
            ) : (
              (chapter.topics || []).map((topic, topicIdx) => (
                <View key={topic.id} style={styles.topicCard}>
                  {/* Topic Header */}
                  <View style={styles.topicHeader}>
                    <View style={styles.topicHeaderLeft}>
                      <View style={styles.topicIndexBadge}>
                        <Text style={styles.topicIndexText}>
                          {chapter.chapterNumber}.{topicIdx + 1}
                        </Text>
                      </View>
                      <Text style={styles.topicTitle}>{topic.title}</Text>
                    </View>

                    <View style={styles.topicHeaderActions}>
                      {isEditMode && (
                        <TouchableOpacity
                          style={styles.addSubTopicBtn}
                          onPress={() =>
                            openAddSubTopic(partId, chapter.id, topic.id, topic.title)
                          }
                        >
                          <Plus size={12} color="#4F46E5" strokeWidth={2.5} />
                          <Text style={styles.addSubTopicBtnText}>Sub-topic</Text>
                        </TouchableOpacity>
                      )}

                      {isEditMode && (chapter.topics || []).length > 1 && (
                        <View style={styles.reorderArrowsRow}>
                          <TouchableOpacity
                            disabled={topicIdx === 0}
                            style={[
                              styles.reorderArrowBtnSmall,
                              topicIdx === 0 && styles.reorderArrowBtnDisabled,
                            ]}
                            onPress={() => {
                              if (topicIdx > 0) {
                                CurriculumStore.moveTopic(
                                  activeSubject.id,
                                  activeBook.id,
                                  partId,
                                  chapter.id,
                                  topicIdx,
                                  'up'
                                );
                              }
                            }}
                            accessibilityLabel="Move Topic Up"
                          >
                            <ArrowUp
                              size={11}
                              color={topicIdx === 0 ? '#CBD5E1' : '#475569'}
                              strokeWidth={2.4}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            disabled={
                              topicIdx === (chapter.topics || []).length - 1
                            }
                            style={[
                              styles.reorderArrowBtnSmall,
                              topicIdx === (chapter.topics || []).length - 1 &&
                                styles.reorderArrowBtnDisabled,
                            ]}
                            onPress={() => {
                              if (
                                topicIdx <
                                (chapter.topics || []).length - 1
                              ) {
                                CurriculumStore.moveTopic(
                                  activeSubject.id,
                                  activeBook.id,
                                  partId,
                                  chapter.id,
                                  topicIdx,
                                  'down'
                                );
                              }
                            }}
                            accessibilityLabel="Move Topic Down"
                          >
                            <ArrowDown
                              size={11}
                              color={
                                topicIdx ===
                                (chapter.topics || []).length - 1
                                  ? '#CBD5E1'
                                  : '#475569'
                              }
                              strokeWidth={2.4}
                            />
                          </TouchableOpacity>
                        </View>
                      )}

                      {isEditMode && (
                        <TouchableOpacity
                          style={styles.editIconBtn}
                          onPress={() =>
                            openEditTopic(partId, chapter.id, topic)
                          }
                          accessibilityLabel="Edit Topic"
                        >
                          <Pencil size={12.5} color="#4F46E5" />
                        </TouchableOpacity>
                      )}

                      {isEditMode && (
                        <TouchableOpacity
                          style={styles.trashIconBtn}
                          onPress={() =>
                            confirmDeleteTopic(partId, chapter.id, topic)
                          }
                        >
                          <Trash2 size={13} color="#9CA3AF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Sub-topics List */}
                  {(topic.subTopics || []).length > 0 && (
                    <View style={styles.subTopicsContainer}>
                      {(topic.subTopics || []).map((sub, subIdx) => (
                        <View key={sub.id} style={styles.subTopicRow}>
                          <View style={styles.subTopicLeft}>
                            <View style={styles.subTopicBullet} />
                            <Text style={styles.subTopicText}>
                              {chapter.chapterNumber}.{topicIdx + 1}.{subIdx + 1}{' '}
                              {sub.title}
                            </Text>
                          </View>

                          <View style={styles.subTopicActions}>
                            {isEditMode && (topic.subTopics || []).length > 1 && (
                              <View style={styles.reorderArrowsRow}>
                                <TouchableOpacity
                                  disabled={subIdx === 0}
                                  style={[
                                    styles.reorderArrowBtnMicro,
                                    subIdx === 0 &&
                                      styles.reorderArrowBtnDisabled,
                                  ]}
                                  onPress={() => {
                                    if (subIdx > 0) {
                                      CurriculumStore.moveSubTopic(
                                        activeSubject.id,
                                        activeBook.id,
                                        partId,
                                        chapter.id,
                                        topic.id,
                                        subIdx,
                                        'up'
                                      );
                                    }
                                  }}
                                  accessibilityLabel="Move Sub-topic Up"
                                >
                                  <ArrowUp
                                    size={10}
                                    color={
                                      subIdx === 0 ? '#CBD5E1' : '#64748B'
                                    }
                                    strokeWidth={2.4}
                                  />
                                </TouchableOpacity>

                                <TouchableOpacity
                                  disabled={
                                    subIdx === (topic.subTopics || []).length - 1
                                  }
                                  style={[
                                    styles.reorderArrowBtnMicro,
                                    subIdx ===
                                      (topic.subTopics || []).length - 1 &&
                                      styles.reorderArrowBtnDisabled,
                                  ]}
                                  onPress={() => {
                                    if (
                                      subIdx <
                                      (topic.subTopics || []).length - 1
                                    ) {
                                      CurriculumStore.moveSubTopic(
                                        activeSubject.id,
                                        activeBook.id,
                                        partId,
                                        chapter.id,
                                        topic.id,
                                        subIdx,
                                        'down'
                                      );
                                    }
                                  }}
                                  accessibilityLabel="Move Sub-topic Down"
                                >
                                  <ArrowDown
                                    size={10}
                                    color={
                                      subIdx ===
                                      (topic.subTopics || []).length - 1
                                        ? '#CBD5E1'
                                        : '#64748B'
                                    }
                                    strokeWidth={2.4}
                                  />
                                </TouchableOpacity>
                              </View>
                            )}

                            {isEditMode && (
                              <TouchableOpacity
                                style={styles.subTopicEditBtn}
                                onPress={() =>
                                  openEditSubTopic(partId, chapter.id, topic.id, sub)
                                }
                                accessibilityLabel="Edit Sub-topic"
                              >
                                <Pencil size={11.5} color="#4F46E5" />
                              </TouchableOpacity>
                            )}

                            {isEditMode && (
                              <TouchableOpacity
                                style={styles.subTopicDeleteBtn}
                                onPress={() =>
                                  confirmDeleteSubTopic(partId, chapter.id, topic.id, sub)
                                }
                              >
                                <X size={13} color="#9CA3AF" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}

            {/* Add Topic Action Button */}
            {isEditMode && (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.addTopicBtn}
                onPress={() => openAddTopic(partId, chapter.id, chapter.chapterNumber)}
              >
                <Plus size={14} color="#4F46E5" strokeWidth={2.5} />
                <Text style={styles.addTopicBtnText}>
                  Add Topic to Chapter {chapter.chapterNumber}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
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
          <Text style={styles.headerTitle}>Curriculum Studio</Text>
          <Text style={styles.headerSub}>Academic Hierarchy & Syllabus</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.previewBtn}
          onPress={() => router.push('/curriculum')}
          accessibilityLabel="Preview Student View"
        >
          <Eye size={15} color="#4F46E5" strokeWidth={2.2} />
          <Text style={styles.previewBtnText}>Preview</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Subject Selector (Dropdown) ───────────────────────── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Select Subject</Text>
            <View style={styles.subjectCountBadge}>
              <Text style={styles.subjectCountBadgeText}>
                {curriculumData.length} Subjects
              </Text>
            </View>
          </View>

          {/* Dropdown Trigger Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.subjectDropdownTrigger}
            onPress={() => setIsSubjectDropdownOpen(true)}
            accessibilityRole="combobox"
            accessibilityLabel={`Selected subject: ${activeSubject.subjectName}. Tap to change subject.`}
          >
            <View style={styles.subjectDropdownTriggerLeft}>
              <View style={styles.subjectDropdownIconWrap}>
                <BookOpen size={16} color="#4F46E5" strokeWidth={2.3} />
              </View>
              <View style={styles.subjectDropdownTextCol}>
                <Text style={styles.subjectDropdownTitle}>
                  {activeSubject.subjectName}
                </Text>
                <Text style={styles.subjectDropdownSub}>
                  {activeSubject.grade} · {activeSubject.subjectCode} · {activeSubject.books.length} Books
                </Text>
              </View>
            </View>

            <View style={styles.subjectDropdownChevronWrap}>
              <ChevronDown size={15} color="#4B5563" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── 2. Books Shelf ──────────────────────────────────────── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Books & Textbooks</Text>
            <View style={styles.subjectCountBadge}>
              <Text style={styles.subjectCountBadgeText}>
                {activeSubject.books.length} {activeSubject.books.length === 1 ? 'Book' : 'Books'}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.booksScroll}
          >
            {activeSubject.books.map((book) => {
              const isSelected = activeBook && book.id === activeBook.id;
              const hasParts = Boolean(book.parts && book.parts.length > 0);
              const chapterCount = book.parts
                ? book.parts.flatMap((p) => p.chapters).length
                : (book.directChapters || []).length;

              return (
                <TouchableOpacity
                  key={book.id}
                  activeOpacity={0.85}
                  style={[
                    styles.bookTabCard,
                    isSelected && styles.bookTabCardSelected,
                  ]}
                  onPress={() => setSelectedBookId(book.id)}
                >
                  <View
                    style={[
                      styles.bookTabIconWrap,
                      { backgroundColor: isSelected ? '#ffffff' : '#EEF2FF' },
                    ]}
                  >
                    <BookMarked
                      size={15}
                      color={isSelected ? '#4F46E5' : '#6B7280'}
                      strokeWidth={2.2}
                    />
                  </View>
                  <View style={styles.bookTabTextCol}>
                    <Text
                      style={[
                        styles.bookTabTitle,
                        isSelected && styles.bookTabTitleSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {book.title}
                    </Text>
                    <Text
                      style={[
                        styles.bookTabSub,
                        isSelected && styles.bookTabSubSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {book.publisher || 'School Curriculum'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Book Action Controls below the books shelf (Only in Edit Mode) */}
          {isEditMode && (
            <View style={styles.bookShelfFooterActions}>
              {activeBook && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.bookActionBtnSecondary}
                  onPress={() => openEditBook(activeBook)}
                  accessibilityLabel="Edit Book"
                >
                  <Pencil size={12.5} color="#334155" strokeWidth={2.2} />
                  <Text style={styles.bookActionBtnSecondaryText}>Edit Book</Text>
                </TouchableOpacity>
              )}

              {activeBook && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.bookActionBtnDestructive}
                  onPress={() => confirmDeleteBook(activeBook)}
                  accessibilityLabel="Delete Book"
                >
                  <Trash2 size={12.5} color="#DC2626" strokeWidth={2.2} />
                  <Text style={styles.bookActionBtnDestructiveText}>Delete</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.bookActionBtnPrimary}
                onPress={openAddBook}
                accessibilityLabel="Add Book"
              >
                <Plus size={13.5} color="#ffffff" strokeWidth={2.5} />
                <Text style={styles.bookActionBtnPrimaryText}>Add Book</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── 3. Curriculum Section (Bifurcated with View / Edit Mode) ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Curriculum</Text>

            {/* View / Edit Mode Toggle */}
            <View style={styles.modeTogglePill}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.modeTabBtn,
                  !isEditMode && styles.modeTabBtnActiveView,
                ]}
                onPress={() => setIsEditMode(false)}
                accessibilityRole="button"
                accessibilityLabel="Switch to View Mode"
              >
                <Eye
                  size={13}
                  color={!isEditMode ? '#0F172A' : '#64748B'}
                  strokeWidth={2.3}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    !isEditMode && styles.modeTabTextActiveView,
                  ]}
                >
                  View
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.modeTabBtn,
                  isEditMode && styles.modeTabBtnActiveEdit,
                ]}
                onPress={() => setIsEditMode(true)}
                accessibilityRole="button"
                accessibilityLabel="Switch to Edit Mode"
              >
                <Pencil
                  size={12}
                  color={isEditMode ? '#ffffff' : '#64748B'}
                  strokeWidth={2.3}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    isEditMode && styles.modeTabTextActiveEdit,
                  ]}
                >
                  Edit
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Book Structure Canvas (Parts vs Chapters) */}
          {activeBook ? (
            <View style={styles.canvasBlock}>
              {/* ── CASE A: Book HAS Parts ────────────────────────────── */}
              {activeBook.parts && activeBook.parts.length > 0 ? (
                <View style={styles.partsContainer}>
                  {/* Part Cards */}
                  {activeBook.parts.map((part) => {
                    const isSinglePart = (activeBook.parts || []).length === 1;
                    const isPartExpanded = isSinglePart
                      ? expandedParts[part.id] !== false
                      : Boolean(expandedParts[part.id]);

                    const displayTitle = isSinglePart
                      ? activeBook.title
                      : (part.title.replace(/^Part\s+[IVX0-9]+[:\s-]*/i, '').trim() || part.title);

                    const displaySubtitle = isSinglePart
                      ? `${part.chapters.length} Chapters · ${activeBook.publisher || 'School Curriculum'}`
                      : `${part.chapters.length} Chapters in this Part`;

                    return (
                      <View key={part.id} style={styles.partCard}>
                        {/* Part Card Header */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.partCardHeader}
                          onPress={() => togglePart(part.id)}
                        >
                          <View style={styles.partHeaderLeft}>
                            {!isSinglePart && (
                              <View style={styles.partNumeralBadge}>
                                <Text style={styles.partNumeralText}>
                                  Part {part.partNumber}
                                </Text>
                              </View>
                            )}
                            <View style={styles.partTitleWrap}>
                              <Text
                                style={[
                                  styles.partTitle,
                                  isSinglePart && styles.singlePartBookTitle,
                                ]}
                              >
                                {displayTitle}
                              </Text>
                              <Text style={styles.partSubtitle}>
                                {displaySubtitle}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.partHeaderRight}>
                            {isEditMode && (
                              <TouchableOpacity
                                style={styles.editIconBtn}
                                onPress={() =>
                                  isSinglePart
                                    ? openEditBook(activeBook)
                                    : openEditPart(part)
                                }
                                accessibilityLabel={
                                  isSinglePart ? 'Edit Book' : 'Edit Part'
                                }
                              >
                                <Pencil size={14} color="#4F46E5" />
                              </TouchableOpacity>
                            )}

                            {isEditMode && !isSinglePart && (
                              <TouchableOpacity
                                style={styles.trashIconBtn}
                                onPress={() => confirmDeletePart(part)}
                              >
                                <Trash2 size={15} color="#EF4444" />
                              </TouchableOpacity>
                            )}

                            <View style={styles.chevronWrap}>
                              {isPartExpanded ? (
                                <ChevronUp size={18} color="#6B7280" />
                              ) : (
                                <ChevronDown size={18} color="#6B7280" />
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>

                        {/* Part Body: Chapters list */}
                        {isPartExpanded && (
                          <View style={styles.partBody}>
                            {part.chapters.map((ch, chIdx) =>
                              renderChapter(ch, part.id, chIdx, part.chapters.length)
                            )}

                            {/* Add Chapter to this Part */}
                            {isEditMode && (
                              <TouchableOpacity
                                activeOpacity={0.8}
                                style={styles.addChapterBtn}
                                onPress={() =>
                                  openAddChapter(
                                    part.id,
                                    isSinglePart ? activeBook.title : part.title
                                  )
                                }
                              >
                                <Plus size={14} color="#15803D" strokeWidth={2.5} />
                                <Text style={styles.addChapterBtnText}>
                                  Add Chapter to {isSinglePart ? activeBook.title : part.title}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}

                  {/* Add Part Button at Bottom */}
                  {isEditMode && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.bottomAddPartBtn}
                      onPress={openAddPart}
                    >
                      <Plus size={15} color="#4F46E5" strokeWidth={2.5} />
                      <Text style={styles.bottomAddPartBtnText}>Add Part</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                /* ── CASE B: Book has NO Parts (Direct Chapters) ──────── */
                <View style={styles.directChaptersContainer}>
                  <View style={styles.partCard}>
                    <View style={styles.partCardHeader}>
                      <View style={styles.partHeaderLeft}>
                        <View style={styles.partTitleWrap}>
                          <Text style={styles.singlePartBookTitle}>
                            {activeBook.title}
                          </Text>
                          <Text style={styles.partSubtitle}>
                            {(activeBook.directChapters || []).length} Chapters · {activeBook.publisher || 'School Curriculum'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.partHeaderRight}>
                        {isEditMode && (
                          <TouchableOpacity
                            style={styles.editIconBtn}
                            onPress={() => openEditBook(activeBook)}
                            accessibilityLabel="Edit Book"
                          >
                            <Pencil size={14} color="#4F46E5" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    <View style={styles.partBody}>
                      {(activeBook.directChapters || []).length === 0 ? (
                        <View style={styles.emptyPartBox}>
                          <Text style={styles.emptyPartTitle}>No Chapters Yet</Text>
                          <Text style={styles.emptyPartSub}>
                            Start adding chapters to {activeBook.title}.
                          </Text>
                          {isEditMode && (
                            <TouchableOpacity
                              style={styles.emptyPartActionBtn}
                              onPress={() => openAddChapter(null, activeBook.title)}
                            >
                              <Plus size={14} color="#ffffff" strokeWidth={2.5} />
                              <Text style={styles.emptyPartActionText}>
                                Create Chapter 1
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ) : (
                        (activeBook.directChapters || []).map((ch, chIdx) =>
                          renderChapter(
                            ch,
                            null,
                            chIdx,
                            (activeBook.directChapters || []).length
                          )
                        )
                      )}

                      {isEditMode && (activeBook.directChapters || []).length > 0 && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.addChapterBtn}
                          onPress={() => openAddChapter(null, activeBook.title)}
                        >
                          <Plus size={14} color="#15803D" strokeWidth={2.5} />
                          <Text style={styles.addChapterBtnText}>
                            Add Chapter to {activeBook.title}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Add Part Button at Bottom */}
                  {isEditMode && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.bottomAddPartBtn}
                      onPress={openAddPart}
                    >
                      <Plus size={15} color="#4F46E5" strokeWidth={2.5} />
                      <Text style={styles.bottomAddPartBtnText}>Add Part</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ) : null}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* ─── Generic Context-Aware Add/Edit Modal ──────────────────── */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
        onShow={() => {
          setTimeout(() => {
            titleInputRef.current?.focus();
          }, 80);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {modalMeta && (
              <View style={styles.modalCardHeader}>
                <View style={styles.modalCardHeaderLeft}>
                  <View
                    style={[
                      styles.modalHeaderIconBadge,
                      { backgroundColor: modalMeta.iconBg },
                    ]}
                  >
                    {modalType?.startsWith('edit-') ? (
                      <Pencil
                        size={17}
                        color={modalMeta.iconColor}
                        strokeWidth={2.2}
                      />
                    ) : (
                      <Plus
                        size={18}
                        color={modalMeta.iconColor}
                        strokeWidth={2.5}
                      />
                    )}
                  </View>
                  <View style={styles.modalCardHeaderTextWrap}>
                    <Text
                      style={[
                        styles.modalHeaderBadgeText,
                        { color: modalMeta.iconColor },
                      ]}
                    >
                      {modalMeta.badge}
                    </Text>
                    <Text style={styles.modalCardTitle} numberOfLines={1}>
                      {modalMeta.title}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.closeCircleBtn}
                  accessibilityLabel="Close modal"
                >
                  <X size={16} color="#64748B" strokeWidth={2.2} />
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={styles.modalBody}>
              {modalMeta && (
                <>
                  {/* Single Title Field */}
                  <Text style={styles.inputLabel}>
                    {modalMeta.label} *
                  </Text>
                  <TextInput
                    ref={titleInputRef}
                    style={styles.textInput}
                    placeholder={`Enter ${modalMeta.label.toLowerCase()}...`}
                    placeholderTextColor="#94A3B8"
                    value={inputTitle}
                    onChangeText={setInputTitle}
                    autoFocus={true}
                    selectTextOnFocus={true}
                  />
                </>
              )}

              {/* Secondary Fields ONLY for Subject and Book */}
              {modalType === 'add-subject' && (
                <>
                  <Text style={styles.inputLabel}>Subject Code</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. MATH-101, PHY-201"
                    placeholderTextColor="#94A3B8"
                    value={inputCode}
                    onChangeText={setInputCode}
                  />

                  <Text style={styles.inputLabel}>Class / Grade</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Grade 10, Grade 9, Class 11"
                    placeholderTextColor="#94A3B8"
                    value={inputGrade}
                    onChangeText={setInputGrade}
                  />
                </>
              )}

              {(modalType === 'add-book' || modalType === 'edit-book') && (
                <>
                  <Text style={styles.inputLabel}>Publisher Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. NCERT Official, CBSE, Oxford, S. Chand"
                    placeholderTextColor="#94A3B8"
                    value={inputSubtitle}
                    onChangeText={setInputSubtitle}
                  />

                  {modalType === 'add-book' && (
                    <View style={styles.modalSwitchRow}>
                      <Text style={styles.modalSwitchLabel}>
                        Book is divided into Parts / Volumes
                      </Text>
                      <Switch
                        value={bookHasParts}
                        onValueChange={setBookHasParts}
                        trackColor={{ false: '#D1D5DB', true: '#C7D2FE' }}
                        thumbColor={bookHasParts ? '#4F46E5' : '#f4f3f4'}
                      />
                    </View>
                  )}
                </>
              )}

              {/* Action Buttons: Cancel & Save */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.modalCancelBtn}
                  onPress={closeModal}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.modalSubmitBtn}
                  onPress={handleSaveModal}
                >
                  <Check size={16} color="#ffffff" strokeWidth={2.5} />
                  <Text style={styles.modalSubmitText}>
                    {modalType?.startsWith('edit-')
                      ? 'Save Changes'
                      : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Premium Custom Delete Confirmation Modal ─────────────── */}
      <Modal
        visible={deleteTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.deleteModalBackdrop}>
          <View style={styles.deleteModalCard}>
            {/* Warning Icon Badge */}
            <View style={styles.deleteIconBadgeOuter}>
              <View style={styles.deleteIconBadgeInner}>
                <AlertTriangle size={26} color="#DC2626" strokeWidth={2.3} />
              </View>
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.deleteModalHeading}>
              Delete {deleteTarget?.badgeLabel}?
            </Text>
            <Text style={styles.deleteModalSub}>
              {deleteTarget?.subtitle}
            </Text>

            {/* Target Item Highlight Card */}
            {deleteTarget && (
              <View style={styles.deleteItemPreviewCard}>
                <View style={styles.deleteItemTypePill}>
                  <Text style={styles.deleteItemTypePillText}>
                    {deleteTarget.badgeLabel.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.deleteItemTitle} numberOfLines={2}>
                  {deleteTarget.title}
                </Text>
                {deleteTarget.itemCountDesc ? (
                  <Text style={styles.deleteItemCountText}>
                    ⚠️ {deleteTarget.itemCountDesc}
                  </Text>
                ) : null}
              </View>
            )}

            <Text style={styles.deletePermanentNotice}>
              This action cannot be undone and will immediately sync across teacher and student portals.
            </Text>

            {/* Modal Actions */}
            <View style={styles.deleteModalActionsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.deleteCancelBtn}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={styles.deleteCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.deleteConfirmBtn}
                onPress={() => {
                  if (deleteTarget) {
                    deleteTarget.onConfirm();
                  }
                }}
              >
                <Trash2 size={16} color="#ffffff" strokeWidth={2.2} />
                <Text style={styles.deleteConfirmBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Subject Selector Dropdown Modal ─────────────────────── */}
      <Modal
        visible={isSubjectDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSubjectDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.dropdownModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsSubjectDropdownOpen(false)}
        >
          <View style={styles.dropdownCard}>
            <View style={styles.dropdownCardHeader}>
              <View style={styles.dropdownCardTitleRow}>
                <BookOpen size={16} color="#4F46E5" strokeWidth={2.3} />
                <Text style={styles.dropdownCardTitle}>Select Subject</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsSubjectDropdownOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.dropdownListScroll}
              contentContainerStyle={styles.dropdownListContent}
              showsVerticalScrollIndicator={false}
            >
              {curriculumData.map((subj) => {
                const isSelected = subj.id === activeSubject.id;
                const totalCh = subj.books.flatMap((b) =>
                  b.parts ? b.parts.flatMap((p) => p.chapters) : b.directChapters || []
                ).length;

                return (
                  <TouchableOpacity
                    key={subj.id}
                    activeOpacity={0.75}
                    style={[
                      styles.dropdownItemRow,
                      isSelected && styles.dropdownItemRowSelected,
                    ]}
                    onPress={() => {
                      setSelectedSubjectId(subj.id);
                      if (subj.books[0]) {
                        setSelectedBookId(subj.books[0].id);
                      }
                      setIsSubjectDropdownOpen(false);
                    }}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View
                        style={[
                          styles.dropdownItemIconCircle,
                          isSelected && styles.dropdownItemIconCircleSelected,
                        ]}
                      >
                        <BookOpen
                          size={16}
                          color={isSelected ? '#ffffff' : '#4F46E5'}
                          strokeWidth={2.2}
                        />
                      </View>
                      <View style={styles.dropdownItemTextCol}>
                        <Text
                          style={[
                            styles.dropdownItemName,
                            isSelected && styles.dropdownItemNameSelected,
                          ]}
                        >
                          {subj.subjectName}
                        </Text>
                        <Text style={styles.dropdownItemMeta}>
                          {subj.grade} · {subj.subjectCode} · {subj.books.length} Books ({totalCh} Ch)
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View style={styles.dropdownItemCheckWrap}>
                        <Check size={16} color="#4F46E5" strokeWidth={2.5} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  previewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },

  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 18 },

  // Step Sections
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 7,
  },
  modeTabBtnActiveView: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabBtnActiveEdit: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2.5,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modeTabTextActiveView: {
    color: '#0F172A',
  },
  modeTabTextActiveEdit: {
    color: '#ffffff',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  addSubjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  addSubjectPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#4F46E5',
  },
  addBookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  addBookPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },

  // Subjects Horizontal Scroll
  subjectScroll: {
    gap: 8,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  subjectChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  subjectChipTextSelected: {
    color: '#ffffff',
  },

  // Books Horizontal Shelf
  booksScroll: {
    gap: 8,
  },
  bookTabCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    minWidth: 155,
  },
  bookTabCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  bookTabIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTabTextCol: {
    flex: 1,
  },
  bookTabTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  bookTabTitleSelected: {
    color: '#4F46E5',
  },
  bookTabSub: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 1,
  },
  bookTabSubSelected: {
    color: '#6D28D9',
  },
  newBookDashedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    minWidth: 110,
  },
  newBookDashedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },

  // Book Shelf Actions (Below Books)
  bookShelfFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 8,
  },
  bookActionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bookActionBtnSecondaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  bookActionBtnDestructive: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    ...Platform.select({
      ios: {
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bookActionBtnDestructiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  bookActionBtnPrimary: {
    flex: 1.15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 36,
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.22,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  bookActionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  editIconBtn: {
    padding: 4,
    borderRadius: 6,
  },

  // Canvas
  canvasBlock: {
    gap: 14,
  },
  partTitleSmall: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  singlePartBookTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  bottomAddPartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 6,
  },
  bottomAddPartBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // Parts List
  partsContainer: {
    gap: 12,
  },
  partsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  structureHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addPartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  addPartBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  emptyPartBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyPartTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  emptyPartSub: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  emptyPartActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
  },
  emptyPartActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Part Card
  partCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 3,
    borderLeftColor: '#4F46E5',
    overflow: 'hidden',
  },
  partCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  partHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  partNumeralBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partNumeralText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.2,
  },
  partTitleWrap: {
    flex: 1,
  },
  partTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  partSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  partHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashIconBtn: {
    padding: 4,
  },
  chevronWrap: {
    width: 24,
    alignItems: 'center',
  },
  partBody: {
    padding: 12,
    gap: 10,
  },
  addChapterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderStyle: 'dashed',
  },
  addChapterBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#15803D',
  },

  // Direct Chapters
  directChaptersContainer: {
    gap: 10,
  },
  addChapterBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  addChapterBtnSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },

  // Chapter Card
  chapterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderLeftWidth: 2.2,
    borderLeftColor: '#10B981',
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  chapterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  chBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: '#ECFDF5',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  chBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.2,
  },
  chTitleWrap: {
    flex: 1,
  },
  chTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1F2937',
  },
  chSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  chapterHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterBody: {
    padding: 12,
    paddingTop: 4,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  emptyTopicsBox: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  emptyTopicsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Topic Card
  topicCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 1.8,
    borderLeftColor: '#6366F1',
  },
  topicHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topicHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  topicIndexBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  topicIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4F46E5',
  },
  topicTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  topicHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addSubTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  addSubTopicBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // Sub-topics List
  subTopicsContainer: {
    paddingLeft: 14,
    gap: 5,
    borderLeftWidth: 2,
    borderLeftColor: '#E0E7FF',
    marginTop: 2,
  },
  subTopicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subTopicLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  subTopicBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
  },
  subTopicText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
  },
  subTopicActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reorderArrowsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    padding: 2,
    gap: 1.5,
  },
  reorderArrowBtn: {
    padding: 3,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderArrowBtnSmall: {
    padding: 2.5,
    borderRadius: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderArrowBtnMicro: {
    padding: 2,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderArrowBtnDisabled: {
    opacity: 0.28,
  },
  subTopicEditBtn: {
    padding: 3,
  },
  subTopicDeleteBtn: {
    padding: 2,
  },

  addTopicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    marginTop: 4,
  },
  addTopicBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },

  // Modal
  // ── Generic Modal Styles ──────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.25,
        shadowRadius: 22,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalHeaderIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCardHeaderTextWrap: {
    flex: 1,
  },
  modalHeaderBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 18,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 14,
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  modalSwitchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 22,
    marginBottom: 4,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  modalSubmitBtn: {
    flex: 1.25,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    ...Platform.select({
      ios: {
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  modalSubmitText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },

  // ── Custom Delete Modal Styles ───────────────────────────────────
  deleteModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 22,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  deleteIconBadgeOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteIconBadgeInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  deleteModalSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  deleteItemPreviewCard: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 14,
    gap: 6,
  },
  deleteItemTypePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  deleteItemTypePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  deleteItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  deleteItemCountText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
  },
  deletePermanentNotice: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 15,
  },
  deleteModalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 20,
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  deleteConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#DC2626',
  },
  deleteConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  // ── Subject Dropdown Trigger & Modal Styles ───────────────────────
  subjectCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  subjectCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  subjectDropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  subjectDropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    flex: 1,
  },
  subjectDropdownIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectDropdownTextCol: {
    flex: 1,
  },
  subjectDropdownTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  subjectDropdownSub: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 1,
  },
  subjectDropdownChevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropdownModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    width: '100%',
    maxWidth: 380,
    maxHeight: '75%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  dropdownCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  dropdownCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  dropdownListScroll: {
    maxHeight: 380,
  },
  dropdownListContent: {
    padding: 10,
    gap: 6,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  dropdownItemRowSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownItemIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownItemIconCircleSelected: {
    backgroundColor: '#4F46E5',
  },
  dropdownItemTextCol: {
    flex: 1,
  },
  dropdownItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  dropdownItemNameSelected: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  dropdownItemMeta: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  dropdownItemCheckWrap: {
    paddingLeft: 6,
  },
});
