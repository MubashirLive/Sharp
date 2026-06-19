// DepartmentsAssignmentTab — Role Manager > Departments. Per-card edit
// model matching WingsAssignmentTab and HousesAssignmentTab: each card
// owns a DeptDraft; the parent (this file) drives the save through
// useSaveDepartmentAssignments, gates the sole-incharge removal through
// ActorReplacementDialog, and invalidates staffList + staff-roles prefix
// + departments on success.
//
// Removed in 2026-06-18: per-dept Settings (messenger JSON) + Log
// (DepartmentLogPanel) buttons. Both surfaces live in My School per
// docs/DEPARTMENT.md §1 (ownership split). messenger_settings column
// is still set on create by My School; no UI surface in Role Manager
// reads or writes it.

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDepartments,
  useSaveDepartmentAssignments,
  useAvailableStaffForWing,
  roleManagerKeys,
} from "@/hooks/useRoleManagerQueries";
import { logDepartmentAction } from "@/integrations/supabase/queries/departments";
import { useQueryClient } from "@tanstack/react-query";
import { DepartmentAssignmentCard, type DeptDraft, type DeptStaff } from "./DepartmentAssignmentCard";
import { ActorReplacementDialog } from "./ActorReplacementDialog";

interface DepartmentsAssignmentTabProps {
  schoolId: string;
  canEdit: boolean;
  onAssignmentChange: () => void;
  /** Bubble dirty state to RoleManagerTab for tab-switch guard. */
  onDirtyChange?: (isDirty: boolean) => void;
}

export function DepartmentsAssignmentTab({
  schoolId,
  canEdit,
  onAssignmentChange,
  onDirtyChange,
}: DepartmentsAssignmentTabProps) {
  const { user } = useAuth();
  const currentUserId = user?.id ?? "";
  const currentUserName = user?.full_name ?? "Current User";

  const qc = useQueryClient();
  const departmentsQuery = useDepartments(schoolId);
  const availableStaffQuery = useAvailableStaffForWing(schoolId);
  const saveMutation = useSaveDepartmentAssignments(schoolId);

  const loading = departmentsQuery.isLoading;
  const departments = useMemo(() => departmentsQuery.data ?? [], [departmentsQuery.data]);
  const availableStaff: DeptStaff[] = useMemo(
    () => (availableStaffQuery.data ?? []).map((s) => ({
      id: s.id,
      full_name: s.full_name,
      father_name: s.father_name,
    })),
    [availableStaffQuery.data]
  );

  // Page state — only one card can be in edit mode at a time.
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  // Per-card dirty state. Aggregated up to onDirtyChange below.
  const [dirtyDeptIds, setDirtyDeptIds] = useState<Set<string>>(new Set());

  // Actor Replacement gate.
  const [actorDialogOpen, setActorDialogOpen] = useState(false);
  const [actorContext, setActorContext] = useState<{
    deptId: string;
    deptName: string;
    departingStaffId: string;
    departingStaffName: string;
    /** Draft state at the time of the gate — used to resume the save after resolution. */
    pendingDraft: DeptDraft;
  } | null>(null);

  // Bubble dirty state. Any per-card dirty state counts (the parent has
  // no knowledge of which card is dirty, but the cards call onDirtyChange
  // via their own state — and we mirror their isEditing here as a cheap
  // approximation: the card disables its own Save when not dirty, so a
  // user in edit mode with content will be detected. Belt-and-braces:
  // OR with the actual save-pending flag.
  const isSaving = saveMutation.isPending;
  useEffect(() => {
    onDirtyChange?.(dirtyDeptIds.size > 0 || isSaving || saveMutation.isError);
  }, [dirtyDeptIds, isSaving, saveMutation.isError, onDirtyChange]);

  // Surface fetch errors.
  useEffect(() => {
    if (departmentsQuery.error) {
      console.error("Failed to load departments:", departmentsQuery.error);
      toast.error("Failed to load departments data");
    }
  }, [departmentsQuery.error]);

  const toggleExpanded = (deptId: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  // --- Save orchestration ---

  // Convert a DeptDraft into the mutation input shape. additions = all
  // added incharges + added members. removals = the IDs in
  // removedInchargeIds/removedMemberIds.
  const buildSaveInput = (deptId: string, draft: DeptDraft) => {
    const additions: Array<{ departmentId: string; staffId: string; asIncharge: boolean }> = [];
    for (const a of draft.addedIncharges) {
      additions.push({ departmentId: deptId, staffId: a.staffId, asIncharge: true });
    }
    for (const a of draft.addedMembers) {
      additions.push({ departmentId: deptId, staffId: a.staffId, asIncharge: false });
    }
    const removals: Array<{ departmentId: string; staffId: string; role: "incharge" | "member" }> = [];
    for (const id of draft.removedInchargeIds) {
      removals.push({ departmentId: deptId, staffId: id, role: "incharge" });
    }
    for (const id of draft.removedMemberIds) {
      removals.push({ departmentId: deptId, staffId: id, role: "member" });
    }
    return { schoolId, additions, removals };
  };

  // Fire the save + log. Called after the Actor Replacement gate has
  // merged any replacement into the draft (or after a no-gate path).
  const performSave = async (deptId: string, deptName: string, draft: DeptDraft) => {
    const input = buildSaveInput(deptId, draft);
    try {
      await saveMutation.mutateAsync(input);
    } catch (e: any) {
      console.error("Department save failed:", e);
      toast.error(e?.message ?? "Failed to save department changes");
      return; // keep the card in edit mode for retry
    }

    // Best-effort audit log. Failure is non-fatal.
    try {
      const summary: string[] = [];
      for (const a of draft.addedIncharges) summary.push(`+ incharge ${a.staffName}`);
      for (const a of draft.addedMembers) summary.push(`+ member ${a.staffName}`);
      for (const id of draft.removedInchargeIds) summary.push(`- incharge ${id}`);
      for (const id of draft.removedMemberIds) summary.push(`- member ${id}`);
      if (summary.length) {
        await logDepartmentAction({
          schoolId,
          userId: currentUserId,
          userName: currentUserName,
          deptId,
          deptName,
          action: "assignments_changed",
          what: summary.join(", "),
        });
      }
    } catch (logErr) {
      console.warn("Department audit log failed:", logErr);
    }

    toast.success(`${deptName} updated`);
    setEditingDeptId(null);
    setDirtyDeptIds((prev) => {
      const next = new Set(prev);
      next.delete(deptId);
      return next;
    });
    onAssignmentChange();
  };

  // Card → parent: attempt a save. Parent runs the sole-incharge gate.
  const handleAttemptSave = ({
    deptId,
    draft,
    validateSoleIncharge,
  }: {
    deptId: string;
    draft: DeptDraft;
    validateSoleIncharge: () => boolean;
  }) => {
    if (!validateSoleIncharge()) {
      // Find the staff being removed as incharge — that's the departing one.
      const dept = departments.find((d) => d.id === deptId);
      const departingId = draft.removedInchargeIds[0];
      const departingName =
        dept?.incharges.find((i) => i.staff_profile_id === departingId)?.staff_name ??
        "This staff member";
      setActorContext({
        deptId,
        deptName: dept?.name ?? "Department",
        departingStaffId: departingId,
        departingStaffName: departingName,
        pendingDraft: draft,
      });
      setActorDialogOpen(true);
      return;
    }
    const dept = departments.find((d) => d.id === deptId);
    void performSave(deptId, dept?.name ?? "Department", draft);
  };

  // Actor Replacement: pick a replacement staff.
  const handleActorPickReplacement = (replacementId: string) => {
    if (!actorContext) return;
    const replacement = availableStaff.find((s) => s.id === replacementId);
    const merged: DeptDraft = {
      ...actorContext.pendingDraft,
      addedIncharges: actorContext.pendingDraft.addedIncharges.some((a) => a.staffId === replacementId)
        ? actorContext.pendingDraft.addedIncharges
        : [
            ...actorContext.pendingDraft.addedIncharges,
            { staffId: replacementId, staffName: replacement?.full_name ?? "Replacement" },
          ],
    };
    const ctx = actorContext;
    setActorDialogOpen(false);
    setActorContext(null);
    void performSave(ctx.deptId, ctx.deptName, merged);
  };

  // Actor Replacement: current user becomes incharge.
  const handleActorBecomeIncharge = () => {
    if (!actorContext) return;
    const me = availableStaff.find((s) => s.id === currentUserId);
    const merged: DeptDraft = {
      ...actorContext.pendingDraft,
      addedIncharges: actorContext.pendingDraft.addedIncharges.some((a) => a.staffId === currentUserId)
        ? actorContext.pendingDraft.addedIncharges
        : [
            ...actorContext.pendingDraft.addedIncharges,
            { staffId: currentUserId, staffName: me?.full_name ?? currentUserName },
          ],
    };
    const ctx = actorContext;
    setActorDialogOpen(false);
    setActorContext(null);
    void performSave(ctx.deptId, ctx.deptName, merged);
  };

  // --- Loading / error / empty states ---

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (departmentsQuery.error) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-destructive">Failed to load departments.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            qc.invalidateQueries({ queryKey: roleManagerKeys.departments(schoolId) });
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No departments created yet. Create departments in My School first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {departments.map((dept) => {
          const isOtherCardBeingEdited = editingDeptId !== null && editingDeptId !== dept.id;
          return (
            <DepartmentAssignmentCard
              key={dept.id}
              dept={dept}
              staffList={availableStaff}
              canEdit={canEdit}
              isOtherCardBeingEdited={isOtherCardBeingEdited}
              isExpanded={expandedDepts.has(dept.id)}
              onToggleExpanded={() => toggleExpanded(dept.id)}
              onEditStateChange={(isEditing) => {
                setEditingDeptId((prev) => (isEditing ? dept.id : prev === dept.id ? null : prev));
              }}
              onDirtyChange={(isDirty) => {
                setDirtyDeptIds((prev) => {
                  const next = new Set(prev);
                  if (isDirty) next.add(dept.id);
                  else next.delete(dept.id);
                  return next;
                });
              }}
              onAttemptSave={handleAttemptSave}
              isSaving={isSaving}
              currentUserId={currentUserId}
            />
          );
        })}
      </div>

      {actorContext && (
        <ActorReplacementDialog
          open={actorDialogOpen}
          onOpenChange={(open) => {
            setActorDialogOpen(open);
            if (!open) setActorContext(null);
          }}
          deptName={actorContext.deptName}
          departingStaffId={actorContext.departingStaffId}
          departingStaffName={actorContext.departingStaffName}
          currentUserId={currentUserId}
          staffList={availableStaff}
          onPickReplacement={handleActorPickReplacement}
          onBecomeIncharge={handleActorBecomeIncharge}
        />
      )}
    </div>
  );
}
