import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAttendanceDay,
  getAttendanceMonth,
  getTodayStatus,
  markAttendance,
  editAttendance,
  bulkImportAttendance,
  getClassTeacherAssignment,
  getCoordinatorAssignment,
  getHolidayDates,
  getStudents,
  getWings,
  getClasses,
  getSections,
  buildExportData,
  getCurrentAcademicYear,
  type ClassTeacherAssignment,
  type CoordinatorAssignment,
  type StudentWithFatherName,
  type AttendanceStatus,
} from "@/integrations/supabase/queries/attendance";
import { canMarkAttendance } from "@/integrations/supabase/queries/attendanceGate";
import { useAuth } from "@/contexts/AuthContext";

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const attendanceKeys = {
  all: ["attendance"] as const,
  day: (classId: string, sectionId: string, date: string) =>
    ["attendance", "day", classId, sectionId, date] as const,
  month: (classId: string, sectionId: string, year: number, month: number) =>
    ["attendance", "month", classId, sectionId, year, month] as const,
  todayStatus: (classId: string, sectionId: string) =>
    ["attendance", "todayStatus", classId, sectionId] as const,
  myClassAssignment: (staffProfileId: string, academicYearId: string) =>
    ["attendance", "myClassAssignment", staffProfileId, academicYearId] as const,
  coordinatorAssignment: (staffId: string) =>
    ["attendance", "coordinatorAssignment", staffId] as const,
  holidayDates: (schoolId: string, academicYearId: string, year: number, month: number) =>
    ["attendance", "holidays", schoolId, academicYearId, year, month] as const,
  gate: (classId: string, date: string) =>
    ["attendance", "gate", classId, date] as const,
  students: (classId: string, sectionId: string) =>
    ["attendance", "students", classId, sectionId] as const,
  wings: (schoolId: string) => ["attendance", "wings", schoolId] as const,
  classes: (schoolId: string, wingId?: string | null) =>
    ["attendance", "classes", schoolId, wingId ?? "all"] as const,
  sections: (classId: string) => ["attendance", "sections", classId] as const,
};

// ─── Data Queries ─────────────────────────────────────────────────────────────

export function useWings(schoolId: string) {
  return useQuery({
    queryKey: attendanceKeys.wings(schoolId),
    queryFn: () => getWings(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useClasses(schoolId: string, wingId?: string | null) {
  return useQuery({
    queryKey: attendanceKeys.classes(schoolId, wingId),
    queryFn: () => getClasses(schoolId, wingId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSections(classId: string) {
  return useQuery({
    queryKey: attendanceKeys.sections(classId),
    queryFn: () => getSections(classId),
    enabled: !!classId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useStudents(classId: string, sectionId: string) {
  return useQuery({
    queryKey: attendanceKeys.students(classId, sectionId),
    queryFn: () => getStudents(classId, sectionId),
    enabled: !!classId && !!sectionId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAttendanceDay(classId: string, sectionId: string, date: string, schoolId: string) {
  return useQuery({
    queryKey: attendanceKeys.day(classId, sectionId, date),
    queryFn: () => getAttendanceDay(classId, sectionId, date, schoolId),
    enabled: !!classId && !!sectionId && !!date && !!schoolId,
    staleTime: 60 * 1000,
  });
}

export function useAttendanceMonth(
  classId: string,
  sectionId: string,
  year: number,
  month: number,
  schoolId: string
) {
  return useQuery({
    queryKey: attendanceKeys.month(classId, sectionId, year, month),
    queryFn: () => getAttendanceMonth(classId, sectionId, year, month, schoolId),
    enabled: !!classId && !!sectionId && !!schoolId,
    staleTime: 60 * 1000,
  });
}

export function useTodayStatus(classId: string, sectionId: string, schoolId: string) {
  return useQuery({
    queryKey: attendanceKeys.todayStatus(classId, sectionId),
    queryFn: () => getTodayStatus(classId, sectionId, schoolId),
    enabled: !!classId && !!sectionId && !!schoolId,
    staleTime: 30 * 1000,
  });
}

export function useHolidayDates(
  schoolId: string,
  academicYearId: string,
  year: number,
  month: number
) {
  return useQuery({
    queryKey: attendanceKeys.holidayDates(schoolId, academicYearId, year, month),
    queryFn: () => getHolidayDates(schoolId, academicYearId, year, month),
    enabled: !!schoolId && !!academicYearId,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Role Assignments ──────────────────────────────────────────────────────────

export function useMyClassAssignment(staffProfileId: string, academicYearId: string) {
  return useQuery({
    queryKey: attendanceKeys.myClassAssignment(staffProfileId, academicYearId),
    queryFn: () => getClassTeacherAssignment(staffProfileId, academicYearId),
    enabled: !!staffProfileId && !!academicYearId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCoordinatorAssignment(staffId: string, schoolId: string) {
  return useQuery({
    queryKey: attendanceKeys.coordinatorAssignment(staffId),
    queryFn: () => getCoordinatorAssignment(staffId, schoolId),
    enabled: !!staffId && !!schoolId,
    staleTime: 10 * 60 * 1000,
  });
}

// ─── Gate Check ────────────────────────────────────────────────────────────────

export function useAttendanceGate(classId: string, date: string) {
  return useQuery({
    queryKey: attendanceKeys.gate(classId, date),
    queryFn: () => canMarkAttendance(classId, date),
    enabled: !!classId && !!date,
    staleTime: 0,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: {
      classId: string;
      sectionId: string;
      schoolId: string;
      academicYearId: string;
      date: string;
      markedBy: string;
      records: { studentId: string; status: AttendanceStatus }[];
    }) => markAttendance(opts),
    onSuccess: (_, { classId, sectionId, schoolId, date }) => {
      const today = new Date().toISOString().split("T")[0];
      const d = new Date(date);
      qc.invalidateQueries({ queryKey: attendanceKeys.day(classId, sectionId, date) });
      qc.invalidateQueries({ queryKey: attendanceKeys.todayStatus(classId, sectionId) });
      qc.invalidateQueries({ queryKey: attendanceKeys.month(classId, sectionId, d.getFullYear(), d.getMonth()) });
    },
  });
}

export function useEditAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: {
      attendanceId: string;
      classId: string;
      sectionId: string;
      date: string;
      records: { studentId: string; status: AttendanceStatus }[];
    }) => editAttendance(opts),
    onSuccess: (_, { classId, sectionId, date }) => {
      const d = new Date(date);
      qc.invalidateQueries({ queryKey: attendanceKeys.day(classId, sectionId, date) });
      qc.invalidateQueries({ queryKey: attendanceKeys.todayStatus(classId, sectionId) });
      qc.invalidateQueries({ queryKey: attendanceKeys.month(classId, sectionId, d.getFullYear(), d.getMonth()) });
    },
  });
}

export function useBulkImportAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: {
      schoolId: string;
      classId: string;
      sectionId: string;
      academicYearId: string;
      markedBy: string;
      recordsByDate: { date: string; records: { studentId: string; status: AttendanceStatus }[] }[];
    }) => bulkImportAttendance(opts),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

// ─── Dashboard card ──────────────────────────────────────────────────────────

export interface DashboardAttendanceStatus {
  roleLabel: string;
  variant: "my_class" | "my_wing";
  markedToday: boolean | null;
  classId?: string;
  sectionId?: string;
  wingId?: string;
  className?: string;
  wingName?: string;
}

/** Get full dashboard card status for the current user */
export function useDashboardAttendanceStatus() {
  const { user, school, role } = useAuth();
  const schoolId = school?.id ?? "";
  const staffId = user?.id ?? "";
  const staffProfileId = user?.id ?? "";

  // Step 1: resolve academic year
  const { data: academicYearId } = useQuery({
    queryKey: ["attendance", "currentAcademicYear", schoolId],
    queryFn: () => getCurrentAcademicYear(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });

  // Step 2: load role assignments in parallel
  const { data: classAssignment, isLoading: classLoading } = useMyClassAssignment(staffProfileId, academicYearId ?? "");
  const { data: coordAssignment, isLoading: coordLoading } = useCoordinatorAssignment(staffId, schoolId);

  // Step 3: if we have class assignment, check today's status
  const today = new Date().toISOString().split("T")[0];
  const { data: todayMarked, isLoading: todayLoading } = useQuery({
    queryKey: attendanceKeys.todayStatus(classAssignment?.classId ?? "", classAssignment?.sectionId ?? ""),
    queryFn: () =>
      classAssignment
        ? getTodayStatus(classAssignment.classId, classAssignment.sectionId, schoolId)
        : Promise.resolve(false),
    enabled: !!classAssignment && !!schoolId,
    staleTime: 30 * 1000,
  });

  const isLoading = classLoading || coordLoading || todayLoading;
  const isClassTeacher = role === "class_teacher";
  const isCoordinator = role === "coordinator";
  const isDualRole = isClassTeacher && isCoordinator;

  // Dual role: show wing card as default (user can toggle to class)
  if (isDualRole && coordAssignment) {
    return {
      data: {
        roleLabel: "Coordinator",
        variant: "my_wing" as const,
        markedToday: isLoading ? null : todayMarked ?? false,
        wingId: coordAssignment.wingId,
        wingName: coordAssignment.wingName,
      } as DashboardAttendanceStatus,
      isLoading,
    };
  }

  if (isClassTeacher && classAssignment) {
    return {
      data: {
        roleLabel: "Class Teacher",
        variant: "my_class" as const,
        markedToday: isLoading ? null : todayMarked ?? false,
        classId: classAssignment.classId,
        sectionId: classAssignment.sectionId,
        className: classAssignment.className,
      } as DashboardAttendanceStatus,
      isLoading,
    };
  }

  if (isCoordinator && coordAssignment) {
    return {
      data: {
        roleLabel: "Coordinator",
        variant: "my_wing" as const,
        markedToday: isLoading ? null : todayMarked ?? false,
        wingId: coordAssignment.wingId,
        wingName: coordAssignment.wingName,
      } as DashboardAttendanceStatus,
      isLoading,
    };
  }

  return { data: null, isLoading: false };
}

export function useExportData(opts: {
  schoolId: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  fromDate: string;
  toDate: string;
}) {
  return useQuery({
    queryKey: ["attendance", "export", opts.schoolId, opts.classId, opts.sectionId, opts.fromDate, opts.toDate],
    queryFn: () => buildExportData(opts),
    enabled: !!opts.schoolId && !!opts.classId && !!opts.sectionId && !!opts.fromDate && !!opts.toDate,
    staleTime: 60 * 1000,
  });
}
