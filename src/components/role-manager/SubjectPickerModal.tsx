// SubjectPickerModal — Role Manager Staff Tab §3.1.2(f)
//
// 3 cascading dropdowns (Class → Section → Subject) for picking a
// class-section-subject to assign to the staff being edited.
//
// 2026-06-13 rewrite: previous version was a flat 156-row list with a broken
// select (queried non-existent columns / embedded relations). New version
// uses real `section_subjects.subject_name` as the source of truth for the
// subject name. `staff_roles.subject_id` has no FK to `subjects` — verified
// via `information_schema.table_constraints` — so the read path in
// `roleAssignments.ts` also uses `section_subjects` for display.
//
// onPick passes (subjectId, classId, sectionId, subjectName, className,
// sectionName) so the consumer can build a label without an `existing` lookup
// (which was the source of the "Class 9 - ?" bug for new drafts).
//
// See docs/ROLE_MANAGER.md §3.1.2(f) and §2026-06-13 Patch for full context.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubjectAssignment {
  id: string;
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  label: string;
}

interface SubjectPickerModalProps {
  open: boolean;
  schoolId: string;
  onClose: () => void;
  onPick: (subjectId: string, classId: string, sectionId: string, subjectName: string, className: string, sectionName: string) => void;
  excludeStaffId?: string;
}

export function SubjectPickerModal({ open, schoolId, onClose, onPick, excludeStaffId }: SubjectPickerModalProps) {
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<SubjectAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  const [allClasses, setAllClasses] = useState<Array<{ id: string; name: string; display_order: number }>>([]);
  const [existingAssignments, setExistingAssignments] = useState<Array<{ id: string; subject_id: string; class_id: string; section_id: string }>>([]);

  useEffect(() => {
    if (!open || !schoolId) return;
    const load = async () => {
      setLoading(true);
      setSelectedClass("");
      setSections([]);
      setSelectedSection("");
      setSubjects([]);
      setSelectedSubject("");
      setSelectedAssignment(null);

      try {
        // Get current academic session
        const { data: sessionData } = await supabase
          .from("academic_sessions")
          .select("id")
          .eq("school_id", schoolId)
          .eq("is_current", true)
          .maybeSingle();

        if (!sessionData) {
          toast.error("No active academic session");
          return;
        }

        // Get classes for school
        const { data: classesData, error: classesError } = await supabase
          .from("classes")
          .select("id, name, display_order")
          .eq("school_id", schoolId)
          .eq("session_id", sessionData.id)
          .order("display_order");

        if (classesError) {
          toast.error(classesError.message);
          return;
        }
        setAllClasses(classesData ?? []);

        // Get existing assignments to show current teacher
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("staff_roles")
          .select("id, subject_id, class_id, section_id, staff:profiles(full_name)")
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

  useEffect(() => {
    if (!selectedClass || !schoolId) return;
    const loadSections = async () => {
      setSelectedSection("");
      setSubjects([]);
      setSelectedSubject("");
      setSelectedAssignment(null);

      const sessionData = await supabase
        .from("academic_sessions")
        .select("id")
        .eq("school_id", schoolId)
        .eq("is_current", true)
        .maybeSingle();

      if (!sessionData) return;

      const { data: sectionsData, error } = await supabase
        .from("sections")
        .select("id, name, display_order")
        .eq("school_id", schoolId)
        .eq("session_id", sessionData.id)
        .eq("class_id", selectedClass)
        .order("display_order");

      if (error) {
        toast.error(error.message);
        return;
      }
      setSections(sectionsData ?? []);
    };
    loadSections();
  }, [selectedClass, schoolId]);

  useEffect(() => {
    if (!selectedSection || !schoolId) return;
    const loadSubjects = async () => {
      setSelectedSubject("");
      setSelectedAssignment(null);

      const sessionData = await supabase
        .from("academic_sessions")
        .select("id")
        .eq("school_id", schoolId)
        .eq("is_current", true)
        .maybeSingle();

      if (!sessionData) return;

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
      setSubjects(subjectsData ?? []);
    };
    loadSubjects();
  }, [selectedSection, schoolId]);

  useEffect(() => {
    if (!selectedSubject || !selectedSection || !selectedClass || !schoolId) return;

    // Find the subject assignment
    const subject = subjects.find(s => s.id === selectedSubject);
    const section = sections.find(s => s.id === selectedSection);
    const class_ = allClasses.find(c => c.id === selectedClass);

    if (!subject || !section || !class_) return;

    // Find the currently assigned teacher for this class-section-subject
    const existingAssignment = existingAssignments.find(
      a => a.class_id === selectedClass && a.section_id === selectedSection && a.subject_id === selectedSubject
    );

    const label = `${class_.name} ${section.name} — ${subject.name}`;

    setSelectedAssignment({
      id: `new-${Date.now()}`,
      subjectId: selectedSubject,
      subjectName: subject.name,
      classId: selectedClass,
      className: class_.name,
      sectionId: selectedSection,
      sectionName: section.name,
      label
    });
  }, [selectedSubject, selectedSection, selectedClass, subjects, sections, allClasses, existingAssignments, schoolId]);

  const handleAddAssignment = () => {
    if (!selectedAssignment) return;

    // Check if already added in this session
    const alreadyExists = selectedAssignment.subjectId &&
      existingAssignments.some(
        a => a.class_id === selectedAssignment.classId &&
             a.section_id === selectedAssignment.sectionId &&
             a.subject_id === selectedAssignment.subjectId
      );

    if (alreadyExists) {
      toast.error("This assignment already exists");
      return;
    }

    onPick(
      selectedAssignment.subjectId,
      selectedAssignment.classId,
      selectedAssignment.sectionId,
      selectedAssignment.subjectName,
      selectedAssignment.className,
      selectedAssignment.sectionName
    );
  };

  const isAddDisabled = !selectedAssignment;
  const alreadyAdded = selectedAssignment && existingAssignments.some(
    a => a.class_id === selectedAssignment.classId &&
         a.section_id === selectedAssignment.sectionId &&
         a.subject_id === selectedAssignment.subjectId
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Subject Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Class selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">Class</label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {allClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Section selection (only if class selected) */}
          {selectedClass && sections.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Section</label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject selection (only if section selected) */}
          {selectedSection && subjects.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => {
                    const assigned = existingAssignments.find(
                      a => a.class_id === selectedClass &&
                           a.section_id === selectedSection &&
                           a.subject_id === s.id
                    );
                    return (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{s.name}</span>
                          {assigned && (
                            <Badge variant="secondary" className="text-xs ml-2">
                              {assigned.staff?.full_name}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected assignment preview */}
          {selectedAssignment && (
            <div className="border rounded-lg p-3 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Selected Assignment</span>
                {alreadyAdded && (
                  <Badge variant="secondary" className="text-xs">
                    Already assigned
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm">{selectedAssignment.label}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedClass("");
                    setSections([]);
                    setSelectedSection("");
                    setSubjects([]);
                    setSelectedSubject("");
                    setSelectedAssignment(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Already added assignments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Assignments</span>
              <span className="text-xs text-muted-foreground">
                {existingAssignments.length} assigned
              </span>
            </div>
            {existingAssignments.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No subject assignments yet
              </p>
            )}
            {existingAssignments.slice(0, 3).map((a) => {
              const class_ = allClasses.find(c => c.id === a.class_id);
              const section = sections.find(s => s.id === a.section_id);
              const subject = subjects.find(s => s.id === a.subject_id);
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-2 border rounded bg-background"
                >
                  <span className="text-xs">
                    {class_?.name} {section?.name} — {subject?.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {a.staff?.full_name}
                  </Badge>
                </div>
              );
            })}
            {existingAssignments.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{existingAssignments.length - 3} more assignments
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleAddAssignment}
            disabled={isAddDisabled || loading}
            size="sm"
          >
            {loading ? "Adding..." : "Add Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
