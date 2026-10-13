import { useEffect, useState } from 'react';
import {
  MOCK_CURRICULUM_DATA,
  SubjectCurriculumData,
  Book,
  Part,
  Chapter,
  Topic,
  SubTopic,
  TimelineHistoryEntry,
  TimelineStatus,
  StudyMaterial,
  ChapterHomework,
} from './curriculumData';

// In-memory store initialized with a deep copy of MOCK_CURRICULUM_DATA
let curriculumState: SubjectCurriculumData[] = JSON.parse(
  JSON.stringify(MOCK_CURRICULUM_DATA)
);

type Listener = (data: SubjectCurriculumData[]) => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  curriculumState = JSON.parse(JSON.stringify(curriculumState));
  listeners.forEach((listener) => listener(curriculumState));
}

export const CurriculumStore = {
  getCurriculum(): SubjectCurriculumData[] {
    return curriculumState;
  },

  getSubject(subjectId: string): SubjectCurriculumData | undefined {
    return curriculumState.find((s) => s.id === subjectId);
  },

  // ── 1. Add Subject ────────────────────────────────────────────────
  addSubject(subject: {
    name: string;
    code: string;
    grade: string;
    leadTeacher: string;
  }) {
    const newSubject: SubjectCurriculumData = {
      id: `subj-${Date.now()}`,
      subjectName: subject.name,
      subjectCode: subject.code || 'SUBJ-101',
      grade: subject.grade || 'Grade 10',
      leadTeacher: subject.leadTeacher || 'Faculty Lead',
      overallProgress: 0,
      totalBooks: 0,
      totalChapters: 0,
      completedChapters: 0,
      totalMaterials: 0,
      books: [],
    };
    curriculumState = [newSubject, ...curriculumState];
    notifyListeners();
    return newSubject;
  },

  // ── 2. Add Book ───────────────────────────────────────────────────
  addBook(
    subjectId: string,
    book: {
      title: string;
      publisher?: string;
      edition?: string;
      coverColor?: string;
      hasParts?: boolean;
    }
  ) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;

    const newBook: Book = {
      id: `book-${Date.now()}`,
      title: book.title,
      publisher: book.publisher || 'School Board Edition',
      edition: book.edition || '2026 Academic Year',
      coverColor: book.coverColor || '#4F46E5',
      totalChapters: 0,
      completedChapters: 0,
      progressPercentage: 0,
      totalMaterials: 0,
      parts: book.hasParts ? [] : undefined,
      directChapters: book.hasParts ? undefined : [],
    };

    subject.books = [...subject.books, newBook];
    subject.totalBooks = subject.books.length;
    this._recomputeTotals(subject, newBook);
    notifyListeners();
    return newBook;
  },

  deleteBook(subjectId: string, bookId: string) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;

    subject.books = subject.books.filter((b) => b.id !== bookId);
    subject.totalBooks = subject.books.length;
    const allSubjectChapters = subject.books.flatMap((b) =>
      b.parts ? b.parts.flatMap((p) => p.chapters) : b.directChapters || []
    );
    subject.totalChapters = allSubjectChapters.length;
    notifyListeners();
  },

  updateBook(
    subjectId: string,
    bookId: string,
    updates: { title?: string; publisher?: string }
  ) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book) return;

    if (updates.title !== undefined) book.title = updates.title.trim();
    if (updates.publisher !== undefined) book.publisher = updates.publisher.trim();
    notifyListeners();
  },

  // ── 3. Toggle/Set Parts in Book ──────────────────────────────────
  toggleBookHasParts(subjectId: string, bookId: string, hasParts: boolean) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book) return;

    if (hasParts) {
      if (!book.parts) {
        const existingChapters = book.directChapters || [];
        book.parts = [
          {
            id: `part-${Date.now()}`,
            partNumber: 1,
            title: 'Part 1: Primary Module',
            chapters: existingChapters,
          },
        ];
        book.directChapters = undefined;
      }
    } else {
      if (!book.directChapters) {
        const allChapters = (book.parts || []).flatMap((p) => p.chapters);
        book.directChapters = allChapters;
        book.parts = undefined;
      }
    }
    notifyListeners();
  },

  // ── 4. Add Part ───────────────────────────────────────────────────
  addPart(
    subjectId: string,
    bookId: string,
    part: { title: string; partNumber?: number; description?: string }
  ) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book) return;

    if (!book.parts) {
      // Converting from direct chapters to parts: preserve existing chapters into Part 1!
      const existingChapters = book.directChapters || [];
      const newPart: Part = {
        id: `part-${Date.now()}`,
        partNumber: 1,
        title: part.title || 'Part 1: Primary Module',
        description: part.description,
        chapters: existingChapters,
      };
      book.parts = [newPart];
      book.directChapters = undefined;
      notifyListeners();
      return newPart;
    }

    const newPart: Part = {
      id: `part-${Date.now()}`,
      partNumber: part.partNumber || book.parts.length + 1,
      title: part.title,
      description: part.description,
      chapters: [],
    };

    book.parts = [...book.parts, newPart];
    notifyListeners();
    return newPart;
  },

  deletePart(subjectId: string, bookId: string, partId: string) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book || !book.parts) return;

    book.parts = book.parts.filter((p) => p.id !== partId);
    if (book.parts.length === 0) {
      book.parts = undefined;
      book.directChapters = [];
    }
    this._recomputeTotals(subject, book);
    notifyListeners();
  },

  updatePart(
    subjectId: string,
    bookId: string,
    partId: string,
    updates: { title?: string }
  ) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book || !book.parts) return;
    const part = book.parts.find((p) => p.id === partId);
    if (!part) return;

    if (updates.title !== undefined) part.title = updates.title.trim();
    notifyListeners();
  },

  // ── 5. Add Chapter ────────────────────────────────────────────────
  addChapter(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapter: { title: string; chapterNumber?: number; description?: string }
  ) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book) return;

    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      chapterNumber: chapter.chapterNumber || 1,
      title: chapter.title,
      description: chapter.description || 'Core syllabus concepts',
      isCompleted: false,
      completionPercentage: 0,
      topics: [],
      materials: [],
    };

    if (partId && book.parts) {
      const part = book.parts.find((p) => p.id === partId);
      if (part) {
        newChapter.chapterNumber = chapter.chapterNumber || part.chapters.length + 1;
        part.chapters = [...part.chapters, newChapter];
      }
    } else {
      if (!book.directChapters) {
        book.directChapters = [];
      }
      newChapter.chapterNumber = chapter.chapterNumber || book.directChapters.length + 1;
      book.directChapters = [...book.directChapters, newChapter];
    }

    this._recomputeTotals(subject, book);
    notifyListeners();
    return newChapter;
  },

  deleteChapter(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string
  ) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book) return;

    if (partId && book.parts) {
      const part = book.parts.find((p) => p.id === partId);
      if (part) {
        part.chapters = part.chapters.filter((c) => c.id !== chapterId);
      }
    } else if (book.directChapters) {
      book.directChapters = book.directChapters.filter((c) => c.id !== chapterId);
    }

    this._recomputeTotals(subject, book);
    notifyListeners();
  },

  updateChapter(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    updates: { title?: string; chapterNumber?: number }
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter) return;

    if (updates.title !== undefined) chapter.title = updates.title.trim();
    if (updates.chapterNumber !== undefined) chapter.chapterNumber = updates.chapterNumber;
    notifyListeners();
  },

  // ── 6. Add Topic ──────────────────────────────────────────────────
  addTopic(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    title: string
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter) return;

    const newTopic: Topic = {
      id: `topic-${Date.now()}`,
      title,
      isCompleted: false,
      subTopics: [],
    };

    chapter.topics = [...(chapter.topics || []), newTopic];
    notifyListeners();
    return newTopic;
  },

  deleteTopic(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || !chapter.topics) return;

    chapter.topics = chapter.topics.filter((t) => t.id !== topicId);
    notifyListeners();
  },

  updateTopic(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string,
    updates: { title?: string }
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || !chapter.topics) return;
    const topic = chapter.topics.find((t) => t.id === topicId);
    if (!topic) return;

    if (updates.title !== undefined) topic.title = updates.title.trim();
    notifyListeners();
  },

  // ── 7. Add Sub-Topic ──────────────────────────────────────────────
  addSubTopic(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string,
    title: string
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || !chapter.topics) return;

    const topic = chapter.topics.find((t) => t.id === topicId);
    if (!topic) return;

    const newSubTopic: SubTopic = {
      id: `sub-${Date.now()}`,
      title,
      isCompleted: false,
    };

    topic.subTopics = [...(topic.subTopics || []), newSubTopic];
    notifyListeners();
    return newSubTopic;
  },

  deleteSubTopic(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string,
    subTopicId: string
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || !chapter.topics) return;

    const topic = chapter.topics.find((t) => t.id === topicId);
    if (!topic || !topic.subTopics) return;

    topic.subTopics = topic.subTopics.filter((s) => s.id !== subTopicId);
    notifyListeners();
  },

  updateSubTopic(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string,
    subTopicId: string,
    updates: { title?: string }
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || !chapter.topics) return;
    const topic = chapter.topics.find((t) => t.id === topicId);
    if (!topic || !topic.subTopics) return;
    const subTopic = topic.subTopics.find((s) => s.id === subTopicId);
    if (!subTopic) return;

    if (updates.title !== undefined) subTopic.title = updates.title.trim();
    notifyListeners();
  },

  // ── Internal Helpers ──────────────────────────────────────────────
  _findChapter(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string
  ): Chapter | undefined {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book) return;

    if (partId && book.parts) {
      const part = book.parts.find((p) => p.id === partId);
      return part?.chapters.find((c) => c.id === chapterId);
    } else if (book.directChapters) {
      return book.directChapters.find((c) => c.id === chapterId);
    }
  },

  // ── Move / Reorder Operations ──────────────────────────────────
  moveChapter(
    subjectId: string,
    bookId: string,
    partId: string | null,
    currentIndex: number,
    direction: 'up' | 'down'
  ) {
    const subject = curriculumState.find((s) => s.id === subjectId);
    if (!subject) return;
    const book = subject.books.find((b) => b.id === bookId);
    if (!book) return;

    let chapters: Chapter[] | undefined;
    if (partId && book.parts) {
      const part = book.parts.find((p) => p.id === partId);
      if (part) chapters = part.chapters;
    } else if (book.directChapters) {
      chapters = book.directChapters;
    }

    if (!chapters) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const temp = chapters[currentIndex];
    chapters[currentIndex] = chapters[targetIndex];
    chapters[targetIndex] = temp;

    // Renumber chapters sequentially
    chapters.forEach((ch, idx) => {
      ch.chapterNumber = idx + 1;
    });

    notifyListeners();
  },

  moveTopic(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    currentIndex: number,
    direction: 'up' | 'down'
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || !chapter.topics) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= chapter.topics.length) return;

    const temp = chapter.topics[currentIndex];
    chapter.topics[currentIndex] = chapter.topics[targetIndex];
    chapter.topics[targetIndex] = temp;

    notifyListeners();
  },

  moveSubTopic(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string,
    currentIndex: number,
    direction: 'up' | 'down'
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || !chapter.topics) return;
    const topic = chapter.topics.find((t) => t.id === topicId);
    if (!topic || !topic.subTopics) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= topic.subTopics.length) return;

    const temp = topic.subTopics[currentIndex];
    topic.subTopics[currentIndex] = topic.subTopics[targetIndex];
    topic.subTopics[targetIndex] = temp;

    notifyListeners();
  },

  _recomputeTotals(subject: SubjectCurriculumData, book: Book) {
    const bookChapters = book.parts
      ? book.parts.flatMap((p) => p.chapters)
      : book.directChapters || [];
    book.totalChapters = bookChapters.length;

    const allSubjectChapters = subject.books.flatMap((b) =>
      b.parts ? b.parts.flatMap((p) => p.chapters) : b.directChapters || []
    );
    subject.totalChapters = allSubjectChapters.length;
  },

  // ── Syllabus Timeline Methods ──────────────────────────────────────

  /**
   * Internal: Append a history entry to a node's timeline history.
   */
  _logHistory(
    node: { timelineHistory?: TimelineHistoryEntry[] },
    entry: Omit<TimelineHistoryEntry, 'id'>
  ) {
    if (!node.timelineHistory) node.timelineHistory = [];
    node.timelineHistory.push({
      ...entry,
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });
  },

  /**
   * Derive the display status from start/end dates.
   */
  _deriveStatus(node: { startDate?: string; endDate?: string; timelineStatus?: TimelineStatus }): TimelineStatus {
    if (node.timelineStatus === 'COMPLETED_VIA_PARENT') return 'COMPLETED_VIA_PARENT';
    if (node.endDate) return 'COMPLETED';
    if (node.startDate) return 'RUNNING';
    return 'NOT_STARTED';
  },

  // ── Syllabus Timeline Methods ──────────────────────────────────────

  /**
   * Internal: Append a history entry to a node's timeline history.
   */
  _logHistory(
    node: { timelineHistory?: TimelineHistoryEntry[] },
    entry: Omit<TimelineHistoryEntry, 'id'>
  ) {
    if (!node.timelineHistory) node.timelineHistory = [];
    node.timelineHistory.push({
      ...entry,
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    });
  },

  /**
   * Internal: Recalculate chapter completion percentage based on finished topics/subtopics.
   */
  _recalculateChapterProgress(chapter: Chapter) {
    if (chapter.endDate || chapter.timelineStatus === 'COMPLETED') {
      chapter.completionPercentage = 100;
      chapter.isCompleted = true;
      return;
    }
    let total = 0;
    let completed = 0;
    chapter.topics.forEach((t) => {
      const tDone =
        !!t.completedDate ||
        !!t.endDate ||
        t.timelineStatus === 'COMPLETED' ||
        t.timelineStatus === 'COMPLETED_VIA_PARENT';
      if (t.subTopics && t.subTopics.length > 0) {
        t.subTopics.forEach((s) => {
          total += 1;
          if (
            tDone ||
            !!s.completedDate ||
            !!s.endDate ||
            s.timelineStatus === 'COMPLETED' ||
            s.timelineStatus === 'COMPLETED_VIA_PARENT'
          ) {
            completed += 1;
          }
        });
      } else {
        total += 1;
        if (tDone) completed += 1;
      }
    });
    chapter.completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    if (chapter.completionPercentage === 100) {
      chapter.isCompleted = true;
    }
  },

  /**
   * Set Chapter Start Date.
   * Multiple chapters can be started concurrently.
   */
  setChapterStartDate(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    date: string,
    changedBy: string
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || chapter.startDate) return;

    const now = new Date().toISOString();
    chapter.startDate = date;
    chapter.timelineStatus = 'RUNNING';
    this._logHistory(chapter, { field: 'start_date', oldValue: null, newValue: date, changedBy, changedAt: now });
    this._recalculateChapterProgress(chapter);

    notifyListeners();
  },

  /**
   * Set Chapter End Date (completes chapter and bulk-completes any unfinished children via top-down).
   */
  setChapterEndDate(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    date: string,
    changedBy: string
  ) {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter || chapter.endDate) return;

    const now = new Date().toISOString();
    chapter.endDate = date;
    chapter.timelineStatus = 'COMPLETED';
    chapter.isCompleted = true;
    chapter.completionPercentage = 100;
    this._logHistory(chapter, { field: 'end_date', oldValue: null, newValue: date, changedBy, changedAt: now });

    // Top-down cascade: mark all unfinished children as COMPLETED_VIA_PARENT
    chapter.topics.forEach((topic) => {
      if (!topic.completedDate && !topic.endDate && topic.timelineStatus !== 'COMPLETED') {
        topic.completedDate = date;
        topic.endDate = date;
        topic.timelineStatus = 'COMPLETED_VIA_PARENT';
        topic.isCompleted = true;
        this._logHistory(topic, {
          field: 'completed_date',
          oldValue: null,
          newValue: date,
          changedBy,
          changedAt: now,
          note: `Completed via chapter: ${chapter.title}`,
        });
      }
      (topic.subTopics || []).forEach((sub) => {
        if (!sub.completedDate && !sub.endDate && sub.timelineStatus !== 'COMPLETED') {
          sub.completedDate = date;
          sub.endDate = date;
          sub.timelineStatus = 'COMPLETED_VIA_PARENT';
          sub.isCompleted = true;
          this._logHistory(sub, {
            field: 'completed_date',
            oldValue: null,
            newValue: date,
            changedBy,
            changedAt: now,
            note: `Completed via chapter: ${chapter.title}`,
          });
        }
      });
    });

    notifyListeners();
  },

  /**
   * Mark a Topic as completed with a single completion date.
   * Requires parent chapter to have a startDate.
   */
  setTopicCompleted(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string,
    date: string,
    changedBy: string
  ): { shouldAutoComplete: { type: 'chapter'; id: string; name: string; date: string } | null; error?: string } {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter) return { shouldAutoComplete: null };
    if (!chapter.startDate) {
      return { shouldAutoComplete: null, error: 'Please set the Chapter start date first.' };
    }

    const topic = chapter.topics.find((t) => t.id === topicId);
    if (!topic || topic.completedDate || topic.endDate) return { shouldAutoComplete: null };

    const now = new Date().toISOString();
    topic.completedDate = date;
    topic.endDate = date;
    topic.timelineStatus = 'COMPLETED';
    topic.isCompleted = true;
    this._logHistory(topic, { field: 'completed_date', oldValue: null, newValue: date, changedBy, changedAt: now });

    // Also complete any uncompleted subtopics under this topic
    (topic.subTopics || []).forEach((sub) => {
      if (!sub.completedDate && !sub.endDate) {
        sub.completedDate = date;
        sub.endDate = date;
        sub.timelineStatus = 'COMPLETED_VIA_PARENT';
        sub.isCompleted = true;
        this._logHistory(sub, {
          field: 'completed_date',
          oldValue: null,
          newValue: date,
          changedBy,
          changedAt: now,
          note: `Completed via topic: ${topic.title}`,
        });
      }
    });

    this._recalculateChapterProgress(chapter);
    notifyListeners();

    // Check if all topics under this chapter are completed
    const allTopicsDone = chapter.topics.every(
      (t) => t.completedDate || t.endDate || t.timelineStatus === 'COMPLETED' || t.timelineStatus === 'COMPLETED_VIA_PARENT'
    );
    if (allTopicsDone && !chapter.endDate) {
      return { shouldAutoComplete: { type: 'chapter', id: chapter.id, name: chapter.title, date } };
    }

    return { shouldAutoComplete: null };
  },

  /**
   * Mark a SubTopic as completed with a single completion date.
   * Requires parent chapter to have a startDate.
   */
  setSubTopicCompleted(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string,
    subTopicId: string,
    date: string,
    changedBy: string
  ): { shouldAutoComplete: { type: 'topic'; id: string; name: string; date: string } | null; error?: string } {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter) return { shouldAutoComplete: null };
    if (!chapter.startDate) {
      return { shouldAutoComplete: null, error: 'Please set the Chapter start date first.' };
    }

    const topic = chapter.topics.find((t) => t.id === topicId);
    if (!topic || !topic.subTopics) return { shouldAutoComplete: null };
    const subTopic = topic.subTopics.find((s) => s.id === subTopicId);
    if (!subTopic || subTopic.completedDate || subTopic.endDate) return { shouldAutoComplete: null };

    const now = new Date().toISOString();
    subTopic.completedDate = date;
    subTopic.endDate = date;
    subTopic.timelineStatus = 'COMPLETED';
    subTopic.isCompleted = true;
    this._logHistory(subTopic, { field: 'completed_date', oldValue: null, newValue: date, changedBy, changedAt: now });

    this._recalculateChapterProgress(chapter);
    notifyListeners();

    // Check if all subtopics in this topic are now completed
    const allSubsDone = topic.subTopics.every(
      (s) => s.completedDate || s.endDate || s.timelineStatus === 'COMPLETED' || s.timelineStatus === 'COMPLETED_VIA_PARENT'
    );
    if (allSubsDone && !topic.completedDate && !topic.endDate) {
      return { shouldAutoComplete: { type: 'topic', id: topic.id, name: topic.title, date } };
    }

    return { shouldAutoComplete: null };
  },

  /**
   * Confirm auto-completion of a parent node (Topic or Chapter).
   */
  confirmAutoComplete(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId: string | null,
    date: string,
    changedBy: string
  ): { shouldAutoComplete: { type: 'chapter'; id: string; name: string; date: string } | null } {
    if (topicId) {
      // Auto-complete topic, and check if chapter is now complete
      const res = this.setTopicCompleted(subjectId, bookId, partId, chapterId, topicId, date, changedBy);
      return { shouldAutoComplete: res.shouldAutoComplete };
    } else {
      // Auto-complete chapter
      this.setChapterEndDate(subjectId, bookId, partId, chapterId, date, changedBy);
      return { shouldAutoComplete: null };
    }
  },

  /**
   * Get timeline history entries for a specific node.
   */
  getTimelineHistory(
    subjectId: string,
    bookId: string,
    partId: string | null,
    chapterId: string,
    topicId?: string | null,
    subTopicId?: string | null
  ): TimelineHistoryEntry[] {
    const chapter = this._findChapter(subjectId, bookId, partId, chapterId);
    if (!chapter) return [];

    if (subTopicId && topicId) {
      const topic = chapter.topics.find((t) => t.id === topicId);
      const sub = topic?.subTopics?.find((s) => s.id === subTopicId);
      return sub?.timelineHistory || [];
    } else if (topicId) {
      const topic = chapter.topics.find((t) => t.id === topicId);
      return topic?.timelineHistory || [];
    }
    return chapter.timelineHistory || [];
  },

  /**
   * Get all chapters belonging to a subject (for tagging uploaded resources).
   */
  getChaptersForSubject(
    subjectName: string,
    grade?: string
  ): Array<{
    id: string;
    chapterNumber: number;
    title: string;
    bookTitle: string;
    subjectId: string;
    bookId: string;
    partId: string | null;
  }> {
    const sNameLower = subjectName.toLowerCase();

    // Match subject by exact name, keyword or partial match
    let subject = curriculumState.find((s) => {
      const matchGrade = !grade || s.grade.toLowerCase() === grade.toLowerCase();
      const matchName =
        s.subjectName.toLowerCase() === sNameLower ||
        sNameLower.includes(s.subjectName.toLowerCase()) ||
        s.subjectName.toLowerCase().includes(sNameLower);
      return matchGrade && matchName;
    });

    if (!subject) {
      subject = curriculumState.find(
        (s) =>
          sNameLower.includes(s.subjectName.toLowerCase()) ||
          s.subjectName.toLowerCase().includes(sNameLower)
      );
    }

    if (!subject) return [];

    const result: Array<{
      id: string;
      chapterNumber: number;
      title: string;
      bookTitle: string;
      subjectId: string;
      bookId: string;
      partId: string | null;
    }> = [];

    subject.books.forEach((book) => {
      if (book.parts) {
        book.parts.forEach((part) => {
          part.chapters.forEach((ch) => {
            result.push({
              id: ch.id,
              chapterNumber: ch.chapterNumber,
              title: ch.title,
              bookTitle: book.title,
              subjectId: subject!.id,
              bookId: book.id,
              partId: part.id,
            });
          });
        });
      } else if (book.directChapters) {
        book.directChapters.forEach((ch) => {
          result.push({
            id: ch.id,
            chapterNumber: ch.chapterNumber,
            title: ch.title,
            bookTitle: book.title,
            subjectId: subject!.id,
            bookId: book.id,
            partId: null,
          });
        });
      }
    });

    return result;
  },

  /**
   * Attach a study material to a specific chapter in the Curriculum.
   */
  addMaterialToChapter(params: {
    subjectName?: string;
    subjectId?: string;
    chapterId?: string;
    chapterTitle?: string;
    material: StudyMaterial;
  }): boolean {
    let subject: SubjectCurriculumData | undefined;
    if (params.subjectId) {
      subject = curriculumState.find((s) => s.id === params.subjectId);
    } else if (params.subjectName) {
      const sNameLower = params.subjectName.toLowerCase();
      subject = curriculumState.find(
        (s) =>
          s.subjectName.toLowerCase() === sNameLower ||
          sNameLower.includes(s.subjectName.toLowerCase()) ||
          s.subjectName.toLowerCase().includes(sNameLower)
      );
    }

    if (!subject) return false;

    let targetChapter: Chapter | undefined;
    let targetBook: Book | undefined;

    for (const book of subject.books) {
      if (book.parts) {
        for (const part of book.parts) {
          const found = part.chapters.find(
            (c) =>
              (params.chapterId && c.id === params.chapterId) ||
              (params.chapterTitle &&
                (c.title.toLowerCase() === params.chapterTitle.toLowerCase() ||
                  params.chapterTitle.toLowerCase().includes(c.title.toLowerCase()) ||
                  c.title.toLowerCase().includes(params.chapterTitle.toLowerCase())))
          );
          if (found) {
            targetChapter = found;
            targetBook = book;
            break;
          }
        }
      } else if (book.directChapters) {
        const found = book.directChapters.find(
          (c) =>
            (params.chapterId && c.id === params.chapterId) ||
            (params.chapterTitle &&
              (c.title.toLowerCase() === params.chapterTitle.toLowerCase() ||
                params.chapterTitle.toLowerCase().includes(c.title.toLowerCase()) ||
                c.title.toLowerCase().includes(params.chapterTitle.toLowerCase())))
        );
        if (found) {
          targetChapter = found;
          targetBook = book;
          break;
        }
      }
      if (targetChapter) break;
    }

    if (!targetChapter) return false;

    if (!targetChapter.materials) {
      targetChapter.materials = [];
    }

    targetChapter.materials.unshift(params.material);
    if (targetBook) {
      targetBook.totalMaterials = (targetBook.totalMaterials || 0) + 1;
    }
    subject.totalMaterials = (subject.totalMaterials || 0) + 1;

    notifyListeners();
    return true;
  },

  /**
   * Attach a homework assignment to a specific chapter in the Curriculum.
   */
  addHomeworkToChapter(params: {
    subjectName?: string;
    subjectId?: string;
    chapterId?: string;
    chapterTitle?: string;
    homework: ChapterHomework;
  }): boolean {
    let subject: SubjectCurriculumData | undefined;
    if (params.subjectId) {
      subject = curriculumState.find((s) => s.id === params.subjectId);
    } else if (params.subjectName) {
      const sNameLower = params.subjectName.toLowerCase();
      subject = curriculumState.find(
        (s) =>
          s.subjectName.toLowerCase() === sNameLower ||
          sNameLower.includes(s.subjectName.toLowerCase()) ||
          s.subjectName.toLowerCase().includes(sNameLower)
      );
    }

    if (!subject) return false;

    let targetChapter: Chapter | undefined;

    for (const book of subject.books) {
      if (book.parts) {
        for (const part of book.parts) {
          const found = part.chapters.find(
            (c) =>
              (params.chapterId && c.id === params.chapterId) ||
              (params.chapterTitle &&
                (c.title.toLowerCase() === params.chapterTitle.toLowerCase() ||
                  params.chapterTitle.toLowerCase().includes(c.title.toLowerCase()) ||
                  c.title.toLowerCase().includes(params.chapterTitle.toLowerCase())))
          );
          if (found) {
            targetChapter = found;
            break;
          }
        }
      } else if (book.directChapters) {
        const found = book.directChapters.find(
          (c) =>
            (params.chapterId && c.id === params.chapterId) ||
            (params.chapterTitle &&
              (c.title.toLowerCase() === params.chapterTitle.toLowerCase() ||
                params.chapterTitle.toLowerCase().includes(c.title.toLowerCase()) ||
                c.title.toLowerCase().includes(params.chapterTitle.toLowerCase())))
        );
        if (found) {
          targetChapter = found;
          break;
        }
      }
      if (targetChapter) break;
    }

    if (!targetChapter) return false;

    if (!targetChapter.homeworks) {
      targetChapter.homeworks = [];
    }

    targetChapter.homeworks.unshift(params.homework);

    notifyListeners();
    return true;
  },
};

// React Hook to subscribe to curriculum updates
export function useCurriculumStore() {
  const [data, setData] = useState<SubjectCurriculumData[]>(curriculumState);

  useEffect(() => {
    const listener: Listener = (newData) => {
      setData([...newData]);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return data;
}
