export type MaterialType = 'pdf' | 'note' | 'video' | 'worksheet' | 'link';

export type StudyMaterial = {
  id: string;
  title: string;
  type: MaterialType;
  fileSize?: string;
  duration?: string; // For videos
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  downloadCount?: number;
};

export type SubTopic = {
  id: string;
  title: string;
  isCompleted: boolean;
};

export type Topic = {
  id: string;
  title: string;
  isCompleted: boolean;
  subTopics?: SubTopic[];
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
    overallProgress: 68,
    totalBooks: 2,
    totalChapters: 21,
    completedChapters: 14,
    totalMaterials: 28,
    books: [
      {
        id: 'book-ncert-math',
        title: 'NCERT Mathematics Class X',
        publisher: 'NCERT Official',
        edition: '2026 Revised Edition',
        coverColor: '#4F46E5',
        totalChapters: 15,
        completedChapters: 10,
        progressPercentage: 67,
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
                isCompleted: true,
                completionPercentage: 100,
                topics: [
                  {
                    id: 't-1-1',
                    title: "Euclid's Division Lemma",
                    isCompleted: true,
                    subTopics: [
                      { id: 'st-1-1-1', title: 'Statement & Proof of Lemma', isCompleted: true },
                      { id: 'st-1-1-2', title: 'Computing HCF using Lemma Algorithm', isCompleted: true },
                    ],
                  },
                  {
                    id: 't-1-2',
                    title: 'Fundamental Theorem of Arithmetic',
                    isCompleted: true,
                    subTopics: [
                      { id: 'st-1-2-1', title: 'Prime Factorisation Trees', isCompleted: true },
                      { id: 'st-1-2-2', title: 'Relationship between HCF & LCM', isCompleted: true },
                    ],
                  },
                  {
                    id: 't-1-3',
                    title: 'Revisiting Irrational Numbers',
                    isCompleted: true,
                    subTopics: [
                      { id: 'st-1-3-1', title: 'Proof by Contradiction for √2 and √3', isCompleted: true },
                      { id: 'st-1-3-2', title: 'Decimal Expansions of Rational Numbers', isCompleted: true },
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
                    downloadCount: 142,
                  },
                  {
                    id: 'mat-2',
                    title: 'Euclid Division Algorithm Step-by-Step Video Lecture',
                    type: 'video',
                    duration: '18 mins',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '14 May 2026',
                  },
                  {
                    id: 'mat-3',
                    title: 'Class Test 1 - Real Numbers Question Paper.pdf',
                    type: 'worksheet',
                    fileSize: '850 KB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '18 May 2026',
                    downloadCount: 98,
                  },
                  {
                    id: 'mat-4',
                    title: 'Irrational Proofs Board Exam Tips & Notes',
                    type: 'note',
                    fileSize: '1.1 MB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '20 May 2026',
                  },
                ],
              },
              {
                id: 'ch-2',
                chapterNumber: 2,
                title: 'Polynomials',
                description: 'Zeroes of polynomial, relationship between zeroes and coefficients, division algorithm',
                isCompleted: true,
                completionPercentage: 100,
                topics: [
                  {
                    id: 't-2-1',
                    title: 'Geometrical Meaning of Zeroes',
                    isCompleted: true,
                    subTopics: [
                      { id: 'st-2-1-1', title: 'Parabola Intersections with X-axis', isCompleted: true },
                      { id: 'st-2-1-2', title: 'Number of Zeroes for Cubic Polynomials', isCompleted: true },
                    ],
                  },
                  {
                    id: 't-2-2',
                    title: 'Relationship between Zeroes & Coefficients',
                    isCompleted: true,
                    subTopics: [
                      { id: 'st-2-2-1', title: 'Sum & Product of Zeroes for Quadratic', isCompleted: true },
                      { id: 'st-2-2-2', title: 'Forming Quadratic Polynomials from Zeroes', isCompleted: true },
                    ],
                  },
                ],
                materials: [
                  {
                    id: 'mat-5',
                    title: 'Polynomials Master Revision Sheet.pdf',
                    type: 'pdf',
                    fileSize: '3.1 MB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '01 Jun 2026',
                    downloadCount: 210,
                  },
                  {
                    id: 'mat-6',
                    title: 'Homework Worksheet 2 - Polynomial Division.pdf',
                    type: 'worksheet',
                    fileSize: '620 KB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '04 Jun 2026',
                  },
                ],
              },
              {
                id: 'ch-3',
                chapterNumber: 3,
                title: 'Pair of Linear Equations in Two Variables',
                description: 'Graphical & algebraic methods of solution, substitution, elimination, cross-multiplication',
                isCompleted: false,
                completionPercentage: 75,
                topics: [
                  {
                    id: 't-3-1',
                    title: 'Graphical Method of Solution',
                    isCompleted: true,
                    subTopics: [
                      { id: 'st-3-1-1', title: 'Consistent & Inconsistent Systems', isCompleted: true },
                      { id: 'st-3-1-2', title: 'Plotting Intersecting & Parallel Lines', isCompleted: true },
                    ],
                  },
                  {
                    id: 't-3-2',
                    title: 'Algebraic Methods (Substitution & Elimination)',
                    isCompleted: true,
                    subTopics: [
                      { id: 'st-3-2-1', title: 'Substitution Method Steps', isCompleted: true },
                      { id: 'st-3-2-2', title: 'Elimination Method Strategy', isCompleted: true },
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
                    id: 'mat-7',
                    title: 'Linear Equations Graphing Guide.pdf',
                    type: 'pdf',
                    fileSize: '1.8 MB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '15 Jun 2026',
                  },
                  {
                    id: 'mat-8',
                    title: 'Boat Upstream/Downstream Worked Examples Video',
                    type: 'video',
                    duration: '22 mins',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '18 Jun 2026',
                  },
                  {
                    id: 'mat-9',
                    title: 'Practice Assignment - Word Problems.pdf',
                    type: 'worksheet',
                    fileSize: '920 KB',
                    uploadedBy: 'Mr. Rajesh Gupta',
                    uploadedAt: '22 Jun 2026',
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
                id: 'ch-4',
                chapterNumber: 4,
                title: 'Triangles & Similarity',
                description: 'Thales theorem, AAA, SSS, SAS similarity criteria, area ratio of similar triangles',
                isCompleted: false,
                completionPercentage: 40,
                topics: [
                  {
                    id: 't-4-1',
                    title: 'Basic Proportionality Theorem (Thales Theorem)',
                    isCompleted: true,
                    subTopics: [
                      { id: 'st-4-1-1', title: 'BPT Proof & Corollary', isCompleted: true },
                      { id: 'st-4-1-2', title: 'Converse of BPT', isCompleted: true },
                    ],
                  },
                  {
                    id: 't-4-2',
                    title: 'Criteria for Similarity of Triangles',
                    isCompleted: false,
                    subTopics: [
                      { id: 'st-4-2-1', title: 'AAA & AA Similarity Rules', isCompleted: true },
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
                  },
                ],
              },
              {
                id: 'ch-5',
                chapterNumber: 5,
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
        completedChapters: 4,
        progressPercentage: 66,
        totalMaterials: 10,
        directChapters: [
          {
            id: 'rd-ch-1',
            chapterNumber: 1,
            title: 'Advanced Real Numbers Practice',
            description: 'High order thinking skill (HOTS) questions and Olympiad problems',
            isCompleted: true,
            completionPercentage: 100,
            topics: [
              {
                id: 'rd-t-1',
                title: 'HOTS Problems on Euclid Lemma',
                isCompleted: true,
                subTopics: [
                  { id: 'rd-st-1', title: '3-digit & 4-digit Number Proofs', isCompleted: true },
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
              },
            ],
          },
          {
            id: 'rd-ch-2',
            chapterNumber: 2,
            title: 'Polynomial Division & Factorisation',
            description: 'Advanced factorisation, synthetic division, cubic polynomial roots',
            isCompleted: true,
            completionPercentage: 100,
            topics: [
              {
                id: 'rd-t-2',
                title: 'Symmetric Functions of Zeroes',
                isCompleted: true,
                subTopics: [
                  { id: 'rd-st-2', title: 'Alpha^2 + Beta^2 and Alpha/Beta Calculations', isCompleted: true },
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
    overallProgress: 55,
    totalBooks: 1,
    totalChapters: 8,
    completedChapters: 4,
    totalMaterials: 14,
    books: [
      {
        id: 'book-ncert-phy',
        title: 'NCERT Science (Physics Section)',
        publisher: 'NCERT Official',
        edition: '2026 Edition',
        coverColor: '#2563EB',
        totalChapters: 8,
        completedChapters: 4,
        progressPercentage: 50,
        totalMaterials: 14,
        directChapters: [
          {
            id: 'phy-ch-1',
            chapterNumber: 1,
            title: 'Light - Reflection & Refraction',
            description: 'Spherical mirrors, mirror formula, refraction through glass slab & lenses',
            isCompleted: true,
            completionPercentage: 100,
            topics: [
              {
                id: 'phy-t-1',
                title: 'Reflection by Spherical Mirrors',
                isCompleted: true,
                subTopics: [
                  { id: 'pst-1', title: 'Concave & Convex Mirror Ray Diagrams', isCompleted: true },
                  { id: 'pst-2', title: 'Mirror Formula & Sign Convention', isCompleted: true },
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
              },
              {
                id: 'mat-15',
                title: 'Mirror Formula Numerical Solving Technique Video',
                type: 'video',
                duration: '25 mins',
                uploadedBy: 'Dr. Neha Verma',
                uploadedAt: '12 Jun 2026',
              },
            ],
          },
          {
            id: 'phy-ch-2',
            chapterNumber: 2,
            title: 'Human Eye & Colorful World',
            description: 'Eye structure, vision defects, prism dispersion, scattering of light',
            isCompleted: true,
            completionPercentage: 100,
            topics: [
              {
                id: 'phy-t-2',
                title: 'Defects of Vision & Correction',
                isCompleted: true,
                subTopics: [
                  { id: 'pst-3', title: 'Myopia, Hypermetropia & Presbyopia', isCompleted: true },
                  { id: 'pst-4', title: 'Lens Power Calculation for Correction', isCompleted: true },
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
    overallProgress: 75,
    totalBooks: 2,
    totalChapters: 12,
    completedChapters: 9,
    totalMaterials: 16,
    books: [
      {
        id: 'book-first-flight',
        title: 'First Flight - Prose & Poetry',
        publisher: 'NCERT Official',
        edition: '2026 Edition',
        coverColor: '#DB2777',
        totalChapters: 8,
        completedChapters: 6,
        progressPercentage: 75,
        totalMaterials: 10,
        directChapters: [
          {
            id: 'eng-ch-1',
            chapterNumber: 1,
            title: 'A Letter to God (Prose)',
            description: 'Lencho faith in God, hailstorm description, postmaster gesture',
            isCompleted: true,
            completionPercentage: 100,
            topics: [
              {
                id: 'eng-t-1',
                title: 'Character Sketch of Lencho & Postmaster',
                isCompleted: true,
                subTopics: [
                  { id: 'est-1', title: 'Irony in the Story Ending', isCompleted: true },
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
              },
            ],
          },
        ],
      },
    ],
  },
];
