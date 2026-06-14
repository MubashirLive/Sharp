import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { Crown, Save, Loader2, X } from "lucide-react";
import type { DepartmentWithDetails } from "@/integrations/supabase/queries/departments";

interface StagedDepartment {
  id?: string;
  name: string;
  members: DepartmentMember[];
}

interface DepartmentMember {
  staff_profile_id: string;
  staff_name: string;
  father_name?: string;
  role: "incharge" | "member";
}

interface DepartmentEditModeProps {
  department: DepartmentWithDetails;
  staffOptions: { id: string; name: string; father_name?: string }[];
  onSave: (staged: StagedDepartment, original: DepartmentWithDetails) => void;
  onCancel: () => void;
  onDeleteClick: () => void;
  onMemberRemove: (staffProfileId: string) => void;
  onPromoteToIncharge: (staffProfileId: string) => void;
  onDemoteToMember: (staffProfileId: string) => void;
  isSaving: boolean;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function DepartmentEditMode({
  department,
  staffOptions,
  onSave,
  onCancel,
  onDeleteClick,
  onMemberRemove,
  onPromoteToIncharge,
  onDemoteToMember,
  isSaving,
}: DepartmentEditModeProps) {
  const [staged, setStaged] = useState<StagedDepartment>({
    id: department.id,
    name: department.name,
    members: department.members.map((m) => ({ ...m })),
  });

  const [staffSearch, setStaffSearch] = useState("");
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);

  const inchargeCount = staged.members.filter((m) => m.role === "incharge").length;

  const isDirty =
    staged.name !== department.name ||
    JSON.stringify([...staged.members.map((m) => m.staff_profile_id).sort()]) !==
      JSON.stringify([...department.members.map((m) => m.staff_profile_id).sort()]);

  // Staff not already in this department
  const usedStaffIds = new Set(staged.members.map((m) => m.staff_profile_id));
  const availableStaff = staffOptions
    .filter((s) => !usedStaffIds.has(s.id))
    .filter((s) => s.name.toLowerCase().includes(staffSearch.toLowerCase()))
    .slice(0, 5);

  const handleSave = () => {
    onSave(staged, department);
  };

  return (
    <div className="rounded-xl border-2 border-primary/30 bg-card shadow-sm overflow-hidden">
      {/* Edit banner */}
      <div className="bg-primary/5 border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Editing {department.name}</span>
          {isDirty && (
            <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-400">
              Unsaved changes
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="h-7 text-xs"
            onClick={onDeleteClick}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Department Name */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department Name</label>
          <Input
            value={staged.name}
            onChange={(e) => setStaged((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Department name"
            maxLength={100}
            className="text-sm"
          />
        </div>

        {/* Members list */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Members ({staged.members.length})</label>
          <div className="space-y-1.5">
            {staged.members.map((member) => {
              const isIncharge = member.role === "incharge";
              const isSoleIncharge = isIncharge && inchargeCount === 1;
              return (
                <div key={member.staff_profile_id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar initials circle */}
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        {getInitials(member.staff_name)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{member.staff_name}</span>
                        {isIncharge && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-900/20">
                            <Crown className="h-3 w-3 mr-0.5" />
                            Incharge
                          </Badge>
                        )}
                      </div>
                      {member.father_name && (
                        <span className="text-xs text-muted-foreground">{member.father_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Promote / Demote button */}
                    {isIncharge ? (
                      <button
                        type="button"
                        onClick={() => onDemoteToMember(member.staff_profile_id)}
                        disabled={inchargeCount === 1}
                        className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                        title={inchargeCount === 1 ? "Cannot demote the sole incharge" : "Demote to member"}
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onPromoteToIncharge(member.staff_profile_id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Make Incharge
                      </button>
                    )}
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => onMemberRemove(member.staff_profile_id)}
                      disabled={isSoleIncharge}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-muted-foreground"
                      title={isSoleIncharge ? "Cannot remove the sole incharge. Demote first." : "Remove from department"}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {staged.members.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No members added yet.</p>
            )}
          </div>

          {/* Add Member */}
          <Popover open={staffPickerOpen} onOpenChange={setStaffPickerOpen}>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search staff..."
                  value={staffSearch}
                  onValueChange={setStaffSearch}
                />
                <CommandList>
                  <CommandEmpty>No staff found.</CommandEmpty>
                  <CommandGroup>
                    {availableStaff.map((staff) => (
                      <CommandItem
                        key={staff.id}
                        value={staff.id}
                        onSelect={() => {
                          setStaged((prev) => ({
                            ...prev,
                            members: [
                              ...prev.members,
                              { staff_profile_id: staff.id, staff_name: staff.name, father_name: staff.father_name, role: "member" },
                            ],
                          }));
                          setStaffSearch("");
                          setStaffPickerOpen(false);
                        }}
                        className="cursor-pointer py-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{staff.name}</span>
                          {staff.father_name && (
                            <span className="text-xs text-muted-foreground">{staff.father_name}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="mt-2 h-8 text-xs" onClick={() => setStaffPickerOpen(true)}>
            + Add Member
          </Button>
        </div>
      </div>

      {/* Save/Cancel footer */}
      <div className="border-t px-4 py-3 flex items-center justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}