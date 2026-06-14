# Classes Tab — Full Rebuild Spec (MY School)

> **Status:** Approved. To be executed at night.
> **Scope:** MY School → Classes tab only. Onboarding is frozen and out of scope.
> **Source of truth for all decisions:** This document. Code that contradicts it = wrong code.

---

## 1. Context

The MY School → Classes tab has accumulated structural defects across multiple fix attempts: stuck "Fix 1 issue" state, broken backspace on section code, Save button no-op, false-positive duplicate validation, and ~1000 lines of mixed read/edit logic. The root cause is structural — the component is too large, mixes modes inline, and reads validation from a stale baseline.

**Decision:** Full rebuild as a new component at `src/components/school/ClassesTab.tsx`. Onboarding's `ClassesStep.tsx` stays untouched. SchoolPage swaps its import.

### Why a new file, not a rewrite of `ClassesStep.tsx`

- `ClassesStep.tsx` is imported by `StructureStep.tsx` for the onboarding wizard. Onboarding is frozen ("we are going to change the onboarding in upcoming days").
- A new file at `src/components/school/` matches the location of `SubjectTab.tsx` — the sibling tab the user references for pattern alignment.
- Zero coupling to onboarding. Zero risk of breaking the wizard.

### Why we are NOT running a migration now

- `classes.wing_id` is actively read by Wings tab, Subject tab, `WingClassFilter`, and `getWingsWithDetails`. Removing breaks them.
- `classes.acronym` is read by Wings tab (`select("id, name, acronym, wing_id, display_order")`, `WingsTab.tsx:100`) and used as a display fallback. Removing silently breaks the Wings tab.
- `classes.wing` (legacy text column) is already dead — Wings tab never reads/writes it, Subject tab never reads it, and once the new `ClassesTab` writes `null` to it, no consumer writes to it. Safe to drop in a future migration after Wings tab is confirmed to not need it. **Out of scope for this task.**
- DB columns are cheap. Migration risk is real (FK drops cascade, RLS policies need rewriting).

---

## 2. Goals

1. Zero dead UI states. Every interactive control has a working handler.
2. Single source of truth for validation. Validation reads the same array the UI mutates.
3. Predictable state transitions. No silent no-ops.
4. Mobile-first (360px minimum viewport).
5. TypeScript strict. No `any` in new code (existing `as any` casts in the old file are not propagated).
6. Reuse every existing utility — do not duplicate `deriveClassAcronym`, `sortClasses`, `getDefaultTermStructure`, `toTitleCase`, `getAcademicYearDates`, `getCurrentAcademicYear`.

## 3. Non-Goals (out of scope)

- Onboarding wizard rebuild. `ClassesStep.tsx` is frozen.
- i18n string externalization (Hindi + English). Keep inline English; do not introduce new i18n scope.
- DB schema changes. No migrations.
- RLS changes.
- Wing assignment UI in Classes tab. Wings tab owns wing assignment.
- Reorder of wings inside Wings tab (separate concern, Wings tab has no reorder UI today).
- Drop of legacy `classes.wing` text column (deferred).

---

## 4. Decisions (locked)

| # | Decision | Rationale |
|---|---|---|
| D1 | New file: `src/components/school/ClassesTab.tsx` | Sibling of `SubjectTab.tsx`. Decouples from onboarding. |
| D2 | `ClassesStep.tsx` (onboarding) untouched | Onboarding is frozen. Risk minimization. |
| D3 | `SchoolPage.tsx` swaps import from `ClassesStep` to `ClassesTab` | Single import change + render block replacement. |
| D4 | Explicit Edit / Cancel / Save (current pattern preserved) | User decision. Not switching to auto-save. |
| D5 | Full feature set minus wing assignment + minus acronym UI | User decision. |
| D6 | Classes tab never writes `wing_id` or `wing`. Wings tab owns these columns exclusively. | Editor preserves baseline `wing_id` for any class not newly created. `saveSession` omits `wing`/`wing_id` from its class update payload and uses diff-based updates (only writes editor-owned columns when they actually change). New classes default to unassigned (`wing_id = NULL`). |
| D7 | Derive `acronym` on save via `deriveClassAcronym(name)` | DB column preserved. Wings tab reads it as display fallback. UI hides it. |
| D8 | `WingClassFilter` always-on in Classes tab (read-only filter) | Matches Subject tab pattern. Filter shows what Wings tab classified. |
| D9 | `display_order` is the source of truth for class order | `saveSession` already writes `display_order = array index`. Wings/Subject/Sessions tabs all read with `.order("display_order")`. |
| D10 | Validation reads the displayed array (not the read-only prop) | Fixes the false-positive duplicate detection from the old code. |
| D11 | Empty section name is allowed in the input during edit | No `|| "A"` fallback. User can backspace to empty. |
| D12 | No migration in this task | Wings tab still reads `acronym` and `wing_id`. `wing` legacy column drop deferred. |
| D13 | Validation rules: empty class name, empty section name, class with no sections, duplicate section name within a class. **No** duplicate-acronym checks. | Acronym is derived, not user-input. |
| D14 | No drag-reorder in onboarding. Drag-reorder preserved in MY School. | Onboarding is frozen. New `ClassesTab` keeps drag. |
| D15 | `WingClassFilter` shows wings + "All" + "Unassigned" | Matches Subject tab. |
| D16 | `fetchClassDeps` / `fetchSectionDeps` extracted to `src/integrations/supabase/queries/classes.ts` | Reusable. New `ClassesTab` imports from there. |
| D17 | Onboarding's `ClassesStep` keeps its own inline copies of the dep fetchers | Don't touch onboarding. Slight duplication accepted. |
| D18 | `saveSession` in `SchoolPage.tsx` (lines 529-608) is NOT modified | It already writes the right fields. New `ClassesTab` payload shape matches. |
| D19 | Plan file is at `C:\Users\MUBASHIR\.claude\plans\classes-tab-of-the-concurrent-sphinx.md` (already written during planning) | This `CLASSES_FIX.md` is the executable spec. |

---

## 5. Architecture

### 5.1 File Layout

#### Create

| File | Purpose | Approx LOC |
|---|---|---|
| `src/components/school/ClassesTab.tsx` | Top-level MY School Classes tab. Forward-ref handle for `save()` + `discard()`. | ~250 |
| `src/components/school/classes/useClassesEditor.ts` | Editor hook: state, mutations, validation memo, save pipeline. Single source of truth. | ~280 |
| `src/components/school/classes/types.ts` | Local types: `EditorClass`, `EditorSection`, `DeleteDialogState`, `DepCount`. | ~40 |
| `src/components/school/classes/validation.ts` | Pure validation functions. No React. Testable. | ~80 |
| `src/components/school/classes/ClassCard.tsx` | Presentational class card. Drag handle, name input, delete button, sections list, add-section button. | ~150 |
| `src/components/school/classes/SectionRow.tsx` | Presentational section row. Drag handle, name input, delete button. | ~90 |
| `src/components/school/classes/EditableText.tsx` | Controlled text input wrapper. Replaces `EditableCode` click-pencil dance. | ~30 |
| `src/components/school/classes/AddClassChips.tsx` | Quick-add chips for `DEFAULT_CLASSES` + custom-name input. | ~70 |
| `src/components/school/classes/DeleteConfirmDialog.tsx` | Destructive confirm dialog with dep badges. | ~100 |
| `src/integrations/supabase/queries/classes.ts` | Extracted dep fetchers: `fetchClassDeps`, `fetchSectionDeps`, `fetchClassDependencyCounts`, `getWingsBySchool`. | ~120 |

**Total new code: ~1210 LOC** (most of it extracted from the old `ClassesStep.tsx`'s 1000-line body, restructured).

#### Modify

- `src/pages/SchoolPage.tsx`:
  - Line 33: change import from `import { ClassesStep } from "@/components/onboarding/ClassesStep"` to `import { ClassesTab } from "@/components/school/ClassesTab"`.
  - Lines 326: rename `classesStepRef` to `classesTabRef` and change type to `ClassesTabHandle` (or keep the name; either is fine, prefer the new name for clarity).
  - Lines 906-922: replace `<ClassesStep ... />` with `<ClassesTab ... />` passing the same props: `ref`, `initialData={sessionData}`, `data={sessionData}`, `onChange`, `onSave={saveSession}`, `schoolId={school.id}`, `isOnboarding={false}`.
  - Lines 1014, 1044, 1085, 1116: update ref name and handle name in tab-switch guard handlers.
  - **Do not modify `saveSession` (lines 529-608).**

- `docs/INDEX.md`: row already added.

#### Keep untouched

- `src/components/onboarding/ClassesStep.tsx` (onboarding).
- `src/components/onboarding/StructureStep.tsx`.
- `src/pages/SchoolOnboarding.tsx`.
- `src/components/wings/WingsTab.tsx`.
- `src/components/wings/*` (Wings tab is upstream consumer, independent).
- `src/components/ui/WingClassFilter.tsx` (reused as-is).
- `src/components/ui/*` (shadcn primitives reused as-is).
- `src/lib/academic-year.ts`, `src/lib/student-utils.ts`, `src/lib/text-utils.ts`, `src/lib/onboarding-constants.ts`, `src/hooks/use-toast`.
- `src/integrations/supabase/types.ts` (regenerate after if any table changes — none planned).
- All migrations, RLS, supabase functions.

### 5.2 Component Architecture

#### `ClassesTab` (top-level)

- Props: `initialData: SessionStepData`, `data: SessionStepData`, `onChange: (d: SessionStepData) => void`, `onSave?: (d: SessionStepData) => Promise<void>`, `schoolId: string`, `isOnboarding?: boolean`, `className?: string`.
- `forwardRef<ClassesTabHandle, Props>` with imperative `save()` and `discard()`.
- Renders:
  1. Header bar: Academic Year badge + Edit / Cancel / Save button group.
  2. Search input + count badge.
  3. Add-class section (only in edit mode): `AddClassChips` + custom-name input.
  4. `WingClassFilter` (always-on) wrapping the cards list.
  5. Cards list: `displayClasses.map(c => <ClassCard ... />)`.
  6. Empty state.
  7. `DeleteConfirmDialog` mounted.

#### `useClassesEditor` (hook — single source of truth)

Returns:

```ts
{
  // state
  isEditing: boolean;
  isSaving: boolean;
  draftClasses: EditorClass[];            // mutated while editing
  displayClasses: EditorClass[];          // isEditing ? draftClasses : data.classes
  hasChanges: boolean;                    // true iff draftClasses !== data.classes
  hasBlockingErrors: boolean;
  blockingErrors: string[];               // human-readable
  searchQuery: string;
  wingFilter: string;                     // "all" | wing.id | "unassigned"
  depCounts: Record<string, DepCount>;    // for delete dialog
  wings: Wing[];                          // fetched via useQuery
  isWingsLoading: boolean;
  // actions
  enterEditMode: () => void;
  cancelEdit: () => void;
  save: () => Promise<void>;
  addClass: (name: string) => void;
  removeClass: (id: string) => Promise<void>;
  updateClass: (id: string, patch: Partial<EditorClass>) => void;
  addSection: (classId: string) => void;
  removeSection: (classId: string, sectionId: string) => Promise<void>;
  updateSection: (classId: string, sectionId: string, patch: Partial<EditorSection>) => void;
  reorderClasses: (fromId: string, toId: string) => void;
  reorderSections: (classId: string, fromId: string, toId: string) => void;
  setSearchQuery: (q: string) => void;
  setWingFilter: (f: string) => void;
}
```

**Critical design rules (kill the old bugs at the root):**

- **One array drives the UI.** `displayClasses` is the ONLY thing the renderer reads. No `isEditing ? local : data` branches inside the renderer.
- **All mutations target `draftClasses` while editing.** Helpers like `updateClass` and `addSection` only write to `draftClasses` when `isEditing`. Outside edit mode, they bubble through `onChange` (matches current read-mode "Edit pencil" pattern for visual feedback only).
- **Validation reads `displayClasses`, not `data.classes`.** This fixes the false-positive duplicate from the old code. When user is in edit mode and clears the offending field, validation sees the fix immediately.
- **Empty section name is allowed.** No `|| "A"` fallback. User can backspace to empty.
- **Section name input is a normal controlled text input** with `maxLength={16}`. The onChange handler does `.toUpperCase().slice(0, 16)` (or no transform — depends on whether section name is uppercase. Current convention: section name is single letter, title-cased via `toTitleCase` if user types more). No `|| "A"` fallback.
- **`hasChanges` uses deep structural compare** by stable id. If id-based compare is cheap, prefer id-based.
- **Save path is direct:** `save()` → `setIsSaving(true)` → calls `onSave?.(payload)` where `payload = { ...data, classes: draftClasses }` — but `payload.classes[i].wing_id = null`, `payload.classes[i].wing = null`, `payload.classes[i].acronym = deriveClassAcronym(payload.classes[i].name)`, `payload.classes[i].sections[j].acronym = deriveClassAcronym(payload.classes[i].sections[j].name)`. → on success, `toast`, exit edit mode, clear `draftClasses`. On blocking error, `toast({title, description, variant:"destructive"})` and bail. On `onSave` undefined, no-op with toast warning.
- **`discard()`** clears `draftClasses`, sets `isEditing=false`, calls `onChange(data)` to reset parent. Used by imperative handle.

#### `validation.ts` (pure functions)

```ts
export function getBlockingErrors(classes: EditorClass[]): string[] {
  // 1. Class name empty (trimmed)
  // 2. Class with zero sections
  // 3. Section name empty (trimmed) within a class
  // 4. Duplicate section name within a class (case-insensitive, trimmed)
  // NO duplicate-acronym checks. Acronym is derived, not user-input.
}

export function hasBlockingErrors(classes: EditorClass[]): boolean {
  return getBlockingErrors(classes).length > 0;
}
```

Pure. No React. No `data.classes` references. Reads the array it is given.

#### `EditableText` (replaces `EditableCode`)

- One component for both class name (maxLength 32) and section name (maxLength 16).
- Props: `value: string`, `onChange: (v: string) => void`, `maxLength: number`, `placeholder?: string`, `disabled?: boolean`, `className?: string`, `transform?: (v: string) => string` (e.g. `toTitleCase`).
- Behavior: while `disabled` is false, render an `<Input>` (or bare `<input>` — match surrounding style) with `value={value}` and `onChange={e => onChange(transform ? transform(e.target.value) : e.target.value)}`.
- No click-to-edit dance. Fields are always editable when `isEditing`.
- This kills the `EditableCode` "click pencil → type → Enter" pattern that confused users.

#### `ClassCard`

- Pure presentational. Reads `cls: EditorClass` and `isEditing: boolean`. No own state except hover for delete button visibility.
- Header: drag handle (`<GripVertical>`), name input (`<EditableText>`), delete button (X icon, hover-revealed).
- Body: sections list with `<SectionRow>` per section, "Add section" button at bottom.
- Dependency badges (students/teachers) shown next to class name in read mode.

#### `SectionRow`

- Drag handle, section name input, delete button, subject count (read mode).
- In edit mode: name input enabled.

#### `DeleteConfirmDialog`

- Renders shadcn `<Dialog>`. Props: `open`, `onOpenChange`, `itemName`, `itemType: 'class'|'section'`, `deps: DepCount`, `loading`, `onConfirm`.
- Shows human-readable description of what will be deleted and the dep counts.
- Two buttons: "Cancel" (outline) and "Delete" (destructive).
- Disables Delete button while `loading` deps.

#### `AddClassChips`

- Renders one chip per `DEFAULT_CLASSES` entry (Nursery, LKG, UKG, Class 1-12). Click adds the class.
- Plus a free-text input that creates a class from a typed name (title-cased, acronym derived, auto-section A).
- Hidden in read mode.

### 5.3 Data Flow

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

Wings tab, Subject tab, Sessions tab all read from `sessionData` (or from their own `fetchData` calls with the same `session_id`). After save + `fetchSessionData()`, all tabs see the new classes on their next visit.

### 5.4 Save Pipeline (no change in `saveSession`)

`SchoolPage.saveSession` (lines 529-608) handles:
- Auto-get or create `academic_sessions` row.
- Delete classes/sections whose IDs are in DB but not in `data`.
- Upsert each class with `id, school_id, session_id, name, acronym, display_order, wing, wing_id, term_structure, start_date, end_date`.
- Upsert each section with `id, school_id, class_id, session_id, name, acronym, display_order, stream`.

**Payload from new `ClassesTab.save()`:**
```ts
{
  ...data,
  classes: draftClasses.map((c, i) => {
    // Find matching saved class to preserve fields the new tab doesn't manage.
    // If the class is brand new (no match in data.classes), derive defaults.
    const saved = data.classes.find(dc => (dc._id ?? dc.name) === c._id || (dc._id ?? dc.name) === c.id);
    return {
      _id: c._id,
      name: c.name,
      acronym: deriveClassAcronym(c.name),               // D7
      wing: saved?.wing ?? null,                         // D6: preserve baseline
      wing_id: saved?.wing_id ?? null,                   // D6: preserve baseline (Wings tab owns this)
      term_structure: saved?.term_structure ?? getDefaultTermStructure(c.name),
      start_date: saved?.start_date ?? "",
      end_date: saved?.end_date ?? "",
      display_order: i,                                  // D9 (in saveSession line 587)
      sections: c.sections.map((s, j) => ({
        _id: s._id,
        name: s.name,
        acronym: deriveClassAcronym(s.name),             // D7
        stream: null,
        display_order: j,
      })),
    };
  }),
}
```

`saveSession` is diff-based: it fetches the existing class row and only updates the editor-owned columns (`name`, `acronym`, `display_order`, `term_structure`, `start_date`, `end_date`) when they actually change. `wing` and `wing_id` are never included in the update payload — Wings tab is the sole owner of those columns (D6). New classes insert the editor-owned columns only; `wing_id` defaults to NULL on the DB and the class appears as "Unassigned" in the Wings tab until the user assigns it. Derived acronyms preserve DB contract for downstream consumers.

---

## 6. Validation Rules (final, no ambiguity)

| Rule | Check | Skip when |
|---|---|---|
| Class name non-empty | `c.name.trim().length > 0` | — |
| Class has ≥1 section | `c.sections.length > 0` | — |
| Section name non-empty | `s.name.trim().length > 0` | — |
| Unique section name within a class | `s.name.trim().toLowerCase()` is unique per class | — |
| ~~Duplicate class code~~ | REMOVED | Acronym is derived. |
| ~~Duplicate section code~~ | REMOVED | Acronym is derived. |

Error messages:
- `"Class name is required"`
- `"Class "<name>" has no sections"`
- `"Section name is required in <class name>"`
- `"Duplicate section name "<name>" in <class name>"`

Validation runs in `useMemo` over `displayClasses` (which is `draftClasses` in edit mode). Re-runs only when the array reference changes — so the renderer must NOT mutate in place. All mutations go through `setDraftClasses(prev => prev.map(...))`.

---

## 7. Reuse Map

| Need | Import from | Path |
|---|---|---|
| `deriveClassAcronym` | `src/lib/student-utils.ts:71` | `@/lib/student-utils` |
| `sortClasses` | `src/lib/onboarding-constants.ts:88` | `@/lib/onboarding-constants` |
| `getDefaultTermStructure` | `src/lib/onboarding-constants.ts:36` | `@/lib/onboarding-constants` |
| `getCurrentAcademicYear` | `src/lib/academic-year.ts:9` | `@/lib/academic-year` |
| `getAcademicYearDates` | `src/lib/academic-year.ts:44` | `@/lib/academic-year` |
| `toTitleCase` | `src/lib/text-utils.ts:12` | `@/lib/text-utils` |
| `DEFAULT_CLASSES` | `src/lib/onboarding-constants.ts:19` | `@/lib/onboarding-constants` |
| `WingClassFilter` | `src/components/ui/WingClassFilter.tsx` | `@/components/ui/WingClassFilter` |
| `WingFilterOption` | exported from `WingClassFilter.tsx` | `@/components/ui/WingClassFilter` |
| shadcn `Button`, `Input`, `Dialog`, `Select`, `Badge`, `Tooltip`, `Tabs` | `src/components/ui/*` | `@/components/ui/button` etc. |
| `toast` | `src/hooks/use-toast.ts` | `@/hooks/use-toast` |
| `SessionStepData`, `ClassDraft`, `SectionDraft` types | `src/components/onboarding/types.ts` | `@/components/onboarding/types` |
| `useQuery` from react-query | existing | `@tanstack/react-query` |
| `dnd-kit` (`DndContext`, `SortableContext`, `useSortable`, `closestCenter`, `PointerSensor`, `KeyboardSensor`, `useSensor`, `useSensors`, `arrayMove`) | existing | `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` |
| Icons (`GripVertical`, `Plus`, `Trash2`, `Pencil`, `X`, `Save`, `Search`, `Loader2`, `AlertTriangle`) | `lucide-react` | `lucide-react` |

---

## 8. Editor Hook — Detailed Skeleton

```ts
// useClassesEditor.ts
import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { deriveClassAcronym } from "@/lib/student-utils";
import { getBlockingErrors } from "./validation";
import { fetchClassDependencyCounts, fetchSectionDeps, getWingsBySchool } from "@/integrations/supabase/queries/classes";
import type { EditorClass, EditorSection, DeleteDialogState, DepCount } from "./types";
import type { SessionStepData } from "@/components/onboarding/types";

export interface UseClassesEditorOptions {
  data: SessionStepData;
  schoolId: string;
  onChange: (d: SessionStepData) => void;
  onSave?: (d: SessionStepData) => Promise<void>;
  onSaved?: () => void;                  // parent re-fetches
}

export function useClassesEditor(opts: UseClassesEditorOptions) {
  const { data, schoolId, onChange, onSave, onSaved } = opts;
  const [isEditing, setIsEditing] = useState(false);
  const [draftClasses, setDraftClasses] = useState<EditorClass[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [wingFilter, setWingFilter] = useState("all");
  const [delDialog, setDelDialog] = useState<DeleteDialogState | null>(null);
  const [depCounts, setDepCounts] = useState<Record<string, DepCount>>({});

  // source of truth for UI
  const displayClasses = isEditing ? draftClasses : data.classes;
  const blockingErrors = useMemo(() => getBlockingErrors(displayClasses), [displayClasses]);
  const hasChanges = useMemo(() => isEditing && !deepEqual(draftClasses, data.classes), [isEditing, draftClasses, data.classes]);

  // fetch wings
  const { data: wings = [], isLoading: isWingsLoading } = useQuery({
    queryKey: ["school", schoolId, "classes-wings"],
    queryFn: () => getWingsBySchool(schoolId),
    staleTime: 30_000,
  });

  // fetch dep counts (read mode only, for delete dialog badges)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!schoolId) return;
      const counts: Record<string, DepCount> = {};
      for (const c of data.classes) {
        if (!c._id) continue;
        const sectionIds = (c.sections ?? []).map(s => s._id).filter(Boolean) as string[];
        if (sectionIds.length === 0) { counts[c._id] = { students: 0, subjects: 0, teachers: 0 }; continue; }
        const result = await fetchClassDependencyCounts(schoolId, c._id, sectionIds);
        if (!cancelled) counts[c._id] = result;
      }
      if (!cancelled) setDepCounts(counts);
    })();
    return () => { cancelled = true; };
  }, [data.classes, schoolId]);

  // mutators — all go through these
  const updateClass = useCallback((id: string, patch: Partial<EditorClass>) => {
    if (isEditing) {
      setDraftClasses(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    } else {
      onChange({
        ...data,
        classes: data.classes.map(c => c.id === id ? { ...c, ...patch } : c) as any,
      });
    }
  }, [isEditing, data, onChange]);

  const addClass = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const source = isEditing ? draftClasses : data.classes;
    if (source.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) return;
    const newCls: EditorClass = {
      id: crypto.randomUUID(),
      name: trimmed,
      sections: [{ id: crypto.randomUUID(), name: "A" }],
    };
    if (isEditing) {
      setDraftClasses(prev => [...prev, newCls]);
    } else {
      onChange({ ...data, classes: [...data.classes, newCls as any] });
    }
  }, [isEditing, draftClasses, data, onChange]);

  const removeClass = useCallback(async (id: string) => {
    const cls = displayClasses.find(c => c.id === id);
    if (!cls) return;
    if (!cls._id) {
      // unsaved — remove without confirm
      if (isEditing) {
        setDraftClasses(prev => prev.filter(c => c.id !== id));
      } else {
        onChange({ ...data, classes: data.classes.filter(c => (c._id ?? c.name) !== id) as any });
      }
      return;
    }
    // saved — open dialog with dep fetch
    const sectionIds = (cls.sections ?? []).map(s => s._id).filter(Boolean) as string[];
    setDelDialog({ open: true, itemName: cls.name, itemType: "class", cls, deps: null, loading: true });
    const deps = await fetchClassDependencyCounts(schoolId, cls._id, sectionIds);
    setDelDialog(d => d ? { ...d, deps, loading: false } : d);
  }, [displayClasses, isEditing, data, onChange, schoolId]);

  const confirmClassDelete = useCallback(() => {
    if (!delDialog) return;
    const id = delDialog.cls.id;
    if (isEditing) {
      setDraftClasses(prev => prev.filter(c => c.id !== id));
    } else {
      onChange({ ...data, classes: data.classes.filter(c => (c._id ?? c.name) !== id) as any });
    }
    setDelDialog(null);
  }, [delDialog, isEditing, data, onChange]);

  const addSection = useCallback((classId: string) => {
    const nextLetter = pickNextSectionLetter(displayClasses.find(c => c.id === classId)?.sections ?? []);
    const newSec: EditorSection = { id: crypto.randomUUID(), name: nextLetter };
    updateClass(classId, { sections: [...(displayClasses.find(c => c.id === classId)?.sections ?? []), newSec] });
  }, [displayClasses, updateClass]);

  const removeSection = useCallback(async (classId: string, sectionId: string) => {
    const cls = displayClasses.find(c => c.id === classId);
    const sec = cls?.sections.find(s => s.id === sectionId);
    if (!cls || !sec) return;
    if (!sec._id) {
      // unsaved — remove without confirm
      updateClass(classId, { sections: cls.sections.filter(s => s.id !== sectionId) });
      return;
    }
    // saved — open dialog
    setDelDialog({ open: true, itemName: sec.name, itemType: "section", cls, si: sectionId, deps: null, loading: true });
    const deps = await fetchSectionDeps(schoolId, sec._id);
    setDelDialog(d => d ? { ...d, deps, loading: false } : d);
  }, [displayClasses, updateClass, schoolId]);

  const confirmSectionDelete = useCallback(() => {
    if (!delDialog || delDialog.itemType !== "section" || !delDialog.si) return;
    const classId = delDialog.cls.id;
    const sectionId = delDialog.si;
    const cls = displayClasses.find(c => c.id === classId);
    if (!cls) return;
    updateClass(classId, { sections: cls.sections.filter(s => s.id !== sectionId) });
    setDelDialog(null);
  }, [delDialog, displayClasses, updateClass]);

  const updateSection = useCallback((classId: string, sectionId: string, patch: Partial<EditorSection>) => {
    const cls = displayClasses.find(c => c.id === classId);
    if (!cls) return;
    updateClass(classId, {
      sections: cls.sections.map(s => s.id === sectionId ? { ...s, ...patch } : s),
    });
  }, [displayClasses, updateClass]);

  const reorderClasses = useCallback((fromId: string, toId: string) => {
    const source = isEditing ? draftClasses : data.classes;
    const fromIdx = source.findIndex(c => c.id === fromId);
    const toIdx = source.findIndex(c => c.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = arrayMove(source, fromIdx, toIdx);
    if (isEditing) setDraftClasses(next);
    else onChange({ ...data, classes: next as any });
  }, [isEditing, draftClasses, data, onChange]);

  const reorderSections = useCallback((classId: string, fromId: string, toId: string) => {
    const cls = displayClasses.find(c => c.id === classId);
    if (!cls) return;
    const fromIdx = cls.sections.findIndex(s => s.id === fromId);
    const toIdx = cls.sections.findIndex(s => s.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const next = arrayMove(cls.sections, fromIdx, toIdx);
    updateClass(classId, { sections: next });
  }, [displayClasses, updateClass]);

  const enterEditMode = useCallback(() => {
    setDraftClasses(data.classes.map(c => ({
      id: c._id ?? c.name,
      _id: c._id,
      name: c.name,
      sections: c.sections.map(s => ({
        id: s._id ?? s.name,
        _id: s._id,
        name: s.name,
      })),
    })));
    setIsEditing(true);
  }, [data.classes]);

  const cancelEdit = useCallback(() => {
    setDraftClasses([]);
    setIsEditing(false);
    onChange(data);  // reset parent
  }, [data, onChange]);

  const save = useCallback(async () => {
    if (blockingErrors.length > 0) {
      toast({ title: "Fix errors before saving", description: blockingErrors[0], variant: "destructive" });
      return;
    }
    if (!onSave) {
      toast({ title: "Save not available", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const payload: SessionStepData = {
        ...data,
        classes: draftClasses.map((c, i) => {
          // Preserve term_structure + dates from existing saved class (if any).
          const saved = data.classes.find(dc => (dc._id ?? dc.name) === c._id || (dc._id ?? dc.name) === c.id);
          return {
            _id: c._id,
            name: c.name,
            acronym: deriveClassAcronym(c.name),
            wing: null,           // D6
            wing_id: null,        // D6
            term_structure: saved?.term_structure ?? getDefaultTermStructure(c.name),
            start_date: saved?.start_date ?? "",
            end_date: saved?.end_date ?? "",
            sections: c.sections.map((s, j) => ({
              _id: s._id,
              name: s.name,
              acronym: deriveClassAcronym(s.name),
              stream: null,
            })),
          };
        }) as any,
        // NOTE: display_order is set by saveSession from array index — no need to set here
      };
      await onSave(payload);
      toast({ title: "Classes & sections saved" });
      setIsEditing(false);
      setDraftClasses([]);
      onSaved?.();
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Save failed");
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [blockingErrors, onSave, data, draftClasses, onSaved]);

  return {
    isEditing, isSaving, draftClasses, displayClasses, hasChanges,
    hasBlockingErrors: blockingErrors.length > 0, blockingErrors,
    searchQuery: search, wingFilter, depCounts, wings, isWingsLoading,
    enterEditMode, cancelEdit, save,
    addClass, removeClass, confirmClassDelete, updateClass,
    addSection, removeSection, confirmSectionDelete, updateSection,
    reorderClasses, reorderSections,
    setSearchQuery: setSearch, setWingFilter,
    delDialog, setDelDialog,
  };
}

// helpers
function pickNextSectionLetter(sections: EditorSection[]): string {
  const used = new Set(sections.map(s => s.name.toUpperCase()));
  for (let i = 0; i < 26; i++) {
    const ch = String.fromCharCode(65 + i);
    if (!used.has(ch)) return ch;
  }
  return "A"; // fallback if all 26 used
}

function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
```

**Note on `EditorClass.id` vs `_id`:** the hook uses an internal `id` (always present, UUID for unsaved or original id for saved) to drive React keys and `useSortable`. The `_id` field is the DB id (uuid, present only for saved classes). On save, the payload uses `_id` (or omits it for new classes — `saveSession` will assign via `crypto.randomUUID()` or DB default).

---

## 9. Types

```ts
// types.ts
export interface EditorClass {
  /** Stable internal id. UUID for unsaved, or _id/name for saved. */
  id: string;
  /** DB id. Undefined for unsaved. */
  _id?: string;
  name: string;
  sections: EditorSection[];
}

export interface EditorSection {
  id: string;
  _id?: string;
  name: string;
}

export interface DepCount {
  students: number;
  subjects: number;
  teachers: number;
}

export interface DeleteDialogState {
  open: boolean;
  itemName: string;
  itemType: "class" | "section";
  cls: EditorClass;
  /** Section id if itemType is "section". */
  si?: string;
  deps: DepCount | null;
  loading: boolean;
}
```

---

## 10. Queries to Extract

Move from `src/components/onboarding/ClassesStep.tsx` to `src/integrations/supabase/queries/classes.ts`:

- `fetchClassDeps(schoolId, classId, sectionIds)` — student/subject/teacher/attendance counts.
- `fetchSectionDeps(schoolId, sectionId)` — same for one section.
- `fetchClassDependencyCounts(schoolId, classId, sectionIds)` — `{students, subjects, teachers}` for badge display.
- New: `getWingsBySchool(schoolId): Promise<Wing[]>` — wraps `supabase.from("wings").select("id, name, display_order").eq("school_id", schoolId).order("display_order")`.

Keep imports minimal. Return typed shapes. The old `ClassesStep.tsx` will keep its inline copies (D17 — don't touch onboarding).

---

## 11. Edit Mode UX

### Read mode (default)
- Header: "Edit" button (only if `data.classes.length > 0`).
- Class cards show: drag handle (inert), name (text), sections list (text), dep badges, no delete buttons.
- `WingClassFilter` always visible. Filter is read-only.
- Search input active.
- "Add class" section hidden.

### Edit mode
- Header: "Cancel" + "Save" buttons.
- Class cards show: drag handle (active), name (editable), delete button (visible on hover or always), sections list (each section: name editable, delete button, drag handle active).
- "Add class" section visible.
- "Add section" button per card.
- `WingClassFilter` still visible (read-only filter — works on `displayClasses` which is `draftClasses` in edit mode).

### Save button states
- `disabled={isSaving || hasBlockingErrors}`.
- Label logic:
  ```tsx
  {isSaving ? <><Loader2 /> Saving…</>
    : hasBlockingErrors ? <><AlertTriangle /> Fix {blockingErrors.length} issue{blockingErrors.length !== 1 ? "s" : ""}</>
    : !hasChanges ? <><Save /> No changes to save</>
    : <><Save /> Save</>}
  ```
- `cursor-pointer` always (the button is enabled unless blocked).

---

## 12. Edge Cases Handled

1. User adds a class, types name, deletes the name char by char → backspace works, validation flags empty class name, Save blocked with toast.
2. User adds a class with name "Class 11", auto-section "A" appears. Add section "B". Both sections valid.
3. User adds two sections with same name "A" within one class → duplicate error, Save blocked.
4. User adds two sections "A" and "A" in **different** classes → no error (per-class scoping).
5. User clicks Cancel → `draftClasses` cleared, `isEditing=false`, parent `onChange(data)` resets baseline.
6. User clicks Save with no changes → `save()` calls `onSave` with the same data shape. `saveSession` is idempotent — re-upserts, no destructive deletes. Toast fires "Classes & sections saved".
7. Network failure on Save → catch in editor, toast destructive, stay in edit mode.
8. User starts editing, wings re-fetch → `wings` query refetch does not affect `draftClasses` (separate state).
9. Component unmounts while saving → React handles cleanup. No leak.
10. Drag-reorder a class to a new position → `display_order` updated on next save. Wings/Subject/Sessions tabs see new order on their next fetch.
11. Delete a class that has students → dialog opens, shows dep counts, user can cancel or confirm. If confirmed, class removed from draft. Actual DB delete happens on save.
12. Wings tab assigns a class to a wing while user is editing in Classes tab → wings query refetches on next render; `displayClasses` (from `data.classes` or `draftClasses`) may or may not reflect the new `wing_id` depending on whether parent `sessionData` has updated. New `ClassesTab` does not write `wing_id` so this is fine. The wing filter shows the class as assigned.
13. Class created with empty section list → validation error. Save blocked.

---

## 13. Migration / DB

**No migrations.** The new `ClassesTab` writes the same DB columns as before, just with `null` for `wing`/`wing_id` and derived values for `acronym`.

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Onboarding diverges from MY School | `ClassesStep.tsx` (onboarding) frozen. Long-term: port onboarding to `ClassesTab` in a separate task. |
| Schema assumption wrong | Use `list_tables` MCP to confirm column types before writing queries. |
| `WingClassFilter` prop mismatch | Filter still receives `{id, wing_id?}` items. New `EditorClass` includes `wing_id` (read from `data.classes` even if not editable). |
| `useQuery` key collision with old `ClassesStep` | Use a distinct key: `["school", schoolId, "classes-wings"]`. Old key `["classes", schoolId, "wings"]` is in onboarding's frozen code only. |
| Subject-tab pattern drift | `SubjectTab` is a sibling, not a dependency. No shared state. |
| Mobile layout regression | Test at 360px viewport. Keep class cards stacked, sections as flex-wrap rows. |
| `display_order` race | If user reorders while save is in flight, the second save wins. Acceptable for v1. |
| Wings tab re-sort on class reorder | Wings tab sorts wings visually by lowest-class-rank-per-wing. Reordering classes in MY School → Classes tab will change wing order in Wings tab. By design (D8). |
| Legacy `classes.wing` text column drop | Deferred to a future task. Current task writes `null` to it. |
| Quota reached mid-execution | Stop. Resume when quota resets. `git status` will show partial work. Resume from there. |

---

## 15. Verification (end-to-end)

### 15.1 Pre-merge checks

1. `pnpm tsc --noEmit` (or `npx tsc --noEmit`) — zero TS errors.
2. `pnpm lint` (or `npm run lint`) — zero lint errors.
3. `git diff --stat` — only the expected files modified.
4. `pnpm dev` (or `npm run dev`) — dev server starts without console errors.

### 15.2 Manual happy path (MY School → Classes tab, as principal)

1. **Edit / Save flow**: click Edit, add a new class "Class 11", verify auto-section A appears, click Save. Toast "Classes & sections saved" fires. Data persists after reload.
2. **Section name backspace**: click Edit, click into section name, press backspace repeatedly. Value goes `A → ''`. Typing still title-cases via `toTitleCase`. Save works after the section is renamed.
3. **Validation positive**: click Edit, create two sections both named "A" within the same class. "Fix 1 issue" appears with "Duplicate section name 'A'...". Save is disabled, click is no-op, toast appears on click attempt.
4. **Validation positive clears**: rename one of the duplicate sections to "B". "Fix 1 issue" disappears. Save enables.
5. **Cancel flow**: click Edit, change a class name, click Cancel, verify name reverts.
6. **Wing filter**: Wings tab assigns "Class 1" to "Wing A". Switch to Classes tab. "Wing A" tab visible. Click "Wing A" → only "Class 1" shown. Click "All" → all classes shown. Click "Unassigned" → classes without wing_id shown.
7. **Drag-reorder**: click Edit, drag a class card to a new position, click Save, reload, new order persists. Switch to Wings tab — wing order may change (re-sorted by class rank). By design.
8. **Delete class with deps**: click delete on a class that has students. Dialog opens showing dep counts. Cancel — no change. Confirm — class removed from draft. Save — DB updates.
9. **Genuine no-changes state**: open Edit, immediately click Save without edits. Toast "Classes & sections saved" fires (idempotent re-save is safe).
10. **Wing_id cleared on save**: open a class that has a wing_id assigned (assigned via Wings tab). In MY School → Classes tab, click Save without changes. The class's `wing_id` is now `null` in the DB. **This is a behavioral change — flag for the user. It means saving in the Classes tab clears wing assignments.** Mitigation: the user opens Wings tab after editing classes to re-assign. Acceptable per D6. **Alternative (not in current spec):** if the user wants wing_id to be preserved for classes that weren't touched, the payload should read `wing_id` from `data.classes` baseline instead of writing `null` unconditionally. This requires a one-line change in the `save()` hook. Confirm before execution whether D6 should be D6-strict (always null) or D6-conditional (preserve if class not modified).
11. **Mobile viewport (360px)**: tab renders without horizontal scroll. Buttons are tappable.
12. **Cross-tab propagation**: after Save in Classes tab, switch to Wings tab — new classes appear. Switch to Subject tab — new classes appear. Switch to Sessions tab — new classes appear.
13. **Onboarding still works**: log in as a fresh school, start onboarding wizard, verify Session & Classes step still works (uses old `ClassesStep` via `StructureStep`).
14. **Tab-switch guard**: open Edit, try to switch to another tab without saving. Unsaved-changes dialog appears. Save proceeds, switch completes.

### 15.3 What to check after Wings tab + Subject tab re-fetch

- Wings tab: assigned classes still grouped correctly. New classes appear as "unassigned" until Wings tab re-assigns.
- Subject tab: new classes appear in the wing filter. "No subjects" state for new classes (no `section_subjects` rows yet).
- Sessions tab: new classes appear with default term structure.

### 15.4 Acceptance criteria

- [ ] No "Fix 1 issue" false positive on a fresh class with default section A.
- [ ] Backspace works fully on section name input.
- [ ] Save button is enabled by default in edit mode. Only `isSaving` and `hasBlockingErrors` disable it.
- [ ] Saving clears `wing_id` and `wing` (D6). User must reassign via Wings tab.
- [ ] Acronyms are derived and stored, not user-input.
- [ ] `WingClassFilter` is always visible.
- [ ] Drag-reorder works. Order persists.
- [ ] Onboarding wizard still works (frozen code).
- [ ] Wings tab, Subject tab, Sessions tab all see the new classes after Save.

---

## 16. Execution Order

Execute the file changes in this order to minimize broken state:

1. **Create** `src/integrations/supabase/queries/classes.ts` (extracted dep fetchers + `getWingsBySchool`). No coupling — safe to add first.
2. **Create** `src/components/school/classes/types.ts`. Pure type definitions.
3. **Create** `src/components/school/classes/validation.ts`. Pure functions.
4. **Create** `src/components/school/classes/EditableText.tsx`. Small leaf component.
5. **Create** `src/components/school/classes/SectionRow.tsx`. Uses `EditableText`.
6. **Create** `src/components/school/classes/ClassCard.tsx`. Uses `SectionRow` + `EditableText`.
7. **Create** `src/components/school/classes/AddClassChips.tsx`. Standalone.
8. **Create** `src/components/school/classes/DeleteConfirmDialog.tsx`. Standalone.
9. **Create** `src/components/school/classes/useClassesEditor.ts`. Uses types + validation + queries.
10. **Create** `src/components/school/ClassesTab.tsx`. Uses everything above.
11. **Modify** `src/pages/SchoolPage.tsx` — swap import + render block.
12. **Run** `pnpm tsc --noEmit` after step 11.
13. **Run** dev server, manual test happy path.
14. **Run** full verification (section 15).
15. **Commit** with message `feat(my-school): rebuild Classes tab — wing filter, derived acronyms, clean edit mode` and Co-Authored-By footer.

---

## 17. Git Commit Format

```text
feat(my-school): rebuild Classes tab — wing filter, derived acronyms, clean edit mode

- New ClassesTab at src/components/school/ClassesTab.tsx replaces ClassesStep
  in MY School. Onboarding keeps the old ClassesStep via StructureStep.
- WingClassFilter always-on (read-only). Wings tab owns wing assignment.
- Acronym derived on save via deriveClassAcronym. UI hides acronym input.
- Validation reads displayClasses (not data.classes) — fixes false-positive
  duplicate detection from the old code.
- Save button enabled by default in edit mode. Only isSaving and
  hasBlockingErrors disable it. Toast on blocking-error click attempt.
- Drag-reorder preserved. display_order = array index, written by saveSession.
- Cross-tab refresh: after save, fetchSessionData() reloads Wings/Subject/
  Sessions tabs on next visit.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
```

---

## 18. Rollback Plan

If verification fails:

1. `git revert HEAD` — single commit revert.
2. Re-import `ClassesStep` from `@/components/onboarding/ClassesStep` in `SchoolPage.tsx`.
3. `git status` — confirm clean.

The new `src/components/school/ClassesTab.tsx` and its siblings are isolated — no other file imports from them. Deletion is safe if needed.

---

## 19. Open Questions (none)

All decisions are locked. No outstanding questions.
