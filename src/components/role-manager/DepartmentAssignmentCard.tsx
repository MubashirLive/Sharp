// DepartmentAssignmentCard — single department card in the Role Manager >
// Departments tab. Collapsed (name + status + counts) → expanded (read-only
// incharge + member lists) → edit (drafts in a DeptDraft, +Add / X popovers,
// Cancel / Save Changes). Matches HousesAssignmentTab parity.
//
// Actor Replacement Protocol: the parent (DepartmentsAssignmentTab) owns the
// sole-incharge gate. This card reports draft changes via onDirtyChange and
// asks the parent to open the dialog via onRequestSoleInchargeGate; the
// parent resumes the save after the user resolves it. The save itself is
// driven by the parent — the card just owns the draft.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, X, User, Crown, ChevronDown, ChevronRight,
  Pencil, Save, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import type { DepartmentWithDetails } from "@/integrations/supabase/queries/departments";

export interface DeptStaff {
  id: string;
  full_name: string;
  father_name?: string;
}

export interface DeptDraft {
  addedIncharges: { staffId: string; staffName: string }[];
  addedMembers: { staffId: string; staffName: string }[];
  removedInchargeIds: string[];
  removedMemberIds: string[];
}

interface DepartmentAssignmentCardProps {
  dept: DepartmentWithDetails;
  staffList: DeptStaff[];
  canEdit: boolean;
  /** True when this card is NOT the currently-edited card — should dim. */
  isOtherCardBeingEdited: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  /** Notifies parent when the card enters/leaves edit mode. */
  onEditStateChange: (isEditing: boolean) => void;
  /** Notifies parent of unsaved changes (gates tab-switch). */
  onDirtyChange: (isDirty: boolean) => void;
  /**
   * Ask the parent to attempt a save. The parent is responsible for the
   * Actor Replacement gate, the mutation, and the cross-tab invalidation.
   * If `validateSoleIncharge` returns false, the parent opens the dialog
   * and holds the draft until resolved.
   */
  onAttemptSave: (ctx: { deptId: string; draft: DeptDraft; validateSoleIncharge: () => boolean }) => void;
  /** True while the parent is mid-save (disables the Save button). */
  isSaving: boolean;
  /** Current user — used to render "I Will Become Incharge" copy correctly. */
  currentUserId: string;
}

export function DepartmentAssignmentCard({
  dept,
  staffList,
  canEdit,
  isOtherCardBeingEdited,
  isExpanded,
  onToggleExpanded,
  onEditStateChange,
  onDirtyChange,
  onAttemptSave,
  isSaving,
  currentUserId,
}: DepartmentAssignmentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<DeptDraft>({
    addedIncharges: [],
    addedMembers: [],
    removedInchargeIds: [],
    removedMemberIds: [],
  });
  const [inchargePopoverOpen, setInchargePopoverOpen] = useState(false);
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false);

  // Reset draft when edit-mode ends.
  useEffect(() => {
    if (!isEditing) {
      setDraft({
        addedIncharges: [],
        addedMembers: [],
        removedInchargeIds: [],
        removedMemberIds: [],
      });
    }
  }, [isEditing]);

  // Base (current DB) lists.
  const baseIncharges = useMemo(
    () => dept.incharges.map((i) => ({ staffId: i.staff_profile_id, name: i.staff_name })),
    [dept.incharges]
  );
  // Members in the DB but NOT in incharges. (Incharge also implies member, but
  // `department_staff` stores one row; we don't double-render.)
  const baseMembers = useMemo(() => {
    const inchargeIds = new Set(baseIncharges.map((b) => b.staffId));
    return dept.members
      .filter((m) => m.role === "member" && !inchargeIds.has(m.staff_profile_id))
      .map((m) => ({ staffId: m.staff_profile_id, name: m.staff_name }));
  }, [dept.members, baseIncharges]);

  // Effective lists = base - removed + added.
  const effectiveIncharges = useMemo(() => {
    const removed = new Set(draft.removedInchargeIds);
    const addedIds = new Set(draft.addedIncharges.map((a) => a.staffId));
    return [
      ...baseIncharges
        .filter((b) => !removed.has(b.staffId) && !addedIds.has(b.staffId))
        .map((b) => ({ staffId: b.staffId, name: b.name, source: "base" as const })),
      ...draft.addedIncharges.map((a) => ({ staffId: a.staffId, name: a.staffName, source: "added" as const })),
    ];
  }, [baseIncharges, draft.addedIncharges, draft.removedInchargeIds]);

  const effectiveMembers = useMemo(() => {
    const removed = new Set(draft.removedMemberIds);
    const addedIds = new Set(draft.addedMembers.map((a) => a.staffId));
    const inchargeIds = new Set(effectiveIncharges.map((i) => i.staffId));
    return [
      ...baseMembers
        .filter((b) => !removed.has(b.staffId) && !addedIds.has(b.staffId) && !inchargeIds.has(b.staffId))
        .map((b) => ({ staffId: b.staffId, name: b.name, source: "base" as const })),
      ...draft.addedMembers
        .filter((a) => !inchargeIds.has(a.staffId))
        .map((a) => ({ staffId: a.staffId, name: a.staffName, source: "added" as const })),
    ];
  }, [baseMembers, draft.addedMembers, draft.removedMemberIds, effectiveIncharges]);

  const hasChanges =
    draft.addedIncharges.length > 0 ||
    draft.addedMembers.length > 0 ||
    draft.removedInchargeIds.length > 0 ||
    draft.removedMemberIds.length > 0;

  // Bubble edit state to parent.
  useEffect(() => {
    onEditStateChange(isEditing);
  }, [isEditing, onEditStateChange]);

  // Bubble dirty state.
  useEffect(() => {
    onDirtyChange(isEditing && hasChanges);
  }, [isEditing, hasChanges, onDirtyChange]);

  // Validate: would this draft leave the dept with zero incharges?
  const validateSoleIncharge = useCallback((): boolean => {
    if (effectiveIncharges.length > 0) return true;
    return false;
  }, [effectiveIncharges.length]);

  // Add incharge (from popover).
  const handleAddIncharge = (staff: DeptStaff) => {
    if (draft.addedIncharges.some((a) => a.staffId === staff.id)) return;
    // If already in addedMembers, remove from there (an incharge implies a member).
    setDraft((d) => ({
      ...d,
      addedIncharges: [...d.addedIncharges, { staffId: staff.id, staffName: staff.full_name }],
      addedMembers: d.addedMembers.filter((m) => m.staffId !== staff.id),
      removedInchargeIds: d.removedInchargeIds.filter((id) => id !== staff.id),
      removedMemberIds: d.removedMemberIds.filter((id) => id !== staff.id),
    }));
    setInchargePopoverOpen(false);
  };

  // Add member.
  const handleAddMember = (staff: DeptStaff) => {
    if (draft.addedMembers.some((a) => a.staffId === staff.id)) return;
    if (effectiveIncharges.some((i) => i.staffId === staff.id)) return; // already an incharge
    setDraft((d) => ({
      ...d,
      addedMembers: [...d.addedMembers, { staffId: staff.id, staffName: staff.full_name }],
      removedMemberIds: d.removedMemberIds.filter((id) => id !== staff.id),
    }));
    setMemberPopoverOpen(false);
  };

  // Remove incharge.
  const handleRemoveIncharge = (staffId: string) => {
    const wasAdded = draft.addedIncharges.some((a) => a.staffId === staffId);
    setDraft((d) => ({
      ...d,
      addedIncharges: wasAdded ? d.addedIncharges.filter((a) => a.staffId !== staffId) : d.addedIncharges,
      removedInchargeIds: wasAdded ? d.removedInchargeIds : [...d.removedInchargeIds, staffId],
    }));
  };

  // Remove member.
  const handleRemoveMember = (staffId: string) => {
    const wasAdded = draft.addedMembers.some((a) => a.staffId === staffId);
    setDraft((d) => ({
      ...d,
      addedMembers: wasAdded ? d.addedMembers.filter((a) => a.staffId !== staffId) : d.addedMembers,
      removedMemberIds: wasAdded ? d.removedMemberIds : [...d.removedMemberIds, staffId],
    }));
  };

  // Save click — defer to parent.
  const handleSaveClick = () => {
    onAttemptSave({ deptId: dept.id, draft, validateSoleIncharge });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Exclude IDs for pickers.
  const excludeFromIncharge = new Set([
    ...effectiveIncharges.map((i) => i.staffId),
    ...effectiveMembers.map((m) => m.staffId),
  ]);
  const excludeFromMember = new Set([
    ...effectiveIncharges.map((i) => i.staffId),
    ...effectiveMembers.map((m) => m.staffId),
  ]);

  const inactve = effectiveIncharges.length === 0;

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-opacity ${
        isOtherCardBeingEdited ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{dept.name}</span>
          {inactve && (
            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Crown className="h-3 w-3 text-amber-600" />
            {effectiveIncharges.length}
            <User className="h-3 w-3 ml-2" />
            {effectiveMembers.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onToggleExpanded}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Body — read-only or edit */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {!isEditing ? (
            <ReadOnlyBody
              incharges={effectiveIncharges.map((i) => ({ staffId: i.staffId, name: i.name }))}
              members={effectiveMembers.map((m) => ({ staffId: m.staffId, name: m.name }))}
            />
          ) : (
            <EditBody
              incharges={effectiveIncharges.map((i) => ({ staffId: i.staffId, name: i.name }))}
              members={effectiveMembers.map((m) => ({ staffId: m.staffId, name: m.name }))}
              staffList={staffList}
              excludeFromIncharge={excludeFromIncharge}
              excludeFromMember={excludeFromMember}
              inchargePopoverOpen={inchargePopoverOpen}
              setInchargePopoverOpen={setInchargePopoverOpen}
              memberPopoverOpen={memberPopoverOpen}
              setMemberPopoverOpen={setMemberPopoverOpen}
              onAddIncharge={handleAddIncharge}
              onAddMember={handleAddMember}
              onRemoveIncharge={handleRemoveIncharge}
              onRemoveMember={handleRemoveMember}
              currentUserId={currentUserId}
            />
          )}
        </div>
      )}

      {/* Footer */}
      {isExpanded && canEdit && (
        <div className="flex items-center justify-end gap-2 px-3 py-2 border-t bg-muted/20">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          ) : (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={isSaving}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveClick}
                size="sm"
                className="h-7 text-xs"
                disabled={isSaving || !hasChanges}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// --- Subcomponents ---

function ReadOnlyBody({
  incharges,
  members,
}: {
  incharges: { staffId: string; name: string }[];
  members: { staffId: string; name: string }[];
}) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1">
          <Crown className="h-3.5 w-3.5 text-amber-600" />
          Incharges ({incharges.length})
        </h4>
        {incharges.length === 0 ? (
          <span className="text-xs text-muted-foreground">No incharges</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {incharges.map((i) => (
              <div
                key={i.staffId}
                className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded px-2 py-1 text-xs"
              >
                <Crown className="h-3 w-3" />
                <span>{i.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          Members ({members.length})
        </h4>
        {members.length === 0 ? (
          <span className="text-xs text-muted-foreground">No members</span>
        ) : (
          <p className="text-xs text-muted-foreground">
            {members.map((m) => m.name).join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function EditBody({
  incharges,
  members,
  staffList,
  excludeFromIncharge,
  excludeFromMember,
  inchargePopoverOpen,
  setInchargePopoverOpen,
  memberPopoverOpen,
  setMemberPopoverOpen,
  onAddIncharge,
  onAddMember,
  onRemoveIncharge,
  onRemoveMember,
  currentUserId,
}: {
  incharges: { staffId: string; name: string }[];
  members: { staffId: string; name: string }[];
  staffList: DeptStaff[];
  excludeFromIncharge: Set<string>;
  excludeFromMember: Set<string>;
  inchargePopoverOpen: boolean;
  setInchargePopoverOpen: (o: boolean) => void;
  memberPopoverOpen: boolean;
  setMemberPopoverOpen: (o: boolean) => void;
  onAddIncharge: (s: DeptStaff) => void;
  onAddMember: (s: DeptStaff) => void;
  onRemoveIncharge: (id: string) => void;
  onRemoveMember: (id: string) => void;
  currentUserId: string;
}) {
  return (
    <div className="space-y-3">
      {/* Incharges */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">
              Incharges ({incharges.length})
            </span>
          </div>
          <Popover
            open={inchargePopoverOpen}
            onOpenChange={setInchargePopoverOpen}
            modal={false}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <StaffCommand
                staffList={staffList}
                onSelect={onAddIncharge}
                excludeIds={excludeFromIncharge}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap gap-1">
          {incharges.length === 0 && (
            <span className="text-xs text-muted-foreground">No incharges</span>
          )}
          {incharges.map((i) => (
            <div
              key={i.staffId}
              className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded px-2 py-1 text-xs"
            >
              <Crown className="h-3 w-3" />
              <span>{i.name}</span>
              <button
                onClick={() => onRemoveIncharge(i.staffId)}
                className="hover:text-destructive"
                aria-label="Remove incharge"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">
              Members ({members.length})
            </span>
          </div>
          <Popover
            open={memberPopoverOpen}
            onOpenChange={setMemberPopoverOpen}
            modal={false}
          >
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-6 text-xs">
                <Plus className="h-3 w-3 mr-1" />Add
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <StaffCommand
                staffList={staffList}
                onSelect={onAddMember}
                excludeIds={excludeFromMember}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap gap-1">
          {members.length === 0 && (
            <span className="text-xs text-muted-foreground">No members</span>
          )}
          {members.map((m) => (
            <div
              key={m.staffId}
              className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs"
            >
              <User className="h-3 w-3 text-muted-foreground" />
              <span>{m.name}</span>
              <button
                onClick={() => onRemoveMember(m.staffId)}
                className="hover:text-destructive"
                aria-label="Remove member"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StaffCommand({
  staffList,
  onSelect,
  excludeIds,
}: {
  staffList: DeptStaff[];
  onSelect: (s: DeptStaff) => void;
  excludeIds: Set<string>;
}) {
  const [search, setSearch] = useState("");
  const filtered = staffList
    .filter((s) => !excludeIds.has(s.id))
    .filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 10);
  return (
    <Command>
      <CommandInput
        placeholder="Search staff..."
        value={search}
        onValueChange={setSearch}
        autoFocus
      />
      <CommandList>
        <CommandEmpty>No staff found.</CommandEmpty>
        <CommandGroup>
          {filtered.map((staff) => (
            <CommandItem
              key={staff.id}
              value={staff.id}
              onSelect={() => onSelect(staff)}
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
  );
}
