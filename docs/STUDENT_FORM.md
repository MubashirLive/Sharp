# SECTION — STUDENT FORM 

---

## Overview

Student profile creation split into 10 tabs. Each tab contains related fields. First tab mandatory - generates Student ID and unlocks remaining tabs.

**Global conditional display rules:**
- Subcaste field and Caste Certificate Number appear only if Category = SC, ST, or OBC.
- Religion / Belief manual entry field appears only if Religion / Belief = Other.
- Transfer block in Tab 8 expands only if Previous School Name is filled OR Admission Type = Transfer.
- Transport fields in Tab 8 appear only if Opted for Transport = Yes.
- Disability Specification field appears only if Disability Type = Other.
- Disability Certificate upload appears only if Disability Type ≠ None.
- Minority Details section in Tab 10 appears only if Minority = Yes (set in Tab 3).
- Guardian fields appear and become mandatory only if Primary Guardian = Guardian, Grandparent, or Other.
- Father fields become mandatory only if Primary Guardian = Father.
- Mother fields become mandatory only if Primary Guardian = Mother.
- Permanent Address fields appear only if "Same as Local Address" is unchecked.
- Aadhar input disabled if "Aadhar Not Available" is checked.
- IFSC Code required if Student Bank A/c No. is filled.
- Caste Certificate Number required if Category = SC, ST, or OBC.
- School Internal ID field appears only in Tab 7.

**Document upload / preview pattern (applies everywhere a document field exists):**
- Not uploaded → Upload button only.
- Uploaded → Thumbnail preview + × to remove + upload button to replace.
- Every uploaded document has Download button once file exists.
- Aadhar No. has no document upload.
- SSSM ID has separate upload button for physical card copy.

**Draft Mode:**
- Every tab supports "Save".

**Mobile Responsive:**
- 10-tab wizard collapses into vertical stepper on tablets and mobile.
- Field groups stack vertically; dropdowns become native mobile pickers.

---

## Student_ID Allocation

### Format

`S{YY}{ACRONYM}{SEQ:00000}`

| Segment | Meaning | Source |
|---|---|---|
| `S` | Fixed prefix — "Student" | Hardcoded |
| `{YY}` | Last 2 digits of creation year | System date at creation |
| `{ACRONYM}` | School acronym | Fetched from School Profile → Acronym at creation. **Frozen forever** even if principal changes later. |
| `{SEQ:00000}` | 5-digit sequential | Per school, per year, auto-incrementing. Max 99999 per year per school. |

**Example:** `S26IIS00001` — Student, created in 2026, school acronym IIS, first student of year.

### Reserve-Release Pattern

1. **Sequence Table** in DB:
   ```
   student_id_sequences
   - school_id (FK)
   - year (int)
   - last_assigned (int, default 0)
   - reserved_count (int, default 0)
   ```

2. **Preview Step** (Pre-Validation UI):
   - System reads `last_assigned` for current school + year.
   - For N rows, tentatively reserves IDs: `S{YY}{ACRONYM}{last+1}` to `S{YY}{ACRONYM}{last+N}`.
   - Increments `reserved_count` by N (with row-level DB lock).
   - Shows assigned IDs in preview table.

3. **Cancel / Navigate Away / Timeout:**
   - Reserved IDs released after 30 minutes of inactivity.
   - Background job cleans up expired reservations.

4. **Confirm & Commit:**
   - On final commit, reserved IDs committed.
   - `last_assigned` updated to `last_assigned + N`.
   - `reserved_count` reduced by N.

**Edge Cases:**
- Year Rollover: Jan 1 new year → sequence starts at 0001 (e.g., `S27IIS0001`).
- School Acronym Change: Existing IDs keep old acronym forever; new students get new.

---

## Tab 1 — Identity & Academic (Required)

First Name*
Middle Name
Last Name*
Father First Name*
Father Middle Name
Father Last Name*
Gender*
Login Mobile*
CLASS - fetched from DB dropdown
SECTION - fetched from DB dropdown
SUBJECT CHECKBOXES - fetched from My School → Subject Tab according to selected class
HOUSE - fetched from DB dropdown

On save: Student ID generates and remaining tabs unlock.

---

## Tab 2 — Guardian Details

Primary Guardian (hidden, logic only)
Father's Mobile (conditional)
Father's WhatsApp Checkbox
Father's Email
Mother's Mobile (conditional)
Mother's WhatsApp Checkbox
Mother's Email
Guardian's First Name (conditional)
Guardian's Middle Name
Guardian's Last Name (conditional)
Guardian's Mobile (conditional)
Guardian's WhatsApp Checkbox
Guardian Relation
Student's Mobile (optional)
Student's WhatsApp Checkbox
Emergency Contact Name
Emergency Contact Number
Emergency Contact WhatsApp
Emergency Contact Relation
Email

---

## Tab 3 — Social & Background

Category
Subcaste (conditional, appears if Category = SC, ST, or OBC)
Caste Certificate Number (conditional, required if Category = SC, ST, or OBC)
Religion / Belief
Religion / Belief (specify) (conditional, appears if Religion / Belief = Other)
Nationality
Mother Tongue
Medium of Instruction
Minority
Only Child
Single Parent / Orphan
First Generation Learner

---

## Tab 4 — Address

Address Line 1*
Address Line 2
City / Village*
District*
State*
PIN Code*
Same as Local Address (checkbox)
Permanent Address Line 1 (conditional, required if Same as Local Address unchecked)
Permanent Address Line 2
Permanent City / Village (conditional, required if Same as Local Address unchecked)
Permanent District (conditional, required if Same as Local Address unchecked)
Permanent State (conditional, required if Same as Local Address unchecked)
Permanent PIN Code (conditional, required if Same as Local Address unchecked)

---

## Tab 5 — Academic Profile

Admission Date*
Admission Type
Roll Number (auto-generated, read-only preview)
Account Status

---

## Tab 6 — Photo & Health

Photo*
Blood Group
Height (cm)
Weight (kg)
Date of Measurement

---

## Tab 7 — Parent Information

School Internal ID (optional, for admin reference)
Father's Qualification
Father's Occupation
Father's Photo
Mother's Qualification
Mother's Occupation
Mother's Photo
Mother's Education Level
Guardian's Qualification (conditional, appears if Primary Guardian = Guardian / Grandparent / Other)
Guardian's Occupation (conditional, appears if Primary Guardian = Guardian / Grandparent / Other)
Guardian's Photo (conditional, appears if Primary Guardian = Guardian / Grandparent / Other)

---

## Tab 8 — Transfer & Transport

Previous School Name
Previous School UDISE No.
Previous School Board
Last Exam Class
Last Exam Year
Last Exam Result
Last Exam Percentage
School Leaving Certificate
Opted for Transport
Bus Route (conditional, appears if Opted for Transport = Yes)
Bus Stop (conditional, appears if Opted for Transport = Yes)

---

## Tab 9 — Siblings & Documents

Siblings (+ Add button, soft limit at 5)
Birth Certificate (toggle + upload)
Caste Certificate (toggle + upload)
Marksheet of Previous Class (toggle + upload)
School Leaving Certificate (toggle + upload)
Aadhar Card (toggle + upload)
Disability Certificate (toggle + upload)
Minority Certificate (toggle + upload)
Bank Passbook (toggle + upload)

**Auto-toggle rule:** If file uploaded, toggle auto-switches to Yes.
**Warning rule:** If toggle = Yes but no file, show warning: "Document marked received but no file uploaded."

---

## Tab 10 — Government IDs & Finance

Aadhar No.
Aadhar Not Available (disables Aadhar No. field if checked)
SSSM ID (Samagra, conditional if school state = MP)
Family ID No. (conditional if school state = MP)
Disability Type
Disability Specification (conditional if Disability Type = Other)
Disability Percentage (required if Disability Type ≠ None)
Disability Certificate (conditional if Disability Type ≠ None)
Student Bank A/c No.
IFSC Code (required if Student Bank A/c No. filled)
Bank Name
Bank Branch
Bank Passbook
Receives Free Textbooks
Receives Midday Meal
Receives Scholarship
Scholarship Name (conditional if Receives Scholarship = Yes)
BPL / AAY / EWS Status
RTE Admission (auto-set if Admission Type = RTE Quota)
Minority Certificate Received
Minority Certificate

---

## Profile Completion Bar

Calculated across all 10 tabs. No functional restrictions at any level.

**Guided Completion Panel:**
Will show completion status and guidance per tab.

**Quick Enrollment Behavior:**
Quick-enrolled students start at ~35% completion.

---

## Bulk Operations

### Two-Mode Architecture

|  | **Quick Enrollment** | **Bulk Full Import** |
|---|---|---|
| **Purpose** | Start-of-year rush. Admit hundreds in minutes. | Complete data migration from old system. |
| **Fields** | 10 columns only | All Tab 1 + Tab 2 + Tab 3 + Tab 4 + Tab 5 + Tab 6 + Tab 7 + Tab 8 + Tab 9 (optional) + Tab 10 (optional) |
| **Status** | Active immediately | Active immediately |
| **Validation** | Lenient. Warnings instead of hard blocks. | Strict. Hard errors on missing required fields. |
| **Photos** | Not included. Auto-generated avatar. | Not included. Auto-generated avatar. |
| **Profile Completion** | ~35% after import | ~80% after import (Tab 1-8 complete) |

### Quick Enrollment Template (10 columns)

1. `first_name` - Max 50 chars
2. `last_name` - Max 50 chars
3. `gender` - Must be: Male, Female, or Other
4. `date_of_birth` - DD/MM/YYYY (Age 2.5-20 yrs)
5. `class` - Must match active Session Form
6. `section` - Must match active Session Form
7. `house` - Must match House Master
8. `father_first_name` - Max 50 chars
9. `father_last_name` - Max 50 chars
10. `login_mobile` - +91XXXXXXXXXX

### Auto-Defaults for Quick Enrollment

| Missing Field | Auto-Default |
|---|---|
| Student_ID | Auto-generated |
| Primary Guardian | Father |
| Father's Mobile | =login_mobile |
| Father's Email | Blank |
| Mother's details | All blank |
| Guardian details | Hidden |
| Emergency Contact | =father details |
| Admission Date | Today |
| Admission Type | New |
| Category | General |
| Address fields | Blank |
| Nationality | Indian |
| Other social fields | Blank/No |
| Account Status | Active |

### Full Import Template

Includes all Tab 1-10 required and optional fields (80+ columns).
Column headers must not be renamed or reordered.

---

## House Management

### Default Houses
RED, BLUE, GREEN, YELLOW

### Principal Control
- Rename, add, delete houses from School Profile → House Section
- Student.House is foreign key to House Master
- Delete blocked if students assigned
- Rename instant for all students

### Validation
House name must match exactly (case-insensitive) House Master.

---

## Recent Bulk Actions & Revert

### Recent Bulk Actions Panel
Shows: Date, User, Mode, Count, Status, [Revert] link

### Revert Rules
- Available for 2 hours after creation
- Deletes batch and releases IDs back to pool
- Irreversible
- Confirmation shows count and ID range

### Error Prevention
- Dry Test button
- Review & Confirm page
- Download Preview Report
- Max 500 rows per file
- 2-hour revert window

---

## Unfinished Tasks

### Phase 1: Reserve-Release (IN PROGRESS)
- [x] Reserve student ID RPC call in form
- [x] Commit on save (wired in handleFinalSave)
- [ ] Release on timeout/cancel (needs edge function cleanup)
- [ ] Migration for student_id_sequences table
- [ ] Migration for reserve_student_id RPC
- [ ] Migration for release_student_id RPC
- [ ] Migration for commit_student_id RPC

### Phase 2: Document Uploads (PENDING)
- [ ] UploadField uses `<Input type="file">` — needs Supabase Storage integration
- [ ] DocumentRow component needs refactor for storage bucket
- [ ] Create storage bucket for student documents
- [ ] Add upload/delete functions using Supabase Storage API
- [ ] Handle upload progress, error, cleanup

### Phase 3: Integration Gaps (PENDING)
- [ ] Aadhar encrypt — calls RPC encrypt_text that doesn't exist
- [ ] IFSC code validation — no real-time format check
- [ ] Duplicate mobile check — not implemented for new field names
- [ ] School.acronym fetch — hardcoded as "SCH"
- [ ] Academic year — hardcoded as "26"

### Phase 4: Bulk Import Rewrite (PENDING)
- [ ] Current 14-column spec is outdated
- [ ] Needs 10-column Quick Enrollment mode
- [ ] Needs 80-column Full Import mode
- [ ] Pre-validation UI (green/yellow/red indicators)
- [ ] Tentative ID Preview table
- [ ] Dry Test functionality
- [ ] Recent Bulk Actions panel
- [ ] Revert within 2hr window

### Phase 5: UI Polish (PENDING)
- [ ] Class 11/12 Subject checkbox (toggle + bucket UI)
- [ ] District master dropdown
- [ ] Same as Local Address checkbox logic
- [ ] Mother fields conditional on Primary Guardian
- [ ] Live Login Mobile uniqueness check
- [ ] Profile completion bar calculation update

### Next Session Priority
1. Add migrations for Reserve-Release tables/functions
2. Fix hardcoded values (schoolAcr, academic year)
3. Add document upload to Supabase Storage
4. Implement live validation (IFSC, duplicate mobile)
5. Rewrite bulk import for 10-col/80-col modes