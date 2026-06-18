import { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from "react";
import { Loader2, Plus, X, Crown, User, ChevronDown, ChevronRight, Pencil, Save, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useHouses } from "@/hooks/useRoleManagerQueries";
import {
  assignStaffToHouse,
  removeStaffFromHouse,
  setHouseIncharge,
  removeHouseIncharge,
  getHouseStaffGroupedByWing,
  getHouseIncharges,
  type HouseWithStats,
  type HouseStaffMember,
  type HouseStaffGroupedByWing,
  type HouseInchargeInfo,
} from "@/integrations/supabase/queries/houses";

interface HousesAssignmentTabProps {
  schoolId: string;
  canEdit: boolean;
  onAssignmentChange: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface HousesAssignmentTabHandle {
  save: () => Promise<void>;
}

function getClassAcademicRank(className: string): number {
  const name = className.toLowerCase().trim();
  if (name === "nursery") return 0;
  if (name === "lkg") return 1;
  if (name === "ukg") return 2;
  const match = name.match(/class\s*(\d+)/i) || name.match(/^(\d+)$/);
  if (match) return 10 + parseInt(match[1], 10);
  return 100;
}

function genderSymbol(gender: string | null): string {
  if (gender === "male" || gender === "M") return "♂";
  if (gender === "female" || gender === "F") return "♀";
  return "?";
}

interface StaffCommandProps {
  staffList: Array<{ id: string; full_name: string; father_name?: string }>;
  onSelect: (staff: { id: string; full_name: string }) => void;
  excludeIds?: string[];
}

function StaffCommand({ staffList, onSelect, excludeIds = [] }: StaffCommandProps) {
  const [search, setSearch] = useState("");

  const filtered = staffList
    .filter((s) => !excludeIds.includes(s.id))
    .filter((s) => s.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Command>
      <CommandInput
        placeholder="Search staff..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No staff found.</CommandEmpty>
        <CommandGroup>
          {filtered.slice(0, 10).map((staff) => (
            <CommandItem
              key={staff.id}
              value={staff.id}
              onSelect={() => {
                onSelect({ id: staff.id, full_name: staff.full_name });
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
  );
}

export const HousesAssignmentTab = forwardRef<HousesAssignmentTabHandle, HousesAssignmentTabProps>(({ schoolId, canEdit, onAssignmentChange, onDirtyChange }, ref) => {
  const { user } = useAuth();
  const housesQuery = useHouses(schoolId);
  const loading = housesQuery.isLoading;
  const [housesWithStats, setHousesWithStats] = useState<HouseWithStats[]>([]);
  const [originalHouses, setOriginalHouses] = useState<HouseWithStats[]>([]);
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: string; full_name: string; father_name?: string }>>([]);
  const [saving, setSaving] = useState(false);

  // Edit mode + drafts
  const [isEditing, setIsEditing] = useState(false);
  const [drafts, setDrafts] = useState<Map<string, HouseDraft>>(new Map());

  // Expose save to parent
  useImperativeHandle(ref, () => ({
    save: handleSave,
  }));

  // Expanded state
  const [expandedHouses, setExpandedHouses] = useState<Set<string>>(new Set());
  const [expandedData, setExpandedData] = useState<Map<string, HouseStaffGroupedByWing[]>>(new Map());

  // Adapt query data into local state. Also seeds the Edit-mode
  // baseline (`originalHouses`) on first arrival and after saves.
  useEffect(() => {
    if (!housesQuery.data) return;
    setHousesWithStats(housesQuery.data);
    setOriginalHouses(housesQuery.data);
  }, [housesQuery.data]);

  // Surface fetch errors
  useEffect(() => {
    if (housesQuery.error) {
      console.error("Failed to load houses:", housesQuery.error);
      toast.error("Failed to load house data");
    }
  }, [housesQuery.error]);

  // Available staff for the picker — separate fetch, lives outside the
  // useHouses cache because it's a large list and the picker only
  // needs id + name. Re-fetched when schoolId changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("staff_profiles")
        .select("profile_id, full_name, father_name")
        .eq("school_id", schoolId)
        .order("full_name");
      if (cancelled) return;
      setAvailableStaff(
        ((data ?? []) as any[]).map((s) => ({
          id: s.profile_id,
          full_name: s.full_name,
          father_name: s.father_name,
        }))
      );
    })();
    return () => { cancelled = true; };
  }, [schoolId]);

  // Compute hasChanges
  const hasChanges = useMemo(() => {
    if (!isEditing) return false;
    return Array.from(drafts.values()).some(
      (d) =>
        d.addedIncharges.length > 0 ||
        d.addedStaff.length > 0 ||
        d.removedInchargeIds.length > 0 ||
        d.removedStaffIds.length > 0
    );
  }, [isEditing, drafts]);

  // Notify parent of dirty state
  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  const toggleExpanded = async (houseName: string) => {
    setExpandedHouses((prev) => {
      const next = new Set(prev);
      if (next.has(houseName)) next.delete(houseName);
      else next.add(houseName);
      return next;
    });

    // Fetch data if expanding
    const willExpand = !expandedHouses.has(houseName);
    if (willExpand && !expandedData.has(houseName)) {
      const grouped = await getHouseStaffGroupedByWing(houseName, schoolId);
      setExpandedData((prev) => {
        const next = new Map(prev);
        next.set(houseName, grouped);
        return next;
      });
    }
  };

  // Inline edit mode handlers (replaces modal)
  const enterEditMode = () => {
    setIsEditing(true);
    setDrafts(new Map());
  };

  const cancelEdit = () => {
    setHousesWithStats(originalHouses);
    setDrafts(new Map());
    setIsEditing(false);
    setExpandedHouses(new Set());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const operations: Promise<any>[] = [];

      drafts.forEach((draft, houseName) => {
        for (const add of draft.addedIncharges) {
          operations.push(setHouseIncharge(houseName, add.staffId, schoolId, user?.id));
        }
        for (const add of draft.addedStaff) {
          operations.push(assignStaffToHouse(houseName, add.staffId, schoolId, user?.id));
        }
        for (const staffId of draft.removedInchargeIds) {
          operations.push(removeHouseIncharge(houseName, staffId, schoolId));
        }
        for (const staffId of draft.removedStaffIds) {
          operations.push(removeStaffFromHouse(houseName, staffId, schoolId));
        }
      });

      await Promise.all(operations);
      toast.success(`All changes saved`);
      await housesQuery.refetch();
      setDrafts(new Map());
      setIsEditing(false);
      setExpandedHouses(new Set());
    } catch (e: any) {
      console.error("Save failed:", e);
      toast.error(e?.message ?? "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const getHouseDraft = useCallback(
    (houseName: string): HouseDraft => {
      const existing = drafts.get(houseName);
      if (existing) return existing;
      const newDraft: HouseDraft = {
        addedIncharges: [],
        addedStaff: [],
        removedInchargeIds: [],
        removedStaffIds: [],
      };
      const next = new Map(drafts);
      next.set(houseName, newDraft);
      setDrafts(next);
      return newDraft;
    },
    [drafts]
  );

  const updateDraft = (houseName: string, update: (d: HouseDraft) => HouseDraft) => {
    const current = getHouseDraft(houseName);
    const next = new Map(drafts);
    next.set(houseName, update(current));
    setDrafts(next);
  };

  const handleAddIncharge = (houseName: string, staff: { id: string; full_name: string; father_name?: string; gender?: string | null }) => {
    const draft = getHouseDraft(houseName);
    if (draft.addedIncharges.some((a) => a.staffId === staff.id)) return;
    updateDraft(houseName, (d) => ({
      ...d,
      addedIncharges: [...d.addedIncharges, { staffId: staff.id, staffName: staff.full_name, fatherName: staff.father_name, gender: staff.gender }],
      removedInchargeIds: d.removedInchargeIds.filter((id) => id !== staff.id),
    }));
  };

  const handleRemoveIncharge = (houseName: string, staffId: string) => {
    const draft = getHouseDraft(houseName);
    const wasAdded = draft.addedIncharges.some((a) => a.staffId === staffId);
    updateDraft(houseName, (d) => ({
      ...d,
      addedIncharges: wasAdded ? d.addedIncharges.filter((a) => a.staffId !== staffId) : d.addedIncharges,
      removedInchargeIds: wasAdded ? d.removedInchargeIds : [...d.removedInchargeIds, staffId],
    }));
  };

  const handleAddStaff = (houseName: string, staff: { id: string; full_name: string; father_name?: string; gender?: string | null }) => {
    const draft = getHouseDraft(houseName);
    if (draft.addedStaff.some((a) => a.staffId === staff.id)) return;
    updateDraft(houseName, (d) => ({
      ...d,
      addedStaff: [...d.addedStaff, { staffId: staff.id, staffName: staff.full_name, fatherName: staff.father_name, gender: staff.gender }],
      removedStaffIds: d.removedStaffIds.filter((id) => id !== staff.id),
    }));
  };

  const handleRemoveStaff = (houseName: string, staffId: string) => {
    const draft = getHouseDraft(houseName);
    const wasAdded = draft.addedStaff.some((a) => a.staffId === staffId);
    updateDraft(houseName, (d) => ({
      ...d,
      addedStaff: wasAdded ? d.addedStaff.filter((a) => a.staffId !== staffId) : d.addedStaff,
      removedStaffIds: wasAdded ? d.removedStaffIds : [...d.removedStaffIds, staffId],
    }));
  };

  // HouseStats has no incharges/staff arrays — those come from getHouseIncharges
  // / getHouseStaffGroupedByWing. For the inline-edit preview, only show
  // draft additions/removals; the full lists are loaded on expand.
  const getEffectiveLists = useCallback(
    (_house: HouseWithStats, draft: HouseDraft | undefined) => {
      return {
        incharges: (draft?.addedIncharges ?? []).map((a) => ({
          staffId: a.staffId,
          fullName: a.staffName,
          fatherName: a.fatherName,
        })),
        staff: (draft?.addedStaff ?? []).map((a) => ({
          staffId: a.staffId,
          fullName: a.staffName,
          fatherName: a.fatherName,
          gender: a.gender ?? null,
          isIncharge: false,
          wings: [],
        })),
      };
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (housesWithStats.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No houses configured. Set up houses in My School first.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {housesWithStats.map((house) => {
          const { definition, stats } = house;
          const isExpanded = expandedHouses.has(definition.name);
          const draft = drafts.get(definition.name);
          const { incharges: effectiveIncharges, staff: effectiveStaff } = getEffectiveLists(
            house,
            draft
          );
          const isOtherCardBeingEdited = isEditing && !draft;

          return (
            <div
              key={definition.name}
              className={`border rounded-lg overflow-hidden transition-opacity ${
                isOtherCardBeingEdited ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              {/* Header */}
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => toggleExpanded(definition.name)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Stats Table */}
              <div className="p-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="text-left py-1 font-medium w-1/2">STUDENTS</th>
                      <th className="text-left py-1 font-medium w-1/2">TEACHERS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Total row */}
                    <tr className="border-b">
                      <td className="py-1.5 font-medium">
                        Total: {stats.totalStudents}
                      </td>
                      <td className="py-1.5 font-medium">
                        Total: {stats.totalTeachers}
                      </td>
                    </tr>
                    {/* Wing rows */}
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

              {/* Footer: Incharge + Expand label */}
              <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/20">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-muted-foreground">Incharge:</span>
                  {stats.totalIncharges === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    stats.byWing.map((wing) => {
                      // Show incharge from this house (we need to look it up)
                      return null; // We'll show inline in expanded, just show count on card
                    })
                  )}
                  <span className="text-xs text-muted-foreground">
                    {stats.totalIncharges} 👑
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {isExpanded ? "Collapse" : "Expand"}
                </span>
              </div>

              {/* Inline Edit Section (when editing) */}
              {isEditing && (
                <div className="border-t bg-amber-50/30 dark:bg-amber-900/10 p-3 space-y-3">
                  {/* Coordinators */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Crown className="h-3.5 w-3.5 text-amber-600" />
                        <span className="text-xs font-semibold text-amber-700">Coordinators ({effectiveIncharges.length})</span>
                      </div>
                      <Popover modal={false}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 text-xs">
                            <Plus className="h-3 w-3 mr-1" />Add
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="end">
                          <StaffCommandWithHouse
                            staffList={availableStaff}
                            onSelect={(s) => handleAddIncharge(definition.name, s)}
                            excludeIds={[
                              ...effectiveIncharges.map((ic) => ic.staffId),
                              ...effectiveStaff.map((s) => s.staffId),
                            ]}
                            staffHouseMap={staffHouseMap}
                            housesWithStats={housesWithStats}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {effectiveIncharges.length === 0 && (
                        <span className="text-xs text-muted-foreground">No coordinators</span>
                      )}
                      {effectiveIncharges.map((ic) => (
                        <div key={ic.staffId} className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 rounded px-2 py-1 text-xs">
                          <Crown className="h-3 w-3" />
                          <span>{ic.fullName}</span>
                          <button onClick={() => handleRemoveIncharge(definition.name, ic.staffId)} className="hover:text-destructive">
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
                        <span className="text-xs font-semibold text-muted-foreground">Staff ({effectiveStaff.length})</span>
                      </div>
                      <Popover modal={false}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 text-xs">
                            <Plus className="h-3 w-3 mr-1" />Add
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="end">
                          <StaffCommandWithHouse
                            staffList={availableStaff}
                            onSelect={(s) => handleAddStaff(definition.name, s)}
                            excludeIds={[
                              ...effectiveStaff.map((s) => s.staffId),
                              ...effectiveIncharges.map((ic) => ic.staffId),
                            ]}
                            staffHouseMap={staffHouseMap}
                            housesWithStats={housesWithStats}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {effectiveStaff.length === 0 && (
                        <span className="text-xs text-muted-foreground">No staff</span>
                      )}
                      {effectiveStaff.map((s) => (
                        <div key={s.staffId} className="flex items-center gap-1 bg-muted rounded px-2 py-1 text-xs">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{s.fullName}</span>
                          <span className="text-muted-foreground">{genderSymbol(s.gender)}</span>
                          <button onClick={() => handleRemoveStaff(definition.name, s.staffId)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t bg-muted/10 p-3 space-y-3">
                  {(() => {
                    const grouped = expandedData.get(definition.name) ?? [];
                    const totalStaff = grouped.reduce((sum, g) => sum + g.staff.length, 0);
                    const uniqueStaff = new Set<string>();
                    const multiWing: string[] = [];
                    for (const g of grouped) {
                      for (const s of g.staff) {
                        if (uniqueStaff.has(s.staffId)) {
                          if (!multiWing.includes(s.fullName)) multiWing.push(s.fullName);
                        }
                        uniqueStaff.add(s.staffId);
                      }
                    }

                    const showMultiWing = multiWing.length > 0;

                    return (
                      <>
                        {/* Incharges */}
                        <div>
                          <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                            <Crown className="h-3.5 w-3.5 text-amber-600" />
                            Incharges ({stats.totalIncharges})
                          </h4>
                          <div className="flex flex-wrap gap-1.5">
                            {stats.totalIncharges === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              grouped.flatMap((g) => g.staff.filter((s) => s.isIncharge)).map((s) => (
                                <div key={s.staffId} className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1 text-xs">
                                  <Crown className="h-3 w-3 text-amber-600" />
                                  <span>{s.fullName}</span>
                                  <span className="text-[10px] text-muted-foreground">{s.wings.join(", ")}</span>
                                  {canEdit && (
                                    <button onClick={() => handleRemoveIncharge(s.staffId, s.fullName)} className="hover:text-destructive ml-1">
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                            {canEdit && (
                              <Popover
                                open={staffPickerTarget === `incharge-${definition.name}`}
                                onOpenChange={(open) => {
                                  if (open) setStaffPickerTarget(`incharge-${definition.name}`);
                                  else setStaffPickerTarget(null);
                                }}
                              >
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-6 text-[10px]">
                                    <Plus className="h-3 w-3 mr-0.5" /> Add
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-0" align="start">
                                  <StaffCommand
                                    staffList={availableStaff}
                                    onSelect={(staff) => {
                                      setStaffPickerTarget(null);
                                      handleAssignIncharge(staff);
                                    }}
                                    excludeIds={grouped.flatMap((g) => g.staff.map((s) => s.staffId))}
                                  />
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                        </div>

                        {/* Staff by wing */}
                        <div>
                          <h4 className="text-xs font-semibold mb-1.5 flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            Staff ({totalStaff})
                          </h4>
                          <div className="space-y-2">
                            {grouped.map((g) => (
                              <div key={g.wingId ?? g.wingName}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-medium text-muted-foreground">
                                    {g.wingName} ({g.staff.length})
                                  </span>
                                  {canEdit && (
                                    <Popover
                                      open={staffPickerTarget === `wing-${definition.name}-${g.wingName}`}
                                      onOpenChange={(open) => {
                                        if (open) setStaffPickerTarget(`wing-${definition.name}-${g.wingName}`);
                                        else setStaffPickerTarget(null);
                                      }}
                                    >
                                      <PopoverTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-5 text-[10px] px-1">
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-56 p-0" align="start">
                                        <StaffCommand
                                          staffList={availableStaff}
                                          onSelect={(staff) => {
                                            setStaffPickerTarget(null);
                                            handleAssignStaff(staff);
                                          }}
                                          excludeIds={grouped.flatMap((g2) => g2.staff.map((s) => s.staffId))}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  )}
                                </div>
                                <p className="text-xs mt-0.5">
                                  {g.staff.map((s) => s.fullName).join(", ") || "—"}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Multi-wing notice */}
                        {showMultiWing && (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-1 border-t">
                            {multiWing.length} staff appear in multiple wings: {multiWing.join(", ")}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      
      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
    </div>
  );
});

