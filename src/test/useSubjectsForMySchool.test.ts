// Regression test for the Subjects cross-tab invalidation contract.
//
// 2026-06-20: MySchool SubjectTab autosave now invalidates the RM
// `subjects` key + `subjects-myschool` key + `staff-roles` prefix so
// the Role Manager Subject tab + per-card staff-roles update instantly.
// This test pins the key-factory contract.

import { describe, it, expect } from "vitest";

import { roleManagerKeys } from "@/hooks/useRoleManagerQueries";

describe("Subjects cross-tab invalidation — key factory", () => {
  it("subjects key (RM) is [schoolId, 'subjects']", () => {
    expect(roleManagerKeys.subjects("school-1")).toEqual([
      "role-manager",
      "subjects",
      "school-1",
    ]);
  });

  it("subjectsMySchool key (MySchool) is [schoolId, 'subjects-myschool']", () => {
    expect(roleManagerKeys.subjectsMySchool("school-1")).toEqual([
      "role-manager",
      "subjects-myschool",
      "school-1",
    ]);
  });

  it("RM and MySchool subjects keys are different namespaces", () => {
    // The shapes diverge (sections[] vs ClassRow[]), so the keys must
    // too. Invalidating one does NOT invalidate the other; both must
    // be invalidated when both surfaces need to refetch.
    expect(roleManagerKeys.subjects("school-1")).not.toEqual(
      roleManagerKeys.subjectsMySchool("school-1")
    );
  });
});
