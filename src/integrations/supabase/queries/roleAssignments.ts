import { supabase } from "@/integrations/supabase/client";

// ============== Types ==============

export interface StaffAllRoles {
  staff_id: string;
  is_master_admin: boolean;
  is_admin: boolean;
  role: string;
  status: string;
  messenger_tag: string | null;
  /**
   * Wings the staff is coordinator of (manual, from the Wings tab).
   * Staff can be coordinator of multiple wings concurrently — see
   * docs/ROLE_MANAGER.md §3.1.2(d). Sorted by `wing_staff.created_at` asc.
   */
  coordinator_wings: Array<{ id: string; wing_id: string; wing_name: string }>;
  /**
   * Wings the staff is auto-assigned to via Class Teacher / Subject Teacher
   * of a class whose `classes.wing_id` matches. Read-only — these are
   * managed by adding/removing the underlying CT/ST assignment, not here.
   * UI should dedup against `coordinator_wings` by wing_id (Coordinator wins).
   */
  auto_assigned_wings: Array<{ id: string; name: string }>;
  class_teachers: Array<{ id: string; class_id: string; section_id: string; class_name: string; section_name: string }>;
  subject_teachers: Array<{ id: string; class_id: string; section_id: string; subject_id: string; class_name: string; section_name: string; subject_name: string; label: string }>;
  departments: Array<{ id: string; department_id: string; department_name: string; is_incharge: boolean }>;
  house: { house_name: string } | null;
}

export interface WingOption { id: string; name: string }
export interface ClassOption { id: string; name: string }
export interface SectionOption { id: string; name: string }
export interface DepartmentOption { id: string; name: string }
export interface HouseOption { name: string; color?: string }

// ============== Audit ==============

export async function logRoleAudit(params: {
  staffId: string;
  schoolId: string;
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy: string;
}) {
  await supabase.from("staff_role_audit").insert({
    staff_id: params.staffId,
    school_id: params.schoolId,
    action: params.action,
    field: params.field,
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
    changed_by: params.changedBy,
  });
}

// ============== Profile field updates ==============

export async function updateStaffTag(staffId: string, tag: string, changedBy: string) {
  const { data: old } = await supabase.from("profiles").select("messenger_tag").eq("id", staffId).single();
  const { error } = await supabase.from("profiles").update({ messenger_tag: tag || null }).eq("id", staffId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId: (old as any)?.school_id ?? "", action: "tag", field: "messenger_tag", oldValue: old?.messenger_tag, newValue: tag, changedBy });
}

export async function updateMasterAdmin(staffId: string, value: boolean, changedBy: string) {
  const { data: old } = await supabase.from("profiles").select("is_master_admin, school_id").eq("id", staffId).single();
  const { error } = await supabase.from("profiles").update({ is_master_admin: value }).eq("id", staffId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId: old?.school_id ?? "", action: "master_admin", field: value ? "grant" : "revoke", oldValue: String(!!old?.is_master_admin), newValue: String(value), changedBy });
}

export async function updateAdminRole(staffId: string, value: boolean, changedBy: string) {
  const { data: old } = await supabase.from("profiles").select("role, school_id").eq("id", staffId).single();
  const newRole = value ? "admin" : "teacher";
  const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", staffId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId: old?.school_id ?? "", action: "admin", field: value ? "grant" : "revoke", oldValue: old?.role, newValue: newRole, changedBy });
}

export async function updateStaffRole(staffId: string, role: string, changedBy: string) {
  const { data: old } = await supabase.from("profiles").select("role, school_id").eq("id", staffId).single();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", staffId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId: old?.school_id ?? "", action: "role", field: "role", oldValue: old?.role, newValue: role, changedBy });
}

export async function updateStaffStatus(staffId: string, status: string, changedBy: string) {
  const { data: old } = await supabase.from("profiles").select("status, school_id").eq("id", staffId).single();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", staffId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId: old?.school_id ?? "", action: "status", field: "status", oldValue: old?.status, newValue: status, changedBy });
}

// ============== Coordinator ==============

export async function addCoordinator(wingId: string, staffId: string, schoolId: string, changedBy: string) {
  const { error } = await supabase.from("wing_staff").insert({
    wing_id: wingId, staff_id: staffId, school_id: schoolId,
    assignment_type: "coordinator", source_id: null,
  });
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId, action: "coordinator", field: "add", newValue: wingId, changedBy });
}

export async function removeCoordinator(wingStaffId: string, staffId: string, schoolId: string, changedBy: string) {
  const { error } = await supabase.from("wing_staff").delete().eq("id", wingStaffId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId, action: "coordinator", field: "remove", oldValue: wingStaffId, changedBy });
}

// ============== Class Teacher (unified: writes go to staff_roles) ==============

export async function addClassTeacher(staffId: string, classId: string, sectionId: string, schoolId: string, changedBy: string) {
  // Look up current academic year for this school (staff_roles.academic_year_id
  // is nullable but consistent with subject_teacher writes).
  const { data: ay } = await supabase
    .from("academic_sessions")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  // Pre-delete any existing class-teacher row for (class, section) to avoid
  // the one_class_teacher_per_section EXCLUSION constraint.
  await supabase
    .from("staff_roles")
    .delete()
    .eq("school_id", schoolId)
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("role_type", "class_teacher");

  const { data: inserted, error } = await supabase.from("staff_roles").insert({
    staff_id: staffId,
    school_id: schoolId,
    role_type: "class_teacher",
    class_id: classId,
    section_id: sectionId,
    subject_id: null,
    academic_year_id: ay?.id ?? null,
    assigned_by: changedBy,
  }).select("id").single();
  if (error) throw error;

  // Auto-assign to wing if class has one
  if (inserted?.id) {
    await autoAssignTeacherToWing(staffId, classId, schoolId, inserted.id, "class_teacher");
  }

  await logRoleAudit({ staffId, schoolId, action: "class_teacher", field: "add", newValue: `${classId}:${sectionId}`, changedBy });
}

export async function removeClassTeacher(staffRoleId: string, staffId: string, schoolId: string, changedBy: string) {
  // Fetch class_id before delete (needed for wing auto-unassignment)
  const { data: existing } = await supabase
    .from("staff_roles")
    .select("class_id")
    .eq("id", staffRoleId)
    .maybeSingle();

  // staffRoleId is the staff_roles.id row id. Scope by school_id to be safe.
  const { error } = await supabase
    .from("staff_roles")
    .delete()
    .eq("id", staffRoleId)
    .eq("school_id", schoolId)
    .eq("role_type", "class_teacher");
  if (error) throw error;

  // Remove auto-assigned wing entry
  if ((existing as any)?.class_id) {
    await removeAutoAssignedTeacherFromWing(staffId, (existing as any).class_id, schoolId);
  }

  await logRoleAudit({ staffId, schoolId, action: "class_teacher", field: "remove", oldValue: staffRoleId, changedBy });
}

export async function getClassTeacherConflict(classId: string, sectionId: string, schoolId: string) {
  const { data } = await supabase
    .from("staff_roles")
    .select("id, staff_id, profiles:profiles!staff_roles_staff_id_fkey(full_name)")
    .eq("class_id", classId)
    .eq("section_id", sectionId)
    .eq("school_id", schoolId)
    .eq("role_type", "class_teacher")
    .maybeSingle();
  if (!data) return null;
  // Normalize field name so callers that read `staff_profile_id` keep working.
  return { ...data, staff_profile_id: (data as any).staff_id } as any;
}

// ============== Auto-Assignment: Wing sync for CT/ST ==============

/**
 * Get the wing_id for a class. Returns null if class has no wing.
 */
export async function getClassWingId(classId: string): Promise<string | null> {
  const { data } = await supabase
    .from("classes")
    .select("wing_id")
    .eq("id", classId)
    .maybeSingle();
  return (data as any)?.wing_id ?? null;
}

/**
 * Auto-assign a teacher to a wing based on their CT/ST assignment.
 *
 * Rules:
 * - One wing_staff entry per (wing_id, staff_id) with auto_assigned=true
 * - If entry exists, update source_reference to latest staffRoleId
 * - If class has no wing, skip
 * - Manual assignments (auto_assigned=false) are preserved
 */
export async function autoAssignTeacherToWing(
  staffId: string,
  classId: string,
  schoolId: string,
  staffRoleId: string,
  assignmentType: 'class_teacher' | 'subject_teacher'
): Promise<void> {
  const wingId = await getClassWingId(classId);
  if (!wingId) return; // No wing, skip

  // Check if auto-assigned entry already exists
  const { data: existing } = await supabase
    .from("wing_staff")
    .select("id")
    .eq("wing_id", wingId)
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .eq("assignment_type", "teacher")
    .eq("auto_assigned", true)
    .maybeSingle();

  if (existing) {
    // Update source_reference to latest
    await supabase
      .from("wing_staff")
      .update({
        source_reference: staffRoleId,
        source_type: assignmentType,
      })
      .eq("id", (existing as any).id);
  } else {
    // Insert new auto-assigned entry
    await supabase.from("wing_staff").insert({
      wing_id: wingId,
      staff_id: staffId,
      school_id: schoolId,
      assignment_type: "teacher",
      auto_assigned: true,
      source_type: assignmentType,
      source_reference: staffRoleId,
    });
  }
}

/**
 * Remove auto-assigned wing entry for a teacher when their CT/ST is removed.
 *
 * Hardened: only deletes the auto row when ALL of the following hold:
 *  - No remaining CT/ST rows for this staff in the wing (other classes).
 *  - No live "manual" wing_staff row for this staff in the wing.
 *  - The auto row's `source_reference` (if set) still points to a live
 *    staff_roles row.
 *
 * A "manual" row is one of:
 *  - assignment_type = 'coordinator' (leadership, blocks auto-removal).
 *  - assignment_type = 'teacher' AND source_reference is non-null AND the
 *    source_reference points to a live staff_roles row (a real manual
 *    teacher addition tied to a live CT/ST).
 *
 * Teacher rows with NULL source_reference and no backing staff_roles are
 * treated as orphan data and DO NOT block auto-removal.
 */
export async function removeAutoAssignedTeacherFromWing(
  staffId: string,
  classId: string,
  schoolId: string
): Promise<void> {
  const wingId = await getClassWingId(classId);
  if (!wingId) return; // No wing, skip

  // 0. Find the auto row for this (wing, staff). If absent, nothing to do.
  const { data: autoRow } = await supabase
    .from("wing_staff")
    .select("id, source_reference")
    .eq("wing_id", wingId)
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .eq("assignment_type", "teacher")
    .eq("auto_assigned", true)
    .maybeSingle();
  if (!autoRow) return;

  // 1. Count remaining CT/ST rows for this staff in the wing, excluding
  //    the class we just removed. Classes of the wing = classes.wing_id = wingId.
  const { data: wingClasses } = await supabase
    .from("classes")
    .select("id")
    .eq("wing_id", wingId)
    .eq("school_id", schoolId);
  const wingClassIds = ((wingClasses ?? []) as any[])
    .map((c) => c.id)
    .filter((id) => id !== classId);

  let remainingCTST = 0;
  if (wingClassIds.length > 0) {
    const { count } = await supabase
      .from("staff_roles")
      .select("id", { count: "exact", head: true })
      .eq("staff_id", staffId)
      .eq("school_id", schoolId)
      .in("role_type", ["class_teacher", "subject_teacher"])
      .in("class_id", wingClassIds);
    remainingCTST = count ?? 0;
  }

  // 2. Count manual coordinator rows for this staff in the wing. These
  //    are leadership and always block auto-removal.
  const { count: coordRows } = await supabase
    .from("wing_staff")
    .select("id", { count: "exact", head: true })
    .eq("wing_id", wingId)
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .eq("assignment_type", "coordinator")
    .neq("auto_assigned", true);

  // 3. Count manual teacher rows with a LIVE source_reference. These
  //    are real manual teacher additions tied to a live CT/ST row.
  const { data: teacherManualRows } = await supabase
    .from("wing_staff")
    .select("id, source_reference")
    .eq("wing_id", wingId)
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .eq("assignment_type", "teacher")
    .neq("auto_assigned", true)
    .not("source_reference", "is", null);
  let liveTeacherManualRows = 0;
  if (teacherManualRows && teacherManualRows.length > 0) {
    const sourceIds = (teacherManualRows as any[])
      .map((r) => r.source_reference)
      .filter((x): x is string => !!x);
    if (sourceIds.length > 0) {
      const { data: liveSources } = await supabase
        .from("staff_roles")
        .select("id")
        .in("id", sourceIds);
      liveTeacherManualRows = (liveSources ?? []).length;
    }
  }

  // 4. Orphan check: the auto row's source_reference must point to a
  //    live staff_roles row, OR be NULL (legacy auto row).
  let sourceAlive = true;
  if ((autoRow as any).source_reference) {
    const { data: src } = await supabase
      .from("staff_roles")
      .select("id")
      .eq("id", (autoRow as any).source_reference)
      .maybeSingle();
    sourceAlive = !!src;
  }

  if (sourceAlive && remainingCTST > 0) {
    // Staff still has another live CT/ST in the wing — keep the auto row.
    return;
  }
  if ((coordRows ?? 0) > 0) {
    // Manual coordinator row protects the auto row.
    return;
  }
  if (liveTeacherManualRows > 0) {
    // Manual teacher row tied to a live CT/ST protects the auto row.
    return;
  }

  await supabase.from("wing_staff").delete().eq("id", (autoRow as any).id);
}

/**
 * Get all auto-assigned wing IDs for a staff member.
 * Used to protect the wing dropdown from unchecking auto-assigned wings.
 */
export async function getAutoAssignedWingsForStaff(
  staffId: string,
  schoolId: string
): Promise<string[]> {
  const { data } = await supabase
    .from("wing_staff")
    .select("wing_id")
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .eq("auto_assigned", true);
  return ((data ?? []) as any[]).map((r) => r.wing_id);
}

/**
 * Reap stale auto-assigned wing_staff rows whose `source_reference` no
 * longer points to a live `staff_roles` row. Use after bulk staff_roles
 * deletes that bypass the standard removeClassTeacher/removeSubjectTeacher
 * helpers, or as a one-shot reconciliation pass.
 *
 * Returns the count of rows deleted.
 */
export async function cleanupStaleAutoWingAssignments(schoolId: string): Promise<number> {
  const { data: stale } = await supabase
    .from("wing_staff")
    .select("id, staff_id, wing_id, source_reference")
    .eq("school_id", schoolId)
    .eq("auto_assigned", true)
    .not("source_reference", "is", null);

  if (!stale || stale.length === 0) return 0;

  const sourceIds = (stale as any[])
    .map((r) => r.source_reference)
    .filter((x): x is string => !!x);
  if (sourceIds.length === 0) return 0;

  const { data: live } = await supabase
    .from("staff_roles")
    .select("id")
    .in("id", sourceIds);
  const liveSet = new Set(((live ?? []) as any[]).map((r) => r.id));

  const deadIds = (stale as any[])
    .filter((r) => !liveSet.has(r.source_reference))
    .map((r) => r.id);
  if (deadIds.length === 0) return 0;

  const { error } = await supabase.from("wing_staff").delete().in("id", deadIds);
  if (error) throw error;
  return deadIds.length;
}

/**
 * Get all auto-assigned wings for a staff member, with names.
 * Used by the Staff tab UI to render read-only chips for wings the staff
 * is auto-assigned to via CT/ST.
 */
export async function getAutoAssignedWingsForStaffWithNames(
  staffId: string,
  schoolId: string
): Promise<Array<{ id: string; name: string }>> {
  const { data } = await supabase
    .from("wing_staff")
    .select("wing_id, wings:wing_id(id, name)")
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .eq("auto_assigned", true);
  return ((data ?? []) as any[])
    .map((r) => {
      const wing = (r as any).wings;
      return { id: r.wing_id as string, name: (wing?.name as string) ?? "" };
    })
    .filter((w) => !!w.name);
}

// ============== Subject Teacher ==============

export async function addSubjectTeacher(staffId: string, classId: string, sectionId: string, subjectId: string, schoolId: string, academicYearId: string | null, changedBy: string) {
  if (!academicYearId) throw new Error("No active academic year");
  const { data: inserted, error } = await supabase.from("staff_roles").insert({
    staff_id: staffId, school_id: schoolId, role_type: "subject_teacher",
    class_id: classId, section_id: sectionId, subject_id: subjectId, academic_year_id: academicYearId,
  }).select("id").single();
  if (error) throw error;

  // Auto-assign to wing if class has one
  if (inserted?.id) {
    await autoAssignTeacherToWing(staffId, classId, schoolId, inserted.id, "subject_teacher");
  }

  await logRoleAudit({ staffId, schoolId, action: "subject_teacher", field: "add", newValue: `${classId}:${sectionId}:${subjectId}`, changedBy });
}

export async function removeSubjectTeacher(staffRoleId: string, staffId: string, schoolId: string, changedBy: string) {
  // Fetch class_id before delete (needed for wing auto-unassignment)
  const { data: existing } = await supabase
    .from("staff_roles")
    .select("class_id")
    .eq("id", staffRoleId)
    .maybeSingle();

  const { error } = await supabase.from("staff_roles").delete().eq("id", staffRoleId);
  if (error) throw error;

  // Remove auto-assigned wing entry
  if ((existing as any)?.class_id) {
    await removeAutoAssignedTeacherFromWing(staffId, (existing as any).class_id, schoolId);
  }

  await logRoleAudit({ staffId, schoolId, action: "subject_teacher", field: "remove", oldValue: staffRoleId, changedBy });
}

// ============== Department ==============

export async function addDepartmentMember(staffId: string, departmentId: string, schoolId: string, asIncharge: boolean, changedBy: string) {
  const { error: e1 } = await supabase.from("departments_staff").insert({
    staff_id: staffId, department_id: departmentId, school_id: schoolId,
  });
  if (e1 && !e1.message.includes("duplicate")) throw e1;
  if (asIncharge) {
    // 2026-06-15 fix: department_incharges uses staff_profile_id (NOT
    // staff_id) and has no is_active column. Previous INSERT was silently
    // failing with "column staff_id does not exist" on Postgres side.
    const { error: e2 } = await supabase.from("department_incharges").insert({
      staff_profile_id: staffId, department_id: departmentId, school_id: schoolId,
    });
    if (e2 && !e2.message.includes("duplicate")) throw e2;
  }
  await logRoleAudit({ staffId, schoolId, action: "department", field: "add", newValue: `${departmentId}${asIncharge ? ":incharge" : ""}`, changedBy });
}

export async function removeDepartmentMember(staffId: string, departmentId: string, schoolId: string, changedBy: string) {
  const { error } = await supabase.from("departments_staff").delete().eq("staff_id", staffId).eq("department_id", departmentId);
  if (error) throw error;
  // 2026-06-15 fix: department_incharges uses staff_profile_id (NOT staff_id)
  await supabase.from("department_incharges").delete().eq("staff_profile_id", staffId).eq("department_id", departmentId);
  await logRoleAudit({ staffId, schoolId, action: "department", field: "remove", oldValue: departmentId, changedBy });
}

export async function removeDepartmentIncharge(staffId: string, departmentId: string, schoolId: string, changedBy: string) {
  // 2026-06-15 fix: department_incharges uses staff_profile_id (NOT staff_id)
  const { error } = await supabase.from("department_incharges").delete().eq("staff_profile_id", staffId).eq("department_id", departmentId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId, action: "department", field: "remove_incharge", oldValue: departmentId, changedBy });
}

// ============== House ==============

export async function setHouse(staffId: string, houseName: string, schoolId: string, changedBy: string) {
  // Belt-and-braces: if caller passed an empty/missing schoolId, derive it from the
  // staff's profile. Avoids FK violation on house_staff_school_id_fkey.
  let resolvedSchoolId = schoolId;
  if (!resolvedSchoolId) {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("school_id")
      .eq("id", staffId)
      .maybeSingle();
    if (profileErr) throw profileErr;
    if (!profile?.school_id) {
      throw new Error("Cannot resolve school_id for staff — house assignment aborted");
    }
    resolvedSchoolId = profile.school_id;
  }

  const { data: old } = await supabase.from("house_staff").select("house_name").eq("staff_profile_id", staffId).eq("school_id", resolvedSchoolId).maybeSingle();
  if (old) {
    await supabase.from("house_staff").delete().eq("staff_profile_id", staffId).eq("school_id", resolvedSchoolId);
  }
  if (houseName) {
    const { error } = await supabase.from("house_staff").insert({ house_name: houseName, staff_profile_id: staffId, school_id: resolvedSchoolId });
    if (error) throw error;
  }
  await logRoleAudit({ staffId, schoolId: resolvedSchoolId, action: "house", field: "set", oldValue: old?.house_name ?? null, newValue: houseName || null, changedBy });
}

// ============== Lookups (for edit mode) ==============

export async function getWingsForSchool(schoolId: string): Promise<WingOption[]> {
  const { data } = await supabase.from("wings").select("id, name").eq("school_id", schoolId).order("name");
  return (data ?? []) as WingOption[];
}

export async function getClassesForSchool(schoolId: string): Promise<ClassOption[]> {
  const { data } = await supabase.from("classes").select("id, name").eq("school_id", schoolId).order("display_order");
  return (data ?? []) as ClassOption[];
}

export async function getSectionsForClass(classId: string): Promise<SectionOption[]> {
  const { data } = await supabase.from("sections").select("id, name").eq("class_id", classId).order("name");
  return (data ?? []) as SectionOption[];
}

export async function getDepartmentsForSchool(schoolId: string): Promise<DepartmentOption[]> {
  const { data } = await supabase.from("departments").select("id, name").eq("school_id", schoolId).order("name");
  return (data ?? []) as DepartmentOption[];
}

export async function getHousesForSchool(schoolId: string): Promise<HouseOption[]> {
  const { data } = await supabase.from("schools").select("houses").eq("id", schoolId).single();
  const list = (data?.houses as any[]) ?? [];
  return list.map((h) => ({ name: h.name, color: h.color }));
}

export async function getCurrentAcademicYear(schoolId: string): Promise<string | null> {
  const { data } = await supabase.from("academic_sessions").select("id").eq("school_id", schoolId).eq("is_current", true).maybeSingle();
  return data?.id ?? null;
}

// ============== Per-staff role fetch ==============

export async function getWingsForStaff(staffId: string, schoolId: string) {
  const { data } = await supabase
    .from("wing_staff")
    .select("id, wing_id, wings(name)")
    .eq("staff_id", staffId).eq("school_id", schoolId).eq("assignment_type", "coordinator")
    .order("created_at", { ascending: true });
  return (data ?? []).map((r: any) => ({ id: r.id, wing_id: r.wing_id, wing_name: r.wings?.name ?? "?" }));
}

export async function getClassTeachersForStaff(staffId: string, schoolId: string) {
  const { data } = await supabase
    .from("staff_roles")
    .select("id, class_id, section_id, classes(name), sections(name)")
    .eq("staff_id", staffId)
    .eq("school_id", schoolId)
    .eq("role_type", "class_teacher");
  return (data ?? []).map((r: any) => ({
    id: r.id, class_id: r.class_id, section_id: r.section_id,
    class_name: r.classes?.name ?? "?", section_name: r.sections?.name ?? "?",
  }));
}

// getSubjectTeachersForStaff — 2026-06-13 bug fix
//
// staff_roles has FKs to classes/sections (via staff_roles_class_id_fkey,
// staff_roles_section_id_fkey) but NOT to subjects. Verified via:
//
// SELECT tc.table_name, tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table
// FROM information_schema.table_constraints tc
// JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
// JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
// WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'staff_roles'
// ORDER BY kcu.column_name;
//
// Previously this function tried to join subjects(name) which silently
// returned null (the join source is actually section_subjects for per-section
// subject names, not the generic subjects table). Now it fetches unique
// subject_ids from staff_roles and does a separate section_subjects lookup.
//
// The returned `subject_name` is now the source of truth for the label format:
// "ClassName SectionName — SubjectName".
//
// See docs/ROLE_MANAGER.md §2026-06-13 Patch.

export async function getSubjectTeachersForStaff(staffId: string, schoolId: string) {
  // staff_roles has FKs to classes/sections (via staff_roles_class_id_fkey,
  // staff_roles_section_id_fkey) but NOT to subjects, so we cannot join
  // subjects(name) directly. Fetch the rows, then look up subject_name from
  // section_subjects (which is the source of truth for per-section subject
  // names) keyed by subject_id.
  const { data } = await supabase
    .from("staff_roles")
    .select("id, class_id, section_id, subject_id, classes(name), sections(name)")
    .eq("staff_id", staffId).eq("school_id", schoolId).eq("role_type", "subject_teacher");
  const rows = data ?? [];
  const subjectIds = Array.from(new Set(rows.map((r: any) => r.subject_id).filter(Boolean)));
  let subjectMap = new Map<string, string>();
  if (subjectIds.length) {
    const { data: subs } = await supabase
      .from("section_subjects")
      .select("id, subject_name")
      .in("id", subjectIds);
    subjectMap = new Map((subs ?? []).map((s: any) => [s.id, s.subject_name]));
  }
  return rows.map((r: any) => {
    const subjectName = subjectMap.get(r.subject_id) ?? "?";
    return {
      id: r.id,
      class_id: r.class_id,
      section_id: r.section_id,
      subject_id: r.subject_id,
      class_name: r.classes?.name ?? "?",
      section_name: r.sections?.name ?? "?",
      subject_name: subjectName,
      label: `${r.classes?.name ?? "?"} ${r.sections?.name ?? "?"} — ${subjectName}`,
    };
  });
}

export async function getDepartmentsForStaff(staffId: string, schoolId: string) {
  const { data: mem } = await supabase
    .from("departments_staff")
    .select("id, department_id, departments(name)")
    .eq("staff_id", staffId).eq("school_id", schoolId);
  // 2026-06-15 fix: department_incharges uses staff_profile_id (NOT staff_id)
  // and has NO is_active column. Previous query hit Postgres with
  // "column staff_id does not exist" errors and returned no rows.
  const { data: incharges } = await supabase
    .from("department_incharges")
    .select("department_id")
    .eq("staff_profile_id", staffId).eq("school_id", schoolId);
  const inchargeSet = new Set((incharges ?? []).map((i: any) => i.department_id));
  return (mem ?? []).map((r: any) => ({
    id: r.id, department_id: r.department_id, department_name: r.departments?.name ?? "?",
    is_incharge: inchargeSet.has(r.department_id),
  }));
}

export async function getStaffHouseName(staffId: string, schoolId: string): Promise<string | null> {
  const { data } = await supabase
    .from("house_staff")
    .select("house_name")
    .eq("staff_profile_id", staffId).eq("school_id", schoolId).maybeSingle();
  return data?.house_name ?? null;
}

// ============== Combined: get all roles for a staff member ==============

export async function getStaffAllRoles(staffId: string, schoolId: string): Promise<StaffAllRoles> {
  const [profile, coordinator, classTeachers, subjectTeachers, departments, house, autoWings] = await Promise.all([
    supabase.from("profiles").select("role, status, messenger_tag, is_master_admin").eq("id", staffId).single(),
    getWingsForStaff(staffId, schoolId),
    getClassTeachersForStaff(staffId, schoolId),
    getSubjectTeachersForStaff(staffId, schoolId),
    getDepartmentsForStaff(staffId, schoolId),
    getStaffHouseName(staffId, schoolId),
    getAutoAssignedWingsForStaffWithNames(staffId, schoolId),
  ]);
  return {
    staff_id: staffId,
    is_master_admin: !!(profile.data as any)?.is_master_admin,
    is_admin: profile.data?.role === "admin",
    role: profile.data?.role ?? "teacher",
    status: profile.data?.status ?? "active",
    messenger_tag: profile.data?.messenger_tag ?? null,
    coordinator_wings: coordinator,
    auto_assigned_wings: autoWings,
    class_teachers: classTeachers,
    subject_teachers: subjectTeachers,
    departments,
    house: house ? { house_name: house } : null,
  };
}

// ============== Subjects Tab Reader ==============
//
// Extracted from the inline useState+useEffect loader in
// SubjectAssignmentGrid. Shape mirrors what the component previously
// stored in local state, so the migration is mechanical. No SQL change.
//
// Used by `useSubjects` in src/hooks/useRoleManagerQueries.ts.

export interface SubjectSectionSubject {
  id: string;
  subject_name: string;
  subject_code: string | null;
}

export interface SubjectSection {
  id: string;
  name: string;
  acronym: string | null;
  display_order: number | null;
  class: {
    id: string;
    name: string;
    wing_id: string | null;
    display_order: number;
  };
  section_subjects: SubjectSectionSubject[];
}

export interface SubjectAssignmentRow {
  id: string;
  role_type: "class_teacher" | "subject_teacher";
  section_id: string;
  subject_id: string | null;
  staff_id: string;
  staff?: { full_name: string } | null;
}

export interface SubjectWing {
  id: string;
  name: string;
}

export interface SubjectStaffLite {
  id: string;
  full_name: string;
}

export interface SubjectsForSchool {
  sections: SubjectSection[];
  wings: SubjectWing[];
  assignments: SubjectAssignmentRow[];
  staffList: SubjectStaffLite[];
}

export async function getSubjectsForSchool(schoolId: string): Promise<SubjectsForSchool> {
  // 1. Current session — sections are scoped to a session_id.
  const { data: sessionData } = await supabase
    .from("academic_sessions")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (!sessionData) {
    return { sections: [], wings: [], assignments: [], staffList: [] };
  }

  // 2. Sections with class + section_subjects
  const { data: sectionsData } = await supabase
    .from("sections")
    .select(`
      id, name, acronym, display_order,
      class:classes(id, name, wing_id, display_order),
      section_subjects(id, subject_name, subject_code)
    `)
    .eq("school_id", schoolId)
    .eq("session_id", sessionData.id)
    .order("display_order");

  // 3. Wings
  const { data: wingsData } = await supabase
    .from("wings")
    .select("id, name")
    .eq("school_id", schoolId)
    .order("display_order");

  // 4. Existing assignments — see FK comment in SubjectAssignmentGrid
  //    (staff_roles has two FKs to profiles; use explicit FK name).
  const { data: assignmentsData } = await supabase
    .from("staff_roles")
    .select(`
      id, role_type, section_id, subject_id, staff_id,
      staff:profiles!staff_roles_staff_id_fkey(full_name)
    `)
    .eq("school_id", schoolId);

  // 5. Active staff list for the picker
  const { data: staffData } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("school_id", schoolId)
    .eq("status", "active")
    .order("full_name");

  return {
    sections: (sectionsData as unknown as SubjectSection[]) ?? [],
    wings: (wingsData as unknown as SubjectWing[]) ?? [],
    assignments: (assignmentsData as unknown as SubjectAssignmentRow[]) ?? [],
    staffList: (staffData as unknown as SubjectStaffLite[]) ?? [],
  };
}
