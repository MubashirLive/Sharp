# My Student

> Updated 2026-06-17. Student app is mobile-only (Phase 2 Flutter). Today, web uses the same Students page for principal/admin.

## Shell
- Bottom nav: Home | Homework | Attendance | Calendar | Profile.
- Top: school white-label (logo + name).
- School auto-detected on subsequent visits.

## Cards
- Today's attendance (Present/Absent/Leave + %).
- Pending homework (count + next due).
- Recent notices / broadcasts.
- Quick actions: open Messenger, view Calendar.

## Flows
- First login: State → City → School selection (saved local) → white-label → credentials → OTP → forced PIN.
- Daily login: school auto-detected, white-label, PIN only. OTP on session expiry or new device.
- Forgot PIN: registered mobile → OTP → new PIN. Mobile changed → "Contact your Admin or Principal".
- Lock: 3 wrong OTP → locked → contact school Admin.

## Account
- One account per enrollment. No separate parent login.
- Login Mobile: editable only by Principal/Master Admin/Admin.
- App ID format: `SHARP-{YEAR}-{6_DIGIT}` (auto-generated at create).
- Status: Active / Inactive.

## Permissions
See [PERMISSION_MATRIX.md](PERMISSION_MATRIX.md) Section MVP 2/3. Student cannot message other students, can only message assigned teacher + designated admin, can only send in teacher-formed groups.

## Phase 2 (Flutter)
Native iOS + Android. Push notifications. Offline cache. Biometric unlock.
