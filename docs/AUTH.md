# SHARP — Authentication & Authorization Specification
> **Unified spec for all login, signup, password recovery, session management, and role resolution flows.**
> **Replaces scattered auth info in:** PRD.md §1, SCREEN_FLOW_MAP.md Flows 2A-4B, SUPERADMIN.md
> **Version:** 1.0 | **Date:** 2026-05-16 | **Status:** Ready for Implementation

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Role System Reference](#2-role-system-reference)
3. [Identity & Account Lifecycle](#3-identity--account-lifecycle)
4. [Login Flows](#4-login-flows)
   - 4.1 Super Admin Login
   - 4.2 Principal Login
   - 4.3 Staff Login (Master Admin / Admin / Teacher / Non-Teaching)
   - 4.4 Student Login
5. [First-Time Login Setup](#5-first-time-login-setup)
   - 5.1 Principal: Forced Password Change
   - 5.2 Principal: Forced PIN Setup
   - 5.3 Staff: OTP Verification & PIN Setup
   - 5.4 Student: OTP Verification & PIN Setup
6. [Daily Authentication](#6-daily-authentication)
   - 6.1 Principal: Password or PIN
   - 6.2 Staff: Mobile/ID → Profile → PIN
   - 6.3 Student: Mobile/ID → Profile → PIN
7. [Session Management](#7-session-management)
8. [Forgot Password / PIN Recovery](#8-forgot-password--pin-recovery)
   - 8.1 Principal Recovery (Dual OTP)
   - 8.2 Staff Recovery (Mobile OTP)
   - 8.3 Student Recovery (Mobile OTP)
9. [Reset Password / PIN (Admin-Initiated)](#9-reset-password--pin-admin-initiated)
10. [Account Lockout & Security](#10-account-lockout--security)
11. [School Selection & White-Labeling](#11-school-selection--white-labeling)
12. [Data Model Overview](#12-data-model-overview)
13. [UI Specifications](#13-ui-specifications)
14. [Error States & Edge Cases](#14-error-states--edge-cases)
15. [Implementation Checklist](#15-implementation-checklist)
16. [Security Recommendations](#16-security-recommendations)

---

## 1. Architecture Overview

### 1.1 Core Principles

| Principle | Rule |
|---|---|
| **No self sign-up** | All accounts created by authorised roles only |
| **Role determines UI** | No role dropdown on login; role resolved server-side from `profiles.role` |
| **School isolation** | `school_id` on every data table; RLS enforces at DB level |
| **Principal = password + PIN** | Principal uses password for auth, PIN for quick login on trusted devices |
| **Staff/Student = PIN-only** | All staff and students use PIN for daily login; no passwords |
| **OTP for verification** | Mobile OTP for first-time setup, recovery, and new device verification |
| **Forced setup** | First login requires setup steps; cannot be skipped |

### 1.2 Auth Methods by Role

| Role | First Login | Daily Login | Recovery | Platform |
|---|---|---|---|---|
| **Super Admin** | Email + password | Email + password | Super Admin panel reset | Web only + Mobile |
| **Principal** | School select → Email + temp password → **forced password change** → **forced PIN setup** | Password **or** PIN (device-dependent) | **Dual OTP** (email + mobile) → new password + new PIN | Web + Mobile |
| **Master Admin** | School select → Mobile/Staff ID → OTP → PIN | Mobile/Staff ID → profile → PIN | Mobile OTP → new PIN | Web + Mobile |
| **Admin** | School select → Mobile/Staff ID → OTP → PIN | Mobile/Staff ID → profile → PIN | Mobile OTP → new PIN | Mobile + Web |
| **Teacher** | School select → Mobile/Staff ID → OTP → PIN | Mobile/Staff ID → profile → PIN | Mobile OTP → new PIN | Mobile + Web |
| **Non-Teaching** | School select → Mobile/Staff ID → OTP → PIN | Mobile/Staff ID → profile → PIN | Mobile OTP → new PIN | Mobile + Web |
| **Student** | School select → Mobile/Student ID → OTP → PIN | Mobile/Student ID → profile → PIN | Mobile OTP → new PIN | Mobile + Web  only |

**Note:** School Selection is a **one-time process** on first login. The selected school is stored locally and auto-detected on subsequent visits.
Mobile + Web (Mobile priority)
Web + Mobile (Web priority) 

### 1.3 Account Creation Handoff

```
Super Admin creates Principal 
  → Principal creates Master Admin / Admin / Staff / Students
    → Master Admin creates Admin / Staff / Students
```

**No account is ever created by the user themselves.** The creator role sets:
- Temporary credentials (email + temp password for Principal; mobile for Staff/Student)
- Login mobile number (for OTP delivery)
- Initial account status: `active`

---

## 2. Role System Reference

> **For the complete role system specification, dual-role bug fix, and migration guide, see `BUGS.md`.**
> 
> This document assumes `profiles.role` is the single source of truth for role resolution.

### 2.1 Role Hierarchy

```
super_admin (platform-level, no school access)
  └── principal (full school access)
        └── master_admin (full school access except billing)
              ├── admin (configurable permissions)
              ├── teacher (own class/subject only)
              └── student (mobile-only, own data only)
```

### 2.2 Role Resolution

Role is determined server-side from `profiles.role` at login time. No role selection UI is presented to the user.
Three different Login gateway : Principal, Staff(Master Admin, Admin, Teacher etc) and Student.

---

## 3. Identity & Account Lifecycle

### 3.1 Account States

These states apply to **all roles except Super Admin**. Super Admin has a simple `active` / `inactive` state managed internally.

| State | Description | Transitions |
|---|---|---|
| `created` | Account created by authorized role, credentials set | → `first_login` on first authentication |
| `first_login` | User authenticated, setup not yet complete | → `active` after all forced setup steps |
| `active` | Normal operating state | → `inactive` (admin action) / → `locked` (security) |
| `inactive` | Account disabled by admin, cannot login | → `active` (admin action) |
| `locked` | 5 failed PIN/OTP attempts, auto-locked | → `active` after admin unlock or 24hr auto-unlock |

### 3.2 State Machine Diagram

```
                    ┌─────────────┐
         ┌──────────│   created   │◄────────┐
         │          └──────┬──────┘         │ admin creates
         │                 │ first auth     │
         │                 ▼                │
         │          ┌─────────────┐         │
         │     ┌────│ first_login │────┐    │
         │     │    └──────┬──────┘    │    │
         │     │           │ setup     │    │
         │     │           ▼           │    │
         │     │      ┌─────────┐      │    │
    admin│     └─────►│ active  │◄─────┘    │
   action│            └───┬─┬───┘           │
         │                │ │               │
         │    ┌───────────┘ └───────────┐   │
         │    │ 5 failed attempts       │ admin action
         │    ▼                         ▼   │
         │ ┌────────┐             ┌────────┐│
         └►│ locked │────────────►│inactive│┘
           └────────┘ 24hr or     └────────┘
                      admin unlock
```

---

## 4. Login Flows

### 4.1 Super Admin Login

**Route:** `/auth/superadmin`

**Flow:**
```
[S] SuperAdminLoginPage
├── Header: "SHARP Super Admin" (SHARP branding, no school context)
├── [A] Email input
├── [A] Password input
├── [A] "Sign In" button
├── [C] Invalid credentials? → Inline error: "Invalid email or password"
└── [→] Super Admin Dashboard (on success)
```

**Rules:**
- No school selection (Super Admin is tenant-agnostic)
- No PIN system (password-only)
- No OTP system (password-only)
- 2FA deferred to Phase 2

---

### 4.2 Principal Login

**Route:** `/auth/principal`

**First-Time Flow:**
```
[S] PrincipalLoginPage
├── [C] First visit? → [S] SchoolSelection (one-time)
│   ├── [A] State dropdown
│   ├── [A] City dropdown
│   ├── [A] School dropdown (logo + name)
│   └── [→] PrincipalLoginForm
├── [C] Returning? → school auto-detected from localStorage
│   └── [C] Trusted device + saved principal user? → [S] PrincipalQuickLoginPage
│   │   ├── Header: School logo + name (white-label)
│   │   ├── [S] PrincipalProfileCard (pre-filled from localStorage)
│   │   │   ├── Principal Name
│   │   │   └── Email (masked: pri***@school.com)
│   │   ├── [A] 6-digit PIN input (numeric keypad)
│   │   ├── [C] Wrong PIN? → "Incorrect PIN. X attempts remaining." (warning)
│   │   ├── [C] 4 failed PIN attempts? → "1 attempt remaining" (warning)
│   │   ├── [C] 5 failed PIN attempts? → [→] AccountLockedPage
│   │   ├── [A] "Use password instead" → switches to password input (untrusted flow)
│   │   ├── [A] "Forgot PIN?" → [→] PrincipalRecovery
│   │   ├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] PrincipalLoginForm
│   │   └── [→] Principal Dashboard (on correct PIN)
│   └── [C] No saved user / session expired / new device? → [S] PrincipalLoginForm
│       ├── Header: School logo + name (white-label)
│       ├── [A] Email input
│       ├── [A] Password input
│       ├── [A] "Sign In" button
│       ├── [C] First login + temp password? → [→] ForcedPasswordChange
│       ├── [C] First login + must_change_pin? → [→] ForcedPasswordChange
│       ├── [C] New device? → [→] OTPVerify (email + mobile) → [→] TrustDevicePrompt → [→] PINEntry
│       ├── [C] Correct password + trusted device? → [→] PINEntry
│       └── [A] "Forgot password?" → [→] PrincipalRecovery
```

**Daily Login Flow (Trusted Device + Known User):**
```
[S] PrincipalQuickLoginPage
├── Header: School logo + name
├── [S] PrincipalProfileCard (pre-filled from localStorage)
│   ├── Principal Name
│   └── Email (masked: pri***@school.com)
├── [A] 6-digit PIN input (numeric keypad)
├── [A] "Use password instead" → switches to password input (untrusted flow)
├── [C] Wrong PIN? → "Incorrect PIN. X attempts remaining." (warning)
├── [C] 4 failed PIN attempts? → "1 attempt remaining" (warning)
├── [C] 5 failed PIN attempts? → [→] AccountLockedPage
├── [A] "Forgot PIN?" → [→] PrincipalRecovery
├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] PrincipalLoginForm
└── [→] Principal Dashboard (on correct PIN)
```

**Daily Login Flow (New Device / Untrusted / No Saved User):**
```
[S] PrincipalLoginPage (password required)
├── [A] Email input
├── [A] Password input
├── [A] "Sign In" button
├── [C] Correct password? → [→] OTPVerify (dual OTP: email + mobile)
│   ├── [A] Enter email OTP
│   ├── [A] Enter mobile OTP
│   ├── [C] Both OTPs correct? → [→] TrustDevicePrompt
│   │   ├── [A] "Trust this device?" → saves device fingerprint + last_user_id → [→] PINEntry
│   │   └── [A] "Don't trust" → [→] PINEntry (prompts password next time)
│   └── [C] Wrong OTP? → "Invalid OTP. X attempts remaining."
└── [C] Wrong password? → "Invalid email or password"
```

---

### 4.3 Staff Login (Master Admin / Admin / Teacher / Non-Teaching)

**Route:** `/auth/staff`

**Unified flow for ALL staff roles.** No distinction between Master Admin, Admin, Teacher, or Non-Teaching at login. Role is resolved after authentication.

**First-Time Flow:**
```
[S] StaffLoginPage
├── [C] First visit? → [S] SchoolSelection (one-time)
│   ├── [A] State dropdown
│   ├── [A] City dropdown
│   ├── [A] School dropdown (logo + name)
│   └── [→] StaffLoginForm
├── [C] Returning? → school auto-detected from localStorage
│   └── [C] Trusted device + saved staff user? → [S] StaffQuickLoginPage
│   │   ├── Header: School logo + name
│   │   ├── [S] StaffProfileCard (pre-filled from localStorage)
│   │   │   ├── Staff Photo (DP from My Staff)
│   │   │   ├── Staff Name
│   │   │   ├── Staff App ID
│   │   │   └── Messenger Tag (from Role Manager)
│   │   ├── [A] 6-digit PIN input (numeric keypad)
│   │   ├── [C] Wrong PIN? → "Incorrect PIN. X attempts remaining." (warning)
│   │   ├── [C] 4 failed PIN attempts? → "1 attempt remaining" (warning)
│   │   ├── [C] 5 failed PIN attempts? → [→] AccountLockedPage
│   │   ├── [A] "Forgot PIN?" → [→] StaffRecovery
│   │   ├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] StaffLoginForm
│   │   └── [→] Dashboard (on correct PIN)
│   └── [C] No saved user / new device / session expired? → [S] StaffLoginForm
│       ├── Header: School logo + name
│       ├── [A] Input: Mobile number OR Staff App ID (toggle switch)
│       ├── [C] Mobile entered? → validate against Login Mobile field from Staff Form
│       ├── [C] Staff App ID entered? → validate against Staff App ID
│       ├── [C] Invalid mobile (not Login Mobile)? → "Wrong number"
│       ├── [C] Invalid Staff App ID? → "ID does not exist"
│       ├── [C] Valid identifier? → [S] StaffProfileCard (auto-displayed)
│       │   ├── Staff Photo (DP from My Staff)
│       │   ├── Staff Name
│       │   ├── Staff App ID
│       │   └── Messenger Tag (from Role Manager)
│       ├── [C] First login? → [→] OTPVerify → [→] ForcedPINSetup
│       ├── [C] Returning + new device? → [→] OTPVerify → [A] PIN input → [→] Dashboard
│       ├── [A] "Forgot PIN?" → [→] StaffRecovery
│       └── [C] Wrong PIN 5x? → [→] AccountLockedPage
```

**Staff Profile Card (shown after valid identifier entry OR pre-filled on trusted device):**
```
┌─────────────────────────────────────┐
│                                     │
│  ┌────┐  Rajesh Kumar              │
│  │ DP │  STF20260001              │
│  │    │  PGT Mathematics           │  ← Messenger Tag
│  └────┘                             │
│                                     │
│  ● ● ● ○ ○ ○                       │  ← PIN dots
│                                     │
│  [Forgot PIN?]  [Not you?]          │
│                                     │
└─────────────────────────────────────┘
```

**Daily Login Flow (Trusted Device + Known User):**
```
[S] StaffQuickLoginPage
├── Header: School logo + name
├── [S] StaffProfileCard (pre-filled from localStorage)
│   ├── Photo + Name + Staff App ID + Messenger Tag
│   └── [A] 6-digit PIN input (numeric keypad)
├── [C] Correct PIN? → [→] Dashboard
├── [C] Wrong PIN (1-4)? → Warning: "X attempts remaining"
├── [C] Wrong PIN (5)? → [→] AccountLockedPage
├── [A] "Forgot PIN?" → [→] StaffRecovery
├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] StaffLoginForm
└── [C] New device? → [→] OTPVerify before PIN
```

**Rules:**
- Only **Login Mobile** (from Staff Form) is accepted for mobile login
- Personal mobile or other numbers → "Wrong number" (not "ID does not exist")
- Staff App ID is always accepted as alternative login identifier
- Profile card auto-displays on valid identifier entry (before PIN)
- On trusted devices, identifier is pre-filled from `localStorage.last_user_id` — user enters PIN only
- "Not you? Sign in as different user" clears `last_user_id` and shows identifier input (for shared PCs)
- No password system for staff (PIN-only)

---

### 4.4 Student Login

**Route:** `/auth/student` (mobile-only)

**First-Time Flow:**
```
[S] StudentLoginPage
├── [C] First visit? → [S] SchoolSelection (one-time)
│   ├── [A] State dropdown
│   ├── [A] City dropdown
│   ├── [A] School dropdown (logo + name)
│   └── [→] StudentLoginForm
├── [C] Returning? → school auto-detected from localStorage
│   └── [C] Trusted device + saved student user? → [S] StudentQuickLoginPage
│   │   ├── Header: School logo + name
│   │   ├── [S] StudentProfileCard (pre-filled from localStorage)
│   │   │   ├── Student Photo (from Student Form)
│   │   │   ├── Student Name
│   │   │   ├── Student App ID
│   │   │   └── Class & Section
│   │   ├── [A] 6-digit PIN input (numeric keypad)
│   │   ├── [C] Wrong PIN? → "Incorrect PIN. X attempts remaining." (warning)
│   │   ├── [C] 4 failed PIN attempts? → "1 attempt remaining" (warning)
│   │   ├── [C] 5 failed PIN attempts? → [→] AccountLockedPage
│   │   ├── [A] "Forgot PIN?" → [→] StudentRecovery
│   │   ├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] StudentLoginForm
│   │   └── [→] Dashboard (on correct PIN)
│   └── [C] No saved user / new device / session expired? → [S] StudentLoginForm
│       ├── Header: School logo + name
│       ├── [A] Input: Mobile number OR Student App ID (toggle)
│       ├── [C] Valid identifier? → [S] StudentProfileCard
│       │   ├── Student Photo (from Student Form)
│       │   ├── Student Name
│       │   ├── Student App ID
│       │   └── Class & Section
│       ├── [C] First login? → [→] OTPVerify → [→] ForcedPINSetup
│       ├── [C] Returning + new device? → [→] OTPVerify → [A] PIN input → [→] Dashboard
│       ├── [A] "Forgot PIN?" → [→] StudentRecovery
│       └── [C] Wrong PIN 5x? → [→] AccountLockedPage
```

**Student Profile Card (shown after valid identifier entry OR pre-filled on trusted device):**
```
┌─────────────────────────────────────┐
│                                     │
│  ┌────┐  Arjun Kumar               │
│  │ DP │  SCH20260001              │
│  │    │  Class 9-A                 │
│  └────┘                             │
│                                     │
│  ● ● ● ○ ○ ○                       │
│                                     │
│  [Forgot PIN?]  [Not you?]          │
│                                     │
└─────────────────────────────────────┘
```

**Daily Login Flow (Trusted Device + Known User):**
```
[S] StudentQuickLoginPage
├── Header: School logo + name
├── [S] StudentProfileCard (pre-filled from localStorage)
│   ├── Photo + Name + Student App ID + Class-Section
│   └── [A] 6-digit PIN input (numeric keypad)
├── [C] Correct PIN? → [→] Dashboard
├── [C] Wrong PIN (1-4)? → Warning: "X attempts remaining"
├── [C] Wrong PIN (5)? → [→] AccountLockedPage
├── [A] "Forgot PIN?" → [→] StudentRecovery
├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] StudentLoginForm
└── [C] New device? → [→] OTPVerify before PIN
```

**Rules:**
- Login Mobile from Student Form Stage 1D is the valid mobile number
- Student App ID is alternative login identifier
- On trusted devices, identifier is pre-filled from `localStorage.last_user_id` — user enters PIN only
- "Not you? Sign in as different user" clears `last_user_id` and shows identifier input (for shared devices)
- No password system (PIN-only, same as Staff)

---

## 5. First-Time Login Setup

### 5.1 Principal: Forced Password Change

**Trigger:** First login with temporary password provided by Super Admin.

**Flow:**
```
[S] ForcedPasswordChangePage (full-screen, cannot dismiss)
├── Header: "Set Your Password"
├── Progress: Step 1 of 2
├── [A] Current password (pre-filled with temp password, editable)
├── [A] New password
│   └── Validation: min 8 chars, 1 uppercase, 1 lowercase, 1 number
├── [A] Confirm new password
├── [C] Passwords match? → "Set Password" button enabled
├── [C] Passwords differ? → "Passwords do not match"
├── [C] Weak password? → "Password is too weak"
├── [A] "Set Password" → updates auth password → [→] ForcedPINSetup
└── [!] Cannot skip — no "Cancel" or "Back" button
```

**Password Rules:**
| Rule | Value | Error Message |
|---|---|---|
| Minimum length | 8 characters | "Password must be at least 8 characters" |
| Uppercase | At least 1 | "Password must contain an uppercase letter" |
| Lowercase | At least 1 | "Password must contain a lowercase letter" |
| Number | At least 1 | "Password must contain a number" |
| Common passwords | Block 12345678, password, qwerty | "This password is too common" |

---

### 5.2 Principal: Forced PIN Setup

**Trigger:** After forced password change, or first login where `must_change_pin = true`.

**Flow:**
```
[S] ForcedPINSetupPage (full-screen, cannot dismiss)
├── Header: "Secure Your Account"
├── Progress: Step 2 of 2
├── [A] Enter 6-digit PIN (numeric keypad, hidden input)
├── [A] Re-enter 6-digit PIN (confirmation)
├── [C] PINs match? → "Set PIN" button enabled
├── [C] PINs differ? → "PINs do not match"
├── [C] Weak PIN? → "Choose a stronger PIN"
├── [A] "Set PIN" → hash and store → set must_change_pin = false
│   └── [→] Principal Dashboard (or Onboarding if incomplete)
└── [!] Cannot skip
```

**PIN Validation Rules:**
| Rule | Value | Error Message |
|---|---|---|
| Length | Exactly 6 digits | "PIN must be 6 digits" |
| Format | Numeric only (0-9) | "PIN must contain only numbers" |
| Weak PINs blocked | 123456, 111111, 000000, 654321, 121212 | "This PIN is too common" |
| No sequential | 123456, 654321 | Same as above |
| No repeating | 111111, 222222 | Same as above |

---

### 5.3 Staff: OTP Verification & PIN Setup

**Trigger:** First login with mobile/Staff App ID.

**Flow:**
```
[S] StaffLoginPage
├── [A] Mobile number OR Staff App ID
├── [C] Valid identifier? → [S] StaffProfileCard
│   ├── Photo + Name + Staff App ID + Messenger Tag
│   └── [A] "Send OTP" button
├── [C] OTP sent? → [S] OTPInput
│   ├── 6-digit boxes, auto-focus, auto-advance
│   ├── "Resend in 00:30" countdown
│   └── [A] "Verify OTP" button
├── [C] OTP verified? → [→] ForcedPINSetup
│   └── Same PIN setup as Principal (§5.2)
├── [C] Wrong OTP? → "Invalid or expired OTP"
└── [C] OTP expired? → "OTP expired. Request a new one."
```

---

### 5.4 Student: OTP Verification & PIN Setup

**Trigger:** First login with mobile/Student App ID.

**Flow:** Identical to Staff (§5.3) but with Student Profile Card.

```
[S] StudentLoginPage
├── [A] Mobile number OR Student App ID
├── [C] Valid identifier? → [S] StudentProfileCard
│   ├── Photo + Name + Student App ID + Class-Section
│   └── [A] "Send OTP" button
├── [C] OTP sent? → [S] OTPInput
├── [C] OTP verified? → [→] ForcedPINSetup
└── [C] Wrong OTP? → "Invalid or expired OTP"
```

---

## 6. Daily Authentication

### 6.1 Principal: Password or PIN

**Trusted Device + Known User:**
```
[S] PrincipalQuickLoginPage
├── Header: School logo + name
├── [S] PrincipalProfileCard (pre-filled from localStorage)
│   ├── Principal Name
│   └── Email (masked: pri***@school.com)
├── [A] 6-digit PIN input (numeric keypad)
├── [A] "Use password instead" → switches to password input (untrusted flow)
├── [C] Wrong PIN? → Shake + "Incorrect PIN. X attempts remaining."
├── [C] 4 failed? → "1 attempt remaining"
├── [C] 5 failed? → [→] AccountLockedPage
├── [A] "Forgot PIN?" → [→] PrincipalRecovery
├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] PrincipalLoginForm
└── [→] Dashboard on correct PIN
```

**Untrusted / New Device / No Saved User:**
```
Principal enters email + password → Dual OTP verify → Trust device prompt → PIN → Dashboard
```

---

### 6.2 Staff: PIN Only on Trusted Device

**Trusted Device + Known User:**
```
[S] StaffQuickLogin
├── Header: School logo + name
├── [S] StaffProfileCard (pre-filled from localStorage)
│   ├── Photo + Name + Staff App ID + Messenger Tag
│   └── [A] 6-digit PIN input (numeric keypad)
├── [C] Correct PIN? → [→] Dashboard
├── [C] Wrong PIN (1-4)? → Warning: "X attempts remaining"
├── [C] Wrong PIN (5)? → [→] AccountLockedPage
├── [A] "Forgot PIN?" → [→] StaffRecovery
├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] StaffLoginForm
└── [C] New device? → [→] OTPVerify before PIN
```

**New Device / No Saved User / "Not you?" clicked:**
```
[S] StaffLoginForm
├── [A] Mobile number OR Staff App ID (toggle)
├── [C] Valid identifier? → [S] StaffProfileCard (auto-display)
│   ├── Photo + Name + Staff App ID + Messenger Tag
│   └── [A] 6-digit PIN input (numeric keypad)
├── [C] Correct PIN? → [→] Dashboard
└── [C] New device? → [→] OTPVerify before PIN
```

---

### 6.3 Student: PIN Only on Trusted Device

**Trusted Device + Known User:**
```
[S] StudentQuickLogin
├── Header: School logo + name
├── [S] StudentProfileCard (pre-filled from localStorage)
│   ├── Photo + Name + Student App ID + Class-Section
│   └── [A] 6-digit PIN input (numeric keypad)
├── [C] Correct PIN? → [→] Dashboard
├── [C] Wrong PIN (1-4)? → Warning: "X attempts remaining"
├── [C] Wrong PIN (5)? → [→] AccountLockedPage
├── [A] "Forgot PIN?" → [→] StudentRecovery
├── [A] "Not you? Sign in as different user" → clears last_user_id → [→] StudentLoginForm
└── [C] New device? → [→] OTPVerify before PIN
```

**New Device / No Saved User / "Not you?" clicked:**
```
[S] StudentLoginForm
├── [A] Mobile number OR Student App ID (toggle)
├── [C] Valid identifier? → [S] StudentProfileCard (auto-display)
│   ├── Photo + Name + Student App ID + Class-Section
│   └── [A] 6-digit PIN input (numeric keypad)
├── [C] Correct PIN? → [→] Dashboard
└── [C] New device? → [→] OTPVerify before PIN
```

---

## 7. Session Management

### 7.1 Session Lifecycle

| Event | Behavior |
|---|---|
| **Initial login** | Supabase JWT session created (persistent) |
| **Daily PIN entry** | `sessionStorage.setItem('pin_verified', 'true')` — survives refresh, lost on tab close |
| **Tab/browser close** | PIN must be re-entered (sessionStorage cleared) |
| **New device** | Device fingerprint mismatch → OTP verification required |
| **Explicit logout** | `supabase.auth.signOut()` + clear all storage |

### 7.2 Device Trust Model

| Device State | Principal | Staff | Student |
|---|---|---|---|
| **Trusted + Known User** (fingerprint matches + last_user_id exists) | PIN only (pre-filled email) | PIN only (pre-filled ID) | PIN only (pre-filled ID) |
| **Trusted + No User** (fingerprint matches, no last_user_id) | Password entry | Mobile/ID input → PIN | Mobile/ID input → PIN |
| **Untrusted** (new fingerprint) | Password + dual OTP + PIN | OTP + PIN | OTP + PIN |
| **First ever login** | Temp password → password change → PIN | OTP → PIN setup | OTP → PIN setup |

**Shared PC Behavior:**
- When "Not you? Sign in as different user" is clicked:
  - `localStorage.last_user_id` is cleared
  - `localStorage.last_role` is cleared
  - Device fingerprint is **NOT** cleared (device remains trusted)
  - User sees identifier input form (email / mobile / ID)

### 7.3 Storage Strategy

| Layer | Data | Lifetime |
|---|---|---|
| `localStorage` | school_id, school_name, logo_url, role, last_user_id, last_role, last_user_name, last_user_photo | Until cleared |
| `sessionStorage` | pin_verified, device_fingerprint | Tab lifetime |
| Supabase (cookie) | JWT auth session, refresh token | Persistent |
| Database | pin_hash, last_login_at, status, device_fingerprint | Persistent |

**Quick Login Pre-fill Data (localStorage):**

| Key | Stored For | Example Value |
|---|---|---|
| `last_user_id` | All roles | `user_uuid` or `STF20260001` |
| `last_role` | All roles | `principal`, `teacher`, `student` |
| `last_user_name` | All roles | `Rajesh Kumar` |
| `last_user_photo` | Staff, Student | `https://cdn.sharp.in/dp/abc.jpg` |
| `last_user_email` | Principal | `principal@school.com` |
| `last_user_messenger_tag` | Staff | `PGT Mathematics` |
| `last_user_class_section` | Student | `Class 9-A` |

**Note:** `last_user_id` and related pre-fill data are **per-device** and **per-browser**. Clicking "Not you? Sign in as different user" clears these keys but preserves `device_fingerprint` and school branding.

---

## 8. Forgot Password / PIN Recovery

### 8.1 Principal Recovery (Dual OTP)

**Trigger:** "Forgot password?" or "Forgot PIN?" from Principal login.

**Security Level:** High — Principal has full school access. Dual OTP required.

**Flow:**
```
[S] PrincipalRecoveryPage
├── Header: "Recover Your Account"
├── [A] Email input (pre-filled, editable)
├── [A] "Send OTP to Email" → sends 6-digit OTP to email
├── [A] "Send OTP to Mobile" → sends 6-digit OTP to registered mobile
├── [C] Both OTPs sent? → [S] DualOTPInput
│   ├── [A] Email OTP (6-digit boxes)
│   ├── [A] Mobile OTP (6-digit boxes)
│   ├── [C] Both correct? → [→] NewPasswordSetup
│   │   ├── [A] New password (8+ chars, complexity rules)
│   │   ├── [A] Confirm password
│   │   └── [A] "Set Password" → [→] NewPINSetup
│   │       ├── [A] New 6-digit PIN
│   │       ├── [A] Confirm PIN
│   │       └── [A] "Set PIN" → [→] Principal Dashboard
│   └── [C] Wrong OTP? → "Invalid OTP. X attempts remaining."
├── [C] 5 failed OTP attempts? → [→] AccountLockedPage
└── [C] Mobile changed? → "Contact SHARP Support" (no self-service)
```

**Dual OTP Rules:**
| Rule | Value |
|---|---|
| Email OTP expiry | 5 minutes |
| Mobile OTP expiry | 5 minutes |
| Resend delay | 30 seconds per channel |
| Max attempts | 5 total (combined across both OTPs) |
| Lockout | 24 hours after 5 failed attempts |

**Why Dual OTP?**
- Principal has highest privilege (full school access, can create/delete accounts)
- Single-factor recovery (email OR mobile) is insufficient for this role
- Compromised email or mobile alone cannot reset Principal credentials
- Aligns with security best practices for high-privilege accounts

---

### 8.2 Staff Recovery (Mobile OTP)

**Trigger:** "Forgot PIN?" from Staff login.

**Flow:**
```
[S] StaffRecoveryPage
├── Header: "Reset Your PIN"
├── [A] Registered mobile input (pre-filled, masked: 98*****210)
├── [A] "Send OTP" button
├── [C] OTP sent? → [S] OTPInput
│   ├── 6-digit boxes, auto-focus
│   ├── "Resend in 00:30"
│   └── [A] "Verify OTP"
├── [C] OTP verified? → [→] NewPINSetup
│   ├── [A] New 6-digit PIN
│   ├── [A] Confirm PIN
│   └── [A] "Set PIN" → [→] Dashboard
├── [C] Wrong OTP? → "Invalid or expired OTP"
└── [C] Mobile changed? → "Contact your Principal or Admin"
```

**Rules:**
- OTP sent to **Login Mobile** only (from Staff Form)
- 5-minute expiry, 30-second resend delay
- 5 failed attempts → 24-hour lockout
- No email OTP for staff (mobile-only recovery)

---

### 8.3 Student Recovery (Mobile OTP)

**Trigger:** "Forgot PIN?" from Student login.

**Flow:** Identical to Staff (§8.2) but with Student Profile context.

```
[S] StudentRecoveryPage
├── Header: "Reset Your PIN"
├── [A] Registered mobile input (pre-filled, masked)
├── [A] "Send OTP" button
├── [C] OTP sent? → [S] OTPInput
├── [C] OTP verified? → [→] NewPINSetup
└── [C] Mobile changed? → "Contact your school Admin"
```

---

## 9. Reset Password / PIN (Admin-Initiated)

### 9.1 Principal-Initiated Staff/Student PIN Reset

**Who can reset:** Principal and Master Admin only

**Flow:**
```
[S] StaffManagementPage / StudentManagementPage
├── [A] Select staff/student → "Reset PIN" action
├── [S] ConfirmDialog
│   ├── "Reset PIN for [Name]?"
│   ├── "They don't need to verify via OTP to set a new PIN."
│   └── [A] "Reset" → sets must_change_pin = true, clears pin_hash
└── User receives notification: "Your PIN has been reset. Use OTP to set a new PIN."
```

### 9.2 Super Admin-Initiated Principal Password Reset

**Who can reset:** Super Admin only

**Flow:**
```
[S] SuperAdminDashboard → Schools List
├── [A] Click school row → "Reset Principal Credentials"
├── [S] ConfirmDialog
│   ├── "Reset credentials for Principal [Name]?"
│   ├── "A new temporary password will be generated."
│   └── [A] "Reset" → generates temp password → displays once
├── [S] TempPasswordDisplay (non-dismissible)
│   ├── New temp password: SharpA7k9mP1!
│   ├── [A] "Copy password" button
│   └── [A] "I have copied the password" → closes
└── Principal receives email + SMS notification
```

**Temp Password Format:** `Sharp` + 6 random alphanumeric + `1!`

---

## 10. Account Lockout & Security

### 10.1 Lockout Rules

| Scenario | Threshold | Warning | Action | Recovery |
|---|---|---|---|---|
| Wrong PIN (Staff/Student) | 1-4 attempts | "X attempts remaining" | None | N/A |
| Wrong PIN (Staff/Student) | 5 attempts | "Account locked" | [→] AccountLockedPage | Admin unlock or 24hr auto-unlock |
| Wrong PIN (Principal) | 1-4 attempts | "X attempts remaining" | None | N/A |
| Wrong PIN (Principal) | 5 attempts | "Account locked" | [→] AccountLockedPage | Super Admin unlock or 24hr auto-unlock |
| Wrong OTP | 1-4 attempts | "X attempts remaining" | None | N/A |
| Wrong OTP | 5 attempts | "Account locked" | [→] AccountLockedPage | Admin unlock or 24hr auto-unlock |
| Wrong password (Principal) | 1-4 attempts | "X attempts remaining" | None | N/A |
| Wrong password (Principal) | 5 attempts | "Account locked" | [→] AccountLockedPage | Super Admin unlock or 24hr auto-unlock |
| New device without OTP | 1 | "New device detected" | Blocked until OTP verified | Complete OTP flow |

### 10.2 Lockout UI

```
[S] AccountLockedPage
├── Icon: Lock
├── Title: "Account Temporarily Locked"
├── Message: "Too many failed attempts. This account is locked for 24 hours for security."
├── [C] Staff/Student? → "Contact your Principal or Admin for immediate unlock."
├── [C] Principal? → "Contact SHARP Support for immediate unlock."
├── [A] "Back to Login" → clears session, redirects to login
└── Countdown: "Auto-unlock in 23:59:59" 
```

### 10.3 Rate Limiting

| Endpoint | Limit | Window |
|---|---|---|
| Login attempts (per IP) | 5 | 1 minute |
| OTP requests (per mobile) | 3 | 10 minutes |
| PIN verification (per user) | 5 | 1 minute |
| Password attempts (per user) | 5 | 1 minute |

---

## 11. School Selection & White-Labeling

### 11.1 School Selection Flow

```
[S] SchoolSelectionPage (first visit only)
├── Header: "Select Your School"
├── [A] State dropdown
│   └── Source: SELECT DISTINCT state FROM schools WHERE status = 'active' ORDER BY state ASC
│   └── Only states with ≥1 onboarded active school shown
├── [C] State selected? → [A] City dropdown
│   └── Source: SELECT DISTINCT city FROM schools WHERE state = $1 AND status = 'active' ORDER BY city ASC
│   └── Only cities in selected state with ≥1 onboarded active school shown
├── [C] City selected? → [A] School dropdown
│   └── Source: SELECT * FROM schools WHERE state = $1 AND city = $2 AND status = 'active' ORDER BY name ASC
│   └── Each school: Logo thumbnail + School name + City
├── [A] School selected? → [A] "Continue" button
├── [A] "Continue" → saves to localStorage → [→] LoginForm
└── [C] School not found? → "No schools found in [City]."
```

**Dropdown Rules:**
| Dropdown | Data Source | Sort Order | Filter |
|---|---|---|---|
| State | `DISTINCT state FROM schools WHERE status = 'active'` | Alphabetical (A-Z) | Only states with ≥1 onboarded school |
| City | `DISTINCT city FROM schools WHERE state = $1 AND status = 'active'` | Alphabetical (A-Z) | Only cities in selected state with ≥1 onboarded school |
| School | `* FROM schools WHERE state = $1 AND city = $2 AND status = 'active'` | Alphabetical (A-Z) | Active schools only |

**Edge Cases:**
- No states available? → "No schools onboarded yet. Contact SHARP Support."
- State selected but no cities? → "No schools found in this state."
- City selected but no schools? → "No schools found in [City]."
```

### 11.2 White-Label Application

**On school selection:**
- School logo replaces SHARP logo on login page header
- School name displayed prominently
- School's primary color applied to primary buttons
- Post-login: SHARP branding appears in app shell footer

**Storage:**
```
localStorage:
  - sharp_school_id
  - sharp_school_name
  - sharp_school_logo
  - sharp_school_color
```

---

## 12. Data Model Overview

### 12.1 Core Tables (Conceptual)

| Table | Purpose | Key Fields |
|---|---|---|
| `profiles` | Single source of truth for user identity, role, school | user_id, role, school_id, full_name, email, mobile, pin_hash, must_change_pin, status, device_fingerprint, last_login_at |
| `login_attempts` | Audit trail for auth attempts | user_id, ip_address, attempt_type, success, created_at |
| `otp_codes` | Ephemeral OTP storage | user_id, code, purpose, expires_at, used, created_at |
| `schools` | School directory (pre-auth readable) | id, name, city, state, logo_url, primary_color, status |

### 12.2 RLS Policy Principles

- `profiles`: Users read own profile; school-scoped roles read same-school profiles
- `login_attempts`: Insert by authenticated users; read by super_admin only
- `otp_codes`: Read/verify by Edge Functions only; never client-side
- `schools`: Read by all (pre-auth school selection)

---

## 13. UI Specifications

### 13.1 Login Page Layout (Mobile-First)

**Standard Login Form (identifier required):**
```
┌─────────────────────────────┐
│  [School Logo]              │  ← 64px height, centered
│  School Name                │  ← H3, centered
│                             │
│  ┌─────────────────────┐    │
│  │ Mobile / ID         │    │  ← Input, 44px min height
│  └─────────────────────┘    │
│                             │
│  [Toggle: Mobile | ID]    │  ← Segmented control
│                             │
│  ┌─────────────────────┐    │
│  │ PIN / Password      │    │  ← Input, toggle visibility
│  └─────────────────────┘    │
│                             │
│  [        Sign In        ]   │  ← Primary button, full width
│                             │
│  [→ Forgot PIN?]          │  ← Ghost button, left
│                             │
│  ────── or (Principal) ──── │  ← Divider
│  [Sign in with Password]   │  ← Secondary button
│                             │
│  Powered by SHARP           │  ← Caption, muted, bottom
└─────────────────────────────┘
```

**Quick Login Form (trusted device + known user — PIN only):**
```
┌─────────────────────────────┐
│  [School Logo]              │
│  School Name                │
│                             │
│  ┌────┐  Rajesh Kumar      │
│  │ DP │  STF20260001       │  ← Pre-filled Profile Card
│  │    │  PGT Mathematics    │
│  └────┘                     │
│                             │
│  ● ● ● ○ ○ ○               │  ← PIN dots only
│                             │
│  [        Sign In        ]   │
│                             │
│  [→ Forgot PIN?]            │
│  [→ Not you? Sign in as    │  ← NEW: Shared PC support
│      different user]        │
│                             │
│  Powered by SHARP           │
└─────────────────────────────┘
```

### 13.2 Staff/Student Profile Card

**Standard Profile Card (after identifier entry):**
```
┌─────────────────────────────────────┐
│                                     │
│  ┌────┐  Rajesh Kumar              │
│  │ DP │  STF20260001              │
│  │    │  PGT Mathematics           │  ← Messenger Tag
│  └────┘                             │
│                                     │
│  ● ● ● ○ ○ ○                       │  ← PIN dots
│                                     │
│  [Forgot PIN?]                      │
│                                     │
└─────────────────────────────────────┘
```

**Quick Login Profile Card (trusted device, pre-filled):**
```
┌─────────────────────────────────────┐
│                                     │
│  ┌────┐  Rajesh Kumar              │
│  │ DP │  STF20260001              │
│  │    │  PGT Mathematics           │
│  └────┘                             │
│                                     │
│  ● ● ● ○ ○ ○                       │
│                                     │
│  [Forgot PIN?]  [Not you?]          │  ← NEW: "Not you?" for shared PCs
│                                     │
└─────────────────────────────────────┘
```

**Card Rules:**
- DP: 64px circle, fetched from My Staff / Student Form
- Name: Body Large (1rem), semibold
- Staff App ID / Student App ID: Caption (0.75rem), muted color
- Messenger Tag: Caption (0.75rem), primary color badge
- **Quick Login variant:** Shows "Not you? Sign in as different user" link below PIN dots
- Auto-displayed after valid identifier entry, before PIN input
- Slide-up animation on mobile
- On trusted devices, card is pre-filled from `localStorage` without requiring identifier entry

### 13.3 OTP Input Component

```
┌─────────────────────────────┐
│  Enter OTP                  │
│  Sent to 98*****210         │
│                             │
│  [1] [2] [3] [4] [5] [6]   │  ← 6 boxes, 48px each
│                             │
│  Resend in 00:30            │  ← Countdown
│                             │
│  [      Verify OTP      ]   │
└─────────────────────────────┘
```

**Behavior:**
- Auto-focus first box on mount
- Auto-advance to next on digit entry
- Auto-submit on 6th digit
- Backspace moves to previous
- Paste fills all boxes
- 30-second resend countdown

### 13.4 PIN Keypad Component

```
┌─────────────────────────────┐
│  Enter PIN                  │
│  ● ● ● ○ ○ ○               │
│                             │
│  ┌────┬────┬────┐           │
│  │ 1  │ 2  │ 3  │           │
│  ├────┼────┼────┤           │
│  │ 4  │ 5  │ 6  │           │  ← 44px min touch target
│  ├────┼────┼────┤           │
│  │ 7  │ 8  │ 9  │           │
│  ├────┼────┼────┤           │
│  │ ⌫  │ 0  │ ✓  │           │
│  └────┴────┴────┘           │
│                             │
│  [Forgot PIN?]              │
└─────────────────────────────┘
```

### 13.5 Dual OTP Input (Principal Recovery)

```
┌─────────────────────────────┐
│  Verify Your Identity       │
│                             │
│  Email OTP                  │
│  [1] [2] [3] [4] [5] [6]   │
│  Sent to prin***@school.com │
│                             │
│  Mobile OTP                 │
│  [1] [2] [3] [4] [5] [6]   │
│  Sent to 98*****210         │
│                             │
│  [   Verify Both OTPs   ]   │
└─────────────────────────────┘
```

**Rules:**
- Both OTPs must be entered before "Verify" is enabled
- Independent resend buttons per channel
- Independent expiry timers per channel
- "Verify" validates both simultaneously

---

## 14. Error States & Edge Cases

### 14.1 Error State Matrix

| Error | UI Message | Action |
|---|---|---|
| Invalid mobile (not Login Mobile) | "Wrong number" | Shake input, clear field |
| Invalid Staff/Student App ID | "ID does not exist" | Shake input, clear field |
| Invalid email/password (Principal) | "Invalid email or password" | Shake, clear password |
| Invalid PIN (1-4 attempts) | "Incorrect PIN. X attempts remaining." | Warning toast, clear PIN |
| Invalid PIN (5th attempt) | "Account locked." | [→] AccountLockedPage |
| Invalid OTP | "Invalid or expired OTP" | Clear OTP boxes |
| OTP expired | "OTP expired. Request a new one." | Enable resend |
| Account locked | "Account locked. Contact your Admin." | Disable inputs, show contact |
| School not found | "School not found in [City]" | Clear selection |
| Session expired | "Session expired. Please log in again." | Redirect to login |
| New device detected | "New device detected. Verify with OTP." | Force OTP flow |
| Role mismatch | "Unauthorized access." | Sign out, redirect |
| Network error | "Connection lost. Retrying..." | Auto-retry 3x |
| Server error | "Something went wrong. Try again." | Generic error |

### 14.2 Edge Cases

| Scenario | Handling |
|---|---|
| User clears localStorage | School selection reappears; session persists (JWT in cookie) |
| School deactivated mid-session | Next API call returns 403 → "School access revoked" → logout |
| Role changed mid-session | Next auth check reloads role → UI updates or redirects |
| Multiple tabs open | PIN verified in one tab → others detect via `storage` event |
| Back button after logout | Login page detects no session → no "back to dashboard" leak |
| Deep link when logged out | Save intended URL → post-login redirect |
| Principal temp password leak | 24hr expiry on temp passwords; force password change on first use |
| Shared mobile number | Each account has unique user_id; mobile is not unique constraint |
| Staff enters personal mobile (not Login Mobile) | "Wrong number" — do not reveal if number exists in system |
| Staff ID login with valid ID | Show profile card, proceed to PIN |
| Student on desktop | Block with "Please use the SHARP mobile app" |
| Principal on mobile | Allow — Principal is web + mobile |

---

## 15. Implementation Checklist

### Phase 1: Foundation

- [x] Fix `profiles.role` enum (add `super_admin`, `master_admin`, `non_teaching`)
- [x] Drop `user_roles` table (backup first)
- [x] Add `pin_hash`, `must_change_pin`, `device_fingerprint`, `status` to `profiles`
- [x] Create `login_attempts` and `otp_codes` tables
- [x] Add indexes on `profiles(user_id)`, `profiles(school_id, role)`, `profiles(mobile)`
- [x] Update `AuthContext.tsx` — single role source from `profiles.role`
- [x] Create auth constants file (roles, PIN rules, OTP rules, lockout thresholds)

### Phase 2: Login UI

- [x] Component: `SchoolSelector` (state → city → school cascade)
- [x] Component: `MobileIDToggle` (Mobile / Staff App ID / Student App ID)
- [x] Component: `StaffProfileCard` (DP + Name + ID + Messenger Tag)
- [x] Component: `StudentProfileCard` (DP + Name + ID + Class-Section)
- [x] Component: `OTPInput` (6-digit boxes, auto-focus, paste support)
- [x] Component: `DualOTPInput` (email + mobile OTP side by side)
- [x] Component: `PINKeypad` (numeric keypad, dot display)
- [x] Page: `SuperAdminLogin` (`/auth/superadmin`)
- [x] Page: `PrincipalLogin` (`/auth/principal`)
- [x] Page: `StaffLogin` (`/auth/staff`)
- [x] Page: `StudentLogin` (`/auth/student`)

### Phase 3: Setup & Recovery Flows

- [x] Page: `ForcedPasswordChange` (Principal only)
- [x] Page: `ForcedPINSetup` (all roles)
- [x] Page: `PrincipalRecovery` (dual OTP)
- [x] Page: `StaffRecovery` (mobile OTP)
- [x] Page: `StudentRecovery` (mobile OTP)
- [x] Page: `AccountLocked` (lockout UI)
- [x] Edge Function: `send-otp` (generate, store, SMS via MSG91)
- [x] Edge Function: `verify-otp` (check code, mark used)
- [x] Edge Function: `verify-pin` (bcrypt compare, attempt tracking)
- [x] Edge Function: `set-pin` (hash and store)
- [x] Edge Function: `check-device` (fingerprint comparison)

### Phase 4: Integration

- [x] Wire login flows to `AuthContext`
- [ ] Connect `AppShell` role-based navigation
- [ ] White-label context for school branding
- [ ] Session expiry handling
- [ ] New device detection flow
- [ ] Rate limiting on all auth endpoints
- [ ] Admin-initiated PIN reset flow
- [ ] Super Admin principal credential reset

### Phase 5: Documentation Updates

- [ ] Update `SCREEN_FLOW_MAP.md` — reference AUTH.md for all auth flows
- [ ] Update `PERMISSION_MATRIX.md` — auth section
- [ ] Update `PRD.md` §1 — replace with reference to AUTH.md
- [ ] Update `SUPERADMIN.md` — principal credential reset references AUTH.md §9.2
- [ ] Update `BUGS.md` — mark dual-role bug as resolved with reference to AUTH.md

---

## 16. Security Recommendations

### 16.1 Principal Security (Highest Privilege)

| Measure | Implementation | Rationale |
|---|---|---|
| **Dual OTP recovery** | Email OTP + Mobile OTP both required | Single compromised channel insufficient |
| **Password + PIN** | Password for new devices, PIN for trusted | Balance security vs convenience |
| **Device fingerprinting** | Browser + screen + timezone hash | Detect obvious new devices |
| **Trust device prompt** | User explicitly trusts or not | User-informed security decision |
| **Temp password expiry** | 24-hour expiry, single-use | Limit window of exposure |
| **Password complexity** | 8+ chars, mixed case, number | Resist brute force |
| **Lockout escalation** | Warning at 4th attempt, lock at 5th | Give user chance to stop |

### 16.2 Staff/Student Security

| Measure | Implementation | Rationale |
|---|---|---|
| **PIN-only daily** | No password to phish or forget | Simpler, mobile-optimized |
| **Mobile/ID login** | No email required for daily | Matches mobile-first design |
| **Profile card confirmation** | Photo + Name + ID visible before PIN | Prevents wrong-account entry |
| **OTP for setup/recovery** | Mobile OTP only | Simpler than dual-channel |
| **"Wrong number" message** | Don't reveal if mobile exists | Prevent enumeration attacks |
| **Lockout at 5 attempts** | 24-hour auto-unlock | Balance security vs support burden |

### 16.3 System-Wide Security

| Measure | Implementation |
|---|---|
| **Rate limiting** | Per-IP and per-user limits on all endpoints |
| **Audit logging** | All login attempts logged (success + failure) |
| **HTTPS only** | All auth traffic over TLS 1.3 |
| **PIN hashing** | Server-side bcrypt only, never client-side |
| **OTP storage** | Hashed or encrypted, never plaintext |
| **Session invalidation** | Immediate on password/PIN change |
| **Cross-tab sync** | `storage` event for multi-tab PIN verification |

---

## Cross-Reference Map

| This Document | Replaces In | Notes |
|---|---|---|
| §1.2 Auth Methods | `PRD.md` §1 (login table) | Expanded with device trust |
| §4.1 Super Admin | `SUPERADMIN.md` (login) | Unchanged |
| §4.2 Principal | `PRD.md` §1, `SCREEN_FLOW_MAP.md` Flow 2A/2C | Added password + PIN dual system |
| §4.3 Staff | `PRD.md` §1, `SCREEN_FLOW_MAP.md` Flow 3A/3B/3C | **Complete rewrite**: mobile/ID → profile → PIN |
| §4.4 Student | `PRD.md` §1, `SCREEN_FLOW_MAP.md` Flow 4A/4B | **Complete rewrite**: mobile/ID → profile → PIN |
| §5.1 Forced Password | `PRD.md` §1 (forced PIN) | New: Principal password change before PIN |
| §5.2 Forced PIN | `PRD.md` §1 (forced PIN) | Unchanged rules, applied to all roles |
| §7 Session | `PRD.md` §1 (30-day session) | Added device trust model |
| §8.1 Principal Recovery | `SUPERADMIN.md` (reset) | **New**: Dual OTP recovery flow |
| §8.2 Staff Recovery | `SCREEN_FLOW_MAP.md` Flow 3C | **Complete rewrite**: mobile OTP only |
| §9.2 Admin Reset | `SUPERADMIN.md` (reset) | Moved to admin-initiated flow |
| §10 Lockout | `SCREEN_FLOW_MAP.md` (wrong OTP) | Unified: 4 warnings, 5th lock |
| §11 School Select | `PRD.md` §1 (white-label) | Added localStorage persistence |
| §12 Data Model | `DATABASE_REPORT.md` §3.1 | Conceptual only (SQL in BUGS.md) |
| §16 Security | `DATABASE_REPORT.md` §4 | New: Principal dual OTP rationale |

---

## Open Questions (Resolved)

| # | Question | Resolution |
|---|---|---|
| 1 | Principal recovery "both OTP" | Dual OTP: email + mobile both required |
| 2 | Staff daily login | Mobile/Staff ID → profile card → PIN directly (no OTP) |
| 3 | First-time staff login | Mobile/Staff ID → OTP → PIN setup |
| 4 | Student daily login | Mobile/Student ID → profile card → PIN directly |
| 5 | Principal auth method | Password for new/untrusted devices, PIN for trusted |
| 6 | Wrong mobile message | "Wrong number" (not "ID does not exist") for security |
| 7 | Staff ID login display | Yes: photo + name + Staff App ID + Messenger Tag |
| 8 | Dual-role staff login | Same as all staff: mobile/ID → PIN |
| 9 | Lockout UI | Warning toast (1-4 attempts), full page (5th attempt) |
| 10 | Account states scope | All roles except Super Admin |

---

## Document History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-16 | Initial unified spec (from scattered docs) |
| 2.0 | 2026-05-16 | **Major rewrite**: Staff/Student mobile/ID login, Principal dual OTP, profile cards, device trust |
| 2.1 | 2026-05-16 | **Quick Login + Shared PC support**: Pre-filled ID on trusted devices (PIN-only daily login); "Not you? Sign in as different user" button for shared PCs; School selection shows onboarded states/cities only, alphabetical order |
| 2.2 | 2026-05-22 | **Full implementation complete**: Phase 1 (DB migrations, auth constants, RLS), Phase 2 (all auth components, 3 login routes wired), Phase 3 (ForcedPasswordChange, ForcedPINSetup, AccountLocked, PrincipalRecovery, StaffRecovery, StudentRecovery pages), Phase 4 (AuthContext auto-redirect on must_change_password/must_change_pin/locked status). SchoolSelection now fetches only onboarded states/cities from DB. |

---

## Implementation Reference (v2.2)

### Routes Implemented

| Route | File | Purpose |
|---|---|---|
| `/auth/principal` | `src/pages/AuthRoleLogin.tsx` (kind="principal") | Principal email + password login |
| `/auth/staff` | `src/pages/AuthRoleLogin.tsx` (kind="staff") | Staff mobile/ID + PIN login |
| `/auth/student` | `src/pages/AuthRoleLogin.tsx` (kind="student") | Student mobile/ID + PIN login |
| `/auth/forced-password-change` | `src/pages/ForcedPasswordChange.tsx` | Principal forced password change |
| `/auth/forced-pin-setup` | `src/pages/ForcedPINSetup.tsx` | All roles forced PIN setup |
| `/auth/locked` | `src/pages/AccountLocked.tsx` | Account lockout screen |
| `/auth/principal/recover` | `src/pages/PrincipalRecovery.tsx` | Principal email + mobile OTP recovery |
| `/auth/staff/recover` | `src/pages/StaffRecovery.tsx` | Staff mobile OTP recovery |
| `/auth/student/recover` | `src/pages/StudentRecovery.tsx` | Student mobile OTP recovery |

### Components Created

| Component | File | Purpose |
|---|---|---|
| `SchoolSelector` | `src/components/auth/SchoolSelector.tsx` | State → City → School cascade |
| `ProfileCard` | `src/components/auth/ProfileCard.tsx` | Photo + Name + ID + Tag display |
| `PINKeypad` | `src/components/auth/PINKeypad.tsx` | 6-digit numeric keypad with dots |
| `MobileIDToggle` | `src/components/auth/MobileIDToggle.tsx` | Toggle between Mobile/AppID input |
| `OTPInput` | `src/components/auth/OTPInput.tsx` | 6-box OTP with countdown timer |
| `LoginCard` | `src/components/auth/LoginCard.tsx` | Login card container |
| `StaffLoginForm` | `src/components/auth/LoginForms.tsx` | Unified PIN login form |

### Edge Functions Deployed

| Function | Purpose |
|---|---|
| `send-otp` | Generate 6-digit OTP, store in `otp_codes`, log to console (SMS via MSG91 placeholder) |
| `verify-otp` | Verify OTP code, check attempts, mark as used |
| `set-pin` | Validate + store PIN hash in `profiles` |

### Database Changes

**`profiles` columns added:**
- `pin_hash` (text) — bcrypt hash of 6-digit PIN
- `must_change_pin` (boolean) — force PIN setup on first login
- `must_change_password` (boolean) — force password change on first login
- `device_fingerprint` (text) — trusted device hash
- `status` (text) — account state: created/first_login/active/inactive/locked
- `last_login_at` (timestamptz) — last successful login timestamp
- `login_mobile` (text) — dedicated login mobile number

**Tables created:**
- `otp_codes` — ephemeral OTP storage with expiry
- `login_attempts` — audit trail for auth attempts

**Tables dropped:**
- `user_roles` — replaced by RLS helper functions on `profiles`

### AuthContext Changes

- `mustChangePin` state exposed (was missing)
- `profileStatus` state exposed (from `profiles.status`)
- `AutoForceRedirect` component — auto-redirects on login:
  - `status = "locked"` → `/auth/locked?role=...&reason=...`
  - `must_change_password = true` (principal) → `/auth/forced-password-change`
  - `must_change_pin = true` (staff/student) → `/auth/forced-pin-setup`
  - Skips redirect if already on one of those auth pages
