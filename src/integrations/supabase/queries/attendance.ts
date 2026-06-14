import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase/types";

export type AttendanceRow = Database["public"]["Tables"]["attendance"]["Row"];
export type AttendanceRecord = Database["public"]["Tables"]["attendance_records"]["Row"];
export type AttendanceInsert = Database["public"]["Tables"]["attendance"]["Insert"];
export type AttendanceRecordInsert = Database["public"]["Tables"]["attendance_records"]["Insert"];

export type AttendanceStatus = "present" | "absent" | "leave";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): string[] {
  const days: string[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(new Date(year, month, d).toISOString().split("T")[0]);
  }
  return days;
}

/** Resolve the current active academic year for a school */
export async function getCurrentAcademicYear(schoolId: string): Promise<string | null> {
  const { data } = await supabase
    .from("academic_sessions")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();
  return data?.id ?? null;
}

// ─── Core queries ──────────────────────────────────────────────────────────────

/** Get a single day's attendance + all student records */
export async function getAttendanceDay(
  classId: string,
  sectionId: string,
  date: string,
  schoolId: string
) {
  const { data, error } = await supabase
    .from("attendance")
    .select(
      `*, attendance_records(*)`,
    )
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("date", date)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Get all attendance records for a full month (all dates) */
export async function getAttendanceMonth(
  classId: string,
  sectionId: string,
  year: number,
  month: number,
  schoolId: string
) {
  const startDate = new Date(year, month, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("attendance")
    .select(`*, attendance_records(*)`)
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("school_id", schoolId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  if (error) throw error;
  return data ?? [];
}

/** Check if today is marked for a given class-section */
export async function getTodayStatus(
  classId: string,
  sectionId: string,
  schoolId: string
): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("attendance")
    .select("id")
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("date", today)
    .eq("school_id", schoolId)
    .maybeSingle();
  return !!data;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Mark (create) attendance for a single date */
export async function markAttendance({
  classId,
  sectionId,
  schoolId,
  academicYearId,
  date,
  markedBy,
  records, // array of { studentId, status }
}: {
  classId: string;
  sectionId: string;
  schoolId: string;
  academicYearId: string;
  date: string;
  markedBy: string;
  records: { studentId: string; status: AttendanceStatus }[];
}) {
  // 1. Upsert the attendance header row
  const { data: attendanceRow, error: attError } = await supabase
    .from("attendance")
    .upsert(
      {
        class_id: classId,
        section_id: sectionId,
        school_id: schoolId,
        academic_year_id: academicYearId,
        date,
        marked_by: markedBy,
      },
      { onConflict: "class_id,section_id,date" }
    )
    .select()
    .single();

  if (attError) throw attError;
  if (!attendanceRow) throw new Error("Failed to create attendance record");

  // 2. Upsert each student record
  const recordInserts: AttendanceRecordInsert[] = records.map((r) => ({
    attendance_id: attendanceRow.id,
    student_id: r.studentId,
    status: r.status,
  }));

  const { error: recordsError } = await supabase
    .from("attendance_records")
    .upsert(recordInserts, { onConflict: "attendance_id,student_id" });

  if (recordsError) throw recordsError;

  return attendanceRow;
}

/** Edit attendance for an existing date — replace all records */
export async function editAttendance({
  attendanceId,
  records,
}: {
  attendanceId: string;
  records: { studentId: string; status: AttendanceStatus }[];
}) {
  // Delete existing records, then insert new ones
  const { error: deleteError } = await supabase
    .from("attendance_records")
    .delete()
    .eq("attendance_id", attendanceId);

  if (deleteError) throw deleteError;

  const recordInserts: AttendanceRecordInsert[] = records.map((r) => ({
    attendance_id: attendanceId,
    student_id: r.studentId,
    status: r.status,
  }));

  const { error: insertError } = await supabase
    .from("attendance_records")
    .insert(recordInserts);

  if (insertError) throw insertError;

  // Update attendance.updated_at
  await supabase
    .from("attendance")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", attendanceId);
}

/** Bulk import attendance for a month */
export async function bulkImportAttendance({
  schoolId,
  classId,
  sectionId,
  academicYearId,
  markedBy,
  recordsByDate, // { date: string, records: { studentId, status }[] }[]
}: {
  schoolId: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  markedBy: string;
  recordsByDate: { date: string; records: { studentId: string; status: AttendanceStatus }[] }[];
}) {
  const results: { date: string; skipped: boolean; error?: string }[] = [];

  for (const { date, records } of recordsByDate) {
    try {
      await markAttendance({
        classId,
        sectionId,
        schoolId,
        academicYearId,
        date,
        markedBy,
        records,
      });
      results.push({ date, skipped: false });
    } catch (err: any) {
      results.push({ date, skipped: true, error: err.message });
    }
  }

  return results;
}

// ─── Class Teacher assignment ─────────────────────────────────────────────────

export interface ClassTeacherAssignment {
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  wingId: string | null;
  wingName: string | null;
}

export async function getClassTeacherAssignment(
  staffProfileId: string,
  academicYearId: string
): Promise<ClassTeacherAssignment | null> {
  const { data, error } = await supabase
    .from("staff_roles")
    .select(
      `class_id, section_id, academic_year_id,
       class:name, section:name,
       class:classes(wing_id, wing:name)`
    )
    .eq("staff_id", staffProfileId)
    .eq("role_type", "class_teacher")
    .eq("academic_year_id", academicYearId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    classId: data.class_id,
    className: (data.class as any)?.name ?? "",
    sectionId: data.section_id,
    sectionName: (data.section as any)?.name ?? "",
    wingId: (data.class as any)?.wing_id ?? null,
    wingName: (data.class as any)?.wing?.name ?? null,
  };
}

// ─── Coordinator assignment ───────────────────────────────────────────────────

export interface CoordinatorAssignment {
  wingId: string;
  wingName: string;
  classIds: string[];
}

export async function getCoordinatorAssignment(
  staffId: string,
  schoolId: string
): Promise<CoordinatorAssignment | null> {
  // Get coordinator's wing
  const { data: coordData, error: coordError } = await supabase
    .from("wings_coordinators")
    .select(`wing_id, wing: wings(name)`)
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (coordError) throw coordError;
  if (!coordData) return null;

  // Get coordinator's assigned classes
  const { data: classData } = await supabase
    .from("staff_coordinator_classes")
    .select(`class_id`)
    .eq("staff_id", staffId);

  return {
    wingId: coordData.wing_id,
    wingName: (coordData.wing as any)?.name ?? "",
    classIds: (classData ?? []).map((c: any) => c.class_id),
  };
}

// ─── Holiday dates ───────────────────────────────────────────────────────────

export async function getHolidayDates(
  schoolId: string,
  academicYearId: string,
  year: number,
  month: number
): Promise<string[]> {
  const startDate = new Date(year, month, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

  // Get the school_calendar.id for this academic year
  const { data: calData } = await supabase
    .from("school_calendar")
    .select("id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .maybeSingle();

  if (!calData) return [];

  const { data, error } = await supabase
    .from("calendar_events")
    .select(`date`)
    .eq("calendar_id", calData.id)
    .eq("event_type", "holiday")
    .or(`scope.eq.all,scope_ids.cs.{${academicYearId}}`)
    .gte("date", startDate)
    .lte("date", endDate);

  if (error) throw error;
  return (data ?? []).map((r) => r.date);
}

// ─── Students ────────────────────────────────────────────────────────────────

export interface StudentWithFatherName {
  id: string;
  roll_no: string;
  full_name: string;
  father_name: string | null;
}

export async function getStudents(
  classId: string,
  sectionId: string
): Promise<StudentWithFatherName[]> {
  const { data, error } = await supabase
    .from("students")
    .select(`id, roll_no, full_name, father_name`)
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .order("roll_no");

  if (error) throw error;
  return (data ?? []) as StudentWithFatherName[];
}

// ─── Wings + Classes + Sections ────────────────────────────────────────────────

export async function getWings(schoolId: string) {
  const { data, error } = await supabase
    .from("wings")
    .select(`id, name, display_order`)
    .eq("school_id", schoolId)
    .order("display_order");
  if (error) throw error;
  return data ?? [];
}

export async function getClasses(schoolId: string, wingId?: string | null) {
  let q = supabase
    .from("classes")
    .select(`id, name, wing_id, display_order, wing:wings(name)`)
    .eq("school_id", schoolId)
    .order("display_order");
  if (wingId && wingId !== "all" && wingId !== "unassigned") {
    q = q.eq("wing_id", wingId);
  }
  if (wingId === "unassigned") {
    q = q.is("wing_id", null);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function getSections(classId: string) {
  const { data, error } = await supabase
    .from("sections")
    .select(`id, name, class_id`)
    .eq("class_id", classId)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

// ─── Export ──────────────────────────────────────────────────────────────────

export interface ExportData {
  schoolName: string;
  sessionName: string;
  className: string;
  sectionName: string;
  dateRange: { from: string; to: string };
  students: StudentWithFatherName[];
  // Per student: map of date -> status
  attendanceByDate: Record<string, Record<string, AttendanceStatus | "H" | null>>;
  // Per date: count of present
  presentCountByDate: Record<string, number>;
}

export async function buildExportData({
  schoolId,
  classId,
  sectionId,
  academicYearId,
  fromDate,
  toDate,
}: {
  schoolId: string;
  classId: string;
  sectionId: string;
  academicYearId: string;
  fromDate: string;
  toDate: string;
}): Promise<ExportData> {
  // School name
  const { data: schoolData } = await supabase
    .from("schools")
    .select(`name`)
    .eq("id", schoolId)
    .single();

  // Session name
  const { data: sessionData } = await supabase
    .from("academic_sessions")
    .select(`academic_year`)
    .eq("id", academicYearId)
    .maybeSingle();

  // Class + section name
  const { data: classData } = await supabase
    .from("classes")
    .select(`name`)
    .eq("id", classId)
    .single();

  const { data: sectionData } = await supabase
    .from("sections")
    .select(`name`)
    .eq("id", sectionId)
    .single();

  // Students
  const students = await getStudents(classId, sectionId);

  // All attendance rows in range
  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select(`date, attendance_records(student_id, status)`)
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("school_id", schoolId)
    .gte("date", fromDate)
    .lte("date", toDate);

  // Build attendanceByDate map
  const attendanceByDate: Record<string, Record<string, AttendanceStatus | "H" | null>> = {};
  const presentCountByDate: Record<string, number> = {};
  for (const row of attendanceRows ?? []) {
    attendanceByDate[row.date] = {};
    presentCountByDate[row.date] = 0;
    for (const rec of row.attendance_records ?? []) {
      attendanceByDate[row.date][rec.student_id] = rec.status;
      if (rec.status === "present") presentCountByDate[row.date]++;
    }
  }

  return {
    schoolName: schoolData?.name ?? "",
    sessionName: sessionData?.academic_year ?? "",
    className: classData?.name ?? "",
    sectionName: sectionData?.name ?? "",
    dateRange: { from: fromDate, to: toDate },
    students,
    attendanceByDate,
    presentCountByDate,
  };
}
