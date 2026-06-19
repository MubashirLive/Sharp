# SHARP — Permission & Feature Matrix

> Updated 2026-06-17. ✅ Full | 👁 View | ❌ None | ⚙️ Principal-config | — N/A

## Section 1 — Login & Auth
| Feature | Super | Principal | Master Admin | Admin | Teacher | Non-Teach | Student |
|---|---|---|---|---|---|---|---|
| Email + password | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| OTP first login | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 6-digit PIN daily | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2FA (super toggle) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| PIN reset via OTP | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update own mobile | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update other staff mobile | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update student mobile | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Forced PIN setup | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OTP on session/new device | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> Forced PIN = system-wide, not a toggle. Applies to every role.

## Section 2 — Onboarding & Setup
| Feature | Super | Principal | Master Admin | Admin | Teacher | Non-Teach | Student |
|---|---|---|---|---|---|---|---|
| Create Principal ID | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit super-admin fields | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View/Edit School Form | ✅ | 👁(contact only) | ❌ | ❌ | ❌ | ❌ | ❌ |
| Complete Additional Info | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Complete Session Form | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Master Admin ID | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Create Admin ID | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Teacher/Non-Teach/Student | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit student profile | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bulk import students/staff | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Academic assignment (House/Stream/Wing) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Activate/deactivate school | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Activate/deactivate accounts | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Delete school | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> Bulk import = all-or-nothing. Academic assignment is post-creation.

## Section 3 — Roles & Permissions
| Feature | Super | Principal | Master Admin | Admin | Teacher | Non-Teach | Student |
|---|---|---|---|---|---|---|---|
| View matrix | ✅ | ✅ | 👁 | ❌ | ❌ | ❌ | ❌ |
| Edit role permissions | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign role to staff | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Assign Subject/Class Teacher | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Custom roles | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## MVP 1 — Messenger ✅
Rules: super ❌; students ↔ assigned teacher + designated admin only; teacher-formed groups; broadcasts one-way; 2-min delete; image+PDF; read receipts.
| Feature | Super | Principal | Master Admin | Admin | Teacher | Non-Teach | Student |
|---|---|---|---|---|---|---|---|
| Access | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Send/Receive DM | ❌ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ✅ |
| Student ↔ Student | ❌ | — | — | — | — | — | ❌ |
| Student ↔ assigned teacher | ❌ | — | — | — | — | — | ✅ |
| Create group | ❌ | ✅ | ✅ | ⚙️ | ⚙️ | ❌ | ❌ |
| Create broadcast | ❌ | ✅ | ✅ | ⚙️ | ⚙️ | ❌ | ❌ |
| Send in teacher-formed group | ❌ | — | — | — | ✅ | — | ✅ |
| Delete own (≤2 min) | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete any | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Share image/PDF | ❌ | ✅ | ✅ | ✅ | ✅ | ⚙️ | ✅ |
| Read receipts | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Archive/audit logs | ❌ | ✅ | ✅ | ⚙️ | ❌ | ❌ | ❌ |
| Search | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## MVP 2 — Homework ✅
| Feature | Super | Principal | Master Admin | Admin | Teacher | Non-Teach | Student |
|---|---|---|---|---|---|---|---|
| Assign | ❌ | 👁 | 👁 | 👁 | ✅(own class/sub) | ❌ | ❌ |
| Edit assigned | ❌ | ⚙️ | ⚙️ | ⚙️ | ✅(own, not checked) | ❌ | ❌ |
| Delete assigned | ❌ | ✅ | ✅ | ✅ | ✅(own, not checked) | ❌ | ❌ |
| View list | ❌ | ✅ | ✅ | ✅ | ✅ | 👁 | ✅ |
| Submit digital | ❌ | — | — | — | — | — | ✅ |
| Mark done on paper | ❌ | — | — | — | — | — | ✅ |
| Review submission | ❌ | 👁 | 👁 | 👁 | ✅(own) | ❌ | ❌ |
| Add marks/comments | ❌ | 👁 | 👁 | 👁 | ✅(own) | ❌ | — |
| Class completion report | ❌ | ✅ | ✅ | ✅ | ✅(own) | ❌ | — |
| Notification | ❌ | — | — | — | — | — | ✅ |

## MVP 3 — Attendance ✅
| Feature | Super | Principal | Master Admin | Admin | Teacher | Non-Teach | Student |
|---|---|---|---|---|---|---|---|
| Mark student | ❌ | 👁 | 👁 | 👁 | ✅(class teacher) | ❌ | — |
| Edit ≤24h | ❌ | ✅ | ✅ | ✅ | ✅(with reason) | ❌ | — |
| Edit >24h | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | — |
| View own class | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | — |
| School-wide | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | — |
| View own record | ❌ | — | — | — | — | — | ✅ |
| Low-attendance alert | ❌ | ✅ | ✅ | ✅ | — | — | ✅ |
| Apply leave | ❌ | — | — | — | — | — | ✅ |
| Approve leave | ❌ | ✅ | ✅ | ✅ | ✅(own class) | ❌ | — |
| Export | ❌ | ✅ | ✅ | ✅ | ✅(own class) | ❌ | — |

## Future Modules
Timetable, Fees, HR & Payroll, Analytics, Resources, Holiday & Event (Calendar ✅), Complaint, Notice Board, My Docs, School Status, Transport (in Student Form), Library, Admissions CRM, Quiz/MCQ.
