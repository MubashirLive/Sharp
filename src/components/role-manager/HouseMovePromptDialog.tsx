// HouseMovePromptDialog — per docs/HOUSE.md §7.1. A staff can belong to
// only one house. Adding a staff who is already in another house to this
// house implicitly removes them from the old one. This dialog lists every
// such move in the pending draft and asks the principal to confirm before
// the save fires. The DB function `assignStaffToHouse` already handles the
// move atomically; this dialog is purely a confirmation gate.
//
// Two paths: "Cancel" closes the dialog and preserves the draft (user can
// adjust and retry). "Move Staff" closes the dialog and the parent's
// `onConfirm` callback fires the save.

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface HouseMoveEntry {
  staffId: string;
  staffName: string;
  fromHouse: string;
  toHouse: string;
  /** Whether this is an incharge move or a plain staff move (display only). */
  role: "incharge" | "staff";
}

interface HouseMovePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moves: HouseMoveEntry[];
  /** Fires when the principal confirms. Parent then fires the save. */
  onConfirm: () => void;
}

export function HouseMovePromptDialog({
  open,
  onOpenChange,
  moves,
  onConfirm,
}: HouseMovePromptDialogProps) {
  const count = moves.length;
  const title =
    count === 1
      ? "Move Staff Between Houses"
      : `Move ${count} Staff Between Houses`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {count === 1 ? (
              <>
                <span className="font-medium">{moves[0].staffName}</span> is currently in{" "}
                <span className="font-medium">{moves[0].fromHouse}</span>. This will move them to{" "}
                <span className="font-medium">{moves[0].toHouse}</span>. Proceed?
              </>
            ) : (
              <>
                The following staff are being moved between houses. Each staff member can only
                belong to one house at a time. Proceed?
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {moves.map((m) => (
                    <li key={`${m.staffId}-${m.fromHouse}-${m.toHouse}`}>
                      <span className="font-medium">{m.staffName}</span> ({m.role}):{" "}
                      <span className="font-medium">{m.fromHouse}</span> →{" "}
                      <span className="font-medium">{m.toHouse}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Move Staff</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
