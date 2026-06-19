// Tests for clearHouseAssignments — used by My School > Houses reset per
// docs/HOUSE.md §8. Regression for the 2026-06-19 bug: reset renamed the
// house and cleared the emblem but did NOT clear staff assignments. A
// user who renamed "Red" to "Devil", assigned Gaurav Saxena, then reset
// saw Gaurav still attached to the house slot.
//
// Contract: clearHouseAssignments must delete from BOTH house_staff AND
// house_incharges for the (house_name, school_id) tuple. Idempotent —
// errors on zero rows are not testable here since the mock returns ok
// regardless; the important assertion is that BOTH tables are touched.

import { describe, it, expect, vi, beforeEach } from "vitest";

const deleteEq = vi.fn().mockReturnThis();
const fromMock = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: fromMock },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { clearHouseAssignments } from "@/integrations/supabase/queries/houses";

describe("clearHouseAssignments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deleteEq.mockReturnThis();
    // Each call to supabase.from(table) returns a fresh delete chain that
    // resolves to { error: null }.
    fromMock.mockImplementation(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    }));
  });

  it("deletes from BOTH house_staff and house_incharges for the given (house, school)", async () => {
    await clearHouseAssignments("Red", "school-1");

    expect(fromMock).toHaveBeenCalledWith("house_staff");
    expect(fromMock).toHaveBeenCalledWith("house_incharges");
    // Both calls happened.
    expect(fromMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces errors from either table delete", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "house_staff") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: { message: "staff delete failed" } })),
            })),
          })),
        };
      }
      return {
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      };
    });
    await expect(clearHouseAssignments("Blue", "school-1")).rejects.toThrow("staff delete failed");
  });
});
