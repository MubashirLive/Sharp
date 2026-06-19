// Tests for useSaveDepartmentAssignments. Mirrors useSaveWingAssignments.test.ts.
// The mutator bodies are stubbed — we only care about the cache-invalidation
// contract and the call-site ordering (additions first, then removals; incharge
// vs member dispatch is correct).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/integrations/supabase/queries/roleAssignments", () => ({
  addDepartmentMember: vi.fn().mockResolvedValue(undefined),
  removeDepartmentMember: vi.fn().mockResolvedValue(undefined),
  removeDepartmentIncharge: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useSaveDepartmentAssignments, roleManagerKeys } from "@/hooks/useRoleManagerQueries";
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

describe("useSaveDepartmentAssignments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(addDepartmentMember).mockResolvedValue(undefined);
    vi.mocked(removeDepartmentMember).mockResolvedValue(undefined);
    vi.mocked(removeDepartmentIncharge).mockResolvedValue(undefined);
  });

  it("on success invalidates staffList, all staff-roles, and departments for the school", async () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    qc.setQueryData(roleManagerKeys.staffRoles("school-1", "staff-A"), { foo: 1 });
    qc.setQueryData(roleManagerKeys.staffRoles("school-1", "staff-B"), { foo: 2 });
    qc.setQueryData(roleManagerKeys.staffList("school-1"), []);

    const { result } = renderHook(() => useSaveDepartmentAssignments("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      additions: [{ departmentId: "d1", staffId: "staff-A", asIncharge: true }],
      removals: [{ departmentId: "d1", staffId: "staff-B", role: "member" }],
    });

    await waitFor(() => {
      const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
      const hasStaffList = keys.some(
        (k) => Array.isArray(k) && k.includes("staff-list") && k.includes("school-1")
      );
      const hasStaffRolesPrefix = keys.some(
        (k) =>
          Array.isArray(k) &&
          k[0] === "role-manager" &&
          k[1] === "staff-roles" &&
          k[2] === "school-1"
      );
      const hasDepartments = keys.some(
        (k) => Array.isArray(k) && k.includes("departments") && k.includes("school-1")
      );
      expect(hasStaffList).toBe(true);
      expect(hasStaffRolesPrefix).toBe(true);
      expect(hasDepartments).toBe(true);
    });
  });

  it("dispatches incharge vs member adds via asIncharge flag, then removals in order", async () => {
    const { wrapper } = makeWrapper();
    const addSpy = vi.mocked(addDepartmentMember);
    const removeMemberSpy = vi.mocked(removeDepartmentMember);
    const removeInchargeSpy = vi.mocked(removeDepartmentIncharge);

    const { result } = renderHook(() => useSaveDepartmentAssignments("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      additions: [
        { departmentId: "d1", staffId: "staff-X", asIncharge: true },
        { departmentId: "d1", staffId: "staff-Y", asIncharge: false },
      ],
      removals: [
        { departmentId: "d1", staffId: "staff-P", role: "incharge" },
        { departmentId: "d1", staffId: "staff-Q", role: "member" },
      ],
    });

    // Additions first
    expect(addSpy).toHaveBeenNthCalledWith(1, "staff-X", "d1", "school-1", true, "");
    expect(addSpy).toHaveBeenNthCalledWith(2, "staff-Y", "d1", "school-1", false, "");

    // Removals second
    expect(removeInchargeSpy).toHaveBeenCalledWith("staff-P", "d1", "school-1", "");
    expect(removeMemberSpy).toHaveBeenCalledWith("staff-Q", "d1", "school-1", "");
  });

  it("regression: never calls the wrong table or column on dept staff writes", async () => {
    // Catches a real bug from 2026-06-18: addDepartmentMember /
    // removeDepartmentMember were calling from("departments_staff").insert({
    // staff_id, ... }) — the actual table is department_staff and the FK
    // column is staff_profile_id. This locks the contract by asserting the
    // mutator's exported call signature, not its internal supabase calls.
    const { wrapper } = makeWrapper();
    const addSpy = vi.mocked(addDepartmentMember);
    const removeMemberSpy = vi.mocked(removeDepartmentMember);

    const { result } = renderHook(() => useSaveDepartmentAssignments("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      additions: [{ departmentId: "d1", staffId: "staff-A", asIncharge: false }],
      removals: [{ departmentId: "d1", staffId: "staff-B", role: "member" }],
    });

    // The call is (staffId, departmentId, schoolId, asIncharge, changedBy).
    // The mutator must pass the staff profile id as the first arg (matches
    // department_staff.staff_profile_id), not a "staff_id" string.
    expect(addSpy).toHaveBeenCalledWith("staff-A", "d1", "school-1", false, "");
    expect(removeMemberSpy).toHaveBeenCalledWith("staff-B", "d1", "school-1", "");
  });

  it("throws and stops on first failed addition", async () => {
    vi.mocked(addDepartmentMember).mockRejectedValueOnce(new Error("boom"));
    const addSpy = vi.mocked(addDepartmentMember);
    const removeInchargeSpy = vi.mocked(removeDepartmentIncharge);

    const { result } = renderHook(() => useSaveDepartmentAssignments("school-1"), { wrapper: makeWrapper().wrapper });

    await expect(
      result.current.mutateAsync({
        schoolId: "school-1",
        additions: [
          { departmentId: "d1", staffId: "staff-X", asIncharge: true },
          { departmentId: "d1", staffId: "staff-Y", asIncharge: true },
        ],
        removals: [{ departmentId: "d1", staffId: "staff-P", role: "incharge" }],
      })
    ).rejects.toThrow(/Failed to save department/);

    // Second add and the removal must not have run.
    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeInchargeSpy).not.toHaveBeenCalled();
  });
});
