import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Plus, Trash2, Users, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditableText } from "./EditableText";
import { SectionRow } from "./SectionRow";
import type { DepCount, EditorClass, EditorSection } from "./types";

export interface ClassCardProps {
  cls: EditorClass;
  isEditing: boolean;
  depCount: DepCount | undefined;
  /** Type of the item currently being dragged (if any). */
  activeDragType: "class" | "section" | null;
  onUpdateClass: (id: string, patch: Partial<EditorClass>) => void;
  onAddSection: (classId: string) => void;
  onUpdateSection: (classId: string, sectionId: string, patch: Partial<EditorSection>) => void;
  onRemoveSection: (classId: string, sectionId: string) => void;
  onRemoveClass: (id: string) => void;
}

export function ClassCard({
  cls,
  isEditing,
  depCount,
  activeDragType,
  onUpdateClass,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onRemoveClass,
}: ClassCardProps) {
  const sortable = useSortable({
    id: cls.id,
    data: { type: "class" },
    disabled: !isEditing,
  });

  const isDragging = sortable.isDragging;
  const isOver = sortable.isOver;

  // Get dnd context for tracking active drag state
  const { active, over } = useDndContext();
  const isAnyDragActive = active != null;
  const isClassDragOver = isOver && activeDragType === "class" && active?.id !== cls.id;

  // Enhanced visual feedback: calculate where the drop will happen
  const showDropIndicator = isClassDragOver && activeDragType === "class" && active?.id !== cls.id;

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Translate.toString(sortable.transform),
    transition: sortable.transition ?? "transform 200ms ease",
  };

  // Dragging placeholder with clear drop zone indicator
  if (isDragging) {
    return (
      <div
        ref={sortable.setNodeRef}
        style={style}
        data-dragging="true"
        data-testid={`class-card-${cls.id}`}
        aria-hidden
        className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 min-h-[120px] flex items-center justify-center"
      >
        <div
          data-testid="class-drop-bar"
          className="h-1.5 w-3/4 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]"
        />
      </div>
    );
  }

  // Enhanced drop feedback: shows clear insertion point with glow
  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      data-over={isClassDragOver || undefined}
      data-testid={`class-card-${cls.id}`}
      className={cn(
        "rounded-lg border bg-card p-3 space-y-3 transition-all relative",
        // Hover state: subtle lift effect
        isClassDragOver && "ring-2 ring-primary shadow-lg scale-[1.01]",
        isClassDragOver && "bg-primary/[0.04]",
      )}
    >
      {/* Drop position indicator - shows where item will land */}
      {showDropIndicator && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
          <div className="h-1.5 w-16 rounded-full bg-primary animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
        </div>
      )}
      <div className="flex items-stretch gap-2">
        {isEditing && (
          <button
            type="button"
            className={cn(
              "-ml-1 mr-1 flex cursor-grab active:cursor-grabbing items-center self-stretch px-1.5",
              "rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            aria-label={`Drag class ${cls.name} to reorder`}
            title="Drag to reorder"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1 min-w-0 self-center">
          {isEditing ? (
            <EditableText
              value={cls.name}
              onChange={(v) => onUpdateClass(cls.id, { name: v })}
              maxLength={32}
              placeholder="Class name"
              data-testid={`class-name-${cls.id}`}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{cls.name}</span>
              {depCount && (depCount.students > 0 || depCount.subjects > 0 || depCount.teachers > 0) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {depCount.students > 0 && (
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0">
                      <Users className="h-3 w-3" />
                      {depCount.students}
                    </Badge>
                  )}
                  {depCount.teachers > 0 && (
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0">
                      <GraduationCap className="h-3 w-3" />
                      {depCount.teachers}
                    </Badge>
                  )}
                  {depCount.subjects > 0 && (
                    <Badge variant="secondary" className="gap-1 px-1.5 py-0">
                      <BookOpen className="h-3 w-3" />
                      {depCount.subjects}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveClass(cls.id)}
            aria-label={`Remove class ${cls.name}`}
            className="h-7 w-7 self-center text-muted-foreground hover:text-destructive"
            data-testid={`class-remove-${cls.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/*
        Per-class SortableContext: section drops are scoped to this class.
        A section in this context cannot be dropped onto a section in
        another class's context — dnd-kit handles the rejection.
      */}
      <SortableContext
        items={cls.sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {cls.sections.length === 0 && isEditing && (
            <p className="text-xs text-muted-foreground italic">No sections yet.</p>
          )}
          {cls.sections.map((s) => (
            <SectionRow
              key={s.id}
              clsId={cls.id}
              section={s}
              isEditing={isEditing}
              activeDragType={activeDragType}
              onUpdate={onUpdateSection}
              onRemove={onRemoveSection}
            />
          ))}
        </div>
      </SortableContext>
      {isEditing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onAddSection(cls.id)}
          disabled={isAnyDragActive}
          className={cn(
            "w-full",
            // Suppress the shadcn outline-variant :hover while a drag is
            // active (the DragOverlay portal floats over the button).
            isAnyDragActive &&
              "pointer-events-none hover:bg-background hover:text-foreground",
          )}
          data-testid={`class-add-section-${cls.id}`}
        >
          <Plus className="h-3.5 w-3.5" />
          Add section
        </Button>
      )}
    </div>
  );
}
