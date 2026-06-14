# SECTION — STAFF FORM

---

## Overview

Staff profile creation is split into four stages. Each stage has a clear purpose and completion threshold. A **profile completion bar** is shown on every staff card and profile page, calculated across all four stages.

<!-- - **Stage 1 — Account Creation**: Minimum fields to create the account, assign a Staff ID, and activate login. Staff goes Active immediately on completion.
- **Stage 2 — Professional Profile**: Employment, academic qualifications, subject assignments, and payroll linkage. Should be completed before the first working day.
- **Stage 3 — Operational Details**: Transport, skills, training history, and document uploads. Should be completed within the first week.
- **Stage 4 — Full Record**: Compliance, statutory IDs, performance baseline, and family/reference data. No operational dependency. -->
HERE I WANT YOU TO FIGURE OUT HOW MANY TABS DO WE ACTUALLY REQUIRE PROVIDED ALL THE INFORMATION GIVEN BELOW MUST BE REORGANISE IN THE MOST LOGICAL MANNER AND GROUPED BASED ON SIMILARITY , TABS ORDER BASED PRIORITY.



**Global conditional display rules:**
- Spouse fields appear only if Marital Status = Married or Widowed.
-- Bus Route / Stop fields appear only if Opted for Transport = Yes.
- Disability Specification field appears only if Disability Type = Other.
- Disability Certificate upload appears only if Disability Type ≠ None.
- EPF / ESI Number fields appear only if EPF / ESI Enrolled = Yes.
- Gratuity Eligible toggle auto-sets to Yes when Employment Duration ≥ 5 years (editable override).
- Minority Details section in Stage 4 appears only if Minority = Yes (set in Stage 1).
- Permanent Address fields appear only if "Same as Local Address" is unchecked.
- Bank IFSC becomes required if Bank Account Number is filled.
- Subcaste and Caste Certificate Number appear only if Category = SC, ST, or OBC.
- Religion / Belief manual entry appears only if Religion / Belief = Other.
- Children sub-table appears only if Has Children = Yes.
- Reference rows are always shown (minimum 2 rows required at Stage 4).
- Salary Certificate upload is required if Last Salary Drawn is filled.

**Document upload / preview pattern (applies everywhere a document field exists):**
- Not uploaded → Upload button only.
- Uploaded → Thumbnail preview + × to remove + upload button to replace.
- Every uploaded document has a Download button once a file exists.
- Aadhar No. has no document upload (number only, stored encrypted).
- PAN No. has an optional document upload for the PAN card copy.

**Draft Mode:**
- Every stage supports **"Save as Draft"** and **"Submit & Activate"**.
- Auto-save draft every 30 seconds when form is dirty.
- Show "Draft saved at HH:MM" indicator.
- Draft staff are visible in a "Pending Profiles" tab on Staff Directory; they are NOT Active and cannot log in until submitted.

**Mobile Responsive:**
- The 4-stage wizard collapses into a vertical stepper on tablets and mobile devices.
- Field groups stack vertically; dropdowns become native mobile pickers where supported.

---

## Staff_ID Allocation

### Format

`E{YY}{ACRONYM}{SEQ:000}`

| Segment | Meaning | Source |
|---|---|---|
| `E` | Fixed prefix — For all the Employees "Teacher / All the Staff" | Hardcoded |
| `{YY}` | Last 2 digits of joining year | From `Date of Joining` field at creation time |
| `{ACRONYM}` | School acronym | Fetched from **School Profile → Acronym** at creation time. **Frozen forever** even if Principal later changes the acronym. |
| `{SEQ:0000}` | 4-digit sequential | Per school, per joining-year, auto-incrementing. Max 9999 per year per school. |

**Example:** `T26IIS0001` — Staff, joined in 2026, school acronym IIS, first staff member of the year.

**Note:** Staff IDs creation year .A teacher it created  in December of 2025 is assigned 25 while someone hired in January 2026 is assigned 26.

### Reserve-Release Pattern

Identical to the Student ID Reserve-Release pattern:

1. **Sequence Table** in DB:
   ```
   staff_id_sequences
   - school_id (FK)
   - year (int)
   - last_assigned (int, default 0)
   - reserved_count (int, default 0)
   ```

2. **Preview Step** reserves tentative IDs before commit.
3. **Cancel / Navigate Away / Timeout:** Reserved IDs released after 30 minutes of inactivity.
4. **Confirm & Commit:** IDs are committed; `last_assigned` updated.
5. **Simultaneous Imports:** Atomic row-level lock prevents collision.

**Edge Case — Joining Year vs. Creation Year:**
If a staff member is created on 15 Dec 2026 with Date of Joining = 1 Jan 2025, the Staff ID uses `26` as the year segment → `T26IIS0001`.

---

## Stage 1 — Account Creation

> All fields required unless marked optional. Staff account is created and set to Active on submission.

---

### Staff Identity

| Field | Type | Required | Notes |
|---|---|---|---|
| Staff_ID | Auto-generated | ✅ | e.g. `T26IIS0001` — read only. Assigned via Reserve-Release pattern. |
| Salutation | Dropdown | ✅ | Mr. / Mrs. / Ms. / Dr. / Prof. |
| First Name | Text | ✅ | Max 50 chars. |
| Middle Name | Text | ❌ | Max 50 chars. |
| Last Name | Text | ✅ | Max 50 chars. |
| Gender | Dropdown | ✅ | Male / Female / Other |
| Date of Birth | Date | ✅ | Age: 18–70 yrs. **Age** shown as computed read-only field next to DOB. |
| Nationality | Dropdown | ❌ | Default: Indian |
| Photo | Image | ✅ | Max 2MB — PNG/JPG. Auto-generated initials avatar used until uploaded. |

---

### Role & Appointment

| Field | Type | Required | Notes |
|---|---|---|---|
| Post Applied For / Role | Dropdown | ✅ | PGT / TGT / PRT / PPT / ACT / ADM / MGT / SUP. Drives subject fields, class range, and pay-scale defaults. |
| Area of Specialization | Text | ❌ | Free text. E.g. "Mathematics", "Hindi Literature", "Physical Education". |
| Date of Joining | Date | ✅ | Cannot be more than 6 months in the future. Auto-fills today, editable. Drives Staff_ID year segment. |
---

### Contact Details

| Field | Type | Required | Notes |
|---|---|---|---|
| Primary Mobile | Tel | ✅ | +91XXXXXXXXXX. Used for OTP login. **Live uniqueness check debounced at 300ms** — shows spinner during check. On conflict shows: "Already registered to [Name] · [Role]". |
| Email | Email | ❌ | Optional. |
| Emergency Contact Name | Text | ✅ | |
| Emergency Contact Number | Tel | ✅ | +91XXXXXXXXXX. |
| Emergency Contact Relation | Text | ✅ | e.g. Spouse, Parent, Sibling. |

---

### Login Setup

| Field | Type | Required | Notes |
|---|---|---|---|
| Login Mobile | Tel | ✅ | Pre-filled from Primary Mobile. Editable. OTP-based login. Same uniqueness check as above. |
| Username | Staff_ID -> e.g. `T26IIS0001` | ✅ | Login mobile number can also be used in place of for Username |
see @docs/AUTH.md
---

### Social Profile

| Field | Type | Required | Notes |
|---|---|---|---|
| Category | Dropdown | ✅ | General / SC / ST / OBC |
| Subcaste | Text | Conditional | Appears only if Category = SC, ST, or OBC. Max 100 chars. |
| Caste Certificate Number | Alphanumeric | Conditional | Required if Category = SC, ST, or OBC. |
| Religion / Belief | Dropdown | ❌ | Buddhism / Christianity / Hinduism / Islam / Judaism / Sikhism / Atheist / Zoroastrianism / Jainism / Non-Religious / Other |
| Religion / Belief (specify) | Text | ❌ | Conditional — appears only if Religion / Belief = Other. |
| Minority | Toggle | ❌ | Yes / No |

---

## Stage 2 — Professional Profile

---

### Academic Qualifications

> Use **+ Add Qualification** to add rows. Each row can be removed individually. Minimum 1 row required. Displayed in ascending order of Qualification Level.

| Field | Type | Required | Notes |
|---|---|---|---|
| Qualification Level | Checkbox selection | ✅ | Secondary / Sr. Secondary / Graduation / Post Graduation / M.Phil / Ph.D. / N.T.T. / B.Ed. / D.El.Ed. / M.Ed. / CTET / MPTET / Any Other |
| Year of Passing | Year | ✅ | 4-digit year. Cannot be future. |
| Degree / Certificate Name | Text | ✅ | e.g. B.Sc., M.A., B.Ed. |
| Subject / Specialization | Text | ✅ | e.g. Mathematics, English Literature. |
| School / College / University Name | Text | ✅ | |
| Board / University | Text | ✅ | e.g. CBSE, University of Delhi, MP Board. |
| State (Institution) | Dropdown | ❌ | State where institution is located. |
| Percentage / CGPA | Number | ✅ | 0–100 for percentage; 0–10 for CGPA. Toggle between modes. |
| Medium of Instruction | Dropdown | ❌ | Hindi / English / Other |
| Certificate | Document | ❌ | Upload / preview / remove + download. |

---

### Vocational / Certification Courses

> Optional section. Use **+ Add Course** to add rows. Soft limit at 10.

| Field | Type | Required | Notes |
|---|---|---|---|
| Vocational Subject / Skills Name | Text | ❌ | |
| Course Name | Text | ❌ | |
| Institute / Certifier's Name | Text | ❌ | |
| Duration of Course | Text | ❌ | e.g. "6 months", "1 year". |
| Have Certificate | Toggle | ❌ | Yes / No |
| Certificate Upload | Document | ❌ | Conditional — appears only if Have Certificate = Yes. |

---

### Work Experience

> Use **+ Add Experience** to add rows. Minimum 1 row required (even for freshers — first row auto-fills "Fresher / First Job"). Rows can be removed individually.

| Field | Type | Required | Notes |
|---|---|---|---|
| School / Organization Name | Text | ✅ | |
| Year (From – To) | Year Range | ✅ | From year and To year. "To" can be "Present" for current job if not this school. |
| Board / Type | Dropdown | ❌ | CBSE / ICSE / IB / State Board / Private / Other |
| Classes Taught | Text | ❌ | e.g. "Class 6 – 10". |
| Post Held | Text | ✅ | e.g. "TGT Mathematics", "Class Teacher". |
| Subject(s) Taught | Text | ❌ | |
| Reason for Leaving | Text | ❌ | |

**Summary auto-computed from rows (read-only, shown below the table):**

```
Total work experience:  Teaching ____  Admin ____  Other ____  Total ____  (in years)
```

### Payroll & Salary

| Field | Type | Required | Notes |
|---|---|---|---|
| Pay Scale / Grade | Dropdown | ✅ | Sourced from **Payroll Settings → Pay Grades**. E.g. Grade A / Grade B / Grade C. |
| Basic Salary (₹ / month) | Number | ✅ | |
| HRA (₹ / month) | Number | ❌ | |
| DA (₹ / month) | Number | ❌ | |
| Special Allowance (₹ / month) | Number | ❌ | |
| Other Allowance (₹ / month) | Number | ❌ | |
| Gross Salary (₹ / month) | Number | Auto | Computed: Basic + HRA + DA + Special + Other. Read-only. Editable override available for Principal. |
| Last Salary Drawn (₹ / month) | Number | ❌ | From previous employer. |
| Last Salary Year | Year | ❌ | Year of last salary drawn. |
| Mode of Last Salary Payment | Dropdown | ❌ | Cash / Bank |
| Salary Certificate | Document | Conditional | Required if Last Salary Drawn is filled. Upload / preview / remove + download. |
| Minimum Expected Salary (₹) | Number | ❌ | Applicant-declared expected CTC. |
| Date of Last Increment | Date | ❌ | |
| If Selected, Date of Joining Will Be | Date | ❌ | Captures applicant's stated availability date. Admin-editable. |

---

### Bank Details

| Field | Type | Required | Notes |
|---|---|---|---|
| Bank Account Number | Alphanumeric | ❌ | |
| IFSC Code | Text | Conditional | Required if Bank Account Number is filled. Validate format: `[A-Z]{4}0[A-Z0-9]{6}`. Show green checkmark on valid format. |
| Bank Name | Text | ❌ | |
| Bank Branch | Text | ❌ | |
| Bank Passbook / Cancelled Cheque | Document | ❌ | Upload / preview / remove + download. |

---

### Statutory Details

| Field | Type | Required | Notes |
|---|---|---|---|
| PAN Number | Alphanumeric | ❌ | 10-character format `[A-Z]{5}[0-9]{4}[A-Z]`. Validate inline. Stored encrypted. |
| PAN Card Upload | Document | ❌ | Upload / preview / remove + download. |
| Aadhar Number | Number | ❌ | 12-digit. Masked: last 4 shown (`**** **** 1234`). Stored encrypted. |
| Aadhar Not Available | Checkbox | ❌ | If checked, Aadhar field disabled. |
| EPF / ESI Enrolled | Toggle | ❌ | Yes / No |
| EPF Number | Alphanumeric | Conditional | Appears only if EPF / ESI Enrolled = Yes. |
| ESI Number | Alphanumeric | Conditional | Appears only if EPF / ESI Enrolled = Yes. |
| Gratuity Eligible | Toggle | Auto | Auto-set to Yes when Employment Duration ≥ 5 years. Admin can manually override. |
| TDS Applicable | Toggle | ❌ | Yes / No |

---

## Stage 3 — Operational Details

---

### Address

| Field | Type | Required | Notes |
|---|---|---|---|
| Address Line 1 | Text | ✅ | Local address line 1. |
| City / Village | Text | ✅ | |
| District | Dropdown | ✅ | Sourced from state district master. |
| State | Dropdown | ✅ | Default: school's state. |
| PIN Code | Text | ✅ | 6-digit Indian PIN. |
| Same as Local Address | Checkbox | ✅ | If checked, Permanent Address fields are hidden and auto-filled. |
| Permanent Address Line 1 | Text | Conditional | Required if Same as Local Address is unchecked. |
| Permanent City / Village | Text | Conditional | Required if Same as Local Address is unchecked. |
| Permanent District | Dropdown | Conditional | Required if Same as Local Address is unchecked. |
| Permanent State | Dropdown | Conditional | Required if Same as Local Address is unchecked. |
| Permanent PIN Code | Text | Conditional | Required if Same as Local Address is unchecked. |

---

### Personal Details

| Field | Type | Required | Notes |
|---|---|---|---|
| Marital Status | Dropdown | ❌ | Unmarried / Married / Widowed / Divorced / Separated |
| Date of Marriage | Date | Conditional | Appears if Marital Status = Married. |
| Spouse's Name | Text | Conditional | Appears if Marital Status = Married or Widowed. |
| Spouse's Occupation | Text | Conditional | Appears if Marital Status = Married or Widowed. |
| Spouse's Contact Number | Tel | Conditional | Appears if Marital Status = Married or Widowed. Also shown in Emergency Contact as a quick-copy option. |
| Father's / Husband's Name | Text | ❌ | Mirrors physical form field 4. For unmarried staff, Father's name; for married female staff, Husband's name (editable label). |
| Father's / Husband's Occupation | Text | ❌ | |
| Father's / Husband's Contact No. | Tel | ❌ | |
| Blood Group | Dropdown | ❌ | A+ / A- / B+ / B- / AB+ / AB- / O+ / O- |
| Languages Known | Text | ❌ | Comma-separated. Speak / Read / Write toggles per language are rendered as a mini sub-form. |
| Hobbies | Text | ❌ | Free text. Max 250 chars. |

---

### Children Information

> **Conditional — shown only if Has Children = Yes.**

| Field | Type | Required | Notes |
|---|---|---|---|
| Has Children | Toggle | ❌ | Yes / No — default No |

> **+ Add Child** button adds a row. Soft limit at 5.

| Field | Type | Required | Notes |
|---|---|---|---|
| Child's Full Name | Text | ❌ | |
| Age | Number | ❌ | |
| Sex | Dropdown | ❌ | Male / Female / Other |
| Class & School | Text | ❌ | Free text. e.g. "Class 5, Ideal International School". |

---

### Skills & Proficiencies

| Field | Type | Required | Notes |
|---|---|---|---|
| Proficiency in Academic Activities | Text | ❌ | Free text. e.g. "Mathematics Olympiad coaching, Science Fair mentoring". |
| Proficiency in Cultural / Other Activities | Text | ❌ | Free text. e.g. "Classical dance, Drama, Debate". |
| Computer Proficiency (Software Known) | Text | ❌ | Free text. e.g. "MS Office, Google Workspace, Tally". |
| Subject Preference a / b / c / d | Text ×4 | ❌ | Four individual fields. Mirrors physical form field E. |

---



---

### Administrative & Other Experience

| Field | Type | Required | Notes |
|---|---|---|---|
| Brief Note on Administrative Experience | Textarea | ❌ | Max 500 chars. Mirrors physical form 15(a). |
| Assignments / Responsibilities (Non-Teaching) | Textarea | ❌ | Max 500 chars. Mirrors physical form 15(b). |
| Courses / Studies Currently Pursuing | Textarea | ❌ | Max 500 chars. Includes: "Will you need leave on this account?" Yes / No toggle. Mirrors physical form 15(c). |
| Leave Required for Ongoing Studies | Toggle | Conditional | Yes / No. Appears if Courses / Studies Currently Pursuing is filled. |

---

### Transport

> **Conditional — Bus Route and Bus Stop appear only if Opted for Transport = Yes.**

| Field | Type | Required | Notes |
|---|---|---|---|
| Opted for Transport | Toggle | ❌ | Yes / No — default No |
| Bus Route | Dropdown | Conditional | Sourced from Transport Master (Routes table). |
| Bus Stop | Dropdown | Conditional | Filtered by selected Bus Route. |

---

### Documents Received

> Admin checklist. Each row has a Yes/No toggle (physical receipt confirmed) and an upload button (digital copy stored).
> **Auto-toggle rule:** If a file is uploaded, toggle auto-switches to Yes. Admin can manually override.
> **Warning rule:** If toggle is manually set to Yes but no file is uploaded, show yellow inline warning: "Document marked received but no file uploaded."

| Document | Toggle | Upload | Notes |
|---|---|---|---|
| Appointment Letter / Offer Letter | Yes / No | ✅ | Upload / preview / remove + download |
| Experience Certificate(s) | Yes / No | ✅ | Upload / preview / remove + download |
| Highest Degree Certificate | Yes / No | ✅ | Upload / preview / remove + download |
| B.Ed. / Teaching Certification | Yes / No | ✅ | Upload / preview / remove + download |
| CTET / MPTET / TET Certificate | Yes / No | ✅ | Upload / preview / remove + download |
| Aadhar Card | Yes / No | ✅ | Upload / preview / remove + download |
| PAN Card | Yes / No | ✅ | Upload / preview / remove + download |
| Caste Certificate | Yes / No | ✅ | Upload / preview / remove + download |
| Salary Certificate (Previous) | Yes / No | ✅ | Upload / preview / remove + download |
| Police Verification Certificate | Yes / No | ✅ | Upload / preview / remove + download |
| Medical Fitness Certificate | Yes / No | ✅ | Upload / preview / remove + download |
| Bank Passbook / Cancelled Cheque | Yes / No | ✅ | Upload / preview / remove + download |
| Disability Certificate | Yes / No | ✅ | Upload / preview / remove + download |

---

## Stage 4 — Full Record

> No operational dependency. Complete when data is available. Required for statutory reporting, annual audits, and staff appraisals.

---

### Disability

| Field | Type | Required | Notes |
|---|---|---|---|
| Disability Type | Dropdown | ❌ | None / Locomotor / Visual / Hearing / Other |
| PWD (Person With Disability) | Toggle | Auto | Auto-set to Yes if Disability Type ≠ None. Read-only flag for reporting. |
| Disability Specification | Text | Conditional | Appears only if Disability Type = Other. |
| Disability Percentage | Number | Conditional | Required if Disability Type ≠ None. |
| Disability Certificate | Document | Conditional | Appears only if Disability Type ≠ None. Upload / preview / remove + download. |

---

### Minority Details

> **Conditional — entire section appears only if Minority = Yes (set in Stage 1).**

| Field | Type | Required | Notes |
|---|---|---|---|
| Minority Certificate Received | Toggle | ❌ | Yes / No |
| Minority Certificate | Document | ❌ | Upload / preview / remove + download |

---

### References

> Minimum 2 references required to complete Stage 4. Use **+ Add Reference** to add more. Soft limit at 5.

| Field | Type | Required | Notes |
|---|---|---|---|
| Reference Name | Text | ✅ | |
| Designation / Relation | Text | ✅ | e.g. "Principal, ABC School" or "Former Manager". |
| Address | Text | ✅ | |
| Tel / Mobile No. | Tel | ✅ | |
| Email | Email | ❌ | Optional. |

---

### Separation Details

<!-- > **Conditional — entire section appears only if Account Status = Inactive or staff is being off-boarded.**
> Section is locked and read-only after Date of Leaving is confirmed.

| Field | Type | Required | Notes |
|---|---|---|---|
| Reason for Leaving | Dropdown | Conditional | Resignation / Termination / Retirement / Transfer / Contract Ended / Deceased / Other |
| Reason (Specify) | Text | Conditional | Required if Reason = Other. Max 250 chars. |
| Date of Leaving | Date | Conditional | Cannot be before Date of Joining. |
| Exit Interview Completed | Toggle | ❌ | Yes / No |
| Relieving Letter Issued | Toggle | ❌ | Yes / No |
| Relieving Letter Upload | Document | ❌ | Upload / preview / remove + download. |
| Full and Final Settlement Done | Toggle | ❌ | Yes / No |
| Settlement Amount (₹) | Number | ❌ | |
| Re-Hire Eligible | Toggle | ❌ | Yes / No. Flagged for future recruitment reference. | -->
WE WILL PLAN OUT THIS IN NEXT PHASE SO KEEP IT IN DOCUMENT BUT FOR THE NEXT PHASE

---

## Profile Completion Bar
PLAN THIS OUT IN THE END WHEN THE TABS AND THE INFORMATION OF EACH TAB IS PLANNED.

**Guided Completion Panel:**
- Clicking the profile bar opens a side panel listing exactly which required fields are empty, grouped by stage.
- Each missing item has a **"Jump to field"** button that scrolls to and focuses the input.

**Color logic:**
- Below 70% → Amber
- 70%–99% → Blue
- 100% → Green

---

## Bulk Operations

---

### Two-Mode Architecture
\
| | **Quick Staff Enrollment** | **Bulk Full Import** |
|---|---|---|
| **Purpose** | Rapid onboarding of large staff batches (start of year or new campus). | Complete data migration from old system or bulk correction. |
| **Philosophy** | Speed over completeness. | Completeness over speed. |
| **Fields** | 12 columns only | All Stage 1 + Stage 2 fields (Stage 3 & 4 optional) |
| **Staff Status** | Active immediately. | Active immediately. |
| **Defaults** | Heavy auto-defaulting. | No auto-defaults. Every required field must be present. |
| **Photos** | Not included. Auto-generated avatar used. | Not included. Auto-generated avatar used. |
| **Staff_ID** | Auto-assigned via Reserve-Release. | Auto-assigned via Reserve-Release. |

---

### Bulk Quick Enrollment

#### Template Columns — 12 columns, all required

| # | Column | Format | Notes |
|---|---|---|---|
| 1 | `first_name` | Text | Max 50 chars. |
| 1 | `middle_name` | Text | Max 50 chars. |
| 2 | `last_name` | Text | Max 50 chars. |
| 3 | `father_first_name` | Text | Max 50 chars. |
|   | `middle_name` | Text | Max 50 chars. |
| 4 | `father_last_name` | Text | Max 50 chars. |
| 5 | `gender` | Text | Exactly: `Male`, `Female`, or `Other` |
| 6 | `date_of_birth` | DD/MM/YYYY | Age must be 18–70 yrs |
| 7 | `login_mobile` | Text | +91XXXXXXXXXX — 10-digit Indian mobile. Used for OTP login. |
| 7 | `Year of Joining` | Year | Can not be next upcoming year |

#### Auto-Defaults (Applied on Import)

| Missing Field | Auto-Default Value |
|---|---|
| **Staff_ID** | Auto-generated `E{YY}{ACRONYM}{SEQ:0000}` via Reserve-Release |
| **Salutation** | `Mr.` (Male), `Ms.` (Female), `Dr.` (Other) |
| **Category** | `General` |
| **Nationality** | `Indian` |
| **Minority** | `No` |
| **Address** | All blank |
| **Emergency Contact Name** | Blank |
| **Emergency Contact Number** | `=login_mobile` |
| **Bank Details** | All blank |
| **Gross Salary** | `=basic_salary` (no allowances assumed) |

#### Validation Rules

**Data error triggers:**
- Any required cell is blank
- `gender`, `role`, `employment_type` not in exact allowed lists
- `date_of_birth` not in DD/MM/YYYY format or outside 18–70 yrs
- `date_of_joining` more than 6 months in future
- `primary_subject` not in Subjects Master (for teaching roles)
- `login_mobile` or `official_email` not valid format

**Duplicate error triggers:**
- `login_mobile` already registered to an existing staff in this school
- `official_email` already registered to an existing staff in this school

#### Review & Confirm Page

```
You are about to create 40 Quick Enrollment records.

Staff IDs: E26IIS0001 → E26IIS0040
Warnings: 0
Errors: 0
Estimated processing time: 2 seconds

[🔙 Go Back & Edit]  [📥 Download Preview Report]  [✅ Confirm & Create]
```

---

### Bulk Full Import
<!-- 
All Stage 1 + Stage 2 required fields plus optional Stage 3 / 4 fields. Column headers must not be renamed or reordered. Validation is strict — no auto-defaults; every required field must be present.

#### Mandatory Columns (Stage 1 + 2)

| # | Column | Format | Notes |
|---|---|---|---|
| 1 | `salutation` | Text | Exactly: `Mr.`, `Mrs.`, `Ms.`, `Dr.`, or `Prof.` |
| 2 | `first_name` | Text | Max 50 chars. |
| 3 | `middle_name` | Text | Optional. |
| 4 | `last_name` | Text | Max 50 chars. |
| 5 | `gender` | Text | `Male`, `Female`, or `Other` |
| 6 | `date_of_birth` | DD/MM/YYYY | Age 18–70 yrs |

| 8 | `date_of_joining` | DD/MM/YYYY | Cannot be more than 6 months in future. |
| 9 | `email` | Email | Valid email format. Must be unique. |
| 10 | `login_mobile` | Text | +91XXXXXXXXXX. Must be unique. |
| 11 | `account_status` | Text | `Active` or `Inactive` |
| 12 | `category` | Text | `General`, `SC`, `ST`, or `OBC` |
| 13 | `subcaste` | Text | Required if Category = SC, ST, or OBC. |
| 14 | `caste_certificate_number` | Alphanumeric | Required if Category = SC, ST, or OBC. |
| 15 | `pay_scale_grade` | Text | Must match Payroll Settings → Pay Grades. |
| 16 | `basic_salary` | Number | Monthly basic in ₹. |
| 17 | `address_line_1` | Text | |
| 18 | `city_village` | Text | |
| 19 | `district` | Text | Must match district master. |
| 20 | `state` | Text | |
| 21 | `pin_code` | Text | 6-digit Indian PIN. |
| 22 | `same_as_local_address` | Text | `Yes` or `No`. |
| 23 | `permanent_address_line_1` | Text | Required if Same as Local = No. |
| 24 | `permanent_city_village` | Text | Required if Same as Local = No. |
| 25 | `permanent_district` | Text | Required if Same as Local = No. |
| 26 | `permanent_state` | Text | Required if Same as Local = No. |
| 27 | `permanent_pin_code` | Text | Required if Same as Local = No. |
| 28 | `emergency_contact_name` | Text | |
| 29 | `emergency_contact_number` | Text | +91XXXXXXXXXX. |
| 30 | `emergency_contact_relation` | Text | |

#### Optional Columns (Stage 2, 3, 4)

| # | Column | Format | Notes |
|---|---|---|---|
| 33 | `area_of_specialization` | Text | |
| 34 | `primary_subject` | Text | Must match Subjects Master. |
| 35 | `class_range` | Text | Pipe-separated class names. e.g. `Class 6\|Class 7\|Class 8`. |
| 36 | `nationality` | Text | Default: Indian |
| 37 | `religion` | Text | See allowed values in Stage 1. |
| 38 | `mother_tongue` | Text | |
| 39 | `minority` | Text | `Yes` or `No` |
| 40 | `marital_status` | Text | `Unmarried`, `Married`, `Widowed`, `Divorced`, `Separated` |
| 41 | `blood_group` | Text | A+ / A- / B+ / B- / AB+ / AB- / O+ / O- |
| 42 | `fathers_husband_name` | Text | |
| 43 | `pan_number` | Alphanumeric | Format `[A-Z]{5}[0-9]{4}[A-Z]`. |
| 44 | `aadhar_number` | Number | 12-digit. |
| 45 | `aadhar_not_available` | Text | `Yes` or `No`. |
| 46 | `epf_enrolled` | Text | `Yes` or `No`. |
| 47 | `epf_number` | Alphanumeric | Required if epf_enrolled = Yes. |
| 48 | `esi_number` | Alphanumeric | Required if epf_enrolled = Yes. |
| 49 | `bank_account_number` | Alphanumeric | |
| 50 | `ifsc_code` | Text | Required if bank_account_number present. Format `[A-Z]{4}0[A-Z0-9]{6}`. |
| 51 | `bank_name` | Text | |
| 52 | `bank_branch` | Text | |
| 53 | `hra` | Number | Monthly ₹. |
| 54 | `da` | Number | Monthly ₹. |
| 55 | `special_allowance` | Number | Monthly ₹. |
| 56 | `disability_type` | Text | `None`, `Locomotor`, `Visual`, `Hearing`, or `Other`. |
| 57 | `disability_percentage` | Number | Required if disability_type ≠ None. |
| 58 | `last_salary_drawn` | Number | Monthly ₹. |
| 59 | `last_salary_year` | Year | 4-digit. |
| 60 | `computer_proficiency` | Text | |
| 61 | `hobbies` | Text | |
| 62 | `languages_known` | Text | Comma-separated. | -->

WE WILL PLAN OUT THIS IN THE END ONCE THE FORM IS COMPLETELY MADE.

#### Post-Import

<!-- - All staff created as **Active**.
- Success summary: *"X staff imported successfully. All Stage _ and Stage _ data populated."*
- Downloadable creation report with Staff_ID → Name → Login Mobile → Email mapping.
- Profile completion bar shows ~70% (Stages 1 + 2 complete) for all imported staff.
- Stage _ and  fields can be completed individually from each staff profile. -->
WE WILL PLAN OUT THIS IN THE END ONCE THE FORM IS COMPLETELY MADE.
---

## Recent Bulk Actions & Revert - THIS WHOLE SECTION WE PLAN IN THE END ONCE THE FORM CREATION WORK IS DONE.

### Recent Bulk Actions Panel

Located on the **Staff Directory** page:

| Date | User | Mode | Count | Status | Action |
|---|---|---|---|---|---|
| 17 May 2026, 09:15 | Admin A | Quick Enrollment | 40 | Success | [Revert] |
| 16 May 2026, 11:30 | Admin B | Full Import | 12 | Success | — |

### Revert Rules

- **Revert button available for 2 hours** after creation.
- After 2 hours, Revert disappears. Individual edit/delete only.
- Clicking Revert shows confirmation:
  > *"This will permanently delete [X] [Quick Enrollment / Full Import] records. No payroll, attendance, or academic data exists yet. Staff IDs [E26IIS0001 – E26IIS0040] will be released back to the pool. Confirm?"*

- Revert deletes the batch and **releases IDs back to the pool**.
- Revert is **irreversible**.

---

## ID Card Generation

Each staff profile has a **"Download ID Card"** button (from Stage 1 completion onwards).

**ID Card contains:**
- School name + logo
- Staff Photo
- Staff Name + Salutation
- Staff_ID
- Role / Post
- Department
- Valid Till: current academic year end date (configurable)
- Emergency Contact Number
- School address + contact

**Format:** A6 PDF (portrait). Generated server-side. Downloadable and printable.

**Bulk ID Card Export:** From Staff Directory, select staff via checkbox and use **"Download ID Cards (ZIP)"** to get all selected cards as a single ZIP of PDFs.

---

## Appointment Letter Generation

When a new staff profile is submitted (Stage 1 + 2 complete), the system can auto-generate a draft **Appointment Letter**:

- Pulls: Name, Post, Department, Date of Joining, Basic Salary, Gross Salary, Employment Type, Probation period (if applicable).
- Template is defined in **School Profile → Letter Templates → Appointment Letter**.
- Principal reviews and digitally signs before download.
- Stored as a document against the staff profile once issued.

---

## Deprecation / Off-Boarding Flow

When a staff member's Account Status is set to **Inactive**:

1. Stage 4 → **Separation Details** section expands automatically.
2. Admin fills: Reason for Leaving, Date of Leaving, Exit Interview status, Relieving Letter.
3. On saving: Staff loses login access immediately.
4. Class Teacher assignments: *"[Name] is Class Teacher of [Class-Section]. Reassign before closing."*
5. House Incharge assignment: *"[Name] is House Master of [House]. Reassign before closing."*
7. **Relieving Letter** can be auto-generated from template (similar to Appointment Letter).
8. Staff ID is **never reused** — it remains in history for audit purposes even after the staff is deleted.

---

## Declaratory Statement

At the end of the physical form (mirrored in digital submission):

> *"I affirm that the information provided is true. I understand that furnishing any false information may result in management taking disciplinary action against me."*

- A **"I agree to the above declaration"** mandatory checkbox is shown on the Stage 4 Review & Submit screen.
- The staff member's login mobile OTP must be verified at this point if the form is being self-submitted via the staff portal.
- **Date of declaration** and **digital signature / OTP confirmation** are recorded and stored.

//////////////////////////////////////////////////////////////////////////////////