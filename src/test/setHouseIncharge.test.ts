// Tests for setHouseIncharge — guards the single-incharge-per-house
// invariant. Regression for the 2026-06-19 bug: the upsert used
// onConflict: "house_name,staff_profile_id,school_id" but the table
// has UNIQUE(house_name, school_id) — the ON CONFLICT spec did not
// match any constraint and Postgres threw "there is no unique or
// exclusion constraint matching the ON CONFLICT specification".
//
// Contract: setHouseIncharge must pre-delete any existing incharge row
// for (house_name, school_id) then insert the new one. One incharge
// per house.

import { describe, it, expect, vi, beforeEach } from "vitest";

const deleteEq = vi.fn().mockReturnThis();
const insertFn = vi.fn();

const fromChain = {
  delete: vi.fn(() => ({
    eq: deleteEq,
  })),
  insert: insertFn,
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(() => fromChain) },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { setHouseIncharge } from "@/integrations/supabase/queries/houses";

describe("setHouseIncharge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteEq.mockReturnThis();
    insertFn.mockReturnValue({ error: null });
  });

  it("pre-deletes existing incharge for (house, school) before inserting — single incharge per house", async () => {
    await setHouseIncharge("Red", "staff-1", "school-1", "user-1");

    const from = (await import("@/integrations/supabase/client")).supabase.from;
    expect(from).toHaveBeenCalledWith("house_incharges");

    // The delete must be filtered by house_name + school_id (the single
    // incharge per house invariant). Must NOT use the 3-column
    // onConflict spec that the old upsert used.
    expect(deleteEq).toHaveBeenCalledWith("house_name", "Red");
    expect(deleteEq).toHaveBeenCalledWith("school_id", "school-1");

    // The insert runs with the target incharge.
    expect(insertFn).toHaveBeenCalledWith({
      house_name: "Red",
      staff_profile_id: "staff-1",
      school_id: "school-1",
      assigned_by: "user-1",
    });
  });

  it("surfaces insert errors to the caller", async () => {
    insertFn.mockReturnValueOnce({ error: { message: "insert failed" } });
    await expect(
      setHouseIncharge("Blue", "staff-2", "school-1")
    ).rejects.toThrow("insert failed");
  });
});
