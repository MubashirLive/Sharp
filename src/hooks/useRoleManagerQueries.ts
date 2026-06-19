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
  getSubjectsForSchool,
  updateStaffTag, updateMasterAdmin, updateAdminRole, updateStaffRole,
  updateStaffStatus, setHouse,
  addCoordinator, removeCoordinator,
  addClassTeacher, removeClassTeacher,
  addSubjectTeacher, removeSubjectTeacher,
  addDepartmentMember, removeDepartmentMember, removeDepartmentIncharge,
  autoAssignTeacherToWing,
  removeAutoAssignedTeacherFromWing,
  type StaffAllRoles,
} from "@/integrations/supabase/queries/roleAssignments";
import { addStaffToWing, getAvailableStaffForWing, getWingsWithFullDetails, removeStaffFromWing } from "@/integrations/supabase/queries/wings";
import { getDepartmentsWithDetails } from "@/integrations/supabase/queries/departments";
import {
  getHousesWithStats,
  assignStaffToHouse,
  removeStaffFromHouse,
  setHouseIncharge,
  removeHouseIncharge,
} from "@/integrations/supabase/queries/houses";
import { supabase } from "@/integrations/supabase/client";

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
  subjects: (schoolId: string) =>
    [...roleManagerKeys.all, "subjects", schoolId] as const,
  departments: (schoolId: string) =>
    [...roleManagerKeys.all, "departments", schoolId] as const,
  houses: (schoolId: string) =>
    [...roleManagerKeys.all, "houses", schoolId] as const,
  availableStaffForWing: (schoolId: string) =>
    [...roleManagerKeys.all, "available-staff-for-wing", schoolId] as const,
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

export function useWingsForSchool(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.wings(schoolId)
      : ["role-manager", "wings", "noop"],
    queryFn: () => getWingsWithFullDetails(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

export function useSubjects(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.subjects(schoolId)
      : ["role-manager", "subjects", "noop"],
    queryFn: () => getSubjectsForSchool(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

export function useDepartments(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.departments(schoolId)
      : ["role-manager", "departments", "noop"],
    queryFn: () => getDepartmentsWithDetails(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

export function useHouses(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.houses(schoolId)
      : ["role-manager", "houses", "noop"],
    queryFn: () => getHousesWithStats(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

export function useAvailableStaffForWing(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.availableStaffForWing(schoolId)
      : ["role-manager", "available-staff-for-wing", "noop"],
    queryFn: () => getAvailableStaffForWing(schoolId!),
    enabled: !!schoolId,
    staleTime: 5 * 60_000, // 5 min — picker data changes rarely
  });
}

// Houses tab reads the same key as useHouses (which it owns). The query
// payload now carries incharges[] and staff[] per house — see
// getHousesWithStats in queries/houses.ts.
export function useHousesWithDetails(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.houses(schoolId)
      : ["role-manager", "houses", "noop"],
    queryFn: () => getHousesWithStats(schoolId!),
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

export interface SaveHouseAssignmentsInput {
  schoolId: string;
  additions: Array<{ houseName: string; staffId: string; role: "incharge" | "staff" }>;
  removals: Array<{ houseName: string; staffId: string; role: "incharge" | "staff" }>;
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
  options: { wings?: boolean; subjects?: boolean; departments?: boolean; broadStaffRoles?: boolean } = {}
) {
  qc.invalidateQueries({ queryKey: roleManagerKeys.staffList(schoolId) });
  // `staff-roles` is the per-card `useStaffRoles` payload. Invalidating
  // by prefix (broad) re-fetches every staff card for this school —
  // correct for changes that fan-out across many staff (Houses,
  // Wings), but a perf cliff for the Subject tab where only one or
  // two staff actually changed. The Subject path narrows the
  // invalidation itself, so callers that need the broad sweep must
  // opt in explicitly with `broadStaffRoles: true`.
  if (options.broadStaffRoles) {
    qc.invalidateQueries({
      queryKey: [...roleManagerKeys.all, "staff-roles", schoolId],
    });
  }
  if (options.wings) {
    qc.invalidateQueries({ queryKey: roleManagerKeys.wings(schoolId) });
  }
  if (options.subjects) {
    qc.invalidateQueries({ queryKey: roleManagerKeys.subjects(schoolId) });
  }
  if (options.departments) {
    qc.invalidateQueries({ queryKey: roleManagerKeys.departments(schoolId) });
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
      const origCoordWings = original.coordinator_wings;
      const origCoordWingIds = origCoordWings.map((c) => c.wing_id);
      const newCoordWingIds = draft.coordinatorWingIds;
      for (const c of origCoordWings) {
        if (!newCoordWingIds.includes(c.wing_id)) {
          await removeCoordinator(c.id, staffId, sId, currentUserId);
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

      // 5. Departments — cascade incharge ⇒ member.
      // removeDepartmentMember / removeDepartmentIncharge filter by
      // (staff_profile_id, department_id) — not by junction row id — so
      // pass staffId + deptId, not rowId. (2026-06-19 fix: previous code
      // passed rowId as the first arg, making the delete match zero rows
      // and silently no-op. The chip then "reappeared" on next load.)
      const effectiveMemberIds = Array.from(new Set([...draft.deptMemberIds, ...draft.deptInchargeIds]));
      const origDeptMemberIds = original.departments.map((d) => d.department_id);
      const origDeptInchargeIds = original.departments.filter((d) => d.is_incharge).map((d) => d.department_id);

      for (const deptId of origDeptMemberIds) {
        if (!effectiveMemberIds.includes(deptId)) {
          await removeDepartmentMember(staffId, deptId, sId, currentUserId);
        }
      }
      for (const deptId of effectiveMemberIds) {
        if (!origDeptMemberIds.includes(deptId)) {
          await addDepartmentMember(staffId, deptId, sId, false, currentUserId);
        }
      }
      for (const deptId of origDeptInchargeIds) {
        if (!draft.deptInchargeIds.includes(deptId)) {
          await removeDepartmentIncharge(staffId, deptId, sId, currentUserId);
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
      // 4. departments — MySchool Department tab reads the same
      //    [schoolId, "departments"] key, so invalidating here makes the
      //    MySchool view reflect the change instantly without a refresh.
      invalidateRoleManagerSchool(qc, schoolId, {
        broadStaffRoles: true,
        departments: true,
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Cross-tab invalidation. Used by sibling surfaces (e.g. MySchool
// Department tab) that write to the same tables as the role-manager
// mutations but live outside the role-manager React subtree. Without
// this, a write from MySchool leaves the role-manager Staff tab's
// per-card `useStaffRoles` cache stale until a manual refresh.
// ---------------------------------------------------------------------------

export function useInvalidateRoleManagerSchool(schoolId: string | undefined) {
  const qc = useQueryClient();
  return useCallback(
    (options: { wings?: boolean; subjects?: boolean; departments?: boolean; broadStaffRoles?: boolean } = {}) => {
      if (!schoolId) return;
      invalidateRoleManagerSchool(qc, schoolId, options);
    },
    [qc, schoolId]
  );
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
      // school-wide staff list + roles invalidation. Broad staff-roles
      // invalidation is required: a wing reassignment can affect any
      // staff member tagged as coordinator of that wing.
      invalidateRoleManagerSchool(qc, schoolId, { wings: true, broadStaffRoles: true });
    },
  });
}

// ---------------------------------------------------------------------------
// Houses save mutation — same pattern as wings.
// Houses mutation functions throw on error instead of returning
// { success, error? }, so we wrap each in try/catch to keep the loop
// fail-fast and produce a stable error message for the UI.
// ---------------------------------------------------------------------------

export function useSaveHouseAssignments(schoolId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveHouseAssignmentsInput): Promise<void> => {
      if (!schoolId) throw new Error("schoolId required");
      // Sequential — stop at first failure to avoid partial DB state.
      for (const a of input.additions) {
        try {
          if (a.role === "incharge") {
            await setHouseIncharge(a.houseName, a.staffId, schoolId);
          } else {
            await assignStaffToHouse(a.houseName, a.staffId, schoolId);
          }
        } catch (e: any) {
          throw new Error(
            `Failed to save house ${a.role} change: ${e?.message ?? "unknown error"}`
          );
        }
      }
      for (const r of input.removals) {
        try {
          if (r.role === "incharge") {
            await removeHouseIncharge(r.houseName, r.staffId, schoolId);
          } else {
            await removeStaffFromHouse(r.houseName, r.staffId, schoolId);
          }
        } catch (e: any) {
          throw new Error(
            `Failed to save house ${r.role} removal: ${e?.message ?? "unknown error"}`
          );
        }
      }
    },
    onSuccess: () => {
      if (!schoolId) return;
      // Houses tab reflects the saved state from this same key (which
      // useHousesWithDetails reads), plus school-wide staff list + roles
      // invalidation so a staff member's `house` field stays in sync
      // across the Staff tab and other tabs. Broad staff-roles
      // invalidation is required: a house reassignment can affect any
      // staff member tagged as a house member or incharge.
      qc.invalidateQueries({ queryKey: roleManagerKeys.houses(schoolId) });
      invalidateRoleManagerSchool(qc, schoolId, { broadStaffRoles: true });
    },
  });
}

// ---------------------------------------------------------------------------
// Subject tab save mutation — writes to staff_roles + wing_staff (auto-assign).
// Lifted from SubjectAssignmentGrid.handleAssignStaff so the invalidation
// contract matches Wings/Houses: staffList + staff-roles prefix + wings +
// subjects. Without this, the Subject tab's old inline save only invalidated
// staffList, leaving every Staff card's per-staff roles payload stale until
// a page refresh.
// ---------------------------------------------------------------------------

export interface SubjectAssignmentWrite {
  schoolId: string;
  isClassTeacher: boolean;
  sectionId: string;
  classId: string;
  subjectId: string | null;
  /** null = remove. */
  staff: { id: string } | null;
  /** Prior teacher for the same cell — used for wing auto-assign cleanup. */
  existingStaffId: string | null;
}

export function useSaveSubjectAssignment(schoolId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubjectAssignmentWrite): Promise<void> => {
      if (!schoolId) throw new Error("schoolId required");
      const { isClassTeacher, sectionId, classId, subjectId, staff, existingStaffId } = input;

      if (!staff) {
        // Remove-only path.
        if (isClassTeacher) {
          const { error } = await supabase
            .from("staff_roles")
            .delete()
            .eq("school_id", schoolId)
            .eq("class_id", classId)
            .eq("section_id", sectionId)
            .eq("role_type", "class_teacher");
          if (error) throw error;
        } else if (subjectId) {
          const { error } = await supabase
            .from("staff_roles")
            .delete()
            .eq("school_id", schoolId)
            .eq("class_id", classId)
            .eq("section_id", sectionId)
            .eq("subject_id", subjectId)
            .eq("role_type", "subject_teacher");
          if (error) throw error;
        }
        if (existingStaffId) {
          try {
            await removeAutoAssignedTeacherFromWing(existingStaffId, classId, schoolId);
          } catch (wingErr) {
            // Wing cleanup is best-effort — don't fail the remove.
            console.warn("Wing auto-unassign failed:", wingErr);
          }
        }
        return;
      }

      // 1) Remove pre-existing row that would collide on the EXCLUSION
      //    constraint when switching to a new teacher. Skip if same staff
      //    (idempotent no-op).
      if (existingStaffId && existingStaffId !== staff.id) {
        if (isClassTeacher) {
          const { error } = await supabase
            .from("staff_roles")
            .delete()
            .eq("school_id", schoolId)
            .eq("class_id", classId)
            .eq("section_id", sectionId)
            .eq("role_type", "class_teacher")
            .neq("staff_id", staff.id);
          if (error) throw error;
        } else if (subjectId) {
          const { error } = await supabase
            .from("staff_roles")
            .delete()
            .eq("school_id", schoolId)
            .eq("class_id", classId)
            .eq("section_id", sectionId)
            .eq("subject_id", subjectId)
            .eq("role_type", "subject_teacher")
            .neq("staff_id", staff.id);
          if (error) throw error;
        }
        try {
          await removeAutoAssignedTeacherFromWing(existingStaffId, classId, schoolId);
        } catch (wingErr) {
          console.warn("Wing auto-unassign failed:", wingErr);
        }
      }

      // 2) Upsert chosen assignment. UNIQUE onConflict keeps same-teacher
      //    re-selection idempotent.
      const { data: upserted, error } = await supabase
        .from("staff_roles")
        .upsert({
          staff_id: staff.id,
          school_id: schoolId,
          role_type: isClassTeacher ? "class_teacher" : "subject_teacher",
          class_id: classId,
          section_id: sectionId,
          subject_id: subjectId ?? null,
        }, {
          onConflict: "staff_id, role_type, class_id, section_id, subject_id",
        })
        .select("id")
        .single();
      if (error) throw error;

      // 3) Auto-assign to wing if class has one (graceful: don't fail save).
      if (upserted?.id) {
        try {
          await autoAssignTeacherToWing(
            staff.id,
            classId,
            schoolId,
            upserted.id,
            isClassTeacher ? "class_teacher" : "subject_teacher"
          );
        } catch (wingErr) {
          console.warn("Wing auto-assign failed:", wingErr);
        }
      }

      // 4) Audit (best-effort; missing auth user skips silently).
      const { data: authData } = await supabase.auth.getUser();
      const changedBy = authData?.user?.id;
      if (changedBy) {
        const action = isClassTeacher ? "class_teacher" : "subject_teacher";
        const field = "add";
        try {
          await supabase.from("staff_role_audit").insert({
            staff_id: staff.id,
            school_id: schoolId,
            action,
            field,
            new_value: staff.id,
            changed_by: changedBy,
          });
        } catch {
          // Audit failure must not roll back the successful save.
        }
      }
    },
    onSuccess: (_data, input) => {
      if (!schoolId) return;
      // Subject tab reflects from the `subjects` key; wings reflects the
      // auto-assigned teacher; staff directory (staffList) recomputes
      // is_class_teacher. Matches the Houses/Wings contract.
      invalidateRoleManagerSchool(qc, schoolId, { wings: true, subjects: true });

      // Narrow staff-roles invalidation: only the two staff whose
      // class/subject assignments actually changed. Invalidation by
      // prefix (the old behavior) was correct but caused an N × 8
      // round-trip fanout on Staff-tab activation — every card refetched
      // even though only two staff changed. With the narrow invalidation
      // other cards continue to show their previous (still-correct)
      // roles payload until the next edit.
      const affected = new Set<string>();
      if (input.staff?.id) affected.add(input.staff.id);
      if (input.existingStaffId) affected.add(input.existingStaffId);
      for (const staffId of affected) {
        qc.invalidateQueries({ queryKey: roleManagerKeys.staffRoles(schoolId, staffId) });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Department save mutation — Wings/Houses parity.
//
// Additions carry `asIncharge: boolean`; removals carry `role: "incharge" |
// "member"`. The underlying mutators in roleAssignments.ts are the audit-
// writing functions; this layer owns the call-site ordering and the cache
// invalidation contract.
//
// Broad `staff-roles` invalidation is required: a dept member becoming an
// incharge flips `is_incharge` on every affected staff's card chips
// (see StaffRoleCard.tsx dept section). The dept change can fan out across
// N staff — same trade-off as Wings/Houses.
// ---------------------------------------------------------------------------

export interface SaveDepartmentAssignmentsInput {
  schoolId: string;
  additions: Array<{ departmentId: string; staffId: string; asIncharge: boolean }>;
  removals: Array<{ departmentId: string; staffId: string; role: "incharge" | "member" }>;
}

export function useSaveDepartmentAssignments(schoolId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveDepartmentAssignmentsInput): Promise<void> => {
      if (!schoolId) throw new Error("schoolId required");
      // Sequential — stop at first failure to avoid partial DB state.
      for (const a of input.additions) {
        try {
          await addDepartmentMember(a.staffId, a.departmentId, schoolId, a.asIncharge, "");
        } catch (e: any) {
          throw new Error(
            `Failed to save department add: ${e?.message ?? "unknown error"}`
          );
        }
      }
      for (const r of input.removals) {
        try {
          if (r.role === "incharge") {
            await removeDepartmentIncharge(r.staffId, r.departmentId, schoolId, "");
          } else {
            await removeDepartmentMember(r.staffId, r.departmentId, schoolId, "");
          }
        } catch (e: any) {
          throw new Error(
            `Failed to save department remove: ${e?.message ?? "unknown error"}`
          );
        }
      }
    },
    onSuccess: () => {
      if (!schoolId) return;
      // Departments tab itself reflects the saved state from the same
      // `useDepartments` key; standard school-wide invalidation plus broad
      // staff-roles fan-out (see comment above).
      invalidateRoleManagerSchool(qc, schoolId, {
        departments: true,
        broadStaffRoles: true,
      });
    },
  });
}
