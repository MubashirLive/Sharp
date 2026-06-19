# Student Form

> **Status:** In progress. 2 of 10 tabs implemented (`Tab1Identity`, `Tab3PersonalProfile`). Container at `src/components/student/StudentFormDialog.tsx` defines all 10 tabs and tab-completion lock logic; tabs 2, 4–10 stub-rendered.
> See `docs/STUDENT_FORM.md` for original spec; this doc tracks current state.

---

## Spec (10-tab wizard)

| # | Tab | Status | File |
|---|---|---|---|
| 1 | Identity & Academic | ✅ Implemented | `tabs/Tab1Identity.tsx` |
| 2 | Guardian Details | ❌ Stub | — |
| 3 | Social & Background | ✅ Implemented | `tabs/Tab3PersonalProfile.tsx` |
| 4 | Address | ❌ Stub | — |
| 5 | Academic Profile | ❌ Stub | — |
| 6 | Photo & Health | ❌ Stub | — |
| 7 | Parent Information | ❌ Stub | — |
| 8 | Transfer & Transport | ❌ Stub | — |
| 9 | Siblings & Documents | ❌ Stub | — |
| 10 | Government IDs & Finance | ❌ Stub | — |

Container implements tab-completion lock: tabs 2–10 disabled until Tab 1 saves successfully (`tabStatus[1] === false` → all locked).

### Container contract

- `StudentFormDialog({ open, onClose })` — controlled open/close.
- Internal state: `activeTab: 1..10`, `form: Partial<Tab1Form>`, `errors`, `tabStatus: Record<TabIndex, boolean>`.
- Zod schemas imported from `@/lib/schemas`: `studentTab1Schema` … `studentTab10Schema`. Only `studentTab1Schema` and `studentTab3Schema` are exercised by current tabs.
- `handleSaveTab1` calls `reserve_student_id` RPC. ID assignment path is wired; subsequent tabs not yet rendered.
- Footer: Cancel + Save & Continue / Next.

---

## Student ID Format

`S{YY}{ACRONYM}{SEQ:00000}` — Student, year, school acronym, 5-digit sequence.

| Segment | Meaning |
|---|---|
| `S` | Fixed prefix |
| `{YY}` | Last 2 digits of creation year |
| `{ACRONYM}` | School acronym (frozen at creation) |
| `{SEQ:00000}` | 5-digit sequential, max 99999 per year per school |

**Example:** `S26IIS00001`

### Reserve-Release (spec)

1. **`student_id_sequences`** table — `(school_id, year, last_assigned, reserved_count)`.
2. **Preview** — read `last_assigned`, reserve `last+1..last+N`, increment `reserved_count` with row-level lock.
3. **Cancel / timeout (30min)** — release.
4. **Commit** — `last_assigned += N`, `reserved_count -= N`.
5. **Simultaneous imports** — atomic row-level lock prevents collision.

**Edge cases:** Jan 1 year rollover → sequence resets. Acronym change → existing IDs keep old acronym forever.

**Status:** `reserve_student_id` RPC called by `handleSaveTab1`. Migration for sequence table + `release_/commit_` RPCs **not yet shipped** (Phase 1 PENDING in §Unfinished Tasks).

---

## Field Reference (per tab)

### Tab 1 — Identity & Academic (implemented)
First/Middle/Last Name, Father First/Middle/Last Name, Gender, Login Mobile, Class (DB dropdown), Section (DB dropdown), Subject checkboxes (My School → Subject Tab, filtered by class), House (DB dropdown).

On save → Student ID generated → remaining tabs unlock.

### Tab 2 — Guardian Details (planned)
Primary Guardian (hidden logic), Father/Mother/Guardian Mobile + WhatsApp + Email, Guardian Name + Relation, Student Mobile + WhatsApp, Emergency Contact (Name/Number/WhatsApp/Relation), Email.

Conditional: Father/Mother/Guardian fields mandatory based on Primary Guardian choice.

### Tab 3 — Social & Background (implemented)
Category, Subcaste (conditional: SC/ST/OBC), Caste Certificate Number (conditional, required for SC/ST/OBC), Religion/Belief + Specify (conditional), Nationality, Mother Tongue, Medium of Instruction, Minority, Only Child, Single Parent/Orphan, First Generation Learner.

### Tab 4 — Address (planned)
Address Line 1/2, City/Village, District (master dropdown), State, PIN. Permanent Address fields appear only if "Same as Local Address" unchecked.

### Tab 5 — Academic Profile (planned)
Admission Date*, Admission Type, Roll Number (auto-generated, read-only preview), Account Status.

### Tab 6 — Photo & Health (planned)
Photo*, Blood Group, Height (cm), Weight (kg), Date of Measurement.

### Tab 7 — Parent Information (planned)
School Internal ID (admin reference), Father/Mother/Guardian Qualification + Occupation + Photo. Mother Education Level. Guardian fields conditional on Primary Guardian.

### Tab 8 — Transfer & Transport (planned)
Previous School Name/UDISE/Board, Last Exam Class/Year/Result/Percentage, SLC, Opted for Transport (gates Bus Route/Stop).

### Tab 9 — Siblings & Documents (planned)
Siblings sub-table (+ Add, soft limit 5). Toggle+upload rows: Birth, Caste, Marksheet, SLC, Aadhar, Disability, Minority, Bank Passbook. Auto-toggle rule: file uploaded → toggle = Yes. Warning rule: toggle = Yes but no file → "Document marked received but no file uploaded."

### Tab 10 — Government IDs & Finance (planned)
Aadhar No. (disabled if "Aadhar Not Available" checked), SSSM ID + Family ID (conditional if school.state = MP), Disability Type + Specification (conditional) + Percentage (required if ≠ None) + Certificate, Student Bank A/c No., IFSC (required if A/c filled), Bank Name/Branch, Passbook, Receives Free Textbooks, Receives Midday Meal, Receives Scholarship (+ Scholarship Name), BPL/AAY/EWS Status, RTE Admission (auto-set if Admission Type = RTE Quota), Minority Certificate Received + Upload.

---

## Global conditional rules

| Trigger | Effect |
|---|---|
| Category = SC/ST/OBC | Show Subcaste + Caste Certificate Number (latter required) |
| Religion/Belief = Other | Show manual specify |
| Admission Type = Transfer or Previous School Name filled | Expand transfer block in Tab 8 |
| Opted for Transport = Yes | Show Bus Route + Bus Stop |
| Disability Type = Other | Show Specification |
| Disability Type ≠ None | Show Disability Certificate |
| Minority = Yes (set in Tab 3) | Show Minority Details in Tab 10 |
| Primary Guardian = Father/Mother/Guardian/Grandparent/Other | Show & require matching fields |
| Same as Local Address unchecked | Show + require Permanent Address fields |
| Aadhar Not Available checked | Disable Aadhar input |
| Student Bank A/c filled | Require IFSC |
| School Internal ID | Tab 7 only |

**Document pattern (applies everywhere):** not uploaded → Upload button only · uploaded → thumbnail + × to remove + upload-to-replace + Download · Aadhar no upload · SSSM ID has separate upload for physical card copy.

**Mobile:** 10-tab wizard collapses to vertical stepper on tablets/mobile. Field groups stack vertically. Dropdowns become native pickers.

---

## Bulk Operations (planned — not implemented)

| | **Quick Enrollment** | **Bulk Full Import** |
|---|---|---|
| Purpose | Start-of-year rush. Admit hundreds in minutes. | Complete data migration from old system. |
| Fields | 10 columns | All tabs (~80+ columns) |
| Status | Active immediately | Active immediately |
| Validation | Lenient (warnings) | Strict (hard errors) |
| Photos | None (auto-avatar) | None (auto-avatar) |
| Profile Completion | ~35% after import | ~80% after import |

### Quick Enrollment Template (10 columns)
1. `first_name` — max 50
2. `last_name` — max 50
3. `gender` — Male/Female/Other
4. `date_of_birth` — DD/MM/YYYY (age 2.5–20)
5. `class` — must match active session
6. `section` — must match active session
7. `house` — must match House Master
8. `father_first_name` — max 50
9. `father_last_name` — max 50
10. `login_mobile` — `+91XXXXXXXXXX`

### Quick Enrollment Auto-Defaults
Missing field → auto-default: `Primary Guardian = Father` · `Father's Mobile = login_mobile` · `Father's Email` blank · `Mother's details` blank · `Guardian details` hidden · `Emergency Contact = father details` · `Admission Date = today` · `Admission Type = New` · `Category = General` · `Address fields` blank · `Nationality = Indian` · `Account Status = Active` · other social fields blank/No.

### Full Import Template
~80+ columns covering Tabs 1–10. Headers not renameable, not reorderable.

---

## House Management

**Default houses:** RED, BLUE, GREEN, YELLOW.

**Principal control** — School Profile → House section: rename, add, delete. `student.house` is FK to House Master. Delete blocked if students assigned. Rename instant for all.

**Validation:** name must match House Master exactly (case-insensitive).

---

## Recent Bulk Actions & Revert (planned)

**Panel:** Date · User · Mode · Count · Status · [Revert]

**Revert rules:** available for 2 hours after creation · deletes batch · releases IDs back to pool · irreversible · confirmation shows count and ID range.

**Error prevention:** Dry Test button · Review & Confirm page · Download Preview Report · max 500 rows/file · 2-hour revert window.

---

## Profile Completion Bar (planned)

Calculated across all 10 tabs. **No functional restrictions** at any level.

Guided Completion Panel: per-tab status + guidance. Quick-enrolled students start at ~35%.

---

## Unfinished Tasks (Phase 1–5)

### Phase 1 — Reserve-Release
- [x] `reserve_student_id` RPC called in `handleSaveTab1`
- [x] Commit on save (in `handleFinalSave`)
- [ ] Release on timeout/cancel (needs edge function cleanup)
- [ ] Migration for `student_id_sequences` table
- [ ] Migration for `reserve_/release_/commit_student_id` RPCs

### Phase 2 — Document Uploads
- [ ] `UploadField` uses `<Input type="file">` — needs Supabase Storage
- [ ] `DocumentRow` refactor for storage bucket
- [ ] Storage bucket for student documents
- [ ] Upload/delete functions using Supabase Storage API
- [ ] Upload progress / error / cleanup

### Phase 3 — Integration Gaps
- [ ] Aadhar encrypt — calls RPC `encrypt_text` that doesn't exist
- [ ] IFSC validation — no real-time format check
- [ ] Duplicate mobile check — not implemented for new field names
- [ ] `school.acronym` fetch — hardcoded as `"SCH"`
- [ ] Academic year — hardcoded as `"26"`

### Phase 4 — Bulk Import Rewrite
- [ ] Current 14-column spec outdated
- [ ] 10-column Quick Enrollment mode
- [ ] 80-column Full Import mode
- [ ] Pre-validation UI (green/yellow/red indicators)
- [ ] Tentative ID Preview table
- [ ] Dry Test functionality
- [ ] Recent Bulk Actions panel
- [ ] Revert within 2hr window

### Phase 5 — UI Polish
- [ ] Class 11/12 Subject checkbox (toggle + bucket UI)
- [ ] District master dropdown
- [ ] Same as Local Address checkbox logic
- [ ] Mother fields conditional on Primary Guardian
- [ ] Live Login Mobile uniqueness check
- [ ] Profile completion bar calculation update
- [ ] Implement Tabs 2, 4, 5, 6, 7, 8, 9, 10 components

### Next session priority
1. Implement Tab 2 (Guardian Details) and Tab 4 (Address) — no schema risk, pure UI.
2. Ship Phase 1 migrations (`student_id_sequences` table + RPCs).
3. Fix hardcoded values (`school.acronym`, academic year) — read from session.
4. Add document upload to Supabase Storage (Phase 2).
5. Live validation: IFSC format, duplicate mobile check.
6. Bulk import rewrite for 10-col/80-col modes.