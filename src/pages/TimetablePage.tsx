import { useState, useMemo, useCallback } from "react";
import {
  Clock, Copy, AlertTriangle, CheckCircle2, Plus, X, Coffee,
  Edit3, Trash2, Save, Send, RotateCcw, ChevronDown, BarChart2,
  Zap, BookOpen, User, CalendarRange, ArrowRight, Eye, FileEdit,
  FlipHorizontal, Info, TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────

const MOCK_CLASSES = [
  { id: "cls-1", name: "Class 10" },
  { id: "cls-2", name: "Class 11" },
  { id: "cls-3", name: "Class 12" },
  { id: "cls-4", name: "Class 9" },
  { id: "cls-5", name: "Class 8" },
];

const MOCK_SECTIONS: Record<string, { id: string; name: string }[]> = {
  "cls-1": [{ id: "s-10a", name: "A" }, { id: "s-10b", name: "B" }, { id: "s-10c", name: "C" }],
  "cls-2": [{ id: "s-11a", name: "A (Science)" }, { id: "s-11b", name: "B (Commerce)" }],
  "cls-3": [{ id: "s-12a", name: "A (Science)" }, { id: "s-12b", name: "B (Arts)" }],
  "cls-4": [{ id: "s-9a", name: "A" }, { id: "s-9b", name: "B" }],
  "cls-5": [{ id: "s-8a", name: "A" }],
};

const MOCK_SUBJECTS: Record<string, { name: string; code: string; teacher: string; teacherId: string }[]> = {
  "s-12a": [
    { name: "Physics", code: "PHY", teacher: "Mr. Rakesh Sharma", teacherId: "t1" },
    { name: "Chemistry", code: "CHE", teacher: "Ms. Priya Verma", teacherId: "t2" },
    { name: "Mathematics", code: "MAT", teacher: "Mr. Arun Gupta", teacherId: "t3" },
    { name: "English", code: "ENG", teacher: "Ms. Sunita Mishra", teacherId: "t4" },
    { name: "Biology", code: "BIO", teacher: "Ms. Deepa Singh", teacherId: "t5" },
    { name: "Computer Science", code: "CS", teacher: "Mr. Vikram Patel", teacherId: "t6" },
    { name: "Physical Education", code: "PE", teacher: "Mr. Ramesh Yadav", teacherId: "t7" },
    { name: "Hindi", code: "HIN", teacher: "Ms. Richa Tiwari", teacherId: "t8" },
  ],
  "s-10a": [
    { name: "Mathematics", code: "MAT", teacher: "Mr. Arun Gupta", teacherId: "t3" },
    { name: "Science", code: "SCI", teacher: "Ms. Priya Verma", teacherId: "t2" },
    { name: "English", code: "ENG", teacher: "Ms. Sunita Mishra", teacherId: "t4" },
    { name: "Hindi", code: "HIN", teacher: "Ms. Richa Tiwari", teacherId: "t8" },
    { name: "Social Science", code: "SST", teacher: "Mr. Mohan Das", teacherId: "t9" },
    { name: "Sanskrit", code: "SAN", teacher: "Ms. Kavita Joshi", teacherId: "t10" },
    { name: "Computer", code: "COM", teacher: "Mr. Vikram Patel", teacherId: "t6" },
    { name: "Physical Education", code: "PE", teacher: "Mr. Ramesh Yadav", teacherId: "t7" },
  ],
};

const DEFAULT_SUBJECTS = (sectionId: string) =>
  MOCK_SUBJECTS[sectionId] ?? MOCK_SUBJECTS["s-10a"];

const DEFAULT_PERIODS: PeriodDef[] = [
  { period_no: 1, start_time: "08:00", end_time: "08:40", type: "class" },
  { period_no: 2, start_time: "08:40", end_time: "09:20", type: "class" },
  { period_no: 3, start_time: "09:20", end_time: "10:00", type: "class" },
  { period_no: 4, start_time: "10:00", end_time: "10:15", type: "break", label: "Short Break" },
  { period_no: 5, start_time: "10:15", end_time: "10:55", type: "class" },
  { period_no: 6, start_time: "10:55", end_time: "11:35", type: "class" },
  { period_no: 7, start_time: "11:35", end_time: "12:15", type: "class" },
  { period_no: 8, start_time: "12:15", end_time: "12:55", type: "break", label: "Lunch Break" },
  { period_no: 9, start_time: "12:55", end_time: "13:35", type: "class" },
  { period_no: 10, start_time: "13:35", end_time: "14:15", type: "class" },
];

// Prefilled mock timetable for 12A
const MOCK_SLOTS_12A: SlotData[][] = [
  // [dayIndex][periodIndex] → subject name or null
  // Mon
  [
    { subject: "Physics", teacherId: "t1" },
    { subject: "Chemistry", teacherId: "t2" },
    { subject: "Mathematics", teacherId: "t3" },
    null,
    { subject: "English", teacherId: "t4" },
    { subject: "Biology", teacherId: "t5" },
    { subject: "Computer Science", teacherId: "t6" },
    null,
    { subject: "Physical Education", teacherId: "t7" },
    { subject: "Hindi", teacherId: "t8" },
  ],
  // Tue
  [
    { subject: "Mathematics", teacherId: "t3" },
    { subject: "Physics", teacherId: "t1" },
    { subject: "English", teacherId: "t4" },
    null,
    { subject: "Chemistry", teacherId: "t2" },
    { subject: "Hindi", teacherId: "t8" },
    { subject: "Biology", teacherId: "t5" },
    null,
    { subject: "Computer Science", teacherId: "t6" },
    { subject: "Physical Education", teacherId: "t7" },
  ],
  // Wed
  [
    { subject: "Chemistry", teacherId: "t2" },
    { subject: "Biology", teacherId: "t5" },
    { subject: "Hindi", teacherId: "t8" },
    null,
    { subject: "Physics", teacherId: "t1" },
    { subject: "Mathematics", teacherId: "t3" },
    { subject: "English", teacherId: "t4" },
    null,
    { subject: "Chemistry", teacherId: "t2" },
    null,
  ],
  // Thu
  [
    { subject: "English", teacherId: "t4" },
    { subject: "Mathematics", teacherId: "t3" },
    { subject: "Physics", teacherId: "t1" },
    null,
    { subject: "Computer Science", teacherId: "t6" },
    { subject: "Chemistry", teacherId: "t2" },
    { subject: "Hindi", teacherId: "t8" },
    null,
    { subject: "Biology", teacherId: "t5" },
    { subject: "Mathematics", teacherId: "t3" },
  ],
  // Fri
  [
    { subject: "Biology", teacherId: "t5" },
    { subject: "English", teacherId: "t4" },
    { subject: "Computer Science", teacherId: "t6" },
    null,
    { subject: "Mathematics", teacherId: "t3" },
    { subject: "Physics", teacherId: "t1" },
    { subject: "Chemistry", teacherId: "t2" },
    null,
    { subject: "Hindi", teacherId: "t8" },
    null,
  ],
  // Sat
  [
    { subject: "Hindi", teacherId: "t8" },
    { subject: "Computer Science", teacherId: "t6" },
    { subject: "Biology", teacherId: "t5" },
    null,
    { subject: "English", teacherId: "t4" },
    null,
    { subject: "Physics", teacherId: "t1" },
    null,
    { subject: "Mathematics", teacherId: "t3" },
    { subject: "Chemistry", teacherId: "t2" },
  ],
];

// Deliberately put a clash: t3 (Mr. Gupta) also teaches 10A Mon P1
const MOCK_CLASH_ALERTS = [
  { type: "error" as const, message: "Mr. Arun Gupta: Mon P1 → 12A & 10A (teacher clash)" },
  { type: "warning" as const, message: "Ms. Priya Verma: 34 periods/week (approaching limit)" },
];

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface PeriodDef {
  period_no: number;
  start_time: string;
  end_time: string;
  type: "class" | "break";
  label?: string;
}

type SlotData = { subject: string; teacherId: string } | null;

type TimetableStatus = "draft" | "active";

interface TimetableVersion {
  id: string;
  name: string;
  status: TimetableStatus;
  updatedAt: string;
  slots: SlotData[][];
}

// ─────────────────────────────────────────────
// SUBJECT COLOR PALETTE
// ─────────────────────────────────────────────

const COLOR_PAIRS: { bg: string; text: string; border: string; dot: string }[] = [
  { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-700 dark:text-violet-300", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-400" },
  { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-300", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-400" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-400" },
  { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-300", border: "border-rose-200 dark:border-rose-800", dot: "bg-rose-400" },
  { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-300", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-400" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-700 dark:text-cyan-300", border: "border-cyan-200 dark:border-cyan-800", dot: "bg-cyan-400" },
  { bg: "bg-pink-50 dark:bg-pink-950/40", text: "text-pink-700 dark:text-pink-300", border: "border-pink-200 dark:border-pink-800", dot: "bg-pink-400" },
  { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800", dot: "bg-indigo-400" },
  { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-300", border: "border-teal-200 dark:border-teal-800", dot: "bg-teal-400" },
  { bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-800", dot: "bg-orange-400" },
  { bg: "bg-lime-50 dark:bg-lime-950/40", text: "text-lime-700 dark:text-lime-300", border: "border-lime-200 dark:border-lime-800", dot: "bg-lime-400" },
  { bg: "bg-sky-50 dark:bg-sky-950/40", text: "text-sky-700 dark:text-sky-300", border: "border-sky-200 dark:border-sky-800", dot: "bg-sky-400" },
];

const colorCache: Record<string, typeof COLOR_PAIRS[0]> = {};
function subjectColor(name: string) {
  if (!colorCache[name]) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
    colorCache[name] = COLOR_PAIRS[Math.abs(h) % COLOR_PAIRS.length];
  }
  return colorCache[name];
}

const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function TimetablePage() {
  // Selection
  const [selectedClassId, setSelectedClassId] = useState("cls-3");
  const [selectedSectionId, setSelectedSectionId] = useState("s-12a");

  // Period template state
  const [periods, setPeriods] = useState<PeriodDef[]>(DEFAULT_PERIODS);
  const [workingDays, setWorkingDays] = useState([0, 1, 2, 3, 4, 5]); // 0=Mon..5=Sat

  // Timetable versions
  const [versions, setVersions] = useState<TimetableVersion[]>([
    {
      id: "v-active",
      name: "Active Timetable",
      status: "active",
      updatedAt: "Aug 1, 2026",
      slots: MOCK_SLOTS_12A,
    },
    {
      id: "v-draft1",
      name: "Draft — Sept Revision",
      status: "draft",
      updatedAt: "Aug 12, 2026",
      slots: MOCK_SLOTS_12A.map(day =>
        day.map((s, i) => (i % 3 === 0 ? null : s))
      ),
    },
  ]);
  const [activeVersionId, setActiveVersionId] = useState("v-active");

  // Dialogs
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copyTargets, setCopyTargets] = useState<string[]>([]);
  const [newVersionDialogOpen, setNewVersionDialogOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [activateConfirmId, setActivateConfirmId] = useState<string | null>(null);

  // Cell editing
  const [editingCell, setEditingCell] = useState<{ dayIdx: number; periodIdx: number } | null>(null);

  // Subjects for current section
  const subjects = useMemo(() => DEFAULT_SUBJECTS(selectedSectionId), [selectedSectionId]);

  // Current version & slots
  const currentVersion = versions.find(v => v.id === activeVersionId) ?? versions[0];
  const slots: SlotData[][] = currentVersion?.slots ?? [];
  const isDraft = currentVersion?.status === "draft";

  // Class sections
  const classSections = MOCK_SECTIONS[selectedClassId] ?? [];

  // Period class indices (skip breaks)
  const classPeriodIndices = periods
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.type === "class")
    .map(({ i }) => i);

  // Stats
  const totalPeriods = classPeriodIndices.length * workingDays.length;
  const assignedPeriods = useMemo(() => {
    let count = 0;
    for (const di of workingDays) {
      for (const pi of classPeriodIndices) {
        if (slots[di]?.[pi]) count++;
      }
    }
    return count;
  }, [slots, workingDays, classPeriodIndices]);

  const subjectStats = useMemo(() => {
    const map: Record<string, { count: number; teacher: string }> = {};
    for (const sub of subjects) map[sub.name] = { count: 0, teacher: sub.teacher };
    for (const di of workingDays) {
      for (const pi of classPeriodIndices) {
        const s = slots[di]?.[pi];
        if (s && map[s.subject]) map[s.subject].count++;
      }
    }
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [slots, subjects, workingDays, classPeriodIndices]);

  // Teacher workload
  const teacherWorkload = useMemo(() => {
    const map: Record<string, { name: string; count: number }> = {};
    for (const sub of subjects) map[sub.teacherId] = { name: sub.teacher, count: 0 };
    for (const di of workingDays) {
      for (const pi of classPeriodIndices) {
        const s = slots[di]?.[pi];
        if (s && map[s.teacherId]) map[s.teacherId].count++;
      }
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [slots, subjects, workingDays, classPeriodIndices]);

  // Assign a slot
  const assignSlot = useCallback((dayIdx: number, periodIdx: number, subjectName: string, teacherId: string) => {
    setVersions(prev => prev.map(v => {
      if (v.id !== activeVersionId) return v;
      const newSlots = v.slots.map(d => [...d]);
      if (!newSlots[dayIdx]) newSlots[dayIdx] = [];
      newSlots[dayIdx][periodIdx] = { subject: subjectName, teacherId };
      return { ...v, slots: newSlots, updatedAt: "Just now" };
    }));
    setEditingCell(null);
    toast.success(`Assigned ${subjectName}`);
  }, [activeVersionId]);

  const clearSlot = useCallback((dayIdx: number, periodIdx: number) => {
    setVersions(prev => prev.map(v => {
      if (v.id !== activeVersionId) return v;
      const newSlots = v.slots.map(d => [...d]);
      if (!newSlots[dayIdx]) newSlots[dayIdx] = [];
      newSlots[dayIdx][periodIdx] = null;
      return { ...v, slots: newSlots };
    }));
    setEditingCell(null);
  }, [activeVersionId]);

  // Version management
  const createDraft = () => {
    if (!newVersionName.trim()) return;
    const newV: TimetableVersion = {
      id: `v-${Date.now()}`,
      name: newVersionName.trim(),
      status: "draft",
      updatedAt: "Just now",
      slots: currentVersion.slots.map(d => [...d]),
    };
    setVersions(prev => [...prev, newV]);
    setActiveVersionId(newV.id);
    setNewVersionDialogOpen(false);
    setNewVersionName("");
    toast.success("Draft timetable created — editing this draft now");
  };

  const activateVersion = (vId: string) => {
    setVersions(prev => prev.map(v => ({
      ...v,
      status: v.id === vId ? "active" : v.status === "active" ? "draft" : v.status,
    })));
    setActivateConfirmId(null);
    toast.success("Timetable activated!");
  };

  const deleteVersion = (vId: string) => {
    if (versions.length <= 1) { toast.error("Cannot delete the only version"); return; }
    setVersions(prev => prev.filter(v => v.id !== vId));
    if (activeVersionId === vId) setActiveVersionId(versions.find(v => v.id !== vId)!.id);
    toast.success("Version deleted");
  };

  // Period editing
  const addPeriod = () => {
    const last = periods[periods.length - 1];
    const newP: PeriodDef = {
      period_no: periods.length + 1,
      start_time: last?.end_time ?? "08:00",
      end_time: addMins(last?.end_time ?? "08:00", 40),
      type: "class",
    };
    setPeriods(prev => [...prev, newP]);
  };

  const updatePeriod = (i: number, field: keyof PeriodDef, val: string) => {
    setPeriods(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  };

  const removePeriod = (i: number) => {
    setPeriods(prev => prev.filter((_, idx) => idx !== i).map((p, idx) => ({ ...p, period_no: idx + 1 })));
  };

  const toggleDay = (d: number) => {
    setWorkingDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()
    );
  };

  const selectedClass = MOCK_CLASSES.find(c => c.id === selectedClassId);
  const selectedSection = classSections.find(s => s.id === selectedSectionId);
  const pct = totalPeriods > 0 ? Math.round((assignedPeriods / totalPeriods) * 100) : 0;

  return (
    <AppShell>
      <div className="space-y-4 max-w-[1700px]">

        {/* ── PAGE HEADER ──────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="clay-page-header">
            <h1 className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary shadow-md">
                <Clock className="h-4 w-4 text-white" />
              </span>
              Timetable
            </h1>
            <p>Build and manage weekly class schedules</p>
          </div>

          {/* Version switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 cursor-pointer min-w-[200px] justify-between">
                  <span className="flex items-center gap-2 truncate">
                    <span className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      currentVersion?.status === "active" ? "bg-emerald-500" : "bg-amber-400"
                    )} />
                    <span className="truncate text-sm">{currentVersion?.name ?? "Select version"}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72" align="end">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                  Timetable Versions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {versions.map(v => (
                  <DropdownMenuItem
                    key={v.id}
                    className="flex items-center justify-between gap-2 cursor-pointer py-2.5"
                    onSelect={() => setActiveVersionId(v.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn(
                        "h-2 w-2 rounded-full shrink-0 mt-0.5",
                        v.status === "active" ? "bg-emerald-500" : "bg-amber-400"
                      )} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{v.name}</div>
                        <div className="text-[10px] text-muted-foreground">Updated {v.updatedAt}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {v.id === activeVersionId && (
                        <Badge variant="secondary" className="text-[10px] h-4">Viewing</Badge>
                      )}
                      <Badge
                        variant={v.status === "active" ? "default" : "secondary"}
                        className={cn(
                          "text-[10px] h-4",
                          v.status === "active" && "bg-emerald-500 text-white"
                        )}
                      >
                        {v.status}
                      </Badge>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 cursor-pointer text-primary"
                  onSelect={() => setNewVersionDialogOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> New draft version
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Version actions */}
            {isDraft && (
              <Button
                size="sm"
                className="gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setActivateConfirmId(currentVersion?.id ?? null)}
              >
                <Send className="h-3.5 w-3.5" /> Activate
              </Button>
            )}
            {!isDraft && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 cursor-pointer"
                onClick={() => {
                  setNewVersionName("Draft — " + new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }));
                  setNewVersionDialogOpen(true);
                }}
              >
                <FileEdit className="h-3.5 w-3.5" /> Create Draft
              </Button>
            )}
          </div>
        </div>

        {/* ── STATUS BAR (draft warning / active indicator) ── */}
        {isDraft && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5 flex items-center gap-3">
            <Edit3 className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Editing draft: {currentVersion?.name}
              </span>
              <span className="text-xs text-amber-600 dark:text-amber-400 ml-2">
                Changes saved automatically. Activate when ready to publish.
              </span>
            </div>
            <Button
              size="sm"
              className="gap-1.5 cursor-pointer bg-amber-500 hover:bg-amber-600 text-white shrink-0"
              onClick={() => setActivateConfirmId(currentVersion?.id ?? null)}
            >
              <Send className="h-3.5 w-3.5" /> Activate
            </Button>
          </div>
        )}

        {/* ── CLASS / SECTION SELECTOR BAR ────────────────── */}
        <div className="rounded-xl border bg-card px-4 py-3 shadow-sm flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium whitespace-nowrap text-muted-foreground">Class</Label>
            <Select value={selectedClassId} onValueChange={v => {
              setSelectedClassId(v);
              const secs = MOCK_SECTIONS[v] ?? [];
              if (secs.length > 0) setSelectedSectionId(secs[0].id);
            }}>
              <SelectTrigger className="w-[140px] clay-input h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOCK_CLASSES.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex items-center gap-1.5 flex-wrap">
            <Label className="text-sm font-medium whitespace-nowrap text-muted-foreground">Section</Label>
            {classSections.map(sec => (
              <button
                key={sec.id}
                onClick={() => setSelectedSectionId(sec.id)}
                className={cn(
                  "px-3 py-1 text-sm rounded-xl border transition-all cursor-pointer font-medium",
                  selectedSectionId === sec.id
                    ? "bg-gradient-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {sec.name}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Completion pill */}
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium",
              pct === 100
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : pct > 60
                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
            )}>
              {pct === 100 ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
              {pct}% filled
            </div>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 cursor-pointer"
              onClick={() => setCopyDialogOpen(true)}
            >
              <Copy className="h-3.5 w-3.5" /> Copy periods to…
            </Button>
          </div>
        </div>

        {/* ── MAIN 3-PANEL LAYOUT ─────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_272px] gap-4 items-start">

          {/* ════════════════════════════════════════════════
              LEFT PANEL — Period Structure
          ════════════════════════════════════════════════ */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-violet-500" />
                Period Structure
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Shared by all sections of {selectedClass?.name}
              </p>
            </div>

            <ScrollArea className="h-[calc(100vh-330px)] min-h-[440px]">
              <div className="p-3 space-y-2.5">
                {/* Working days */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Working Days</Label>
                  <div className="flex gap-1">
                    {DAY_SHORT.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => toggleDay(i)}
                        className={cn(
                          "flex-1 text-[11px] py-1.5 rounded-lg border transition-all cursor-pointer font-medium",
                          workingDays.includes(i)
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                        )}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Period list */}
                <div className="space-y-1.5">
                  {periods.map((period, idx) => (
                    <PeriodRow
                      key={idx}
                      period={period}
                      idx={idx}
                      onUpdate={(f, v) => updatePeriod(idx, f, v)}
                      onRemove={() => removePeriod(idx)}
                      onToggleType={() => {
                        updatePeriod(idx, "type", period.type === "class" ? "break" : "class");
                        if (period.type === "class") updatePeriod(idx, "label", "Break");
                      }}
                    />
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-1.5 cursor-pointer border-dashed"
                  onClick={addPeriod}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Period
                </Button>
              </div>
            </ScrollArea>
          </div>

          {/* ════════════════════════════════════════════════
              CENTER PANEL — Timetable Grid
          ════════════════════════════════════════════════ */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  {selectedClass?.name} — {selectedSection?.name}
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Click any cell to assign · Click filled cell to change
                </p>
              </div>
              {!isDraft && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <Eye className="h-3.5 w-3.5" />
                  View only (active)
                </div>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-330px)] min-h-[440px]">
              <div className="p-3 overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: 640 }}>
                  <thead>
                    <tr>
                      <th className="text-[11px] font-semibold text-muted-foreground p-2 text-left w-[68px] sticky left-0 bg-card z-10 border-b border-border">
                        Period
                      </th>
                      {workingDays.map(d => (
                        <th key={d} className="text-[11px] font-semibold text-muted-foreground p-2 text-center border-b border-border">
                          <div className="flex flex-col items-center">
                            <span className="hidden sm:inline">{DAY_FULL[d]}</span>
                            <span className="sm:hidden">{DAY_SHORT[d]}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period, pIdx) => {
                      if (period.type === "break") {
                        return (
                          <tr key={pIdx}>
                            <td colSpan={workingDays.length + 1} className="py-1 px-2">
                              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                                <Coffee className="h-3 w-3 text-amber-500 shrink-0" />
                                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                                  {period.label || "Break"} · {period.start_time}–{period.end_time}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={pIdx} className="group">
                          <td className="p-1 sticky left-0 bg-card z-10 border-b border-border/40">
                            <div className="text-center py-1">
                              <div className="text-[10px] font-bold text-muted-foreground">P{period.period_no}</div>
                              <div className="text-[9px] text-muted-foreground/70 leading-tight">
                                {period.start_time}
                              </div>
                              <div className="text-[9px] text-muted-foreground/70 leading-tight">
                                {period.end_time}
                              </div>
                            </div>
                          </td>
                          {workingDays.map(dayIdx => {
                            const slot = slots[dayIdx]?.[pIdx] ?? null;
                            const isEditing = editingCell?.dayIdx === dayIdx && editingCell?.periodIdx === pIdx;
                            return (
                              <td key={dayIdx} className="p-0.5 border-b border-border/40">
                                <GridCell
                                  slot={slot}
                                  isEditing={isEditing}
                                  isReadOnly={!isDraft}
                                  subjects={subjects}
                                  onOpen={() => isDraft && setEditingCell({ dayIdx, periodIdx: pIdx })}
                                  onClose={() => setEditingCell(null)}
                                  onAssign={(name, tid) => assignSlot(dayIdx, pIdx, name, tid)}
                                  onClear={() => clearSlot(dayIdx, pIdx)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ScrollArea>
          </div>

          {/* ════════════════════════════════════════════════
              RIGHT PANEL — Stats + Alerts
          ════════════════════════════════════════════════ */}
          <div className="space-y-4">

            {/* Section Stats */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <BarChart2 className="h-3.5 w-3.5 text-emerald-500" />
                  {selectedClass?.name}{selectedSection?.name ? `-${selectedSection.name}` : ""} Status
                </h2>
              </div>
              <div className="p-3 space-y-3">
                {/* Summary pills */}
                <div className="grid grid-cols-3 gap-1.5">
                  <StatPill label="Total" value={totalPeriods} />
                  <StatPill label="Filled" value={assignedPeriods} color="emerald" />
                  <StatPill label="Vacant" value={totalPeriods - assignedPeriods} color={totalPeriods - assignedPeriods > 0 ? "amber" : "emerald"} />
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground font-medium">Completion</span>
                    <span className={cn("text-[10px] font-bold", pct === 100 ? "text-emerald-600" : pct > 60 ? "text-blue-600" : "text-amber-600")}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted/60 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        pct === 100 ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-violet-500 to-purple-400"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <Separator />

                {/* Subject breakdown */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Subjects
                  </Label>
                  <ScrollArea className="max-h-[200px]">
                    <div className="space-y-1 pr-1">
                      {subjectStats.map(([name, stat]) => {
                        const c = subjectColor(name);
                        const hasZero = stat.count === 0;
                        return (
                          <div
                            key={name}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all",
                              hasZero
                                ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20"
                                : `${c.border} ${c.bg}`
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", hasZero ? "bg-red-400" : c.dot)} />
                            <div className="flex-1 min-w-0">
                              <div className={cn("text-[11px] font-semibold truncate", hasZero ? "text-red-600 dark:text-red-400" : c.text)}>
                                {name}
                              </div>
                              <div className="text-[9px] text-muted-foreground truncate">{stat.teacher}</div>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold shrink-0 px-1.5 py-0.5 rounded-md",
                              hasZero
                                ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
                                : "bg-white/60 dark:bg-black/20 " + c.text
                            )}>
                              {stat.count}×
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                {/* Teacher workload */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" /> Teacher Load (this section)
                  </Label>
                  <div className="space-y-1">
                    {teacherWorkload.map(({ name, count }) => {
                      const pctLoad = totalPeriods > 0 ? Math.round((count / totalPeriods) * 100) : 0;
                      const isHigh = count > 14;
                      return (
                        <div key={name} className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground truncate flex-1">{name}</span>
                            <span className={cn("text-[10px] font-semibold ml-1 shrink-0", isHigh ? "text-amber-600" : "text-foreground")}>
                              {count} per.
                              {isHigh && <AlertTriangle className="h-2.5 w-2.5 inline ml-0.5 text-amber-500" />}
                            </span>
                          </div>
                          <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", isHigh ? "bg-amber-400" : "bg-violet-400")}
                              style={{ width: `${pctLoad}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Global Alerts */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                  Global Alerts
                  {MOCK_CLASH_ALERTS.length > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-4 ml-auto">
                      {MOCK_CLASH_ALERTS.length}
                    </Badge>
                  )}
                </h2>
              </div>
              <div className="p-3 space-y-1.5">
                {MOCK_CLASH_ALERTS.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 py-2">
                    <CheckCircle2 className="h-4 w-4" /> No conflicts detected
                  </div>
                ) : (
                  MOCK_CLASH_ALERTS.map((a, i) => (
                    <div
                      key={i}
                      className={cn(
                        "text-[11px] p-2 rounded-lg border leading-relaxed",
                        a.type === "error"
                          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                          : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                      )}
                    >
                      <div className="flex items-start gap-1.5">
                        {a.type === "error"
                          ? <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                          : <Info className="h-3 w-3 shrink-0 mt-0.5" />
                        }
                        {a.message}
                      </div>
                    </div>
                  ))
                )}
                <p className="text-[10px] text-muted-foreground pt-1">
                  School-wide clash detection active
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── COPY PERIODS DIALOG ──────────────────────── */}
      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Copy Period Structure</DialogTitle>
            <DialogDescription>
              Apply {selectedClass?.name}'s period timings to other classes. This overwrites their existing period templates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm">Select classes</Label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-6 cursor-pointer"
                onClick={() => {
                  const others = MOCK_CLASSES.filter(c => c.id !== selectedClassId).map(c => c.id);
                  setCopyTargets(copyTargets.length === others.length ? [] : others);
                }}
              >
                {copyTargets.length === MOCK_CLASSES.length - 1 ? "Deselect all" : "Select all"}
              </Button>
            </div>
            <div className="space-y-1">
              {MOCK_CLASSES.filter(c => c.id !== selectedClassId).map(c => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={copyTargets.includes(c.id)}
                    onCheckedChange={checked =>
                      setCopyTargets(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))
                    }
                  />
                  <span className="text-sm">{c.name}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button
              disabled={copyTargets.length === 0}
              className="gap-1.5 cursor-pointer"
              onClick={() => {
                toast.success(`Period structure copied to ${copyTargets.length} class(es)`);
                setCopyDialogOpen(false);
                setCopyTargets([]);
              }}
            >
              <Copy className="h-4 w-4" /> Copy to {copyTargets.length} class{copyTargets.length !== 1 ? "es" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── NEW DRAFT DIALOG ─────────────────────────── */}
      <Dialog open={newVersionDialogOpen} onOpenChange={setNewVersionDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Draft Version</DialogTitle>
            <DialogDescription>
              A draft copies the current timetable. Edit freely and activate when ready.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label className="text-sm">Draft name</Label>
            <Input
              placeholder="e.g. Draft — September revision"
              value={newVersionName}
              onChange={e => setNewVersionName(e.target.value)}
              className="clay-input"
              onKeyDown={e => e.key === "Enter" && createDraft()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewVersionDialogOpen(false)} className="cursor-pointer">Cancel</Button>
            <Button
              disabled={!newVersionName.trim()}
              className="gap-1.5 cursor-pointer"
              onClick={createDraft}
            >
              <FileEdit className="h-4 w-4" /> Create Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ACTIVATE CONFIRM DIALOG ──────────────────── */}
      <Dialog open={!!activateConfirmId} onOpenChange={open => !open && setActivateConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Activate Timetable?</DialogTitle>
            <DialogDescription>
              This will become the active timetable. The previously active version will become a draft.
              Teachers and students will see this schedule.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateConfirmId(null)} className="cursor-pointer">Cancel</Button>
            <Button
              className="gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => activateVersion(activateConfirmId!)}
            >
              <CheckCircle2 className="h-4 w-4" /> Yes, Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

// ─────────────────────────────────────────────
// PERIOD ROW COMPONENT
// ─────────────────────────────────────────────

function PeriodRow({
  period, idx, onUpdate, onRemove, onToggleType,
}: {
  period: PeriodDef;
  idx: number;
  onUpdate: (f: keyof PeriodDef, v: string) => void;
  onRemove: () => void;
  onToggleType: () => void;
}) {
  const isBreak = period.type === "break";
  return (
    <div className={cn(
      "rounded-xl border p-2 space-y-1.5 transition-all",
      isBreak
        ? "bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/40"
        : "bg-card border-border hover:border-violet-200 dark:hover:border-violet-800"
    )}>
      <div className="flex items-center gap-1.5">
        {isBreak
          ? <Coffee className="h-3 w-3 text-amber-500 shrink-0" />
          : <span className="text-[10px] font-bold text-muted-foreground w-4 text-center shrink-0">P{period.period_no}</span>
        }
        <Input
          type="time"
          value={period.start_time}
          onChange={e => onUpdate("start_time", e.target.value)}
          className="h-7 text-[11px] px-1.5 clay-input flex-1"
        />
        <span className="text-[10px] text-muted-foreground">–</span>
        <Input
          type="time"
          value={period.end_time}
          onChange={e => onUpdate("end_time", e.target.value)}
          className="h-7 text-[11px] px-1.5 clay-input flex-1"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onToggleType}
              className="cursor-pointer text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
            >
              {isBreak ? <Clock className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {isBreak ? "Convert to class period" : "Convert to break"}
          </TooltipContent>
        </Tooltip>
        <button
          onClick={onRemove}
          className="cursor-pointer text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors shrink-0"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {isBreak && (
        <Input
          value={period.label ?? ""}
          onChange={e => onUpdate("label", e.target.value)}
          placeholder="Break label…"
          className="h-6 text-[11px] px-2 clay-input"
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// GRID CELL COMPONENT
// ─────────────────────────────────────────────

function GridCell({
  slot, isEditing, isReadOnly, subjects,
  onOpen, onClose, onAssign, onClear,
}: {
  slot: SlotData;
  isEditing: boolean;
  isReadOnly: boolean;
  subjects: { name: string; code: string; teacher: string; teacherId: string }[];
  onOpen: () => void;
  onClose: () => void;
  onAssign: (name: string, teacherId: string) => void;
  onClear: () => void;
}) {
  const color = slot ? subjectColor(slot.subject) : null;
  const teacher = slot ? subjects.find(s => s.teacherId === slot.teacherId) : null;

  if (isEditing) {
    return (
      <div className="rounded-xl border-2 border-primary/40 bg-card shadow-lg p-1.5 z-20 relative min-w-[120px]">
        <div className="space-y-0.5 max-h-[220px] overflow-y-auto">
          {slot && (
            <button
              onClick={onClear}
              className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:opacity-80 mb-1 font-medium"
            >
              ✕ Clear this period
            </button>
          )}
          {subjects.map(sub => {
            const c = subjectColor(sub.name);
            const isSelected = slot?.subject === sub.name;
            return (
              <button
                key={sub.name}
                onClick={() => onAssign(sub.name, sub.teacherId)}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all border",
                  c.bg, c.text, c.border,
                  "hover:opacity-80",
                  isSelected && "ring-2 ring-primary/50 ring-offset-0"
                )}
              >
                <div className="font-semibold">{sub.code} — {sub.name}</div>
                <div className="text-[9px] opacity-70">{sub.teacher}</div>
              </button>
            );
          })}
          <button
            onClick={onClose}
            className="w-full text-center text-[10px] text-muted-foreground py-1 hover:text-foreground cursor-pointer mt-1"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (!slot) {
    return (
      <button
        onClick={onOpen}
        disabled={isReadOnly}
        className={cn(
          "w-full min-h-[54px] rounded-xl border border-dashed flex items-center justify-center transition-all group",
          isReadOnly
            ? "border-border/30 cursor-default"
            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
        )}
      >
        {!isReadOnly && (
          <Plus className="h-3.5 w-3.5 text-muted-foreground/25 group-hover:text-primary/40 transition-colors" />
        )}
      </button>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onOpen}
          disabled={isReadOnly}
          className={cn(
            "w-full min-h-[54px] rounded-xl border p-1.5 text-left transition-all",
            color?.bg, color?.border,
            isReadOnly ? "cursor-default" : "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99]"
          )}
        >
          <div className={cn("text-[11px] font-bold leading-tight truncate", color?.text)}>
            {subjects.find(s => s.name === slot.subject)?.code ?? slot.subject.slice(0, 3).toUpperCase()}
          </div>
          <div className="text-[9px] text-muted-foreground truncate mt-0.5">
            {teacher?.teacher ?? "No teacher"}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[200px]">
        <div className="space-y-0.5">
          <div className="font-semibold text-xs">{slot.subject}</div>
          <div className="text-[11px] text-muted-foreground">{teacher?.teacher ?? "No teacher assigned"}</div>
          {!isReadOnly && <div className="text-[10px] text-primary/70 mt-1">Click to change</div>}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────
// STAT PILL
// ─────────────────────────────────────────────

function StatPill({ label, value, color }: { label: string; value: number; color?: "emerald" | "amber" }) {
  return (
    <div className={cn(
      "text-center p-2 rounded-xl border",
      color === "emerald" && "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
      color === "amber" && value > 0 && "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
      (!color || (color === "amber" && value === 0)) && "bg-muted/30 border-border",
    )}>
      <div className={cn(
        "text-xl font-bold leading-none",
        color === "emerald" ? "text-emerald-600" : color === "amber" && value > 0 ? "text-amber-600" : "text-foreground"
      )}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────

function addMins(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const t = h * 60 + m + mins;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
