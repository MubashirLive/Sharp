import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2, Search, History, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getWingsWithDetails, logWingAction, type WingWithDetails } from "@/integrations/supabase/queries/wings";
import { toTitleCase } from "@/lib/text-utils";
import { WingLogPanel } from "./WingLogPanel";
import { BoardWingCard } from "./BoardWingCard";
import { UnassignedClassesBox } from "./UnassignedClassesBox";

interface ClassOption {
  id: string;
  name: string;
  acronym: string | null;
  wing_id?: string | null;
  wing_name?: string;
  display_order?: number;
}

interface LocalWing {
  id?: string;
  name: string;
  classes: ClassOption[];
}

interface WingsTabProps {
  schoolId: string;
  canEdit: boolean;
  currentUserId?: string;
  currentUserName?: string;
  onDirtyChange?: (isDirty: boolean) => void;
}

export interface WingsTabHandle {
  save: () => Promise<void>;
  discard: () => void;
}

export const WingsTab = forwardRef<WingsTabHandle, WingsTabProps & { onDirtyChange?: (isDirty: boolean) => void }>(({ schoolId, canEdit, currentUserId, currentUserName, onDirtyChange }, ref) => {
  const [wings, setWings] = useState<WingWithDetails[]>([]);
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLogPanel, setShowLogPanel] = useState(false);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [localWings, setLocalWings] = useState<LocalWing[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // DnD
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [, setOverId] = useState<string | null>(null);
  const [nextWingTempId, setNextWingTempId] = useState(0);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteWingIndex, setDeleteWingIndex] = useState<number>(-1);
  const [deleteWingName, setDeleteWingName] = useState<string>("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // New wing dialog
  const [newWingDialogOpen, setNewWingDialogOpen] = useState(false);
  const [newWingName, setNewWingName] = useState("");

  useImperativeHandle(ref, () => ({
    save: handleSave,
    discard: () => { setLocalWings([]); setIsEditing(false); onDirtyChange?.(false); },
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    fetchData();
  }, [schoolId]);

  const fetchData = async () => {
    if (!schoolId) return;
    setLoading(true);
    const [wingData, { data: classData }] = await Promise.all([
      getWingsWithDetails(schoolId),
      supabase
        .from("classes")
        .select("id, name, acronym, wing_id, display_order")
        .eq("school_id", schoolId)
        .order("display_order"),
    ]);
    setWings(wingData ?? []);
    setAllClasses(
      (classData ?? []).map((c) => ({
        id: c.id,
        name: c.name ?? "",
        acronym: c.acronym ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wing_id: (c as any).wing_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        display_order: (c as any).display_order ?? 999,
      }))
    );
    setLoading(false);
  };

  const getClassAcademicRank = (className: string): number => {
    const name = className.toLowerCase().trim();
    if (name === "nursery") return 0;
    if (name === "lkg") return 1;
    if (name === "ukg") return 2;
    const match = name.match(/class\s*(\d+)/i) || name.match(/^(\d+)$/);
    if (match) return 10 + parseInt(match[1], 10);
    return 100;
  };

  // --- Edit mode enter/exit ---
  const enterEditMode = () => {
    setLocalWings(
      wings.map((w) => ({
        id: w.id,
        name: w.name,
        classes: [...w.classes].sort((a, b) => {
          const aOrder = a.display_order ?? allClasses.find(c => c.id === a.id)?.display_order ?? 999;
          const bOrder = b.display_order ?? allClasses.find(c => c.id === b.id)?.display_order ?? 999;
          return aOrder - bOrder;
        }),
      }))
    );
    setIsEditing(true);
    // dirty signal is driven by the useEffect below — based on computed hasChanges,
    // not asserted on entry. Copying wings → localWings is not a real change.
  };

  const cancelEdit = () => {
    setLocalWings([]);
    setIsEditing(false);
    setDeleteConfirmText("");
    onDirtyChange?.(false);
  };

  const handleRemoveClass = (classId: string) => {
    setLocalWings((prev) =>
      prev.map((w) => ({
        ...w,
        classes: w.classes.filter((c) => c.id !== classId),
      }))
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveClassId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveClassId(null);
    setOverId(null);
    if (!over || !isEditing) return;

    const classId = active.id as string;
    const targetId = over.id as string;

    setLocalWings((prev) => {
      const cls = allClasses.find((c) => c.id === classId);
      if (!cls) return prev;

      let next = prev.map((w) => ({
        ...w,
        classes: w.classes.filter((c) => c.id !== classId),
      }));

      if (targetId !== "unassigned") {
        next = next.map((w) => {
          if (w.id === targetId) {
            const existingIds = new Set(w.classes.map(c => c.id));
            if (existingIds.has(classId)) return w;
            const aClasses = [...w.classes, cls].sort((a, b) => {
              const aOrder = a.display_order ?? allClasses.find(c => c.id === a.id)?.display_order ?? 999;
              const bOrder = b.display_order ?? allClasses.find(c => c.id === b.id)?.display_order ?? 999;
              return aOrder - bOrder;
            });
            return { ...w, classes: aClasses };
          }
          return w;
        });
      }

      return next;
    });
  };

  const handleWingNameChange = (wingIndex: number, name: string) => {
    setLocalWings((prev) =>
      prev.map((w, i) => (i === wingIndex ? { ...w, name } : w))
    );
  };

  const handleDeleteClick = (wingIndex: number) => {
    const wing = localWings[wingIndex];
    setDeleteWingIndex(wingIndex);
    setDeleteWingName(wing?.name ?? "???");
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deleteWingIndex < 0) return;
    setLocalWings((prev) => prev.filter((_, i) => i !== deleteWingIndex));
    setDeleteDialogOpen(false);
    setDeleteWingIndex(-1);
    setDeleteConfirmText("");
  };

  const handleAddNewWing = () => {
    setNewWingName("");
    setNewWingDialogOpen(true);
  };

  const handleConfirmAddWing = () => {
    const name = newWingName.trim();
    if (!name) return;
    setLocalWings((prev) => [
      ...prev,
      { id: `new-wing-${nextWingTempId}`, name, classes: [] },
    ]);
    setNextWingTempId((n) => n + 1);
    setNewWingDialogOpen(false);
    setNewWingName("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const originalWings = wings;

      // Build the final wing data (assign names, filter empty wings)
      const mappedWings = localWings.map((w) => ({
        ...w,
        name: toTitleCase(w.name.trim()),
      }));

      // Validate: each wing must have a name
      const unnamedWings = mappedWings.filter((w) => !w.name.trim());
      if (unnamedWings.length > 0) {
        toast.error("Each wing must have a name");
        setIsSaving(false);
        return;
      }

      // Warn if any new wing has no classes (user forgot to assign classes)
      const emptyNewWings = mappedWings.filter(
        (w) => w.classes.length === 0 && (!w.id || w.id.startsWith("new-wing-"))
      );
      if (emptyNewWings.length > 0) {
        toast.error("Each wing must have at least one class assigned");
        setIsSaving(false);
        return;
      }

      const finalWings = mappedWings.filter((w) => w.classes.length > 0);

      // Wings to delete = was in original but not in final
      const finalIds = new Set(finalWings
        .map((w) => w.id)
        .filter((id) => id && !id.startsWith("new-wing-")));
      const wingsToDelete = originalWings.filter((w) => !finalIds.has(w.id));

      // Wings to create = new (no id or temp id)
      const wingsToCreate = finalWings.filter((w) => !w.id || w.id.startsWith("new-wing-"));

      // Wings to update = existing with real uuid
      const wingsToUpdate = finalWings.filter((w) => w.id && !w.id.startsWith("new-wing-"));

      // Delete empty wings
      for (const w of wingsToDelete) {
        const { error } = await supabase.from("wings").delete().eq("id", w.id);
        if (error) {
          console.error("[WingsTab] delete wing error:", error);
          throw new Error(`Failed to delete wing: ${error.message}`);
        }
      }

      // Create new wings
      const newWingMap: Record<string, string> = {};
      for (const w of wingsToCreate) {
        const { data, error } = await supabase
          .from("wings")
          .insert({ name: w.name, school_id: schoolId })
          .select("id")
          .single();
        if (error) {
          console.error("[WingsTab] wings insert error:", error);
          throw new Error(`Failed to create wing: ${error.message}`);
        }
        if (data && w.id) newWingMap[w.id] = data.id;
      }

      // Build full final wings list with real IDs
      const allFinalWings = [
        ...wingsToUpdate,
        ...wingsToCreate.map((w) => ({ ...w, id: newWingMap[w.id!] ?? "" })),
      ];

      // Build original class -> wing mapping from pre-edit wings state
      const originalClassWingMap = new Map<string, string | null>();
      for (const w of originalWings) {
        for (const c of w.classes) {
          originalClassWingMap.set(c.id, w.id);
        }
      }

      // Build final class -> wing mapping from finalWings
      const finalClassWingMap = new Map<string, string | null>();
      for (const w of allFinalWings) {
        if (!w.id) continue;
        for (const c of w.classes) {
          finalClassWingMap.set(c.id, w.id);
        }
      }

      // Update only classes whose wing assignment changed
      const allChangedClassIds = new Set([
        ...[...originalClassWingMap.keys()],
        ...[...finalClassWingMap.keys()],
      ]);
      for (const clsId of allChangedClassIds) {
        const origWing = originalClassWingMap.get(clsId) ?? null;
        const finalWing = finalClassWingMap.get(clsId) ?? null;
        if (origWing !== finalWing) {
          const { error } = await supabase
            .from("classes")
            .update({ wing_id: finalWing })
            .eq("id", clsId);
          if (error) {
            console.error("[WingsTab] update class wing error:", error);
            throw new Error(`Failed to update class: ${error.message}`);
          }
        }
      }

      // Update wing names for existing wings
      for (const fw of allFinalWings) {
        const orig = originalWings.find((w) => w.id === fw.id);
        if (orig && orig.name !== fw.name && fw.id) {
          const { error } = await supabase.from("wings").update({ name: toTitleCase(fw.name) }).eq("id", fw.id);
          if (error) {
            console.error("[WingsTab] update wing name error:", error);
            throw new Error(`Failed to rename wing: ${error.message}`);
          }
        }
      }

      // Batch logging — build composite message
      const addedNames: string[] = [];
      const removedNames: string[] = [];
      const renamed: string[] = [];

      for (const fw of allFinalWings) {
        const orig = originalWings.find((w) => w.id === fw.id);
        if (!orig) {
          fw.classes.forEach((c) => addedNames.push(c.name || c.acronym || ""));
        } else {
          const origIds = new Set(orig.classes.map((c) => c.id));
          const fwIds = new Set(fw.classes.map((c) => c.id));
          fw.classes.forEach((c) => { if (!origIds.has(c.id)) addedNames.push(c.name || c.acronym || ""); });
          orig.classes.forEach((c) => { if (!fwIds.has(c.id)) removedNames.push(c.name || c.acronym || ""); });
          if (orig.name !== fw.name && fw.name.trim()) renamed.push(`"${orig.name}" -> "${fw.name}"`);
        }
      }

      const logParts: string[] = [];
      if (addedNames.length > 0) logParts.push(`${addedNames.length} added: ${addedNames.filter(Boolean).join(", ")}`);
      if (removedNames.length > 0) logParts.push(`${removedNames.length} removed: ${removedNames.filter(Boolean).join(", ")}`);
      if (renamed.length > 0) logParts.push(`Renamed: ${renamed.join("; ")}`);
      if (wingsToCreate.length > 0) logParts.push(`${wingsToCreate.length} new wing(s) created`);
      if (wingsToDelete.length > 0) logParts.push(`${wingsToDelete.length} wing(s) deleted`);

      const what = logParts.join(" | ") || "No changes";

      if (currentUserId && (addedNames.length + removedNames.length + renamed.length + wingsToCreate.length + wingsToDelete.length) > 0) {
        logWingAction({
          schoolId,
          userId: currentUserId,
          userName: currentUserName ?? "",
          wingId: allFinalWings[0]?.id,
          wingName: allFinalWings[0]?.name ?? "",
          action: "wing_updated",
          what,
        });
      }

      toast.success("Changes saved");
      setIsEditing(false);
      setLocalWings([]);
      onDirtyChange?.(false);
      setTimeout(() => fetchData(), 50);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to save changes";
      toast.error(msg);
      // Preserve dirty state so the user can retry.
      // Do NOT call onDirtyChange?.(false) here.
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // ── Display helpers ───────────────────────────────────────────
  const hasChanges = localWings.some((lw, i) => {
    const ow = wings[i];
    if (!ow) return true; // new wing
    if (lw.name !== ow.name) return true;
    if (lw.classes.length !== ow.classes.length) return true;
    const origIds = new Set(ow.classes.map((c) => c.id));
    if (!lw.classes.every((c) => origIds.has(c.id))) return true;
    return false;
  });

  // Forward real diff to parent for unsaved-changes guard.
  // Reacts to every mutation path (add/remove/rename/drag) and to revert-back-to-original.
  useEffect(() => {
    if (!isEditing) {
      onDirtyChange?.(false);
      return;
    }
    onDirtyChange?.(hasChanges);
  }, [isEditing, hasChanges, onDirtyChange]);

  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isEditing]);

  const displayWings = isEditing ? localWings : wings;
  const unassignedClasses = isEditing
    ? allClasses.filter((c: ClassOption) => !displayWings.some((w: { classes: { id: string }[] }) => w.classes.some((wc: { id: string }) => wc.id === c.id)))
    : allClasses.filter((c) => !c.wing_id);

  const sortedDisplayWings = [...displayWings].sort((a: { classes: ClassOption[] }, b: { classes: ClassOption[] }) => {
    if (a.classes.length === 0) return 1;
    if (b.classes.length === 0) return -1;
    const aMin = Math.min(...a.classes.map((c: ClassOption) => getClassAcademicRank(c.name || c.acronym || "")));
    const bMin = Math.min(...b.classes.map((c: ClassOption) => getClassAcademicRank(c.name || c.acronym || "")));
    return aMin - bMin;
  });

  const filtered = search
    ? sortedDisplayWings.filter(
        (w: { id?: string; name: string; classes: ClassOption[] }) =>
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.classes.some((c: ClassOption) => (c.acronym || c.name).toLowerCase().includes(search.toLowerCase()))
      )
    : sortedDisplayWings;

  const originalWingsMap = new Map(wings.map((w) => [w.id, w]));

  const activeClass = activeClassId ? allClasses.find((c) => c.id === activeClassId) : null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading wings...
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search wings or classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {wings.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowLogPanel(true)}
              >
                <History className="h-3.5 w-3.5 mr-1" />
                Log
              </Button>
            )}

            {canEdit && (
              isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={cancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Save
                  </Button>
                </>
              ) : (
                wings.length > 0 ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={enterEditMode}
                >
                  Edit
                </Button>
                ) : null
              )
            )}
          </div>
        </div>

        {/* Board */}
        {sortedDisplayWings.length === 0 && !isEditing ? (
          <div className="text-center py-12 border rounded-xl">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No Wings Created Yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Wings help organize classes by academic stream (Science, Commerce, Arts) or house system.
              </p>
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-8"
                onClick={() => { enterEditMode(); }}
              >
                Create First Wing
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unassigned box */}
            {unassignedClasses.length > 0 && (
              <UnassignedClassesBox classes={unassignedClasses} isEditing={isEditing} />
            )}

            {/* Wings */}
            <div className="space-y-3">
              {filtered.map((wing) => {
                const localIdx = localWings.indexOf(wing);
                const original = isEditing && wing.id ? originalWingsMap.get(wing.id) : undefined;
                return (
                  <BoardWingCard
                    key={wing.id ?? `new-${localIdx}`}
                    wing={wing}
                    isEditing={isEditing}
                    originalClasses={original?.classes ?? []}
                    onNameChange={(name) => handleWingNameChange(localIdx, name)}
                    onDeleteRequest={() => { handleDeleteClick(localIdx); }}
                    onRemoveClass={handleRemoveClass}
                  />
                );
              })}
            </div>

            {/* Add new wing (edit mode only) */}
            {isEditing && (
              <button
                onClick={handleAddNewWing}
                className="w-full border-2 border-dashed border-muted rounded-xl p-4 text-center text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
              >
                + Add New Wing
              </button>
            )}
          </div>
        )}

        {/* Drag overlay */}
        <DragOverlay>
          {activeClass ? (
            <div style={{ pointerEvents: "none" }} className="inline-flex">
              <span className="px-2 py-1 rounded border bg-background text-xs font-medium shadow-md opacity-90">
                {activeClass.name || activeClass.acronym}
              </span>
            </div>
          ) : null}
        </DragOverlay>

        {/* Delete confirm dialog */}
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) { setDeleteConfirmText(""); setDeleteWingIndex(-1); setDeleteWingName(""); }
          }}
          wingName={deleteWingName}
          confirmText={deleteConfirmText}
          onConfirmTextChange={setDeleteConfirmText}
          onConfirm={handleDeleteConfirm}
          isDeleting={false}
        />

        {/* Log panel */}
        <WingLogPanel
          open={showLogPanel}
          onOpenChange={setShowLogPanel}
          schoolId={schoolId}
        />

        {/* New wing dialog */}
        <Dialog open={newWingDialogOpen} onOpenChange={setNewWingDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Wing</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                value={newWingName}
                onChange={(e) => setNewWingName(e.target.value)}
                placeholder="e.g. Science Wing"
                className="text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirmAddWing(); }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewWingDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAddWing}
                disabled={!newWingName.trim()}
              >
                Add Wing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
});

function DeleteConfirmDialog({
  open,
  onOpenChange,
  wingName,
  confirmText,
  onConfirmTextChange,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wingName: string;
  confirmText: string;
  onConfirmTextChange: (text: string) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete {wingName || "this wing"}?</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            This action is <span className="font-medium text-foreground">permanent and cannot be undone.</span>
          </p>
          <p className="text-sm">
            The wing will be permanently deleted.
          </p>
          <div className="space-y-1.5 pt-1">
            <p className="text-sm">
              Type <span className="font-mono font-medium text-destructive">{wingName || "this wing"}</span> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              placeholder={wingName || "wing name"}
              className="text-sm"
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting || confirmText !== wingName}
          >
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}