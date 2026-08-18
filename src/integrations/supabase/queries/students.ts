// Students data hooks — used by the Students page (src/pages/Students.tsx).
//
// Contract:
//   * Every read filters by school_id (RLS contract, see CLAUDE.md §6).
//   * useStudents reads the `students` table — the source of truth for the
//     list. The existing StudentDetailPage joins more tables; this module
//     is intentionally a thin reader for the index page.
//   * The shared query key is `studentsKeys.list(schoolId)` — same shape
//     across the app. Both the page and any future widget invalidate it
//     on write. See docs/LESSONS.md 2026-06-18 two-store entry.
//   * Mutations enforce `schoolId required` (mirrors useSaveWingAssignments).

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StudentsRow = Database["public"]["Tables"]["students"]["Row"];

/**
 * The columns the Students page actually displays. Kept narrow on purpose —
 * the page list is not the student-detail view. If a field grows, add it
 * here and to the StudentFormDialog onSave mapping.
 */
export interface StudentListItem {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  class_id: string;
  section_id: string;
  roll_no: string;
  status: string | null;
  school_id: string;
  school_internal_id: string | null;
  gender: string | null;
  dob: string | null;
  admission_date: string | null;
  father_mobile: string | null;
  student_mobile: string | null;
}

/** Subset of columns the create form can write today. */
export interface StudentCreateInput {
  full_name: string;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  class_id: string;
  section_id: string;
  roll_no: string;
  school_id: string;
  gender?: string | null;
  dob?: string | null;
  admission_date?: string | null;
  status?: string | null;
  father_mobile?: string | null;
  mother_mobile?: string | null;
  father_first_name?: string | null;
  father_middle_name?: string | null;
  father_last_name?: string | null;
  mother_first_name?: string | null;
  mother_middle_name?: string | null;
  mother_last_name?: string | null;
  student_mobile?: string | null;
  primary_guardian?: string | null;
  category?: string | null;
  nationality?: string | null;
  religion?: string | null;
  blood_group?: string | null;
  [extra: string]: unknown;
}

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const studentsKeys = {
  all: ["students"] as const,
  list: (schoolId: string) => ["students", schoolId] as const,
};

// ---------------------------------------------------------------------------
// Plain queries (used by useStudents.queryFn)
// ---------------------------------------------------------------------------

const STUDENT_LIST_COLUMNS =
  "id, full_name, first_name, last_name, class_id, section_id, roll_no, " +
  "status, school_id, school_internal_id, gender, dob, admission_date, " +
  "father_mobile, student_mobile";

/**
 * Fetch the student list for a school, joined with class/section names so
 * the index page can render "Class 5 - A" without a second round-trip per row.
 */
export async function getStudentsForSchool(
  schoolId: string
): Promise<StudentListItem[]> {
  const [studentsRes, classesRes, sectionsRes] = await Promise.all([
    supabase
      .from("students")
      .select(STUDENT_LIST_COLUMNS)
      .eq("school_id", schoolId)
      .order("class_id", { ascending: true })
      .order("roll_no", { ascending: true }),
    supabase
      .from("classes")
      .select("id, name")
      .eq("school_id", schoolId),
    supabase.from("sections").select("id, name, class_id").eq("school_id", schoolId),
  ]);

  if (studentsRes.error) throw studentsRes.error;

  const className = new Map<string, string>();
  for (const c of (classesRes.data ?? []) as Array<{ id: string; name: string }>) {
    className.set(c.id, c.name);
  }
  const sectionName = new Map<string, string>();
  for (const s of (sectionsRes.data ?? []) as Array<{ id: string; name: string; class_id: string }>) {
    sectionName.set(s.id, s.name);
  }

  return ((studentsRes.data ?? []) as unknown as StudentsRow[]).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    first_name: row.first_name,
    last_name: row.last_name,
    class_id: row.class_id,
    section_id: row.section_id,
    roll_no: row.roll_no,
    status: row.status,
    school_id: row.school_id,
    school_internal_id: row.school_internal_id,
    gender: row.gender,
    dob: row.dob,
    admission_date: row.admission_date,
    father_mobile: row.father_mobile,
    student_mobile: row.student_mobile,
    _className: className.get(row.class_id) ?? "",
    _sectionName: sectionName.get(row.section_id) ?? "",
  })) as unknown as StudentListItem[];
}

/**
 * Insert a single student row. RLS will reject the insert if the caller
 * does not own a `principal`/`admin` profile for this school.
 */
export async function createStudent(input: StudentCreateInput): Promise<StudentsRow> {
  const { data, error } = await supabase
    .from("students")
    .insert(input as any)
    .select()
    .single();
  if (error) throw error;
  return data as StudentsRow;
}

/**
 * Insert N student rows in a single round-trip. Returns the inserted rows.
 */
export async function bulkImportStudents(
  rows: StudentCreateInput[]
): Promise<StudentsRow[]> {
  if (rows.length === 0) return [];
  const { data, error } = await supabase
    .from("students")
    .insert(rows as any)
    .select();
  if (error) throw error;
  return (data ?? []) as StudentsRow[];
}

// ---------------------------------------------------------------------------
// React Query hooks
// ---------------------------------------------------------------------------

/**
 * List students for a school. Disabled when schoolId is undefined.
 */
export function useStudents(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? studentsKeys.list(schoolId)
      : ["students", "noop"],
    queryFn: () => getStudentsForSchool(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

/**
 * Create-student mutation. On success, invalidates the students list cache
 * for this school so the index page refetches.
 */
export function useCreateStudent(schoolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: StudentCreateInput) => {
      if (!schoolId) throw new Error("schoolId required for createStudent");
      return createStudent({ ...input, school_id: schoolId });
    },
    onSuccess: () => {
      if (schoolId) qc.invalidateQueries({ queryKey: studentsKeys.list(schoolId) });
    },
  });
}

/**
 * Bulk-import mutation. On success, invalidates the students list cache
 * for this school. Each row must already carry its own `school_id` — caller
 * is responsible for that.
 */
export function useBulkImportStudents(schoolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: StudentCreateInput[]) => {
      if (!schoolId) throw new Error("schoolId required for bulkImportStudents");
      if (rows.length === 0) return [];
      // Defense in depth: every row must carry the same school_id as the hook.
      const stamped = rows.map((r) => ({ ...r, school_id: schoolId }));
      return bulkImportStudents(stamped);
    },
    onSuccess: () => {
      if (schoolId) qc.invalidateQueries({ queryKey: studentsKeys.list(schoolId) });
    },
  });
}
