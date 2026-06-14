import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EditableText } from "./EditableText";
import { toTitleCase } from "@/lib/text-utils";
import type { EditorSection } from "./types";

export interface SectionRowProps {
  clsId: string;
  section: EditorSection;
  isEditing: boolean;
  /** Type of the item currently being dragged (if any). */
  activeDragType: "class" | "section" | null;
  onUpdate: (clsId: string, sectionId: string, patch: Partial<EditorSection>) => void;
  onRemove: (clsId: string, sectionId: string) => void;
}

export function SectionRow({
  clsId,
  section,
  isEditing,
  activeDragType,
  onUpdate,
  onRemove,
}: SectionRowProps) {
  const sortable = useSortable({
    id: section.id,
    data: { type: "section", clsId },
    disabled: !isEditing,
  });

  const isDragging = sortable.isDragging;
  const isOver = sortable.isOver;

  const style: React.CSSProperties = {
    transform: isDragging ? undefined : CSS.Translate.toString(sortable.transform),
    transition: sortable.transition ?? "transform 200ms ease",
  };

  // Placeholder while dragging.
  if (isDragging) {
    return (
      <div
        ref={sortable.setNodeRef}
        style={style}
        data-dragging="true"
        data-testid={`section-row-${section.id}`}
        aria-hidden
        className="rounded-md border-2 border-dashed border-primary/50 bg-primary/5 min-h-[44px]"
      />
    );
  }

  // Section ring only lights up when a SECTION is being dragged. Class
  // drags never ring on section rows. Cross-class section drops are
  // impossible because each class has its own SortableContext.
  const showRing = isOver && activeDragType === "section";

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      data-over={showRing || undefined}
      data-testid={`section-row-${section.id}`}
      className={cn(
        "flex items-stretch gap-2 rounded-md border bg-card/40 transition-shadow",
        showRing && "ring-2 ring-primary shadow-sm",
      )}
    >
      {isEditing && (
        <button
          type="button"
          className={cn(
            "flex cursor-grab active:cursor-grabbing items-center self-stretch px-1.5 -ml-1",
            "rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-label={`Drag section ${section.name} to reorder`}
          title="Drag to reorder"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      <div className="flex-1 min-w-0 self-center">
        {isEditing ? (
          <EditableText
            value={section.name}
            onChange={(v) => onUpdate(clsId, section.id, { name: v })}
            maxLength={16}
            placeholder="Section name"
            transform={toTitleCase}
            testId={`section-name-${section.id}`}
          />
        ) : (
          <span className="text-sm font-medium">{section.name}</span>
        )}
      </div>
      {isEditing && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(clsId, section.id)}
          aria-label={`Remove section ${section.name}`}
          className="h-7 w-7 self-center text-muted-foreground hover:text-destructive"
          data-testid={`section-remove-${section.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
