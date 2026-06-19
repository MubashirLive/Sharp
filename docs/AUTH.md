# SHARP — Authentication & Authorization

> See **§17 Implementation Reference** for built routes, components, edge functions, schema, and AuthContext additions. The spec below describes intended behavior; built-vs-planned state is in §17.

---

## 1. Core Principles

| Principle | Rule |
|---|---|
| **No self sign-up** | All accounts created by authorised roles |
| **Role from server** | `profiles.role` resolved at login, never user-selected |
| **School isolation** | `school_id` on every table, RLS enforced |
| **Principal = password + PIN** | Password for auth, PIN for trusted-device quick login |
| **Staff/Student = PIN-only** | No passwords for daily login |
| **OTP for verification** | First-time setup, recovery, new-device verification |
| **Forced setup** | First login cannot skip setup steps |

### Auth Methods by Role

| Role | First Login | Daily Login | Recovery |
|---|---|---|---|
| Super Admin | Email + password | Email + password | Super Admin panel reset |
| Principal | Email + temp password → forced password change → forced PIN | Password **or** PIN | Dual OTP (email + mobile) |
| Master Admin | Mobile/Staff ID → OTP → PIN | Mobile/Staff ID → profile → PIN | Mobile OTP |
| Admin | Mobile/Staff ID → OTP → PIN | Mobile/Staff ID → profile → PIN | Mobile OTP |
| Teacher / Non-teaching | Mobile/Staff ID → OTP → PIN | Mobile/Staff ID → profile → PIN | Mobile OTP |
| Student | Mobile/Student ID → OTP → PIN | Mobile/Student ID → profile → PIN | Mobile OTP |

### Account Creation Chain

```
Super Admin creates Principal
  → Principal creates Master Admin / Admin / Staff / Students
    → Master Admin creates Admin / Staff / Students
```

---

## 2. Role System

### Hierarchy

```
super_admin (platform-level, no school)
  └── principal (full school access)
        └── master_admin (full school, no billing)
              ├── admin (configurable permissions)
              ├── teacher (own class/subject)
              └── student (mobile-only, own data)
```

`profiles.role` is the **single source of truth**. The legacy `user_roles` table was dropped; RLS helpers read directly from `profiles.role`. See `BUGS.md` for the dual-role bug fix and migration guide.

---

## 3. Identity & Account Lifecycle

### Account Status (`profiles.status`)

| Status | Meaning |
|---|---|
| `created` | Row exists, credentials not set |
| `first_login` | Account created, awaiting forced setup |
| `active` | Normal authenticated state |
| `inactive` | Off-boarded, login disabled |
| `locked` | Too many failed attempts, redirected to `/auth/locked` |

### First-Login vs Daily

- **First login:** identity → optional OTP → forced setup (password change for Principal, PIN set for staff/student) → daily login form.
- **Daily login:** identifier + credential (no forced steps).
- **Trusted device:** store `device_fingerprint`; PIN-only prompt on subsequent visits.

---

## 4. Login Flows

### 4.1 Super Admin
Email + password. No school selection. RLS helper bypasses `school_id` for cross-school ops.

### 4.2 Principal
1. School select (state → city → school cascade)
2. Email + temp password
3. `must_change_password = true` → `ForcedPasswordChange`
4. `must_change_pin = true` → `ForcedPINSetup`
5. Daily: password **or** PIN (PIN on trusted device only)

### 4.3 Staff (Master Admin / Admin / Teacher / Non-Teaching)
1. School select
2. Mobile/Staff ID → `ProfileCard` displays (DP + Name + Staff App ID + Messenger Tag)
3. PIN entry (6-dot display, `PINKeypad`)
4. First login: OTP verify before PIN set
5. Daily: identifier → profile → PIN (no OTP)

### 4.4 Student
Same as staff. Identifier = Mobile/Student App ID. ProfileCard adds class-section.

---

## 5. First-Time Login Setup

### Principal: Forced Password Change
- New password: 8+ chars, mixed case, number, special
- Confirmation field
- On save: clears `must_change_password`; redirects to PIN setup

### Principal & Staff/Student: Forced PIN Setup
- 6-digit PIN, numeric only
- Confirmation field
- Hashes via `set-pin` edge function (bcrypt)
- Sets `must_change_pin = false`

### Staff/Student: OTP Verification
- `send-otp` generates 6-digit code, stores in `otp_codes` with expiry
- `verify-otp` checks code + attempt count
- `verify-pin` (separate, after OTP) sets initial PIN

---

## 6. Daily Authentication

### Principal
- **New device:** password
- **Trusted device:** PIN only (after first password success, fingerprint stored)

### Staff/Student
1. School select (one-time, persisted)
2. Enter Mobile or App ID → `MobileIDToggle`
3. `ProfileCard` shown if identifier matches
4. Enter 6-digit PIN
5. On success: redirect to role landing page

**Wrong PIN:** shake + clear + "X attempts remaining" (1–4)
**5th attempt:** lockout, redirect to `/auth/locked`

---

## 7. Session Management

- JWT in Supabase session (httpOnly cookie)
- `onAuthStateChange` listener in AuthContext re-fetches profile data
- 30-day session, refresh-token rotation
- Sign out: `supabase.auth.signOut()` clears session + local state
- **Multi-tab:** `storage` event for cross-tab PIN verification

---

## 8. Forgot Password / PIN Recovery

### Principal Recovery (Dual OTP)
1. `/auth/principal/recover` → enter registered email
2. Send OTP to email **and** OTP to mobile
3. `DualOTPInput`: 6 boxes per channel, independent timers
4. Both verified → set new password → set new PIN

### Staff Recovery (Mobile OTP)
1. `/auth/staff/recover` → enter mobile
2. Mobile OTP sent
3. Verify → set new PIN (no password)

### Student Recovery (Mobile OTP)
Same as staff, separate route `/auth/student/recover`.

### "Wrong number" rule
Staff/student recovery uses "Wrong number" instead of "mobile not found" to prevent enumeration.

---

## 9. Reset Password / PIN (Admin-Initiated)

- **Master Admin / Admin:** can reset staff/student PIN via Super Admin panel
- **Super Admin:** can reset Principal password + PIN
- All resets: send notification to user email/mobile, log to audit
- See `docs/SUPERADMIN.md` for principal reset flow

---

## 10. Account Lockout & Security

| Attempt | Action |
|---|---|
| 1–4 | Warning toast, clear PIN, allow retry |
| 5 | Account locked, redirect to `/auth/locked?role=...&reason=pin_exceeded` |
| Auto-unlock | 24h after lock (no admin action required) |

PIN: 5 wrong in 10-min window → lock. `profileStatus = "locked"`, redirect via `AutoForceRedirect`.

---

## 11. School Selection & White-Labeling

- **SchoolSelector** component: state → city → school cascade
- One-time on first login; persisted in `localStorage`
- School branding (logo, name, theme) loaded from `schools` table
- School deactivated mid-session → next API returns 403 → forced logout with "School access revoked"

---

## 12. Data Model Overview

### `profiles` (auth columns)
| Column | Type | Purpose |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text | Principal only |
| `login_mobile` | text | 10-digit, unique per school |
| `role` | text | `super_admin` / `principal` / `master_admin` / `admin` / `teacher` / `non_teaching` / `student` |
| `school_id` | uuid FK | null for super_admin |
| `status` | text | `created` / `first_login` / `active` / `inactive` / `locked` |
| `pin_hash` | text | bcrypt of 6-digit PIN |
| `must_change_pin` | bool | Force PIN setup on next login |
| `must_change_password` | bool | Force password change (Principal only) |
| `device_fingerprint` | text | Trusted device hash |
| `last_login_at` | timestamptz | Audit |
| `salutation`, `full_name` | text | UI display |

### `otp_codes`
| Column | Type |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid FK |
| `channel` | text (`email` / `mobile`) |
| `code_hash` | text (bcrypt) |
| `expires_at` | timestamptz |
| `used_at` | timestamptz nullable |
| `attempts` | int default 0 |

### `login_attempts`
| Column | Type |
|---|---|
| `id` | uuid PK |
| `user_id` | uuid FK nullable |
| `mobile` | text |
| `success` | bool |
| `ip` | inet |
| `user_agent` | text |
| `created_at` | timestamptz |

### Indexes
- `profiles(user_id)`, `profiles(school_id, role)`, `profiles(login_mobile)`

### Tables dropped
- `user_roles` — replaced by RLS helper functions reading `profiles.role`

---

## 13. UI Specifications (built)

### Login Form
- School logo (64px) + name (H3, centered)
- Mobile/ID input (44px min height) + `MobileIDToggle` segmented control
- PIN input with visibility toggle (or password input for Principal)
- Primary "Sign In" button (full width)
- "Forgot PIN?" ghost button (left)
- "Powered by SHARP" caption (muted, bottom)
- Principal adds "or" divider + "Sign in with Password" secondary button

### Quick Login (trusted device)
- Pre-filled `ProfileCard` (DP + Name + ID + Messenger Tag)
- PIN dots only (no identifier input)
- "Not you? Sign in as different user" link (shared-PC support)
- "Forgot PIN?" link

### `ProfileCard`
- 64px DP circle, fetched from My Staff / Student form
- Name (Body Large, semibold) + App ID (caption, muted) + Messenger Tag (caption, primary badge)
- Slide-up animation on mobile
- Trusted device: pre-filled from `localStorage`

### `OTPInput`
- 6 boxes (48px each), auto-focus first on mount
- Auto-advance to next on digit, backspace to previous
- Auto-submit on 6th digit
- Paste fills all boxes
- 30-second resend countdown

### `PINKeypad`
- Numeric 3×4 grid, 44px touch targets
- Dots display (●○○○○○) above
- Backspace + Submit row

### `DualOTPInput` (Principal Recovery)
- Email OTP row + Mobile OTP row, each with own 6 boxes + masked destination + resend timer
- Both must be entered before "Verify" enables

---

## 14. Error States

| Error | UI Message | Action |
|---|---|---|
| Invalid mobile | "Wrong number" | Shake, clear |
| Invalid App ID | "ID does not exist" | Shake, clear |
| Invalid email/password (Principal) | "Invalid email or password" | Shake, clear password |
| Invalid PIN (1–4) | "Incorrect PIN. X attempts remaining." | Warning toast, clear |
| Invalid PIN (5) | "Account locked." | Redirect to `/auth/locked` |
| Invalid OTP | "Invalid or expired OTP" | Clear boxes |
| OTP expired | "OTP expired. Request a new one." | Enable resend |
| School not found | "School not found in [City]" | Clear selection |
| Session expired | "Session expired. Please log in again." | Redirect to login |
| New device | "New device detected. Verify with OTP." | Force OTP flow |
| Role mismatch | "Unauthorized access." | Sign out |
| Network error | "Connection lost. Retrying..." | Auto-retry 3× |
| Server error | "Something went wrong. Try again." | Generic |

### Edge Cases
- **localStorage cleared:** school select reappears; session persists (JWT cookie)
- **School deactivated mid-session:** next API → 403 → "School access revoked" → logout
- **Role changed mid-session:** next auth check reloads role → UI updates or redirects
- **Multiple tabs:** PIN verified in one tab → others detect via `storage` event

---

## 15. Implementation Checklist

### Phase 1 — Foundation (DONE)
- [x] Fix `profiles.role` enum (add `super_admin`, `master_admin`, `non_teaching`)
- [x] Drop `user_roles` table
- [x] Add `pin_hash`, `must_change_pin`, `device_fingerprint`, `status`, `last_login_at`, `login_mobile` to `profiles`
- [x] Create `login_attempts` and `otp_codes` tables
- [x] Indexes: `profiles(user_id)`, `profiles(school_id, role)`, `profiles(login_mobile)`
- [x] `AuthContext.tsx` — single role source from `profiles.role`
- [x] Auth constants file (roles, PIN rules, OTP rules, lockout thresholds)

### Phase 2 — Login UI (DONE)
- [x] `SchoolSelector`, `MobileIDToggle`, `StaffProfileCard`, `StudentProfileCard`, `OTPInput`, `DualOTPInput`, `PINKeypad`
- [x] `SuperAdminLogin` (`/auth/superadmin`)
- [x] `PrincipalLogin` (`/auth/principal`)
- [x] `StaffLogin` (`/auth/staff`)
- [x] `StudentLogin` (`/auth/student`)

### Phase 3 — Setup & Recovery (DONE)
- [x] `ForcedPasswordChange`, `ForcedPINSetup`, `PrincipalRecovery`, `StaffRecovery`, `StudentRecovery`, `AccountLocked`
- [x] Edge functions: `send-otp`, `verify-otp`, `verify-pin`, `set-pin`, `check-device`

### Phase 4 — Integration (PARTIAL)
- [x] Wire login flows to `AuthContext`
- [x] `AutoForceRedirect` (status, must_change_password, must_change_pin)
- [ ] Connect `AppShell` role-based navigation (white-label context)
- [ ] Session expiry handling on edge
- [ ] New device detection flow
- [ ] Rate limiting on all auth endpoints
- [ ] Admin-initiated PIN reset flow
- [ ] Super Admin principal credential reset UI

### Phase 5 — Doc updates (PARTIAL)
- [x] `AUTH.md` v2.2 (this doc) — single source of truth
- [ ] `SCREEN_FLOW_MAP.md` — reference AUTH.md
- [ ] `PERMISSION_MATRIX.md` — auth section
- [ ] `PRD.md` §1 — replace with reference
- [ ] `SUPERADMIN.md` — principal reset references AUTH.md §9

---

## 16. Security Recommendations

### Principal (highest privilege)
- **Dual OTP recovery** — both channels required
- **Password + PIN** — balance security vs convenience
- **Device fingerprinting** — detect new devices
- **Trust device prompt** — user-informed
- **Temp password expiry** — 24h, single-use
- **Password complexity** — 8+ chars, mixed case, number, special
- **Lockout escalation** — 4 warnings, 5th lock

### Staff/Student
- **PIN-only daily** — no password to phish
- **Mobile/ID login** — no email required
- **Profile card confirmation** — verify before PIN
- **OTP for setup/recovery** — mobile only
- **"Wrong number"** — prevent enumeration
- **5-attempt lockout** — 24h auto-unlock

### System-wide
- **Rate limiting** — per-IP and per-user on all endpoints
- **Audit logging** — all login attempts (success + failure)
- **HTTPS only** — TLS 1.3
- **PIN hashing** — server-side bcrypt
- **OTP storage** — hashed, never plaintext
- **Session invalidation** — immediate on password/PIN change
- **Cross-tab sync** — `storage` event

---

## 17. Implementation Reference (v2.2) — actual code

### Routes Implemented
| Route | File | Purpose |
|---|---|---|
| `/auth/principal` | `src/pages/AuthRoleLogin.tsx` (kind="principal") | Principal email + password |
| `/auth/staff` | `src/pages/AuthRoleLogin.tsx` (kind="staff") | Staff mobile/ID + PIN |
| `/auth/student` | `src/pages/AuthRoleLogin.tsx` (kind="student") | Student mobile/ID + PIN |
| `/auth/forced-password-change` | `src/pages/ForcedPasswordChange.tsx` | Principal forced password change |
| `/auth/forced-pin-setup` | `src/pages/ForcedPINSetup.tsx` | All roles forced PIN setup |
| `/auth/locked` | `src/pages/AccountLocked.tsx` | Lockout screen |
| `/auth/principal/recover` | `src/pages/PrincipalRecovery.tsx` | Dual OTP recovery |
| `/auth/staff/recover` | `src/pages/StaffRecovery.tsx` | Mobile OTP recovery |
| `/auth/student/recover` | `src/pages/StudentRecovery.tsx` | Mobile OTP recovery |

### Components
| Component | File | Purpose |
|---|---|---|
| `SchoolSelector` | `src/components/auth/SchoolSelector.tsx` | State → City → School cascade |
| `ProfileCard` | `src/components/auth/ProfileCard.tsx` | Photo + Name + ID + Tag |
| `PINKeypad` | `src/components/auth/PINKeypad.tsx` | 6-digit numeric keypad + dots |
| `MobileIDToggle` | `src/components/auth/MobileIDToggle.tsx` | Mobile/App ID segmented control |
| `OTPInput` | `src/components/auth/OTPInput.tsx` | 6-box OTP + countdown |
| `LoginCard` | `src/components/auth/LoginCard.tsx` | Login card container |
| `StaffLoginForm` | `src/components/auth/LoginForms.tsx` | Unified PIN login form |

### Edge Functions Deployed
| Function | Purpose |
|---|---|
| `send-otp` | Generate 6-digit OTP, store in `otp_codes`, log to console (SMS via MSG91 placeholder) |
| `verify-otp` | Verify OTP, check attempts, mark used |
| `set-pin` | Validate + store PIN hash in `profiles` |
| `check-device` | Fingerprint compare (new device detection) |
| `verify-pin` | bcrypt compare + attempt tracking |

### Database Changes

**`profiles` columns added:**
- `pin_hash` (text) — bcrypt hash of 6-digit PIN
- `must_change_pin` (bool) — force PIN setup on first login
- `must_change_password` (bool) — force password change on first login
- `device_fingerprint` (text) — trusted device hash
- `status` (text) — `created`/`first_login`/`active`/`inactive`/`locked`
- `last_login_at` (timestamptz) — last successful login
- `login_mobile` (text) — dedicated login mobile

**Tables created:** `otp_codes` (OTP storage with expiry) · `login_attempts` (auth audit trail)

**Tables dropped:** `user_roles` (replaced by RLS helpers on `profiles.role`)

### AuthContext Changes (`src/contexts/AuthContext.tsx`)

**State exposed:** `user` · `session` · `loading` · `role` · `primaryRole` · `school` · `mustChangePassword` · `mustChangePin` · `profileStatus` · `isSuperAdmin` · `refresh` · `signOut` · `profile`

**`loadProfileData(uid)`:**
- Reads `profiles.role, school_id, must_change_password, must_change_pin, full_name, salutation, status, login_mobile`
- If `school_id` set → reads `schools(id, name, slug, emblem_url, onboarding_complete, status)`
- Sets all auth state. Reset all to null if profile row missing.

**`AutoForceRedirect` (mounted in provider):**
- `status = "locked"` → `/auth/locked?role=...&reason=...`
- `must_change_password = true` (principal) → `/auth/forced-password-change`
- `must_change_pin = true` (staff/student) → `/auth/forced-pin-setup`
- Skips redirect if already on one of: `/auth/forced-password-change`, `/auth/forced-pin-setup`, `/auth/locked`, `/auth/principal/recover`, `/auth/staff/recover`, `/auth/student/recover`

### Known gaps (Phase 4)
- White-label context not yet wired into `AppShell`
- Session expiry handling on edge (currently cookie expiry only)
- New device detection flow not yet triggered on login
- Rate limiting on auth endpoints
- Admin-initiated PIN reset flow
- Super Admin principal credential reset UI
