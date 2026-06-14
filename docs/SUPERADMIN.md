# SHARP — Super Admin

> Docs: PRD.md (role overview, permission matrix), ONBOARDING.md (wizard steps)

---

## Capabilities

Create/edit/delete schools, create principal IDs, edit principal credentials (OTP-verified), reset principal password, activate/deactivate schools. Cannot access any school's data or modules.

Login: `/auth/superadmin` (email + password). 2FA deferred to Phase 2.

---

## Dashboard

Stat cards: Total Schools | Active | Awaiting Onboarding.

Table columns:
- Emblem + Name / Acronym / City
- Principal Name + Email + **pencil icon** (opens credential edit)
- Status badge (Active / Inactive)
- Onboarding badge (Pending / Complete)
- Credentials: masked temp password + reveal toggle + copy button
- Actions: Activate/Deactivate | Edit | Delete

---

## Create School

Single form. Creates school record + principal auth account simultaneously.

### School Identity

| Field | Req | Notes |
|-------|-----|-------|
| School Name | ✅ | CAPS |
| Acronym | ✅ | 2-6 chars |
| Academic Board | ✅ | CBSE / ICSE / IB / IGCSE / State Board / Other |
| State Board Name | — | If Board = State Board |
| Affiliation Number | — | If Board = CBSE or ICSE |
| School Type | ✅ | Public / Private / International / Other |

### Location

| Field | Req | Notes |
|-------|-----|-------|
| Country | ✅ | Default: India (locked) |
| State | ✅ | Indian states + UTs |
| City | ✅ | CAPS |
| Address | ✅ | CAPS |
| Postal Code | ✅ | |
| School Contact Number | — | |
| School Email | — | |
| School Website | — | |

### School Branding

| Field | Req | Notes |
|-------|-----|-------|
| School Emblem | ✅ | PNG/JPG, max 2MB. Stored in `school-assets` bucket. |

### Principal Account

| Field | Req | Notes |
|-------|-----|-------|
| Salutation | ✅ | Mr. / Mrs. / Ms. / Dr. |
| Principal Full Name | ✅ | |
| Principal Email | ✅ | Login ID — manual sharing, no auto email |
| Principal Mobile | ✅ | 10 digits |

### On Submit

1. Slug pre-check → "School name already exists" toast if duplicate
2. Emblem upload → `school-assets` bucket
3. School insert → `onboarding_complete: false`, `status: "active"`
4. Temp password generated → `Sharp` + 6 random chars + `1!`
5. Auth user created → Supabase Admin API, `email_confirm: true`
6. Profile created → `role: "principal"`, `must_change_password: true`
7. School record updated → principal name, email, mobile, temp password
8. Rollback on error → delete auth user + school record

### Errors

| Error | Behavior |
|-------|----------|
| Slug already exists | Pre-check → toast, no DB error |
| Email already in auth | "Principal email already in use" toast |
| Emblem upload fails | Specific error message |
| Profile insert fails | Rollback school + auth user |

---

## Edit School

All fields editable (same form as Create, pre-filled). Emblem optional — skip to keep existing.

---

## Additional Info Form

See ONBOARDING.md. Principal manages Houses, Shifts, Departments via My School post-onboarding.

---

## Edit Principal (pencil icon in table)

### Step 1 — OTP Verify

Dialog: "Verify your identity to change principal credentials"
- Radio: send OTP to **Email** or **Mobile**
- "Send OTP" → triggers OTP
- 6-digit input + "Verify" button
- 5-minute expiry. Re-send after 30 seconds.

### Step 2 — Change (shown after OTP verified)

| Field | OTP needed | Notes |
|-------|-----------|-------|
| Salutation | No | Dropdown |
| Full Name | No | Updates auth metadata + `schools.principal_name` + `profiles.full_name` |
| Email | Verified at Step 1 | Updates auth user + `schools.principal_email` + `profiles.email` |
| Mobile | Verified at Step 1 | Updates auth user + `schools.principal_mobile` + `profiles.mobile` |

Save → auth update → schools update → profiles update → toast "Principal updated."

### Reset Password

Separate button. No OTP. Confirmation: type principal name → new temp password generated → shown in non-dismissible green box. Super Admin copies and shares manually.

---

## Delete School

Calls `delete-school` edge function. Full automatic cleanup — no orphans.

### What gets deleted (automatic)

| Category | Data |
|---------|------|
| Auth users | All users linked to school via profiles.email |
| Profiles | All profiles with school_id |
| School data | classes, sections, students, staffs, subjects, academic_sessions, sessions, departments, calendar_events, wings, etc. |
| Storage | All buckets and files for this school |
| School record | schools table entry |

### Deletion order

1. Auth users (via profile emails)
2. Profiles
3. All school_id tables (in correct child-first order)
4. Storage buckets and objects
5. School record (last)

### Safety

- Requires typing school name to confirm
- Audit log entry created with full cleanup summary

---

## Billing & Subscriptions

Phase 2. Out of scope for MVP.