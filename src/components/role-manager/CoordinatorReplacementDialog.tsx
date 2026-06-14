import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, AlertTriangle } from "lucide-react";

interface CoordinatorReplacementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wingName: string;
  staffName: string;
  schoolId: string;
  wingId: string;
  availableStaff: Array<{ id: string; full_name: string; father_name?: string }>;
  onConfirm: (replacementStaffId?: string) => void;
}

export function CoordinatorReplacementDialog({
  open,
  onOpenChange,
  wingName,
  staffName,
  schoolId,
  wingId,
  availableStaff,
  onConfirm,
}: CoordinatorReplacementDialogProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStaff = availableStaff.filter((s) =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    onConfirm(selectedStaffId || undefined);
    setSelectedStaffId("");
    setSearchQuery("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedStaffId("");
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Cannot Remove Sole Coordinator
          </DialogTitle>
          <DialogDescription>
            <strong>{staffName}</strong> is the only coordinator for <strong>{wingName}</strong>.
            Removing will leave this wing without a coordinator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Option 1: Assign a replacement first</Label>
            <div className="mt-2 space-y-2">
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {filteredStaff.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No staff found
                  </div>
                ) : (
                  filteredStaff.map((staff) => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        selectedStaffId === staff.id ? "bg-primary/10 text-primary" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{staff.full_name}</div>
                          {staff.father_name && (
                            <div className="text-xs text-muted-foreground">{staff.father_name}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm font-medium">Option 2: Remove anyway (not recommended)</Label>
            <p className="text-xs text-muted-foreground mt-1">
              This will leave the wing without a coordinator. You can add one later.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleConfirm()}
          >
            Remove Anyway
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStaffId}
          >
            Assign Replacement & Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}