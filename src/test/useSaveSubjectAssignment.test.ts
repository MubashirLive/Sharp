// Tests for useSaveSubjectAssignment — verifies the cross-tab cache
// invalidation contract matches the Houses / Wings pattern. The bug this
// fixes: assigning a teacher via the Subject tab used to leave every Staff
// card's per-staff roles payload stale until a page refresh.
//
// The mutator body calls supabase.from(...).delete()/.upsert()/.insert()
// and autoAssignTeacherToWing / removeAutoAssignedTeacherFromWing. We mock
// both surfaces and assert that on success the right query keys are
// invalidated.
//
// NOTE: vi.mock factories are hoisted to the top of the file before any
// other code runs (including `import` statements). To give the factory
// access to a stable mock object we use `vi.hoisted()` which runs at the
// same hoist point as the mock factory itself.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const mocks = vi.hoisted(() => {
  function makeThenable() {
    const obj: any = {};
    const proxy: any = new Proxy(obj, {
      get(_t, prop) {
        if (prop === "then") {
          return (resolve: any) => resolve({ data: null, error: null });
        }
        if (prop === "single") {
          return () => Promise.resolve({ data: { id: "new-row-id" }, error: null });
        }
        return () => proxy;
      },
    });
    return proxy;
  }
  return {
    mockSupabase: {
      from: vi.fn(() => makeThenable()),
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    },
    mockAutoAssign: vi.fn().mockResolvedValue({ id: "wing-row" }),
    mockRemoveAutoAssign: vi.fn().mockResolvedValue({ id: null }),
    makeThenable,
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: mocks.mockSupabase,
}));

vi.mock("@/integrations/supabase/queries/roleAssignments", () => ({
  autoAssignTeacherToWing: mocks.mockAutoAssign,
  removeAutoAssignedTeacherFromWing: mocks.mockRemoveAutoAssign,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import {
  useSaveSubjectAssignment,
  roleManagerKeys,
} from "@/hooks/useRoleManagerQueries";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

beforeEach(() => {
  // Re-prime mocks for each test. We do NOT reassign mockSupabase.from/auth
  // — the vi.mock factory captured the original vi.fn() bindings, and
  // replacing them can desync the mock module from the test references.
  mocks.mockSupabase.from.mockClear();
  mocks.mockSupabase.from.mockImplementation(() => mocks.makeThenable());
  mocks.mockSupabase.auth.getUser.mockClear();
  mocks.mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mocks.mockAutoAssign.mockReset();
  mocks.mockRemoveAutoAssign.mockReset();
  mocks.mockAutoAssign.mockResolvedValue({ id: "wing-row" } as any);
  mocks.mockRemoveAutoAssign.mockResolvedValue({ id: null } as any);
});

describe("useSaveSubjectAssignment — cache invalidation contract", () => {
  it("on successful upsert invalidates staffList, all staff-roles, wings, and subjects", async () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    qc.setQueryData(roleManagerKeys.staffRoles("school-1", "staff-A"), { foo: 1 });
    qc.setQueryData(roleManagerKeys.staffRoles("school-1", "staff-B"), { foo: 2 });
    qc.setQueryData(roleManagerKeys.staffList("school-1"), []);
    qc.setQueryData(roleManagerKeys.wings("school-1"), []);
    qc.setQueryData(roleManagerKeys.subjects("school-1"), []);

    const { result } = renderHook(() => useSaveSubjectAssignment("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      isClassTeacher: true,
      sectionId: "sec1",
      classId: "class1",
      subjectId: null,
      staff: { id: "staff-A" },
      existingStaffId: "staff-old",
    });

    await waitFor(() => {
      const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
      const hasStaffList = keys.some(
        (k) => Array.isArray(k) && k.includes("staff-list") && k.includes("school-1")
      );
      // Narrow invalidation: only the two specific staff roles, NOT the
      // broad staff-roles prefix. This is what keeps the Staff tab snappy.
      const hasStaffRolesPrefix = keys.some(
        (k) =>
          Array.isArray(k) &&
          k[0] === "role-manager" &&
          k[1] === "staff-roles" &&
          k[2] === "school-1" &&
          k.length === 3
      );
      const hasNewStaffRoles = keys.some(
        (k) =>
          Array.isArray(k) &&
          k[0] === "role-manager" &&
          k[1] === "staff-roles" &&
          k[2] === "school-1" &&
          k[3] === "staff-A"
      );
      const hasPriorStaffRoles = keys.some(
        (k) =>
          Array.isArray(k) &&
          k[0] === "role-manager" &&
          k[1] === "staff-roles" &&
          k[2] === "school-1" &&
          k[3] === "staff-old"
      );
      const hasWings = keys.some(
        (k) => Array.isArray(k) && k.includes("wings") && k.includes("school-1")
      );
      const hasSubjects = keys.some(
        (k) => Array.isArray(k) && k.includes("subjects") && k.includes("school-1")
      );
      expect(hasStaffList).toBe(true);
      expect(hasStaffRolesPrefix).toBe(false);
      expect(hasNewStaffRoles).toBe(true);
      expect(hasPriorStaffRoles).toBe(true);
      expect(hasWings).toBe(true);
      expect(hasSubjects).toBe(true);
    });

    expect(mocks.mockAutoAssign).toHaveBeenCalled();
    expect(mocks.mockRemoveAutoAssign).toHaveBeenCalledWith("staff-old", "class1", "school-1");
  });

  it("on successful remove (staff=null) invalidates the same four keys (narrow on staff-prior) and cleans up the prior staff's wing auto-assign", async () => {
    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    qc.setQueryData(roleManagerKeys.staffList("school-1"), []);
    qc.setQueryData(roleManagerKeys.wings("school-1"), []);
    qc.setQueryData(roleManagerKeys.subjects("school-1"), []);

    const { result } = renderHook(() => useSaveSubjectAssignment("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      isClassTeacher: true,
      sectionId: "sec1",
      classId: "class1",
      subjectId: null,
      staff: null,
      existingStaffId: "staff-prior",
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
          k[2] === "school-1" &&
          k.length === 3
      );
      const hasPriorStaffRoles = keys.some(
        (k) =>
          Array.isArray(k) &&
          k[0] === "role-manager" &&
          k[1] === "staff-roles" &&
          k[2] === "school-1" &&
          k[3] === "staff-prior"
      );
      const hasWings = keys.some(
        (k) => Array.isArray(k) && k.includes("wings") && k.includes("school-1")
      );
      const hasSubjects = keys.some(
        (k) => Array.isArray(k) && k.includes("subjects") && k.includes("school-1")
      );
      expect(hasStaffList).toBe(true);
      expect(hasStaffRolesPrefix).toBe(false);
      expect(hasPriorStaffRoles).toBe(true);
      expect(hasWings).toBe(true);
      expect(hasSubjects).toBe(true);
    });

    expect(mocks.mockRemoveAutoAssign).toHaveBeenCalledWith("staff-prior", "class1", "school-1");
  });

  it("skips the old-staff cleanup when existingStaffId is null (first-time assign)", async () => {
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSaveSubjectAssignment("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      isClassTeacher: false,
      sectionId: "sec1",
      classId: "class1",
      subjectId: "subj1",
      staff: { id: "staff-A" },
      existingStaffId: null,
    });

    // Critically, no null-existing crash and no removeWing call with null.
    const calls = mocks.mockRemoveAutoAssign.mock.calls;
    for (const c of calls) {
      expect(c[0]).not.toBeNull();
    }
  });

  it("skips the old-staff cleanup when existingStaffId === staff.id (idempotent re-select)", async () => {
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useSaveSubjectAssignment("school-1"), { wrapper });

    await result.current.mutateAsync({
      schoolId: "school-1",
      isClassTeacher: false,
      sectionId: "sec1",
      classId: "class1",
      subjectId: "subj1",
      staff: { id: "staff-A" },
      existingStaffId: "staff-A",
    });

    const calls = mocks.mockRemoveAutoAssign.mock.calls;
    for (const c of calls) {
      expect(c[0]).not.toBe("staff-A");
    }
  });

  it("still invalidates the four keys when wing auto-assign fails (graceful degrade)", async () => {
    mocks.mockAutoAssign.mockRejectedValueOnce(new Error("wing boom"));

    const { qc, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(qc, "invalidateQueries");

    qc.setQueryData(roleManagerKeys.staffList("school-1"), []);
    qc.setQueryData(roleManagerKeys.wings("school-1"), []);
    qc.setQueryData(roleManagerKeys.subjects("school-1"), []);

    const { result } = renderHook(() => useSaveSubjectAssignment("school-1"), { wrapper });

    await expect(
      result.current.mutateAsync({
        schoolId: "school-1",
        isClassTeacher: true,
        sectionId: "sec1",
        classId: "class1",
        subjectId: null,
        staff: { id: "staff-A" },
        existingStaffId: null,
      })
    ).resolves.toBeUndefined();

    await waitFor(() => {
      const keys = invalidateSpy.mock.calls.map((c) => c[0]?.queryKey);
      const hasStaffList = keys.some(
        (k) => Array.isArray(k) && k.includes("staff-list") && k.includes("school-1")
      );
      const hasWings = keys.some(
        (k) => Array.isArray(k) && k.includes("wings") && k.includes("school-1")
      );
      const hasSubjects = keys.some(
        (k) => Array.isArray(k) && k.includes("subjects") && k.includes("school-1")
      );
      expect(hasStaffList).toBe(true);
      expect(hasWings).toBe(true);
      expect(hasSubjects).toBe(true);
    });
  });

  it("throws when schoolId is missing", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useSaveSubjectAssignment(undefined), { wrapper });

    await expect(
      result.current.mutateAsync({
        schoolId: "school-1",
        isClassTeacher: true,
        sectionId: "sec1",
        classId: "class1",
        subjectId: null,
        staff: { id: "staff-A" },
        existingStaffId: null,
      })
    ).rejects.toThrow(/schoolId required/);
  });
});
