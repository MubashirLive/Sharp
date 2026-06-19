# Staff Form

> **Status:** Live. 7-tab wizard at `src/components/staff/StaffForm.tsx`. Tabs lock-until-Tab-1-saved pattern implemented via `useGuardedSubmit` + `idempotency_key` (see `docs/SUBMIT_GUARD.md`).
> **Spec drift from older versions:** "Stage 1/2/3/4" terminology replaced by actual 7-tab UI. Tab boundaries follow StaffForm.tsx line ranges.

---

## Tab structure (as built)

| # | Tab | File lines | Purpose |
|---|---|---|---|
| 1 | Identity | 140–224 | Locked-first. Generates Staff ID via `create-staff-auth-user` edge fn. |
| 2 | Personal & Contact | 226–502 | Address, personal details, children, skills, transport |
| 3 | Professional | 503–533 | Department, designation, role, employment type |
| 4 | Education & Qualifications | 534–680 | Academic quals, vocational, certifications |
| 5 | Experience | 681–793 | Work history, summary auto-compute, admin experience |
| 6 | Payroll | 794–873 | Pay grade, salary breakdown, expected CTC, joining date |
| 7 | Statutory & Records | 874–1034 | Bank, PAN, Aadhar, EPF/ESI/gratuity/TDS, transport, documents, disability, references, separation |

`STAFF_TABS` constant: `tab1` Identity · `tab2` Personal & Contact · `tab3` Professional · `tab4` Education · `tab5` Experience · `tab6` Payroll · `tab7` Statutory.

### Lock state

```ts
const isCreateLocked = mode === "create" && !staffId;
```

- `mode === "create"` and no Staff ID → all 7 tabs show lock icon, tabs 2–7 disabled, Tab 1 active.
- On Tab 1 submit success → `setStaffId(result.employeeId)` + `setCoreLocked(true)` → tabs 2–7 unlock.
- Unlock dialog (`unlockDialogOpen`) available when staff ID already set; allows editing Tab 1 identity.

---

## Tab 1 — Identity (locked-first)

### Field set

| Field | Type | Required | Notes |
|---|---|---|---|
| Salutation | Dropdown | ❌ | Mr. / Mrs. / Ms. / Dr. / Prof. Auto-set from Gender: Male→Mr., Female→Mrs., Other→Ms. |
| First Name | Text | ✅ | |
| Middle Name | Text | ❌ | |
| Last Name | Text | ✅ | |
| Gender | Dropdown | ✅ | Male / Female / Other |
| Date of Birth | Date | ✅ | Auto-derives Age. |
| Father First Name | Text | ✅ | |
| Father Middle Name | Text | ❌ | |
| Father Last Name | Text | ✅ | |
| Login Mobile | Tel | ✅ | 10-digit Indian. Validated: `/^\d{10}$/`. Used for OTP. |
| Year of Joining | Year | ✅ | Used in Staff ID `E{YY}{ACRONYM}{SEQ:0000}`. |
| Staff ID | Badge | Auto | E.g. `E26IIS0001`. Frozen forever. |

### Submit flow (Tab 1)

```ts
const { run: runGuarded, isPending: isGuarded } = useGuardedSubmit();
const idempotencyKeyRef = useRef<string | null>(null);

const handleTab1Submit = () => {
  // 1. Validate (firstName, lastName, fatherFirstName, fatherLastName, gender, loginMobile, yearOfJoining)
  // 2. If !staffId → runGuarded → createStaffAuthUser({ ..., idempotencyKey })
  // 3. On success → setStaffId, setCoreLocked(true), clear idempotencyKeyRef, setActiveTab("tab2")
  // 4. If staffId exists → setActiveTab("tab2") (advance)
};
```

**Validation errors** set on `errors` state and surfaced as `toast({ variant: "destructive" })`.

**`onIdentityChange` callback** — bubbles Tab 1 identity fields (employeeId, firstName, middleName, lastName, fatherFirstName, fatherMiddleName, fatherLastName) to parent on every change. Re-fires on each field change. Used by persistent header on parent overlay.

### Save rules

- `handleSaveTab(tab)` → calls `updateStaffProfilePartial(staffProfileId, tab, data)`. Per-tab partial save.
- `handleFinalSave()` → calls `updateStaffProfileFull(staffProfileId, data)` → `onSave({...data, employeeId, profileId})`. Full save.
- Both blocked with toast if `!staffProfileId`.

---

## Tab 2 — Personal & Contact (file: 226–502)

| Section | Notes |
|---|---|
| **Address** | Local: Line 1*, City/Village*, District*, State*, PIN*. Permanent: appears if `sameAsLocalAddress = false` (default true). |
| **Personal Details** | Marital Status (gates Date of Marriage + Spouse fields). Father's/Husband's Name mirrors form field 4. Blood Group, Languages (with Speak/Read/Write toggles), Hobbies (max 250). |
| **Children** | + Add Child, soft limit 5. Hidden if `hasChildren = false`. |
| **Skills** | Free text: Academic proficiency, Cultural, Computer. Subject Preference a/b/c/d (4 fields). |
| **Administrative Experience** | 15(a)/(b)/(c) textareas, max 500 chars. "Will you need leave for ongoing studies?" Yes/No. |

Conditional rules:
- Marital Status = Married → show Date of Marriage
- Married/Widowed → show Spouse (Name/Occupation/Contact) + quick-copy to Emergency Contact
- `sameAsLocalAddress = true` (default) → Permanent auto-filled and hidden

---

## Tab 3 — Professional (file: 503–533)

Department (DB), Designation, Role (`teacher` / `staff` / etc.), Employment Type, Date of Joining, Probation Period.

---

## Tab 4 — Education & Qualifications (file: 534–680)

### Academic Qualifications — + Add Row (min 1)

| Field | Type | Required | Notes |
|---|---|---|---|
| Qualification Level | Checkbox | ✅ | Secondary / Sr. Secondary / Graduation / PG / M.Phil / Ph.D. / N.T.T. / B.Ed. / D.El.Ed. / M.Ed. / CTET / MPTET / Any Other |
| Year of Passing | Year | ✅ | 4-digit. No future. |
| Degree/Certificate Name | Text | ✅ | B.Sc., M.A., B.Ed. |
| Subject/Specialization | Text | ✅ | |
| School/College/University | Text | ✅ | |
| Board/University | Text | ✅ | CBSE, Univ. of Delhi, MP Board. |
| State (Institution) | Dropdown | ❌ | |
| Percentage / CGPA | Number | ✅ | 0–100 or 0–10. Toggle. |
| Medium of Instruction | Dropdown | ❌ | Hindi / English / Other |
| Certificate | Document | ❌ | |

### Vocational / Certification Courses — + Add Row (soft limit 10)
Vocational Subject · Course Name · Institute/Certifier · Duration · Have Certificate (Yes/No, gates Certificate Upload).

---

## Tab 5 — Experience (file: 681–793)

### Work Experience — + Add Row (min 1; auto-fills "Fresher / First Job")

| Field | Required | Notes |
|---|---|---|
| School/Organization Name | ✅ | |
| Year (From–To) | ✅ | To = "Present" for current non-school job |
| Board / Type | ❌ | CBSE / ICSE / IB / State / Private / Other |
| Classes Taught | ❌ | e.g. "Class 6–10" |
| Post Held | ✅ | e.g. "TGT Mathematics" |
| Subject(s) Taught | ❌ | |
| Reason for Leaving | ❌ | |

**Auto-summary (read-only, below table):**
```
Total: Teaching ____ Admin ____ Other ____ Total ____ (years)
```

### Administrative & Other Experience
15(a) Brief Note · 15(b) Assignments/Responsibilities · 15(c) Courses Currently Pursuing (gates "Leave Required" Yes/No). Max 500 chars each.

---

## Tab 6 — Payroll (file: 794–873)

| Field | Required | Notes |
|---|---|---|
| Pay Scale / Grade | ✅ | From Payroll Settings → Pay Grades |
| Basic Salary (₹/month) | ✅ | |
| HRA / DA / Special / Other Allowance | ❌ | |
| Gross Salary | Auto | Basic + HRA + DA + Special + Other. Read-only. Principal override available. |
| Last Salary Drawn | ❌ | Previous employer. |
| Last Salary Year | ❌ | Year drawn. |
| Mode of Last Salary Payment | ❌ | Cash / Bank |
| Salary Certificate | Conditional | Required if Last Salary Drawn filled. |
| Minimum Expected Salary (₹) | ❌ | Applicant-declared CTC. |
| Date of Last Increment | ❌ | |
| Date of Joining (will be) | ❌ | Admin-editable availability. |

---

## Tab 7 — Statutory & Records (file: 874–1034)

### Bank Details
Account No. · IFSC (required if A/c filled, format `[A-Z]{4}0[A-Z0-9]{6}`, green ✓ on valid) · Bank Name · Branch · Passbook/Cancelled Cheque.

### Statutory
PAN (10-char `[A-Z]{5}[0-9]{4}[A-Z]`, stored encrypted) · PAN Card upload · Aadhar (12-digit, masked `**** **** 1234`, stored encrypted, gated by "Aadhar Not Available" checkbox) · EPF/ESI Enrolled (gates EPF/ESI numbers) · Gratuity Eligible (auto Yes if tenure ≥5y, manual override) · TDS Applicable.

### Transport
Opted for Transport (gates Bus Route + Bus Stop from Transport Master).

### Documents Received (admin checklist)
Each row: Yes/No toggle + upload. Auto-toggle: file uploaded → toggle = Yes. Warning: toggle = Yes but no file → yellow "Document marked received but no file uploaded."

Appointment Letter · Experience Certificate(s) · Highest Degree · B.Ed./Teaching Cert · CTET/MPTET · Aadhar · PAN · Caste · Salary Cert (Prev) · Police Verification · Medical Fitness · Bank Passbook · Disability.

### Disability
Type (None / Locomotor / Visual / Hearing / Other) · PWD flag (auto Yes if Type ≠ None) · Specification (Other only) · Percentage (required if ≠ None) · Certificate (≠ None).

### Minority Details
Conditional — entire section appears only if Minority = Yes (Tab 2). Certificate Received (Yes/No) + upload.

### References
Min 2, soft limit 5. Name · Designation/Relation · Address · Tel/Mobile · Email (optional).

### Separation Details
**Planned, not yet built.** Section activates when Account Status = Inactive. Locked + read-only after Date of Leaving confirmed.
Reason (Resignation/Termination/Retirement/Transfer/Contract Ended/Deceased/Other, "Other" → Specify text) · Date of Leaving (≥ Date of Joining) · Exit Interview · Relieving Letter (issued/upload) · F&F Settlement (amount, done toggle) · Re-Hire Eligible.

---

## Global conditional rules

| Trigger | Effect |
|---|---|
| Category = SC/ST/OBC | Show Subcaste + Caste Certificate Number (latter required) |
| Religion/Belief = Other | Show Specify text |
| IFSC | Required if Bank A/c filled; format check `[A-Z]{4}0[A-Z0-9]{6}` |
| Aadhar Not Available | Disables Aadhar input |
| EPF/ESI Enrolled = Yes | Show EPF + ESI numbers |
| Employment Duration ≥ 5y | Auto-set Gratuity Eligible = Yes (override) |
| Last Salary Drawn filled | Require Salary Certificate |
| Opted for Transport = Yes | Show Bus Route + Bus Stop |
| Disability Type = Other | Show Specification |
| Disability Type ≠ None | Show PWD flag, Percentage (required), Certificate |
| Minority = Yes | Show Minority Details (Tab 7) |
| Marital Status = Married | Show Date of Marriage + Spouse fields |
| Married/Widowed | Show Spouse + Emergency Contact quick-copy |
| Has Children = Yes | Show Children sub-table |
| Same as Local Address unchecked | Show Permanent Address (required) |
| Studies Currently Pursuing filled | Show "Leave Required" Yes/No |

**Document pattern (applies everywhere):** not uploaded → Upload button only · uploaded → thumbnail + × to remove + upload-to-replace + Download.

---

## Submission pattern

- **Per-tab save:** `updateStaffProfilePartial(staffProfileId, tab, data)` — saves single tab.
- **Final save:** `updateStaffProfileFull(staffProfileId, data)` — saves all dirty sections.
- **Draft mode:** all tabs support "Save" without locking.
- **Mobile:** 7-tab wizard → vertical stepper on small screens. Field groups stack. Dropdowns become native pickers.

---

## Staff ID Format

`E{YY}{ACRONYM}{SEQ:0000}` — Employee, year, school acronym, 4-digit sequence.

| Segment | Meaning |
|---|---|
| `E` | Fixed prefix — "Employee" |
| `{YY}` | Last 2 digits of joining year |
| `{ACRONYM}` | School acronym, frozen at creation |
| `{SEQ:0000}` | 4-digit sequential, max 9999 per year per school |

**Example:** `E26IIS0001`

---

## ID Card & Appointment Letter (planned)

### ID Card
- Per staff: "Download ID Card" button visible from Tab 1 completion.
- Contents: school name + logo · photo · name + salutation · Staff ID · role/department · valid till (current academic year end, configurable) · emergency contact · school address/contact.
- Format: A6 portrait PDF, server-side. Bulk export: "Download ID Cards (ZIP)" from Staff Directory.

### Appointment Letter
- Auto-generated draft on Stage 1+2 complete (now: Tab 1 + Tab 3 completion).
- Pulls: name, post, department, joining date, basic/gross, employment type, probation.
- Template editable in School Profile → Letter Templates.
- Principal reviews + signs, stored against staff profile.

---

## Bulk Operations (planned)

| | **Quick Enrollment** | **Bulk Full Import** |
|---|---|---|
| Purpose | Start-of-year rush. Admit hundreds in minutes. | Complete data migration from old system. |
| Fields | 12 columns | All Tab 1 + Tab 2 + Tab 3 + Tab 4 + Tab 5 (Tab 6/7 optional) |
| Status | Active immediately | Active immediately |
| Validation | Lenient (warnings) | Strict (hard errors) |
| Photos | None (auto-avatar) | None (auto-avatar) |
| Profile Completion | ~50% | ~80% |

### Quick Enrollment Template (12 columns)
1. `first_name` · 2. `middle_name` · 3. `last_name` (max 50 each) · 4. `father_first_name` · 5. `middle_name` · 6. `father_last_name` · 7. `gender` (Male/Female/Other) · 8. `date_of_birth` (DD/MM/YYYY, age 18–70) · 9. `login_mobile` (+91XXXXXXXXXX) · 10. `Year of Joining` · 11. `primary_subject` (must match Subjects Master) · 12. `account_status` (Active/Inactive).

### Quick Enrollment Auto-Defaults
| Missing | Auto-Default |
|---|---|
| Staff_ID | Auto `E{YY}{ACRONYM}{SEQ:0000}` via Reserve-Release |
| Salutation | Mr./Mrs./Ms./Dr. by Gender/role |
| Category | General |
| Nationality | Indian |
| Minority | No |
| Address | All blank |
| Emergency Contact Name | Blank |
| Emergency Contact Number | = login_mobile |
| Bank Details | All blank |
| Gross Salary | = basic_salary |

### Review & Confirm page
```
You are about to create 40 Quick Enrollment records.
Staff IDs: E26IIS0001 → E26IIS0040
Warnings: 0
Errors: 0
Estimated processing time: 2 seconds

[← Go Back & Edit] [📥 Download Preview Report] [✅ Confirm & Create]
```

### Full Import
All Tab 1–5 required + Tab 6/7 optional. Column headers not renameable, not reorderable. No auto-defaults. Strict validation. See [old spec](https://github.com/MubashirLive/Sharp/blob/early-2026/docs/STAFF_FORM.md) for full column list (will be regenerated when bulk import ships).

---

## Recent Bulk Actions & Revert (planned)

**Panel** on Staff Directory: Date · User · Mode · Count · Status · [Revert].

**Revert rules:**
- Available for 2 hours after creation.
- Deletes batch, releases Staff IDs back to pool.
- Irreversible. Confirmation shows count + ID range.
- After 2 hours → Revert disappears, individual edit/delete only.

---

## Off-boarding flow (planned, integrates with STAFF_DELETION.md)

1. Account Status set to Inactive → Separation Details section expands (when built).
2. Admin fills Reason / Date of Leaving / Exit / Relieving / F&F / Re-Hire Eligible.
3. On save: login access revoked immediately.
4. Cascade checks per `docs/STAFF_DELETION.md` §2: Class Teacher (block), Sole Coordinator (block), Sole Department Incharge (block), House membership (block).
5. Relieving Letter auto-generated from template (similar to Appointment Letter).
6. **Staff ID never reused** — preserved in history for audit.

---

## Declaratory Statement (planned)

End-of-form affirmation:
> *"I affirm that the information provided is true. I understand that furnishing any false information may result in management taking disciplinary action against me."*

Mandatory "I agree" checkbox on Review & Submit screen. Date + digital signature/OTP stored.