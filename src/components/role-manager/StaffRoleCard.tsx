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
import { Loader2, Pencil, Save, X, Plus, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";
import {
  getStaffAllRoles, updateStaffTag, updateMasterAdmin, updateAdminRole,
  updateStaffStatus, addCoordinator, removeCoordinator,
  addClassTeacher, removeClassTeacher, addSubjectTeacher, removeSubjectTeacher,
  addDepartmentMember, removeDepartmentMember, removeDepartmentIncharge,
  setHouse, getWingsForSchool, getClassesForSchool, getSectionsForClass,
  getDepartmentsForSchool, getHousesForSchool, getCurrentAcademicYear,
  getClassTeacherConflict,
  type StaffAllRoles, type WingOption, type ClassOption, type SectionOption,
  type DepartmentOption, type HouseOption,
} from "@/integrations/supabase/queries/roleAssignments";
import { SubjectPickerModal } from "./SubjectPickerModal";
import { MasterAdminConfirmDialog } from "./MasterAdminConfirmDialog";
import { RoleField } from "./RoleField";
import { CoordinatorMultiSelect } from "./CoordinatorMultiSelect";

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

  // ============== State ==============
  const [roles, setRoles] = useState<StaffAllRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local draft state for edits
  const [draftTag, setDraftTag] = useState("");
  const [draftIsMasterAdmin, setDraftIsMasterAdmin] = useState(false);
  const [draftIsAdmin, setDraftIsAdmin] = useState(false);
  const [draftRole, setDraftRole] = useState("teacher");
  const [draftStatus, setDraftStatus] = useState("active");
  const [draftCoordinatorWingIds, setDraftCoordinatorWingIds] = useState<string[]>([]);
  const [draftClassTeachers, setDraftClassTeachers] = useState<Array<{ id: string; classId: string; sectionId: string; className: string; sectionName: string }>>([]);
  const [draftSubjectTeachers, setDraftSubjectTeachers] = useState<Array<{ id: string; classId: string; sectionId: string; subjectId: string; label: string }>>([]);
  const [draftDeptMemberIds, setDraftDeptMemberIds] = useState<string[]>([]);
  const [draftDeptInchargeIds, setDraftDeptInchargeIds] = useState<string[]>([]);
  const [draftHouse, setDraftHouse] = useState<string>("");

  // Lookup data for edit mode
  const [wings, setWings] = useState<WingOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [houses, setHouses] = useState<HouseOption[]>([]);
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);

  // Picker state
  const [ctClassId, setCtClassId] = useState("");
  const [ctSectionId, setCtSectionId] = useState("");
  const [ctSections, setCtSections] = useState<SectionOption[]>([]);
  const [ctConflict, setCtConflict] = useState<{ id: string; name: string } | null>(null);
  const [pendingCt, setPendingCt] = useState<{ classId: string; sectionId: string; className: string; sectionName: string } | null>(null);

  const [subjectPickerOpen, setSubjectPickerOpen] = useState(false);

  const [confirmMasterAdmin, setConfirmMasterAdmin] = useState<{ value: boolean } | null>(null);

  // ============== Effects ==============

  const loadRoles = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const data = await getStaffAllRoles(staff.id, schoolId);
      setRoles(data);
      seedDraft(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [staff.id, schoolId]);

  const seedDraft = (r: StaffAllRoles) => {
    setDraftTag(r.messenger_tag ?? "");
    setDraftIsMasterAdmin(r.is_master_admin);
    setDraftIsAdmin(r.is_admin);
    setDraftRole(r.role);
    setDraftStatus(r.status);
    // Coordinator (wings) — current data is single, but model as array
    setDraftCoordinatorWingIds(r.coordinator ? [r.coordinator.wing_id] : []);
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
    const origCoordWingIds = roles.coordinator ? [roles.coordinator.wing_id] : [];
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
  };

  const cancelEdit = () => {
    if (roles) seedDraft(roles);
    setEditing(false);
  };

  // ============== Save ==============

  const save = async () => {
    if (!roles || !user) return;
    setSaving(true);
    try {
      // 1. Profile fields
      if ((draftTag || "") !== (roles.messenger_tag || "")) {
        await updateStaffTag(staff.id, draftTag, currentUserId);
      }
      if (draftIsMasterAdmin !== roles.is_master_admin) {
        await updateMasterAdmin(staff.id, draftIsMasterAdmin, currentUserId);
      }
      if (draftIsAdmin !== roles.is_admin) {
        await updateAdminRole(staff.id, draftIsAdmin, currentUserId);
      }
      if (draftRole !== roles.role) {
        await updateStaffRole(staff.id, draftRole, currentUserId);
      }
      if (draftStatus !== roles.status) {
        await updateStaffStatus(staff.id, draftStatus, currentUserId);
      }
      if (draftHouse !== (roles.house?.house_name ?? "")) {
        await setHouse(staff.id, draftHouse, currentUserId);
      }

      // 2. Coordinator (wings) — multi-wing
      const origCoordWingIds = roles.coordinator ? [roles.coordinator.wing_id] : [];
      const newCoordWingIds = draftCoordinatorWingIds;
      // removed
      for (const wingId of origCoordWingIds) {
        if (!newCoordWingIds.includes(wingId)) {
          // Find the wing_staff row id to delete — roles.coordinator stores it
          if (roles.coordinator && roles.coordinator.wing_id === wingId) {
            await removeCoordinator(roles.coordinator.id, staff.id, schoolId, currentUserId);
          }
        }
      }
      // added
      for (const wingId of newCoordWingIds) {
        if (!origCoordWingIds.includes(wingId)) {
          await addCoordinator(wingId, staff.id, schoolId, currentUserId);
        }
      }

      // 3. Class Teachers — diff by (classId, sectionId)
      const origCTs = new Map(roles.class_teachers.map((c) => [c.id, c]));
      const newCTsMap = new Map(draftClassTeachers.map((c) => [`${c.classId}:${c.sectionId}`, c]));
      for (const [id, orig] of origCTs) {
        const found = draftClassTeachers.find((c) => c.id === id);
        if (!found) await removeClassTeacher(id, staff.id, schoolId, currentUserId);
      }
      for (const dc of draftClassTeachers) {
        if (dc.id.startsWith("new-")) {
          await addClassTeacher(staff.id, dc.classId, dc.sectionId, schoolId, currentUserId);
        }
      }

      // 4. Subject Teachers
      const origSTs = new Map(roles.subject_teachers.map((s) => [s.id, s]));
      for (const [id] of origSTs) {
        if (!draftSubjectTeachers.find((s) => s.id === id)) {
          await removeSubjectTeacher(id, staff.id, schoolId, currentUserId);
        }
      }
      for (const ds of draftSubjectTeachers) {
        if (ds.id.startsWith("new-")) {
          await addSubjectTeacher(staff.id, ds.classId, ds.sectionId, ds.subjectId, schoolId, academicYearId, currentUserId);
        }
      }

      // 5. Departments — split into incharge + member lists, cascade incharge ⇒ member
      // Enforce: incharge implies member. If the user added a dept to inchargeIds
      // but forgot to add it to memberIds, we add it on save.
      const effectiveMemberIds = Array.from(new Set([...draftDeptMemberIds, ...draftDeptInchargeIds]));
      const origDeptMemberIds = roles.departments.map((d) => d.department_id);
      const origDeptInchargeIds = roles.departments.filter((d) => d.is_incharge).map((d) => d.department_id);
      // Map dept_id → role-dept row id (for delete calls)
      const deptIdToRowId = new Map(roles.departments.map((d) => [d.department_id, d.id]));

      // REMOVED — dept was in memberIds before, not in memberIds now
      for (const deptId of origDeptMemberIds) {
        if (!effectiveMemberIds.includes(deptId)) {
          const rowId = deptIdToRowId.get(deptId);
          if (rowId) await removeDepartmentMember(rowId, staff.id, schoolId, currentUserId);
        }
      }
      // ADDED — dept is in memberIds now, wasn't before
      for (const deptId of effectiveMemberIds) {
        if (!origDeptMemberIds.includes(deptId)) {
          await addDepartmentMember(staff.id, deptId, schoolId, false, currentUserId);
        }
      }
      // INCHARGE removed — was in inchargeIds, no longer
      for (const deptId of origDeptInchargeIds) {
        if (!draftDeptInchargeIds.includes(deptId)) {
          const rowId = deptIdToRowId.get(deptId);
          if (rowId) await removeDepartmentIncharge(rowId, staff.id, schoolId, currentUserId);
        }
      }
      // INCHARGE added — in inchargeIds now, wasn't before
      for (const deptId of draftDeptInchargeIds) {
        if (!origDeptInchargeIds.includes(deptId)) {
          await addDepartmentMember(staff.id, deptId, schoolId, true, currentUserId);
        }
      }

      await onRefresh();
      await loadRoles();
      setEditing(false);
      toast.success("Changes saved");
    } catch (e: any) {
      toast.error(`Save failed: ${e?.message ?? "unknown"}`);
    } finally {
      setSaving(false);
    }
  };

  // ============== Derived UI values ==============

  const initials = staff.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const editable = !isOwnCard && canEdit;

  // ============== Render ==============

  if (loading && !roles) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-center h-40">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!roles) return null;

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* ROW: avatar | name+meta | summary chips | actions */}
        <div className="flex items-center gap-3 p-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials || "?"}
          </div>

          {/* Name + meta */}
          <div className="min-w-0 w-48 flex-shrink-0">
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

          {/* Summary chips — read-only display, shows wings + depts by name */}
          <div className="flex-1 min-w-0 hidden md:flex flex-wrap items-center gap-1.5 text-xs">
            <RoleField roles={roles} />
            {roles.coordinator && <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">👑 {roles.coordinator.wing_name}</span>}
            {roles.departments.filter((d) => d.is_incharge).map((d) => (
              <span key={`ic-${d.id}`} className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">👑 {d.department_name}</span>
            ))}
            {roles.departments.filter((d) => !d.is_incharge).map((d) => (
              <span key={`mb-${d.id}`} className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{d.department_name}</span>
            ))}
            {roles.class_teachers.length > 0 && <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">CT × {roles.class_teachers.length}</span>}
            {roles.subject_teachers.length > 0 && <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ST × {roles.subject_teachers.length}</span>}
            {roles.house?.house_name && <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">🏠 {roles.house.house_name}</span>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
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
              <RoleField roles={roles} showHint={editing} />
            </div>

            {/* (e) Coordinator (Wing) */}
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-28 pt-1.5">Wing</span>
              {editing ? (
                <div className="flex-1 space-y-1.5">
                  <CoordinatorMultiSelect
                    value={draftCoordinatorWingIds}
                    options={wings}
                    onChange={setDraftCoordinatorWingIds}
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
                <span className="text-xs flex-1">
                  {roles.coordinator?.wing_name ?? "—"}
                </span>
              )}
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
                        // adding as member — also remove from incharge if was there (no, demote; actually we want
                        // member-add to be independent. If user adds to member first, then later to incharge,
                        // we promote. Cascade: incharge ⇒ member is enforced on save, not here).
                        setDraftDeptMemberIds(Array.from(new Set([...draftDeptMemberIds, v])));
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
                        // Adding as incharge also auto-adds to memberIds (cascade in UI for clarity)
                        setDraftDeptInchargeIds(Array.from(new Set([...draftDeptInchargeIds, v])));
                        setDraftDeptMemberIds(Array.from(new Set([...draftDeptMemberIds, v])));
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
                  {/* Incharge badges */}
                  {draftDeptInchargeIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {draftDeptInchargeIds.map((deptId) => {
                        const dept = departments.find((d) => d.id === deptId);
                        return (
                          <Badge key={`ic-${deptId}`} className="text-xs bg-amber-100 text-amber-800 border border-amber-200">
                            👑 {dept?.name ?? "?"}
                            <button
                              onClick={() => {
                                // Remove from incharge. Keep as member.
                                setDraftDeptInchargeIds(draftDeptInchargeIds.filter((x) => x !== deptId));
                              }}
                              title="Demote (keep as member)"
                              className="ml-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  {/* Member badges (incharge-also-member rows render in incharge group only — crown wins) */}
                  {draftDeptMemberIds.filter((d) => !draftDeptInchargeIds.includes(d)).length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {draftDeptMemberIds
                        .filter((d) => !draftDeptInchargeIds.includes(d))
                        .map((deptId) => {
                          const dept = departments.find((d) => d.id === deptId);
                          return (
                            <Badge key={`mb-${deptId}`} variant="secondary" className="text-xs">
                              {dept?.name ?? "?"}
                              <button
                                onClick={() => {
                                  // Promote to incharge (also keeps in member — cascade)
                                  setDraftDeptInchargeIds(Array.from(new Set([...draftDeptInchargeIds, deptId])));
                                }}
                                title="Promote to incharge"
                                className="ml-1 text-amber-700"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => {
                                  setDraftDeptMemberIds(draftDeptMemberIds.filter((x) => x !== deptId));
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
                  )}
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
        onClose={() => setSubjectPickerOpen(false)}
        onPick={(subjectId, classId, sectionId, subjectName, className, sectionName) => {
          const cls = classes.find((c) => c.id === classId);
          const label = `${className} ${sectionName} — ${subjectName}`;
          setDraftSubjectTeachers([...draftSubjectTeachers, { id: `new-${Date.now()}`, classId, sectionId, subjectId, label }]);
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
