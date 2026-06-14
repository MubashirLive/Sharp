import { useState, useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus,
  Trash2,
  X,
  GripVertical,
  Pencil,
  Save,
  Loader2,
  AlertTriangle,
  Search,
  Users,
  UserCheck,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WingClassFilter } from "@/components/ui/WingClassFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCurrentAcademicYear, getUpcomingAcademicYear, getAcademicYearDates } from "@/lib/academic-year";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useGuardedSubmit } from "@/hooks/useGuardedSubmit";
import {
  DEFAULT_CLASSES,
  getDefaultTermStructure,
  sortClasses,
} from "@/lib/onboarding-constants";
import { deriveClassAcronym } from "@/lib/student-utils";
import { toTitleCase } from "@/lib/text-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SessionStepData, ClassDraft, SectionDraft } from "./types";

interface Props {
  initialData?: SessionStepData;
  data: SessionStepData;
  onChange: (d: SessionStepData) => void;
  onSave?: (d: SessionStepData) => Promise<void>;
  schoolId?: string;
  isOnboarding?: boolean;
  onNavigateToSessions?: () => void;
}

export interface ClassesStepHandle {
  save: () => Promise<void>;
  discard: () => void;
}

// ── Dependency summary ──────────────────────────────────────
interface DeletionDeps {
  studentCount: number;
  subjectCount: number;
  teacherCount: number;
  hasAttendance: boolean;
  hasWing: boolean;
  hasClassTeacher: boolean;
}

async function fetchSectionDeps(schoolId: string, sectionId: string): Promise<DeletionDeps> {
  const [stu, sub, att, ct] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("section_id", sectionId).eq("school_id", schoolId),
    supabase.from("section_subjects").select("id", { count: "exact", head: true }).eq("section_id", sectionId).eq("school_id", schoolId),
    supabase.from("attendance").select("id", { head: true }).eq("section_id", sectionId).eq("school_id", schoolId).limit(1),
    supabase.from("staff_roles").select("id", { head: true }).eq("section_id", sectionId).eq("school_id", schoolId).eq("role_type", "class_teacher"),
  ]);
  return {
    studentCount: stu.count ?? 0,
    subjectCount: sub.count ?? 0,
    teacherCount: ct.data !== null ? 1 : 0,
    hasAttendance: (att.data) !== null,
    hasWing: false,
    hasClassTeacher: (ct.data) !== null,
  };
}

async function fetchClassDeps(schoolId: string, classId: string, sectionIds: string[]): Promise<DeletionDeps> {
  const [stu, sub, att, ct] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId),
    supabase.from("section_subjects").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId),
    supabase.from("attendance").select("id", { head: true }).in("section_id", sectionIds).eq("school_id", schoolId).limit(1),
    supabase.from("staff_roles").select("id", { head: true }).in("section_id", sectionIds).eq("school_id", schoolId).eq("role_type", "class_teacher"),
  ]);
  return {
    studentCount: stu.count ?? 0,
    subjectCount: sub.count ?? 0,
    teacherCount: ct.count ?? 0,
    hasAttendance: (att.data) !== null,
    hasWing: false,
    hasClassTeacher: (ct.data) !== null,
  };
}

async function fetchClassDependencyCounts(schoolId: string, classId: string, sectionIds: string[]): Promise<{ students: number; subjects: number; teachers: number }> {
  const [stu, sub, ct] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId),
    supabase.from("section_subjects").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId),
    supabase.from("staff_roles").select("id", { count: "exact", head: true }).in("section_id", sectionIds).eq("school_id", schoolId).eq("role_type", "class_teacher"),
  ]);
  return {
    students: stu.count ?? 0,
    subjects: sub.count ?? 0,
    teachers: ct.count ?? 0,
  };
}

// ── Deletion confirm dialog ─────────────────────────────────
function DeletionConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  deps,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  itemName: string;
  itemType: "class" | "section";
  deps: DeletionDeps | null;
  onConfirm: () => void;
  loading: boolean;
}) {
  const hasDeps = deps && (deps.studentCount > 0 || deps.subjectCount > 0 || deps.teacherCount > 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Remove {itemType === "class" ? "Class" : "Section"}
          </DialogTitle>
          <DialogDescription>
            {itemType === "class"
              ? `Remove "${itemName}" and all its sections?`
              : `Remove section "${itemName}"?`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking dependencies…
          </div>
        ) : deps ? (
          <div className="space-y-3">
            {hasDeps ? (
              <>
                <p className="text-sm font-medium text-destructive">This {itemType} has dependencies:</p>
                <div className="space-y-1.5 text-sm bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  {deps.studentCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-destructive font-medium">{deps.studentCount}</span>
                      <span>student{deps.studentCount !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {deps.subjectCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-destructive font-medium">{deps.subjectCount}</span>
                      <span>subject{deps.subjectCount !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {deps.teacherCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-destructive font-medium">{deps.teacherCount}</span>
                      <span>teacher{deps.teacherCount !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {deps.hasAttendance && (
                    <div className="flex items-center gap-2">
                      <span className="text-destructive">⚠</span>
                      <span>Attendance records exist</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Removing this {itemType} will permanently delete associated records.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No dependencies found. This {itemType} can be safely removed.
              </p>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            variant={hasDeps ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer"
          >
            {hasDeps ? "Remove Anyway" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Inline editable code field ───────────────────────────────
function EditableCode({
  value,
  placeholder,
  onChange,
  label,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);

  const startEditing = () => {
    setInput(value);
    setEditing(true);
  };

  const commit = () => {
    onChange(input.toUpperCase());
    setEditing(false);
  };

  const cancel = () => setEditing(false);

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      {editing ? (
        <input
          className="border rounded px-1.5 py-0.5 text-xs w-14 font-mono uppercase text-center outline-none focus:ring-1 ring-primary bg-background"
          value={input}
          autoFocus
          maxLength={label === "Class Code" ? 4 : 2}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          onBlur={commit}
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="flex items-center gap-1 border rounded px-1.5 py-0.5 text-xs font-mono uppercase text-primary hover:bg-muted/50 transition-colors"
          title="Click to edit"
        >
          {value || placeholder}
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

// ── Dependency badges component ──────────────────────────────
function DependencyBadges({ counts, status }: { counts: { students: number; subjects: number; teachers: number }; status: "complete" | "incomplete" | "missing" }) {
  return (
    <div className="flex items-center gap-2">
      {counts.students > 0 && (
        <div className="flex items-center gap-1 text-xs" title={`${counts.students} students`}>
          <Users className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{counts.students}</span>
        </div>
      )}
      {counts.teachers > 0 && (
        <div className="flex items-center gap-1 text-xs" title={`${counts.teachers} teachers`}>
          <UserCheck className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">{counts.teachers}</span>
        </div>
      )}
    </div>
  );
}

// ── Sortable class card ───────────────────────────────────────
interface SortableCardProps {
  cls: ClassDraft;
  data: SessionStepData;
  isSelected: boolean;
  isEditing: boolean;
  depCounts: { students: number; subjects: number; teachers: number };
  onSelect: () => void;
  onUpdateClass: (cls: ClassDraft, patch: Partial<ClassDraft>) => void;
  onRemoveClass: (cls: ClassDraft) => void;
  onCustomDates: () => void;
  onUpdateSection: (cls: ClassDraft, si: number, patch: Partial<SectionDraft>) => void;
  onRemoveSection: (cls: ClassDraft, si: number) => void;
  onAddSection: (cls: ClassDraft) => void;
}

function SortableClassCard({
  cls,
  data,
  isSelected,
  isEditing,
  depCounts,
  onSelect,
  onUpdateClass,
  onUpdateSection,
  onRemoveSection,
  onAddSection,
  onRemoveClass,
  onCustomDates,
  manuallyEditedSections,
  onSectionAcronymEdited,
}: SortableCardProps & {
  manuallyEditedSections: Set<string>;
  onSectionAcronymEdited: (si: number) => void;
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: `class-${cls._id ?? cls.name}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Status calculation
  const hasStudents = depCounts.students > 0;
  const hasSubjects = depCounts.subjects > 0;
  const hasTeachers = depCounts.teachers > 0;
  const status: "complete" | "incomplete" | "missing" =
    !hasStudents && !hasSubjects && !hasTeachers ? "missing" :
    hasStudents && hasSubjects && hasTeachers ? "complete" : "incomplete";

  // Editable class name
  const [nameEditing, setNameEditing] = useState(false);
  const [nameInput, setNameInput] = useState(cls.name);

  const startNameEdit = () => { setNameInput(cls.name); setNameEditing(true); };
  const commitNameEdit = () => { if (nameInput.trim()) onUpdateClass(cls, { name: toTitleCase(nameInput.trim()) }); setNameEditing(false); };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-xl overflow-hidden bg-card transition-shadow w-full",
        isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm",
        isEditing ? "cursor-pointer" : "cursor-default",
      )}
      onClick={isEditing ? onSelect : undefined}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
        {/* Drag handle - only when editing */}
        {isEditing && (
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
            {...attributes} {...listeners}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}

        {/* Class name */}
        {isEditing ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); startNameEdit(); }}
            className="flex-1 text-left text-sm font-semibold flex items-center gap-1.5 truncate"
          >
            {cls.name}
            <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>
        ) : (
          <span className="flex-1 text-sm font-semibold truncate">{cls.name}</span>
        )}
        {nameEditing && (
          <input
            className="border rounded px-2 py-0.5 text-sm outline-none focus:ring-1 ring-primary w-48"
            value={nameInput}
            autoFocus
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") commitNameEdit(); if (e.key === "Escape") setNameEditing(false); }}
            onBlur={commitNameEdit}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* Class Code */}
        <div className="flex items-center gap-3 shrink-0">
          {isEditing ? (
            <EditableCode
              label="Class Code"
              value={cls.acronym}
              placeholder={deriveClassAcronym(cls.name)}
              onChange={(v) => onUpdateClass(cls, { acronym: v })}
            />
          ) : (
            <span className="text-xs text-muted-foreground font-mono">{cls.acronym || deriveClassAcronym(cls.name)}</span>
          )}
        </div>

        {/* Delete - only when editing */}
        {isEditing && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemoveClass(cls); }}
            className="text-muted-foreground hover:text-destructive shrink-0"
            title="Remove class"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-3" onClick={(e) => e.stopPropagation()}>
        {/* Sections */}
        <div>
          <Label className="text-xs text-muted-foreground font-medium mb-2 block">Sections</Label>
          <div className="flex flex-wrap gap-2">
            {cls.sections.map((s, si) => (
              <div key={si} className="flex items-center gap-2 bg-secondary/60 border rounded-lg px-3 py-2 text-xs group">
                {/* Section name */}
                {isEditing ? (
                  <input
                    className="border rounded px-1.5 py-0.5 text-xs w-20 font-medium uppercase outline-none focus:ring-1 ring-primary bg-background"
                    value={s.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      const alphaOnly = val.replace(/[^a-zA-Z]/g, "");
                      const newAcronym = alphaOnly.length >= 2
                        ? alphaOnly.slice(0, 2).toUpperCase()
                        : alphaOnly.toUpperCase() || "A";
                      // Only auto-derive acronym if user hasn't manually edited it
                      if (!manuallyEditedSections.has(`${cls._id ?? cls.name}-${si}`)) {
                        onUpdateSection(cls, si, { name: toTitleCase(val), acronym: newAcronym });
                      } else {
                        onUpdateSection(cls, si, { name: toTitleCase(val) });
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={16}
                  />
                ) : (
                  <span className="font-medium uppercase">{s.name}</span>
                )}
                {/* Section acronym — separate editable field */}
                {isEditing ? (
                  <input
                    className="border rounded px-1 py-0.5 text-xs w-10 font-mono uppercase text-center outline-none focus:ring-1 ring-primary bg-background"
                    value={s.acronym}
                    onChange={(e) => {
                      onSectionAcronymEdited(si);
                      const val = e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
                      onUpdateSection(cls, si, { acronym: val });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    maxLength={2}
                    title="Section acronym (2 letters)"
                  />
                ) : (
                  <span className="text-muted-foreground font-mono">{s.acronym}</span>
                )}
                {/* Remove - only when editing */}
                {isEditing && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemoveSection(cls, si); }}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove section"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {/* Add section - only when editing */}
            {isEditing && (
              <button
                type="button"
                onClick={() => onAddSection(cls)}
                className="flex items-center gap-1 text-xs text-primary hover:underline px-2 py-2"
              >
                <Plus className="h-3 w-3" /> Section
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────
export const ClassesStep = forwardRef<ClassesStepHandle, Props>(({ initialData, data, onChange, onSave, schoolId, isOnboarding, onNavigateToSessions }, ref) => {
  const [newClass, setNewClass] = useState(initialData ? data.academic_year : "");
  const [selectedCi, setSelectedCi] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [wingFilter, setWingFilter] = useState<string>("all");

  // Dependency counts cache
  const [depCountsMap, setDepCountsMap] = useState<Record<string, { students: number; subjects: number; teachers: number }>>({});

  // Sections whose acronym was manually edited (by section key = "classId-si")
  const [manuallyEditedSections, setManuallyEditedSections] = useState<Set<string>>(new Set());

  const handleSectionAcronymEdited = (cls: ClassDraft, si: number) => {
    const clsId = cls._id ?? cls.name;
    const key = `${clsId}-${si}`;
    setManuallyEditedSections((prev) => new Set(prev).add(key));
  };

  // ── Wings (fetched directly — mirrors SubjectTab pattern) ──
  const { data: wingsData } = useQuery({
    queryKey: ["classes", schoolId, "wings"],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("wings")
        .select("id, name, display_order")
        .eq("school_id", schoolId)
        .order("display_order");
      return data ?? [];
    },
    enabled: !!schoolId,
    staleTime: 0,
    networkMode: "always",
  });

  // ── Edit mode (mirrors WingsTab pattern) ──
  const [isEditing, setIsEditing] = useState(false);
  const [localClasses, setLocalClasses] = useState<ClassDraft[]>([]);
  const { run: runSave, isPending: isSaving, reset: resetSave } = useGuardedSubmit();

  // Expose save/discard for parent access
  useImperativeHandle(ref, () => ({
    save: handleSave,
    discard: () => { resetSave(); setLocalClasses([]); setIsEditing(false); },
  }));

  // Academic year
  const defaultYear = getCurrentAcademicYear();
  const upcomingYear = getUpcomingAcademicYear();

  // ── Deletion dialog state ──────────────────────────────────
  const [delDialog, setDelDialog] = useState<{
    open: boolean;
    itemName: string;
    itemType: "class" | "section";
    cls: ClassDraft;
    si?: number;
    deps: DeletionDeps | null;
    loading: boolean;
  }>({ open: false, itemName: "", itemType: "class", cls: undefined as unknown as ClassDraft, deps: null, loading: false });

  // ── Fetch dependency counts for saved classes ─────────────
  useEffect(() => {
    const fetchCounts = async () => {
      const newCounts: Record<string, { students: number; subjects: number; teachers: number }> = {};
      for (const cls of data.classes) {
        if (cls._id) {
          const sectionIds = cls.sections.filter((s) => s._id).map((s) => s._id as string);
          if (sectionIds.length > 0) {
            newCounts[cls._id] = await fetchClassDependencyCounts(schoolId ?? "", cls._id, sectionIds);
          }
        }
      }
      setDepCountsMap(newCounts);
    };
    if (schoolId) fetchCounts();
  }, [data.classes, schoolId]);

  // ── Pending change count ─────────────────────────────────
  useEffect(() => {
    const initial = initialData ?? { academic_year: "", classes: [], wings: [] };
    let count = 0;
    const initialIds = new Set(initial.classes.map((c) => c._id).filter(Boolean));
    const dataIds = new Set(data.classes.map((c) => c._id).filter(Boolean));
    if (data.classes.length !== initial.classes.length) count++;
    initial.classes.forEach((ic) => {
      if (ic._id && !dataIds.has(ic._id)) count++;
    });
    data.classes.forEach((dc, ci) => {
      const ic = initial.classes[ci];
      if (!ic) { count++; return; }
      if (dc.name !== ic.name) count++;
      if (dc.acronym !== ic.acronym) count++;
      if (dc.sections.length !== ic.sections.length) count++;
      dc.sections.forEach((ds, si) => {
        const is = ic.sections[si];
        if (!is) { count++; return; }
        if (ds.name !== is.name) count++;
        if (ds.acronym !== is.acronym) count++;
      });
    });
    setPendingCount(count);
  }, [data]);

  // Blocking validation errors
  const blockingErrors = useMemo<string[]>(() => {
    const errors: string[] = [];
    const codeCounts: Record<string, number> = {};
    data.classes.forEach((c) => {
      const code = c.acronym || deriveClassAcronym(c.name);
      codeCounts[code] = (codeCounts[code] || 0) + 1;
      if (c.sections.length === 0) {
        errors.push(`No sections in ${c.name}`);
      }
    });
    Object.entries(codeCounts).forEach(([code, count]) => {
      if (count > 1) errors.push(`Duplicate class code "${code}"`);
    });
    // Section code duplicates
    data.classes.forEach((c) => {
      const secCodeCounts: Record<string, string[]> = {};
      c.sections.forEach((s) => {
        const code = (s.acronym || s.name.slice(0, 2).toUpperCase()).trim();
        if (!code) return; // empty acronym = not yet assigned, skip
        if (!secCodeCounts[code]) secCodeCounts[code] = [];
        secCodeCounts[code].push(s.name);
      });
      Object.entries(secCodeCounts).forEach(([code, names]) => {
        if (names.length > 1) errors.push(`Duplicate section code "${code}" in ${c.name}`);
      });
    });
    return errors;
  }, [data.classes]);
  const hasBlockingErrors = blockingErrors.length > 0;

  // ── Edit mode functions ─────────────────────────────────────
  const enterEditMode = () => {
    setLocalClasses(JSON.parse(JSON.stringify(data.classes)));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    resetSave();
    setLocalClasses([]);
    setIsEditing(false);
  };

  // Check if localClasses differ from data.classes
  const hasChanges = localClasses.length !== data.classes.length ||
    localClasses.some((lc, ci) => {
      const dc = data.classes[ci];
      if (!dc) return true;
      if (lc.name !== dc.name || lc.acronym !== dc.acronym) return true;
      if (lc.sections.length !== dc.sections.length) return true;
      return lc.sections.some((ls, si) => {
        const ds = dc.sections[si];
        if (!ds) return true;
        return ls.name !== ds.name || ls.acronym !== ds.acronym;
      });
    });

  const handleSave = () => {
    if (hasBlockingErrors) {
      toast({ title: "Fix errors before saving", description: blockingErrors[0], variant: "destructive" });
      return;
    }
    void runSave(async () => {
      const updatedData = { ...data, classes: localClasses };
      await onSave?.(updatedData);
      setIsEditing(false);
      setLocalClasses([]);
    });
  };

  // BeforeUnload warning
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const set = <K extends keyof SessionStepData>(k: K, v: SessionStepData[K]) =>
    onChange({ ...data, [k]: v });

  // Write to localClasses (in edit mode) or data.classes (read mode).
  // The renderer reads from the same source, so edits become visible.
  const setClasses = (next: ClassDraft[]) => {
    if (isEditing) setLocalClasses(next);
    else set("classes", next);
  };

  const addClass = (name: string) => {
    const trimmed = toTitleCase(name.trim());
    const source = isEditing ? localClasses : data.classes;
    if (!trimmed || source.some((c) => c.name === trimmed)) return;
    const range = getAcademicYearDates(data.academic_year);
    const newCls: ClassDraft = {
      name: trimmed,
      acronym: deriveClassAcronym(trimmed),
      term_structure: getDefaultTermStructure(trimmed),
      start_date: range.start,
      end_date: range.end,
      sections: [{ name: "A", acronym: "A", subjects: [] }],
    };
    const next = sortClasses([...source, newCls]);
    setClasses(next);
    setSelectedCi(next.length - 1);
  };

  const removeClass = (cls: ClassDraft) => {
    const source = isEditing ? localClasses : data.classes;
    // Look up index by _id or name (works in both edit and read mode)
    const clsKey = cls._id ?? cls.name;
    const i = source.findIndex((c) => (c._id ?? c.name) === clsKey);
    if (i === -1) return;
    if (!cls._id) {
      setClasses(source.filter((_, idx) => idx !== i));
      if (selectedCi === i) setSelectedCi(null);
      return;
    }
    setDelDialog({
      open: true, itemName: cls.name, itemType: "class", cls,
      deps: null, loading: true,
    });
    fetchClassDeps(schoolId ?? "", cls._id, cls.sections.filter((s) => s._id).map((s) => s._id as string))
      .then((deps) => setDelDialog((d) => ({ ...d, deps, loading: false })))
      .catch(() => setDelDialog((d) => ({ ...d, deps: { studentCount: 0, subjectCount: 0, teacherCount: 0, hasAttendance: false }, loading: false })));
  };

  const confirmClassDelete = () => {
    // Use _id lookup against current source (localClasses when editing) to avoid stale closure
    const clsId = delDialog.cls._id;
    const source = isEditing ? localClasses : data.classes;
    const deletedIdx = clsId ? source.findIndex((c) => c._id === clsId) : -1;
    if (clsId) {
      setClasses(source.filter((c) => c._id !== clsId));
    } else {
      setClasses(source.filter((c) => c !== delDialog.cls));
    }
    if (selectedCi === deletedIdx) setSelectedCi(null);
    setDelDialog((d) => ({ ...d, open: false }));
  };

  const removeSection = (cls: ClassDraft, si: number) => {
    const sec = cls.sections[si];
    if (!sec._id) {
      updateClass(cls, { sections: cls.sections.filter((_, idx) => idx !== si) });
      return;
    }
    setDelDialog({
      open: true, itemName: sec.name, itemType: "section", cls, si,
      deps: null, loading: true,
    });
    fetchSectionDeps(schoolId ?? "", sec._id)
      .then((deps) => setDelDialog((d) => ({ ...d, deps, loading: false })))
      .catch(() => setDelDialog((d) => ({ ...d, deps: { studentCount: 0, subjectCount: 0, teacherCount: 0, hasAttendance: false }, loading: false })));
  };

  const confirmSectionDelete = () => {
    // Look up current class from current source (localClasses when editing) by _id
    const clsId = delDialog.cls._id;
    if (!clsId) return;
    const source = isEditing ? localClasses : data.classes;
    const currentClass = source.find((c) => c._id === clsId);
    if (!currentClass) return;
    updateClass(currentClass, { sections: currentClass.sections.filter((_, idx) => idx !== delDialog.si!) });
    setDelDialog((d) => ({ ...d, open: false }));
  };

  const updateClass = (cls: ClassDraft, patch: Partial<ClassDraft>) => {
    const source = isEditing ? localClasses : data.classes;
    const next = source.map((c) => (c._id ?? c.name) === (cls._id ?? cls.name) ? { ...c, ...patch } : c);
    setClasses(next);
  };

  const addSection = (cls: ClassDraft) => {
    // Find next unused single-letter name (A..Z). If full, fall back to "AA", "AB"...
    const used = new Set(cls.sections.map((s) => s.name.toUpperCase()));
    let nextName: string | null = null;
    for (let i = 0; i < 26; i++) {
      const ch = String.fromCharCode(65 + i);
      if (!used.has(ch)) { nextName = ch; break; }
    }
    if (!nextName) {
      // After Z, use double letters
      for (let i = 0; i < 26 * 26; i++) {
        const first = String.fromCharCode(65 + Math.floor(i / 26));
        const second = String.fromCharCode(65 + (i % 26));
        const code = first + second;
        if (!used.has(code)) { nextName = code; break; }
      }
    }
    if (!nextName) return; // exhausted (extremely unlikely)
    updateClass(cls, { sections: [...cls.sections, { name: nextName, acronym: nextName.slice(0, 2), subjects: [] }] });
  };

  const updateSection = (cls: ClassDraft, si: number, patch: Partial<SectionDraft>) => {
    updateClass(cls, { sections: cls.sections.map((s, idx) => idx === si ? { ...s, ...patch } : s) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldKey = String(active.id).replace("class-", "");
    const newKey = String(over.id).replace("class-", "");
    const source = isEditing ? localClasses : data.classes;
    const oldIdx = source.findIndex((c) => (c._id ?? c.name) === oldKey);
    const newIdx = source.findIndex((c) => (c._id ?? c.name) === newKey);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(source, oldIdx, newIdx);
    setClasses(reordered);
    if (selectedCi === oldIdx) setSelectedCi(newIdx);
    else if (selectedCi !== null && oldIdx < selectedCi && newIdx >= selectedCi) setSelectedCi(selectedCi - 1);
    else if (selectedCi !== null && oldIdx > selectedCi && newIdx <= selectedCi) setSelectedCi(selectedCi + 1);
  };

  const rollNoTooltip = (
    <div className="space-y-1.5 text-xs leading-relaxed">
      <p className="font-semibold">Roll No. = Class Code + Section Code + Sequence</p>
      <p className="text-muted-foreground">Example: 9A01 → Class 9, Section A, Roll #01</p>
      <div className="text-muted-foreground space-y-0.5 mt-1">
        <p>Class Code: from class name (e.g., 9, N, 11S)</p>
        <p>Section Code: 1-2 chars from section name (A→A, Arts→AR)</p>
        <p>Sequence: auto-assigned 01, 02, ...</p>
      </div>
    </div>
  );

  const classItems = useMemo(
    () => data.classes.map((c) => ({ id: c._id ?? c.name, wing_id: (c as any).wing_id })),
    [data.classes],
  );
  const nameMap = useMemo(
    () => Object.fromEntries(data.classes.map((c) => [c._id ?? c.name, c.name])),
    [data.classes],
  );

  // Source switch: localClasses when editing, data.classes otherwise
  const displayClasses = isEditing ? localClasses : data.classes;

  // Filter classes (search only — wing filtering via WingClassFilter tabs)
  const searchFilteredClasses = useMemo(
    () => displayClasses.filter((cls) =>
      !searchQuery ||
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.acronym.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [displayClasses, searchQuery],
  );

  return (
    <div className="w-full space-y-5">
      {/* Edit mode controls */}
      {onSave && (
        <div className="flex justify-end">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={cancelEdit}
                disabled={isSaving}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || hasBlockingErrors}
                className={`cursor-pointer ${!hasChanges && !isSaving && !hasBlockingErrors ? "opacity-60" : ""}`}
              >
                {hasBlockingErrors
                  ? <><AlertTriangle className="h-4 w-4" /> Fix {blockingErrors.length} issue{blockingErrors.length !== 1 ? "s" : ""}</>
                  : isSaving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                    : !hasChanges
                      ? <><Save className="h-4 w-4" /> No changes to save</>
                      : <><Save className="h-4 w-4" /> Save</>}
              </Button>
            </>
          ) : (
            data.classes.length > 0 && (
              <Button onClick={enterEditMode} className="cursor-pointer">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )
          )}
        </div>
      )}

      {/* Academic Year badge */}
      <div className="space-y-1.5">
        <Label className="font-medium text-sm">Academic Year</Label>
        <Badge variant="outline" className="text-sm px-3 py-1 font-mono">
          {data.academic_year || defaultYear}
        </Badge>
      </div>

      {/* Search + count */}
      <div className="flex flex-wrap gap-3 items-center border rounded-lg p-3 bg-muted/20">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {searchFilteredClasses.length} of {data.classes.length} classes
        </div>
      </div>

      {/* Add class */}
      <div className="space-y-3 pt-2 border-t">
        <div>
          <Label className="text-base font-semibold">Classes &amp; Sections</Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditing ? (
              <>Click a card to select. Drag <GripVertical className="inline h-3 w-3" /> to reorder.</>
            ) : (
              <>View classes. Click Edit to modify.</>
            )}
          </p>
        </div>

        {/* Quick add - only when editing */}
        {isEditing && (
          <>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CLASSES.map((c) => {
                const exists = displayClasses.some((x) => x.name === c);
                return (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={exists ? "secondary" : "outline"}
                    disabled={exists}
                    onClick={() => addClass(c)}
                  >
                    + {c}
                  </Button>
                );
              })}
            </div>

            {/* Custom add */}
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Custom class name (e.g. Pre-Nursery)"
                value={newClass}
                onChange={(e) => setNewClass(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addClass(newClass); setNewClass(""); }
                }}
              />
              <Button type="button" onClick={() => { addClass(newClass); setNewClass(""); }}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </>
        )}

        {/* Roll number help tooltip */}
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipContent side="bottom" className="max-w-xs">
              {rollNoTooltip}
            </TooltipContent>
            <TooltipTrigger asChild>
              <HelpCircle className="inline h-3.5 w-3.5 text-muted-foreground cursor-help ml-1 align-middle" />
            </TooltipTrigger>
          </Tooltip>
        </TooltipProvider>

        {/* Class cards with wing filter */}
        {searchFilteredClasses.length > 0 ? (
          <WingClassFilter
            wings={wingsData ?? []}
            items={classItems}
            activeFilter={wingFilter}
            onFilterChange={setWingFilter}
            nameMap={nameMap}
          >
            {(filteredItems) => {
              // Build filteredClasses using stable object references
              const filteredClassMap = new Map<string, ClassDraft>();
              filteredItems.forEach((item) => {
                const cls = displayClasses.find((c) => (c._id ?? c.name) === item.id);
                if (cls) filteredClassMap.set(cls._id ?? cls.name, cls);
              });
              const filteredClasses = Array.from(filteredClassMap.values());
              return (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={isEditing ? handleDragEnd : () => {}}>
                  <SortableContext items={filteredClasses.map((cls) => `class-${cls._id ?? cls.name}`)}>
                    <div className="space-y-3">
                      {filteredClasses.map((cls) => {
                        return (
                          <SortableClassCard
                            key={`class-${cls._id ?? cls.name}`}
                            cls={cls}
                            data={data}
                            isSelected={selectedCi === displayClasses.indexOf(cls)}
                            isEditing={isEditing}
                            depCounts={cls._id ? (depCountsMap[cls._id] ?? { students: 0, subjects: 0, teachers: 0 }) : { students: 0, subjects: 0, teachers: 0 }}
                            onSelect={() => isEditing && setSelectedCi(selectedCi === displayClasses.indexOf(cls) ? null : displayClasses.indexOf(cls))}
                            onUpdateClass={updateClass}
                            onUpdateSection={updateSection}
                            onRemoveSection={removeSection}
                            onAddSection={addSection}
                            onRemoveClass={removeClass}
                            onCustomDates={() => onNavigateToSessions?.()}
                            manuallyEditedSections={manuallyEditedSections}
                            onSectionAcronymEdited={(si) => handleSectionAcronymEdited(cls, si)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              );
            }}
          </WingClassFilter>
        ) : displayClasses.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No classes yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isEditing ? "Add classes using quick-add buttons or custom input above." : "No classes configured."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-xl p-8 text-center text-muted-foreground">
            <p className="text-sm">No classes match your filter.</p>
          </div>
        )}
      </div>

      {/* Deletion confirmation dialog */}
      <DeletionConfirmDialog
        open={delDialog.open}
        onOpenChange={(v) => setDelDialog((d) => ({ ...d, open: v }))}
        itemName={delDialog.itemName}
        itemType={delDialog.itemType}
        deps={delDialog.deps}
        loading={delDialog.loading}
        onConfirm={delDialog.itemType === "class" ? confirmClassDelete : confirmSectionDelete}
      />
    </div>
  );
});