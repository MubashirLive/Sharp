import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  useSchoolCalendar,
  useUpsertSchoolCalendar,
  useClassSessionDates,
  useUpsertClassSessionDates,
} from "@/hooks/useCalendar";
import { supabase } from "@/integrations/supabase";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CheckCircle2, CalendarDays } from "lucide-react";

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function SchoolSetupCalendar() {
  const { user, school } = useAuth();
  const navigate = useNavigate();
  const academicYearId = school?.current_academic_year_id ?? "";

  // ─── Step 1: Working week ──────────────────────────────────────────────────
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const toggleDay = (day: string) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? (prev.length > 1 ? prev.filter((d) => d !== day) : prev) : [...prev, day]
    );

  // ─── Step 2: Class session dates ───────────────────────────────────────────
  const { data: classesData } = useQuery({
    queryKey: ["setup-cal", "classes", school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      const { data } = await supabase
        .from("classes")
        .select("id, name, session_id")
        .eq("school_id", school.id)
        .order("display_order");
      return data ?? [];
    },
    enabled: !!school?.id,
  });

  const [classDates, setClassDates] = useState<Record<string, { start: string; end: string }>>({});

  // ─── Existing calendar check ───────────────────────────────────────────────
  const { data: existingCal } = useSchoolCalendar(school?.id ?? "", academicYearId);
  const existingSetup = !!existingCal?.data;

  const upsertCal = useUpsertSchoolCalendar();
  const upsertClassDates = useUpsertClassSessionDates();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !school?.id || !academicYearId) return;
    if (selectedDays.length === 0) {
      toast.error("Select at least one working day");
      return;
    }

    // Validate class dates on fresh setup
    if (!existingSetup && classesData) {
      const missingClasses = (classesData as any[]).filter((c) => {
        const dates = classDates[c.id];
        return !dates?.start || !dates?.end;
      });
      if (missingClasses.length > 0) {
        toast.error(
          `Set session dates for all classes. Missing: ${missingClasses.map((c) => c.name).join(", ")}`
        );
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Upsert working week
      const calResult = await upsertCal.mutateAsync({
        schoolId: school.id,
        academicYearId,
        workingDays: selectedDays,
        userId: user.id,
      });
      if (calResult.error) throw new Error("Failed to save working week");

      // 2. Upsert class session dates (first time only — on update, skip)
      if (!existingSetup && classesData) {
        const records = (classesData as any[]).map((c) => ({
          schoolId: school.id,
          academicYearId,
          classId: c.id,
          startDate: classDates[c.id]?.start ?? "",
          endDate: classDates[c.id]?.end ?? "",
          userId: user.id,
        }));
        const cdResult = await upsertClassDates.mutateAsync({ schoolId: school.id, academicYearId, records });
        if (cdResult.error) throw new Error("Failed to save class session dates");
      }

      toast.success("Calendar setup complete!");
      navigate("/");
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to save calendar setup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="clay-page-header">
          <h1>Calendar Setup</h1>
          <p className="text-muted-foreground text-sm">
            Define working days and class session boundaries for {school?.name}
          </p>
        </div>

        {/* Working week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Working Week
            </CardTitle>
            <CardDescription>
              Select the days your school operates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {ALL_DAYS.map((day) => (
                <label key={day} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={selectedDays.includes(day)}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <span className="text-sm font-medium">{day}</span>
                </label>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-sm text-destructive">At least one working day required</p>
            )}
            <p className="text-xs text-muted-foreground">
              Selected: <span className="font-medium">{selectedDays.join(", ")}</span>
            </p>
          </CardContent>
        </Card>

        {/* Class session dates — fresh setup only */}
        {!existingSetup && classesData && (classesData as any[]).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Class Session Dates</CardTitle>
              <CardDescription>
                Set start and end dates for each class. Attendance locks outside these dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(classesData as any[]).map((cls) => (
                <div key={cls.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="font-medium text-sm">{cls.name}</div>
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={classDates[cls.id]?.start ?? ""}
                      onChange={(e) =>
                        setClassDates((prev) => ({
                          ...prev,
                          [cls.id]: { ...prev[cls.id], start: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={classDates[cls.id]?.end ?? ""}
                      onChange={(e) =>
                        setClassDates((prev) => ({
                          ...prev,
                          [cls.id]: { ...prev[cls.id], end: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Already configured */}
        {existingSetup && (
          <div className="flex items-center gap-2 p-4 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Calendar already configured for this academic year.
              Updating working days here is safe — class dates unchanged.
            </p>
          </div>
        )}

        {/* National holidays note */}
        <div className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
          <CalendarDays className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            National holidays (Republic Day, Independence Day, Diwali, etc.) are applied
            automatically — no manual entry needed. Schools only add custom holidays via the
            Calendar page.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>
            Skip for now
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (selectedDays.length === 0 && !existingSetup)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {existingSetup ? "Update Calendar" : "Complete Setup"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}