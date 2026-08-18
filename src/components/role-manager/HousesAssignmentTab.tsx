// HousesAssignmentTab — Role Manager > Houses. Per-card edit model
// matching DepartmentsAssignmentTab parity (see 2026-06-18 patch):
// each card owns a HouseAssignmentDraft; the parent (this file) drives
// the save through useSaveHouseAssignments, gates the cross-house move
// through HouseMovePromptDialog, and invalidates staffList + broad
// staff-roles prefix + houses on success.
//
// House definitions (name, color, emblem) live in `schools.houses` JSON
// and are owned by My School > HousesTab per docs/HOUSE.md §1. This tab
// only edits staff membership + incharge designation. Rename or reset
// happens in My School.
//
// One-house-per-staff (docs/HOUSE.md §3) is enforced at the DB level by
// `assignStaffToHouse` (pre-deletes any existing row). The UI surface for
// this constraint is HouseMovePromptDialog — surfaces the move before
// save fires.
//
// No minimum staff / no minimum incharge per docs/HOUSE.md §3 and §7.2.
// Removing the last incharge of a house is intentionally allowed (no
// Actor Replacement gate — unlike Departments).

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useHousesWithDetails,
  useSaveHouseAssignments,
  useAvailableStaffForWing,
  roleManagerKeys,
} from "@/hooks/useRoleManagerQueries";
import { useQueryClient } from "@tanstack/react-query";
import {
  HouseAssignmentCard,
  type HouseAssignmentDraft,
  type HouseStaff,
} from "./HouseAssignmentCard";
import {
  HouseMovePromptDialog,
  type HouseMoveEntry,
} from "./HouseMovePromptDialog";

interface HousesAssignmentTabProps {
  schoolId: string;
  canEdit: boolean;
  onAssignmentChange: () => void;
  /** Bubble dirty state to RoleManagerTab for tab-switch guard. */
  onDirtyChange?: (isDirty: boolean) => void;
}

export function HousesAssignmentTab({
  schoolId,
  canEdit,
  onAssignmentChange,
  onDirtyChange,
}: HousesAssignmentTabProps) {
  const qc = useQueryClient();
  const housesQuery = useHousesWithDetails(schoolId);
  const availableStaffQuery = useAvailableStaffForWing(schoolId);
  const saveMutation = useSaveHouseAssignments(schoolId);

  const loading = housesQuery.isLoading;
  const houses = useMemo(() => housesQuery.data ?? [], [housesQuery.data]);
  const availableStaff: HouseStaff[] = useMemo(
    () =>
      (availableStaffQuery.data ?? []).map((s) => ({
        id: s.id,
        full_name: s.full_name,
        father_name: s.father_name,
        gender: (s as any).gender ?? null,
      })),
    [availableStaffQuery.data]
  );

  // Page state — only one card can be in edit mode at a time.
  const [editingHouseName, setEditingHouseName] = useState<string | null>(null);
  const [expandedHouses, setExpandedHouses] = useState<Set<string>>(new Set());
  // Per-card dirty state. Aggregated up to onDirtyChange below.
  const [dirtyHouseNames, setDirtyHouseNames] = useState<Set<string>>(new Set());

  // Move-prompt gate.
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    houseName: string;
    draft: HouseAssignmentDraft;
    moves: HouseMoveEntry[];
  } | null>(null);

  // Bubble dirty state. Per-card dirty OR save-pending OR error.
  // hasSeeded: only emit dirty after the first render cycle so we never
  // flicker dirty=true on mount while cards report isEditing=false.
  const [hasSeeded, setHasSeeded] = useState(false);
  useEffect(() => {
    setHasSeeded(true);
  }, []);
  const isSaving = saveMutation.isPending;
  useEffect(() => {
    onDirtyChange?.(hasSeeded && (dirtyHouseNames.size > 0 || isSaving || saveMutation.isError));
  }, [dirtyHouseNames, isSaving, saveMutation.isError, onDirtyChange, hasSeeded]);

  // Surface fetch errors.
  useEffect(() => {
    if (housesQuery.error) {
      console.error("Failed to load houses:", housesQuery.error);
      toast.error("Failed to load house data");
    }
  }, [housesQuery.error]);

  const toggleExpanded = (houseName: string) => {
    setExpandedHouses((prev) => {
      const next = new Set(prev);
      if (next.has(houseName)) next.delete(houseName);
      else next.add(houseName);
      return next;
    });
  };

  // --- Save orchestration ---

  // Convert a HouseAssignmentDraft into the mutation input shape.
  const buildSaveInput = (houseName: string, draft: HouseAssignmentDraft) => {
    const additions: Array<{ houseName: string; staffId: string; role: "incharge" | "staff" }> = [];
    const removals: Array<{ houseName: string; staffId: string; role: "incharge" | "staff" }> = [];
    for (const a of draft.addedIncharges) {
      additions.push({ houseName, staffId: a.staffId, role: "incharge" });
    }
    for (const a of draft.addedStaff) {
      additions.push({ houseName, staffId: a.staffId, role: "staff" });
    }
    for (const id of draft.removedInchargeIds) {
      removals.push({ houseName, staffId: id, role: "incharge" });
    }
    for (const id of draft.removedStaffIds) {
      removals.push({ houseName, staffId: id, role: "staff" });
    }
    return { schoolId, additions, removals };
  };

  // Detect cross-house moves in the draft. A move = a staff being added to
  // a house they're already in (different from target). The DB will
  // atomically delete the old row, so we surface it to the user first.
  const detectMoves = (houseName: string, draft: HouseAssignmentDraft): HouseMoveEntry[] => {
    const moves: HouseMoveEntry[] = [];
    const allHouses = houses;
    for (const a of draft.addedIncharges) {
      for (const h of allHouses) {
        if (h.definition.name === houseName) continue;
        if (h.incharges.some((ic) => ic.staffId === a.staffId)) {
          moves.push({
            staffId: a.staffId,
            staffName: a.staffName,
            fromHouse: h.definition.name,
            toHouse: houseName,
            role: "incharge",
          });
          break;
        }
        if (h.staff.some((s) => s.staffId === a.staffId && !s.isIncharge)) {
          moves.push({
            staffId: a.staffId,
            staffName: a.staffName,
            fromHouse: h.definition.name,
            toHouse: houseName,
            role: "incharge",
          });
          break;
        }
      }
    }
    for (const a of draft.addedStaff) {
      // Skip if already counted as an incharge move.
      if (moves.some((m) => m.staffId === a.staffId)) continue;
      for (const h of allHouses) {
        if (h.definition.name === houseName) continue;
        if (h.staff.some((s) => s.staffId === a.staffId)) {
          moves.push({
            staffId: a.staffId,
            staffName: a.staffName,
            fromHouse: h.definition.name,
            toHouse: houseName,
            role: "staff",
          });
          break;
        }
      }
    }
    return moves;
  };

  // Fire the save. Called after the move-prompt gate has resolved (or
  // after a no-gate path).
  const performSave = async (houseName: string, draft: HouseAssignmentDraft) => {
    const input = buildSaveInput(houseName, draft);
    try {
      await saveMutation.mutateAsync(input);
    } catch (e: any) {
      console.error("House save failed:", e);
      toast.error(e?.message ?? "Failed to save house changes");
      return; // keep the card in edit mode for retry
    }

    toast.success(`${houseName} updated`);
    setEditingHouseName(null);
    setDirtyHouseNames((prev) => {
      const next = new Set(prev);
      next.delete(houseName);
      return next;
    });
    onAssignmentChange();
  };

  // Card → parent: attempt a save. Parent runs the move-prompt gate.
  const handleAttemptSave = ({
    houseName,
    draft,
  }: {
    houseName: string;
    draft: HouseAssignmentDraft;
  }) => {
    const moves = detectMoves(houseName, draft);
    if (moves.length > 0) {
      setPendingMove({ houseName, draft, moves });
      setMoveDialogOpen(true);
      return;
    }
    void performSave(houseName, draft);
  };

  // Move-prompt: confirm. Fires the save.
  const handleMoveConfirm = () => {
    if (!pendingMove) return;
    const { houseName, draft } = pendingMove;
    setMoveDialogOpen(false);
    setPendingMove(null);
    void performSave(houseName, draft);
  };

  // --- Loading / error / empty states ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (housesQuery.error) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-destructive">Failed to load houses.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: roleManagerKeys.houses(schoolId) });
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (houses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No houses configured. Set up houses in My School first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {houses.map((house) => {
          const isOtherCardBeingEdited =
            editingHouseName !== null && editingHouseName !== house.definition.name;
          return (
            <HouseAssignmentCard
              key={house.definition.name}
              house={house}
              staffList={availableStaff}
              canEdit={canEdit}
              isOtherCardBeingEdited={isOtherCardBeingEdited}
              isExpanded={expandedHouses.has(house.definition.name)}
              onToggleExpanded={() => toggleExpanded(house.definition.name)}
              onEditStateChange={(isEditing) => {
                setEditingHouseName((prev) =>
                  isEditing ? house.definition.name : prev === house.definition.name ? null : prev
                );
              }}
              onDirtyChange={(isDirty) => {
                setDirtyHouseNames((prev) => {
                  const next = new Set(prev);
                  if (isDirty) next.add(house.definition.name);
                  else next.delete(house.definition.name);
                  return next;
                });
              }}
              onAttemptSave={handleAttemptSave}
              isSaving={isSaving}
            />
          );
        })}
      </div>

      {pendingMove && (
        <HouseMovePromptDialog
          open={moveDialogOpen}
          onOpenChange={(open) => {
            setMoveDialogOpen(open);
            if (!open) setPendingMove(null);
          }}
          moves={pendingMove.moves}
          onConfirm={handleMoveConfirm}
        />
      )}
    </div>
  );
}
