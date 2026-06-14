import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";
import { toast } from "@/hooks/use-toast";
import { useGuardedSubmit } from "@/hooks/useGuardedSubmit";
import { deriveClassAcronym } from "@/lib/student-utils";
import { getDefaultTermStructure } from "@/lib/onboarding-constants";
import { getWingsBySchool, fetchClassDependencyCounts, fetchSectionDeps } from "@/integrations/supabase/queries/classes";
import type { SessionStepData, ClassDraft } from "@/components/onboarding/types";
import type { EditorClass, EditorSection, DepCount, DeleteDialogState } from "./types";
import { getBlockingErrors } from "./validation";

export interface ClassesDeletions {
  classIds: string[];
  sectionIds: string[];
}

export interface UseClassesEditorOptions {
  data: SessionStepData;
  schoolId: string;
  onChange: (d: SessionStepData) => void;
  onSave?: (d: SessionStepData, deletions?: ClassesDeletions) => Promise<void>;
  onSaved?: () => void;
}

function arrayShallowEqual(a: unknown[], b: unknown[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function pickNextSectionLetter(sections: EditorSection[]): string {
  const used = new Set(sections.map((s) => s.name.trim().toUpperCase()));
  for (let i = 0; i < 26; i++) {
    const ch = String.fromCharCode(65 + i);
    if (!used.has(ch)) return ch;
  }
  return "A";
}

function dataClassesToEditor(classes: ClassDraft[]): EditorClass[] {
  return classes.map((c) => ({
    id: c._id ?? c.name,
    _id: c._id,
    name: c.name,
    wing_id: c.wing_id ?? null,
    sections: c.sections.map((s) => ({
      id: s._id ?? s.name,
      _id: s._id,
      name: s.name,
    })),
  }));
}

function findSavedBaseline(data: SessionStepData, editorId: string): ClassDraft | undefined {
  return data.classes.find((c) => (c._id ?? c.name) === editorId);
}

export function useClassesEditor(opts: UseClassesEditorOptions) {
  const { data, schoolId, onChange, onSave, onSaved } = opts;

  const [isEditing, setIsEditing] = useState(false);
  const [draftClasses, setDraftClasses] = useState<EditorClass[]>([]);
  // Synchronous re-entry lock + state managed by useGuardedSubmit.
  // See @/hooks/useGuardedSubmit for the full rationale.
  const { run: runSave, isPending: isSaving } = useGuardedSubmit();
  const [search, setSearch] = useState("");
  const [wingFilter, setWingFilter] = useState("all");
  const [delDialog, setDelDialog] = useState<DeleteDialogState | null>(null);
  const [depCounts, setDepCounts] = useState<Record<string, DepCount>>({});

  const displayClasses = isEditing ? draftClasses : dataClassesToEditor(data.classes);

  // Snapshot of the IDs that exist in DB (data.classes is the DB source of truth).
  // Updated on every data.classes change so read-mode deletes are also captured.
  // Used at save-time to compute which class/section IDs were removed.
  const baselineIdsRef = useRef<{ classIds: string[]; sectionIds: string[] }>({
    classIds: [],
    sectionIds: [],
  });
  useEffect(() => {
    const classIds = (data.classes ?? [])
      .map((c) => c._id)
      .filter((id): id is string => Boolean(id));
    const sectionIds = (data.classes ?? []).flatMap(
      (c) => ((c.sections ?? []).map((s) => s._id).filter((id): id is string => Boolean(id))),
    );
    baselineIdsRef.current = { classIds, sectionIds };
  }, [data.classes]);

  const blockingErrors = useMemo(() => getBlockingErrors(displayClasses), [displayClasses]);

  const hasChanges = useMemo(() => {
    if (!isEditing) return false;
    return !deepEqual(draftClasses, dataClassesToEditor(data.classes));
  }, [isEditing, draftClasses, data.classes]);

  // Wings query (separate cache from onboarding's ClassesStep).
  const { data: wings = [], isLoading: isWingsLoading } = useQuery({
    queryKey: ["school", schoolId, "classes-wings"],
    queryFn: () => getWingsBySchool(schoolId),
    enabled: !!schoolId,
    staleTime: 30_000,
  });

  // Dep counts: only refetch when data.classes changes (read mode baseline).
  useEffect(() => {
    if (!schoolId) return;
    if (data.classes.length === 0) {
      setDepCounts({});
      return;
    }
    let cancelled = false;
    (async () => {
      const counts: Record<string, DepCount> = {};
      await Promise.all(
        data.classes.map(async (c) => {
          if (!c._id) {
            counts[c._id!] = { students: 0, subjects: 0, teachers: 0 };
            return;
          }
          const sectionIds = (c.sections ?? []).map((s) => s._id).filter(Boolean) as string[];
          if (sectionIds.length === 0) {
            counts[c._id] = { students: 0, subjects: 0, teachers: 0 };
            return;
          }
          try {
            const r = await fetchClassDependencyCounts(schoolId, c._id, sectionIds);
            counts[c._id] = r;
          } catch {
            counts[c._id] = { students: 0, subjects: 0, teachers: 0 };
          }
        }),
      );
      if (!cancelled) setDepCounts(counts);
    })();
    return () => {
      cancelled = true;
    };
  }, [data.classes, schoolId]);

  // Mutators ------------------------------------------------------------

  const updateClass = useCallback(
    (id: string, patch: Partial<EditorClass>) => {
      if (isEditing) {
        setDraftClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
        return;
      }
      // read mode: bubble through onChange for visual feedback only
      onChange({
        ...data,
        classes: data.classes.map((c) =>
          (c._id ?? c.name) === id ? { ...c, ...(patch as Partial<ClassDraft>), name: patch.name ?? c.name } : c,
        ),
      });
    },
    [isEditing, data, onChange],
  );

  const addClass = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const existingNames = isEditing
        ? draftClasses.map((c) => c.name.toLowerCase())
        : data.classes.map((c) => c.name.toLowerCase());
      if (existingNames.includes(trimmed.toLowerCase())) return;

      const newCls: EditorClass = {
        id: crypto.randomUUID(),
        name: trimmed,
        sections: [{ id: crypto.randomUUID(), name: "A" }],
      };
      if (isEditing) {
        setDraftClasses((prev) => [...prev, newCls]);
      } else {
        onChange({
          ...data,
          classes: [
            ...data.classes,
            {
              name: trimmed,
              acronym: deriveClassAcronym(trimmed),
              term_structure: getDefaultTermStructure(trimmed),
              start_date: "",
              end_date: "",
              sections: [{ name: "A", acronym: "A", subjects: [] }],
            } as ClassDraft,
          ],
        });
      }
    },
    [isEditing, draftClasses, data, onChange],
  );

  const removeClass = useCallback(
    async (id: string) => {
      const cls = displayClasses.find((c) => c.id === id);
      if (!cls) return;
      // Unsaved: remove without dialog
      if (!cls._id) {
        if (isEditing) {
          setDraftClasses((prev) => prev.filter((c) => c.id !== id));
        } else {
          onChange({
            ...data,
            classes: data.classes.filter((c) => (c._id ?? c.name) !== id),
          });
        }
        return;
      }
      // Saved: open dialog
      const sectionIds = (cls.sections ?? []).map((s) => s._id).filter(Boolean) as string[];
      setDelDialog({
        open: true,
        itemName: cls.name,
        itemType: "class",
        cls,
        deps: null,
        loading: true,
      });
      try {
        const deps = await fetchClassDependencyCounts(schoolId, cls._id, sectionIds);
        setDelDialog((d) => (d ? { ...d, deps, loading: false } : d));
      } catch {
        setDelDialog((d) => (d ? { ...d, deps: { students: 0, subjects: 0, teachers: 0 }, loading: false } : d));
      }
    },
    [displayClasses, isEditing, data, onChange, schoolId],
  );

  const confirmClassDelete = useCallback(() => {
    if (!delDialog) return;
    const id = delDialog.cls.id;
    if (isEditing) {
      setDraftClasses((prev) => prev.filter((c) => c.id !== id));
    } else {
      onChange({
        ...data,
        classes: data.classes.filter((c) => (c._id ?? c.name) !== id),
      });
    }
    setDelDialog(null);
  }, [delDialog, isEditing, data, onChange]);

  const addSection = useCallback(
    (classId: string) => {
      const cls = displayClasses.find((c) => c.id === classId);
      if (!cls) return;
      const letter = pickNextSectionLetter(cls.sections);
      const newSec: EditorSection = { id: crypto.randomUUID(), name: letter };
      updateClass(classId, { sections: [...cls.sections, newSec] });
    },
    [displayClasses, updateClass],
  );

  const removeSection = useCallback(
    async (classId: string, sectionId: string) => {
      const cls = displayClasses.find((c) => c.id === classId);
      const sec = cls?.sections.find((s) => s.id === sectionId);
      if (!cls || !sec) return;
      if (!sec._id) {
        updateClass(classId, { sections: cls.sections.filter((s) => s.id !== sectionId) });
        return;
      }
      setDelDialog({
        open: true,
        itemName: sec.name,
        itemType: "section",
        cls,
        si: sectionId,
        deps: null,
        loading: true,
      });
      try {
        const deps = await fetchSectionDeps(schoolId, sec._id);
        setDelDialog((d) =>
          d
            ? {
                ...d,
                deps: {
                  students: deps.studentCount,
                  subjects: deps.subjectCount,
                  teachers: deps.teacherCount,
                },
                loading: false,
              }
            : d,
        );
      } catch {
        setDelDialog((d) =>
          d ? { ...d, deps: { students: 0, subjects: 0, teachers: 0 }, loading: false } : d,
        );
      }
    },
    [displayClasses, updateClass, schoolId],
  );

  const confirmSectionDelete = useCallback(() => {
    if (!delDialog || delDialog.itemType !== "section" || !delDialog.si) return;
    const classId = delDialog.cls.id;
    const sectionId = delDialog.si;
    const cls = displayClasses.find((c) => c.id === classId);
    if (!cls) return;
    updateClass(classId, { sections: cls.sections.filter((s) => s.id !== sectionId) });
    setDelDialog(null);
  }, [delDialog, displayClasses, updateClass]);

  const updateSection = useCallback(
    (classId: string, sectionId: string, patch: Partial<EditorSection>) => {
      const cls = displayClasses.find((c) => c.id === classId);
      if (!cls) return;
      updateClass(classId, {
        sections: cls.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
      });
    },
    [displayClasses, updateClass],
  );

  const reorderClasses = useCallback(
    (fromId: string, toId: string, insertPosition: "before" | "after" = "before") => {
      const source = isEditing ? draftClasses : dataClassesToEditor(data.classes);
      const fromIdx = source.findIndex((c) => c.id === fromId);
      const toIdx = source.findIndex((c) => c.id === toId);
      if (fromIdx === -1 || toIdx === -1) return;
      // When inserting "after" a card, target the index just past it.
      // arrayMove's "to" index is the final destination, so we offset.
      const targetIdx =
        insertPosition === "after" && toIdx < fromIdx
          ? toIdx // moving up: over card is above; insert after it = same index
          : insertPosition === "after" && toIdx > fromIdx
            ? Math.min(toIdx + 1, source.length - 1)
            : toIdx;
      const next = arrayMove(source, fromIdx, targetIdx);
      if (isEditing) {
        setDraftClasses(next);
      } else {
        onChange({
          ...data,
          classes: next.map((c) => {
            const saved = findSavedBaseline(data, c.id);
            return (
              saved ?? {
                name: c.name,
                acronym: deriveClassAcronym(c.name),
                term_structure: getDefaultTermStructure(c.name),
                start_date: "",
                end_date: "",
                sections: c.sections.map((s) => ({
                  name: s.name,
                  acronym: deriveClassAcronym(s.name),
                  subjects: [],
                })),
              }
            );
          }) as ClassDraft[],
        });
      }
    },
    [isEditing, draftClasses, data, onChange],
  );

  // Apply a full class ordering (from dnd-kit's arrayMove) to the data.
  // Used by ClassesTab so the reorder stays correct when filters hide
  // some classes from view.
  const applyClassOrder = useCallback(
    (activeAndOverIds: string[]) => {
      const activeId = activeAndOverIds[0];
      const overId = activeAndOverIds[1];

      const source = isEditing ? draftClasses : dataClassesToEditor(data.classes);
      const activeIdx = source.findIndex((c) => c.id === activeId);
      const overIdx = source.findIndex((c) => c.id === overId);

      if (activeIdx === -1 || overIdx === -1) return;

      const next = arrayMove(source, activeIdx, overIdx);

      if (isEditing) {
        setDraftClasses(next);
      } else {
        onChange({
          ...data,
          classes: next.map((c) => {
            const saved = findSavedBaseline(data, c.id);
            return (
              saved ?? {
                name: c.name,
                acronym: deriveClassAcronym(c.name),
                term_structure: getDefaultTermStructure(c.name),
                start_date: "",
                end_date: "",
                sections: c.sections.map((s) => ({
                  name: s.name,
                  acronym: deriveClassAcronym(s.name),
                  subjects: [],
                })),
              }
            );
          }) as ClassDraft[],
        });
      }
    },
    [isEditing, draftClasses, data, onChange],
  );

  const reorderSections = useCallback(
    (classId: string, fromId: string, toId: string) => {
      const cls = displayClasses.find((c) => c.id === classId);
      if (!cls) return;
      const fromIdx = cls.sections.findIndex((s) => s.id === fromId);
      const toIdx = cls.sections.findIndex((s) => s.id === toId);
      if (fromIdx === -1 || toIdx === -1) return;
      const next = arrayMove(cls.sections, fromIdx, toIdx);
      updateClass(classId, { sections: next });
    },
    [displayClasses, updateClass],
  );

  const enterEditMode = useCallback(() => {
    setDraftClasses(dataClassesToEditor(data.classes));
    setIsEditing(true);
  }, [data.classes]);

  const cancelEdit = useCallback(() => {
    setDraftClasses([]);
    setIsEditing(false);
    onChange(data);
  }, [data, onChange]);

  const save = useCallback(() => {
    if (blockingErrors.length > 0) {
      toast({
        title: "Fix errors before saving",
        description: blockingErrors[0],
        variant: "destructive",
      });
      return;
    }
    if (!onSave) {
      toast({ title: "Save not available", variant: "destructive" });
      return;
    }
    void runSave(async () => {
      try {
        const payload: SessionStepData = {
          ...data,
          classes: draftClasses.map((c) => {
            const saved = data.classes.find(
              (dc) => (dc._id ?? dc.name) === c._id || (dc._id ?? dc.name) === c.id,
            );
            return {
              _id: c._id,
              name: c.name,
              acronym: deriveClassAcronym(c.name),
              // Wings tab owns wing_id. Preserve baseline value so a no-op or
              // edit-mode save in the Classes tab never clears wing assignments.
              // New classes (no baseline match) default to unassigned.
              wing: saved?.wing ?? null,
              wing_id: saved?.wing_id ?? null,
              term_structure: saved?.term_structure ?? getDefaultTermStructure(c.name),
              start_date: saved?.start_date ?? "",
              end_date: saved?.end_date ?? "",
              sections: c.sections.map((s) => {
                const savedSec = saved?.sections.find(
                  (ss) => (ss._id ?? ss.name) === s._id || (ss._id ?? ss.name) === s.id,
                );
                return {
                  _id: s._id,
                  name: s.name,
                  acronym: deriveClassAcronym(s.name),
                  stream: savedSec?.stream ?? null,
                  subjects: savedSec?.subjects ?? [],
                };
              }),
            } as ClassDraft;
          }),
        };

        // Compute deletions: IDs present in DB snapshot (baseline) that are not
        // in the current draft. Works for both edit-mode and read-mode deletes.
        const baseline = baselineIdsRef.current;
        const currentClassIds = new Set(
          draftClasses.map((c) => c._id).filter((id): id is string => Boolean(id)),
        );
        const currentSectionIds = new Set(
          draftClasses.flatMap(
            (c) => (c.sections ?? []).map((s) => s._id).filter((id): id is string => Boolean(id)),
          ),
        );
        const deletions: ClassesDeletions = {
          classIds: baseline.classIds.filter((id) => !currentClassIds.has(id)),
          sectionIds: baseline.sectionIds.filter((id) => !currentSectionIds.has(id)),
        };

        await onSave(payload, deletions);
        // Toast for "Classes & sections saved" is emitted by the page-level
        // saveSession (matches saveSubjects / saveWings pattern). Do not toast
        // here — emitting it twice was one of the original defects.
        setIsEditing(false);
        setDraftClasses([]);
        onSaved?.();
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Save failed");
        toast({ title: "Save failed", description: err.message, variant: "destructive" });
      }
    });
  }, [blockingErrors, onSave, data, draftClasses, onSaved, runSave]);

  return {
    isEditing,
    isSaving,
    displayClasses,
    hasChanges,
    hasBlockingErrors: blockingErrors.length > 0,
    blockingErrors,
    searchQuery: search,
    wingFilter,
    depCounts,
    wings,
    isWingsLoading,
    enterEditMode,
    cancelEdit,
    save,
    addClass,
    removeClass,
    confirmClassDelete,
    updateClass,
    addSection,
    removeSection,
    confirmSectionDelete,
    updateSection,
    reorderClasses,
    reorderSections,
    applyClassOrder,
    setSearchQuery: setSearch,
    setWingFilter,
    delDialog,
    setDelDialog,
  };
}

// Re-export for callers that need it
export { arrayShallowEqual };
