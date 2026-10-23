import React, { useState } from "react";
import {
  ArrowLeft,
  Building2,
  LogOut,
  Clock,
  Activity,
  ChevronDown,
  Calendar,
  Check,
  Sparkles,
  Pencil,
  Trash2,
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Info,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import schoolLogo from "../assets/ideal-logo.jpg";
import ThemeToggle from "../components/ThemeToggle";

interface TimetablePageProps {
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
  onOpenTimetable2?: () => void;
  onOpenTimetable3?: () => void;
  onSignOut: () => void;
}

interface PeriodItem {
  id: string;
  startTime: string;
  endTime: string;
}

interface EditingPeriodState {
  index: number;
  startTime: string;
  endTime: string;
}

// Converts "HH:MM" (e.g. "09:00", "01:30", "13:30") to minutes from midnight
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
    // School schedule heuristic: In a normal school day (8:00 AM to 6:00 PM),
    // hours 1, 2, 3, 4, 5, 6 are PM (13:00 to 18:00), while 7, 8, 9, 10, 11, 12 are AM/noon.
    if (hours >= 1 && hours <= 6) {
      hours += 12;
    }
  }

  return hours * 60 + minutes;
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

// Calculates duration in minutes between start and end time
export function getDurationMinutes(startTime: string, endTime: string): number | null {
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  if (startM === null || endM === null) return null;
  return endM - startM;
}

// Formats minutes duration into human friendly string "45m" or "1h 15m"
export function formatDuration(mins: number): string {
  if (mins <= 0) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Formats time for calendar gridline markers (Google Calendar style: "9 AM", "9:30 AM", "1 PM")
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
  "XIII",
  "XIV",
  "XV",
];

const INITIAL_PERIODS: PeriodItem[] = [
  { id: "p-1", startTime: "09:00", endTime: "09:30" },
  { id: "p-2", startTime: "09:30", endTime: "10:30" },
  { id: "p-3", startTime: "10:30", endTime: "11:30" },
  { id: "p-4", startTime: "11:30", endTime: "12:30" },
  { id: "p-5", startTime: "12:30", endTime: "01:30" },
  { id: "p-6", startTime: "01:30", endTime: "02:30" },
  { id: "p-7", startTime: "02:30", endTime: "03:30" },
  { id: "p-8", startTime: "03:30", endTime: "04:30" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CALENDAR_DAYS = [
  { key: "Mon", dayName: "MON", isCurrent: false },
  { key: "Tue", dayName: "TUE", isCurrent: false },
  { key: "Wed", dayName: "WED", isCurrent: true },
  { key: "Thu", dayName: "THU", isCurrent: false },
  { key: "Fri", dayName: "FRI", isCurrent: false },
  { key: "Sat", dayName: "SAT", isCurrent: false },
];

const MOCK_TIMETABLES = [
  {
    id: "tt-1",
    name: "Class 6-A — Master Schedule",
    className: "6th A",
    wing: "Middle Wing",
    status: "Active",
    academicYear: "2026–2027",
  },
  {
    id: "tt-2",
    name: "Class 6-B — Master Schedule",
    className: "6th B",
    wing: "Middle Wing",
    status: "Active",
    academicYear: "2026–2027",
  },
  {
    id: "tt-3",
    name: "Class 10-A (General) — Secondary Schedule",
    className: "10th A",
    wing: "Secondary Wing",
    status: "Active",
    academicYear: "2026–2027",
  },
  {
    id: "tt-4",
    name: "Class 9-A (General) — Secondary Schedule",
    className: "9th A",
    wing: "Secondary Wing",
    status: "Active",
    academicYear: "2026–2027",
  },
  {
    id: "tt-5",
    name: "Class 8-A — Middle Wing Schedule",
    className: "8th A",
    wing: "Middle Wing",
    status: "Active",
    academicYear: "2026–2027",
  },
  {
    id: "tt-6",
    name: "Class 12-A (Science Stream) — Master Schedule",
    className: "12th A",
    wing: "Senior Secondary Wing",
    status: "Active",
    academicYear: "2026–2027",
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
  "tt-1": {
    total: 52,
    unassigned: 6,
    subjects: [
      {
        name: "English",
        count: 8,
        color: "text-blue-700 dark:text-blue-300",
        bg: "bg-blue-50 dark:bg-blue-950/40",
        border: "border-blue-200/80 dark:border-blue-800/60",
        dot: "bg-blue-500",
        teacher: "Ms. Ananya Sharma",
      },
      {
        name: "Hindi",
        count: 4,
        color: "text-amber-700 dark:text-amber-300",
        bg: "bg-amber-50 dark:bg-amber-950/40",
        border: "border-amber-200/80 dark:border-amber-800/60",
        dot: "bg-amber-500",
        teacher: "Mr. Rajesh Tiwari",
      },
      {
        name: "Maths",
        count: 8,
        color: "text-indigo-700 dark:text-indigo-300",
        bg: "bg-indigo-50 dark:bg-indigo-950/40",
        border: "border-indigo-200/80 dark:border-indigo-800/60",
        dot: "bg-indigo-500",
        teacher: "Dr. R. Ramanujan",
      },
      {
        name: "Science",
        count: 7,
        color: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-emerald-50 dark:bg-emerald-950/40",
        border: "border-emerald-200/80 dark:border-emerald-800/60",
        dot: "bg-emerald-500",
        teacher: "Dr. Homi Bhabha",
      },
      {
        name: "Social",
        count: 6,
        color: "text-purple-700 dark:text-purple-300",
        bg: "bg-purple-50 dark:bg-purple-950/40",
        border: "border-purple-200/80 dark:border-purple-800/60",
        dot: "bg-purple-500",
        teacher: "Mrs. Sunita Verma",
      },
      {
        name: "Sports",
        count: 6,
        color: "text-orange-700 dark:text-orange-300",
        bg: "bg-orange-50 dark:bg-orange-950/40",
        border: "border-orange-200/80 dark:border-orange-800/60",
        dot: "bg-orange-500",
        teacher: "Coach Major Dhyan",
      },
      {
        name: "Computer",
        count: 4,
        color: "text-cyan-700 dark:text-cyan-300",
        bg: "bg-cyan-50 dark:bg-cyan-950/40",
        border: "border-cyan-200/80 dark:border-cyan-800/60",
        dot: "bg-cyan-500",
        teacher: "Mr. Satya N.",
      },
      {
        name: "Arts",
        count: 3,
        color: "text-pink-700 dark:text-pink-300",
        bg: "bg-pink-50 dark:bg-pink-950/40",
        border: "border-pink-200/80 dark:border-pink-800/60",
        dot: "bg-pink-500",
        teacher: "Ms. Amrita Sher-Gil",
      },
    ],
  },
  "tt-2": {
    total: 52,
    unassigned: 4,
    subjects: [
      { name: "English", count: 8, color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200/80 dark:border-blue-800/60", dot: "bg-blue-500", teacher: "Ms. Ananya Sharma" },
      { name: "Hindi", count: 5, color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200/80 dark:border-amber-800/60", dot: "bg-amber-500", teacher: "Mr. Rajesh Tiwari" },
      { name: "Maths", count: 8, color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50 dark:bg-indigo-950/40", border: "border-indigo-200/80 dark:border-indigo-800/60", dot: "bg-indigo-500", teacher: "Dr. R. Ramanujan" },
      { name: "Science", count: 8, color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200/80 dark:border-emerald-800/60", dot: "bg-emerald-500", teacher: "Dr. Homi Bhabha" },
      { name: "Social", count: 6, color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-200/80 dark:border-purple-800/60", dot: "bg-purple-500", teacher: "Mrs. Sunita Verma" },
      { name: "Sports", count: 6, color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50 dark:bg-orange-950/40", border: "border-orange-200/80 dark:border-orange-800/60", dot: "bg-orange-500", teacher: "Coach Major Dhyan" },
      { name: "Computer", count: 4, color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-50 dark:bg-cyan-950/40", border: "border-cyan-200/80 dark:border-cyan-800/60", dot: "bg-cyan-500", teacher: "Mr. Satya N." },
      { name: "Arts", count: 3, color: "text-pink-700 dark:text-pink-300", bg: "bg-pink-50 dark:bg-pink-950/40", border: "border-pink-200/80 dark:border-pink-800/60", dot: "bg-pink-500", teacher: "Ms. Amrita Sher-Gil" },
    ],
  },
};

export default function TimetablePage({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable2,
  onOpenTimetable3,
  onSignOut,
}: TimetablePageProps) {
  const [selectedTimetableId, setSelectedTimetableId] = useState("tt-1");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Period management state
  const [periods, setPeriods] = useState<PeriodItem[]>(INITIAL_PERIODS);
  const [editingPeriod, setEditingPeriod] = useState<EditingPeriodState | null>(null);

  const selectedTimetable =
    MOCK_TIMETABLES.find((tt) => tt.id === selectedTimetableId) || MOCK_TIMETABLES[0];

  const sectionStatus =
    MOCK_SECTION_STATUS[selectedTimetableId] || MOCK_SECTION_STATUS["tt-1"];

  // Save period with strict Out Time > In Time and continuous chain logic
  const handleSavePeriod = () => {
    if (!editingPeriod) return;
    const { index, startTime, endTime } = editingPeriod;
    const startM = timeToMinutes(startTime);
    const endM = timeToMinutes(endTime);

    // Rule 1: Must be valid format and Out Time must be strictly later than In Time (min +1 min)
    if (startM === null || endM === null || endM <= startM) return;

    const formattedStart = minutesToTime(startM);
    const formattedEnd = minutesToTime(endM);

    setPeriods((prev) => {
      const updated = [...prev];

      // 1. Update target period
      updated[index] = {
        ...updated[index],
        startTime: formattedStart,
        endTime: formattedEnd,
      };

      // 2. Chain backward: If Period N's start time changed (and N > 0)
      if (index > 0) {
        updated[index - 1] = {
          ...updated[index - 1],
          endTime: formattedStart,
        };
        // Protect Period N-1: ensure end time > start time (at minimum +1 min)
        const prevStartM = timeToMinutes(updated[index - 1].startTime);
        if (prevStartM !== null && startM <= prevStartM) {
          updated[index - 1].startTime = minutesToTime(startM - 1);
        }
      }

      // 3. Chain forward: Period N+1 MUST start at Period N's End Time
      if (index + 1 < updated.length) {
        const nextOldEndM = timeToMinutes(updated[index + 1].endTime);
        let nextEndM = nextOldEndM !== null ? nextOldEndM : endM + 30;
        // Protect Period N+1: ensure its end time is at least start time + 1 min
        if (nextEndM <= endM) {
          nextEndM = endM + 1;
        }

        updated[index + 1] = {
          ...updated[index + 1],
          startTime: formattedEnd,
          endTime: minutesToTime(nextEndM),
        };
      }

      return updated;
    });
    setEditingPeriod(null);
  };

  const handleDeletePeriod = (idxToDelete: number) => {
    if (periods.length <= 1) return;
    setPeriods((prev) => {
      // Capture the original timetable time slots
      const originalTimeSlots = prev.map((p) => ({
        startTime: p.startTime,
        endTime: p.endTime,
      }));

      // Filter out the deleted period
      const remaining = prev.filter((_, idx) => idx !== idxToDelete);

      // Re-assign time slots sequentially:
      // The remaining periods shift left into the existing time slots (e.g. VII takes VI's timing),
      // and the last time slot is dropped from the end of the timetable.
      return remaining.map((period, idx) => ({
        ...period,
        startTime: originalTimeSlots[idx].startTime,
        endTime: originalTimeSlots[idx].endTime,
      }));
    });
  };

  const handleAddPeriod = () => {
    const last = periods[periods.length - 1];
    let newStart = "04:30";
    let newEnd = "05:15";

    if (last) {
      newStart = last.endTime;
      const lastEndM = timeToMinutes(last.endTime);
      if (lastEndM !== null) {
        const lastStartM = timeToMinutes(last.startTime);
        const prevDur = lastStartM !== null && lastEndM > lastStartM ? lastEndM - lastStartM : 45;
        newEnd = minutesToTime(lastEndM + prevDur);
      }
    }

    setPeriods((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, startTime: newStart, endTime: newEnd },
    ]);
  };

  const gridTemplate = `100px repeat(${periods.length}, minmax(120px, 1fr))`;

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

            {/* Quick Switch to Time Table 2 */}
            {onOpenTimetable2 && (
              <button
                type="button"
                onClick={onOpenTimetable2}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-800/60 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Time Table 2</span>
              </button>
            )}

            {/* Quick Switch to Time Table 3 */}
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

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-100 p-0.5 ring-1 ring-slate-200/90 dark:ring-slate-700 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain rounded-full mix-blend-multiply"
                />
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">{user.schoolName}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                    {user.schoolCode}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Profile, Theme Toggle & Sign Out */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="icon" />

            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className={`w-7 h-7 rounded-lg ${user.avatarColor} flex items-center justify-center font-bold text-xs`}>
                {user.initials}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user.fullName}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-tight font-medium">{user.roleTitle}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-800 dark:hover:text-rose-200 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 w-full max-w-[1800px] mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* ── HORIZONTAL BAR: TIMETABLE SELECTOR DROPDOWN ── */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-4 flex-wrap relative z-20">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Select Timetable:</span>
            </span>

            {/* Timetable Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs min-w-[280px] sm:min-w-[340px] justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${selectedTimetable.status === "Active" ? "bg-emerald-500" : "bg-amber-400"
                      }`}
                  />
                  <span className="truncate">{selectedTimetable.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${selectedTimetable.status === "Active"
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                      }`}
                  >
                    {selectedTimetable.status}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""
                      }`}
                  />
                </div>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-full min-w-[320px] sm:min-w-[380px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Available Timetables
                  </div>
                  {MOCK_TIMETABLES.map((tt) => {
                    const isSelected = tt.id === selectedTimetableId;
                    return (
                      <button
                        key={tt.id}
                        type="button"
                        onClick={() => {
                          setSelectedTimetableId(tt.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${tt.status === "Active" ? "bg-emerald-500" : "bg-amber-400"
                              }`}
                          />
                          <div className="truncate">
                            <div className="truncate">{tt.name}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {tt.wing} • {tt.academicYear}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${tt.status === "Active"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                              }`}
                          >
                            {tt.status}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Info Badges */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              <span>Wing: {selectedTimetable.wing}</span>
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px]">
              Session: {selectedTimetable.academicYear}
            </span>
          </div>
        </div>

        {/* ── GOOGLE CALENDAR STYLE TIMETABLE GRID CONTAINER ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex-1 min-h-[calc(100vh-200px)] flex flex-col overflow-hidden">
          {/* Calendar Toolbar Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-white dark:bg-slate-900">
            {/* Left: Class Section & Flat Borderless Status Ticker (Notion Editorial Style) */}
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5 shrink-0">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>{selectedTimetable.className || "6th A"}</span>
              </h2>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 shrink-0 hidden sm:block" />

              {/* Flat Borderless Status Ticker */}
              <div className="flex items-center gap-2 text-xs font-sans flex-wrap">
                {sectionStatus.subjects.map((sub) => (
                  <React.Fragment key={sub.name}>
                    <span
                      className="inline-flex items-center gap-1 select-none hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-default"
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
                  className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 select-none cursor-pointer transition-colors group"
                  title="Click to view detailed class assignment status breakdown"
                >
                  <span className="text-slate-400 font-bold">=</span>
                  <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 tabular-nums">
                    {sectionStatus.total}
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    (Total)
                  </span>
                  <Info className="w-3 h-3 text-slate-400 group-hover:text-indigo-500 ml-0.5 transition-colors" />
                </button>
              </div>
            </div>

            {/* Right Action: Add Period */}
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={handleAddPeriod}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Period</span>
              </button>
            </div>
          </div>

          {/* ── GOOGLE CALENDAR GRID ── */}
          <div className="flex-1 overflow-x-auto overflow-y-auto">
            <div className="min-w-[max(920px,100%)] w-full flex flex-col bg-white dark:bg-slate-900 pr-6">
              {/* TOP HEADER ROW: PRECISION CALENDAR SCALE (32px HEIGHT, UNIFIED PLUS JAKARTA SANS) */}
              <div
                className="grid border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-20"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                {/* Top-Left Corner Spacer (Empty 32px Alignment Block) */}
                <div className="h-8 px-2 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none" />

                {/* Period Columns: Times on Gridlines + Centered [ I · 30m ] Pill in Matching Plus Jakarta Sans Font */}
                {periods.map((period, idx) => {
                  const durMins = getDurationMinutes(period.startTime, period.endTime) || 45;
                  const durStr = formatDuration(durMins);

                  return (
                    <div
                      key={period.id}
                      className="h-8 relative border-r border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-900 select-none"
                    >
                      {/* Boundary 0: Start time on Line 0 (Google Calendar scale marker) */}
                      {idx === 0 && (
                        <div
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 px-1.5 py-0.5 bg-white dark:bg-slate-900 text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap rounded select-none pointer-events-none border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                        >
                          {formatCalendarLineTime(periods[0].startTime)}
                        </div>
                      )}

                      {/* Center Interactive Period Pill: Matching font-sans Plus Jakarta Sans */}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingPeriod({
                            index: idx,
                            startTime: period.startTime,
                            endTime: period.endTime,
                          })
                        }
                        title={`Period ${ROMAN_NUMERALS[idx] || idx + 1} (${period.startTime} – ${period.endTime}, ${durStr}) • Click to edit timing or delete`}
                        className="px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/70 border border-slate-200/80 hover:border-indigo-300 dark:border-slate-700/80 dark:hover:border-indigo-700 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:shadow-xs group/btn"
                      >
                        <span className="font-sans font-bold text-xs tracking-wider text-slate-800 dark:text-slate-200 group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-400">
                          {ROMAN_NUMERALS[idx] || idx + 1}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className="text-[10px] font-sans font-semibold text-slate-500 dark:text-slate-400 group-hover/btn:text-indigo-500">
                          {durStr}
                        </span>
                      </button>

                      {/* Boundary idx + 1: End time on Line idx + 1 (Google Calendar scale marker) */}
                      <div
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 px-1.5 py-0.5 bg-white dark:bg-slate-900 text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap rounded select-none pointer-events-none border border-slate-200/80 dark:border-slate-800 shadow-2xs"
                      >
                        {formatCalendarLineTime(period.endTime)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* VERTICAL DAY ROWS (DAYS ON LEFT, FORMAT SIMILAR TO PICTURE) */}
              {CALENDAR_DAYS.map((day) => (
                <div
                  key={day.key}
                  className="grid items-stretch border-b border-slate-200 dark:border-slate-800"
                  style={{ gridTemplateColumns: gridTemplate }}
                >
                  {/* Left Column: Day Label (Days only, no dates) */}
                  <div className="p-3 border-r border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-white dark:bg-slate-900 select-none">
                    <span
                      className={`text-xs font-bold tracking-wider ${day.isCurrent
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-400"
                        }`}
                    >
                      {day.dayName}
                    </span>
                  </div>

                  {/* Period Cells for this Day */}
                  {periods.map((period) => (
                    <div
                      key={`${day.key}-${period.id}`}
                      className="h-20 sm:h-22 border-r border-slate-200 dark:border-slate-800 relative hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── MODAL: EDIT PERIOD TIMING ── */}
      {editingPeriod && (() => {
        const editStartM = timeToMinutes(editingPeriod.startTime);
        const editEndM = timeToMinutes(editingPeriod.endTime);
        const isEditFormatValid = editStartM !== null && editEndM !== null;
        const editDurationM =
          isEditFormatValid && editStartM !== null && editEndM !== null
            ? editEndM - editStartM
            : null;

        // Out time must be strictly later than In time (at minimum +1 min)
        const isOutTimeValid = editDurationM !== null && editDurationM >= 1;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-xs font-sans font-bold tracking-wider shadow-2xs">
                    {ROMAN_NUMERALS[editingPeriod.index] || editingPeriod.index + 1}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                      Edit Period {ROMAN_NUMERALS[editingPeriod.index] || editingPeriod.index + 1}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Configure In/Out times or remove period
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPeriod(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Time Inputs (In Time vs Out Time) */}
              <div className="grid grid-cols-2 gap-3">
                {/* In Time (Start) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    In Time
                  </label>
                  <input
                    type="text"
                    value={editingPeriod.startTime}
                    onChange={(e) =>
                      setEditingPeriod({ ...editingPeriod, startTime: e.target.value })
                    }
                    placeholder="09:00"
                    className="w-full px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                  />
                </div>

                {/* Out Time (End) */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Out Time
                  </label>
                  <input
                    type="text"
                    value={editingPeriod.endTime}
                    onChange={(e) =>
                      setEditingPeriod({ ...editingPeriod, endTime: e.target.value })
                    }
                    placeholder="09:30"
                    className={`w-full px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border text-sm font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 shadow-2xs ${!isOutTimeValid
                      ? "border-rose-400 dark:border-rose-500 focus:ring-rose-500 text-rose-700 dark:text-rose-300 bg-rose-50/30 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-700 focus:ring-indigo-500"
                      }`}
                  />
                </div>
              </div>

              {/* Validation alert only when invalid */}
              {!isEditFormatValid ? (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Invalid format. Please enter HH:MM.</span>
                </div>
              ) : !isOutTimeValid ? (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Out time must be later than In time.</span>
                </div>
              ) : null}

              {/* Modal Action Buttons with Delete Functionality */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {periods.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeletePeriod(editingPeriod.index);
                      setEditingPeriod(null);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Delete Period"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPeriod(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePeriod}
                    disabled={!isOutTimeValid}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${isOutTimeValid
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-600/20"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                      }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── MODAL: DETAILED CLASS SECTION STATUS BREAKDOWN ── */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{selectedTimetable.className || "6th A"} — Schedule Status</span>
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
