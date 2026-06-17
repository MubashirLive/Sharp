// Tests that useSaveWingAssignments invalidates the right TanStack keys on success.
// The mutator bodies are stubbed — we only care about the cache-invalidation contract.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/integrations/supabase/queries/wings", () => ({
  addStaffToWing: vi.fn().mockResolvedValue({ success: true }),
  removeStaffFromWing: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useSaveWingAssignments, roleManagerKeys } from "@/hooks/useRoleManagerQueries";
import { addStaffToWing, removeStaffFromWing } from "@/integrations/supabase/queries/wings";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

describe("useSaveWingAssignments", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // restoreAllMocks wipes the default mockResolvedValue from the factory,
    // so re-establish the success-by-default behavior for every test.
    vi.mocked(addStaffToWing).mockResolvedValue({ success: true });
    vi.mocked(removeStaffFromWing).mockResolvedValue({ success: true });
  });

  it("on success invalidates staffList, all staff-roles, and wings for the school", async () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    // Pre-seed the cache with two staff-roles entries and a staffList entry.
    qc.setQueryData(roleManagerKeys.staffRoles("school-1", "staff-A"), { foo: 1 });
    qc.setQueryData(roleManagerKeys.staffRoles("school-1", "staff-B"), { foo: 2 });
    qc.setQueryData(roleManagerKeys.staffList("school-1"), []);

    const { result } = renderHook(() => useSaveWingAssignments("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      additions: [{ wingId: "w1", staffId: "staff-A", role: "coordinator" }],
      removals: [{ wingId: "w2", staffId: "staff-B", role: "teacher" }],
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
      const hasWings = keys.some(
        (k) => Array.isArray(k) && k.includes("wings") && k.includes("school-1")
      );
      expect(hasStaffList).toBe(true);
      expect(hasStaffRolesPrefix).toBe(true);
      expect(hasWings).toBe(true);
    });
  });

  it("throws when any underlying addStaffToWing returns success=false", async () => {
    vi.mocked(addStaffToWing).mockResolvedValueOnce({
      success: false,
      error: "dup",
    });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSaveWingAssignments("school-1"), { wrapper });

    await expect(
      result.current.mutateAsync({
        schoolId: "school-1",
        additions: [{ wingId: "w1", staffId: "staff-A", role: "coordinator" }],
        removals: [],
      })
    ).rejects.toThrow(/Failed to save wing change/);
  });

  it("still invalidates staffList, all staff-roles, and wings when additions and removals are both empty", async () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    qc.setQueryData(roleManagerKeys.staffList("school-1"), []);

    const { result } = renderHook(() => useSaveWingAssignments("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      additions: [],
      removals: [],
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
      const hasWings = keys.some(
        (k) => Array.isArray(k) && k.includes("wings") && k.includes("school-1")
      );
      expect(hasStaffList).toBe(true);
      expect(hasStaffRolesPrefix).toBe(true);
      expect(hasWings).toBe(true);
    });
  });

  it("throws when any underlying removeStaffFromWing returns success=false", async () => {
    vi.mocked(removeStaffFromWing).mockResolvedValueOnce({
      success: false,
      error: "not found",
    });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSaveWingAssignments("school-1"), { wrapper });

    await expect(
      result.current.mutateAsync({
        schoolId: "school-1",
        additions: [],
        removals: [{ wingId: "w1", staffId: "staff-A", role: "coordinator" }],
      })
    ).rejects.toThrow(/Failed to save wing change/);
  });

  it("throws when schoolId is missing", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSaveWingAssignments(undefined), { wrapper });

    await expect(
      result.current.mutateAsync({
        schoolId: "school-1",
        additions: [{ wingId: "w1", staffId: "staff-A", role: "coordinator" }],
        removals: [],
      })
    ).rejects.toThrow(/schoolId required/);
  });
});
