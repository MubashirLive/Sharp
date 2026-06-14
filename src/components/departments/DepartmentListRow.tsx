import { Button } from "@/components/ui/button";
import type { DepartmentWithDetails } from "@/integrations/supabase/queries/departments";
import { Edit } from "lucide-react";

interface DepartmentListRowProps {
  department: DepartmentWithDetails;
  onEdit: () => void;
  canEdit: boolean;
}

export function DepartmentListRow({ department, onEdit, canEdit }: DepartmentListRowProps) {
  const isActive = department.is_active !== false;

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-2.5 px-3 font-medium text-sm">{department.name}</td>
      <td className="py-2.5 px-3">
        {isActive ? (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs text-amber-500">Inactive</span>
          </div>
        )}
      </td>
      <td className="py-2.5 px-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onEdit}>
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}
