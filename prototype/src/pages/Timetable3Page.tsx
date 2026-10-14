import React, { useState } from "react";
import {
  ArrowLeft,
  Building2,
  LogOut,
  Clock,
  Sparkles,
  ChevronDown,
  Calendar,
  Check,
  Plus,
  X,
  AlertTriangle,
  Layers,
  LayoutGrid,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  GraduationCap,
  Info,
  BookOpen,
  Calculator,
  Atom,
  Languages,
  Globe,
  Monitor,
  Trophy,
  Palette,
  Music as MusicIcon,
  Library as LibraryIcon,
} from "lucide-react";
import schoolLogo from "../assets/ideal-logo.jpg";
import ThemeToggle from "../components/ThemeToggle";

interface Timetable3PageProps {
  user: {
    fullName: string;
    roleTitle: string;
    schoolName: string;
    schoolCode: string;
    avatarColor: string;
    initials: string;
  };
  onBackToDashboard: () => void;
  onOpenMySchool: () => void;
  onOpenTimetable1?: () => void;
  onOpenTimetable2?: () => void;
  onSignOut: () => void;
}

interface PeriodItem {
  id: string;
  startTime: string;
  endTime: string;
  type?: "regular" | "break" | "assembly" | "activity";
}

const ROMAN_NUMERALS = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

const INITIAL_PERIODS_V3: PeriodItem[] = [
  { id: "p3-1", startTime: "09:00", endTime: "09:45", type: "regular" },
  { id: "p3-2", startTime: "09:45", endTime: "10:30", type: "regular" },
  { id: "p3-3", startTime: "10:30", endTime: "11:15", type: "regular" },
  { id: "p3-4", startTime: "11:15", endTime: "12:00", type: "regular" },
  { id: "p3-5", startTime: "12:00", endTime: "12:45", type: "break" },
  { id: "p3-6", startTime: "12:45", endTime: "01:30", type: "regular" },
  { id: "p3-7", startTime: "01:30", endTime: "02:15", type: "regular" },
  { id: "p3-8", startTime: "02:15", endTime: "03:00", type: "regular" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MOCK_TIMETABLES_V3 = [
  {
    id: "tt3-1",
    name: "Class 12-A (Science) — Studio Matrix",
    wing: "Senior Secondary",
    version: "v3.0 Pro",
    status: "Active Matrix",
  },
  {
    id: "tt3-2",
    name: "Class 10-B (General) — Studio Matrix",
    wing: "Secondary Wing",
    version: "v3.0 Pro",
    status: "Active Matrix",
  },
  {
    id: "tt3-3",
    name: "Primary Wing (Class 5-A) — Bell Schedule",
    wing: "Primary Wing",
    version: "v3.0 Pro",
    status: "Active Matrix",
  },
];

interface SubjectAllocation {
  name: string;
  count: number;
  color: string;
  bg: string;
  border: string;
  dot: string;
  teacher?: string;
}

interface TimetableSectionStatus {
  total: number;
  unassigned: number;
  subjects: SubjectAllocation[];
}

const MOCK_SECTION_STATUS: Record<string, TimetableSectionStatus> = {
  "tt3-1": {
    total: 52,
    unassigned: 6,
    subjects: [
      { name: "English", count: 8, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200/80 dark:border-blue-800/60", dot: "bg-blue-500", teacher: "Manish Kumar" },
      { name: "Hindi", count: 4, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/80 dark:border-amber-800/60", dot: "bg-amber-500", teacher: "Mr. Rajesh Tiwari" },
      { name: "Maths", count: 8, color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200/80 dark:border-indigo-800/60", dot: "bg-indigo-500", teacher: "Dr. R. Ramanujan" },
      { name: "Science", count: 7, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/80 dark:border-emerald-800/60", dot: "bg-emerald-500", teacher: "Dr. Homi Bhabha" },
      { name: "Social", count: 6, color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200/80 dark:border-purple-800/60", dot: "bg-purple-500", teacher: "Mrs. Sunita Verma" },
      { name: "Sports", count: 6, color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200/80 dark:border-orange-800/60", dot: "bg-orange-500", teacher: "Coach Major Dhyan" },
      { name: "Computer", count: 4, color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-200/80 dark:border-cyan-800/60", dot: "bg-cyan-500", teacher: "Mr. Satya N." },
      { name: "Arts", count: 3, color: "text-pink-700 dark:text-pink-300", bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-200/80 dark:border-pink-800/60", dot: "bg-pink-500", teacher: "Ms. Amrita Sher-Gil" },
    ],
  },
  "tt3-2": {
    total: 52,
    unassigned: 4,
    subjects: [
      { name: "English", count: 8, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200/80 dark:border-blue-800/60", dot: "bg-blue-500", teacher: "Manish Kumar" },
      { name: "Hindi", count: 5, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/80 dark:border-amber-800/60", dot: "bg-amber-500", teacher: "Mr. Rajesh Tiwari" },
      { name: "Maths", count: 8, color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200/80 dark:border-indigo-800/60", dot: "bg-indigo-500", teacher: "Dr. R. Ramanujan" },
      { name: "Science", count: 8, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/80 dark:border-emerald-800/60", dot: "bg-emerald-500", teacher: "Dr. Homi Bhabha" },
      { name: "Social", count: 6, color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200/80 dark:border-purple-800/60", dot: "bg-purple-500", teacher: "Mrs. Sunita Verma" },
      { name: "Sports", count: 6, color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200/80 dark:border-orange-800/60", dot: "bg-orange-500", teacher: "Coach Major Dhyan" },
      { name: "Computer", count: 4, color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-200/80 dark:border-cyan-800/60", dot: "bg-cyan-500", teacher: "Mr. Satya N." },
      { name: "Arts", count: 3, color: "text-pink-700 dark:text-pink-300", bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-200/80 dark:border-pink-800/60", dot: "bg-pink-500", teacher: "Ms. Amrita Sher-Gil" },
    ],
  },
  "tt3-3": {
    total: 48,
    unassigned: 2,
    subjects: [
      { name: "English", count: 8, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200/80 dark:border-blue-800/60", dot: "bg-blue-500", teacher: "Manish Kumar" },
      { name: "Hindi", count: 6, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/80 dark:border-amber-800/60", dot: "bg-amber-500", teacher: "Mr. Rajesh Tiwari" },
      { name: "Maths", count: 8, color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200/80 dark:border-indigo-800/60", dot: "bg-indigo-500", teacher: "Dr. R. Ramanujan" },
      { name: "EVS", count: 6, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/80 dark:border-emerald-800/60", dot: "bg-emerald-500", teacher: "Mrs. Meera Kapoor" },
      { name: "Drawing", count: 6, color: "text-pink-700 dark:text-pink-300", bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-200/80 dark:border-pink-800/60", dot: "bg-pink-500", teacher: "Ms. Amrita Sher-Gil" },
      { name: "Sports", count: 6, color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200/80 dark:border-orange-800/60", dot: "bg-orange-500", teacher: "Coach Major Dhyan" },
      { name: "Music", count: 6, color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200/80 dark:border-purple-800/60", dot: "bg-purple-500", teacher: "Pt. Ravi Shankar" },
    ],
  },
};

const TIMETABLE_GRID_SCHEDULE: Record<string, { subject: string; teacher: string }[]> = {
  Mon: [
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Science", teacher: "Dr. Homi Bhabha" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Social Studies", teacher: "Sunita Verma" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Arts", teacher: "Amrita Sher-Gil" },
  ],
  Tue: [
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Science", teacher: "Dr. Homi Bhabha" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Social Studies", teacher: "Sunita Verma" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Library", teacher: "Pooja Roy" },
  ],
  Wed: [
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Science", teacher: "Dr. Homi Bhabha" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Social Studies", teacher: "Sunita Verma" },
    { subject: "Music", teacher: "Pt. Ravi Shankar" },
    { subject: "Arts", teacher: "Amrita Sher-Gil" },
    { subject: "Sports", teacher: "Major Dhyan" },
  ],
  Thu: [
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Science", teacher: "Dr. Homi Bhabha" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Social Studies", teacher: "Sunita Verma" },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Moral Science", teacher: "K. S. Pillai" },
  ],
  Fri: [
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Science", teacher: "Dr. Homi Bhabha" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Social Studies", teacher: "Sunita Verma" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Arts", teacher: "Amrita Sher-Gil" },
    { subject: "Activity", teacher: "Sunita Verma" },
  ],
  Sat: [
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Science", teacher: "Dr. Homi Bhabha" },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Library", teacher: "Pooja Roy" },
    { subject: "Remedial Class", teacher: "Dr. R. Ramanujan" },
  ],
};

function getPeriodDuration(start: string, end: string): string {
  if (!start || !end) return "45m";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "45m";
  let sMin = sh * 60 + sm;
  let eMin = eh * 60 + em;
  if (eMin < sMin) {
    if (eh < 12) eMin += 12 * 60;
  }
  const diff = eMin - sMin;
  return diff > 0 ? `${diff}m` : "45m";
}

function getShortSubject(subject: string): string {
  const map: Record<string, string> = {
    "English": "Eng",
    "Mathematics": "Math",
    "Maths": "Math",
    "Science": "Sci",
    "Hindi": "Hindi",
    "Social Studies": "SST",
    "Social": "SST",
    "Computer": "Comp",
    "Sports": "PE",
    "Arts": "Art",
    "Drawing": "Art",
    "Music": "Music",
    "Library": "Lib",
    "Activity": "Activity",
    "Club Activity": "Club",
    "Moral Science": "Value Ed",
    "Remedial Class": "Remedial",
    "Quiz / Seminar": "Seminar",
  };
  return map[subject] || subject;
}

interface SubjectTheme {
  bg: string;
  hoverBg: string;
  text: string;
  subText: string;
  badgeText: string;
  railColor: string;
  badgeBg: string;
}

const SUBJECT_COLOR_THEMES: Record<string, SubjectTheme> = {
  English: {
    bg: "bg-blue-50/90 dark:bg-blue-950/40",
    hoverBg: "hover:bg-blue-100/90 dark:hover:bg-blue-900/50",
    text: "text-blue-900 dark:text-blue-100",
    subText: "text-blue-700/80 dark:text-blue-300/80",
    badgeText: "text-blue-700 dark:text-blue-300",
    railColor: "bg-blue-500",
    badgeBg: "bg-blue-100/90 dark:bg-blue-900/70",
  },
  Mathematics: {
    bg: "bg-indigo-50/90 dark:bg-indigo-950/40",
    hoverBg: "hover:bg-indigo-100/90 dark:hover:bg-indigo-900/50",
    text: "text-indigo-900 dark:text-indigo-100",
    subText: "text-indigo-700/80 dark:text-indigo-300/80",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    railColor: "bg-indigo-500",
    badgeBg: "bg-indigo-100/90 dark:bg-indigo-900/70",
  },
  Maths: {
    bg: "bg-indigo-50/90 dark:bg-indigo-950/40",
    hoverBg: "hover:bg-indigo-100/90 dark:hover:bg-indigo-900/50",
    text: "text-indigo-900 dark:text-indigo-100",
    subText: "text-indigo-700/80 dark:text-indigo-300/80",
    badgeText: "text-indigo-700 dark:text-indigo-300",
    railColor: "bg-indigo-500",
    badgeBg: "bg-indigo-100/90 dark:bg-indigo-900/70",
  },
  Science: {
    bg: "bg-emerald-50/90 dark:bg-emerald-950/40",
    hoverBg: "hover:bg-emerald-100/90 dark:hover:bg-emerald-900/50",
    text: "text-emerald-900 dark:text-emerald-100",
    subText: "text-emerald-700/80 dark:text-emerald-300/80",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    railColor: "bg-emerald-500",
    badgeBg: "bg-emerald-100/90 dark:bg-emerald-900/70",
  },
  Hindi: {
    bg: "bg-amber-50/90 dark:bg-amber-950/40",
    hoverBg: "hover:bg-amber-100/90 dark:hover:bg-amber-900/50",
    text: "text-amber-900 dark:text-amber-100",
    subText: "text-amber-700/80 dark:text-amber-300/80",
    badgeText: "text-amber-800 dark:text-amber-300",
    railColor: "bg-amber-500",
    badgeBg: "bg-amber-100/90 dark:bg-amber-900/70",
  },
  "Social Studies": {
    bg: "bg-purple-50/90 dark:bg-purple-950/40",
    hoverBg: "hover:bg-purple-100/90 dark:hover:bg-purple-900/50",
    text: "text-purple-900 dark:text-purple-100",
    subText: "text-purple-700/80 dark:text-purple-300/80",
    badgeText: "text-purple-700 dark:text-purple-300",
    railColor: "bg-purple-500",
    badgeBg: "bg-purple-100/90 dark:bg-purple-900/70",
  },
  Social: {
    bg: "bg-purple-50/90 dark:bg-purple-950/40",
    hoverBg: "hover:bg-purple-100/90 dark:hover:bg-purple-900/50",
    text: "text-purple-900 dark:text-purple-100",
    subText: "text-purple-700/80 dark:text-purple-300/80",
    badgeText: "text-purple-700 dark:text-purple-300",
    railColor: "bg-purple-500",
    badgeBg: "bg-purple-100/90 dark:bg-purple-900/70",
  },
  Sports: {
    bg: "bg-orange-50/90 dark:bg-orange-950/40",
    hoverBg: "hover:bg-orange-100/90 dark:hover:bg-orange-900/50",
    text: "text-orange-900 dark:text-orange-100",
    subText: "text-orange-700/80 dark:text-orange-300/80",
    badgeText: "text-orange-700 dark:text-orange-300",
    railColor: "bg-orange-500",
    badgeBg: "bg-orange-100/90 dark:bg-orange-900/70",
  },
  Computer: {
    bg: "bg-cyan-50/90 dark:bg-cyan-950/40",
    hoverBg: "hover:bg-cyan-100/90 dark:hover:bg-cyan-900/50",
    text: "text-cyan-900 dark:text-cyan-100",
    subText: "text-cyan-700/80 dark:text-cyan-300/80",
    badgeText: "text-cyan-700 dark:text-cyan-300",
    railColor: "bg-cyan-500",
    badgeBg: "bg-cyan-100/90 dark:bg-cyan-900/70",
  },
  Arts: {
    bg: "bg-pink-50/90 dark:bg-pink-950/40",
    hoverBg: "hover:bg-pink-100/90 dark:hover:bg-pink-900/50",
    text: "text-pink-900 dark:text-pink-100",
    subText: "text-pink-700/80 dark:text-pink-300/80",
    badgeText: "text-pink-700 dark:text-pink-300",
    railColor: "bg-pink-500",
    badgeBg: "bg-pink-100/90 dark:bg-pink-900/70",
  },
  Drawing: {
    bg: "bg-pink-50/90 dark:bg-pink-950/40",
    hoverBg: "hover:bg-pink-100/90 dark:hover:bg-pink-900/50",
    text: "text-pink-900 dark:text-pink-100",
    subText: "text-pink-700/80 dark:text-pink-300/80",
    badgeText: "text-pink-700 dark:text-pink-300",
    railColor: "bg-pink-500",
    badgeBg: "bg-pink-100/90 dark:bg-pink-900/70",
  },
  Music: {
    bg: "bg-rose-50/90 dark:bg-rose-950/40",
    hoverBg: "hover:bg-rose-100/90 dark:hover:bg-rose-900/50",
    text: "text-rose-900 dark:text-rose-100",
    subText: "text-rose-700/80 dark:text-rose-300/80",
    badgeText: "text-rose-700 dark:text-rose-300",
    railColor: "bg-rose-500",
    badgeBg: "bg-rose-100/90 dark:bg-rose-900/70",
  },
  Library: {
    bg: "bg-teal-50/90 dark:bg-teal-950/40",
    hoverBg: "hover:bg-teal-100/90 dark:hover:bg-teal-900/50",
    text: "text-teal-900 dark:text-teal-100",
    subText: "text-teal-700/80 dark:text-teal-300/80",
    badgeText: "text-teal-700 dark:text-teal-300",
    railColor: "bg-teal-500",
    badgeBg: "bg-teal-100/90 dark:bg-teal-900/70",
  },
  Activity: {
    bg: "bg-lime-50/90 dark:bg-lime-950/40",
    hoverBg: "hover:bg-lime-100/90 dark:hover:bg-lime-900/50",
    text: "text-lime-900 dark:text-lime-100",
    subText: "text-lime-700/80 dark:text-lime-300/80",
    badgeText: "text-lime-700 dark:text-lime-300",
    railColor: "bg-lime-500",
    badgeBg: "bg-lime-100/90 dark:bg-lime-900/70",
  },
  "Remedial Class": {
    bg: "bg-slate-100/90 dark:bg-slate-800/60",
    hoverBg: "hover:bg-slate-200/90 dark:hover:bg-slate-700/70",
    text: "text-slate-900 dark:text-slate-100",
    subText: "text-slate-600 dark:text-slate-400",
    badgeText: "text-slate-600 dark:text-slate-400",
    railColor: "bg-slate-400",
    badgeBg: "bg-slate-200/90 dark:bg-slate-700/80",
  },
  "Moral Science": {
    bg: "bg-emerald-50/80 dark:bg-emerald-950/35",
    hoverBg: "hover:bg-emerald-100/80 dark:hover:bg-emerald-900/45",
    text: "text-emerald-900 dark:text-emerald-100",
    subText: "text-emerald-700/80 dark:text-emerald-300/80",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    railColor: "bg-emerald-500",
    badgeBg: "bg-emerald-100/90 dark:bg-emerald-900/70",
  },
};

const DEFAULT_SUBJECT_THEME: SubjectTheme = {
  bg: "bg-white dark:bg-slate-900",
  hoverBg: "hover:bg-slate-50/80 dark:hover:bg-slate-800/50",
  text: "text-slate-800 dark:text-slate-100",
  subText: "text-slate-500 dark:text-slate-400",
  badgeText: "text-slate-400 dark:text-slate-500",
  railColor: "bg-slate-300 dark:bg-slate-700",
  badgeBg: "bg-slate-100 dark:bg-slate-800",
};

function getSubjectTheme(subject: string): SubjectTheme {
  return SUBJECT_COLOR_THEMES[subject] || DEFAULT_SUBJECT_THEME;
}

function getSubjectIcon(subject: string) {
  switch (subject) {
    case "English":
      return BookOpen;
    case "Mathematics":
    case "Maths":
      return Calculator;
    case "Science":
      return Atom;
    case "Hindi":
      return Languages;
    case "Social Studies":
    case "Social":
      return Globe;
    case "Computer":
      return Monitor;
    case "Sports":
      return Trophy;
    case "Arts":
    case "Drawing":
      return Palette;
    case "Music":
      return MusicIcon;
    case "Library":
      return LibraryIcon;
    default:
      return Sparkles;
  }
}

interface DepartmentTheme {
  deptName: string;
  badge: string;
  bg: string;
  hoverBg: string;
  textColor: string;
  badgeColor: string;
}

function getDepartmentTheme(subject: string): DepartmentTheme {
  switch (subject) {
    case "Mathematics":
    case "Maths":
    case "Science":
    case "Computer":
      return {
        deptName: "STEM",
        badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
        bg: "bg-blue-50/85 dark:bg-blue-950/35",
        hoverBg: "hover:bg-blue-100/85 dark:hover:bg-blue-900/45",
        textColor: "text-blue-950 dark:text-blue-100",
        badgeColor: "text-blue-600 dark:text-blue-400",
      };
    case "English":
    case "Hindi":
      return {
        deptName: "LANG",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300",
        bg: "bg-amber-50/85 dark:bg-amber-950/35",
        hoverBg: "hover:bg-amber-100/85 dark:hover:bg-amber-900/45",
        textColor: "text-amber-950 dark:text-amber-100",
        badgeColor: "text-amber-700 dark:text-amber-300",
      };
    case "Social Studies":
    case "Social":
    case "Moral Science":
      return {
        deptName: "HUM",
        badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
        bg: "bg-purple-50/85 dark:bg-purple-950/35",
        hoverBg: "hover:bg-purple-100/85 dark:hover:bg-purple-900/45",
        textColor: "text-purple-950 dark:text-purple-100",
        badgeColor: "text-purple-600 dark:text-purple-400",
      };
    case "Sports":
    case "Arts":
    case "Drawing":
    case "Music":
    case "Activity":
    case "Club Activity":
      return {
        deptName: "EXP",
        badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
        bg: "bg-rose-50/85 dark:bg-rose-950/35",
        hoverBg: "hover:bg-rose-100/85 dark:hover:bg-rose-900/45",
        textColor: "text-rose-950 dark:text-rose-100",
        badgeColor: "text-rose-600 dark:text-rose-400",
      };
    default:
      return {
        deptName: "GEN",
        badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        bg: "bg-slate-50/80 dark:bg-slate-900/40",
        hoverBg: "hover:bg-slate-100 dark:hover:bg-slate-800/50",
        textColor: "text-slate-900 dark:text-slate-100",
        badgeColor: "text-slate-500 dark:text-slate-400",
      };
  }
}

export type VisualTreatment =
  | "full-tint"
  | "accent-rail"
  | "subject-badge"
  | "icon-dual"
  | "department";

export default function Timetable3Page({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable1,
  onOpenTimetable2,
  onSignOut,
}: Timetable3PageProps) {
  const [selectedTimetableId, setSelectedTimetableId] = useState("tt3-1");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [visualTreatment, setVisualTreatment] = useState<VisualTreatment>("full-tint");
  const [highlightedSubject, setHighlightedSubject] = useState<string | null>(null);

  // Periods state for UI/UX testing
  const [periods, setPeriods] = useState<PeriodItem[]>(INITIAL_PERIODS_V3);
  const [selectedCell, setSelectedCell] = useState<{ day: string; periodId: string } | null>(null);

  const selectedTimetable =
    MOCK_TIMETABLES_V3.find((tt) => tt.id === selectedTimetableId) || MOCK_TIMETABLES_V3[0];

  const sectionStatus =
    MOCK_SECTION_STATUS[selectedTimetableId] || MOCK_SECTION_STATUS["tt3-1"];

  const gridTemplate = `56px repeat(${periods.length}, minmax(112px, 1fr))`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ── TOP HEADER ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back to Dashboard Button */}
            <button
              type="button"
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {/* Quick Switch to My School */}
            <button
              type="button"
              onClick={onOpenMySchool}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/80 dark:border-indigo-800/60 transition-all cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>My School</span>
            </button>

            {/* Switch to Timetable 1 */}
            {onOpenTimetable1 && (
              <button
                type="button"
                onClick={onOpenTimetable1}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50/80 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200/80 dark:border-violet-800/60 transition-all cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time Table (v1)</span>
              </button>
            )}

            {/* Switch to Timetable 2 */}
            {onOpenTimetable2 && (
              <button
                type="button"
                onClick={onOpenTimetable2}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/60 transition-all cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Time Table 2</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 dark:border-slate-800" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-100 p-0.5 ring-1 ring-slate-200/90 dark:ring-slate-700 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain rounded-full mix-blend-multiply"
                />
              </div>
              <div className="hidden md:flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Time Table 3
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                  UI/UX Studio
                </span>
              </div>
            </div>
          </div>

          {/* Right Profile, Theme Toggle & Sign Out */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="icon" />

            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div
                className={`w-7 h-7 rounded-lg ${user.avatarColor} flex items-center justify-center font-bold text-xs`}
              >
                {user.initials}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {user.fullName}
                </div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-tight font-medium">
                  {user.roleTitle}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-2.5 sm:p-4 flex flex-col gap-2.5">
        {/* ── TOP TOOLBAR: TIMETABLE SELECTOR & PROTOTYPE VIEW CONTROLS ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2.5 sm:p-3 shadow-xs flex items-center justify-between gap-3 flex-wrap relative z-20">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Select Prototype Matrix:</span>
            </span>

            {/* Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs min-w-[280px] sm:min-w-[340px] justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                  <span className="truncate">{selectedTimetable.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {selectedTimetable.version}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-full min-w-[320px] sm:min-w-[380px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Timetable 3 Studio Matrices
                  </div>
                  {MOCK_TIMETABLES_V3.map((tt) => {
                    const isSelected = tt.id === selectedTimetableId;
                    return (
                      <button
                        key={tt.id}
                        type="button"
                        onClick={() => {
                          setSelectedTimetableId(tt.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                          <div className="truncate">
                            <div className="truncate">{tt.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {tt.wing} • {tt.version}
                            </div>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── TIMETABLE 3 CONTAINER ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-2.5 sm:p-3 flex flex-col min-w-0">
              {/* Header Info */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2">
                {/* Left: Class Section & Flat Borderless Status Ticker (Notion Editorial Style) */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white shrink-0">
                      {selectedTimetable.name.split("—")[0].trim()}
                    </span>
                  </div>

                  <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 shrink-0 hidden sm:block" />

                  {/* Flat Borderless Status Ticker (Clickable to Focus Subject) */}
                  <div className="flex items-center gap-2 text-xs font-sans flex-wrap">
                    {sectionStatus.subjects.map((sub) => {
                      const isHighlighted = highlightedSubject === sub.name;
                      return (
                        <React.Fragment key={sub.name}>
                          <span
                            onClick={() =>
                              setHighlightedSubject(isHighlighted ? null : sub.name)
                            }
                            className={`inline-flex items-center gap-1 select-none transition-all cursor-pointer px-1.5 py-0.5 rounded-md ${
                              isHighlighted
                                ? "bg-indigo-100 dark:bg-indigo-950 ring-1 ring-indigo-400 font-bold text-indigo-900 dark:text-indigo-200"
                                : "hover:text-emerald-600 dark:hover:text-emerald-400"
                            }`}
                            title={`Click to focus all ${sub.name} slots across the timetable`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${sub.dot} shrink-0`} />
                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                              {sub.name}
                            </span>
                            <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                              :{sub.count}
                            </span>
                          </span>
                          <span className="text-slate-300 dark:text-slate-700 select-none">·</span>
                        </React.Fragment>
                      );
                    })}

                    {/* Unassigned Indicator (Borderless, Alert Tint) */}
                    <span
                      className="inline-flex items-center gap-1 select-none text-amber-600 dark:text-amber-400 font-medium hover:text-amber-700 transition-colors cursor-default"
                      title={`${sectionStatus.unassigned} periods currently unassigned in timetable`}
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Unassigned</span>
                      <span className="font-bold tabular-nums">:{sectionStatus.unassigned}</span>
                    </span>

                    <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

                    {/* Total Equation Button (Opens Modal Breakdown) */}
                    <button
                      type="button"
                      onClick={() => setIsStatusModalOpen(true)}
                      className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 select-none cursor-pointer transition-colors group"
                      title="Click to view detailed class assignment status breakdown"
                    >
                      <span className="text-slate-400 font-bold">=</span>
                      <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tabular-nums">
                        {sectionStatus.total}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        (Total)
                      </span>
                      <Info className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 ml-0.5 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 5 INDUSTRY-STANDARD VISUAL STYLES SWITCHER BAR ── */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
                    <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Visual Treatment Mode:</span>
                  </div>
                  {highlightedSubject && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                      <span>Focus: {highlightedSubject}</span>
                      <button
                        type="button"
                        onClick={() => setHighlightedSubject(null)}
                        className="hover:text-indigo-900 dark:hover:text-white cursor-pointer ml-0.5"
                        title="Clear subject focus"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-[11px] font-semibold flex-wrap">
                  <button
                    type="button"
                    onClick={() => setVisualTreatment("full-tint")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      visualTreatment === "full-tint"
                        ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="1. Full Pastel Tint (Color tint across the entire cell)"
                  >
                    <span>1. Full Tint</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualTreatment("accent-rail")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      visualTreatment === "accent-rail"
                        ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="2. Left Accent Rail (Linear / Google Calendar style crisp indicator)"
                  >
                    <span>2. Left Accent Rail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualTreatment("subject-badge")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      visualTreatment === "subject-badge"
                        ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="3. Subject Badge / Tag (Notion Database style tag badge)"
                  >
                    <span>3. Subject Badge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualTreatment("icon-dual")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      visualTreatment === "icon-dual"
                        ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="4. Micro-Icon Dual-Encoding (Shape glyph + Color)"
                  >
                    <span>4. Micro-Icons</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisualTreatment("department")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      visualTreatment === "department"
                        ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="5. Department Grouping (STEM, Languages, Humanities, Creative/Sports)"
                  >
                    <span>5. Department Macro</span>
                  </button>
                </div>
              </div>

              {/* Grid Canvas */}
              <div className="flex-1 overflow-x-auto overflow-y-auto">
                <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs w-full min-w-[max(800px,100%)]">
                  {/* 6 Day Rows */}
                  {DAYS.map((day, dayIdx) => (
                    <div
                      key={day}
                      className={`grid items-stretch ${
                        dayIdx < DAYS.length - 1
                          ? "border-b border-slate-200/60 dark:border-slate-800/60"
                          : ""
                      }`}
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      {/* Left Day Cell (Rectangular Grid Cell) */}
                      <div className="px-1 py-1 text-center font-bold text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40 border-r border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center select-none uppercase tracking-wider font-mono">
                        {day}
                      </div>

                      {/* Period Cells (Rectangular Grid Cells with 5 Visual Treatment Styles) */}
                      {periods.map((period, slotIdx) => {
                        const isSelected =
                          selectedCell?.day === day && selectedCell?.periodId === period.id;
                        const assignment =
                          TIMETABLE_GRID_SCHEDULE[day]?.[slotIdx] ||
                          (slotIdx === 0
                            ? { subject: "English", teacher: "Manish Kumar" }
                            : { subject: "General Study", teacher: "Faculty Staff" });
                        const shortSubject = getShortSubject(assignment.subject);
                        const duration = getPeriodDuration(period.startTime, period.endTime);
                        const theme = getSubjectTheme(assignment.subject);
                        const deptTheme = getDepartmentTheme(assignment.subject);
                        const Icon = getSubjectIcon(assignment.subject);

                        const isSubjectHighlighted = highlightedSubject === assignment.subject;
                        const isDimmed = highlightedSubject !== null && !isSubjectHighlighted;

                        return (
                          <div
                            key={`${day}-${period.id}`}
                            onClick={() => {
                              setSelectedCell(isSelected ? null : { day, periodId: period.id });
                              if (highlightedSubject === assignment.subject) {
                                setHighlightedSubject(null);
                              } else {
                                setHighlightedSubject(assignment.subject);
                              }
                            }}
                            className={`min-h-[56px] relative px-2 py-1 flex flex-col justify-between transition-all duration-150 cursor-pointer select-none group ${
                              slotIdx < periods.length - 1
                                ? "border-r border-slate-200/60 dark:border-slate-800/60"
                                : ""
                            } ${
                              isDimmed ? "opacity-25 grayscale-[60%] blur-[0.2px]" : "opacity-100"
                            } ${
                              isSubjectHighlighted
                                ? "ring-2 ring-indigo-500 z-20 shadow-xs scale-[1.01]"
                                : isSelected
                                ? "ring-2 ring-emerald-500 ring-inset z-10"
                                : ""
                            } ${
                              visualTreatment === "full-tint"
                                ? `${theme.bg} ${theme.hoverBg}`
                                : visualTreatment === "department"
                                ? `${deptTheme.bg} ${deptTheme.hoverBg}`
                                : "bg-white dark:bg-slate-900 hover:bg-slate-50/90 dark:hover:bg-slate-800/60"
                            }`}
                          >
                            {/* Style 2: Left Accent Rail Indicator */}
                            {visualTreatment === "accent-rail" && (
                              <div
                                className={`absolute left-0 top-0 bottom-0 w-[3.5px] ${theme.railColor}`}
                              />
                            )}

                            {/* Line 1: Period ID (Top Left) & Duration (Top Right) */}
                            <div className="flex items-center justify-between w-full leading-none">
                              <div className="flex items-center gap-1">
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wide ${
                                    visualTreatment === "full-tint" || visualTreatment === "accent-rail"
                                      ? theme.badgeText
                                      : "text-slate-400 dark:text-slate-500"
                                  }`}
                                >
                                  P{slotIdx + 1}
                                </span>
                                {visualTreatment === "department" && (
                                  <span
                                    className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded ${deptTheme.badge}`}
                                  >
                                    {deptTheme.deptName}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`text-[9.5px] font-semibold tabular-nums opacity-90 ${
                                  visualTreatment === "full-tint"
                                    ? theme.subText
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                              >
                                {duration}
                              </span>
                            </div>

                            {/* Line 2: In & Out Time */}
                            <div
                              className={`text-[10px] font-mono tabular-nums text-center leading-tight ${
                                visualTreatment === "full-tint"
                                  ? theme.subText
                                  : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {period.startTime} - {period.endTime}
                            </div>

                            {/* Line 3: Subject & Teacher (Varies by visual treatment) */}
                            {visualTreatment === "full-tint" && (
                              <div
                                className={`text-[11px] font-bold ${theme.text} truncate whitespace-nowrap text-center leading-tight transition-transform group-hover:scale-[1.01]`}
                                title={`${assignment.subject} - ${assignment.teacher}`}
                              >
                                {shortSubject} - {assignment.teacher}
                              </div>
                            )}

                            {visualTreatment === "accent-rail" && (
                              <div
                                className="text-[11px] truncate whitespace-nowrap text-center leading-tight"
                                title={`${assignment.subject} - ${assignment.teacher}`}
                              >
                                <span className={`font-bold ${theme.text}`}>{shortSubject}</span>{" "}
                                <span className="text-slate-400">-</span>{" "}
                                <span className="text-slate-600 dark:text-slate-300 font-medium">
                                  {assignment.teacher}
                                </span>
                              </div>
                            )}

                            {visualTreatment === "subject-badge" && (
                              <div
                                className="flex items-center justify-center gap-1 truncate w-full text-[11px] leading-tight"
                                title={`${assignment.subject} - ${assignment.teacher}`}
                              >
                                <span
                                  className={`px-1.5 py-0.2 rounded-md font-bold text-[10px] ${theme.badgeBg} ${theme.badgeText} shrink-0 shadow-2xs`}
                                >
                                  {shortSubject}
                                </span>
                                <span className="truncate text-slate-700 dark:text-slate-200 font-medium">
                                  {assignment.teacher}
                                </span>
                              </div>
                            )}

                            {visualTreatment === "icon-dual" && (
                              <div
                                className="flex items-center justify-center gap-1 truncate w-full text-[11px] leading-tight text-slate-800 dark:text-slate-100"
                                title={`${assignment.subject} - ${assignment.teacher}`}
                              >
                                <Icon className={`w-3 h-3 ${theme.badgeText} shrink-0`} />
                                <span className="font-bold">{shortSubject}</span>
                                <span className="text-slate-400">-</span>
                                <span className="truncate text-slate-600 dark:text-slate-300 font-normal">
                                  {assignment.teacher}
                                </span>
                              </div>
                            )}

                            {visualTreatment === "department" && (
                              <div
                                className={`text-[11px] font-bold ${deptTheme.textColor} truncate whitespace-nowrap text-center leading-tight`}
                                title={`${assignment.subject} (${deptTheme.deptName}) - ${assignment.teacher}`}
                              >
                                <span className="font-extrabold">{shortSubject}</span>{" "}
                                <span className="opacity-50">-</span>{" "}
                                <span className="font-normal opacity-90">{assignment.teacher}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
        </div>
      </main>

      {/* ── MODAL: DETAILED CLASS SECTION STATUS BREAKDOWN ── */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedTimetable.name.split("—")[0].trim()} — Schedule Status</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Weekly period assignments & subject distribution
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Required</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{sectionStatus.total}</span>
                <span className="text-[10px] text-slate-500 block">periods / week</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-center">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Assigned</span>
                <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {sectionStatus.subjects.reduce((sum, s) => sum + s.count, 0)}
                </span>
                <span className="text-[10px] text-emerald-600/80 block">allocated</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-center">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Unassigned</span>
                <span className="text-xl font-extrabold text-amber-700 dark:text-amber-300">{sectionStatus.unassigned}</span>
                <span className="text-[10px] text-amber-600/80 block">pending</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-600 dark:text-slate-400">Weekly Allocation Completion</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.round((sectionStatus.subjects.reduce((sum, s) => sum + s.count, 0) / sectionStatus.total) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex gap-0.5 p-0.5">
                {sectionStatus.subjects.map((s) => (
                  <div
                    key={s.name}
                    className={`${s.dot} rounded-xs`}
                    style={{ width: `${(s.count / sectionStatus.total) * 100}%` }}
                    title={`${s.name}: ${s.count} periods`}
                  />
                ))}
                <div
                  className="bg-amber-400 rounded-xs"
                  style={{ width: `${(sectionStatus.unassigned / sectionStatus.total) * 100}%` }}
                  title={`Unassigned: ${sectionStatus.unassigned} periods`}
                />
              </div>
            </div>

            {/* Subject Breakdown List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Subject Allocation Breakdown
              </span>
              {sectionStatus.subjects.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <span className="font-bold text-slate-800 dark:text-slate-200">{s.name}</span>
                    {s.teacher && (
                      <span className="text-[11px] text-slate-400 font-normal">({s.teacher})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="text-slate-700 dark:text-slate-300">{s.count} periods/wk</span>
                    <span className="text-[10px] text-slate-400">
                      ({Math.round((s.count / sectionStatus.total) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
              {sectionStatus.unassigned > 0 && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-amber-800 dark:text-amber-300">Unassigned Period Slots</span>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {sectionStatus.unassigned} periods
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
