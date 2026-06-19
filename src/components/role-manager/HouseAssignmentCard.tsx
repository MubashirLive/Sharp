// HouseAssignmentCard — single house card in the Role Manager > Houses tab.
// Per-card edit model matching DepartmentAssignmentCard: collapsed (header +
// stats table) → expanded (read-only incharge + staff-by-wing) → edit
// (HouseAssignmentDraft, +Add / X popovers, Cancel / Save Changes).
//
// Sync with Staff tab: the parent (HousesAssignmentTab) writes to the same
// `house_staff` / `house_incharges` tables via useSaveHouseAssignments, which
// invalidates staffList + broad staff-roles prefix + houses on success — so
// the Staff tab card's `roles.house` chip refreshes on next visit. No event
// bus or shared store required; the contract is the TanStack query key.
//
// Move prompt: per docs/HOUSE.md §7.1, picking a staff who is already in
// another house surfaces a confirmation dialog before Save fires. The
// detection lives in the parent (which holds the source-of-truth
// `useHouses` payload); this card exposes the draft via onAttemptSave.

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, X, User, Crown, ChevronDown, ChevronRight,
  Pencil, Save, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import type { HouseWithStats, HouseStaffMember } from "@/integrations/supabase/queries/houses";

export interface HouseStaff {
  id: string;
  full_name: string;
  father_name?: string;
  gender: string | null;
}

export interface HouseAssignmentDraft {
  addedIncharges: { staffId: string; staffName: string; fatherName?: string }[];
  addedStaff: { staffId: string; staffName: string; fatherName?: string; gender: string | null }[];
  removedInchargeIds: string[];
  removedStaffIds: string[];
}

interface HouseAssignmentCardProps {
  house: HouseWithStats;
  staffList: HouseStaff[];
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
   * move-prompt gate, the mutation, and the cross-tab invalidation.
   * Parent resumes the save after the user resolves the gate.
   */
  onAttemptSave: (ctx: { houseName: string; draft: HouseAssignmentDraft }) => void;
  /** True while the parent is mid-save (disables the Save button). */
  isSaving: boolean;
}

function genderSymbol(gender: string | null): string {
  if (gender === "male" || gender === "M") return "♂";
  if (gender === "female" || gender === "F") return "♀";
  return "?";
}

export function HouseAssignmentCard({
  house,
  staffList,
  canEdit,
  isOtherCardBeingEdited,
  isExpanded,
  onToggleExpanded,
  onEditStateChange,
  onDirtyChange,
  onAttemptSave,
  isSaving,
}: HouseAssignmentCardProps) {
  const { definition, stats } = house;

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<HouseAssignmentDraft>({
    addedIncharges: [],
    addedStaff: [],
    removedInchargeIds: [],
    removedStaffIds: [],
  });
  const [inchargePopoverOpen, setInchargePopoverOpen] = useState(false);
  const [staffPopoverOpen, setStaffPopoverOpen] = useState(false);

  // Reset draft when edit-mode ends.
  useEffect(() => {
    if (!isEditing) {
      setDraft({
        addedIncharges: [],
        addedStaff: [],
        removedInchargeIds: [],
        removedStaffIds: [],
      });
    }
  }, [isEditing]);

  // Base (current DB) lists.
  const baseIncharges = useMemo(
    () => house.incharges.map((i) => ({ staffId: i.staffId, name: i.fullName })),
    [house.incharges]
  );
  // Staff in the DB but NOT in incharges. (Incharge also implies staff in
  // a house, but `house_staff` stores one row; we don't double-render.)
  const baseStaff = useMemo<HouseStaffMember[]>(
    () => house.staff.filter((s) => !s.isIncharge),
    [house.staff]
  );

  // Effective lists = base - removed + added.
  const effectiveIncharges = useMemo(() => {
    const removed = new Set(draft.removedInchargeIds);
    const addedIds = new Set(draft.addedIncharges.map((a) => a.staffId));
    return [
      ...baseIncharges
        .filter((b) => !removed.has(b.staffId) && !addedIds.has(b.staffId))
        .map((b) => ({ staffId: b.staffId, name: b.name, source: "base" as const })),
      ...draft.addedIncharges.map((a) => ({
        staffId: a.staffId,
        name: a.staffName,
        source: "added" as const,
      })),
    ];
  }, [baseIncharges, draft.addedIncharges, draft.removedInchargeIds]);

  const effectiveStaff = useMemo<HouseStaffMember[]>(() => {
    const removed = new Set(draft.removedStaffIds);
    const addedIds = new Set(draft.addedStaff.map((a) => a.staffId));
    const inchargeIds = new Set(effectiveIncharges.map((i) => i.staffId));
    return [
      ...baseStaff
        .filter((b) => !removed.has(b.staffId) && !addedIds.has(b.staffId) && !inchargeIds.has(b.staffId)),
      ...draft.addedStaff
        .filter((a) => !inchargeIds.has(a.staffId))
        .map((a) => ({
          staffId: a.staffId,
          fullName: a.staffName,
          fatherName: a.fatherName,
          gender: a.gender,
          isIncharge: false,
          wings: [],
        })),
    ];
  }, [baseStaff, draft.addedStaff, draft.removedStaffIds, effectiveIncharges]);

  // Group staff by wing name for expanded read-only view.
  const staffByWing = useMemo(() => {
    const map = new Map<string, HouseStaffMember[]>();
    for (const s of effectiveStaff) {
      const wings = s.wings.length > 0 ? s.wings : ["(No Wing)"];
      for (const w of wings) {
        const arr = map.get(w) ?? [];
        arr.push(s);
        map.set(w, arr);
      }
    }
    return map;
  }, [effectiveStaff]);

  const hasChanges =
    draft.addedIncharges.length > 0 ||
    draft.addedStaff.length > 0 ||
    draft.removedInchargeIds.length > 0 ||
    draft.removedStaffIds.length > 0;

  // Bubble edit state to parent.
  useEffect(() => {
    onEditStateChange(isEditing);
  }, [isEditing, onEditStateChange]);

  // Bubble dirty state.
  useEffect(() => {
    onDirtyChange(isEditing && hasChanges);
  }, [isEditing, hasChanges, onDirtyChange]);

  // Add incharge (from popover).
  const handleAddIncharge = (staff: HouseStaff) => {
    if (draft.addedIncharges.some((a) => a.staffId === staff.id)) return;
    setDraft((d) => ({
      ...d,
      addedIncharges: [
        ...d.addedIncharges,
        { staffId: staff.id, staffName: staff.full_name, fatherName: staff.father_name },
      ],
      addedStaff: d.addedStaff.filter((s) => s.staffId !== staff.id),
      removedInchargeIds: d.removedInchargeIds.filter((id) => id !== staff.id),
      removedStaffIds: d.removedStaffIds.filter((id) => id !== staff.id),
    }));
    setInchargePopoverOpen(false);
  };

  // Add staff.
  const handleAddStaff = (staff: HouseStaff) => {
    if (draft.addedStaff.some((a) => a.staffId === staff.id)) return;
    if (effectiveIncharges.some((i) => i.staffId === staff.id)) return; // already an incharge
    setDraft((d) => ({
      ...d,
      addedStaff: [
        ...d.addedStaff,
        { staffId: staff.id, staffName: staff.full_name, fatherName: staff.father_name, gender: staff.gender },
      ],
      removedStaffIds: d.removedStaffIds.filter((id) => id !== staff.id),
    }));
    setStaffPopoverOpen(false);
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

  // Remove staff.
  const handleRemoveStaff = (staffId: string) => {
    const wasAdded = draft.addedStaff.some((a) => a.staffId === staffId);
    setDraft((d) => ({
      ...d,
      addedStaff: wasAdded ? d.addedStaff.filter((a) => a.staffId !== staffId) : d.addedStaff,
      removedStaffIds: wasAdded ? d.removedStaffIds : [...d.removedStaffIds, staffId],
    }));
  };

  // Save click — defer to parent.
  const handleSaveClick = () => {
    onAttemptSave({ houseName: definition.name, draft });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Exclude IDs for pickers.
  const excludeFromIncharge = new Set([
    ...effectiveIncharges.map((i) => i.staffId),
    ...effectiveStaff.map((s) => s.staffId),
  ]);
  const excludeFromStaff = new Set([
    ...effectiveIncharges.map((i) => i.staffId),
    ...effectiveStaff.map((s) => s.staffId),
  ]);

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-opacity ${
        isOtherCardBeingEdited ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      {/* Header — always visible: emblem + name + incharge count + expand chevron */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ background: definition.emblem_url ? "#888" : definition.color }}
          >
            {definition.emblem_url ? (
              <img
                src={definition.emblem_url}
                alt={definition.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              definition.name[0]
            )}
          </div>
          <span className="font-semibold text-sm">{definition.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Crown className="h-3 w-3 text-amber-600" />
            {effectiveIncharges.length}
            <User className="h-3 w-3 ml-2" />
            {effectiveStaff.length}
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

      {/* Collapsed stats — always visible, matches docs/ROLE_MANAGER.md §3.5 */}
      <div className="p-3">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="text-left py-1 font-medium w-1/2">STUDENTS</th>
              <th className="text-left py-1 font-medium w-1/2">TEACHERS</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-1.5 font-medium">Total: {stats.totalStudents}</td>
              <td className="py-1.5 font-medium">Total: {stats.totalTeachers}</td>
            </tr>
            {stats.byWing.map((wing) => (
              <tr key={wing.wingId ?? wing.wingName} className="border-b last:border-b-0">
                <td className="py-1">
                  {wing.wingName}: {wing.students} ♂{wing.studentsMale} ♀{wing.studentsFemale}
                </td>
                <td className="py-1">
                  {wing.wingName}: {wing.teachers} ♂{wing.teachersMale} ♀{wing.teachersFemale}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded body — read-only or edit */}
      {isExpanded && (
        <div className="border-t">
          {!isEditing ? (
            <ReadOnlyBody
              incharges={effectiveIncharges.map((i) => ({ staffId: i.staffId, name: i.name }))}
              staffByWing={staffByWing}
            />
          ) : (
            <EditBody
              incharges={effectiveIncharges.map((i) => ({ staffId: i.staffId, name: i.name }))}
              staff={effectiveStaff}
              staffList={staffList}
              excludeFromIncharge={excludeFromIncharge}
              excludeFromStaff={excludeFromStaff}
              inchargePopoverOpen={inchargePopoverOpen}
              setInchargePopoverOpen={setInchargePopoverOpen}
              staffPopoverOpen={staffPopoverOpen}
              setStaffPopoverOpen={setStaffPopoverOpen}
              onAddIncharge={handleAddIncharge}
              onAddStaff={handleAddStaff}
              onRemoveIncharge={handleRemoveIncharge}
              onRemoveStaff={handleRemoveStaff}
            />
          )}
        </div>
      )}

      {/* Footer — [Edit] in read, [Cancel][Save Changes] in edit */}
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
  staffByWing,
}: {
  incharges: { staffId: string; name: string }[];
  staffByWing: Map<string, HouseStaffMember[]>;
}) {
  return (
    <div className="p-3 space-y-3 bg-muted/10">
      <div>
        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1">
          <Crown className="h-3.5 w-3.5 text-amber-600" />
          Incharges ({incharges.length})
        </h4>
        {incharges.length === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {incharges.map((i) => (
              <div
                key={i.staffId}
                className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1 text-xs"
              >
                <Crown className="h-3 w-3 text-amber-600" />
                <span>{i.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          Staff ({[...staffByWing.values()].reduce((acc, s) => acc + s.length, 0)})
        </h4>
        {staffByWing.size === 0 ? (
          <span className="text-xs text-muted-foreground">—</span>
        ) : (
          <div className="space-y-2">
            {[...staffByWing.entries()].map(([wingName, members]) => (
              <div key={wingName}>
                <div className="text-[11px] font-medium text-muted-foreground">
                  {wingName} ({members.length})
                </div>
                <p className="text-xs mt-0.5">{members.map((s) => s.fullName).join(", ")}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditBody({
  incharges,
  staff,
  staffList,
  excludeFromIncharge,
  excludeFromStaff,
  inchargePopoverOpen,
  setInchargePopoverOpen,
  staffPopoverOpen,
  setStaffPopoverOpen,
  onAddIncharge,
  onAddStaff,
  onRemoveIncharge,
  onRemoveStaff,
}: {
  incharges: { staffId: string; name: string }[];
  staff: HouseStaffMember[];
  staffList: HouseStaff[];
  excludeFromIncharge: Set<string>;
  excludeFromStaff: Set<string>;
  inchargePopoverOpen: boolean;
  setInchargePopoverOpen: (o: boolean) => void;
  staffPopoverOpen: boolean;
  setStaffPopoverOpen: (o: boolean) => void;
  onAddIncharge: (s: HouseStaff) => void;
  onAddStaff: (s: HouseStaff) => void;
  onRemoveIncharge: (id: string) => void;
  onRemoveStaff: (id: string) => void;
}) {
  return (
    <div className="border-t bg-amber-50/30 dark:bg-amber-900/10 p-3 space-y-3">
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

      {/* Staff */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground">
              Staff ({staff.length})
            </span>
          </div>
          <Popover
            open={staffPopoverOpen}
            onOpenChange={setStaffPopoverOpen}
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
                onSelect={onAddStaff}
                excludeIds={excludeFromStaff}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap gap-1">
          {staff.length === 0 && (
            <span className="text-xs text-muted-foreground">No staff</span>
          )}
          {staff.map((s) => (
            <div
              key={s.staffId}
              className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs"
            >
              <User className="h-3 w-3 text-muted-foreground" />
              <span>{s.fullName}</span>
              <span className="text-muted-foreground">{genderSymbol(s.gender)}</span>
              <button
                onClick={() => onRemoveStaff(s.staffId)}
                className="hover:text-destructive"
                aria-label="Remove staff"
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
  staffList: HouseStaff[];
  onSelect: (s: HouseStaff) => void;
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
