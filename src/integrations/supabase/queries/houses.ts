import { supabase } from "../client";

// ============================================================================
// TYPES
// ============================================================================

export interface HouseDefinition {
  name: string;
  color: string;
  emblem_url: string;
}

export interface HouseStats {
  totalStudents: number;
  totalTeachers: number;
  totalIncharges: number;
  byWing: WingBreakdown[];
  byGender: GenderBreakdown;
}

export interface WingBreakdown {
  wingId: string | null;
  wingName: string;
  students: number;
  studentsMale: number;
  studentsFemale: number;
  teachers: number;
  teachersMale: number;
  teachersFemale: number;
}

export interface GenderBreakdown {
  studentsMale: number;
  studentsFemale: number;
  studentsOther: number;
  teachersMale: number;
  teachersFemale: number;
  teachersOther: number;
}

export interface HouseWithStats {
  definition: HouseDefinition;
  stats: HouseStats;
}

export interface HouseStaffMember {
  staffId: string;
  fullName: string;
  fatherName?: string;
  gender: string | null;
  isIncharge: boolean;
  wings: string[]; // wing names this staff belongs to
}

export interface HouseStaffGroupedByWing {
  wingId: string | null;
  wingName: string;
  displayOrder: number | null;
  staff: HouseStaffMember[];
}

export interface HouseInchargeInfo {
  staffId: string;
  fullName: string;
  fatherName?: string;
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get all houses with full stats (students + staff by wing + gender).
 * Single round-trip: fetches all needed data, computes stats in-memory.
 */
export async function getHousesWithStats(schoolId: string): Promise<HouseWithStats[]> {
  const [
    schoolResult,
    studentProfilesResult,
    studentsResult,
    classesResult,
    wingsResult,
    houseStaffResult,
    houseInchargesResult,
    wingStaffResult,
    classTeachersResult,
    subjectTeachersResult,
    profilesResult,
  ] = await Promise.all([
    supabase.from("schools").select("houses").eq("id", schoolId).single(),
    supabase.from("student_profiles").select("house, profile_id, class_id, school_id").eq("school_id", schoolId),
    supabase.from("students").select("id, gender, school_id").eq("school_id", schoolId),
    supabase.from("classes").select("id, name, wing_id, school_id, display_order").eq("school_id", schoolId),
    supabase.from("wings").select("id, name, display_order, school_id").eq("school_id", schoolId),
    supabase.from("house_staff").select("house_name, staff_profile_id, school_id").eq("school_id", schoolId),
    supabase.from("house_incharges").select("house_name, staff_profile_id, school_id").eq("school_id", schoolId),
    supabase.from("wing_staff").select("wing_id, staff_id, school_id").eq("school_id", schoolId),
    supabase.from("staff_roles").select("staff_id, class_id, school_id").eq("school_id", schoolId).eq("role_type", "class_teacher"),
    supabase.from("subject_teachers").select("staff_profile_id, class_id, school_id").eq("school_id", schoolId),
    supabase.from("profiles").select("id, full_name, gender, father_name, school_id").eq("school_id", schoolId),
  ]);

  const housesJson = (schoolResult.data as any)?.houses as HouseDefinition[] | null;
  const defaultHouses: HouseDefinition[] = [
    { name: "Red", color: "#ef4444", emblem_url: "" },
    { name: "Blue", color: "#3b82f6", emblem_url: "" },
    { name: "Green", color: "#22c55e", emblem_url: "" },
    { name: "Yellow", color: "#eab308", emblem_url: "" },
  ];

  const houses: HouseDefinition[] = housesJson && Array.isArray(housesJson) && housesJson.length > 0
    ? defaultHouses.map((def, i) => ({
        ...def,
        ...(housesJson[i] || {}),
        name: housesJson[i]?.name || def.name,
        color: def.color,
        emblem_url: housesJson[i]?.emblem_url || "",
      }))
    : defaultHouses.map((h) => ({ ...h }));

  const studentProfiles = studentProfilesResult?.data ?? [];
  const students = studentsResult?.data ?? [];
  const classes = classesResult.data ?? [];
  const wings = wingsResult.data ?? [];
  const houseStaff = houseStaffResult.data ?? [];
  const houseIncharges = houseInchargesResult.data ?? [];
  const wingStaff = wingStaffResult.data ?? [];
  const classTeachers = classTeachersResult.data ?? [];
  const subjectTeachers = subjectTeachersResult.data ?? [];
  const profiles = profilesResult.data ?? [];

  // Build lookup maps
  const classMap = new Map(classes.map((c: any) => [c.id, c]));
  const wingMap = new Map(wings.map((w: any) => [w.id, w]));
  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  // Class → wing mapping
  const classWingMap = new Map<string, string | null>();
  for (const c of classes as any[]) {
    classWingMap.set(c.id, c.wing_id);
  }

  // Staff → wing mapping (from wing_staff + class_teachers + subject_teachers)
  const staffWingsMap = new Map<string, Set<string>>();

  for (const ws of wingStaff as any[]) {
    const wing = wingMap.get(ws.wing_id);
    if (!wing) continue;
    const existing = staffWingsMap.get(ws.staff_id) ?? new Set();
    existing.add(wing.name);
    staffWingsMap.set(ws.staff_id, existing);
  }

  // Class teachers → wing
  for (const ct of classTeachers as any[]) {
    const cls = classMap.get(ct.class_id);
    if (!cls?.wing_id) continue;
    const wing = wingMap.get(cls.wing_id);
    if (!wing) continue;
    const existing = staffWingsMap.get(ct.staff_profile_id) ?? new Set();
    existing.add(wing.name);
    staffWingsMap.set(ct.staff_profile_id, existing);
  }

  // Subject teachers → wing
  for (const st of subjectTeachers as any[]) {
    const cls = classMap.get(st.class_id);
    if (!cls?.wing_id) continue;
    const wing = wingMap.get(cls.wing_id);
    if (!wing) continue;
    const existing = staffWingsMap.get(st.staff_profile_id) ?? new Set();
    existing.add(wing.name);
    staffWingsMap.set(st.staff_profile_id, existing);
  }

  // Sort wings by display_order for consistent ordering
  const sortedWings = [...wings].sort((a: any, b: any) => {
    const aOrder = a.display_order ?? 999;
    const bOrder = b.display_order ?? 999;
    return aOrder - bOrder;
  });

  // Build stats per house
  return houses.map((houseDef) => {
    const houseName = houseDef.name;

    // ---- STUDENT STATS ----
    // student_profiles has house + class_id; students table has gender
    const studentGenderMap = new Map<string, string>();
    for (const s of students as any[]) {
      studentGenderMap.set(s.id, s.gender ?? null);
    }

    const houseStudentProfiles = studentProfiles.filter((sp: any) => sp.house === houseName);

    // Map: wingName → { total, male, female }
    const studentWingMap = new Map<string, { total: number; male: number; female: number }>();
    let studentsMale = 0, studentsFemale = 0, studentsOther = 0;

    for (const sp of houseStudentProfiles) {
      const cls = classMap.get(sp.class_id);
      const wingId = cls?.wing_id ?? null;
      const wing = wingId ? wingMap.get(wingId) : null;
      const wingName = wing?.name ?? "(No Wing)";

      const gender = studentGenderMap.get(sp.profile_id ?? "") ?? null;
      if (gender === "male" || gender === "M") studentsMale++;
      else if (gender === "female" || gender === "F") studentsFemale++;
      else studentsOther++;

      const existing = studentWingMap.get(wingName) ?? { total: 0, male: 0, female: 0 };
      existing.total++;
      if (gender === "male" || gender === "M") existing.male++;
      else if (gender === "female" || gender === "F") existing.female++;
      studentWingMap.set(wingName, existing);
    }

    // ---- TEACHER STATS ----
    // house_staff entries for this house
    const staffInHouse = houseStaff.filter((hs: any) => hs.house_name === houseName);
    const inchargeIds = new Set(
      houseIncharges.filter((hi: any) => hi.house_name === houseName).map((hi: any) => hi.staff_profile_id)
    );

    // Unique staff IDs (dedup: staff appears once in house_staff OR as incharge)
    const allStaffIds = new Set<string>();
    for (const hs of staffInHouse) {
      allStaffIds.add(hs.staff_profile_id);
    }
    for (const id of inchargeIds) {
      allStaffIds.add(id);
    }

    // Map: wingName → { staff: HouseStaffMember[] }
    const teacherWingMap = new Map<string, HouseStaffMember[]>();
    let teachersMale = 0, teachersFemale = 0, teachersOther = 0;

    for (const staffId of allStaffIds) {
      const profile = profileMap.get(staffId);
      if (!profile) continue;

      const gender = (profile as any).gender ?? null;
      if (gender === "male" || gender === "M") teachersMale++;
      else if (gender === "female" || gender === "F") teachersFemale++;
      else teachersOther++;

      const wingsForStaff = staffWingsMap.get(staffId);
      const wingNames = wingsForStaff && wingsForStaff.size > 0
        ? [...wingsForStaff]
        : ["(No Wing)"];

      const member: HouseStaffMember = {
        staffId,
        fullName: (profile as any).full_name ?? "Unknown",
        fatherName: (profile as any).father_name,
        gender,
        isIncharge: inchargeIds.has(staffId),
        wings: wingNames,
      };

      for (const wingName of wingNames) {
        const existing = teacherWingMap.get(wingName) ?? [];
        existing.push(member);
        teacherWingMap.set(wingName, existing);
      }
    }

    // Build wing breakdowns (same wing order for students + teachers)
    const wingBreakdowns: WingBreakdown[] = sortedWings.map((w: any) => {
      const wingName = w.name;
      const studentData = studentWingMap.get(wingName) ?? { total: 0, male: 0, female: 0 };
      const teacherData = teacherWingMap.get(wingName) ?? [];

      return {
        wingId: w.id,
        wingName,
        students: studentData.total,
        studentsMale: studentData.male,
        studentsFemale: studentData.female,
        teachers: teacherData.length,
        teachersMale: teacherData.filter((t) => t.gender === "male" || t.gender === "M").length,
        teachersFemale: teacherData.filter((t) => t.gender === "female" || t.gender === "F").length,
      };
    });

    // Add (No Wing) if there are any
    const noWingStudentData = studentWingMap.get("(No Wing)");
    const noWingTeacherData = teacherWingMap.get("(No Wing)");
    if (noWingStudentData || noWingTeacherData) {
      wingBreakdowns.push({
        wingId: null,
        wingName: "(No Wing)",
        students: noWingStudentData?.total ?? 0,
        studentsMale: noWingStudentData?.male ?? 0,
        studentsFemale: noWingStudentData?.female ?? 0,
        teachers: noWingTeacherData?.length ?? 0,
        teachersMale: noWingTeacherData?.filter((t) => t.gender === "male" || t.gender === "M").length ?? 0,
        teachersFemale: noWingTeacherData?.filter((t) => t.gender === "female" || t.gender === "F").length ?? 0,
      });
    }

    return {
      definition: houseDef,
      stats: {
        totalStudents: houseStudentProfiles.length,
        totalTeachers: allStaffIds.size,
        totalIncharges: inchargeIds.size,
        byWing: wingBreakdowns,
        byGender: {
          studentsMale: studentsMale,
          studentsFemale: studentsFemale,
          studentsOther: studentsOther,
          teachersMale,
          teachersFemale,
          teachersOther,
        },
      },
    };
  });
}

/**
 * Get all staff in a house, grouped by wing with sorted order.
 * Used for expanded view.
 */
export async function getHouseStaffGroupedByWing(
  houseName: string,
  schoolId: string
): Promise<HouseStaffGroupedByWing[]> {
  const [
    classesResult,
    wingsResult,
    houseStaffResult,
    houseInchargesResult,
    wingStaffResult,
    classTeachersResult,
    subjectTeachersResult,
    profilesResult,
  ] = await Promise.all([
    supabase.from("classes").select("id, name, wing_id, school_id, display_order").eq("school_id", schoolId),
    supabase.from("wings").select("id, name, display_order, school_id").eq("school_id", schoolId).order("display_order"),
    supabase.from("house_staff").select("house_name, staff_profile_id, school_id").eq("school_id", schoolId).eq("house_name", houseName),
    supabase.from("house_incharges").select("house_name, staff_profile_id, school_id").eq("school_id", schoolId).eq("house_name", houseName),
    supabase.from("wing_staff").select("wing_id, staff_id, school_id").eq("school_id", schoolId),
    supabase.from("staff_roles").select("staff_id, class_id, school_id").eq("school_id", schoolId).eq("role_type", "class_teacher"),
    supabase.from("subject_teachers").select("staff_profile_id, class_id, school_id").eq("school_id", schoolId),
    supabase.from("profiles").select("id, full_name, gender, father_name, school_id").eq("school_id", schoolId),
  ]);

  const classes = classesResult.data ?? [];
  const wings = wingsResult.data ?? [];
  const houseStaff = houseStaffResult.data ?? [];
  const houseIncharges = houseInchargesResult?.data ?? [];
  const wingStaff = wingStaffResult.data ?? [];
  const classTeachers = classTeachersResult.data ?? [];
  const subjectTeachers = subjectTeachersResult.data ?? [];
  const profiles = profilesResult.data ?? [];

  const classMap = new Map(classes.map((c: any) => [c.id, c]));
  const wingMap = new Map(wings.map((w: any) => [w.id, w]));
  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  // Debug: log house staff IDs and profile lookup
  const inchargeIds = new Set(houseIncharges.map((hi: any) => hi.staff_profile_id));

  // Staff → wing mapping
  const staffWingsMap = new Map<string, Set<string>>();

  for (const ws of wingStaff as any[]) {
    const wing = wingMap.get(ws.wing_id);
    if (!wing) continue;
    const existing = staffWingsMap.get(ws.staff_id) ?? new Set();
    existing.add(wing.name);
    staffWingsMap.set(ws.staff_id, existing);
  }

  for (const ct of classTeachers as any[]) {
    const cls = classMap.get(ct.class_id);
    if (!cls?.wing_id) continue;
    const wing = wingMap.get(cls.wing_id);
    if (!wing) continue;
    const existing = staffWingsMap.get(ct.staff_profile_id) ?? new Set();
    existing.add(wing.name);
    staffWingsMap.set(ct.staff_profile_id, existing);
  }

  for (const st of subjectTeachers as any[]) {
    const cls = classMap.get(st.class_id);
    if (!cls?.wing_id) continue;
    const wing = wingMap.get(cls.wing_id);
    if (!wing) continue;
    const existing = staffWingsMap.get(st.staff_profile_id) ?? new Set();
    existing.add(wing.name);
    staffWingsMap.set(st.staff_profile_id, existing);
  }

  // Build staff members
  const allStaffIds = new Set([
    ...houseStaff.map((hs: any) => hs.staff_profile_id),
    ...inchargeIds,
  ]);

  const members: HouseStaffMember[] = [];
  for (const staffId of allStaffIds) {
    const profile = profileMap.get(staffId);
    if (!profile) {
      continue;
    }

    const wingsForStaff = staffWingsMap.get(staffId);
    const wingNames = wingsForStaff && wingsForStaff.size > 0
      ? [...wingsForStaff]
      : ["(No Wing)"];


    members.push({
      staffId,
      fullName: (profile as any).full_name ?? "Unknown",
      fatherName: (profile as any).father_name,
      gender: (profile as any).gender ?? null,
      isIncharge: inchargeIds.has(staffId),
      wings: wingNames,
    });
  }

  // Group by wing
  const grouped = new Map<string, HouseStaffMember[]>();
  for (const member of members) {
    for (const wingName of member.wings) {
      const existing = grouped.get(wingName) ?? [];
      existing.push(member);
      grouped.set(wingName, existing);
    }
  }

  // Build result in wing order
  const result: HouseStaffGroupedByWing[] = [];

  for (const wing of wings) {
    const staff = grouped.get(wing.name) ?? [];
    if (staff.length > 0) {
      result.push({
        wingId: wing.id,
        wingName: wing.name,
        displayOrder: wing.display_order,
        staff,
      });
    }
  }

  // Add (No Wing) if any
  const noWingStaff = grouped.get("(No Wing)") ?? [];
  if (noWingStaff.length > 0) {
    result.push({
      wingId: null,
      wingName: "(No Wing)",
      displayOrder: 9999,
      staff: noWingStaff,
    });
  }

  return result;
}

/**
 * Get all incharges for a house.
 */
export async function getHouseIncharges(
  houseName: string,
  schoolId: string
): Promise<HouseInchargeInfo[]> {
  const { data } = await supabase
    .from("house_incharges")
    .select("house_name, staff_profile_id, school_id")
    .eq("school_id", schoolId)
    .eq("house_name", houseName);

  if (!data || data.length === 0) return [];

  const staffIds = data.map((r: any) => r.staff_profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, father_name")
    .in("id", staffIds);

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return data.map((r: any) => {
    const profile = profileMap.get(r.staff_profile_id);
    return {
      staffId: r.staff_profile_id,
      fullName: profile?.full_name ?? "Unknown",
      fatherName: profile?.father_name,
    };
  });
}

/**
 * Assign staff to a house.
 * Enforces one-house-per-staff: removes from any other house first.
 */
export async function assignStaffToHouse(
  houseName: string,
  staffId: string,
  schoolId: string,
  userId?: string
): Promise<void> {
  // Remove from any other house first
  await supabase
    .from("house_staff")
    .delete()
    .eq("staff_profile_id", staffId)
    .eq("school_id", schoolId)
    .neq("house_name", houseName);

  // Insert into target house
  const { error } = await supabase.from("house_staff").insert({
    house_name: houseName,
    staff_profile_id: staffId,
    school_id: schoolId,
    assigned_by: userId ?? null,
  });

  if (error) throw error;
}

/**
 * Remove staff from a house.
 */
export async function removeStaffFromHouse(
  houseName: string,
  staffId: string,
  schoolId: string
): Promise<void> {
  const { error } = await supabase
    .from("house_staff")
    .delete()
    .eq("house_name", houseName)
    .eq("staff_profile_id", staffId)
    .eq("school_id", schoolId);

  if (error) throw error;
}

/**
 * Set a staff member as House Incharge.
 */
export async function setHouseIncharge(
  houseName: string,
  staffId: string,
  schoolId: string,
  userId?: string
): Promise<void> {
  const { error } = await supabase.from("house_incharges").upsert({
    house_name: houseName,
    staff_profile_id: staffId,
    school_id: schoolId,
    assigned_by: userId ?? null,
  }, {
    onConflict: "house_name,staff_profile_id,school_id",
  });

  if (error) throw error;
}

/**
 * Remove a staff member from House Incharge.
 */
export async function removeHouseIncharge(
  houseName: string,
  staffId: string,
  schoolId: string
): Promise<void> {
  const { error } = await supabase
    .from("house_incharges")
    .delete()
    .eq("house_name", houseName)
    .eq("staff_profile_id", staffId)
    .eq("school_id", schoolId);

  if (error) throw error;
}
