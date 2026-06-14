import { useEffect, useState, useRef, useMemo } from "react";
import { Plus, X, Copy, ChevronDown, ChevronUp, Save, Loader2, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { deriveClassAcronym } from "@/lib/student-utils";
import { toTitleCase } from "@/lib/text-utils";
import { supabase } from "@/integrations/supabase/client";
import type { SessionStepData, SectionDraft, SubjectDraft, TeacherAssignment, ClassTeacherAssignment } from "./types";

const deriveSectionAcronym = (name: string): string =>
  name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || name;

// ── Pre-loaded subject library ─────────────────────────────────
const SUBJECTS_BY_CATEGORY: Record<string, { name: string; code: string }[]> = {
  Primary: [
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
    { name: "Mathematics", code: "MAT" },
    { name: "EVS", code: "EVS" },
    { name: "General Knowledge", code: "GK" },
    { name: "Art & Craft", code: "ART" },
    { name: "Computer", code: "COM" },
  ],
  Middle: [
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
    { name: "Mathematics", code: "MAT" },
    { name: "Science", code: "SCI" },
    { name: "Social Science", code: "SST" },
    { name: "Sanskrit", code: "SAN" },
    { name: "Computer", code: "COM" },
  ],
  Secondary: [
    { name: "English", code: "ENG" },
    { name: "Hindi", code: "HIN" },
    { name: "Mathematics", code: "MAT" },
    { name: "Science", code: "SCI" },
    { name: "Social Science", code: "SST" },
    { name: "Sanskrit", code: "SAN" },
    { name: "Computer", code: "COM" },
    { name: "Physical Education", code: "PE" },
  ],
  Science: [
    { name: "Physics", code: "PHY" },
    { name: "Chemistry", code: "CHEM" },
    { name: "Biology", code: "BIO" },
    { name: "Mathematics", code: "MAT" },
    { name: "English", code: "ENG" },
    { name: "Physical Education", code: "PE" },
  ],
  Commerce: [
    { name: "Accountancy", code: "ACC" },
    { name: "Economics", code: "ECO" },
    { name: "Business Studies", code: "BST" },
    { name: "Mathematics", code: "MAT" },
    { name: "English", code: "ENG" },
  ],
  Arts: [
    { name: "History", code: "HIS" },
    { name: "Geography", code: "GEO" },
    { name: "Political Science", code: "POL" },
    { name: "Sociology", code: "SOC" },
    { name: "English", code: "ENG" },
    { name: "Psychology", code: "PSY" },
  ],
};

const STREAMS = ["Science", "Commerce", "Arts", "Bifocal"];

// ── Helpers ────────────────────────────────────────────────────
const extractClassNumber = (className: string): number | null => {
  const match = className.toLowerCase().match(/\b(?:class\s*)?(\d{1,2})\b/);
  if (!match) return null;
  const classNumber = Number(match[1]);
  return Number.isNaN(classNumber) ? null : classNumber;
};

const getCategory = (className: string): string => {
  const lower = className.toLowerCase();

  if (["nursery", "lkg", "ukg"].some((c) => lower === c)) {
    return "Primary";
  }

  const classNumber = extractClassNumber(className);
  if (classNumber === null) {
    return "Middle";
  }

  if (classNumber >= 1 && classNumber <= 5) {
    return "Primary";
  }
  if (classNumber >= 6 && classNumber <= 8) {
    return "Middle";
  }
  if (classNumber === 9 || classNumber === 10) {
    return "Secondary";
  }
  if (classNumber === 11 || classNumber === 12) {
    return "Senior";
  }

  return "Middle";
};

const isSenior = (className: string) => getCategory(className) === "Senior";

const defaultSubjectsForCategory = (category: string): SubjectDraft[] =>
  (SUBJECTS_BY_CATEGORY[category] ?? SUBJECTS_BY_CATEGORY.Middle).map((s) => ({
    name: s.name,
    code: s.code,
  }));

const defaultSubjectsForStream = (stream: string): SubjectDraft[] =>
  (SUBJECTS_BY_CATEGORY[stream] ?? []).map((s) => ({
    name: s.name,
    code: s.code,
    stream,
  }));

// ── Main Component ─────────────────────────────────────────────
interface Props {
  initialData?: SessionStepData;
  data: SessionStepData;
  onChange: (d: SessionStepData) => void;
  onSave?: (d: SessionStepData) => Promise<void>;
  schoolId?: string;
  academicYearId?: string;
}

export function SubjectsStep({ initialData, data, onChange, onSave, schoolId, academicYearId }: Props) {
  const [openClass, setOpenClass] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [staffList, setStaffList] = useState<{ id: string; name: string; designation: string }[]>([]);
  const [wingFilter, setWingFilter] = useState<string>("all");

  // Prevent infinite loop: track if we already normalized
  const normalizedRef = useRef(false);
  // Track if teacher assignments already loaded
  const loadedAssignmentsRef = useRef(false);

  // Derive unique wings from class data — memoized to avoid recompute on every render
  const wingOptions = useMemo(() => {
    const wings = data.classes
      .filter((c) => c.wing_id)
      .reduce((acc: { id: string; name: string }[], c) => {
        if (!acc.find((w) => w.id === c.wing_id)) {
          acc.push({ id: c.wing_id!, name: c.wing ?? "Wing" });
        }
        return acc;
      }, []);
    return [{ id: "all", name: "All Wings" }, ...wings];
  }, [data.classes]);
  const hasUnassigned = data.classes.some((c) => !c.wing_id);
  const showUnassigned = wingFilter === "all" || wingFilter === "unassigned";

  // Filter classes by wing
  const filteredClasses = data.classes.filter((c) => {
    if (wingFilter === "all") return true;
    if (wingFilter === "unassigned") return !c.wing_id;
    return c.wing_id === wingFilter;
  });

  // Normalize subjects on first mount — onChange NOT in deps to prevent feedback loop
  useEffect(() => {
    if (normalizedRef.current || data.classes.length === 0) return;
    normalizedRef.current = true;

    let changed = false;
    const normalizedClasses = data.classes.map((cls) => {
      const senior = isSenior(cls.name);
      const category = getCategory(cls.name);

      const normalizedSections = cls.sections.map((section) => {
        const safeSubjects = section.subjects ?? [];

        if (senior) {
          return safeSubjects.length === 0 && section.subjects.length === 0
            ? section
            : { ...section, subjects: safeSubjects };
        }

        if (safeSubjects.length === 0) {
          changed = true;
          return { ...section, subjects: defaultSubjectsForCategory(category) };
        }

        return { ...section, subjects: safeSubjects };
      });

      return normalizedSections !== cls.sections
        ? { ...cls, sections: normalizedSections }
        : cls;
    });

    if (changed) {
      onChange({ ...data, classes: normalizedClasses });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load staff list for teacher assignment
  useEffect(() => {
    if (!schoolId) return;
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("school_id", schoolId)
      .in("role", ["teacher", "staff"])
      .then(({ data: rows }) => {
        setStaffList((rows ?? []).map((r) => ({
          id: r.id,
          name: r.full_name ?? "Unknown",
          designation: r.role ?? "",
        })));
      });
  }, [schoolId]);

  // Load existing teacher assignments — runs once per academicYearId mount
  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    // Reset guard when academicYearId changes (tab switch scenario)
    loadedAssignmentsRef.current = false;
  }, [academicYearId]);

  useEffect(() => {
    if (!schoolId || !academicYearId || loadedAssignmentsRef.current) return;
    loadedAssignmentsRef.current = true;

    let canceled = false;

    Promise.all([
      supabase.from("subject_teachers").select("section_id, subject_name, subject_code, staff_profile_id").eq("school_id", schoolId).eq("academic_year_id", academicYearId),
      supabase.from("staff_roles").select("section_id, staff_id").eq("school_id", schoolId).eq("role_type", "class_teacher").eq("academic_year_id", academicYearId),
    ]).then(async ([{ data: subjectRows }, { data: classRows }]) => {
      if (canceled) return;
      if ((!subjectRows || subjectRows.length === 0) && (!classRows || classRows.length === 0)) return;

      const allStaffIds = [
        ...(subjectRows ?? []).map((r) => r.staff_profile_id).filter(Boolean),
        ...(classRows ?? []).map((r) => r.staff_id).filter(Boolean),
      ];
      const uniqueStaffIds = [...new Set(allStaffIds)];
      const { data: staffProfiles } = uniqueStaffIds.length
        ? await supabase.from("profiles").select("id, full_name").in("id", uniqueStaffIds)
        : { data: [] };
      const staffMap = new Map((staffProfiles ?? []).map((p) => [p.id, p.full_name]));

      const updated = data.classes.map((cls) => {
        const classSubjectRows = (subjectRows ?? []).filter((r: any) => {
          const sec = cls.sections.find((s: any) => s._id === r.section_id);
          return !!sec;
        });
        const classClassRows = (classRows ?? []).filter((r: any) => {
          const sec = cls.sections.find((s: any) => s._id === r.section_id);
          return !!sec;
        });

        return {
          ...cls,
          sections: cls.sections.map((sec: any) => {
            const secSubjectRows = (subjectRows ?? []).filter((r: any) => r.section_id === sec._id);
            const secClassRow = (classRows ?? []).find((r: any) => r.section_id === sec._id);
            return {
              ...sec,
              subjectTeachers: secSubjectRows.map((r: any) => ({
                staff_profile_id: r.staff_profile_id,
                staff_name: staffMap.get(r.staff_profile_id) ?? "Unknown",
                subject_name: r.subject_name,
                subject_code: r.subject_code,
              })),
              classTeacher: secClassRow ? {
                staff_profile_id: secClassRow.staff_id,
                staff_name: staffMap.get(secClassRow.staff_id) ?? "Unknown",
              } : sec.classTeacher,
            };
          }),
        };
      });
      if (!canceled) onChange({ ...data, classes: updated as any });
    });

    return () => { canceled = true; };
  }, [schoolId, academicYearId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (data.classes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Add classes in the previous step first.
      </p>
    );
  }

  const updateSection = (
    classIdx: number,
    sectionIdx: number,
    patch: Partial<SectionDraft>,
  ) => {
    const updated = data.classes.map((cls, ci) => {
      if (ci !== classIdx) return cls;
      return {
        ...cls,
        sections: cls.sections.map((sec, si) =>
          si === sectionIdx ? { ...sec, ...patch } : sec,
        ),
      };
    });
    onChange({ ...data, classes: updated });
  };

  const copyFromSectionA = (classIdx: number, targetSectionIdx: number) => {
    const sectionA = data.classes[classIdx].sections[0];
    if (!sectionA) return;
    updateSection(classIdx, targetSectionIdx, {
      subjects: [...sectionA.subjects],
      stream: sectionA.stream,
    });
  };

  return (
    <div className="space-y-4">
      {onSave && (
        <div className="flex justify-end">
          <Button
            onClick={async () => { setSaving?.(true); try { await onSave(data); } finally { setSaving?.(false); } }}
            disabled={saving}
            className="cursor-pointer"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save Subjects</>}
          </Button>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Assign subjects section-wise. Pre-loaded subjects are selected by default —
        deselect what you don't need or add custom subjects.
      </p>

      {/* Wing filter */}
      {wingOptions.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap border rounded-lg p-3 bg-muted/20">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Wing:</span>
          {wingOptions.map((w) => (
            <Button
              key={w.id}
              type="button"
              size="sm"
              variant={wingFilter === w.id ? "default" : "outline"}
              onClick={() => setWingFilter(w.id)}
              className="text-xs h-7 cursor-pointer"
            >
              {w.name}
            </Button>
          ))}
          {hasUnassigned && (
            <Button
              type="button"
              size="sm"
              variant={wingFilter === "unassigned" ? "default" : "outline"}
              onClick={() => setWingFilter("unassigned")}
              className="text-xs h-7 cursor-pointer"
            >
              Unassigned Classes
            </Button>
          )}
        </div>
      )}

      {filteredClasses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No classes in this wing.
        </p>
      ) : filteredClasses.map((cls, ci) => {
        const category = getCategory(cls.name);
        const senior = isSenior(cls.name);
        const isOpen = openClass === ci;

        return (
          <div key={ci} className="border rounded-lg overflow-hidden">
            {/* Class header */}
            <button
              type="button"
              onClick={() => setOpenClass(isOpen ? -1 : ci)}
              className="w-full flex items-center justify-between p-4
                bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {cls.wing && (
                  <Badge variant="secondary" className="text-xs">{cls.wing}</Badge>
                )}
                <span className="font-semibold">{cls.name}</span>
                <Badge variant="outline" className="text-xs">{category}</Badge>
                <span className="text-xs text-muted-foreground">
                  {cls.sections.length} section
                  {cls.sections.length !== 1 ? "s" : ""}
                </span>
              </div>
              {isOpen
                ? <ChevronUp className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />}
            </button>

            {/* Sections */}
            {isOpen && (
              <div className="p-4 space-y-4">
                {cls.sections.map((sec, si) => (
                  <SectionSubjectPanel
                    key={si}
                    section={sec}
                    sectionIndex={si}
                    className={cls.name}
                    classAcronym={cls.acronym || deriveClassAcronym(cls.name)}
                    category={category}
                    isSenior={senior}
                    isFirstSection={si === 0}
                    onUpdate={(patch) => updateSection(ci, si, patch)}
                    onCopyFromA={() => copyFromSectionA(ci, si)}
                    staffList={staffList}
                    classId={cls._id}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section Panel ──────────────────────────────────────────────
interface SectionPanelProps {
  section: SectionDraft;
  sectionIndex: number;
  className: string;
  classAcronym: string;
  category: string;
  isSenior: boolean;
  isFirstSection: boolean;
  onUpdate: (patch: Partial<SectionDraft>) => void;
  onCopyFromA: () => void;
  staffList: { id: string; name: string; designation: string }[];
  classId?: string;
}

function SectionSubjectPanel({
  section: rawSection, sectionIndex, category, isSenior,
  isFirstSection, onUpdate, onCopyFromA, classAcronym,
  staffList, classId,
}: SectionPanelProps) {
  const [customInput, setCustomInput] = useState("");
  const [teacherDialog, setTeacherDialog] = useState<{ open: boolean; subjectName?: string; subjectCode?: string; currentTeacher?: string; currentTeacherName?: string }>({ open: false });
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");

  // Guard — ensure subjects array always exists
  const section: SectionDraft = {
    ...rawSection,
    subjects: rawSection.subjects ?? [],
    subjectTeachers: rawSection.subjectTeachers ?? [],
    classTeacher: rawSection.classTeacher,
  };

  // When stream changes for senior classes
  const handleStreamChange = (stream: string) => {
    const subjects = defaultSubjectsForStream(stream);
    onUpdate({ stream, subjects, subjectTeachers: [] });
  };

  const toggleSubject = (subjectName: string) => {
    const exists = section.subjects.find((s) => s.name === subjectName);
    if (exists) {
      onUpdate({ subjects: section.subjects.filter((s) => s.name !== subjectName) });
    } else {
      const library = SUBJECTS_BY_CATEGORY[category] ?? [];
      const found = library.find((s) => s.name === subjectName);
      onUpdate({
        subjects: [
          ...section.subjects,
          { name: subjectName, code: found?.code ?? subjectName.slice(0, 3).toUpperCase() },
        ],
      });
    }
  };

  const addCustomSubject = () => {
    const trimmed = toTitleCase(customInput.trim());
    if (!trimmed) return;
    if (section.subjects.find((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    const code = trimmed.slice(0, 3).toUpperCase() +
      String(section.subjects.length + 1).padStart(2, "0");
    onUpdate({ subjects: [...section.subjects, { name: trimmed, code }] });
    setCustomInput("");
  };

  const removeSubject = (name: string) => {
    onUpdate({ subjects: section.subjects.filter((s) => s.name !== name) });
  };

  const libraryForCategory = isSenior && section.stream
    ? SUBJECTS_BY_CATEGORY[section.stream] ?? []
    : SUBJECTS_BY_CATEGORY[category] ?? [];

  // Build the section panel JSX
  const sectionPanel = (
    <div className="border rounded-md p-3 space-y-3 bg-background">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">
            Section {section.name}
          </span>
          <Badge variant="outline" className="text-xs font-mono">
            {classAcronym}{section.acronym ? section.acronym : deriveSectionAcronym(section.name)}
          </Badge>
          {isSenior && section.stream && (
            <Badge className="text-xs">{section.stream}</Badge>
          )}
        </div>
        {!isFirstSection && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCopyFromA}
            className="text-xs h-7 gap-1"
          >
            <Copy className="h-3 w-3" />
            Copy from Section A
          </Button>
        )}
      </div>

      {/* Stream selector for Class 11-12 */}
      {isSenior && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground font-medium">
            Select Stream *
          </span>
          <Select
            value={section.stream ?? ""}
            onValueChange={handleStreamChange}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Choose stream for this section" />
            </SelectTrigger>
            <SelectContent>
              {STREAMS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Subject toggles */}
      {(!isSenior || section.stream) && (
        <>
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground font-medium">
              {isSenior ? "Stream Subjects" : "Subjects"} — click to toggle
            </span>
            <div className="flex flex-wrap gap-2">
              {libraryForCategory.map((sub) => {
                const active = !!section.subjects.find((s) => s.name === sub.name);
                return (
                  <button
                    key={sub.name}
                    type="button"
                    onClick={() => toggleSubject(sub.name)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom subjects */}
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground font-medium">
              Custom subjects
            </span>
            <div className="flex gap-2">
              <Input
                value={customInput}
                placeholder="e.g. Yoga, Music, Drawing"
                className="h-8 text-sm"
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSubject();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8"
                onClick={addCustomSubject}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Custom subjects added */}
            {section.subjects
              .filter((s) => !libraryForCategory.find((l) => l.name === s.name))
              .length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {section.subjects
                  .filter((s) => !libraryForCategory.find((l) => l.name === s.name))
                  .map((s) => (
                    <Badge key={s.name} variant="secondary" className="gap-1 text-xs">
                      {s.name}
                      <button
                        type="button"
                        onClick={() => removeSubject(s.name)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="text-xs text-muted-foreground pt-1 border-t">
            {section.subjects.length} subject
            {section.subjects.length !== 1 ? "s" : ""} assigned to Section {section.name}
          </div>

          {/* Class Teacher assignment */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Class Teacher</span>
              </div>
              <Button
                type="button" size="sm" variant="outline"
                onClick={() => setTeacherDialog({ open: true })}
                className="text-xs h-7 cursor-pointer"
              >
                {section.classTeacher ? "Replace" : "Assign"}
              </Button>
            </div>
            {section.classTeacher && (
              <div className="flex items-center gap-2 bg-primary/5 rounded px-3 py-2">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                  {section.classTeacher.staff_name?.charAt(0) ?? "?"}
                </div>
                <span className="text-sm font-medium">{section.classTeacher.staff_name}</span>
                <Button type="button" variant="ghost" size="sm" className="ml-auto h-6 text-xs"
                  onClick={() => onUpdate({ classTeacher: undefined })}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Subject Teacher assignment */}
          {section.subjects.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Subject Teachers</span>
              </div>
              {section.subjects.map((sub) => {
                const assignment = section.subjectTeachers?.find((t) => t.subject_name === sub.name);
                return (
                  <div key={sub.name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <span className="text-sm">{sub.name}</span>
                    <div className="flex items-center gap-2">
                      {assignment ? (
                        <>
                          <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
                            {assignment.staff_name}
                          </span>
                          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs"
                            onClick={() => setTeacherDialog({ open: true, subjectName: sub.name, subjectCode: sub.code, currentTeacher: assignment.staff_profile_id, currentTeacherName: assignment.staff_name })}>
                            Replace
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="h-6 text-xs"
                            onClick={() => {
                              const updated = (section.subjectTeachers ?? []).filter((t) => t.subject_name !== sub.name);
                              onUpdate({ subjectTeachers: updated });
                            }}>
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button type="button" size="sm" variant="ghost" className="text-xs h-6"
                          onClick={() => setTeacherDialog({ open: true, subjectName: sub.name, subjectCode: sub.code })}>
                          + Assign
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );

  // Teacher assignment dialog
  return (
    <>
      {sectionPanel}
      {teacherDialog.open && (
        <Dialog open onOpenChange={(v) => !v && setTeacherDialog({ open: false })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {teacherDialog.currentTeacher ? "Replace Teacher" : "Assign Teacher"}
              </DialogTitle>
              <DialogDescription>
                {teacherDialog.subjectName
                  ? `${teacherDialog.subjectName} — Section ${section.name}`
                  : `Class Teacher — Section ${section.name}`}
              </DialogDescription>
            </DialogHeader>
            {teacherDialog.currentTeacherName && (
              <div className="bg-destructive/5 border border-destructive/20 rounded p-3 text-sm">
                Current: <span className="font-medium">{teacherDialog.currentTeacherName}</span>
                <br />
                <span className="text-xs text-muted-foreground">Replacing will remove their assignment.</span>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm">Select Staff Member</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a staff member..." />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}{s.designation ? ` — ${s.designation}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setTeacherDialog({ open: false }); setSelectedTeacher(""); }} className="cursor-pointer">Cancel</Button>
              <Button
                disabled={!selectedTeacher}
                onClick={() => {
                  const selected = staffList.find((s) => s.id === selectedTeacher);
                  if (!selected) return;
                  if (teacherDialog.subjectName) {
                    const updated = [
                      ...((section.subjectTeachers ?? []).filter((t) => t.subject_name !== teacherDialog.subjectName)),
                      { staff_profile_id: selected.id, staff_name: selected.name, subject_name: teacherDialog.subjectName!, subject_code: teacherDialog.subjectCode },
                    ];
                    onUpdate({ subjectTeachers: updated });
                  } else {
                    onUpdate({ classTeacher: { staff_profile_id: selected.id, staff_name: selected.name } });
                  }
                  setTeacherDialog({ open: false });
                  setSelectedTeacher("");
                }}
                className="cursor-pointer"
              >
                Assign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}