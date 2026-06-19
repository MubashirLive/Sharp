import { supabase } from "../client";
import type { Database } from "../types";

export type WingCoordinator = Database["public"]["Tables"]["wings_coordinators"]["Row"];
export type WingActivityStaff = Database["public"]["Tables"]["wings_activity_staff"]["Row"];
export type WingAuditLog = Database["public"]["Tables"]["wings_audit_log"]["Row"];

export interface WingStaffMember {
  id: string;
  staff_id: string;
  assignment_type: "teacher" | "coordinator";
  staff_name: string;
  is_active: boolean;
  is_primary?: boolean;
  auto_assigned?: boolean;
  source_type?: "manual" | "class_teacher" | "subject_teacher";
  source_reference?: string;
  class_teacher_for?: string;
  subject_teacher_for?: string;
}

export type WingWithDetails = {
  id: string;
  name: string;
  school_id: string;
  display_order: number | null;
  created_at: string | null;
  coordinators: (WingCoordinator & { staff_name: string; staff_role: string; is_active: boolean })[];
  activity_staff: (WingActivityStaff & { staff_name: string; is_active: boolean })[];
  classes: { id: string; name: string; acronym: string | null; display_order: number }[];
  teacher_assignments: {
    staff_id: string;
    staff_name: string;
    class_name: string;
    subject_name?: string;
    role: "subject_teacher" | "class_teacher";
  }[];
};

export async function getWingsWithDetails(schoolId: string): Promise<WingWithDetails[]> {
  type ClassTeacherRow = { staff_profile_id: string; section_id: string; class_id: string };
  const [classTeachersResult, subjectTeachersResult] = await Promise.all([
    supabase.from("staff_roles").select("staff_id, class_id, section_id").eq("school_id", schoolId).eq("role_type", "class_teacher") as ReturnType<typeof supabase.from>,
    supabase.from("subject_teachers").select("staff_profile_id, class_id, section_id, subject_name").eq("school_id", schoolId) as ReturnType<typeof supabase.from>,
  ]);

  const { data: wings } = await supabase.from("wings").select("*").eq("school_id", schoolId).order("display_order");
  const { data: coordinators } = await supabase.from("wings_coordinators").select("*").eq("school_id", schoolId);
  const { data: activityStaff } = await supabase.from("wings_activity_staff").select("*").eq("school_id", schoolId);
  const { data: classes } = await supabase.from("classes").select("id, name, acronym, wing_id, display_order").eq("school_id", schoolId);

  const classTeachers = (classTeachersResult as unknown as { data: { staff_id: string; class_id: string; section_id: string }[] })?.data ?? [];
  const subjectTeachers = (subjectTeachersResult as unknown as { data: { staff_profile_id: string; class_id: string; section_id: string; subject_name: string | null }[] })?.data ?? [];

  if (!wings) return [];

  // Fetch staff profiles for names
  const allStaffIds = [
    ...(coordinators ?? []).map((c) => c.staff_id),
    ...(activityStaff ?? []).map((a) => a.staff_id),
    ...(subjectTeachers ?? []).map((s) => s.staff_profile_id),
    ...(classTeachers ?? []).map((c) => c.staff_profile_id),
  ];
  const uniqueStaffIds = [...new Set(allStaffIds)];

  const { data: profiles } = uniqueStaffIds.length
    ? await supabase.from("profiles").select("id, full_name, role").in("id", uniqueStaffIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Build class detail map (wing assignments via class)
  const classDetailMap = new Map((classes ?? []).map((c) => [c.id, c]));
  const sectionClassMap = new Map<string, string>();

  // For class_teachers: get sections to find class_id
  const classTeacherSectionIds = (classTeachers ?? []).map((c) => c.section_id).filter(Boolean);
  const { data: sections } = classTeacherSectionIds.length
    ? await supabase.from("sections").select("id, class_id").in("id", classTeacherSectionIds)
    : { data: [] };

  for (const sec of sections ?? []) {
    if (sec.class_id) sectionClassMap.set(sec.id, sec.class_id);
  }

  const teacherAssignments: WingWithDetails["teacher_assignments"] = [];

  // Process subject teachers
  for (const st of subjectTeachers ?? []) {
    if (!st.staff_profile_id) continue;
    const clsId = st.class_id;
    if (!clsId) continue;
    const cls = classDetailMap.get(clsId);
    if (!cls?.wing_id) continue;
    const profile = profileMap.get(st.staff_profile_id);
    teacherAssignments.push({
      staff_id: st.staff_profile_id,
      staff_name: profile?.full_name ?? "Unknown",
      class_name: cls.name,
      subject_name: st.subject_name ?? undefined,
      role: "subject_teacher" as const,
    });
  }

  // Process class teachers
  for (const ct of classTeachers ?? []) {
    if (!ct.section_id || !ct.staff_profile_id) continue;
    const clsId = sectionClassMap.get(ct.section_id) ?? ct.class_id;
    if (!clsId) continue;
    const cls = classDetailMap.get(clsId);
    if (!cls?.wing_id) continue;
    const profile = profileMap.get(ct.staff_profile_id);
    teacherAssignments.push({
      staff_id: ct.staff_profile_id,
      staff_name: profile?.full_name ?? "Unknown",
      class_name: cls.name,
      role: "class_teacher" as const,
    });
  }

  return wings.map((wing) => ({
    id: wing.id,
    name: wing.name,
    school_id: wing.school_id,
    display_order: wing.display_order,
    created_at: wing.created_at,
    coordinators: (coordinators ?? [])
      .filter((c) => c.wing_id === wing.id)
      .map((c) => {
        const profile = profileMap.get(c.staff_id);
        return { ...c, staff_name: profile?.full_name ?? "Unknown", staff_role: profile?.role ?? "staff", is_active: profile?.role !== "inactive" };
      }),
    activity_staff: (activityStaff ?? [])
      .filter((a) => a.wing_id === wing.id)
      .map((a) => {
        const profile = profileMap.get(a.staff_id);
        return { ...a, staff_name: profile?.full_name ?? "Unknown", is_active: profile?.role !== "inactive" };
      }),
    classes: (classes ?? [])
      .filter((c) => c.wing_id === wing.id)
      .map((c) => ({ id: c.id, name: c.name ?? "", acronym: c.acronym ?? null, display_order: (c as any).display_order ?? 999 })),
    teacher_assignments: teacherAssignments.filter((t) =>
      (classes ?? [])
        .filter((c) => c.wing_id === wing.id)
        .some((cls) => cls.id === classDetailMap.get(t.class_name)?.id)
    ),
  }));
}

export async function getWingsAuditLog(schoolId: string, wingId?: string): Promise<WingAuditLog[]> {
  let query = supabase
    .from("wings_audit_log")
    .select("*")
    .eq("school_id", schoolId)
    .order("changed_at", { ascending: false })
    .limit(100);

  if (wingId) query = query.eq("wing_id", wingId);

  const { data } = await query;
  return data ?? [];
}

export async function checkStaffSoleCoordinator(staffId: string): Promise<{ isSoleCoordinator: boolean; wingNames: string[] }> {
  // Read from wing_staff (unified table) instead of old wings_coordinators
  const { data: staffWings } = await supabase
    .from("wing_staff")
    .select("wing_id, assignment_type")
    .eq("staff_id", staffId)
    .eq("assignment_type", "coordinator");

  if (!staffWings || staffWings.length === 0) return { isSoleCoordinator: false, wingNames: [] };

  // Get unique wing IDs this staff is coordinator for
  const wingIds = [...new Set(staffWings.map((sw) => sw.wing_id))];
  if (wingIds.length === 0) return { isSoleCoordinator: false, wingNames: [] };

  // Get wing names
  const { data: wings } = await supabase
    .from("wings")
    .select("id, name")
    .in("id", wingIds);

  const wingNames: string[] = [];
  for (const wingId of wingIds) {
    const count = await supabase
      .from("wing_staff")
      .select("id", { count: "exact", head: true })
      .eq("wing_id", wingId)
      .eq("assignment_type", "coordinator");

    if ((count.count ?? 0) <= 1) {
      const wing = wings?.find((w) => w.id === wingId);
      if (wing?.name) wingNames.push(wing.name);
    }
  }

  return { isSoleCoordinator: wingNames.length > 0, wingNames };
}

export async function logWingAction(params: {
  schoolId: string;
  userId: string;
  userName: string;
  wingId?: string;
  wingName?: string;
  action: string;
  what: string;
}) {
  const { data, error, status } = await supabase.from("wings_audit_log").insert({
    school_id: params.schoolId,
    user_id: params.userId,
    user_name: params.userName,
    wing_id: params.wingId ?? null,
    wing_name: params.wingName ?? null,
    action: params.action,
    what: params.what,
  }).select();

  if (error) {
    console.error("[logWingAction] Error:", error.message, "Status:", status);
  } else {
  }
}

export async function getStaffWingAssignments(schoolId: string) {
  type STRow = { staff_profile_id: string; class_id: string; section_id: string; subject_name: string | null };
  type CTRow = { staff_id: string; class_id: string; section_id: string };

  const [allStaffResult, coordinatorsResult, activityStaffResult, subjectTeachersResult, classTeachersResult] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role").eq("school_id", schoolId).order("full_name") as ReturnType<typeof supabase.from>,
    supabase.from("wings_coordinators").select("*").eq("school_id", schoolId) as ReturnType<typeof supabase.from>,
    supabase.from("wings_activity_staff").select("*").eq("school_id", schoolId) as ReturnType<typeof supabase.from>,
    supabase.from("subject_teachers").select("staff_profile_id, class_id, section_id, subject_name").eq("school_id", schoolId) as ReturnType<typeof supabase.from>,
    supabase.from("staff_roles").select("staff_id, class_id, section_id").eq("school_id", schoolId).eq("role_type", "class_teacher") as ReturnType<typeof supabase.from>,
  ]);

  const allStaff = (allStaffResult as unknown as { data: { id: string; full_name: string; role: string }[] })?.data ?? [];
  const coordinators = (coordinatorsResult as unknown as { data: { staff_id: string; wing_id: string; role: string | null }[] })?.data ?? [];
  const activityStaff = (activityStaffResult as unknown as { data: { staff_id: string; wing_id: string }[] })?.data ?? [];
  const subjectTeachers = (subjectTeachersResult as unknown as { data: STRow[] })?.data ?? [];
  const classTeachers = (classTeachersResult as unknown as { data: CTRow[] })?.data ?? [];

  // Build class→wing map
  const { data: classes } = await supabase.from("classes").select("id, name, wing_id").eq("school_id", schoolId).not("wing_id", "is", null);
  const classWingMap = new Map((classes ?? []).map((c) => [c.id, c.wing_id]));
  const classNameMap = new Map((classes ?? []).map((c) => [c.id, c.name]));

  // Build staff→wings assignments
  const staffWingsMap = new Map<string, { wing_id: string; role: string }[]>();

  for (const c of coordinators ?? []) {
    const existing = staffWingsMap.get(c.staff_id) ?? [];
    existing.push({ wing_id: c.wing_id, role: c.role ?? "COORDINATOR" });
    staffWingsMap.set(c.staff_id, existing);
  }

  for (const a of activityStaff ?? []) {
    const existing = staffWingsMap.get(a.staff_id) ?? [];
    existing.push({ wing_id: a.wing_id, role: "ACTIVITY_STAFF" });
    staffWingsMap.set(a.staff_id, existing);
  }

  for (const st of subjectTeachers ?? []) {
    if (!st.staff_profile_id) continue;
    const existing = staffWingsMap.get(st.staff_profile_id) ?? [];
    existing.push({ wing_id: classWingMap.get(st.class_id) ?? "", role: "SUBJECT_TEACHER" });
    staffWingsMap.set(st.staff_profile_id, existing);
  }

  for (const ct of classTeachers ?? []) {
    if (!ct.staff_id) continue;
    const existing = staffWingsMap.get(ct.staff_id) ?? [];
    existing.push({ wing_id: classWingMap.get(ct.class_id) ?? "", role: "CLASS_TEACHER" });
    staffWingsMap.set(ct.staff_id, existing);
  }

  return { allStaff: allStaff ?? [], staffWingsMap, classWingMap, classNameMap };
}

// ============================================================================
// WINGS TAB ENHANCED QUERIES (for Role Manager)
// ============================================================================

export interface WingStats {
  id: string;
  name: string;
  display_order: number | null;
  classCount: number;
  studentCount: number;
  teacherCount: number;
  coordinatorCount: number;
}

export interface WingWithStats {
  id: string;
  name: string;
  display_order: number | null;
  classes: { id: string; name: string; acronym: string | null }[];
  stats: {
    students: number;
    teachers: number;
    coordinators: number;
    totalStaff: number;
  };
  coordinators: WingStaffMember[];
  teachers: WingStaffMember[];
}

/**
 * Fetch wings with their coordinators, teachers, classes and student counts.
 *
 * Data sources merged per wing:
 *  - `wings`                — wing metadata
 *  - `classes`              — classes belonging to the wing
 *  - `wing_staff`           — manual coordinator/teacher assignments
 *  - `staff_roles` (role_type = 'class_teacher') — auto-assigned class teachers
 *  - `subject_teachers`     — auto-assigned subject teachers
 *  - `student_profiles`     — student counts per class
 *
 * Notes:
 *  - `staff_roles.staff_id` is the column. `staff_profiles.id` is NOT the
 *    same key. Reading `staff_profile_id` on a `staff_roles` row returns
 *    undefined (legacy `class_teachers` column name) — see the type cast
 *    for `classTeachers` below.
 *  - Auto-assigned teachers (from `staff_roles` / `subject_teachers`) have
 *    a `wing_staff` row with `auto_assigned=true`. They are managed by the
 *    auto-assign flow in `roleAssignments.ts` (added/removed alongside
 *    CT/ST changes). They cannot be removed via the Wings tab UI — the
 *    X button is disabled.
 */
export async function getWingsWithFullDetails(schoolId: string): Promise<WingWithStats[]> {
  type WingStaffRow = {
    wing_id: string;
    staff_id: string;
    assignment_type: string;
    is_primary?: boolean;
    auto_assigned?: boolean;
    source_type?: string;
    source_reference?: string;
  };

  const [
    wingsResult,
    classesResult,
    wingStaffResult,
    studentProfilesResult,
    classTeachersResult,
    subjectTeachersResult,
  ] = await Promise.all([
    supabase.from("wings").select("id, name, display_order").eq("school_id", schoolId).order("display_order"),
    supabase.from("classes").select("id, name, acronym, wing_id").eq("school_id", schoolId).order("display_order"),
    supabase.from("wing_staff").select("*").eq("school_id", schoolId),
    supabase.from("student_profiles").select("class_id").eq("school_id", schoolId),
    supabase.from("staff_roles").select("staff_id, class_id").eq("school_id", schoolId).eq("role_type", "class_teacher"),
    supabase.from("subject_teachers").select("staff_profile_id, class_id").eq("school_id", schoolId),
  ]);

  const wings = (wingsResult as unknown as { id: string; name: string; display_order: number | null }[])?.data ?? [];
  const classes = (classesResult as unknown as { id: string; name: string; acronym: string | null; wing_id: string | null }[])?.data ?? [];
  const wingStaff = (wingStaffResult as unknown as WingStaffRow[])?.data ?? [];
  const studentProfiles = (studentProfilesResult as unknown as { class_id: string | null }[])?.data ?? [];
  // `class_teachers` was migrated to `staff_roles` (role_type='class_teacher').
  // Column is `staff_id` here, NOT `staff_profile_id` (that was the legacy
  // `class_teachers` column name). `subject_teachers` keeps `staff_profile_id`.
  const classTeachers = (classTeachersResult as unknown as { staff_id: string; class_id: string }[])?.data ?? [];
  const subjectTeachers = (subjectTeachersResult as unknown as { staff_profile_id: string; class_id: string }[])?.data ?? [];

  // Get all unique staff IDs
  const allStaffIds = [
    ...wingStaff.map((ws) => ws.staff_id),
    ...classTeachers.map((ct) => ct.staff_id),
    ...subjectTeachers.map((st) => st.staff_profile_id),
  ];
  const uniqueStaffIds = [...new Set(allStaffIds)];

  const { data: profiles } = uniqueStaffIds.length
    ? await supabase.from("profiles").select("id, full_name, role").in("id", uniqueStaffIds)
    : { data: [] };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, { full_name: p.full_name, role: p.role }]));

  // Build maps
  const classWingMap = new Map(classes.map((c) => [c.id, c.wing_id]));
  const classIdsByWing = new Map<string, string[]>();
  for (const c of classes) {
    if (c.wing_id) {
      const existing = classIdsByWing.get(c.wing_id) ?? [];
      existing.push(c.id);
      classIdsByWing.set(c.wing_id, existing);
    }
  }

  // Count students per wing
  const studentCountByWing = new Map<string, number>();
  for (const sp of studentProfiles) {
    if (sp.class_id) {
      const wingId = classWingMap.get(sp.class_id);
      if (wingId) {
        studentCountByWing.set(wingId, (studentCountByWing.get(wingId) ?? 0) + 1);
      }
    }
  }

  // Get staff teaching in each wing from class_teachers (now staff_roles) and subject_teachers
  const teacherStaffIdsByWing = new Map<string, Set<string>>();
  for (const ct of classTeachers) {
    const wingId = classWingMap.get(ct.class_id);
    if (wingId && ct.staff_id) {
      const existing = teacherStaffIdsByWing.get(wingId) ?? new Set();
      existing.add(ct.staff_id);
      teacherStaffIdsByWing.set(wingId, existing);
    }
  }
  for (const st of subjectTeachers) {
    const wingId = classWingMap.get(st.class_id);
    if (wingId && st.staff_profile_id) {
      const existing = teacherStaffIdsByWing.get(wingId) ?? new Set();
      existing.add(st.staff_profile_id);
      teacherStaffIdsByWing.set(wingId, existing);
    }
  }

  // Build wing_staff maps
  const teachersByWing = new Map<string, WingStaffMember[]>();
  const coordinatorsByWing = new Map<string, WingStaffMember[]>();

  for (const ws of wingStaff) {
    const profile = profileMap.get(ws.staff_id);
    const member: WingStaffMember = {
      id: ws.staff_id,
      staff_id: ws.staff_id,
      assignment_type: ws.assignment_type as "teacher" | "coordinator",
      staff_name: profile?.full_name ?? "Unknown",
      is_active: profile?.role !== "inactive",
      is_primary: ws.is_primary || false,
      auto_assigned: ws.auto_assigned || false,
      source_type: ws.source_type as "manual" | "class_teacher" | "subject_teacher" | undefined,
      source_reference: ws.source_reference,
    };

    if (ws.assignment_type === "coordinator") {
      const existing = coordinatorsByWing.get(ws.wing_id) ?? [];
      existing.push(member);
      coordinatorsByWing.set(ws.wing_id, existing);
    } else if (ws.assignment_type === "teacher") {
      const existing = teachersByWing.get(ws.wing_id) ?? [];
      existing.push(member);
      teachersByWing.set(ws.wing_id, existing);
    }
    // Skip assignment_type !== coordinator/teacher (should not happen but defensive)
  }

  // Merge class-based teachers into teachersByWing (avoid duplicates)
  teacherStaffIdsByWing.forEach((staffIds, wingId) => {
    const existing = teachersByWing.get(wingId) ?? [];
    const existingIds = new Set(existing.map((e) => e.staff_id));

    for (const staffId of staffIds) {
      if (!existingIds.has(staffId)) {
        const profile = profileMap.get(staffId);
        existing.push({
          id: staffId,
          staff_id: staffId,
          assignment_type: "teacher" as const,
          staff_name: profile?.full_name ?? "Unknown",
          is_active: profile?.role !== "inactive",
          auto_assigned: true,
          source_type: "class_teacher" as const,
        });
        existingIds.add(staffId);
      }
    }
    teachersByWing.set(wingId, existing);
  });

  // Build final result
  return wings.map((wing) => {
    const wingClassObjs = classes
      .filter((c) => c.wing_id === wing.id)
      .map((c) => ({ id: c.id, name: c.name, acronym: c.acronym }));

    return {
      id: wing.id,
      name: wing.name,
      display_order: wing.display_order,
      classes: wingClassObjs,
      stats: {
        students: studentCountByWing.get(wing.id) ?? 0,
        teachers: teachersByWing.get(wing.id)?.length ?? 0,
        coordinators: coordinatorsByWing.get(wing.id)?.length ?? 0,
        totalStaff: (coordinatorsByWing.get(wing.id)?.length ?? 0) + (teachersByWing.get(wing.id)?.length ?? 0),
      },
      coordinators: coordinatorsByWing.get(wing.id) ?? [],
      teachers: teachersByWing.get(wing.id) ?? [],
    };
  });
}

// Add staff to wing
export async function addStaffToWing(
  wingId: string,
  staffId: string,
  assignmentType: "teacher" | "coordinator",
  schoolId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("wing_staff").insert({
      wing_id: wingId,
      staff_id: staffId,
      assignment_type: assignmentType,
      school_id: schoolId,
    });

    if (error) {
      if (error.code === "23505") {
        return { success: false, error: "Staff already assigned to this wing" };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Remove staff from wing
export async function removeStaffFromWing(
  wingId: string,
  staffId: string,
  assignmentType: "teacher" | "coordinator"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("wing_staff")
      .delete()
      .eq("wing_id", wingId)
      .eq("staff_id", staffId)
      .eq("assignment_type", assignmentType);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Get staff not assigned to a specific wing
export async function getAvailableStaffForWing(
  schoolId: string,
  wingId?: string
): Promise<{ id: string; full_name: string; father_name?: string }[]> {
  let query = supabase
    .from("staff_profiles")
    .select("profile_id, full_name, father_name")
    .eq("school_id", schoolId)
    .order("full_name");

  const { data: staffProfiles, error } = await query;

  if (error || !staffProfiles) {
    return [];
  }

  // If no wing specified, return all active staff
  if (!wingId) {
    return (staffProfiles as unknown as { profile_id: string; full_name: string; father_name?: string }[]).map((s) => ({
      id: s.profile_id,
      full_name: s.full_name,
      father_name: s.father_name,
    }));
  }

  // Get staff already in this wing
  const { data: existingStaff } = await supabase
    .from("wing_staff")
    .select("staff_id")
    .eq("wing_id", wingId);

  const existingIds = new Set((existingStaff ?? []).map((s) => s.staff_id));

  // Filter out existing staff
  return (staffProfiles as unknown as { profile_id: string; full_name: string; father_name?: string }[])
    .filter((s) => !existingIds.has(s.profile_id))
    .map((s) => ({
      id: s.profile_id,
      full_name: s.full_name,
      father_name: s.father_name,
    }));
}

// Set staff as primary coordinator
export async function setPrimaryCoordinator(
  wingId: string,
  staffId: string,
  schoolId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First, unset all primary coordinators for this wing
    const { error: unsetError } = await supabase
      .from("wing_staff")
      .update({ is_primary: false })
      .eq("wing_id", wingId)
      .eq("assignment_type", "coordinator")
      .eq("school_id", schoolId);

    if (unsetError) {
      return { success: false, error: unsetError.message };
    }

    // Set this coordinator as primary
    const { error: setError } = await supabase
      .from("wing_staff")
      .update({ is_primary: true })
      .eq("wing_id", wingId)
      .eq("staff_id", staffId)
      .eq("assignment_type", "coordinator");

    if (setError) {
      return { success: false, error: setError.message };
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}