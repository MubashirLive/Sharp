import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToFirstScrollableAncestor, snapCenterToCursor } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Pencil, Save, X, Loader2, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WingClassFilter } from "@/components/ui/WingClassFilter";
import { useClassesEditor } from "./classes/useClassesEditor";
import type { ClassesDeletions } from "./classes/useClassesEditor";
import { ClassCard } from "./classes/ClassCard";
import { AddClassChips } from "./classes/AddClassChips";
import { DeleteConfirmDialog } from "./classes/DeleteConfirmDialog";
import { DragGhost } from "./classes/DragGhost";
import type { SessionStepData } from "@/components/onboarding/types";
import type { EditorClass, EditorSection } from "./classes/types";

export interface ClassesTabHandle {
  save: () => Promise<void>;
  discard: () => void;
}

export interface ClassesTabProps {
  initialData: SessionStepData;
  data: SessionStepData;
  onChange: (d: SessionStepData) => void;
  onSave?: (d: SessionStepData, deletions?: ClassesDeletions) => Promise<void>;
  schoolId: string;
  isOnboarding?: boolean;
  className?: string;
  onSaved?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

export const ClassesTab = forwardRef<ClassesTabHandle, ClassesTabProps>(function ClassesTab(
  { data, onChange, onSave, schoolId, className, onSaved, onDirtyChange },
  ref,
) {
  const editor = useClassesEditor({
    data,
    schoolId,
    onChange,
    onSave,
    onSaved,
  });

  useImperativeHandle(
    ref,
    () => ({
      save: () => editor.save(),
      discard: () => {
        editor.cancelEdit();
        onDirtyChange?.(false);
      },
    }),
    [editor, onDirtyChange],
  );

  useEffect(() => {
    onDirtyChange?.(editor.isEditing && editor.hasChanges);
  }, [editor.isEditing, editor.hasChanges, onDirtyChange]);

  // Browser-level guard: warn on tab close / refresh while editing.
  useEffect(() => {
    if (!editor.isEditing) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editor.isEditing]);

  // Standard dnd-kit sensor stack. `distance: 6` filters click-vs-drag; touch
  // uses a short hold to disambiguate from scroll.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  // Resolve the active item (class or section) so DragGhost can render it.
  const { activeClass, activeSection, activeType, activeClsId } = useMemo(() => {
    if (!activeId) {
      return {
        activeClass: null,
        activeSection: null,
        activeType: null as "class" | "section" | null,
        activeClsId: null as string | null,
      };
    }
    for (const c of editor.displayClasses) {
      if (c.id === activeId) {
        return { activeClass: c, activeSection: null, activeType: "class" as const, activeClsId: c.id };
      }
    }
    for (const c of editor.displayClasses) {
      const sec = c.sections.find((s) => s.id === activeId);
      if (sec) {
        return {
          activeClass: c,
          activeSection: sec as EditorSection,
          activeType: "section" as const,
          activeClsId: c.id,
        };
      }
    }
    return {
      activeClass: null,
      activeSection: null,
      activeType: null as "class" | "section" | null,
      activeClsId: null,
    };
  }, [activeId, editor.displayClasses]);

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  // Wing filter (without search)
  const wingFilteredClasses = useMemo(() => {
    let list: EditorClass[] = editor.displayClasses;
    if (editor.wingFilter !== "all") {
      if (editor.wingFilter === "unassigned") {
        list = list.filter((c) => !c.wing_id);
      } else {
        list = list.filter((c) => c.wing_id === editor.wingFilter);
      }
    }
    return list;
  }, [editor.displayClasses, editor.wingFilter]);

  // Wing + search filter (used for the rendered list)
  const filteredClasses = useMemo(() => {
    const q = editor.searchQuery.trim().toLowerCase();
    if (!q) return wingFilteredClasses;
    return wingFilteredClasses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.sections.some((s) => s.name.toLowerCase().includes(q)),
    );
  }, [wingFilteredClasses, editor.searchQuery]);

  // Handle drag over events for better visual feedback
  const onDragOver = (e: DragOverEvent) => {
    e.preventDefault();
  };

  // Simplified drag end handler using dnd-kit's built-in over detection
  const onClassDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const fullList = editor.displayClasses;
    const isClassActive = fullList.some((c) => c.id === activeId);

    if (isClassActive) {
      // Use dnd-kit's context for accurate index detection
      // This handles all the index calculation automatically
      editor.applyClassOrder([activeId, overId]);
      return;
    }

    // Section drag — over is a section in the same class (per-class
    // SortableContext means cross-class hovers never fire `over`).
    for (const c of fullList) {
      const ids = c.sections.map((s) => s.id);
      if (ids.includes(activeId) && ids.includes(overId)) {
        editor.reorderSections(c.id, activeId, overId);
        return;
      }
    }
  };

  const saveButtonLabel = (() => {
    if (editor.isSaving) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Saving...
        </>
      );
    }
    if (editor.hasBlockingErrors) {
      return (
        <>
          <AlertTriangle className="h-4 w-4" />
          Fix {editor.blockingErrors.length} issue{editor.blockingErrors.length !== 1 ? "s" : ""}
        </>
      );
    }
    if (!editor.hasChanges) {
      return (
        <>
          <Save className="h-4 w-4" />
          No changes to save
        </>
      );
    }
    return (
      <>
        <Save className="h-4 w-4" />
        Save
      </>
    );
  })();

  return (
    <div className={className} data-testid="classes-tab">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={editor.searchQuery}
              onChange={(e) => editor.setSearchQuery(e.target.value)}
              placeholder="Search classes or sections"
              className="h-8 pl-8 text-sm"
              data-testid="classes-search-input"
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {filteredClasses.length} of {editor.displayClasses.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {editor.isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={editor.cancelEdit}
                disabled={editor.isSaving}
                data-testid="classes-cancel-button"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={editor.save}
                disabled={editor.isSaving || editor.hasBlockingErrors || !editor.hasChanges}
                data-testid="classes-save-button"
              >
                {saveButtonLabel}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={editor.enterEditMode}
              data-testid="classes-edit-button"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Wing filter (always-on) */}
      {editor.displayClasses.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card/30 p-8 text-center mb-3">
          <p className="text-sm text-muted-foreground">
            {editor.isEditing
              ? "Use the chips above to add your first class."
              : "No classes yet. Click Edit to get started."}
          </p>
        </div>
      ) : (
        <WingClassFilter
          wings={editor.wings.map((w) => ({ id: w.id, name: w.name, display_order: w.display_order }))}
          items={editor.displayClasses.map((c) => ({ id: c.id, wing_id: c.wing_id ?? null }))}
          activeFilter={editor.wingFilter}
          onFilterChange={editor.setWingFilter}
          nameMap={filteredClasses.reduce<Record<string, string>>((acc, c) => {
            acc[c.id] = c.name;
            return acc;
          }, {})}
        >
          {(filteredItems) => {
            const visibleIds = new Set(filteredItems.map((i) => i.id));
            const visible = filteredClasses.filter((c) => visibleIds.has(c.id));
            return (
              <>
                {/* Add class (edit mode only) */}
                {editor.isEditing && (
                  <div className="mb-3">
                    <AddClassChips
                      existingNames={editor.displayClasses.map((c) => c.name)}
                      onAdd={editor.addClass}
                    />
                  </div>
                )}

                {visible.length === 0 ? (
                  <div className="rounded-lg border border-dashed bg-card/30 p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No classes match this filter.
                    </p>
                  </div>
                ) : (
                  /* Single DndContext for all drag operations */
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                    onDragStart={onDragStart}
                    onDragEnd={onClassDragEnd}
                    onDragCancel={() => setActiveId(null)}
                  >
                    <SortableContext
                      items={visible.map((c) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="flex flex-col gap-3" data-testid="classes-list">
                        {visible.map((c) => (
                          <ClassCard
                            key={c.id}
                            cls={c}
                            isEditing={editor.isEditing}
                            depCount={c._id ? editor.depCounts[c._id] : undefined}
                            activeDragType={activeType}
                            onUpdateClass={editor.updateClass}
                            onAddSection={editor.addSection}
                            onUpdateSection={editor.updateSection}
                            onRemoveSection={editor.removeSection}
                            onRemoveClass={editor.removeClass}
                          />
                        ))}
                      </div>
                    </SortableContext>
                    <DragOverlay
                      dropAnimation={{
                        duration: 200,
                        easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
                      }}
                    >
                      <DragGhost
                        activeType={activeType}
                        activeClass={activeClass}
                        activeSection={activeSection}
                      />
                    </DragOverlay>
                  </DndContext>
                )}
              </>
            );
          }}
        </WingClassFilter>
      )}

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={editor.delDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) editor.setDelDialog(null);
        }}
        itemName={editor.delDialog?.itemName ?? ""}
        itemType={editor.delDialog?.itemType ?? "class"}
        deps={editor.delDialog?.deps ?? null}
        loading={editor.delDialog?.loading ?? false}
        onConfirm={() => {
          if (editor.delDialog?.itemType === "section") {
            editor.confirmSectionDelete();
          } else {
            editor.confirmClassDelete();
          }
        }}
      />
    </div>
  );
});

export default ClassesTab;
