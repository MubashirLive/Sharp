// Regression test for the staff-tab → departments write path.
//
// 2026-06-19: useSaveStaffRoles was passing the junction-table row id as
// the `staffId` argument to removeDepartmentMember / removeDepartmentIncharge.
// Both functions filter by `staff_profile_id = staffId` (not by row id),
// so the .delete().eq(...) matched zero rows and silently no-op'd. The
// member/incharge chip then "reappeared" on next load because the DB row
// was never removed.
//
// This test pins the call signature so any future regression where the
// args get swapped again (e.g. via AI or a careless rename) is caught at
// unit-test time. The mutator bodies are stubbed — only the call shape
// matters.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/integrations/supabase/queries/roleAssignments", () => ({
  addDepartmentMember: vi.fn().mockResolvedValue(undefined),
  removeDepartmentMember: vi.fn().mockResolvedValue(undefined),
  removeDepartmentIncharge: vi.fn().mockResolvedValue(undefined),
  updateStaffTag: vi.fn().mockResolvedValue(undefined),
  updateMasterAdmin: vi.fn().mockResolvedValue(undefined),
  updateAdminRole: vi.fn().mockResolvedValue(undefined),
  updateStaffRole: vi.fn().mockResolvedValue(undefined),
  updateStaffStatus: vi.fn().mockResolvedValue(undefined),
  setHouse: vi.fn().mockResolvedValue(undefined),
  addCoordinator: vi.fn().mockResolvedValue(undefined),
  removeCoordinator: vi.fn().mockResolvedValue(undefined),
  removeClassTeacher: vi.fn().mockResolvedValue(undefined),
  addClassTeacher: vi.fn().mockResolvedValue(undefined),
  removeSubjectTeacher: vi.fn().mockResolvedValue(undefined),
  addSubjectTeacher: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useSaveStaffRoles, useInvalidateRoleManagerSchool } from "@/hooks/useRoleManagerQueries";
import {
  addDepartmentMember,
  removeDepartmentMember,
  removeDepartmentIncharge,
} from "@/integrations/supabase/queries/roleAssignments";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

// Build a minimal `original` payload. Only fields consumed by the dept
// diff (lines ~308-334) matter for these tests.
function makeOriginal(overrides: Partial<{
  departments: Array<{ id: string; department_id: string; department_name: string; is_incharge: boolean }>;
}> = {}) {
  return {
    messenger_tag: "",
    is_master_admin: false,
    is_admin: false,
    role: "teacher",
    status: "active",
    house: null,
    coordinator_wings: [],
    class_teachers: [],
    subject_teachers: [],
    departments: [],
    auto_assigned_wings: [],
    manual_teacher_wings: [],
    ...overrides,
  };
}

describe("useSaveStaffRoles — department diff", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(addDepartmentMember).mockResolvedValue(undefined);
    vi.mocked(removeDepartmentMember).mockResolvedValue(undefined);
    vi.mocked(removeDepartmentIncharge).mockResolvedValue(undefined);
  });

  it("passes (staffId, deptId, schoolId, changedBy) — NOT rowId — when removing a dept member", async () => {
    // Staff is a member of dept-1, but the draft drops dept-1.
    // removeDepartmentMember must be called with staffId as the first arg
    // (so the underlying .eq("staff_profile_id", staffId) matches).
    const original = makeOriginal({
      departments: [
        { id: "row-abc", department_id: "dept-1", department_name: "Math", is_incharge: false },
      ],
    });

    const { result } = renderHook(() => useSaveStaffRoles("school-1"), { wrapper: makeWrapper().wrapper });

    await result.current.mutateAsync({
      staffId: "staff-A",
      schoolId: "school-1",
      currentUserId: "user-X",
      academicYearId: "ay-1",
      draft: {
        tag: "",
        isMasterAdmin: false,
        isAdmin: false,
        role: "teacher",
        status: "active",
        house: "",
        coordinatorWingIds: [],
        classTeachers: [],
        subjectTeachers: [],
        deptMemberIds: [], // dept-1 dropped
        deptInchargeIds: [],
      },
      original,
    });

    expect(removeDepartmentMember).toHaveBeenCalledTimes(1);
    expect(removeDepartmentMember).toHaveBeenCalledWith(
      "staff-A", // staffId (NOT "row-abc")
      "dept-1",  // departmentId
      "school-1",
      "user-X",
    );
  });

  it("passes (staffId, deptId, schoolId, changedBy) when demoting an incharge", async () => {
    // Staff is incharge of dept-2. Draft demotes them (removes from
    // incharge, keeps as member). removeDepartmentIncharge must use
    // staffId, not the row id.
    const original = makeOriginal({
      departments: [
        { id: "row-xyz", department_id: "dept-2", department_name: "Science", is_incharge: true },
      ],
    });

    const { result } = renderHook(() => useSaveStaffRoles("school-1"), { wrapper: makeWrapper().wrapper });

    await result.current.mutateAsync({
      staffId: "staff-B",
      schoolId: "school-1",
      currentUserId: "user-X",
      academicYearId: "ay-1",
      draft: {
        tag: "",
        isMasterAdmin: false,
        isAdmin: false,
        role: "teacher",
        status: "active",
        house: "",
        coordinatorWingIds: [],
        classTeachers: [],
        subjectTeachers: [],
        deptMemberIds: ["dept-2"], // kept as member
        deptInchargeIds: [],       // dropped from incharge
      },
      original,
    });

    expect(removeDepartmentIncharge).toHaveBeenCalledTimes(1);
    expect(removeDepartmentIncharge).toHaveBeenCalledWith(
      "staff-B",
      "dept-2",
      "school-1",
      "user-X",
    );
    // And the dept should NOT also be removed from members (kept on purpose).
    expect(removeDepartmentMember).not.toHaveBeenCalled();
  });

  it("removes both member and incharge when a dept is fully dropped", async () => {
    // Staff is incharge (which implies member) of dept-3. Draft drops it
    // entirely. Both removes should fire, each with the right args.
    const original = makeOriginal({
      departments: [
        { id: "row-qqq", department_id: "dept-3", department_name: "English", is_incharge: true },
      ],
    });

    const { result } = renderHook(() => useSaveStaffRoles("school-1"), { wrapper: makeWrapper().wrapper });

    await result.current.mutateAsync({
      staffId: "staff-C",
      schoolId: "school-1",
      currentUserId: "user-X",
      academicYearId: "ay-1",
      draft: {
        tag: "",
        isMasterAdmin: false,
        isAdmin: false,
        role: "teacher",
        status: "active",
        house: "",
        coordinatorWingIds: [],
        classTeachers: [],
        subjectTeachers: [],
        deptMemberIds: [],
        deptInchargeIds: [],
      },
      original,
    });

    expect(removeDepartmentMember).toHaveBeenCalledWith("staff-C", "dept-3", "school-1", "user-X");
    expect(removeDepartmentIncharge).toHaveBeenCalledWith("staff-C", "dept-3", "school-1", "user-X");
  });
});

// ─── Cross-tab cache invalidation ────────────────────────────────────────────
//
// 2026-06-19: Staff tab writes must invalidate the [schoolId, "departments"]
// key so MySchool Department tab updates without a page refresh. Regression:
// when this key was missed, the user had to F5 to see the new incharge/member
// in MySchool. This test pins the contract.

describe("useSaveStaffRoles — invalidates cross-tab caches", () => {
  it("invalidates [schoolId, 'departments'] on success so MySchool updates instantly", async () => {
    const { qc, wrapper } = makeWrapper();

    // Seed a query on the [schoolId, "departments"] key (the one MySchool reads).
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useSaveStaffRoles("school-1"), { wrapper });

    await result.current.mutateAsync({
      staffId: "staff-A",
      schoolId: "school-1",
      currentUserId: "user-X",
      academicYearId: "ay-1",
      draft: {
        tag: "",
        isMasterAdmin: false,
        isAdmin: false,
        role: "teacher",
        status: "active",
        house: "",
        coordinatorWingIds: [],
        classTeachers: [],
        subjectTeachers: [],
        deptMemberIds: ["dept-1"],
        deptInchargeIds: [],
      },
      original: makeOriginal({ departments: [] }),
    });

    // The exact key the MySchool Department tab subscribes to must appear in
    // the invalidation list. Use partial match on the structural prefix.
    const invalidatedKeys = invalidateSpy.mock.calls
      .map((c) => c[0]?.queryKey)
      .filter(Boolean);
    const departmentsKeyHit = invalidatedKeys.some(
      (k) => Array.isArray(k) && k[0] === "role-manager" && k[1] === "departments" && k[2] === "school-1"
    );
    expect(departmentsKeyHit).toBe(true);
  });
});

// ─── useInvalidateRoleManagerSchool ──────────────────────────────────────────
//
// MySchool Department tab lives outside the role-manager React subtree but
// writes to the same tables. Without an explicit invalidation bridge, a
// dept delete in MySchool leaves the role-manager Staff tab's per-card
// `useStaffRoles` cache stale until F5. This test pins the contract that
// the exported helper invalidates the same keys the role-manager
// mutations invalidate.

describe("useInvalidateRoleManagerSchool — cross-subtree invalidation", () => {
  it("invalidates [schoolId, 'departments'] and the staff-roles prefix", () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useInvalidateRoleManagerSchool("school-1"), { wrapper });

    result.current({ departments: true, broadStaffRoles: true });

    const invalidatedKeys = invalidateSpy.mock.calls
      .map((c) => c[0]?.queryKey)
      .filter(Boolean);

    // 1. departments key — for MySchool Department tab.
    const deptKeyHit = invalidatedKeys.some(
      (k) => Array.isArray(k) && k[0] === "role-manager" && k[1] === "departments" && k[2] === "school-1"
    );
    expect(deptKeyHit).toBe(true);

    // 2. staff-roles prefix — for every role-manager Staff card.
    const staffRolesPrefixHit = invalidatedKeys.some(
      (k) => Array.isArray(k) && k[0] === "role-manager" && k[1] === "staff-roles" && k[2] === "school-1"
    );
    expect(staffRolesPrefixHit).toBe(true);
  });

  it("is a no-op when schoolId is missing", () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    const { result } = renderHook(() => useInvalidateRoleManagerSchool(undefined), { wrapper });

    result.current({ departments: true });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
