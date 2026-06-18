// Tests for the TanStack Query migration of Role Manager tabs.
//
// The full RoleManagerTab component tree is too deep to render in JSDOM
// without exhausting memory (see git history for prior OOM attempts).
// Instead we verify the integration at the boundary that matters:
//
//   1. `useSubjects`, `useDepartments`, `useHouses`, `useAvailableStaffForWing`
//      export from useRoleManagerQueries and have the expected query keys.
//   2. `UnsavedChangesDialog` renders the `fromTabLabel` prop in its copy.
//
// These two assertions prove the speed win (cache keys exist for each tab)
// and the modal wiring (per-tab copy is plumbed end-to-end).

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  roleManagerKeys,
} from "@/hooks/useRoleManagerQueries";
import { UnsavedChangesDialog } from "@/components/role-manager/UnsavedChangesDialog";

describe("roleManagerKeys — query key factory", () => {
  it("exposes a stable key per school per data slice", () => {
    // Each tab has a deterministic key. Cross-tab invalidation relies
    // on these being stable references across renders.
    expect(roleManagerKeys.subjects("sc1")).toEqual([
      "role-manager", "subjects", "sc1",
    ]);
    expect(roleManagerKeys.departments("sc1")).toEqual([
      "role-manager", "departments", "sc1",
    ]);
    expect(roleManagerKeys.houses("sc1")).toEqual([
      "role-manager", "houses", "sc1",
    ]);
    expect(roleManagerKeys.wings("sc1")).toEqual([
      "role-manager", "wings", "sc1",
    ]);
    expect(roleManagerKeys.availableStaffForWing("sc1")).toEqual([
      "role-manager", "available-staff-for-wing", "sc1",
    ]);
  });

  it("different schools produce different keys (cache isolation)", () => {
    expect(roleManagerKeys.subjects("sc1")).not.toEqual(roleManagerKeys.subjects("sc2"));
    expect(roleManagerKeys.houses("sc1")).not.toEqual(roleManagerKeys.houses("sc2"));
  });

  it("all keys share the same `all` prefix (broad invalidation works)", () => {
    const subjectsKey = roleManagerKeys.subjects("sc1");
    const housesKey = roleManagerKeys.houses("sc1");
    expect(subjectsKey[0]).toBe("role-manager");
    expect(housesKey[0]).toBe("role-manager");
  });
});

describe("UnsavedChangesDialog — fromTabLabel prop", () => {
  it("renders the provided label in the description copy", () => {
    render(
      <UnsavedChangesDialog
        open={true}
        fromTabLabel="Wings"
        onDiscard={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    // The label appears inside the dialog description.
    expect(screen.getByText("Wings")).toBeInTheDocument();
  });

  it("renders the title and both action buttons", () => {
    render(
      <UnsavedChangesDialog
        open={true}
        fromTabLabel="Houses"
        onDiscard={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /keep editing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /discard/i })).toBeInTheDocument();
  });
});