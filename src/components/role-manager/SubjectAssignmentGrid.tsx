// SubjectAssignmentGrid — Role Manager Subjects Tab §3.2
//
// Grid of section-block cells. Click a cell → pick a teacher from the
// popover → real-time save to `staff_roles` (no Save button — each click
// persists immediately).
//
// 2026-06-13 bug fixes (see docs/ROLE_MANAGER.md §3.2):
//   - `handleAssignStaff` (now in useSaveSubjectAssignment) destructures
//     `{ error }` and `throw error` on every supabase call. Previously
//     errors were silently swallowed, so RLS rejects / exclusion-constraint
//     hits / FK violations left the cell unchanged with no toast.
//   - Added `busyKeys: Set<string>` per-cell busy state. While a cell is
//     mid-save, the cell shows a Loader2 spinner + "Saving" and clicks are
//     disabled. Prevents double-click races that could trigger the EXCLUSION
//     constraints `one_class_teacher_per_section` /
//     `one_subject_per_class_section`.
//
// 2026-06-18 refactor:
//   - Save body lifted into `useSaveSubjectAssignment` (see
//     `useRoleManagerQueries.ts`). The hook's `onSuccess` invalidates
//     `staffList` + the broad `staff-roles` prefix + `wings` + `subjects`,
//     matching the Houses / Wings contract. The old inline save only
//     invalidated `staffList`, so Staff cards stayed stale until a page
//     refresh.
//
// The Staff tab writes to the same `staff_roles` table (via addSubjectTeacher
// on card Save) — the two flows are intentionally independent per spec §3.4.

import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, Plus, X, User } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useStaffList,
  useSubjects,
  useSaveSubjectAssignment,
} from "@/hooks/useRoleManagerQueries";

interface SubjectAssignmentGridProps {
  schoolId: string;
  canEdit: boolean;
  /**
   * Optional cross-tab refresh hook. Not used by the Subject tab itself —
   * `useSaveSubjectAssignment.onSuccess` invalidates staffList / staffRoles
   * (narrow) / wings / subjects directly. Kept on the type for compatibility
   * with other Role Manager tabs (Houses, Departments) that still rely on
   * the parent callback pattern.
   */
  onAssignmentChange?: () => void;
  /**
   * Notify the parent when a save is in-flight. Parent uses this to block
   * tab switches and show a loading overlay instead of the dirty modal.
   */
  onSavingChange?: (isSaving: boolean) => void;
  /**
   * Notify the parent (RoleManagerTab) that this tab has unsaved changes.
   * For this auto-save tab: dirty = a save is in-flight OR the last save
   * failed. Matches My School SubjectTab pattern.
   */
  onDirtyChange?: (isDirty: boolean) => void;
}

interface SectionSubject {
  id: string;
  subject_name: string;
  subject_code: string | null;
}

interface Section {
  id: string;
  name: string;
  acronym: string | null;
  class: {
    id: string;
    name: string;
    wing_id: string | null;
    display_order: number;
  };
  section_subjects: SectionSubject[];
}

interface StaffAssignment {
  id: string;
  role_type: "class_teacher" | "subject_teacher";
  staff_id: string;
  section_id: string;
  subject_id: string | null;
  staff?: {
    full_name: string;
  };
}

interface Wing {
  id: string;
  name: string;
}

const getClassAcademicRank = (className: string): number => {
  const name = className.toLowerCase().trim();
  if (name === "nursery") return 0;
  if (name === "lkg") return 1;
  if (name === "ukg") return 2;
  const match = name.match(/class\s*(\d+)/i) || name.match(/^(\d+)$/);
  if (match) return 10 + parseInt(match[1], 10);
  return 100;
};

export function SubjectAssignmentGrid({ schoolId, canEdit, onAssignmentChange, onDirtyChange, onSavingChange }: SubjectAssignmentGridProps) {
  const subjectsQuery = useSubjects(schoolId);
  const staffListQuery = useStaffList(schoolId);
  const sections = subjectsQuery.data?.sections ?? [];
  const wings = subjectsQuery.data?.wings ?? [];
  const assignments = subjectsQuery.data?.assignments ?? [];
  const staffList = staffListQuery.data ?? [];
  const loading = subjectsQuery.isLoading || staffListQuery.isLoading;

  const [activeWingTab, setActiveWingTab] = useState<string>("all");
  const [busyKeys, setBusyKeys] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");

  // Surface subjects fetch errors (kept from original loadData behavior)
  useEffect(() => {
    if (subjectsQuery.error) {
      console.error("Failed to load subjects:", subjectsQuery.error);
      toast.error("Failed to load subjects data");
    }
  }, [subjectsQuery.error]);

  // Dirty tracking — auto-save tab: dirty ONLY when the last save failed.
  // While a save is in-flight we block tab-switch via onSavingChange (the
  // parent shows a loading overlay) rather than the unsaved-changes modal.
  useEffect(() => {
    onDirtyChange?.(saveStatus === "error");
  }, [saveStatus, onDirtyChange]);

  // Surface in-flight save state so the parent can block tab switches.
  useEffect(() => {
    onSavingChange?.(saveStatus === "saving");
  }, [saveStatus, onSavingChange]);


  const cellKey = (sectionId: string, subjectId: string | null) =>
    `${sectionId}:${subjectId ?? "ct"}`;

  const isBusy = useCallback(
    (sectionId: string, subjectId: string | null) =>
      busyKeys.has(cellKey(sectionId, subjectId)),
    [busyKeys]
  );

  // Sort wings by academic level (lowest class in wing determines rank)
  const sortedWings = useMemo(() => {
    const classRows = sections.map((s) => s.class).filter(Boolean);
    return [...wings].sort((a, b) => {
      const aClasses = classRows.filter((c) => c.wing_id === a.id);
      const bClasses = classRows.filter((c) => c.wing_id === b.id);
      const aMin = aClasses.length ? Math.min(...aClasses.map((c) => getClassAcademicRank(c.name))) : 999;
      const bMin = bClasses.length ? Math.min(...bClasses.map((c) => getClassAcademicRank(c.name))) : 999;
      return aMin - bMin;
    });
  }, [wings, sections]);

  // Filter and sort sections by wing academic order
  const sortedSections = useMemo(() => {
    const classRows = sections.map((s) => s.class).filter(Boolean);

    // Filter by wing tab
    let filtered = activeWingTab === "all"
      ? sections
      : sections.filter((s) => s.class?.wing_id === activeWingTab);

    return filtered.sort((a, b) => {
      const wingA = a.class?.wing_id;
      const wingB = b.class?.wing_id;

      // Get wing ranks
      const getWingRank = (wingId: string | null | undefined): number => {
        if (!wingId) return 999;
        const wing = wings.find(w => w.id === wingId);
        if (!wing) return 999;
        const wingClasses = classRows.filter(c => c.wing_id === wingId);
        if (!wingClasses.length) return 999;
        return Math.min(...wingClasses.map(c => getClassAcademicRank(c.name)));
      };

      const rankA = getWingRank(wingA);
      const rankB = getWingRank(wingB);

      if (rankA !== rankB) return rankA - rankB;

      // Within same wing, sort by class then section display order
      const classRankA = a.class ? getClassAcademicRank(a.class.name) : 999;
      const classRankB = b.class ? getClassAcademicRank(b.class.name) : 999;
      if (classRankA !== classRankB) return classRankA - classRankB;

      return (a.class?.display_order ?? 0) - (b.class?.display_order ?? 0) || (a.display_order ?? 0) - (b.display_order ?? 0);
    });
  }, [sections, activeWingTab]);

  // Get unique classes (for counting)
  const uniqueClasses = useMemo(() => {
    const seen = new Map();
    sections.forEach((s) => {
      if (s.class && !seen.has(s.class.id)) {
        seen.set(s.class.id, s.class);
      }
    });
    return Array.from(seen.values()).sort((a, b) =>
      (a.display_order ?? 0) - (b.display_order ?? 0)
    );
  }, [sections]);

  // Get assignment for a cell
  const getAssignment = (sectionId: string, subjectId: string | null) => {
    return assignments.find((a) =>
      a.section_id === sectionId &&
      (subjectId === null ? a.role_type === "class_teacher" : a.role_type === "subject_teacher" && a.subject_id === subjectId)
    );
  };

  // Real-time save assignment — delegates to useSaveSubjectAssignment so the
  // cross-tab cache invalidation contract (staffList + staff-roles prefix +
  // wings + subjects) matches Houses/Wings. Without the hook the Subjects
  // tab only refreshed its own data, leaving every Staff card stale until
  // a full page reload.
  const saveMutation = useSaveSubjectAssignment(schoolId);

  const handleAssignStaff = async (
    sectionId: string,
    subjectId: string | null,
    staff: { id: string; full_name: string } | null
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    const classId = section?.class?.id ?? "";
    if (!classId) {
      toast.error("Section is missing class info; cannot assign");
      return;
    }

    const key = cellKey(sectionId, subjectId);
    if (busyKeys.has(key)) return; // prevent double-click race
    setBusyKeys((prev) => new Set(prev).add(key));
    setSaveStatus("saving");

    const isClassTeacher = subjectId === null;
    // Capture the prior teacher for the same cell so the hook can clean up
    // the old auto-assigned wing entry on switch / remove.
    const existing = isClassTeacher
      ? assignments.find((a) => a.section_id === sectionId && a.role_type === "class_teacher")
      : assignments.find(
          (a) =>
            a.section_id === sectionId &&
            a.subject_id === subjectId &&
            a.role_type === "subject_teacher"
        );

    try {
      await saveMutation.mutateAsync({
        schoolId,
        isClassTeacher,
        sectionId,
        classId,
        subjectId,
        staff: staff ? { id: staff.id } : null,
        existingStaffId: existing?.staff_id ?? null,
      });
      setSaveStatus("idle");
      onAssignmentChange?.();
    } catch (e: any) {
      toast.error(`Failed to save assignment: ${e?.message ?? "unknown"}`);
      setSaveStatus("error");
    } finally {
      setBusyKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wing-based Tabs */}
      <Tabs value={activeWingTab} onValueChange={setActiveWingTab}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {sortedWings.map((w) => (
            <TabsTrigger key={w.id} value={w.id}>{w.name}</TabsTrigger>
          ))}
          {uniqueClasses.some((c) => !c.wing_id) && (
            <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
          )}
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Sections grid */}
      <div className="space-y-6">
        {sortedSections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No sections found. Create classes and sections in My School first.
          </div>
        ) : (
          sortedSections.map((section) => (
            <SectionRow
              key={section.id}
              section={section}
              getAssignment={getAssignment}
              staffList={staffList}
              canEdit={canEdit}
              isBusy={isBusy}
              onAssign={(subjectId, staff) => handleAssignStaff(section.id, subjectId, staff)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface SectionRowProps {
  section: Section;
  getAssignment: (sectionId: string, subjectId: string | null) => StaffAssignment | undefined;
  staffList: Array<{ id: string; full_name: string }>;
  canEdit: boolean;
  isBusy: (sectionId: string, subjectId: string | null) => boolean;
  onAssign: (subjectId: string | null, staff: { id: string; full_name: string } | null) => void;
}

function SectionRow({ section, getAssignment, staffList, canEdit, isBusy, onAssign }: SectionRowProps) {
  const className = section.class?.name ?? "Unknown";
  const classSec = `${className} - ${section.name}`;
  const subjects = section.section_subjects ?? [];
  const classTeacherAssignment = getAssignment(section.id, null);

  return (
    <div className="border rounded-lg p-4">
      {/* Class-Sec header */}
      <div className="font-medium text-foreground mb-3">{classSec}</div>

      {/* Cells grid */}
      <div className="flex gap-2 flex-wrap">
        {/* Class Teacher cell */}
        <SubjectCell
          label="Class Teacher"
          assignment={classTeacherAssignment}
          staffList={staffList}
          canEdit={canEdit}
          busy={isBusy(section.id, null)}
          onAssign={(staff) => onAssign(null, staff)}
        />

        {/* Subject cells */}
        {subjects.map((subj) => (
          <SubjectCell
            key={subj.id}
            label={subj.subject_name}
            assignment={getAssignment(section.id, subj.id)}
            staffList={staffList}
            canEdit={canEdit}
            busy={isBusy(section.id, subj.id)}
            onAssign={(staff) => onAssign(subj.id, staff)}
          />
        ))}
      </div>
    </div>
  );
}

interface SubjectCellProps {
  label: string;
  assignment?: StaffAssignment;
  staffList: Array<{ id: string; full_name: string }>;
  canEdit: boolean;
  onAssign: (staff: { id: string; full_name: string } | null) => void;
  busy?: boolean;
}

function SubjectCell({ label, assignment, staffList, canEdit, onAssign, busy = false }: SubjectCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const currentStaff = assignment?.staff?.full_name ?? null;
  const filteredStaff = staffList.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (staff: { id: string; full_name: string }) => {
    onAssign(staff);
    setOpen(false);
    setSearch("");
  };

  const handleRemove = () => {
    onAssign(null);
    setOpen(false);
    setSearch("");
  };

  const cellContent = (
    <div
      className={`
        w-32 min-h-[4rem] border rounded-lg p-2 transition-colors
        flex flex-col items-center justify-center text-center gap-1
        ${canEdit && !busy ? "cursor-pointer" : busy ? "opacity-60 cursor-wait" : "cursor-default"}
        ${canEdit
          ? currentStaff
            ? "bg-muted/50 hover:border-primary hover:bg-muted"
            : "border-dashed hover:border-primary hover:bg-muted/30"
          : "bg-muted/20"
        }
      `}
      onClick={() => canEdit && !busy && setOpen(true)}
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {busy ? (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving
        </span>
      ) : currentStaff ? (
        <span className="text-sm font-medium truncate max-w-full">{currentStaff}</span>
      ) : (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Plus className="h-3 w-3" />
          Assign
        </span>
      )}
    </div>
  );

  if (!canEdit) {
    return cellContent;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {cellContent}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
            autoFocus
          />
        </div>
        <Command>
          <CommandList className="max-h-60">
            <CommandEmpty>No staff found.</CommandEmpty>
            <CommandGroup>
              {filteredStaff.map((staff) => (
                <CommandItem
                  key={staff.id}
                  value={staff.id}
                  onSelect={() => {
                    handleSelect(staff);
                  }}
                  onPointerUp={(e) => {
                  }}
                  className="cursor-pointer py-2"
                >
                  <User className="h-4 w-4 mr-2" />
                  <span className="text-sm">{staff.full_name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {currentStaff && (
          <div className="p-2 border-t">
            <button
              onClick={handleRemove}
              className="w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors py-1"
            >
              Remove Assignment
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}