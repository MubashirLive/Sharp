import { useState, useEffect } from "react";
import { Loader2, Plus, X, User, Crown, AlertTriangle, History, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  RadioGroup, RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { logDepartmentAction } from "@/integrations/supabase/queries/departments";
import { useDepartments } from "@/hooks/useRoleManagerQueries";
import { DepartmentLogPanel } from "@/components/departments/DepartmentLogPanel";

interface DepartmentsAssignmentTabProps {
  schoolId: string;
  canEdit: boolean;
  onAssignmentChange: () => void;
  /**
   * Notify the parent (RoleManagerTab) that this tab has unsaved changes.
   * For this auto-save tab: dirty = a save is in-flight OR the last save
   * failed. Matches My School SubjectTab pattern.
   */
  onDirtyChange?: (isDirty: boolean) => void;
}

interface Department {
  id: string;
  name: string;
  messenger_settings?: { who_can_use: string; visibility: string[] };
}

interface DeptMember {
  staff_profile_id: string;
  full_name: string;
  father_name?: string;
  status: string;
}

export function DepartmentsAssignmentTab({ schoolId, canEdit, onAssignmentChange, onDirtyChange }: DepartmentsAssignmentTabProps) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const currentUserName = user?.full_name ?? "Current User";

  // Single source of truth — the same 4 fetches that loadData() used to
  // do inline are now consolidated into getDepartmentsWithDetails. We
  // adapt the result into the existing local state shape so the rest of
  // the component is unchanged.
  const departmentsQuery = useDepartments(schoolId);
  const loading = departmentsQuery.isLoading;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptMembers, setDeptMembers] = useState<Map<string, DeptMember[]>>(new Map());
  const [deptIncharges, setDeptIncharges] = useState<Map<string, DeptMember[]>>(new Map());
  const [staffList, setStaffList] = useState<Array<{ id: string; full_name: string; father_name?: string }>>([]);

  // Picker state
  const [pickerOpen, setPickerOpen] = useState<string | null>(null);
  const [pickerType, setPickerType] = useState<"member" | "incharge">("member");

  // Actor Replacement state
  const [actorDialogOpen, setActorDialogOpen] = useState(false);
  const [actorContext, setActorContext] = useState<{
    deptId: string;
    deptName: string;
    departingStaffId: string;
    departingStaffName: string;
  } | null>(null);
  const [actorPickerOpen, setActorPickerOpen] = useState(false);
  const [actorSearch, setActorSearch] = useState("");

  // Log panel state
  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const [logDeptFilter, setLogDeptFilter] = useState<string | undefined>(undefined);
  const [logDeptName, setLogDeptName] = useState<string | undefined>(undefined);

  // Messenger settings state
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsDept, setSettingsDept] = useState<Department | null>(null);
  const [settingsWhoCanUse, setSettingsWhoCanUse] = useState("incharges_only");
  const [settingsVisibility, setSettingsVisibility] = useState<string[]>([]);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Save status — shared across all auto-save actions and the
  // messenger settings save. Drives the parent's onDirtyChange signal.
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "error">("idle");
  useEffect(() => {
    onDirtyChange?.(saveStatus === "saving" || saveStatus === "error");
  }, [saveStatus, onDirtyChange]);

  // Surface fetch errors
  useEffect(() => {
    if (departmentsQuery.error) {
      console.error("Failed to load departments:", departmentsQuery.error);
      toast.error("Failed to load departments data");
    }
  }, [departmentsQuery.error]);

  // Adapt query data into the local state shape used by the rest of
  // the component. Fires once per query update (and on first mount
  // when data arrives). On any tab switch that mutates staff
  // assignments the parent invalidates the departments query key
  // and this re-runs.
  useEffect(() => {
    const data = departmentsQuery.data;
    if (!data) return;

    const depts: Department[] = data.map((d) => ({
      id: d.id,
      name: d.name,
      messenger_settings: d.messenger_settings,
    }));
    setDepartments(depts);

    const membersMap = new Map<string, DeptMember[]>();
    const inchargesMap = new Map<string, DeptMember[]>();
    const staffMap = new Map<string, { id: string; full_name: string; father_name?: string }>();

    for (const dept of data) {
      const mems: DeptMember[] = [];
      const inchs: DeptMember[] = [];
      for (const m of dept.members) {
        const entry: DeptMember = {
          staff_profile_id: m.staff_profile_id,
          full_name: m.staff_name,
          father_name: m.father_name,
          status: "active",
        };
        staffMap.set(m.staff_profile_id, {
          id: m.staff_profile_id,
          full_name: m.staff_name,
          father_name: m.father_name,
        });
        if (m.role === "incharge") {
          inchs.push(entry);
        } else {
          mems.push(entry);
        }
      }
      membersMap.set(dept.id, mems);
      inchargesMap.set(dept.id, inchs);
    }
    setDeptMembers(membersMap);
    setDeptIncharges(inchargesMap);
    setStaffList(Array.from(staffMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name)));
  }, [departmentsQuery.data]);

  // --- Add member ---
  const handleAddMember = async (deptId: string, staff: { id: string; full_name: string }) => {
    setSaveStatus("saving");
    try {
      await supabase.from("departments_staff").insert({
        department_id: deptId,
        staff_profile_id: staff.id,
        school_id: schoolId,
      });

      const dept = departments.find((d) => d.id === deptId);
      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId,
        deptName: dept?.name,
        action: "member_added",
        what: `${staff.full_name} added to ${dept?.name ?? "department"}`,
      });

      toast.success(`${staff.full_name} added to department`);
      setPickerOpen(null);
      await departmentsQuery.refetch();
      setSaveStatus("idle");
      onAssignmentChange();
    } catch (_e) {
      toast.error("Failed to add member");
      setSaveStatus("error");
    }
  };

  // --- Set incharge ---
  const handleSetIncharge = async (deptId: string, staff: { id: string; full_name: string }) => {
    setSaveStatus("saving");
    try {
      // Make sure they are also a member
      const existing = deptMembers.get(deptId)?.find((m) => m.staff_profile_id === staff.id);
      if (!existing) {
        await supabase.from("departments_staff").insert({
          department_id: deptId,
          staff_profile_id: staff.id,
          school_id: schoolId,
        });
      }

      await supabase.from("department_incharges").upsert(
        {
          department_id: deptId,
          staff_profile_id: staff.id,
          school_id: schoolId,
          assigned_by: currentUserId,
        },
        { onConflict: "department_id,staff_profile_id" }
      );

      const dept = departments.find((d) => d.id === deptId);
      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId,
        deptName: dept?.name,
        action: "incharge_added",
        what: `${staff.full_name} set as Incharge of ${dept?.name ?? "department"}`,
      });

      toast.success(`${staff.full_name} set as Incharge`);
      setPickerOpen(null);
      await departmentsQuery.refetch();
      setSaveStatus("idle");
      onAssignmentChange();
    } catch (_e) {
      toast.error("Failed to set incharge");
      setSaveStatus("error");
    }
  };

  // --- Remove incharge ---
  const handleRemoveIncharge = async (deptId: string, staffId: string, staffName: string) => {
    const incharges = deptIncharges.get(deptId) ?? [];
    const isSole = incharges.length === 1 && incharges[0].staff_profile_id === staffId;

    if (isSole) {
      const dept = departments.find((d) => d.id === deptId);
      setActorContext({
        deptId,
        deptName: dept?.name ?? "Department",
        departingStaffId: staffId,
        departingStaffName: staffName,
      });
      setActorDialogOpen(true);
      return;
    }

    setSaveStatus("saving");
    try {
      await supabase
        .from("department_incharges")
        .delete()
        .eq("department_id", deptId)
        .eq("staff_profile_id", staffId);

      const dept = departments.find((d) => d.id === deptId);
      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId,
        deptName: dept?.name,
        action: "incharge_removed",
        what: `${staffName} removed as Incharge of ${dept?.name ?? "department"}`,
      });

      toast.success("Incharge removed");
      await departmentsQuery.refetch();
      setSaveStatus("idle");
      onAssignmentChange();
    } catch (_e) {
      toast.error("Failed to remove incharge");
      setSaveStatus("error");
    }
  };

  // --- Actor Replacement: pick replacement ---
  const handleActorAssignReplacement = async (replacementId: string) => {
    if (!actorContext) return;
    setSaveStatus("saving");
    try {
      const replacement = staffList.find((s) => s.id === replacementId);
      const replacementName = replacement?.full_name ?? "Replacement";

      // Add replacement as incharge
      await supabase.from("department_incharges").upsert(
        {
          department_id: actorContext.deptId,
          staff_profile_id: replacementId,
          school_id: schoolId,
          assigned_by: currentUserId,
        },
        { onConflict: "department_id,staff_profile_id" }
      );

      // Add as member too if not already
      const existing = deptMembers.get(actorContext.deptId)?.find((m) => m.staff_profile_id === replacementId);
      if (!existing) {
        await supabase.from("departments_staff").insert({
          department_id: actorContext.deptId,
          staff_profile_id: replacementId,
          school_id: schoolId,
        });
      }

      // Remove departing incharge
      await supabase
        .from("department_incharges")
        .delete()
        .eq("department_id", actorContext.deptId)
        .eq("staff_profile_id", actorContext.departingStaffId);

      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId: actorContext.deptId,
        deptName: actorContext.deptName,
        action: "incharge_added",
        what: `${replacementName} set as Incharge of ${actorContext.deptName}`,
      });
      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId: actorContext.deptId,
        deptName: actorContext.deptName,
        action: "incharge_removed",
        what: `${actorContext.departingStaffName} removed as Incharge of ${actorContext.deptName}`,
      });

      toast.success("Replacement assigned");
      setActorDialogOpen(false);
      setActorContext(null);
      setActorPickerOpen(false);
      setActorSearch("");
      await departmentsQuery.refetch();
      setSaveStatus("idle");
      onAssignmentChange();
    } catch (_e) {
      toast.error("Failed to assign replacement");
      setSaveStatus("error");
    }
  };

  // --- Actor Replacement: I become incharge ---
  const handleActorBecomeIncharge = async () => {
    if (!actorContext) return;
    setSaveStatus("saving");
    try {
      await supabase.from("department_incharges").upsert(
        {
          department_id: actorContext.deptId,
          staff_profile_id: currentUserId,
          school_id: schoolId,
          assigned_by: currentUserId,
        },
        { onConflict: "department_id,staff_profile_id" }
      );

      const existing = deptMembers.get(actorContext.deptId)?.find((m) => m.staff_profile_id === currentUserId);
      if (!existing) {
        await supabase.from("departments_staff").insert({
          department_id: actorContext.deptId,
          staff_profile_id: currentUserId,
          school_id: schoolId,
        });
      }

      await supabase
        .from("department_incharges")
        .delete()
        .eq("department_id", actorContext.deptId)
        .eq("staff_profile_id", actorContext.departingStaffId);

      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId: actorContext.deptId,
        deptName: actorContext.deptName,
        action: "incharge_added",
        what: `${currentUserName} set as Incharge of ${actorContext.deptName}`,
      });
      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId: actorContext.deptId,
        deptName: actorContext.deptName,
        action: "incharge_removed",
        what: `${actorContext.departingStaffName} removed as Incharge of ${actorContext.deptName}`,
      });

      toast.success(`You are now Incharge of ${actorContext.deptName}`);
      setActorDialogOpen(false);
      setActorContext(null);
      await departmentsQuery.refetch();
      setSaveStatus("idle");
      onAssignmentChange();
    } catch (_e) {
      toast.error("Failed to become incharge");
      setSaveStatus("error");
    }
  };

  // --- Remove member ---
  const handleRemoveMember = async (deptId: string, staffId: string, staffName: string) => {
    const incharges = deptIncharges.get(deptId) ?? [];
    const isSoleIncharge = incharges.length === 1 && incharges[0].staff_profile_id === staffId;
    const members = deptMembers.get(deptId) ?? [];
    const isLastMember = members.length === 1 && members[0].staff_profile_id === staffId;

    if (isSoleIncharge && isLastMember) {
      const dept = departments.find((d) => d.id === deptId);
      setActorContext({
        deptId,
        deptName: dept?.name ?? "Department",
        departingStaffId: staffId,
        departingStaffName: staffName,
      });
      setActorDialogOpen(true);
      return;
    }

    setSaveStatus("saving");
    try {
      await supabase
        .from("department_incharges")
        .delete()
        .eq("department_id", deptId)
        .eq("staff_profile_id", staffId);

      await supabase
        .from("departments_staff")
        .delete()
        .eq("department_id", deptId)
        .eq("staff_profile_id", staffId);

      const dept = departments.find((d) => d.id === deptId);
      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId,
        deptName: dept?.name,
        action: "member_removed",
        what: `${staffName} removed from ${dept?.name ?? "department"}`,
      });

      toast.success("Member removed");
      await departmentsQuery.refetch();
      setSaveStatus("idle");
      onAssignmentChange();
    } catch (_e) {
      toast.error("Failed to remove member");
      setSaveStatus("error");
    }
  };

  // --- Open settings dialog ---
  const openSettings = (dept: Department) => {
    setSettingsDept(dept);
    setSettingsWhoCanUse(dept.messenger_settings?.who_can_use ?? "incharges_only");
    setSettingsVisibility(dept.messenger_settings?.visibility ?? []);
    setSettingsDialogOpen(true);
  };

  // --- Save settings ---
  const handleSaveSettings = async () => {
    if (!settingsDept) return;
    setSettingsSaving(true);
    setSaveStatus("saving");
    try {
      const messenger_settings = {
        who_can_use: settingsWhoCanUse,
        visibility: settingsVisibility,
      };
      await supabase
        .from("departments")
        .update({ messenger_settings })
        .eq("id", settingsDept.id);

      await logDepartmentAction({
        schoolId,
        userId: currentUserId,
        userName: currentUserName,
        deptId: settingsDept.id,
        deptName: settingsDept.name,
        action: "settings_changed",
        what: `Messenger settings updated for ${settingsDept.name}`,
      });

      toast.success("Settings saved");
      setSettingsDialogOpen(false);
      setSettingsDept(null);
      await departmentsQuery.refetch();
      setSaveStatus("idle");
    } catch (_e) {
      toast.error("Failed to save settings");
      setSaveStatus("error");
    } finally {
      setSettingsSaving(false);
    }
  };

  // --- Open log panel for a department ---
  const openLog = (dept: Department) => {
    setLogDeptFilter(dept.id);
    setLogDeptName(dept.name);
    setLogPanelOpen(true);
  };

  const actorAvailableStaff = staffList
    .filter((s) => s.id !== actorContext?.departingStaffId)
    .filter((s) => s.full_name.toLowerCase().includes(actorSearch.toLowerCase()))
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No departments created yet. Create departments in My School first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-3 font-medium w-48">Department</th>
              <th className="text-left p-3 font-medium w-72">Incharge(s)</th>
              <th className="text-left p-3 font-medium">Members</th>
              {canEdit && <th className="p-3 font-medium w-16">Settings</th>}
              <th className="p-3 font-medium w-16">Log</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => {
              const incharges = deptIncharges.get(dept.id) ?? [];
              const members = deptMembers.get(dept.id) ?? [];

              return (
                <tr key={dept.id} className="border-b hover:bg-muted/20">
                  {/* Department name */}
                  <td className="p-3 font-medium">{dept.name}</td>

                  {/* Incharges */}
                  <td className="p-3">
                    <div className="flex flex-col gap-1.5">
                      {incharges.map((inch) => (
                        <div key={inch.staff_profile_id} className="flex items-center gap-1.5">
                          <Badge variant="default" className="gap-1">
                            <Crown className="h-3 w-3" />
                            {inch.full_name}
                          </Badge>
                          {canEdit && (
                            <button
                              onClick={() => handleRemoveIncharge(dept.id, inch.staff_profile_id, inch.full_name)}
                              className="text-muted-foreground hover:text-destructive"
                              title="Remove incharge"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {incharges.length === 0 && (
                        <span className="text-xs text-muted-foreground">No incharge</span>
                      )}
                      {canEdit && (
                        <Popover open={pickerOpen === `incharge-${dept.id}`} onOpenChange={(open) => {
                          if (open) { setPickerType("incharge"); setPickerOpen(`incharge-${dept.id}`); }
                          else { setPickerOpen(null); }
                        }}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs w-fit">
                              <Plus className="h-3 w-3 mr-1" />
                              {incharges.length > 0 ? "Add More" : "Set Incharge"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0" align="start">
                            <StaffPicker
                              staffList={staffList}
                              onSelect={(staff) => handleSetIncharge(dept.id, staff)}
                              excludeIds={incharges.map((i) => i.staff_profile_id)}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </td>

                  {/* Members */}
                  <td className="p-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {members
                          .filter((m) => !incharges.find((i) => i.staff_profile_id === m.staff_profile_id))
                          .map((member) => (
                            <div key={member.staff_profile_id} className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs">
                              <User className="h-3 w-3" />
                              <span>{member.full_name}</span>
                              {canEdit && (
                                <button
                                  onClick={() => handleRemoveMember(dept.id, member.staff_profile_id, member.full_name)}
                                  className="hover:text-destructive ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        {members.filter((m) => !incharges.find((i) => i.staff_profile_id === m.staff_profile_id)).length === 0 && (
                          <span className="text-xs text-muted-foreground">No members</span>
                        )}
                      </div>
                      {canEdit && (
                        <Popover open={pickerOpen === `member-${dept.id}`} onOpenChange={(open) => {
                          if (open) { setPickerType("member"); setPickerOpen(`member-${dept.id}`); }
                          else { setPickerOpen(null); }
                        }}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs w-fit">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Member
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64 p-0" align="start">
                            <StaffPicker
                              staffList={staffList}
                              onSelect={(staff) => handleAddMember(dept.id, staff)}
                              excludeIds={members.map((m) => m.staff_profile_id)}
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </td>

                  {/* Settings */}
                  {canEdit && (
                    <td className="p-3">
                      <button
                        onClick={() => openSettings(dept)}
                        className="text-muted-foreground hover:text-primary p-1"
                        title="Messenger settings"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    </td>
                  )}

                  {/* Log */}
                  <td className="p-3">
                    <button
                      onClick={() => openLog(dept)}
                      className="text-muted-foreground hover:text-primary p-1"
                      title="View activity log"
                    >
                      <History className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Actor Replacement Dialog */}
      {actorContext && (
        <Dialog open={actorDialogOpen} onOpenChange={setActorDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <DialogTitle>Replacement Required</DialogTitle>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{actorContext.departingStaffName}</span> is the only
                Incharge of <span className="font-medium text-foreground">{actorContext.deptName}</span>.
                A replacement is required before removal.
              </p>

              <div className="space-y-3">
                {/* Pick Replacement */}
                <div className="border rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-medium">Pick Replacement</h4>
                  <p className="text-xs text-muted-foreground">
                    Choose from existing staff. Replacement becomes Incharge immediately.
                  </p>
                  {!actorPickerOpen ? (
                    <Button variant="outline" size="sm" onClick={() => setActorPickerOpen(true)} className="w-full">
                      Pick Replacement
                    </Button>
                  ) : (
                    <div className="border rounded-md">
                      <Command>
                        <CommandInput
                          placeholder="Search staff..."
                          value={actorSearch}
                          onValueChange={setActorSearch}
                          autoFocus
                        />
                        <CommandList>
                          <CommandEmpty>No staff found.</CommandEmpty>
                          <CommandGroup>
                            {actorAvailableStaff.map((staff) => (
                              <CommandItem
                                key={staff.id}
                                value={staff.id}
                                onSelect={() => { setActorSearch(staff.full_name); handleActorAssignReplacement(staff.id); }}
                                className="cursor-pointer py-2"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm">{staff.full_name}</span>
                                  {staff.father_name && (
                                    <span className="text-xs text-muted-foreground">{staff.father_name}</span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </div>
                  )}
                </div>

                {/* I Will Become Incharge */}
                {currentUserId !== actorContext.departingStaffId && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <h4 className="text-sm font-medium">I Will Become Incharge</h4>
                    <p className="text-xs text-muted-foreground">
                      You will be assigned as Incharge. You can reassign later.
                    </p>
                    <Button variant="outline" size="sm" onClick={handleActorBecomeIncharge} className="w-full">
                      I Will Become Incharge
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setActorDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Messenger Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Messenger Settings — {settingsDept?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium block">Who Can Use</label>
              <RadioGroup
                value={settingsWhoCanUse}
                onValueChange={setSettingsWhoCanUse}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="incharges_only" id="icu" />
                  <Label htmlFor="icu" className="text-sm font-normal">Incharges Only</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all" className="text-sm font-normal">All Staff</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)} disabled={settingsSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} disabled={settingsSaving}>
              {settingsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Log Panel */}
      <DepartmentLogPanel
        open={logPanelOpen}
        onOpenChange={setLogPanelOpen}
        schoolId={schoolId}
        deptFilter={logDeptFilter}
        deptName={logDeptName}
      />
    </div>
  );
}

// --- Staff Picker ---
interface StaffPickerProps {
  staffList: Array<{ id: string; full_name: string; father_name?: string }>;
  onSelect: (staff: { id: string; full_name: string }) => void;
  excludeIds?: string[];
}

function StaffPicker({ staffList, onSelect, excludeIds = [] }: StaffPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = staffList
    .filter((s) => !excludeIds.includes(s.id))
    .filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Command>
      <CommandInput
        placeholder="Search staff..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No staff found.</CommandEmpty>
        <CommandGroup>
          {filtered.slice(0, 10).map((staff) => (
            <CommandItem
              key={staff.id}
              value={staff.id}
              onSelect={() => onSelect({ id: staff.id, full_name: staff.full_name })}
              className="cursor-pointer py-2"
            >
              <User className="h-4 w-4 mr-2" />
              <div>
                <div className="text-sm">{staff.full_name}</div>
                {staff.father_name && (
                  <div className="text-xs text-muted-foreground">{staff.father_name}</div>
                )}
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
