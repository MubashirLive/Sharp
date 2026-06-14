import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  saveCoordinatorAssignment,
  type CoordinatorAssignment,
  type CoordinatorWing,
  type CoordinatorClass,
} from "@/integrations/supabase/queries/roleManager";

interface CoordinatorColumnProps {
  staffId: string;
  schoolId: string;
  coordinator: {
    assignment: CoordinatorAssignment | null;
    wings: CoordinatorWing[];
    classes: CoordinatorClass[];
  } | null;
  isReadOnly: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSaved: () => Promise<void>;
}

export function CoordinatorColumn({
  staffId,
  schoolId,
  coordinator,
  isReadOnly,
  isEditing,
  onToggleEdit,
  onSaved,
}: CoordinatorColumnProps) {
  const [mode, setMode] = useState<"wingwise" | "classwise">(
    coordinator?.assignment?.mode ?? "wingwise"
  );
  const [selectedWings, setSelectedWings] = useState<Set<string>>(
    new Set(coordinator?.wings.map((w) => w.wing_id) ?? [])
  );
  const [selectedClasses, setSelectedClasses] = useState<
    { classId: string; sectionId: string }[]
  >(coordinator?.classes.map((c) => ({ classId: c.class_id, sectionId: c.section_id })) ?? []);

  const [allWings, setAllWings] = useState<{ id: string; name: string }[]>([]);
  const [allClasses, setAllClasses] = useState<{ id: string; name: string }[]>([]);
  const [allSections, setAllSections] = useState<{ id: string; name: string; class_id: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [modeSwitchDialog, setModeSwitchDialog] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      supabase.from("wings").select("id, name").eq("school_id", schoolId).order("name"),
      supabase.from("classes").select("id, name").eq("school_id", schoolId).order("display_order"),
      supabase.from("sections").select("id, name, class_id").eq("school_id", schoolId).order("name"),
    ]).then(([wingsRes, classesRes, sectionsRes]) => {
      setAllWings(wingsRes.data ?? []);
      setAllClasses(classesRes.data ?? []);
      setAllSections(sectionsRes.data ?? []);
      setLoadingData(false);
    });
  }, [schoolId]);

  const handleWingToggle = (wingId: string) => {
    setSelectedWings((prev) => {
      const next = new Set(prev);
      if (next.has(wingId)) next.delete(wingId);
      else next.add(wingId);
      return next;
    });
  };

  const handleClassToggle = (classId: string, sectionId: string) => {
    setSelectedClasses((prev) => {
      const exists = prev.find((c) => c.classId === classId && c.sectionId === sectionId);
      if (exists) return prev.filter((c) => !(c.classId === classId && c.sectionId === sectionId));
      return [...prev, { classId, sectionId }];
    });
  };

  const handleSave = async () => {
    setSaving(true);
    await saveCoordinatorAssignment(
      staffId,
      schoolId,
      mode,
      [...selectedWings],
      selectedClasses
    );
    setSaving(false);
    onToggleEdit();
    await onSaved();
  };

  const displayTargets = () => {
    if (!coordinator?.assignment) return "Not assigned";

    if (coordinator.assignment.mode === "wingwise") {
      const wingNames = coordinator.wings
        .map((w) => allWings.find((wing) => wing.id === w.wing_id)?.name ?? "—")
        .filter(Boolean);
      return wingNames.length ? wingNames.join(", ") : "No wings";
    } else {
      const classNames = coordinator.classes
        .map((c) => {
          const cls = allClasses.find((cl) => cl.id === c.class_id);
          const sec = allSections.find((s) => s.id === c.section_id);
          return cls && sec ? `${cls.name} ${sec.name}` : null;
        })
        .filter(Boolean);
      return classNames.length ? classNames.join(", ") : "No classes";
    }
  };

  const getModeLabel = () => {
    if (!coordinator?.assignment) return "Not assigned";
    return coordinator.assignment.mode === "wingwise" ? "Wingwise" : "Classwise";
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Coordinator</span>
        {!isReadOnly && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onToggleEdit}>
            {isEditing ? "Cancel" : "Edit"}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{getModeLabel()}</p>
      <p className="text-xs text-muted-foreground mt-1">{displayTargets()}</p>

      {isEditing && (
        <div className="mt-3 space-y-3">
          {/* Mode Selector */}
          <div>
            <Label className="text-xs mb-1 block">Mode</Label>
            <RadioGroup
              value={mode}
              onValueChange={(val) => {
                if (val !== mode && (selectedWings.size > 0 || selectedClasses.length > 0)) {
                  setModeSwitchDialog(true);
                }
                setMode(val as "wingwise" | "classwise");
              }}
              className="flex gap-3"
            >
              <div className="flex items-center gap-1">
                <RadioGroupItem value="wingwise" id="wingwise" />
                <Label htmlFor="wingwise" className="text-xs">Wingwise</Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="classwise" id="classwise" />
                <Label htmlFor="classwise" className="text-xs">Classwise</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Wing Picker */}
          {mode === "wingwise" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                  Select wings...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                {allWings.map((w) => (
                  <DropdownMenuCheckboxItem
                    key={w.id}
                    checked={selectedWings.has(w.id)}
                    onCheckedChange={() => handleWingToggle(w.id)}
                  >
                    {w.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Class Picker */}
          {mode === "classwise" && (
            <div className="space-y-1">
              {allClasses.map((cls) => {
                const clsSections = allSections.filter((s) => s.class_id === cls.id);
                if (!clsSections.length) return null;
                return (
                  <div key={cls.id}>
                    <p className="text-xs font-medium mb-1">{cls.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {clsSections.map((sec) => (
                        <Button
                          key={sec.id}
                          size="sm"
                          variant={
                            selectedClasses.some(
                              (c) => c.classId === cls.id && c.sectionId === sec.id
                            )
                              ? "default"
                              : "outline"
                          }
                          className="h-6 text-xs px-2"
                          onClick={() => handleClassToggle(cls.id, sec.id)}
                        >
                          {sec.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <Button size="sm" className="w-full h-7 text-xs" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Save
          </Button>
        </div>
      )}

      <Dialog open={modeSwitchDialog} onOpenChange={setModeSwitchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Switching Coordinator Mode
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Switching to "{mode === "wingwise" ? "Classwise" : "Wingwise"}" will permanently remove
            all existing {mode === "wingwise" ? "wing" : "class"} assignments. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModeSwitchDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (mode === "wingwise") setSelectedClasses([]);
                else setSelectedWings(new Set());
                setModeSwitchDialog(false);
              }}
            >
              Confirm & Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}