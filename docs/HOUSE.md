# House Tab — Feature Specification
### Module: My School > House Tab
### Version: 1.0 (First Release)
### Status: In Progress

---

## Table of Contents

1. Overview
2. Access & Permissions
3. Data Rules & Constraints
4. UI Layout
   - 4.1 Top Bar
   - 4.2 House Card View
   - 4.3 House Summary Panel (Bottom of Card)
   - 4.4 Empty State
5. Default Houses
6. Editing a House
   - 6.1 Renaming the House
   - 6.2 Changing the House Emblem
7. Assigning Staff to Houses
   - 7.1 Assigning from the House Tab
   - 7.2 House Incharge
   - 7.3 Staff View
8. Resetting a House
9. Sync with Other Modules
10. Logs
11. Notifications
12. Validation Rules
13. Future Scope
14. Open Questions (Resolved)
15. Informal Notes / Raw Context

---

## 1. Overview

The House Tab lives inside the My School section of the application. It allows the Principal and Master Admin to manage the school's House system — a traditional organisational structure used to group students and staff into named competitive or social units (Red House, Blue House, Green House, Yellow House).

In this version, Houses serve one purpose: **identity configuration** (renaming the house, changing its emblem). **Staff assignment and House Incharge designation are handled exclusively via the Role Manager module.** Student-to-house assignment is handled via the Student Form and is not part of this tab.

Houses are pre-seeded by the system with default names and pre-uploaded emblems. The school does not create or delete houses in v1. The tab is always present and always shows four default houses.

### Division of Responsibility

| Module | What it owns |
|--------|-------------|
| **My School → Houses Tab** | House entity management: name, emblem |
| **Role Manager → Houses Tab** | Staff assignment, House Incharge, summary stats (staff count M/F, student count B/G, wing-wise breakdown) |
| **Student Form** | Student-to-house assignment |

---

## 2. Access & Permissions

- The entire House Tab is under the exclusive control of the **Principal** and **Master Admin**.
- No other role can edit house names, emblems, or staff assignments.
- Staff members assigned to a house have no visibility into this tab and cannot edit their own assignment.
- Log visibility: accessible to Principal and Master Admin only.
- Reset action: available to both Principal and Master Admin, consistent with other tabs in My School.

---

## 3. Data Rules & Constraints

**Fixed number of houses**
The system seeds exactly four default houses. No house can be added or deleted in v1. The count is fixed at four.

**Default house names and emblems**
The four default houses are pre-named Red, Blue, Green, and Yellow, each with a pre-uploaded emblem matching their colour. These defaults are active from day one and require no setup to be usable.

**One-house-per-staff rule**
A staff member can be assigned to only one house at a time. If a staff member already assigned to a house is selected for another house, the system prompts the user: *"[Staff Name] is currently in [Current House]. This will move them to [New House]. Proceed?"* On confirmation, the staff member is removed from the previous house and added to the new one in a single atomic action.

**No minimum staff rule**
A house is allowed to have zero staff members. Unlike the Department or Wing Tab, a house with zero members is a valid system state.

**Emblem uniqueness**
Each uploaded emblem image is tied to one house. Since emblems are user-uploaded images in v1, uniqueness is not technically enforced by the system (two different houses could upload the same image file). However, the default pre-uploaded emblems (R / B / G / Y) are fixed per house and cannot be swapped between houses.

**Name uniqueness**
House names must be unique within the school (case-insensitive). Two houses cannot share the same name. Block on save with inline error: *"This house name is already in use."*

---

## 4. UI Layout

### 4.1 Top Bar

The top bar spans the full width of the House Tab and contains the following controls from left to right:

- **Search box** — searches staff by name to quickly find which house a staff member is assigned to. Results show the staff member's name and the house they are currently assigned to (or "Unassigned" if none).
- **View toggle** — two icon buttons switching between House View and Staff View. The user's last selected view is persisted in local storage and restored on next visit.
- **Log button** — positioned at the top right. Opens the change log for all houses.

There is no Add New button. Houses are pre-seeded and cannot be created.

### 4.2 House List View

Each house is displayed as a row in a table. All four rows are always visible.

| Emblem | House Name | Actions |
|--------|------------|---------|
| Colour circle with house initial | House name | Edit button |

**Columns:**
- **Emblem** — default colour circle (R/B/G/Y) or uploaded custom image
- **House Name** — current name of the house
- **Actions** — Edit button (Principal / Master Admin only)

**No toggle** — only one view. Staff assignment, Incharge, and summary stats are managed via Role Manager.

### 4.3 Edit Modal

Triggered by the Edit button on any house row.

**Fields:**
- Emblem upload (click circle to upload JPG/PNG/SVG)
- House name input (with validation — unique, 2-30 chars, alphanumeric + spaces + `& ( ) -`)
- Reset to Default button

**Reset Confirmation:** Text input requiring the user to type the exact house name to confirm reset. Restores default name and clears emblem.

**Save:** Commits name and emblem to `schools.houses` JSON.

---

## 5. Default Houses

The system seeds four houses automatically when the school account is created. These houses carry pre-set names, pre-uploaded colour emblems, and no staff assignments.

| House Slot | Default Name | Default Emblem |
|---|---|---|
| House 1 | Red House | Red emblem (pre-uploaded) |
| House 2 | Blue House | Blue emblem (pre-uploaded) |
| House 3 | Green House | Green emblem (pre-uploaded) |
| House 4 | Yellow House | Yellow emblem (pre-uploaded) |

The Principal or Master Admin may rename these and change their emblems at any time. The defaults are fully functional from day one without requiring any setup. Resetting a house restores it to the default name and default pre-uploaded emblem listed above.

---

## 6. Editing a House

The Edit button on each house card opens an Edit Mode scoped to that individual house. Only one house can be in Edit Mode at a time. If the user attempts to open Edit Mode on a second house while another is already in Edit Mode, the system prompts: *"You have unsaved changes in [House Name]. Save or discard them before editing another house."*

All changes within Edit Mode follow a **Stage-and-Commit** flow: changes are staged locally and only committed to the database when the user clicks **Save**. Clicking **Cancel** discards all staged changes with no confirmation required (since no data has been written yet).

Changes to house name and house emblem go live instantly across all parts of the app the moment they are saved — the Student Module dropdowns, Staff Profile, and any other consumer reflect the updated name and emblem without requiring a page reload.

### 6.1 Renaming the House

- A text input field pre-filled with the current house name.
- The name is validated on Save (see Section 12 for validation rules).
- On successful save, the house card and all downstream consumers update immediately with the new name.
- The rename is logged with WHO, WHEN, WHAT (old name → new name).

### 6.2 Changing the House Emblem

- In Edit Mode, the house emblem is directly clickable. Clicking the emblem opens the device's file picker to upload a custom image.
- Accepted file formats: JPG, PNG, SVG. Maximum file size to be defined by engineering.
- Once uploaded, the new image is shown as a live preview in place of the current emblem before Save is clicked.
- The uploaded emblem replaces the previous one on Save.
- The emblem change goes live instantly across all consumers on Save.
- If no custom image has been uploaded, the house continues to show its default pre-uploaded colour emblem (R / B / G / Y as applicable).
- To remove a custom emblem and revert to the default, the user may use the Reset option (Section 8). There is no standalone "remove emblem" action.

---

## 7. Assigning Staff to Houses

> **All staff assignment functionality is in Role Manager → Houses Tab. This section documents the expected behavior for Role Manager, not My School.**

### 7.1 Assigning from Role Manager

**Adding staff**
- A search input fetches staff from My Staff as the user types (minimum 1 character to trigger search).
- Results show the staff member's name and all their current roles. If a staff member holds multiple roles, all roles are listed together (e.g. "Class Teacher · Coordinator").
- Staff already assigned to this house are shown with a checkmark and cannot be re-added.
- Staff assigned to a different house are shown with a label indicating their current house (e.g. "In Blue House"). Selecting such a staff member triggers the move prompt: *"[Staff Name] is currently in Blue House. This will move them to Red House. Proceed?"* On confirmation the move is staged; it is committed only on Save.
- Staff status (Active / Inactive) is shown beside each name in search results and in the assigned list, consistent with the Department and Wing Tab patterns.

**Removing staff**
- The currently assigned staff member is shown as a removable pill inside the edit panel.
- A × button removes the staff member from the house.
- Removing a staff member from a house does not affect their record in My Staff or their assignments in other modules.
- If the removed staff member was marked as Incharge, the Incharge designation is also cleared.

### 7.2 House Incharge

Each house may optionally have one staff member designated as its House Incharge.

**Designation (via Role Manager)**
- A "Set Incharge" button opens a staff picker.
- Only one staff member can be Incharge per house.
- The Incharge designation is a display label only in v1. It carries no additional permissions or access changes.

**Display**
- On the house card in My School Houses Tab, the Incharge badge appears with the staff member's name.
- On the staff member's profile in My Staff, their House Incharge status is shown as a read-only label.
- The Role Manager Houses Tab shows the Incharge name with an option to change or remove.

**Clearing Incharge**
- If the Incharge is removed from the house, the Incharge designation is automatically cleared.
- There is no minimum Incharge rule. A house may have zero Incharges.

### 7.3 Staff View

Toggling to **Staff View** in My School Houses Tab switches the layout from house cards to a staff-centric list.

- Each row shows: Staff Name and the House they are currently assigned to (or "Unassigned").
- Staff with no house assignment are shown with an "Unassigned" label.
- Editing of house assignments is done via Role Manager, not here.
- A search box in this view filters by staff name or house name.

---

## 8. Resetting a House

Houses cannot be deleted in v1. The count is fixed at four.

A **Reset** option is available inside Edit Mode for each house, accessible to both Principal and Master Admin. Resetting a house:

- Reverts the house name to its default name (Red House, Blue House, Green House, or Yellow House as applicable).
- Clears any custom emblem selection and restores the pre-uploaded default emblem for that house.
- Removes all staff assignments from that house (including the Incharge designation if set).

Reset requires a confirmation dialog:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Reset House?                                           │
├─────────────────────────────────────────────────────────────┤
│  "This will restore [House Name] to its default name and    │
│  emblem, and remove all staff assignments.                  │
│  This cannot be undone."                                    │
├─────────────────────────────────────────────────────────────┤
│  [Cancel]                    [Reset House]                  │
└─────────────────────────────────────────────────────────────┘
```

The reset action is logged. Removed staff members are not notified.

---

## 9. Sync with Other Modules

**Source of Truth Update (v2.0):** House staff assignment and House Incharge designation are now owned by **Role Manager**. The House Tab (SchoolPage) is entity management only — edit name/emblem, read staff display. All staff assignment goes through Role Manager.

**Systems of Record**
- **House name and emblem** — owned by House Tab (SchoolPage)
- **House staff assignment** — owned by Role Manager (via `house_staff` table)
- **House Incharge designation** — owned by Role Manager (via `house_incharges` table)
- Staff names and status are read from My Staff

**Downstream consumers**
- **My Staff / Staff Profile:** a staff member's current house assignment and Incharge status are shown as read-only labels on their staff profile in the My Staff module.
- **Role Manager:** writes house staff assignments and reads from here for display
- **Student Module:** student-to-house assignment is managed via the Student Form. The Student Module reads house names and emblems from the House Tab to populate its own assignment dropdowns.

**Two-way sync**
- House staff changes in Role Manager are immediately reflected in the House Tab (via shared `houses_staff` table)
- House Tab (SchoolPage) no longer edits staff assignments — only displays read-only

**Staff deletion cascade**
If a staff member is deleted from My Staff, they are automatically removed from their house assignment (via FK cascade or trigger). Their Incharge designation is also cleared. No Actor Replacement Protocol is triggered (houses have no minimum staff requirement). The deletion is noted in the House Log.

**Database note:** Houses are stored as JSON in `schools.houses` (names/emblems only). Staff assignment uses the `house_staff` table; Incharge designation uses the `house_incharges` table:
```sql
CREATE TABLE house_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name TEXT NOT NULL,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(house_name, staff_profile_id)
);

CREATE TABLE house_incharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_name TEXT NOT NULL,
  staff_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES profiles(id),
  UNIQUE(house_name, school_id)
);
```

---

## 10. Logs

A single **Log** button is available at the top right of the My School Houses Tab. It opens a panel showing the change history for house entity changes (rename, emblem change, reset).

**Log entry structure**
Each log entry records:
- **WHO** — the user who made the change (name and role).
- **WHEN** — date and timestamp.
- **HOUSE** — the house affected.
- **WHAT** — a plain-language description of the change (e.g. *"Red House renamed to 'Crimson House'"*, *"Eagle emblem assigned to Blue House"*, *"Yellow House reset to default"*).

**Staff assignment logs** (add, remove, incharge changes) are logged separately and can be viewed in Role Manager's log.

**Log visibility**
The Log is visible to Principal and Master Admin only.

**Log filtering**
The log panel includes a dropdown to filter entries by house name and a search box to filter by user name or action description.

---

## 11. Notifications

Notifications for house entity changes (rename, emblem, reset) are silent — logged only. Notifications for staff assignment, removal, and incharge changes are handled via Role Manager.

| Event | Recipient(s) |
|---|---|
| Staff assigned to a house | Staff member receives: *"You have been assigned to [House Name]."* |
| Staff moved to a different house | Staff member receives: *"You have been assigned to [New House Name]."* |
| House renamed | No notification — logged only |
| Emblem changed | No notification — logged only |
| Staff removed from house | No notification — logged only |
| Incharge assigned or cleared | No notification — logged only |
| House reset to default | No notification — logged only |
| Staff deleted from My Staff (removed from house) | No notification — logged only |

---

## 12. Validation Rules

| Rule | Value | Reason |
|---|---|---|
| **Max name length** | 30 characters | Fits comfortably in the card header and Student Module dropdowns without truncation. |
| **Min name length** | 2 characters | Prevents accidental single-character house names. |
| **Name uniqueness** | Case-insensitive | "Red House" and "red house" are the same. Block on save with error: *"This house name is already in use."* |
| **Character set** | Alphanumeric + spaces + `&` `-` `(` `)` | Allows "Red & Gold House" and "House (Senior)". Blocks emoji and special characters. |
| **Trimming** | Auto-trim leading/trailing spaces | " Blue House " → "Blue House" on blur. |
| **Emblem upload** | JPG, PNG, SVG accepted | Standard web-safe image formats. Max file size to be defined by engineering. |
| **Emblem** | Optional custom upload | A house may be saved without uploading a custom emblem. The default pre-uploaded colour emblem remains active. |
| **Staff per house** | One staff member at a time | A staff member belongs to only one house. Moving to a new house removes them from the old one after confirmation. |

---

## 13. Future Scope

The following items are acknowledged as future work and are explicitly out of scope for v1:

- **Student-to-house assignment from the House Tab** — v1 handles only staff assignment. Student house allocation is managed via the Student Form. Future versions may add a unified house management view.
- **House points and leaderboard** — a house points system (earned via events, competitions, or teacher awards) is planned for a future version.
- **House Captain, Head Boy, Head Girl, and other student leadership roles** — designating students to house leadership positions within the house structure is planned for a future version.
- **More than four houses** — v1 is fixed at four. Future versions may allow schools to configure the number of houses.
- **House-level permissions** — in v1, house membership and Incharge status carry no functional permissions. Future versions may use house assignment for scoping events, timetables, or reports.
- **House archive / inactive state** — v1 has only active houses and a reset option. Soft deactivation without losing history is planned for a future version.
- **Emblem management** — v1 supports uploading a custom image per house. Future versions may add an emblem library, cropping tool, or aspect ratio enforcement.

---

## 14. Open Questions (Resolved)

The following questions were raised during design and have been resolved.

| # | Question | Resolution |
|---|---|---|
| 1 | Should house assignment appear on the Staff creation form in My Staff, or remain exclusively in the House Tab? | **Exclusively in the House Tab.** Consistent with the Department Tab pattern which explicitly blocks staff-form assignment. |
| 2 | When a staff member is assigned to a house, should they receive an in-app notification? | **Yes.** Staff receive an in-app notification: *"You have been assigned to [House Name]."* |
| 3 | Should the Student Module's house dropdowns update in real time when a house is renamed? | **Always.** House name and emblem changes propagate instantly to all consumers including the Student Module on Save. |
| 4 | Is there a maximum number of staff that can belong to one house? | **No cap.** Each staff belongs to only one house at a time, but each house can hold any number of staff members. |
| 5 | Should the Reset option be available to Principal only, or to both Principal and Master Admin? | **Both Principal and Master Admin** — consistent with all other tabs in My School. |

---

## 15. Informal Notes / Raw Context

// House is the tab in My School to edit the default houses and segregate staff among the houses.
// Emblem is changed by clicking the emblem in Edit Mode — opens file picker to upload a custom image (JPG/PNG/SVG). Default R/B/G/Y colour emblems shown until a custom image is uploaded.
// Four pre-seeded houses: Red, Blue, Green, Yellow — each with a pre-uploaded emblem. No setup required.
// A staff member can be assigned to only one house at a time. Moving to another house prompts confirmation.
// No minimum staff rule — a house with zero staff is valid.
// Student-to-house assignment is not part of this tab; it is managed via the Student Form.
// House tab is fully under the control of Principal and Master Admin. No other role can edit here.
// Houses cannot be deleted. A Reset option (available to both Principal and Master Admin) restores default name and emblem and removes all staff assignments.
// Staff View toggle shows a staff-centric list. House assignments can be edited from Staff View via a house dropdown per row.
// House Incharge is a display label only in v1 — shown as a badge on the card and on Staff Profile. No permissions attached.
// Changes to house name and emblem go live instantly everywhere on Save.
// Staff receive an in-app notification when assigned to a house. All other changes are logged only with no notification.
// If a staff member is deleted from My Staff, they are removed from their house assignment and Incharge status silently. Logged in House Log.
// Summary panel at the bottom of each card shows: staff (total, male, female), students (total, boys, girls), wing-wise student breakdown (total, boys, girls per wing), and House Incharge name.
