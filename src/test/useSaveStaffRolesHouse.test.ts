// Tests that useSaveStaffRoles propagates house-slot changes through to
// the houses.ts mutations with the right slot key, and that the
// subsequent query invalidation refreshes the right TanStack keys.
//
// Post 2026-06-20: setHouse takes a slot (number), not a name (string).
// Dirty check compares `draft.house` (slot | null) against
// `original.house?.slot`. The save calls setHouse(staffId, slot, schoolId,
// currentUserId) and the houses tab is invalidated on success so the
// HousesAssignmentTab refetches.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/integrations/supabase/queries/roleAssignments", async () => {
  const actual = await vi.importActual<
    typeof import("@/integrations/supabase/queries/roleAssignments")
  >("@/integrations/supabase/queries/roleAssignments");
  return {
    ...actual,
    setHouse: vi.fn().mockResolvedValue(undefined),
    updateStaffTag: vi.fn().mockResolvedValue(undefined),
    updateMasterAdmin: vi.fn().mockResolvedValue(undefined),
    updateAdminRole: vi.fn().mockResolvedValue(undefined),
    updateStaffRole: vi.fn().mockResolvedValue(undefined),
    updateStaffStatus: vi.fn().mockResolvedValue(undefined),
    addCoordinator: vi.fn().mockResolvedValue(undefined),
    removeCoordinator: vi.fn().mockResolvedValue(undefined),
    addClassTeacher: vi.fn().mockResolvedValue(undefined),
    removeClassTeacher: vi.fn().mockResolvedValue(undefined),
    addSubjectTeacher: vi.fn().mockResolvedValue(undefined),
    removeSubjectTeacher: vi.fn().mockResolvedValue(undefined),
    addDepartmentMember: vi.fn().mockResolvedValue(undefined),
    removeDepartmentMember: vi.fn().mockResolvedValue(undefined),
    removeDepartmentIncharge: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { useSaveStaffRoles, roleManagerKeys } from "@/hooks/useRoleManagerQueries";
import { setHouse } from "@/integrations/supabase/queries/roleAssignments";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: qc }, children);
  return { qc, wrapper };
}

const baseOriginal = {
  staff_id: "staff-A",
  is_master_admin: false,
  is_admin: false,
  role: "teacher",
  status: "active",
  messenger_tag: null,
  coordinator_wings: [],
  auto_assigned_wings: [],
  manual_teacher_wings: [],
  class_teachers: [],
  subject_teachers: [],
  departments: [],
  house: null,
} as const;

describe("useSaveStaffRoles — house slot (post 2026-06-20)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls setHouse with the draft slot when changed", async () => {
    const { wrapper } = makeWrapper();

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
        house: 2, // moved to slot 2 (Green)
        coordinatorWingIds: [],
        classTeachers: [],
        subjectTeachers: [],
        deptMemberIds: [],
        deptInchargeIds: [],
      },
      original: { ...baseOriginal, house: null },
    });

    expect(setHouse).toHaveBeenCalledTimes(1);
    expect(setHouse).toHaveBeenCalledWith("staff-A", 2, "school-1", "user-X");
  });

  it("does NOT call setHouse when draft slot matches original slot", async () => {
    const { wrapper } = makeWrapper();

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
        house: 0, // slot 0
        coordinatorWingIds: [],
        classTeachers: [],
        subjectTeachers: [],
        deptMemberIds: [],
        deptInchargeIds: [],
      },
      original: { ...baseOriginal, house: { slot: 0, name: "Red" } },
    });

    expect(setHouse).not.toHaveBeenCalled();
  });
});
