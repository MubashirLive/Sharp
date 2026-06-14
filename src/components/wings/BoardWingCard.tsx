import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, Trash2, GripVertical, ArrowRight } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
  acronym: string | null;
  wing_id?: string | null;
  wing_name?: string;
  display_order?: number;
}

interface BoardWingCardProps {
  wing: {
    id?: string;
    name: string;
    classes: ClassOption[];
  };
  isEditing: boolean;
  originalClasses?: ClassOption[];
  onNameChange: (name: string) => void;
  onDeleteRequest: () => void;
  onRemoveClass: (classId: string) => void;
}

function DraggableClassBadge({
  cls,
  isEditing,
  onRemove,
  isFromOtherWing,
}: {
  cls: ClassOption;
  isEditing: boolean;
  onRemove: () => void;
  isFromOtherWing?: boolean;
}) {
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
        variant={isFromOtherWing && isEditing ? "secondary" : "outline"}
        className={`text-xs ${isFromOtherWing && isEditing ? "border-amber-400 bg-amber-50 text-amber-700 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-700" : ""}`}
      >
        {isEditing && (
          <GripVertical className="h-3 w-3 mr-0.5 opacity-50" />
        )}
        {cls.name || cls.acronym}
        {isEditing && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-1 hover:text-destructive"
          >
            ×
          </button>
        )}
        {isFromOtherWing && isEditing && (
          <ArrowRight className="h-3 w-3 ml-1 text-amber-600 dark:text-amber-400" />
        )}
      </Badge>
    </div>
  );
}

export function BoardWingCard({
  wing,
  isEditing,
  originalClasses = [],
  onNameChange,
  onDeleteRequest,
  onRemoveClass,
}: BoardWingCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: wing.id });

  const sorted = [...wing.classes].sort(
    (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999)
  );

  const originalClassIds = new Set((originalClasses ?? []).map((c) => c.id));

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border transition-all ${
        isEditing
          ? isOver
            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
            : "border-border"
          : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
          {isEditing ? (
            <Input
              value={wing.name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Name is required"
              maxLength={50}
              className="text-sm font-medium h-7"
            />
          ) : (
            <span className="font-medium text-sm truncate">{wing.name}</span>
          )}
        </div>

        {isEditing && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={onDeleteRequest}
              disabled={wing.classes.length > 0}
              title={
                wing.classes.length > 0
                  ? "Remove all classes before deleting"
                  : "Delete wing"
              }
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Classes */}
      <div className="p-3 min-h-[52px]">
        <div className="flex flex-wrap gap-1.5">
          {sorted.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              {isEditing ? "Drop classes here" : "No classes assigned"}
            </p>
          ) : (
            sorted.map((cls) => (
              <DraggableClassBadge
                key={cls.id}
                cls={cls}
                isEditing={isEditing}
                onRemove={() => onRemoveClass(cls.id)}
                isFromOtherWing={!originalClassIds.has(cls.id) && (originalClasses?.length ?? 0) > 0}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
