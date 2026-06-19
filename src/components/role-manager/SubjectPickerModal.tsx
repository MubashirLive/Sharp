// SubjectPickerModal — Role Manager Staff Tab §3.1.2(f)
//
// 3 cascading dropdowns (Class → Section → Subject) for picking one or more
// class-section-subject triples to assign to the staff being edited. Staged
// assignments are accumulated in an in-modal list as badges so the user can
// see what they've added. Clicking "Done" sends the staged list to the
// parent; the parent's Card Save button persists them to `staff_roles`.
//
// 2026-06-13 rewrite: previous version was a flat 156-row list with a broken
// select (queried non-existent columns / embedded relations). New version
// uses real `section_subjects.subject_name` as the source of truth for the
// subject name. `staff_roles.subject_id` has no FK to `subjects` — verified
// via `information_schema.table_constraints` — so the read path in
// `roleAssignments.ts` also uses `section_subjects` for display.
//
// onPick passes (subjectId, classId, sectionId, subjectName, className,
// sectionName) for each staged add. onDone passes the full staged list as
// the second arg and is the signal to close the modal. The consumer
// (`StaffRoleCard`) replaces its `draftSubjectTeachers` with the staged
// list on onDone — single source of truth.
//
// 2026-06-13 follow-up fixes:
//   - Embedded relation `staff:profiles!staff_roles_staff_id_fkey(full_name)`
//     names the FK explicitly. staff_roles has TWO FKs to profiles (staff_id,
//     assigned_by); the bare `staff:profiles` join was ambiguous and the
//     PostgREST query failed with "more than one relationship was found".
//   - sessionId is fetched once in the initial load and cached in state; the
//     section/subject effects reuse it instead of re-fetching. The previous
//     code called `await supabase.from("academic_sessions")...maybeSingle()`
//     without destructuring `{ data }`, so `sessionData.id` was `undefined`
//     and the next query threw "invalid input syntax for type uuid: undefined".
//
// 2026-06-13 follow-up v2 (per user feedback):
//   - All 3 dropdowns visible from modal open. Section and Subject are
//     disabled until their parent is picked. No gating render.
//   - Subject dropdown renders `"SubjectName — TeacherName"` (or
//     `"SubjectName — Unassigned"`). The `Badges`/`flex justify-between`
//     layout was replaced with a single string per option to avoid the
//     "blank / scrollable" UX where the badge is the only label and the
//     subject name is missing on the row.
//   - Removed the "Current Assignments" list at the bottom of the modal.
//     It was added in the previous round but is not in docs/ROLE_MANAGER.md
//     §3.1.2(f) and is redundant with the card's existing badges.
//   - Removed the "Selected Assignment" preview block. The user said it
//     was "completely useless here".
//   - After clicking Add Assignment, the modal stays open and all 3
//     dropdowns reset to "". User can keep adding assignments in one
//     modal session.
//
// 2026-06-13 follow-up v3 (per user feedback):
//   - In-modal staged list rendered as badges BELOW the dropdowns. User
//     can see exactly what they've added before clicking Done.
//   - Footer buttons changed: "Add Assignment" → "Done". Cancel discards
//     the staged list; Done returns it to the parent and closes the modal.
//   - "Add to list" button moved into a full-width button below the
//     dropdowns (still inside the modal body, not the footer).
//   - Modal pre-fills the staged list from `initialDrafts` on open, so
//     re-opening after a previous session shows the existing drafts and
//     the user can add/remove before clicking Done again.
//   - Duplicate (class, section, subject) adds are blocked with a toast.
//   - × on a staged badge removes it from the in-modal list (NOT from the
//     DB; the DB write only happens when the parent Card Save is clicked).
//
// See docs/ROLE_MANAGER.md §3.1.2(f) and §2026-06-13 Patch for full context.

import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StagedAssignment {
  id: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  className: string;
  sectionName: string;
  subjectName: string;
  label: string;
}

interface SubjectOption {
  id: string;
  name: string;
  assignedTeacherName: string | null;
}

interface SectionOption {
  id: string;
  name: string;
  display_order: number;
}

interface ClassOption {
  id: string;
  name: string;
  display_order: number;
}

interface ExistingAssignment {
  id: string;
  subject_id: string;
  class_id: string;
  section_id: string;
  staff?: { full_name?: string } | null;
}

interface SubjectPickerModalProps {
  open: boolean;
  schoolId: string;
  initialDrafts?: StagedAssignment[];
  onClose: () => void;
  onPick: (subjectId: string, classId: string, sectionId: string, subjectName: string, className: string, sectionName: string) => void;
  onDone: (staged: StagedAssignment[]) => void;
  excludeStaffId?: string;
}

export function SubjectPickerModal({
  open, schoolId, initialDrafts, onClose, onPick, onDone, excludeStaffId,
}: SubjectPickerModalProps) {
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // In-modal staged list. On open, seeded from `initialDrafts` so the user
  // can see what's already queued up and add/remove before clicking Done.
  // The DB is NOT touched until the parent Card Save is clicked.
  const [staged, setStaged] = useState<StagedAssignment[]>(initialDrafts ?? []);

  // Used to label the subject dropdown with the current teacher. Fetched once
  // on open.
  const [existingAssignments, setExistingAssignments] = useState<ExistingAssignment[]>([]);
  // Cached from the initial load; reused by the dependent effects.
  const [sessionId, setSessionId] = useState<string | null>(null);

  // ============== Initial load: session + classes + existing assignments ==============
  useEffect(() => {
    if (!open || !schoolId) return;
    const load = async () => {
      setLoading(true);
      setSelectedClass("");
      setSelectedSection("");
      setSelectedSubject("");
      setSections([]);
      setSubjects([]);
      setSessionId(null);
      setExistingAssignments([]);
      setStaged(initialDrafts ?? []); // re-seed on each open

      try {
        // Get current academic session. If none is marked is_current, fall back
        // to the most recently created session for the school. Only toast
        // (and skip the session-scoped filters) when even the fallback is empty.
        const { data: sessionData } = await supabase
          .from("academic_sessions")
          .select("id")
          .eq("school_id", schoolId)
          .eq("is_current", true)
          .maybeSingle();

        let resolvedSessionId: string | null = sessionData?.id ?? null;

        if (!resolvedSessionId) {
          const { data: fallbackSession } = await supabase
            .from("academic_sessions")
            .select("id")
            .eq("school_id", schoolId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          resolvedSessionId = fallbackSession?.id ?? null;
          if (resolvedSessionId) {
            toast.warning("No active academic session — using the most recent one");
          } else {
            toast.warning("No academic sessions found — showing all classes/sections/subjects");
          }
        }
        setSessionId(resolvedSessionId);

        // Get classes for school. If we have a session, scope by it; otherwise
        // fetch all classes for the school (subject to RLS).
        let classesQuery = supabase
          .from("classes")
          .select("id, name, display_order")
          .eq("school_id", schoolId)
          .order("display_order");
        if (resolvedSessionId) {
          classesQuery = classesQuery.eq("session_id", resolvedSessionId);
        }
        const { data: classesData, error: classesError } = await classesQuery;

        if (classesError) {
          toast.error(classesError.message);
          return;
        }
        setAllClasses(classesData ?? []);

        // Get existing subject-teacher assignments across the school to label
        // the subject dropdown. The FK must be named explicitly because
        // staff_roles has TWO FKs to profiles (staff_id, assigned_by).
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("staff_roles")
          .select("id, subject_id, class_id, section_id, staff:profiles!staff_roles_staff_id_fkey(full_name)")
          .eq("school_id", schoolId)
          .eq("role_type", "subject_teacher");

        if (assignmentsError) {
          toast.error(assignmentsError.message);
          return;
        }
        setExistingAssignments(assignmentsData ?? []);
      } catch (e) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, schoolId]);

  // ============== Section load (cascades from class) ==============
  useEffect(() => {
    // sessionId may be null when the school has no academic sessions at all.
    // In that case we still query sections by class_id, dropping the session
    // filter so the cascade still works (better UX than an empty list).
    if (!selectedClass || !schoolId) return;
    const loadSections = async () => {
      setSelectedSection("");
      setSubjects([]);
      setSelectedSubject("");

      let sectionsQuery = supabase
        .from("sections")
        .select("id, name, display_order")
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)
        .order("display_order");
      if (sessionId) {
        sectionsQuery = sectionsQuery.eq("session_id", sessionId);
      }
      const { data: sectionsData, error } = await sectionsQuery;

      if (error) {
        toast.error(error.message);
        return;
      }
      setSections(sectionsData ?? []);
    };
    loadSections();
  }, [selectedClass, schoolId, sessionId]);

  // ============== Subject load (cascades from section) ==============
  useEffect(() => {
    if (!selectedSection || !schoolId) return;
    const loadSubjects = async () => {
      setSelectedSubject("");

      const { data: subjectsData, error } = await supabase
        .from("section_subjects")
        .select("id, subject_name")
        .eq("school_id", schoolId)
        .eq("section_id", selectedSection)
        .order("subject_name");

      if (error) {
        toast.error(error.message);
        return;
      }

      // Enrich each subject with the assigned teacher's name (if any).
      const enriched: SubjectOption[] = (subjectsData ?? []).map((s: any) => {
        const assigned = (existingAssignments ?? []).find(
          (a) => a.class_id === selectedClass && a.section_id === selectedSection && a.subject_id === s.id
        );
        return {
          id: s.id,
          name: s.subject_name ?? "?",
          assignedTeacherName: assigned?.staff?.full_name ?? null,
        };
      });
      setSubjects(enriched);
    };
    loadSubjects();
  }, [selectedSection, schoolId, sessionId, existingAssignments]);

  // ============== Add to in-modal list ==============
  const handleAddToList = () => {
    if (!selectedClass || !selectedSection || !selectedSubject) return;
    setAdding(true);
    try {
      const class_ = allClasses.find((c) => c.id === selectedClass);
      const section = sections.find((s) => s.id === selectedSection);
      const subject = subjects.find((s) => s.id === selectedSubject);
      if (!class_ || !section || !subject) return;

      // Block if this exact triple is already in the in-modal staged list.
      const dupe = staged.some(
        (a) => a.classId === selectedClass && a.sectionId === selectedSection && a.subjectId === selectedSubject
      );
      if (dupe) {
        toast.error("Already in the list — remove it first or pick a different subject");
        return;
      }

      const newDraft: StagedAssignment = {
        id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        classId: class_.id,
        sectionId: section.id,
        subjectId: subject.id,
        className: class_.name,
        sectionName: section.name,
        subjectName: subject.name,
        label: `${class_.name} ${section.name} — ${subject.name}`,
      };

      // Fire onPick so the parent can update any side-state if it wants to
      // (kept for backward compatibility with the previous signature).
      onPick(subject.id, class_.id, section.id, subject.name, class_.name, section.name);

      setStaged((prev) => [...prev, newDraft]);

      // Reset all 3 dropdowns so the user can pick the next combo.
      setSelectedClass("");
      setSelectedSection("");
      setSelectedSubject("");
      setSections([]);
      setSubjects([]);
    } finally {
      setAdding(false);
    }
  };

  // ============== Remove from in-modal list ==============
  const handleRemoveStaged = (id: string) => {
    setStaged((prev) => prev.filter((a) => a.id !== id));
  };

  // ============== Done — return staged list to parent and close ==============
  const handleDone = () => {
    onDone(staged);
    onClose();
  };

  const isAddDisabled = !selectedClass || !selectedSection || !selectedSubject || loading || adding;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subject Assignments</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class dropdown — always visible */}
          <div>
            <label className="text-sm font-medium mb-2 block">Class</label>
            <Select
              value={selectedClass || "__none__"}
              onValueChange={(v) => v !== "__none__" && setSelectedClass(v)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading…" : "Select a class"} />
              </SelectTrigger>
              <SelectContent>
                {allClasses.length === 0 && !loading ? (
                  <SelectItem value="__none__" disabled>No classes found</SelectItem>
                ) : (
                  allClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Section dropdown — always visible, disabled until class picked */}
          <div>
            <label className="text-sm font-medium mb-2 block">Section</label>
            <Select
              value={selectedSection || "__none__"}
              onValueChange={(v) => v !== "__none__" && setSelectedSection(v)}
              disabled={!selectedClass || loading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedClass
                      ? "Pick a class first"
                      : sections.length === 0
                        ? "No sections"
                        : "Select a section"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {sections.length === 0 ? (
                  <SelectItem value="__none__" disabled>No sections</SelectItem>
                ) : (
                  sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Subject dropdown — always visible, disabled until section picked.
              Each option renders "SubjectName — TeacherName" (or "Unassigned"). */}
          <div>
            <label className="text-sm font-medium mb-2 block">Subject</label>
            <Select
              value={selectedSubject || "__none__"}
              onValueChange={(v) => v !== "__none__" && setSelectedSubject(v)}
              disabled={!selectedSection || loading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedSection
                      ? "Pick a section first"
                      : subjects.length === 0
                        ? "No subjects"
                        : "Select a subject"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subjects.length === 0 ? (
                  <SelectItem value="__none__" disabled>No subjects</SelectItem>
                ) : (
                  subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.assignedTeacherName ?? "Unassigned"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Add-to-list button — full-width, below the dropdowns */}
          <Button
            onClick={handleAddToList}
            disabled={isAddDisabled}
            variant="secondary"
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {adding ? "Adding…" : "Add to list"}
          </Button>

          {/* Staged list — visible the whole time so user can see what they added */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                Staged ({staged.length})
              </span>
              {staged.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  Click × to remove before saving on the card
                </span>
              )}
            </div>

            {staged.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                Nothing staged yet. Pick a class, section, and subject, then click "Add to list".
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                {staged.map((a) => (
                  <Badge key={a.id} variant="secondary" className="text-xs pr-1 pl-2 py-1 flex items-center gap-1">
                    <span>{a.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStaged(a.id)}
                      className="ml-1 rounded-sm hover:bg-muted-foreground/20"
                      aria-label={`Remove ${a.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleDone} disabled={loading} size="sm">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
