// Tests for getHousesWithStats — slot-based read is rename-immune.
// Regression for the 2026-06-19 bug: getHousesWithStats read from
// `house_staff.house_name` and `house_incharges.house_name`. If the
// school renamed "Red" to "Scarlet" (or vice versa), staff were orphaned
// from their card (Red card showed empty stats; Scarlet card showed
// the orphaned staff). The bug surfaced during my-schools > houses reset
// + a fresh role-manager edit attempt — same root cause as the reset
// bug per docs/HOUSE.md §8.
//
// Post 2026-06-20: getHousesWithStats filters by `house_slot` (0..3) and
// returns 4 cards unconditionally (one per slot). A staff member in
// slot 0 stays in slot 0 even when the school renames `houses[0].name`.
//
// This test mocks the Supabase client to simulate the rename scenario:
// school has "Scarlet" in houses[0] (was "Red"), house_staff has one row
// (house_slot=0, house_name="Red" — the OLD name, before trigger
// backfilled), and the staff should still appear under Scarlet.

import { describe, it, expect, vi, beforeEach } from "vitest";

const SCHOOL_ID = "school-1";
const SCARLET_SLOT = 0;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { supabase } from "@/integrations/supabase/client";
import { getHousesWithStats } from "@/integrations/supabase/queries/houses";

// Builders — each `from(table)` returns a chainable builder that always
// resolves to the same array regardless of .select/.eq. We override per
// table in beforeEach.
function makeChain(result: any) {
  const resolved = Promise.resolve({ data: result, error: null });
  // .single() needs the result to be the row (not array) for .single.
  // For the schools call we use a different builder.
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    neq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve({ data: result, error: null })),
    then: (onFulfilled: any, onRejected: any) => resolved.then(onFulfilled, onRejected),
  };
  return builder;
}

function makeSchoolsChain(houses: any[]) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { houses }, error: null })),
      })),
    })),
  };
}

describe("getHousesWithStats — slot-based read is rename-immune", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Scarlet (renamed Red) as slot 0 with Gaurav under it", async () => {
    // School renamed "Red" to "Scarlet" in houses[0]. The trigger has
    // NOT yet backfilled house_staff.house_name (it's still "Red" on
    // the pre-rename row), but house_slot is 0. The card at slot 0
    // must show the staff.
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "schools") {
        return makeSchoolsChain([{ name: "Scarlet", color: "#ef4444", emblem_url: "" }]);
      }
      if (table === "house_staff") {
        return makeChain([{ house_slot: 0, house_name: "Red", staff_profile_id: "gaurav" }]);
      }
      if (table === "house_incharges") {
        return makeChain([]);
      }
      if (table === "profiles") {
        return makeChain([{ id: "gaurav", full_name: "Gaurav Saxena", gender: "male" }]);
      }
      return makeChain([]);
    });

    const result = await getHousesWithStats(SCHOOL_ID);

    expect(result).toHaveLength(4);
    const scarlet = result.find((h) => h.definition.slot === SCARLET_SLOT);
    expect(scarlet, "slot 0 must resolve to Scarlet post-rename").toBeDefined();
    expect(scarlet!.definition.name).toBe("Scarlet");
    // Staff under slot 0 = Gaurav (NOT under "Red", which doesn't exist anymore).
    expect(scarlet!.staff.map((s) => s.staffId)).toContain("gaurav");
  });

  it("does NOT match Gaurav under the OLD name (no Red card)", async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "schools") {
        return makeSchoolsChain([{ name: "Scarlet", color: "#ef4444", emblem_url: "" }]);
      }
      if (table === "house_staff") {
        return makeChain([{ house_slot: 0, house_name: "Red", staff_profile_id: "gaurav" }]);
      }
      if (table === "house_incharges") {
        return makeChain([]);
      }
      if (table === "profiles") {
        return makeChain([{ id: "gaurav", full_name: "Gaurav Saxena", gender: "male" }]);
      }
      return makeChain([]);
    });

    const result = await getHousesWithStats(SCHOOL_ID);

    // No card should be named "Red" anymore.
    const red = result.find((h) => h.definition.name === "Red");
    expect(red, "post-rename no card has the old name").toBeUndefined();
  });

  it("empty slots render with zero counts (no orphan staff leaking across cards)", async () => {
    // Slot 1 (Blue) has zero staff. Make sure the Blue card exists
    // (returns 4 cards always) and shows zero staff.
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "schools") {
        return makeSchoolsChain([{ name: "Blue", color: "#3b82f6", emblem_url: "" }]);
      }
      if (table === "house_staff") {
        return makeChain([]);
      }
      if (table === "house_incharges") {
        return makeChain([]);
      }
      return makeChain([]);
    });

    const result = await getHousesWithStats(SCHOOL_ID);

    expect(result).toHaveLength(4);
    const blue = result.find((h) => h.definition.slot === 1)!;
    expect(blue.definition.name).toBe("Blue");
    expect(blue.staff).toHaveLength(0);
    expect(blue.incharges).toHaveLength(0);
    expect(blue.stats.totalTeachers).toBe(0);
  });

  it("merges gender + father_name from staff_profiles into profileMap (regression: post 4-table-split bug)", async () => {
    // Pre 2026-06-20, profiles had gender + father_name. After the
    // 4-table split (supabase/migrations/20260601020000_four_table_profile.sql),
    // those columns moved to staff_profiles / principal_profiles. The old
    // `profiles.select("id, full_name, gender, father_name, school_id")`
    // returned "column profiles.gender does not exist", surfacing as
    // {data: null, error}, leaving profileMap empty. Symptom: stats=3,
    // house.staff=[] and house.incharges=[] (silent `if (!profile) continue`).
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "schools") {
        return makeSchoolsChain([{ name: "Blue", color: "#3b82f6" }]);
      }
      if (table === "house_staff") {
        return makeChain([{ house_slot: 1, staff_profile_id: "gaurav" }]);
      }
      if (table === "house_incharges") {
        return makeChain([{ house_slot: 1, staff_profile_id: "arun" }]);
      }
      if (table === "profiles") {
        // profiles only has id, full_name, school_id post-split — NO gender
        return makeChain([
          { id: "gaurav", full_name: "Gaurav Saxena", school_id: SCHOOL_ID },
          { id: "arun", full_name: "Arun Srivastava", school_id: SCHOOL_ID },
        ]);
      }
      if (table === "staff_profiles") {
        return makeChain([
          { profile_id: "gaurav", gender: "male", father_name: "Shyam Saxena" },
          { profile_id: "arun", gender: "male", father_name: "Suresh Srivastava" },
        ]);
      }
      return makeChain([]);
    });

    const result = await getHousesWithStats(SCHOOL_ID);

    const blue = result.find((h) => h.definition.slot === 1)!;
    // Both staff must appear in the lists (not silently dropped).
    expect(blue.staff.map((s) => s.staffId).sort()).toEqual(["arun", "gaurav"]);
    expect(blue.incharges.map((i) => i.staffId)).toEqual(["arun"]);
    // Gender merge from staff_profiles must surface on the member shape.
    expect(blue.staff.find((s) => s.staffId === "gaurav")!.gender).toBe("male");
    // Stats.totalTeachers counts IDs (incharges + staff), not profiles.
    expect(blue.stats.totalTeachers).toBe(2);
  });
});
