import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AlertTriangle } from "lucide-react";

interface DepartmentActorReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deptName: string;
  departingIncharge: string;
  departingInchargeName: string;
  staffOptions: { id: string; name: string; father_name?: string }[];
  onAssignReplacement: (staffId: string) => void;
  onBecomeIncharge: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

export function DepartmentActorReplacementDialog({
  open,
  onOpenChange,
  deptName,
  departingIncharge,
  departingInchargeName,
  staffOptions,
  onAssignReplacement,
  onBecomeIncharge,
  currentUserId,
  currentUserName,
}: DepartmentActorReplacementDialogProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");

  const availableStaff = staffOptions
    .filter((s) => s.id !== departingIncharge)
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 5);

  const handleAssignReplacement = (staffId: string) => {
    onAssignReplacement(staffId);
    setPickerOpen(false);
    setSearch("");
    onOpenChange(false);
  };

  const handleBecomeIncharge = () => {
    onBecomeIncharge();
    onOpenChange(false);
  };

  const canBecomeIncharge = currentUserId !== departingIncharge;

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
            <span className="font-medium text-foreground">{departingInchargeName}</span> is the only Incharge of{" "}
            <span className="font-medium text-foreground">{deptName}</span>. A replacement is required before removal.
          </p>

          <div className="space-y-3">
            {/* Option 1: Assign Replacement */}
            <div className="border rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium">Assign Replacement</h4>
              <p className="text-xs text-muted-foreground">
                Pick from existing staff. Both add replacement + remove old committed as single transaction.
              </p>
              {!pickerOpen ? (
                <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="w-full">
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
                        {availableStaff.map((staff) => (
                          <CommandItem
                            key={staff.id}
                            value={staff.id}
                            onSelect={() => handleAssignReplacement(staff.id)}
                            className="cursor-pointer py-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm">{staff.name}</span>
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

            {/* Option 2: I Will Become Incharge */}
            {canBecomeIncharge && (
              <div className="border rounded-lg p-3 space-y-2">
                <h4 className="text-sm font-medium">I Will Become Incharge</h4>
                <p className="text-xs text-muted-foreground">
                  You ({currentUserName ?? "current user"}) will be assigned as Incharge. You can reassign later via Edit Mode.
                </p>
                <Button variant="outline" size="sm" onClick={handleBecomeIncharge} className="w-full">
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