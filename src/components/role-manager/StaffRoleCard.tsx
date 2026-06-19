// StaffRoleCard — Role Manager Staff Tab §3.1
//
// Card for one staff member. Pencil button enters edit mode; Save persists
// all changed fields in a single batch via the various `add*` / `remove*` /
// `update*` query helpers. After Save, exits edit mode and re-fetches roles.
//
// 2026-06-13 fix: SubjectPickerModal onPick consumer builds the draft label
// from the picker payload directly (`className sectionName — subjectName`)
// rather than looking it up in `roles.subject_teachers`. The latter was the
// source of the "Class 9 - ?" label bug for new drafts.
//
// See docs/ROLE_MANAGER.md §3.1.2(f) and §2026-06-13 Patch for full context.

import { useState, useEffect, useMemo } from "react";
import { Loader2, Pencil, Save, X, Plus, AlertCircle, ChevronDown, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";
import {
  getWingsForSchool, getClassesForSchool, getSectionsForClass,
  getDepartmentsForSchool, getHousesForSchool, getCurrentAcademicYear,
  getClassTeacherConflict, getAutoAssignedWingsForStaff,
  type StaffAllRoles, type WingOption, type ClassOption, type SectionOption,
  type DepartmentOption, type HouseOption,
} from "@/integrations/supabase/queries/roleAssignments";
import { useStaffRoles, useSaveStaffRoles } from "@/hooks/useRoleManagerQueries";
import { SubjectPickerModal } from "./SubjectPickerModal";
import { MasterAdminConfirmDialog } from "./MasterAdminConfirmDialog";
import { RoleField, deriveRole } from "./RoleField";
import { CoordinatorMultiSelect } from "./CoordinatorMultiSelect";
import { SectionGroup } from "./SectionGroup";

interface StaffRoleCardProps {
  staff: StaffWithDetails;
  schoolId: string;
  isOwnCard: boolean;
  canEdit: boolean;
  isPrincipal: boolean;
  isMasterAdmin: boolean;
  onRefresh: () => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
}

const TAG_TEMPLATES = ["Staff", "PGT English", "PGT Maths", "TGT Science", "PT", "Librarian", "Admin"];

export function StaffRoleCard({
  staff, schoolId, isOwnCard, canEdit, isPrincipal, isMasterAdmin, onRefresh, onDirtyChange,
}: StaffRoleCardProps) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";

  // ============== Data (TanStack Query) ==============
  // Single source of truth for this staff's full role payload. The save
  // mutation invalidates this key on success, and also invalidates the
  // staff-list key (parent directory) and every other card's roles for
  // the same school — so cross-staff class-teacher reassigns update all
  // visible cards in lockstep. See useRoleManagerQueries.ts.
  const { data: roles, isLoading: loading } = useStaffRoles(staff.id, schoolId);
  const saveMutation = useSaveStaffRoles(schoolId);
  const saving = saveMutation.isPending;

  // ============== State ==============
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Local draft state for edits
  const [draftTag, setDraftTag] = useState("");
  const [draftIsMasterAdmin, setDraftIsMasterAdmin] = useState(false);
  const [draftIsAdmin, setDraftIsAdmin] = useState(false);
  const [draftRole, setDraftRole] = useState("teacher");
  const [draftStatus, setDraftStatus] = useState("active");
  const [draftCoordinatorWingIds, setDraftCoordinatorWingIds] = useState<string[]>([]);
  const [draftClassTeachers, setDraftClassTeachers] = useState<Array<{ id: string; classId: string; sectionId: string; className: string; sectionName: string }>>([]);
  const [draftSubjectTeachers, setDraftSubjectTeachers] = useState<Array<{ id: string; classId: string; sectionId: string; subjectId: string; className?: string; sectionName?: string; subjectName?: string; label: string }>>([]);
  const [draftDeptMemberIds, setDraftDeptMemberIds] = useState<string[]>([]);
  const [draftDeptInchargeIds, setDraftDeptInchargeIds] = useState<string[]>([]);
  const [draftHouse, setDraftHouse] = useState<string>("");

  // Lookup data for edit mode
  const [wings, setWings] = useState<WingOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [houses, setHouses] = useState<HouseOption[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [autoAssignedWingIds, setAutoAssignedWingIds] = useState<string[]>([]);

  // Picker state
  const [ctClassId, setCtClassId] = useState("");
  const [ctSectionId, setCtSectionId] = useState("");
  const [ctSections, setCtSections] = useState<SectionOption[]>([]);
  const [ctConflict, setCtConflict] = useState<{ id: string; name: string } | null>(null);
  const [pendingCt, setPendingCt] = useState<{ classId: string; sectionId: string; className: string; sectionName: string } | null>(null);

  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);

  const [confirmMasterAdmin, setConfirmMasterAdmin] = useState<{ value: boolean } | null>(null);

  // ============== Effects ==============

  // Re-seed the draft whenever the roles payload changes (initial load,
  // post-save invalidation, or external change). Only run when not
  // editing — otherwise the user's in-flight edits would be clobbered.
  useEffect(() => {
    if (roles && !editing) {
      seedDraft(roles);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [roles]);

  const seedDraft = (r: StaffAllRoles) => {
    setDraftTag(r.messenger_tag ?? "");
    setDraftIsMasterAdmin(r.is_master_admin);
    setDraftIsAdmin(r.is_admin);
    setDraftRole(r.role);
    setDraftStatus(r.status);
    // Coordinator (wings) — current data is single, but model as array
    setDraftCoordinatorWingIds(r.coordinator_wings.map((c) => c.wing_id));
    setDraftClassTeachers(r.class_teachers.map((c) => ({
      id: c.id, classId: c.class_id, sectionId: c.section_id,
      className: c.class_name, sectionName: c.section_name,
    })));
    setDraftSubjectTeachers(r.subject_teachers.map((s) => ({
      id: s.id, classId: s.class_id, sectionId: s.section_id, subjectId: s.subject_id, label: s.label,
    })));
    // Departments — split into member + incharge lists
    // Cascade: an incharge row also implies membership, so seed both lists to
    // include every incharge dept. The incharge-also-member row will render
    // as incharge only (crown wins) in the UI.
    setDraftDeptMemberIds(r.departments.map((d) => d.department_id));
    setDraftDeptInchargeIds(r.departments.filter((d) => d.is_incharge).map((d) => d.department_id));
    setDraftHouse(r.house?.house_name ?? "");
  };

  // Compute dirty state
  const dirty = useMemo(() => {
    if (!roles) return false;
    const origCoordWingIds = roles.coordinator_wings.map((c) => c.wing_id);
    const origDeptMemberIds = roles.departments.map((d) => d.department_id);
    const origDeptInchargeIds = roles.departments.filter((d) => d.is_incharge).map((d) => d.department_id);
    const sameArr = (a: string[], b: string[]) =>
      a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);
    return (
      (draftTag || "") !== (roles.messenger_tag || "") ||
      draftIsMasterAdmin !== roles.is_master_admin ||
      draftIsAdmin !== roles.is_admin ||
      draftRole !== roles.role ||
      draftStatus !== roles.status ||
      draftHouse !== (roles.house?.house_name ?? "") ||
      !sameArr(draftCoordinatorWingIds, origCoordWingIds) ||
      JSON.stringify(draftClassTeachers.map(({ id, ...rest }) => rest)) !== JSON.stringify(roles.class_teachers.map(({ id, ...rest }) => rest)) ||
      JSON.stringify(draftSubjectTeachers.map(({ id, ...rest }) => rest)) !== JSON.stringify(roles.subject_teachers.map(({ id, ...rest }) => rest)) ||
      !sameArr(draftDeptMemberIds, origDeptMemberIds) ||
      !sameArr(draftDeptInchargeIds, origDeptInchargeIds)
    );
  }, [roles, draftTag, draftIsMasterAdmin, draftIsAdmin, draftRole, draftStatus, draftHouse, draftCoordinatorWingIds, draftClassTeachers, draftSubjectTeachers, draftDeptMemberIds, draftDeptInchargeIds]);

  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  // Enter edit mode — load lookups
  const enterEdit = async () => {
    if (isOwnCard || !canEdit) return;
    setEditing(true);
    if (wings.length === 0 && schoolId) {
      const [w, c, d, h, ay] = await Promise.all([
        getWingsForSchool(schoolId),
        getClassesForSchool(schoolId),
        getDepartmentsForSchool(schoolId),
        getHousesForSchool(schoolId),
        getCurrentAcademicYear(schoolId),
      ]);
      setWings(w); setClasses(c); setDepartments(d); setHouses(h); setAcademicYearId(ay);
    }
    // Load auto-assigned wings to protect them in the dropdown
    if (schoolId) {
      const autoWings = await getAutoAssignedWingsForStaff(staff.id, schoolId);
      setAutoAssignedWingIds(autoWings);
    }
  };

  const cancelEdit = () => {
    if (roles) seedDraft(roles);
    setEditing(false);
  };

  // ============== Save ==============

  const save = async () => {
    if (!roles || !user || !schoolId) {
      if (!schoolId) {
        toast.error("School context missing — refresh and retry");
      }
      return;
    }
    try {
      await saveMutation.mutateAsync({
        staffId: staff.id,
        schoolId,
        currentUserId,
        academicYearId,
        draft: {
          tag: draftTag,
          isMasterAdmin: draftIsMasterAdmin,
          isAdmin: draftIsAdmin,
          role: draftRole,
          status: draftStatus,
          house: draftHouse,
          coordinatorWingIds: draftCoordinatorWingIds,
          classTeachers: draftClassTeachers,
          subjectTeachers: draftSubjectTeachers,
          deptMemberIds: draftDeptMemberIds,
          deptInchargeIds: draftDeptInchargeIds,
        },
        original: roles,
      });
      // Reload auto-assigned wings after save so the dropdown reflects new
      // CT/ST changes. The roles payload itself is refreshed by the
      // mutation's onSuccess invalidation.
      if (schoolId) {
        const autoWings = await getAutoAssignedWingsForStaff(staff.id, schoolId);
        setAutoAssignedWingIds(autoWings);
      }
      setEditing(false);
      toast.success("Changes saved");
    } catch (e: any) {
      toast.error(`Save failed: ${e?.message ?? "unknown"}`);
    }
  };

  // ============== Derived UI values ==============

  const initials = staff.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const editable = !isOwnCard && canEdit;

  // Live role — when editing, derive from draft state so the pill flips
  // immediately as the user adds/removes assignments. Per ROLE_MANAGER.md
  // §3.1.2(c): "Computed every render from current assignments".
  // Outside edit mode, fall back to the saved-state role.
  const liveRole = useMemo(() => {
    if (!roles) return null;
    if (!editing) return deriveRole(roles);
    const draftLike = {
      coordinator_wings: draftCoordinatorWingIds.map((wid) => ({ id: "", wing_id: wid, wing_name: "" })),
      class_teachers: draftClassTeachers.map((c) => ({
        id: c.id, class_id: c.classId, section_id: c.sectionId,
        class_name: c.className, section_name: c.sectionName,
      })),
      subject_teachers: draftSubjectTeachers.map((s) => ({
        id: s.id, class_id: s.classId, section_id: s.sectionId, subject_id: s.subjectId,
        class_name: "", section_name: "", subject_name: "", label: s.label,
      })),
      departments: draftDeptMemberIds.map((id) => {
        const dept = departments.find((d) => d.id === id);
        return {
          id, department_id: id, department_name: dept?.name ?? "",
          is_incharge: draftDeptInchargeIds.includes(id),
        };
      }),
      house: draftHouse ? { house_name: draftHouse } : null,
    };
    return deriveRole(draftLike);
  }, [roles, editing, draftCoordinatorWingIds, draftClassTeachers, draftSubjectTeachers, draftDeptMemberIds, draftDeptInchargeIds, draftHouse, departments]);

  // ============== Render ==============

  if (!roles) {
    // First load only — no cached data yet. After the first successful
    // fetch we keep the previous roles in the render path even while a
    // background refresh is in flight, so the card never flashes a
    // spinner on subsequent tab visits. The new data updates in place
    // when it arrives. Same pattern as Gmail / Notion.
    if (loading) {
      return (
        <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center h-40">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return null;
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* ===== Section 1: Identity (avatar + name + EMP + mobile + status + badges + tag) ===== */}
        <div className="flex items-center gap-3 p-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials || "?"}
          </div>

          {/* Name + meta */}
          <div className="min-w-0 flex-1 md:flex-none md:w-56 flex-shrink-0">
            <h3 className="font-semibold text-sm truncate">{staff.full_name}</h3>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {staff.employee_id ?? "—"}
              {staff.login_mobile ? ` · ${staff.login_mobile}` : ""}
            </p>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <Badge variant={roles.status === "active" ? "default" : "secondary"} className="text-xs">{roles.status}</Badge>
              {roles.is_master_admin && <Badge className="text-xs bg-amber-600">Master Admin</Badge>}
              {roles.is_admin && <Badge variant="outline" className="text-xs">Admin</Badge>}
              {roles.messenger_tag && <span className="text-xs text-muted-foreground truncate">{roles.messenger_tag}</span>}
            </div>
          </div>

          {/* Actions — Edit + Expand. Edit hidden for own card (self-assign guard). */}
          <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
            {editable && !editing && (
              <Button size="sm" variant="outline" onClick={enterEdit} title="Edit">
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              title={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* ===== Section 2: Role (auto-derived pill) ===== */}
        <div className="px-3 pb-2">
          <SectionGroup label="Role" accent="muted">
            <RoleField roles={roles} overrideRole={liveRole ?? undefined} />
          </SectionGroup>
        </div>

        {/* ===== Section 3: Academic Profile (coordinator / wings / CT / ST / house) ===== */}
        <AcademicProfile
          roles={roles}
          draftClassTeachers={draftClassTeachers}
          draftSubjectTeachers={draftSubjectTeachers}
          classes={classes}
          wings={wings}
          editing={editing}
        />

        {/* ===== Section 4: Non-Academic Profile (incharge + member depts) ===== */}
        <NonAcademicProfile roles={roles} />

        {/* DRAWER: 9 sections, 2-col grid, only visible when editing OR expanded */}
        {(editing || expanded) && (
          <div className="border-t px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {/* (a) Tag — full width, only when editing */}
            {editing && (
              <div className="md:col-span-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-28">Tag</span>
                <Input
                  value={draftTag}
                  onChange={(e) => setDraftTag(e.target.value)}
                  placeholder="Messenger tag"
                  className="h-7 text-xs flex-1 max-w-xs"
                  list={`tag-templates-${staff.id}`}
                />
                <datalist id={`tag-templates-${staff.id}`}>
                  {TAG_TEMPLATES.map((t) => <option key={t} value={t} />)}
                </datalist>
              </div>
            )}

            {/* (b) Master Admin */}
            {isPrincipal && !isOwnCard && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-28">Master Admin</span>
                {editing ? (
                  <>
                    <Switch
                      checked={draftIsMasterAdmin}
                      onCheckedChange={(v) => setConfirmMasterAdmin({ value: v })}
                    />
                    <span className="text-xs">{draftIsMasterAdmin ? "On" : "Off"}</span>
                  </>
                ) : (
                  <span className="text-xs">{roles.is_master_admin ? "On" : "Off"}</span>
                )}
              </div>
            )}

            {/* (c) Admin — disabled when Master Admin is on */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28">Admin</span>
              {editing ? (
                <>
                  <Switch
                    checked={draftIsAdmin}
                    onCheckedChange={(v) => setDraftIsAdmin(v)}
                    disabled={!editable || draftIsMasterAdmin}
                  />
                  <span className="text-xs">{draftIsAdmin ? "On" : "Off"}</span>
                  {draftIsMasterAdmin && (
                    <span className="text-[10px] text-muted-foreground italic">disabled (Master Admin covers)</span>
                  )}
                </>
              ) : (
                <span className="text-xs">{roles.is_admin ? "On" : "Off"}</span>
              )}
            </div>

            {/* (c) Role — auto-derived, read-only, no override */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28">Role</span>
              <RoleField roles={roles} showHint={editing} overrideRole={liveRole ?? undefined} />
            </div>

            {/* (e) Coordinator (Wing) — manual leadership role */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-28 pt-1.5">Coordinator</span>
              {editing ? (
                <div className="flex-1 space-y-1.5">
                  <CoordinatorMultiSelect
                    value={draftCoordinatorWingIds}
                    options={wings}
                    onChange={setDraftCoordinatorWingIds}
                    disabledWings={autoAssignedWingIds}
                  />
                  {draftCoordinatorWingIds.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {draftCoordinatorWingIds.map((wid) => {
                        const w = wings.find((x) => x.id === wid);
                        return (
                          <Badge key={wid} className="text-xs bg-purple-100 text-purple-800 border border-purple-200">
                            👑 {w?.name ?? "?"}
                            <button
                              onClick={() => setDraftCoordinatorWingIds(draftCoordinatorWingIds.filter((x) => x !== wid))}
                              className="ml-1"
                              title="Remove"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-1 flex-1">
                  {roles.coordinator_wings.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    roles.coordinator_wings.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        👑 {c.wing_name}
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* (e.5) Wings (auto-assigned from CT/ST) — read-only */}
            {/* 2026-06-18: live-merge saved auto_assigned_wings with a
                derived set from draft CT/ST assignments. When the user
                picks 12th B as Class Teacher, Senior wing appears in this
                row instantly — no Save needed. Saved-but-not-yet-saved-
                again CT/ST rows remain covered by roles.auto_assigned_wings
                (re-fetched on save). */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-28 pt-1.5">Wings</span>
              {(() => {
                const coordWingIds = new Set(
                  roles.coordinator_wings.map((c) => c.wing_id)
                );

                // 1. Saved auto wings (post-save truth).
                const merged = new Map<string, { id: string; name: string; source: "auto" | "manual" }>();
                for (const w of roles.auto_assigned_wings ?? []) {
                  if (!coordWingIds.has(w.id)) merged.set(w.id, { ...w, source: "auto" });
                }
                // 2. Manual teacher wings (Wings tab "Add Teacher").
                for (const w of roles.manual_teacher_wings ?? []) {
                  if (!coordWingIds.has(w.id) && !merged.has(w.id)) {
                    merged.set(w.id, { ...w, source: "manual" });
                  }
                }

                if (editing) {
                  // 3. Draft-only wings: union wing_ids of draft CT + ST
                  //    classes that are not already in saved set.
                  const classWingByClassId = new Map<string, string | null>();
                  for (const c of classes) classWingByClassId.set(c.id, c.wing_id);
                  const draftClassIds = new Set<string>([
                    ...draftClassTeachers.map((c) => c.classId),
                    ...draftSubjectTeachers.map((s) => s.classId),
                  ]);
                  for (const classId of draftClassIds) {
                    const wingId = classWingByClassId.get(classId);
                    if (!wingId || coordWingIds.has(wingId)) continue;
                    if (merged.has(wingId)) continue;
                    const w = wings.find((x) => x.id === wingId);
                    if (w) merged.set(wingId, { id: w.id, name: w.name, source: "auto" });
                  }
                }

                if (merged.size === 0) {
                  return <span className="text-xs flex-1 text-muted-foreground">—</span>;
                }
                return (
                  <div className="flex flex-wrap gap-1 flex-1">
                    {Array.from(merged.values()).map((w) =>
                      w.source === "manual" ? (
                        <span
                          key={w.id}
                          className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-1"
                          title="Manual teacher assignment — remove via Wings tab"
                        >
                          {w.name}
                        </span>
                      ) : (
                        <span
                          key={w.id}
                          className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 inline-flex items-center gap-1"
                          title="Auto-assigned from class teacher / subject teacher — remove via Class Teacher or Subject Teacher"
                        >
                          <Lock className="h-3 w-3" />
                          {w.name}
                        </span>
                      )
                    )}
                  </div>
                );
              })()}
            </div>

            {/* (f) Class Teacher */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-28 pt-1">Class Teacher</span>
              {editing ? (
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={ctClassId || classes[0]?.id || ""} onValueChange={async (v) => {
                      setCtClassId(v);
                      const secs = await getSectionsForClass(v);
                      setCtSections(secs);
                      setCtSectionId("");
                    }}>
                      <SelectTrigger className="h-7 w-32 text-xs"><SelectValue placeholder="Class" /></SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={ctSectionId} onValueChange={setCtSectionId} disabled={ctSections.length === 0}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue placeholder="Section" /></SelectTrigger>
                      <SelectContent>
                        {ctSections.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={async () => {
                      const cid = ctClassId || classes[0]?.id;
                      if (!cid || !ctSectionId) return;
                      const cls = classes.find((c) => c.id === cid);
                      const sec = ctSections.find((s) => s.id === ctSectionId);
                      if (draftClassTeachers.some((c) => c.classId === cid && c.sectionId === ctSectionId)) {
                        toast.error("Already added to this class-section");
                        return;
                      }
                      const conflict = await getClassTeacherConflict(cid, ctSectionId, schoolId);
                      if (conflict && conflict.staff_profile_id !== staff.id) {
                        setCtConflict({ id: conflict.staff_profile_id, name: (conflict.profiles as any)?.full_name ?? "Unknown" });
                        setPendingCt({ classId: cid, sectionId: ctSectionId, className: cls?.name ?? "?", sectionName: sec?.name ?? "?" });
                        return;
                      }
                      setDraftClassTeachers([...draftClassTeachers, { id: `new-${Date.now()}`, classId: cid, sectionId: ctSectionId, className: cls?.name ?? "?", sectionName: sec?.name ?? "?" }]);
                      setCtSectionId("");
                    }} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />Add
                    </Button>
                  </div>
                  {ctConflict && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-300 rounded text-xs">
                      <AlertCircle className="h-3 w-3 text-amber-700" />
                      <span className="flex-1">{ctConflict.name} is currently Class Teacher. Replace?</span>
                      <Button size="sm" variant="ghost" onClick={() => { setCtConflict(null); setPendingCt(null); }}>Cancel</Button>
                      <Button size="sm" onClick={() => {
                        if (pendingCt) {
                          setDraftClassTeachers([...draftClassTeachers, { id: `new-${Date.now()}`, ...pendingCt }]);
                        }
                        setCtConflict(null); setPendingCt(null); setCtSectionId("");
                      }}>Replace</Button>
                    </div>
                  )}
                  {draftClassTeachers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {draftClassTeachers.map((c) => (
                        <Badge key={c.id} variant="secondary" className="text-xs">
                          ✓ {c.className} {c.sectionName}
                          <button onClick={() => setDraftClassTeachers(draftClassTeachers.filter((x) => x.id !== c.id))} className="ml-1">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs flex-1">
                  {roles.class_teachers.length > 0
                    ? roles.class_teachers.map((c) => `${c.class_name} ${c.section_name}`).join(", ")
                    : "—"}
                </span>
              )}
            </div>

            {/* (g) Subject Teacher */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-28 pt-1">Subject Teacher</span>
              {editing ? (
                <div className="flex-1 space-y-1">
                  <Button size="sm" variant="outline" onClick={() => setSubjectPickerOpen(true)} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />Add Subject
                  </Button>
                  {draftSubjectTeachers.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {draftSubjectTeachers.map((s) => (
                        <Badge key={s.id} variant="secondary" className="text-xs">
                          ✓ {s.label}
                          <button onClick={() => setDraftSubjectTeachers(draftSubjectTeachers.filter((x) => x.id !== s.id))} className="ml-1">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-xs flex-1">
                  {roles.subject_teachers.length > 0
                    ? roles.subject_teachers.map((s) => s.label).join(", ")
                    : "—"}
                </span>
              )}
            </div>

            {/* (h) Department — two independent dropdowns: Member + Incharge */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-28 pt-1.5">Department</span>
              {editing ? (
                <div className="flex-1 space-y-2">
                  {/* Department Member dropdown */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-20">Member</span>
                    <Select
                      value=""
                      onValueChange={(v) => {
                        if (!v) return;
                        // Use functional update to avoid closure staleness.
                        setDraftDeptMemberIds((prev) => Array.from(new Set([...prev, v])));
                      }}
                    >
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="+ Add member" /></SelectTrigger>
                      <SelectContent>
                        {departments
                          .filter((d) => !draftDeptMemberIds.includes(d.id) && !draftDeptInchargeIds.includes(d.id))
                          .map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Department Incharge dropdown */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-20">Incharge</span>
                    <Select
                      value=""
                      onValueChange={(v) => {
                        if (!v) return;
                        // Use functional updates so both setStates see the post-previous-update value.
                        // Adding as incharge also auto-adds to memberIds (cascade in UI for clarity).
                        setDraftDeptInchargeIds((prev) => Array.from(new Set([...prev, v])));
                        setDraftDeptMemberIds((prev) => Array.from(new Set([...prev, v])));
                      }}
                    >
                      <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="+ Add incharge" /></SelectTrigger>
                      <SelectContent>
                        {departments
                          .filter((d) => !draftDeptInchargeIds.includes(d.id))
                          .map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Department badges — single render, incharge crown wins, no duplicates */}
                  {(() => {
                    // Build the effective member set. Incharge implies member, so any
                    // dept in inchargeIds is also implicitly a member.
                    const effectiveMemberIds = Array.from(new Set([...draftDeptMemberIds, ...draftDeptInchargeIds]));
                    // If a dept is in both lists, it renders once as incharge.
                    // If in incharge only (shouldn't happen, but defensive), render as incharge.
                    // If in member only, render as member.
                    const badges: Array<{ id: string; kind: "incharge" | "member" }> = [];
                    const seen = new Set<string>();
                    for (const id of draftDeptInchargeIds) {
                      if (!seen.has(id)) { badges.push({ id, kind: "incharge" }); seen.add(id); }
                    }
                    for (const id of effectiveMemberIds) {
                      if (!seen.has(id)) { badges.push({ id, kind: "member" }); seen.add(id); }
                    }
                    if (badges.length === 0) return null;
                    return (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {badges.map(({ id, kind }) => {
                            const dept = departments.find((d) => d.id === id);
                            if (kind === "incharge") {
                              return (
                                <Badge key={`ic-${id}`} className="text-xs bg-amber-100 text-amber-800 border border-amber-200">
                                  👑 {dept?.name ?? "?"} — Incharge
                                  <button
                                    onClick={() => {
                                      // Demote: remove from incharge, keep as member
                                      setDraftDeptInchargeIds(draftDeptInchargeIds.filter((x) => x !== id));
                                    }}
                                    title="Demote (keep as member)"
                                    className="ml-1"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              );
                            }
                            return (
                              <Badge key={`mb-${id}`} variant="secondary" className="text-xs">
                                {dept?.name ?? "?"} — Member
                                <button
                                  onClick={() => {
                                    // Promote to incharge (use functional update for safety)
                                    setDraftDeptInchargeIds((prev) => Array.from(new Set([...prev, id])));
                                  }}
                                  title="Promote to incharge"
                                  className="ml-1 text-amber-700"
                                >
                                  ↑
                                </button>
                                <button
                                  onClick={() => {
                                    setDraftDeptMemberIds(draftDeptMemberIds.filter((x) => x !== id));
                                  }}
                                  title="Remove from department"
                                  className="ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <span className="text-xs flex-1">
                  {roles.departments.length > 0
                    ? roles.departments.map((d) => d.is_incharge ? `${d.department_name} 👑` : d.department_name).join(", ")
                    : "—"}
                </span>
              )}
            </div>

            {/* (i) House */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-28">House</span>
              {editing ? (
                <Select value={draftHouse || "_none"} onValueChange={(v) => setDraftHouse(v === "_none" ? "" : v)}>
                  <SelectTrigger className="h-7 w-40 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {houses.map((h) => <SelectItem key={h.name} value={h.name}>{h.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-xs">{roles.house?.house_name ?? "—"}</span>
              )}
            </div>
          </div>
        )}

        {/* FOOTER: Cancel/Save, only when editing */}
        {editing && (
          <div className="border-t px-4 py-2 flex justify-end gap-2 bg-muted/30">
            <Button size="sm" variant="ghost" onClick={cancelEdit}><X className="h-3 w-3" />Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <SubjectPickerModal
        open={subjectPickerOpen}
        schoolId={schoolId}
        initialDrafts={draftSubjectTeachers}
        onClose={() => setSubjectPickerOpen(false)}
        onPick={(_subjectId, _classId, _sectionId, _subjectName, _className, _sectionName) => {
          // No-op: the modal accumulates its own staged list and only the
          // onDone callback below transfers the final list to the card.
          // Kept here for forward-compat in case the parent wants to track
          // intermediate picks.
        }}
        onDone={(staged) => {
          // Replace the card's draft list with the modal's staged list.
          // Single source of truth — every Done click starts from a clean
          // view of what's about to be saved on Card Save.
          setDraftSubjectTeachers(staged);
          setSubjectPickerOpen(false);
        }}
      />

      {confirmMasterAdmin && (
        <MasterAdminConfirmDialog
          open={true}
          staffName={staff.full_name}
          granting={confirmMasterAdmin.value}
          onConfirm={() => {
            setDraftIsMasterAdmin(confirmMasterAdmin.value);
            setConfirmMasterAdmin(null);
          }}
          onCancel={() => setConfirmMasterAdmin(null)}
        />
      )}
    </>
  );
}

// ============================================================================
// AcademicProfile — Section 3 of the collapsed card
// ============================================================================
//
// Surfaces all academic-profile assignments in labeled sub-rows:
//   - Coordinator wings: 👑 {wing}
//   - Wings (auto-membership via CT/ST): {wing}
//   - Class teacher: {ClassName} {SectionName}
//   - Subject teacher: {ClassName} {SectionName} — {SubjectName}
//   - House: 🏠 {house}
//
// Each sub-row is omitted if empty. The whole block is omitted if ALL
// sub-rows are empty (so a non-academic-only staff has no "Academic Profile"
// header at all).

function AcademicProfile({ roles, draftClassTeachers, draftSubjectTeachers, classes, wings, editing }: {
  roles: StaffAllRoles;
  draftClassTeachers: Array<{ classId: string }>;
  draftSubjectTeachers: Array<{ classId: string }>;
  classes: Array<{ id: string; wing_id: string | null }>;
  wings: Array<{ id: string; name: string }>;
  editing: boolean;
}) {
  const hasCoordinator = roles.coordinator_wings.length > 0;
  // Wings via auto-membership: every class-section this staff is CT/ST for
  // has a wing_id. Dedup against coordinator wings — if a staff is
  // both coordinator and CT/ST in the same wing, Coordinator wins.
  // 2026-06-18: live-merge with draft CT/ST classes so wings show up the
  // moment a class-section is picked, not after Save.
  // 2026-06-18: also union manual_teacher_wings (Wings tab "Add Teacher")
  // so Wings tab writes reflect on the Staff card in lockstep.
  const coordWingIds = new Set(
    roles.coordinator_wings.map((c) => c.wing_id)
  );
  const merged = new Map<string, { id: string; name: string; source: "auto" | "manual" }>();
  for (const w of roles.auto_assigned_wings ?? []) {
    if (!coordWingIds.has(w.id)) merged.set(w.id, { ...w, source: "auto" });
  }
  for (const w of roles.manual_teacher_wings ?? []) {
    if (!coordWingIds.has(w.id) && !merged.has(w.id)) {
      merged.set(w.id, { ...w, source: "manual" });
    }
  }
  if (editing) {
    const classWingByClassId = new Map<string, string | null>();
    for (const c of classes) classWingByClassId.set(c.id, c.wing_id);
    const draftClassIds = new Set<string>([
      ...draftClassTeachers.map((c) => c.classId),
      ...draftSubjectTeachers.map((s) => s.classId),
    ]);
    for (const classId of draftClassIds) {
      const wingId = classWingByClassId.get(classId);
      if (!wingId || coordWingIds.has(wingId)) continue;
      if (merged.has(wingId)) continue;
      const w = wings.find((x) => x.id === wingId);
      if (w) merged.set(wingId, { id: w.id, name: w.name, source: "auto" });
    }
  }
  const autoWings = Array.from(merged.values());
  const hasWings = autoWings.length > 0;
  const hasCT = roles.class_teachers.length > 0;
  const hasST = roles.subject_teachers.length > 0;
  const hasHouse = !!roles.house?.house_name;

  if (!hasCoordinator && !hasWings && !hasCT && !hasST && !hasHouse) {
    return null;
  }

  return (
    <div className="px-3 pb-2">
      <SectionGroup label="Academic Profile" accent="blue">
        <div className="space-y-1.5 text-xs">
          {hasCoordinator && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground w-24 flex-shrink-0">Coordinator</span>
              {roles.coordinator_wings.map((c) => (
                <span key={c.id} className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">👑 {c.wing_name}</span>
              ))}
            </div>
          )}
          {hasWings && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground w-24 flex-shrink-0">Wings</span>
              {autoWings.map((w) =>
                w.source === "manual" ? (
                  <span
                    key={w.id}
                    className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"
                    title="Manual teacher assignment — remove via Wings tab"
                  >
                    {w.name}
                  </span>
                ) : (
                  <span
                    key={w.id}
                    className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200 inline-flex items-center gap-1"
                    title="Auto-assigned from class teacher / subject teacher"
                  >
                    <Lock className="h-3 w-3" />
                    {w.name}
                  </span>
                )
              )}
            </div>
          )}
          {hasCT && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground w-24 flex-shrink-0">Class teacher</span>
              {roles.class_teachers.map((c) => (
                <span key={c.id} className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                  {c.class_name} {c.section_name}
                </span>
              ))}
            </div>
          )}
          {hasST && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground w-24 flex-shrink-0">Subject teacher</span>
              {roles.subject_teachers.map((s) => (
                <span key={s.id} className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {s.class_name} {s.section_name} — {s.subject_name}
                </span>
              ))}
            </div>
          )}
          {hasHouse && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground w-24 flex-shrink-0">House</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">🏠 {roles.house!.house_name}</span>
            </div>
          )}
        </div>
      </SectionGroup>
    </div>
  );
}

// ============================================================================
// NonAcademicProfile — Section 4 of the collapsed card
// ============================================================================
//
// Single sub-row with both incharge and member dept chips, deduped by
// department_id so an incharge-also-member renders once as a crowned chip.
// Omitted entirely if the staff has no dept assignments.

function NonAcademicProfile({ roles }: { roles: StaffAllRoles }) {
  if (roles.departments.length === 0) return null;

  // Dedup by department_id; incharge wins
  const seen = new Set<string>();
  const chips: Array<{ key: string; kind: "incharge" | "member"; name: string }> = [];
  for (const d of roles.departments.filter((x) => x.is_incharge)) {
    if (seen.has(d.department_id)) continue;
    seen.add(d.department_id);
    chips.push({ key: d.department_id, kind: "incharge", name: d.department_name });
  }
  for (const d of roles.departments.filter((x) => !x.is_incharge)) {
    if (seen.has(d.department_id)) continue;
    seen.add(d.department_id);
    chips.push({ key: d.department_id, kind: "member", name: d.department_name });
  }

  return (
    <div className="px-3 pb-3">
      <SectionGroup label="Non-Academic Profile" accent="amber">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {chips.map((c) =>
            c.kind === "incharge" ? (
              <span key={`ic-${c.key}`} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                👑 {c.name} — Incharge
              </span>
            ) : (
              <span key={`mb-${c.key}`} className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                {c.name} — Member
              </span>
            )
          )}
        </div>
      </SectionGroup>
    </div>
  );
}
