// Actor Replacement Dialog — extracted from the inline dialog in
// DepartmentsAssignmentTab. Triggered when the user removes the sole
// Incharge from a department. Two resolution paths:
//
//   1. Pick Replacement — caller picks another staff; caller is
//      responsible for inserting the new incharge into the draft
//      before the Save mutation fires.
//   2. I Will Become Incharge — caller adds the current user as the
//      new incharge.
//
// "I Will Become Incharge" is hidden when the departing staff IS the
// current user (no self-replacement).

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";

export interface ActorReplacementStaff {
  id: string;
  full_name: string;
  father_name?: string;
}

export interface ActorReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deptName: string;
  departingStaffId: string;
  departingStaffName: string;
  currentUserId: string;
  staffList: ActorReplacementStaff[];
  /** Called with the picked staff id. Caller is responsible for mutating the draft. */
  onPickReplacement: (replacementId: string) => void;
  /** Called when the current user elects to become the new incharge. */
  onBecomeIncharge: () => void;
}

export function ActorReplacementDialog({
  open,
  onOpenChange,
  deptName,
  departingStaffId,
  departingStaffName,
  currentUserId,
  staffList,
  onPickReplacement,
  onBecomeIncharge,
}: ActorReplacementDialogProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const available = staffList
    .filter((s) => s.id !== departingStaffId)
    .filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 10);

  const hideBecomeIncharge = currentUserId === departingStaffId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <DialogTitle>Replacement Required</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{departingStaffName}</span> is the only
            Incharge of <span className="font-medium text-foreground">{deptName}</span>.
            A replacement is required before removal.
          </p>

          <div className="space-y-3">
            {/* Pick Replacement */}
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium">Pick Replacement</h4>
              <p className="text-xs text-muted-foreground">
                Choose from existing staff. Replacement becomes Incharge immediately.
              </p>
              {!pickerOpen ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                  className="w-full"
                >
                  Pick Replacement
                </Button>
              ) : (
                <div className="border rounded-md">
                  <Command>
                    <CommandInput
                      placeholder="Search staff..."
                      value={search}
                      onValueChange={setSearch}
                      autoFocus
                    />
                    <CommandList>
                      <CommandEmpty>No staff found.</CommandEmpty>
                      <CommandGroup>
                        {available.map((staff) => (
                          <CommandItem
                            key={staff.id}
                            value={staff.id}
                            onSelect={() => {
                              setSearch(staff.full_name);
                              onPickReplacement(staff.id);
                            }}
                            className="cursor-pointer py-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm">{staff.full_name}</span>
                              {staff.father_name && (
                                <span className="text-xs text-muted-foreground">
                                  {staff.father_name}
                                </span>
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
            {!hideBecomeIncharge && (
              <div className="border rounded-lg p-3 space-y-2">
                <h4 className="text-sm font-medium">I Will Become Incharge</h4>
                <p className="text-xs text-muted-foreground">
                  You will be assigned as Incharge. You can reassign later.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBecomeIncharge}
                  className="w-full"
                >
                  I Will Become Incharge
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
