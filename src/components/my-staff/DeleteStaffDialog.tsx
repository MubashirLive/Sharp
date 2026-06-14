// DeleteStaffDialog — shared AlertDialog for hard-deleting a staff.
// Behaviour:
//  1. On open, runs canDeleteStaff(staff.id) to fetch blocked items.
//  2. If blocked: shows the list, "Delete Permanently" disabled, only Cancel.
//  3. If eligible: shows warning, user must TYPE the staff's full name to enable confirm.
//  4. On confirm: invokes deleteStaff(staff.id). On success, calls onDeleted().

import { useEffect, useState } from "react";
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
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  canDeleteStaff,
  deleteStaff,
  type BlockedItem,
} from "@/integrations/supabase/queries/staff";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";

interface DeleteStaffDialogProps {
  staff: StaffWithDetails | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onDeleted: (deletedStaffId: string) => void;
}

const TYPE_LABELS: Record<BlockedItem["type"], string> = {
  class_teacher: "Class Teacher",
  wing: "Sole Wing Coordinator",
  department: "Sole Department Incharge",
  house: "House Incharge",
  self: "Self",
};

function BlockedItemRow({ item }: { item: BlockedItem }) {
  if (item.type === "self") {
    return (
      <li className="flex items-start gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
        <span>You cannot delete your own account. Ask another principal/admin to do it.</span>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-2 text-sm">
      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
      <span>
        <strong>{TYPE_LABELS[item.type]}</strong> of <em>{item.name}</em>
      </span>
    </li>
  );
}

export function DeleteStaffDialog({ staff, open, onOpenChange, onDeleted }: DeleteStaffDialogProps) {
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason: string | null;
    blocked_items: BlockedItem[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  // Run eligibility check on open
  useEffect(() => {
    if (!open || !staff) {
      setEligibility(null);
      setConfirmName("");
      return;
    }
    setConfirmName("");
    let cancelled = false;
    setLoading(true);
    canDeleteStaff(staff.id)
      .then((res) => {
        if (!cancelled) setEligibility(res);
      })
      .catch((e) => {
        if (!cancelled) setEligibility({ eligible: false, reason: e?.message ?? "Check failed", blocked_items: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, staff?.id]);

  // Name-typed confirmation: case-insensitive, whitespace-collapsed
  const expectedName = (staff?.full_name ?? "").trim().toLowerCase();
  const typedName = confirmName.trim().toLowerCase();
  const nameMatches = expectedName.length > 0 && typedName === expectedName;

  const handleConfirm = async () => {
    if (!staff) return;
    setDeleting(true);
    try {
      const result = await deleteStaff(staff.id);
      if (result.success) {
        toast.success(`Deleted ${result.full_name ?? staff.full_name}`);
        onDeleted(staff.id);
        onOpenChange(false);
      } else {
        toast.error(result.error ?? "Delete failed");
        // If server-side blocked (race), re-check
        if (result.blocked_items?.length) {
          setEligibility({
            eligible: false,
            reason: result.error ?? "Blocked",
            blocked_items: result.blocked_items.map((t) => ({ type: t as BlockedItem["type"], name: t })),
          });
        }
      }
    } catch (e) {
      toast.error((e as Error).message ?? "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {staff?.full_name ?? "Staff"}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action <strong>cannot be undone</strong>. The staff's auth account, profile, and all downstream records
            (wings, departments, houses, role manager assignments) will be permanently removed. The Staff ID is never
            reused.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking dependencies…
            </div>
          )}

          {!loading && eligibility && !eligibility.eligible && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2">
              <p className="text-sm font-medium text-destructive">{eligibility.reason}</p>
              {eligibility.blocked_items.length > 0 && (
                <ul className="space-y-1 pl-1">
                  {eligibility.blocked_items.map((it, i) => (
                    <BlockedItemRow key={`${it.type}-${it.name}-${i}`} item={it} />
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted-foreground pt-1">
                Reassign the staff from the relevant tab (Role Manager / Wings / Departments / Houses) and try again.
              </p>
            </div>
          )}

          {!loading && eligibility?.eligible && (
            <div className="space-y-3">
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                All cascade checks passed. This staff has no blocking dependencies and can be deleted safely.
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="delete-staff-confirm-name"
                  className="text-sm font-medium leading-none"
                >
                  Type <span className="font-semibold">{staff?.full_name}</span> to confirm
                </label>
                <Input
                  id="delete-staff-confirm-name"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder={staff?.full_name ?? ""}
                  disabled={deleting}
                />
                {confirmName.length > 0 && !nameMatches && (
                  <p className="text-xs text-destructive">Name does not match.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading || deleting || !eligibility?.eligible || !nameMatches}
            className={buttonVariants({ variant: "destructive" })}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting…
              </>
            ) : (
              "Delete Permanently"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
