import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  BookOpen,
  CheckCircle2,
  Copy,
  Plus,
  X,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Search,
  Filter,
  Check,
  RotateCcw,
  Save,
  Layers,
  Award,
  GraduationCap,
  School,
  FolderOpen,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Hash,
  UserPlus,
  Users,
  UserCheck,
  UserMinus,
  Briefcase,
  User,
  Trash2,
  GripVertical,
  GripHorizontal,
  Shuffle,
  AlertTriangle,
  SlidersHorizontal,
  ArrowLeftRight,
  Undo2,
  Pencil,
} from "lucide-react";

export interface Teacher {
  id: string;
  name: string;
  role: string;
  department: string;
  specialization: string;
  avatarColor: string;
  initials: string;
  workload?: string;
  email?: string;
}

export const MOCK_FACULTY: Teacher[] = [
  {
    id: "tch_1",
    name: "Ms. Priya Sharma",
    role: "Senior Faculty",
    department: "Commerce & Management",
    specialization: "Accountancy, Business Studies, Economics",
    avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20",
    initials: "PS",
    workload: "16 / 24 periods/wk",
    email: "priya.sharma@stxaviers.edu.in",
  },
  {
    id: "tch_2",
    name: "Dr. Rajesh Verma",
    role: "Faculty",
    department: "Languages",
    specialization: "Hindi, Sanskrit",
    avatarColor: "bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-xs shadow-indigo-500/20",
    initials: "RV",
    workload: "18 / 24 periods/wk",
    email: "rajesh.verma@stxaviers.edu.in",
  },
  {
    id: "tch_3",
    name: "Mr. Amit Singh",
    role: "Senior Faculty (HOD)",
    department: "Mathematics",
    specialization: "Mathematics, Applied Mathematics",
    avatarColor: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs shadow-blue-500/20",
    initials: "AS",
    workload: "20 / 24 periods/wk",
    email: "amit.singh@stxaviers.edu.in",
  },
  {
    id: "tch_4",
    name: "Mrs. Sunita Rao",
    role: "Faculty",
    department: "Science",
    specialization: "Physics, Science, EVS",
    avatarColor: "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xs shadow-purple-500/20",
    initials: "SR",
    workload: "14 / 24 periods/wk",
    email: "sunita.rao@stxaviers.edu.in",
  },
  {
    id: "tch_5",
    name: "Mr. Vikram Malhotra",
    role: "Faculty",
    department: "Computer Science & AI",
    specialization: "Computer Science, AI & Robotics, Informatics Practices",
    avatarColor: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/20",
    initials: "VM",
    workload: "15 / 24 periods/wk",
    email: "vikram.m@stxaviers.edu.in",
  },
  {
    id: "tch_6",
    name: "Ms. Ananya Roy",
    role: "Faculty",
    department: "Languages",
    specialization: "English Literature, Core English",
    avatarColor: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs shadow-rose-500/20",
    initials: "AR",
    workload: "17 / 24 periods/wk",
    email: "ananya.roy@stxaviers.edu.in",
  },
  {
    id: "tch_7",
    name: "Dr. K. S. Mukherjee",
    role: "Senior Faculty (HOD)",
    department: "Science",
    specialization: "Chemistry, Science",
    avatarColor: "bg-gradient-to-br from-teal-500 to-emerald-700 text-white shadow-xs shadow-teal-500/20",
    initials: "KM",
    workload: "19 / 24 periods/wk",
    email: "ks.mukherjee@stxaviers.edu.in",
  },
  {
    id: "tch_8",
    name: "Mrs. Deepa Nambiar",
    role: "Faculty",
    department: "Science",
    specialization: "Biology, Biotechnology, Science, EVS",
    avatarColor: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xs shadow-cyan-500/20",
    initials: "DN",
    workload: "15 / 24 periods/wk",
    email: "deepa.n@stxaviers.edu.in",
  },
  {
    id: "tch_9",
    name: "Mr. Rakesh Gupta",
    role: "Faculty",
    department: "Social Sciences",
    specialization: "History, Political Science, Social Studies, Geography",
    avatarColor: "bg-gradient-to-br from-amber-600 to-yellow-600 text-white shadow-xs shadow-amber-600/20",
    initials: "RG",
    workload: "18 / 24 periods/wk",
    email: "rakesh.gupta@stxaviers.edu.in",
  },
  {
    id: "tch_10",
    name: "Ms. Neha Kapoor",
    role: "Faculty",
    department: "Creative Arts",
    specialization: "Art & Craft, Music, Painting, Activity",
    avatarColor: "bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white shadow-xs shadow-fuchsia-500/20",
    initials: "NK",
    workload: "12 / 24 periods/wk",
    email: "neha.kapoor@stxaviers.edu.in",
  },
  {
    id: "tch_11",
    name: "Mr. Gurpreet Singh",
    role: "Sports Director",
    department: "Physical Education",
    specialization: "Physical Education, Sports Training, Health Science",
    avatarColor: "bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xs shadow-red-500/20",
    initials: "GS",
    workload: "10 / 24 periods/wk",
    email: "gurpreet.singh@stxaviers.edu.in",
  },
];

export interface AssignedSubject {
  name: string;
  code: string | null;
  stream?: string;
  isCustom?: boolean;
  isNonAcademic?: boolean;
  assignedTeacher?: {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    role: string;
  } | null;
}

export interface Section {
  id: string;
  name: string;
  stream?: string | null;
  subjects: AssignedSubject[];
  displayOrder?: number;
  classTeacher?: {
    id: string;
    name: string;
    initials: string;
    avatarColor: string;
    role: string;
  } | null;
}

export interface ClassRow {
  id: string;
  name: string;
  shortName: string;
  wingId: string;
  wingName: string;
  gradeLevel: number;
  startDate: string;
  endDate: string;
  sections: Section[];
}

export interface WingDefinition {
  id: string;
  name: string;
  isDefault?: boolean; // true for built-in wings
}

const INITIAL_WINGS: WingDefinition[] = [
  { id: "primary", name: "Primary", isDefault: true },
  { id: "middle", name: "Middle", isDefault: true },
  { id: "secondary", name: "Secondary", isDefault: true },
  { id: "senior", name: "Senior Secondary", isDefault: true },
  { id: "unassigned", name: "Unassigned", isDefault: true },
];

// Build wing names lookup from dynamic wings array
function buildWingNames(wings: WingDefinition[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const w of wings) {
    map[w.id] = w.name;
  }
  return map;
}

// Complete realistic school class dataset ordered from Small to Big
const INITIAL_CLASSES: ClassRow[] = [
  // ──────────────── 1. PRIMARY (I - V) ────────────────
  {
    id: "cls_1",
    name: "Class 1",
    shortName: "Class 1",
    wingId: "primary",
    wingName: "Primary (I - V)",
    gradeLevel: 1,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "1_a",
        name: "Section A",
        displayOrder: 1,
        classTeacher: {
          id: "tch_6",
          name: "Ms. Ananya Roy",
          initials: "AR",
          avatarColor: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-xs shadow-rose-500/20",
          role: "Faculty",
        },
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "EVS", code: "EVS" },
          { name: "Art & Craft", code: "ART", isNonAcademic: true },
          { name: "Music", code: "MUS", isNonAcademic: true },
        ],
      },
      {
        id: "1_b",
        name: "Section B",
        displayOrder: 2,
        classTeacher: {
          id: "tch_2",
          name: "Dr. Rajesh Verma",
          initials: "RV",
          avatarColor: "bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-xs shadow-indigo-500/20",
          role: "Faculty",
        },
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "EVS", code: "EVS" },
          { name: "Art & Craft", code: "ART", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_2",
    name: "Class 2",
    shortName: "Class 2",
    wingId: "primary",
    wingName: "Primary (I - V)",
    gradeLevel: 2,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "2_a",
        name: "Section A",
        displayOrder: 1,
        classTeacher: {
          id: "tch_4",
          name: "Mrs. Sunita Rao",
          initials: "SR",
          avatarColor: "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xs shadow-purple-500/20",
          role: "Faculty",
        },
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "EVS", code: "EVS" },
          { name: "General Knowledge", code: "GK" },
          { name: "Dance", code: "DNC", isNonAcademic: true },
        ],
      },
      {
        id: "2_b",
        name: "Section B",
        displayOrder: 2,
        classTeacher: null,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "EVS", code: "EVS" },
          { name: "Art & Craft", code: "ART", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_3",
    name: "Class 3",
    shortName: "Class 3",
    wingId: "primary",
    wingName: "Primary (I - V)",
    gradeLevel: 3,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "3_a",
        name: "Section A",
        displayOrder: 1,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Studies", code: "SST" },
          { name: "Computer", code: "COM" },
          { name: "Yoga", code: "YOG", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_4",
    name: "Class 4",
    shortName: "Class 4",
    wingId: "primary",
    wingName: "Primary (I - V)",
    gradeLevel: 4,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "4_a",
        name: "Section A",
        displayOrder: 1,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Studies", code: "SST" },
          { name: "Computer", code: "COM" },
          { name: "Physical Education", code: "PE", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_5",
    name: "Class 5",
    shortName: "Class 5",
    wingId: "primary",
    wingName: "Primary (I - V)",
    gradeLevel: 5,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "5_a",
        name: "Section A",
        displayOrder: 1,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "EVS", code: "EVS" },
          { name: "General Knowledge", code: "GK" },
          { name: "Computer", code: "COM" },
          { name: "Art & Craft", code: "ART", isNonAcademic: true },
          { name: "Dance", code: "DNC", isNonAcademic: true },
        ],
      },
      {
        id: "5_b",
        name: "Section B",
        displayOrder: 2,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "EVS", code: "EVS" },
          { name: "General Knowledge", code: "GK" },
          { name: "Computer", code: "COM" },
          { name: "Physical Education", code: "PE", isNonAcademic: true },
        ],
      },
    ],
  },

  // ──────────────── 2. MIDDLE (VI - VIII) ────────────────
  {
    id: "cls_6",
    name: "Class 6",
    shortName: "Class 6",
    wingId: "middle",
    wingName: "Middle (VI - VIII)",
    gradeLevel: 6,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "6_a",
        name: "Section A",
        displayOrder: 1,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Sanskrit", code: "SAN" },
          { name: "Computer", code: "COM" },
          { name: "Sports", code: "SPO", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_7",
    name: "Class 7",
    shortName: "Class 7",
    wingId: "middle",
    wingName: "Middle (VI - VIII)",
    gradeLevel: 7,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "7_a",
        name: "Section A",
        displayOrder: 1,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Sanskrit", code: "SAN" },
          { name: "Computer", code: "COM" },
          { name: "Music", code: "MUS", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_8",
    name: "Class 8",
    shortName: "Class 8",
    wingId: "middle",
    wingName: "Middle (VI - VIII)",
    gradeLevel: 8,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "8_a",
        name: "Section A",
        displayOrder: 1,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Sanskrit", code: "SAN" },
          { name: "Computer", code: "COM" },
          { name: "Yoga", code: "YOG", isNonAcademic: true },
        ],
      },
      {
        id: "8_b",
        name: "Section B",
        displayOrder: 2,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Sanskrit", code: "SAN" },
          { name: "Computer", code: "COM" },
        ],
      },
    ],
  },

  // ──────────────── 3. SECONDARY (IX - X) ────────────────
  {
    id: "cls_9",
    name: "Class 9",
    shortName: "Class 9",
    wingId: "secondary",
    wingName: "Secondary (IX - X)",
    gradeLevel: 9,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "9_a",
        name: "Section A",
        displayOrder: 1,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi Course A", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Artificial Intelligence", code: "AI" },
          { name: "Sports", code: "SPO", isNonAcademic: true },
          { name: "Assembly", code: "ASM", isNonAcademic: true },
        ],
      },
      {
        id: "9_b",
        name: "Section B",
        displayOrder: 2,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi Course A", code: "HIN" },
          { name: "Mathematics", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Information Technology", code: "IT" },
          { name: "Physical Education", code: "PE", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_10",
    name: "Class 10",
    shortName: "Class 10",
    wingId: "secondary",
    wingName: "Secondary (IX - X)",
    gradeLevel: 10,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "10_a",
        name: "Section A",
        displayOrder: 1,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi Course A", code: "HIN" },
          { name: "Mathematics Standard", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Information Technology", code: "IT" },
          { name: "Physical Education", code: "PE", isNonAcademic: true },
          { name: "Library", code: "LIB", isNonAcademic: true },
        ],
      },
      {
        id: "10_b",
        name: "Section B",
        displayOrder: 2,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi Course A", code: "HIN" },
          { name: "Mathematics Basic", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Physical Education", code: "PE", isNonAcademic: true },
        ],
      },
      {
        id: "10_c",
        name: "Section C",
        displayOrder: 3,
        subjects: [
          { name: "English", code: "ENG" },
          { name: "Hindi Course A", code: "HIN" },
          { name: "Mathematics Standard", code: "MAT" },
          { name: "Science", code: "SCI" },
          { name: "Social Science", code: "SST" },
          { name: "Art and Craft", code: "ART", isNonAcademic: true },
        ],
      },
    ],
  },

  // ──────────────── 4. SENIOR SECONDARY (XI - XII) ────────────────
  {
    id: "cls_11_sci",
    name: "Class 11 - Science",
    shortName: "Class 11 Sci",
    wingId: "senior",
    wingName: "Senior Secondary (XI - XII)",
    gradeLevel: 11,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "11_sci_a",
        name: "Section A",
        stream: "science",
        displayOrder: 1,
        subjects: [
          { name: "Physics", code: "PHY" },
          { name: "Chemistry", code: "CHEM" },
          { name: "Mathematics", code: "MAT" },
          { name: "English Core", code: "ENG" },
          { name: "Physical Education", code: "PE", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_11_comm",
    name: "Class 11 - Commerce",
    shortName: "Class 11 Comm",
    wingId: "senior",
    wingName: "Senior Secondary (XI - XII)",
    gradeLevel: 11,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "11_comm_a",
        name: "Section A",
        stream: "commerce",
        displayOrder: 1,
        subjects: [
          { name: "Accountancy", code: "ACC" },
          { name: "Business Studies", code: "BST" },
          { name: "Economics", code: "ECO" },
          { name: "English Core", code: "ENG" },
          { name: "Informatics Practices", code: "IP" },
        ],
      },
    ],
  },
  {
    id: "cls_12_comm",
    name: "Class 12 - Commerce",
    shortName: "Class 12 Comm",
    wingId: "senior",
    wingName: "Senior Secondary (XI - XII)",
    gradeLevel: 12,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "12_comm_a",
        name: "Section A",
        stream: "commerce",
        displayOrder: 1,
        subjects: [
          { name: "Accountancy", code: "ACC" },
          { name: "Business Studies", code: "BST" },
          { name: "Economics", code: "ECO" },
          { name: "English Core", code: "ENG" },
          { name: "Mathematics", code: "MAT" },
          { name: "Yoga", code: "YOG", isNonAcademic: true },
        ],
      },
    ],
  },
  {
    id: "cls_12_sci",
    name: "Class 12 - Science",
    shortName: "Class 12 Sci",
    wingId: "senior",
    wingName: "Senior Secondary (XI - XII)",
    gradeLevel: 12,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    sections: [
      {
        id: "12_sci_a",
        name: "Section A",
        stream: "science",
        displayOrder: 1,
        subjects: [
          { name: "Physics", code: "PHY" },
          { name: "Chemistry", code: "CHEM" },
          { name: "Mathematics", code: "MAT" },
          { name: "English Core", code: "ENG" },
          { name: "Physical Education", code: "PE", isNonAcademic: true },
          { name: "Assembly", code: "ASM", isNonAcademic: true },
        ],
      },
      {
        id: "12_sci_b",
        name: "Section B",
        stream: "science",
        displayOrder: 2,
        subjects: [
          { name: "Physics", code: "PHY" },
          { name: "Chemistry", code: "CHEM" },
          { name: "Biology", code: "BIO" },
          { name: "English Core", code: "ENG" },
          { name: "Physical Education", code: "PE", isNonAcademic: true },
        ],
      },
    ],
  },
];

const PREDEFINED_ACADEMIC = [
  { name: "English", code: "ENG" },
  { name: "Hindi", code: "HIN" },
  { name: "Mathematics", code: "MAT" },
  { name: "Science", code: "SCI" },
  { name: "Social Science", code: "SST" },
  { name: "Physics", code: "PHY" },
  { name: "Chemistry", code: "CHEM" },
  { name: "Biology", code: "BIO" },
  { name: "Accountancy", code: "ACC" },
  { name: "Business Studies", code: "BST" },
  { name: "Economics", code: "ECO" },
  { name: "History", code: "HIS" },
  { name: "Geography", code: "GEO" },
  { name: "Political Science", code: "POL" },
  { name: "Computer Science", code: "CS" },
  { name: "Artificial Intelligence", code: "AI" },
  { name: "Information Technology", code: "IT" },
  { name: "Sanskrit", code: "SAN" },
  { name: "French", code: "FRE" },
  { name: "EVS", code: "EVS" },
  { name: "General Knowledge", code: "GK" },
];

const PREDEFINED_NON_ACADEMIC = [
  { name: "Physical Education", code: "PE" },
  { name: "Sports", code: "SPO" },
  { name: "Yoga", code: "YOG" },
  { name: "Music", code: "MUS" },
  { name: "Dance", code: "DNC" },
  { name: "Art and Craft", code: "ART" },
  { name: "Swimming", code: "SWM" },
  { name: "Library", code: "LIB" },
  { name: "Assembly", code: "ASM" },
  { name: "Karate", code: "KRT" },
  { name: "Martial Arts", code: "MA" },
  { name: "Mess", code: "MSS" },
];

// Helper to format Date Range cleanly
function formatDateRange(startStr: string, endStr: string) {
  try {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" };
    return `${start.toLocaleDateString("en-US", options)} – ${end.toLocaleDateString("en-US", options)}`;
  } catch {
    return `${startStr} – ${endStr}`;
  }
}

export interface WingTheme {
  borderAccent: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  cardActiveBg: string;
  cardInactiveBg: string;
  glowColor: string;
  headerBg: string;
  tagColor: string;
}

export function getWingTheme(wingId: string): WingTheme {
  switch (wingId.toLowerCase()) {
    case "primary":
      return {
        borderAccent: "border-l-emerald-600",
        badgeBg: "bg-emerald-50 dark:bg-emerald-950/60",
        badgeText: "text-emerald-800 dark:text-emerald-300",
        badgeBorder: "border-emerald-200 dark:border-emerald-800",
        dotColor: "bg-emerald-500",
        cardActiveBg: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-400/30 text-emerald-950 dark:text-emerald-200 shadow-xs",
        cardInactiveBg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-300",
        glowColor: "shadow-emerald-500/10",
        headerBg: "bg-emerald-50/50 dark:bg-emerald-950/30",
        tagColor: "bg-emerald-100/70 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
      };
    case "middle":
      return {
        borderAccent: "border-l-sky-600",
        badgeBg: "bg-sky-50 dark:bg-sky-950/60",
        badgeText: "text-sky-800 dark:text-sky-300",
        badgeBorder: "border-sky-200 dark:border-sky-800",
        dotColor: "bg-sky-500",
        cardActiveBg: "bg-sky-50 dark:bg-sky-950/80 border-sky-400 dark:border-sky-600 ring-2 ring-sky-400/30 text-sky-950 dark:text-sky-200 shadow-xs",
        cardInactiveBg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700 hover:bg-sky-50/30 dark:hover:bg-sky-950/30 text-slate-700 dark:text-slate-300",
        glowColor: "shadow-sky-500/10",
        headerBg: "bg-sky-50/50 dark:bg-sky-950/30",
        tagColor: "bg-sky-100/70 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300",
      };
    case "secondary":
      return {
        borderAccent: "border-l-indigo-600",
        badgeBg: "bg-indigo-50 dark:bg-indigo-950/60",
        badgeText: "text-indigo-800 dark:text-indigo-300",
        badgeBorder: "border-indigo-200 dark:border-indigo-800",
        dotColor: "bg-indigo-500",
        cardActiveBg: "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/30 text-indigo-950 dark:text-indigo-200 shadow-xs",
        cardInactiveBg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 text-slate-700 dark:text-slate-300",
        glowColor: "shadow-indigo-500/10",
        headerBg: "bg-indigo-50/50 dark:bg-indigo-950/30",
        tagColor: "bg-indigo-100/70 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300",
      };
    case "senior":
    case "senior secondary":
      return {
        borderAccent: "border-l-amber-600",
        badgeBg: "bg-amber-50 dark:bg-amber-950/60",
        badgeText: "text-amber-800 dark:text-amber-300",
        badgeBorder: "border-amber-200 dark:border-amber-800",
        dotColor: "bg-amber-500",
        cardActiveBg: "bg-amber-50 dark:bg-amber-950/80 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30 text-amber-950 dark:text-amber-200 shadow-xs",
        cardInactiveBg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-amber-950/30 text-slate-700 dark:text-slate-300",
        glowColor: "shadow-amber-500/10",
        headerBg: "bg-amber-50/50 dark:bg-amber-950/30",
        tagColor: "bg-amber-100/70 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300",
      };
    case "all":
      return {
        borderAccent: "border-l-indigo-600",
        badgeBg: "bg-slate-100 dark:bg-slate-800",
        badgeText: "text-slate-800 dark:text-slate-200",
        badgeBorder: "border-slate-200 dark:border-slate-700",
        dotColor: "bg-indigo-500",
        cardActiveBg: "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/30 text-indigo-950 dark:text-indigo-200 shadow-xs",
        cardInactiveBg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300",
        glowColor: "shadow-slate-500/10",
        headerBg: "bg-slate-50 dark:bg-slate-800/50",
        tagColor: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
      };
    default:
      return {
        borderAccent: "border-l-slate-500",
        badgeBg: "bg-slate-100 dark:bg-slate-800",
        badgeText: "text-slate-800 dark:text-slate-200",
        badgeBorder: "border-slate-200 dark:border-slate-700",
        dotColor: "bg-slate-500",
        cardActiveBg: "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 ring-2 ring-slate-400/30 text-slate-950 dark:text-slate-100 shadow-xs",
        cardInactiveBg: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300",
        glowColor: "shadow-slate-500/10",
        headerBg: "bg-slate-50 dark:bg-slate-800/50",
        tagColor: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
      };
  }
}

export interface SubjectTheme {
  dotColor: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  categoryName: string;
}

export function getSubjectTheme(subjectName: string, isNonAcademic?: boolean): SubjectTheme {
  if (isNonAcademic) {
    return {
      dotColor: "bg-rose-500",
      bgClass: "bg-rose-50/90 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50",
      borderClass: "border-rose-200 dark:border-rose-800 hover:border-rose-300 dark:hover:border-rose-700",
      textClass: "text-rose-950 dark:text-rose-200",
      categoryName: "Activity",
    };
  }

  const name = subjectName.toLowerCase();

  // 1. English & Modern Languages
  if (name.includes("english")) {
    return {
      dotColor: "bg-blue-500",
      bgClass: "bg-blue-50/90 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-900/50",
      borderClass: "border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700",
      textClass: "text-blue-950 dark:text-blue-200",
      categoryName: "Language",
    };
  }

  // 2. Hindi & Regional/Foreign Languages
  if (name.includes("hindi") || name.includes("sanskrit") || name.includes("french") || name.includes("german")) {
    return {
      dotColor: "bg-purple-500",
      bgClass: "bg-purple-50/90 dark:bg-purple-950/40 hover:bg-purple-100/80 dark:hover:bg-purple-900/50",
      borderClass: "border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700",
      textClass: "text-purple-950 dark:text-purple-200",
      categoryName: "Language",
    };
  }

  // 3. Mathematics & Quantitative
  if (name.includes("math") || name.includes("account")) {
    return {
      dotColor: "bg-sky-500",
      bgClass: "bg-sky-50/90 dark:bg-sky-950/40 hover:bg-sky-100/80 dark:hover:bg-sky-900/50",
      borderClass: "border-sky-200 dark:border-sky-800 hover:border-sky-300 dark:hover:border-sky-700",
      textClass: "text-sky-950 dark:text-sky-200",
      categoryName: "Quantitative",
    };
  }

  // 4. Sciences (Natural & Medical)
  if (
    name.includes("science") ||
    name.includes("physic") ||
    name.includes("chem") ||
    name.includes("bio") ||
    name.includes("evs")
  ) {
    return {
      dotColor: "bg-teal-500",
      bgClass: "bg-teal-50/90 dark:bg-teal-950/40 hover:bg-teal-100/80 dark:hover:bg-teal-900/50",
      borderClass: "border-teal-200 dark:border-teal-800 hover:border-teal-300 dark:hover:border-teal-700",
      textClass: "text-teal-950 dark:text-teal-200",
      categoryName: "Science",
    };
  }

  // 5. Tech & Computing
  if (
    name.includes("comp") ||
    name.includes("robot") ||
    name.includes("ai") ||
    name.includes("informatic") ||
    name.includes("it")
  ) {
    return {
      dotColor: "bg-amber-500",
      bgClass: "bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100/80 dark:hover:bg-amber-900/50",
      borderClass: "border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700",
      textClass: "text-amber-950 dark:text-amber-200",
      categoryName: "Tech & AI",
    };
  }

  // 6. Social Sciences, Humanities & Commerce
  if (
    name.includes("social") ||
    name.includes("hist") ||
    name.includes("geo") ||
    name.includes("polit") ||
    name.includes("econ") ||
    name.includes("busin") ||
    name.includes("gk") ||
    name.includes("general")
  ) {
    return {
      dotColor: "bg-orange-500",
      bgClass: "bg-orange-50/90 dark:bg-orange-950/40 hover:bg-orange-100/80 dark:hover:bg-orange-900/50",
      borderClass: "border-orange-200 dark:border-orange-800 hover:border-orange-300 dark:hover:border-orange-700",
      textClass: "text-orange-950 dark:text-orange-200",
      categoryName: "Humanities",
    };
  }

  // Fallback for custom academic subjects
  return {
    dotColor: "bg-indigo-500",
    bgClass: "bg-indigo-50/90 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/50",
    borderClass: "border-indigo-200 dark:border-indigo-800 hover:border-indigo-300 dark:hover:border-indigo-700",
    textClass: "text-indigo-950 dark:text-indigo-200",
    categoryName: "Academic",
  };
}

export default function MySchoolSubjectTab() {
  const [classes, setClasses] = useState<ClassRow[]>(INITIAL_CLASSES);
  const [wings, setWings] = useState<WingDefinition[]>(INITIAL_WINGS);
  const [selectedWing, setSelectedWing] = useState<string>("all");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving">("saved");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Add Wing inline form state ──
  const [isAddingWing, setIsAddingWing] = useState(false);
  const [newWingName, setNewWingName] = useState("");
  const [wingError, setWingError] = useState("");
  const wingInputRef = useRef<HTMLInputElement>(null);

  // ── Add Class inline form state ──
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("");
  const [newClassWing, setNewClassWing] = useState("");
  const [classError, setClassError] = useState("");
  const classInputRef = useRef<HTMLInputElement>(null);

  // ── Undo State ──
  const [lastDeletedItem, setLastDeletedItem] = useState<{
    type: "class" | "section" | "wing";
    data: any;
    message: string;
  } | null>(null);

  // ── Delete Modals ──
  const [deleteWingModal, setDeleteWingModal] = useState<{
    wing: WingDefinition;
    assignedClasses: ClassRow[];
    migrationWingId: string;
  } | null>(null);

  const [deleteClassModal, setDeleteClassModal] = useState<{
    classRow: ClassRow;
  } | null>(null);

  const [deleteSectionModal, setDeleteSectionModal] = useState<{
    classRow: ClassRow;
    section: Section;
  } | null>(null);

  // ── Add Section popover state (Per-Class) ──
  const [addingSectionClassId, setAddingSectionClassId] = useState<string | null>(null);
  const [newSectionName, setNewSectionName] = useState("");
  const [sectionError, setSectionError] = useState("");
  const sectionInputRef = useRef<HTMLInputElement>(null);
  const sectionPopoverRef = useRef<HTMLDivElement>(null);

  // ── Inline Rename States (Wing, Class, Section) ──
  const [editingWingId, setEditingWingId] = useState<string | null>(null);
  const [editingWingName, setEditingWingName] = useState("");

  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState("");

  const [editingSection, setEditingSection] = useState<{
    classId: string;
    sectionId: string;
  } | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");

  // Modal State for Subjects Edit
  const [editingCell, setEditingCell] = useState<{
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    subjects: AssignedSubject[];
    sectionASubjects: AssignedSubject[];
  } | null>(null);

  const [modalTab, setModalTab] = useState<"academic" | "non-academic">("academic");
  const [customSubjectName, setCustomSubjectName] = useState("");
  const [modalSubjects, setModalSubjects] = useState<AssignedSubject[]>([]);

  // Modal State for Date Picker
  const [editingDateClass, setEditingDateClass] = useState<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  // ── Modal State for Assigning Teacher (Subject Teacher or Class Teacher) ──
  const [assigningTeacherModal, setAssigningTeacherModal] = useState<{
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    isClassTeacher?: boolean;
    subjectName?: string;
    currentTeacherId?: string | null;
  } | null>(null);

  const [teacherSearchQuery, setTeacherSearchQuery] = useState("");
  const [teacherDepartmentFilter, setTeacherDepartmentFilter] = useState("all");

  const handleOpenTeacherModal = (
    classRow: ClassRow,
    section: Section,
    subject: AssignedSubject
  ) => {
    setAssigningTeacherModal({
      classId: classRow.id,
      className: classRow.name,
      sectionId: section.id,
      sectionName: section.name,
      isClassTeacher: false,
      subjectName: subject.name,
      currentTeacherId: subject.assignedTeacher?.id || null,
    });
    setTeacherSearchQuery("");
    setTeacherDepartmentFilter("all");
  };

  const handleOpenClassTeacherModal = (
    classRow: ClassRow,
    section: Section
  ) => {
    setAssigningTeacherModal({
      classId: classRow.id,
      className: classRow.name,
      sectionId: section.id,
      sectionName: section.name,
      isClassTeacher: true,
      subjectName: "Class Teacher",
      currentTeacherId: section.classTeacher?.id || null,
    });
    setTeacherSearchQuery("");
    setTeacherDepartmentFilter("all");
  };

  const handleAssignTeacher = (teacher: Teacher | null) => {
    if (!assigningTeacherModal) return;

    const { classId, sectionId, isClassTeacher, subjectName, className, sectionName } = assigningTeacherModal;

    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          sections: c.sections.map((s) => {
            if (s.id !== sectionId) return s;
            if (isClassTeacher) {
              return {
                ...s,
                classTeacher: teacher
                  ? {
                    id: teacher.id,
                    name: teacher.name,
                    initials: teacher.initials,
                    avatarColor: teacher.avatarColor,
                    role: teacher.role,
                  }
                  : null,
              };
            }
            return {
              ...s,
              subjects: s.subjects.map((sub) => {
                if (sub.name !== subjectName) return sub;
                return {
                  ...sub,
                  assignedTeacher: teacher
                    ? {
                      id: teacher.id,
                      name: teacher.name,
                      initials: teacher.initials,
                      avatarColor: teacher.avatarColor,
                      role: teacher.role,
                    }
                    : null,
                };
              }),
            };
          }),
        };
      })
    );

    if (isClassTeacher) {
      if (teacher) {
        showToast(`Assigned ${teacher.name} as Class Teacher (${className} · ${sectionName})`);
      } else {
        showToast(`Unassigned Class Teacher from ${className} · ${sectionName}`);
      }
    } else {
      if (teacher) {
        showToast(`Assigned ${teacher.name} to ${subjectName} (${className} · ${sectionName})`);
      } else {
        showToast(`Unassigned teacher from ${subjectName} (${className} · ${sectionName})`);
      }
    }

    setAssigningTeacherModal(null);
  };

  // Filtered teachers for assignment modal
  const filteredTeachers = useMemo(() => {
    let list = MOCK_FACULTY;

    if (teacherDepartmentFilter === "recommended" && assigningTeacherModal) {
      if (assigningTeacherModal.isClassTeacher) {
        list = list.filter((t) => t.role.toLowerCase().includes("senior") || t.role.toLowerCase().includes("faculty"));
      } else {
        const subPrefix = (assigningTeacherModal.subjectName || "").toLowerCase().slice(0, 4);
        list = list.filter((t) => t.specialization.toLowerCase().includes(subPrefix));
      }
    } else if (teacherDepartmentFilter !== "all") {
      list = list.filter((t) => t.department.toLowerCase().includes(teacherDepartmentFilter.toLowerCase()));
    }

    if (teacherSearchQuery.trim()) {
      const q = teacherSearchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.department.toLowerCase().includes(q) ||
          t.specialization.toLowerCase().includes(q) ||
          t.role.toLowerCase().includes(q)
      );
    }

    return list;
  }, [teacherSearchQuery, teacherDepartmentFilter, assigningTeacherModal]);

  // Dynamic wing names lookup
  const wingNames = useMemo(() => buildWingNames(wings), [wings]);

  // Filtered classes by selected wing cell
  const filteredClasses = useMemo(() => {
    if (selectedWing === "all") return classes;
    return classes.filter((c) => c.wingId === selectedWing);
  }, [classes, selectedWing]);

  // Classes by Wing for Cell display (dynamic)
  const wingData = useMemo(() => {
    const data: Record<string, { count: number; classesList: string[] }> = {
      all: {
        count: classes.length,
        classesList: classes.map((c) => c.shortName || c.name),
      },
    };
    for (const w of wings) {
      const wingClasses = classes.filter((c) => c.wingId === w.id);
      data[w.id] = {
        count: wingClasses.length,
        classesList: wingClasses.map((c) => c.shortName || c.name),
      };
    }
    return data;
  }, [classes, wings]);

  // Auto-focus inputs when forms open
  useEffect(() => {
    if (isAddingWing && wingInputRef.current) wingInputRef.current.focus();
  }, [isAddingWing]);
  useEffect(() => {
    if (isAddingClass && classInputRef.current) classInputRef.current.focus();
  }, [isAddingClass]);
  useEffect(() => {
    if (addingSectionClassId && sectionInputRef.current) sectionInputRef.current.focus();
  }, [addingSectionClassId]);

  // Close section popover on outside click
  useEffect(() => {
    if (!addingSectionClassId) return;
    const handleClick = (e: MouseEvent) => {
      if (sectionPopoverRef.current && !sectionPopoverRef.current.contains(e.target as Node)) {
        setAddingSectionClassId(null);
        setNewSectionName("");
        setSectionError("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [addingSectionClassId]);

  // ═══════════════ WING REORDER & DELETE HANDLERS ═══════════════
  const handleMoveWing = (wingId: string, direction: "left" | "right") => {
    setWings((prev) => {
      const idx = prev.findIndex((w) => w.id === wingId);
      if (idx === -1) return prev;
      const targetIdx = direction === "left" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const newWings = [...prev];
      const temp = newWings[idx];
      newWings[idx] = newWings[targetIdx];
      newWings[targetIdx] = temp;
      return newWings;
    });
    showToast("Wing order updated");
  };

  const handleOpenDeleteWing = (wing: WingDefinition) => {
    if (wing.id === "unassigned") {
      showToast(`"Unassigned" is a required system wing and cannot be deleted.`);
      return;
    }
    const assigned = classes.filter((c) => c.wingId === wing.id);
    const otherWings = wings.filter((w) => w.id !== wing.id);
    const defaultMigration = otherWings.find((w) => w.id === "unassigned")?.id || otherWings[0]?.id || "unassigned";

    setDeleteWingModal({
      wing,
      assignedClasses: assigned,
      migrationWingId: defaultMigration,
    });
  };

  const handleConfirmDeleteWing = () => {
    if (!deleteWingModal) return;
    const { wing, assignedClasses, migrationWingId } = deleteWingModal;

    setSaveStatus("saving");

    // Save for undo
    setLastDeletedItem({
      type: "wing",
      data: {
        wing,
        previousClassesWingIds: assignedClasses.map((c) => ({ id: c.id, wingId: c.wingId, wingName: c.wingName })),
      },
      message: `Wing "${wing.name}" deleted.`,
    });

    // Reassign classes in this wing to migration wing
    if (assignedClasses.length > 0) {
      setClasses((prev) =>
        prev.map((c) => {
          if (c.wingId !== wing.id) return c;
          return {
            ...c,
            wingId: migrationWingId,
            wingName: wingNames[migrationWingId] || migrationWingId,
          };
        })
      );
    }

    // Remove wing
    setWings((prev) => prev.filter((w) => w.id !== wing.id));
    if (selectedWing === wing.id) {
      setSelectedWing("all");
    }

    showToast(
      assignedClasses.length > 0
        ? `Wing "${wing.name}" removed · ${assignedClasses.length} class(es) moved to "${wingNames[migrationWingId] || migrationWingId}"`
        : `Wing "${wing.name}" removed`
    );
    setTimeout(() => setSaveStatus("saved"), 350);
    setDeleteWingModal(null);
  };

  // ═══════════════ ADD WING HANDLER ═══════════════
  const handleCreateWing = () => {
    const trimmed = newWingName.trim();
    if (trimmed.length < 2) {
      setWingError("Wing name must be at least 2 characters");
      return;
    }
    if (wings.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) {
      setWingError("A wing with this name already exists");
      return;
    }
    const newId = trimmed.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now();
    const newWing: WingDefinition = { id: newId, name: trimmed };

    // Insert before Unassigned (last item)
    setSaveStatus("saving");
    setWings((prev) => {
      const unassignedIdx = prev.findIndex((w) => w.id === "unassigned");
      if (unassignedIdx === -1) return [...prev, newWing];
      const copy = [...prev];
      copy.splice(unassignedIdx, 0, newWing);
      return copy;
    });

    showToast(`Wing "${trimmed}" created`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setNewWingName("");
    setWingError("");
    setIsAddingWing(false);
  };

  // ═══════════════ CLASS REORDER & DELETE HANDLERS ═══════════════
  const handleMoveClass = (classId: string, direction: "up" | "down") => {
    setClasses((prev) => {
      const idx = prev.findIndex((c) => c.id === classId);
      if (idx === -1) return prev;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    showToast("Class order updated");
  };

  const handleSortClasses = (sortType: "grade_asc" | "grade_desc" | "alpha_asc") => {
    setClasses((prev) => {
      const copy = [...prev];
      if (sortType === "grade_asc") {
        copy.sort((a, b) => a.gradeLevel - b.gradeLevel);
      } else if (sortType === "grade_desc") {
        copy.sort((a, b) => b.gradeLevel - a.gradeLevel);
      } else if (sortType === "alpha_asc") {
        copy.sort((a, b) => a.name.localeCompare(b.name));
      }
      return copy;
    });
    showToast(
      sortType === "grade_asc"
        ? "Sorted classes: Grade 1 → 12"
        : sortType === "grade_desc"
        ? "Sorted classes: Grade 12 → 1"
        : "Sorted classes: A → Z"
    );
  };

  const handleOpenDeleteClass = (classRow: ClassRow) => {
    setDeleteClassModal({ classRow });
  };

  const handleConfirmDeleteClass = () => {
    if (!deleteClassModal) return;
    const { classRow } = deleteClassModal;

    setSaveStatus("saving");
    const idx = classes.findIndex((c) => c.id === classRow.id);

    setLastDeletedItem({
      type: "class",
      data: { classRow, index: idx },
      message: `Class "${classRow.name}" deleted.`,
    });

    setClasses((prev) => prev.filter((c) => c.id !== classRow.id));
    showToast(`Deleted ${classRow.name} (${classRow.sections.length} sections removed)`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setDeleteClassModal(null);
  };

  // ═══════════════ ADD CLASS HANDLER ═══════════════
  const handleCreateClass = () => {
    const trimmed = newClassName.trim();
    if (trimmed.length < 2) {
      setClassError("Class name must be at least 2 characters");
      return;
    }
    if (classes.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setClassError("A class with this name already exists");
      return;
    }
    // Auto-infer grade from name
    const gradeMatch = trimmed.match(/\d+/);
    const grade = newClassGrade ? parseInt(newClassGrade) : gradeMatch ? parseInt(gradeMatch[0]) : classes.length + 1;

    // Determine wing
    const wingId = newClassWing || (selectedWing !== "all" ? selectedWing : "unassigned");

    const newClass: ClassRow = {
      id: "cls_new_" + Date.now(),
      name: trimmed,
      shortName: trimmed,
      wingId,
      wingName: wingNames[wingId] || wingId,
      gradeLevel: grade,
      startDate: "2026-04-01",
      endDate: "2027-03-31",
      sections: [
        {
          id: `cls_new_${Date.now()}_sec_a`,
          name: "Section A",
          displayOrder: 1,
          subjects: [],
        },
      ],
    };

    setSaveStatus("saving");
    setClasses((prev) => [...prev, newClass]);
    showToast(`Class "${trimmed}" created with Section A`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setNewClassName("");
    setNewClassGrade("");
    setNewClassWing("");
    setClassError("");
    setIsAddingClass(false);
  };

  // ═══════════════ SECTION REORDER & DELETE HANDLERS ═══════════════
  const handleMoveSection = (classId: string, sectionId: string, direction: "left" | "right") => {
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const idx = cls.sections.findIndex((s) => s.id === sectionId);
        if (idx === -1) return cls;
        const targetIdx = direction === "left" ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= cls.sections.length) return cls;
        const newSecs = [...cls.sections];
        const temp = newSecs[idx];
        newSecs[idx] = newSecs[targetIdx];
        newSecs[targetIdx] = temp;
        return {
          ...cls,
          sections: newSecs,
        };
      })
    );
    showToast("Section order updated");
  };

  const handleOpenDeleteSection = (classRow: ClassRow, section: Section) => {
    if (classRow.sections.length <= 1) {
      showToast(`Cannot delete "${section.name}". A class must have at least one section.`);
      return;
    }
    setDeleteSectionModal({ classRow, section });
  };

  const handleConfirmDeleteSection = () => {
    if (!deleteSectionModal) return;
    const { classRow, section } = deleteSectionModal;

    setSaveStatus("saving");
    const secIdx = classRow.sections.findIndex((s) => s.id === section.id);

    setLastDeletedItem({
      type: "section",
      data: { classId: classRow.id, section, index: secIdx },
      message: `Section "${section.name}" deleted from ${classRow.name}.`,
    });

    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classRow.id) return cls;
        return {
          ...cls,
          sections: cls.sections.filter((s) => s.id !== section.id),
        };
      })
    );

    showToast(`Removed ${section.name} from ${classRow.name}`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setDeleteSectionModal(null);
  };

  const getSuggestedSectionName = (classRow: ClassRow) => {
    const letters = classRow.sections
      .map((col) => col.name.replace(/^Section\s*/i, "").trim())
      .filter((l) => l.length === 1 && /[A-Z]/i.test(l))
      .map((l) => l.toUpperCase());
    if (letters.length === 0) return "Section A";
    const lastLetter = letters.sort().pop()!;
    const nextCharCode = lastLetter.charCodeAt(0) + 1;
    if (nextCharCode > 90) return `Section ${classRow.sections.length + 1}`;
    return `Section ${String.fromCharCode(nextCharCode)}`;
  };

  const handleOpenAddSection = (classRow: ClassRow) => {
    const suggested = getSuggestedSectionName(classRow);
    setNewSectionName(suggested);
    setSectionError("");
    setAddingSectionClassId(classRow.id);
  };

  const handleCreateSectionForClass = (classId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;

    const defaultName = getSuggestedSectionName(targetClass);
    const trimmed = newSectionName.trim() || defaultName;

    if (targetClass.sections.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setSectionError(`"${trimmed}" already exists in this class`);
      return;
    }

    setSaveStatus("saving");
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        return {
          ...cls,
          sections: [
            ...cls.sections,
            {
              id: `${cls.id}_sec_${Date.now()}`,
              name: trimmed,
              displayOrder: cls.sections.length + 1,
              subjects: [],
            },
          ],
        };
      })
    );

    showToast(`Added ${trimmed} to ${targetClass.name}`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setNewSectionName("");
    setSectionError("");
    setAddingSectionClassId(null);
  };

  // ═══════════════ RENAME HANDLERS (WING, CLASS, SECTION) ═══════════════
  const handleStartEditWing = (wing: WingDefinition) => {
    setEditingWingId(wing.id);
    setEditingWingName(wing.name);
  };

  const handleSaveWingName = (wingId: string) => {
    const trimmed = editingWingName.trim();
    if (!trimmed) {
      setEditingWingId(null);
      return;
    }
    setSaveStatus("saving");
    setWings((prev) =>
      prev.map((w) => (w.id === wingId ? { ...w, name: trimmed } : w))
    );
    setClasses((prev) =>
      prev.map((c) => (c.wingId === wingId ? { ...c, wingName: trimmed } : c))
    );
    showToast(`Renamed wing to "${trimmed}"`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setEditingWingId(null);
  };

  const handleCancelEditWing = () => {
    setEditingWingId(null);
    setEditingWingName("");
  };

  const handleStartEditClass = (classRow: ClassRow) => {
    setEditingClassId(classRow.id);
    setEditingClassName(classRow.name);
  };

  const handleSaveClassName = (classId: string) => {
    const trimmed = editingClassName.trim();
    if (!trimmed) {
      setEditingClassId(null);
      return;
    }
    setSaveStatus("saving");
    setClasses((prev) =>
      prev.map((c) =>
        c.id === classId
          ? { ...c, name: trimmed, shortName: trimmed }
          : c
      )
    );
    showToast(`Renamed class to "${trimmed}"`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setEditingClassId(null);
  };

  const handleCancelEditClass = () => {
    setEditingClassId(null);
    setEditingClassName("");
  };

  const handleStartEditSection = (classId: string, section: Section) => {
    setEditingSection({ classId, sectionId: section.id });
    setEditingSectionName(section.name);
  };

  const handleSaveSectionName = (classId: string, sectionId: string) => {
    const trimmed = editingSectionName.trim();
    if (!trimmed) {
      setEditingSection(null);
      return;
    }
    setSaveStatus("saving");
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          sections: c.sections.map((s) =>
            s.id === sectionId ? { ...s, name: trimmed } : s
          ),
        };
      })
    );
    showToast(`Renamed section to "${trimmed}"`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setEditingSection(null);
  };

  const handleCancelEditSection = () => {
    setEditingSection(null);
    setEditingSectionName("");
  };

  // ═══════════════ UNDO RESTORE HANDLER ═══════════════
  const handleUndo = () => {
    if (!lastDeletedItem) return;

    if (lastDeletedItem.type === "class") {
      const { classRow, index } = lastDeletedItem.data;
      setClasses((prev) => {
        const copy = [...prev];
        copy.splice(Math.min(index, copy.length), 0, classRow);
        return copy;
      });
      showToast(`Restored "${classRow.name}"`);
    } else if (lastDeletedItem.type === "section") {
      const { classId, section, index } = lastDeletedItem.data;
      setClasses((prev) =>
        prev.map((cls) => {
          if (cls.id !== classId) return cls;
          const copySecs = [...cls.sections];
          copySecs.splice(Math.min(index, copySecs.length), 0, section);
          return { ...cls, sections: copySecs };
        })
      );
      showToast(`Restored "${section.name}"`);
    } else if (lastDeletedItem.type === "wing") {
      const { wing, previousClassesWingIds } = lastDeletedItem.data;
      setWings((prev) => [...prev, wing]);
      if (previousClassesWingIds?.length > 0) {
        setClasses((prev) =>
          prev.map((c) => {
            const match = previousClassesWingIds.find((p: any) => p.id === c.id);
            if (match) {
              return { ...c, wingId: match.wingId, wingName: match.wingName };
            }
            return c;
          })
        );
      }
      showToast(`Restored wing "${wing.name}"`);
    }

    setLastDeletedItem(null);
  };

  // Handle Wing Dropdown Change for a class
  const handleWingChange = (classId: string, newWingId: string) => {
    setSaveStatus("saving");
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== classId) return c;
        return {
          ...c,
          wingId: newWingId,
          wingName: wingNames[newWingId] || newWingId,
        };
      })
    );
    showToast(`Wing updated to "${wingNames[newWingId] || newWingId}"`);
    setTimeout(() => setSaveStatus("saved"), 350);
  };

  // Open Date Range Picker Modal
  const handleOpenDatePicker = (classRow: ClassRow) => {
    setEditingDateClass({
      id: classRow.id,
      name: classRow.name,
      startDate: classRow.startDate,
      endDate: classRow.endDate,
    });
  };

  // Save Date Range
  const handleSaveDateRange = () => {
    if (!editingDateClass) return;
    setSaveStatus("saving");
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== editingDateClass.id) return c;
        return {
          ...c,
          startDate: editingDateClass.startDate,
          endDate: editingDateClass.endDate,
        };
      })
    );
    showToast(`Date range updated for ${editingDateClass.name}`);
    setTimeout(() => setSaveStatus("saved"), 350);
    setEditingDateClass(null);
  };

  // Open Subject Edit Modal
  const handleOpenEdit = (classRow: ClassRow, section: Section) => {
    const sectionA = classRow.sections.find(
      (s) => s.name.toUpperCase() === "SECTION A" || s.name.toUpperCase() === "A"
    ) || classRow.sections[0];

    setEditingCell({
      classId: classRow.id,
      className: classRow.name,
      sectionId: section.id,
      sectionName: section.name,
      subjects: section.subjects,
      sectionASubjects: sectionA?.subjects || [],
    });
    setModalSubjects([...section.subjects]);
    setModalTab("academic");
    setCustomSubjectName("");
  };

  // Toggle Subject in Modal
  const handleToggleSubject = (subject: { name: string; code: string }, isNonAcademic: boolean) => {
    const exists = modalSubjects.some((s) => s.name.toLowerCase() === subject.name.toLowerCase());
    if (exists) {
      setModalSubjects(modalSubjects.filter((s) => s.name.toLowerCase() !== subject.name.toLowerCase()));
    } else {
      setModalSubjects([
        ...modalSubjects,
        {
          name: subject.name,
          code: subject.code,
          isNonAcademic,
        },
      ]);
    }
  };

  // Remove Subject Chip in Modal
  const handleRemoveSubject = (name: string) => {
    setModalSubjects(modalSubjects.filter((s) => s.name !== name));
  };

  // Add Custom Subject
  const handleAddCustomSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSubjectName.trim();
    if (!clean) return;

    if (modalSubjects.some((s) => s.name.toLowerCase() === clean.toLowerCase())) {
      setCustomSubjectName("");
      return;
    }

    const code = clean.slice(0, 3).toUpperCase();
    setModalSubjects([
      ...modalSubjects,
      {
        name: clean,
        code,
        isCustom: true,
        isNonAcademic: modalTab === "non-academic",
      },
    ]);
    setCustomSubjectName("");
  };

  // Copy from Section A
  const handleCopyFromSectionA = () => {
    if (!editingCell?.sectionASubjects) return;
    setModalSubjects([...editingCell.sectionASubjects]);
    showToast("Copied all subjects from Section A!");
  };

  // Save Modal Changes
  const handleSaveModal = () => {
    if (!editingCell) return;

    setSaveStatus("saving");
    setClasses((prev) =>
      prev.map((cls) => {
        if (cls.id !== editingCell.classId) return cls;
        return {
          ...cls,
          sections: cls.sections.map((sec) => {
            if (sec.id !== editingCell.sectionId) return sec;
            return {
              ...sec,
              subjects: modalSubjects,
            };
          }),
        };
      })
    );

    showToast(`Updated subjects for ${editingCell.className} (${editingCell.sectionName})`);
    setTimeout(() => {
      setSaveStatus("saved");
    }, 400);

    setEditingCell(null);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-3 relative w-full text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-4 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════ WINGS HEADING & CELLS (DYNAMIC) ════════════ */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Wings
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Filter by wing or use hover arrows to reorder/delete wings</span>
        </div>

        {/* Dynamic Wing Grid */}
        <div className="flex flex-wrap gap-2">
          {/* All Classes Cell */}
          <button
            type="button"
            onClick={() => setSelectedWing("all")}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between min-h-[64px] min-w-[130px] flex-1 max-w-[190px] ${
              selectedWing === "all"
                ? "bg-indigo-50/80 dark:bg-indigo-950/80 border-indigo-500 shadow-xs ring-2 ring-indigo-500/20 text-indigo-950 dark:text-indigo-200"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className={`text-xs font-bold ${selectedWing === "all" ? "text-indigo-950 dark:text-indigo-200" : "text-slate-800 dark:text-slate-200"}`}>
                All Classes
              </span>
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                selectedWing === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {wingData.all?.count ?? 0}
            </span>
          </button>

          {/* Dynamic Wing Cells with Reorder & Delete */}
          {wings.map((wing, wIdx) => {
            const isActive = selectedWing === wing.id;
            const data = wingData[wing.id] || { count: 0, classesList: [] };
            const wTheme = getWingTheme(wing.id);
            const isFirst = wIdx === 0;
            const isLast = wIdx === wings.length - 1;
            const isUnassigned = wing.id === "unassigned";

            return (
              <motion.div
                key={wing.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedWing(wing.id)}
                className={`group/wing relative p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 min-h-[64px] min-w-[140px] flex-1 max-w-[200px] ${
                  isActive ? wTheme.cardActiveBg : wTheme.cardInactiveBg
                }`}
              >
                {/* Top Row: Name + Badges + Reorder/Delete/Edit Toolbar */}
                <div className="flex items-center justify-between gap-1">
                  {editingWingId === wing.id ? (
                    <div
                      className="flex items-center gap-1 w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editingWingName}
                        autoFocus
                        onChange={(e) => setEditingWingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveWingName(wing.id);
                          if (e.key === "Escape") handleCancelEditWing();
                        }}
                        className="px-1.5 py-0.5 text-xs font-bold bg-white dark:bg-slate-800 border border-indigo-500 rounded text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1 min-w-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveWingName(wing.id)}
                        className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60 rounded cursor-pointer shrink-0"
                        title="Save Wing Name"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditWing}
                        className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded cursor-pointer shrink-0"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${wTheme.dotColor} shrink-0`} />
                        <span className="text-xs font-bold truncate">
                          {wing.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Hover Action Toolbar: Pencil + Chevrons + Delete */}
                        <div className="hidden group-hover/wing:flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditWing(wing);
                            }}
                            className="p-0.5 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors cursor-pointer"
                            title={`Rename ${wing.name}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {!isFirst && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveWing(wing.id, "left");
                              }}
                              className="p-0.5 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors cursor-pointer"
                              title="Move Wing Left"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {!isLast && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveWing(wing.id, "right");
                              }}
                              className="p-0.5 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors cursor-pointer"
                              title="Move Wing Right"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          {!isUnassigned && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteWing(wing);
                              }}
                              className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Delete Wing"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {data.count}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Class chips */}
                <div className="flex flex-wrap gap-1 pt-0.5 border-t border-slate-200/60 dark:border-slate-800">
                  {data.classesList.length === 0 ? (
                    <span className="text-[9px] text-slate-400 italic">No classes</span>
                  ) : (
                    data.classesList.map((clsName) => (
                      <span
                        key={clsName}
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${
                          isActive
                            ? wTheme.tagColor
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {clsName}
                      </span>
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* ── Ghost Card: + Add Wing ── */}
          <AnimatePresence mode="wait">
            {isAddingWing ? (
              <motion.div
                key="wing-form"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-2.5 rounded-xl border-2 border-dashed border-indigo-400 dark:border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 min-h-[64px] min-w-[150px] flex-1 max-w-[210px] flex flex-col justify-between space-y-1.5 shadow-sm"
              >
                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-indigo-800 dark:text-indigo-300 tracking-wider">Wing Name</label>
                  <input
                    ref={wingInputRef}
                    type="text"
                    value={newWingName}
                    onChange={(e) => { setNewWingName(e.target.value); setWingError(""); }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateWing();
                      if (e.key === "Escape") { setIsAddingWing(false); setNewWingName(""); setWingError(""); }
                    }}
                    placeholder="e.g. Junior Wing"
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {wingError && <p className="text-[9px] text-rose-600 dark:text-rose-400 font-medium">{wingError}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => { setIsAddingWing(false); setNewWingName(""); setWingError(""); }}
                    className="flex-1 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-slate-200/70 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateWing}
                    className="flex-1 px-2 py-1 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors cursor-pointer shadow-xs"
                  >
                    Create
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="wing-ghost"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                type="button"
                onClick={() => setIsAddingWing(true)}
                className="p-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 min-h-[64px] min-w-[110px] flex-1 max-w-[150px] flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Add Wing</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════ SUBJECT GRID (HEADER BEFORE EVERY CLASS) ════════════ */}
      <div className="space-y-2">
        {filteredClasses.length === 0 && !isAddingClass ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 italic text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            No classes found in this wing category.
          </div>
        ) : (
          filteredClasses.map((classRow, cIdx) => {
            const wingTheme = getWingTheme(classRow.wingId);
            const isFirstClass = cIdx === 0;
            const isLastClass = cIdx === filteredClasses.length - 1;

            return (
              <div
                key={classRow.id}
                className={`overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm border-l-4 ${wingTheme.borderAccent}`}
              >
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400">
                      {/* Header for sticky CLASS column */}
                      <th className="p-2.5 sm:p-3 font-bold uppercase tracking-wider min-w-[210px] w-[230px] sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800 group/classhdr">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${wingTheme.dotColor} shrink-0`} />
                            <span className="text-slate-800 dark:text-slate-200 font-bold text-[11px]">Class</span>
                          </div>

                          {/* Class Move Up / Down, Edit & Delete buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditClass(classRow)}
                              className="opacity-0 group-hover/classhdr:opacity-100 p-1 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-all cursor-pointer"
                              title={`Rename ${classRow.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {!isFirstClass && (
                              <button
                                type="button"
                                onClick={() => handleMoveClass(classRow.id, "up")}
                                className="p-1 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors cursor-pointer"
                                title="Move Class Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {!isLastClass && (
                              <button
                                type="button"
                                onClick={() => handleMoveClass(classRow.id, "down")}
                                className="p-1 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors cursor-pointer"
                                title="Move Class Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteClass(classRow)}
                              className="p-1 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title={`Delete ${classRow.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </th>

                      {/* Headers for EACH section of THIS class */}
                      {classRow.sections.map((section, sIdx) => {
                        const isLastSection = sIdx === classRow.sections.length - 1;
                        const isFirstSection = sIdx === 0;
                        const isEditingThisSection =
                          editingSection?.classId === classRow.id &&
                          editingSection?.sectionId === section.id;

                        return (
                          <th
                            key={section.id || section.name}
                            className="p-2.5 sm:p-3 font-bold uppercase tracking-wider w-[280px] min-w-[260px] max-w-[300px] border-r border-slate-200/80 dark:border-slate-800 group/sec"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {isEditingThisSection ? (
                                  <div
                                    className="flex items-center gap-1 normal-case"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <input
                                      type="text"
                                      value={editingSectionName}
                                      autoFocus
                                      onChange={(e) => setEditingSectionName(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveSectionName(classRow.id, section.id);
                                        if (e.key === "Escape") handleCancelEditSection();
                                      }}
                                      className="px-1.5 py-0.5 text-xs font-bold bg-white dark:bg-slate-800 border border-indigo-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28 min-w-0"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveSectionName(classRow.id, section.id)}
                                      className="p-0.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded cursor-pointer shrink-0"
                                      title="Save Section Name"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelEditSection}
                                      className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer shrink-0"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-slate-900 dark:text-white font-extrabold text-xs truncate">{section.name}</span>
                                    {section.stream && (
                                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold shrink-0">
                                        {section.stream}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-normal shrink-0">
                                      ({section.subjects.length})
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Section Actions: Pencil + Move Left / Right + Delete Section + Add Section */}
                              <div className="flex items-center gap-1 shrink-0">
                                {/* Section Reorder & Edit Handles on Hover */}
                                <div className="hidden group-hover/sec:flex items-center gap-0.5">
                                  {!isEditingThisSection && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartEditSection(classRow.id, section);
                                      }}
                                      className="p-0.5 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors cursor-pointer"
                                      title={`Rename ${section.name}`}
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                  {!isFirstSection && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveSection(classRow.id, section.id, "left");
                                      }}
                                      className="p-0.5 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors cursor-pointer"
                                      title="Move Section Left"
                                    >
                                      <ChevronLeft className="w-3 h-3" />
                                    </button>
                                  )}
                                  {!isLastSection && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveSection(classRow.id, section.id, "right");
                                      }}
                                      className="p-0.5 hover:bg-white dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 rounded transition-colors cursor-pointer"
                                      title="Move Section Right"
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  )}
                                  {classRow.sections.length > 1 ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDeleteSection(classRow, section);
                                      }}
                                      title={`Delete ${section.name}`}
                                      className="p-0.5 hover:bg-rose-100 dark:hover:bg-rose-950/60 hover:text-rose-600 dark:hover:text-rose-400 rounded text-slate-400 dark:text-slate-500 transition-all cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  ) : (
                                    <span
                                      title="Cannot delete the only section in a class"
                                      className="p-0.5 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>

                                {/* + Add Section on the right-most edge of the last section */}
                                {isLastSection && (
                                  <div className="relative ml-1.5 shrink-0">
                                    <AnimatePresence mode="wait">
                                      {addingSectionClassId === classRow.id && (
                                        <motion.div
                                          key={`section-form-${classRow.id}`}
                                          ref={sectionPopoverRef}
                                          initial={{ opacity: 0, y: -8 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -8 }}
                                          className="absolute top-full right-0 mt-2 w-60 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 space-y-2 text-left normal-case"
                                        >
                                          <label className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 tracking-wider block">
                                            Add Section to {classRow.name}
                                          </label>
                                          <input
                                            ref={sectionInputRef}
                                            type="text"
                                            value={newSectionName}
                                            onChange={(e) => { setNewSectionName(e.target.value); setSectionError(""); }}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") handleCreateSectionForClass(classRow.id);
                                              if (e.key === "Escape") { setAddingSectionClassId(null); setNewSectionName(""); setSectionError(""); }
                                            }}
                                            placeholder={getSuggestedSectionName(classRow)}
                                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                          />
                                          {sectionError && <p className="text-[9px] text-rose-600 dark:text-rose-400 font-medium">{sectionError}</p>}
                                          <div className="flex items-center gap-1.5 pt-1">
                                            <button
                                              type="button"
                                              onClick={() => { setAddingSectionClassId(null); setNewSectionName(""); setSectionError(""); }}
                                              className="flex-1 px-2 py-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                            >
                                              Cancel
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleCreateSectionForClass(classRow.id)}
                                              className="flex-1 px-2 py-1.5 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer shadow-xs"
                                            >
                                              Add
                                            </button>
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddSection(classRow)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 transition-all text-[10px] font-bold tracking-tight cursor-pointer"
                                      title={`Add Section to ${classRow.name}`}
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Section</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </th>
                        );
                      })}

                      {/* Spacer column so sections take required width and do not stretch across full screen */}
                      <th className="p-0 border-none bg-transparent" />
                    </tr>
                  </thead>

                  <tbody>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* ════ CLASS CELL: NAME + WING DROPDOWN + START/END DATE ════ */}
                      <td className="p-2.5 sm:p-3 font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 sticky left-0 z-10 border-r border-slate-200 dark:border-slate-800 align-top group/classcell">
                        <div className="space-y-2.5 min-w-[200px]">
                          {/* Class Name + Wing Badge */}
                          <div className="flex items-center justify-between gap-1.5">
                            {editingClassId === classRow.id ? (
                              <div className="flex items-center gap-1 flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={editingClassName}
                                  autoFocus
                                  onChange={(e) => setEditingClassName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveClassName(classRow.id);
                                    if (e.key === "Escape") handleCancelEditClass();
                                  }}
                                  className="px-2 py-1 text-xs font-extrabold bg-white dark:bg-slate-800 border border-indigo-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full min-w-0 shadow-2xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveClassName(classRow.id)}
                                  className="p-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded cursor-pointer shrink-0"
                                  title="Save Class Name"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditClass}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer shrink-0"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                                  {classRow.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditClass(classRow)}
                                  className="opacity-0 group-hover/classcell:opacity-100 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-all cursor-pointer shrink-0"
                                  title={`Rename ${classRow.name}`}
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${wingTheme.badgeBg} ${wingTheme.badgeText} ${wingTheme.badgeBorder} flex items-center gap-1 shrink-0`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${wingTheme.dotColor}`} />
                              {wingNames[classRow.wingId] || "Unassigned"}
                            </span>
                          </div>

                          {/* 1. Wing Dropdown Selector */}
                          <div className="space-y-0.5">
                            <label className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                              Wing
                            </label>
                            <div className="relative">
                              <select
                                value={classRow.wingId}
                                onChange={(e) => handleWingChange(classRow.id, e.target.value)}
                                className="w-full text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer appearance-none pr-7 shadow-2xs"
                              >
                                {wings.map((w) => (
                                  <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                              </select>
                              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
                            </div>
                          </div>

                          {/* 2. Date Range Picker Trigger */}
                          <div className="space-y-0.5">
                            <label className="text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">
                              Session Dates
                            </label>
                            <button
                              type="button"
                              onClick={() => handleOpenDatePicker(classRow)}
                              className="w-full flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs group"
                              title="Click to pick Start and End Date"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span className="truncate font-medium">{formatDateRange(classRow.startDate, classRow.endDate)}</span>
                              </div>
                              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold underline shrink-0 group-hover:text-indigo-800 dark:group-hover:text-indigo-300">
                                Pick
                              </span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Section Cells for THIS Class */}
                      {classRow.sections.map((section) => (
                        <td
                          key={section.id || section.name}
                          className="p-2 align-top w-[280px] min-w-[260px] max-w-[300px] border-r border-slate-200 dark:border-slate-800"
                        >
                          <div className="w-full min-h-[76px] p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/70 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-800 transition-all text-left flex flex-col justify-between gap-2.5 shadow-2xs">
                            
                            {/* ════════════ 1. CLASS TEACHER CELL (BEFORE SUBJECTS) ════════════ */}
                            <div className="p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-900/50 shadow-2xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                                    Class Teacher
                                  </span>
                                </div>
                                {section.classTeacher ? (
                                  <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                                    Assigned
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">
                                    Unassigned
                                  </span>
                                )}
                              </div>

                              {section.classTeacher ? (
                                <div
                                  onClick={() => handleOpenClassTeacherModal(classRow, section)}
                                  className="p-1.5 rounded-lg bg-slate-50/90 dark:bg-slate-800/80 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-center justify-between gap-2 group/ct"
                                  title="Click to reassign Class Teacher"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-6 h-6 rounded-md ${section.classTeacher.avatarColor} flex items-center justify-center text-[8px] font-extrabold shrink-0 shadow-2xs`}>
                                      {section.classTeacher.initials}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[11px] font-bold text-slate-900 dark:text-white group-hover/ct:text-indigo-700 dark:group-hover/ct:text-indigo-300 transition-colors truncate">
                                        {section.classTeacher.name}
                                      </div>
                                      <div className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                                        {section.classTeacher.role}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenClassTeacherModal(classRow, section);
                                    }}
                                    className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-indigo-100 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0 transition-colors cursor-pointer"
                                  >
                                    Change
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenClassTeacherModal(classRow, section)}
                                  className="w-full py-1.5 px-2 rounded-lg border border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer group/addct"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover/addct:scale-110 transition-transform" />
                                  <span>+ Assign Class Teacher</span>
                                </button>
                              )}
                            </div>

                            {/* ════════════ 2. SUBJECTS LIST ════════════ */}
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center justify-between text-[9px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider px-0.5 pt-0.5">
                                <span>Subjects ({section.subjects.length})</span>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(classRow, section)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold hover:underline cursor-pointer lowercase first-letter:uppercase text-[10px]"
                                >
                                  manage
                                </button>
                              </div>

                              {section.subjects.length === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(classRow, section)}
                                  className="w-full py-3.5 text-center text-slate-400 dark:text-slate-500 italic text-[11px] flex items-center justify-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add subjects
                                </button>
                              ) : (
                                section.subjects.map((sub) => {
                                  const subTheme = getSubjectTheme(sub.name, sub.isNonAcademic);
                                  return (
                                    <div
                                      key={sub.name}
                                      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all flex items-center justify-between gap-2 shadow-2xs ${subTheme.bgClass} ${subTheme.borderClass} ${subTheme.textClass}`}
                                    >
                                      {/* Subject Name + Dot + Activity Tag */}
                                      <div
                                        onClick={() => handleOpenEdit(classRow, section)}
                                        className="flex items-center gap-1.5 min-w-0 cursor-pointer hover:opacity-85 transition-all flex-1"
                                        title="Click to edit subjects"
                                      >
                                        <span className={`w-2 h-2 rounded-full ${subTheme.dotColor} shrink-0 shadow-2xs`} />
                                        <span className="truncate font-bold">{sub.name}</span>
                                        {sub.isNonAcademic && (
                                          <span className="text-[8px] uppercase tracking-wider text-rose-800 dark:text-rose-300 font-bold bg-rose-100 dark:bg-rose-950/80 px-1 py-0.2 rounded border border-rose-200 dark:border-rose-800 shrink-0">
                                            Activity
                                          </span>
                                        )}
                                      </div>

                                      {/* Assigned Teacher Button / Badge */}
                                      {sub.assignedTeacher ? (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenTeacherModal(classRow, section, sub);
                                          }}
                                          className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-[10px] text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs group/tch"
                                          title={`Assigned: ${sub.assignedTeacher.name} (Click to reassign)`}
                                        >
                                          <div className={`w-3.5 h-3.5 rounded-full ${sub.assignedTeacher.avatarColor} flex items-center justify-center text-[7px] font-extrabold shrink-0`}>
                                            {sub.assignedTeacher.initials}
                                          </div>
                                          <span className="truncate max-w-[80px] font-medium">{sub.assignedTeacher.name}</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenTeacherModal(classRow, section, sub);
                                          }}
                                          className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[9px] font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all cursor-pointer"
                                          title="Click to assign a teacher"
                                        >
                                          <UserPlus className="w-2.5 h-2.5" />
                                          <span>Assigned teacher</span>
                                        </button>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Footer action to edit subjects */}
                            {section.subjects.length > 0 && (
                              <div className="flex items-center justify-end pt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(classRow, section)}
                                  className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium flex items-center gap-0.5 transition-colors cursor-pointer"
                                >
                                  <span>Edit subjects</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      ))}

                      {/* Spacer cell */}
                      <td className="p-0 border-none bg-transparent" />
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })
        )}

        {/* ── Add Class Button / Form at Bottom ── */}
        <div className="pt-2">
          <AnimatePresence mode="wait">
            {isAddingClass ? (
              <motion.div
                key="class-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-300 dark:border-indigo-700 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Create New Class</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsAddingClass(false); setNewClassName(""); setNewClassGrade(""); setNewClassWing(""); setClassError(""); }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-end gap-3 max-w-4xl">
                  {/* Class Name */}
                  <div className="flex-1 min-w-[200px] space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-300 tracking-wider block">Class Name *</label>
                    <input
                      ref={classInputRef}
                      type="text"
                      value={newClassName}
                      onChange={(e) => { setNewClassName(e.target.value); setClassError(""); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateClass();
                        if (e.key === "Escape") { setIsAddingClass(false); setNewClassName(""); setNewClassGrade(""); setNewClassWing(""); setClassError(""); }
                      }}
                      placeholder="e.g. Class 13, Nursery, UKG"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Grade Level */}
                  <div className="w-28 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Grade Level</label>
                    <input
                      type="number"
                      value={newClassGrade}
                      onChange={(e) => setNewClassGrade(e.target.value)}
                      placeholder="Auto"
                      min="1"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  {/* Wing Selector */}
                  <div className="w-52 space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider block">Assign to Wing</label>
                    <div className="relative">
                      <select
                        value={newClassWing}
                        onChange={(e) => setNewClassWing(e.target.value)}
                        className="w-full text-[11px] font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                      >
                        <option value="">
                          {selectedWing !== "all" ? `Current: ${wingNames[selectedWing] || selectedWing}` : "Unassigned"}
                        </option>
                        {wings.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsAddingClass(false); setNewClassName(""); setNewClassGrade(""); setNewClassWing(""); setClassError(""); }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateClass}
                      className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Class
                    </button>
                  </div>
                </div>
                {classError && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{classError}</p>}
              </motion.div>
            ) : (
              <motion.button
                key="class-ghost"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                type="button"
                onClick={() => setIsAddingClass(true)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 flex items-center justify-center gap-2 transition-all cursor-pointer group shadow-2xs"
              >
                <Plus className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-900 dark:group-hover:text-indigo-200 transition-colors">Add New Class</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════ DATE RANGE PICKER MODAL ════════════ */}
      <AnimatePresence>
        {editingDateClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDateClass(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 z-10 space-y-5 shadow-2xl text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Pick Session Dates · {editingDateClass.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Set academic term start & end dates</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingDateClass(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Date Inputs */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={editingDateClass.startDate}
                      onChange={(e) =>
                        setEditingDateClass({ ...editingDateClass, startDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={editingDateClass.endDate}
                      onChange={(e) =>
                        setEditingDateClass({ ...editingDateClass, endDate: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Quick Presets
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingDateClass({
                          ...editingDateClass,
                          startDate: "2026-04-01",
                          endDate: "2027-03-31",
                        })
                      }
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-800 dark:text-slate-200 font-semibold transition-all cursor-pointer"
                    >
                      <div className="font-bold text-indigo-700 dark:text-indigo-300">Academic 2026–27</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">01 Apr 2026 – 31 Mar 2027</div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingDateClass({
                          ...editingDateClass,
                          startDate: "2026-01-01",
                          endDate: "2026-12-31",
                        })
                      }
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-800 dark:text-slate-200 font-semibold transition-all cursor-pointer"
                    >
                      <div className="font-bold text-indigo-700 dark:text-indigo-300">Calendar 2026</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">01 Jan 2026 – 31 Dec 2026</div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDateClass(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDateRange}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Apply Dates</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════ SUBJECT EDIT MODAL ════════════ */}
      <AnimatePresence>
        {editingCell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingCell(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 z-10 space-y-5 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-900 dark:text-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Edit Subjects · {editingCell.className} ({editingCell.sectionName})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select curriculum subjects and co-curricular activities
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* 1. Currently Assigned Subjects Chips */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">Currently Assigned ({modalSubjects.length})</span>
                    {editingCell.sectionName !== "Section A" && editingCell.sectionName !== "A" && (
                      <button
                        type="button"
                        onClick={handleCopyFromSectionA}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy from Section A</span>
                      </button>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl min-h-[50px] flex flex-wrap gap-1.5 items-center">
                    {modalSubjects.length === 0 ? (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">No subjects assigned yet. Select below to add.</span>
                    ) : (
                      modalSubjects.map((sub) => (
                        <span
                          key={sub.name}
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl border ${
                            sub.isNonAcademic
                              ? "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
                              : "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
                          }`}
                        >
                          <span>{sub.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub.name)}
                            className="hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. Modal Category Tabs (Academic vs Non-Academic) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <button
                      type="button"
                      onClick={() => setModalTab("academic")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        modalTab === "academic"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Academic Subjects
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab("non-academic")}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        modalTab === "non-academic"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Non-Academic / Activities
                    </button>
                  </div>

                  {/* Checklist Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                    {(modalTab === "academic" ? PREDEFINED_ACADEMIC : PREDEFINED_NON_ACADEMIC).map((item) => {
                      const isSelected = modalSubjects.some(
                        (s) => s.name.toLowerCase() === item.name.toLowerCase()
                      );

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleToggleSubject(item, modalTab === "non-academic")}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? modalTab === "non-academic"
                                ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 shadow-2xs font-bold"
                                : "bg-indigo-50 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 text-indigo-950 dark:text-indigo-200 shadow-2xs font-bold"
                              : "bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span className="truncate pr-1">{item.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* 3. Add Custom Subject Input */}
                  <form onSubmit={handleAddCustomSubject} className="pt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={customSubjectName}
                      onChange={(e) => setCustomSubjectName(e.target.value)}
                      placeholder="+ Add custom subject (e.g. Robotics, Astronomy)"
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!customSubjectName.trim()}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 cursor-pointer"
                    >
                      Add
                    </button>
                  </form>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════ ASSIGN TEACHER MODAL ════════════ */}
      <AnimatePresence>
        {assigningTeacherModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAssigningTeacherModal(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/70 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 z-10 space-y-5 shadow-2xl max-h-[90vh] flex flex-col text-slate-900 dark:text-slate-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                    {assigningTeacherModal.isClassTeacher ? (
                      <GraduationCap className="w-5 h-5" />
                    ) : (
                      <UserCheck className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {assigningTeacherModal.isClassTeacher ? "Assign Class Teacher" : "Assign Faculty Teacher"}
                      </h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                        {assigningTeacherModal.isClassTeacher ? "Class Teacher" : assigningTeacherModal.subjectName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {assigningTeacherModal.className} · {assigningTeacherModal.sectionName}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAssigningTeacherModal(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Department Filters */}
              <div className="space-y-3 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type="text"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    placeholder="Search by teacher name, department, or specialization..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  {teacherSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setTeacherSearchQuery("")}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Department Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  {[
                    { id: "all", label: "All Faculty" },
                    { id: "recommended", label: assigningTeacherModal.isClassTeacher ? "⭐ Senior Faculty" : "⭐ Matching Specialization" },
                    { id: "Mathematics", label: "Mathematics" },
                    { id: "Science", label: "Science" },
                    { id: "Languages", label: "Languages" },
                    { id: "Commerce & Management", label: "Commerce" },
                    { id: "Computer Science & AI", label: "CS & AI" },
                    { id: "Creative Arts", label: "Arts & Music" },
                    { id: "Physical Education", label: "Physical Ed." },
                  ].map((dept) => (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setTeacherDepartmentFilter(dept.id)}
                      className={`px-3 py-1.5 rounded-xl font-semibold text-[11px] whitespace-nowrap transition-all cursor-pointer ${
                        teacherDepartmentFilter === dept.id
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {dept.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teacher Cards Scrollable List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[340px]">
                {filteredTeachers.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs italic rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    No faculty found matching "{teacherSearchQuery}".
                  </div>
                ) : (
                  filteredTeachers.map((teacher) => {
                    const isCurrent = assigningTeacherModal.currentTeacherId === teacher.id;
                    const isSpecialist = !assigningTeacherModal.isClassTeacher && teacher.specialization
                      .toLowerCase()
                      .includes((assigningTeacherModal.subjectName || "").toLowerCase().slice(0, 4));

                    return (
                      <div
                        key={teacher.id}
                        onClick={() => handleAssignTeacher(teacher)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                          isCurrent
                            ? "bg-indigo-50/80 dark:bg-indigo-950/80 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-400/30 shadow-xs"
                            : "bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                        }`}
                      >
                        {/* Teacher Avatar & Info */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl ${teacher.avatarColor} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                            {teacher.initials}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                                {teacher.name}
                              </span>
                              {isSpecialist && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-[9px] flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-amber-600" /> Specialist
                                </span>
                              )}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold text-[9px]">
                                  Currently Assigned
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-2 mt-0.5">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{teacher.role}</span>
                              <span>·</span>
                              <span>{teacher.department}</span>
                            </div>

                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                              Specialization: <span className="text-slate-600 dark:text-slate-300">{teacher.specialization}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Workload & Assign Action */}
                        <div className="flex items-center gap-3 shrink-0">
                          {teacher.workload && (
                            <div className="hidden sm:block text-right">
                              <div className="text-[10px] text-slate-600 dark:text-slate-300 font-mono font-medium">
                                {teacher.workload}
                              </div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-500">Weekly Load</div>
                            </div>
                          )}

                          <button
                            type="button"
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isCurrent
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 text-slate-700 dark:text-slate-300 group-hover:text-white"
                            }`}
                          >
                            {isCurrent ? "Assigned ✓" : "Assign"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer: Unassign button if assigned */}
              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 shrink-0">
                {assigningTeacherModal.currentTeacherId ? (
                  <button
                    type="button"
                    onClick={() => handleAssignTeacher(null)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 hover:text-rose-800 dark:hover:text-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>{assigningTeacherModal.isClassTeacher ? "Remove / Unassign Class Teacher" : "Remove / Unassign Teacher"}</span>
                  </button>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {assigningTeacherModal.isClassTeacher
                      ? "Select a faculty teacher from the list to assign as Class Teacher."
                      : "Select a teacher from the list to assign to this subject."}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setAssigningTeacherModal(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════ 1. DELETE WING CONFIRMATION MODAL ════════════ */}
      <AnimatePresence>
        {deleteWingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteWingModal(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 z-10 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Delete Wing: "{deleteWingModal.wing.name}"?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Removing this wing will update the academic wing structure of your school.
                  </p>
                </div>
              </div>

              {/* Cascade migration options */}
              {deleteWingModal.assignedClasses.length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/70 space-y-2.5">
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <span>⚠️ {deleteWingModal.assignedClasses.length} classes are currently in this wing:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {deleteWingModal.assignedClasses.map((c) => (
                      <span key={c.id} className="text-[10px] font-semibold bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-700/60">
                        {c.name}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-1 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                    <label className="text-[10px] uppercase font-bold text-amber-900 dark:text-amber-300 tracking-wider block">
                      Move these classes to:
                    </label>
                    <select
                      value={deleteWingModal.migrationWingId}
                      onChange={(e) =>
                        setDeleteWingModal({
                          ...deleteWingModal,
                          migrationWingId: e.target.value,
                        })
                      }
                      className="w-full text-xs font-semibold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
                    >
                      {wings
                        .filter((w) => w.id !== deleteWingModal.wing.id)
                        .map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  This wing is currently empty and has no classes assigned.
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteWingModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteWing}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  {deleteWingModal.assignedClasses.length > 0 ? "Reassign & Delete Wing" : "Delete Wing"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════ 2. DELETE CLASS CONFIRMATION MODAL ════════════ */}
      <AnimatePresence>
        {deleteClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteClassModal(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 z-10 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Delete Class: "{deleteClassModal.classRow.name}"?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    This will remove the entire class along with its {deleteClassModal.classRow.sections.length} section(s).
                  </p>
                </div>
              </div>

              {/* Sections Breakdown */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="font-bold text-slate-700 dark:text-slate-300">Affected Sections & Allocations:</div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {deleteClassModal.classRow.sections.map((sec) => (
                    <div key={sec.id} className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{sec.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 ml-1.5">({sec.subjects.length} subjects)</span>
                      </div>
                      {sec.classTeacher ? (
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 font-semibold">
                          CT: {sec.classTeacher.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">No CT</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteClassModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteClass}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Class</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════ 3. DELETE SECTION CONFIRMATION MODAL ════════════ */}
      <AnimatePresence>
        {deleteSectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteSectionModal(null)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 z-10 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Delete Section: "{deleteSectionModal.section.name}"?
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    From <strong className="text-slate-800 dark:text-slate-200">{deleteSectionModal.classRow.name}</strong>. {deleteSectionModal.section.subjects.length} subject allocation(s) will be removed.
                  </p>
                </div>
              </div>

              {deleteSectionModal.section.classTeacher && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Class Teacher <strong className="font-semibold text-amber-950 dark:text-amber-100">{deleteSectionModal.section.classTeacher.name}</strong> will be unassigned from this section.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteSectionModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSection}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Section</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════ 4. FLOATING UNDO NOTIFICATION ════════════ */}
      <AnimatePresence>
        {lastDeletedItem && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{lastDeletedItem.message}</span>
            </div>
            <button
              type="button"
              onClick={handleUndo}
              className="ml-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              type="button"
              onClick={() => setLastDeletedItem(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
