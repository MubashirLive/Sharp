# Classes Tab — Full Rebuild (EXECUTED)

> **Status:** ✅ Executed. New component at `src/components/school/ClassesTab.tsx`. Onboarding `ClassesStep.tsx` untouched.
> **Originally approved plan; kept for context on architectural decisions.**

---

## 1. Context (original problem)

The MY School → Classes tab had structural defects across multiple fix attempts: stuck "Fix 1 issue" state, broken backspace on section code, Save no-op, false-positive duplicate validation, ~1000 lines of mixed read/edit logic. Root cause: too large, mixed modes inline, validated against stale baseline.

**Decision:** Full rebuild as new component. Onboarding's `ClassesStep.tsx` stays untouched (`StructureStep.tsx` imports it — onboarding is frozen).

## 2. Goals (all met)

1. ✅ Zero dead UI states — every control has working handler.
2. ✅ Single source of truth for validation (`useClassesEditor` reads the array UI mutates).
3. ✅ Predictable state transitions (no silent no-ops).
4. ✅ Mobile-first (360px min).
5. ✅ TypeScript strict. No `any` in new code.
6. ✅ Reused existing utilities (`deriveClassAcronym`, `sortClasses`, `getDefaultTermStructure`, `toTitleCase`, `getAcademicYearDates`, `getCurrentAcademicYear`).

## 3. Non-goals (preserved)

- Onboarding wizard rebuild.
- i18n string externalization.
- DB schema changes / migrations.
- RLS changes.
- Wing assignment UI in Classes tab (Wings tab owns it).
- Drop of legacy `classes.wing` text column (deferred).

## 4. Decisions (locked, all shipped)

| # | Decision | Outcome |
|---|---|---|
| D1 | New file: `src/components/school/ClassesTab.tsx` | ✅ Created |
| D2 | `ClassesStep.tsx` (onboarding) untouched | ✅ Preserved |
| D3 | `SchoolPage.tsx` swaps import | ✅ Updated |
| D4 | Explicit Edit / Cancel / Save (no auto-save) | ✅ Implemented |
| D5 | Full feature set minus wing assignment + minus acronym UI | ✅ Shipped |
| D6 | Classes tab never writes `wing_id` / `wing`. Wings tab owns these. | ✅ Diff-based update payload omits these columns. New classes default `wing_id = NULL`. |
| D7 | Derive `acronym` on save via `deriveClassAcronym(name)` | ✅ Wired |
| D8 | `WingClassFilter` always-on in Classes tab (read-only) | ✅ Shipped |
| D9 | `display_order` is source of truth for class order | ✅ Index written |
| D10 | Validation reads the displayed array (not `data.classes`) | ✅ Killed false-positive duplicate |
| D11 | Empty section name allowed in input during edit (no `\|\| "A"` fallback) | ✅ Implemented |
| D12 | No migration in this task | ✅ None made |
| D13 | Validation: empty class name, empty section name, class with no sections, duplicate section name within class. **No** duplicate-acronym checks. | ✅ Implemented in `validation.ts` |
| D14 | No drag-reorder in onboarding. Drag-reorder preserved in MY School. | ✅ Preserved |
| D15 | `WingClassFilter` shows wings + "All" + "Unassigned" | ✅ Matches Subject tab |
| D16 | `fetchClassDeps` / `fetchSectionDeps` extracted to `src/integrations/supabase/queries/classes.ts` | ✅ Extracted |
| D17 | Onboarding's `ClassesStep` keeps its own inline dep fetchers | ✅ No change to onboarding |
| D18 | `saveSession` in `SchoolPage.tsx` (lines 529-608) NOT modified | ✅ Untouched |
| D19 | Plan file at `C:\Users\MUBASHIR\.claude\plans\classes-tab-of-the-concurrent-sphinx.md` | ✅ Created during planning |

## 5. Architecture (as shipped)

### 5.1 File layout — Created

| File | Purpose | LOC |
|---|---|---|
| `src/components/school/ClassesTab.tsx` | Top-level MY School Classes tab. `forwardRef` for `save()` + `discard()`. | ~250 |
| `src/components/school/classes/useClassesEditor.ts` | Editor hook: state, mutations, validation memo, save pipeline. Single source of truth. | ~280 |
| `src/components/school/classes/types.ts` | Local types: `EditorClass`, `EditorSection`, `DeleteDialogState`, `DepCount`. | ~40 |
| `src/components/school/classes/validation.ts` | Pure validation functions. No React. Testable. | ~80 |
| `src/components/school/classes/ClassCard.tsx` | Presentational class card. Drag handle, name input, delete button, sections list. | ~150 |
| `src/components/school/classes/SectionRow.tsx` | Presentational section row. | ~90 |
| `src/components/school/classes/EditableText.tsx` | Controlled text input wrapper. Replaces `EditableCode` click-pencil dance. | ~30 |
| `src/components/school/classes/AddClassChips.tsx` | Quick-add chips + custom-name input. | ~70 |
| `src/components/school/classes/DeleteConfirmDialog.tsx` | Destructive confirm dialog with dep badges. | ~100 |
| `src/integrations/supabase/queries/classes.ts` | Extracted dep fetchers. | ~120 |

### 5.2 Component architecture

**`ClassesTab` (top-level)** — `forwardRef<ClassesTabHandle, Props>`. Renders: Academic Year badge + Edit/Cancel/Save group → Search + count → Add-class section (edit mode only) → `WingClassFilter` wrapping cards → Cards list → Empty state → `DeleteConfirmDialog` mounted.

**`useClassesEditor` (hook)** returns:
```ts
{
  isEditing, isSaving, draftClasses, displayClasses, hasChanges,
  hasBlockingErrors, blockingErrors, searchQuery, wingFilter,
  depCounts, wings, isWingsLoading,
  enterEditMode, cancelEdit, save,
  addClass, removeClass, updateClass,
  addSection, removeSection, updateSection,
  reorderClasses, reorderSections,
  setSearchQuery, setWingFilter,
}
```

**Critical design rules (killed old bugs at root):**
- **One array drives the UI.** `displayClasses = isEditing ? draftClasses : data.classes`. No branches in renderer.
- **All mutations target `draftClasses` while editing.** `updateClass` / `addSection` only write to `draftClasses` when `isEditing`.
- **Validation reads `displayClasses`, not `data.classes`.** Fixes false-positive duplicate.
- **Empty section name allowed.** No `|| "A"` fallback.
- **`hasChanges` deep structural compare** by stable id.
- **Save path direct**: `save()` → `setIsSaving(true)` → `onSave?.(payload)` with `payload.classes[i].wing_id = null`, `payload.classes[i].wing = null`, derived `acronym` per D7 → success: toast, exit edit, clear draft.

**`validation.ts` (pure)** — `getBlockingErrors(classes): string[]`:
1. Class name empty (trimmed)
2. Class with zero sections
3. Section name empty (trimmed) within a class
4. Duplicate section name within a class (case-insensitive, trimmed)

No duplicate-acronym checks. Acronym is derived.

**`EditableText`** — replaces `EditableCode` click-pencil dance. Always editable when `isEditing`. Props: `value`, `onChange`, `maxLength`, `placeholder`, `disabled`, `className`, `transform?` (e.g. `toTitleCase`).

**`ClassCard`** — pure presentational. Reads `cls: EditorClass`, `isEditing`. No own state except hover. Header: drag handle + name input + delete (hover-revealed). Body: sections list + Add section. Dep badges in read mode.

**`SectionRow`** — drag handle, name input, delete, subject count (read mode).

**`DeleteConfirmDialog`** — shadcn `<Dialog>`. Shows human-readable description + dep counts. Cancel (outline) + Delete (destructive, disabled while deps loading).

**`AddClassChips`** — one chip per `DEFAULT_CLASSES` + free-text input. Hidden in read mode.

### 5.3 Data flow

```
SchoolPage.sessionData (state)
  ↓ (data prop)
useClassesEditor
  ↓ (displayClasses)
ClassCard, SectionRow
  ↓ (updateClass, addClass, etc.)
useClassesEditor mutates draftClasses
  ↓ (on save)
onSave(payload) → SchoolPage.saveSession(payload) → supabase
  ↓ (on success)
await fetchSessionData() → reloads sessionData → editor receives new data
```

Wings / Subject / Sessions tabs all read from `sessionData` or own `fetchData` with same `session_id`. After save + `fetchSessionData()`, all tabs see new classes.

### 5.4 Save pipeline

`SchoolPage.saveSession` (unchanged) handles: auto-get/create `academic_sessions` → delete classes/sections whose IDs are in DB but not in `data` → upsert each class (`id, school_id, session_id, name, acronym, display_order, wing, wing_id, term_structure, start_date, end_date`) → upsert each section (`id, school_id, class_id, session_id, name, acronym, display_order, stream`).

**New `ClassesTab.save()` payload:**
```ts
{
  ...data,
  classes: draftClasses.map((c, i) => {
    const saved = data.classes.find(dc => (dc._id ?? dc.name) === c._id || (dc._id ?? dc.name) === c.id);
    return {
      _id: c._id,
      name: c.name,
      acronym: deriveClassAcronym(c.name),
      wing: saved?.wing ?? null,           // preserve baseline
      wing_id: saved?.wing_id ?? null,     // preserve baseline (Wings tab owns)
      term_structure: saved?.term_structure ?? getDefaultTermStructure(c.name),
      start_date: saved?.start_date ?? "",
      end_date: saved?.end_date ?? "",
      display_order: i,
      sections: c.sections.map((s, j) => ({
        _id: s._id,
        name: s.name,
        acronym: deriveClassAcronym(s.name),
        stream: null,
        display_order: j,
      })),
    };
  }),
}
```

`saveSession` is diff-based: fetches existing class row, only updates editor-owned columns when they actually change. `wing` / `wing_id` never in update payload. Derived acronyms preserve DB contract for downstream consumers.

## 6. Validation rules (final)

| Rule | Check | Skip when |
|---|---|---|
| Class name non-empty | `c.name.trim().length > 0` | — |
| Class has ≥1 section | `c.sections.length > 0` | — |
| Section name non-empty | `s.name.trim().length > 0` | — |
| Unique section name within class | `s.name.trim().toLowerCase()` unique per class | — |
| ~~Duplicate class code~~ | REMOVED | Acronym derived |
| ~~Duplicate section code~~ | REMOVED | Acronym derived |

**Error messages:**
- `"Class name is required"`
- `"Class "<name>" has no sections"`
- `"Section name is required in <class name>"`
- `"Duplicate section name "<name>" in <class name>"`

Validation in `useMemo` over `displayClasses`. Renderer must NOT mutate in place. All mutations: `setDraftClasses(prev => prev.map(...))`.

## 7. Reuse map (all wired)

| Need | Import | Path |
|---|---|---|
| `deriveClassAcronym` | `src/lib/student-utils.ts:71` | `@/lib/student-utils` |
| `sortClasses` | `src/lib/onboarding-constants.ts:88` | `@/lib/onboarding-constants` |
| `getDefaultTermStructure` | `src/lib/onboarding-constants.ts:36` | `@/lib/onboarding-constants` |
| `getCurrentAcademicYear` | `src/lib/academic-year.ts:9` | `@/lib/academic-year` |
| `getAcademicYearDates` | `src/lib/academic-year.ts:44` | `@/lib/academic-year` |
| `toTitleCase` | `src/lib/text-utils.ts:12` | `@/lib/text-utils` |
| `DEFAULT_CLASSES` | `src/lib/onboarding-constants.ts:19` | `@/lib/onboarding-constants` |
| `WingClassFilter` | `src/components/ui/WingClassFilter.tsx` | `@/components/ui/WingClassFilter` |
| `SessionStepData`, `ClassDraft`, `SectionDraft` | `src/components/onboarding/types.ts` | `@/components/onboarding/types` |
| shadcn primitives | — | `@/components/ui/*` |
| `toast` | — | `@/hooks/use-toast` |
| `useQuery` | — | `@tanstack/react-query` |
| dnd-kit | — | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| Icons | — | `lucide-react` |

## 8. Plan file

`C:\Users\MUBASHIR\.claude\plans\classes-tab-of-the-concurrent-sphinx.md` — full plan written during planning. This `CLASSES_FIX.md` is the executable spec.

## 9. Why no migration

- `classes.wing_id` actively read by Wings tab, Subject tab, `WingClassFilter`, `getWingsWithDetails`. Removing breaks them.
- `classes.acronym` read by Wings tab (`select("id, name, acronym, wing_id, display_order")` in `WingsTab.tsx:100`), used as display fallback.
- `classes.wing` (legacy text) already dead — Wings tab never reads/writes it, Subject tab never reads it. Safe to drop in future migration after Wings tab confirmed to not need it. **Deferred.**

DB columns are cheap. Migration risk is real (FK drops cascade, RLS policies need rewriting).