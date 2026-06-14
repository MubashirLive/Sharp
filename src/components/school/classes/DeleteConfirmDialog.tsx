import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Users, BookOpen, GraduationCap } from "lucide-react";
import type { DepCount } from "./types";

export interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: "class" | "section";
  deps: DepCount | null;
  loading: boolean;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  itemName,
  itemType,
  deps,
  loading,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const hasDeps = deps && (deps.students > 0 || deps.subjects > 0 || deps.teachers > 0);
  const description =
    itemType === "class"
      ? `This will remove the class "${itemName}" and all of its sections.`
      : `This will remove the section "${itemName}".`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="delete-confirm-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {itemType}?
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking dependencies...
          </div>
        ) : (
          hasDeps && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <p className="text-sm font-medium text-destructive">This {itemType} has active data:</p>
              <div className="flex flex-wrap gap-2">
                {deps!.students > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    {deps!.students} student{deps!.students !== 1 ? "s" : ""}
                  </span>
                )}
                {deps!.teachers > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <GraduationCap className="h-3.5 w-3.5" />
                    {deps!.teachers} teacher{deps!.teachers !== 1 ? "s" : ""}
                  </span>
                )}
                {deps!.subjects > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs">
                    <BookOpen className="h-3.5 w-3.5" />
                    {deps!.subjects} subject{deps!.subjects !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Deleting will not remove the related data, but it may become orphaned. Review before continuing.
              </p>
            </div>
          )
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            data-testid="delete-confirm-button"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
