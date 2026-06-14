import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface DepartmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deptName: string;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function DepartmentDeleteDialog({
  open,
  onOpenChange,
  deptName,
  onConfirm,
  isSubmitting,
}: DepartmentDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Dissolve Department?</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This action is <span className="font-medium text-foreground">permanent and cannot be undone.</span>
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Department record permanently deleted</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>All members unassigned from this department</span>
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Messenger history archived</span>
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Active tasks are NOT deleted (remain in Task Manager)</span>
            </li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Dissolving..." : "Dissolve Department"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}