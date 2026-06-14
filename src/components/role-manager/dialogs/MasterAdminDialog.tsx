import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface MasterAdminDialogProps {
  open: boolean;
  staffName: string;
  isCurrentlyMasterAdmin: boolean;
  onConfirm: (makeAdmin: boolean) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

export function MasterAdminDialog({
  open,
  staffName,
  isCurrentlyMasterAdmin,
  onConfirm,
  onCancel,
  saving,
}: MasterAdminDialogProps) {
  const [confirmName, setConfirmName] = useState("");
  const isConfirmValid = confirmName.trim() === staffName.trim();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCurrentlyMasterAdmin ? "Revoke Master Admin" : "Confirm Master Admin"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isCurrentlyMasterAdmin
              ? `To revoke Master Admin access from ${staffName}, type their name to confirm.`
              : `To grant Master Admin access to ${staffName}, type their name to confirm.`}
          </p>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Type "{staffName}" to confirm
            </label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={staffName}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(!isCurrentlyMasterAdmin)}
            disabled={!isConfirmValid || saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            {isCurrentlyMasterAdmin ? "Revoke Master Admin" : "Confirm Master Admin"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}