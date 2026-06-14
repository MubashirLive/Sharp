# SHARP – Task Management
> Last updated: May 2026 | Status: Planning draft

---

## 1. Module Overview

Staff-only operational module for assigning, tracking, verifying, and recording internal school work. Follows school hierarchy strictly. Used for employee accountability, delegation, completion tracking, Messenger-linked discussion, Calendar visibility, and yearly audit records. Students and parents are excluded.

**Core rule:** Every task assignment creates a task record for the current academic year and sends a system-generated Messenger message to the assigned recipient or group.

---

## 2. Eligible Task Recipients (Staff only, same school)

Master Admin · Admin · Departmental Incharge · Coordinator · Teacher · Class Teacher · Department Member · Non-Teaching Staff

Students and parents cannot receive tasks.

---

## 3. Task Assignment Hierarchy

| Assigner | Can Assign To | Cannot Assign To |
|---|---|---|
| **Principal** | All staff | — |
| **Master Admin** | All staff incl. other Master Admins | Principal |
| **Admin** | Admin, Dept Incharge, Coordinator, Teacher, Class Teacher, Dept Member, Non-Teaching Staff | Principal, Master Admin |
| **Departmental Incharge** | Members of own department (individual, selected, or whole group) | Principal, Master Admin, Admin, other Dept Incharges, staff outside own dept |
| **Coordinator** | Teachers in own assigned wing (individual, selected, or whole wing group) | Principal, Master Admin, Admin, Dept Incharge, Coordinators outside allowed wing, teachers outside own wing |
| **Teacher / Class Teacher / Dept Member** | Cannot assign tasks | — |

---

## 4. Assignment Types

- **Individual** – One task record for one staff member.
- **Selected** – One task assigned to chosen staff; each gets their own task record.
- **Group** – Assigned to a full department or wing group; each member gets their own task record with independent completion tracking.

---

## 5. Task Lifecycle

`Assigned → Seen → Submitted → Verified → Completed`

| Stage | Meaning |
|---|---|
| **Assigned** | Task created; record saved, Messenger message sent, appears in recipient's task list and Calendar Task tab. |
| **Seen** | Recipient has opened the task. Confirms delivery to assigner. |
| **Submitted** | Recipient claims work is done and submits for verification. Not yet complete. |
| **Verified** | Assigner reviews and accepts submitted work. |
| **Completed** | Task officially closed. Remains in records until yearly wipe. |

---

## 6. Overdue & Incomplete Tasks

If due date passes without completion, task is flagged as **incomplete** and remains active. Visible to: Assignee, Assigner, Principal, Master Admin. Task stays active until submitted, verified, completed, reassigned, or cancelled.

---

## 7. Task Reassignment

Tasks can be reassigned. History preserved includes: original assigner, original assignee, new assignee, reassignment date/time, reason (if provided), and status before reassignment. Previous assignee is relieved of responsibility. New assignee receives a system-generated Messenger message and the task record reflects the reassignment.

---

## 8. Task Content Fields

- Title, Description, Due date, Assigner, Assignee/group, Assignment type
- Attachments (images, PDFs, general files, voice notes)
- Status, Created datetime, Seen datetime, Submitted datetime, Verified datetime, Completed datetime

---

## 9. Messenger Integration

All task discussion happens in Messenger; task pages are for details, status, submission, verification, and records only.

| Assignment Type | Message Behaviour |
|---|---|
| **Individual** | System message in existing 1-to-1 chat between assigner and recipient. |
| **Selected** | Each recipient gets a system message in their own 1-to-1 chat with the assigner. |
| **Group** | Single system message in the department or wing group chat. Each member still gets their own task record. |

System message includes: Task title · Due date · Description · Link/button to task page. System messages cannot be edited like normal chat messages.

---

## 10. Calendar Integration

All tasks appear in the **Task tab** of the Calendar for assigned individuals/groups.

To be finalized: show by assigned date, due date, or both · completed task visibility · overdue task highlighting · individual completion status for group tasks · filters (Assigned By Me, Assigned To Me, Department, Wing, Status).

---

## 11. Visibility & Record Access

| Role | Can See |
|---|---|
| **Principal** | All task records in the school |
| **Master Admin** | All task records in the school |
| **Admin** | Tasks they assigned; tasks assigned to them. (Not tasks created by Dept Incharges or Coordinators unless permitted.) |
| **Departmental Incharge** | Tasks they assigned within their dept; tasks assigned to them |
| **Coordinator** | Tasks they assigned within their wing; tasks assigned to them |
| **Teacher / Class Teacher / Dept Member / Non-Teaching Staff** | Tasks assigned to them; own task history for active record period |

---

## 12. Yearly Record Retention

Task records kept for one year, then wiped per school's yearly reset policy.

To be finalized: academic year vs calendar year · permanent deletion vs archival · Principal export before wipe · handling of incomplete tasks at wipe time.

---

## 13. Task Audit Record (per task)

Each task must log: creator, recipient, assignment datetime, seen datetime, submission datetime, verifier, completion datetime, overdue flag, reassignment details, and attachments. Used for accountability and operational review.

---

## 14. Open Questions

- Can assigners cancel their own tasks after assigning?
Yes

- Can Principal/Master Admin cancel any task?
Yes

- Should task priority levels exist (Normal / Important / Urgent)?
no

- Should overdue reminders be sent automatically?
no

- Should the assigner be notified when a task is submitted?
yes

- Should assignees be able to submit attachments as proof of completion?
yes

- Should verification support remarks (Approved / Needs Correction / Reopened)?
No

- Should reassignment require a reason?
no reassignment

- Should task records be exportable before yearly wipe?
yes

- Should Calendar show both assigned date and due date?
yes
