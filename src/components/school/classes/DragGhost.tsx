import { GripVertical } from "lucide-react";
import type { EditorClass, EditorSection } from "./types";

/**
 * Visual clone of a class card or section row, rendered inside <DragOverlay>.
 * Not interactive — just a "floating under the cursor" silhouette so the user
 * clearly sees what they're dragging.
 *
 * The "activeId" and "activeType" tell us which shape to draw.
 */
export interface DragGhostProps {
  activeType: "class" | "section" | null;
  activeClass: EditorClass | null;
  activeSection: EditorSection | null;
}

export function DragGhost({ activeType, activeClass, activeSection }: DragGhostProps) {
  if (activeType === "class" && activeClass) {
    return <ClassGhost cls={activeClass} />;
  }
  if (activeType === "section" && activeSection) {
    return <SectionGhost section={activeSection} />;
  }
  return null;
}

function ClassGhost({ cls }: { cls: EditorClass }) {
  return (
    <div
      data-testid="drag-ghost-class"
      className="rounded-lg border-2 border-primary bg-card p-3 shadow-2xl ring-2 ring-primary/30 rotate-1 scale-[1.02] cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-5 items-center justify-center text-muted-foreground">
          <GripVertical className="h-4 w-4" />
        </span>
        <span className="text-sm font-semibold truncate">{cls.name}</span>
      </div>
      {cls.sections.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {cls.sections.slice(0, 6).map((s) => (
            <span
              key={s.id}
              className="rounded border bg-secondary/60 px-2 py-0.5 text-xs font-medium uppercase"
            >
              {s.name}
            </span>
          ))}
          {cls.sections.length > 6 && (
            <span className="text-xs text-muted-foreground">+{cls.sections.length - 6}</span>
          )}
        </div>
      )}
    </div>
  );
}

function SectionGhost({ section }: { section: EditorSection }) {
  return (
    <div
      data-testid="drag-ghost-section"
      className="flex items-center gap-2 rounded-md border-2 border-primary bg-card px-2 py-1.5 shadow-2xl ring-2 ring-primary/30 rotate-1 scale-[1.02] cursor-grabbing"
    >
      <span className="flex h-5 w-4 items-center justify-center text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium truncate">{section.name || "Section"}</span>
    </div>
  );
}
