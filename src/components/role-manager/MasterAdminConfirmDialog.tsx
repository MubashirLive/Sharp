import { useState } from "react";
import { AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MasterAdminConfirmDialogProps {
  open: boolean;
  staffName: string;
  granting: boolean; // true = grant, false = revoke
  onConfirm: () => void;
  onCancel: () => void;
}

export function MasterAdminConfirmDialog({
  open, staffName, granting, onConfirm, onCancel,
}: MasterAdminConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const match = typed.trim().toLowerCase() === staffName.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setTyped(""); onCancel(); } }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <DialogTitle>{granting ? "Grant Master Admin?" : "Revoke Master Admin?"}</DialogTitle>
              <DialogDescription>
                {granting
                  ? `${staffName} will get full access to all role assignments, including the ability to promote other staff.`
                  : `${staffName} will lose Master Admin access. They can still be assigned as Admin.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Type <span className="font-mono font-semibold text-foreground">{staffName}</span> to confirm:
          </label>
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={staffName}
            autoFocus
            className="h-9"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setTyped(""); onCancel(); }}>Cancel</Button>
          <Button
            variant={granting ? "default" : "destructive"}
            onClick={() => { setTyped(""); onConfirm(); }}
            disabled={!match}
          >
            {granting ? "Grant" : "Revoke"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
