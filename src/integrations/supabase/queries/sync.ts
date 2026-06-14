import { supabase } from "../client";
import type { Database } from "../types";
import { toast } from "sonner";

// Sync class wing assignment to wing_staff table
export async function syncClassWingToWingStaff(classId: string, wingId: string, schoolId: string): Promise<boolean> {
  if (!wingId) {
    // Clear wing assignments for this class
    const { error } = await supabase
      .from("wing_staff")
      .delete()
      .eq("school_id", schoolId)
      .in(
        "staff_id",
        supabase
          .from("staff_profiles")
          .select("profile_id")
          .eq("school_id", schoolId)
          .in(
            "profile_id",
            supabase
              .from("staff_profiles")
              .select("profile_id")
              .eq("school_id", schoolId)
              .in(
                "profile_id",
                supabase
                  .from("staff_profiles")
                  .select("profile_id")
                  .eq("school_id", schoolId)
                  .eq("status", "active")
                  .not("id", "in", "(SELECT staff_id FROM wing_staff WHERE wing_id = $1)", true)
              )
          )
      );

    return !error;
  }

  // Get all active staff in this school
  const { data: allStaff } = await supabase
    .from("staff_profiles")
    .select("profile_id")
    .eq("school_id", schoolId)
    .eq("status", "active");

  if (!allStaff || allStaff.length === 0) {
    return true;
  }

  // Get staff already assigned to this wing
  const { data: existingStaff } = await supabase
    .from("wing_staff")
    .select("staff_id")
    .eq("school_id", schoolId)
    .eq("wing_id", wingId);

  const existingIds = new Set((existingStaff ?? []).map((s) => s.staff_id));

  // Get all teachers in this class
  const [classTeachers, subjectTeachers] = await Promise.all([
    supabase
      .from("staff_roles")
      .select("staff_id")
      .eq("school_id", schoolId)
      .eq("role_type", "class_teacher")
      .eq("class_id", classId),
    supabase
      .from("subject_teachers")
      .select("staff_profile_id")
      .eq("school_id", schoolId)
      .eq("class_id", classId),
  ]);

  const classTeacherIds = (classTeachers?.data ?? []).map((ct) => ct.staff_id);
  const subjectTeacherIds = (subjectTeachers?.data ?? []).map((st) => st.staff_profile_id);
  const allTeacherIds = [...new Set([...classTeacherIds, ...subjectTeacherIds])];

  // Find teachers not already in this wing
  const newTeacherIds = allTeacherIds.filter((id) => !existingIds.has(id));

  if (newTeacherIds.length > 0) {
    const assignments = newTeacherIds.map((staffId) => ({
      wing_id: wingId,
      staff_id: staffId,
      assignment_type: "teacher" as const,
      school_id: schoolId,
    }));

    const { error } = await supabase
      .from("wing_staff")
      .insert(assignments);

    if (error) {
      console.error("Failed to add staff to wing:", error);
      return false;
    }
  }

  return true;
}

// Check if a staff has teaching assignments in a class
export async function staffHasTeachingAssignments(staffId: string, classId: string, schoolId: string): Promise<boolean> {
  const [classTeacher, subjectTeacher] = await Promise.all([
    supabase
      .from("staff_roles")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("role_type", "class_teacher")
      .eq("staff_id", staffId)
      .eq("class_id", classId),
    supabase
      .from("subject_teachers")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId)
      .eq("staff_profile_id", staffId)
      .eq("class_id", classId),
  ]);

  return (classTeacher.count ?? 0) > 0 || (subjectTeacher.count ?? 0) > 0;
}

// Auto-assign staff to wing based on their class assignments
export async function autoAssignStaffToWings(schoolId: string, wingId: string): Promise<void> {
  // Get all classes in this wing
  const { data: wingClasses } = await supabase
    .from("classes")
    .select("id")
    .eq("school_id", schoolId)
    .eq("wing_id", wingId);

  if (!wingClasses || wingClasses.length === 0) {
    return;
  }

  const classIds = wingClasses.map((c) => c.id);

  // Get all teachers in these classes
  const [classTeachers, subjectTeachers] = await Promise.all([
    supabase
      .from("staff_roles")
      .select("staff_id, class_id")
      .eq("role_type", "class_teacher")
      .in("class_id", classIds),
    supabase
      .from("subject_teachers")
      .select("staff_profile_id, class_id")
      .in("class_id", classIds),
  ]);

  const allTeachers = [
    ...(classTeachers?.data ?? []).map((ct) => ({ staff_id: ct.staff_id })),
    ...(subjectTeachers?.data ?? []).map((st) => ({ staff_id: st.staff_profile_id })),
  ];

  const uniqueTeachers = [...new Set(allTeachers.map((t) => t.staff_id))];

  // Get existing staff in this wing
  const { data: existingStaff } = await supabase
    .from("wing_staff")
    .select("staff_id")
    .eq("school_id", schoolId)
    .eq("wing_id", wingId);

  const existingIds = new Set((existingStaff ?? []).map((s) => s.staff_id));

  // Find teachers not in this wing
  const newTeacherIds = uniqueTeachers.filter((id) => !existingIds.has(id));

  if (newTeacherIds.length > 0) {
    const assignments = newTeacherIds.map((staffId) => ({
      wing_id: wingId,
      staff_id: staffId,
      assignment_type: "teacher" as const,
      school_id: schoolId,
    }));

    const { error } = await supabase
      .from("wing_staff")
      .insert(assignments);

    if (error) {
      console.error("Failed to auto-assign staff to wing:", error);
    }
  }
}