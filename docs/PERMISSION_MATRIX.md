# SHARP — Permission & Feature Matrix

> Last updated: May 2026
> ✅ Full Access | 👁 View Only | ❌ No Access | ⚙️ Configurable by Principal | — Not yet decided

---

## SECTION 1 — LOGIN & AUTH

| Feature | Super Admin | Principal | Master Admin | Admin | Teacher | Non-Teaching | Student/Parent |
|---|---|---|---|---|---|---|---|
| Email + password login | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| OTP first login | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6-digit PIN daily login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2FA (toggleable by Super Admin) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PIN reset via mobile OTP | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update own registered mobile | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update another staff's mobile | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update student Login Mobile | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Forced PIN setup on first login | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OTP on session expiry / new device | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> Forced PIN setup on first login is a system-wide rule enforced at authentication level. It is not a configurable toggle — it applies to every role without exception and cannot be turned off from any form or settings screen.

---

## SECTION 2 — ONBOARDING & SETUP

See docs/ONBOARDING.md for full spec.

| Feature | Super Admin | Principal | Master Admin | Admin | Teacher | Non-Teaching | Student/Parent |
|---|---|---|---|---|---|---|---|
| Create Principal ID | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Super Admin entered fields | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Complete / Edit School Form | ✅ | 👁 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Complete / Edit Additional Info Form | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Note (Complete / Edit School Form):** Super Admin creates the school and sets all identity and location fields. Principal views all fields after onboarding; can only edit `contact_phone` and `contact_email` (school office contact) via the "My School" page.
| Complete Session Form | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Master Admin ID | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Admin ID | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Teacher ID | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Non-Teaching Staff ID | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Student ID | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Student profile | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bulk import Students | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bulk import Staff | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign Academic roles to Student (House, Stream, Wing) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Activate / deactivate school | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Activate / deactivate accounts | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Delete school | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> Bulk import: all or nothing. One bad cell rejects entire file. Bare minimum columns only.
> Academic Assignment (House, Stream, Wing) for students is a separate action performed after student record creation — not part of the creation form.

---

## SECTION 3 — ROLES & PERMISSIONS MANAGEMENT

| Feature | Super Admin | Principal | Master Admin | Admin | Teacher | Non-Teaching | Student/Parent |
|---|---|---|---|---|---|---|---|
| View permission matrix | ✅ | ✅ | 👁 | ❌ | ❌ | ❌ | ❌ |
| Edit role permissions | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign role to staff | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Assign Subject Teacher / Class Teacher | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Create custom roles | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage billing / subscription | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## MVP MODULE 1 — MESSENGER

**Rules:**
- Super Admin has zero access.
- Students cannot see or message other students.
- Students can only message assigned teacher + designated admin staff.
- Students can send in teacher-formed groups — not groups they create.
- Broadcasts one-way (school → students). Student replies go into private thread visible only to them + broadcast admin.
- Messages cannot be deleted after 2 minutes.
- Media: images and PDFs only.

| Feature | Super Admin | Principal | Master Admin | Admin | Teacher | Non-Teaching | Student/Parent |
|---|---|---|---|---|---|---|---|
| Access messenger | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send individual message | ❌ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ✅ |
| Receive individual message | ❌ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ✅ |
| Message other students | ❌ | — | — | — | — | — | ❌ |
| Message assigned teacher | ❌ | — | — | — | — | — | ✅ |
| Message designated admin staff | ❌ | — | — | — | — | — | ✅ |
| Create group | ❌ | ✅ | ✅ | ⚙️ | ⚙️ | ❌ | ❌ |
| Create broadcast | ❌ | ✅ | ✅ | ⚙️ | ⚙️ | ❌ | ❌ |
| Send in teacher-formed group | ❌ | — | — | — | ✅ | — | ✅ |
| Delete own message (within 2 min) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete any message | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Share image | ❌ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ✅ |
| Share PDF | ❌ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ✅ |
| View read receipts | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Archive / audit chat logs | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Search messages | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## MVP MODULE 2 — HOMEWORK

> ⚠️ Fill before building.

| Feature | Super Admin | Principal | Master Admin | Admin | Teacher | Non-Teaching | Student/Parent |
|---|---|---|---|---|---|---|---|
| Assign homework | — | — | — | — | — | — | — |
| Edit assigned homework | — | — | — | — | — | — | — |
| Delete assigned homework | — | — | — | — | — | — | — |
| View homework list | — | — | — | — | — | — | — |
| Submit homework digitally | — | — | — | — | — | — | — |
| Mark as done on paper | — | — | — | — | — | — | — |
| Review submission | — | — | — | — | — | — | — |
| Add marks / comments | — | — | — | — | — | — | — |
| View class completion report | — | — | — | — | — | — | — |
| Receive homework notification | — | — | — | — | — | — | — |

---

## MVP MODULE 3 — ATTENDANCE

> ⚠️ Fill before building.

| Feature | Super Admin | Principal | Master Admin | Admin | Teacher | Non-Teaching | Student/Parent |
|---|---|---|---|---|---|---|---|
| Mark student attendance | — | — | — | — | — | — | — |
| Edit attendance within 24hrs | — | — | — | — | — | — | — |
| Edit attendance after 24hrs | — | — | — | — | — | — | — |
| View own class attendance | — | — | — | — | — | — | — |
| View school-wide attendance | — | — | — | — | — | — | — |
| View own attendance record | — | — | — | — | — | — | — |
| Receive low attendance alert | — | — | — | — | — | — | — |
| Apply student leave | — | — | — | — | — | — | — |
| Approve student leave | — | — | — | — | — | — | — |
| Export attendance report | — | — | — | — | — | — | — |

---

## FUTURE MODULES (add matrix when built)

Timetable, Fee Management, HR & Payroll, Analytics Dashboard, Resources Manager, Holiday & Event Calendar, Complaint & Grievance, Notice Board / Feed, My Docs, School Status, Transport Management, Library Management.
