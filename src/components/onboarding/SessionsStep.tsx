import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import {
  Calendar,
  Save,
  Loader2,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAcademicYearDates } from "@/lib/academic-year";
import { TERM_STRUCTURES } from "@/lib/onboarding-constants";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { SessionStepData, ClassDraft } from "./types";

interface SessionsStepHandle {
  save: () => Promise<{ ok: boolean; error?: string }>;
  saveSessionDates: () => Promise<{ ok: boolean; error?: string }>;
  discard: () => void;
}

interface Props {
  initialData?: SessionStepData;
  data: SessionStepData;
  onChange: (d: SessionStepData) => void;
  onSave?: (d: SessionStepData) => Promise<void>;
  /** Fired after a successful session-dates save so the parent can refetch
   *  and re-seed props. Without this, the parent state stays stale and the
   *  Sessions tab reverts to the previous term_structure on remount. */
  onSaved?: () => void | Promise<void>;
  schoolId?: string;
  academicYearId?: string;
  selectedClassId?: string | null;
  onClassSelect?: (classId: string | null) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

// ── Class session date row ─────────────────────────────────────
interface ClassSessionDate {
  class_id: string;
  class_name: string;
  class_code: string;
  wing?: string;
  start_date: string;
  end_date: string;
  term_structure: string;
}

interface ClassSessionRowProps {
  cls: ClassDraft;
  session: ClassSessionDate;
  yearDates: { start: string; end: string };
  onUpdate: (patch: Partial<ClassSessionDate>) => void;
  disabled?: boolean;
}

function ClassSessionRow({ cls, session, yearDates, onUpdate, disabled }: ClassSessionRowProps) {
  return (
    <tr className="border-b hover:bg-muted/30 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{cls.name}</span>
          {cls.wing && (
            <Badge variant="outline" className="text-xs">{cls.wing}</Badge>
          )}
        </div>
      </td>
      <td className="py-3 px-4">
        <Input
          type="date"
          className="h-8 text-xs w-36"
          value={session.start_date || yearDates.start}
          min={yearDates.start}
          max={session.end_date || yearDates.end}
          onChange={(e) => onUpdate({ start_date: e.target.value })}
          disabled={disabled}
        />
      </td>
      <td className="py-3 px-4">
        <Input
          type="date"
          className="h-8 text-xs w-36"
          value={session.end_date || yearDates.end}
          min={session.start_date || yearDates.start}
          max={yearDates.end}
          onChange={(e) => onUpdate({ end_date: e.target.value })}
          disabled={disabled}
        />
      </td>
      <td className="py-3 px-4">
        <Select
          value={session.term_structure}
          onValueChange={(v) => onUpdate({ term_structure: v })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TERM_STRUCTURES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
    </tr>
  );
}

// ── Main component ───────────────────────────────────────────
export const SessionsStep = forwardRef<SessionsStepHandle, Props>(({
  initialData,
  data,
  onChange,
  onSave,
  onSaved,
  schoolId,
  academicYearId,
  onDirtyChange,
}, ref) => {
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const originalSessions = useRef<ClassSessionDate[]>([]);

  // Expose saveSessionDates for parent access
  useImperativeHandle(ref, () => ({
    save: async (): Promise<{ ok: boolean; error?: string }> => {
      const result = await saveSessionDates();
      return result;
    },
    saveSessionDates,
    discard: cancelEdit,
  }));

  // Class session dates state
  const [classSessions, setClassSessions] = useState<ClassSessionDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wingFilter, setWingFilter] = useState<string>("all");

  const yearDates = getAcademicYearDates(data.academic_year);

  // Override display dates to show April→March academic year
  const displayYearDates = {
    start: `${data.academic_year.split("-")[0]}-04-01`,
    end: `${parseInt(data.academic_year.split("-")[0]) + 1}-03-31`,
  };

  // Get unique wings
  const usedWings = [...new Set(data.classes.map((c) => c.wing).filter(Boolean))] as string[];

  // Initialize class sessions from data and merge DB overrides
  useEffect(() => {
    if (!schoolId || !academicYearId) return;
    let cancelled = false;

    const init = async () => {
      setLoading(true);
      // Step 1: load DB overrides first
      const { data: overrides } = await supabase
        .from("class_session_dates")
        .select("class_id, start_date, end_date, classes(name, acronym)")
        .eq("school_id", schoolId)
        .eq("academic_year_id", academicYearId);

      if (cancelled) return;

      // Step 2: build base sessions from data, applying overrides atomically
      const sessions: ClassSessionDate[] = data.classes
        .filter((cls) => cls._id)
        .map((cls) => {
          const override = overrides?.find((o: any) => o.class_id === cls._id);
          return {
            class_id: cls._id!,
            class_name: cls.name,
            class_code: cls.acronym || deriveClassAcronym(cls.name),
            wing: cls.wing,
            start_date: override?.start_date || cls.start_date || yearDates.start,
            end_date: override?.end_date || cls.end_date || yearDates.end,
            term_structure: cls.term_structure || TERM_STRUCTURES[0],
          };
        });
      setClassSessions(sessions);
      setLoading(false);
    };

    init();
    return () => { cancelled = true; };
  }, [data.classes, yearDates.start, yearDates.end, schoolId, academicYearId]);

  // Update class session
  const updateClassSession = (classId: string, patch: Partial<ClassSessionDate>) => {
    setClassSessions((prev) =>
      prev.map((s) => (s.class_id === classId ? { ...s, ...patch } : s))
    );
    setIsDirty(true);
    // dirty signal propagated by the hasChanges effect below
  };

  // ── Edit mode ──────────────────────────────────────────────────
  const enterEditMode = () => {
    originalSessions.current = [...classSessions];
    setIsEditing(true);
    // dirty signal is propagated by the hasChanges effect below
  };

  const cancelEdit = () => {
    setClassSessions(originalSessions.current);
    setIsEditing(false);
    // dirty signal propagated by the hasChanges effect below
  };

  // Detect changes vs original
  const hasChanges = classSessions.some((s, i) => {
    const orig = originalSessions.current[i];
    if (!orig) return true;
    if (s.start_date !== orig.start_date) return true;
    if (s.end_date !== orig.end_date) return true;
    if (s.term_structure !== orig.term_structure) return true;
    return false;
  });

  // Forward real diff to parent for unsaved-changes guard.
  // Reacts to every mutation (incl. revert-to-original) and to leaving edit mode.
  useEffect(() => {
    if (!isEditing) {
      onDirtyChange?.(false);
      return;
    }
    onDirtyChange?.(hasChanges);
  }, [isEditing, hasChanges, onDirtyChange]);

  // beforeunload guard
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing]);

  // Save all session dates
  const saveSessionDates = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!schoolId || !academicYearId) {
      return { ok: false, error: "Missing school or academic year context" };
    }

    setSaving(true);
    try {
      for (const session of classSessions) {
        const { error: upsertError } = await supabase
          .from("class_session_dates")
          .upsert({
            school_id: schoolId,
            academic_year_id: academicYearId,
            class_id: session.class_id,
            start_date: session.start_date || yearDates.start,
            end_date: session.end_date || yearDates.end,
          }, {
            onConflict: "school_id,academic_year_id,class_id",
          });
        if (upsertError) {
          console.error("[SessionsStep] upsert session date error:", upsertError);
          return { ok: false, error: `Failed to save session dates: ${upsertError.message}` };
        }

        const { error: updateError } = await supabase
          .from("classes")
          .update({ term_structure: session.term_structure })
          .eq("id", session.class_id)
          .eq("school_id", schoolId);
        if (updateError) {
          console.error("[SessionsStep] update term_structure error:", updateError);
          return { ok: false, error: `Failed to update term structure: ${updateError.message}` };
        }
      }
      setIsDirty(false);
      setIsEditing(false);
      // dirty signal propagated by the hasChanges effect below
      // Notify parent so it can refetch sessionData and the child re-seeds
      // with the just-persisted term_structure on remount.
      await onSaved?.();
      toast({ title: "Sessions saved", description: "Session dates and term structure updated." });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save session dates";
      console.error("[SessionsStep] saveSessionDates unexpected error:", e);
      return { ok: false, error: msg };
    } finally {
      setSaving(false);
    }
  };

  // Filter classes
  const filteredSessions = classSessions.filter((s) => {
    const matchesSearch = !searchQuery ||
      s.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.class_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWing = wingFilter === "all" || s.wing === wingFilter;
    return matchesSearch && matchesWing;
  });

  return (
    <div className="w-full space-y-8">
      {/* Edit / Save / Cancel buttons */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={cancelEdit}
              disabled={saving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const result = await saveSessionDates();
                if (result.ok) {
                  toast({ title: "Sessions saved", description: "Session dates and term structure updated." });
                } else {
                  toast({
                    title: "Failed to save sessions",
                    description: result.error || "Please try again.",
                    variant: "destructive",
                  });
                }
              }}
              disabled={!hasChanges || saving}
              className="cursor-pointer"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              ) : (
                <><Save className="h-4 w-4" /> Save Dates</>
              )}
            </Button>
          </>
        ) : (
          <Button
            onClick={enterEditMode}
            className="cursor-pointer"
          >
            Edit
          </Button>
        )}
      </div>

      {/* Academic year info */}
      <div className="space-y-1.5">
        <Label className="font-medium text-sm">Academic Year</Label>
        <Badge variant="outline" className="text-sm px-3 py-1 font-mono">
          {data.academic_year}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {formatDateDisplay(displayYearDates.start)} → {formatDateDisplay(displayYearDates.end)}
        </p>
      </div>

      {/* ── Class Session Dates Section ──────────────────────── */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <h3 className="text-base font-semibold">Class Session Dates</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Set start/end dates and term structure for each class. Dates drive attendance calculation.
          </p>
        </div>

        {/* Filter bar */}
        {classSessions.length > 0 && (
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
            {usedWings.length > 0 && (
              <Select value={wingFilter} onValueChange={setWingFilter}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue placeholder="Filter by wing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All wings</SelectItem>
                  {usedWings.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="text-sm text-muted-foreground">
              {filteredSessions.length} of {classSessions.length} classes
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading session dates…
          </div>
        ) : classSessions.length === 0 ? (
          <div className="border-2 border-dashed rounded-xl p-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No classes yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add classes in the Classes tab first.
                </p>
              </div>
            </div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="border rounded-xl p-8 text-center text-muted-foreground">
            <p className="text-sm">No classes match your filter.</p>
          </div>
        ) : (
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/30 border-b">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Class</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Start Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">End Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Term Structure</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => {
                    const cls = data.classes.find((c) => c._id === session.class_id);
                    if (!cls) return null;
                    return (
                      <ClassSessionRow
                        key={session.class_id}
                        cls={cls}
                        session={session}
                        yearDates={yearDates}
                        onUpdate={(patch) => updateClassSession(session.class_id, patch)}
                        disabled={!isEditing}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export type { SessionsStepHandle };
function formatDateDisplay(dateStr: string): string {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const [year, month, day] = dateStr.split("-");
  return `${parseInt(day)}-${months[parseInt(month) - 1]}-${year}`;
}

function deriveClassAcronym(name: string): string {
  return name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase() || name.slice(0, 4).toUpperCase();
}