import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { DepartmentWithDetails } from "@/integrations/supabase/queries/departments";

interface DepartmentCardProps {
  department: DepartmentWithDetails;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
}

export function DepartmentCard({
  department,
  onEdit,
  onDelete,
  canEdit,
}: DepartmentCardProps) {
  const isActive = department.is_active !== false;

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm truncate">{department.name}</h3>
        {!isActive && (
          <Badge
            variant="outline"
            className="text-[10px] border-amber-300 text-amber-600 bg-amber-50"
          >
            Inactive
          </Badge>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t bg-muted/20 flex justify-end gap-1">
        {canEdit && (
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
