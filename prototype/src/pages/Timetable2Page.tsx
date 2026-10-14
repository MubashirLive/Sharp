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
  Minus,
  X,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  Eye,
  SlidersHorizontal,
  GraduationCap,
  Info,
} from "lucide-react";
import schoolLogo from "../assets/ideal-logo.jpg";
import ThemeToggle from "../components/ThemeToggle";

interface Timetable2PageProps {
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
  onOpenTimetable3?: () => void;
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

const INITIAL_PERIODS_V2: PeriodItem[] = [
  { id: "p2-1", startTime: "09:00", endTime: "09:45", type: "regular" },
  { id: "p2-2", startTime: "09:45", endTime: "10:30", type: "regular" },
  { id: "p2-3", startTime: "10:30", endTime: "11:15", type: "regular" },
  { id: "p2-4", startTime: "11:15", endTime: "12:00", type: "regular" },
  { id: "p2-5", startTime: "12:00", endTime: "12:45", type: "break" },
  { id: "p2-6", startTime: "12:45", endTime: "01:30", type: "regular" },
  { id: "p2-7", startTime: "01:30", endTime: "02:15", type: "regular" },
  { id: "p2-8", startTime: "02:15", endTime: "03:00", type: "regular" },
];

const SATURDAY_PERIODS_V2: PeriodItem[] = [
  { id: "sat-1", startTime: "08:30", endTime: "09:05", type: "regular" },
  { id: "sat-2", startTime: "09:05", endTime: "09:40", type: "regular" },
  { id: "sat-3", startTime: "09:40", endTime: "10:15", type: "regular" },
  { id: "sat-4", startTime: "10:15", endTime: "10:50", type: "regular" },
  { id: "sat-5", startTime: "10:50", endTime: "11:25", type: "break" },
  { id: "sat-6", startTime: "11:25", endTime: "12:00", type: "regular" },
  { id: "sat-7", startTime: "12:00", endTime: "12:35", type: "regular" },
  { id: "sat-8", startTime: "12:35", endTime: "01:10", type: "regular" },
];

// Converts time string "HH:MM" or "HH:MM AM/PM" to minutes from midnight
export function timeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().toLowerCase();
  const isPM = clean.includes("pm");
  const isAM = clean.includes("am");
  const timeOnly = clean.replace(/(am|pm)/g, "").trim();

  const parts = timeOnly.split(":");
  if (parts.length < 2) return null;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes) || minutes < 0 || minutes >= 60 || hours < 0 || hours > 23) {
    return null;
  }

  if (isPM) {
    if (hours < 12) hours += 12;
  } else if (isAM) {
    if (hours === 12) hours = 0;
  } else {
    // School schedule heuristic: 1-6 are PM (13:00 - 18:00)
    if (hours >= 1 && hours <= 6) {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
}

// Formats time for calendar gridline markers matching Timetable 1 ("9 AM", "9:45 AM", "12 PM")
export function formatCalendarLineTime(timeStr: string): string {
  const m = timeToMinutes(timeStr);
  if (m === null) return timeStr;
  const h24 = Math.floor(m / 60) % 24;
  const mins = m % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  if (mins === 0) {
    return `${h12} ${ampm}`;
  }
  return `${h12}:${mins.toString().padStart(2, "0")} ${ampm}`;
}

// Calculates duration in minutes between start and end time
export function getDurationMinutes(startTime: string, endTime: string): number | null {
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  if (startM === null || endM === null) return null;
  return endM - startM;
}

// Formats minutes duration into human friendly string "45m" or "35m"
export function formatDuration(mins: number): string {
  if (mins <= 0) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MOCK_TIMETABLES_V2 = [
  {
    id: "tt2-1",
    name: "Class 12-A (Science) — Prototype Matrix",
    wing: "Senior Secondary",
    version: "v2.0 Beta",
    status: "Draft Prototype",
  },
  {
    id: "tt2-2",
    name: "Class 10-B (General) — Prototype Matrix",
    wing: "Secondary Wing",
    version: "v2.0 Beta",
    status: "Draft Prototype",
  },
  {
    id: "tt2-3",
    name: "Primary Wing (Class 5-A) — Bell Prototype",
    wing: "Primary Wing",
    version: "v2.0 Beta",
    status: "Draft Prototype",
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
  "tt2-1": {
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
  "tt2-2": {
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
  "tt2-3": {
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

const CLASS_SCHEDULES: Record<
  string,
  Record<string, { subject: string; teacher: string }[]>
> = {
  "tt2-1": TIMETABLE_GRID_SCHEDULE,
  "tt2-2": {
    Mon: [
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Sports", teacher: "Major Dhyan" },
      { subject: "Arts", teacher: "Amrita Sher-Gil" },
    ],
    Tue: [
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Music", teacher: "Pt. Ravi Shankar" },
      { subject: "Library", teacher: "Pooja Roy" },
    ],
    Wed: [
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Sports", teacher: "Major Dhyan" },
      { subject: "Arts", teacher: "Amrita Sher-Gil" },
      { subject: "Computer", teacher: "Satya N." },
    ],
    Thu: [
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Sports", teacher: "Major Dhyan" },
      { subject: "Moral Science", teacher: "K. S. Pillai" },
    ],
    Fri: [
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Arts", teacher: "Amrita Sher-Gil" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Activity", teacher: "Sunita Verma" },
    ],
    Sat: [
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Sports", teacher: "Major Dhyan" },
      { subject: "Library", teacher: "Pooja Roy" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Remedial Class", teacher: "Dr. R. Ramanujan" },
    ],
  },
  "tt2-3": {
    Mon: [
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "Arts", teacher: "Amrita Sher-Gil" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Sports", teacher: "Major Dhyan" },
    ],
    Tue: [
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Sports", teacher: "Major Dhyan" },
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Library", teacher: "Pooja Roy" },
    ],
    Wed: [
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Music", teacher: "Pt. Ravi Shankar" },
      { subject: "Sports", teacher: "Major Dhyan" },
    ],
    Thu: [
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Sports", teacher: "Major Dhyan" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Moral Science", teacher: "K. S. Pillai" },
    ],
    Fri: [
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Social Studies", teacher: "Sunita Verma" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Arts", teacher: "Amrita Sher-Gil" },
      { subject: "Activity", teacher: "Sunita Verma" },
    ],
    Sat: [
      { subject: "Science", teacher: "Dr. Homi Bhabha" },
      { subject: "English", teacher: "Manish Kumar" },
      { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
      { subject: "Hindi", teacher: "Rajesh Tiwari" },
      { subject: "Computer", teacher: "Satya N." },
      { subject: "Sports", teacher: "Major Dhyan" },
      { subject: "Library", teacher: "Pooja Roy" },
      { subject: "Remedial Class", teacher: "Dr. R. Ramanujan" },
    ],
  },
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

const ZOOM_LEVELS = [70, 85, 100, 115, 130] as const;
const MIN_ZOOM = 70;
const MAX_ZOOM = 130;

function getZoomMetrics(z: number) {
  if (z <= 70) {
    return {
      rowH: "h-[22px]",
      timingH: "h-[18px]",
      dayColWidth: "42px",
      subjectFont: "text-[9px] font-bold tracking-tight",
      pLabelFont: "text-[8.5px]",
      durFont: "text-[7.5px]",
      badgeFont: "text-[7.5px] px-1 py-0 leading-none",
      dayFont: "text-[9px] font-bold",
      cardPad: "p-2 sm:p-2.5",
      cardGap: "gap-3",
      headerPad: "pb-1 mb-1.5",
      tickerFont: "text-[10.5px]",
      badgeContainerH: "w-5 h-5",
      badgeIcon: "w-3 h-3",
      maxSubjects: 5,
    };
  }
  if (z <= 85) {
    return {
      rowH: "h-[25px]",
      timingH: "h-[21px]",
      dayColWidth: "46px",
      subjectFont: "text-[9.5px] font-bold tracking-tight",
      pLabelFont: "text-[9px]",
      durFont: "text-[8px]",
      badgeFont: "text-[8px] px-1 py-0 leading-none",
      dayFont: "text-[10px] font-bold",
      cardPad: "p-2.5 sm:p-3",
      cardGap: "gap-3.5",
      headerPad: "pb-1.5 mb-2",
      tickerFont: "text-[11px]",
      badgeContainerH: "w-5.5 h-5.5",
      badgeIcon: "w-3 h-3",
      maxSubjects: 6,
    };
  }
  if (z <= 100) {
    return {
      rowH: "h-[28px]",
      timingH: "h-[24px]",
      dayColWidth: "50px",
      subjectFont: "text-[10.5px] font-bold",
      pLabelFont: "text-[10px]",
      durFont: "text-[9px]",
      badgeFont: "text-[8.5px] px-1 py-0 leading-none",
      dayFont: "text-[10.5px] font-bold",
      cardPad: "p-3 sm:p-3.5",
      cardGap: "gap-4",
      headerPad: "pb-1.5 mb-2",
      tickerFont: "text-xs",
      badgeContainerH: "w-6 h-6",
      badgeIcon: "w-3.5 h-3.5",
      maxSubjects: 8,
    };
  }
  if (z <= 115) {
    return {
      rowH: "h-[32px]",
      timingH: "h-[28px]",
      dayColWidth: "56px",
      subjectFont: "text-[11.5px] font-bold",
      pLabelFont: "text-[10.5px]",
      durFont: "text-[9.5px]",
      badgeFont: "text-[9px] px-1 py-0.5",
      dayFont: "text-[11px] font-bold",
      cardPad: "p-3.5 sm:p-4",
      cardGap: "gap-4.5",
      headerPad: "pb-2 mb-2",
      tickerFont: "text-xs",
      badgeContainerH: "w-6.5 h-6.5",
      badgeIcon: "w-3.5 h-3.5",
      maxSubjects: 9,
    };
  }
  return {
    rowH: "h-[36px]",
    timingH: "h-[32px]",
    dayColWidth: "62px",
    subjectFont: "text-[12.5px] font-bold",
    pLabelFont: "text-[11px]",
    durFont: "text-[10px]",
    badgeFont: "text-[10px] px-1 py-0.5",
    dayFont: "text-[12px] font-bold",
    cardPad: "p-4 sm:p-5",
    cardGap: "gap-5",
    headerPad: "pb-2 mb-2.5",
    tickerFont: "text-xs",
    badgeContainerH: "w-7 h-7",
    badgeIcon: "w-4 h-4",
    maxSubjects: 10,
  };
}

export default function Timetable2Page({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable1,
  onOpenTimetable3,
  onSignOut,
}: Timetable2PageProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [modalTimetableId, setModalTimetableId] = useState("tt2-1");

  // Periods state for UI/UX testing
  const [periods, setPeriods] = useState<PeriodItem[]>(INITIAL_PERIODS_V2);
  const [selectedCell, setSelectedCell] = useState<{ day: string; periodId: string } | null>(null);
  const [hoveredTeacher, setHoveredTeacher] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const activeModalTimetable =
    MOCK_TIMETABLES_V2.find((tt) => tt.id === modalTimetableId) || MOCK_TIMETABLES_V2[0];
  const activeModalStatus =
    MOCK_SECTION_STATUS[modalTimetableId] || MOCK_SECTION_STATUS["tt2-1"];

  const handleZoomOut = () => {
    setZoom((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev as (typeof ZOOM_LEVELS)[number]);
      if (idx > 0) return ZOOM_LEVELS[idx - 1];
      for (let i = ZOOM_LEVELS.length - 1; i >= 0; i--) {
        if (ZOOM_LEVELS[i] < prev) return ZOOM_LEVELS[i];
      }
      return ZOOM_LEVELS[0];
    });
  };

  const handleZoomIn = () => {
    setZoom((prev) => {
      const idx = ZOOM_LEVELS.indexOf(prev as (typeof ZOOM_LEVELS)[number]);
      if (idx >= 0 && idx < ZOOM_LEVELS.length - 1) return ZOOM_LEVELS[idx + 1];
      for (let i = 0; i < ZOOM_LEVELS.length; i++) {
        if (ZOOM_LEVELS[i] > prev) return ZOOM_LEVELS[i];
      }
      return ZOOM_LEVELS[ZOOM_LEVELS.length - 1];
    });
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const renderTimingHeaderRow = (
    keyPrefix: string,
    schedulePeriods: PeriodItem[],
    isSaturday: boolean = false
  ) => {
    const zm = getZoomMetrics(zoom);
    const template = `${zm.dayColWidth} repeat(${schedulePeriods.length}, minmax(105px, 1fr))`;

    return (
      <div
        className={`grid items-stretch border-b-2 sticky top-0 z-20 ${
          isSaturday
            ? "border-amber-400 dark:border-amber-700 bg-amber-100 dark:bg-amber-950"
            : "border-slate-400/90 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
        }`}
        style={{ gridTemplateColumns: template }}
      >
        {/* Left Header Cell (Spacer) - Sticky Left & Top Corner */}
        <div
          className={`${zm.timingH} sticky left-0 z-30 border-r-2 select-none ${
            isSaturday
              ? "bg-amber-200 dark:bg-amber-900 border-amber-400 dark:border-amber-700 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]"
              : "bg-slate-200 dark:bg-slate-700 border-slate-400/90 dark:border-slate-600 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]"
          }`}
        />

        {/* Period Columns: Scale Time Badges Sitting on Gridlines + Lightweight Inline (P1 · 45m) */}
        {schedulePeriods.map((period, idx) => {
          const durMins =
            getDurationMinutes(period.startTime, period.endTime) || (isSaturday ? 35 : 45);
          const durStr = formatDuration(durMins);

          return (
            <div
              key={`timing-${keyPrefix}-${period.id}`}
              className={`${zm.timingH} relative flex items-center justify-center select-none ${
                idx < schedulePeriods.length - 1
                  ? isSaturday
                    ? "border-r border-amber-300 dark:border-amber-800"
                    : "border-r border-slate-400/80 dark:border-slate-600"
                  : ""
              }`}
            >
              {/* Boundary 0: Start time on Line 0 (Google Calendar scale marker) */}
              {idx === 0 && (
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 font-mono whitespace-nowrap rounded shadow-2xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400 dark:border-slate-600 font-bold ${zm.badgeFont}`}
                >
                  {formatCalendarLineTime(schedulePeriods[0].startTime)}
                </div>
              )}

              {/* Center Period Label: Lightweight Inline Duration (P1 · 30m) */}
              <div
                title={`${period.type === "break" ? "Break" : `Period ${idx + 1}`}: ${period.startTime} – ${period.endTime} (${durStr})`}
                className="flex items-center justify-center gap-1 leading-none select-none"
              >
                <span
                  className={`${zm.pLabelFont} font-bold tracking-tight font-sans ${
                    isSaturday
                      ? "text-amber-800 dark:text-amber-300"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {period.type === "break" ? "Break" : `P${idx + 1}`}
                </span>
                <span
                  className={`text-[8px] ${
                    isSaturday
                      ? "text-amber-400 dark:text-amber-500"
                      : "text-slate-300 dark:text-slate-600"
                  }`}
                >
                  ·
                </span>
                <span
                  className={`${zm.durFont} font-mono tabular-nums font-medium ${
                    isSaturday
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-400 dark:text-slate-400"
                  }`}
                >
                  {durStr}
                </span>
              </div>

              {/* Boundary idx + 1: End time on Line idx + 1 (Google Calendar scale marker) */}
              {idx === schedulePeriods.length - 1 ? (
                /* Inward Flush: Final out-time sits inside cell right next to outer border */
                <div
                  title={`Period End: ${period.endTime}`}
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 z-20 font-mono whitespace-nowrap rounded shadow-2xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400 dark:border-slate-600 font-bold ${zm.badgeFont}`}
                >
                  {formatCalendarLineTime(period.endTime)}
                </div>
              ) : (
                /* Intermediate columns: Straddles vertical gridline */
                <div
                  title={`Period End: ${period.endTime}`}
                  className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 font-mono whitespace-nowrap rounded shadow-2xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400 dark:border-slate-600 font-bold ${zm.badgeFont}`}
                >
                  {formatCalendarLineTime(period.endTime)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimetableCard = (ttItem: (typeof MOCK_TIMETABLES_V2)[0], ttIdx: number) => {
    const zm = getZoomMetrics(zoom);
    const rowH = zm.rowH;
    const dayColWidth = zm.dayColWidth;
    const dayFont = zm.dayFont;
    const subjectFont = zm.subjectFont;

    const template = `${dayColWidth} repeat(${periods.length}, minmax(105px, 1fr))`;
    const satTemplate = `${dayColWidth} repeat(${SATURDAY_PERIODS_V2.length}, minmax(105px, 1fr))`;
    const curStatus = MOCK_SECTION_STATUS[ttItem.id] || MOCK_SECTION_STATUS["tt2-1"];

    return (
      <div key={ttItem.id} id={`table-${ttItem.id}`} className="flex flex-col min-w-0 scroll-mt-2">
        {/* Header Info */}
        <div
          className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800 flex-wrap gap-2 ${zm.headerPad}`}
        >
          {/* Left: Class Section & Flat Borderless Status Ticker (Notion Editorial Style) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div
                className={`rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 ${zm.badgeContainerH}`}
              >
                <GraduationCap className={zm.badgeIcon} />
              </div>
              <span className="font-bold text-slate-900 dark:text-white shrink-0 text-xs sm:text-sm">
                {ttItem.name.split("—")[0].trim()}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                {ttItem.wing}
              </span>
            </div>

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 shrink-0 hidden sm:block" />

            {/* Flat Borderless Status Ticker */}
            <div className={`flex items-center gap-2 font-sans flex-wrap ${zm.tickerFont}`}>
              {curStatus.subjects.slice(0, zm.maxSubjects).map((sub) => (
                <React.Fragment key={sub.name}>
                  <span
                    className="inline-flex items-center gap-1 select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default"
                    title={`${sub.name}: ${sub.count} periods assigned / week`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${sub.dot} shrink-0`} />
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {sub.name}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                      :{sub.count}
                    </span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700 select-none">·</span>
                </React.Fragment>
              ))}

              {/* Unassigned Indicator (Borderless, Alert Tint) */}
              <span
                className="inline-flex items-center gap-1 select-none text-amber-600 dark:text-amber-400 font-medium hover:text-amber-700 transition-colors cursor-default"
                title={`${curStatus.unassigned} periods currently unassigned in timetable`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Unassigned</span>
                <span className="font-bold tabular-nums">:{curStatus.unassigned}</span>
              </span>

              <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

              {/* Total Equation Button (Opens Modal Breakdown) */}
              <button
                type="button"
                onClick={() => {
                  setModalTimetableId(ttItem.id);
                  setIsStatusModalOpen(true);
                }}
                className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 select-none cursor-pointer transition-colors group"
                title="Click to view detailed class assignment status breakdown"
              >
                <span className="text-slate-400 font-bold">=</span>
                <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tabular-nums">
                  {curStatus.total}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Total)
                </span>
                <Info className="w-3 h-3 text-slate-400 group-hover:text-emerald-500 ml-0.5 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid Canvas with Horizontal Scroll & Sticky Day Column */}
        <div className="overflow-x-auto rounded-xl border-2 border-slate-400/90 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-xs">
          <div className="min-w-[max(840px,100%)] w-full flex flex-col">
            {/* 1. TIMING ROW ABOVE MONDAY (FOR MON - FRI SCHEDULE) */}
            {renderTimingHeaderRow(`mon-fri-${ttItem.id}`, periods, false)}

            {/* 2. WEEKDAY SCHEDULE ROWS (MON - FRI) */}
            {DAYS.slice(0, 5).map((day) => {
              return (
                <div
                  key={`${ttItem.id}-${day}`}
                  className="grid items-stretch border-b border-slate-400/80 dark:border-slate-600"
                  style={{ gridTemplateColumns: template }}
                >
                  {/* Left Day Cell - Sticky Left on Horizontal Scroll */}
                  <div
                    className={`sticky left-0 z-20 px-1 py-0.5 text-center font-bold ${dayFont} border-r-2 flex items-center justify-center select-none uppercase tracking-wider font-mono bg-slate-200 dark:bg-slate-800 border-slate-400/90 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-extrabold shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]`}
                  >
                    {day}
                  </div>

                  {/* Period Cells (Rectangular Grid Cells) */}
                  {periods.map((period, slotIdx) => {
                    const cellKey = `${ttItem.id}-${day}-${period.id}`;
                    const isSelected =
                      selectedCell?.day === day && selectedCell?.periodId === cellKey;
                    const classSchedule = CLASS_SCHEDULES[ttItem.id] || TIMETABLE_GRID_SCHEDULE;
                    const assignment =
                      classSchedule[day]?.[slotIdx] ||
                      (slotIdx === 0
                        ? { subject: "English", teacher: "Manish Kumar" }
                        : { subject: "General Study", teacher: "Faculty Staff" });
                    const shortSubject = getShortSubject(assignment.subject);
                    const isTeacherMatch =
                      hoveredTeacher !== null && assignment.teacher === hoveredTeacher;
                    const isCurrentCell = hoveredCell === cellKey;
                    const isDimmed =
                      hoveredTeacher !== null && assignment.teacher !== hoveredTeacher;

                    return (
                      <div
                        key={cellKey}
                        onClick={() =>
                          setSelectedCell(isSelected ? null : { day, periodId: cellKey })
                        }
                        onMouseEnter={() => {
                          setHoveredTeacher(assignment.teacher);
                          setHoveredCell(cellKey);
                        }}
                        onMouseLeave={() => {
                          setHoveredTeacher(null);
                          setHoveredCell(null);
                        }}
                        className={`${rowH} px-1.5 flex items-center justify-center transition-all duration-150 cursor-pointer select-none group relative ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500 ring-inset z-10"
                            : isCurrentCell
                              ? "bg-indigo-100 dark:bg-indigo-900/80 ring-2 ring-indigo-500 ring-inset z-10 shadow-sm"
                              : isTeacherMatch
                                ? "bg-indigo-50/95 dark:bg-indigo-950/90 ring-1 ring-indigo-400 dark:ring-indigo-500 z-10 shadow-2xs"
                                : isDimmed
                                  ? "bg-white/60 dark:bg-slate-900/60 opacity-40 hover:opacity-100"
                                  : "bg-white dark:bg-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                        } ${
                          slotIdx < periods.length - 1
                            ? "border-r border-slate-400/80 dark:border-slate-600"
                            : ""
                        }`}
                      >
                        {/* Subject & Teacher (Single Line) */}
                        <div
                          className={`${subjectFont} truncate whitespace-nowrap text-center leading-tight transition-colors ${
                            isTeacherMatch
                              ? "text-indigo-950 dark:text-indigo-100 font-extrabold"
                              : "text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                          }`}
                          title={`${assignment.subject} - ${assignment.teacher} (${period.startTime} - ${period.endTime})`}
                        >
                          <span>{shortSubject}</span>
                          <span className="mx-0.5 text-slate-400">·</span>
                          <span
                            className={
                              isTeacherMatch
                                ? "underline decoration-indigo-400 underline-offset-2 font-bold"
                                : ""
                            }
                          >
                            {assignment.teacher}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* 3. TIMING ROW ABOVE SATURDAY (FOR SATURDAY SCHEDULE) */}
            {renderTimingHeaderRow(`sat-${ttItem.id}`, SATURDAY_PERIODS_V2, true)}

            {/* 4. SATURDAY SCHEDULE ROW */}
            <div
              key={`${ttItem.id}-Sat`}
              className="grid items-stretch"
              style={{ gridTemplateColumns: satTemplate }}
            >
              {/* Left Day Cell for Saturday - Sticky Left */}
              <div
                className={`sticky left-0 z-20 px-1 py-0.5 text-center font-bold ${dayFont} border-r-2 flex items-center justify-center select-none uppercase tracking-wider font-mono bg-amber-200 dark:bg-amber-950 border-slate-400/90 dark:border-slate-600 text-amber-800 dark:text-amber-300 font-extrabold shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]`}
              >
                Sat
              </div>

              {/* Period Cells for Saturday */}
              {SATURDAY_PERIODS_V2.map((satPeriod, slotIdx) => {
                const cellKey = `${ttItem.id}-Sat-${satPeriod.id}`;
                const isSelected =
                  selectedCell?.day === "Sat" && selectedCell?.periodId === cellKey;
                const classSchedule = CLASS_SCHEDULES[ttItem.id] || TIMETABLE_GRID_SCHEDULE;
                const assignment =
                  classSchedule["Sat"]?.[slotIdx] || {
                    subject: "General Study",
                    teacher: "Faculty Staff",
                  };
                const shortSubject = getShortSubject(assignment.subject);
                const isTeacherMatch =
                  hoveredTeacher !== null && assignment.teacher === hoveredTeacher;
                const isCurrentCell = hoveredCell === cellKey;
                const isDimmed =
                  hoveredTeacher !== null && assignment.teacher !== hoveredTeacher;

                return (
                  <div
                    key={cellKey}
                    onClick={() =>
                      setSelectedCell(isSelected ? null : { day: "Sat", periodId: cellKey })
                    }
                    onMouseEnter={() => {
                      setHoveredTeacher(assignment.teacher);
                      setHoveredCell(cellKey);
                    }}
                    onMouseLeave={() => {
                      setHoveredTeacher(null);
                      setHoveredCell(null);
                    }}
                    className={`${rowH} px-1.5 flex items-center justify-center transition-all duration-150 cursor-pointer select-none group relative ${
                      isSelected
                        ? "bg-amber-50 dark:bg-amber-950/60 ring-2 ring-amber-500 ring-inset z-10"
                        : isCurrentCell
                          ? "bg-indigo-100 dark:bg-indigo-900/80 ring-2 ring-indigo-500 ring-inset z-10 shadow-sm"
                          : isTeacherMatch
                            ? "bg-indigo-50/95 dark:bg-indigo-950/90 ring-1 ring-indigo-400 dark:ring-indigo-500 z-10 shadow-2xs"
                            : isDimmed
                              ? "bg-amber-50/10 dark:bg-amber-950/5 opacity-40 hover:opacity-100"
                              : "bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-100/30 dark:hover:bg-amber-950/25"
                    } ${
                      slotIdx < SATURDAY_PERIODS_V2.length - 1
                        ? "border-r border-slate-400/80 dark:border-slate-600"
                        : ""
                    }`}
                  >
                    {/* Subject & Teacher (Single Line) */}
                    <div
                      className={`${subjectFont} text-slate-800 dark:text-slate-100 truncate whitespace-nowrap text-center leading-tight transition-colors ${
                        isTeacherMatch
                          ? "text-indigo-950 dark:text-indigo-100 font-extrabold"
                          : "group-hover:text-amber-600 dark:group-hover:text-amber-400"
                      }`}
                      title={`${assignment.subject} - ${assignment.teacher} (${satPeriod.startTime} - ${satPeriod.endTime})`}
                    >
                      <span>{shortSubject}</span>
                      <span className="mx-0.5 text-slate-400">·</span>
                      <span
                        className={
                          isTeacherMatch
                            ? "underline decoration-indigo-400 underline-offset-2 font-bold"
                            : ""
                        }
                      >
                        {assignment.teacher}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ── TOP HEADER ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-2.5 shadow-2xs">
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

            {/* Switch to Timetable 3 */}
            {onOpenTimetable3 && (
              <button
                type="button"
                onClick={onOpenTimetable3}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50/80 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200/80 dark:border-amber-800/60 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Time Table 3</span>
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
                  Time Table 2
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                  Multi-Matrix Studio
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
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-2 sm:p-3 flex flex-col gap-2">
        {/* ── TOP TOOLBAR: MULTI-TABLE MATRIX HEADER & ZOOM STEPPER CONTROLS ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 shadow-xs flex items-center justify-between gap-3 flex-wrap relative z-20">
          {/* Left: Multi-Table Overview & Quick Jump */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Multi-Class Schedule Matrix</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {MOCK_TIMETABLES_V2.length} Classes Stacked
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
                  Live synchronized schedule view of all active class sections
                </p>
              </div>
            </div>

            {/* Quick Class Jump Pills */}
            <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                Jump to:
              </span>
              {MOCK_TIMETABLES_V2.map((tt) => (
                <button
                  key={tt.id}
                  type="button"
                  onClick={() => {
                    const el = document.getElementById(`table-${tt.id}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  {tt.name.split("—")[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Center: Live Teacher Hover Focus Indicator */}
          {hoveredTeacher && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/90 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-2xs animate-in fade-in duration-150">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse shrink-0" />
              <span>
                Teacher: <strong className="font-extrabold text-indigo-900 dark:text-indigo-100">{hoveredTeacher}</strong>
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-200/70 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-mono">
                Cross-Class Glowing
              </span>
              <button
                type="button"
                onClick={() => {
                  setHoveredTeacher(null);
                  setHoveredCell(null);
                }}
                className="ml-1 p-0.5 rounded-md hover:bg-indigo-200/80 dark:hover:bg-indigo-800 text-indigo-400 hover:text-indigo-700 cursor-pointer"
                title="Clear teacher highlight"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Right: Zoom In / Zoom Out Stepper Control (- to +) */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1.5 select-none hidden sm:inline">
                Zoom:
              </span>

              {/* Zoom Out Button (-) */}
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                title={zoom <= MIN_ZOOM ? `Minimum zoom reached (${MIN_ZOOM}%)` : "Zoom out (more compact tables)"}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  zoom <= MIN_ZOOM
                    ? "opacity-30 cursor-not-allowed text-slate-400"
                    : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 active:scale-95 shadow-2xs cursor-pointer"
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>

              {/* Zoom Level Indicator / Reset Button */}
              <button
                type="button"
                onClick={handleResetZoom}
                title="Click to reset zoom to 100% (Balanced)"
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs tabular-nums min-w-[54px] text-center"
              >
                {zoom}%
              </button>

              {/* Zoom In Button (+) */}
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                title={zoom >= MAX_ZOOM ? `Maximum zoom reached (${MAX_ZOOM}%)` : "Zoom in (larger view & fonts)"}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  zoom >= MAX_ZOOM
                    ? "opacity-30 cursor-not-allowed text-slate-400"
                    : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 active:scale-95 shadow-2xs cursor-pointer"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── TIMETABLE 2 MULTI-TABLE PROTOTYPE CONTAINER ── */}
        {(() => {
          const zm = getZoomMetrics(zoom);
          return (
            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 flex flex-col overflow-y-auto ${zm.cardPad}`}
            >
              <div className={`flex flex-col ${zm.cardGap}`}>
                {MOCK_TIMETABLES_V2.map((tt, idx) => renderTimetableCard(tt, idx))}
              </div>
            </div>
          );
        })()}
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
                    <span>{activeModalTimetable.name.split("—")[0].trim()} — Schedule Status</span>
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
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{activeModalStatus.total}</span>
                <span className="text-[10px] text-slate-500 block">periods / week</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-center">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Assigned</span>
                <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {activeModalStatus.subjects.reduce((sum, s) => sum + s.count, 0)}
                </span>
                <span className="text-[10px] text-emerald-600/80 block">allocated</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 text-center">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Unassigned</span>
                <span className="text-xl font-extrabold text-amber-700 dark:text-amber-300">{activeModalStatus.unassigned}</span>
                <span className="text-[10px] text-amber-600/80 block">pending</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                <span className="text-slate-600 dark:text-slate-400">Weekly Allocation Completion</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {Math.round((activeModalStatus.subjects.reduce((sum, s) => sum + s.count, 0) / activeModalStatus.total) * 100)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex gap-0.5 p-0.5">
                {activeModalStatus.subjects.map((s) => (
                  <div
                    key={s.name}
                    className={`${s.dot} rounded-xs`}
                    style={{ width: `${(s.count / activeModalStatus.total) * 100}%` }}
                    title={`${s.name}: ${s.count} periods`}
                  />
                ))}
                <div
                  className="bg-amber-400 rounded-xs"
                  style={{ width: `${(activeModalStatus.unassigned / activeModalStatus.total) * 100}%` }}
                  title={`Unassigned: ${activeModalStatus.unassigned} periods`}
                />
              </div>
            </div>

            {/* Subject Breakdown List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Subject Allocation Breakdown
              </span>
              {activeModalStatus.subjects.map((s) => (
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
                      ({Math.round((s.count / activeModalStatus.total) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
              {activeModalStatus.unassigned > 0 && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-bold text-amber-800 dark:text-amber-300">Unassigned Period Slots</span>
                  </div>
                  <span className="font-bold text-amber-700 dark:text-amber-400">
                    {activeModalStatus.unassigned} periods
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
