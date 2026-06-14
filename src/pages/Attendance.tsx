import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import {
  AttendanceFilterBar,
  type WingOption,
  type ClassOption,
  type SectionOption,
  type SortOption,
  type StatusFilter,
  type ViewMode,
} from "@/components/attendance/AttendanceFilterBar";
import {
  AttendanceListView,
  type Student,
  type AttendanceStatus,
  type DateColumn,
} from "@/components/attendance/AttendanceListView";
import { AttendanceGridView } from "@/components/attendance/AttendanceGridView";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";
import { useAuth } from "@/contexts/AuthContext";
import {
  useWings,
  useClasses,
  useSections,
  useStudents,
  useAttendanceMonth,
  useMarkAttendance,
  useEditAttendance,
  useMyClassAssignment,
  useCoordinatorAssignment,
} from "@/hooks/useAttendance";
import {
  getCurrentAcademicYear,
} from "@/integrations/supabase/queries/attendance";
import { BookOpen, Building2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

// ─── Role helpers ─────────────────────────────────────────────────────────────
const CAN_MARK = new Set(["class_teacher", "coordinator", "principal", "admin", "super_admin"]);

export default function Attendance() {
  const { role, user, school } = useAuth();
  const [searchParams] = useSearchParams();

  // ─── Filter state ────────────────────────────────────────────────────────────
  const [activeWing, setActiveWing] = useState("all");
  const [activeClass, setActiveClass] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [activeDate, setActiveDate] = useState(new Date());
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null } | null>(null);
  const [activeStatuses, setActiveStatuses] = useState<StatusFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name_asc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // ─── Editing state ────────────────────────────────────────────────────────────
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, AttendanceStatus>>({});

  // ─── Dual-role scope toggle ─────────────────────────────────────────────────
  const [dualScope, setDualScope] = useState<"my_class" | "my_wing">(() => {
    return (localStorage.getItem("attendance_scope") as "my_class" | "my_wing") ?? "my_wing";
  });

  // ─── Role flags ──────────────────────────────────────────────────────────────
  const isCoordinator = role === "coordinator";
  const isClassTeacher = role === "class_teacher";
  const isClassLocked = isClassTeacher && !isCoordinator;
  const canMark = CAN_MARK.has(role ?? "");
  const isDualRole = isClassTeacher && isCoordinator;

  // ─── Data queries ────────────────────────────────────────────────────────────
  const schoolId = school?.id ?? "";
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);

  // Resolve active academic year once we have schoolId
  useEffect(() => {
    if (!schoolId) return;
    getCurrentAcademicYear(schoolId).then((id) => setAcademicYearId(id));
  }, [schoolId]);

  const { data: allWings = [] } = useWings(schoolId);
  const { data: wingClasses = [] } = useClasses(
    schoolId,
    activeWing === "all" ? null : activeWing === "unassigned" ? "unassigned" : activeWing
  );
  const { data: classSections = [] } = useSections(activeClass);
  const { data: students = [] } = useStudents(activeClass, activeSection);

  const viewYear = activeDate.getFullYear();
  const viewMonth = activeDate.getMonth();
  const { data: monthAttendance = [] } = useAttendanceMonth(
    activeClass,
    activeSection,
    viewYear,
    viewMonth,
    schoolId
  );

  const { data: classAssignment } = useMyClassAssignment(
    user?.id ?? "",
    academicYearId ?? ""
  );
  // Also load coordinator assignment with schoolId available
  const { data: coordAssignment } = useCoordinatorAssignment(user?.id ?? "", schoolId);

  const markMutation = useMarkAttendance();
  const editMutation = useEditAttendance();

  // ─── Role-based pre-fill ────────────────────────────────────────────────────
  useEffect(() => {
    if (!schoolId) return;
    if (activeClass && activeSection) return;

    if (isClassLocked && classAssignment) {
      setActiveClass(classAssignment.classId);
      return;
    }
    if (isCoordinator && !isClassTeacher && coordAssignment) {
      const wing = allWings.find((w) => w.id === coordAssignment.wingId);
      if (wing) setActiveWing(wing.id);
    }
  }, [schoolId, isClassLocked, isCoordinator, classAssignment, coordAssignment, allWings]);

  useEffect(() => {
    if (isClassLocked && classAssignment && activeClass === classAssignment.classId && !activeSection) {
      setActiveSection(classAssignment.sectionId);
    }
  }, [activeClass, classAssignment, isClassLocked]);

  useEffect(() => {
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const wingId = searchParams.get("wingId");
    if (classId) setActiveClass(classId);
    if (sectionId) setActiveSection(sectionId);
    if (wingId) setActiveWing(wingId);
  }, [searchParams]);

  // Persist preferences
  useEffect(() => { localStorage.setItem("attendance_scope", dualScope); }, [dualScope]);
  useEffect(() => { localStorage.setItem("attendance_sort", sortBy); }, [sortBy]);
  useEffect(() => {
    const saved = localStorage.getItem("attendance_sort") as SortOption | null;
    if (saved) setSortBy(saved);
  }, []);

  const handleClassChange = useCallback((classId: string) => {
    setActiveClass(classId);
    setActiveSection("");
  }, []);

  // ─── Transform data ───────────────────────────────────────────────────────────
  const wingOptions: WingOption[] = useMemo(
    () => allWings.map((w) => ({ id: w.id, name: w.name, display_order: w.display_order ?? 0 })),
    [allWings]
  );
  const classOptions: ClassOption[] = useMemo(
    () => wingClasses.map((c) => ({
      id: c.id,
      name: c.name ?? "",
      wing_id: c.wing_id,
      display_order: c.display_order ?? 0,
    })),
    [wingClasses]
  );
  const sectionOptions: SectionOption[] = useMemo(
    () => classSections.map((s) => ({ id: s.id, name: s.name, class_id: s.class_id })),
    [classSections]
  );
  const uiStudents: Student[] = useMemo(
    () => students.map((s) => ({
      id: s.id,
      roll_no: s.roll_no,
      full_name: s.full_name,
      fathers_name: s.father_name ?? null,
    })),
    [students]
  );

  // Map: date → { studentId → status }
  const attendanceByDate = useMemo(() => {
    const map: Record<string, Record<string, AttendanceStatus>> = {};
    for (const row of monthAttendance) {
      map[row.date] = {};
      for (const rec of row.attendance_records ?? []) {
        map[row.date][rec.student_id] = rec.status as AttendanceStatus;
      }
    }
    return map;
  }, [monthAttendance]);

  const dateColumns: DateColumn[] = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isToday = dateStr === today;

      const studentStatuses: Record<string, AttendanceStatus> = {};
      for (const s of students) {
        if (editingDate === dateStr && pendingStatuses[s.id] !== undefined) {
          studentStatuses[s.id] = pendingStatuses[s.id];
        } else {
          studentStatuses[s.id] = (attendanceByDate[dateStr]?.[s.id] ?? null) as AttendanceStatus;
        }
      }

      const markedCount = Object.values(studentStatuses).filter((v) => v !== null).length;
      const hasRecords = markedCount > 0;

      return {
        date: dateStr,
        status: hasRecords ? ("present" as AttendanceStatus) : null,
        studentStatuses,
        isToday,
        markedCount,
        totalCount: students.length,
      };
    });
  }, [viewYear, viewMonth, monthAttendance, students, editingDate, pendingStatuses, attendanceByDate]);

  const gridDateColumn = dateColumns.find(
    (c) => c.date === format(activeDate, "yyyy-MM-dd")
  ) ?? null;

  const filteredStudents = useMemo(() => {
    let result = uiStudents;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.roll_no.toLowerCase().includes(q) ||
          s.full_name.toLowerCase().includes(q) ||
          (s.fathers_name?.toLowerCase().includes(q) ?? false)
      );
    }
    return [...result].sort((a, b) => {
      if (sortBy === "name_asc") return a.full_name.localeCompare(b.full_name);
      if (sortBy === "name_desc") return b.full_name.localeCompare(a.full_name);
      if (sortBy === "roll_asc") return a.roll_no.localeCompare(b.roll_no);
      if (sortBy === "roll_desc") return b.roll_no.localeCompare(a.roll_no);
      return 0;
    });
  }, [uiStudents, searchQuery, sortBy]);

  const markedDateCount = dateColumns.filter((c) => c.markedCount > 0).length;

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleStatusToggle = useCallback((status: StatusFilter) => {
    setActiveStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  }, []);

  const handleMarkDate = useCallback((date: string) => {
    const initial: Record<string, AttendanceStatus> = {};
    students.forEach((s) => { initial[s.id] = null; });
    setPendingStatuses(initial);
    setEditingDate(date);
  }, [students]);

  const handleEditDate = useCallback((date: string) => {
    const existing = attendanceByDate[date];
    if (existing) {
      setPendingStatuses({ ...existing });
    } else {
      const initial: Record<string, AttendanceStatus> = {};
      students.forEach((s) => { initial[s.id] = null; });
      setPendingStatuses(initial);
    }
    setEditingDate(date);
  }, [attendanceByDate, students]);

  const handleSaveDate = useCallback(
    async (date: string, statuses: Record<string, AttendanceStatus>) => {
      if (!activeClass || !activeSection || !schoolId || !user?.id) return;

      const records = Object.entries(statuses)
        .filter(([, s]) => s !== null)
        .map(([studentId, status]) => ({ studentId, status: status as AttendanceStatus }));

      const present = records.filter((r) => r.status === "present").length;
      const absent = records.filter((r) => r.status === "absent").length;
      const leave = records.filter((r) => r.status === "leave").length;

      try {
        // Resolve academic year
        const academicYearId = await getCurrentAcademicYear(schoolId);
        if (!academicYearId) {
          toast.error("No active academic year found. Please contact the school admin.");
          return;
        }

        const existing = monthAttendance.find((a) => a.date === date);
        if (existing) {
          await editMutation.mutateAsync({
            attendanceId: existing.id,
            classId: activeClass,
            sectionId: activeSection,
            date,
            records,
          });
        } else {
          await markMutation.mutateAsync({
            classId: activeClass,
            sectionId: activeSection,
            schoolId,
            academicYearId,
            date,
            markedBy: user.id,
            records,
          });
        }

        toast.success(
          `Saved — ${records.length} students: ${present} Present, ${absent} Absent${leave > 0 ? `, ${leave} Leave` : ""}`
        );
      } catch (err) {
        toast.error("Failed to save attendance. Please try again.");
        console.error(err);
      } finally {
        setEditingDate(null);
        setPendingStatuses({});
      }
    },
    [activeClass, activeSection, schoolId, user, monthAttendance, markMutation, editMutation]
  );

  const handleCancelDate = useCallback(() => {
    setEditingDate(null);
    setPendingStatuses({});
  }, []);

  const handleCellClick = useCallback((studentId: string, date: string) => {
    if (editingDate !== date) return;
    setPendingStatuses((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  }, [editingDate]);

  const handleCellDoubleClick = useCallback((studentId: string, date: string) => {
    if (editingDate !== date) return;
    setPendingStatuses((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "leave" ? null : "leave",
    }));
  }, [editingDate]);

  const handleBulkMark = useCallback(
    (date: string, status: "present" | "absent" | "blank") => {
      const val: AttendanceStatus = status === "blank" ? null : status;
      const updated: Record<string, AttendanceStatus> = {};
      students.forEach((s) => { updated[s.id] = val; });
      setPendingStatuses(updated);
    },
    [students]
  );

  const handleBackToMyClass = useCallback(() => {
    if (classAssignment) {
      setActiveWing(classAssignment.wingId ?? "all");
      setActiveClass(classAssignment.classId);
      setActiveSection(classAssignment.sectionId);
    }
  }, [classAssignment]);

  const handleWingChange = useCallback((wingId: string) => {
    setActiveWing(wingId);
    setActiveClass("");
    setActiveSection("");
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────────
  const lockedClassName = isClassLocked ? classAssignment?.className : undefined;
  const lockedSectionName = isClassLocked ? classAssignment?.sectionName : undefined;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page header */}
        <div className="clay-page-header">
          <h1 className="text-2xl sm:text-3xl font-bold">Attendance Register</h1>
          {role && (
            <Badge variant="secondary" className="mt-1 capitalize">
              {role.replace("_", " ")}
            </Badge>
          )}
        </div>

        {/* Dual-role scope toggle */}
        {isDualRole && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Scope:</span>
            <ToggleGroup
              type="single"
              value={dualScope}
              onValueChange={(v) => v && setDualScope(v as "my_class" | "my_wing")}
            >
              <Toggle value="my_class" className="text-xs px-3 py-1.5 gap-1.5 cursor-pointer">
                <BookOpen className="h-3.5 w-3.5" />
                My Class: {classAssignment?.className ?? "—"} {classAssignment?.sectionName}
              </Toggle>
              <Toggle value="my_wing" className="text-xs px-3 py-1.5 gap-1.5 cursor-pointer">
                <Building2 className="h-3.5 w-3.5" />
                My Wing: {coordAssignment?.wingName ?? "—"}
              </Toggle>
            </ToggleGroup>
          </div>
        )}

        {/* Filter bar */}
        <AttendanceFilterBar
          wings={wingOptions}
          classes={classOptions}
          sections={sectionOptions}
          activeWing={activeWing}
          activeClass={activeClass}
          activeSection={activeSection}
          activeDate={activeDate}
          dateRange={dateRange}
          activeStatuses={activeStatuses}
          searchQuery={searchQuery}
          sortBy={sortBy}
          viewMode={viewMode}
          isRangeMode={isRangeMode}
          isClassLocked={isClassLocked}
          lockedClassName={lockedClassName}
          lockedSectionName={lockedSectionName}
          onWingChange={handleWingChange}
          onClassChange={handleClassChange}
          onSectionChange={setActiveSection}
          onDateChange={setActiveDate}
          onRangeToggle={setIsRangeMode}
          onRangeChange={setDateRange}
          onStatusToggle={handleStatusToggle}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          onViewChange={setViewMode}
          onBackToMyClass={handleBackToMyClass}
        />

        {/* Empty state */}
        {!activeClass && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-base">Select a class and section to view attendance.</p>
          </div>
        )}

        {/* Main content */}
        {activeClass && (
          viewMode === "list" ? (
            <AttendanceListView
              students={filteredStudents}
              dateColumns={dateColumns}
              isRangeMode={isRangeMode}
              canMark={canMark}
              isCoordinator={isCoordinator}
              onMarkDate={handleMarkDate}
              onEditDate={handleEditDate}
              onSaveDate={handleSaveDate}
              onCancelDate={handleCancelDate}
              onCellClick={handleCellClick}
              onCellDoubleClick={handleCellDoubleClick}
              onBulkMark={handleBulkMark}
              editingDate={editingDate}
              pendingStatuses={pendingStatuses}
              markedDateCount={markedDateCount}
            />
          ) : (
            <AttendanceGridView
              students={filteredStudents}
              dateColumn={gridDateColumn}
              canMark={canMark}
              isCoordinator={isCoordinator}
              onMarkDate={handleMarkDate}
              onEditDate={handleEditDate}
              onSaveDate={handleSaveDate}
              onCancelDate={handleCancelDate}
              onCellClick={handleCellClick}
              onCellDoubleClick={handleCellDoubleClick}
              onBulkMark={handleBulkMark}
              editingDate={editingDate}
              pendingStatuses={pendingStatuses}
            />
          )
        )}
      </div>
    </AppShell>
  );
}