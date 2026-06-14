import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  acronym: string | null;
  wing_id?: string | null;
  display_order?: number;
}

interface UnassignedClassesBoxProps {
  classes: ClassOption[];
  isEditing: boolean;
}

function DraggableBadge({ cls, isEditing }: { cls: ClassOption; isEditing: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: cls.id,
    disabled: !isEditing,
  });

  return (
    <div
      ref={setNodeRef}
      {...(isEditing ? { ...attributes, ...listeners } : {})}
      className={`inline-flex ${isDragging ? "opacity-30" : ""}`}
    >
      <Badge
        variant={isEditing ? "secondary" : "outline"}
        className="text-xs"
      >
        {isEditing && (
          <span className="mr-0.5 opacity-50">⋮⋮</span>
        )}
        {cls.name || cls.acronym}
      </Badge>
    </div>
  );
}

export function UnassignedClassesBox({ classes, isEditing }: UnassignedClassesBoxProps) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });

  const sorted = [...classes].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
  );

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border-2 transition-all ${
        isEditing
          ? isOver
            ? "border-primary bg-primary/5"
            : "border-dashed border-muted-foreground/30 bg-muted/30"
          : "border border-muted bg-muted/20"
      }`}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Unassigned
        </span>
        <span className="text-xs text-muted-foreground">({classes.length})</span>
      </div>
      <div className="p-3 min-h-[60px]">
        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            {isEditing ? "Drop classes here to unassign" : "No unassigned classes"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {sorted.map((cls) => (
              <DraggableBadge key={cls.id} cls={cls} isEditing={isEditing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
