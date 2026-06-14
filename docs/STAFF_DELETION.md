# Staff Deletion

> Hard-delete lifecycle for staff records. Authoritative spec for the `My Staff → Delete` flow.

---

## TL;DR

- **Mode:** hard delete (purge). No soft-delete, no archive, no 30-day waiting period.
- **Authorisation:** Principal or Master Admin (same school). Superadmin cross-school. Self-delete blocked.
- **Server-side guard:** `delete-staff` edge function re-runs all 4 cascade checks before deleting.
- **Idempotent:** if staff already deleted, returns 404.
- **No audit log table** in v1. Edge function logs to Supabase logs only.

---

## §1 — What gets deleted

In order, atomic-ish (no DB transaction wraps the whole flow — each step is a separate query in the edge fn):

1. `event_task_completions` rows where `staff_id = X` (manual clear; FK is now CASCADE — defensive)
2. `staff_profiles` row where `profile_id = X` (CASCADEs `staff_profile_extended`)
3. `profiles` row where `id = X` (CASCADEs all junction tables)
4. `auth.users` row where `id = X`

### CASCADE chain that fires from deleting `profiles`

| Table | FK | ON DELETE |
|---|---|---|
| `staff_profile_extended` | `profile_id` | CASCADE |
| `superadmin_profiles` | `profile_id` | CASCADE (no effect, wrong role) |
| `principal_profiles` | `profile_id` | CASCADE (no effect, wrong role) |
| `student_profiles` | `profile_id` | CASCADE (no effect, wrong role) |
| `department_staff` | `staff_profile_id` | CASCADE |
| `house_staff` | `staff_profile_id` | CASCADE |
| `department_incharges` | `staff_profile_id` | CASCADE |
| `wings_coordinators` | `staff_id` | CASCADE |
| `wings_activity_staff` | `staff_id` | CASCADE |
| `staff_bulk_actions.user_id` | `user_id` | SET NULL (preserves history) |
| `staff_bulk_actions.reverted_by` | `reverted_by` | SET NULL |
| `event_task_completions.staff_id` | `staff_id` | CASCADE (added 2026-06-03) |
| `wings_audit_log.user_id` | `user_id` | SET NULL |
| `audit_log.actor_id` | `actor_id` | SET NULL |

`staff_id_sequences` is keyed by `(school_id, year)` only — deleting a staff does **not** release or reuse Staff IDs. The `employee_id` vanishes with the row, so the ID is gone forever from the system. New hires get fresh IDs.

---

## §2 — The 4 cascade checks

All 4 must pass for the Delete button to be enabled in the UI. Each is implemented in **both** edge functions (`check-staff-deletion-eligibility` for the UI, `delete-staff` as the server-side re-check).

| # | Check | Block message |
|---|---|---|
| 1 | Staff is a **Class Teacher** of any section (`class_teachers` table) | "Staff is Class Teacher of [Class-Section]. Reassign in Role Manager." |
| 2 | Staff is the **sole Coordinator** of any wing (`wings_coordinators`, count = 1) | "Staff is the sole Coordinator of [Wing]. Assign a replacement in Wing Tab." |
| 3 | Staff is the **sole Incharge** of any department (`department_incharges`, count = 1) | "Staff is the sole Incharge of [Department]. Assign a replacement in Department Tab." |
| 4 | Staff is in any **House** (`house_staff` membership) | "Staff is House Incharge of [House]. Reassign in House Tab." |

Notes:
- For #2 and #3 the check is "sole" — a staff who is one of 2+ coordinators is NOT a blocker.
- For #4 ANY house membership is a blocker. The `house_staff` table does not have an `is_incharge` flag; spec says any house role counts.
- #1 does not check "sole" — being a class teacher at all blocks.

---

## §3 — UI surface

Entry points in `src/pages/MyStaff.tsx`:

1. **Directory tab → row dropdown → "Delete"** (any status — active, inactive, etc.)
2. **Inactive tab → row Trash icon**

Both call the same `handleDelete(s)` → `setDeletingStaff(s)` → renders `<DeleteStaffDialog staff={deletingStaff} open onDeleted={...} />`.

### DeleteStaffDialog behaviour

- On open: runs `canDeleteStaff(staffId)` → fetches `blocked_items[]`
- If any blocked items: dialog shows them, "Delete Permanently" button is **disabled**, only Cancel is actionable
- If eligible: dialog shows amber pass-state, then a text input appears. User must type the staff's `full_name` (case-insensitive, trimmed) to enable "Delete Permanently". Mismatch shows "Name does not match." in red.
- On confirm: `deleteStaff(staffId)` → toast on success/fail, refresh list, close dialog
- `confirmName` resets on dialog open / staff change

### Permission gate

The Delete UI is wired in `MyStaff.tsx` and shown for any row when `canEdit` is true (`role === 'principal' || role === 'master_admin'`). Server-side `delete-staff` edge fn re-validates role + school_id — never trust the UI.

---

## §4 — Edge functions

### `check-staff-deletion-eligibility`

- **Method:** `POST`
- **Auth:** JWT required, verify_jwt=true
- **Input:** `{ staff_id: UUID }`
- **Response 200:** `{ eligible: true, reason: null, blocked_items: [] }`
- **Response 400:** `{ eligible: false, reason: "…", blocked_items: [{type, name}, …] }` (caller self, or blocked)
- **Response 401:** missing / invalid JWT
- **Response 403:** wrong role or cross-school
- **Response 404:** staff not found / already deleted

Caller validations, in order:
1. JWT present and valid
2. Caller's `auth.users.id` !== `staff_id` (no self-delete)
3. Staff row exists in `staff_profiles`
4. Caller's `profiles.status = 'active'` AND `role IN ('principal', 'master_admin', 'superadmin', 'admin')`
5. Caller's `school_id` matches staff's `school_id` (superadmin bypasses)

Then the 4 cascade checks (see §2).

### `delete-staff`

- **Method:** `POST`
- **Auth:** JWT required
- **Input:** `{ staff_id: UUID }`
- **Response 200:** `{ success: true, employee_id, full_name }`
- **Response 4xx/5xx:** `{ success: false, step: N, error: "…", blocked_items?: [...] }`

Step numbers in errors (`step` field):
- `0` — unhandled exception
- `1` — auth/lookup failed
- `2` — eligibility check failed
- `4` — `staff_profiles` delete failed
- `5` — `profiles` delete failed
- `6` — `auth.users` delete failed

Order of operations in the fn:
1. JWT extraction + caller auth (same as `check-staff-deletion-eligibility`)
2. Self-delete guard
3. Staff + caller lookups
4. School + role validation
5. **Server-side re-check** of all 4 cascade dependencies (in case UI was bypassed)
6. `event_task_completions` clear
7. `staff_profiles` delete
8. `profiles` delete
9. `auth.users` delete
10. `console.log` success with `{ callerUserId, staffId, employeeId, fullName }`

---

## §5 — Migration history

| Migration | Purpose |
|---|---|
| `20260603000000_fix_event_task_staff_fk.sql` | Adds `ON DELETE CASCADE` to `event_task_completions.staff_id`. Changes `staff_bulk_actions.user_id` and `reverted_by` from NO ACTION to SET NULL. Required for atomic delete. |

---

## §6 — Files

| File | Role |
|---|---|
| `supabase/functions/check-staff-deletion-eligibility/index.ts` | Eligibility check |
| `supabase/functions/delete-staff/index.ts` | Atomic hard delete |
| `supabase/migrations/20260603000000_fix_event_task_staff_fk.sql` | FK fix |
| `src/integrations/supabase/queries/staff.ts` | `canDeleteStaff`, `deleteStaff` (client wrappers) |
| `src/components/my-staff/DeleteStaffDialog.tsx` | Shared AlertDialog |
| `src/pages/MyStaff.tsx` | `handleDelete` + dialog state + wiring |
| `src/components/my-staff/StaffTable.tsx` | Dropdown Delete menu item |
| `src/components/my-staff/InactiveStaffTab.tsx` | Trash button in row |
| `src/components/my-staff/StaffFormOverlay.tsx` | Optional `onDelete` + `canDelete` props for view-mode footer |

---

## §7 — Spec drift (resolved)

- ~~Spec §9 said "Delete Permanently" requires inactive status~~ — **Removed**: design allows delete from any status. Inactive is just a UX hint, not a hard gate.
- ~~Spec §9 said 30-day waiting period after inactivation~~ — **Removed**: hard delete is immediate.
- ~~Spec §14 said payroll history forces archive, not purge~~ — **N/A**: no payroll system exists. When payroll is added, the `payroll` table will need an `ON DELETE SET NULL` on its `staff_id` FK and the spec will be revisited.
- ~~Spec §6.1 listed 4 cascade checks, edge fn had 2~~ — **Fixed**: edge fn now implements all 4.
- ~~CLAUDE.md Session Notes mentioned "wire up in People.tsx"~~ — **Stale**: `People.tsx` does not exist. The page is `MyStaff.tsx` and the wiring is now done.
