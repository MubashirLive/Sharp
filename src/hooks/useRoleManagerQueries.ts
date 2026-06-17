// useRoleManagerQueries — TanStack Query hooks for the Role Manager.
//
// Replaces the useState + useEffect data stores in RoleManagerTab and
// StaffRoleCard with a single source of truth. Critical for the class-
// teacher reassign flow: when 10th A moves from Amit to Anjali, every
// card on the page must reflect the new state, not a stale snapshot
// from a parallel fetch. (See plan: zesty-rolling-shannon.)
//
// Mirrors the structure of useAttendance.ts (key factory + read hooks +
// write hook) and useWingSync.ts (mutation with invalidateQueries on
// success).

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getStaffWithDetails } from "@/integrations/supabase/queries/staff";
import {
  getStaffAllRoles,
  updateStaffTag, updateMasterAdmin, updateAdminRole, updateStaffRole,
  updateStaffStatus, setHouse,
  addCoordinator, removeCoordinator,
  addClassTeacher, removeClassTeacher,
  addSubjectTeacher, removeSubjectTeacher,
  addDepartmentMember, removeDepartmentMember, removeDepartmentIncharge,
  type StaffAllRoles,
} from "@/integrations/supabase/queries/roleAssignments";
import { addStaffToWing, removeStaffFromWing } from "@/integrations/supabase/queries/wings";

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const roleManagerKeys = {
  all: ["role-manager"] as const,
  staffList: (schoolId: string) =>
    [...roleManagerKeys.all, "staff-list", schoolId] as const,
  staffRoles: (schoolId: string, staffId: string) =>
    [...roleManagerKeys.all, "staff-roles", schoolId, staffId] as const,
  wings: (schoolId: string) =>
    [...roleManagerKeys.all, "wings", schoolId] as const,
};

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export function useStaffList(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.staffList(schoolId)
      : ["role-manager", "staff-list", "noop"],
    queryFn: () => getStaffWithDetails(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

export function useStaffRoles(staffId: string, schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.staffRoles(schoolId, staffId)
      : ["role-manager", "staff-roles", "noop"],
    queryFn: () => getStaffAllRoles(staffId, schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Save input shape
// ---------------------------------------------------------------------------

export interface SaveWingAssignmentsInput {
  schoolId: string;
  additions: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }>;
  removals: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }>;
}

export interface SaveStaffRolesInput {
  staffId: string;
  schoolId: string;
  currentUserId: string;
  academicYearId: string | null;
  draft: StaffRoleDraft;
  original: StaffAllRoles;
}

export interface StaffRoleDraft {
  tag: string;
  isMasterAdmin: boolean;
  isAdmin: boolean;
  role: string;
  status: string;
  house: string;
  coordinatorWingIds: string[];
  classTeachers: Array<{
    id: string; classId: string; sectionId: string;
    className: string; sectionName: string;
  }>;
  subjectTeachers: Array<{
    id: string; classId: string; sectionId: string; subjectId: string; label: string;
  }>;
  deptMemberIds: string[];
  deptInchargeIds: string[];
}

// ---------------------------------------------------------------------------
// Save mutation
// ---------------------------------------------------------------------------

/**
 * School-wide invalidation shared by the role-manager save mutations.
 * Covers the staff directory plus every card's roles payload for the
 * school (broad prefix invalidation — safe because the data layer is
 * identical for every staff in the same school).
 */
function invalidateRoleManagerSchool(
  qc: ReturnType<typeof useQueryClient>,
  schoolId: string,
  options: { wings?: boolean } = {}
) {
  qc.invalidateQueries({ queryKey: roleManagerKeys.staffList(schoolId) });
  qc.invalidateQueries({
    queryKey: [...roleManagerKeys.all, "staff-roles", schoolId],
  });
  if (options.wings) {
    qc.invalidateQueries({ queryKey: roleManagerKeys.wings(schoolId) });
  }
}

export function useSaveStaffRoles(schoolId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveStaffRolesInput): Promise<void> => {
      const { staffId, schoolId: sId, currentUserId, academicYearId, draft, original } = input;

      // 1. Profile fields
      if ((draft.tag || "") !== (original.messenger_tag || "")) {
        await updateStaffTag(staffId, draft.tag, currentUserId);
      }
      if (draft.isMasterAdmin !== original.is_master_admin) {
        await updateMasterAdmin(staffId, draft.isMasterAdmin, currentUserId);
      }
      if (draft.isAdmin !== original.is_admin) {
        await updateAdminRole(staffId, draft.isAdmin, currentUserId);
      }
      if (draft.role !== original.role) {
        await updateStaffRole(staffId, draft.role, currentUserId);
      }
      if (draft.status !== original.status) {
        await updateStaffStatus(staffId, draft.status, currentUserId);
      }
      if (draft.house !== (original.house?.house_name ?? "")) {
        await setHouse(staffId, draft.house, sId, currentUserId);
      }

      // 2. Coordinator (wings) — multi-wing
      const origCoordWingIds = original.coordinator ? [original.coordinator.wing_id] : [];
      const newCoordWingIds = draft.coordinatorWingIds;
      for (const wingId of origCoordWingIds) {
        if (!newCoordWingIds.includes(wingId)) {
          if (original.coordinator && original.coordinator.wing_id === wingId) {
            await removeCoordinator(original.coordinator.id, staffId, sId, currentUserId);
          }
        }
      }
      for (const wingId of newCoordWingIds) {
        if (!origCoordWingIds.includes(wingId)) {
          await addCoordinator(wingId, staffId, sId, currentUserId);
        }
      }

      // 3. Class Teachers — diff by (classId, sectionId)
      const origCTs = new Map(original.class_teachers.map((c) => [c.id, c]));
      for (const [id, orig] of origCTs) {
        const found = draft.classTeachers.find((c) => c.id === id);
        if (!found) await removeClassTeacher(id, staffId, sId, currentUserId);
      }
      for (const dc of draft.classTeachers) {
        if (dc.id.startsWith("new-")) {
          await addClassTeacher(staffId, dc.classId, dc.sectionId, sId, currentUserId);
        }
      }

      // 4. Subject Teachers
      const origSTs = new Map(original.subject_teachers.map((s) => [s.id, s]));
      for (const [id] of origSTs) {
        if (!draft.subjectTeachers.find((s) => s.id === id)) {
          await removeSubjectTeacher(id, staffId, sId, currentUserId);
        }
      }
      for (const ds of draft.subjectTeachers) {
        if (ds.id.startsWith("new-")) {
          await addSubjectTeacher(staffId, ds.classId, ds.sectionId, ds.subjectId, sId, academicYearId, currentUserId);
        }
      }

      // 5. Departments — cascade incharge ⇒ member
      const effectiveMemberIds = Array.from(new Set([...draft.deptMemberIds, ...draft.deptInchargeIds]));
      const origDeptMemberIds = original.departments.map((d) => d.department_id);
      const origDeptInchargeIds = original.departments.filter((d) => d.is_incharge).map((d) => d.department_id);
      const deptIdToRowId = new Map(original.departments.map((d) => [d.department_id, d.id]));

      for (const deptId of origDeptMemberIds) {
        if (!effectiveMemberIds.includes(deptId)) {
          const rowId = deptIdToRowId.get(deptId);
          if (rowId) await removeDepartmentMember(rowId, staffId, sId, currentUserId);
        }
      }
      for (const deptId of effectiveMemberIds) {
        if (!origDeptMemberIds.includes(deptId)) {
          await addDepartmentMember(staffId, deptId, sId, false, currentUserId);
        }
      }
      for (const deptId of origDeptInchargeIds) {
        if (!draft.deptInchargeIds.includes(deptId)) {
          const rowId = deptIdToRowId.get(deptId);
          if (rowId) await removeDepartmentIncharge(rowId, staffId, sId, currentUserId);
        }
      }
      for (const deptId of draft.deptInchargeIds) {
        if (!origDeptInchargeIds.includes(deptId)) {
          await addDepartmentMember(staffId, deptId, sId, true, currentUserId);
        }
      }
    },
    onSuccess: (_data, input) => {
      if (!schoolId) return;
      // 1. Staff directory — recomputes is_class_teacher for every staff.
      // 2. This card's roles payload.
      qc.invalidateQueries({ queryKey: roleManagerKeys.staffRoles(schoolId, input.staffId) });
      // 3. Every other card's roles for the same school. Critical for
      //    cross-staff reassigns: when 10th A moves from Amit to Anjali,
      //    Amit's card must drop the row and Anjali's must gain it.
      //    Broad invalidation by prefix is safe — same data layer.
      invalidateRoleManagerSchool(qc, schoolId);
    },
  });
}

// ---------------------------------------------------------------------------
// Convenience: a stable refresh callback for parent → child wiring
// ---------------------------------------------------------------------------

export function useRefreshStaffList(schoolId: string | undefined) {
  const qc = useQueryClient();
  return useCallback(() => {
    if (!schoolId) return Promise.resolve();
    return qc.invalidateQueries({
      queryKey: roleManagerKeys.staffList(schoolId),
      refetchType: "active",
    });
  }, [qc, schoolId]);
}

// ---------------------------------------------------------------------------
// Wings save mutation — invalidates the same keys the Staff tab reads.
// ---------------------------------------------------------------------------

export function useSaveWingAssignments(schoolId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveWingAssignmentsInput): Promise<void> => {
      if (!schoolId) throw new Error("schoolId required");
      // Sequential — stop at first failure to avoid partial DB state
      // (Promise.all race could leave some ops applied and others not).
      for (const a of input.additions) {
        const res = await addStaffToWing(a.wingId, a.staffId, a.role, schoolId);
        if (!res.success) {
          throw new Error(`Failed to save wing change: ${res.error ?? "unknown error"}`);
        }
      }
      for (const r of input.removals) {
        const res = await removeStaffFromWing(r.wingId, r.staffId, r.role);
        if (!res.success) {
          throw new Error(`Failed to save wing change: ${res.error ?? "unknown error"}`);
        }
      }
    },
    onSuccess: () => {
      if (!schoolId) return;
      // Wings tab itself reflects the saved state (replaces the local
      // loadData() refetch in the component), plus the standard
      // school-wide staff list + roles invalidation.
      invalidateRoleManagerSchool(qc, schoolId, { wings: true });
    },
  });
}
