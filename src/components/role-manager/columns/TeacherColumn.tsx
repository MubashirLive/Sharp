import { useState, useEffect } from "react";
import { Loader2, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  assignSubjectTeacher,
  removeSubjectTeacher,
  getSubjectTeacherConflict,
  autoCreateWingMembership,
  type StaffRole,
} from "@/integrations/supabase/queries/roleManager";

interface TeacherColumnProps {
  staffId: string;
  schoolId: string;
  subjectTeachers: StaffRole[];
  isReadOnly: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSaved: () => Promise<void>;
}

export function TeacherColumn({
  staffId,
  schoolId,
  subjectTeachers,
  isReadOnly,
  isEditing,
  onToggleEdit,
  onSaved,
}: TeacherColumnProps) {
  const [allClasses, setAllClasses] = useState<{ id: string; name: string }[]>([]);
  const [allSections, setAllSections] = useState<{ id: string; name: string; class_id: string }[]>([]);
  const [allSubjects, setAllSubjects] = useState<{ id: string; name: string; class_id?: string }[]>([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [stagedItems, setStagedItems] = useState<
    { classId: string; sectionId: string; subjectId: string; name: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [conflictDialog, setConflictDialog] = useState(false);
  const [conflictWith, setConflictWith] = useState<{ id: string; full_name: string } | null>(null);
  const [pendingAssignment, setPendingAssignment] = useState<{
    classId: string;
    sectionId: string;
    subjectId: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("classes").select("id, name").eq("school_id", schoolId).order("display_order"),
      supabase.from("sections").select("id, name, class_id").eq("school_id", schoolId).order("name"),
      supabase.from("subjects").select("id, name, class_id").eq("school_id", schoolId).order("name"),
    ]).then(([cRes, sRes, subRes]) => {
      setAllClasses(cRes.data ?? []);
      setAllSections(sRes.data ?? []);
      setAllSubjects(subRes.data ?? []);
    });
  }, [schoolId]);

  const sectionsForClass = allSections.filter((s) => s.class_id === selectedClass);

  // Subjects for section — try section_subjects first, fallback to subjects
  const subjectsForSection = allSubjects.filter(
    (s) => !s.class_id || s.class_id === selectedClass
  );

  const stagedNames = stagedItems.map((i) => i.name);

  const handleAdd = async () => {
    if (!selectedClass || !selectedSection || !selectedSubject) return;

    const cls = allClasses.find((c) => c.id === selectedClass);
    const sec = allSections.find((s) => s.id === selectedSection);
    const sub = allSubjects.find((s) => s.id === selectedSubject);
    if (!cls || !sec || !sub) return;

    const name = `${cls.name} ${sec.name} ${sub.name}`;

    // Conflict check
    const conflict = await getSubjectTeacherConflict(selectedClass, selectedSection, selectedSubject, schoolId);
    if (conflict && conflict.id !== staffId) {
      setConflictWith(conflict);
      setPendingAssignment({ classId: selectedClass, sectionId: selectedSection, subjectId: selectedSubject, name });
      setConflictDialog(true);
      return;
    }

    addToStaged(selectedClass, selectedSection, selectedSubject, name);
  };

  const addToStaged = (classId: string, sectionId: string, subjectId: string, name: string) => {
    if (stagedNames.includes(name)) return;
    setStagedItems((prev) => [...prev, { classId, sectionId, subjectId, name }]);
    setSelectedSubject("");
  };

  const handleRemove = (name: string) => {
    setStagedItems((prev) => prev.filter((i) => i.name !== name));
  };

  const handleSave = async () => {
    setSaving(true);

    // Remove old assignments not in staged
    for (const existing of subjectTeachers) {
      const name = getExistingName(existing);
      if (!stagedNames.includes(name)) {
        await removeSubjectTeacher(staffId, existing.class_id, existing.section_id, existing.subject_id ?? "", schoolId);
      }
    }

    // Add new staged assignments
    const userId = (await supabase.auth.getUser()).data.user?.id ?? "";
    for (const item of stagedItems) {
      const existing = subjectTeachers.find(
        (st) =>
          st.class_id === item.classId &&
          st.section_id === item.sectionId &&
          st.subject_id === item.subjectId
      );
      if (existing) continue;

      const result = await assignSubjectTeacher(
        staffId,
        item.classId,
        item.sectionId,
        item.subjectId,
        schoolId,
        userId
      );

      if (result.success) {
        const { data: role } = await supabase
          .from("staff_roles")
          .select("id")
          .eq("staff_id", staffId)
          .eq("class_id", item.classId)
          .eq("section_id", item.sectionId)
          .eq("subject_id", item.subjectId)
          .eq("role_type", "subject_teacher")
          .single();

        if (role) {
          await autoCreateWingMembership(staffId, item.classId, "subject_teacher", role.id);
        }
      }
    }

    setSaving(false);
    setStagedItems([]);
    onToggleEdit();
    await onSaved();
  };

  const getExistingName = (st: StaffRole) => {
    const cls = allClasses.find((c) => c.id === st.class_id);
    const sec = allSections.find((s) => s.id === st.section_id);
    const sub = allSubjects.find((s) => s.id === st.subject_id);
    return `${cls?.name ?? "—"} ${sec?.name ?? "—"} ${sub?.name ?? "—"}`;
  };

  const displayItems = subjectTeachers.map((st) => ({
    classId: st.class_id,
    sectionId: st.section_id,
    subjectId: st.subject_id ?? "",
    name: getExistingName(st),
  }));

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Teacher</span>
        {!isReadOnly && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onToggleEdit}>
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {displayItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">No subjects assigned</p>
        ) : (
          displayItems.map((item) => (
            <div key={item.name} className="flex items-center gap-1">
              <span className="text-xs flex-1">{item.name}</span>
              {isEditing && (
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(item.name)}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {isEditing && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Class" />
              </SelectTrigger>
              <SelectContent>
                {allClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Section" />
              </SelectTrigger>
              <SelectContent>
                {sectionsForClass.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedSubject}
              onValueChange={setSelectedSubject}
              disabled={!selectedSection}
            >
              <SelectTrigger className="h-7 text-xs flex-1">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectsForSection.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleAdd}
              disabled={!selectedClass || !selectedSection || !selectedSubject}
            >
              Add
            </Button>
          </div>

          {stagedItems.length > 0 && (
            <div className="space-y-1">
              {stagedItems.map((item) => (
                <div key={item.name} className="flex items-center gap-1">
                  <span className="text-xs text-purple-600 flex-1">{item.name}</span>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(item.name)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button size="sm" className="w-full h-7 text-xs" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Save
          </Button>
        </div>
      )}

      <Dialog open={conflictDialog} onOpenChange={setConflictDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Subject Already Assigned
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This subject is already assigned to <strong>{conflictWith?.full_name ?? "someone else"}</strong>.
            Reassign to this staff member? The previous teacher will lose the subject assignment.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pendingAssignment) {
                  addToStaged(
                    pendingAssignment.classId,
                    pendingAssignment.sectionId,
                    pendingAssignment.subjectId,
                    pendingAssignment.name
                  );
                }
                setConflictDialog(false);
              }}
            >
              Confirm & Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}