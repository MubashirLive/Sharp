import { useEffect, useState, useRef, createContext, useContext, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Save, X, Loader2, Lock, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { StructureStep } from "@/components/onboarding/StructureStep";
import { WingsTab, type WingsTabHandle } from "@/components/wings/WingsTab";
import { DepartmentsTab } from "@/components/departments/DepartmentsTab";
import { ClassesTab, type ClassesTabHandle } from "@/components/school/ClassesTab";
import { SessionsStep, type SessionsStepHandle } from "@/components/onboarding/SessionsStep";
import { SubjectsStep } from "@/components/onboarding/SubjectsStep";
import { SubjectTab } from "@/components/school/SubjectTab";
import { HousesTab } from "@/components/school/HousesTab";
import { getCurrentAcademicYear, getAcademicYearDates } from "@/lib/academic-year";
import type { SessionStepData } from "@/components/onboarding/types";

interface SchoolProfile {
  name: string;
  acronym: string;
  address: string;
  postal_code: string;
  country: string;
  city: string;
  state: string;
  contact_phone: string;
  contact_email: string;
  board: string;
  school_type: string;
  emblem_url: string;
  principal_name: string;
  principal_email: string;
  principal_mobile: string;
  alt_contact_phone: string;
  website: string;
  shifts: Array<{ name: string; start_time: string; end_time: string }>;
}

interface Wing {
  id: string;
  name: string;
  display_order: number | null;
}


interface WingEditor {
  id?: string;
  name: string;
  classIds: string[];
  coordinator_id?: string;
  coordinator_name?: string;
}

// ── Audit log types ──────────────────────────────────────────────
interface AuditEntry {
  id: string;
  entity_type: "class" | "section" | "session";
  entity_id: string;
  entity_name: string;
  action: "created" | "updated" | "deleted";
  actor_id: string;
  actor_name: string;
  changed_fields: Record<string, unknown>;
  created_at: string;
}

const SUPER_ADMIN_LOCKED: (keyof SchoolProfile)[] = [
  "name", "acronym", "board", "school_type", "address", "postal_code",
  "country", "state", "city", "emblem_url",
  "principal_name", "principal_email", "principal_mobile",
];

// ── Context for navigation guard ────────────────────────────────
interface SchoolPageContextValue {
  dirtyTabsRef: React.MutableRefObject<Set<string>>;
  requestNavigation: (targetUrl: string) => boolean;
}

const SchoolPageContext = createContext<SchoolPageContextValue | null>(null);

export function useSchoolPageContext() {
  const ctx = useContext(SchoolPageContext);
  if (!ctx) throw new Error("useSchoolPageContext must be used inside SchoolPage");
  return ctx;
}

const DEFAULT_HOUSES: House[] = [
  { name: "Red", color: "#ef4444", emblem_url: "" },
  { name: "Blue", color: "#3b82f6", emblem_url: "" },
  { name: "Green", color: "#22c55e", emblem_url: "" },
  { name: "Yellow", color: "#eab308", emblem_url: "" },
];

type ProfileForm = Partial<SchoolProfile>;

export default function SchoolPage() {
  const { school, primaryRole, isSuperAdmin, refresh } = useAuth();
  const canEdit = isSuperAdmin || primaryRole === "principal" || primaryRole === "admin";

  // ── Tab state ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("profile");

  // ── School Profile tab ────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileForm | null>(null);
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Session & Classes ────────────────────────────────────────
  const [sessionData, setSessionData] = useState<SessionStepData>({
    academic_year: "2025-26", classes: [], wings: [],
  });
  const [initialSessionData, setInitialSessionData] = useState<SessionStepData>({
    academic_year: "2025-26", classes: [], wings: [],
  });
  const [sessionLoading, setSessionLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);


  // ── Wings & Houses ───────────────────────────────────────────
  const [wingEditors, setWingEditors] = useState<WingEditor[]>([]);
  const [initialWingEditors, setInitialWingEditors] = useState<WingEditor[]>([]);
  const [wingSaving, setWingSaving] = useState(false);
  const [wingsLoading, setWingsLoading] = useState(true);

  // Current user for departments audit log
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [currentUserName, setCurrentUserName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
        const profile = await supabase
          .from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
        setCurrentUserName(profile?.full_name ?? undefined);
      }
    };
    loadCurrentUser();
  }, []);

  // ── Audit log for session changes ────────────────────────────
  const logSessionChange = async (entityType: "class" | "section" | "session", entityId: string, entityName: string, action: "created" | "updated" | "deleted", changedFields: Record<string, unknown>) => {
    if (!school) return;
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("session_audit_log").insert({
      school_id: school.id,
      session_id: currentSessionId,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityName,
      action,
      actor_id: userData.user?.id,
      changed_fields: changedFields,
    });
  };

  useEffect(() => {
    if (!school) { setLoading(false); return; }
    fetchSchoolProfile();
    fetchSessionData();
    fetchWings();
  }, [school?.id]);

  // ── Fetches ───────────────────────────────────────────────────
  const fetchSchoolProfile = async () => {
    const { data, error } = await supabase
      .from("schools")
      .select(
        "name,acronym,address,postal_code,country,city,state," +
        "contact_phone,contact_email,board,school_type," +
        "emblem_url,principal_name,principal_email,principal_mobile," +
        "alt_contact_number,website,shifts"
      )
      .eq("id", school!.id)
      .maybeSingle();
    if (!error && data) {
      const p: SchoolProfile = {
        name: data.name ?? "",
        acronym: data.acronym ?? "",
        address: data.address ?? "",
        postal_code: data.postal_code ?? "",
        country: data.country ?? "India",
        city: data.city ?? "",
        state: data.state ?? "",
        contact_phone: data.contact_phone ?? "",
        contact_email: data.contact_email ?? "",
        board: data.board ?? "",
        school_type: data.school_type ?? "",
        emblem_url: data.emblem_url ?? "",
        principal_name: data.principal_name ?? "",
        principal_email: data.principal_email ?? "",
        principal_mobile: data.principal_mobile ?? "",
        alt_contact_phone: (data as any).alt_contact_number ?? "",
        website: (data as any).website ?? "",
        shifts: (data as any).shifts ?? [],
      };
      setProfile(p);
      setForm(p);
    }
    setLoading(false);
  };

  const fetchSessionData = async () => {
    if (!school) return;
    setSessionLoading(true);
    try {
      let { data: sess } = await supabase
        .from("academic_sessions")
        .select("id, academic_year")
        .eq("school_id", school.id)
        .eq("is_current", true)
        .maybeSingle();

      if (!sess) {
        const { data: fallbackSess } = await supabase
          .from("academic_sessions")
          .select("id, academic_year")
          .eq("school_id", school.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        sess = fallbackSess;
      }
      if (!sess) { setSessionLoading(false); return; }
      setCurrentSessionId(sess.id);

      const { data: classes } = await supabase
        .from("classes")
        .select("*, sections(*)")
        .eq("school_id", school.id)
        .eq("session_id", sess.id)
        .order("display_order");
      if (!classes) { setSessionLoading(false); return; }

      const classDrafts = await Promise.all(
        (classes ?? []).map(async (cls) => {
          const sectionDrafts = await Promise.all(
            ((cls.sections ?? []) as Array<{ id: string; name: string; acronym?: string; stream?: string }>).map(async (sec) => {
              const { data: subs } = await supabase
                .from("section_subjects")
                .select("subject_name, subject_code, stream")
                .eq("section_id", sec.id)
                .eq("school_id", school.id);
              return {
                _id: sec.id, name: sec.name, acronym: sec.acronym, stream: sec.stream,
                subjects: (subs ?? []).map((s) => ({
                  name: s.subject_name, code: s.subject_code,
                  stream: s.stream ?? undefined,
                })),
              };
            })
          );
          return {
            _id: cls.id, name: cls.name ?? "", acronym: cls.acronym ?? "",
            wing: cls.wing, wing_id: (cls as any).wing_id ?? undefined,
            term_structure: cls.term_structure ?? "Semester",
            start_date: cls.start_date ?? "", end_date: cls.end_date ?? "",
            sections: sectionDrafts,
          };
        })
      );
      setSessionData({ academic_year: sess.academic_year ?? "2025-26", classes: classDrafts as any, wings: [] });
      setInitialSessionData({ academic_year: sess.academic_year ?? "2025-26", classes: classDrafts as any, wings: [] });
    } finally {
      setSessionLoading(false);
    }
  };

  const fetchWings = async () => {
    if (!school) return;
    setWingsLoading(true);
    const [{ data: wingRows }, { data: classRows }] = await Promise.all([
      supabase.from("wings").select("id, name, display_order").eq("school_id", school.id).order("display_order"),
      supabase.from("classes").select("id, name, wing_id").eq("school_id", school.id).order("display_order"),
    ]);
    setWingEditors(
      (wingRows ?? []).map((w: any) => ({
        id: w.id, name: w.name, classIds: (classRows ?? []).filter((c: any) => c.wing_id === w.id).map((c: any) => c.id),
        coordinator_id: w.coordinator_id,
        coordinator_name: w.coordinator_name,
      }))
    );
    setInitialWingEditors(
      (wingRows ?? []).map((w: any) => ({
        id: w.id, name: w.name, classIds: (classRows ?? []).filter((c: any) => c.wing_id === w.id).map((c: any) => c.id),
        coordinator_id: w.coordinator_id,
        coordinator_name: w.coordinator_name,
      }))
    );
    setWingsLoading(false);
  };

  // ── Dirty tracking ───────────────────────────────────────────
  const [dirtyTabs, setDirtyTabs] = useState<Set<string>>(new Set());
  const dirtyTabsRef = useRef(new Set<string>());
  const [pendingTabSwitch, setPendingTabSwitch] = useState<{ tab: string } | null>(null);
  const wingsTabRef = useRef<WingsTabHandle>(null);
  const sessionsTabRef = useRef<SessionsStepHandle>(null);
  const classesTabRef = useRef<ClassesTabHandle>(null);
  const [pendingNavTarget, setPendingNavTarget] = useState<string | null>(null);

  const requestNavigation = (targetUrl: string): boolean => {
    if (dirtyTabsRef.current.size === 0) return false; // not intercepted, proceed normally
    setPendingNavTarget(targetUrl);
    return true; // intercepted, modal will show
  };

  const markDirty = (tab: string) => {
    setDirtyTabs((d) => { const n = new Set(d); n.add(tab); dirtyTabsRef.current = n; return n; });
  };
  const clearDirty = (tab: string) => {
    setDirtyTabs((d) => { const n = new Set(d); n.delete(tab); dirtyTabsRef.current = n; return n; });
  };

  const handleTabChange = (nextTab: string) => {
    if (dirtyTabsRef.current.has(activeTab)) {
      setPendingTabSwitch({ tab: nextTab });
      return;
    }
    setActiveTab(nextTab);
  };

  const confirmTabSwitch = () => {
    if (pendingTabSwitch) {
      clearDirty(activeTab);
      setActiveTab(pendingTabSwitch.tab);
      setPendingTabSwitch(null);
    }
  };

  // ── Compute change summary ────────────────────────────────────
  const computeChangeSummary = (tab: string): string => {
    if (tab === "classes") {
      const initial = initialSessionData;
      const parts: string[] = [];
      const initialIds = new Set(initial.classes.map((c) => c._id).filter(Boolean));
      const dataIds = new Set(sessionData.classes.map((c) => c._id).filter(Boolean));

      if (sessionData.academic_year !== initial.academic_year) {
        parts.push(`Academic year: "${initial.academic_year}" → "${sessionData.academic_year}"`);
      }

      sessionData.classes.forEach((c) => {
        if (!c._id) parts.push(`New class "${c.name}" (Sections: ${c.sections.map((s: any) => s.name).join(", ")})`);
      });

      initial.classes.forEach((ic) => {
        if (ic._id && !dataIds.has(ic._id)) {
          parts.push(`Removed class "${ic.name}"`);
        }
      });

      sessionData.classes.forEach((dc: any) => {
        if (!dc._id) return;
        const ic = initial.classes.find((c: any) => c._id === dc._id);
        if (!ic) return;

        if (dc.name !== ic.name) parts.push(`Class renamed: "${ic.name}" → "${dc.name}"`);
        if (dc.acronym !== ic.acronym) parts.push(`Code: "${ic.acronym || '—'}" → "${dc.acronym || '—'}"`);
        if (dc.term_structure !== ic.term_structure) parts.push(`Term: "${ic.term_structure}" → "${dc.term_structure}"`);
        if (dc.start_date !== ic.start_date) parts.push(`${dc.name} start: "${ic.start_date || '—'}" → "${dc.start_date || '—'}"`);
        if (dc.end_date !== ic.end_date) parts.push(`${dc.name} end: "${ic.end_date || '—'}" → "${dc.end_date || '—'}"`);

        const initSecIds = new Set(ic.sections.map((s: any) => s._id).filter(Boolean));
        const dataSecIds = new Set(dc.sections.map((s: any) => s._id).filter(Boolean));

        dc.sections.forEach((ds: any) => {
          if (!ds._id) parts.push(`New section "${ds.name}" in ${dc.name}`);
          else if (!initSecIds.has(ds._id)) parts.push(`Section "${ds.name}" added to ${dc.name}`);
        });

        ic.sections.forEach((is: any) => {
          if (is._id && !dataSecIds.has(is._id)) {
            parts.push(`Section "${is.name}" removed from ${dc.name}`);
          }
        });

        dc.sections.forEach((ds: any, si: number) => {
          const is = ic.sections[si];
          if (is && ds._id === is._id && ds.name !== is.name) {
            parts.push(`Section renamed: "${is.name}" → "${ds.name}" in ${dc.name}`);
          }
        });

        const dcSubjCount = dc.sections.reduce((sum: number, s: any) => sum + s.subjects.length, 0);
        const icSubjCount = ic.sections.reduce((sum: number, s: any) => sum + s.subjects.length, 0);
        if (dcSubjCount !== icSubjCount) {
          parts.push(`Subjects in ${dc.name}: ${icSubjCount} → ${dcSubjCount}`);
        }
      });

      return parts.length > 0
        ? parts.slice(0, 8).join("\n• ") + (parts.length > 8 ? `\n(+${parts.length - 8} more changes)` : "")
        : "Changes detected";
    }

    if (tab === "profile") {
      const changes: string[] = [];
      if (form?.contact_phone !== profile?.contact_phone)
        changes.push(`Phone: "${profile?.contact_phone || '—'}" → "${form?.contact_phone || '—'}"`);
      if (form?.contact_email !== profile?.contact_email)
        changes.push(`Email: "${profile?.contact_email || '—'}" → "${form?.contact_email || '—'}"`);
      if (form?.alt_contact_phone !== profile?.alt_contact_phone)
        changes.push(`Alt. phone: "${profile?.alt_contact_phone || '—'}" → "${form?.alt_contact_phone || '—'}"`);
      if (form?.website !== profile?.website)
        changes.push(`Website: "${profile?.website || '—'}" → "${form?.website || '—'}"`);
      if (JSON.stringify(form?.shifts) !== JSON.stringify(profile?.shifts)) {
        const initShifts = profile?.shifts ?? [];
        const newShifts = form?.shifts ?? [];
        initShifts.forEach((s, i) => {
          const ns = newShifts[i];
          if (!ns) changes.push(`Shift "${s.name}" removed`);
          else if (ns.name !== s.name || ns.start_time !== s.start_time || ns.end_time !== s.end_time)
            changes.push(`Shift "${s.name}": ${s.start_time}-${s.end_time} → ${ns.start_time}-${ns.end_time}`);
        });
        newShifts.slice(initShifts.length).forEach((s) => {
          changes.push(`New shift "${s.name}" (${s.start_time}-${s.end_time})`);
        });
      }
      return changes.length > 0 ? changes.slice(0, 6).join("\n• ") : "Changes detected";
    }

    if (tab === "wings") {
      const changes: string[] = [];
      wingEditors.forEach((w) => {
        if (!w.id && w.name) {
          const assigned = w.classIds.map((id) => allClassOptions.find((c: any) => c.id === id)?.name).filter(Boolean);
          changes.push(`New wing "${w.name}" (${assigned.length > 0 ? assigned.join(", ") : "no classes"})`);
        }
      });
      wingEditors.forEach((w) => {
        if (!w.id) return;
        const initWing = initialWingEditors.find((iw) => iw.id === w.id);
        if (!initWing) return;
        if (initWing.name !== w.name) changes.push(`Wing "${initWing.name}" → "${w.name}"`);
        const removedIds = initWing.classIds.filter((id) => !w.classIds.includes(id));
        const addedIds = w.classIds.filter((id) => !initWing.classIds.includes(id));
        removedIds.forEach((id) => {
          const cls = allClassOptions.find((c: any) => c.id === id);
          if (cls) changes.push(`"${cls.name}" moved out of ${w.name}`);
        });
        addedIds.forEach((id) => {
          const cls = allClassOptions.find((c: any) => c.id === id);
          if (cls) changes.push(`"${cls.name}" moved into ${w.name}`);
        });
        if (initWing.coordinator_id !== w.coordinator_id) {
          if (w.coordinator_name) changes.push(`Coordinator: "— → ${w.coordinator_name}"`);
          else changes.push(`Coordinator removed from ${w.name}`);
        }
      });
      return changes.length > 0 ? changes.slice(0, 6).join("\n• ") : "Wing settings changed";
    }

    if (tab === "houses") {
      const changes: string[] = [];
      houses.forEach((h, i) => {
        const def = DEFAULT_HOUSES[i];
        if (h.name !== def.name) changes.push(`House: "${def.name}" → "${h.name}"`);
        if (h.incharge_id !== def.incharge_id) {
          if (h.incharge_name) changes.push(`${h.name} incharge: ${h.incharge_name}`);
          else changes.push(`${h.name} incharge: removed`);
        }
        if (h.emblem_url !== def.emblem_url) {
          if (h.emblem_url) changes.push(`${h.name}: emblem uploaded`);
          else changes.push(`${h.name}: emblem removed`);
        }
      });
      return changes.length > 0 ? changes.join("\n• ") : "House settings changed";
    }

    if (tab === "subjects") {
      return "Subject assignments modified";
    }

    return "Changes detected";
  };

  // ── School Profile save ─────────────────────────────────────
  const startEdit = () => { setForm(profile); setErrors({}); setEditing(true); };
  const cancelEdit = () => { setForm(profile); setErrors({}); setEditing(false); };
  const set = <K extends keyof SchoolProfile>(k: K, v: SchoolProfile[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const saveSchoolProfile = async () => {
    if (!form) return;
    setErrors({}); setSaving(true);
    const updateData: Record<string, unknown> = {};
    (Object.keys(form) as (keyof SchoolProfile)[]).forEach((k) => {
      if (!SUPER_ADMIN_LOCKED.includes(k)) updateData[k] = form[k];
    });
    const { error } = await supabase.from("schools").update(updateData).eq("id", school.id);
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    setProfile({ ...form });
    setEditing(false);
    clearDirty("profile");
    await refresh();
    toast({ title: "School profile updated" });
  };

  // ── Session & Classes save ───────────────────────────────────
  const saveSession = async (
    data: SessionStepData,
    deletions?: { classIds: string[]; sectionIds: string[] },
  ) => {
    if (!school) return;

    // Auto-get or create current session
    let { data: sess } = await supabase
      .from("academic_sessions").select("id, academic_year").eq("school_id", school.id).eq("is_current", true).maybeSingle();

    // Auto-create if none exists
    if (!sess) {
      const academicYear = data.academic_year || getCurrentAcademicYear();
      const { start, end } = getAcademicYearDates(academicYear);
      const { data: newSess, error } = await supabase
        .from("academic_sessions")
        .insert({ school_id: school.id, academic_year: academicYear, is_current: true, start_date: start, end_date: end })
        .select("id, academic_year").single();
      if (error || !newSess) {
        toast({ title: "Failed to create academic session", description: error?.message, variant: "destructive" });
        return;
      }
      sess = newSess;
    }

    // Delete classes/sections explicitly removed by the editor.
    // - Uses explicit id lists from the editor (no "delete by difference" inference).
    // - Sections first (FK from sections.class_id → classes.id) so class delete
    //   doesn't hit a constraint violation. Sections of a removed class are
    //   included in sectionIds by the editor's deletion diff.
    // - Pre-cleanup required: 3 tables have non-CASCADE FKs to sections.id
    //   (students=RESTRICT NOT NULL, staffs.assigned_section_id=NO ACTION nullable,
    //    staff_roles.section_id=NO ACTION NOT NULL). Without this, batch
    //   deletes hit FK violations (HTTP 409).
    const sectionIdsToDelete = deletions?.sectionIds ?? [];
    const classIdsToDelete = deletions?.classIds ?? [];
    if (sectionIdsToDelete.length > 0) {
      // 1) Pre-flight: block if students enrolled in these sections.
      //    students.section_id is NOT NULL + RESTRICT FK → cannot cascade/null.
      const { count: studentCount, error: stuCountErr } = await supabase
        .from("students")
        .select("id", { count: "exact", head: true })
        .eq("school_id", school.id)
        .in("section_id", sectionIdsToDelete);
      if (stuCountErr) throw stuCountErr;
      if ((studentCount ?? 0) > 0) {
        toast({
          title: "Cannot delete — students enrolled",
          description: `${studentCount} student${studentCount === 1 ? "" : "s"} enrolled in these sections. Reassign or remove them first.`,
          variant: "destructive",
        });
        return; // abort save, no DB changes
      }

      // 2) Drop staff-role assignment rows pinned to these sections.
      //    staff_roles.section_id is NOT NULL with NO ACTION FK → must delete rows.
      //    (Mirrors the single-section delete pattern in SubjectAssignmentGrid.tsx.)
      const { error: srErr } = await supabase
        .from("staff_roles")
        .delete()
        .eq("school_id", school.id)
        .in("section_id", sectionIdsToDelete);
      if (srErr) throw srErr;

      // 3) Null out staffs.assigned_section_id (column is nullable).
      const { error: staffErr } = await supabase
        .from("staffs")
        .update({ assigned_section_id: null })
        .eq("school_id", school.id)
        .in("assigned_section_id", sectionIdsToDelete);
      if (staffErr) throw staffErr;

      // 4) Sections delete — CASCADE handles attendance, class_teachers,
      //    section_subjects, subject_teachers, staff_coordinator_classes.
      const { error: secDelErr } = await supabase
        .from("sections")
        .delete()
        .eq("school_id", school.id)
        .in("id", sectionIdsToDelete);
      if (secDelErr) throw secDelErr;
    }
    if (classIdsToDelete.length > 0) {
      const { error: clsDelErr } = await supabase
        .from("classes")
        .delete()
        .eq("school_id", school.id)
        .in("id", classIdsToDelete);
      if (clsDelErr) throw clsDelErr;
    }

    // Persist academic year change
    const existingYear = sess.academic_year;
    if (existingYear && existingYear !== data.academic_year) {
      await supabase.from("academic_sessions").update({ academic_year: data.academic_year }).eq("id", sess.id);
    }

    for (let i = 0; i < data.classes.length; i++) {
      const c = data.classes[i] as any;
      // Diff-based class write.
      // - Editor owns: name, acronym, display_order, term_structure, start_date, end_date.
      // - Wings tab owns: wing, wing_id. Never written here.
      // - New class (no _id) → insert editor-owned cols only; wing_id defaults to NULL on DB.
      // - Existing class → fetch baseline, diff editor-owned cols, update only on change.
      const editorOwnedFields = {
        name: c.name,
        acronym: c.acronym || null,
        display_order: i,
        term_structure: c.term_structure,
        start_date: c.start_date || null,
        end_date: c.end_date || null,
      } as const;

      let classId: string;
      if (!c._id) {
        const newId = crypto.randomUUID();
        const { data: inserted, error: insErr } = await supabase
          .from("classes")
          .insert({
            id: newId,
            school_id: school.id,
            session_id: sess?.id,
            ...editorOwnedFields,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        if (!inserted) continue;
        classId = inserted.id;
      } else {
        const { data: existing, error: exErr } = await supabase
          .from("classes")
          .select("name, acronym, display_order, term_structure, start_date, end_date")
          .eq("id", c._id)
          .eq("school_id", school.id)
          .maybeSingle();
        if (exErr) throw exErr;

        if (existing) {
          const dirty = Object.entries(editorOwnedFields).some(
            ([k, v]) => (existing as any)[k] !== v,
          );
          if (dirty) {
            const { error: updErr } = await supabase
              .from("classes")
              .update(editorOwnedFields)
              .eq("id", c._id)
              .eq("school_id", school.id);
            if (updErr) throw updErr;
          }
        }
        classId = c._id;
      }
      for (let j = 0; j < c.sections.length; j++) {
        const sec = c.sections[j] as any;
        if (!sec._id) sec._id = crypto.randomUUID();
        const { error: secErr } = await supabase.from("sections").upsert({
          id: sec._id, school_id: school.id, class_id: classId, session_id: sess?.id,
          name: sec.name, acronym: sec.acronym || null, display_order: j,
          stream: sec.stream ?? null,
        }, { onConflict: "id" });
        if (secErr) throw secErr;
      }
    }
    clearDirty("classes");
    toast({ title: "Classes & sections saved" });
    await fetchSessionData();
  };

  // ── Subjects save ─────────────────────────────────────────────
  const saveSubjects = async (data: SessionStepData) => {
    if (!school) return;
    const sessionId = currentSessionId;
    if (!sessionId) {
      toast({ title: "No academic session found", variant: "destructive" });
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const actorId = userData.user?.id;

    for (const cls of data.classes) {
      for (const sec of (cls as any).sections) {
        if (!sec._id) continue;
        await supabase.from("section_subjects").delete().eq("section_id", sec._id);
        if (sec.subjects.length > 0) {
          await supabase.from("section_subjects").insert(
            sec.subjects.map((sub: any) => ({
              section_id: sec._id, school_id: school.id,
              subject_name: sub.name, subject_code: sub.code,
              stream: sub.stream ?? null, is_active: true,
            }))
          );
        }

        // Save Class Teacher assignment
        if (sec.classTeacher?.staff_profile_id) {
          await supabase.from("staff_roles").upsert({
            school_id: school.id,
            academic_year_id: sessionId,
            class_id: cls._id,
            section_id: sec._id,
            staff_id: sec.classTeacher.staff_profile_id,
            role_type: "class_teacher",
            subject_id: null,
            assigned_by: actorId,
          }, { onConflict: "section_id" });
        } else {
          await supabase.from("staff_roles").delete()
            .eq("section_id", sec._id).eq("school_id", school.id).eq("role_type", "class_teacher");
        }

        // Save Subject Teacher assignments
        await supabase.from("subject_teachers").delete()
          .eq("section_id", sec._id).eq("school_id", school.id);
        if (sec.subjectTeachers?.length) {
          await supabase.from("subject_teachers").insert(
            sec.subjectTeachers.map((t: any) => ({
              school_id: school.id,
              academic_year_id: sessionId,
              class_id: cls._id,
              section_id: sec._id,
              subject_name: t.subject_name,
              subject_code: t.subject_code ?? null,
              staff_profile_id: t.staff_profile_id,
              assigned_by: actorId,
            }))
          );
        }
      }
    }
    clearDirty("subjects");
    toast({ title: "Subjects saved" });
    await fetchSessionData();
  };

  // ── Wings & Houses save ─────────────────────────────────────
  const saveWings = async () => {
    if (!school) return;
    setWingSaving(true);
    try {
      for (const wing of wingEditors) {
        if (!wing.name.trim()) continue;
        if (wing.id) {
          await supabase.from("wings").update({ name: wing.name, coordinator_id: wing.coordinator_id ?? null }).eq("id", wing.id);
        } else {
          const { data: newWing } = await supabase.from("wings")
            .insert({ school_id: school.id, name: wing.name.trim(), coordinator_id: wing.coordinator_id ?? null }).select("id").single();
          if (newWing) {
            setWingEditors((prev) => prev.map((w) => w.id ? w : { ...w, id: (newWing as any).id }));
          }
        }
      }
      for (const wing of wingEditors) {
        if (!wing.id) continue;
        const { data: allClasses } = await supabase
          .from("classes").select("id, wing_id").eq("school_id", school.id);
        if (!allClasses) continue;
        for (const cls of allClasses) {
          const shouldBeInWing = wing.classIds.includes(cls.id);
          if (cls.wing_id === wing.id && !shouldBeInWing) {
            await supabase.from("classes").update({ wing_id: null }).eq("id", cls.id);
          } else if (cls.wing_id !== wing.id && shouldBeInWing) {
            await supabase.from("classes").update({ wing_id: wing.id }).eq("id", cls.id);
          }
        }
      }
      clearDirty("wings");
      toast({ title: "Wings saved" });
      await fetchWings();
    } finally {
      setWingSaving(false);
    }
  };

  // All classes from current session for wing assignment dropdown
  const allClassOptions = sessionData.classes.map((c: any) => ({ id: c._id, name: c.name }));

  if (!school) {
    return (
      <AppShell>
        <div className="rounded-xl border bg-card px-5 py-5 shadow-md">
          <CardHeader><CardTitle>No school linked</CardTitle><CardDescription>Your account isn't linked to a school yet.</CardDescription></CardHeader>
        </div>
      </AppShell>
    );
  }

  return (
    <SchoolPageContext.Provider value={{ dirtyTabsRef, requestNavigation }}>
      <AppShell>
      <div className="space-y-5 max-w-3xl">
        {/* Page header */}
        <div className="flex items-start justify-between gap-3">
          <div className="clay-page-header">
            <h1>{profile?.name || school.name}</h1>
            <p>School profile</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
            <TabsTrigger value="profile">School Profile</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="wings">Wings</TabsTrigger>
            <TabsTrigger value="houses">Houses</TabsTrigger>
            {canEdit && <TabsTrigger value="departments">Departments</TabsTrigger>}
          </TabsList>

          {/* ──────────────────────────────────────────── Tab 1: School Profile ── */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            {/* School Information — locked */}
            <div className="rounded-xl border bg-muted/30 px-5 py-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-base">School Information</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Fields set by Super Admin — contact Super Admin to request changes.</p>
              {loading || !profile ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <Info label="School Name" value={profile.name} />
                  <Info label="Acronym" value={profile.acronym} />
                  <Info label="Address" value={profile.address} className="sm:col-span-2" />
                  <Info label="Postal Code" value={profile.postal_code} />
                  <Info label="Country" value={profile.country} />
                  <Info label="City" value={profile.city} />
                  <Info label="State" value={profile.state} />
                  <Info label="Academic Board" value={profile.board} />
                  <Info label="School Type" value={profile.school_type} />
                  <Info label="Emblem">
                    {profile.emblem_url ? (
                      <img src={profile.emblem_url} alt="emblem" loading="lazy" decoding="async" className="h-10 w-10 rounded-lg object-contain" />
                    ) : "—"}
                  </Info>
                  <Info label="Principal Name" value={profile.principal_name} className="sm:col-span-2" />
                  <Info label="Principal Email" value={profile.principal_email} />
                  <Info label="Principal Mobile" value={profile.principal_mobile} />
                </dl>
              )}
            </div>

            {/* School Contacts + Shifts — editable */}
            <div className="rounded-xl border bg-card px-5 py-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-semibold text-base">Contacts &amp; Shifts</h2>
                  <p className="text-sm text-muted-foreground">Editable by Principal.</p>
                </div>
                {canEdit && !editing && (
                  <Button size="sm" variant="outline" onClick={startEdit} className="cursor-pointer">
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                )}
              </div>

              {loading || !profile || !form ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : !editing ? (
                <div className="space-y-4">
                  <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <Info label="Contact Phone" value={profile.contact_phone} />
                    <Info label="Contact Email" value={profile.contact_email} />
                    <Info label="Alt. Contact" value={profile.alt_contact_phone ?? "—"} />
                    <Info label="Website" value={profile.website ?? "—"} />
                  </dl>
                  {profile.shifts && profile.shifts.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Shifts</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.shifts.map((s, i) => (
                          <span key={i} className="text-xs border rounded-lg px-2 py-1 bg-muted/30">
                            {s.name} ({s.start_time}–{s.end_time})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FieldEdit label="Contact Phone" error={errors.contact_phone}>
                      <Input value={form.contact_phone ?? ""} onChange={(e) => { set("contact_phone", e.target.value); markDirty("profile"); }} className="clay-input" placeholder="9876543210" />
                    </FieldEdit>
                    <FieldEdit label="Contact Email" error={errors.contact_email}>
                      <Input type="email" value={form.contact_email ?? ""} onChange={(e) => { set("contact_email", e.target.value); markDirty("profile"); }} className="clay-input" placeholder="info@school.edu.in" />
                    </FieldEdit>
                    <FieldEdit label="Alt. Contact Phone" error={errors.alt_contact_phone}>
                      <Input value={form.alt_contact_phone ?? ""} onChange={(e) => { set("alt_contact_phone", e.target.value); markDirty("profile"); }} className="clay-input" placeholder="9876543210" />
                    </FieldEdit>
                    <FieldEdit label="Website" error={errors.website}>
                      <Input value={form.website ?? ""} onChange={(e) => { set("website", e.target.value); markDirty("profile"); }} className="clay-input" placeholder="https://..." />
                    </FieldEdit>
                  </div>

                  {/* Shifts editor */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Shifts</Label>
                    <div className="space-y-2">
                      {(form.shifts ?? []).map((shift, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <Input
                            value={shift.name}
                            onChange={(e) => {
                              const updated = [...(form.shifts ?? [])];
                              updated[i] = { ...updated[i], name: e.target.value };
                              set("shifts", updated);
                              markDirty("profile");
                            }}
                            className="clay-input flex-1" placeholder="Shift name"
                          />
                          <Input type="time" value={shift.start_time}
                            onChange={(e) => {
                              const updated = [...(form.shifts ?? [])];
                              updated[i] = { ...updated[i], start_time: e.target.value };
                              set("shifts", updated);
                              markDirty("profile");
                            }}
                            className="clay-input w-28"
                          />
                          <Input type="time" value={shift.end_time}
                            onChange={(e) => {
                              const updated = [...(form.shifts ?? [])];
                              updated[i] = { ...updated[i], end_time: e.target.value };
                              set("shifts", updated);
                              markDirty("profile");
                            }}
                            className="clay-input w-28"
                          />
                          <Button variant="ghost" size="sm"
                            onClick={() => { set("shifts", (form.shifts ?? []).filter((_, j) => j !== i)); markDirty("profile"); }}
                            className="cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm"
                        onClick={() => { set("shifts", [...(form.shifts ?? []), { name: "", start_time: "", end_time: "" }]); markDirty("profile"); }}
                        className="cursor-pointer"
                      >
                        <Plus className="h-4 w-4" /> Add Shift
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={cancelEdit} disabled={saving} className="cursor-pointer">
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={saveSchoolProfile} disabled={saving} className="cursor-pointer">
                      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save</>}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ──────────────────────────────────────────────── Tab 2: Classes ── */}
          <TabsContent value="classes" className="mt-4">
            {sessionLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading classes…
              </div>
            ) : (
              <ClassesTab
                ref={classesTabRef}
                initialData={sessionData}
                data={sessionData}
                onChange={(d) => { setSessionData(d); markDirty("classes"); }}
                onSave={saveSession}
                schoolId={school.id}
                isOnboarding={false}
                onDirtyChange={(d) => d ? markDirty("classes") : clearDirty("classes")}
              />
            )}
          </TabsContent>

          {/* ──────────────────────────────────────────────── Tab 3: Sessions ── */}
          <TabsContent value="sessions" className="mt-4">
            {sessionLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
              </div>
            ) : (
              <SessionsStep
                ref={sessionsTabRef}
                initialData={sessionData}
                data={sessionData}
                onChange={(d) => { setSessionData(d); markDirty("sessions"); }}
                onSave={saveSession}
                onSaved={fetchSessionData}
                schoolId={school.id}
                academicYearId={currentSessionId ?? undefined}
                onDirtyChange={(dirty) => dirty ? markDirty("sessions") : clearDirty("sessions")}
              />
            )}
          </TabsContent>

          {/* ──────────────────────────────────────────────────── Tab 4: Subjects ── */}
          <TabsContent value="subjects" className="mt-4">
            <SubjectTab
              schoolId={school.id}
              academicYearId={currentSessionId ?? undefined}
            />
          </TabsContent>

          {/* ──────────────────────────────────────────── Tab 5: Wings ── */}
          <TabsContent value="wings" className="mt-4 space-y-5">
            <WingsTab
              ref={wingsTabRef}
              schoolId={school?.id ?? ""}
              canEdit={canEdit}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              onDirtyChange={(isDirty) => isDirty ? markDirty("wings") : clearDirty("wings")}
            />
          </TabsContent>

          {/* ──────────────────────────────────────────── Tab 6: Houses ── */}
          <TabsContent value="houses" className="mt-4 space-y-5">
            <HousesTab
              schoolId={school.id}
              canEdit={canEdit}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </TabsContent>

          {/* ──────────────────────────────────────── Tab 5: Departments ── */}
          <TabsContent value="departments" className="mt-4 space-y-4">
            <DepartmentsTab
              schoolId={school.id}
              canEdit={canEdit}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </TabsContent>
        </Tabs>

        {/* Unsaved changes confirmation */}
        <AlertDialog open={!!pendingTabSwitch} onOpenChange={(open) => { if (!open) setPendingTabSwitch(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes on this tab. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="default"
                onClick={async () => {
                  if (!pendingTabSwitch) return;
                  const tab = pendingTabSwitch.tab;
                  const sourceTab = activeTab; // tab that has dirty data

                  // Tabs that save internally on change — just close modal
                  const autoSaveTabs = ["houses", "departments", "subjects"];
                  if (autoSaveTabs.includes(sourceTab)) {
                    clearDirty(sourceTab);
                    setActiveTab(tab);
                    setPendingTabSwitch(null);
                    return;
                  }

                  try {
                    // Save the SOURCE (dirty) tab, not the target.
                    // Branch on sourceTab, not tab — otherwise data is lost.
                    if (sourceTab === "wings") {
                      await wingsTabRef.current?.save();
                    } else if (sourceTab === "classes") {
                      await classesTabRef.current?.save();
                    } else if (sourceTab === "sessions") {
                      const result = await sessionsTabRef.current?.save();
                      if (result && !result.ok) {
                        toast({
                          title: "Failed to save changes",
                          description: result.error || "Please try again.",
                          variant: "destructive",
                        });
                        return; // keep modal open, do NOT switch tabs
                      }
                      toast({ title: "Sessions saved", description: "Session dates and term structure updated." });
                    } else if (sourceTab === "profile") {
                      await saveSchoolProfile();
                    }
                    clearDirty(sourceTab);
                    setActiveTab(tab);
                    setPendingTabSwitch(null);
                  } catch {
                    toast.error("Failed to save changes. Please try again.");
                  }
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setPendingTabSwitch(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  // Reset child edit state so localWings/isEditing are cleared
                  // when the user discards via the modal (not just the in-tab button).
                  if (activeTab === "wings") {
                    wingsTabRef.current?.discard();
                  } else if (activeTab === "classes") {
                    classesTabRef.current?.discard?.();
                  } else if (activeTab === "sessions") {
                    sessionsTabRef.current?.discard?.();
                  }
                  confirmTabSwitch();
                  toast({ title: "Changes discarded", description: "Your changes were not saved." });
                }}
              >
                Discard
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* Page-level navigation confirmation */}
        <AlertDialog open={!!pendingNavTarget} onOpenChange={(open) => { if (!open) { setPendingNavTarget(null); } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. What would you like to do?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="default"
                onClick={async () => {
                  const currentTab = activeTab;
                  const autoSaveTabs = ["houses", "departments", "subjects"];

                  if (autoSaveTabs.includes(currentTab)) {
                    clearDirty(currentTab);
                    setPendingNavTarget(null);
                    if (pendingNavTarget) navigate(pendingNavTarget);
                    return;
                  }

                  try {
                    if (currentTab === "wings") {
                      await wingsTabRef.current?.save();
                    } else if (currentTab === "classes") {
                      await classesTabRef.current?.save();
                    } else if (currentTab === "sessions") {
                      const result = await sessionsTabRef.current?.save();
                      if (result && !result.ok) {
                        toast({
                          title: "Failed to save changes",
                          description: result.error || "Please try again.",
                          variant: "destructive",
                        });
                        return; // keep modal open, do NOT navigate
                      }
                      toast({ title: "Sessions saved", description: "Session dates and term structure updated." });
                    } else if (currentTab === "profile") {
                      await saveSchoolProfile();
                    }
                    clearDirty(currentTab);
                    setPendingNavTarget(null);
                    if (pendingNavTarget) navigate(pendingNavTarget);
                  } catch {
                    toast.error("Failed to save changes. Please try again.");
                  }
                }}
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPendingNavTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  // Reset child edit state before navigating away.
                  if (activeTab === "wings") {
                    wingsTabRef.current?.discard();
                  } else if (activeTab === "classes") {
                    classesTabRef.current?.discard?.();
                  } else if (activeTab === "sessions") {
                    sessionsTabRef.current?.discard?.();
                  }
                  clearDirty(activeTab);
                  if (pendingNavTarget) navigate(pendingNavTarget);
                  setPendingNavTarget(null);
                  toast({ title: "Changes discarded", description: "Your changes were not saved." });
                }}
              >
                Discard
              </Button>
            </div>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </AppShell>
    </SchoolPageContext.Provider>
  );
}

function Info({ label, value, className, children }: { label: string; value?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={className}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">{(children ?? value) || <span className="text-muted-foreground font-normal">—</span>}</dd>
    </div>
  );
}

function FieldEdit({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className={error ? "text-destructive" : undefined}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

