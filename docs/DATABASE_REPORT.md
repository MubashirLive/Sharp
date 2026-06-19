# SHARP — Database Audit Report
**Date:** 2026-05-11
**Updated:** 2026-05-22
**Branch:** Chatting_Feature_MK

> Snapshot of audit at the time. For current status, see [REPORT_2.md](REPORT_2.md) (cron run 2026-06-07) and [TASK.md](TASK.md) for open work.

---

## P0 — CRITICAL

### ✅ 3.1 Dual Role System (FIXED 2026-05-22)

Two separate role systems out of sync.

**Before:**
- `user_roles.role = 'super_admin'` — edge functions
- `profiles.role = 'superadmin'` — frontend AuthContext

**Fix:** `create-school` + `claim-super-admin` edge functions now use `profiles.role` as single source. `normalizeRole()` kept for backwards compat.

**Files:** `supabase/functions/create-school/index.ts`, `supabase/functions/claim-super-admin/index.ts`

---

### ✅ 3.2 `onboarding_complete` vs `onboarding_completed` (FIXED 2026-05-22)

Initial migration created `onboarding_completed` (with 'd'). All code uses `onboarding_complete` (no 'd').

**Fix:** Idempotent reconciliation migration applied. DB now has correct column.

---

### ✅ 3.3 `principal_temp_password` Plain Text (FIXED 2026-05-22)

**Fix:** `schools.principal_temp_password_encrypted` column added. `encrypt_text()` function. `SuperAdmin.tsx` encrypts on write.

---

### ✅ 3.4 `aadhar_number` Plain Text (FIXED 2026-05-22)

**Fix:** `students.aadhar_number_encrypted` column. `Students.tsx` encrypts on write, decrypts on read via `initialAadhar` prop. `StudentFormDialog` accepts `initialAadhar`.

---

## P1 — HIGH

### ✅ 3.5 `get_conversation_with_participants` Wrong JOIN (FIXED 2026-05-22)

```sql
-- Before: pr.user_id (column does not exist)
-- After: pr.id
LEFT JOIN public.profiles pr ON p.user_id = pr.id
```

---

### ✅ 3.6 `roll_no` No Uniqueness Constraint (FIXED 2026-05-22)

Added: `UNIQUE (school_id, roll_no)`

---

### ✅ 3.7 `national_holidays` Missing Index (FIXED 2026-05-22)

Added: `CREATE INDEX idx_national_holidays_date ON national_holidays(date)`

---

### ✅ 3.8 Missing RLS Indexes (FIXED 2026-05-22)

Added: `idx_user_roles_user_id`, `idx_user_roles_user_school`

---

## P2 — MEDIUM

### ❌ 3.9 No `staff` Table — Pending.

Create `staff` table aligned with `People.tsx` mock data.

### ❌ 3.10 Roll Resequence Trigger Race Condition — Pending.

Concurrent inserts cause trigger collisions. Fix: `SELECT FOR UPDATE` or app-layer locking.

### ❌ 3.11 `get_user_school_id` Returns Wrong Row for Shared Users — Pending.

Assert single school or return ARRAY.

### ✅ 3.12 Missing `updated_at` Triggers (FIXED 2026-05-22)

Added to: `students`, `calendar_events`, `school_calendar`, `user_roles`, `section_subjects`, `sessions`, `class_session_dates`

### ❌ 3.13 Chat Storage Policy `foldername()` Without Guard — Pending.

Add:
```sql
AND array_length(storage.foldername(name), 1) > 0
AND (storage.foldername(name))[1]::uuid = public.get_user_school_id(auth.uid())
```

---

## P3 — LOW

### ❌ 3.14 Hardcoded Holidays 2026–2030 — Pending.

Move to separate seed file.

### ❌ 3.15 No Soft Delete — Pending.

Add `deleted_at` to critical tables. Convert DELETE policies to UPDATE.

### ❌ 3.16 `audit_log` No Auto-Trigger — Pending.

Add audit triggers on `schools`, `students`, `staff`, `user_roles`.

---

## Fix Summary

| # | Item | Priority | Status | Date |
|---|------|----------|--------|------|
| 3.1 | Dual Role System | P0 | ✅ FIXED | 2026-05-22 |
| 3.2 | Onboarding Column | P0 | ✅ FIXED | 2026-05-22 |
| 3.3 | Temp Password Encryption | P0 | ✅ FIXED | 2026-05-22 |
| 3.4 | Aadhar Encryption (write+read) | P0 | ✅ FIXED | 2026-05-22 |
| 3.5 | Wrong JOIN Column | P1 | ✅ FIXED | 2026-05-22 |
| 3.6 | Roll No Unique | P1 | ✅ FIXED | 2026-05-22 |
| 3.7 | National Holidays Index | P1 | ✅ FIXED | 2026-05-22 |
| 3.8 | Missing RLS Indexes | P1 | ✅ FIXED | 2026-05-22 |
| 3.9 | No Staff Table | P2 | ❌ PENDING | — |
| 3.10 | Roll Trigger Race | P2 | ❌ PENDING | — |
| 3.11 | Shared Users Query | P2 | ❌ PENDING | — |
| 3.12 | updated_at Triggers | P2 | ✅ FIXED | 2026-05-22 |
| 3.13 | Storage Policy Guard | P2 | ❌ PENDING | — |
| 3.14 | Hardcoded Holidays | P3 | ❌ PENDING | — |
| 3.15 | No Soft Delete | P3 | ❌ PENDING | — |
| 3.16 | No Audit Triggers | P3 | ❌ PENDING | — |

---

## Migrations Applied 2026-05-22

| Migration | Description |
|---|---|
| `fix_onboarding_column_name` | Reconcile `onboarding_completed` → `onboarding_complete` (idempotent) |
| `add_encryption_functions` | PGP encrypt/decrypt + CHECK on profiles.role + roll_no unique + indexes |
| `add_encrypted_columns` | `_encrypted` columns + encryption key in Vault |
| `add_updated_at_triggers` | Triggers on 7 tables |

---

## Edge Functions Deployed 2026-05-22

| Function | Change |
|---|---|
| `create-school` | Auth gate: `user_roles.role='super_admin'` → `profiles.role='superadmin'` |
| `claim-super-admin` | Write: `user_roles` → `profiles.role='superadmin'` |

---

## PART 4 — What This Doc Should Cover

1. ER diagram (tables, columns, types, defaults, constraints)
2. Relationships (FK chains, referential actions)
3. RLS policy map per table
4. Multi-tenancy strategy (`school_id` isolation)
5. Migration execution order + dependencies
6. Enum/constraint catalogue
7. Index strategy + rationale
8. Trigger catalogue (updated_at, roll resequence, auth hooks)
9. Security definer functions + call sites
10. Known schema conflicts (in CLAUDE.md)
11. Phase 2 tables (staff, attendance, grades, timetable, fees)

---

## PART 5 — Good Practices

- Multi-tenancy via `school_id` on all data tables
- RLS enabled on every table
- `SECURITY DEFINER` + `search_path = public` on helper functions
- `ON DELETE CASCADE` chains
- `ON CONFLICT DO NOTHING` for idempotent inserts
- Check constraints on enum columns
- `updated_at` trigger pattern
- Auto-profile on auth signup via `handle_new_user()` trigger
- Composite unique constraints
- B-tree compound indexes
- `national_holidays` shared reference table
- `build_roll_prefix()` function
- Chat system uses enums

---

## PART 6 — Best Practices

### Schema
- Primary keys: `UUID DEFAULT gen_random_uuid()` ✅
- Timestamps: `TIMESTAMPTZ DEFAULT now()` ✅
- Soft deletes: use `deleted_at` (not done yet)
- Audit columns: `created_by`, `updated_by` (not done yet)
- JSON columns: use sparingly ✅
- snake_case naming ✅

### Indexes
- B-tree: equality + range
- GIN: `TEXT[]`, `UUID[]`, JSONB
- Composite: `(school_id, class_id)`
- Partial: `WHERE status = 'active'`
- Covering: include SELECT columns

### RLS
- One policy per action
- `WITH CHECK` on INSERT/UPDATE
- No subquery in USING (runs per-row)
- `SECURITY DEFINER` always sets `search_path = public`
- Never `auth.uid()` in CHECK for INSERT

### Security
- Encrypt PII: `aadhar_number`, `father_mobile`, `mother_mobile`, `parent_email`
- Hash passwords: `crypt()` / `pgcrypto`
- `principal_temp_password` must be hashed or eliminated
- Check `school_id` first in USING clause
- Never connect as `postgres` superuser
- Secrets in `.env`, never migrations/code

### Migrations
- Idempotent: `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`
- Timestamp prefix naming ✅
- Never modify applied migrations
- Data migrations separate from schema

### Triggers
- Generic `update_updated_at_column()` ✅
- `REFERENCING NEW TABLE AS` for set-based ops
- `STABLE` on deterministic functions
- `SECURITY DEFINER` + `SET search_path = public`

### Multi-tenancy
- `school_id` mandatory on every data table ✅
- First predicate in queries: `WHERE school_id = $1`
- Composite unique: `UNIQUE (school_id, name)`
- Session mode pooler for RLS

### Data Integrity
- Enums over text where possible
- CHECK constraints at DB level
- Unique roll_no ✅ added
- FK referential actions: `RESTRICT` for business entities, `CASCADE` for ownership

---

## PART 7 — Phase 2 Tables Needed

| Table | Status |
|---|---|
| `staff` | Not created — People.tsx mock |
| `attendance` | Not created |
| `grades` / `marks` | Not created |
| `timetable` | Not created |
| `timetable_slots` | Not created |
| `fees` | Not created (Phase 2 Razorpay) |
| `fee_installments` | Not created |
| `parent_guardians` | Not created |
| `student_transfers` | Not created |
| `subjectTeachers` | Not created |

Plan full RLS, indexes, constraints — not ad-hoc.