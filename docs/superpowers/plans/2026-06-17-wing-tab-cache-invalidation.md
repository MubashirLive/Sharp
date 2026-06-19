# Wings Tab Save: Cross-Tab Cache Invalidation

> **For agentic workers:** REQUIRED SUB-KILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After saving wing-staff assignments in the Wings tab, the Staff tab's TanStack-cached staff-roles payload must reflect the new mapping without a manual refresh.

**Architecture:** Extract Wings tab's save logic from a raw `useState`/`useEffect` data store into a `useSaveWingAssignments` mutation hook that mirrors the existing `useSaveStaffRoles` pattern. The hook invalidates the same TanStack keys that the Staff tab reads (`staff-roles` + `staffList` by school prefix). Component retains its local optimistic draft state for UI; only the persistence + invalidation moves into the hook.

**Tech Stack:** React 18, TypeScript, TanStack Query v5 (`useMutation`, `useQueryClient`, key factory), Vitest + Testing Library.

---

## Root cause (recap)

`WingsAssignmentTab` ([src/components/role-manager/WingsAssignmentTab.tsx:177-228](src/components/role-manager/WingsAssignmentTab.tsx#L177)) uses raw `useState`+`useEffect` and a `loadData()` refetch. On save ([line 380](src/components/role-manager/WingsAssignmentTab.tsx#L380)) it only calls `loadData()` — never `queryClient.invalidateQueries`. The Staff tab reads via `useStaffRoles` → `getStaffAllRoles`, cached in TanStack under `roleManagerKeys.staffRoles(schoolId, staffId)`. The two reads share the underlying `wing_staff` table but have no shared cache layer. Result: Wings save → Staff tab stays stale until the Staff tab itself writes something or the page is hard-reloaded.

## File structure

| File | Responsibility |
|---|---|
| Modify: `src/hooks/useRoleManagerQueries.ts` | Add `useSaveWingAssignments` mutation hook with `onSuccess` invalidation. Add `roleManagerKeys.wings(schoolId)` key. Add a `useWingsForSchool` read hook (optional but consistent). |
| Modify: `src/components/role-manager/WingsAssignmentTab.tsx` | Replace inline `handleSave` body with `useSaveWingAssignments.mutateAsync`. Keep local drafts + optimistic UI. Drop `loadData()` after save — rely on the hook's invalidation. |
| Create: `src/test/useSaveWingAssignments.test.ts` | Unit test: `onSuccess` invalidates `staffList(schoolId)`, all `staff-roles` for the school, and `wings(schoolId)`. Verifies the right keys, not the right network calls. |
| Modify: `docs/ROLE_MANAGER.md` | Note that cross-tab freshness is now mutation-driven. |

## Key shape additions

```ts
roleManagerKeys.wings: (schoolId: string) =>
  [...roleManagerKeys.all, "wings", schoolId] as const,
```

## Mutation input shape

```ts
export interface SaveWingAssignmentsInput {
  schoolId: string;
  additions: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }>;
  removals: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }>;
}
```

The component flattens its `drafts` Map into this shape. The hook runs all operations through `Promise.all`, then invalidates three keys.

---

## Task 1: Add `wings` key + `useSaveWingAssignments` hook

**Files:**
- Modify: `src/hooks/useRoleManagerQueries.ts:31-37` (add key), `:213-228` (append hook)

- [ ] **Step 1: Add the `wings` key to the factory**

In [src/hooks/useRoleManagerQueries.ts:31-37](src/hooks/useRoleManagerQueries.ts#L31) extend the `roleManagerKeys` object. Add a new key right after `staffRoles`:

```ts
export const roleManagerKeys = {
  all: ["role-manager"] as const,
  staffList: (schoolId: string) =>
    [...roleManagerKeys.all, "staff-list", schoolId] as const,
  staffRoles: (schoolId: string, staffId: string) =>
    [...roleManagerKeys.all, "staff-roles", schoolId, staffId] as const,
  wings: (schoolId: string) =>
    [...roleManagerKeys.all, "wings", schoolId] as const,
};
```

- [ ] **Step 2: Add the input type**

In [src/hooks/useRoleManagerQueries.ts](src/hooks/useRoleManagerQueries.ts), right above the `// Save input shape` block at line 68, add:

```ts
export interface SaveWingAssignmentsInput {
  schoolId: string;
  additions: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }>;
  removals: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }>;
}
```

- [ ] **Step 3: Import the wings mutators at the top of the file**

In [src/hooks/useRoleManagerQueries.ts:14-26](src/hooks/useRoleManagerQueries.ts#L14), update the `@/integrations/supabase/queries/wings` import. Add it as a new line (it is not currently imported here):

```ts
import { addStaffToWing, removeStaffFromWing } from "@/integrations/supabase/queries/wings";
```

- [ ] **Step 4: Add the mutation hook at the end of the file**

Append after the `useRefreshStaffList` function (after [line 228](src/hooks/useRoleManagerQueries.ts#L228)):

```ts
// ---------------------------------------------------------------------------
// Wings save mutation — invalidates the same keys the Staff tab reads.
// ---------------------------------------------------------------------------

export function useSaveWingAssignments(schoolId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveWingAssignmentsInput): Promise<void> => {
      const ops: Promise<{ success: boolean; error?: string }>[] = [];
      for (const a of input.additions) {
        ops.push(addStaffToWing(a.wingId, a.staffId, a.role, input.schoolId));
      }
      for (const r of input.removals) {
        ops.push(removeStaffFromWing(r.wingId, r.staffId, r.role));
      }
      const results = await Promise.all(ops);
      const failures = results.filter((x) => !x.success);
      if (failures.length > 0) {
        throw new Error(`Failed to save ${failures.length} wing change(s)`);
      }
    },
    onSuccess: (_data, input) => {
      if (!input.schoolId) return;
      // 1. Staff directory — recomputes is_class_teacher for every staff.
      qc.invalidateQueries({ queryKey: roleManagerKeys.staffList(input.schoolId) });
      // 2. Every card's roles payload for this school. Same school-wide
      //    invalidation pattern as useSaveStaffRoles — when a staff is
      //    added to a wing, every StaffRoleCard's wing list must refresh.
      qc.invalidateQueries({
        queryKey: [...roleManagerKeys.all, "staff-roles", input.schoolId],
      });
      // 3. Wings data — so the Wings tab itself reflects the saved state
      //    (replaces the local loadData() refetch in the component).
      qc.invalidateQueries({ queryKey: roleManagerKeys.wings(input.schoolId) });
    },
  });
}
```

- [ ] **Step 5: Run typecheck to confirm no breakage**

Run: `npx tsc --noEmit`
Expected: PASS. (No callers yet, so only the import path is validated.)

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useRoleManagerQueries.ts
git commit -m "feat(role-manager): add useSaveWingAssignments hook with cross-tab invalidation"
```

---

## Task 2: Write failing test for invalidation keys

**Files:**
- Create: `src/test/useSaveWingAssignments.test.ts`

- [ ] **Step 1: Create the test file**

Create `src/test/useSaveWingAssignments.test.ts` with the following content. It mocks the supabase client + the two wing mutators, drives the mutation with a `QueryClient`, and asserts the three keys are invalidated.

```ts
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
    vi.clearAllMocks();
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
      // Expect three invalidations: staffList, staff-roles prefix, wings
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
    const wingsMock = await import("@/integrations/supabase/queries/wings");
    (wingsMock.addStaffToWing as any).mockResolvedValueOnce({
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
    ).rejects.toThrow(/Failed to save 1 wing change/);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails (or passes) for the right reason**

Run: `npx vitest run src/test/useSaveWingAssignments.test.ts`
Expected at this point: FAIL — the file does not exist yet OR the hook isn't exported. (If you've already completed Task 1, it should pass; if not, it fails on the import.)

- [ ] **Step 3: If the test fails, complete Task 1 first, then re-run**

Re-run: `npx vitest run src/test/useSaveWingAssignments.test.ts`
Expected: PASS (2/2).

- [ ] **Step 4: Commit**

```bash
git add src/test/useSaveWingAssignments.test.ts
git commit -m "test(role-manager): assert useSaveWingAssignments invalidates staff-roles prefix"
```

---

## Task 3: Wire WingsAssignmentTab to the new hook

**Files:**
- Modify: `src/components/role-manager/WingsAssignmentTab.tsx:8-15, 342-390`

- [ ] **Step 1: Add the import**

In [src/components/role-manager/WingsAssignmentTab.tsx:8-15](src/components/role-manager/WingsAssignmentTab.tsx#L8), keep the existing wings imports and add the hook import. After the closing `}` of the wings import (line 14), add:

```ts
import { useSaveWingAssignments } from "@/hooks/useRoleManagerQueries";
```

- [ ] **Step 2: Instantiate the mutation in the component body**

Inside the `WingsAssignmentTab` function, right under the existing `useState` declarations (after [line 194](src/components/role-manager/WingsAssignmentTab.tsx#L194) `const PAGE_SIZE = 25;`), add:

```ts
const saveMutation = useSaveWingAssignments(schoolId);
```

- [ ] **Step 3: Rewrite `handleSave` to use the mutation**

Replace the entire `handleSave` function at [src/components/role-manager/WingsAssignmentTab.tsx:342-390](src/components/role-manager/WingsAssignmentTab.tsx#L342) with:

```ts
const handleSave = async () => {
  setSaving(true);
  try {
    const additions: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }> = [];
    const removals: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }> = [];

    drafts.forEach((draft, wingId) => {
      for (const a of draft.addedCoordinators) {
        additions.push({ wingId, staffId: a.staffId, role: "coordinator" });
      }
      for (const a of draft.addedTeachers) {
        additions.push({ wingId, staffId: a.staffId, role: "teacher" });
      }
      for (const staffId of draft.removedCoordinatorIds) {
        removals.push({ wingId, staffId, role: "coordinator" });
      }
      for (const staffId of draft.removedTeacherIds) {
        removals.push({ wingId, staffId, role: "teacher" });
      }
    });

    await saveMutation.mutateAsync({ schoolId, additions, removals });

    toast.success("All changes saved");
    setDrafts(new Map());
    setIsEditing(false);
    setExpandedWings(new Set());
  } catch (e: any) {
    console.error("Save failed:", e);
    toast.error(e?.message ?? "Failed to save changes");
  } finally {
    setSaving(false);
  }
};
```

Notes:
- `addStaffToWing` and `removeStaffFromWing` are no longer called directly in this file — they moved into the hook.
- The `loadData()` refetch that used to follow a successful save is **removed**. The `onSuccess` invalidation in the hook does the refetch (via the active `wings` query — see Task 4).
- `saving` local state stays for the spinner UX.

- [ ] **Step 4: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS. The component no longer imports `addStaffToWing`/`removeStaffFromWing` directly — but it still uses `getWingsWithFullDetails` and `getAvailableStaffForWing` in `loadData`, so keep that import block. Remove only `addStaffToWing` and `removeStaffFromWing` from the destructure at [line 10-11](src/components/role-manager/WingsAssignmentTab.tsx#L10). Result:

```ts
import {
  getWingsWithFullDetails,
  getAvailableStaffForWing,
  type WingWithStats,
} from "@/integrations/supabase/queries/wings";
```

- [ ] **Step 5: Run the existing test suite**

Run: `npx vitest run`
Expected: PASS for all tests. (`roleAssignments.test.tsx` does not import `WingsAssignmentTab`, so no existing test should be affected. The new `useSaveWingAssignments.test.ts` from Task 2 must pass.)

- [ ] **Step 6: Commit**

```bash
git add src/components/role-manager/WingsAssignmentTab.tsx
git commit -m "refactor(role-manager): route WingsAssignmentTab save through useSaveWingAssignments"
```

---

## Task 4: Add a `useWingsForSchool` read hook + drop `loadData()` boilerplate (optional but recommended)

This task is optional but recommended for symmetry. After Task 3 the Wings tab still uses `useState`+`useEffect` for its initial load. The mutation in Task 1 invalidates a `wings(schoolId)` key, but no read hook uses it yet — invalidation is harmless but slightly wasteful. Converting the read to a `useQuery` gives us a single source of truth and lets the mutation's `onSuccess` actively refetch.

**Files:**
- Modify: `src/hooks/useRoleManagerQueries.ts`
- Modify: `src/components/role-manager/WingsAssignmentTab.tsx:177-228`

- [ ] **Step 1: Add the read hook**

In [src/hooks/useRoleManagerQueries.ts](src/hooks/useRoleManagerQueries.ts), right after `useStaffRoles` (after [line 63](src/hooks/useRoleManagerQueries.ts#L63)), add:

```ts
export function useWingsForSchool(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.wings(schoolId)
      : ["role-manager", "wings", "noop"],
    queryFn: () => getWingsWithFullDetails(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}
```

Add the import at the top of the file alongside the existing wings import (Task 1, Step 3):

```ts
import { addStaffToWing, getWingsWithFullDetails, removeStaffFromWing } from "@/integrations/supabase/queries/wings";
```

- [ ] **Step 2: Replace the `loadData` useEffect in WingsAssignmentTab**

Replace [src/components/role-manager/WingsAssignmentTab.tsx:177-228](src/components/role-manager/WingsAssignmentTab.tsx#L177) (the `wings`, `availableStaff`, `loading` state + `loadData` + the initial `useEffect`) with:

```ts
const wingsQuery = useWingsForSchool(schoolId);
const [availableStaff, setAvailableStaff] = useState<
  Array<{ id: string; full_name: string; father_name?: string }>
>([]);

useEffect(() => {
  if (!schoolId) return;
  let cancelled = false;
  (async () => {
    try {
      const staff = await getAvailableStaffForWing(schoolId);
      if (!cancelled) setAvailableStaff(staff);
    } catch (e) {
      console.error("Failed to load available staff:", e);
    }
  })();
  return () => {
    cancelled = true;
  };
}, [schoolId]);

const wings = useMemo(() => {
  const wingsData = wingsQuery.data ?? [];
  return [...wingsData].sort((a, b) => {
    const aMin = a.classes.length
      ? Math.min(...a.classes.map((c) => getClassAcademicRank(c.name)))
      : 999;
    const bMin = b.classes.length
      ? Math.min(...b.classes.map((c) => getClassAcademicRank(c.name)))
      : 999;
    return aMin - bMin;
  });
}, [wingsQuery.data]);

const loading = wingsQuery.isLoading;
```

- [ ] **Step 3: Update the `cancelEdit` refetch**

[cancelEdit at line 333-339](src/components/role-manager/WingsAssignmentTab.tsx#L333) currently calls `loadData()`. Replace it with:

```ts
const cancelEdit = async () => {
  await wingsQuery.refetch();
  setDrafts(new Map());
  setIsEditing(false);
  setExpandedWings(new Set());
  setReplacementTarget(null);
};
```

- [ ] **Step 4: Typecheck + run tests**

Run: `npx tsc --noEmit && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useRoleManagerQueries.ts src/components/role-manager/WingsAssignmentTab.tsx
git commit -m "refactor(role-manager): move Wings tab read into useWingsForSchool query hook"
```

---

## Task 5: Update docs

**Files:**
- Modify: `docs/ROLE_MANAGER.md`

- [ ] **Step 1: Add a "Cross-tab freshness" note**

Find the section in `docs/ROLE_MANAGER.md` that documents the Wings tab save flow. If no such section exists, add a new subsection titled `### Cross-tab freshness`. The note should read:

```md
### Cross-tab freshness

Wings tab writes and Staff tab reads share the same `wing_staff` table but
historically had no shared cache. Saves in the Wings tab used to leave the
Staff tab stale until a hard refresh.

As of 2026-06-17, all wing-staff mutations go through `useSaveWingAssignments`
(src/hooks/useRoleManagerQueries.ts). Its `onSuccess` invalidates:

- `roleManagerKeys.staffList(schoolId)` — staff directory
- `[...roleManagerKeys.all, "staff-roles", schoolId]` — every card's roles payload
- `roleManagerKeys.wings(schoolId)` — wings data

This mirrors the invalidation pattern in `useSaveStaffRoles`. The Staff tab's
`useStaffRoles` cache refreshes on next mount or active refetch.
```

- [ ] **Step 2: Commit**

```bash
git add docs/ROLE_MANAGER.md
git commit -m "docs(role-manager): document cross-tab freshness via useSaveWingAssignments"
```

---

## Verification (run before declaring done)

- [ ] All tests pass: `npx vitest run`
- [ ] Typecheck clean: `npx tsc --noEmit`
- [ ] Manual repro: add Arun Srivastava to Montessori wing in Wings tab → Save → switch to Staff tab → Arun now appears in the Montessori section of his card.
- [ ] No regression: removing a coordinator still opens the replacement dialog (sole-coordinator guard still fires because the draft mutation logic in `applyRemoveStaff` is unchanged).
- [ ] No regression: auto-assigned teachers still cannot be removed from the Wings tab (the `isAutoAssigned` branch in `handleRemoveStaff` is unchanged).

## Spec coverage self-check

| Root-cause requirement | Task |
|---|---|
| Wings save invalidates Staff tab's `staff-roles` cache | T1 (invalidation in hook), T2 (test asserts it) |
| Wings save invalidates `staffList` (for any cross-tab staff aggregates) | T1, T2 |
| Component code stays in sync with mutation outcome | T3 (rewires `handleSave`) |
| No double-fetch / no missed invalidation | T4 (consolidates read into same `wings` key) |
| Documentation reflects the contract | T5 |

No placeholders. No "TODO". No bundling unrelated changes.
