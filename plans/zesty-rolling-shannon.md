# Plan — Fix class-teacher reassign UI showing both staff

## Context

**Bug:** When a class teacher is reassigned from one staff to another in Role Manager, the UI shows **both** the old and new staff as class teachers for that class. Hard refresh clears the inconsistency. The DB is correct (only one row exists) — the UI is wrong.

**Confirmed by user:** "one class can only have one staff as class teacher at a time." Correct — the DB enforces this via the `one_class_teacher_per_section` EXCLUDE constraint and `addClassTeacher`'s pre-delete ([roleAssignments.ts:123-129](src/integrations/supabase/queries/roleAssignments.ts#L123-L129)). Hard refresh proves only one row exists; the bug is purely client state.

**Root cause:** Two unrelated state stores hold the same domain data and are refreshed independently.

1. `RoleManagerTab` stores the full staff list in `useState<StaffWithDetails[]>` via `getStaffWithDetails(schoolId)` ([RoleManagerTab.tsx:38, 48-62](src/components/role-manager/RoleManagerTab.tsx#L38)).
2. Each `StaffRoleCard` stores its own staff's full role payload in `useState<StaffAllRoles>` via `getStaffAllRoles(staff.id, schoolId)` ([StaffRoleCard.tsx:61, 101-114](src/components/role-manager/StaffRoleCard.tsx#L61)).

On save ([StaffRoleCard.tsx:305-309](src/components/role-manager/StaffRoleCard.tsx#L305-L309)), the card awaits `onRefresh()` (parent reload) then `loadRoles()` (its own reload). They are independent fetches with no shared invalidation. When reassigning 10th A from Amit to Anjali:

- Amit's card `roles.class_teachers` was seeded from his old `loadRoles()` and never re-fetched for the diff.
- Parent `staff` array's `is_class_teacher` flag for Amit is recomputed in `getStaffWithDetails` from `staff_roles` ([staff.ts:157](src/integrations/supabase/queries/staff.ts#L157)) and re-fetched on `onRefresh`.
- Anjali's card opens later, runs its own `loadRoles`, picks up the new CT row.
- If `onRefresh` fails silently or returns before the new row is committed, the parent `staff` array still has `is_class_teacher: true` for Amit, while Anjali's card has the row. Both appear as class teachers until hard refresh kills all client state.

**Goal:** Make the client state match the server's single source of truth — after a successful save, every visible card reflects the new state. The DB layer is already correct; the fix is on the client.

## Approach

Convert the two `useState`+`useEffect` data stores to TanStack Query hooks with a shared key factory, and make the save flow a single mutation that invalidates both keys atomically on success. This matches the existing pattern in `useAttendance.ts` (the only other domain with a key factory) and `useWingSync.ts` (mutation with `invalidateQueries` on success).

**Scope (deliberately small — 2 files modified, 1 new file):**

- **New:** `src/hooks/useRoleManagerQueries.ts` — query key factory + 2 read hooks + 1 mutation hook. Mirrors `useAttendance.ts` structure.
- **Modified:** `src/components/role-manager/RoleManagerTab.tsx` — replace `useState<staff>` + `useEffect` with `useStaffList` hook; drop `handleRefreshStaff`; expose a stable `refreshStaff` callback that the cards will call via `onRefresh` → mutation invalidate.
- **Modified:** `src/components/role-manager/StaffRoleCard.tsx` — replace local `useState<roles>` + `loadRoles` `useEffect` with `useStaffRoles(staff.id, schoolId)`. Save function calls the new `useSaveStaffRoles()` mutation; on success, both the staff list and this card's roles are invalidated. Drop `loadRoles` and `seedDraft`'s "load on mount" path; `seedDraft` now runs from a `useEffect` that watches `roles`.

**What we are NOT doing (and why):**
- Not converting `WingsAssignmentTab`, `SubjectAssignmentGrid`, `DepartmentsAssignmentTab`, `HousesAssignmentTab` — they are out of scope and not the source of this bug. The `onAssignmentChange={handleRefreshStaff}` prop continues to work because the new `refreshStaff` callback has the same shape.
- Not adding optimistic updates — the bug is about post-save UI drift, not perceived latency. Server is the source of truth.
- Not changing the data-layer functions (`getStaffAllRoles`, `getStaffWithDetails`, `addClassTeacher`, etc.) — they are correct.
- Not adding realtime subscriptions — overkill for this fix.

## File-by-file changes

### New: `src/hooks/useRoleManagerQueries.ts`

Mirror the structure of `useAttendance.ts` (query key factory at the top, then hooks).

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getStaffWithDetails } from "@/integrations/supabase/queries/staff";
import { getStaffAllRoles } from "@/integrations/supabase/queries/roleAssignments";
// import the save-side helpers used by StaffRoleCard.save
import { /* see below */ } from "@/integrations/supabase/queries/roleAssignments";

// Query key factory — single source of truth for invalidation
export const roleManagerKeys = {
  all: ["role-manager"] as const,
  staffList: (schoolId: string) =>
    [...roleManagerKeys.all, "staff-list", schoolId] as const,
  staffRoles: (schoolId: string, staffId: string) =>
    [...roleManagerKeys.all, "staff-roles", schoolId, staffId] as const,
};

// Read: full staff directory (powers the filter bar + is_class_teacher chip)
export function useStaffList(schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId ? roleManagerKeys.staffList(schoolId) : ["role-manager", "staff-list", "noop"],
    queryFn: () => getStaffWithDetails(schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

// Read: one staff's full role payload
export function useStaffRoles(staffId: string, schoolId: string | undefined) {
  return useQuery({
    queryKey: schoolId
      ? roleManagerKeys.staffRoles(schoolId, staffId)
      : ["role-manager", "staff-roles", "noop"],
    queryFn: () => getStaffAllRoles(staffId, schoolId!),
    enabled: !!schoolId,
    staleTime: 60_000,
  });
}

// Save: wraps the entire StaffRoleCard.save mutation sequence
// (profile, coordinator, CT, ST, department changes) and invalidates both keys
// on success.
export function useSaveStaffRoles(schoolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveStaffRolesInput) => { /* see below */ },
    onSuccess: (_data, input) => {
      if (!schoolId) return;
      qc.invalidateQueries({ queryKey: roleManagerKeys.staffList(schoolId) });
      qc.invalidateQueries({ queryKey: roleManagerKeys.staffRoles(schoolId, input.staffId) });
      // Also invalidate every other card's roles for the same school so cross-staff
      // reassign (Amit loses 10th A, Anjali gains it) is reflected in all open cards.
      qc.invalidateQueries({
        queryKey: [...roleManagerKeys.all, "staff-roles", schoolId],
      });
    },
  });
}
```

**Save input shape** (one mutation, parameterized by staff + diff payload):

```ts
interface SaveStaffRolesInput {
  staffId: string;
  draft: DraftSnapshot;          // current draft state from the card
  original: StaffAllRoles;       // the roles payload the draft was diffed from
  currentUserId: string;
}
```

`DraftSnapshot` is a thin type carrying only the fields the diff in `save()` reads (draftTag, draftIsMasterAdmin, draftIsAdmin, draftRole, draftStatus, draftHouse, draftCoordinatorWingIds, draftClassTeachers, draftSubjectTeachers, draftDeptMemberIds, draftDeptInchargeIds, academicYearId). This avoids the card passing 12 individual params.

**Mutation body**: literal copy of the body of `StaffRoleCard.save` from line 203 (after `setSaving(true)`) to line 304 (before `await onRefresh()`). The `setSaving(true)` / `setSaving(false)` and toast calls stay in the card; only the `await ...` chain moves. This keeps the existing test suite that mocks `addClassTeacher` etc. meaningful — those mocks now stub the *data layer*, and the mutation calls them with the same arguments as before.

The `getAutoAssignedWingsForStaff` call at line 308 stays in the card and runs after the mutation resolves.

### Modified: `src/components/role-manager/RoleManagerTab.tsx`

- Remove `staff` `useState`, `loading` `useState` (replace with `isLoading` from the query), the `useEffect` at line 48-62, and `handleRefreshStaff` at line 96-99.
- Add `const { data: staff = [], isLoading: loading, refetch } = useStaffList(schoolId);`
- Add `const refreshStaff = useCallback(() => { refetch(); }, [refetch]);`
- Pass `refreshStaff` to every `StaffRoleCard` (line 185) and to the three `onAssignmentChange` props (lines 200, 217, 226) — same call signature as before.
- Wrap the result in `useQuery` error handler: if `useStaffList` errors, toast.error. (Replace the try/catch at lines 53-58.)

### Modified: `src/components/role-manager/StaffRoleCard.tsx`

- Remove `roles` `useState` (line 61), `loading` `useState` (line 62), `loadRoles` function (lines 101-114), the `useEffect` at line 116.
- Add `const { data: roles, isLoading: loading } = useStaffRoles(staff.id, schoolId);`
- Replace `seedDraft` direct call paths: instead of `loadRoles` calling `setRoles + seedDraft`, add a `useEffect(() => { if (roles) seedDraft(roles); }, [roles]);`. The `cancelEdit` (line 188-191) keeps calling `seedDraft(roles)` directly.
- The `save` function: wrap its body in `await saveMutation.mutateAsync({ staffId: staff.id, draft: { ... }, original: roles, currentUserId });`. Drop the inline `await onRefresh(); await loadRoles();` block (lines 305-306) — the mutation's `onSuccess` invalidates both keys. The `getAutoAssignedWingsForStaff` call (line 308) and `setEditing(false)` / `toast.success` (lines 310-311) stay.
- `saving` local `useState` (line 65) becomes `saving = saveMutation.isPending`. Drop the `setSaving(true)` / `setSaving(false)` calls inside `save`.
- Error toast (line 313) maps from `saveMutation.error?.message`.

### Test file (no changes)

- `src/test/roleAssignments.test.tsx` mocks `@/integrations/supabase/queries/roleAssignments` and calls `getStaffAllRoles` etc. directly. The data-layer signatures don't change, so the existing tests keep passing.
- The new hook file will not be mocked in existing tests because the existing tests render `StaffRoleCard` in isolation (not inside `RoleManagerTab`). They will need one small adjustment: add a `vi.mock("@/hooks/useRoleManagerQueries", ...)` stub returning canned `roles` data — same shape as the current `getStaffAllRoles` mock. This is a 10-line change to the test file's mock setup. Mention in verification steps.

## Verification

1. **Unit tests** — `npx vitest run src/test/roleAssignments.test.tsx` must pass. Adjust the mock setup to stub `useStaffRoles` and `useSaveStaffRoles` per the file's existing mock pattern.
2. **Manual reproduction of the original bug** — open Role Manager → Staff tab. Assign 10th A to Amit, save. Assign 10th A to Anjali (replace flow). **Expect:** immediately after the second save, Amit's card no longer shows 10th A, Anjali's card does. No hard refresh needed.
3. **Edge case — re-open both cards after the same reassign:** With both Amit's and Anjali's cards rendered (expand both), perform a third reassign (Anjali → Amit). Both cards should update in the same render frame, with no flicker.
4. **Edge case — Wings tab / Subjects tab still refresh:** Open Wings tab, add a coordinator, save, switch back to Staff tab. The staff list should show the new coordinator's role. The `onAssignmentChange={refreshStaff}` wiring must be preserved.
5. **Edge case — network failure mid-save:** Disconnect, click Save, reconnect. Expect the same error toast as before; no partial state corruption (mutation is atomic at the data layer; UI rolls back via `isPending` reverting).
6. **TypeScript check** — `npx tsc --noEmit` should pass. The new `DraftSnapshot` type replaces implicit `any` arguments to the diff functions.

## Out of scope

- Realtime subscription to `staff_roles` changes (e.g. another principal in the same school editing concurrently). Will require `supabase.channel` plumbing; can be a follow-up.
- Optimistic UI for save. The mutation already feels snappy because the pre-delete in `addClassTeacher` is a single round-trip.
- Migrating WingsAssignmentTab / SubjectAssignmentGrid / DepartmentsAssignmentTab / HousesAssignmentTab to TanStack Query. Those tabs have their own refresh logic that already works through `onAssignmentChange`; migrating them is a separate effort.
- The `is_class_teacher` derivation discrepancy between `getStaffWithDetails` (derived client-side) and `getStaffById` (read from column) ([staff.ts:157 vs 212](src/integrations/supabase/queries/staff.ts#L157)). Not the cause of this bug. Note for follow-up.
