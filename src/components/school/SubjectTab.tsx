import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AssignedSubject, isSeniorClass } from "@/data/subjects";
import { SubjectGrid } from "./SubjectGrid";
import { SaveStatusIndicator } from "./SaveStatusIndicator";
import { WingClassFilter } from "@/components/ui/WingClassFilter";
import type { SaveStatus } from "@/hooks/useAutoSave";

interface Section {
  id: string;
  name: string;
  stream?: string | null;
  subjects: AssignedSubject[];
  displayOrder?: number;
}

interface ClassRow {
  id: string;
  name: string;
  wing_id: string | null;
  wing_name: string | null;
  sections: Section[];
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

interface SubjectTabProps {
  schoolId: string;
  academicYearId?: string;
  onStatusChange?: (status: SaveStatus) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

const AUTOSAVE_DEBOUNCE_MS = 1500;

export function SubjectTab({ schoolId, academicYearId, onStatusChange, onDirtyChange }: SubjectTabProps) {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [savedClasses, setSavedClasses] = useState<ClassRow[]>([]);
  const [wings, setWings] = useState<Wing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<Error | null>(null);
  const [timeUntilSave, setTimeUntilSave] = useState<number | null>(null);

  // Auto-save refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countDownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingSaveRef = useRef<ClassRow[] | null>(null);

  const updateStatus = useCallback((status: SaveStatus, error: Error | null = null) => {
    setSaveStatus(status);
    setSaveError(error);
    onStatusChange?.(status);
    onDirtyChange?.(status === "saving" || status === "error");
  }, [onStatusChange, onDirtyChange]);

  // Clear auto-save timer
  const clearTimers = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (countDownRef.current) clearInterval(countDownRef.current);
    setTimeUntilSave(null);
  }, []);

  // Auto-save function
  const autoSave = useCallback(async (dataToSave: ClassRow[]) => {
    updateStatus("saving");
    try {
      for (const cls of dataToSave) {
        for (const sec of cls.sections) {
          // Delete existing section_subjects for this section
          await supabase
            .from("section_subjects")
            .delete()
            .eq("section_id", sec.id);

          // Insert new section_subjects
          if (sec.subjects.length > 0) {
            await supabase.from("section_subjects").insert(
              sec.subjects.map((sub) => ({
                section_id: sec.id,
                school_id: schoolId,
                subject_name: sub.name,
                subject_code: sub.code || null,
                stream: sub.stream || null,
                is_active: true,
              }))
            );
          }

          // Update section stream for senior classes
          if (isSeniorClass(sec.name) && sec.stream) {
            await supabase
              .from("sections")
              .update({ stream: sec.stream })
              .eq("id", sec.id);
          }
        }
      }

      setSavedClasses(dataToSave);
      updateStatus("saved");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Save failed");
      updateStatus("error", error);

      // Auto-retry once after 1.5s
      setTimeout(async () => {
        updateStatus("saving");
        try {
          for (const cls of dataToSave) {
            for (const sec of cls.sections) {
              await supabase.from("section_subjects").delete().eq("section_id", sec.id);
              if (sec.subjects.length > 0) {
                await supabase.from("section_subjects").insert(
                  sec.subjects.map((sub) => ({
                    section_id: sec.id,
                    school_id: schoolId,
                    subject_name: sub.name,
                    subject_code: sub.code || null,
                    stream: sub.stream || null,
                    is_active: true,
                  }))
                );
              }
              if (isSeniorClass(sec.name) && sec.stream) {
                await supabase.from("sections").update({ stream: sec.stream }).eq("id", sec.id);
              }
            }
          }
          setSavedClasses(dataToSave);
          updateStatus("saved");
        } catch {
          updateStatus("error", error);
        }
      }, 1500);
    }
  }, [schoolId, updateStatus]);

  // Schedule auto-save with debounce
  const scheduleAutoSave = useCallback((newData: ClassRow[]) => {
    clearTimers();
    pendingSaveRef.current = newData;

    // Start countdown
    let remaining = AUTOSAVE_DEBOUNCE_MS;
    setTimeUntilSave(remaining);
    countDownRef.current = setInterval(() => {
      remaining -= 100;
      setTimeUntilSave(Math.max(0, remaining));
      if (remaining <= 0 && countDownRef.current) {
        clearInterval(countDownRef.current);
      }
    }, 100);

    saveTimerRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        autoSave(pendingSaveRef.current);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [clearTimers, autoSave]);

  // Retry save
  const handleRetry = useCallback(async () => {
    if (pendingSaveRef.current) {
      await autoSave(pendingSaveRef.current);
    }
  }, [autoSave]);

  const fetchData = useCallback(async () => {
    if (!schoolId || !academicYearId) {
      setIsLoading(true);
      return;
    }

    setIsLoading(true);
    try {
      const [{ data: wingRows }, { data: classRows }] = await Promise.all([
        supabase.from("wings").select("id, name").eq("school_id", schoolId).order("display_order"),
        supabase
          .from("classes")
          .select("id, name, wing_id, display_order")
          .eq("school_id", schoolId)
          .eq("session_id", academicYearId ?? "")
          .order("display_order"),
      ]);

      if (!classRows || classRows.length === 0) {
        setWings(wingRows || []);
        setClasses([]);
        setSavedClasses([]);
        setIsLoading(false);
        return;
      }

      const sortedWings = [...(wingRows || [])].sort((a, b) => {
        const aClasses = classRows.filter(c => c.wing_id === a.id);
        const bClasses = classRows.filter(c => c.wing_id === b.id);
        const aMin = aClasses.length ? Math.min(...aClasses.map(c => getClassAcademicRank(c.name))) : 999;
        const bMin = bClasses.length ? Math.min(...bClasses.map(c => getClassAcademicRank(c.name))) : 999;
        return aMin - bMin;
      });
      setWings(sortedWings);

      const wingNameMap = new Map<string, string>();
      for (const w of wingRows || []) {
        wingNameMap.set(w.id, w.name);
      }

      const { data: sectionRows } = await supabase
        .from("sections")
        .select("id, name, class_id, stream, display_order")
        .eq("school_id", schoolId)
        .eq("session_id", academicYearId ?? "")
        .order("display_order");

      const { data: subjectRows } = await supabase
        .from("section_subjects")
        .select("section_id, subject_name, subject_code, stream")
        .eq("school_id", schoolId);

      const classMap = new Map<string, ClassRow>();

      for (const cls of classRows) {
        classMap.set(cls.id, {
          id: cls.id,
          name: cls.name,
          wing_id: cls.wing_id || null,
          wing_name: cls.wing_id ? wingNameMap.get(cls.wing_id) || null : null,
          sections: [],
        });
      }

      for (const sec of sectionRows || []) {
        const cls = classMap.get(sec.class_id);
        if (cls) {
          const subjects = (subjectRows || [])
            .filter((s) => s.section_id === sec.id)
            .map((s) => ({
              name: s.subject_name,
              code: s.subject_code,
              stream: s.stream,
              isCustom: !s.subject_code,
            }));

          cls.sections.push({
            id: sec.id,
            name: sec.name,
            stream: sec.stream,
            subjects,
            displayOrder: sec.display_order ?? 0,
          });
        }
      }

      const fresh = Array.from(classMap.values());
      setClasses(fresh);
      setSavedClasses(JSON.parse(JSON.stringify(fresh)));
      pendingSaveRef.current = fresh;
      updateStatus("idle");
    } catch {
      toast.error("Failed to load subject data");
    } finally {
      setIsLoading(false);
    }
  }, [schoolId, academicYearId, updateStatus]);

  useEffect(() => {
    fetchData();
    return () => clearTimers();
  }, [fetchData, clearTimers]);

  
  const handleClassesChange = useCallback((updatedClasses: ClassRow[]) => {
    const updatedIds = new Set(updatedClasses.map((c) => c.id));
    setClasses((prev) =>
      prev.map((cls) => {
        if (updatedIds.has(cls.id)) {
          const updated = updatedClasses.find((c) => c.id === cls.id);
          return updated || cls;
        }
        return cls;
      })
    );
    pendingSaveRef.current = updatedClasses;
    scheduleAutoSave(updatedClasses);
  }, [scheduleAutoSave]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No classes found</p>
        <p className="text-sm mt-1">Create classes in the Classes tab first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
          Assign subjects to classes and sections.
        </div>
        <div className="flex items-center gap-3">
          <SaveStatusIndicator
            status={saveStatus}
            error={saveError}
            onRetry={handleRetry}
            timeUntilSave={timeUntilSave}
            debounceMs={AUTOSAVE_DEBOUNCE_MS}
            labels={{
              saved: "Saved",
              saving: "Saving",
              error: "Save failed",
              retry: "Retry",
            }}
          />
        </div>
      </div>

      <WingClassFilter
        wings={wings}
        items={classes}
        activeFilter={activeTab}
        onFilterChange={setActiveTab}
      >
        {(filteredClasses) =>
          filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No classes in this {activeTab === "all" ? "school" : activeTab === "unassigned" ? "wing" : "tab"}</p>
            </div>
          ) : (
            <SubjectGrid
              classes={filteredClasses as unknown as ClassRow[]}
              onChange={handleClassesChange}
            />
          )
        }
      </WingClassFilter>
    </div>
  );
}
