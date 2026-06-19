# Staff Deletion

> Hard-delete lifecycle for staff records. Authoritative spec for the `My Staff → Delete` flow.

## TL;DR

- **Mode:** hard delete (purge). No soft-delete, no archive, no 30-day waiting period.
- **Auth:** Principal or Master Admin (same school). Superadmin cross-school. Self-delete blocked.
- **Server-side guard:** `delete-staff` edge function re-runs all 4 cascade checks before deleting.
- **Idempotent:** if staff already deleted, returns 404.
- **No audit log table** in v1. Edge function logs to Supabase logs only.

---

## §1 — What gets deleted

Order, atomic-ish (no DB transaction wraps whole flow — each step is a separate query in the edge fn):

1. `event_task_completions` rows where `staff_id = X` (manual clear; FK is now CASCADE — defensive)
2. `staff_profiles` row where `profile_id = X` (CASCADEs `staff_profile_extended`)
3. `profiles` row where `id = X` (CASCADEs all junction tables)
4. `auth.users` row where `id = X`

### CASCADE chain from `profiles` delete

| Table | FK | ON DELETE |
|---|---|---|
| `staff_profile_extended` | `profile_id` | CASCADE |
| `superadmin_profiles` | `profile_id` | CASCADE (no effect) |
| `principal_profiles` | `profile_id` | CASCADE (no effect) |
| `student_profiles` | `profile_id` | CASCADE (no effect) |
| `department_staff` | `staff_profile_id` | CASCADE |
| `house_staff` | `staff_profile_id` | CASCADE |
| `wings_coordinators` | `staff_id` | CASCADE |
| `wings_activity_staff` | `staff_id` | CASCADE |
| `staff_bulk_actions.user_id` | `user_id` | SET NULL (preserves history) |
| `staff_bulk_actions.reverted_by` | `reverted_by` | SET NULL |
| `event_task_completions.staff_id` | `staff_id` | CASCADE (added 2026-06-03) |
| `wings_audit_log.user_id` | `user_id` | SET NULL |
| `audit_log.actor_id` | `actor_id` | SET NULL |

`staff_id_sequences` keyed by `(school_id, year)` only — deleting a staff does **not** release or reuse Staff IDs. `employee_id` vanishes with the row. New hires get fresh IDs.

---

## §2 — The 4 cascade checks

All 4 must pass for Delete to be enabled in UI. Each implemented in **both** edge functions (`check-staff-deletion-eligibility` for UI, `delete-staff` as server-side re-check).

| # | Check | Block message |
|---|---|---|
| 1 | Class Teacher of any section (`class_teachers`) | "Staff is Class Teacher of [Class-Section]. Reassign in Role Manager." |
| 2 | **Sole** Coordinator of any wing (`wings_coordinators`, count=1) | "Staff is the sole Coordinator of [Wing]. Assign a replacement in Wing Tab." |
| 3 | **Sole** Incharge of any department (`department_staff.is_incharge = true`, count=1) | "Staff is the sole Incharge of [Department]. Assign a replacement in Department Tab." |
| 4 | House membership (`house_staff`) | "Staff is House Incharge of [House]. Reassign in House Tab." |

Notes:
- #2, #3 are "sole" — staff who is 1 of 2+ coordinators/incharges is NOT blocked.
- #4 ANY house membership blocks. `house_staff` has no `is_incharge` flag — any house role counts.
- #1 does NOT check "sole" — being a class teacher at all blocks.

---

## §3 — UI surface

Entry points in `src/pages/MyStaff.tsx`:
1. **Directory tab → row dropdown → "Delete"** (any status)
2. **Inactive tab → row Trash icon**

Both call `handleDelete(s)` → `setDeletingStaff(s)` → `<DeleteStaffDialog staff={deletingStaff} open onDeleted={...} />`.

**DeleteStaffDialog:**
- On open: runs `canDeleteStaff(staffId)` → fetches `blocked_items[]`
- Blocked items → dialog shows them, "Delete Permanently" disabled, only Cancel actionable
- Eligible: amber pass-state, then text input. User must type `full_name` (case-insensitive, trimmed) to enable Delete. Mismatch → "Name does not match." red.
- On confirm: `deleteStaff(staffId)` → toast, refresh, close
- `confirmName` resets on dialog open / staff change

**Permission gate:** Delete UI shown when `canEdit` (`role === 'principal' || role === 'master_admin'`). Server-side `delete-staff` re-validates role + `school_id` — never trust UI.

---

## §4 — Edge functions

### `check-staff-deletion-eligibility`
- **POST**, JWT required, `verify_jwt=true`
- **Input:** `{ staff_id: UUID }`
- **200:** `{ eligible: true, reason: null, blocked_items: [] }`
- **400:** `{ eligible: false, reason: "...", blocked_items: [...] }` (self or blocked)
- **401/403/404:** missing JWT / wrong role or cross-school / not found or already deleted

Caller validations, in order:
1. JWT present and valid
2. Caller's `auth.users.id` !== `staff_id` (no self-delete)
3. Staff row exists in `staff_profiles`
4. Caller's `profiles.status = 'active'` AND `role IN ('principal', 'master_admin', 'superadmin', 'admin')`
5. Caller's `school_id` matches staff's `school_id` (superadmin bypasses)

Then 4 cascade checks (§2).

### `delete-staff`
- **POST**, JWT required
- **Input:** `{ staff_id: UUID }`
- **200:** `{ success: true, employee_id, full_name }`
- **4xx/5xx:** `{ success: false, step: N, error: "...", blocked_items?: [...] }`

`step` codes: `0` unhandled exception / `1` auth-lookup / `2` eligibility / `4` staff_profiles / `5` profiles / `6` auth.users.

Order:
1. JWT extraction + caller auth (same as `check-staff-deletion-eligibility`)
2. Self-delete guard
3. Staff + caller lookups
4. School + role validation
5. **Server-side re-check** of all 4 cascade deps
6. `event_task_completions` clear
7. `staff_profiles` delete
8. `profiles` delete
9. `auth.users` delete
10. `console.log` success with `{ callerUserId, staffId, employeeId, fullName }`

---

## §5 — Migration history

| Migration | Purpose |
|---|---|
| `20260603000000_fix_event_task_staff_fk.sql` | Adds `ON DELETE CASCADE` to `event_task_completions.staff_id`. Changes `staff_bulk_actions.user_id` / `reverted_by` from NO ACTION to SET NULL. Required for atomic delete. |

---

## §6 — Files

| File | Role |
|---|---|
| `supabase/functions/check-staff-deletion-eligibility/index.ts` | Eligibility check |
| `supabase/functions/delete-staff/index.ts` | Atomic hard delete |
| `supabase/migrations/20260603000000_fix_event_task_staff_fk.sql` | FK fix |
| `src/integrations/supabase/queries/staff.ts` | `canDeleteStaff`, `deleteStaff` (client wrappers) |
| `src/components/my-staff/DeleteStaffDialog.tsx` | Shared `AlertDialog` |
| `src/pages/MyStaff.tsx` | `handleDelete` + dialog state + wiring |
| `src/components/my-staff/StaffTable.tsx` | Dropdown Delete menu item |
| `src/components/my-staff/InactiveStaffTab.tsx` | Trash button in row |
| `src/components/my-staff/StaffFormOverlay.tsx` | Optional `onDelete` + `canDelete` props for view-mode footer |

---

## §7 — Spec drift (resolved)

- ~~Spec §9 said "Delete Permanently" requires inactive status~~ — **Removed**: design allows delete from any status. Inactive is just UX hint, not hard gate.
- ~~Spec §9 said 30-day waiting period after inactivation~~ — **Removed**: hard delete is immediate.
- ~~Spec §14 said payroll history forces archive, not purge~~ — **N/A**: no payroll system exists. When added, `payroll.staff_id` will need `ON DELETE SET NULL` and spec revisited.
- ~~Spec §6.1 listed 4 cascade checks, edge fn had 2~~ — **Fixed**: edge fn implements all 4.
- ~~CLAUDE.md Session Notes mentioned "wire up in People.tsx"~~ — **Stale**: `People.tsx` does not exist. Page is `MyStaff.tsx`, wiring done.