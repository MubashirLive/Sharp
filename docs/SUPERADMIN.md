# SHARP — Super Admin

> Updated 2026-06-17. See [PRD.md](PRD.md) (roles), [ONBOARDING.md](ONBOARDING.md) (wizard).

## Capabilities
Create/edit/delete schools, create Principal IDs, edit principal credentials (OTP-verified), reset principal password, activate/deactivate schools, billing (Phase 2). **Cannot access any school's data or modules.**

Login: `/auth/superadmin` (email + password). 2FA deferred Phase 2.

## Dashboard
Stat cards: Total | Active | Awaiting Onboarding.

Table columns: Emblem+Name/Acronym/City | Principal Name+Email+pencil | Status badge | Onboarding badge | Credentials (masked temp password + reveal + copy) | Actions (Activate/Deactivate | Edit | Delete).

## Create School
Single form. Creates school + principal auth account together.

### School Identity
| Field | Req | Notes |
|---|---|---|
| School Name | ✅ | CAPS |
| Acronym | ✅ | 2-6 chars |
| Academic Board | ✅ | CBSE / ICSE / IB / IGCSE / State / Other |
| State Board Name | — | if State |
| Affiliation Number | — | if CBSE/ICSE |
| School Type | ✅ | Public / Private / International / Other |

### Location
| Field | Req | Notes |
|---|---|---|
| Country | ✅ | India (locked) |
| State | ✅ | Indian states + UTs |
| City | ✅ | CAPS |
| Address | ✅ | CAPS |
| Postal Code | ✅ | |
| School Contact | — | |
| School Email | — | |
| School Website | — | |

### Branding
| Field | Req | Notes |
|---|---|---|
| Emblem | ✅ | PNG/JPG ≤2MB → `school-assets` bucket |

### Principal Account
| Field | Req | Notes |
|---|---|---|
| Salutation | ✅ | Mr/Mrs/Ms/Dr |
| Full Name | ✅ | |
| Email | ✅ | Login ID, manual share |
| Mobile | ✅ | 10 digits |

### Submit
1. Slug pre-check → toast on duplicate.
2. Emblem upload.
3. School insert `onboarding_complete: false, status: "active"`.
4. Temp password = `Sharp` + 6 random + `1!`.
5. Auth user via Admin API `email_confirm: true`.
6. Profile `role: "principal", must_change_password: true`.
7. Update school with principal name/email/mobile/temp password.
8. Rollback on error.

### Errors
| Error | Behavior |
|---|---|
| Slug duplicate | pre-check toast |
| Email in auth | "Principal email already in use" toast |
| Emblem upload fail | specific message |
| Profile insert fail | rollback school + auth |

## Edit School
All fields editable (same form, pre-filled). Emblem optional.

## Additional Info
See [ONBOARDING.md](ONBOARDING.md). Principal manages Houses, Shifts, Departments via My School post-onboarding.

## Edit Principal (pencil)
### Step 1 — OTP Verify
"Verify your identity to change principal credentials". Radio: Email or Mobile. Send OTP → 6-digit input + Verify. 5-min expiry. Re-send after 30s.

### Step 2 — Change
| Field | OTP needed |
|---|---|
| Salutation | No |
| Full Name | No (auth meta + `schools.principal_name` + `profiles.full_name`) |
| Email | Yes (auth + `schools.principal_email` + `profiles.email`) |
| Mobile | Yes (auth + `schools.principal_mobile` + `profiles.mobile`) |

Save → auth update → schools update → profiles update → toast.

## Reset Password
No OTP. Confirm: type principal name → new temp password → non-dismissible green box. Super Admin copies manually.

## Delete School
`delete-school` edge function. Full automatic cleanup.

Deletes: auth users (via profile emails) → profiles → all school_id tables (child-first) → storage buckets/objects → school record.

Safety: type school name to confirm. Audit log entry with summary.

## Billing
Phase 2. Out of scope MVP.

## Edge functions (super admin)
- `superadmin-create-school`, `superadmin-list-schools`, `superadmin-update-school`
- `superadmin-toggle-school-status`, `superadmin-update-principal`
- `superadmin-reset-principal-password`, `superadmin-verify-principal-otp`
- `create-school` (legacy), `delete-school` (legacy v2)
