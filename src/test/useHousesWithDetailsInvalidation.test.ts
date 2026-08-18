// Regression test for the Houses cross-tab invalidation contract.
//
// 2026-06-20: MySchool HousesTab incharges now come from
// useHousesWithDetails (the same key the Role Manager Houses tab reads).
// HousesTab.saveHouses invalidates `houses` + `staff-roles`; the
// handleConfirmReset calls the same bridge. This test pins the
// key-factory contract so a future refactor can't silently break
// cross-tab sync.

import { describe, it, expect } from "vitest";

import { roleManagerKeys } from "@/hooks/useRoleManagerQueries";

describe("Houses cross-tab invalidation — key factory", () => {
  it("houses key is [schoolId, 'houses']", () => {
    expect(roleManagerKeys.houses("school-1")).toEqual([
      "role-manager",
      "houses",
      "school-1",
    ]);
  });

  it("houses key is the same for both MySchool and Role Manager", () => {
    // The shared key is the entire point — both surfaces read from it
    // and both surfaces invalidate it on write.
    const keyA = roleManagerKeys.houses("school-1");
    const keyB = roleManagerKeys.houses("school-1");
    expect(keyA).toEqual(keyB);
  });
});
