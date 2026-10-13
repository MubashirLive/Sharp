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
  Users,
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

export default function Timetable2Page({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable1,
  onOpenTimetable3,
  onSignOut,
}: Timetable2PageProps) {
  const [selectedTimetableId, setSelectedTimetableId] = useState("tt2-1");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<"grid" | "timeline" | "allocator">("grid");
  const [gridStyle, setGridStyle] = useState<"crisp" | "zebra" | "recessed">("crisp");

  // Periods state for UI/UX testing
  const [periods, setPeriods] = useState<PeriodItem[]>(INITIAL_PERIODS_V2);
  const [selectedCell, setSelectedCell] = useState<{ day: string; periodId: string } | null>(null);

  const selectedTimetable =
    MOCK_TIMETABLES_V2.find((tt) => tt.id === selectedTimetableId) || MOCK_TIMETABLES_V2[0];

  const sectionStatus =
    MOCK_SECTION_STATUS[selectedTimetableId] || MOCK_SECTION_STATUS["tt2-1"];

  const gridTemplate = `56px repeat(${periods.length}, minmax(112px, 1fr))`;

  const renderTimingHeaderRow = (
    keyPrefix: string,
    schedulePeriods: PeriodItem[],
    isSaturday: boolean = false
  ) => {
    const isRecessed = gridStyle === "recessed";

    return (
      <div
        className={`grid items-stretch border-b-2 ${
          isSaturday
            ? isRecessed
              ? "border-amber-400 dark:border-amber-700 bg-amber-100/30 dark:bg-amber-950/30"
              : "border-amber-300 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20"
            : isRecessed
              ? "border-slate-400/90 dark:border-slate-600 bg-slate-100 dark:bg-slate-800/90"
              : "border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80"
        }`}
        style={{ gridTemplateColumns: gridTemplate }}
      >
        {/* Left Header Cell (56px) - Clean Alignment Spacer */}
        <div
          className={`h-8 border-r-2 select-none ${
            isSaturday
              ? isRecessed
                ? "bg-amber-100/70 dark:bg-amber-950/50 border-amber-400 dark:border-amber-700"
                : "bg-amber-100/50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800/80"
              : isRecessed
                ? "bg-slate-200/80 dark:bg-slate-700/80 border-slate-400/90 dark:border-slate-600"
                : "bg-slate-100/70 dark:bg-slate-800/70 border-slate-300 dark:border-slate-700"
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
              className={`h-8 relative flex items-center justify-center select-none ${
                idx < schedulePeriods.length - 1
                  ? isSaturday
                    ? isRecessed
                      ? "border-r border-amber-300 dark:border-amber-800"
                      : "border-r border-amber-200/80 dark:border-amber-900/50"
                    : isRecessed
                      ? "border-r border-slate-400/80 dark:border-slate-600"
                      : "border-r border-slate-300 dark:border-slate-700"
                  : ""
              }`}
            >
              {/* Boundary 0: Start time on Line 0 (Google Calendar scale marker) */}
              {idx === 0 && (
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 px-1 py-0.5 text-[10px] font-mono whitespace-nowrap rounded shadow-2xs ${
                    isRecessed
                      ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400 dark:border-slate-600 font-bold"
                      : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-medium"
                  }`}
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
                  className={`text-[11px] font-bold tracking-tight font-sans ${
                    isSaturday
                      ? "text-amber-800 dark:text-amber-300"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {period.type === "break" ? "Break" : `P${idx + 1}`}
                </span>
                <span
                  className={`text-[9px] ${
                    isSaturday
                      ? "text-amber-400 dark:text-amber-500"
                      : "text-slate-300 dark:text-slate-600"
                  }`}
                >
                  ·
                </span>
                <span
                  className={`text-[10px] font-mono tabular-nums font-medium ${
                    isSaturday
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-slate-400 dark:text-slate-400"
                  }`}
                >
                  {durStr}
                </span>
              </div>

              {/* Boundary idx + 1: End time on Line idx + 1 (Google Calendar scale marker) */}
              <div
                className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 px-1 py-0.5 text-[10px] font-mono whitespace-nowrap rounded shadow-2xs ${
                  isRecessed
                    ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-400 dark:border-slate-600 font-bold"
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 font-medium"
                }`}
              >
                {formatCalendarLineTime(period.endTime)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
                  UI/UX Sandbox
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
                    Timetable 2 Experiments
                  </div>
                  {MOCK_TIMETABLES_V2.map((tt) => {
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

          {/* Prototype View Mode Toggles */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveView("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeView === "grid"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeView === "timeline"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Bell Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView("allocator")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeView === "allocator"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Faculty Allocator</span>
            </button>
          </div>
        </div>

        {/* ── TIMETABLE 2 EXPERIMENTAL PROTOTYPE CONTAINER ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 flex flex-col overflow-hidden">
          {activeView === "grid" && (
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

                  {/* Flat Borderless Status Ticker */}
                  <div className="flex items-center gap-2 text-xs font-sans flex-wrap">
                    {sectionStatus.subjects.map((sub) => (
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

                {/* Right: Grid Style 3-Option Interactive Switcher */}
                <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold ml-auto shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1.5 select-none hidden sm:inline">
                    Grid Style:
                  </span>
                  <button
                    type="button"
                    onClick={() => setGridStyle("crisp")}
                    title="Option 1: Crisp solid hairlines (Slate-300) with 2px Day anchor divider"
                    className={`px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                      gridStyle === "crisp"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    1. Crisp Hairlines
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridStyle("zebra")}
                    title="Option 2: High-contrast grid with alternating row tints (zebra banding)"
                    className={`px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                      gridStyle === "zebra"
                        ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    2. Zebra Tints
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridStyle("recessed")}
                    title="Option 3: Subtle recessed grid with darker borders & card-like day labels"
                    className={`px-2 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                      gridStyle === "recessed"
                        ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    3. Recessed Grid
                  </button>
                </div>
              </div>

              {/* Grid Canvas */}
              <div className="flex-1 overflow-x-auto overflow-y-auto">
                <div className="min-w-[max(840px,100%)] w-full flex flex-col pr-5 pb-2">
                  <div
                    className={`rounded-xl overflow-hidden shadow-xs w-full ${
                      gridStyle === "recessed"
                        ? "border-2 border-slate-400/90 dark:border-slate-600 bg-white dark:bg-slate-900"
                        : "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    {/* 1. TIMING ROW ABOVE MONDAY (FOR MON - FRI SCHEDULE) */}
                    {renderTimingHeaderRow("mon-fri", periods, false)}

                    {/* 2. WEEKDAY SCHEDULE ROWS (MON - FRI) */}
                    {DAYS.slice(0, 5).map((day, dayIdx) => {
                      const isRecessed = gridStyle === "recessed";
                      const isZebra = gridStyle === "zebra";
                      const isAlternateZebra = isZebra && dayIdx % 2 === 1;

                      return (
                        <div
                          key={day}
                          className={`grid items-stretch ${
                            isRecessed
                              ? "border-b border-slate-400/80 dark:border-slate-600"
                              : "border-b border-slate-300 dark:border-slate-700"
                          }`}
                          style={{ gridTemplateColumns: gridTemplate }}
                        >
                          {/* Left Day Cell (56px) - Anchored with 2px right border */}
                          <div
                            className={`px-1 py-1 text-center font-bold text-[11px] border-r-2 flex items-center justify-center select-none uppercase tracking-wider font-mono ${
                              isRecessed
                                ? "bg-slate-200/80 dark:bg-slate-800 border-slate-400/90 dark:border-slate-600 text-slate-800 dark:text-slate-100 font-extrabold shadow-inner"
                                : isAlternateZebra
                                  ? "bg-slate-100/90 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {day}
                          </div>

                          {/* Period Cells (Rectangular Grid Cells) */}
                          {periods.map((period, slotIdx) => {
                            const isSelected =
                              selectedCell?.day === day && selectedCell?.periodId === period.id;
                            const assignment =
                              TIMETABLE_GRID_SCHEDULE[day]?.[slotIdx] ||
                              (slotIdx === 0
                                ? { subject: "English", teacher: "Manish Kumar" }
                                : { subject: "General Study", teacher: "Faculty Staff" });
                            const shortSubject = getShortSubject(assignment.subject);

                            return (
                              <div
                                key={`${day}-${period.id}`}
                                onClick={() =>
                                 setSelectedCell(isSelected ? null : { day, periodId: period.id })
                                }
                                className={`h-9 px-2 flex items-center justify-center transition-colors cursor-pointer select-none group ${
                                  isSelected
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500 ring-inset z-10"
                                    : isAlternateZebra
                                      ? "bg-slate-50/85 dark:bg-slate-800/40 hover:bg-indigo-50/50 dark:hover:bg-slate-800/70"
                                      : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                } ${
                                  slotIdx < periods.length - 1
                                    ? isRecessed
                                      ? "border-r border-slate-400/80 dark:border-slate-600"
                                      : "border-r border-slate-300 dark:border-slate-700"
                                    : ""
                                }`}
                              >
                                {/* Subject & Teacher (Single Line) */}
                                <div
                                  className="text-[11.5px] font-bold text-slate-800 dark:text-slate-100 truncate whitespace-nowrap text-center leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
                                  title={`${assignment.subject} - ${assignment.teacher} (${period.startTime} - ${period.endTime})`}
                                >
                                  {shortSubject} - {assignment.teacher}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* 3. TIMING ROW ABOVE SATURDAY (FOR SATURDAY SCHEDULE) */}
                    {renderTimingHeaderRow("sat", SATURDAY_PERIODS_V2, true)}

                    {/* 4. SATURDAY SCHEDULE ROW */}
                    <div
                      key="Sat"
                      className="grid items-stretch"
                      style={{ gridTemplateColumns: gridTemplate }}
                    >
                      {/* Left Day Cell (56px) - Anchored with 2px right border */}
                      <div
                        className={`px-1 py-1 text-center font-bold text-[11px] border-r-2 flex items-center justify-center select-none uppercase tracking-wider font-mono ${
                          gridStyle === "recessed"
                            ? "bg-amber-100 dark:bg-amber-950/60 border-slate-400/90 dark:border-slate-600 text-amber-800 dark:text-amber-300 font-extrabold shadow-inner"
                            : "bg-amber-50/60 dark:bg-amber-950/40 border-slate-300 dark:border-slate-700 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        Sat
                      </div>

                      {/* Period Cells for Saturday */}
                      {SATURDAY_PERIODS_V2.map((satPeriod, slotIdx) => {
                        const isSelected =
                          selectedCell?.day === "Sat" && selectedCell?.periodId === satPeriod.id;
                        const assignment =
                          TIMETABLE_GRID_SCHEDULE["Sat"]?.[slotIdx] || {
                            subject: "General Study",
                            teacher: "Faculty Staff",
                          };
                        const shortSubject = getShortSubject(assignment.subject);

                        return (
                          <div
                            key={`Sat-${satPeriod.id}`}
                            onClick={() =>
                              setSelectedCell(isSelected ? null : { day: "Sat", periodId: satPeriod.id })
                            }
                            className={`h-9 px-2 flex items-center justify-center transition-colors cursor-pointer select-none group ${
                              isSelected
                                ? "bg-amber-50 dark:bg-amber-950/60 ring-2 ring-amber-500 ring-inset z-10"
                                : gridStyle === "zebra"
                                  ? "bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-100/40 dark:hover:bg-amber-950/35"
                                  : gridStyle === "recessed"
                                    ? "bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-100/30 dark:hover:bg-amber-950/25"
                                    : "bg-white dark:bg-slate-900 hover:bg-amber-50/40 dark:hover:bg-amber-950/30"
                            } ${
                              slotIdx < SATURDAY_PERIODS_V2.length - 1
                                ? gridStyle === "recessed"
                                  ? "border-r border-slate-400/80 dark:border-slate-600"
                                  : "border-r border-slate-300 dark:border-slate-700"
                                : ""
                            }`}
                          >
                            {/* Subject & Teacher (Single Line) */}
                            <div
                              className="text-[11.5px] font-bold text-slate-800 dark:text-slate-100 truncate whitespace-nowrap text-center leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                              title={`${assignment.subject} - ${assignment.teacher} (${satPeriod.startTime} - ${satPeriod.endTime})`}
                            >
                              {shortSubject} - {assignment.teacher}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === "timeline" && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Clock className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bell Schedule Timeline Sandbox
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                Visual interactive timeline view for experimenting with period durations, bell rings, lunch intervals, and transitions.
              </p>
            </div>
          )}

          {activeView === "allocator" && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Faculty Subject Allocator Sandbox
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                Drag-and-drop subject palette for assigning educators and detecting consecutive period load clashes.
              </p>
            </div>
          )}
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
