import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UnsavedChangesDialogProps {
  open: boolean;
  /**
   * Human-readable label of the tab the user is leaving (e.g. "Wings").
   * Surfaced in the modal so the user knows WHERE their unsaved work is.
   * Required — the old "another card" copy was ambiguous when more than
   * one tab could be dirty.
   */
  fromTabLabel: string;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({ open, fromTabLabel, onDiscard, onCancel }: UnsavedChangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes in <span className="font-medium">{fromTabLabel}</span>.
            Switching tabs will discard those changes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Keep editing</Button>
          <Button variant="destructive" onClick={onDiscard}>Discard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
