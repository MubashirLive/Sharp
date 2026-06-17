import { useState, useEffect, useMemo, useCallback } from "react";
import { Loader2, Plus, X, User, Users, Crown, Pencil, Save, RotateCcw, GraduationCap, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  getAvailableStaffForWing,
  type WingWithStats,
} from "@/integrations/supabase/queries/wings";
import { useSaveWingAssignments, useWingsForSchool } from "@/hooks/useRoleManagerQueries";
import { WingStaffBadge } from "./WingStaffBadge";
import { CoordinatorReplacementDialog } from "./CoordinatorReplacementDialog";
import { CoordinatorsViewAllModal } from "./CoordinatorsViewAllModal";

interface WingsAssignmentTabProps {
  schoolId: string;
  canEdit: boolean;
}

// Academic rank for sorting classes
const getClassAcademicRank = (className: string): number => {
  const name = className.toLowerCase().trim();
  if (name === "nursery") return 0;
  if (name === "lkg") return 1;
  if (name === "ukg") return 2;
  const match = name.match(/class\s*(\d+)/i) || name.match(/^(\d+)$/);
  if (match) return 10 + parseInt(match[1], 10);
  return 100;
};

// Mini stat component
interface StatProps {
  icon: React.ReactNode;
  count: number;
  label: string;
  color?: string;
}

function Stat({ icon, count, label, color }: StatProps) {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
        color === 'amber' ? 'bg-amber-100 text-amber-700' :
        color === 'blue' ? 'bg-blue-100 text-blue-700' :
        color === 'green' ? 'bg-green-100 text-green-700' :
        'bg-muted text-muted-foreground'
      }`}
      title={label}
    >
      {icon}
      <span className="font-medium">{count}</span>
    </div>
  );
}

// Staff chip component
interface StaffChipProps {
  name: string;
  role?: "coordinator" | "teacher";
  isPrimary?: boolean;
  isAutoAssigned?: boolean;
  onRemove?: () => void;
  canRemove?: boolean;
}

function StaffChip({ name, role, isPrimary, isAutoAssigned, onRemove, canRemove }: StaffChipProps) {
  return (
    <div
      className={`flex items-center gap-1 rounded px-2 py-1 text-xs ${
        role === "coordinator" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700" : "bg-muted"
      }`}
    >
      {role === "coordinator" && <Crown className="h-3 w-3 text-amber-600" />}
      <span className="truncate max-w-[100px]">{name}</span>
      {isPrimary && <span className="text-[10px] font-bold">✨</span>}
      {isAutoAssigned && (
        <Lock
          className="h-3 w-3 text-muted-foreground flex-shrink-0"
          title="Auto-assigned from class assignment"
        />
      )}
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          disabled={isAutoAssigned}
          title={isAutoAssigned ? "Auto-assigned from class assignment — remove via Subjects tab" : undefined}
          className={`ml-1 ${
            isAutoAssigned
              ? "opacity-40 cursor-not-allowed"
              : "hover:text-destructive"
          }`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Staff picker component
interface StaffPickerProps {
  staffList: Array<{ id: string; full_name: string; father_name?: string }>;
  onSelect: (staff: { id: string; full_name: string }) => void;
  buttonLabel: string;
}

function StaffPicker({ staffList, onSelect, buttonLabel }: StaffPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredStaff = search
    ? staffList.filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()))
    : staffList.slice(0, 10);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          {buttonLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search staff..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No staff found.</CommandEmpty>
            <CommandGroup>
              {filteredStaff.map((staff) => (
                <CommandItem
                  key={staff.id}
                  value={staff.id}
                  onSelect={() => {
                    onSelect(staff);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="cursor-pointer py-2"
                >
                  <User className="h-4 w-4 mr-2" />
                  <div>
                    <div className="text-sm">{staff.full_name}</div>
                    {staff.father_name && (
                      <div className="text-xs text-muted-foreground">{staff.father_name}</div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Draft change types
interface DraftAdd {
  staffId: string;
  staffName: string;
  role: "coordinator" | "teacher";
}

interface WingDraft {
  addedCoordinators: DraftAdd[];
  addedTeachers: DraftAdd[];
  removedCoordinatorIds: string[];
  removedTeacherIds: string[];
}

// Main component
export function WingsAssignmentTab({ schoolId, canEdit }: WingsAssignmentTabProps) {
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [drafts, setDrafts] = useState<Map<string, WingDraft>>(new Map());
  const [expandedWings, setExpandedWings] = useState<Set<string>>(new Set());
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: string; full_name: string; father_name?: string }>>([]);
  const [viewAllModalOpen, setViewAllModalOpen] = useState(false);
  const [viewAllModalWingId, setViewAllModalWingId] = useState<string | null>(null);
  const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
  const [replacementTarget, setReplacementTarget] = useState<{
    wingId: string;
    wingName: string;
    staffName: string;
  } | null>(null);
  const [staffFilter, setStaffFilter] = useState("");
  const [staffPage, setStaffPage] = useState(1);
  const PAGE_SIZE = 25;

  const saveMutation = useSaveWingAssignments(schoolId);
  const wingsQuery = useWingsForSchool(schoolId);
  const loading = wingsQuery.isLoading;
  const wings = useMemo(() => {
    const wingsData = wingsQuery.data ?? [];
    return [...wingsData].sort((a, b) => {
      const aMin = a.classes.length
        ? Math.min(...a.classes.map((c) => getClassAcademicRank(c.name)))
        : 999;
      const bMin = b.classes.length
        ? Math.min(...b.classes.map((c) => getClassAcademicRank(c.name)))
        : 999;
      return aMin - bMin;
    });
  }, [wingsQuery.data]);

  // Surface wings fetch errors — original loadData called toast.error on
  // failure. Without this, a failed fetch (network, RLS, etc.) falls
  // through to the empty state and the user sees "No wings created yet"
  // even when wings exist.
  useEffect(() => {
    if (wingsQuery.error) {
      console.error("Failed to load wings:", wingsQuery.error);
      toast.error("Failed to load wings data");
    }
  }, [wingsQuery.error]);

  // One-shot picker data fetch — kept outside TanStack on purpose: this
  // is a modal-population fetch, not a per-school subscription that
  // needs cross-component invalidation.
  useEffect(() => {
    let cancelled = false;
    getAvailableStaffForWing(schoolId)
      .then((staff) => {
        if (!cancelled) setAvailableStaff(staff);
      })
      .catch((e) => {
        console.error("Failed to load available staff:", e);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolId]);

  // Before unload guard
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing]);

  // Compute hasChanges
  const hasChanges = useMemo(() => {
    if (!isEditing) return false;
    return Array.from(drafts.values()).some(
      (d) =>
        d.addedCoordinators.length > 0 ||
        d.addedTeachers.length > 0 ||
        d.removedCoordinatorIds.length > 0 ||
        d.removedTeacherIds.length > 0
    );
  }, [isEditing, drafts]);

  /**
   * Get the optimistic-edit draft for a wing, or a fresh empty draft if
   * none exists yet.
   *
   * IMPORTANT: this is a pure read. Do NOT call `setDrafts` from here.
   * An earlier version did, which created a race: `setDrafts` is async,
   * so the caller's immediate read of `drafts.get(wingId)` was still
   * `undefined` → `next.get(wingId)!` lied → crash on the very first
   * X click → "cross button does not work".
   *
   * Callers must build a new `Map(drafts)`, set the updated entry, and
   * call `setDrafts` once.
   */
  const getDraft = useCallback(
    (wingId: string): WingDraft => {
      const existing = drafts.get(wingId);
      if (existing) return existing;
      return {
        addedCoordinators: [],
        addedTeachers: [],
        removedCoordinatorIds: [],
        removedTeacherIds: [],
      };
    },
    [drafts]
  );

  // Get effective lists (original + drafts combined)
  const getEffectiveLists = useCallback(
    (wing: WingWithStats) => {
      const draft = drafts.get(wing.id);
      const coordinators = wing.coordinators.filter(
        (c) => !draft?.removedCoordinatorIds.includes(c.staff_id)
      );
      const teachers = wing.teachers.filter(
        (t) => !draft?.removedTeacherIds.includes(t.staff_id)
      );

      return {
        coordinators: [
          ...coordinators,
          ...(draft?.addedCoordinators ?? []).map((a) => ({
            id: a.staffId,
            staff_id: a.staffId,
            staff_name: a.staffName,
            is_primary: false,
            auto_assigned: false,
          })),
        ],
        teachers: [
          ...teachers,
          ...(draft?.addedTeachers ?? []).map((a) => ({
            id: a.staffId,
            staff_id: a.staffId,
            staff_name: a.staffName,
            auto_assigned: false,
          })),
        ],
      };
    },
    [drafts]
  );

  // Toggle expanded state
  const toggleExpanded = (wingId: string) => {
    setExpandedWings((prev) => {
      const next = new Set(prev);
      if (next.has(wingId)) next.delete(wingId);
      else next.add(wingId);
      return next;
    });
  };

  // Enter edit mode - keep collapsed, user expands one wing at a time
  const enterEditMode = () => {
    setIsEditing(true);
    setDrafts(new Map());
  };

  // Cancel edit mode
  const cancelEdit = async () => {
    await wingsQuery.refetch();
    setDrafts(new Map());
    setIsEditing(false);
    setExpandedWings(new Set());
    setReplacementTarget(null);
  };

  // Save all pending changes
  const handleSave = async () => {
    setSaving(true);
    try {
      const additions: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }> = [];
      const removals: Array<{ wingId: string; staffId: string; role: "coordinator" | "teacher" }> = [];

      drafts.forEach((draft, wingId) => {
        for (const a of draft.addedCoordinators) {
          additions.push({ wingId, staffId: a.staffId, role: "coordinator" });
        }
        for (const a of draft.addedTeachers) {
          additions.push({ wingId, staffId: a.staffId, role: "teacher" });
        }
        for (const staffId of draft.removedCoordinatorIds) {
          removals.push({ wingId, staffId, role: "coordinator" });
        }
        for (const staffId of draft.removedTeacherIds) {
          removals.push({ wingId, staffId, role: "teacher" });
        }
      });

      await saveMutation.mutateAsync({ schoolId, additions, removals });
      // useSaveWingAssignments.onSuccess invalidates
      // roleManagerKeys.wings(schoolId), which the active useWingsForSchool
      // query is subscribed to — no manual refetch needed here.

      toast.success("All changes saved");
      setDrafts(new Map());
      setIsEditing(false);
      setExpandedWings(new Set());
    } catch (e: any) {
      console.error("Save failed:", e);
      toast.error(e?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  // Add coordinator (optimistic)
  const handleAddCoordinator = (wingId: string, staff: { id: string; full_name: string }) => {
    const draft = getDraft(wingId);
    // Check if already added
    if (draft.addedCoordinators.some((a) => a.staffId === staff.id)) return;

    const next = new Map(drafts);
    next.set(wingId, {
      ...draft,
      addedCoordinators: [...draft.addedCoordinators, { staffId: staff.id, staffName: staff.full_name, role: "coordinator" }],
    });
    setDrafts(next);
  };

  // Add teacher (optimistic)
  const handleAddTeacher = (wingId: string, staff: { id: string; full_name: string }) => {
    const draft = getDraft(wingId);
    if (draft.addedTeachers.some((a) => a.staffId === staff.id)) return;

    const next = new Map(drafts);
    next.set(wingId, {
      ...draft,
      addedTeachers: [...draft.addedTeachers, { staffId: staff.id, staffName: staff.full_name, role: "teacher" }],
    });
    setDrafts(next);
  };

  /**
   * Remove staff from a wing (X click handler).
   *
   * For coordinators: if this is the only coordinator, open the
   * "Actor Replacement" dialog instead of removing. The dialog's
   * confirm handler will call `applyRemoveStaff` directly, bypassing
   * this guard.
   *
   * For teachers: removes directly via the auto-assigned vs manual
   * branch in `handleSave`.
   */
  const handleRemoveStaff = (wingId: string, staffId: string, role: "coordinator" | "teacher") => {
    const wing = wings.find((w) => w.id === wingId);
    if (!wing) return;

    // Get current effective lists
    const { coordinators, teachers } = getEffectiveLists(wing);
    const staff = role === "coordinator" ? coordinators.find((c) => c.staff_id === staffId) : teachers.find((t) => t.staff_id === staffId);
    if (!staff) return;

    // Defense-in-depth: auto-assigned teachers cannot be removed here
    // (the X button is already disabled, but guard the handler too)
    if (role === "teacher" && staff.auto_assigned) {
      return;
    }

    // Check if removing sole coordinator — Actor Replacement Protocol
    if (role === "coordinator" && coordinators.length === 1) {
      setReplacementTarget({
        wingId,
        wingName: wing.name,
        staffName: staff.staff_name,
      });
      setReplacementDialogOpen(true);
      return;
    }

    applyRemoveStaff(wingId, staffId, role);
  };

  /**
   * Apply the draft mutation for a staff removal. Extracted from
   * `handleRemoveStaff` so the replacement-dialog path can also call
   * it without re-triggering the sole-coordinator guard.
   *
   * Does NOT call setDrafts — caller must call `setDrafts(next)` after.
   */
  const applyRemoveStaff = (
    wingId: string,
    staffId: string,
    role: "coordinator" | "teacher"
  ) => {
    const next = new Map(drafts);
    // getDraft returns a fresh empty draft if the wing has no draft yet —
    // do not call `next.get(wingId)!` here, that was the crash.
    const current = getDraft(wingId);

    if (role === "coordinator") {
      // If was in addedCoordinators, remove from there instead
      if (current.addedCoordinators.some((a) => a.staffId === staffId)) {
        next.set(wingId, {
          ...current,
          addedCoordinators: current.addedCoordinators.filter((a) => a.staffId !== staffId),
        });
      } else {
        next.set(wingId, {
          ...current,
          removedCoordinatorIds: [...current.removedCoordinatorIds, staffId],
        });
      }
    } else {
      // If was in addedTeachers, remove from there
      if (current.addedTeachers.some((a) => a.staffId === staffId)) {
        next.set(wingId, {
          ...current,
          addedTeachers: current.addedTeachers.filter((a) => a.staffId !== staffId),
        });
      } else {
        next.set(wingId, {
          ...current,
          removedTeacherIds: [...current.removedTeacherIds, staffId],
        });
      }
    }

    setDrafts(next);
  };

  /**
   * Confirm handler for the "Cannot Remove Sole Coordinator" dialog.
   *
   * Two paths:
   *  1. User picked a replacement — add them to the draft first so the
   *     wing is never coordinatorless.
   *  2. User clicked "Remove Anyway" — just remove the old coordinator.
   *
   * In both cases, calls `applyRemoveStaff` (NOT `handleRemoveStaff`) so
   * the sole-coordinator guard does not re-trigger and re-open the dialog.
   */
  const handleReplacementConfirm = async (replacementStaffId?: string) => {
    if (!replacementTarget) return;

    const { wingId } = replacementTarget;
    const wing = wings.find((w) => w.id === wingId);
    const { coordinators } = getEffectiveLists(wing!);
    const soleCoord = coordinators[0];
    if (!soleCoord) return;

    setReplacementDialogOpen(false);

    // If a replacement was selected, add them to the draft first so the
    // wing is never empty when the old coordinator is removed.
    if (replacementStaffId) {
      const staff = availableStaff.find((s) => s.id === replacementStaffId);
      if (staff) {
        handleAddCoordinator(wingId, staff);
      }
    }

    // Remove old coordinator. Call applyRemoveStaff directly — the
    // sole-coordinator guard in handleRemoveStaff has already been
    // satisfied by the dialog confirmation.
    applyRemoveStaff(wingId, soleCoord.staff_id, "coordinator");
  };

  // View all coordinators
  const handleViewAllCoordinators = (wing: WingWithStats) => {
    setViewAllModalWingId(wing.id);
    setViewAllModalOpen(true);
  };

  // Get effective wing for view all modal
  const effectiveWingForModal = useMemo(() => {
    if (!viewAllModalWingId) return null;
    const wing = wings.find((w) => w.id === viewAllModalWingId);
    if (!wing) return null;
    const { coordinators } = getEffectiveLists(wing);
    return { ...wing, coordinators };
  }, [viewAllModalWingId, wings, getEffectiveLists]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state — show retry so user can recover without a full reload
  if (wingsQuery.error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-2">Failed to load wings</p>
        <Button variant="outline" size="sm" onClick={() => wingsQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (wings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No wings created yet. Create wings in My School first.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: Edit/Save/Cancel buttons */}
      {canEdit && (
        <div className="flex justify-end gap-2">
          {!isEditing ? (
            <Button onClick={enterEditMode} variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          ) : (
            <>
              <Button onClick={cancelEdit} variant="outline" size="sm" disabled={saving}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm" disabled={saving || !hasChanges}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        {wings.map((wing) => {
          const isExpanded = expandedWings.has(wing.id);
          const { coordinators, teachers } = getEffectiveLists(wing);

          return (
            <div key={wing.id} className="border rounded-lg overflow-hidden">
              {/* Wing Header */}
              <div className="bg-muted/30 border-b px-4 py-3 flex items-center gap-3">
                <h3 className="font-semibold text-base w-40">{wing.name}</h3>
                <div className="flex flex-wrap gap-1 flex-1">
                  {wing.classes.slice(0, 5).map((cls) => (
                    <Badge key={cls.id} variant="outline" className="text-xs">
                      {cls.name}
                    </Badge>
                  ))}
                  {wing.classes.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{wing.classes.length - 5}
                    </Badge>
                  )}
                  {wing.classes.length === 0 && (
                    <span className="text-xs text-muted-foreground">No classes</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Stat
                    icon={<Users className="h-3 w-3" />}
                    count={coordinators.length + teachers.length}
                    label="Total Staff"
                  />
                  <Stat
                    icon={<Crown className="h-3 w-3" />}
                    count={coordinators.length}
                    label="Coordinators"
                    color="amber"
                  />
                  <Stat
                    icon={<User className="h-3 w-3" />}
                    count={teachers.length}
                    label="Teachers"
                    color="blue"
                  />
                  <Stat
                    icon={<GraduationCap className="h-3 w-3" />}
                    count={wing.stats.students}
                    label="Students"
                    color="green"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpanded(wing.id)}
                  className="h-8 text-xs"
                >
                  {isExpanded ? "Hide" : isEditing ? "Edit" : "View"}
                </Button>
              </div>

              {/* Wing Body */}
              {isExpanded && (
                <div className="p-4">
                  {!isEditing ? (
                    /* Read-only view */
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                          <Crown className="h-3 w-3 text-amber-500" />
                          Coordinators ({coordinators.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {coordinators.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No coordinators</span>
                          ) : (
                            coordinators.map((coord) => (
                              <StaffChip
                                key={coord.id}
                                name={coord.staff_name}
                                role="coordinator"
                                isPrimary={coord.is_primary}
                              />
                            ))
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Teachers ({teachers.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {teachers.length === 0 ? (
                            <span className="text-xs text-muted-foreground">No teachers</span>
                          ) : (
                            teachers.map((teacher) => (
                              <WingStaffBadge
                                key={teacher.id}
                                name={teacher.staff_name}
                                role={teacher.auto_assigned ? "class_teacher" : "subject_teacher"}
                                autoAssigned={teacher.auto_assigned}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Edit mode */
                    <div className="grid grid-cols-2 gap-6">
                      <div className="border-l-2 border-amber-400 pl-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                          <Crown className="h-3 w-3 text-amber-500" />
                          Coordinators ({coordinators.length})
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {coordinators.map((coord) => (
                            <StaffChip
                              key={coord.id}
                              name={coord.staff_name}
                              role="coordinator"
                              isPrimary={coord.is_primary}
                              onRemove={() => handleRemoveStaff(wing.id, coord.staff_id, "coordinator")}
                              canRemove
                            />
                          ))}
                          {coordinators.length === 0 && (
                            <span className="text-xs text-muted-foreground">No coordinators</span>
                          )}
                          <StaffPicker
                            staffList={availableStaff.filter(
                              (s) => !coordinators.some((c) => c.staff_id === s.id) && !teachers.some((t) => t.staff_id === s.id)
                            )}
                            onSelect={(staff) => handleAddCoordinator(wing.id, staff)}
                            buttonLabel="Add Coordinator"
                          />
                        </div>
                      </div>
                      <div className="border-l-2 border-blue-400 pl-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Teachers ({teachers.length})
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <StaffPicker
                            staffList={availableStaff.filter(
                              (s) => !coordinators.some((c) => c.staff_id === s.id) && !teachers.some((t) => t.staff_id === s.id)
                            )}
                            onSelect={(staff) => handleAddTeacher(wing.id, staff)}
                            buttonLabel="Add Teacher"
                          />
                          {(teachers.length > 5 || staffFilter) && (
                            <input
                              type="text"
                              placeholder="Search..."
                              value={staffFilter}
                              onChange={(e) => {
                                setStaffFilter(e.target.value);
                                setStaffPage(1);
                              }}
                              className="text-xs px-2 py-1 border rounded w-24"
                            />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                          {(() => {
                            const filtered = teachers.filter((s) => {
                              if (staffFilter && !s.staff_name.toLowerCase().includes(staffFilter.toLowerCase())) {
                                return false;
                              }
                              return true;
                            });
                            const paginated = filtered.slice((staffPage - 1) * PAGE_SIZE, staffPage * PAGE_SIZE);
                            return paginated.length === 0 ? (
                              <span className="text-xs text-muted-foreground">No teachers</span>
                            ) : (
                              <>
                                {paginated.map((teacher) => (
                                  <div key={teacher.id} className="flex items-center gap-1">
                                    <WingStaffBadge
                                      name={teacher.staff_name}
                                      role={teacher.auto_assigned ? "class_teacher" : "subject_teacher"}
                                      autoAssigned={teacher.auto_assigned}
                                    />
                                    {teacher.auto_assigned ? (
                                      <span
                                        className="opacity-40 cursor-not-allowed"
                                        title="Auto-assigned from class assignment — remove via Subjects tab"
                                      >
                                        <X className="h-3 w-3" />
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handleRemoveStaff(wing.id, teacher.staff_id, "teacher")}
                                        className="hover:text-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {filtered.length > PAGE_SIZE && (
                                  <div className="flex items-center gap-1 text-xs col-span-2">
                                    <button
                                      onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                                      disabled={staffPage === 1}
                                      className="px-1 hover:bg-muted rounded disabled:opacity-50"
                                    >
                                      ◀
                                    </button>
                                    <span>
                                      {staffPage}/{Math.ceil(filtered.length / PAGE_SIZE)}
                                    </span>
                                    <button
                                      onClick={() => setStaffPage((p) => p + 1)}
                                      disabled={staffPage >= Math.ceil(filtered.length / PAGE_SIZE)}
                                      className="px-1 hover:bg-muted rounded disabled:opacity-50"
                                    >
                                      ▶
                                    </button>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {!isEditing && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Crown className="h-3 w-3 text-amber-500" />
            <span>Coordinator</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>Teacher</span>
          </div>
        </div>
      )}

      {/* View All Coordinators Modal */}
      <CoordinatorsViewAllModal
        open={viewAllModalOpen}
        onOpenChange={(open) => {
          setViewAllModalOpen(open);
          if (!open) setViewAllModalWingId(null);
        }}
        wing={effectiveWingForModal}
        schoolId={schoolId}
        canEdit={canEdit && isEditing}
      />

      <CoordinatorReplacementDialog
        open={replacementDialogOpen}
        onOpenChange={setReplacementDialogOpen}
        wingName={replacementTarget?.wingName || ""}
        staffName={replacementTarget?.staffName || ""}
        schoolId={schoolId}
        wingId={replacementTarget?.wingId || ""}
        availableStaff={availableStaff}
        onConfirm={handleReplacementConfirm}
      />

      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </div>
  );
}