export type MaterialType = 'pdf' | 'note' | 'video' | 'worksheet' | 'link';

// ── Syllabus Timeline Types ──────────────────────────────────────────
export type TimelineStatus = 'NOT_STARTED' | 'RUNNING' | 'COMPLETED' | 'COMPLETED_VIA_PARENT';

export type TimelineHistoryEntry = {
  id: string;
  field: 'start_date' | 'end_date' | 'completed_date' | 'status';
  oldValue: string | null;
  newValue: string;
  changedBy: string;
  changedAt: string; // ISO timestamp
  note?: string; // e.g. "Auto-completed via parent chapter"
};
// ─────────────────────────────────────────────────────────────────────

export type StudyMaterial = {
  id: string;
  title: string;
  type: MaterialType;
  fileSize?: string;
  duration?: string; // For videos
  uploadedBy: string;
  uploadedAt: string;
  timestamp?: number;
  url?: string;
  description?: string;
  downloadCount?: number;
};

export type SubTopic = {
  id: string;
  title: string;
  isCompleted: boolean;
  // Syllabus Timeline: only one completion date
  completedDate?: string;
  endDate?: string; // mapped for compatibility
  timelineStatus?: TimelineStatus;
  timelineHistory?: TimelineHistoryEntry[];
};

export type Topic = {
  id: string;
  title: string;
  isCompleted: boolean;
  subTopics?: SubTopic[];
  // Syllabus Timeline: only one completion date
  completedDate?: string;
  endDate?: string; // mapped for compatibility
  timelineStatus?: TimelineStatus;
  timelineHistory?: TimelineHistoryEntry[];
};

export type ChapterHomework = {
  id: string;
  title: string;
  assignedDate: string;
  dueDate?: string;
  dueTime?: string;
  assignedBy: string;
  description?: string;
  grade?: string;
  section?: string;
  attachments?: {
    id: string;
    kind: 'file' | 'link';
    label: string;
    url?: string;
  }[];
  submittedCount?: number;
  totalStudents?: number;
  status?: 'active' | 'scheduled' | 'submitted';
};

export type Chapter = {
  id: string;
  chapterNumber: number;
  title: string;
  description: string;
  isCompleted: boolean;
  completionPercentage: number;
  topics: Topic[];
  materials: StudyMaterial[];
  homeworks?: ChapterHomework[];
  // Syllabus Timeline: chapter tracks both start and end date
  startDate?: string;
  endDate?: string;
  timelineStatus?: TimelineStatus;
  timelineHistory?: TimelineHistoryEntry[];
};

export type Part = {
  id: string;
  partNumber: number;
  title: string;
  description?: string;
  chapters: Chapter[];
};

export type Book = {
  id: string;
  title: string;
  publisher?: string;
  edition?: string;
  coverColor: string;
  totalChapters: number;
  completedChapters: number;
  progressPercentage: number;
  totalMaterials: number;
  parts?: Part[];
  directChapters?: Chapter[];
};

export type SubjectCurriculumData = {
  id: string;
  subjectName: string;
  subjectCode: string;
  grade: string;
  leadTeacher: string;
  overallProgress: number;
  totalBooks: number;
  totalChapters: number;
  completedChapters: number;
  totalMaterials: number;
  books: Book[];
};

export const MOCK_CURRICULUM_DATA: SubjectCurriculumData[] = [
  {
    id: 'subj-math',
    subjectName: 'Mathematics',
    subjectCode: 'MATH-101',
    grade: 'Grade 10',
    leadTeacher: 'Mr. Rajesh Gupta',
    overallProgress: 0,
    totalBooks: 2,
    totalChapters: 21,
    completedChapters: 0,
    totalMaterials: 28,
    books: [
      {
        id: 'book-ncert-math',
        title: 'NCERT Mathematics Class X',
        publisher: 'NCERT Official',
        edition: '2026 Revised Edition',
        coverColor: '#4F46E5',
        totalChapters: 15,
        completedChapters: 0,
        progressPercentage: 0,
        totalMaterials: 18,
        parts: [
          {
            id: 'part-1',
            partNumber: 1,
            title: 'Part I: Number Systems & Algebra',
            description: 'Core foundational algebra concepts, polynomials, and equations',
            chapters: [
              {
                id: 'ch-1',
                chapterNumber: 1,
                title: 'Real Numbers',
                description: 'Euclid division lemma, Fundamental Theorem of Arithmetic, Rational & Irrational proofs',
                isCompleted: false,
                completionPercentage: 0,
                topics: [
                  {
                    id: 't-1-1',
                    title: "Euclid's Division Lemma",
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-1-1-1', title: 'Statement & Proof of Lemma', isCompleted: false },
                      { id: 'st-1-1-2', title: 'Computing HCF using Lemma Algorithm', isCompleted: false },
                    ],
                  },
                  {
                    id: 't-1-2',
                    title: 'Fundamental Theorem of Arithmetic',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-1-2-1', title: 'Prime Factorisation Trees', isCompleted: false },
                      { id: 'st-1-2-2', title: 'Relationship between HCF & LCM', isCompleted: false },
                    ],
                  },
                  {
                    id: 't-1-3',
                    title: 'Revisiting Irrational Numbers',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-1-3-1', title: 'Proof by Contradiction for √2 and √3', isCompleted: false },
                      { id: 'st-1-3-2', title: 'Decimal Expansions of Rational Numbers', isCompleted: false },
                    ],
                  },
                ],
                materials: [
                  {
                    id: 'mat-1',
                    title: 'Real Numbers Chapter Handout & Formula Sheet.pdf',
                    type: 'pdf',
                    fileSize: '2.4 MB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '12 May 2026',
                    description: 'Comprehensive formula summary, Euclid division algorithm flowchart, and previous 5 years board exam problems.',
                    downloadCount: 142,
                  },
                  {
                    id: 'mat-2',
                    title: 'Euclid Division Algorithm Step-by-Step Video Lecture',
                    type: 'video',
                    duration: '18 mins',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '14 May 2026',
                    description: 'Video walk-through explaining prime factorization trees and step-by-step HCF computation techniques.',
                  },
                  {
                    id: 'mat-3',
                    title: 'Class Test 1 - Real Numbers Question Paper.pdf',
                    type: 'worksheet',
                    fileSize: '850 KB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '18 May 2026',
                    description: 'Classroom practice test containing 10 MCQs and 5 long answer irrational proof questions.',
                    downloadCount: 98,
                  },
                  {
                    id: 'mat-4',
                    title: 'Irrational Proofs Board Exam Tips & Notes',
                    type: 'note',
                    fileSize: '1.1 MB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '20 May 2026',
                    description: 'Proof by contradiction template for square root numbers (√2, √3, √5) and recurring decimal expansions.',
                  },
                ],
                homeworks: [
                  {
                    id: 'hw-mock-1',
                    title: 'Exercise 1.2 Prime Factorization & HCF Proofs',
                    assignedDate: '2026-07-12',
                    dueDate: '2026-07-14',
                    dueTime: '04:00 PM',
                    assignedBy: 'Ms. Priya Singh',
                    grade: 'Grade 10',
                    section: 'Section A',
                    description: 'Solve questions 1 to 10 from NCERT Chapter 1 in your homework register. Show all prime factor tree steps.',
                    attachments: [
                      { id: 'att-h-1', kind: 'file', label: 'ncert_ex_1.2_handout.pdf' },
                      { id: 'att-h-2', kind: 'link', label: 'Prime Factorisation Video Lecture' },
                    ],
                    submittedCount: 32,
                    totalStudents: 36,
                    status: 'active',
                  },
                  {
                    id: 'hw-mock-2',
                    title: 'Irrationality Proof Drill (√5 and √7)',
                    assignedDate: '2026-07-10',
                    dueDate: '2026-07-11',
                    dueTime: '02:00 PM',
                    assignedBy: 'Ms. Priya Singh',
                    grade: 'Grade 10',
                    section: 'Section A',
                    description: 'Write complete proof by contradiction for irrationality of (3 + 2√5).',
                    attachments: [
                      { id: 'att-h-3', kind: 'file', label: 'contradiction_method_template.docx' },
                    ],
                    submittedCount: 35,
                    totalStudents: 36,
                    status: 'active',
                  },
                ],
              },
              {
                id: 'ch-2',
                chapterNumber: 2,
                title: 'Polynomials',
                description: 'Zeroes of polynomial, relationship between zeroes and coefficients, division algorithm',
                isCompleted: false,
                completionPercentage: 0,
                topics: [
                  {
                    id: 't-2-1',
                    title: 'Geometrical Meaning of Zeroes',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-2-1-1', title: 'Parabola Intersections with X-axis', isCompleted: false },
                      { id: 'st-2-1-2', title: 'Number of Zeroes for Cubic Polynomials', isCompleted: false },
                    ],
                  },
                  {
                    id: 't-2-2',
                    title: 'Relationship between Zeroes & Coefficients',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-2-2-1', title: 'Sum & Product of Zeroes for Quadratic', isCompleted: false },
                      { id: 'st-2-2-2', title: 'Forming Quadratic Polynomials from Zeroes', isCompleted: false },
                    ],
                  },
                ],
                materials: [
                  {
                    id: 'mat-3',
                    title: 'Handwritten Whiteboard Derivations & Factorization Chart',
                    type: 'note',
                    fileSize: '2.1 MB',
                    uploadedBy: 'Ms. Priya Singh',
                    uploadedAt: '25 Aug 2026',
                    timestamp: 1724576400000,
                    description: 'High-resolution whiteboard captures explaining step-by-step polynomial division and formulas.',
                    downloadCount: 51,
                  },
                  {
                    id: 'mat-5',
                    title: 'Polynomials Master Revision Sheet.pdf',
                    type: 'pdf',
                    fileSize: '3.1 MB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '01 Jun 2026',
                    description: 'High-yield revision notes covering relationship between zeroes and coefficients of quadratic & cubic polynomials.',
                    downloadCount: 210,
                  },
                ],
                homeworks: [
                  {
                    id: 'hw-mock-3',
                    title: 'Quadratic Polynomial Zeroes & Verification Worksheet',
                    assignedDate: '2026-07-08',
                    dueDate: '2026-07-10',
                    dueTime: '05:00 PM',
                    assignedBy: 'Ms. Priya Singh',
                    grade: 'Grade 10',
                    section: 'Section A',
                    description: 'Complete Section A & B of the attached worksheet verifying α+β and αβ formulas.',
                    attachments: [
                      { id: 'att-h-4', kind: 'file', label: 'zeroes_verification_worksheet.pdf' },
                    ],
                    submittedCount: 29,
                    totalStudents: 36,
                    status: 'active',
                  },
                ],
              },
              {
                id: 'ch-3',
                chapterNumber: 3,
                title: 'Pair of Linear Equations in Two Variables',
                description: 'Graphical & algebraic methods of solution, substitution, elimination, cross-multiplication',
                isCompleted: false,
                completionPercentage: 0,
                topics: [
                  {
                    id: 't-3-1',
                    title: 'Graphical Method of Solution',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-3-1-1', title: 'Consistent & Inconsistent Systems', isCompleted: false },
                      { id: 'st-3-1-2', title: 'Plotting Intersecting & Parallel Lines', isCompleted: false },
                    ],
                  },
                  {
                    id: 't-3-2',
                    title: 'Algebraic Methods (Substitution & Elimination)',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-3-2-1', title: 'Substitution Method Steps', isCompleted: false },
                      { id: 'st-3-2-2', title: 'Elimination Method Strategy', isCompleted: false },
                    ],
                  },
                  {
                    id: 't-3-3',
                    title: 'Word Problems & Real-life Applications',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-3-3-1', title: 'Speed, Time & Distance Problems', isCompleted: false },
                      { id: 'st-3-3-2', title: 'Upstream & Downstream Boat Motion', isCompleted: false },
                    ],
                  },
                ],
                materials: [
                  {
                    id: 'mat-1',
                    title: 'Linear Equations & Matrices - Complete Summary & Practice Set',
                    type: 'pdf',
                    fileSize: '3.4 MB',
                    uploadedBy: 'Ms. Priya Singh',
                    uploadedAt: 'Today, 10:15 AM',
                    timestamp: 1724750100000,
                    description: 'Detailed formula sheets, solved exemplar questions, and previous 5 years board problems.',
                    downloadCount: 42,
                  },
                  {
                    id: 'mat-8',
                    title: 'Boat Upstream/Downstream Worked Examples Video',
                    type: 'video',
                    duration: '22 mins',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '18 Jun 2026',
                    description: 'Full animated explanation of relative velocity equations for boats, streams, and trains.',
                  },
                  {
                    id: 'mat-9',
                    title: 'Practice Assignment - Word Problems.pdf',
                    type: 'worksheet',
                    fileSize: '920 KB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '22 Jun 2026',
                    description: '15 real-life application word problems covering age problems, geometry problems, and cost calculations.',
                  },
                ],
                homeworks: [
                  {
                    id: 'hw-4',
                    title: 'Linear Equations Graphing & Substitution Practice',
                    assignedDate: '2026-07-11',
                    dueDate: '2026-07-13',
                    dueTime: '04:00 PM',
                    assignedBy: 'Ms. Priya Singh',
                    grade: 'Grade 10',
                    section: 'Section A',
                    description: 'Solve problems 1 to 12 from practice set using substitution and graphical verification.',
                    attachments: [
                      { id: 'att-le-1', kind: 'file', label: 'linear_equations_practice_set.pdf' },
                    ],
                    submittedCount: 31,
                    totalStudents: 36,
                    status: 'active',
                  },
                ],
              },
              {
                id: 'ch-4',
                chapterNumber: 4,
                title: 'Quadratic Equations',
                description: 'Standard form ax²+bx+c=0, roots by factorisation, completing square, quadratic formula',
                isCompleted: false,
                completionPercentage: 0,
                topics: [
                  {
                    id: 't-4-1',
                    title: 'Solution of Quadratic Equations by Factorisation',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-4-1-1', title: 'Splitting Middle Term Technique', isCompleted: false },
                      { id: 'st-4-1-2', title: 'Nature of Roots and Discriminant D', isCompleted: false },
                    ],
                  },
                ],
                materials: [
                  {
                    id: 'mat-quad-1',
                    title: 'Quadratic Formula & Nature of Roots Quick Reference.pdf',
                    type: 'pdf',
                    fileSize: '1.8 MB',
                    uploadedBy: 'Ms. Priya Singh',
                    uploadedAt: '05 Jul 2026',
                    description: 'Derivation of quadratic formula and conditions for real, distinct, and imaginary roots.',
                  },
                ],
                homeworks: [
                  {
                    id: 'hw-2',
                    title: 'Quadratic Equations Exercise 4.2 Proofs',
                    assignedDate: '2026-07-12',
                    dueDate: '2026-07-14',
                    dueTime: '11:00 AM',
                    assignedBy: 'Ms. Priya Singh',
                    grade: 'Grade 10',
                    section: 'Section A',
                    description: 'Solve problems 1 to 15 in homework notebook with all steps shown.',
                    attachments: [
                      { id: 'att-3', kind: 'file', label: 'ncert_ex_4.2_solutions.pdf' },
                    ],
                    submittedCount: 34,
                    totalStudents: 36,
                    status: 'active',
                  },
                ],
              },
            ],
          },
          {
            id: 'part-2',
            partNumber: 2,
            title: 'Part II: Geometry & Trigonometry',
            description: 'Triangles, coordinate geometry, trigonometry ratios and identities',
            chapters: [
              {
                id: 'ch-5',
                chapterNumber: 5,
                title: 'Triangles & Similarity',
                description: 'Thales theorem, AAA, SSS, SAS similarity criteria, area ratio of similar triangles',
                isCompleted: false,
                completionPercentage: 0,
                topics: [
                  {
                    id: 't-4-1',
                    title: 'Basic Proportionality Theorem (Thales Theorem)',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-4-1-1', title: 'BPT Proof & Corollary', isCompleted: false },
                      { id: 'st-4-1-2', title: 'Converse of BPT', isCompleted: false },
                    ],
                  },
                  {
                    id: 't-4-2',
                    title: 'Criteria for Similarity of Triangles',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-4-2-1', title: 'AAA & AA Similarity Rules', isCompleted: false },
                      { id: 'st-4-2-2', title: 'SSS & SAS Similarity Proofs', isCompleted: false },
                    ],
                  },
                ],
                materials: [
                  {
                    id: 'mat-10',
                    title: 'Thales Theorem Visual Proof PDF.pdf',
                    type: 'pdf',
                    fileSize: '4.2 MB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '02 Jul 2026',
                    description: 'Color geometric proofs of Basic Proportionality Theorem, converse of BPT, and area of similar triangles.',
                  },
                ],
              },
              {
                id: 'ch-6',
                chapterNumber: 6,
                title: 'Introduction to Trigonometry',
                description: 'Trigonometric ratios, values for 0°, 30°, 45°, 60°, 90°, standard identities',
                isCompleted: false,
                completionPercentage: 0,
                topics: [
                  {
                    id: 't-5-1',
                    title: 'Trigonometric Ratios of Right Triangle',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-5-1-1', title: 'Sin, Cos, Tan, Cosec, Sec, Cot Definition', isCompleted: false },
                      { id: 'st-5-1-2', title: 'Reciprocal & Quotient Relations', isCompleted: false },
                    ],
                  },
                ],
                materials: [
                  {
                    id: 'mat-11',
                    title: 'Trigonometry Ratios Memory Table Cheat Sheet.pdf',
                    type: 'pdf',
                    fileSize: '1.2 MB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '10 Jul 2026',
                    description: 'Quick memory tricks and reciprocal relations for standard angles (0°, 30°, 45°, 60°, 90°).',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'book-rd-sharma',
        title: 'R.D. Sharma Mathematics Volume 1',
        publisher: 'Dhanpat Rai Publications',
        edition: 'Comprehensive Practice Edition',
        coverColor: '#059669',
        totalChapters: 6,
        completedChapters: 0,
        progressPercentage: 0,
        totalMaterials: 10,
        directChapters: [
          {
            id: 'rd-ch-1',
            chapterNumber: 1,
            title: 'Advanced Real Numbers Practice',
            description: 'High order thinking skill (HOTS) questions and Olympiad problems',
            isCompleted: false,
            completionPercentage: 0,
            topics: [
              {
                id: 'rd-t-1',
                title: 'HOTS Problems on Euclid Lemma',
                isCompleted: false,
                subTopics: [
                  { id: 'rd-st-1', title: '3-digit & 4-digit Number Proofs', isCompleted: false },
                ],
              },
            ],
            materials: [
              {
                id: 'mat-12',
                title: 'RD Sharma Real Numbers HOTS Solutions.pdf',
                type: 'pdf',
                fileSize: '5.1 MB',
                uploadedBy: 'Mr. Rajesh Gupta',
                uploadedAt: '05 May 2026',
                description: 'Full solutions to high difficulty level problems from R.D. Sharma Chapter 1.',
              },
            ],
          },
          {
            id: 'rd-ch-2',
            chapterNumber: 2,
            title: 'Polynomial Division & Factorisation',
            description: 'Advanced factorisation, synthetic division, cubic polynomial roots',
            isCompleted: false,
            completionPercentage: 0,
            topics: [
              {
                id: 'rd-t-2',
                title: 'Symmetric Functions of Zeroes',
                isCompleted: false,
                subTopics: [
                  { id: 'rd-st-2', title: 'Alpha^2 + Beta^2 and Alpha/Beta Calculations', isCompleted: false },
                ],
              },
            ],
            materials: [
              {
                id: 'mat-13',
                title: 'Symmetric Functions Notes.pdf',
                type: 'note',
                fileSize: '1.5 MB',
                uploadedBy: 'Mr. Rajesh Gupta',
                uploadedAt: '25 May 2026',
                description: 'Handwritten formulas and shortcuts for symmetric functions of quadratic zeroes.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'subj-physics',
    subjectName: 'Physics',
    subjectCode: 'PHY-102',
    grade: 'Grade 10',
    leadTeacher: 'Dr. Neha Verma',
    overallProgress: 0,
    totalBooks: 1,
    totalChapters: 8,
    completedChapters: 0,
    totalMaterials: 14,
    books: [
      {
        id: 'book-ncert-phy',
        title: 'NCERT Science (Physics Section)',
        publisher: 'NCERT Official',
        edition: '2026 Edition',
        coverColor: '#2563EB',
        totalChapters: 8,
        completedChapters: 0,
        progressPercentage: 0,
        totalMaterials: 14,
        directChapters: [
          {
            id: 'phy-ch-1',
            chapterNumber: 1,
            title: 'Light - Reflection & Refraction',
            description: 'Spherical mirrors, mirror formula, refraction through glass slab & lenses',
            isCompleted: false,
            completionPercentage: 0,
            topics: [
              {
                id: 'phy-t-1',
                title: 'Reflection by Spherical Mirrors',
                isCompleted: false,
                subTopics: [
                  { id: 'pst-1', title: 'Concave & Convex Mirror Ray Diagrams', isCompleted: false },
                  { id: 'pst-2', title: 'Mirror Formula & Sign Convention', isCompleted: false },
                ],
              },
            ],
            materials: [
              {
                id: 'mat-14',
                title: 'Ray Diagrams Complete Printable Chart.pdf',
                type: 'pdf',
                fileSize: '3.8 MB',
                uploadedBy: 'Dr. Neha Verma',
                uploadedAt: '10 Jun 2026',
                description: 'High-resolution printable cheat sheet for all 6 concave and 2 convex mirror ray diagram cases.',
              },
              {
                id: 'mat-2',
                title: 'Ray Optics Interactive 3D Simulation & Video Lecture',
                type: 'link',
                url: 'https://youtube.com/watch?v=optics-simulation-demo',
                uploadedBy: 'Ms. Priya Singh',
                uploadedAt: 'Yesterday, 3:45 PM',
                timestamp: 1724683500000,
                description: 'Interactive ray diagrams, focal length derivations, and video walk-through of laboratory optics.',
                downloadCount: 68,
              },
            ],
            homeworks: [
              {
                id: 'hw-5',
                title: 'Spherical Mirrors Ray Diagram & Focal Length Drill',
                assignedDate: '2026-07-12',
                dueDate: '2026-07-14',
                dueTime: '03:00 PM',
                assignedBy: 'Ms. Priya Singh',
                grade: 'Grade 10',
                section: 'Section B',
                description: 'Draw 6 ray diagram cases for concave mirror and calculate focal lengths for given object distances.',
                attachments: [
                  { id: 'att-p1', kind: 'file', label: 'ray_diagrams_worksheet.pdf' },
                ],
                submittedCount: 30,
                totalStudents: 36,
                status: 'active',
              },
            ],
          },
          {
            id: 'phy-ch-2',
            chapterNumber: 2,
            title: 'Human Eye & Colorful World',
            description: 'Eye structure, vision defects, prism dispersion, scattering of light',
            isCompleted: false,
            completionPercentage: 0,
            topics: [
              {
                id: 'phy-t-2',
                title: 'Defects of Vision & Correction',
                isCompleted: false,
                subTopics: [
                  { id: 'pst-3', title: 'Myopia, Hypermetropia & Presbyopia', isCompleted: false },
                  { id: 'pst-4', title: 'Lens Power Calculation for Correction', isCompleted: false },
                ],
              },
            ],
            materials: [
              {
                id: 'mat-16',
                title: 'Human Eye Defect Notes & Lab Manual.pdf',
                type: 'pdf',
                fileSize: '2.1 MB',
                uploadedBy: 'Dr. Neha Verma',
                uploadedAt: '20 Jun 2026',
                description: 'Detailed anatomy notes of the human eye, power of accommodation, and atmospheric refraction phenomena.',
              },
            ],
            homeworks: [
              {
                id: 'hw-phy-2',
                title: 'Vision Defects & Correction Power Calculation',
                assignedDate: '2026-07-15',
                dueDate: '2026-07-17',
                dueTime: '04:00 PM',
                assignedBy: 'Dr. Neha Verma',
                grade: 'Grade 10',
                section: 'Section B',
                description: 'Calculate focal length and lens power required to correct myopia of -2.5D with ray diagrams.',
                attachments: [
                  { id: 'att-p2', kind: 'file', label: 'eye_defects_formula_sheet.pdf' },
                ],
                submittedCount: 32,
                totalStudents: 36,
                status: 'active',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'subj-biology',
    subjectName: 'Biology',
    subjectCode: 'BIO-104',
    grade: 'Grade 10',
    leadTeacher: 'Dr. Ramesh Kumar',
    overallProgress: 0,
    totalBooks: 1,
    totalChapters: 6,
    completedChapters: 0,
    totalMaterials: 8,
    books: [
      {
        id: 'book-ncert-bio',
        title: 'NCERT Living Science (Biology)',
        publisher: 'NCERT Official',
        edition: '2026 Edition',
        coverColor: '#059669',
        totalChapters: 6,
        completedChapters: 0,
        progressPercentage: 0,
        totalMaterials: 8,
        directChapters: [
          {
            id: 'bio-ch-1',
            chapterNumber: 1,
            title: 'Life Processes & Nutrition',
            description: 'Autotrophic & heterotrophic nutrition, human digestive system, respiration, circulatory system',
            isCompleted: false,
            completionPercentage: 0,
            topics: [
              {
                id: 'bio-t-1',
                title: 'Human Alimentary Canal',
                isCompleted: false,
                subTopics: [
                  { id: 'bst-1', title: 'Stomach & Pancreatic Enzymes', isCompleted: false },
                  { id: 'bst-2', title: 'Small Intestinal Villi Absorption', isCompleted: false },
                ],
              },
            ],
            materials: [
              {
                id: 'mat-b1',
                title: 'Human Digestive System Color Illustrated Handout.pdf',
                type: 'pdf',
                fileSize: '3.2 MB',
                uploadedBy: 'Dr. Ramesh Kumar',
                uploadedAt: '15 May 2026',
                description: 'Full-color diagrams of the human digestive tract, enzymatic pathways, and ATP yield comparison.',
              },
            ],
            homeworks: [
              {
                id: 'hw-bio-1',
                title: 'Alimentary Canal Enzyme Mapping Worksheet',
                assignedDate: '2026-07-10',
                dueDate: '2026-07-12',
                dueTime: '05:00 PM',
                assignedBy: 'Dr. Ramesh Kumar',
                grade: 'Grade 10',
                section: 'Section A',
                description: 'Map saliva, gastric juice, bile, and pancreatic juice enzymes with target food components.',
                attachments: [
                  { id: 'att-b1', kind: 'file', label: 'enzyme_mapping_table.pdf' },
                ],
                submittedCount: 34,
                totalStudents: 36,
                status: 'active',
              },
            ],
          },
          {
            id: 'bio-ch-2',
            chapterNumber: 2,
            title: 'Cell Division & Mitosis',
            description: 'Phases of cell cycle, mitosis, meiosis, chromosome pairing, genetic inheritance',
            isCompleted: false,
            completionPercentage: 0,
            topics: [
              {
                id: 'bio-t-2',
                title: 'Mitosis Phases (Prophase to Telophase)',
                isCompleted: false,
                subTopics: [
                  { id: 'bst-3', title: 'Spindle Apparatus & Chromatid Separation', isCompleted: false },
                  { id: 'bst-4', title: 'Cytokinesis in Plant vs Animal Cells', isCompleted: false },
                ],
              },
            ],
            materials: [
              {
                id: 'mat-4',
                title: 'Genetics, Punnett Squares & Mendel Laws - Practice Notes',
                type: 'pdf',
                fileSize: '4.8 MB',
                uploadedBy: 'Ms. Priya Singh',
                uploadedAt: '22 Aug 2026',
                description: 'Step-by-step monohybrid and dihybrid cross explanations with illustrated Punnett squares.',
                downloadCount: 88,
              },
            ],
            homeworks: [
              {
                id: 'hw-1',
                title: 'Cell Division Worksheet & Mitosis Phases',
                assignedDate: '2026-07-12',
                dueDate: '2026-07-13',
                dueTime: '09:00 AM',
                assignedBy: 'Ms. Priya Singh',
                grade: 'Grade 10',
                section: 'Section A',
                description: 'Complete the diagram labeling for Anaphase and Metaphase. Submit before 4 PM.',
                attachments: [
                  { id: 'att-1', kind: 'file', label: 'mitosis_diagram_worksheet.pdf' },
                  { id: 'att-2', kind: 'link', label: 'Khan Academy Mitosis Video' },
                ],
                submittedCount: 28,
                totalStudents: 36,
                status: 'active',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'subj-english',
    subjectName: 'English Literature',
    subjectCode: 'ENG-103',
    grade: 'Grade 10',
    leadTeacher: 'Mrs. Sonia Kapoor',
    overallProgress: 0,
    totalBooks: 2,
    totalChapters: 12,
    completedChapters: 0,
    totalMaterials: 16,
    books: [
      {
        id: 'book-first-flight',
        title: 'First Flight - Prose & Poetry',
        publisher: 'NCERT Official',
        edition: '2026 Edition',
        coverColor: '#DB2777',
        totalChapters: 8,
        completedChapters: 0,
        progressPercentage: 0,
        totalMaterials: 10,
        directChapters: [
          {
            id: 'eng-ch-1',
            chapterNumber: 1,
            title: 'A Letter to God (Prose)',
            description: 'Lencho faith in God, hailstorm description, postmaster gesture',
            isCompleted: false,
            completionPercentage: 0,
            topics: [
              {
                id: 'eng-t-1',
                title: 'Character Sketch of Lencho & Postmaster',
                isCompleted: false,
                subTopics: [
                  { id: 'est-1', title: 'Irony in the Story Ending', isCompleted: false },
                ],
              },
            ],
            materials: [
              {
                id: 'mat-17',
                title: 'A Letter to God Question Answers Bank.pdf',
                type: 'pdf',
                fileSize: '1.6 MB',
                uploadedBy: 'Mrs. Sonia Kapoor',
                uploadedAt: '05 Apr 2026',
                description: 'NCERT back exercise solutions, RTC (reference to context) extracts, and character sketch answers.',
              },
            ],
            homeworks: [
              {
                id: 'hw-eng-1',
                title: 'Short Answer Test on A Letter to God',
                assignedDate: '2026-07-09',
                dueDate: '2026-07-11',
                dueTime: '02:00 PM',
                assignedBy: 'Mrs. Sonia Kapoor',
                grade: 'Grade 10',
                section: 'Section A',
                description: 'Answer 5 board examination format questions highlighting the conflict between humans and nature.',
                attachments: [
                  { id: 'att-e1', kind: 'file', label: 'letter_to_god_test.pdf' },
                ],
                submittedCount: 36,
                totalStudents: 36,
                status: 'active',
              },
            ],
          },
          {
            id: 'eng-ch-4',
            chapterNumber: 4,
            title: 'Poetry & Literature Appreciation',
            description: 'Robert Frost symbolism, Shakespearean drama, rhyme scheme, metaphors and tone',
            isCompleted: false,
            completionPercentage: 0,
            topics: [
              {
                id: 'eng-t-4',
                title: 'The Road Not Taken & Renaissance Literature',
                isCompleted: false,
                subTopics: [
                  { id: 'est-4', title: 'Symbolism of Yellow Wood and Divergence', isCompleted: false },
                ],
              },
            ],
            materials: [
              {
                id: 'mat-5',
                title: 'Shakespearean Drama & Tragedy - Critical Analysis Guide',
                type: 'pdf',
                fileSize: '5.2 MB',
                uploadedBy: 'Ms. Priya Singh',
                uploadedAt: '20 Aug 2026',
                description: 'In-depth character analysis of Macbeth and Lady Macbeth, dramatic irony techniques, and historical context.',
                downloadCount: 94,
              },
            ],
            homeworks: [
              {
                id: 'hw-3',
                title: 'Essay: The Road Not Taken Analysis',
                assignedDate: '2026-07-13',
                dueDate: '2026-07-15',
                dueTime: '09:30 AM',
                assignedBy: 'Ms. Priya Singh',
                grade: 'Grade 9',
                section: 'Section C',
                description: 'Write a 300-word critical appreciation of Robert Frost poem focusing on symbolism.',
                attachments: [],
                submittedCount: 18,
                totalStudents: 40,
                status: 'active',
              },
            ],
          },
        ],
      },
    ],
  },
];
