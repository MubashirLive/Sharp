import { supabase } from "../client";
import type { Database } from "../types";

export type StaffIdSequence = Database["public"]["Tables"]["staff_id_sequences"]["Row"];
export type StaffBulkAction = Database["public"]["Tables"]["staff_bulk_actions"]["Row"];
export type DepartmentStaff = Database["public"]["Tables"]["department_staff"]["Row"];
export type HouseStaff = Database["public"]["Tables"]["house_staff"]["Row"];
export type StaffProfileRow = Database["public"]["Tables"]["staff_profiles"]["Row"];

// Edge Function: create-staff-user — inputs/outputs
export interface CreateStaffUserInput {
  schoolId: string;
  loginMobile: string;
  fullName?: string;
  role: "teacher" | "non_teaching" | "admin" | "principal";
  year: number;
  fatherFirstName?: string;
  fatherMiddleName?: string;
  fatherLastName?: string;
  gender?: string;
  dob?: string;          // ISO date
  salutation?: string;
  /**
   * UUID generated once per submission attempt (lives in `useRef`,
   * cleared only on success). Server replays cached response on reuse.
   * Catches network retry, tab refresh, and any unguarded client double-submit.
   * See docs/SUBMIT_GUARD.md.
   */
  idempotencyKey: string;
}

export interface CreateStaffUserResult {
  profileId: string;
  userId: string;
  staffProfileId: string;
  employeeId: string;
}

// Staff with all details for My Staff directory
// Canonical source: staff_profiles table (single-table staff data)
// Auth fields (role, status, login_mobile, messenger_tag) still come from profiles table
export interface StaffWithDetails {
  id: string;
  profile_id: string;
  school_id: string;
  full_name: string;
  salutation?: string;
  login_mobile?: string;
  email?: string;
  role: string;
  status: string;
  messenger_tag?: string;
  employee_id?: string;
  designation?: string;
  department?: string;
  qualification?: string;
  joining_date?: string;
  // Extended fields
  local_address?: string;
  permanent_address?: string;
  personal_email?: string;
  whatsapp_mobile?: string;
  emergency_contact_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relation?: string;
  employment_status?: string;
  grade_level?: string;
  blood_group?: string;
  gender?: string;
  dob?: string;
  // Father name (3 split fields; father_name is GENERATED in DB)
  father_first_name?: string;
  father_middle_name?: string;
  father_last_name?: string;
  father_name?: string;
  // Computed
  is_class_teacher: boolean;
  is_active: boolean;
}

// Filter options for staff directory
export interface StaffFilters {
  search?: string;
  roles?: string[];
  departments?: string[];
  houses?: string[];
  wings?: string[];
  subjects?: string[];
  employmentType?: string[];
  status?: string[];
  joinedYear?: number[];
  profileCompletion?: "lt70" | "gte70" | "100";
}

export type SortOption = "name_asc" | "name_desc" | "staff_id_asc" | "staff_id_desc" | "joined_newest" | "joined_oldest" | "completion_desc";

// Get all staff with details for a school
export async function getStaffWithDetails(schoolId: string): Promise<StaffWithDetails[]> {
  const [{ data: staffProfiles }, { data: profiles }, { data: classTeachers }] = await Promise.all([
    supabase
      .from("staff_profiles")
      .select("*")
      .eq("school_id", schoolId)
      .order("full_name"),
    supabase
      .from("profiles")
      .select("id, role, status, login_mobile, messenger_tag")
      .eq("school_id", schoolId)
      .not("role", "eq", "student"),
    supabase
      .from("staff_roles")
      .select("staff_id")
      .eq("school_id", schoolId)
      .eq("role_type", "class_teacher"),
  ]);

  if (!staffProfiles) return [];

  const profilesMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const classTeacherSet = new Set((classTeachers ?? []).map((ct) => ct.staff_id));

  return staffProfiles.map((sp) => {
    const profile = profilesMap.get(sp.profile_id);

    return {
      id: sp.profile_id,
      profile_id: sp.profile_id,
      school_id: sp.school_id,
      full_name: sp.full_name ?? "",
      salutation: sp.salutation ?? undefined,
      login_mobile: profile?.login_mobile ?? undefined,
      email: sp.personal_email ?? undefined,
      role: profile?.role ?? "teacher",
      status: profile?.status ?? "active",
      messenger_tag: profile?.messenger_tag ?? undefined,
      employee_id: sp.employee_id ?? undefined,
      designation: sp.designation ?? undefined,
      department: sp.department ?? undefined,
      qualification: sp.qualification ?? undefined,
      joining_date: sp.joining_date ?? undefined,
      local_address: sp.local_address ?? undefined,
      permanent_address: sp.permanent_address ?? undefined,
      personal_email: sp.personal_email ?? undefined,
      whatsapp_mobile: sp.whatsapp_mobile ?? undefined,
      emergency_contact_name: sp.emergency_contact_name ?? undefined,
      emergency_contact_number: sp.emergency_contact_number ?? undefined,
      emergency_contact_relation: sp.emergency_contact_relation ?? undefined,
      employment_status: sp.employment_status ?? undefined,
      grade_level: sp.grade_level ?? undefined,
      blood_group: sp.blood_group ?? undefined,
      gender: sp.gender ?? undefined,
      dob: sp.dob ?? undefined,
      father_first_name: sp.father_first_name ?? undefined,
      father_middle_name: sp.father_middle_name ?? undefined,
      father_last_name: sp.father_last_name ?? undefined,
      father_name: sp.father_name ?? undefined,
      is_class_teacher: classTeacherSet.has(sp.profile_id),
      is_active: true,
    };
  });
}

// Get staff by profile ID
export async function getStaffById(profileId: string): Promise<StaffWithDetails | null> {
  const [{ data: profile }, { data: staffProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, school_id, role, status, login_mobile, messenger_tag")
      .eq("id", profileId)
      .single(),
    supabase
      .from("staff_profiles")
      .select("*")
      .eq("profile_id", profileId)
      .single(),
  ]);

  if (!profile || !staffProfile) return null;

  return {
    id: profile.id,
    profile_id: profile.id,
    school_id: profile.school_id ?? "",
    full_name: staffProfile.full_name ?? "",
    salutation: staffProfile.salutation ?? undefined,
    login_mobile: profile.login_mobile ?? undefined,
    email: staffProfile.personal_email ?? undefined,
    role: profile.role ?? "teacher",
    status: profile.status ?? "active",
    messenger_tag: profile.messenger_tag ?? undefined,
    employee_id: staffProfile.employee_id ?? undefined,
    designation: staffProfile.designation ?? undefined,
    department: staffProfile.department ?? undefined,
    qualification: staffProfile.qualification ?? undefined,
    joining_date: staffProfile.joining_date ?? undefined,
    local_address: staffProfile.local_address ?? undefined,
    permanent_address: staffProfile.permanent_address ?? undefined,
    personal_email: staffProfile.personal_email ?? undefined,
    whatsapp_mobile: staffProfile.whatsapp_mobile ?? undefined,
    emergency_contact_name: staffProfile.emergency_contact_name ?? undefined,
    emergency_contact_number: staffProfile.emergency_contact_number ?? undefined,
    emergency_contact_relation: staffProfile.emergency_contact_relation ?? undefined,
    employment_status: staffProfile.employment_status ?? undefined,
    grade_level: staffProfile.grade_level ?? undefined,
    blood_group: staffProfile.blood_group ?? undefined,
    gender: staffProfile.gender ?? undefined,
    dob: staffProfile.dob ?? undefined,
    father_first_name: staffProfile.father_first_name ?? undefined,
    father_middle_name: staffProfile.father_middle_name ?? undefined,
    father_last_name: staffProfile.father_last_name ?? undefined,
    father_name: staffProfile.father_name ?? undefined,
    is_class_teacher: staffProfile.is_class_teacher ?? false,
    is_active: true,
  };
}

// Apply filters to staff list (client-side)
export function applyStaffFilters(staff: StaffWithDetails[], filters: StaffFilters): StaffWithDetails[] {
  let result = [...staff];

  // Search
  if (filters.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(
      (s) =>
        s.full_name.toLowerCase().includes(search) ||
        s.email?.toLowerCase().includes(search) ||
        s.employee_id?.toLowerCase().includes(search) ||
        s.login_mobile?.includes(search)
    );
  }

  // Roles
  if (filters.roles?.length) {
    result = result.filter((s) => filters.roles!.includes(s.role));
  }

  // Employment type
  if (filters.employmentType?.length) {
    result = result.filter((s) => filters.employmentType!.includes(s.employment_status ?? ""));
  }

  // Status
  if (filters.status?.length) {
    result = result.filter((s) => filters.status!.includes(s.status));
  } else {
    // Default: exclude draft
    result = result.filter((s) => s.status !== "draft");
  }

  // Joined year
  if (filters.joinedYear?.length) {
    result = result.filter((s) => {
      if (!s.joining_date) return false;
      const year = new Date(s.joining_date).getFullYear();
      return filters.joinedYear!.includes(year);
    });
  }

  return result;
}

// Sort staff list
export function sortStaffList(staff: StaffWithDetails[], sort: SortOption): StaffWithDetails[] {
  const sorted = [...staff];

  switch (sort) {
    case "name_asc":
      sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
      break;
    case "name_desc":
      sorted.sort((a, b) => b.full_name.localeCompare(a.full_name));
      break;
    case "staff_id_asc":
      sorted.sort((a, b) => (a.employee_id ?? "").localeCompare(b.employee_id ?? ""));
      break;
    case "staff_id_desc":
      sorted.sort((a, b) => (b.employee_id ?? "").localeCompare(a.employee_id ?? ""));
      break;
    case "joined_newest":
      sorted.sort((a, b) => {
        const dateA = a.joining_date ? new Date(a.joining_date).getTime() : 0;
        const dateB = b.joining_date ? new Date(b.joining_date).getTime() : 0;
        return dateB - dateA;
      });
      break;
    case "joined_oldest":
      sorted.sort((a, b) => {
        const dateA = a.joining_date ? new Date(a.joining_date).getTime() : 0;
        const dateB = b.joining_date ? new Date(b.joining_date).getTime() : 0;
        return dateA - dateB;
      });
      break;
  }

  return sorted;
}

// Stats for stat cards
export interface StaffStats {
  total: number;
  active: number;
  inactive: number;
  draft: number;
  departmentCount: number;
}

export function computeStaffStats(staff: StaffWithDetails[]): StaffStats {
  return {
    total: staff.length,
    active: staff.filter((s) => s.status === "active").length,
    inactive: staff.filter((s) => s.status === "inactive").length,
    draft: staff.filter((s) => s.status === "draft").length,
    departmentCount: new Set(staff.map((s) => s.department).filter(Boolean)).size,
  };
}

// Update messenger tag
export async function updateMessengerTag(profileId: string, tag: string): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ messenger_tag: tag || null })
    .eq("id", profileId);

  return !error;
}

// Toggle staff status (Active/Inactive)
export async function toggleStaffStatus(profileId: string, status: "active" | "inactive"): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", profileId);

  return !error;
}

// Update existing staff on staff_profiles + profiles
export async function updateStaff(
  profileId: string,
  data: Partial<StaffWithDetails>
): Promise<boolean> {
  // Update profiles table (auth fields only)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      role: data.role,
      status: data.status,
      messenger_tag: data.messenger_tag,
    })
    .eq("id", profileId);

  if (profileError) {
    console.error("updateStaff profiles error:", profileError);
    return false;
  }

  // Update staff_profiles table (all staff data)
  const { error: staffError } = await supabase
    .from("staff_profiles")
    .update({
      full_name: data.full_name,
      salutation: data.salutation,
      email: data.personal_email,
      employee_id: data.employee_id,
      designation: data.designation,
      department: data.department,
      qualification: data.qualification,
      joining_date: data.joining_date,
      local_address: data.local_address,
      permanent_address: data.permanent_address,
      personal_email: data.personal_email,
      whatsapp_mobile: data.whatsapp_mobile,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_number: data.emergency_contact_number,
      emergency_contact_relation: data.emergency_contact_relation,
      employment_status: data.employment_status,
      grade_level: data.grade_level,
      blood_group: data.blood_group,
      gender: data.gender,
      dob: data.dob,
      father_first_name: data.father_first_name ?? null,
      father_middle_name: data.father_middle_name ?? null,
      father_last_name: data.father_last_name ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profileId);

  if (staffError) {
    console.error("updateStaff staff_profiles error:", staffError);
    return false;
  }

  return true;
}

// Reserve a staff ID
// Pass year explicitly from yearOfJoining field (allows user to specify joining year)
export async function reserveStaffId(schoolId: string, year?: number): Promise<string | null> {
  const resolveYear = year ?? new Date().getFullYear();
  const { data, error } = await supabase.rpc("reserve_staff_id", {
    p_school_id: schoolId,
    p_year: resolveYear,
  });

  if (error || !data) return null;
  return data as string;
}

// Create staff user end-to-end via Edge Function (handles auth + profiles + staff_profiles)
// This replaces the broken client-side INSERT that hit the profiles.id FK to auth.users.id
export async function createStaffAuthUser(
  input: CreateStaffUserInput
): Promise<CreateStaffUserResult | null> {
  const { data, error } = await supabase.functions.invoke<{
    success: boolean;
    profile_id?: string;
    user_id?: string;
    staff_profile_id?: string;
    employee_id?: string;
    error?: string;
  }>("create-staff-user", {
    body: {
      school_id: input.schoolId,
      login_mobile: input.loginMobile,
      idempotency_key: input.idempotencyKey,
      full_name: input.fullName ?? null,
      role: input.role,
      year: input.year,
      father_first_name: input.fatherFirstName ?? null,
      father_middle_name: input.fatherMiddleName ?? null,
      father_last_name: input.fatherLastName ?? null,
      gender: input.gender ?? null,
      dob: input.dob ?? null,
      salutation: input.salutation ?? null,
    },
  });

  if (error) {
    console.error("createStaffAuthUser error:", error);
    // Try to extract the actual error body from the FunctionsHttpError
    let detail = "";
    try {
      // @ts-ignore — FunctionsHttpError exposes .context with the Response
      const ctx = (error as any).context;
      if (ctx && typeof ctx.text === "function") {
        detail = ` | server: ${await ctx.text()}`;
      }
    } catch {
      // ignore
    }
    console.error("createStaffAuthUser error detail:", detail);
    // Throw so caller can surface the actual error
    throw new Error(`${error.message}${detail}`);
  }
  if (!data?.success || !data.profile_id || !data.employee_id) {
    console.error("createStaffAuthUser failed:", data?.error);
    throw new Error(data?.error ?? "Edge Function did not return a result");
  }
  return {
    profileId: data.profile_id,
    userId: data.user_id ?? data.profile_id,
    staffProfileId: data.staff_profile_id ?? data.profile_id,
    employeeId: data.employee_id,
  };
}

// Create a new staff_profile entry (single INSERT — replaces 3-table insert in MyStaff.tsx)
export async function createStaffProfile(
  profileId: string,
  schoolId: string,
  data: Partial<StaffWithDetails>
): Promise<boolean> {
  const { error } = await supabase.from("staff_profiles").insert({
    profile_id: profileId,
    school_id: schoolId,
    employee_id: data.employee_id ?? null,
    full_name: data.full_name ?? "",
    salutation: data.salutation ?? null,
    father_first_name: (data as any).father_first_name ?? null,
    father_middle_name: (data as any).father_middle_name ?? null,
    father_last_name: (data as any).father_last_name ?? null,
    gender: data.gender ?? null,
    dob: data.dob ?? null,
    designation: data.designation ?? null,
    department: data.department ?? null,
    qualification: data.qualification ?? null,
    joining_date: data.joining_date ?? null,
    local_address: data.local_address ?? null,
    permanent_address: data.permanent_address ?? null,
    personal_email: data.personal_email ?? null,
    whatsapp_mobile: data.whatsapp_mobile ?? null,
    emergency_contact_name: data.emergency_contact_name ?? null,
    emergency_contact_number: data.emergency_contact_number ?? null,
    emergency_contact_relation: data.emergency_contact_relation ?? null,
    employment_status: data.employment_status ?? null,
    grade_level: data.grade_level ?? null,
    blood_group: data.blood_group ?? null,
    shift: (data as any).shift ?? null,
    house: (data as any).house ?? null,
    religion: (data as any).religion ?? null,
    nationality: (data as any).nationality ?? null,
    category: (data as any).category ?? null,
  });

  if (error) {
    console.error("createStaffProfile error:", error);
    return false;
  }

  return true;
}

// Get bulk actions for a school
export async function getBulkActions(schoolId: string, limit = 20): Promise<StaffBulkAction[]> {
  const { data } = await supabase
    .from("staff_bulk_actions")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}

// Check if staff can be deactivated (cascade checks)
export async function canDeactivateStaff(profileId: string, schoolId: string): Promise<{ can: boolean; reason?: string }> {
  // Check if Class Teacher
  const { data: classTeacher } = await supabase
    .from("staff_roles")
    .select("section_id, class_id")
    .eq("staff_id", profileId)
    .eq("role_type", "class_teacher")
    .eq("school_id", schoolId)
    .limit(1);

  if (classTeacher?.length) {
    return {
      can: false,
      reason: "Staff is a Class Teacher. Reassign in Role Manager before deactivating.",
    };
  }

  // Check if sole Wing Coordinator
  const { data: wingCoordinators } = await supabase
    .from("wings_coordinators")
    .select("wing_id")
    .eq("staff_id", profileId)
    .eq("school_id", schoolId);

  for (const wc of wingCoordinators ?? []) {
    const { count } = await supabase
      .from("wings_coordinators")
      .select("id", { count: "exact" })
      .eq("wing_id", wc.wing_id)
      .eq("school_id", schoolId);

    if (count === 1) {
      return {
        can: false,
        reason: "Staff is the only Coordinator of a Wing. Assign a replacement in Wing Tab before deactivating.",
      };
    }
  }

  // Check if Department Incharge (2026-06-19: now a flag on department_staff).
  const { data: deptIncharge } = await supabase
    .from("department_staff")
    .select("department_id")
    .eq("staff_profile_id", profileId)
    .eq("school_id", schoolId)
    .eq("is_incharge", true)
    .limit(1);

  if (deptIncharge?.length) {
    return {
      can: false,
      reason: "Staff is a Department Incharge. Assign a replacement in Department Tab before deactivating.",
    };
  }

  return { can: true };
}

// ── Per-tab partial update (7-tab Save as Draft) ────────────────────────────
// Each tab maps to a slice of staff_profiles columns. Client passes only the
// fields it touched; this function picks the right DB columns and PATCHes.

export type StaffTabKey = "tab1" | "tab2" | "tab3" | "tab4" | "tab5" | "tab6" | "tab7";

const TAB_COLUMN_MAP: Record<StaffTabKey, string[]> = {
  // Tab 1 is locked after Staff_ID generation — only `updated_at` for now
  tab1: ["updated_at"],
  // Tab 2 — Personal & Contact
  tab2: [
    "date_of_birth", "photo_url", "nationality", "blood_group", "languages",
    "category", "subcaste", "caste_certificate_number", "religion", "religion_specify", "minority",
    "marital_status", "date_of_marriage", "spouse_name", "spouse_occupation", "spouse_contact",
    "father_occupation", "father_contact", "husband_occupation", "husband_contact",
    "has_children", "children",
    "secondary_mobile", "personal_email",
    "emergency_contact_name", "emergency_contact_number", "emergency_contact_relation",
    "local_address_obj", "same_as_local_address", "permanent_address_obj",
    "opted_for_transport", "bus_route", "bus_stop",
  ],
  // Tab 3 — Professional
  tab3: ["area_of_specialization", "employment_type", "date_of_joining"],
  // Tab 4 — Education & Qualifications
  tab4: ["education", "certifications"],
  // Tab 5 — Experience
  tab5: ["experience", "admin_experience_note", "assignments_responsibilities", "courses_currently_pursuing", "leave_required_studies"],
  // Tab 6 — Payroll
  tab6: [
    "pay_scale_grade", "basic_salary", "hra", "da", "special_allowance",
    "other_allowance", "gross_salary", "last_salary_drawn", "last_salary_year",
    "mode_of_last_salary_payment", "salary_certificate_url",
    "minimum_expected_salary", "date_of_last_increment", "if_selected_joining_date",
  ],
  // Tab 7 — Statutory & Records
  tab7: [
    "bank_name", "bank_account_number", "ifsc_code", "bank_branch", "bank_passbook_url",
    "pan_number", "pan_card_url", "aadhar_number_encrypted", "aadhar_not_available",
    "epf_enrolled", "epf_uan", "esic_number", "gratuity_eligible", "tds_applicable",
    "disability_type", "disability_specification", "disability_percentage", "disability_certificate_url",
    "pwd", "minority_certificate_received", "minority_certificate_url", "references",
  ],
};

/**
 * Update one tab's fields on staff_profiles. Returns success boolean.
 * Only columns in the tab's allowed slice are written. Always stamps `updated_at`.
 */
export async function updateStaffProfilePartial(
  staffProfileId: string,
  tab: StaffTabKey,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const allowed = new Set(TAB_COLUMN_MAP[tab]);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(data)) {
    if (allowed.has(k)) patch[k] = v;
  }
  const { error } = await supabase
    .from("staff_profiles")
    .update(patch)
    .eq("id", staffProfileId);
  if (error) {
    console.error(`updateStaffProfilePartial(${tab}) error:`, error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Update ALL 7 tabs in a single transaction. Used for final "Save Staff". */
export async function updateStaffProfileFull(
  staffProfileId: string,
  data: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const allowed = new Set<string>();
  for (const cols of Object.values(TAB_COLUMN_MAP)) {
    for (const c of cols) allowed.add(c);
  }
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, v] of Object.entries(data)) {
    if (allowed.has(k)) patch[k] = v;
  }
  const { error } = await supabase
    .from("staff_profiles")
    .update(patch)
    .eq("id", staffProfileId);
  if (error) {
    console.error("updateStaffProfileFull error:", error);
    return { success: false, error: error.message };
  }
  return { success: true };
}

export type BlockedItem = { type: "class_teacher" | "wing" | "department" | "house" | "self"; name: string };

export interface DeleteEligibility {
  eligible: boolean;
  reason: string | null;
  blocked_items: BlockedItem[];
}

/** Check whether a staff can be hard-deleted (runs server-side cascade checks + caller auth). */
export async function canDeleteStaff(staffId: string): Promise<DeleteEligibility> {
  const { data, error } = await supabase.functions.invoke<DeleteEligibility>("check-staff-deletion-eligibility", {
    body: { staff_id: staffId },
  });

  if (error) {
    return { eligible: false, reason: error.message ?? "Eligibility check failed", blocked_items: [] };
  }
  return data ?? { eligible: true, reason: null, blocked_items: [] };
}

export interface DeleteStaffResult {
  success: boolean;
  employee_id?: string;
  full_name?: string;
  error?: string;
  blocked_items?: string[];
  step?: number;
}

/** Hard-delete a staff. Throws nothing — returns result object. */
export async function deleteStaff(staffId: string): Promise<DeleteStaffResult> {
  // Eligibility first (UI also calls canDeleteStaff, but re-check server-side)
  const eligibility = await canDeleteStaff(staffId);
  if (!eligibility.eligible) {
    return {
      success: false,
      error: eligibility.reason ?? "Cannot delete this staff",
      blocked_items: eligibility.blocked_items.map((b) => b.type),
    };
  }

  const { data, error } = await supabase.functions.invoke<DeleteStaffResult>("delete-staff", {
    body: { staff_id: staffId },
  });

  if (error) {
    // supabase.functions.invoke wraps non-2xx in `error` for some responses.
    // `data` may still contain the function's body.
    if (data && typeof data === "object") {
      return data as DeleteStaffResult;
    }
    return { success: false, error: error.message ?? "Delete failed" };
  }

  return data ?? { success: false, error: "Empty response from server" };
}

// Save column preferences to DB
export async function saveColumnPreferences(userId: string, columns: string[]): Promise<boolean> {
  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      key: "staff_columns",
      value: { columns },
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,key",
    }
  );

  return !error;
}

// Get column preferences from DB
export async function getColumnPreferences(userId: string): Promise<string[] | null> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select("value")
    .eq("user_id", userId)
    .eq("key", "staff_columns")
    .maybeSingle();

  if (error || !data) return null;
  return (data.value as any)?.columns ?? null;
}