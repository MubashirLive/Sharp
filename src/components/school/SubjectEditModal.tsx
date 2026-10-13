import { useState, useEffect, useMemo } from "react";
import { X, BookOpen, Sparkles } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AssignedSubject,
  SUBJECTS_BY_CATEGORY,
  NON_ACADEMIC_SUBJECTS,
  isNonAcademicSubject,
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
  const [activeTab, setActiveTab] = useState<"academic" | "non-academic">("academic");
  const [selectedAcademic, setSelectedAcademic] = useState<string[]>([]);
  const [selectedNonAcademic, setSelectedNonAcademic] = useState<string[]>([]);
  const [stream, setStream] = useState<StreamType | "">("");
  const [copyFromA, setCopyFromA] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setLocalSubjects([...initialSubjects]);
      setSelectedAcademic([]);
      setSelectedNonAcademic([]);
      setCopyFromA(false);
      setActiveTab("academic");
    }
  }, [open, initialSubjects]);

  // Get available academic subjects based on class level and stream
  const availableAcademicSubjects = useMemo(() => {
    const category = getCategoryForClass(className);

    if (isSeniorClass(className) && stream) {
      return SUBJECTS_BY_CATEGORY[stream] || [];
    }

    // For non-senior, use category
    if (category === "senior") {
      // For senior without stream, show all
      const all: { name: string; code: string }[] = [];
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

  // Filter out already assigned academic subjects
  const unassignedAcademicSubjects = useMemo(() => {
    const assignedNames = new Set(localSubjects.map((s) => s.name.toLowerCase()));
    return availableAcademicSubjects.filter((s) => !assignedNames.has(s.name.toLowerCase()));
  }, [availableAcademicSubjects, localSubjects]);

  // Filter out already assigned non-academic subjects
  const unassignedNonAcademicSubjects = useMemo(() => {
    const assignedNames = new Set(localSubjects.map((s) => s.name.toLowerCase()));
    return NON_ACADEMIC_SUBJECTS.filter((s) => !assignedNames.has(s.name.toLowerCase()));
  }, [localSubjects]);

  // Toggle selection for available academic subjects
  const handleToggleAcademic = (name: string) => {
    if (selectedAcademic.includes(name)) {
      setSelectedAcademic(selectedAcademic.filter((n) => n !== name));
    } else {
      setSelectedAcademic([...selectedAcademic, name]);
    }
  };

  // Toggle selection for available non-academic subjects
  const handleToggleNonAcademic = (name: string) => {
    if (selectedNonAcademic.includes(name)) {
      setSelectedNonAcademic(selectedNonAcademic.filter((n) => n !== name));
    } else {
      setSelectedNonAcademic([...selectedNonAcademic, name]);
    }
  };

  // Assign selected academic subjects
  const handleAssignAcademic = () => {
    const toAssign = availableAcademicSubjects
      .filter((s) => selectedAcademic.includes(s.name))
      .map((s) => ({ name: s.name, code: s.code, isNonAcademic: false }));

    const existingNames = new Set(localSubjects.map((s) => s.name.toLowerCase()));
    const unique = toAssign.filter((s) => !existingNames.has(s.name.toLowerCase()));

    setLocalSubjects([...localSubjects, ...unique]);
    setSelectedAcademic([]);
  };

  // Assign selected non-academic subjects
  const handleAssignNonAcademic = () => {
    const toAssign = NON_ACADEMIC_SUBJECTS
      .filter((s) => selectedNonAcademic.includes(s.name))
      .map((s) => ({ name: s.name, code: s.code, isNonAcademic: true }));

    const existingNames = new Set(localSubjects.map((s) => s.name.toLowerCase()));
    const unique = toAssign.filter((s) => !existingNames.has(s.name.toLowerCase()));

    setLocalSubjects([...localSubjects, ...unique]);
    setSelectedNonAcademic([]);
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

  const handleAddCustomAcademic = (name: string, code: string) => {
    const normalizedName = toTitleCase(name);
    if (localSubjects.some((s) => s.name.toLowerCase() === normalizedName.toLowerCase())) {
      toast.error("Subject already exists");
      return;
    }
    setLocalSubjects([
      ...localSubjects,
      { name: normalizedName, code, isCustom: true, isNonAcademic: false },
    ]);
  };

  const handleAddCustomNonAcademic = (name: string, code: string) => {
    const normalizedName = toTitleCase(name);
    if (localSubjects.some((s) => s.name.toLowerCase() === normalizedName.toLowerCase())) {
      toast.error("Subject already exists");
      return;
    }
    setLocalSubjects([
      ...localSubjects,
      { name: normalizedName, code, isCustom: true, isNonAcademic: true },
    ]);
  };

  const handleSave = () => {
    onSave(sectionId, localSubjects, stream || undefined);
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  // Assigned counts
  const academicCount = localSubjects.filter((s) => !isNonAcademicSubject(s)).length;
  const nonAcademicCount = localSubjects.filter((s) => isNonAcademicSubject(s)).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Assigned Subjects ({localSubjects.length})
              </Label>
              {localSubjects.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {academicCount} Academic • {nonAcademicCount} Non-Academic
                </span>
              )}
            </div>
            {localSubjects.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-muted/30">
                No subjects assigned. Select from available below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 min-h-[60px]">
                {localSubjects.map((subject) => {
                  const isNonAcad = isNonAcademicSubject(subject);
                  return isNonAcad ? (
                    <Badge
                      key={subject.name}
                      variant="outline"
                      className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 text-xs border-emerald-500/30 text-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{subject.name}</span>
                      <button
                        onClick={() => handleRemove(subject.name)}
                        className="hover:bg-emerald-200/50 dark:hover:bg-emerald-900/50 rounded p-0.5 transition-colors ml-0.5"
                        aria-label={`Remove ${subject.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : (
                    <Badge
                      key={subject.name}
                      variant="default"
                      className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs"
                    >
                      <span>{subject.name}</span>
                      <button
                        onClick={() => handleRemove(subject.name)}
                        className="hover:bg-primary-foreground/20 rounded p-0.5 transition-colors"
                        aria-label={`Remove ${subject.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tabbed Subject Selector: Academic vs Non-Academic */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "academic" | "non-academic")}
            className="w-full space-y-3"
          >
            <TabsList className="grid grid-cols-2 w-full h-10">
              <TabsTrigger value="academic" className="flex items-center gap-2 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Academic</span>
                {unassignedAcademicSubjects.length > 0 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full">
                    {unassignedAcademicSubjects.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="non-academic" className="flex items-center gap-2 text-xs">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                <span>Non-Academic</span>
                {unassignedNonAcademicSubjects.length > 0 && (
                  <span className="text-[10px] bg-muted px-1.5 py-0.2 rounded-full">
                    {unassignedNonAcademicSubjects.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ACADEMIC TAB */}
            <TabsContent value="academic" className="space-y-4 mt-0">
              {/* Stream selector for senior classes */}
              {isSeniorClass(className) && (
                <div className="space-y-1.5 p-3 rounded-md bg-muted/20 border">
                  <Label className="text-xs font-medium">Stream (Class 11–12)</Label>
                  <Select value={stream} onValueChange={(v) => setStream(v as StreamType)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select stream (Science, Commerce, Arts, Bifocal)" />
                    </SelectTrigger>
                    <SelectContent>
                      {STREAMS.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Available academic subjects */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Available Academic ({unassignedAcademicSubjects.length})
                </Label>
                {unassignedAcademicSubjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center border rounded-md border-dashed">
                    All academic subjects assigned
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
                    {unassignedAcademicSubjects.map((subject) => {
                      const isSelected = selectedAcademic.includes(subject.name);
                      return (
                        <button
                          key={subject.name}
                          onClick={() => handleToggleAcademic(subject.name)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-md text-xs border text-left transition-all
                            ${isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:bg-muted"
                            }
                          `}
                        >
                          <div className={`
                            w-4 h-4 rounded border flex items-center justify-center shrink-0
                            ${isSelected ? "bg-primary-foreground/20 border-primary-foreground/30" : "border-muted-foreground/50"}
                          `}>
                            {isSelected && (
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="truncate">{subject.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Assign button */}
                {selectedAcademic.length > 0 && (
                  <Button onClick={handleAssignAcademic} size="sm" className="w-full mt-2">
                    Assign {selectedAcademic.length} Academic Subject{selectedAcademic.length !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>

              {/* Custom academic subject */}
              <div className="space-y-2 pt-1 border-t">
                <Label className="text-xs font-medium text-muted-foreground">Add Custom Academic Subject</Label>
                <CustomSubjectInput
                  onAdd={handleAddCustomAcademic}
                  placeholder="Academic subject name"
                  buttonLabel="Add Custom Academic Subject"
                  existingCustomNames={[
                    ...availableAcademicSubjects.map((s) => s.name),
                    ...localSubjects.map((s) => s.name),
                  ]}
                />
              </div>
            </TabsContent>

            {/* NON-ACADEMIC TAB */}
            <TabsContent value="non-academic" className="space-y-4 mt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Available Activities & Lectures ({unassignedNonAcademicSubjects.length})
                  </Label>
                  <span className="text-[11px] text-muted-foreground">Sports, Arts, Mess & Routine</span>
                </div>
                {unassignedNonAcademicSubjects.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2 text-center border rounded-md border-dashed">
                    All predefined non-academic subjects assigned
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1">
                    {unassignedNonAcademicSubjects.map((subject) => {
                      const isSelected = selectedNonAcademic.includes(subject.name);
                      return (
                        <button
                          key={subject.name}
                          onClick={() => handleToggleNonAcademic(subject.name)}
                          className={`
                            flex items-center gap-2 px-3 py-2 rounded-md text-xs border text-left transition-all
                            ${isSelected
                              ? "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700"
                              : "bg-background border-border hover:bg-emerald-50/50 hover:border-emerald-200 dark:hover:bg-emerald-950/20"
                            }
                          `}
                        >
                          <div className={`
                            w-4 h-4 rounded border flex items-center justify-center shrink-0
                            ${isSelected ? "bg-white/20 border-white/40" : "border-muted-foreground/50"}
                          `}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className="truncate">{subject.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Assign button */}
                {selectedNonAcademic.length > 0 && (
                  <Button
                    onClick={handleAssignNonAcademic}
                    size="sm"
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Assign {selectedNonAcademic.length} Non-Academic Subject{selectedNonAcademic.length !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>

              {/* Custom non-academic subject */}
              <div className="space-y-2 pt-1 border-t">
                <Label className="text-xs font-medium text-muted-foreground">Add Custom Non-Academic Subject / Lecture</Label>
                <CustomSubjectInput
                  onAdd={handleAddCustomNonAcademic}
                  codePrefix="NA_"
                  placeholder="e.g. Robotics, Pottery, Breakfast, Zero Period..."
                  buttonLabel="Add Custom Non-Academic Lecture"
                  existingCustomNames={[
                    ...NON_ACADEMIC_SUBJECTS.map((s) => s.name),
                    ...localSubjects.map((s) => s.name),
                  ]}
                />
              </div>
            </TabsContent>
          </Tabs>
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