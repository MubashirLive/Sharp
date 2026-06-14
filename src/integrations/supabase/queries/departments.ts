import { supabase } from "../client";
import type { Database } from "../types";

export type DepartmentAuditLog = Database["public"]["Tables"]["departments_audit_log"]["Row"];

export interface DepartmentMember {
  staff_profile_id: string;
  staff_name: string;
  father_name?: string;
  role: "member" | "incharge";
}

export interface DepartmentWithDetails {
  id: string;
  name: string;
  code?: string;
  members: DepartmentMember[];
  incharges: DepartmentMember[];
  messenger_settings: { who_can_use: string; visibility: string[] };
  version: number;
  updated_at: string;
  active_task_count?: number;
  is_active: boolean;
}

export async function getDepartmentsWithDetails(schoolId: string): Promise<DepartmentWithDetails[]> {
  const [{ data: departments }, { data: staffProfiles }, { data: deptStaff }, { data: deptIncharges }] = await Promise.all([
    supabase.from("departments").select("*").eq("school_id", schoolId).order("name"),
    supabase.from("staff_profiles").select("profile_id, full_name, father_name"),
    supabase.from("departments_staff").select("department_id, staff_id").eq("school_id", schoolId),
    supabase.from("department_incharges").select("department_id, staff_id").eq("school_id", schoolId),
  ]);

  if (!departments) return [];

  const profileMap = new Map((staffProfiles ?? []).map((p) => [p.profile_id, p]));

  const buildMember = (staffId: string): DepartmentMember => {
    const profile = profileMap.get(staffId);
    return {
      staff_profile_id: staffId,
      staff_name: profile?.full_name ?? "Unknown",
      father_name: profile?.father_name,
    };
  };

  return departments.map((dept) => {
    const rawMessengerSettings: { who_can_use: string; visibility: string[] } = (dept as any).messenger_settings ?? {
      who_can_use: "all",
      visibility: [],
    };

    // Build incharges list from junction table
    const incharges: DepartmentMember[] = (deptIncharges ?? [])
      .filter((i) => i.department_id === dept.id)
      .map((i) => ({ ...buildMember(i.staff_id), role: "incharge" as const }));

    // Build members list from junction table (non-incharges)
    const inchargeIds = new Set(incharges.map((i) => i.staff_profile_id));
    const members: DepartmentMember[] = (deptStaff ?? [])
      .filter((m) => m.department_id === dept.id && !inchargeIds.has(m.staff_id))
      .map((m) => ({ ...buildMember(m.staff_id), role: "member" as const }));

    return {
      id: dept.id,
      name: dept.name ?? "",
      code: dept.code ?? undefined,
      members: [...incharges, ...members],
      incharges,
      messenger_settings: rawMessengerSettings,
      version: dept.version ?? 1,
      updated_at: dept.updated_at ?? "",
      is_active: incharges.length > 0,
    };
  });
}

export async function logDepartmentAction(params: {
  schoolId: string;
  userId: string;
  userName: string;
  deptId?: string;
  deptName?: string;
  action: string;
  what: string;
}) {
  await supabase.from("departments_audit_log").insert({
    id: crypto.randomUUID(),
    department_id: params.deptId ?? null,
    actor_id: params.userId ?? null,
    action: params.action,
    change_summary: params.what,
    changed_fields: {},
  });
}

export async function getDepartmentsAuditLog(schoolId: string, deptId?: string): Promise<DepartmentAuditLog[]> {
  let query = supabase
    .from("departments_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (deptId) query = query.eq("department_id", deptId);

  const { data } = await query;
  return data ?? [];
}
