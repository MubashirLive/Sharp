# RUN.md — Student Form Rewrite Automation

This script automates the student form rewrite based on the final `docs/STUDENT_FORM.md` spec and the plan file.

## Prerequisites

1. Complete CAPS UP editing of `docs/STUDENT_FORM.md`
2. Review and approve this plan file
3. Run: `git add . && git commit -m "feat: student form rewrite plan"`

## Execution

```bash
# Run the workflow
node -r tsx/register scripts/run-student-form-rewrite.js
```

## Workflow Steps

### Phase 1: Schema Migration

1. **Read final spec** and generate migration list
2. **Create migrations** in order:
   - `2026060XXXXXX_student_id_sequences.sql` - Reserve-Release mechanism
   - `2026060XXXXXX_students_aadhar_encrypted.sql` - Encrypted Aadhar
   - `2026060XXXXXX_student_bulk_actions.sql` - Revert panel
   - `2026060XXXXXX_student_id_cleanup.sql` - 30-min reservation cleanup
   - `2026060XXXXXX_encrypt_text_decrypt_text.sql` - RPC functions
3. **Apply each migration** via MCP
4. **Regenerate types** after each migration

### Phase 2: Schema Rewrite

1. **Read `src/lib/schemas.ts`** (lines 79-197)
2. **Rewrite Zod schemas** for 10 tabs:
   - `studentTab1Schema` (Identity)
   - `studentTab2Schema` (Photo & Family)
   - `studentTab3Schema` (Personal Profile)
   - `studentTab4Schema` (Address & Location)
   - `studentTab5Schema` (Academic & House)
   - `studentTab6Schema` (Family Extended)
   - `studentTab7Schema` (Operational)
   - `studentTab8Schema` (Government IDs)
   - `studentTab9Schema` (Bank Details)
   - `studentTab10Schema` (Medical & Disability)
3. **Update types** to match new schema structure

### Phase 3: Component Split

1. **Gut `src/pages/Students.tsx`** - keep list page (~250 lines)
2. **Create `src/components/student/StudentFormDialog.tsx`** with 10-tab structure
3. **Create 10 tab components** in `src/components/student/tabs/`
4. **Extract shared components**:
   - `UploadField.tsx` (with Supabase Storage)
   - `DocumentRow.tsx`
   - `Field.tsx` wrapper
5. **Move utilities**:
   - `calcCompletion.ts`
   - Reserve-Release hooks

### Phase 4: Edge Function

1. **Create `supabase/functions/create-student-user/index.ts`**
2. **Implement reserve/commit flow** with idempotency key
3. **Test with concurrent requests**

### Phase 5: Wire Up

1. **Replace all buttons** with `<SubmitButton>` + `useGuardedSubmit`
2. **Update RLS policies** for new columns
3. **Add completion bar** to list rows
4. **Create profile page** (if missing)

### Phase 6: Verify

1. **Run `npm run build`** - check for TS errors
2. **Test form flow** - Add Student → 10 tabs → submit
3. **Test bulk import** - Quick + Full modes
4. **Test Reserve-Release** - simultaneous imports
5. **Test revert** - within 2hr window
6. **Test RLS** - multi-tenant isolation

## Exit Conditions

- ✅ All migrations applied
- ✅ No TS errors
- ✅ Form submits successfully
- ✅ Bulk import creates records
- ✅ Student IDs reserve/release correctly
- ✅ Completion bars show in list
- ✅ Mobile responsive (360px)

## Rollback

If any phase fails:
1. `git reset --hard HEAD~1`
2. Manually review failed changes
3. Fix issues before re-run

---

*This script reads the plan file and spec doc to drive execution. Human review required after major phases.*