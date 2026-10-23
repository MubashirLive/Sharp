import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
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
  Trash2,
  Coffee,
  BookOpen,
  Edit2,
  Settings,
  PlusCircle,
  RotateCcw,
  CheckCircle2,
  UserCheck,
  User,
  Save,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

interface Timetable2PageProps {
  user?: {
    fullName: string;
    roleTitle: string;
    schoolName: string;
    schoolCode: string;
    avatarColor: string;
    initials: string;
  };
  onBackToDashboard: () => void;
  onOpenMySchool?: () => void;
  onOpenTimetable1?: () => void;
  onOpenTimetable3?: () => void;
  onSignOut?: () => void;
}

export interface PeriodItem {
  id: string;
  startTime: string;
  endTime: string;
  type?: "regular" | "break" | "assembly" | "activity";
  title?: string;
}

export interface PeriodDisplayItem extends PeriodItem {
  label: string;
  isAcademic: boolean;
  periodNumber?: number;
}

export interface BellSchedule {
  id: string;
  name: string;
  periods: PeriodItem[];
  isCustom?: boolean;
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
  { id: "p2-5", startTime: "12:00", endTime: "12:45", type: "break", title: "Lunch Break" },
  { id: "p2-6", startTime: "12:45", endTime: "01:30", type: "regular" },
  { id: "p2-7", startTime: "01:30", endTime: "02:15", type: "regular" },
  { id: "p2-8", startTime: "02:15", endTime: "03:00", type: "regular" },
];

const SATURDAY_PERIODS_V2: PeriodItem[] = [
  { id: "sat-1", startTime: "08:30", endTime: "09:05", type: "regular" },
  { id: "sat-2", startTime: "09:05", endTime: "09:40", type: "regular" },
  { id: "sat-3", startTime: "09:40", endTime: "10:15", type: "regular" },
  { id: "sat-4", startTime: "10:15", endTime: "10:50", type: "regular" },
  { id: "sat-5", startTime: "10:50", endTime: "11:25", type: "break", title: "Recess" },
  { id: "sat-6", startTime: "11:25", endTime: "12:00", type: "regular" },
  { id: "sat-7", startTime: "12:00", endTime: "12:35", type: "regular" },
  { id: "sat-8", startTime: "12:35", endTime: "01:10", type: "regular" },
];

export const INITIAL_BELL_SCHEDULES: Record<string, BellSchedule> = {
  standard: {
    id: "standard",
    name: "Standard Bell Schedule (Mon–Fri)",
    periods: INITIAL_PERIODS_V2,
  },
  saturday: {
    id: "saturday",
    name: "Saturday Bell Schedule (Half-Day)",
    periods: SATURDAY_PERIODS_V2,
  },
};

export const INITIAL_DAY_SCHEDULE_MAP: Record<string, string> = {
  Mon: "standard",
  Tue: "standard",
  Wed: "standard",
  Thu: "standard",
  Fri: "standard",
  Sat: "saturday",
};

export const SUBJECT_CATALOG = [
  { name: "Mathematics", short: "Math", teacher: "Dr. R. Ramanujan", color: "indigo", dot: "bg-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200/80 dark:border-indigo-800/60" },
  { name: "Science", short: "Sci", teacher: "Dr. Homi Bhabha", color: "emerald", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/80 dark:border-emerald-800/60" },
  { name: "Physics", short: "Phy", teacher: "Dr. C. V. Raman", color: "sky", dot: "bg-sky-500", bg: "bg-sky-50 dark:bg-sky-950/40", border: "border-sky-200/80 dark:border-sky-800/60" },
  { name: "Chemistry", short: "Chem", teacher: "Dr. A. P. J. Kalam", color: "teal", dot: "bg-teal-500", bg: "bg-teal-50 dark:bg-teal-950/40", border: "border-teal-200/80 dark:border-teal-800/60" },
  { name: "Biology", short: "Bio", teacher: "Dr. Salim Ali", color: "emerald", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/80 dark:border-emerald-800/60" },
  { name: "English", short: "Eng", teacher: "Manish Kumar", color: "blue", dot: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200/80 dark:border-blue-800/60" },
  { name: "Social Studies", short: "Social", teacher: "Sunita Verma", color: "purple", dot: "bg-purple-500", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200/80 dark:border-purple-800/60" },
  { name: "History", short: "Hist", teacher: "Mrs. Romila Thapar", color: "rose", dot: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200/80 dark:border-rose-800/60" },
  { name: "Economics", short: "Eco", teacher: "Dr. Amartya Sen", color: "amber", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/80 dark:border-amber-800/60" },
  { name: "Accountancy", short: "Acc", teacher: "Mr. R. Jhunjhunwala", color: "cyan", dot: "bg-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-200/80 dark:border-cyan-800/60" },
  { name: "Business Studies", short: "BST", teacher: "Mrs. Kiran M. Shaw", color: "violet", dot: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-200/80 dark:border-violet-800/60" },
  { name: "Hindi", short: "Hindi", teacher: "Rajesh Tiwari", color: "amber", dot: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/80 dark:border-amber-800/60" },
  { name: "Computer", short: "Comp", teacher: "Satya N.", color: "cyan", dot: "bg-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-200/80 dark:border-cyan-800/60" },
  { name: "EVS", short: "EVS", teacher: "Mrs. Meera Kapoor", color: "emerald", dot: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/80 dark:border-emerald-800/60" },
  { name: "Rhymes & Play", short: "Play", teacher: "Mrs. Ananya Sen", color: "pink", dot: "bg-pink-500", bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-200/80 dark:border-pink-800/60" },
  { name: "Sports", short: "Sports", teacher: "Major Dhyan", color: "orange", dot: "bg-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200/80 dark:border-orange-800/60" },
  { name: "Arts", short: "Arts", teacher: "Amrita Sher-Gil", color: "pink", dot: "bg-pink-500", bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-200/80 dark:border-pink-800/60" },
  { name: "Music", short: "Music", teacher: "Pt. Ravi Shankar", color: "violet", dot: "bg-violet-500", bg: "bg-violet-50 dark:bg-violet-950/40", border: "border-violet-200/80 dark:border-violet-800/60" },
  { name: "Library", short: "Lib", teacher: "Pooja Roy", color: "slate", dot: "bg-slate-500", bg: "bg-slate-50 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" },
  { name: "Moral Science", short: "Moral", teacher: "K. S. Pillai", color: "teal", dot: "bg-teal-500", bg: "bg-teal-50 dark:bg-teal-950/40", border: "border-teal-200/80 dark:border-teal-800/60" },
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

// Converts minutes from midnight back to school format "HH:MM"
export function minutesToTime(totalMins: number, use12Hour: boolean = true): string {
  const norm = ((totalMins % 1440) + 1440) % 1440;
  let hours = Math.floor(norm / 60);
  const minutes = norm % 60;

  if (use12Hour) {
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

// Smart Auto-Sequencing: computes P1, P2, P3... skipping breaks and non-academic intervals
export function computePeriodDisplayItems(periods: PeriodItem[]): PeriodDisplayItem[] {
  let academicCount = 0;
  return periods.map((period) => {
    if (period.type === "break") {
      return {
        ...period,
        label: period.title || "Break",
        isAcademic: false,
      };
    }
    if (period.type === "assembly") {
      return {
        ...period,
        label: period.title || "Assembly",
        isAcademic: false,
      };
    }
    academicCount += 1;
    return {
      ...period,
      label: `P${academicCount}`,
      isAcademic: true,
      periodNumber: academicCount,
    };
  });
}

export interface DayScheduleGroup {
  scheduleId: string;
  schedule: BellSchedule;
  days: string[];
}

// Groups consecutive days that share the same bell schedule
export function getDayScheduleGroups(
  days: string[],
  dayScheduleMap: Record<string, string>,
  bellSchedules: Record<string, BellSchedule>
): DayScheduleGroup[] {
  const groups: DayScheduleGroup[] = [];
  let currentGroup: DayScheduleGroup | null = null;

  for (const day of days) {
    const sId = dayScheduleMap[day] || "standard";
    const schedule = bellSchedules[sId] || bellSchedules["standard"] || {
      id: sId,
      name: `${day} Bell Schedule`,
      periods: INITIAL_PERIODS_V2,
    };

    if (!currentGroup || currentGroup.scheduleId !== sId) {
      currentGroup = {
        scheduleId: sId,
        schedule,
        days: [day],
      };
      groups.push(currentGroup);
    } else {
      currentGroup.days.push(day);
    }
  }

  return groups;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ── Master Timetables (School-wide Timetable Versions) ──
export interface MasterTimetable {
  id: string;
  name: string;
  academicYear: string;
  version: string;
  status: "Active" | "Draft" | "Archived";
  description: string;
}

export const MASTER_TIMETABLES: MasterTimetable[] = [
  {
    id: "tt-main",
    name: "Main Academic Timetable 2026-27",
    academicYear: "2026-2027",
    version: "v2.0 Final",
    status: "Active",
    description: "Regular academic schedule across all school wings",
  },
  {
    id: "tt-winter",
    name: "Winter Bell Timetable 2026-27",
    academicYear: "2026-2027",
    version: "v2.1 Draft",
    status: "Draft",
    description: "Delayed morning bell schedule for winter months",
  },
  {
    id: "tt-exam",
    name: "Half-Yearly Examination Timetable",
    academicYear: "2026-2027",
    version: "v1.0 Plan",
    status: "Draft",
    description: "Examination & evaluation test slots",
  },
];

// ── School Wing Filters (Pre-Primary, Primary, Middle, Secondary, Senior Secondary) ──
export const WING_OPTIONS = [
  { id: "all", label: "All Wings", count: 36, description: "Full School (36 Classes)" },
  { id: "Pre-Primary Wing", label: "Pre-Primary Wing", count: 6, description: "Nursery – UKG (6 Classes)" },
  { id: "Primary Wing", label: "Primary Wing", count: 10, description: "Class 1 – 5 (10 Classes)" },
  { id: "Middle Wing", label: "Middle Wing", count: 9, description: "Class 6 – 8 (9 Classes)" },
  { id: "Secondary Wing", label: "Secondary Wing", count: 6, description: "Class 9 – 10 (6 Classes)" },
  { id: "Senior Secondary", label: "Senior Secondary", count: 5, description: "Class 11 – 12 (5 Classes)" },
];

export const MOCK_CLASSES_LIST = [
  // ── Pre-Primary Wing (Nursery to UKG - 2 sections each = 6 classes) ──
  { id: "tt-nur-a", name: "Nursery - Section A — Pre-Primary", wing: "Pre-Primary Wing", version: "Sec A", status: "Active" },
  { id: "tt-nur-b", name: "Nursery - Section B — Pre-Primary", wing: "Pre-Primary Wing", version: "Sec B", status: "Active" },
  { id: "tt-lkg-a", name: "LKG - Section A — Pre-Primary", wing: "Pre-Primary Wing", version: "Sec A", status: "Active" },
  { id: "tt-lkg-b", name: "LKG - Section B — Pre-Primary", wing: "Pre-Primary Wing", version: "Sec B", status: "Active" },
  { id: "tt-ukg-a", name: "UKG - Section A — Pre-Primary", wing: "Pre-Primary Wing", version: "Sec A", status: "Active" },
  { id: "tt-ukg-b", name: "UKG - Section B — Pre-Primary", wing: "Pre-Primary Wing", version: "Sec B", status: "Active" },

  // ── Primary Wing (Classes 1 to 5 - 2 sections each = 10 classes) ──
  { id: "tt-1a", name: "Class 1 - Section A — Primary Wing", wing: "Primary Wing", version: "Sec A", status: "Active" },
  { id: "tt-1b", name: "Class 1 - Section B — Primary Wing", wing: "Primary Wing", version: "Sec B", status: "Active" },
  { id: "tt-2a", name: "Class 2 - Section A — Primary Wing", wing: "Primary Wing", version: "Sec A", status: "Active" },
  { id: "tt-2b", name: "Class 2 - Section B — Primary Wing", wing: "Primary Wing", version: "Sec B", status: "Active" },
  { id: "tt-3a", name: "Class 3 - Section A — Primary Wing", wing: "Primary Wing", version: "Sec A", status: "Active" },
  { id: "tt-3b", name: "Class 3 - Section B — Primary Wing", wing: "Primary Wing", version: "Sec B", status: "Active" },
  { id: "tt-4a", name: "Class 4 - Section A — Primary Wing", wing: "Primary Wing", version: "Sec A", status: "Active" },
  { id: "tt-4b", name: "Class 4 - Section B — Primary Wing", wing: "Primary Wing", version: "Sec B", status: "Active" },
  { id: "tt-5a", name: "Class 5 - Section A — Primary Wing", wing: "Primary Wing", version: "Sec A", status: "Active" },
  { id: "tt-5b", name: "Class 5 - Section B — Primary Wing", wing: "Primary Wing", version: "Sec B", status: "Active" },

  // ── Middle Wing (Classes 6 to 8 - 3 sections each = 9 classes) ──
  { id: "tt-6a", name: "Class 6 - Section A — Middle Wing", wing: "Middle Wing", version: "Sec A", status: "Active" },
  { id: "tt-6b", name: "Class 6 - Section B — Middle Wing", wing: "Middle Wing", version: "Sec B", status: "Active" },
  { id: "tt-6c", name: "Class 6 - Section C — Middle Wing", wing: "Middle Wing", version: "Sec C", status: "Active" },
  { id: "tt-7a", name: "Class 7 - Section A — Middle Wing", wing: "Middle Wing", version: "Sec A", status: "Active" },
  { id: "tt-7b", name: "Class 7 - Section B — Middle Wing", wing: "Middle Wing", version: "Sec B", status: "Active" },
  { id: "tt-7c", name: "Class 7 - Section C — Middle Wing", wing: "Middle Wing", version: "Sec C", status: "Active" },
  { id: "tt-8a", name: "Class 8 - Section A — Middle Wing", wing: "Middle Wing", version: "Sec A", status: "Active" },
  { id: "tt-8b", name: "Class 8 - Section B — Middle Wing", wing: "Middle Wing", version: "Sec B", status: "Active" },
  { id: "tt-8c", name: "Class 8 - Section C — Middle Wing", wing: "Middle Wing", version: "Sec C", status: "Active" },

  // ── Secondary Wing (Classes 9 & 10 - 3 sections each = 6 classes) ──
  { id: "tt-9a", name: "Class 9 - Section A — Secondary Wing", wing: "Secondary Wing", version: "Sec A", status: "Active" },
  { id: "tt-9b", name: "Class 9 - Section B — Secondary Wing", wing: "Secondary Wing", version: "Sec B", status: "Active" },
  { id: "tt-9c", name: "Class 9 - Section C — Secondary Wing", wing: "Secondary Wing", version: "Sec C", status: "Active" },
  { id: "tt-10a", name: "Class 10 - Section A — Secondary Wing", wing: "Secondary Wing", version: "Sec A", status: "Active" },
  { id: "tt-10b", name: "Class 10 - Section B — Secondary Wing", wing: "Secondary Wing", version: "Sec B", status: "Active" },
  { id: "tt-10c", name: "Class 10 - Section C — Secondary Wing", wing: "Secondary Wing", version: "Sec C", status: "Active" },

  // ── Senior Secondary Wing (Classes 11 & 12 - 2 in 11th, 3 in 12th = 5 classes) ──
  { id: "tt-11a", name: "Class 11 - Section A (Science) — Senior Sec.", wing: "Senior Secondary", version: "11-A Sci", status: "Active" },
  { id: "tt-11b", name: "Class 11 - Section B (Commerce) — Senior Sec.", wing: "Senior Secondary", version: "11-B Comm", status: "Active" },
  { id: "tt-12a", name: "Class 12 - Section A (Science) — Senior Sec.", wing: "Senior Secondary", version: "12-A Sci", status: "Active" },
  { id: "tt-12b", name: "Class 12 - Section B (Commerce) — Senior Sec.", wing: "Senior Secondary", version: "12-B Comm", status: "Active" },
  { id: "tt-12c", name: "Class 12 - Section C (Humanities) — Senior Sec.", wing: "Senior Secondary", version: "12-C Hum", status: "Active" },
];

export const MOCK_TIMETABLES_V2 = MOCK_CLASSES_LIST;

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

export function computeSectionStatus(
  classSchedule: Record<string, { subject: string; teacher: string }[]> | undefined,
  catalog: typeof SUBJECT_CATALOG
): TimetableSectionStatus {
  if (!classSchedule) {
    return { total: 0, unassigned: 0, subjects: [] };
  }
  const tally: Record<string, number> = {};
  let totalAssigned = 0;
  let totalSlots = 0;

  DAYS.forEach((day) => {
    const slots = classSchedule[day] || [];
    slots.forEach((slot) => {
      if (slot && slot.subject && slot.subject !== "Break") {
        totalSlots += 1;
        if (slot.subject !== "Unassigned" && slot.subject !== "Free" && slot.subject.trim() !== "") {
          tally[slot.subject] = (tally[slot.subject] || 0) + 1;
          totalAssigned += 1;
        }
      }
    });
  });

  const subjects: SubjectAllocation[] = [];

  catalog.forEach((cat) => {
    const count = (tally[cat.name] || 0) + (tally[cat.short] || 0);
    if (count > 0) {
      subjects.push({
        name: cat.short || cat.name,
        count,
        color: `text-${cat.color}-700 dark:text-${cat.color}-300`,
        bg: cat.bg,
        border: cat.border,
        dot: cat.dot,
        teacher: cat.teacher,
      });
    }
  });

  Object.keys(tally).forEach((subName) => {
    if (!catalog.some((c) => c.name === subName || c.short === subName)) {
      subjects.push({
        name: subName,
        count: tally[subName],
        color: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-100 dark:bg-slate-800",
        border: "border-slate-200 dark:border-slate-700",
        dot: "bg-slate-400",
        teacher: "Assigned Staff",
      });
    }
  });

  const unassigned = Math.max(0, totalSlots - totalAssigned);

  return {
    total: totalAssigned,
    unassigned,
    subjects,
  };
}
// Realistic Weekly Schedule Generator for all 36 classes across all Wings
function generateInitialClassSchedules(
  classList: typeof MOCK_TIMETABLES_V2
): Record<string, Record<string, { subject: string; teacher: string }[]>> {
  const result: Record<string, Record<string, { subject: string; teacher: string }[]>> = {};

  const prePrimaryPool = [
    { subject: "Rhymes & Play", teacher: "Mrs. Ananya Sen" },
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Arts", teacher: "Amrita Sher-Gil" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Music", teacher: "Pt. Ravi Shankar" },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "EVS", teacher: "Mrs. Meera Kapoor" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
  ];

  const primaryPool = [
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "EVS", teacher: "Mrs. Meera Kapoor" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Arts", teacher: "Amrita Sher-Gil" },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Music", teacher: "Pt. Ravi Shankar" },
    { subject: "Library", teacher: "Pooja Roy" },
    { subject: "Moral Science", teacher: "K. S. Pillai" },
  ];

  const middlePool = [
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Science", teacher: "Dr. Homi Bhabha" },
    { subject: "Social Studies", teacher: "Sunita Verma" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Arts", teacher: "Amrita Sher-Gil" },
    { subject: "Music", teacher: "Pt. Ravi Shankar" },
    { subject: "Library", teacher: "Pooja Roy" },
  ];

  const secondaryPool = [
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Science", teacher: "Dr. Homi Bhabha" },
    { subject: "Social Studies", teacher: "Sunita Verma" },
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Library", teacher: "Pooja Roy" },
  ];

  const sciencePool = [
    { subject: "Physics", teacher: "Dr. C. V. Raman" },
    { subject: "Chemistry", teacher: "Dr. A. P. J. Kalam" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Biology", teacher: "Dr. Salim Ali" },
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Library", teacher: "Pooja Roy" },
  ];

  const commercePool = [
    { subject: "Accountancy", teacher: "Mr. R. Jhunjhunwala" },
    { subject: "Economics", teacher: "Dr. Amartya Sen" },
    { subject: "Business Studies", teacher: "Mrs. Kiran M. Shaw" },
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Mathematics", teacher: "Dr. R. Ramanujan" },
    { subject: "Computer", teacher: "Satya N." },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Library", teacher: "Pooja Roy" },
  ];

  const humanitiesPool = [
    { subject: "History", teacher: "Mrs. Romila Thapar" },
    { subject: "Economics", teacher: "Dr. Amartya Sen" },
    { subject: "Social Studies", teacher: "Sunita Verma" },
    { subject: "English", teacher: "Manish Kumar" },
    { subject: "Hindi", teacher: "Rajesh Tiwari" },
    { subject: "Arts", teacher: "Amrita Sher-Gil" },
    { subject: "Sports", teacher: "Major Dhyan" },
    { subject: "Library", teacher: "Pooja Roy" },
  ];

  classList.forEach((c, cIdx) => {
    let pool = middlePool;
    if (c.wing === "Pre-Primary Wing") pool = prePrimaryPool;
    else if (c.wing === "Primary Wing") pool = primaryPool;
    else if (c.wing === "Middle Wing") pool = middlePool;
    else if (c.wing === "Secondary Wing") pool = secondaryPool;
    else if (c.name.includes("Commerce")) pool = commercePool;
    else if (c.name.includes("Humanities")) pool = humanitiesPool;
    else if (c.wing === "Senior Secondary") pool = sciencePool;

    const classWeek: Record<string, { subject: string; teacher: string }[]> = {};

    DAYS.forEach((day, dIdx) => {
      const daySlots: { subject: string; teacher: string }[] = [];
      for (let slot = 0; slot < 8; slot++) {
        // Leave 1-2 unassigned slots per week for practice/trial testing
        const isFree = (cIdx * 7 + dIdx * 3 + slot) % 23 === 0 && slot !== 4;
        if (isFree) {
          daySlots.push({ subject: "Unassigned", teacher: "Unassigned" });
        } else {
          const itemIdx = (cIdx * 2 + dIdx * 3 + slot) % pool.length;
          daySlots.push(pool[itemIdx]);
        }
      }
      classWeek[day] = daySlots;
    });

    result[c.id] = classWeek;
  });

  return result;
}

const CLASS_SCHEDULES: Record<
  string,
  Record<string, { subject: string; teacher: string }[]>
> = generateInitialClassSchedules(MOCK_TIMETABLES_V2);

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

// ── Zero-Space Class & Section Visual Styling Helper ──
export function getClassVisualMeta(ttItem: { id: string; name: string; wing: string; version: string }) {
  const wing = ttItem.wing || "";
  const cleanName = ttItem.name.split("—")[0].trim();
  const parts = cleanName.split("-");
  const gradeName = parts[0]?.trim() || cleanName;
  const rawSec = parts.slice(1).join("-").trim() || ttItem.version || "";

  // Extract Section Letter: "A", "B", "C"
  let sectionLetter = "A";
  const upperSec = rawSec.toUpperCase();
  if (upperSec.includes("SEC C") || upperSec.includes("SECTION C") || upperSec.includes("-C")) {
    sectionLetter = "C";
  } else if (upperSec.includes("SEC B") || upperSec.includes("SECTION B") || upperSec.includes("-B")) {
    sectionLetter = "B";
  } else if (upperSec.includes("SEC A") || upperSec.includes("SECTION A") || upperSec.includes("-A")) {
    sectionLetter = "A";
  }

  // Short Code for sticky corner stamp (e.g. "NUR-A", "6-B", "11-A")
  let shortCode = ttItem.version;
  const numMatch = gradeName.match(/\d+/);
  if (numMatch) {
    shortCode = `${numMatch[0]}-${sectionLetter}`;
  } else if (gradeName.toLowerCase().includes("nursery")) {
    shortCode = `NUR-${sectionLetter}`;
  } else if (gradeName.toLowerCase().includes("lkg")) {
    shortCode = `LKG-${sectionLetter}`;
  } else if (gradeName.toLowerCase().includes("ukg")) {
    shortCode = `UKG-${sectionLetter}`;
  }

  // Wing Color Coding (Left 5px Spine, Badges, Icons)
  let spineBorder = "border-l-sky-500 dark:border-l-sky-400";
  let wingBadge = "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900";
  let iconClass = "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400";
  let cornerStampClass = "bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-100 border border-sky-300 dark:border-sky-700";

  if (wing.includes("Pre-Primary")) {
    spineBorder = "border-l-rose-500 dark:border-l-rose-400";
    wingBadge = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900";
    iconClass = "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400";
    cornerStampClass = "bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100 border border-rose-300 dark:border-rose-700";
  } else if (wing.includes("Primary")) {
    spineBorder = "border-l-amber-500 dark:border-l-amber-400";
    wingBadge = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900";
    iconClass = "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400";
    cornerStampClass = "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700";
  } else if (wing.includes("Middle")) {
    spineBorder = "border-l-sky-500 dark:border-l-sky-400";
    wingBadge = "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-900";
    iconClass = "bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400";
    cornerStampClass = "bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-100 border border-sky-300 dark:border-sky-700";
  } else if (wing.includes("Secondary") && !wing.includes("Senior")) {
    spineBorder = "border-l-indigo-500 dark:border-l-indigo-400";
    wingBadge = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900";
    iconClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400";
    cornerStampClass = "bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100 border border-indigo-300 dark:border-indigo-700";
  } else if (wing.includes("Senior")) {
    spineBorder = "border-l-emerald-500 dark:border-l-emerald-400";
    wingBadge = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900";
    iconClass = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400";
    cornerStampClass = "bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700";
  }

  // Section Pill: High-contrast distinct badges for A, B, C
  let sectionPillClass = "bg-emerald-600 text-white dark:bg-emerald-500";
  if (sectionLetter === "B") {
    sectionPillClass = "bg-blue-600 text-white dark:bg-blue-500";
  } else if (sectionLetter === "C") {
    sectionPillClass = "bg-amber-600 text-white dark:bg-amber-500";
  }

  return {
    gradeName,
    rawSec,
    sectionLetter,
    shortCode,
    spineBorder,
    wingBadge,
    iconClass,
    cornerStampClass,
    sectionPillClass,
  };
}

// ── Teacher Profiles & Faculty Directory ──
export interface TeacherProfile {
  id: string;
  name: string;
  primarySubject: string;
  department: string;
  classTeacherOf?: string;
  avatarColor: string;
  initials: string;
}

export const TEACHERS_LIST: TeacherProfile[] = [
  { id: "t-manish", name: "Manish Kumar", primarySubject: "English", department: "Languages & Humanities", classTeacherOf: "Class 10 - Section A", avatarColor: "bg-blue-600", initials: "MK" },
  { id: "t-ramanujan", name: "Dr. R. Ramanujan", primarySubject: "Mathematics", department: "Mathematics & Computing", classTeacherOf: "Class 12 - Section A", avatarColor: "bg-indigo-600", initials: "RR" },
  { id: "t-bhabha", name: "Dr. Homi Bhabha", primarySubject: "Science", department: "Natural Sciences", classTeacherOf: "Class 9 - Section A", avatarColor: "bg-emerald-600", initials: "HB" },
  { id: "t-raman", name: "Dr. C. V. Raman", primarySubject: "Physics", department: "Natural Sciences", classTeacherOf: "Class 11 - Section A", avatarColor: "bg-sky-600", initials: "CR" },
  { id: "t-kalam", name: "Dr. A. P. J. Kalam", primarySubject: "Chemistry", department: "Natural Sciences", avatarColor: "bg-teal-600", initials: "AK" },
  { id: "t-salim", name: "Dr. Salim Ali", primarySubject: "Biology", department: "Life Sciences", avatarColor: "bg-emerald-600", initials: "SA" },
  { id: "t-sunita", name: "Sunita Verma", primarySubject: "Social Studies", department: "Social Sciences", classTeacherOf: "Class 8 - Section A", avatarColor: "bg-purple-600", initials: "SV" },
  { id: "t-romila", name: "Mrs. Romila Thapar", primarySubject: "History", department: "Social Sciences", avatarColor: "bg-rose-600", initials: "RT" },
  { id: "t-amartya", name: "Dr. Amartya Sen", primarySubject: "Economics", department: "Commerce & Economics", classTeacherOf: "Class 12 - Section B", avatarColor: "bg-amber-600", initials: "AS" },
  { id: "t-jhunjhunwala", name: "Mr. R. Jhunjhunwala", primarySubject: "Accountancy", department: "Commerce & Economics", classTeacherOf: "Class 11 - Section B", avatarColor: "bg-cyan-600", initials: "RJ" },
  { id: "t-kiran", name: "Mrs. Kiran M. Shaw", primarySubject: "Business Studies", department: "Commerce & Economics", avatarColor: "bg-violet-600", initials: "KS" },
  { id: "t-rajesh", name: "Rajesh Tiwari", primarySubject: "Hindi", department: "Languages & Humanities", classTeacherOf: "Class 7 - Section A", avatarColor: "bg-amber-600", initials: "RT" },
  { id: "t-satya", name: "Satya N.", primarySubject: "Computer", department: "Computer Science", avatarColor: "bg-cyan-600", initials: "SN" },
  { id: "t-meera", name: "Mrs. Meera Kapoor", primarySubject: "EVS", department: "Primary Education", classTeacherOf: "Class 4 - Section A", avatarColor: "bg-emerald-600", initials: "MK" },
  { id: "t-ananya", name: "Mrs. Ananya Sen", primarySubject: "Rhymes & Play", department: "Early Childhood", classTeacherOf: "Nursery - Section A", avatarColor: "bg-pink-600", initials: "AS" },
  { id: "t-dhyan", name: "Major Dhyan", primarySubject: "Sports", department: "Physical Education", avatarColor: "bg-orange-600", initials: "MD" },
  { id: "t-amrita", name: "Amrita Sher-Gil", primarySubject: "Arts", department: "Creative Arts", avatarColor: "bg-pink-600", initials: "AS" },
  { id: "t-ravi", name: "Pt. Ravi Shankar", primarySubject: "Music", department: "Performing Arts", avatarColor: "bg-violet-600", initials: "RS" },
  { id: "t-pooja", name: "Pooja Roy", primarySubject: "Library", department: "Library & Research", avatarColor: "bg-slate-600", initials: "PR" },
  { id: "t-pillai", name: "K. S. Pillai", primarySubject: "Moral Science", department: "Value Education", avatarColor: "bg-teal-600", initials: "KP" },
];

export interface TeacherSlotAssignment {
  classId: string;
  className: string;
  shortCode: string;
  wing: string;
  sectionLetter: string;
  subject: string;
  sectionPillClass: string;
  isConflict?: boolean;
  conflictClasses?: string[];
}

// Dynamically inverts class schedules into a complete teacher timetable
export function computeTeacherWeekSchedule(
  teacherName: string,
  classSchedules: Record<string, Record<string, { subject: string; teacher: string }[]>>,
  classList: typeof MOCK_TIMETABLES_V2
): {
  schedule: Record<string, (TeacherSlotAssignment | "Free" | "Break")[]>;
  assignedCount: number;
  freeCount: number;
  totalAcademicSlots: number;
  classesTaught: string[];
} {
  const schedule: Record<string, (TeacherSlotAssignment | "Free" | "Break")[]> = {};
  let assignedCount = 0;
  let freeCount = 0;
  let totalAcademicSlots = 0;
  const classesSet = new Set<string>();

  const classMetaMap = new Map<string, { cls: (typeof classList)[0]; meta: ReturnType<typeof getClassVisualMeta> }>();
  classList.forEach((cls) => {
    classMetaMap.set(cls.id, { cls, meta: getClassVisualMeta(cls) });
  });

  DAYS.forEach((day) => {
    const dayAssignments: (TeacherSlotAssignment | "Free" | "Break")[] = [];
    for (let slotIdx = 0; slotIdx < 8; slotIdx++) {
      const matchingClasses: TeacherSlotAssignment[] = [];

      for (const cls of classList) {
        const slotData = classSchedules[cls.id]?.[day]?.[slotIdx];
        if (slotData && slotData.teacher && slotData.teacher.toLowerCase() === teacherName.toLowerCase()) {
          const item = classMetaMap.get(cls.id);
          matchingClasses.push({
            classId: cls.id,
            className: cls.name,
            shortCode: item?.meta.shortCode || cls.version,
            wing: cls.wing,
            sectionLetter: item?.meta.sectionLetter || "A",
            subject: slotData.subject,
            sectionPillClass: item?.meta.sectionPillClass || "bg-indigo-600 text-white",
          });
          classesSet.add(item?.meta.shortCode || cls.version);
        }
      }

      // Slot 4 is standard Lunch Break / Recess
      if (slotIdx === 4) {
        dayAssignments.push("Break");
      } else if (matchingClasses.length === 1) {
        dayAssignments.push(matchingClasses[0]);
        assignedCount++;
        totalAcademicSlots++;
      } else if (matchingClasses.length > 1) {
        // Teacher double-booked conflict
        dayAssignments.push({
          ...matchingClasses[0],
          isConflict: true,
          conflictClasses: matchingClasses.map((m) => m.shortCode),
        });
        assignedCount++;
        totalAcademicSlots++;
      } else {
        dayAssignments.push("Free");
        freeCount++;
        totalAcademicSlots++;
      }
    }
    schedule[day] = dayAssignments;
  });

  return {
    schedule,
    assignedCount,
    freeCount,
    totalAcademicSlots,
    classesTaught: Array.from(classesSet),
  };
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
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("tt-main");
  const [isTimetableDropdownOpen, setIsTimetableDropdownOpen] = useState(false);

  // Perspective Switcher: "classwise" | "teacherwise" | "free-teachers"
  const [perspective, setPerspective] = useState<"classwise" | "teacherwise" | "free-teachers">("classwise");
  const [isPerspectiveDropdownOpen, setIsPerspectiveDropdownOpen] = useState(false);

  // Edit Mode state (available exclusively in Class-wise mode)
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [savedClassSchedules, setSavedClassSchedules] = useState<
    Record<string, Record<string, { subject: string; teacher: string }[]>>
  >(CLASS_SCHEDULES);
  const [savedBellSchedules, setSavedBellSchedules] = useState<
    Record<string, BellSchedule>
  >(INITIAL_BELL_SCHEDULES);
  const [savedDayScheduleMap, setSavedDayScheduleMap] = useState<
    Record<string, string>
  >(INITIAL_DAY_SCHEDULE_MAP);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);

  // Free Teachers View Filter State (Day & Period)
  const [freeTeacherDay, setFreeTeacherDay] = useState<string>("Mon");
  const [freeTeacherSlot, setFreeTeacherSlot] = useState<number>(0);

  const [selectedWing, setSelectedWing] = useState<string>("all");
  const [isWingDropdownOpen, setIsWingDropdownOpen] = useState(false);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeFilterQuery, setActiveFilterQuery] = useState<string>("");
  const [highlightedClassId, setHighlightedClassId] = useState<string | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [modalTimetableId, setModalTimetableId] = useState(MOCK_CLASSES_LIST[0].id);

  // Bell Schedules & Day Mapping State
  const [bellSchedules, setBellSchedules] = useState<Record<string, BellSchedule>>(INITIAL_BELL_SCHEDULES);
  const [dayScheduleMap, setDayScheduleMap] = useState<Record<string, string>>(INITIAL_DAY_SCHEDULE_MAP);

  // Class Schedules state (Live CRUD matrix)
  const [classSchedules, setClassSchedules] = useState<
    Record<string, Record<string, { subject: string; teacher: string }[]>>
  >(CLASS_SCHEDULES);

  // Computes whether live schedules, bell timing, or day layouts differ from the pre-edit snapshot
  const hasUnsavedChanges = useMemo(() => {
    const schedDiff = JSON.stringify(classSchedules) !== JSON.stringify(savedClassSchedules);
    const bellDiff = JSON.stringify(bellSchedules) !== JSON.stringify(savedBellSchedules);
    const dayMapDiff = JSON.stringify(dayScheduleMap) !== JSON.stringify(savedDayScheduleMap);
    return schedDiff || bellDiff || dayMapDiff;
  }, [classSchedules, savedClassSchedules, bellSchedules, savedBellSchedules, dayScheduleMap, savedDayScheduleMap]);

  // Interactive CRUD Dialog States
  const [boundaryEdit, setBoundaryEdit] = useState<{
    scheduleId: string;
    periodIdx: number;
    isBoundary: boolean;
    currentTime: string;
    periodAName: string;
    periodBName: string;
    periodAStartM: number;
    periodBEndM: number;
  } | null>(null);
  const [boundaryInputTime, setBoundaryInputTime] = useState<string>("09:45");

  const [insertPeriodState, setInsertPeriodState] = useState<{
    scheduleId: string;
    insertAfterIdx: number;
    type: "regular" | "break";
    title: string;
    duration: number;
  } | null>(null);

  const [cellAssignment, setCellAssignment] = useState<{
    classId: string;
    day: string;
    slotIdx: number;
    periodLabel: string;
    periodTime: string;
    currentSubject: string;
    currentTeacher: string;
  } | null>(null);

  const [openDayMenu, setOpenDayMenu] = useState<{
    day: string;
    classId: string;
  } | null>(null);

  const [subjectSearch, setSubjectSearch] = useState<string>("");

  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return SUBJECT_CATALOG;
    const q = subjectSearch.toLowerCase();
    return SUBJECT_CATALOG.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.teacher && s.teacher.toLowerCase().includes(q)) ||
        (s.short && s.short.toLowerCase().includes(q))
    );
  }, [subjectSearch]);

  const [selectedCell, setSelectedCell] = useState<{ day: string; periodId: string } | null>(null);

  const selectedMasterTimetable =
    MASTER_TIMETABLES.find((tt) => tt.id === selectedTimetableId) || MASTER_TIMETABLES[0];

  // Set of wing names each teacher teaches in based on live classSchedules
  // (A teacher is mapped to a wing if they have at least one period assigned in any class of that wing)
  const teacherWingsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    // Initialize for all known teachers
    TEACHERS_LIST.forEach((t) => {
      map.set(t.name.toLowerCase(), new Set<string>());
    });

    MOCK_CLASSES_LIST.forEach((cls) => {
      const sched = classSchedules[cls.id];
      if (!sched) return;
      Object.values(sched).forEach((daySlots) => {
        daySlots.forEach((slot) => {
          if (
            slot &&
            slot.teacher &&
            slot.teacher !== "Unassigned" &&
            slot.teacher !== "Free" &&
            slot.teacher.trim() !== ""
          ) {
            const tKey = slot.teacher.toLowerCase();
            if (!map.has(tKey)) {
              map.set(tKey, new Set<string>());
            }
            map.get(tKey)!.add(cls.wing);
          }
        });
      });
    });

    return map;
  }, [classSchedules]);

  // Dynamic wing options that compute correct counts for classwise (classes) vs teacherwise (faculty)
  const currentWingOptions = useMemo(() => {
    if (perspective === "teacherwise") {
      return WING_OPTIONS.map((w) => {
        if (w.id === "all") {
          return {
            ...w,
            count: TEACHERS_LIST.length,
            description: `All Faculty (${TEACHERS_LIST.length} Teachers)`,
          };
        }
        const teacherCount = TEACHERS_LIST.filter((t) => {
          const wings = teacherWingsMap.get(t.name.toLowerCase());
          return wings && wings.has(w.id);
        }).length;
        return {
          ...w,
          count: teacherCount,
          description: `${teacherCount} Teachers with periods in ${w.label}`,
        };
      });
    }
    return WING_OPTIONS;
  }, [perspective, teacherWingsMap]);

  const selectedWingOption =
    currentWingOptions.find((w) => w.id === selectedWing) || currentWingOptions[0];

  const selectedTimetable = selectedMasterTimetable;

  const activeModalTimetable =
    MOCK_CLASSES_LIST.find((tt) => tt.id === modalTimetableId) || MOCK_CLASSES_LIST[0];
  const activeModalStatus =
    computeSectionStatus(classSchedules[modalTimetableId], SUBJECT_CATALOG);

  // Keyboard shortcut Cmd+K or Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search Results: Classes & Sections
  const matchingClasses = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return MOCK_CLASSES_LIST.filter(
      (tt) =>
        tt.name.toLowerCase().includes(q) ||
        tt.version.toLowerCase().includes(q) ||
        tt.wing.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Search Results: Teachers (aggregated from schedules & catalog)
  const matchingTeachers = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const teacherMap = new Map<
      string,
      { teacher: string; subjects: Set<string>; classNames: Set<string>; classIds: Set<string>; wing: string }
    >();

    MOCK_CLASSES_LIST.forEach((cls) => {
      const sched = classSchedules[cls.id] || {};
      Object.values(sched).forEach((slots) => {
        slots.forEach((slot) => {
          if (
            slot.teacher &&
            slot.teacher !== "Unassigned" &&
            (slot.teacher.toLowerCase().includes(q) || slot.subject.toLowerCase().includes(q))
          ) {
            if (!teacherMap.has(slot.teacher)) {
              teacherMap.set(slot.teacher, {
                teacher: slot.teacher,
                subjects: new Set(),
                classNames: new Set(),
                classIds: new Set(),
                wing: cls.wing,
              });
            }
            const record = teacherMap.get(slot.teacher)!;
            record.subjects.add(slot.subject);
            record.classNames.add(cls.version || cls.name.split("—")[0].trim());
            record.classIds.add(cls.id);
          }
        });
      });
    });

    SUBJECT_CATALOG.forEach((s) => {
      if (s.teacher && (s.teacher.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))) {
        if (!teacherMap.has(s.teacher)) {
          teacherMap.set(s.teacher, {
            teacher: s.teacher,
            subjects: new Set([s.name]),
            classNames: new Set(),
            classIds: new Set(),
            wing: "Faculty",
          });
        }
      }
    });

    return Array.from(teacherMap.values()).map((t) => ({
      teacher: t.teacher,
      subjects: Array.from(t.subjects),
      classNames: Array.from(t.classNames),
      classIds: Array.from(t.classIds),
      wing: t.wing,
    }));
  }, [searchQuery, classSchedules]);

  // Filtered classes rendered on the screen: Wing + Search Filter
  const timetablesToRender = useMemo(() => {
    return MOCK_CLASSES_LIST.filter((tt) => {
      // 1. Wing Filter
      if (selectedWing !== "all" && tt.wing !== selectedWing) {
        return false;
      }
      // 2. Search Filter (if user applied a filter search query)
      if (activeFilterQuery.trim()) {
        const q = activeFilterQuery.toLowerCase();
        const matchesClass =
          tt.name.toLowerCase().includes(q) ||
          tt.version.toLowerCase().includes(q) ||
          tt.wing.toLowerCase().includes(q);
        if (matchesClass) return true;

        const sched = classSchedules[tt.id] || {};
        const matchesTeacher = Object.values(sched).some((slots) =>
          slots.some(
            (slot) =>
              slot.teacher.toLowerCase().includes(q) ||
              slot.subject.toLowerCase().includes(q)
          )
        );
        return matchesTeacher;
      }
      return true;
    });
  }, [selectedWing, activeFilterQuery, classSchedules]);

  // Comma-separated search token breakdown for multi-token pinned stacking
  const searchTokens = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchQuery
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }, [searchQuery]);

  // Teachers matched by any search token (for Class-wise and Teacher-wise pinned top)
  const matchedTeachersFromSearch = useMemo(() => {
    if (searchTokens.length === 0) return [];
    return TEACHERS_LIST.filter((teacher) => {
      if (selectedWing !== "all") {
        const wings = teacherWingsMap.get(teacher.name.toLowerCase());
        if (!wings || !wings.has(selectedWing)) return false;
      }
      return searchTokens.some((token) => {
        const nameMatch = teacher.name.toLowerCase().includes(token);
        const subjMatch = teacher.primarySubject.toLowerCase().includes(token);
        const deptMatch = teacher.department.toLowerCase().includes(token);
        return nameMatch || subjMatch || deptMatch;
      });
    });
  }, [searchTokens, selectedWing, teacherWingsMap]);

  // Classes matched by any search token (for Class-wise pinned stacking)
  const matchedClassesFromSearch = useMemo(() => {
    if (searchTokens.length === 0) return [];
    return MOCK_CLASSES_LIST.filter((cls) => {
      if (selectedWing !== "all" && cls.wing !== selectedWing) return false;
      return searchTokens.some((token) => {
        const nameMatch = cls.name.toLowerCase().includes(token);
        const verMatch = cls.version.toLowerCase().includes(token);
        const wingMatch = cls.wing.toLowerCase().includes(token);
        const idMatch = cls.id.toLowerCase().includes(token);
        const cleanToken = token.replace(/[^a-z0-9]/g, "");
        const cleanName = cls.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanVer = cls.version.toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          nameMatch ||
          verMatch ||
          wingMatch ||
          idMatch ||
          (cleanToken.length > 0 && (cleanName.includes(cleanToken) || cleanVer.includes(cleanToken)))
        );
      });
    });
  }, [searchTokens, selectedWing]);

  // Remaining classes in chronological order (excluding pinned matches)
  const remainingClassesToRender = useMemo(() => {
    const matchedClassIds = new Set(matchedClassesFromSearch.map((c) => c.id));
    return MOCK_CLASSES_LIST.filter((cls) => {
      if (selectedWing !== "all" && cls.wing !== selectedWing) return false;
      if (searchTokens.length > 0 && matchedClassIds.has(cls.id)) return false;
      return true;
    });
  }, [selectedWing, matchedClassesFromSearch, searchTokens]);

  // Teacher-wise partitioned lists (pinned vs remaining)
  // Even if a teacher has one single period in the selected wing, they are included!
  const teacherWiseData = useMemo(() => {
    const wingFilteredTeachers = TEACHERS_LIST.filter((teacher) => {
      if (selectedWing === "all") return true;
      const wings = teacherWingsMap.get(teacher.name.toLowerCase());
      return wings && wings.has(selectedWing);
    });

    if (searchTokens.length === 0) {
      return { pinned: [], remaining: wingFilteredTeachers };
    }
    const pinned: TeacherProfile[] = [];
    const remaining: TeacherProfile[] = [];
    wingFilteredTeachers.forEach((teacher) => {
      const isMatch = searchTokens.some((token) => {
        return (
          teacher.name.toLowerCase().includes(token) ||
          teacher.primarySubject.toLowerCase().includes(token) ||
          teacher.department.toLowerCase().includes(token)
        );
      });
      if (isMatch) {
        pinned.push(teacher);
      } else {
        remaining.push(teacher);
      }
    });
    return { pinned, remaining };
  }, [searchTokens, selectedWing, teacherWingsMap]);

  const handleJumpToClass = (classId: string, wing: string) => {
    if (selectedWing !== "all" && selectedWing !== wing) {
      setSelectedWing("all");
    }
    setActiveFilterQuery("");
    setIsSearchModalOpen(false);
    setSearchQuery("");
    setTimeout(() => {
      const el = document.getElementById(`table-${classId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedClassId(classId);
        setTimeout(() => setHighlightedClassId(null), 3000);
      }
    }, 150);
  };

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

  // ── 1. Boundary Adjustment Handler (Collapse Adjacent Period, Min 1 Min Guard) ──
  const handleSaveBoundary = (
    scheduleId: string,
    periodIdx: number,
    newTimeStr: string,
    isBoundary: boolean
  ) => {
    if (!isEditMode) return;
    setBellSchedules((prev) => {
      const schedule = prev[scheduleId];
      if (!schedule) return prev;
      const updatedPeriods = [...schedule.periods];
      const newM = timeToMinutes(newTimeStr);
      if (newM === null) return prev;

      const formatted = minutesToTime(newM);

      if (isBoundary) {
        // Boundary between periodIdx and periodIdx + 1
        updatedPeriods[periodIdx] = {
          ...updatedPeriods[periodIdx],
          endTime: formatted,
        };
        updatedPeriods[periodIdx + 1] = {
          ...updatedPeriods[periodIdx + 1],
          startTime: formatted,
        };
      } else if (periodIdx === 0) {
        // Morning bell in-time
        updatedPeriods[0] = {
          ...updatedPeriods[0],
          startTime: formatted,
        };
      } else {
        // Dismissal out-time
        updatedPeriods[periodIdx] = {
          ...updatedPeriods[periodIdx],
          endTime: formatted,
        };
      }

      return {
        ...prev,
        [scheduleId]: {
          ...schedule,
          periods: updatedPeriods,
        },
      };
    });
    setBoundaryEdit(null);
  };

  // ── 2. Insert Period Between Two Periods Handler ──
  const handleConfirmInsertPeriod = (
    scheduleId: string,
    insertAfterIdx: number,
    type: "regular" | "break",
    title: string,
    duration: number
  ) => {
    if (!isEditMode) return;
    setBellSchedules((prev) => {
      const schedule = prev[scheduleId];
      if (!schedule) return prev;
      const oldPeriods = schedule.periods;

      let newStartM = 540;
      if (insertAfterIdx >= 0 && insertAfterIdx < oldPeriods.length) {
        const prevEndM = timeToMinutes(oldPeriods[insertAfterIdx].endTime);
        if (prevEndM !== null) newStartM = prevEndM;
      } else if (oldPeriods.length > 0) {
        const firstStartM = timeToMinutes(oldPeriods[0].startTime);
        if (firstStartM !== null) newStartM = firstStartM;
      }
      const newEndM = newStartM + duration;

      const newPeriod: PeriodItem = {
        id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        startTime: minutesToTime(newStartM),
        endTime: minutesToTime(newEndM),
        type,
        title: title.trim() ? title.trim() : (type === "break" ? "Break" : undefined),
      };

      const newPeriods: PeriodItem[] = [];
      for (let i = 0; i < oldPeriods.length; i++) {
        if (i <= insertAfterIdx) {
          newPeriods.push(oldPeriods[i]);
        }
        if (i === insertAfterIdx) {
          newPeriods.push(newPeriod);
        }
        if (i > insertAfterIdx) {
          const curStartM = timeToMinutes(oldPeriods[i].startTime) || 0;
          const curEndM = timeToMinutes(oldPeriods[i].endTime) || 0;
          newPeriods.push({
            ...oldPeriods[i],
            startTime: minutesToTime(curStartM + duration),
            endTime: minutesToTime(curEndM + duration),
          });
        }
      }
      if (insertAfterIdx === -1) {
        newPeriods.unshift(newPeriod);
        for (let i = 1; i < newPeriods.length; i++) {
          const curStartM = timeToMinutes(newPeriods[i].startTime) || 0;
          const curEndM = timeToMinutes(newPeriods[i].endTime) || 0;
          newPeriods[i] = {
            ...newPeriods[i],
            startTime: minutesToTime(curStartM + duration),
            endTime: minutesToTime(curEndM + duration),
          };
        }
      }

      return {
        ...prev,
        [scheduleId]: {
          ...schedule,
          periods: newPeriods,
        },
      };
    });

    // Expand classSchedules for affected days
    setClassSchedules((prev) => {
      const updated = { ...prev };
      const affectedDays = Object.keys(dayScheduleMap).filter(
        (d) => (dayScheduleMap[d] || "standard") === scheduleId
      );

      Object.keys(updated).forEach((classId) => {
        const classData = { ...updated[classId] };
        affectedDays.forEach((day) => {
          const slots = [...(classData[day] || [])];
          const newSlot =
            type === "break"
              ? { subject: title || "Break", teacher: "" }
              : { subject: "Unassigned", teacher: "Unassigned" };
          slots.splice(insertAfterIdx + 1, 0, newSlot);
          classData[day] = slots;
        });
        updated[classId] = classData;
      });

      return updated;
    });

    setInsertPeriodState(null);
  };

  // ── 3. Delete Period Handler ──
  const handleDeletePeriod = (scheduleId: string, periodIdx: number) => {
    if (!isEditMode) return;
    setBellSchedules((prev) => {
      const schedule = prev[scheduleId];
      if (!schedule || schedule.periods.length <= 1) return prev;
      const oldPeriods = schedule.periods;
      const deleted = oldPeriods[periodIdx];
      const durM = getDurationMinutes(deleted.startTime, deleted.endTime) || 45;

      const remaining = oldPeriods.filter((_, idx) => idx !== periodIdx);

      for (let i = periodIdx; i < remaining.length; i++) {
        const curStartM = timeToMinutes(remaining[i].startTime) || 0;
        const curEndM = timeToMinutes(remaining[i].endTime) || 0;
        remaining[i] = {
          ...remaining[i],
          startTime: minutesToTime(Math.max(0, curStartM - durM)),
          endTime: minutesToTime(Math.max(1, curEndM - durM)),
        };
      }

      return {
        ...prev,
        [scheduleId]: {
          ...schedule,
          periods: remaining,
        },
      };
    });

    setClassSchedules((prev) => {
      const updated = { ...prev };
      const affectedDays = Object.keys(dayScheduleMap).filter(
        (d) => (dayScheduleMap[d] || "standard") === scheduleId
      );

      Object.keys(updated).forEach((classId) => {
        const classData = { ...updated[classId] };
        affectedDays.forEach((day) => {
          const slots = [...(classData[day] || [])];
          if (periodIdx < slots.length) {
            slots.splice(periodIdx, 1);
            classData[day] = slots;
          }
        });
        updated[classId] = classData;
      });

      return updated;
    });
  };

  // ── 4. Day Bell Schedule Customization Handlers ──
  const handleMakeDayUnique = (day: string) => {
    if (!isEditMode) return;
    const currentScheduleId = dayScheduleMap[day] || "standard";
    const baseSchedule = bellSchedules[currentScheduleId] || bellSchedules["standard"];
    const newScheduleId = `${day.toLowerCase()}-custom-${Date.now()}`;

    const clonedSchedule: BellSchedule = {
      id: newScheduleId,
      name: `${day} Unique Bell Schedule`,
      periods: JSON.parse(JSON.stringify(baseSchedule.periods)),
      isCustom: true,
    };

    setBellSchedules((prev) => ({
      ...prev,
      [newScheduleId]: clonedSchedule,
    }));

    setDayScheduleMap((prev) => ({
      ...prev,
      [day]: newScheduleId,
    }));

    setOpenDayMenu(null);
  };

  const handleRevertDayToStandard = (day: string) => {
    if (!isEditMode) return;
    setDayScheduleMap((prev) => ({
      ...prev,
      [day]: "standard",
    }));
    setOpenDayMenu(null);
  };

  // ── 5. Assign Subject + Resolved Teacher to Cell ──
  const handleAssignCell = (
    classId: string,
    day: string,
    slotIdx: number,
    subjectName: string,
    teacherName: string
  ) => {
    if (!isEditMode) return;
    setClassSchedules((prev) => {
      const classData = { ...(prev[classId] || {}) };
      const daySlots = [...(classData[day] || [])];
      daySlots[slotIdx] = { subject: subjectName, teacher: teacherName };
      classData[day] = daySlots;
      return { ...prev, [classId]: classData };
    });
    setCellAssignment(null);
  };

  const handleClearCell = (classId: string, day: string, slotIdx: number) => {
    if (!isEditMode) return;
    setClassSchedules((prev) => {
      const classData = { ...(prev[classId] || {}) };
      const daySlots = [...(classData[day] || [])];
      daySlots[slotIdx] = { subject: "Unassigned", teacher: "Unassigned" };
      classData[day] = daySlots;
      return { ...prev, [classId]: classData };
    });
    setCellAssignment(null);
  };

  // Boundary adjustment calculations & 1-minute minimum collapse guard
  const getBoundaryDetails = () => {
    if (!boundaryEdit) return null;
    const newM = timeToMinutes(boundaryInputTime);
    const isValidTime = newM !== null;

    if (!boundaryEdit.isBoundary) {
      if (boundaryEdit.periodIdx === 0) {
        const dur = isValidTime ? boundaryEdit.periodBEndM - newM : 0;
        const isValid = isValidTime && dur >= 1;
        return {
          isValid,
          error: !isValidTime
            ? "Invalid time format (e.g. 09:00)."
            : dur < 1
              ? "Period duration cannot collapse below 1 minute."
              : null,
          durationA: dur,
          durationB: 0,
          minTimeStr: "00:00",
          maxTimeStr: minutesToTime(boundaryEdit.periodBEndM - 1),
        };
      } else {
        const dur = isValidTime ? newM - boundaryEdit.periodAStartM : 0;
        const isValid = isValidTime && dur >= 1;
        return {
          isValid,
          error: !isValidTime
            ? "Invalid time format (e.g. 15:30)."
            : dur < 1
              ? "Period duration cannot collapse below 1 minute."
              : null,
          durationA: dur,
          durationB: 0,
          minTimeStr: minutesToTime(boundaryEdit.periodAStartM + 1),
          maxTimeStr: "23:59",
        };
      }
    }

    const durA = isValidTime ? newM - boundaryEdit.periodAStartM : 0;
    const durB = isValidTime ? boundaryEdit.periodBEndM - newM : 0;
    const isValid = isValidTime && durA >= 1 && durB >= 1;
    let error: string | null = null;
    if (!isValidTime) {
      error = "Invalid time format (e.g. 09:45).";
    } else if (durA < 1) {
      error = `${boundaryEdit.periodAName || "Previous period"} cannot collapse below 1 minute.`;
    } else if (durB < 1) {
      error = `${boundaryEdit.periodBName || "Next period"} cannot collapse below 1 minute.`;
    }

    return {
      isValid,
      error,
      durationA: durA,
      durationB: durB,
      minTimeStr: minutesToTime(boundaryEdit.periodAStartM + 1),
      maxTimeStr: minutesToTime(boundaryEdit.periodBEndM - 1),
    };
  };

  const nudgeBoundary = (deltaMinutes: number) => {
    if (!boundaryEdit) return;
    const curM = timeToMinutes(boundaryInputTime);
    if (curM === null) return;
    const targetM = curM + deltaMinutes;

    if (boundaryEdit.isBoundary) {
      const minM = boundaryEdit.periodAStartM + 1;
      const maxM = boundaryEdit.periodBEndM - 1;
      const clamped = Math.max(minM, Math.min(maxM, targetM));
      setBoundaryInputTime(minutesToTime(clamped));
    } else if (boundaryEdit.periodIdx === 0) {
      const maxM = boundaryEdit.periodBEndM - 1;
      const clamped = Math.min(maxM, Math.max(0, targetM));
      setBoundaryInputTime(minutesToTime(clamped));
    } else {
      const minM = boundaryEdit.periodAStartM + 1;
      const clamped = Math.max(minM, targetM);
      setBoundaryInputTime(minutesToTime(clamped));
    }
  };

  // ── Timing Header Row (Smart Auto-Sequencing, Boundary Click, Hover Insert) ──
  const renderTimingHeaderRow = (
    keyPrefix: string,
    schedule: BellSchedule,
    isCustomOrSat: boolean,
    groupDays: string[],
    visualMeta?: ReturnType<typeof getClassVisualMeta>
  ) => {
    const zm = getZoomMetrics(zoom);
    const displayPeriods = computePeriodDisplayItems(schedule.periods);
    const template = `${zm.dayColWidth} repeat(${schedule.periods.length}, minmax(105px, 1fr))`;

    return (
      <div
        className={`grid items-stretch border-b-2 sticky top-0 z-20 ${isCustomOrSat
            ? "border-amber-400 dark:border-amber-700 bg-amber-100 dark:bg-amber-950"
            : "border-slate-400/90 dark:border-slate-600 bg-slate-100 dark:bg-slate-800"
          }`}
        style={{ gridTemplateColumns: template }}
      >
        {/* Left Corner Cell: Day Group Range + Class Code Stamp + Append Period */}
        <div
          className={`${zm.timingH} sticky left-0 z-30 border-r-2 select-none flex items-center justify-between px-1 gap-1 ${isCustomOrSat
              ? "bg-amber-200 dark:bg-amber-900 border-amber-400 dark:border-amber-700 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)] text-amber-900 dark:text-amber-100"
              : "bg-slate-200 dark:bg-slate-700 border-slate-400/90 dark:border-slate-600 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)] text-slate-800 dark:text-slate-100"
            }`}
          title={`${visualMeta ? `${visualMeta.gradeName} - ${visualMeta.rawSec} | ` : ""}${schedule.name} applies to: ${groupDays.join(", ")}`}
        >
          <div className="flex items-center gap-0.5 min-w-0 overflow-hidden">
            {visualMeta && (
              <span
                className={`px-1 py-0 rounded text-[7.5px] font-black font-mono tracking-tight shrink-0 shadow-2xs ${visualMeta.cornerStampClass}`}
              >
                {visualMeta.shortCode}
              </span>
            )}
            <span className="text-[8px] font-mono font-bold truncate opacity-85">
              {groupDays.length === 1 ? groupDays[0] : `${groupDays[0]}–${groupDays[groupDays.length - 1]}`}
            </span>
          </div>
          {isEditMode && (
            <button
              type="button"
              onClick={() => {
                setInsertPeriodState({
                  scheduleId: schedule.id,
                  insertAfterIdx: schedule.periods.length - 1,
                  type: "regular",
                  title: "",
                  duration: 40,
                });
              }}
              className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white shrink-0"
              title="Append a new period to this schedule"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Period Columns */}
        {displayPeriods.map((period, idx) => {
          const durMins =
            getDurationMinutes(period.startTime, period.endTime) || 45;
          const durStr = formatDuration(durMins);
          const isBreak = period.type === "break";

          return (
            <div
              key={`timing-${keyPrefix}-${period.id}`}
              className={`${zm.timingH} relative flex items-center justify-center select-none group/col ${idx < schedule.periods.length - 1
                  ? isCustomOrSat
                    ? "border-r border-amber-300 dark:border-amber-800"
                    : "border-r border-slate-400/80 dark:border-slate-600"
                  : ""
                }`}
            >
              {/* Boundary 0: Morning In-Time */}
              {idx === 0 && (
                <button
                  type="button"
                  disabled={!isEditMode}
                  onClick={() => {
                    if (!isEditMode) return;
                    const startM = timeToMinutes(period.startTime) || 540;
                    const endM = timeToMinutes(period.endTime) || 585;
                    setBoundaryInputTime(period.startTime);
                    setBoundaryEdit({
                      scheduleId: schedule.id,
                      periodIdx: 0,
                      isBoundary: false,
                      currentTime: period.startTime,
                      periodAName: period.label,
                      periodBName: "",
                      periodAStartM: startM,
                      periodBEndM: endM,
                    });
                  }}
                  title={
                    isEditMode
                      ? `School Start In-Time: ${period.startTime} (Click to edit)`
                      : `School Start In-Time: ${period.startTime} (Locked in view mode)`
                  }
                  className={`absolute left-1.5 top-1/2 -translate-y-1/2 z-20 font-mono whitespace-nowrap rounded shadow-2xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400 dark:border-slate-600 font-bold ${
                    isEditMode
                      ? "hover:border-emerald-500 hover:text-emerald-600 cursor-pointer"
                      : "cursor-default"
                  } transition-colors ${zm.badgeFont}`}
                >
                  {formatCalendarLineTime(period.startTime)}
                </button>
              )}

              {/* Center Period Label with Smart Sequence (P1, P2, Lunch Break, P3...) */}
              <div
                title={`${isBreak ? "Break / Recess" : `Period ${period.label}`}: ${period.startTime} – ${period.endTime} (${durStr})`}
                className={`flex items-center justify-center gap-1 leading-none select-none px-1 ${
                  idx === 0 ? "pl-8 sm:pl-9" : ""
                } ${
                  idx === schedule.periods.length - 1 ? "pr-8 sm:pr-9" : ""
                }`}
              >
                {isBreak && <Coffee className="w-2.5 h-2.5 text-amber-500 shrink-0" />}
                <span
                  className={`${zm.pLabelFont} font-bold tracking-tight font-sans ${isBreak
                      ? "text-amber-700 dark:text-amber-300 uppercase text-[9px] font-extrabold"
                      : isCustomOrSat
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-slate-700 dark:text-slate-200"
                    }`}
                >
                  {period.label}
                </span>
                <span
                  className={`text-[8px] ${isCustomOrSat
                      ? "text-amber-400 dark:text-amber-500"
                      : "text-slate-300 dark:text-slate-600"
                    }`}
                >
                  ·
                </span>
                <span
                  className={`${zm.durFont} font-mono tabular-nums font-medium ${isCustomOrSat
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-400 dark:text-slate-400"
                    }`}
                >
                  {durStr}
                </span>

                {isEditMode && schedule.periods.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePeriod(schedule.id, idx);
                    }}
                    className="opacity-0 group-hover/col:opacity-100 ml-0.5 p-0.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 cursor-pointer transition-opacity"
                    title={`Delete ${period.label}`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>

              {/* Boundary idx + 1: Intermediate boundary or Dismissal */}
              {idx === schedule.periods.length - 1 ? (
                /* Dismissal Bell */
                <button
                  type="button"
                  disabled={!isEditMode}
                  onClick={() => {
                    if (!isEditMode) return;
                    const startM = timeToMinutes(period.startTime) || 540;
                    const endM = timeToMinutes(period.endTime) || 900;
                    setBoundaryInputTime(period.endTime);
                    setBoundaryEdit({
                      scheduleId: schedule.id,
                      periodIdx: idx,
                      isBoundary: false,
                      currentTime: period.endTime,
                      periodAName: period.label,
                      periodBName: "",
                      periodAStartM: startM,
                      periodBEndM: endM,
                    });
                  }}
                  title={
                    isEditMode
                      ? `School Dismissal Out-Time: ${period.endTime} (Click to edit)`
                      : `School Dismissal Out-Time: ${period.endTime} (Locked in view mode)`
                  }
                  className={`absolute right-1.5 top-1/2 -translate-y-1/2 z-20 font-mono whitespace-nowrap rounded shadow-2xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400 dark:border-slate-600 font-bold ${
                    isEditMode
                      ? "hover:border-emerald-500 hover:text-emerald-600 cursor-pointer"
                      : "cursor-default"
                  } transition-colors ${zm.badgeFont}`}
                >
                  {formatCalendarLineTime(period.endTime)}
                </button>
              ) : (
                /* Intermediate Boundary between period idx and idx + 1 */
                <>
                  <button
                    type="button"
                    disabled={!isEditMode}
                    onClick={() => {
                      if (!isEditMode) return;
                      const nextPeriod = schedule.periods[idx + 1];
                      const curStartM = timeToMinutes(period.startTime) || 540;
                      const nextEndM = timeToMinutes(nextPeriod.endTime) || 630;
                      setBoundaryInputTime(period.endTime);
                      setBoundaryEdit({
                        scheduleId: schedule.id,
                        periodIdx: idx,
                        isBoundary: true,
                        currentTime: period.endTime,
                        periodAName: period.label,
                        periodBName: displayPeriods[idx + 1].label,
                        periodAStartM: curStartM,
                        periodBEndM: nextEndM,
                      });
                    }}
                    title={
                      isEditMode
                        ? `Boundary: ${period.endTime} (Click to adjust boundary)`
                        : `Boundary: ${period.endTime} (Locked in view mode)`
                    }
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 font-mono whitespace-nowrap rounded shadow-2xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400 dark:border-slate-600 font-bold ${
                      isEditMode
                        ? "hover:border-emerald-500 hover:text-emerald-600 cursor-pointer"
                        : "cursor-default"
                    } transition-colors ${zm.badgeFont}`}
                  >
                    {formatCalendarLineTime(period.endTime)}
                  </button>

                  {/* Hover "+" button on column divider to insert period */}
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setInsertPeriodState({
                          scheduleId: schedule.id,
                          insertAfterIdx: idx,
                          type: "regular",
                          title: "",
                          duration: 40,
                        });
                      }}
                      title={`Insert period between ${period.label} and ${displayPeriods[idx + 1].label}`}
                      className="absolute right-0 top-full -translate-y-1/2 translate-x-1/2 z-30 opacity-0 group-hover/col:opacity-100 w-4 h-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md transition-all scale-90 hover:scale-110 cursor-pointer"
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── Render Class Timetable Card (with Live Status Ticker & Day Groups) ──
  const renderTimetableCard = (ttItem: (typeof MOCK_TIMETABLES_V2)[0], ttIdx: number, isPinned?: boolean) => {
    const zm = getZoomMetrics(zoom);
    const rowH = zm.rowH;
    const dayColWidth = zm.dayColWidth;
    const dayFont = zm.dayFont;
    const subjectFont = zm.subjectFont;
    const visualMeta = getClassVisualMeta(ttItem);

    // Derived live status ticker for this class!
    const curStatus = computeSectionStatus(classSchedules[ttItem.id], SUBJECT_CATALOG);
    const dayGroups = getDayScheduleGroups(DAYS, dayScheduleMap, bellSchedules);

    return (
      <div
        key={ttItem.id}
        id={`table-${ttItem.id}`}
        className="flex flex-col min-w-0 scroll-mt-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        {/* Docked Ribbon Header (Directly inside table card frame as top cap) */}
        <div className="bg-slate-100/95 dark:bg-slate-800/95 border-b border-slate-300 dark:border-slate-700 px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between flex-wrap gap-2">
          {/* Left: Class Section & Flat Borderless Status Ticker (Live Spontaneous Updates) */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`rounded-lg flex items-center justify-center shrink-0 ${visualMeta.iconClass} ${zm.badgeContainerH}`}>
                <GraduationCap className={zm.badgeIcon} />
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white shrink-0 text-xs sm:text-sm tracking-tight">
                {visualMeta.gradeName}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-black tracking-wide shadow-2xs uppercase ${visualMeta.sectionPillClass}`}>
                {visualMeta.rawSec}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${visualMeta.wingBadge}`}>
                {ttItem.wing}
              </span>
              {isPinned && (
                <span className="text-[10px] font-mono px-2 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                  📌 Pinned Class
                </span>
              )}
            </div>

            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 shrink-0 hidden sm:block" />

            {/* Flat Borderless Status Ticker */}
            <div className={`flex items-center gap-2 font-sans flex-wrap ${zm.tickerFont}`}>
              {curStatus.subjects.slice(0, zm.maxSubjects).map((sub) => (
                <React.Fragment key={sub.name}>
                  <span
                    className="inline-flex items-center gap-1 select-none hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-default"
                    title={`${sub.name}: ${sub.count} periods assigned / week (${sub.teacher || "Faculty"})`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${sub.dot} shrink-0`} />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      {sub.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      :{sub.count}
                    </span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-700 select-none">·</span>
                </React.Fragment>
              ))}

              {/* Unassigned Indicator */}
              <span
                className="inline-flex items-center gap-1 select-none text-amber-600 dark:text-amber-400 font-medium hover:text-amber-700 transition-colors cursor-default"
                title={`${curStatus.unassigned} periods currently unassigned in timetable`}
              >
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <span>Unassigned</span>
                <span className="font-bold tabular-nums">:{curStatus.unassigned}</span>
              </span>

              <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

              {/* Total Equation Button */}
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

        {/* Grid Canvas with Day Schedule Groups directly below docked ribbon */}
        <div className="overflow-x-auto">
          <div className="min-w-[max(840px,100%)] w-full flex flex-col">
            {dayGroups.map((group, groupIdx) => {
              const isGroupSatOrCustom = group.scheduleId === "saturday" || group.schedule.isCustom;
              const displayPeriods = computePeriodDisplayItems(group.schedule.periods);
              const template = `${dayColWidth} repeat(${group.schedule.periods.length}, minmax(105px, 1fr))`;

              return (
                <div key={`group-${ttItem.id}-${group.scheduleId}-${groupIdx}`} className="flex flex-col">
                  {/* Timing Header Row for this Day Group */}
                  {renderTimingHeaderRow(
                    `${ttItem.id}-${group.scheduleId}-${groupIdx}`,
                    group.schedule,
                    !!isGroupSatOrCustom,
                    group.days,
                    visualMeta
                  )}

                  {/* Day Rows belonging to this Schedule Group */}
                  {group.days.map((day) => {
                    const isCustomDay = (dayScheduleMap[day] || "standard") !== "standard";
                    const isSat = day === "Sat";

                    return (
                      <div
                        key={`${ttItem.id}-${day}`}
                        className="grid items-stretch border-b border-slate-400/80 dark:border-slate-600 last:border-b-0"
                        style={{ gridTemplateColumns: template }}
                      >
                        {/* Sticky Left Day Cell with Bell Timing Customize Button */}
                        <div
                          className={`sticky left-0 z-20 px-1 py-0.5 text-center font-bold ${dayFont} border-r-2 flex items-center justify-between select-none uppercase tracking-wider font-mono ${isSat
                              ? "bg-amber-200 dark:bg-amber-950 border-slate-400/90 dark:border-slate-600 text-amber-800 dark:text-amber-300 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]"
                              : isCustomDay
                                ? "bg-emerald-100 dark:bg-emerald-950/80 border-slate-400/90 dark:border-slate-600 text-emerald-800 dark:text-emerald-300 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]"
                                : "bg-slate-200 dark:bg-slate-800 border-slate-400/90 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]"
                            }`}
                        >
                          <span className="truncate pl-0.5">{day}</span>
                          {isEditMode && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDayMenu({ day, classId: ttItem.id });
                              }}
                              className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                              title={`Configure bell timing for ${day}`}
                            >
                              <Clock className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        {/* Period Cells */}
                        {group.schedule.periods.map((period, slotIdx) => {
                          const cellKey = `${ttItem.id}-${day}-${period.id}`;
                          const isBreak = period.type === "break";
                          const isSelected =
                            selectedCell?.day === day && selectedCell?.periodId === cellKey;
                          const classSchedule = classSchedules[ttItem.id] || {};
                          const assignment =
                            classSchedule[day]?.[slotIdx] || { subject: "Unassigned", teacher: "Unassigned" };
                          const isUnassigned =
                            !assignment.subject ||
                            assignment.subject === "Unassigned" ||
                            assignment.subject === "Free";
                          const shortSubject = getShortSubject(assignment.subject);

                          if (isBreak) {
                            return (
                              <div
                                key={cellKey}
                                className={`${rowH} px-1.5 flex items-center justify-center select-none bg-amber-50/40 dark:bg-amber-950/20 text-amber-600/80 dark:text-amber-400/70 border-r border-amber-200/60 dark:border-amber-900/40 text-[10px] font-mono font-medium`}
                                title={`${period.title || "Break"} (${period.startTime} - ${period.endTime})`}
                              >
                                <span className="truncate">{period.title || "Break"}</span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={cellKey}
                              onClick={() => {
                                if (!isEditMode) return; // Editing locked unless Edit Mode is active
                                setSelectedCell(isSelected ? null : { day, periodId: cellKey });
                                setCellAssignment({
                                  classId: ttItem.id,
                                  day,
                                  slotIdx,
                                  periodLabel: displayPeriods[slotIdx]?.label || `P${slotIdx + 1}`,
                                  periodTime: `${period.startTime} – ${period.endTime}`,
                                  currentSubject: assignment.subject,
                                  currentTeacher: assignment.teacher,
                                });
                              }}
                              className={`${rowH} px-1.5 flex items-center justify-center transition-all duration-150 select-none group relative ${
                                isEditMode ? "cursor-pointer" : "cursor-default"
                              } ${
                                isSelected
                                  ? "bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500 ring-inset z-10"
                                  : isUnassigned
                                    ? isEditMode
                                      ? "bg-slate-50/60 dark:bg-slate-900/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30"
                                      : "bg-slate-50/60 dark:bg-slate-900/40"
                                    : isSat
                                      ? isEditMode
                                        ? "bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-100/30 dark:hover:bg-amber-950/25"
                                        : "bg-amber-50/20 dark:bg-amber-950/10"
                                      : isEditMode
                                        ? "bg-white dark:bg-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                                        : "bg-white dark:bg-slate-900"
                              } ${
                                slotIdx < group.schedule.periods.length - 1
                                  ? "border-r border-slate-400/80 dark:border-slate-600"
                                  : ""
                              }`}
                            >
                              {isUnassigned ? (
                                isEditMode ? (
                                  <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-dashed border-emerald-400 dark:border-emerald-600 rounded px-1.5 py-0.5 transition-colors">
                                    + Assign
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                    —
                                  </div>
                                )
                              ) : (
                                <div
                                  className={`${subjectFont} truncate whitespace-nowrap text-center leading-tight transition-colors text-slate-800 dark:text-slate-100 ${
                                    isEditMode ? "group-hover:text-indigo-600 dark:group-hover:text-indigo-400" : ""
                                  }`}
                                  title={`${assignment.subject} - ${assignment.teacher} (${period.startTime} - ${period.endTime})${!isEditMode ? " · [View Only - Enable Edit to modify]" : ""}`}
                                >
                                  <span>{shortSubject}</span>
                                  <span className="mx-0.5 text-slate-400">·</span>
                                  <span>{assignment.teacher}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Render Teacher-wise Timetable Card (Docked Ribbon Frame) ──
  const renderTeacherCard = (teacher: TeacherProfile, isPinned?: boolean) => {
    const zm = getZoomMetrics(zoom);
    const rowH = zm.rowH;
    const dayFont = zm.dayFont;
    const subjectFont = zm.subjectFont;

    const { schedule, assignedCount, freeCount, totalAcademicSlots, classesTaught } =
      computeTeacherWeekSchedule(teacher.name, classSchedules, MOCK_TIMETABLES_V2);

    const dayGroups = getDayScheduleGroups(DAYS, dayScheduleMap, bellSchedules);
    const workloadPercent = totalAcademicSlots > 0 ? Math.round((assignedCount / totalAcademicSlots) * 100) : 0;

    return (
      <div
        key={`teacher-card-${teacher.id}`}
        id={`table-teacher-${teacher.id}`}
        className="flex flex-col min-w-0 scroll-mt-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
      >
        {/* Docked Ribbon Header for Teacher */}
        <div className="bg-slate-100/95 dark:bg-slate-800/95 border-b border-slate-300 dark:border-slate-700 px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center justify-between flex-wrap gap-2">
          {/* Left: Teacher Info & Class Teacher status */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-6 h-6 rounded-lg ${teacher.avatarColor} text-white flex items-center justify-center font-bold text-[10px] shadow-2xs shrink-0`}>
                {teacher.initials}
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white shrink-0 text-xs sm:text-sm tracking-tight">
                {teacher.name}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wide shadow-2xs bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {teacher.primarySubject} Faculty
              </span>
              {isPinned && (
                <span className="text-[10px] font-mono px-2 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                  📌 Pinned Faculty
                </span>
              )}
            </div>

            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 shrink-0 hidden sm:block" />

            {/* Teacher Workload Ticker */}
            <div className={`flex items-center gap-2 font-sans flex-wrap ${zm.tickerFont}`}>
              <span className="inline-flex items-center gap-1 select-none text-slate-700 dark:text-slate-300" title="Assigned Lectures per Week">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">{assignedCount} pds/wk</span>
              </span>

              <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

              <span className="inline-flex items-center gap-1 select-none text-slate-700 dark:text-slate-300" title="Free Periods per Week">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                <span className="text-slate-500 dark:text-slate-400 font-medium">Free:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">{freeCount} pds</span>
              </span>

              <span className="text-slate-300 dark:text-slate-700 select-none">·</span>

              <span className="inline-flex items-center gap-1 select-none text-slate-700 dark:text-slate-300" title="Workload Load Factor">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Load:</span>
                <span className="font-bold text-slate-900 dark:text-white tabular-nums">{workloadPercent}%</span>
              </span>
            </div>
          </div>
        </div>

        {/* Grid Canvas for Teacher */}
        <div className="overflow-x-auto">
          <div className="min-w-[max(840px,100%)] w-full flex flex-col">
            {dayGroups.map((group, groupIdx) => {
              const isGroupSatOrCustom = group.scheduleId === "saturday" || group.schedule.isCustom;
              const displayPeriods = computePeriodDisplayItems(group.schedule.periods);
              const template = `${zm.dayColWidth} repeat(${group.schedule.periods.length}, minmax(105px, 1fr))`;

              return (
                <div key={`teacher-group-${teacher.id}-${group.scheduleId}-${groupIdx}`} className="flex flex-col">
                  {/* Timing Header Row */}
                  {renderTimingHeaderRow(
                    `teacher-${teacher.id}-${group.scheduleId}-${groupIdx}`,
                    group.schedule,
                    !!isGroupSatOrCustom,
                    group.days,
                    undefined
                  )}

                  {/* Day Rows */}
                  {group.days.map((day) => {
                    const isCustomDay = (dayScheduleMap[day] || "standard") !== "standard";
                    const isSat = day === "Sat";
                    const daySlots = schedule[day] || [];

                    return (
                      <div
                        key={`teacher-${teacher.id}-${day}`}
                        className="grid items-stretch border-b border-slate-400/80 dark:border-slate-600 last:border-b-0"
                        style={{ gridTemplateColumns: template }}
                      >
                        {/* Sticky Left Day Cell */}
                        <div
                          className={`sticky left-0 z-20 px-1 py-0.5 text-center font-bold ${dayFont} border-r-2 flex items-center justify-center select-none uppercase tracking-wider font-mono ${
                            isSat
                              ? "bg-amber-200 dark:bg-amber-950 border-slate-400/90 dark:border-slate-600 text-amber-800 dark:text-amber-300 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]"
                              : isCustomDay
                                ? "bg-emerald-100 dark:bg-emerald-950/80 border-slate-400/90 dark:border-slate-600 text-emerald-800 dark:text-emerald-300 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]"
                                : "bg-slate-200 dark:bg-slate-800 border-slate-400/90 dark:border-slate-600 text-slate-800 dark:text-slate-100 shadow-[2px_0_5px_-1px_rgba(0,0,0,0.15)]"
                          }`}
                        >
                          <span className="truncate">{day}</span>
                        </div>

                        {/* Period Cells */}
                        {group.schedule.periods.map((period, slotIdx) => {
                          const cellItem = daySlots[slotIdx];
                          const isBreak = period.type === "break" || cellItem === "Break";
                          const isFree = cellItem === "Free" || !cellItem;

                          if (isBreak) {
                            return (
                              <div
                                key={`tcell-${teacher.id}-${day}-${period.id}`}
                                className={`${rowH} px-1.5 flex items-center justify-center select-none bg-amber-50/40 dark:bg-amber-950/20 text-amber-600/80 dark:text-amber-400/70 border-r border-amber-200/60 dark:border-amber-900/40 text-[10px] font-mono font-medium`}
                                title={`${period.title || "Break"} (${period.startTime} - ${period.endTime})`}
                              >
                                <span className="truncate">{period.title || "Break"}</span>
                              </div>
                            );
                          }

                          if (isFree) {
                            return (
                              <div
                                key={`tcell-${teacher.id}-${day}-${period.id}`}
                                className={`${rowH} px-1.5 flex items-center justify-center select-none bg-slate-50/50 dark:bg-slate-900/30 text-slate-400 dark:text-slate-500 border-r border-slate-400/80 dark:border-slate-600 text-[10px] font-mono font-medium`}
                                title={`Free Period (${period.startTime} - ${period.endTime})`}
                              >
                                <span className="px-1.5 py-0.2 rounded bg-slate-100/70 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300/80 dark:border-slate-700/80 text-[9.5px]">
                                  — Free —
                                </span>
                              </div>
                            );
                          }

                          // Assigned lecture: cellItem is TeacherSlotAssignment
                          const assigned = cellItem as TeacherSlotAssignment;
                          const shortSub = getShortSubject(assigned.subject);

                          if (assigned.isConflict) {
                            return (
                              <div
                                key={`tcell-${teacher.id}-${day}-${period.id}`}
                                className={`${rowH} px-1.5 flex items-center justify-center transition-all duration-150 select-none border-r border-rose-400 bg-rose-50 dark:bg-rose-950/60`}
                                title={`Double booking conflict: ${assigned.conflictClasses?.join(", ")}`}
                              >
                                <span className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400 truncate">
                                  ⚠️ {assigned.conflictClasses?.join(" & ")}
                                </span>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={`tcell-${teacher.id}-${day}-${period.id}`}
                              className={`${rowH} px-1.5 flex items-center justify-center transition-all duration-150 select-none border-r border-slate-400/80 dark:border-slate-600 bg-white dark:bg-slate-900 group hover:bg-slate-100/60 dark:hover:bg-slate-800/60`}
                              title={`${assigned.className} · ${assigned.subject} (${period.startTime} - ${period.endTime})`}
                            >
                              <div className="flex items-center gap-1 min-w-0 max-w-full truncate">
                                <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-black font-mono shadow-2xs shrink-0 ${assigned.sectionPillClass}`}>
                                  {assigned.shortCode}
                                </span>
                                <span className={`${subjectFont} truncate font-semibold text-slate-800 dark:text-slate-100`}>
                                  {shortSub}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Render Free Teacher Timetable (Availability & Substitution Board) ──
  const renderFreeTeachersView = () => {
    const zm = getZoomMetrics(zoom);

    // Compute free and busy teachers for the selected Day and Slot
    const freeTeachers: { teacher: TeacherProfile; totalWeeklyLoad: number }[] = [];
    const busyTeachers: {
      teacher: TeacherProfile;
      classCode: string;
      className: string;
      subject: string;
      sectionPillClass: string;
    }[] = [];

    TEACHERS_LIST.forEach((t) => {
      let teachingIn: { classCode: string; className: string; subject: string; sectionPillClass: string } | null = null;

      for (const cls of MOCK_CLASSES_LIST) {
        const slotData = classSchedules[cls.id]?.[freeTeacherDay]?.[freeTeacherSlot];
        if (slotData && slotData.teacher && slotData.teacher.toLowerCase() === t.name.toLowerCase()) {
          const meta = getClassVisualMeta(cls);
          teachingIn = {
            classCode: meta.shortCode,
            className: cls.name,
            subject: slotData.subject,
            sectionPillClass: meta.sectionPillClass,
          };
          break;
        }
      }

      // Calculate total weekly load for this teacher
      let loadCount = 0;
      DAYS.forEach((d) => {
        for (let s = 0; s < 8; s++) {
          if (s !== 4) {
            for (const cls of MOCK_CLASSES_LIST) {
              if (classSchedules[cls.id]?.[d]?.[s]?.teacher?.toLowerCase() === t.name.toLowerCase()) {
                loadCount++;
                break;
              }
            }
          }
        }
      });

      if (teachingIn) {
        busyTeachers.push({
          teacher: t,
          ...teachingIn,
        });
      } else {
        freeTeachers.push({
          teacher: t,
          totalWeeklyLoad: loadCount,
        });
      }
    });

    const activePeriod = INITIAL_PERIODS_V2[freeTeacherSlot] || INITIAL_PERIODS_V2[0];

    const filterQuery = searchQuery.trim().toLowerCase();
    const visibleFreeTeachers = filterQuery
      ? freeTeachers.filter(
          (item) =>
            item.teacher.name.toLowerCase().includes(filterQuery) ||
            item.teacher.primarySubject.toLowerCase().includes(filterQuery) ||
            item.teacher.department.toLowerCase().includes(filterQuery)
        )
      : freeTeachers;
    const visibleBusyTeachers = filterQuery
      ? busyTeachers.filter(
          (item) =>
            item.teacher.name.toLowerCase().includes(filterQuery) ||
            item.subject.toLowerCase().includes(filterQuery) ||
            item.classCode.toLowerCase().includes(filterQuery)
        )
      : busyTeachers;

    return (
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 flex flex-col overflow-y-auto ${zm.cardPad} space-y-4`}>
        {/* Top Control Bar: Day & Period Pickers */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                Select Period Slot to Check Available Faculty:
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Active: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{freeTeacherDay}</strong> · <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{activePeriod.startTime} – {activePeriod.endTime}</strong>
            </div>
          </div>

          {/* Day Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1">Day:</span>
            {DAYS.map((day) => (
              <button
                key={`free-day-${day}`}
                type="button"
                onClick={() => setFreeTeacherDay(day)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  freeTeacherDay === day
                    ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40"
                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Period Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mr-1">Period:</span>
            {INITIAL_PERIODS_V2.map((p, pIdx) => {
              const isBreak = p.type === "break";
              if (isBreak) {
                return (
                  <span
                    key={`free-p-${p.id}`}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 select-none"
                  >
                    Lunch Break
                  </span>
                );
              }
              const isSelected = freeTeacherSlot === pIdx;
              return (
                <button
                  key={`free-p-${p.id}`}
                  type="button"
                  onClick={() => setFreeTeacherSlot(pIdx)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? "bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/40"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <span>P{pIdx < 4 ? pIdx + 1 : pIdx}</span>
                  <span className="text-[10px] opacity-75 font-mono hidden sm:inline">({p.startTime})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary Metric Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Free for Substitution
              </span>
              <span className="text-2xl font-black text-emerald-800 dark:text-emerald-200">
                {visibleFreeTeachers.length}
              </span>
              <span className="text-xs text-emerald-600/80 block">Faculty Members Free</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                Currently In Class
              </span>
              <span className="text-2xl font-black text-blue-800 dark:text-blue-200">
                {visibleBusyTeachers.length}
              </span>
              <span className="text-xs text-blue-600/80 block">Lectures in Progress</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-200/60 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Teaching Staff
              </span>
              <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {TEACHERS_LIST.length}
              </span>
              <span className="text-xs text-slate-500 block">Active Faculty</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Faculty Split View: Free Teachers vs In-Class Teachers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Available Teachers Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Available Faculty (Free in Period {freeTeacherSlot < 4 ? freeTeacherSlot + 1 : freeTeacherSlot})
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                {visibleFreeTeachers.length} Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleFreeTeachers.map(({ teacher, totalWeeklyLoad }) => (
                <div
                  key={`free-card-${teacher.id}`}
                  className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400 transition-all flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${teacher.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
                      {teacher.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {teacher.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {teacher.primarySubject} · {teacher.department}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300 block">
                      {totalWeeklyLoad} pds/wk
                    </span>
                    <button
                      type="button"
                      onClick={() => alert(`Selected ${teacher.name} for substitution during ${freeTeacherDay} Period ${freeTeacherSlot < 4 ? freeTeacherSlot + 1 : freeTeacherSlot}`)}
                      className="mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-2xs"
                    >
                      Assign Sub
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Occupied Teachers Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                Engaged Faculty (Currently Teaching)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold">
                {visibleBusyTeachers.length} Busy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {visibleBusyTeachers.map(({ teacher, classCode, subject, sectionPillClass }) => (
                <div
                  key={`busy-card-${teacher.id}`}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-850 flex items-center justify-between gap-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${teacher.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs opacity-80`}>
                      {teacher.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                        {teacher.name}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {subject}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono shadow-2xs ${sectionPillClass}`}>
                      {classCode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ── TOP HEADER ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30 px-3 sm:px-6 py-2 shadow-2xs">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-3">
          {/* Left: Back Icon Button + Perspective Switcher + Timetable Dropdown + (Wing Dropdown if Classwise) + Search Input + (Edit/Save/Cancel if Classwise) */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-wrap flex-1">
            {/* Back to Dashboard Icon Button */}
            <button
              type="button"
              onClick={onBackToDashboard}
              title="Back to Dashboard"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* ── 0. PERSPECTIVE SWITCHER DROPDOWN ── */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsPerspectiveDropdownOpen(!isPerspectiveDropdownOpen);
                  setIsTimetableDropdownOpen(false);
                  setIsWingDropdownOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer shadow-2xs min-w-[160px] sm:min-w-[190px] justify-between ${
                  perspective === "classwise"
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                    : perspective === "teacherwise"
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                      : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                }`}
                title="Switch Timetable Perspective"
              >
                <div className="flex items-center gap-2 truncate">
                  {perspective === "classwise" && <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  {perspective === "teacherwise" && <User className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                  {perspective === "free-teachers" && <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  <span className="truncate">
                    {perspective === "classwise"
                      ? "Class-wise"
                      : perspective === "teacherwise"
                        ? "Teacher-wise"
                        : "Free Teachers"}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isPerspectiveDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Perspective Dropdown Menu */}
              {isPerspectiveDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsPerspectiveDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Select Timetable Perspective
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPerspective("classwise");
                        setIsPerspectiveDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        perspective === "classwise"
                          ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Class-wise Timetables</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            Editable
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">
                          View & edit schedules grouped by class & section
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          setClassSchedules(JSON.parse(JSON.stringify(savedClassSchedules)));
                          setBellSchedules(JSON.parse(JSON.stringify(savedBellSchedules)));
                          setDayScheduleMap(JSON.parse(JSON.stringify(savedDayScheduleMap)));
                          setBoundaryEdit(null);
                          setInsertPeriodState(null);
                          setCellAssignment(null);
                          setOpenDayMenu(null);
                          setSelectedCell(null);
                          setIsEditMode(false);
                        }
                        setPerspective("teacherwise");
                        setIsPerspectiveDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        perspective === "teacherwise"
                          ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-bold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Teacher-wise Timetables</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            Faculty
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">
                          Faculty rosters, lectures, free hours & workloads
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditMode) {
                          setClassSchedules(JSON.parse(JSON.stringify(savedClassSchedules)));
                          setBellSchedules(JSON.parse(JSON.stringify(savedBellSchedules)));
                          setDayScheduleMap(JSON.parse(JSON.stringify(savedDayScheduleMap)));
                          setBoundaryEdit(null);
                          setInsertPeriodState(null);
                          setCellAssignment(null);
                          setOpenDayMenu(null);
                          setSelectedCell(null);
                          setIsEditMode(false);
                        }
                        setPerspective("free-teachers");
                        setIsPerspectiveDropdownOpen(false);
                      }}
                      className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        perspective === "free-teachers"
                          ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">Free Teacher Timetable</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            Substitutions
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">
                          Period-by-period faculty availability & substitution
                        </div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ── 1. TIMETABLE SELECTOR DROPDOWN ── */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsTimetableDropdownOpen(!isTimetableDropdownOpen);
                  setIsPerspectiveDropdownOpen(false);
                  setIsWingDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs min-w-[180px] sm:min-w-[220px] max-w-[280px] justify-between"
                title="Select Timetable"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                  <span className="truncate">{selectedMasterTimetable.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    {selectedMasterTimetable.version}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      isTimetableDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Timetable Dropdown Menu */}
              {isTimetableDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsTimetableDropdownOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-full min-w-[280px] sm:min-w-[320px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Select Timetable</span>
                      <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                        {selectedMasterTimetable.academicYear}
                      </span>
                    </div>

                    {MASTER_TIMETABLES.map((tt) => {
                      const isSelected = tt.id === selectedMasterTimetable.id;
                      return (
                        <button
                          key={tt.id}
                          type="button"
                          onClick={() => {
                            setSelectedTimetableId(tt.id);
                            setIsTimetableDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                tt.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            <div className="truncate">
                              <div className="truncate font-semibold">{tt.name}</div>
                              <div className="text-[10px] text-slate-400 font-normal truncate">
                                {tt.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {tt.version}
                            </span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* ── 2. WING SELECTOR DROPDOWN (CLASS-WISE & TEACHER-WISE) ── */}
            {(perspective === "classwise" || perspective === "teacherwise") && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsWingDropdownOpen(!isWingDropdownOpen);
                    setIsPerspectiveDropdownOpen(false);
                    setIsTimetableDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs min-w-[130px] sm:min-w-[160px] justify-between"
                  title="Filter by School Wing"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">{selectedWingOption.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {selectedWingOption.count}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                        isWingDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Wing Dropdown Menu */}
                {isWingDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsWingDropdownOpen(false)}
                    />
                    <div className="absolute left-0 mt-2 w-full min-w-[220px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Select School Wing
                      </div>
                      {currentWingOptions.map((w) => {
                        const isSelected = w.id === selectedWing;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              setSelectedWing(w.id);
                              setIsWingDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div className="truncate">
                              <div>{w.label}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                {w.description}
                              </div>
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0 ml-1.5">
                              {w.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── 3. COMMA-SEPARATED SEARCH BAR WITH PINNED STACKING ── */}
            <div className="relative flex items-center min-w-[180px] sm:min-w-[230px] max-w-[310px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  perspective === "classwise"
                    ? "Search (e.g. 10-A, Manish)..."
                    : perspective === "teacherwise"
                      ? "Search teacher or subject..."
                      : "Filter faculty..."
                }
                className="w-full pl-7 pr-6 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 p-0.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Clear search query"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* ── 4. EDIT / SAVE & CANCEL CONTROLS (CLASS-WISE EXCLUSIVE) ── */}
            {perspective === "classwise" && (
              <div className="flex items-center gap-1.5 shrink-0">
                {!isEditMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSavedClassSchedules(JSON.parse(JSON.stringify(classSchedules)));
                      setSavedBellSchedules(JSON.parse(JSON.stringify(bellSchedules)));
                      setSavedDayScheduleMap(JSON.parse(JSON.stringify(dayScheduleMap)));
                      setIsEditMode(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0"
                    title="Click to enable editing of class timetables"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Timetable</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasUnsavedChanges) return;
                        setSavedClassSchedules(JSON.parse(JSON.stringify(classSchedules)));
                        setSavedBellSchedules(JSON.parse(JSON.stringify(bellSchedules)));
                        setSavedDayScheduleMap(JSON.parse(JSON.stringify(dayScheduleMap)));
                        setBoundaryEdit(null);
                        setInsertPeriodState(null);
                        setCellAssignment(null);
                        setOpenDayMenu(null);
                        setSelectedCell(null);
                        setIsEditMode(false);
                        setSaveSuccessToast("Timetable changes saved successfully!");
                        setTimeout(() => setSaveSuccessToast(null), 3500);
                      }}
                      disabled={!hasUnsavedChanges}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                        hasUnsavedChanges
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/50 cursor-pointer active:scale-95"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300/40 dark:border-slate-700/40"
                      }`}
                      title={
                        hasUnsavedChanges
                          ? "Save changes to class schedules"
                          : "No changes made yet. Click a cell, period boundary, or + to edit."
                      }
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setClassSchedules(JSON.parse(JSON.stringify(savedClassSchedules)));
                        setBellSchedules(JSON.parse(JSON.stringify(savedBellSchedules)));
                        setDayScheduleMap(JSON.parse(JSON.stringify(savedDayScheduleMap)));
                        setBoundaryEdit(null);
                        setInsertPeriodState(null);
                        setCellAssignment(null);
                        setOpenDayMenu(null);
                        setSelectedCell(null);
                        setIsEditMode(false);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                      title="Discard changes and exit edit mode"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Zoom Controls & Theme Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Stepper */}
            <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1.5 select-none hidden sm:inline">
                Zoom:
              </span>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= MIN_ZOOM}
                title={zoom <= MIN_ZOOM ? `Minimum zoom reached (${MIN_ZOOM}%)` : "Zoom out"}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  zoom <= MIN_ZOOM
                    ? "opacity-30 cursor-not-allowed text-slate-400"
                    : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 active:scale-95 shadow-2xs cursor-pointer"
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Click to reset zoom to 100%"
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono font-bold text-xs border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all cursor-pointer shadow-2xs tabular-nums min-w-[50px] text-center"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= MAX_ZOOM}
                title={zoom >= MAX_ZOOM ? `Maximum zoom reached (${MAX_ZOOM}%)` : "Zoom in"}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  zoom >= MAX_ZOOM
                    ? "opacity-30 cursor-not-allowed text-slate-400"
                    : "text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 active:scale-95 shadow-2xs cursor-pointer"
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <ThemeToggle variant="icon" />
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-2 sm:p-3 flex flex-col gap-2">
        {/* Floating Save Toast */}
        {saveSuccessToast && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessToast}</span>
          </div>
        )}

        {/* ── PERSPECTIVE 1: FREE TEACHERS ── */}
        {perspective === "free-teachers" && renderFreeTeachersView()}

        {/* ── PERSPECTIVE 2: TEACHER-WISE TIMETABLES ── */}
        {perspective === "teacherwise" && (() => {
          const zm = getZoomMetrics(zoom);
          const { pinned, remaining } = teacherWiseData;
          const totalCount = pinned.length + remaining.length;

          return (
            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 flex flex-col overflow-y-auto ${zm.cardPad}`}
            >
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {totalCount === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No Teachers Found
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        No faculty found {selectedWing !== "all" ? `teaching in the "${selectedWing}"` : ""}{searchQuery ? ` matching search "${searchQuery}"` : ""}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWing("all");
                        setSearchQuery("");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-block"
                    >
                      Reset All Filters (Show All Faculty)
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Pinned Teachers (from search tokens) */}
                    {pinned.length > 0 && (
                      <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center gap-2 px-1 pt-1 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                          <span>📌 Pinned Faculty Timetables ({pinned.length})</span>
                          <div className="h-px flex-1 bg-amber-200 dark:bg-amber-900/60" />
                        </div>
                        {pinned.map((teacher) => renderTeacherCard(teacher, true))}
                      </div>
                    )}

                    {/* Remaining Teachers */}
                    {remaining.length > 0 && (
                      <div className="space-y-1.5 sm:space-y-2">
                        {pinned.length > 0 && (
                          <div className="flex items-center gap-2 px-1 pt-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            <span>All Other Faculty Timetables ({remaining.length})</span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                          </div>
                        )}
                        {remaining.map((teacher) => renderTeacherCard(teacher, false))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── PERSPECTIVE 3: CLASS-WISE TIMETABLES ── */}
        {perspective === "classwise" && (() => {
          const zm = getZoomMetrics(zoom);
          const hasSearch = searchTokens.length > 0;

          return (
            <div
              className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 flex flex-col overflow-y-auto ${zm.cardPad}`}
            >
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {/* 1. If comma-separated search matched teachers, pin their Teacher Cards at the very top! */}
                {hasSearch && matchedTeachersFromSearch.length > 0 && (
                  <div className="space-y-1.5 sm:space-y-2 pb-1">
                    <div className="flex items-center gap-2 px-1 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                      <span>📌 Pinned Teacher Schedules ({matchedTeachersFromSearch.length})</span>
                      <div className="h-px flex-1 bg-amber-200 dark:bg-amber-900/60" />
                    </div>
                    {matchedTeachersFromSearch.map((teacher) => renderTeacherCard(teacher, true))}
                  </div>
                )}

                {/* 2. If comma-separated search matched classes, pin their Class Cards next! */}
                {hasSearch && matchedClassesFromSearch.length > 0 && (
                  <div className="space-y-1.5 sm:space-y-2 pb-1">
                    <div className="flex items-center gap-2 px-1 text-xs font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
                      <span>📌 Pinned Class Schedules ({matchedClassesFromSearch.length})</span>
                      <div className="h-px flex-1 bg-indigo-200 dark:bg-indigo-900/60" />
                    </div>
                    {matchedClassesFromSearch.map((cls, idx) => (
                      <React.Fragment key={`pinned-cls-${cls.id}`}>
                        {renderTimetableCard(cls, idx, true)}
                      </React.Fragment>
                    ))}
                  </div>
                )}

                {/* 3. Chronological Remaining Classes below */}
                {remainingClassesToRender.length === 0 && (!hasSearch || (matchedTeachersFromSearch.length === 0 && matchedClassesFromSearch.length === 0)) ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Search className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No Classes Found
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        No classes match {selectedWing !== "all" ? `the "${selectedWing}" wing` : ""}{searchQuery ? ` or search "${searchQuery}"` : ""}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWing("all");
                        setSearchQuery("");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs inline-block"
                    >
                      Reset All Filters (Show 36 Classes)
                    </button>
                  </div>
                ) : (
                  <>
                    {hasSearch && (matchedTeachersFromSearch.length > 0 || matchedClassesFromSearch.length > 0) && remainingClassesToRender.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <span>All Other Classes ({remainingClassesToRender.length})</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                      </div>
                    )}
                    {remainingClassesToRender.map((tt, idx) => (
                      <React.Fragment key={tt.id}>
                        {renderTimetableCard(tt, idx, false)}
                      </React.Fragment>
                    ))}
                  </>
                )}
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

      {/* ── MODAL 1: BOUNDARY ADJUSTMENT (COLLAPSES ADJACENT PERIOD, MIN 1 MIN GUARD) ── */}
      {boundaryEdit && (() => {
        const boundaryInfo = getBoundaryDetails();
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {boundaryEdit.isBoundary
                        ? "Adjust Period Boundary"
                        : boundaryEdit.periodIdx === 0
                          ? "Adjust Opening Bell (In-Time)"
                          : "Adjust Dismissal Bell (Out-Time)"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {boundaryEdit.isBoundary
                        ? `Shift boundary between ${boundaryEdit.periodAName} and ${boundaryEdit.periodBName}`
                        : `Set bell time for ${boundaryEdit.periodAName}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBoundaryEdit(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Boundary Time Input & Nudge Buttons */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Boundary Time (HH:MM)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={boundaryInputTime}
                    onChange={(e) => setBoundaryInputTime(e.target.value)}
                    placeholder="e.g. 09:45"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-base font-bold tracking-wide focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                  {/* Quick +/- buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => nudgeBoundary(-5)}
                      title="Subtract 5 minutes"
                      className="px-2.5 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      -5m
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeBoundary(-1)}
                      title="Subtract 1 minute"
                      className="px-2 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      -1m
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeBoundary(1)}
                      title="Add 1 minute"
                      className="px-2 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      +1m
                    </button>
                    <button
                      type="button"
                      onClick={() => nudgeBoundary(5)}
                      title="Add 5 minutes"
                      className="px-2.5 py-2 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      +5m
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Duration Collapse & Expand Preview */}
              {boundaryEdit.isBoundary ? (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Live Duration Impact (Boundary Shift)
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[11px]">
                        {boundaryEdit.periodAName}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                        {boundaryInfo?.durationA ?? 0}m
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {minutesToTime(boundaryEdit.periodAStartM)} → {boundaryInputTime}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                      <span className="font-bold text-slate-500 dark:text-slate-400 block text-[11px]">
                        {boundaryEdit.periodBName}
                      </span>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 font-mono">
                        {boundaryInfo?.durationB ?? 0}m
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {boundaryInputTime} → {minutesToTime(boundaryEdit.periodBEndM)}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Permitted Boundary Range:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {boundaryInfo?.minTimeStr} — {boundaryInfo?.maxTimeStr}
                    </span>
                  </p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Period Duration Result
                  </span>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-slate-600 dark:text-slate-300 font-sans">
                      {boundaryEdit.periodAName} New Duration:
                    </span>
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {boundaryInfo?.durationA ?? 0} minutes
                    </span>
                  </div>
                </div>
              )}

              {/* 1-Minute Collapse Error Alert */}
              {boundaryInfo?.error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-medium">{boundaryInfo.error}</span>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBoundaryEdit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!boundaryInfo?.isValid}
                  onClick={() => {
                    if (boundaryInfo?.isValid) {
                      handleSaveBoundary(
                        boundaryEdit.scheduleId,
                        boundaryEdit.periodIdx,
                        boundaryInputTime,
                        boundaryEdit.isBoundary
                      );
                    }
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${boundaryInfo?.isValid
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                    }`}
                >
                  Apply Boundary
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 2: INSERT PERIOD (ACADEMIC VS BREAK/RECESS/LUNCH) ── */}
      {insertPeriodState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center shadow-xs">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Insert New Period / Interval
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {insertPeriodState.insertAfterIdx === -1
                      ? "Adding at the start of the schedule"
                      : `Inserting after column position ${insertPeriodState.insertAfterIdx + 1}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInsertPeriodState(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Period Type Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Interval Type
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setInsertPeriodState((prev) =>
                      prev ? { ...prev, type: "regular", title: "" } : null
                    )
                  }
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${insertPeriodState.type === "regular"
                      ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Teaching Period</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Auto-numbers in academic sequence (P1, P2, P3...)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setInsertPeriodState((prev) =>
                      prev
                        ? {
                          ...prev,
                          type: "break",
                          title: prev.title || "Break",
                          duration: prev.duration === 40 ? 20 : prev.duration,
                        }
                        : null
                    )
                  }
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${insertPeriodState.type === "break"
                      ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/30"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Break / Recess / Lunch</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Non-academic interval; skips period numbering
                  </p>
                </button>
              </div>
            </div>

            {/* Label / Name Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {insertPeriodState.type === "break" ? "Break Title / Label" : "Period Label (Optional)"}
              </label>
              <input
                type="text"
                value={insertPeriodState.title}
                onChange={(e) =>
                  setInsertPeriodState((prev) => (prev ? { ...prev, title: e.target.value } : null))
                }
                placeholder={
                  insertPeriodState.type === "break"
                    ? "e.g. Lunch Break, Short Recess, Assembly"
                    : "Auto-numbered (Leave blank for P#)"
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              {insertPeriodState.type === "break" && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {["Short Break", "Lunch Break", "Recess", "Assembly", "Snack Time"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setInsertPeriodState((prev) => (prev ? { ...prev, title: preset } : null))
                      }
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duration (Minutes)
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {insertPeriodState.duration} mins
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[15, 20, 30, 40, 45].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() =>
                      setInsertPeriodState((prev) => (prev ? { ...prev, duration: d } : null))
                    }
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${insertPeriodState.duration === d
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
                      }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Inserting this interval shifts all following periods forward by {insertPeriodState.duration} minutes. Academic period sequencing updates automatically.
              </span>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setInsertPeriodState(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleConfirmInsertPeriod(
                    insertPeriodState.scheduleId,
                    insertPeriodState.insertAfterIdx,
                    insertPeriodState.type,
                    insertPeriodState.title,
                    insertPeriodState.duration
                  );
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shadow-emerald-600/20"
              >
                Insert Period
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ASSIGN SUBJECT & TEACHER (PRE-RESOLVED AUTO ASSIGNMENT) ── */}
      {cellAssignment && (() => {
        const isCurrentlyAssigned =
          cellAssignment.currentSubject &&
          cellAssignment.currentSubject !== "Unassigned" &&
          cellAssignment.currentSubject !== "Free";

        const targetClass = MOCK_TIMETABLES_V2.find((tt) => tt.id === cellAssignment.classId);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shadow-xs">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Assign Subject & Teacher</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {targetClass?.name.split("—")[0].trim()}
                      </span>
                      <span>•</span>
                      <span>{cellAssignment.day}</span>
                      <span>•</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                        {cellAssignment.periodLabel} ({cellAssignment.periodTime})
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCellAssignment(null);
                    setSubjectSearch("");
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current Slot Status Banner */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Current Period Assignment
                  </span>
                  {isCurrentlyAssigned ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {cellAssignment.currentSubject}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        — {cellAssignment.currentTeacher}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5 block">
                      Slot is unassigned / free
                    </span>
                  )}
                </div>
                {isCurrentlyAssigned && (
                  <button
                    type="button"
                    onClick={() =>
                      handleClearCell(cellAssignment.classId, cellAssignment.day, cellAssignment.slotIdx)
                    }
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/80 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Slot</span>
                  </button>
                )}
              </div>

              {/* Subject Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Search subjects or teachers..."
                  className="w-full pl-9.5 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Subject Grid (Auto-Resolves Pre-Resolved Educator) */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Subject (Auto-Assigns Teacher)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSubjects.map((cat) => {
                    const isSelected = cellAssignment.currentSubject === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() =>
                          handleAssignCell(
                            cellAssignment.classId,
                            cellAssignment.day,
                            cellAssignment.slotIdx,
                            cat.name,
                            cat.teacher
                          )
                        }
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 group ${isSelected
                            ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/30"
                            : "border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${cat.dot}`} />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {cat.name}
                            </span>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-1.5">
                          <span className="truncate group-hover:text-slate-800 dark:group-hover:text-slate-200 font-medium">
                            {cat.teacher}
                          </span>
                          <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
                            Auto-assign
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCellAssignment(null);
                    setSubjectSearch("");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 4: DAY BELL TIMING CUSTOMIZATION / DETACHMENT MENU ── */}
      {openDayMenu && (() => {
        const day = openDayMenu.day;
        const currentScheduleId = dayScheduleMap[day] || "standard";
        const isStandard = currentScheduleId === "standard";
        const schedule = bellSchedules[currentScheduleId] || bellSchedules["standard"];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 flex items-center justify-center shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{day} — Bell Timing Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Manage day-specific bell schedule headers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenDayMenu(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Current State Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Current Bell Schedule
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {schedule.name}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                    {schedule.periods.length} periods
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isStandard
                    ? "Shared across standard weekdays (Mon - Fri). Modifications affect all shared days."
                    : "Unique bell timing detached from standard weekdays. Has its own timing header row."}
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                {isStandard ? (
                  <button
                    type="button"
                    onClick={() => handleMakeDayUnique(day)}
                    className="w-full p-3.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 text-left transition-all cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0 mt-0.5">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200 block group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        Detach & Create Unique Bell Schedule for {day}
                      </span>
                      <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                        Gives {day} its own dedicated Bell Timing Header Row. Adjust periods and boundaries for this day independently.
                      </p>
                    </div>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRevertDayToStandard(day)}
                    className="w-full p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-left transition-all cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="p-2 rounded-xl bg-slate-700 dark:bg-slate-600 text-white shadow-xs shrink-0 mt-0.5">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                        Revert {day} to Standard Weekday Timing
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Re-attaches {day} to the standard weekday schedule, merging it back into the primary timing header group.
                      </p>
                    </div>
                  </button>
                )}
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpenDayMenu(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL 5: QUICK FINDER / SEARCH CLASS, SECTION, TEACHER ── */}
      {isSearchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 p-3 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-100"
          onClick={() => setIsSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[82vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-800/40">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search class (e.g. 6-B), section, or teacher (e.g. Sharma)..."
                className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-sm sm:text-base font-semibold focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 shrink-0">
                ESC
              </kbd>
            </div>

            {/* Quick Action Pills if query entered */}
            {searchQuery.trim() && (
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between text-xs flex-wrap gap-2">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  Found <strong className="text-indigo-600 dark:text-indigo-400">{matchingClasses.length}</strong> classes & <strong className="text-indigo-600 dark:text-indigo-400">{matchingTeachers.length}</strong> teachers
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveFilterQuery(searchQuery);
                    setIsSearchModalOpen(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                >
                  Filter Sheet to "{searchQuery}"
                </button>
              </div>
            )}

            {/* Scrollable Results Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
              {/* Section 1: Matching Classes & Sections */}
              {matchingClasses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Classes & Sections ({matchingClasses.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Click to jump directly</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchingClasses.map((cls) => {
                      const vMeta = getClassVisualMeta(cls);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => handleJumpToClass(cls.id, cls.wing)}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 bg-white dark:bg-slate-800/60 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/40 text-left transition-all cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-1.5 h-7 rounded-full shrink-0 bg-indigo-500" />
                            <div className="truncate">
                              <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                                <span>{vMeta.gradeName}</span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${vMeta.sectionPillClass}`}>
                                  {vMeta.rawSec}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium">
                                {cls.wing}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                            Jump ↵
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Matching Teachers */}
              {matchingTeachers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Faculty & Teachers ({matchingTeachers.length})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Click to filter teacher schedule</span>
                  </div>
                  <div className="space-y-1.5">
                    {matchingTeachers.map((t) => (
                      <button
                        key={t.teacher}
                        type="button"
                        onClick={() => {
                          setSelectedWing("all");
                          setActiveFilterQuery(t.teacher);
                          setIsSearchModalOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-slate-800/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/30 text-left transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {t.teacher.charAt(0)}
                          </div>
                          <div className="truncate">
                            <div className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                              {t.teacher}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                              <span>{t.subjects.join(", ")}</span>
                              {t.classNames.length > 0 && (
                                <>
                                  <span>·</span>
                                  <span className="text-slate-400">Classes: {t.classNames.slice(0, 4).join(", ")}{t.classNames.length > 4 ? ` +${t.classNames.length - 4}` : ''}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                          View Classes ↵
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state when searching and no results found */}
              {searchQuery.trim() && matchingClasses.length === 0 && matchingTeachers.length === 0 && (
                <div className="py-10 text-center space-y-2">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    No classes or teachers match "{searchQuery}"
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try searching by class number (e.g. "6", "10"), section ("A", "B"), or teacher surname.
                  </p>
                </div>
              )}

              {/* Initial helpful state when search query is empty */}
              {!searchQuery.trim() && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Instant School Finder
                    </h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-0.5">
                      Type any class, section, subject, or educator name to jump directly or filter the sheet.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                    {["6-B", "10-A", "Nursery", "Math", "Science", "Major Dhyan"].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setSearchQuery(pill)}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-400">
              <span className="text-[11px]">
                Tip: Press <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[9px] font-mono">⌘K</kbd> anytime to open
              </span>
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(false)}
                className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer text-xs"
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
