import { Button } from "@/components/ui/button";
import { Edit, History, Building2, Users } from "lucide-react";
import type { WingWithDetails } from "@/integrations/supabase/queries/wings";

interface WingListRowProps {
  wing: WingWithDetails;
  onEdit: (wing: WingWithDetails) => void;
  onLogClick: (wing: WingWithDetails) => void;
}

export function WingListRow({ wing, onEdit, onLogClick }: WingListRowProps) {
  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">{wing.name}</span>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex flex-wrap gap-1">
          {wing.classes.length > 0 ? (
            wing.classes.slice(0, 5).map((c) => (
              <span key={c.id} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {c.acronym || c.name}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          {wing.classes.length > 5 && (
            <span className="text-xs text-muted-foreground">+{wing.classes.length - 5}</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>{wing.classes.length} classes</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{wing.coordinators.length} coords</span>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onLogClick(wing)}>
            <History className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onEdit(wing)}>
            <Edit className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </td>
    </tr>
  );
}