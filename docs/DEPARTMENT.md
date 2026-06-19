# Department Tab — Feature Specification
### Module: My School > Department Tab / Role Manager > Departments Tab
### Version: 2.1 (Simplified Card + Type-to-Confirm Delete)
### Status: Implemented

---

## Table of Contents

1. Overview
2. Access & Permissions
3. Data Rules & Constraints
4. UI Layout
   - 4.1 Top Bar
   - 4.2 Card View (Simplified)
   - 4.3 List View (Simplified)
   - 4.4 Empty State
5. Creating a Department (Department Tab)
6. Editing a Department (Department Tab)
7. Deleting a Department
8. Department Activation Rule
9. Role Assignment (Role Manager)
10. Actor Replacement Protocol (Role Manager)
11. Self-Deletion Block
12. Feature Ownership Split
13. Notifications
14. Verification Checklist

---

## 1. Overview

The Department feature spans two tabs:

| Tab | Location | Purpose |
|---|---|---|
| Department Tab | My School | Create, rename, delete departments; view name + status only |
| Departments Assignment Tab | Role Manager | Assign/remove incharges, members, settings, audit log per department |

This split was introduced in v2.0. The Department Tab handles only the department entity (name, status). All role assignment, settings, and per-department logging belong to Role Manager.

---

## 2. Access & Permissions

- The entire Department Tab is under the exclusive control of the **Principal** and **Master Admin**.
- No other role can create, edit, or delete a department.
- Department Incharges do not have edit access to the department record.
- Log visibility: Principal and Master Admin only (single Log button for entire tab).

---

## 3. Data Rules & Constraints

**Activation rule**
A department is **inactive** until at least one Incharge is assigned. Inactive departments display an "Inactive" badge on their card.

**Department independence**
A school can have zero departments. A department can exist with zero members.

**Multi-department staff**
A staff member can belong to multiple departments simultaneously.

**Split model** (2026-06-19: collapsed into a single junction table)
- Department creation/rename/delete: `departments` table
- Membership + incharge: `department_staff` junction table with `is_incharge BOOLEAN NOT NULL DEFAULT false`

**Multiple incharges**
A department can have more than one incharge. All incharges hold equal authority.

---

## 4. UI Layout

### 4.1 Top Bar

- **Search box** — searches departments by name.
- **Log button** — single Log button for entire tab (shown when at least one department exists).
- **Add New button** — opens creation form.

### 4.2 List View (Only format)

List view only — no card view. Compact table with columns: Department | Status | Actions

Status column: green "Active" or amber "Inactive" dot.
Actions column: Edit button only.

### 4.3 Empty State

Centred message + Add First Department button. Log button hidden until at least one department exists.

---

## 5. Creating a Department (Department Tab)

**Pre-check:** At least one staff record must exist in My Staff.

**Creation form fields:**

1. **Department Name**
   - Free text input (max 50 chars)
   - Template chips: Fees, Transport, Human Resource, Reception, Discipline
   - Unique check: case-insensitive, block on save if duplicate
   - Auto-trim leading/trailing spaces

2. **Save**
   - Note displayed: *"Assign Incharge and Members in Role Manager after creation."*
   - On save: insert into `departments` table
   - Initial `messenger_settings.who_can_use` defaults to `incharges_only`
   - Department created in **inactive** state (no incharge assigned)

**No member or incharge picker in creation form.**

---

## 6. Editing a Department (Department Tab)

Edit Mode is **name-only**:
- Editable name field
- Save Changes / Cancel buttons in footer
- Delete Department button in footer (triggers type-to-confirm dialog)
- **No member list, no settings, no log**

Renaming validates: 2-50 chars, unique within school.

---

## 7. Deleting a Department

**Delete action (Department Tab):**

Type-to-confirm pattern (matching WingsTab):

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Delete [Department Name]?                             │
├─────────────────────────────────────────────────────────────┤
│  This action is permanent and cannot be undone.             │
│  The department will be permanently deleted.               │
│  All incharges and members will be unassigned.            │
├─────────────────────────────────────────────────────────────┤
│  Type "[Department Name]" to confirm:                       │
│  [ ____________________________ ]                           │
├─────────────────────────────────────────────────────────────┤
│  [Cancel]              [Delete Permanently] (disabled)     │
└─────────────────────────────────────────────────────────────┘
```

- Confirm button disabled until user types the exact department name
- Junction table entries (`department_staff`) deleted first, then department record
- **Actor Replacement NOT triggered** on delete — this is the explicit destruction path

---

## 8. Department Activation Rule

`is_active = department_staff has at least 1 row with is_incharge=true for this dept`

| State | Card badge |
|---|---|
| Active (`incharges.length > 0`) | None |
| Inactive (`incharges.length === 0`) | "Inactive" (amber) |

---

## 9. Role Assignment (Role Manager)

**Departments Assignment Tab** (inside Role Manager) handles all incharge/member assignment:

- **Set Incharge** button: Upserts a row into `department_staff` with `is_incharge=true` (and creates the membership row if it doesn't exist)
- **Change Incharge**: Same flow (upsert; the new staff gets `is_incharge=true`, the previous incharge is set to `is_incharge=false`)
- **Add Member**: Inserts into `department_staff` with `is_incharge=false`
- **Remove Member**: Deletes from `department_staff` (single row carries both flags)
- **Messenger Settings**: gear icon per department row

Incharges display with Crown badge. Members display in muted pills.

---

## 10. Actor Replacement Protocol (Role Manager)

**Trigger:** Removing the sole incharge from a department (via Role Manager).

**Dialog: "Replacement Required"**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Replacement Required                                   │
├─────────────────────────────────────────────────────────────┤
│  [Name] is the only Incharge of [Department].              │
│  A replacement is required before removal.                  │
├─────────────────────────────────────────────────────────────┤
│  [ Pick Replacement ]     [ I Will Become Incharge ]       │
│  [ Cancel ]                                                │
└─────────────────────────────────────────────────────────────┘
```

**Pick Replacement:** Staff picker → replacement becomes Incharge + Member, departing incharge removed from both tables.

**I Will Become Incharge:** Current user added as Incharge + Member, departing incharge removed.

**"I Will Become Incharge" hidden** when `currentUserId === departingIncharge`.

---

## 11. Self-Deletion Block

When deleting a staff member from **My Staff** who is the sole incharge of any department:
- Blocked via `check-staff-deletion-eligibility` edge function
- Toast error: *"You cannot delete [Name] while they are the only Incharge of [Department]. Assign a replacement Incharge first."*

---

## 12. Feature Ownership Split

| Feature | Department Tab (My School) | Role Manager > Departments |
|---|---|---|
| Create department | Yes | — |
| Rename department | Yes | — |
| Delete/dissolve | Yes | — |
| Log (whole tab) | Yes | — |
| Incharge row on card | **No** | Yes |
| Members row on card | **No** | Yes |
| Settings (gear icon) | **No** | Yes |
| Log per-department | **No** | Yes |
| Set Incharge | — | Yes |
| Add/Remove member | — | Yes |
| Actor Replacement Protocol | — | Yes |
| Self-deletion block | — | Yes |

---

## 13. Notifications

| Event | Recipient |
|---|---|
| Department created | Internal (audit log only) |
| Incharge becomes replacement | Principal + Master Admins (future) |
| Self-deletion blocked | User attempting deletion |

---

## 14. Verification Checklist

- [x] Card shows only: name + Inactive badge + Edit + Delete
- [x] No gear icon, no log icon on card, no crown badges, no member pills
- [x] Single Log button in top bar works
- [x] Create department → card appears with Inactive badge
- [x] Click Edit → name field editable, Delete button in footer
- [x] Click Delete → type department name → correct name enables delete → deleted
- [x] In Role Manager, set incharge → department becomes Active (badge hidden)
- [x] In Role Manager, remove sole incharge → Actor Replacement dialog fires
- [x] docs/DEPARTMENT.md Section 12 matches implementation

---

**Spec Status:** Feature complete per this document. Department Tab handles entity management only (name, status, create, rename, delete).
