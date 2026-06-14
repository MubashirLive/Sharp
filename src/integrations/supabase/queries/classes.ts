import { supabase } from "@/integrations/supabase/client";

export interface ClassDepCount {
  students: number;
  subjects: number;
  teachers: number;
}

export interface SectionDeps {
  studentCount: number;
  subjectCount: number;
  teacherCount: number;
  hasAttendance: boolean;
  hasWing: boolean;
  hasClassTeacher: boolean;
}

export interface ClassDeps {
  studentCount: number;
  subjectCount: number;
  teacherCount: number;
  hasAttendance: boolean;
  hasWing: boolean;
  hasClassTeacher: boolean;
}

export interface Wing {
  id: string;
  name: string;
  display_order?: number;
}

export async function fetchSectionDeps(schoolId: string, sectionId: string): Promise<SectionDeps> {
  const [stu, sub, att, ct] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("section_id", sectionId).eq("school_id", schoolId),
    supabase.from("section_subjects").select("id", { count: "exact", head: true }).eq("section_id", sectionId).eq("school_id", schoolId),
    supabase.from("attendance").select("id", { head: true }).eq("section_id", sectionId).eq("school_id", schoolId).limit(1),
    supabase.from("staff_roles").select("id", { head: true }).eq("section_id", sectionId).eq("school_id", schoolId).eq("role_type", "class_teacher"),
  ]);
  return {
    studentCount: stu.count ?? 0,
    subjectCount: sub.count ?? 0,
    teacherCount: ct.data !== null ? 1 : 0,
    hasAttendance: (att.data) !== null,
    hasWing: false,
    hasClassTeacher: (ct.data) !== null,
  };
}

export async function fetchClassDeps(schoolId: string, classId: string, sectionIds: string[]): Promise<ClassDeps> {
  const [stu, sub, att, ct] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId),
    supabase.from("section_subjects").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId),
    supabase.from("attendance").select("id", { head: true }).in("section_id", sectionIds).eq("school_id", schoolId).limit(1),
    supabase.from("staff_roles").select("id", { count: true, head: true }).in("section_id", sectionIds).eq("school_id", schoolId).eq("role_type", "class_teacher"),
  ]);
  return {
    studentCount: stu.count ?? 0,
    subjectCount: sub.count ?? 0,
    teacherCount: ct.count ?? 0,
    hasAttendance: (att.data) !== null,
    hasWing: false,
    hasClassTeacher: (ct.data) !== null,
  };
}

export async function fetchClassDependencyCounts(
  schoolId: string,
  classId: string,
  sectionIds: string[],
): Promise<ClassDepCount> {
  const [stu, sub, ct] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId),
    supabase.from("section_subjects").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId),
    supabase.from("staff_roles").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId).eq("role_type", "class_teacher"),
  ]);
  return {
    students: stu.count ?? 0,
    subjects: sub.count ?? 0,
    teachers: ct.count ?? 0,
  };
}

export async function getWingsBySchool(schoolId: string): Promise<Wing[]> {
  const { data, error } = await supabase
    .from("wings")
    .select("id, name, display_order")
    .eq("school_id", schoolId)
    .order("display_order");
  if (error) return [];
  return (data ?? []).map((w) => ({
    id: w.id,
    name: w.name,
    display_order: w.display_order ?? undefined,
  }));
}
