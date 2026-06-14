import { supabase } from "../client";
import type { Database } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

export type StaffRole = Database["public"]["Tables"]["staff_roles"]["Row"];
export type CoordinatorAssignment = Database["public"]["Tables"]["staff_coordinator_assignments"]["Row"];
export type CoordinatorWing = Database["public"]["Tables"]["staff_coordinator_wings"]["Row"];
export type CoordinatorClass = Database["public"]["Tables"]["staff_coordinator_classes"]["Row"];
export type WingStaff = Database["public"]["Tables"]["wing_staff"]["Row"];

// ─── Conflict Detection ─────────────────────────────────────────────────────

/** Returns existing Class Teacher for a class-section (if any) */
export async function getClassTeacherConflict(
  classId: string,
  sectionId: string,
  schoolId: string
): Promise<{ id: string; full_name: string } | null> {
  const { data } = await supabase
    .from("staff_roles")
    .select(
      `staff_id,
      profiles!inner(full_name:full_name)`
    )
    .eq("role_type", "class_teacher")
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("school_id", schoolId)
    .single();

  if (!data) return null;
  return {
    id: data.staff_id,
    full_name: (data.profiles as any)?.full_name ?? "Unknown",
  };
}

/** Returns existing Subject Teacher for a class-section-subject (if any) */
export async function getSubjectTeacherConflict(
  classId: string,
  sectionId: string,
  subjectId: string,
  schoolId: string
): Promise<{ id: string; full_name: string } | null> {
  const { data } = await supabase
    .from("staff_roles")
    .select(
      `staff_id,
      profiles!inner(full_name:full_name)`
    )
    .eq("role_type", "subject_teacher")
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("subject_id", subjectId)
    .eq("school_id", schoolId)
    .single();

  if (!data) return null;
  return {
    id: data.staff_id,
    full_name: (data.profiles as any)?.full_name ?? "Unknown",
  };
}

// ─── Class Teacher ──────────────────────────────────────────────────────────

export async function assignClassTeacher(
  staffId: string,
  classId: string,
  sectionId: string,
  schoolId: string,
  assignedBy: string,
  academicYearId?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("staff_roles").insert({
    staff_id: staffId,
    class_id: classId,
    section_id: sectionId,
    school_id: schoolId,
    role_type: "class_teacher",
    assigned_by: assignedBy,
    academic_year_id: academicYearId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeClassTeacher(
  staffId: string,
  classId: string,
  sectionId: string,
  schoolId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("staff_roles")
    .delete()
    .eq("staff_id", staffId)
    .eq("role_type", "class_teacher")
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("school_id", schoolId);

  return !error;
}

export async function getClassTeachersForStaff(staffId: string, schoolId: string): Promise<StaffRole[]> {
  const { data } = await supabase
    .from("staff_roles")
    .select("*")
    .eq("staff_id", staffId)
    .eq("role_type", "class_teacher")
    .eq("school_id", schoolId);

  return data ?? [];
}

// ─── Subject Teacher ────────────────────────────────────────────────────────

export async function assignSubjectTeacher(
  staffId: string,
  classId: string,
  sectionId: string,
  subjectId: string,
  schoolId: string,
  assignedBy: string,
  academicYearId?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("staff_roles").insert({
    staff_id: staffId,
    class_id: classId,
    section_id: sectionId,
    subject_id: subjectId,
    school_id: schoolId,
    role_type: "subject_teacher",
    assigned_by: assignedBy,
    academic_year_id: academicYearId,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeSubjectTeacher(
  staffId: string,
  classId: string,
  sectionId: string,
  subjectId: string,
  schoolId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("staff_roles")
    .delete()
    .eq("staff_id", staffId)
    .eq("role_type", "subject_teacher")
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("subject_id", subjectId)
    .eq("school_id", schoolId);

  return !error;
}

export async function getSubjectTeachersForStaff(staffId: string, schoolId: string): Promise<StaffRole[]> {
  const { data } = await supabase
    .from("staff_roles")
    .select("*")
    .eq("staff_id", staffId)
    .eq("role_type", "subject_teacher")
    .eq("school_id", schoolId);

  return data ?? [];
}

// ─── Coordinator ───────────────────────────────────────────────────────────

export async function getCoordinatorAssignment(
  staffId: string,
  schoolId: string
): Promise<{
  assignment: CoordinatorAssignment | null;
  wings: CoordinatorWing[];
  classes: CoordinatorClass[];
}> {
  const { data: assignment } = await supabase
    .from("staff_coordinator_assignments")
    .select("*")
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .single();

  if (!assignment) return { assignment: null, wings: [], classes: [] };

  const [{ data: wings }, { data: classes }] = await Promise.all([
    supabase
      .from("staff_coordinator_wings")
      .select("wing_id")
      .eq("assignment_id", assignment.id),
    supabase
      .from("staff_coordinator_classes")
      .select("class_id, section_id")
      .eq("assignment_id", assignment.id),
  ]);

  return {
    assignment,
    wings: wings ?? [],
    classes: classes ?? [],
  };
}

export async function saveCoordinatorAssignment(
  staffId: string,
  schoolId: string,
  mode: "wingwise" | "classwise",
  wingIds: string[],
  classSectionPairs: { classId: string; sectionId: string }[]
): Promise<{ success: boolean; error?: string }> {
  // Upsert coordinator assignment
  const { data: assignment, error: assignError } = await supabase
    .from("staff_coordinator_assignments")
    .upsert(
      {
        staff_id: staffId,
        school_id: schoolId,
        mode,
      },
      { onConflict: "staff_id,school_id" }
    )
    .select()
    .single();

  if (assignError) return { success: false, error: assignError.message };

  const assignmentId = assignment.id;

  // Clear old targets
  await Promise.all([
    supabase.from("staff_coordinator_wings").delete().eq("assignment_id", assignmentId),
    supabase.from("staff_coordinator_classes").delete().eq("assignment_id", assignmentId),
  ]);

  // Insert new targets
  const wingInserts = wingIds.map((wingId) => ({
    assignment_id: assignmentId,
    wing_id: wingId,
    school_id: schoolId,
  }));

  const classInserts = classSectionPairs.map(({ classId, sectionId }) => ({
    assignment_id: assignmentId,
    class_id: classId,
    section_id: sectionId,
    school_id: schoolId,
  }));

  await Promise.all([
    wingInserts.length ? supabase.from("staff_coordinator_wings").insert(wingInserts) : { error: null },
    classInserts.length ? supabase.from("staff_coordinator_classes").insert(classInserts) : { error: null },
  ]);

  return { success: true };
}

// ─── Wing Staff Auto-Membership ────────────────────────────────────────────

/** Auto-create wing_staff entry when staff becomes Class/Subject Teacher */
export async function autoCreateWingMembership(
  staffId: string,
  classId: string,
  assignmentType: "class_teacher" | "subject_teacher",
  sourceId: string
): Promise<void> {
  // Find wing for this class
  const { data: cls } = await supabase
    .from("classes")
    .select("wing_id")
    .eq("id", classId)
    .single();

  if (!cls?.wing_id) return;

  const schoolId = (await supabase.from("profiles").select("school_id").eq("id", staffId).single())?.data
    ?.school_id;

  if (!schoolId) return;

  await supabase.from("wing_staff").upsert(
    {
      wing_id: cls.wing_id,
      staff_id: staffId,
      assignment_type: assignmentType,
      source_id: sourceId,
      school_id: schoolId,
    },
    { onConflict: "wing_id,staff_id,source_id" }
  );
}

/** Remove wing_staff entry when staff is removed from Class/Subject Teacher role */
export async function removeWingMembership(sourceId: string): Promise<void> {
  await supabase.from("wing_staff").delete().eq("source_id", sourceId);
}

// ─── Department (read) ─────────────────────────────────────────────────────

export type DepartmentMembership = {
  department_id: string;
  department_name: string;
  is_incharge: boolean;
};

export async function getDepartmentMembership(staffId: string, schoolId: string): Promise<DepartmentMembership[]> {
  const { data } = await supabase
    .from("department_staff")
    .select(`department_id, departments!inner(name:name)`)
    .eq("staff_profile_id", staffId)
    .eq("school_id", schoolId);

  const { data: incharges } = await supabase
    .from("department_incharges")
    .select("department_id")
    .eq("staff_profile_id", staffId)
    .eq("school_id", schoolId)
    .eq("is_active", true);

  const inchargeSet = new Set((incharges ?? []).map((i) => i.department_id));

  return (data ?? []).map((d) => ({
    department_id: d.department_id,
    department_name: (d.departments as any)?.name ?? "Unknown",
    is_incharge: inchargeSet.has(d.department_id),
  }));
}

// ─── All Roles for Staff Card ──────────────────────────────────────────────

export interface StaffAllRoles {
  is_admin: boolean;
  is_master_admin: boolean;
  class_teachers: StaffRole[];
  subject_teachers: StaffRole[];
  coordinator: {
    assignment: CoordinatorAssignment | null;
    wings: CoordinatorWing[];
    classes: CoordinatorClass[];
  } | null;
  departments: DepartmentMembership[];
}

export async function getStaffAllRoles(
  staffId: string,
  schoolId: string
): Promise<StaffAllRoles> {
  const [
    { data: profile },
    classTeachers,
    subjectTeachers,
    coordinator,
    departments,
  ] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", staffId).single(),
    getClassTeachersForStaff(staffId, schoolId),
    getSubjectTeachersForStaff(staffId, schoolId),
    getCoordinatorAssignment(staffId, schoolId),
    getDepartmentMembership(staffId, schoolId),
  ]);

  const role = profile?.role ?? "";

  return {
    is_admin: role === "admin",
    is_master_admin: role === "master_admin",
    class_teachers: classTeachers,
    subject_teachers: subjectTeachers,
    coordinator: coordinator.assignment ? coordinator : null,
    departments,
  };
}

// ─── Master Admin ───────────────────────────────────────────────────────────

export async function promoteToMasterAdmin(staffId: string): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ role: "master_admin" })
    .eq("id", staffId);

  return !error;
}

export async function revokeMasterAdmin(staffId: string): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ role: "staff" })
    .eq("id", staffId);

  return !error;
}