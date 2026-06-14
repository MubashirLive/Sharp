import { supabase } from "@/integrations/supabase/client";

// ============== Types ==============

export interface StaffAllRoles {
  staff_id: string;
  is_master_admin: boolean;
  is_admin: boolean;
  role: string;
  status: string;
  messenger_tag: string | null;
  coordinator: { id: string; wing_id: string; wing_name: string } | null;
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

  const { error } = await supabase.from("staff_roles").insert({
    staff_id: staffId,
    school_id: schoolId,
    role_type: "class_teacher",
    class_id: classId,
    section_id: sectionId,
    subject_id: null,
    academic_year_id: ay?.id ?? null,
    assigned_by: changedBy,
  });
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId, action: "class_teacher", field: "add", newValue: `${classId}:${sectionId}`, changedBy });
}

export async function removeClassTeacher(staffRoleId: string, staffId: string, schoolId: string, changedBy: string) {
  // staffRoleId is the staff_roles.id row id. Scope by school_id to be safe.
  const { error } = await supabase
    .from("staff_roles")
    .delete()
    .eq("id", staffRoleId)
    .eq("school_id", schoolId)
    .eq("role_type", "class_teacher");
  if (error) throw error;
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

// ============== Subject Teacher ==============

export async function addSubjectTeacher(staffId: string, classId: string, sectionId: string, subjectId: string, schoolId: string, academicYearId: string | null, changedBy: string) {
  if (!academicYearId) throw new Error("No active academic year");
  const { error } = await supabase.from("staff_roles").insert({
    staff_id: staffId, school_id: schoolId, role_type: "subject_teacher",
    class_id: classId, section_id: sectionId, subject_id: subjectId, academic_year_id: academicYearId,
  });
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId, action: "subject_teacher", field: "add", newValue: `${classId}:${sectionId}:${subjectId}`, changedBy });
}

export async function removeSubjectTeacher(staffRoleId: string, staffId: string, schoolId: string, changedBy: string) {
  const { error } = await supabase.from("staff_roles").delete().eq("id", staffRoleId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId, action: "subject_teacher", field: "remove", oldValue: staffRoleId, changedBy });
}

// ============== Department ==============

export async function addDepartmentMember(staffId: string, departmentId: string, schoolId: string, asIncharge: boolean, changedBy: string) {
  const { error: e1 } = await supabase.from("departments_staff").insert({
    staff_id: staffId, department_id: departmentId, school_id: schoolId,
  });
  if (e1 && !e1.message.includes("duplicate")) throw e1;
  if (asIncharge) {
    const { error: e2 } = await supabase.from("department_incharges").insert({
      staff_id: staffId, department_id: departmentId, school_id: schoolId, is_active: true,
    });
    if (e2 && !e2.message.includes("duplicate")) throw e2;
  }
  await logRoleAudit({ staffId, schoolId, action: "department", field: "add", newValue: `${departmentId}${asIncharge ? ":incharge" : ""}`, changedBy });
}

export async function removeDepartmentMember(staffId: string, departmentId: string, schoolId: string, changedBy: string) {
  const { error } = await supabase.from("departments_staff").delete().eq("staff_id", staffId).eq("department_id", departmentId);
  if (error) throw error;
  await supabase.from("department_incharges").delete().eq("staff_id", staffId).eq("department_id", departmentId);
  await logRoleAudit({ staffId, schoolId, action: "department", field: "remove", oldValue: departmentId, changedBy });
}

export async function removeDepartmentIncharge(staffId: string, departmentId: string, schoolId: string, changedBy: string) {
  const { error } = await supabase.from("department_incharges").delete().eq("staff_id", staffId).eq("department_id", departmentId);
  if (error) throw error;
  await logRoleAudit({ staffId, schoolId, action: "department", field: "remove_incharge", oldValue: departmentId, changedBy });
}

// ============== House ==============

export async function setHouse(staffId: string, houseName: string, schoolId: string, changedBy: string) {
  const { data: old } = await supabase.from("house_staff").select("house_name").eq("staff_profile_id", staffId).eq("school_id", schoolId).maybeSingle();
  if (old) {
    await supabase.from("house_staff").delete().eq("staff_profile_id", staffId).eq("school_id", schoolId);
  }
  if (houseName) {
    const { error } = await supabase.from("house_staff").insert({ house_name: houseName, staff_profile_id: staffId, school_id: schoolId });
    if (error) throw error;
  }
  await logRoleAudit({ staffId, schoolId, action: "house", field: "set", oldValue: old?.house_name ?? null, newValue: houseName || null, changedBy });
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
    .eq("staff_id", staffId).eq("school_id", schoolId).eq("assignment_type", "coordinator");
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
  const { data: incharges } = await supabase
    .from("department_incharges")
    .select("department_id")
    .eq("staff_id", staffId).eq("school_id", schoolId).eq("is_active", true);
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
  const [profile, coordinator, classTeachers, subjectTeachers, departments, house] = await Promise.all([
    supabase.from("profiles").select("role, status, messenger_tag, is_master_admin").eq("id", staffId).single(),
    getWingsForStaff(staffId, schoolId),
    getClassTeachersForStaff(staffId, schoolId),
    getSubjectTeachersForStaff(staffId, schoolId),
    getDepartmentsForStaff(staffId, schoolId),
    getStaffHouseName(staffId, schoolId),
  ]);
  return {
    staff_id: staffId,
    is_master_admin: !!(profile.data as any)?.is_master_admin,
    is_admin: profile.data?.role === "admin",
    role: profile.data?.role ?? "teacher",
    status: profile.data?.status ?? "active",
    messenger_tag: profile.data?.messenger_tag ?? null,
    coordinator: coordinator[0] ?? null,
    class_teachers: classTeachers,
    subject_teachers: subjectTeachers,
    departments,
    house: house ? { house_name: house } : null,
  };
}
