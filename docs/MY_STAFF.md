# My Staff — Feature Specification
### Module: My Staff (Staff Directory & Identity Management)
### Version: 1.0
### Status: Ready for Implementation
### Cross-References: STAFF_FORM.md, ROLE_MANAGER.md, AUTH.md, ATTENDANCE.md, ONBOARDING.md

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Module Boundaries](#2-module-boundaries)
3. [Access & Permissions](#3-access--permissions)
4. [UI Layout — Directory View](#4-ui-layout--directory-view)
   - 4.1 Header & Dynamic Stat Cards
   - 4.2 Filter Bar
   - 4.3 Dynamic Table
   - 4.4 Column Picker & Concatenation
   - 4.5 Bulk Actions Toolbar
   - 4.6 Recent Bulk Actions Panel
5. [Table Columns Specification](#5-table-columns-specification)
   - 5.1 Fixed Columns
   - 5.2 Dynamic Columns
   - 5.3 Column Picker Rules
6. [Row Actions & Inline Editing](#6-row-actions--inline-editing)
7. [Staff Form Overlay](#7-staff-form-overlay)
8. [Navigation & Deep-Linking](#8-navigation--deep-linking)
9. [Pending Profiles Tab](#9-pending-profiles-tab)
10. [Single Staff Creation](#10-single-staff-creation)
11. [Bulk Operations](#11-bulk-operations)
    - 11.1 Quick Staff Enrollment
    - 11.2 Bulk Full Import
    - 11.3 Export to Excel / PDF
    - 11.4 Bulk ID Card ZIP Export
    - 11.5 Recent Bulk Actions & Revert
12. [Cross-Module Integration](#12-cross-module-integration)
13. [Responsive Behavior](#13-responsive-behavior)
14. [Data Persistence & State](#14-data-persistence--state)
15. [Validation & Error Handling](#15-validation--error-handling)
16. [Future Scope](#16-future-scope)

---

## 1. Overview & Philosophy

**My Staff** is the school's single source of truth for staff identity data. It is a directory-first, action-second interface: the table is for discovery and reporting; deep edits happen in the **Staff Form**; role and permission edits happen in the **Role Manager**.

**Core Principles:**
- **CRUD of identity only.** Role assignment, wing/class/department membership, and subject allocation are owned by other modules and surfaced here as read-only filters or columns.
- **Dynamic reporting.** The user decides which data points appear as columns. The table adapts to the viewer's needs.
- **Stats reflect reality.** Stat cards count the currently filtered cohort, not the global database.
- **No duplicate permission hubs.** Role Manager (Home Screen card) remains the canonical place to edit roles. My Staff links there.

---

## 2. Module Boundaries

| Concern | Owned By | Consumed In My Staff As |
|---|---|---|
| Staff identity (name, contact, DOB, address, payroll, bank, documents) | **My Staff / Staff Form** | Read-write |
| Staff ID generation | **Staff Form** | Read-only display |
| Account status (Active / Inactive / Draft) | **My Staff / AUTH.md profiles.status** | Read-write toggle |
| Role assignment (Teacher, Admin, Coordinator, etc.) | **Role Manager** | Read-only badge + deep-link |
| Messenger Tag | **Role Manager** | Read-only display + inline quick-edit |
| Wing membership | **Wing Tab + automatic academic assignment membership** | Read-only filter + column |
| Department membership | **Department Tab** | Read-only filter + column |
| House membership | **House Tab** | Read-only filter + column |
| Subject Teacher / Class Teacher assignment | **Subject Tab / Role Manager** | Read-only filter + column |
| Attendance marking scope | **Attendance Register** | Not editable here |

---

## 3. Access & Permissions

| Action | Principal | Master Admin | Admin |
|---|---|---|---|
| View Directory | ✅ | ✅ | ✅ |
| View Staff Profile (Role Manager) | ✅ | ✅ | ✅ |
| Edit Staff Profile (Staff Form) | ✅ | ✅ | ❌ |
| Toggle Active / Inactive | ✅ | ✅ | ❌ |
| Delete Staff | ✅ | ✅ | ❌ |
| Reset PIN / Unlock OTP | ✅ | ✅ | ❌ |
| Download ID Card (single) | ✅ | ✅ | ✅ |
| Print Appointment Letter | ✅ | ✅ | ❌ |
| Quick Staff Enrollment | ✅ | ✅ | ❌ |
| Bulk Full Import | ✅ | ✅ | ❌ |
| Export Excel / PDF | ✅ | ✅ | ✅ |
| Bulk ID Card ZIP | ✅ | ✅ | ❌ |
| Revert Bulk Action | ✅ | ✅ | ❌ |
| Edit Messenger Tag (inline) | ✅ | ✅ | ❌ |
| Add/Remove Dynamic Columns (sensitive) | ✅ | ✅ | ❌ |
| Add/Remove Dynamic Columns (non-sensitive) | ✅ | ✅ | ✅ |

**Admin View Restriction:** Admin sees only non-sensitive dynamic columns. Sensitive fields (salary, PAN, Aadhar, bank details, emergency contacts, personal email, full address) are hidden from the column picker and never rendered.

---

## 4. UI Layout — Directory View

### 4.1 Header & Dynamic Stat Cards

Five stat cards span the top of the page. Each card updates dynamically to reflect the **currently filtered cohort**, not the global school total.

| Card | Icon | Color | Value | Click Behavior |
|---|---|---|---|---|
| **Total Staff** | Users | Purple | Count of all staff matching active filters | Clears all filters; shows full directory |
| **Active** | CheckCircle | Green | `status = Active` in filtered set | Applies `Status = Active` filter |
| **Inactive** | XCircle | Grey | `status = Inactive` in filtered set | Applies `Status = Inactive` filter |
| **Draft** | FileEdit | Amber | `status = Draft` in filtered set | Applies `Status = Draft` filter |
| **Departments** | Building | Blue | Distinct department count in filtered set | Informational only (no filter toggle) |

**Rules:**
- On first load with no filters, cards show global counts.
- When any filter is applied, all five cards recalculate against the filtered subset.
- Clicking Active/Inactive/Draft toggles that status filter chip. Clicking again removes it.
- If the filtered result is zero, the card shows `0` and remains clickable.

### 4.2 Filter Bar

A sticky horizontal bar below the stat cards.

**Layout (left to right):**
```
[Search: Name, Email, or Staff ID...]  [Role ▼]  [Department ▼]  [House ▼]  
[Wing ▼]  [Subject ▼]  [Employment Type ▼]  [Status ▼]  [Joined Year ▼]  
[Profile Completion ▼]  [Sort ▼]  [Column Picker ⚙️]  [Clear All]
```

**Filter Behaviors:**

| Filter | Type | Source | Behavior |
|---|---|---|---|
| Search | Text input | Staff Form Stage 1 | Debounced 300ms. Matches Name, Email, Staff ID, Login Mobile. Max 5 scrollable suggestions. |
| Role | Multi-select chips | Role Manager | Teacher, Class Teacher, Coordinator, Admin, Dept Incharge, Master Admin, Activity Staff. OR logic. |
| Department | Multi-select chips | Department Tab | Reads `department_staff` table. |
| House | Multi-select chips | House Tab | Reads `house_staff` table. |
| Wing | Multi-select chips | Wing Tab + academic assignments | Reads wing-owned coordinator/activity staff plus automatic Subject Teacher/Class Teacher wing membership. |
| Subject | Multi-select chips | Subject Tab / Role Manager | Reads shared Subject Teacher assignments. |
| Employment Type | Multi-select chips | Staff Form Stage 1 | Permanent, Probation, Contract, Part-Time, Guest, Substitute. |
| Status | Single-select toggle | Staff Form / Profiles | Active · Inactive · Draft. Default: Active + Inactive (Draft excluded). |
| Joined Year | Multi-select chips | Staff Form Stage 1 | Derived from Date of Joining. |
| Profile Completion | Single-select | Computed | < 70% · ≥ 70% · 100%. |
| Sort | Single-select | — | Name A–Z (default), Name Z–A, Staff ID Asc, Staff ID Desc, Joined Date Newest, Joined Date Oldest, Profile Completion High–Low. |

**Active Filter Chips:** A chip row always appears below the filter bar showing current selections. Each chip has an individual ✕. A **Clear All** chip appears when any non-default filter is active.

**Cascade Rules:** Filters operate on OR logic within the same category and AND logic across categories. Example: `Role = Teacher OR Coordinator` AND `Department = Academics`.

### 4.3 Dynamic Table

The table is the core of the directory.

**Layout:**
- First 4 columns (Staff, Staff ID, Messenger Tag, Role) are **left-pinned** and do not scroll horizontally.
- Remaining fixed columns (Status, Joined, Actions) scroll with the table unless the viewport is wide enough.
- Dynamic columns added by the user appear to the right and are **horizontally scrollable**.
- Column widths are resizable via drag handles.
- Row height is fixed at 64px (desktop) / 72px (mobile).

**Selection:**
- Hover on desktop reveals a checkbox in the leftmost gutter.
- "Select Multiple" button in the header toggles checkbox visibility on mobile.
- Header checkbox selects all visible rows in the current filtered view.
- Shift-click range selection is supported.

**Empty States:**
- No staff in school: "No staff records found. Add your first staff member." + [+ Add Staff] CTA.
- Filters return zero results: "No staff match the current filters." + [Clear All].
- No dynamic columns selected (unlikely): Table shows only fixed columns.

### 4.4 Column Picker & Concatenation

**Column Picker Button:** Gear icon (⚙️) at the right end of the filter bar. Opens a dropdown panel.

**Panel Layout:**
```
┌─────────────────────────────────────────┐
│  Fixed Columns (non-removable)          │
│  ☑ Staff  ☑ Staff ID  ☑ Messenger Tag   │
│  ☑ Role  ☑ Status  ☑ Joined  ☑ Actions  │
│                                         │
│  Dynamic Columns                        │
│  [Search fields...]                     │
│                                         │
│  Personal Info                          │
│  ☐ Gender  ☐ DOB  ☐ Blood Group        │
│  ☐ Father/Husband Name  ☐ Category       │
│                                         │
│  Employment                             │
│  ☐ Employment Type  ☐ Pay Scale         │
│  ☐ Basic Salary*  ☐ Gross Salary*       │
│                                         │
│  Contact & Address                      │
│  ☐ Local Address  ☐ Permanent Address   │
│  ☐ Emergency Contact                    │
│                                         │
│  Qualifications                         │
│  ☐ Highest Degree  ☐ Total Experience  │
│                                         │
│  Documents                              │
│  ☐ PAN Status  ☐ Aadhar Status          │
│                                         │
│  [+ Create Merged Column]               │
└─────────────────────────────────────────┘
```
\* Hidden from Admin role.

**Adding a Column:**
- Clicking a checkbox immediately adds the column to the right of the table.
- The table auto-scrolls to reveal the new column.
- Duplicate selections are prevented.

**Removing a Column:**
- Unchecking hides the column immediately.
- Data is not lost; re-checking restores it in the same position.

**Concatenation (Merged Columns):**
- Clicking **[+ Create Merged Column]** opens a sub-panel.
- User selects **2 or more** fields.
- Chooses delimiter: **Space · Comma · Hyphen · Pipe · Custom**.
- Custom delimiter: free text, max 3 characters.
- Column header auto-generated: "City — State" or user-editable inline.
- Merged columns sort alphabetically by the merged string value.
- Merged columns export as a single column.

**Example Merged Columns:**
- "City — State" = "Bhopal, MP"
- "Name — Staff ID" = "Rajesh Kumar · E26IIS0001"
- "Basic — Gross Salary" = "₹45,000 / ₹62,000"

**Persistence:**
- Column selections (including merged columns, delimiters, and custom headers) are saved to `localStorage` immediately.
- On login, the system syncs `localStorage` state to the database (`user_table_preferences` table).
- If DB state exists and differs from `localStorage`, **DB wins** on login.
- If offline, `localStorage` wins; syncs on next connection.

### 4.5 Bulk Actions Toolbar

Appears **below the filter bar** when one or more rows are checked.

```
┌─────────────────────────────────────────────────────────────┐
│  [3 selected]  [Export Excel]  [Export PDF]  [Download ID Cards (ZIP)]  │
└─────────────────────────────────────────────────────────────┘
```

**Rules:**
- **Export Excel / PDF:** Exports exactly the visible columns (fixed + dynamic + merged) for the **selected rows only**. If no rows are checked but the toolbar is somehow triggered, exports the full filtered view.
- **Download ID Cards (ZIP):** Generates A6 PDFs per `STAFF_FORM.md` §ID Card Generation for each selected staff. Zipped server-side.
- No bulk Mark Inactive. No bulk Delete.
- Toolbar dismisses when all checkboxes are cleared or when "Clear Selection" is clicked.

### 4.6 Recent Bulk Actions Panel

Located at the bottom of the directory page, collapsible.

| Date | User | Mode | Count | Status | Revert Timer |
|---|---|---|---|---|---|
| 17 May 2026, 09:15 | Admin A | Quick Enrollment | 40 | Success | [Revert] (1h 45m left) |
| 16 May 2026, 11:30 | Admin B | Bulk Full Import | 12 | Success | — |

**Revert Rules (per `STAFF_FORM.md`):**
- Revert button available for **2 hours** after creation.
- After 2 hours, Revert disappears.
- Clicking Revert shows confirmation: *"This will permanently delete [X] records. Staff IDs [E26IIS0001 – E26IIS0040] will be released back to the pool. Confirm?"*
- Revert deletes the batch and releases IDs.

---

## 5. Table Columns Specification

### 5.1 Fixed Columns (Non-Removable)

| # | Column | Content | Source | Width | Notes |
|---|---|---|---|---|---|
| 1 | **Staff** | Avatar initials (40px circle) + Full Name (bold) + Login Mobile (caption, muted) | Staff Form Stage 1 | 240px | Avatar auto-generated from initials if no photo uploaded. |
| 2 | **Staff ID** | `E26IIS0001` | Auto-generated | 140px | Monospace font. Click to copy. |
| 3 | **Messenger Tag** | e.g. "PGT Mathematics" | Role Manager | 180px | Inline-editable. See §6. |
| 4 | **Role** | Academic / Non-Academic / Both / — | Role Manager | 140px | Computed badge. See classification logic below. |
| 5 | **Status** | Active (purple) / Inactive (grey) / Draft (amber) | Staff Form / Profiles | 120px | Pill badge with dot indicator. |
| 6 | **Joined** | `10 Mar 2019` | Staff Form Stage 1 | 120px | Date of Joining. |
| 7 | **Actions** | View · Edit · More ▼ | — | 120px | See §6. |

**Role Classification Logic:**
```
Academic Group    = {Teacher, Class Teacher, Coordinator, Activity Staff}
Non-Academic Group = {Admin, Department Incharge, Master Admin}

IF (any Academic role present) AND (any Non-Academic role present)  → "Both"
ELSE IF (any Academic role present)                                  → "Academic"
ELSE IF (any Non-Academic role present)                             → "Non-Academic"
ELSE                                                                  → "—"
```

**Status Badge Colors:**
- Active: `bg-purple-100 text-purple-800` (purple dot)
- Inactive: `bg-gray-100 text-gray-800` (grey dot)
- Draft: `bg-amber-100 text-amber-800` (amber dot)

### 5.2 Dynamic Columns (Addable/Removable)

**Available to Principal & Master Admin:** All Stage 1–4 fields.

| Category | Fields |
|---|---|
| Personal Info | Gender, Date of Birth, Age, Blood Group, Category, Subcaste, Religion, Mother Tongue, Marital Status, Spouse Name, Father/Husband Name |
| Contact | Primary Mobile, Secondary Mobile, Official Email, Personal Email*, Emergency Contact Name, Emergency Contact Number, Emergency Contact Relation |
| Address | Local Address (concatenated), City/Village, District, State, PIN Code, Permanent Address* |
| Employment | Employment Type, Post Applied For, Area of Specialization, Date of Joining, Probation End Date, Contract End Date, Pay Scale/Grade, Basic Salary, HRA, DA, Special Allowance, Gross Salary, Last Salary Drawn |
| Bank & Statutory | Bank Name, Bank Account Number, IFSC Code, PAN Number, Aadhar Number, EPF Enrolled, ESI Number |
| Qualifications | Highest Degree, Total Work Experience (computed), Number of Qualifications |
| Documents | Appointment Letter (Yes/No), Experience Certificate (Yes/No), PAN Card (Yes/No), Aadhar Card (Yes/No), Police Verification (Yes/No), Medical Fitness (Yes/No) |
| Skills | Computer Proficiency, Languages Known, Hobbies |
| Transport | Opted for Transport (Yes/No), Bus Route, Bus Stop |

\* Marked as sensitive — hidden from Admin column picker.

**Available to Admin:** Non-sensitive subset only.
- Gender, DOB, Age, Blood Group, Category, Religion, Mother Tongue, Marital Status
- Primary Mobile, Official Email
- City/Village, District, State, PIN Code
- Employment Type, Post Applied For, Area of Specialization, Date of Joining
- Highest Degree, Total Work Experience, Number of Qualifications
- Computer Proficiency, Languages Known, Hobbies
- Opted for Transport, Bus Route, Bus Stop

### 5.3 Column Picker Rules

- Maximum dynamic columns: **20** (to prevent performance degradation).
- Concatenated columns count as **1** toward the limit.
- If a user hits the limit, remaining checkboxes are disabled with tooltip: *"Maximum 20 dynamic columns allowed. Remove a column to add more."*
- Column order: Fixed columns first, then dynamic columns in the order they were added. User can reorder dynamic columns via drag handles in the column picker panel.
- Column widths default to **140px** (text) or **180px** (merged). User can resize.

---

## 6. Row Actions & Inline Editing

### 6.1 Row Actions

Each row has three visible actions and a **More** dropdown:

| Action | Icon | Behavior | Visible To |
|---|---|---|---|
| **View** | Eye | Opens Role Manager pre-filtered to this staff | All |
| **Edit** | Pencil | Opens Staff Form overlay in read-only mode | Principal, Master Admin |
| **More ▼** | ChevronDown | Dropdown menu | Context-aware |

**More ▼ Menu Items:**

| Item | Visible To | Behavior |
|---|---|---|
| Download ID Card | All | Generates A6 PDF per `STAFF_FORM.md`. |
| Print Appointment Letter | Principal, Master Admin | Generates letter from template. |
| Reset PIN | Principal, Master Admin | Triggers OTP → forces PIN reset on next login (per `AUTH.md`). |
| Mark Inactive / Activate | Principal, Master Admin | Toggles `profiles.status`. Cascade checks for dependencies. |
| Delete | Principal, Master Admin | Opens cascade confirmation dialog. |

**Cascade Checks for Mark Inactive / Delete:**
Before allowing the action, the system checks:
1. Is this staff a **Class Teacher** of any section? → Block: *"[Name] is Class Teacher of [Class-Section]. Reassign in Role Manager before deactivating."*
2. Is this staff the **sole Coordinator** of any wing? → Block: *"[Name] is the only Coordinator of [Wing]. Assign a replacement in Wing Tab before deactivating."* (per `ROLE_MANAGER.md` §3.3 Actor Replacement Protocol)
3. Is this staff the **sole Department Incharge**? → Block: *"[Name] is the only Incharge of [Department]. Assign a replacement in Department Tab before deactivating."*
4. Is this staff a **House Incharge**? → Block: *"[Name] is House Master of [House]. Reassign in House Tab before deactivating."*

If all checks pass, a confirmation dialog appears. On confirm, status toggles or deletion proceeds.

### 6.2 Delete

- **Mode:** hard delete (purge). No archive, no 30-day wait. Allowed from any status (active/inactive).
- **Server-side:** `delete-staff` edge function (`supabase/functions/delete-staff/index.ts`). Re-runs all 4 cascade checks before deleting.
- **UI:** shared `DeleteStaffDialog` (`src/components/my-staff/DeleteStaffDialog.tsx`).
- **Authorisation:** Principal or Master Admin in same school. Superadmin can delete from any school. Self-delete blocked.
- **Spec:** [STAFF_DELETION.md §1–§4](STAFF_DELETION.md).

### 6.3 Inline Editing — Messenger Tag

The **Messenger Tag** column supports inline quick-editing directly in the table.

**Interaction:**
- Hover over the Messenger Tag cell → pencil icon appears on the right.
- Click pencil or double-click the cell → cell becomes an inline text input.
- Input is pre-filled with current value.
- Press **Enter** or blur → saves.
- Press **Escape** → cancels.
- While typing, a small "Saving..." spinner appears. On error, cell reverts and shows a toast.

**Validation:**
- Max 50 characters.
- Empty string is allowed (clears the tag).
- On save, writes directly to Role Manager data store.
- Success toast: *"Messenger Tag updated for [Name]."*

**Why this is acceptable:** Messenger Tag is a display label with no cascading permission effects. It is safe to edit from the directory view. All other role/permission fields remain editable only in Role Manager.

---

## 7. Staff Form Overlay

Clicking **Edit** from the row actions opens the Staff Form in a **full-screen overlay** (Option C).

**Overlay Behavior:**
- Covers the full viewport on desktop (modal overlay with dimmed directory behind).
- On mobile, pushes a new full-screen page (since the directory is already full-width).
- Header: Staff Name + Staff ID + [✕ Close].
- **Default mode: Read-only.**
- A prominent **[Edit Profile]** toggle button in the top-right switches the form to edit mode.
- Edit mode shows all four stages with validation, draft auto-save, and submit.
- Read-only mode shows all data in a clean, sectioned layout (no input borders).
- **Cancel / Discard:** If dirty in edit mode, prompt: *"Discard unsaved changes?"*

**Permissions:**
- Principal & Master Admin: Read-only → Edit toggle available.
- Admin: Read-only only. Edit toggle is hidden. They can view but not modify.

**Deep Linking:**
- URL updates to `/my-staff/:staffId` (optional, for refresh recovery).
- Closing the overlay returns to the directory with previous filters intact.

---

## 8. Navigation & Deep-Linking

| User Intent | Entry Point | Destination | State |
|---|---|---|---|
| View staff roles & permissions | My Staff → View (Eye icon) | Role Manager (Home Screen card) | Pre-filtered to staff. Role Manager opens with this staff's card expanded or auto-selected. |
| Edit staff identity data | My Staff → Edit (Pencil icon) | Staff Form Overlay | Read-only first, toggle to edit. |
| View staff from Attendance Register | Attendance → Click staff name | Role Manager (same as above) | Reusable Profile Drawer component (see discussion). |
| View staff from House Tab | House → Click staff name | Role Manager | Same reusable component. |
| View staff from Wing Tab | Wing → Click staff name | Role Manager | Same reusable component. |

**Reusable Profile Drawer:** A shared component used across Attendance, House, Wing, and Department tabs. It shows:
- Avatar, Name, Staff ID, Messenger Tag, Status
- Quick contact buttons (Call, Message via Messenger)
- **[View Full Profile in My Staff]** link
- **[View Roles in Role Manager]** link

This drawer is **read-only everywhere outside My Staff**.

---

## 9. Pending Profiles Tab

A secondary tab next to the main directory:

```
[Directory] [Pending Profiles] [Inactive Staff]
```

**Pending Profiles Tab:**
- Shows only **Draft** staff (Stage 1 saved but not submitted).
- Columns: Staff (avatar + name), Last Edited, Profile Completion %, Missing Required Fields (count), Actions.
- Actions: **[Resume]** (opens Staff Form at last saved stage) · **[Delete Draft]**.
- No checkboxes, no bulk actions.
- No stat cards (or simplified: Total Drafts only).

**Inactive Staff Tab:**
- Shows only **Inactive** staff.
- Same columns as main directory.
- Actions: **[Reactivate]** (toggles to Active immediately, no cascade check if already de-assigned) · **[View Profile]** · **[Delete Permanently]**.
- Delete permanently removes the record and releases the Staff ID after 30 days of inactive status (configurable).

**Default Tab:** Directory (Active + Inactive). Draft is excluded from the default view to keep the directory clean.

---

## 10. Single Staff Creation

**Location:** Header button, rightmost position. Label: **+ Add Staff**.

**Behavior:**
- Opens Staff Form Overlay in create mode (Section 1).
- 5-section wizard: Identity → Employment Setup → Address & Contact → Qualifications → Compliance & Payroll.
- Section 1 is minimum required — Staff ID auto-generated via Reserve-Release, account activated immediately.
- Sections 2–5 can be completed later. Profile completion starts at ~35% after Section 1, reaches 100% when all sections done.
- Section 1 fields lock after Staff ID creation. Principal can unlock via "Edit Core Identity" button with confirmation.
- On success, overlay closes and directory refreshes with new staff visible.

**Permissions:** Principal, Master Admin only. Admin cannot add staff.

---

## 11. Bulk Operations

## 11. Bulk Operations

### 11.1 Quick Staff Enrollment

**Location:** Header button, left of **+ Add Staff**. Label: **Quick Enroll**.

**Behavior:**
- Opens a dialog: Upload Excel (12 columns) + Download Template + Specimen.
- Per `STAFF_FORM.md` §Quick Staff Enrollment.
- 12 mandatory columns: first_name, last_name, father_first_name, father_middle_name, father_last_name, middle_name, gender, date_of_birth, login_mobile, plus 3 auto-defaulted fields.
- Auto-assigns Staff IDs via Reserve-Release.
- Review & Confirm page before commit.
- Success: staff created as Active, profile completion ~30% (Stage 1 only).

### 11.2 Bulk Full Import

**Location:** Header button. Label: **Bulk Import**.

**Behavior:**
- Opens a dialog: Upload Excel (all Stage 1 + Stage 2 fields) + Download Template + Specimen.
- Per `STAFF_FORM.md` §Bulk Full Import.
- Strict validation, no auto-defaults.
- Review & Confirm page.
- Success: profile completion ~70% (Stages 1 + 2).

### 11.3 Export to Excel / PDF

**Location:** Bulk Actions Toolbar (requires row selection).

**Behavior:**
- Exports **exactly the visible columns** (fixed + dynamic + merged) for selected rows.
- Excel: Raw values, color-coded status badges, auto-filter enabled on header row.
- PDF: Tabular format, A4 Landscape if >8 columns, A4 Portrait if ≤8 columns. School header on each page.
- File naming: `Staff_Directory_[Date]_[SchoolAcronym].xlsx` or `.pdf`
- If no rows selected but toolbar triggered, exports full filtered view.

### 11.4 Bulk ID Card ZIP Export

**Location:** Bulk Actions Toolbar (requires row selection).

**Behavior:**
- Generates A6 PDF ID cards per `STAFF_FORM.md` for each selected staff.
- Zips into single download.
- File naming: `ID_Cards_[Count]_[Date].zip`

### 11.5 Recent Bulk Actions & Revert

See §4.6. Panel is shared between Quick Enrollment and Bulk Full Import.

---

## 11. Cross-Module Integration

My Staff consumes read-only data from other modules for filtering and display. It does not write to these modules except for the Messenger Tag inline edit.

| Module | Data Consumed | Filter/Column | Sync Trigger |
|---|---|---|---|
| **Role Manager** | `messenger_tag`, role assignments | Messenger Tag column, Role filter, Role column | Real-time via shared DB table. Messenger Tag write-back is immediate. |
| **Wing Tab** | Wing names, coordinator assignments, activity staff assignments, automatic teacher membership from academic assignments | Wing filter, dynamic column "Wing" | On page load / refresh. |
| **Department Tab** | Department names, member assignments, incharge status | Department filter, dynamic column "Department" | On page load / refresh. |
| **House Tab** | House names, staff assignments, incharge status | House filter, dynamic column "House" | On page load / refresh. |
| **Subject Tab / Role Manager** | Subject Teacher and Class Teacher assignments | Subject filter, dynamic column "Subjects Taught", role badges, class responsibility display | Real-time shared assignment state. |
| **Staff Form** | All identity fields | All dynamic columns, search, sort | Real-time (same module). |
| **AUTH.md** | `profiles.status` (Active/Inactive) | Status filter, Status column | Real-time via `profiles` table. |
| **Attendance Register** | Not consumed directly. Staff list is the upstream source for Attendance. | — | My Staff is the system of record for staff existence. |

**Integration Rules:**
- If a staff is deleted in My Staff, they are automatically removed from all downstream modules (Wing, House, Department, Role Manager, Attendance). Cascade warnings block deletion if dependencies exist.
- If a staff is marked Inactive, they remain visible in filters but cannot log in. Their role assignments are preserved but non-functional.
- If a staff is in Draft, they do not appear in any downstream module. No Wing, House, Department, or Role assignment is possible until submitted.

---

## 12. Responsive Behavior

| Breakpoint | Layout |
|---|---|
| **Desktop (>1280px)** | Full table. All fixed columns visible. Dynamic columns scroll horizontally. Column picker as dropdown. Stat cards in one row (5 cards). |
| **Tablet (768–1280px)** | Table condensed. Staff column shows avatar + name only (mobile hidden). Column picker as slide-up panel. Stat cards wrap (3 + 2). |
| **Mobile (<768px)** | Card view option toggle (table vs. cards). Cards show: Avatar, Name, Staff ID, Messenger Tag, Role, Status. Tap card opens Role Manager (View) or action sheet (Edit/ID Card/Delete). Column picker hidden (dynamic columns not supported in card view; defaults to fixed only). Stat cards become horizontally scrollable strip. |

**Card View (Mobile Alternative):**
- Toggle between **List** (table) and **Cards** (grid).
- Cards are 1-column, full-width.
- Each card shows fixed columns only.
- Tap card → action sheet: View Profile · Edit · Download ID Card · Call · Message.

---

## 13. Data Persistence & State

| State | Storage | Lifetime | Notes |
|---|---|---|---|
| Active filters | `localStorage` + DB (`user_filter_presets`) | Session + persistent | DB syncs on change. |
| Selected dynamic columns | `localStorage` + DB (`user_table_preferences`) | Persistent | DB wins on login conflict. |
| Column widths | `localStorage` only | Per-browser | Not synced. |
| Sort preference | `localStorage` + DB | Persistent | |
| Last active tab (Directory / Pending / Inactive) | `localStorage` | Persistent | |
| Row selection (checkboxes) | `sessionStorage` | Tab lifetime | Lost on refresh. |
| Scroll position | `sessionStorage` | Tab lifetime | Restored on back navigation. |

---

## 14. Validation & Error Handling

| Scenario | Error Message | Action |
|---|---|---|
| Admin attempts to add sensitive column | "You do not have permission to view this field." | Column disabled in picker. |
| Inline Messenger Tag > 50 chars | "Messenger Tag must be under 50 characters." | Truncate and warn. |
| Export with 0 selected rows | "Select at least one staff member to export." | Shake toolbar. |
| Bulk ID Card with >100 selected | "Maximum 100 ID cards per batch. Please select fewer staff." | Block and suggest filtering. |
| Mark Inactive blocked by dependency | "[Name] is Class Teacher of 7A. Reassign before deactivating." | Block, link to Role Manager. |
| Delete blocked by dependency | Same cascade checks as Inactive, plus: "This staff has payroll history. Deletion is archived, not purged." | Block or require Principal password re-entry. |
| Column picker at 20-column limit | "Maximum 20 dynamic columns reached." | Disable remaining checkboxes. |
| Merged column with incompatible types | Both cast to string. No error. | — |

---

## 15. Future Scope

- **Advanced filter presets:** Save named filter sets (e.g., "All Active Teachers in Senior Wing").
- **Column sharing:** Principal saves a column layout and pushes it as default for all Master Admins.
- **Bulk Mark Inactive:** After dependency auto-checking is robust.
- **Bulk Delete:** After archival/soft-delete logic is implemented.
- **Analytics dashboard:** Click-through from stat cards to pre-filtered analytics (e.g., "Active staff by Department" pie chart).
- **Print directory:** Physical print-optimized view of the current table.
- **Staff comparison:** Select 2–3 staff to compare side-by-side in the overlay.

---

## Cross-Reference Map

| This Document | References | Notes |
|---|---|---|
| Staff Form Stage 1–4 fields | `STAFF_FORM.md` | Canonical field definitions, validation rules, ID generation. |
| Role classification, Messenger Tag | `ROLES.md` | Role Manager owns the truth. My Staff consumes and writes back Messenger Tag only. |
| Active/Inactive status, PIN reset, login | `AUTH.md` | `profiles.status` is the system of record. |
| Wing membership filter | `ROLE_MANAGER.md` §3.3 | Read-only consumption. Role Manager owns coordinator/staff assignment; My School owns class↔wing. |
| House membership filter | `ROLE_MANAGER.md` §3.5 | Read-only consumption. Role Manager owns staff assignment; My School owns house name/emblem. |
| Department membership filter | `ROLE_MANAGER.md` §3.4 | Read-only consumption. Role Manager owns assignment; My School owns dept name/status. |
| Subject and Class Teacher assignment filter | `MY_SCHOOL.md`, `ROLE_MANAGER.md`, `INTEGRATION.md` | Read-only consumption. Subject Tab and Role Manager edit the same assignment state. |
| Attendance Register | `ATTENDANCE.md` | My Staff is upstream source for staff list. |
| ID Card generation | `STAFF_FORM.md` §ID Card Generation | A6 PDF spec lives in Staff Form. |
| Appointment Letter | `STAFF_FORM.md` §Appointment Letter Generation | Template and data source spec. |
| Bulk Import templates | `STAFF_FORM.md` §Bulk Operations | Quick Enrollment and Bulk Full Import definitions. |
| Actor Replacement Protocol | `ROLE_MANAGER.md` §3.4/§3.5, `STAFF_DELETION.md` | Cascade blocks on deactivation/deletion. |

---

## Document History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-05-20 | Initial unified spec consolidating directory view, dynamic table, column picker, bulk operations, and cross-module integration. |
