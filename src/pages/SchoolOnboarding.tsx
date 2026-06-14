import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SchoolStep } from "@/components/onboarding/SchoolStep";
import { StructureStep } from "@/components/onboarding/StructureStep";
import { SubjectsStep } from "@/components/onboarding/SubjectsStep";
import { SummaryStep } from "@/components/onboarding/SummaryStep";
import type { WizardData } from "@/components/onboarding/types";
import { schoolCoreSchema, sessionSchema, schoolOnboardingSchema } from "@/lib/schemas";
import { ACADEMIC_YEAR_DATES } from "@/lib/onboarding-constants";
import { getCurrentAcademicYear, getUpcomingAcademicYear, getAcademicYearDates } from "@/lib/academic-year";

const STEPS = ["School", "Session & Classes", "Subjects", "Review"];

const schoolSchema = schoolCoreSchema;

const REVIEW_ONLY_FIELDS: Array<keyof WizardData["school"]> = [
  "name",
  "acronym",
  "address",
  "postal_code",
  "city",
  "state",
  "country",
  "board",
  "state_board_name",
  "school_type",
  "emblem_url",
  "contact_phone",
  "contact_email",
  "alt_contact_phone",
  "website",
  "principal_name",
  "principal_email",
  "principal_mobile",
];

const hasValue = (value: unknown) =>
  typeof value === "string" ? value.trim().length > 0 : value != null;

export default function SchoolOnboarding() {
  const { school, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [schoolErrors, setSchoolErrors] = useState<Record<string, string>>({});
  const [lockedSchoolFields, setLockedSchoolFields] = useState<Partial<Record<keyof WizardData["school"], boolean>>>({});
  const [data, setData] = useState<WizardData>({
    school: {
      name: school?.name ?? "",
      acronym: "",
      address: "",
      postal_code: "",
      city: "",
      state: "",
      country: "India",
      contact_phone: "",
      alt_contact_phone: "",
      contact_email: "",
      website: "",
      board: "",
      state_board_name: "",
      school_type: "",
      shifts: [{ name: "Morning", start_time: "08:00", end_time: "14:00" }],
      houses: [],
      departments: ["Administration", "Academics", "Fees"],
      emblem_url: "",
      principal_email: "",
      principal_mobile: "",
      principal_name: "",
    },
    session: {
      academic_year: getCurrentAcademicYear(),
      classes: [],
      wings: [],
    },
  });

  useEffect(() => {
    if (!school?.id) return;

    (async () => {
      const { data: schoolRow } = await supabase
        .from("schools")
        .select("name, acronym, address, postal_code, city, state, country, contact_phone, contact_email, board, school_type, website, alt_contact_number, principal_mobile, principal_email, principal_name, shifts, houses, departments, emblem_url, logo_url")
        .eq("id", school.id)
        .maybeSingle();

      if (!schoolRow) return;

      const row = schoolRow as Record<string, unknown>;
      const getBoard = () => row.board;
      const nextLockedFields = REVIEW_ONLY_FIELDS.reduce((acc, field) => {
        let value: unknown;
        if (field === "board") value = getBoard();
        else if (field === "emblem_url") value = row.emblem_url ?? row.logo_url;
        else value = row[field];
        if (hasValue(value)) acc[field] = true;
        return acc;
      }, {} as Partial<Record<keyof WizardData["school"], boolean>>);

      setLockedSchoolFields(nextLockedFields);
      setData((prev) => ({
        ...prev,
        school: {
          ...prev.school,
          name: schoolRow.name ?? prev.school.name,
          acronym: schoolRow.acronym ?? prev.school.acronym,
          address: schoolRow.address ?? prev.school.address,
          postal_code: schoolRow.postal_code ?? prev.school.postal_code,
          city: schoolRow.city ?? prev.school.city,
          state: schoolRow.state ?? prev.school.state,
          country: schoolRow.country ?? prev.school.country,
          contact_phone: schoolRow.contact_phone ?? prev.school.contact_phone,
          alt_contact_phone: schoolRow.alt_contact_number ?? prev.school.alt_contact_phone,
          contact_email: schoolRow.contact_email ?? prev.school.contact_email,
          website: schoolRow.website ?? prev.school.website,
          board: row.board as string ?? prev.school.board,
          school_type: schoolRow.school_type ?? prev.school.school_type,
          shifts: schoolRow.shifts?.length ? schoolRow.shifts : prev.school.shifts,
          houses: schoolRow.houses?.length ? schoolRow.houses : prev.school.houses,
          departments: schoolRow.departments?.length ? schoolRow.departments : prev.school.departments,
          emblem_url: (schoolRow.emblem_url ?? row.logo_url) as string ?? prev.school.emblem_url,
          principal_email: schoolRow.principal_email ?? prev.school.principal_email,
          principal_mobile: schoolRow.principal_mobile ?? prev.school.principal_mobile,
          principal_name: schoolRow.principal_name ?? prev.school.principal_name,
        },
      }));
    })();
  }, [school?.id]);

  if (!school) {
    return <AppShell><div className="rounded-xl border bg-card px-5 py-5 shadow-md"><h3 className="font-semibold">No school linked</h3></div></AppShell>;
  }

  if (school.onboarding_complete) {
    navigate("/school", { replace: true });
    return null;
  }

  const validateStep = () => {
    if (step === 0) {
      const s = data.school;
      if (s.board === "State Board" && !s.state_board_name.trim()) {
        setSchoolErrors({ state_board_name: "Enter the state board name" });
        toast({ title: "Please fix the errors", description: "State board name is required.", variant: "destructive" });
        return false;
      }
      const r = schoolOnboardingSchema.safeParse(data.school);
      if (!r.success) {
        const errs: Record<string, string> = {};
        r.error.errors.forEach((e) => { if (e.path[0]) errs[String(e.path[0])] = e.message; });
        setSchoolErrors(errs);
        toast({ title: "Please fix the errors", description: "Required fields are missing or invalid.", variant: "destructive" });
        return false;
      }
      setSchoolErrors({});
    }
    if (step === 1) {
      const r = sessionSchema.safeParse(data.session);
      if (!r.success) { toast({ title: "Fix errors", description: r.error.errors[0].message, variant: "destructive" }); return false; }
      if (data.session.start_date >= data.session.end_date) {
        toast({ title: "Invalid dates", description: "End date must be after start date", variant: "destructive" });
        return false;
      }
    }
    if (step === 2) {
      const missingStream = data.session.classes.find((classDraft) =>
        classDraft.sections.some((section) => {
          const lower = classDraft.name.toLowerCase();
          const isSeniorClass = ["class 11", "class 12"].some((c) =>
            lower.includes(c.replace("class ", "")),
          );
          return isSeniorClass && !section.stream;
        }),
      );
      if (missingStream) {
        const sectionName = missingStream.sections.find((section) => !section.stream)?.name ?? "Unknown";
        toast({
          title: "Select stream",
          description: `${missingStream.name} Section ${sectionName} is missing stream selection.`,
          variant: "destructive",
        });
        return false;
      }

      const emptySection = data.session.classes
        .flatMap((classDraft) =>
          classDraft.sections.map((section) => ({
            className: classDraft.name,
            sectionName: section.name,
            subjectCount: (section.subjects ?? []).length,
          })),
        )
        .find((section) => section.subjectCount === 0);

      if (emptySection) {
        toast({
          title: "Add subjects",
          description: `${emptySection.className} Section ${emptySection.sectionName} has no subjects yet.`,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const next = () => { if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setSubmitting(true);
    try {
      const s = data.school;
      const schoolUpdate: Record<string, unknown> = {
        alt_contact_number: s.alt_contact_phone,
        website: s.website,
        shifts: s.shifts,
        houses: s.houses,
        departments: s.departments,
        onboarding_complete: true,
      };

      if (!lockedSchoolFields.acronym) schoolUpdate.acronym = s.acronym;
      if (!lockedSchoolFields.address) schoolUpdate.address = s.address;
      if (!lockedSchoolFields.postal_code) schoolUpdate.postal_code = s.postal_code;
      if (!lockedSchoolFields.city) schoolUpdate.city = s.city;
      if (!lockedSchoolFields.state) schoolUpdate.state = s.state;
      if (!lockedSchoolFields.country) schoolUpdate.country = s.country;
      if (!lockedSchoolFields.contact_phone) schoolUpdate.contact_phone = s.contact_phone;
      if (!lockedSchoolFields.contact_email) schoolUpdate.contact_email = s.contact_email;
      if (!lockedSchoolFields.board) schoolUpdate.board = s.board;
      if (!lockedSchoolFields.school_type) schoolUpdate.school_type = s.school_type;
      if (!lockedSchoolFields.emblem_url) schoolUpdate.emblem_url = s.emblem_url;

      const { data: schData, error: schErr } = await supabase
        .from("schools")
        .update(schoolUpdate)
        .eq("id", school.id)
        .select("id, onboarding_complete")
        .single();

      if (schErr) throw schErr;
      if (!schData) throw new Error("School update failed — no row returned");

      // 3) Create academic session
      const sess = data.session;
      const { data: sessRow, error: sessErr } = await supabase
        .from("academic_sessions")
        .insert({
          school_id: school.id,
          academic_year: sess.academic_year,
          is_current: true,
          start_date: ACADEMIC_YEAR_DATES[sess.academic_year]?.start ?? sess.academic_year.split("-")[0] + "-04-01",
          end_date: ACADEMIC_YEAR_DATES[sess.academic_year]?.end ?? sess.academic_year.split("-")[1] + "-03-31",
        })
        .select("id")
        .single();
      if (sessErr) throw sessErr;

      // 4) Classes → sections → section_subjects
      for (let i = 0; i < sess.classes.length; i++) {
        const c = sess.classes[i];
        const { data: cls, error: cErr } = await supabase
          .from("classes")
          .insert({
            school_id: school.id,
            session_id: sessRow.id,
            name: c.name,
            acronym: c.acronym || null,
            display_order: i,
            wing: c.wing ?? null,
            term_structure: c.term_structure,
            start_date: c.start_date || null,
            end_date: c.end_date || null,
          })
          .select("id")
          .single();
        if (cErr) throw cErr;

        for (let j = 0; j < c.sections.length; j++) {
          const sec = c.sections[j];
          const { data: secRow, error: secErr } = await supabase
            .from("sections")
            .insert({
              school_id: school.id,
              class_id: cls.id,
              session_id: sessRow.id,
              name: sec.name,
              acronym: sec.acronym || null,
              display_order: j,
              stream: sec.stream ?? null,
            })
            .select("id")
            .single();
          if (secErr) throw secErr;

          if (sec.subjects.length > 0) {
            const { error: subErr } = await supabase
              .from("section_subjects")
              .insert(
                sec.subjects.map((sub) => ({
                  section_id: secRow.id,
                  school_id: school.id,
                  subject_name: sub.name,
                  subject_code: sub.code,
                  stream: sub.stream ?? null,
                  is_active: true,
                }))
              );
            if (subErr) throw subErr;
          }
        }
      }

      toast({ title: "Setup complete!", description: "All modules unlocked." });
      await refresh();
      window.location.href = "/";
    } catch (e: any) {
      toast({ title: "Setup failed", description: e.message ?? "Try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">School Onboarding</h1>
          <p className="text-sm text-muted-foreground">Set up your school in 4 quick steps.</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            {STEPS.map((label, i) => (
              <div key={label} className={`flex items-center gap-1.5 ${i <= step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                <span className={`h-5 w-5 rounded-full inline-flex items-center justify-center text-[10px] ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/20 text-primary border border-primary" : "bg-muted"}`}>
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="rounded-xl border bg-card px-5 py-5 shadow-md">
          <h2 className="text-lg font-semibold mb-4">Step {step + 1}: {STEPS[step]}</h2>
            {step === 0 && (
              <SchoolStep
                data={data.school}
                onChange={(d) => setData({ ...data, school: d })}
                errors={schoolErrors}
                lockedFields={lockedSchoolFields}
              />
            )}
            {step === 1 && <StructureStep data={data.session} onChange={(d) => setData({ ...data, session: d })} isOnboarding={true} schoolId={school?.id} />}
            {step === 2 && <SubjectsStep data={data.session} onChange={(d) => setData({ ...data, session: d })} />}
            {step === 3 && <SummaryStep data={data} />}
          </div>

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={back} disabled={step === 0 || submitting} className="clay-btn cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Save & Continue <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Check className="h-4 w-4" /> Complete Setup</>}
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
