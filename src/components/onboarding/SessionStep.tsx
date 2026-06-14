import { useState, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  GripVertical,
  BookOpen,
  Layers,
  Pencil,
  Save,
  Loader2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Checkbox,
} from "@/components/ui/checkbox";
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
import {
  ACADEMIC_YEARS,
  TERM_STRUCTURES,
  DEFAULT_CLASSES,
  getDefaultTermStructure,
  sortClasses,
} from "@/lib/onboarding-constants";
import { deriveClassAcronym } from "@/lib/student-utils";
import { supabase } from "@/integrations/supabase/client";
import type { SessionStepData, ClassDraft, SectionDraft } from "./types";

interface Props {
  initialData?: SessionStepData;
  data: SessionStepData;
  onChange: (d: SessionStepData) => void;
  onSave?: (d: SessionStepData) => Promise<void>;
  schoolId?: string;
  isOnboarding?: boolean; // show year selector in onboarding, badge in normal mode
}

// ── Right sticky panel — now includes health warnings ──────────
function RightPanel({ classes, selectedCi, hasBlockingErrors }: { classes: ClassDraft[]; selectedCi: number | null; hasBlockingErrors: boolean }) {
  const totalSections = classes.reduce((sum, c) => sum + c.sections.length, 0);
  const hasCustomCodes = classes.some((c) => c.acronym && c.acronym !== deriveClassAcronym(c.name));
  const hasCustomSectionCodes = classes.some((c) =>
    c.sections.some((s) => s.acronym && s.acronym !== s.name.slice(0, 2).toUpperCase()),
  );
  const selectedClass = selectedCi !== null ? classes[selectedCi] : null;

  // ── Health warnings ──────────────────────────────────────────
  const warnings: { severity: "error" | "warning" | "info"; message: string; classRef?: string }[] = [];

  // Duplicate class codes
  const codeCounts: Record<string, string[]> = {};
  classes.forEach((c) => {
    const code = c.acronym || deriveClassAcronym(c.name);
    if (!codeCounts[code]) codeCounts[code] = [];
    codeCounts[code].push(c.name);
  });
  Object.entries(codeCounts).forEach(([code, names]) => {
    if (names.length > 1) {
      warnings.push({ severity: "error", message: `Duplicate class code "${code}"`, classRef: names.join(", ") });
    }
  });

  // Duplicate section codes inside same class
  classes.forEach((c) => {
    const secCodeCounts: Record<string, string[]> = {};
    c.sections.forEach((s) => {
      const code = s.acronym || s.name.slice(0, 2).toUpperCase();
      if (!secCodeCounts[code]) secCodeCounts[code] = [];
      secCodeCounts[code].push(s.name);
    });
    Object.entries(secCodeCounts).forEach(([code, names]) => {
      if (names.length > 1) {
        warnings.push({ severity: "error", message: `Duplicate section code "${code}" in ${c.name}`, classRef: c.name });
      }
    });
  });

  // Missing dates
  classes.forEach((c) => {
    if (!c.start_date) {
      warnings.push({ severity: "error", message: `Missing start date — ${c.name}`, classRef: c.name });
    }
    if (!c.end_date) {
      warnings.push({ severity: "error", message: `Missing end date — ${c.name}`, classRef: c.name });
    }
    if (c.start_date && c.end_date && c.end_date < c.start_date) {
      warnings.push({ severity: "error", message: `End before start — ${c.name}`, classRef: c.name });
    }
  });

  // Classes without sections
  classes.forEach((c) => {
    if (c.sections.length === 0) {
      warnings.push({ severity: "error", message: `No sections — ${c.name}`, classRef: c.name });
    }
  });

  const blockingErrors = warnings.filter((w) => w.severity === "error");
  const infoWarnings = warnings.filter((w) => w.severity !== "error");

  return (
    <aside className="w-60 shrink-0 space-y-4 sticky top-4 self-start">
      {/* Summary */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Setup Summary</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Classes</span>
            <span className="font-medium font-mono">{classes.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sections</span>
            <span className="font-medium font-mono">{totalSections}</span>
          </div>
          {hasCustomCodes && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custom codes</span>
              <span className="font-medium text-primary">Yes</span>
            </div>
          )}
        </div>
      </div>

      {/* Health warnings panel */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center gap-2 mb-3">
          {blockingErrors.length > 0 ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          <span className="text-sm font-semibold">Health</span>
        </div>

        {blockingErrors.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-destructive mb-1">
              {blockingErrors.length} blocking issue{blockingErrors.length !== 1 ? "s" : ""} — save blocked
            </p>
            {blockingErrors.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs bg-destructive/5 border border-destructive/20 rounded px-2.5 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-destructive font-medium">{w.message}</p>
                  {w.classRef && w.classRef !== w.message && (
                    <p className="text-muted-foreground text-xs mt-0.5">{w.classRef}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Add classes to see health status.</p>
        ) : (
          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-500/10 rounded px-2.5 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>No blocking issues</span>
          </div>
        )}

        {infoWarnings.length > 0 && blockingErrors.length === 0 && (
          <div className="mt-2 space-y-1.5">
            {infoWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded px-2.5 py-2">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                <p className="text-yellow-700">{w.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roll number format */}
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Roll Number Format</span>
        </div>
        <div className="bg-muted/50 rounded p-2.5 font-mono text-xs mb-3">
          <div className="text-muted-foreground mb-1">Structure:</div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">Class</span>
            <span className="text-muted-foreground">+</span>
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">Section</span>
            <span className="text-muted-foreground">+</span>
            <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">Seq</span>
          </div>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Class 9 + A:</span>
            <span className="font-mono font-medium">9A01</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Class 11 + Sci + B:</span>
            <span className="font-mono font-medium">11SB01</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Nursery + A:</span>
            <span className="font-mono font-medium">NA01</span>
          </div>
        </div>
      </div>

      {/* Custom code warning */}
      {(hasCustomCodes || hasCustomSectionCodes) && selectedClass && (
        <div className="border border-primary/30 bg-primary/5 rounded-lg p-3">
          <p className="text-xs font-medium text-primary mb-1">Custom codes active</p>
          <p className="text-xs text-muted-foreground">
            {selectedClass.name} uses custom roll prefix "{selectedClass.acronym}".
          </p>
        </div>
      )}

      {/* Subject Teacher health warnings */}
      {classes.length > 0 && (() => {
        const teacherWarnings: { severity: "error" | "warning"; message: string; className: string; sectionName?: string }[] = [];
        classes.forEach((cls) => {
          cls.sections.forEach((sec) => {
            const hasClassTeacher = !!sec.classTeacher?.staff_profile_id;
            const hasSubjectTeachers = (sec.subjectTeachers ?? []).length > 0;
            if (sec.subjects.length > 0 && !hasClassTeacher) {
              teacherWarnings.push({ severity: "warning", message: `No class teacher assigned`, className: cls.name, sectionName: sec.name });
            }
            if (sec.subjects.length > 0 && !hasSubjectTeachers) {
              teacherWarnings.push({ severity: "warning", message: `No subject teachers assigned`, className: cls.name, sectionName: sec.name });
            }
          });
        });
        if (teacherWarnings.length === 0) return null;
        return (
          <div className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-semibold">Teacher Assignment</span>
            </div>
            <div className="space-y-1.5">
              {teacherWarnings.slice(0, 5).map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded px-2 py-1.5">
                  <AlertTriangle className="h-3 w-3 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-800">{w.className}{w.sectionName ? ` › ${w.sectionName}` : ""}</p>
                    <p className="text-yellow-700 text-xs">{w.message}</p>
                  </div>
                </div>
              ))}
              {teacherWarnings.length > 5 && (
                <p className="text-xs text-muted-foreground text-center">+{teacherWarnings.length - 5} more</p>
              )}
            </div>
          </div>
        );
      })()}
    </aside>
  );
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
              ? `Remove "${itemName}" and all its sections from the active structure?`
              : `Remove section "${itemName}" from "${itemName}"?`}
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
                      <span>subject assignment{deps.subjectCount !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {deps.teacherCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-destructive font-medium">{deps.teacherCount}</span>
                      <span>teacher assignment{deps.teacherCount !== 1 ? "s" : ""}</span>
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
                  Removing this {itemType} will permanently delete all associated records from the database.
                  This action cannot be undone.
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

// ── Inline editable code field (pencil + rounded input) ────────
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

// ── Section pill ──────────────────────────────────────────────
function SectionPill({
  section,
  classCode,
  onRemove,
  onAddSection,
  onUpdateSection,
  ci,
  si,
}: {
  section: SectionDraft;
  classCode: string;
  onRemove: () => void;
  onAddSection: () => void;
  onUpdateSection?: (patch: Partial<SectionDraft>) => void;
  ci?: number;
  si?: number;
}) {
  const defaultAcronym = section.name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase()
    || section.name.toUpperCase();
  const sectionCode = section.acronym || defaultAcronym;

  const [codeEditing, setCodeEditing] = useState(false);
  const [codeInput, setCodeInput] = useState(sectionCode);
  const [nameEditing, setNameEditing] = useState(false);
  const [nameInput, setNameInput] = useState(section.name);

  const startNameEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNameInput(section.name);
    setNameEditing(true);
  };

  const commitNameEdit = () => {
    if (onUpdateSection && ci !== undefined && si !== undefined && nameInput.trim()) {
      onUpdateSection(ci, si, { name: nameInput.trim() });
    }
    setNameEditing(false);
  };

  const startCodeEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCodeInput(sectionCode);
    setCodeEditing(true);
  };

  const commitCodeEdit = () => {
    if (onUpdateSection && ci !== undefined && si !== undefined) {
      onUpdateSection(ci, si, { acronym: codeInput.toUpperCase() || defaultAcronym });
    }
    setCodeEditing(false);
  };

  return (
    <div className="flex items-center gap-2 bg-secondary/60 border rounded-lg px-3 py-2 text-xs group">
      {nameEditing ? (
        <input
          className="border rounded px-1.5 py-0.5 text-xs w-14 font-medium outline-none focus:ring-1 ring-primary bg-background"
          value={nameInput}
          autoFocus
          maxLength={4}
          onChange={(e) => setNameInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitNameEdit();
            if (e.key === "Escape") setNameEditing(false);
          }}
          onBlur={commitNameEdit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <button
          type="button"
          onClick={startNameEdit}
          className="flex items-center gap-1 font-medium hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
          title="Edit section name"
        >
          {section.name}
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
      <span className="text-muted-foreground">/</span>
      {codeEditing ? (
        <input
          className="border rounded px-1.5 py-0.5 text-xs w-12 font-mono uppercase outline-none focus:ring-1 ring-primary bg-background"
          value={codeInput}
          autoFocus
          maxLength={2}
          onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitCodeEdit();
            if (e.key === "Escape") setCodeEditing(false);
          }}
          onBlur={commitCodeEdit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <button
          type="button"
          onClick={startCodeEdit}
          className="flex items-center gap-1 font-mono text-primary hover:bg-muted/50 rounded px-1 py-0.5 transition-colors"
          title="Edit section code"
        >
          {sectionCode}
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
      <div className="flex items-center gap-1 text-muted-foreground/60">
        <span>→</span>
        <span className="font-mono font-medium text-foreground">{classCode}{sectionCode}01</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        title="Remove section"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Sortable class card ───────────────────────────────────────
interface SortableCardProps {
  cls: ClassDraft;
  ci: number;
  data: SessionStepData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateClass: (ci: number, patch: Partial<ClassDraft>) => void;
  onUpdateSection: (ci: number, si: number, patch: Partial<SectionDraft>) => void;
  onRemoveSection: (ci: number, si: number) => void;
  onAddSection: (ci: number) => void;
  onRemoveClass: (ci: number) => void;
}

function SortableClassCard({
  cls,
  ci,
  data,
  isSelected,
  onSelect,
  onUpdateClass,
  onUpdateSection,
  onRemoveSection,
  onAddSection,
  onRemoveClass,
}: SortableCardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: `class-${ci}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const classCode = cls.acronym || deriveClassAcronym(cls.name);

  // Editable class name
  const [nameEditing, setNameEditing] = useState(false);
  const [nameInput, setNameInput] = useState(cls.name);

  const startNameEdit = () => { setNameInput(cls.name); setNameEditing(true); };
  const commitNameEdit = () => { if (nameInput.trim()) onUpdateClass(ci, { name: nameInput.trim() }); setNameEditing(false); };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-xl overflow-hidden bg-card transition-shadow cursor-pointer w-full",
        isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm",
      )}
      onClick={onSelect}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/20">
        {/* Drag handle */}
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
          {...attributes} {...listeners}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Class name — inline editable */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); startNameEdit(); }}
          className="flex-1 text-left text-sm font-semibold flex items-center gap-1.5 truncate"
        >
          {cls.name}
          <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
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

        {/* Class Code + Section/Code editable inputs */}
        <div className="flex items-center gap-3 shrink-0">
          <EditableCode
            label="Class Code"
            value={cls.acronym}
            placeholder={deriveClassAcronym(cls.name)}
            onChange={(v) => onUpdateClass(ci, { acronym: v })}
          />
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemoveClass(ci); }}
          className="text-muted-foreground hover:text-destructive shrink-0"
          title="Remove class"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Settings toggle */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setSettingsOpen((v) => !v); }}
          className={cn("shrink-0 transition-colors", settingsOpen ? "text-primary" : "text-muted-foreground hover:text-foreground")}
          title={settingsOpen ? "Hide settings" : "More settings"}
        >
          {settingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Card body */}
      <div className="px-4 py-3 space-y-3" onClick={(e) => e.stopPropagation()}>
        {/* Sections / Section Code */}
        <div>
          <Label className="text-xs text-muted-foreground font-medium mb-2 block">Sections / Section Code</Label>
          <div className="flex flex-wrap gap-2">
            {cls.sections.map((s, si) => (
              <SectionPill
                key={si}
                section={s}
                classCode={classCode}
                onRemove={() => onRemoveSection(ci, si)}
                onAddSection={() => onAddSection(ci)}
                onUpdateSection={(patch) => onUpdateSection(ci, si, patch)}
                ci={ci}
                si={si}
              />
            ))}
            <button
              type="button"
              onClick={() => onAddSection(ci)}
              className="flex items-center gap-1 text-xs text-primary hover:underline px-2 py-2"
            >
              <Plus className="h-3 w-3" /> Section
            </button>
          </div>
        </div>

        {/* Term + dates inline */}
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Term</Label>
            <Select value={cls.term_structure} onValueChange={(v) => onUpdateClass(ci, { term_structure: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERM_STRUCTURES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(() => {
            const yearDates = getAcademicYearDates(data.academic_year);
            return (
              <>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">Start</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={cls.start_date}
              min={yearDates.start}
              max={yearDates.end}
              onChange={(e) => onUpdateClass(ci, { start_date: e.target.value })}
            />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-muted-foreground">End</Label>
            <Input
              type="date"
              className="h-8 text-xs"
              value={cls.end_date}
              min={cls.start_date || undefined}
              max={yearDates.end}
              onChange={(e) => onUpdateClass(ci, { end_date: e.target.value })}
            />
          </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Settings panel */}
      {settingsOpen && (
        <div className="border-t bg-muted/10 px-4 py-3 space-y-3" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Class Code (Roll Prefix)</Label>
              <Input
                className="h-8 text-xs uppercase"
                value={cls.acronym}
                maxLength={4}
                placeholder={deriveClassAcronym(cls.name)}
                onChange={(e) => onUpdateClass(ci, { acronym: e.target.value.toUpperCase() })}
              />
              <p className="text-xs text-muted-foreground">Auto: {deriveClassAcronym(cls.name)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Term Structure</Label>
              <Select value={cls.term_structure} onValueChange={(v) => onUpdateClass(ci, { term_structure: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TERM_STRUCTURES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Session Dates</Label>
              <div className="flex gap-1 items-center">
                <Input type="date" className="h-8 text-xs" value={cls.start_date}
                  onChange={(e) => onUpdateClass(ci, { start_date: e.target.value })} />
                <span className="text-muted-foreground">→</span>
                <Input type="date" className="h-8 text-xs" value={cls.end_date}
                  onChange={(e) => onUpdateClass(ci, { end_date: e.target.value })} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function SessionStep({ initialData, data, onChange, onSave, schoolId, isOnboarding }: Props) {
  const [newClass, setNewClass] = useState(initialData ? data.academic_year : "");
  const [selectedCi, setSelectedCi] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Academic year — onboarding only: offer upcoming year option
  const defaultYear = getCurrentAcademicYear();
  const upcomingYear = getUpcomingAcademicYear();

  // ── Deletion dialog state ──────────────────────────────────
  const [delDialog, setDelDialog] = useState<{
    open: boolean;
    itemName: string;
    itemType: "class" | "section";
    ci: number;
    si?: number;
    deps: DeletionDeps | null;
    loading: boolean;
  }>({ open: false, itemName: "", itemType: "class", ci: -1, deps: null, loading: false });

  // ── Pending change count ─────────────────────────────────
  useEffect(() => {
    const initial = initialData ?? { academic_year: "", classes: [], wings: [] };
    let count = 0;
    if (data.academic_year !== initial.academic_year) count++;
    const initialIds = new Set(initial.classes.map((c) => c._id).filter(Boolean));
    const dataIds = new Set(data.classes.map((c) => c._id).filter(Boolean));
    if (data.classes.length !== initial.classes.length) count++;
    initial.classes.forEach((ic) => {
      if (ic._id && !dataIds.has(ic._id)) count++; // deleted
    });
    data.classes.forEach((dc, ci) => {
      const ic = initial.classes[ci];
      if (!ic) { count++; return; } // added
      if (dc.name !== ic.name) count++;
      if (dc.acronym !== ic.acronym) count++;
      if (dc.term_structure !== ic.term_structure) count++;
      if (dc.start_date !== ic.start_date) count++;
      if (dc.end_date !== ic.end_date) count++;
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
  const blockingErrors: string[] = [];
  const codeCounts: Record<string, number> = {};
  data.classes.forEach((c) => {
    const code = c.acronym || deriveClassAcronym(c.name);
    codeCounts[code] = (codeCounts[code] || 0) + 1;
    if (c.sections.length === 0) {
      blockingErrors.push(`No sections in ${c.name}`);
    }
    if (!c.start_date) blockingErrors.push(`Missing start date — ${c.name}`);
    if (!c.end_date) blockingErrors.push(`Missing end date — ${c.name}`);
    if (c.start_date && c.end_date && c.end_date < c.start_date) {
      blockingErrors.push(`End before start — ${c.name}`);
    }
  });
  Object.entries(codeCounts).forEach(([code, count]) => {
    if (count > 1) blockingErrors.push(`Duplicate class code "${code}"`);
  });
  // Section code duplicates
  data.classes.forEach((c) => {
    const secCodeCounts: Record<string, string[]> = {};
    c.sections.forEach((s) => {
      const code = s.acronym || s.name.slice(0, 2).toUpperCase();
      if (!secCodeCounts[code]) secCodeCounts[code] = [];
      secCodeCounts[code].push(s.name);
    });
    Object.entries(secCodeCounts).forEach(([code, names]) => {
      if (names.length > 1) blockingErrors.push(`Duplicate section code "${code}" in ${c.name}`);
    });
  });
  const hasBlockingErrors = blockingErrors.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const set = <K extends keyof SessionStepData>(k: K, v: SessionStepData[K]) =>
    onChange({ ...data, [k]: v });

  const applyYear = (year: string) => {
    const range = getAcademicYearDates(year);
    const updated = data.classes.map((c) => ({
      ...c,
      start_date: range.start,
      end_date: range.end,
    }));
    onChange({ ...data, academic_year: year, classes: updated });
  };

  const handleYearChange = (year: string) => applyYear(year);

  const [useUpcomingYear, setUseUpcomingYear] = useState(false);

  // Sync academic_year when useUpcomingYear toggles (onboarding only)
  useEffect(() => {
    if (!isOnboarding) return;
    const targetYear = useUpcomingYear ? upcomingYear : defaultYear;
    if (data.academic_year !== targetYear) applyYear(targetYear);
  }, [useUpcomingYear]);

  const addClass = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || data.classes.some((c) => c.name === trimmed)) return;
    const range = getAcademicYearDates(data.academic_year);
    const newCls: ClassDraft = {
      name: trimmed,
      acronym: deriveClassAcronym(trimmed),
      term_structure: getDefaultTermStructure(trimmed),
      start_date: range.start,
      end_date: range.end,
      sections: [{ name: "A", subjects: [] }],
    };
    const next = sortClasses([...data.classes, newCls]);
    onChange({ ...data, classes: next });
    setSelectedCi(next.length - 1);
  };

  const removeClass = (i: number) => {
    const cls = data.classes[i];
    if (!cls._id) {
      // New class (never saved) — remove immediately
      set("classes", data.classes.filter((_, idx) => idx !== i));
      if (selectedCi === i) setSelectedCi(null);
      return;
    }
    setDelDialog({
      open: true, itemName: cls.name, itemType: "class", ci: i,
      deps: null, loading: true,
    });
    fetchClassDeps(schoolId ?? "", cls._id, cls.sections.filter((s) => s._id).map((s) => s._id as string))
      .then((deps) => setDelDialog((d) => ({ ...d, deps, loading: false })));
  };

  const confirmClassDelete = () => {
    const cls = data.classes[delDialog.ci];
    set("classes", data.classes.filter((_, idx) => idx !== delDialog.ci));
    if (selectedCi === delDialog.ci) setSelectedCi(null);
    setDelDialog((d) => ({ ...d, open: false }));
  };

  const removeSection = (ci: number, si: number) => {
    const cls = data.classes[ci];
    const sec = cls.sections[si];
    if (!sec._id) {
      updateClass(ci, { sections: cls.sections.filter((_, idx) => idx !== si) });
      return;
    }
    setDelDialog({
      open: true, itemName: sec.name, itemType: "section", ci, si,
      deps: null, loading: true,
    });
    fetchSectionDeps(schoolId ?? "", sec._id)
      .then((deps) => setDelDialog((d) => ({ ...d, deps, loading: false })));
  };

  const confirmSectionDelete = () => {
    const cls = data.classes[delDialog.ci];
    updateClass(delDialog.ci, { sections: cls.sections.filter((_, idx) => idx !== delDialog.si!) });
    setDelDialog((d) => ({ ...d, open: false }));
  };

  const updateClass = (i: number, patch: Partial<ClassDraft>) =>
    set("classes", data.classes.map((c, idx) => idx === i ? { ...c, ...patch } : c));

  const addSection = (i: number) => {
    const cls = data.classes[i];
    const nextChar = String.fromCharCode(65 + cls.sections.length);
    updateClass(i, { sections: [...cls.sections, { name: nextChar, acronym: nextChar, subjects: [] }] });
  };

  const updateSection = (ci: number, si: number, patch: Partial<SectionDraft>) => {
    const cls = data.classes[ci];
    updateClass(ci, { sections: cls.sections.map((s, idx) => idx === si ? { ...s, ...patch } : s) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = data.classes.findIndex((_, i) => `class-${i}` === active.id);
    const newIndex = data.classes.findIndex((_, i) => `class-${i}` === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(data.classes, oldIndex, newIndex);
    set("classes", reordered);
    if (selectedCi === oldIndex) setSelectedCi(newIndex);
    else if (selectedCi !== null && oldIndex < selectedCi && newIndex >= selectedCi) setSelectedCi(selectedCi - 1);
    else if (selectedCi !== null && oldIndex > selectedCi && newIndex <= selectedCi) setSelectedCi(selectedCi + 1);
  };

  return (
    <div className="w-full flex gap-6 items-start">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
        {/* Save button when used standalone */}
        {onSave && (
          <div className="flex justify-end">
            <Button
              onClick={async () => {
                setSaving(true);
                try { await onSave(data); }
                finally { setSaving(false); }
              }}
              disabled={saving || hasBlockingErrors}
              className="cursor-pointer"
            >
              {hasBlockingErrors
                ? <><AlertTriangle className="h-4 w-4" /> Fix {blockingErrors.length} issue{blockingErrors.length !== 1 ? "s" : ""} first</>
                : saving
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                  : <><Save className="h-4 w-4" /> Save{pendingCount > 0 ? ` (${pendingCount})` : ""}</>}
            </Button>
          </div>
        )}

        {/* Academic Year */}
        {isOnboarding ? (
          /* ── Onboarding: auto-derived year with option to switch to upcoming ── */
          <div className="space-y-3 p-4 border rounded-lg bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <Label className="font-medium text-sm">Academic Year</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-sm px-3 py-1 font-mono">
                    {data.academic_year || defaultYear}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Auto-assigned · Apr {data.academic_year.split("-")[0]} to Mar {String(Number(data.academic_year.split("-")[0]) + 1)}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="use-upcoming-year"
                  checked={useUpcomingYear}
                  onCheckedChange={(checked) => setUseUpcomingYear(checked === true)}
                />
                <label htmlFor="use-upcoming-year" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                  Start with upcoming year<br />
                  <span className="font-medium text-foreground font-mono">{upcomingYear}</span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          /* ── Post-onboarding: read-only badge, no selection ── */
          <div className="space-y-1.5">
            <Label className="font-medium text-sm">Academic Year</Label>
            <Badge variant="outline" className="text-sm px-3 py-1 font-mono">
              {data.academic_year || defaultYear}
            </Badge>
          </div>
        )}

        {/* Add class */}
        <div className="space-y-3 pt-2 border-t">
          <div>
            <Label className="text-base font-semibold">Classes & Sections</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click a card to select it. Drag <GripVertical className="inline h-3 w-3" /> to reorder.
            </p>
          </div>

          {/* Quick add */}
          <div className="flex flex-wrap gap-2">
            {DEFAULT_CLASSES.map((c) => {
              const exists = data.classes.some((x) => x.name === c);
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

          {/* Class cards */}
          {data.classes.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={data.classes.map((_, i) => `class-${i}`)}>
                <div className="space-y-3">
                  {data.classes.map((cls, ci) => (
                    <SortableClassCard
                      key={`class-${ci}`}
                      cls={cls}
                      ci={ci}
                      data={data}
                      isSelected={selectedCi === ci}
                      onSelect={() => setSelectedCi(selectedCi === ci ? null : ci)}
                      onUpdateClass={updateClass}
                      onUpdateSection={updateSection}
                      onRemoveSection={removeSection}
                      onAddSection={addSection}
                      onRemoveClass={removeClass}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="border-2 border-dashed rounded-xl p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Layers className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No classes yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add classes using quick-add buttons or custom input above.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right sticky panel */}
      <RightPanel classes={data.classes} selectedCi={selectedCi} hasBlockingErrors={hasBlockingErrors} />

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
}
