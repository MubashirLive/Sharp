# Attendance Register — Functional Specification

> Last updated: 2026-06-17
> Status: ✅ Built. Implemented in `src/pages/Attendance.tsx` (499 LOC) and `src/components/attendance/`. RLS on `attendance_register`, `attendance_period_marks`, `leave_requests`, `low_attendance_alerts`. 3-consecutive-absence auto-alert wired via `notify-consecutive-absence` (planned) and `school_calendar` 3-check gate.

## Build vs spec

| Spec area | Status | Notes |
|---|---|---|
| Class Teacher full-day mark | ✅ Built | Own class-section only |
| Class Teacher per-period mark | ✅ Built | School chooses mode at setup |
| Coordinator scope (wing) | ✅ Built | |
| Edit ≤24h with reason | ✅ Built | Class Teacher + Coordinator |
| Edit >24h needs admin override | ✅ Built | Principal/Master Admin/Admin |
| 3-consecutive-absence auto alert | ✅ Built | Stored in `low_attendance_alerts` |
| <75% profile flag | ✅ Built | |
| Student monthly calendar (G/R/Y) | ✅ Built | `src/pages/Attendance.tsx` student view |
| Student apply leave | ✅ Built | |
| Admin approve leave | ✅ Built | Class Teacher (own class) / Admin (any) |
| Admin class summary + export | ✅ Built | CSV export |
| School-wide view (Principal) | ✅ Built | |
| Holiday skip on bulk import | ✅ Built | Calendar-aware import |
| Period-wise vs full-day toggle | ✅ Built | Set per school at setup |

## 1. Role-Based Access & Permissions

### 1.1 Who Can Mark Attendance
- **Class Teacher** — can mark attendance for their own assigned class-section only.
- **Coordinator** — can mark attendance for their entire designated wing or all assigned classes.

### 1.2 Who Cannot Mark Attendance
- Principal, Master Admin, Teachers, and Departmental Incharges cannot mark attendance.
- The Attendance Card does not appear on their dashboards.

### 1.3 Attendance Card Behaviour by Role
| Role | Attendance Card Opens |
|---|---|
| Class Teacher | Full marking interface |
| Coordinator | Full marking interface |
| Principal / Master Admin / Departmental Incharge / Teacher | Attendance Register in view-only mode |

### 1.4 Dual-Role Staff — Class Teacher + Coordinator

When a staff member holds both the **Class Teacher** and **Coordinator** roles simultaneously:

**Dashboard Cards**
- Two Attendance Cards appear on the dashboard:
  1. **"My Class" Card** — pre-filled to their assigned class-section. Uses a 📘 class icon. Opens the full marking interface scoped to that class-section only.
  2. **"My Wing" Card** — pre-filled to their designated wing. Uses a 🏫 wing icon. Opens the full marking interface scoped to all classes within that wing.
- Both cards are independently clickable. The presence of one does not suppress the other.

**Menu Navigation (Attendance Register via Header)**
- When the user navigates to the Attendance Register via the main menu (not via a dashboard card), the filter bar defaults to the **Coordinator scope** (widest available).
- A persistent **Scope Toggle** appears below the filter bar:  
  `[ 👤 My Class: 7A ] ←→ [ 🏫 My Wing: Senior Wing ]`
- Clicking the toggle switches the entire filter cascade between the two scopes. The toggle is only visible to dual-role staff.
- The toggle state persists for the session but resets to "My Wing" on next login.

**Bulk Import Scope**
- The Bulk Import button validates against the **currently active scope** selected in the toggle.
- If the toggle is set to **My Wing**, the coordinator can import for any class-section within that wing.
- If the toggle is set to **My Class**, import is restricted to that single class-section.

**Analytics & Calendar View**
- The Calendar page shows a second scope selector if the user is dual-role.
- Default view is Coordinator scope (all classes in wing). User can narrow to "My Class only."

**Edit Window & Permissions**
- The 7-day edit window applies identically regardless of which role was used to mark attendance.
- A Class Teacher marking via the "My Wing" scope can still only edit within the 7-day window, same as if they marked via "My Class."

---

## 2. Attendance Marking Rules

### 2.1 Editing Window
- Once marked, attendance can be edited within **7 calendar days** from the date of marking — by the Class Teacher or the Coordinator.
- After 7 days, attendance is stored permanently and cannot be edited.

### 2.2 Holiday Handling
- Dates declared as holidays by the Principal or Master Admin in the school calendar **cannot** have attendance marked.
- If attendance was already marked and the date is later declared a holiday, that attendance entry is automatically removed.
- If a bulk import file (Excel) contains entries for holiday dates, those columns are **skipped** — the rest of the file is uploaded successfully.
- A post-upload summary report is shown to the user, for example: *"3 columns skipped — Jan 26, Mar 8, Apr 14 were holidays."*

### 2.3 Leave & Percentage
- Leave (L) does **not** count toward the Present percentage.

---

## 3. Attendance Register — Filters & Navigation

---

## 3. Attendance Register — Filters & Navigation

### 3.1 Filter Bar (in order)
**Wing → Class → Section → Date → Status → Search → Sort**

Active filter chip row is always visible below the filter bar.

| Filter | Behaviour |
|---|---|
| Wing | Toggle buttons fetched from the Wing tab in My School. An All button always appears first. Defaults to All on first load. Selecting a wing hides classes that do not belong to it — they disappear from the Class row entirely, keeping the row short and clean. |
| Class | Shows only classes within the selected wing, sorted numerically. Pre-filled with the last-used class. On first use, defaults to the first class in the list. When the wing changes, this row rebuilds — if the previously selected class does not exist in the new wing, resets to the first available class and cascades to Section accordingly. |
| Section | Shows only sections that exist for the selected class,fetched section name from Section and Classes, sorted A to Z. Pre-filled with the last-used section for that specific class. On first use, defaults to Section A. If the previously remembered section does not exist for a newly selected class, resets to Section A. If a class has no sections, this row is hidden and the class itself is the terminal selection. |
| Date | Placed immediately after Section. A Today shortcut button sets the date instantly and is the default. A calendar picker is available for any other single date. A Range toggle expands to a From / To picker for historical review. When a range spanning more than one day is active, bulk-mark and Mark/Edit buttons are disabled automatically, with a tooltip: "Bulk actions are unavailable for multi-day ranges." |
| Status | Toggle buttons: Present, Absent, Leave, Not Marked. Multiple statuses can be active simultaneously. No status selected means show all. |
| Search | Accepts Roll No., Student Name, or Father's Name. Shows up to 5 scrollable suggestions as the user types. Search operates within the already-filtered cohort — it does not override the cascade. |
| Sort | Alphabetical by student name ascending by default. Options: Name A–Z, Name Z–A, Roll No. ascending, Roll No. descending. Sort persists across sessions. |
| Active Filter Bar | A chip row always visible below the filter bar showing all current active selections — Wing, Class, Section, Date, Status. Each chip has an individual ✕ to remove that filter. A Clear All chip appears whenever any non-default filter is active. |

---

### 3.2 Cascade Rules

| Condition | What happens |
|---|---|
| Wing changes | Class row rebuilds to show only classes in that wing. If the previously selected class is not in the new wing, auto-selects the first available class and cascades to Section accordingly. |
| Class changes | Section row rebuilds to show only sections that exist for that class. If the previously remembered section is absent, defaults to Section A. |
| All Wings selected | Class row shows all classes across all wings, sorted numerically. Section row shows sections for whichever class is selected. |
| No sections in a class | Section row is hidden. The class itself is treated as the terminal selection. |

---

### 3.3 Role-Based Pre-fill

| Role | Behaviour |
|---|---|
| Class Teacher | Wing, Class, and Section are pre-filled automatically with their assigned class-section on every load. The filter remains editable — they can browse other sections if needed. A Back to my class shortcut resets to their assigned section instantly. |
| Coordinator | Wing is pre-filled with their designated wing. Class defaults to the first class in that wing. Section defaults to Section A of that class. They can freely navigate all classes and sections within their wing. |
| Master Admin | No pre-fill. Defaults to All Wings. Full access to all wings, classes, and sections with no restrictions. |
| Admin | No pre-fill. Defaults to All Wings. Same access as Master Admin for attendance viewing. Bulk-mark and edit permissions depend on admin-level configuration. |

## 4. List View

### 4.1 Table Structure
| Column | Details |
|---|---|
| Roll No. | Fixed column (does not scroll). |
| Student Name / Father's Name | Fixed column. Student name in large text; father's name in smaller text below. Both names shown together as duplicate student names may exist in a class. |
| Date Columns | Scrollable horizontally. Columns can be resized to fit more dates on screen. |

### 4.2 Marking Behaviour — Date Columns
- **Unmarked date** → shows a **Mark** button.
- Clicking Mark changes it to a **Save** button with an **✕ Cancel** button.
- **Save** is only enabled when all students have a value (P / A / L). If any student is unmarked, the button stays disabled.
- Unmarked students are visually highlighted so the teacher can identify who is missing.
- Clicking ✕ without saving any cells resets the column to blank (Mark button reappears). If at least one cell has been filled, the user can cancel without losing work — the column reverts to blank on page refresh.
- **Already marked date** → shows an **Edit** button at the top of the column.
- Clicking Edit changes it to a **Save** button with an **✕ Cancel** button, and makes all cells in that column editable.
- **Cell interaction:**
  - Single click → cycles Present → Absent.
  - Quick double-click → sets Leave.
  - A short usage guide is shown on screen so staff are familiar with these interactions.
- **On-screen guide text (example):** *"Click to toggle P/A. Double-click for Leave."*
- Saving attendance shows a confirmation: **Total / Present / Absent** counts.

### 4.3 Column-Level Bulk Mark Dropdown (inside each date column)
| Role | Options Available |
|---|---|
| Class Teacher | All Present, All Absent |
| Coordinator | All Present, All Absent, All Blank |

---

## 5. Grid View

### 5.1 Layout
- Displays student cards in a grid of 3, 4, or 5 columns depending on screen size.
- Each card shows: Roll No., Student Name (large), Father's Name.

### 5.2 Card Colours
| Colour | Status |
|---|---|
| Green | Present |
| Red | Absent |
| Yellow | Leave |

### 5.3 Behaviour
- In Grid View, the date filter accepts only a **single date** — not a range.
- Cell click behaviour is identical to List View (single click: P/A cycle; double-click: Leave).

---

## 6. Bulk Attendance Import (Coordinator Only)

### 6.1 Access
- The **Bulk Import** button appears for Coordinators only.
- Coordinators can only import attendance for their designated wings and classes.

### 6.2 Excel File Format
| Column | Content |
|---|---|
| Column 1 | Roll No. |
| Column 2 | Student Name |
| Column 3 | Class |
| Column 4 | Section |
| Column 5 | Month |
| Column 6 onwards | One column per date, values: **P**, **A**, or **L** only (no blanks, no lowercase) |

- Columns 3, 4, and 5 must have the same values repeated for every row until the last entry.

### 6.3 Import Flow
- Clicking **Import** opens a dialog box with: Upload field, Submit button, and a specimen/sample format for reference.
- The system either **accepts the entire file** or **rejects it entirely** — no partial row-level imports.
- Holiday columns are skipped; the rest of the file is imported. A post-upload summary reports which columns were skipped.

### 6.4 Overwrite Behaviour
- If a date already has attendance marked and the uploaded file also contains an entry for that date, a **confirmation prompt** is shown before overwriting.

---

## 7. Coordinator Notifications

- When a Class Teacher has not marked attendance, the **Coordinator receives an automatic notification** via the Messenger module's automatic message feature.

---

## 8. Analytics & Calendar View

- **Class Teacher** can see attendance analytics for their own class-section on the Calendar page.
- **Coordinator** can see analytics for their entire designated wing or assigned classes.

---

## 9. Export

### 9.1 Who Can Export
| Role | Export Scope |
|---|---|
| Principal / Master Admin | Entire school — all wings, all classes, all sections |
| Coordinator | Their designated wing and assigned classes only |
| Class Teacher / Teacher / Departmental Incharge | Cannot export. Export button not shown. |

### 9.2 Scope Filters Before Export

**Principal / Master Admin:**
- Wing (default: All) → Class (default: All, narrows by Wing) → Section (default: All, narrows by Class).
- Leaving all on "All" exports the entire school for the selected date range.

**Coordinator:**
- Scope is locked. Out-of-scope classes do not appear in filter dropdowns.
- A read-only label is displayed: *"Export limited to: Senior Wing — Class 9, 10, 11."*
- Filters shown: Class (limited to assigned classes) and Section (all sections within the selected class, or all sections across assigned classes if Class is left on All).

### 9.3 Date Range
- Mandatory date range with **Date From** and **Date To** fields.
- Default: first day of the current month to today.
- Future dates cannot be selected in the Date To field.
- Dates outside the current academic session cannot be selected.
- Minimum range: single day (both fields set to the same date).
- Maximum range: the full academic session (no artificial cap).

### 9.4 Export File Structure
**Header rows (same for Excel and PDF):**
- Row 1: School Name
- Row 2: Session (e.g. 2025–26), Class, Section, Date Range

**Data columns:**
| Column | Content |
|---|---|
| 1 | Roll No. |
| 2 | Student Name |
| 3 | Father's Name |
| 4 onwards | One column per date in the selected range |

**Date column headers:** Date number (DD) with the day initial below (M / T / W / T / F / S).

**Holiday dates:** Included as a column, cells show **H** and are visually distinct. No P / A / L values.

**Blank dates:** Dates with no attendance marked show empty cells.

**Summary row:** Last row shows the count of Present students for each date.

### 9.5 Format Differences

**Excel (.xlsx):**
- Raw P / A / L / H values in cells.
- Cell background colour-coded: Green = P, Red = A, Yellow = L, Grey = H.
- Summary totals row at the bottom.
- No per-student percentage column.

**PDF:**
- Additional percentage column per student for the exported date range.
- Percentage colour-coded: Green ≥ 85%, Amber 75–84%, Red < 75%.
- School name and session in the header; generation date and scope label in the footer.
- Orientation: A4 Landscape for ranges exceeding 15 days; A4 Portrait for shorter ranges.

### 9.6 Export Flow
1. User clicks the **Export** button in the Attendance Register header.
2. A panel opens **within the same page** (not a new page) showing: scope filters, date range picker, format toggle (Excel / PDF), and a live preview of the first 4–5 rows — updating in real time as filters and dates change.
3. User clicks **Download Excel** or **Download PDF**.
4. File downloads immediately — no email or queue.
5. A confirmation toast appears: *"Exported — [Scope] · [Date Range]."*

### 9.7 File Naming Convention
```
Attendance_[Wing]_Class[X]_Section[A]_[MonthYear].xlsx
Attendance_[Wing]_Class[X]_Section[A]_[MonthYear].pdf
```
Example: `Attendance_SeniorWing_Class10_SectionA_Jan2025.xlsx`

For multi-class or full-school exports:
```
Attendance_AllClasses_Jan2025-Mar2025.xlsx
```

### 9.8 Validation Rules
- Date From cannot be after Date To — an inline error is shown if this occurs.
- If the selected scope has no attendance data for the chosen range, a warning is shown: *"No attendance data found for this selection. Export anyway?"*
- A Coordinator attempting to export outside their scope is silently blocked — out-of-scope classes simply do not appear in their filter dropdowns.

---

## 10. Open Questions & Edge Cases to Resolve

| # | Item |
|---|---|
| 1 | Grid view filter behaviour: *"Filter will work as per the Rolls ________"* — definition pending. |
| 2 | Feasibility thresholds for 3 / 4 / 5 column grid layout need specific breakpoint definitions. |
In wing filter make one entry of non-wing classes in the Attendance register. So that classes not assigned to any wing can also be seen through.




// This Attendance Modules of App which creates the Attendance Record for of the Student.Like others it also integrate with the other features, modules and settings.
// Only the respective Class Teacher(Class-section Teacher can mark the attendance) or the respective coordinator of that wing or the class can mark the attendance. Class Teacher can mark the attendance of his class-section only. While coordinator can mark the attendance of whole wing or alloted classes.
// Class Teacher can see  the Attendance Analytics of his class-section students only on Calendar page while coordinator can see the attendance of the entire wing or the classes given to him as the coordinator.
// Attendance Card used for marking attendance only available on your dashboard when you are class teacher or coordinator.
// Once Attendance mark can be edit within a week by Class Teacher and the Coordinator. If not edited within the week it will be stored permanently. 7 calendar days from the date of marking.
// Principal, Master Admin, Teachers and Departmental incharges cannot mark the attendance.Attendance Card is not Available to them on their dashboards.
// Days cannot be marked with Attendance Register which declared holiday by the Principal/Master Admin in the calendar.Even if they are marked latter after the attendance then it will remove the attendance of that day.Holiday-marked dates cannot be entered but the file still uploads with the rest. The user gets will get the feedback on which columns were skipped. A post-upload summary report. ("3 columns skipped — Jan 26, Mar 8, Apr 14 were holidays") would be shown.

// For Principal, Master Admin,Departmental incharges and Teacher Attendance Card sent them to Attendance Register view only mode.While for the coordintor and class teacher.It will be used for View and marking Attendance.

// Only coordintor is allowed to do the bulk attendance marking using excel sheet where excel sheet should have this format the first two column is fixed for Roll no. and Names followed by class, section and month column with the same entries feeded in these three column till the last entry and the dates columns feeded with capital P, A and L only not blank.Button for bulk import must appear to coordinator only. Either it accept the whole attendance or reject the whole attendance excel file. Clicking on import provide dialog box with upload submit and specimen for the format.But Coordinator can only do the bulk entries of his designated classes and wings.If the field marked  holiday and excel file uploaded have entry for such column then such column cannot be entered in the database but file gets uploaded with the rest of the column. : If a date already has attendance marked and the Excel file also has an entry for that date then it will simple overwrite with confirmation.

// Coordinator get notified when the Class teacher did not mark the attendance through messenger through automatic message feature of the messenger.
// Principal/Master Admin/Coordinator is allowed to export the Attendance record in the excel sheet.While Coordinator can export his designated wing or classes.Export file have top row School Name, followed by Session, Class and Section.the columns rows with the same columns and structure given in the list view of the Attendance Register App.Export format can be pdf or excel

8. Export
8.1 Who Can Export
Principal and Master Admin can export the entire school — all wings, all classes, all sections. Coordinator can export their designated wing or assigned classes only. Class Teacher, Teacher, and Departmental Incharge cannot export. The Export button appears in the Attendance Register for Principal, Master Admin, and Coordinator only.

8.2 Scope Selection Before Export
Principal and Master Admin get three optional filters before exporting — Wing (defaults to All), Class (defaults to All, narrows when Wing is selected), and Section (defaults to All, narrows when Class is selected). Leaving all three on All exports the entire school's attendance for the selected date range.
Coordinator scope is locked to their designated wing and assigned classes. They cannot export outside this boundary. Filters shown are Class (limited to assigned classes only) and Section (all sections within the selected class, or all sections across assigned classes if Class is left on All). A read-only scope label is displayed above the filters: "Export limited to: Senior Wing — Class 9, 10, 11."

8.3 Date Range
A mandatory date range picker with two fields — Date From and Date To. Default is the first day of the current month to today's date. Future dates cannot be selected in the Date To field. Dates outside the current academic session cannot be selected. Minimum range is a single day with both fields set to the same date. Maximum range is the full academic session with no artificial cap.

8.4 Export File Structure
Header rows are the same for both Excel and PDF. Row 1 is the School Name. Row 2 is Session (e.g. 2025–26), Class, Section, and Date Range.
Data columns mirror the List View of the Attendance Register. Column 1 is Roll No., Column 2 is Student Name, Column 3 is Father's Name, and Column 4 onwards is one column per date within the selected range.
Holiday dates are included as a column but cells show "H" and are visually distinct — no P/A/L values. Dates with no attendance marked show blank cells. Each date column header shows the date number (DD) with the day initial below (M/T/W/T/F/S). The last row of the table is a summary row showing the count of Present students for each date.

8.5 Format Differences
Excel (.xlsx) contains raw P / A / L / H values in cells, suitable for further data processing, filtering, or formula use. A summary totals row appears at the bottom. No per-student percentage column is included. Cell background is color coded — green for P, red for A, yellow for L, grey for H.
PDF includes an additional percentage column per student showing their attendance percentage within the exported date range, color coded green for 85% and above, amber for 75–84%, and red for below 75%. School name and session header appear at the top. Generation date and scope label appear in the footer. Orientation is A4 landscape when the date range exceeds 15 days and A4 portrait for shorter ranges.

8.6 Export Flow
User clicks the Export button in the Attendance Register header. A panel opens within the same page — not a new page — showing scope filters, date range picker, format toggle between Excel and PDF, and a live preview of the first four to five rows of the output. The preview updates live as filters and date range are changed. User clicks Download Excel or Download PDF. File downloads immediately with no email or queue. A confirmation toast confirms: "Exported — [Scope] · [Date Range]."

8.7 Validation Rules
Date From cannot be after Date To — an inline error is shown if this occurs. If the selected scope has no attendance data for the chosen date range, a warning is shown before export: "No attendance data found for this selection. Export anyway?" A Coordinator attempting to export outside their scope is blocked silently — out-of-scope classes simply do not appear in their filter dropdowns.
What is the downloaded file named? Attendance_ClassX_SectionA_Jan2025.xlsx should be defined so it's consistent and useful.

// FLOW OF ATTENDANCE CARD : Clicking on this card open up the new full window for marking the attendance. With the header Attendeance Register. Below it are the Dropdown filters in this order : Wings -> Class -> Section ->.And Class narrow down the limit according to wing if wing is not set to all. while section is dependent on Class and will only appear when the class is selected with the default section dropdown set on section A. Wings filter dropdown fetches the all the wings from the wing tab of my school plus have all option also, by default when the page is load it is set to all. Class filter is empty but will always be set to that class which was filled last time. Same in the case of section also it is empty but set to the section which was filled last time, default to the first class alphabetically on first time. One Search Box to manually search : can be search with with Roll no., Fathers'Name and Students Name. Sort button set on alphabetically ascending by default.Date Range column with check box for single date. Status dropdown when used as the filter shows these three options present, absent, leave and blank."Status dropdown is filter only. Button to switch between the Grid/List view.< , > Buttons to move previous and next month. Month is the clickable drop down to select the month button.single-date checkbox should auto-set both "from" and "to" to the same date — making today the default when checked. When a date range is active, the bulk mark dropdown and Mark/Edit buttons should not be active.
//when the wing is set to all any class can be selected. but when the wing is selected it makes to choose between the classes to the wing. Once the class is selected it will gives section to select. since Class Teacher has the rights to mark the attendance of the one class-section so all this field is al ready pre-flilled 
// In list view it has the table with column name roll no., Student Name-father Name in one column with Student Name on top major with in small fonts fathers name and Dates column. Including fathers' name is necessary as the class may have the student with same name. First two column remain fixed while the dates columns are scrollable horizontally and can be resize to fit more dates columns in the screen.The past date columns have the edit button on the top to edit the attendance clicking on it changes it into save button and provide x button to cancel.Clicking edit button make that date column cell editable every click switches between Present->Absent and quick double click to leave. Provide this as guides  on the screen so that staff marking attendance is familiar with these.Dates for first time shows the mark button in place of the edit clicking on mark changes it into save button with x button to cancel. Once marked and save it start showing the edit button. saving the attendance each time gives the confirmation of Total, Present and Absent. So if the mark button is clicked and crossed than it will remain mark again but if mark button is clicked and one cell is filled with the P/A/L then it can be crossed to come out without filling this will not save the attendance untill the Save button is clicked and save button is only clickable when all cells are marked with P/A/L if the person refresh the page without filling the attendance and saving then it will set to blank and mark button again.In the Date Column there is dropdown button which can mark all present, all absent, for the Class teacher. For the coodinator it has three option all present, all absent and all blank.Marking is done via cell interaction of the date column dropdown.
// Edge case :  if the class has 40 students and the teacher marks 39 and accidentally misses one? The button stays disabled with no indication of who is unmarked. You need a "highlight unmarked students" behaviour.
// In Grid view it will have the grids with 3/4/5 columns depends upon the feasablity of the screen size. Each cell or the grid have Roll no. Student name in major fonts,fathers name. Each grid can take the Green, Red and Yellow color only . Where Red means absent, Green means present and yellow means leave. Date range filter will only pick one date here not the range of dates.Click behaviour is same as in the list view 
// Providing leave does't include in the Present percentage
// Filter will work as per the Rolls _________ 
// Class Teacher get right to mark Present/Absent/Leave. While the Coordinator get the right to mark Present/Absent/Leave/Blank.
// Status button is as the filter with these four option Present Students, Absent Students, Students on Leave, Blank can be filter.

// "Blank" as a Status option is confusing. Users won't immediately know what Blank means — not marked yet? System error? It needs a clearer label like "Not Marked" or "Unmarked".