// Tests for assignStaffToHouse — guards the one-house-per-staff invariant.
// Regression for the 2026-06-19 bug: a stale `house_staff` row in the target
// house (from a previous failed save or concurrent edit) caused the insert
// to hit UNIQUE(house_name, staff_profile_id) and surface a red toast.
//
// Contract: assignStaffToHouse must remove EVERY existing row for
// (staff_profile_id, school_id) before inserting — not just rows in
// other houses. One-house-per-staff means one row total.

import { describe, it, expect, vi, beforeEach } from "vitest";

const deleteEq = vi.fn().mockReturnThis();
const deleteNeq = vi.fn().mockReturnThis();
const insertFn = vi.fn();

const fromChain = {
  delete: vi.fn(() => ({
    eq: deleteEq,
    neq: deleteNeq,
  })),
  insert: insertFn,
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(() => fromChain) },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { assignStaffToHouse } from "@/integrations/supabase/queries/houses";

describe("assignStaffToHouse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteEq.mockReturnThis();
    deleteNeq.mockReturnThis();
    insertFn.mockReturnValue({ error: null });
  });

  it("deletes all existing rows for (staff, school) before inserting — not just other houses", async () => {
    await assignStaffToHouse("Blue", "staff-1", "school-1", "user-1");

    // Bug surface: the .neq(house_name, ...) clause used to leave a stale
    // row in the target house in place, and the subsequent insert hit the
    // UNIQUE(house_name, staff_profile_id) constraint. After the fix the
    // delete chain must NOT include a .neq() call.
    const from = (await import("@/integrations/supabase/client")).supabase.from;
    expect(from).toHaveBeenCalledWith("house_staff");
    expect(deleteNeq).not.toHaveBeenCalled();

    // The delete must be filtered by staff + school (the two equality
    // predicates that identify the staff's rows).
    expect(deleteEq).toHaveBeenCalledWith("staff_profile_id", "staff-1");
    expect(deleteEq).toHaveBeenCalledWith("school_id", "school-1");

    // Insert runs with the target house.
    expect(insertFn).toHaveBeenCalledWith({
      house_name: "Blue",
      staff_profile_id: "staff-1",
      school_id: "school-1",
      assigned_by: "user-1",
    });
  });

  it("surfaces insert errors to the caller", async () => {
    insertFn.mockReturnValueOnce({ error: { message: "insert failed" } });
    await expect(
      assignStaffToHouse("Red", "staff-2", "school-1")
    ).rejects.toThrow("insert failed");
  });
});
