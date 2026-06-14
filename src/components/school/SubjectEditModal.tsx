import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AssignedSubject,
  SUBJECTS_BY_CATEGORY,
  STREAMS,
  StreamType,
  getCategoryForClass,
  isSeniorClass,
  generateSubjectCode,
} from "@/data/subjects";
import { CustomSubjectInput } from "./CustomSubjectInput";
import { toast } from "sonner";
import { toTitleCase } from "@/lib/text-utils";

interface SubjectEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className: string;
  sectionId: string;
  sectionName: string;
  subjects: AssignedSubject[];
  sectionASubjects: AssignedSubject[];
  onSave: (sectionId: string, subjects: AssignedSubject[], stream?: string) => void;
}

export function SubjectEditModal({
  open,
  onOpenChange,
  className,
  sectionId,
  sectionName,
  subjects: initialSubjects,
  sectionASubjects,
  onSave,
}: SubjectEditModalProps) {
  const [localSubjects, setLocalSubjects] = useState<AssignedSubject[]>([]);
  const [selectedAvailable, setSelectedAvailable] = useState<string[]>([]);
  const [stream, setStream] = useState<StreamType | "">("");
  const [copyFromA, setCopyFromA] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setLocalSubjects([...initialSubjects]);
      setSelectedAvailable([]);
      setCopyFromA(false);
    }
  }, [open, initialSubjects]);

  // Get available subjects based on class level and stream
  const availableSubjects = useMemo(() => {
    const category = getCategoryForClass(className);

    if (isSeniorClass(className) && stream) {
      return SUBJECTS_BY_CATEGORY[stream] || [];
    }

    // For non-senior, use category
    if (category === "senior") {
      // For senior without stream, show all
      const all: AssignedSubject[] = [];
      STREAMS.forEach((s) => {
        const subs = SUBJECTS_BY_CATEGORY[s.value] || [];
        subs.forEach((sub) => {
          all.push({ name: sub.name, code: sub.code });
        });
      });
      return [...new Map(all.map((s) => [s.name, s])).values()];
    }

    return SUBJECTS_BY_CATEGORY[category] || SUBJECTS_BY_CATEGORY.middle;
  }, [className, stream]);

  // Filter out already assigned subjects
  const unassignedSubjects = useMemo(() => {
    const assignedNames = new Set(localSubjects.map((s) => s.name));
    return availableSubjects.filter((s) => !assignedNames.has(s.name));
  }, [availableSubjects, localSubjects]);

  const handleToggleAvailable = (name: string) => {
    if (selectedAvailable.includes(name)) {
      setSelectedAvailable(selectedAvailable.filter((n) => n !== name));
    } else {
      setSelectedAvailable([...selectedAvailable, name]);
    }
  };

  const handleAssign = () => {
    const toAssign = availableSubjects
      .filter((s) => selectedAvailable.includes(s.name))
      .map((s) => ({ name: s.name, code: s.code }));

    // Dedupe
    const existingNames = new Set(localSubjects.map((s) => s.name));
    const unique = toAssign.filter((s) => !existingNames.has(s.name));

    setLocalSubjects([...localSubjects, ...unique]);
    setSelectedAvailable([]);
  };

  const handleRemove = (name: string) => {
    setLocalSubjects(localSubjects.filter((s) => s.name !== name));
  };

  const handleCopyFromA = (checked: boolean) => {
    setCopyFromA(checked);
    if (checked) {
      setLocalSubjects([...sectionASubjects]);
    }
  };

  const handleAddCustom = (name: string, code: string) => {
    // Normalize to title case
    const normalizedName = toTitleCase(name);
    // Check if already exists
    if (localSubjects.some((s) => s.name.toLowerCase() === normalizedName.toLowerCase())) {
      toast.error("Subject already exists");
      return;
    }
    setLocalSubjects([...localSubjects, { name: normalizedName, code, isCustom: true }]);
  };

  const handleSave = () => {
    onSave(sectionId, localSubjects, stream || undefined);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {className} — {sectionName}
            </span>
          </DialogTitle>
          {/* Copy from A checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <Checkbox
              id="copy-from-a"
              checked={copyFromA}
              onCheckedChange={(checked) => handleCopyFromA(checked === true)}
            />
            <Label htmlFor="copy-from-a" className="text-sm cursor-pointer">
              Copy from Section A
            </Label>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Assigned subjects */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Assigned Subjects ({localSubjects.length})
            </Label>
            {localSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-muted/30">
                No subjects assigned. Select from available below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 min-h-[60px]">
                {localSubjects.map((subject) => (
                  <Badge
                    key={subject.name}
                    variant="default"
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs"
                  >
                    <span>{subject.name}</span>
                    <button
                      onClick={() => handleRemove(subject.name)}
                      className="hover:bg-primary-foreground/20 rounded p-0.5 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Available subjects */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Available ({unassignedSubjects.length})
            </Label>
            {unassignedSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                All subjects assigned
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {unassignedSubjects.map((subject) => {
                  const isSelected = selectedAvailable.includes(subject.name);
                  return (
                    <button
                      key={subject.name}
                      onClick={() => handleToggleAvailable(subject.name)}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-md text-xs border text-left transition-all
                        ${isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                        }
                      `}
                    >
                      <div className={`
                        w-4 h-4 rounded border flex items-center justify-center
                        ${isSelected ? "bg-primary-foreground/20 border-primary-foreground/30" : "border-muted-foreground/50"}
                      `}>
                        {isSelected && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span>{subject.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Assign button */}
            {selectedAvailable.length > 0 && (
              <Button onClick={handleAssign} size="sm" className="w-full mt-2">
                Assign {selectedAvailable.length} Subject{selectedAvailable.length !== 1 ? "s" : ""}
              </Button>
            )}
          </div>

          {/* Custom subject */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Add Custom Subject</Label>
            <CustomSubjectInput
              onAdd={handleAddCustom}
              existingCustomNames={[
                ...availableSubjects.map((s) => s.name),
                ...localSubjects.map((s) => s.name),
              ]}
            />
          </div>

          {/* Stream selector for senior classes */}
          {isSeniorClass(className) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Stream</Label>
              <Select value={stream} onValueChange={(v) => setStream(v as StreamType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {STREAMS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}