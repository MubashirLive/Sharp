import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface DepartmentSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deptName: string;
  changes: { type: string; description: string }[];
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function DepartmentSummaryDialog({
  open,
  onOpenChange,
  deptName,
  changes,
  onConfirm,
  isSubmitting,
}: DepartmentSummaryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Changes to {deptName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No changes to save.</p>
          ) : (
            <ul className="space-y-2">
              {changes.map((change, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{change.description}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground border-t pt-3">
            These changes will also be reflected in Role Manager.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting || changes.length === 0}>
            {isSubmitting ? "Saving..." : "Confirm & Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}