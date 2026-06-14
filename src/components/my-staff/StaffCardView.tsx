import { Eye, Pencil, Download, MoreVertical, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";
import type { DynamicColumn, MergedColumn } from "./ColumnPicker";

interface StaffCardViewProps {
  staff: StaffWithDetails[];
  onView: (staff: StaffWithDetails) => void;
  onEdit: (staff: StaffWithDetails) => void;
  onDownloadIdCard: (staff: StaffWithDetails) => void;
  onToggleStatus: (staff: StaffWithDetails) => void;
  dynamicColumns: DynamicColumn[];
  mergedColumns?: MergedColumn[];
  canEdit: boolean;
}

function getCellValue(staff: StaffWithDetails, key: string): string {
  switch (key) {
    case "gender": return staff.gender ?? "—";
    case "dob": return staff.dob ? new Date(staff.dob).toLocaleDateString() : "—";
    case "blood_group": return staff.blood_group ?? "—";
    case "employment_status": return staff.employment_status ?? "—";
    case "designation": return staff.designation ?? "—";
    case "department": return staff.department ?? "—";
    case "joining_date": return staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : "—";
    case "email": return staff.email ?? "—";
    case "login_mobile": return staff.login_mobile ?? "—";
    case "whatsapp_mobile": return staff.whatsapp_mobile ?? "—";
    default: {
      const val = (staff as any)[key];
      return val ?? "—";
    }
  }
}

function getMergedValue(staff: StaffWithDetails, merged: MergedColumn): string {
  return merged.fields
    .map((f) => (staff as any)[f] ?? "—")
    .join(merged.delimiter);
}

export function StaffCardView({
  staff,
  onView,
  onEdit,
  onDownloadIdCard,
  onToggleStatus,
  dynamicColumns,
  mergedColumns = [],
  canEdit,
}: StaffCardViewProps) {
  if (staff.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <p>No staff found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {staff.map((s) => {
        const initials = s.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
        const statusColor = s.status === "active" ? "bg-purple-100 text-purple-800" : s.status === "draft" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-800";

        return (
          <div
            key={s.id}
            className="border rounded-xl p-4 bg-card shadow-sm"
            onClick={() => onView(s)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-semibold text-lg">
                  {initials || "?"}
                </div>
                <div>
                  <p className="font-semibold">{s.full_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{s.employee_id ?? "—"}</p>
                </div>
              </div>
              <Badge className={cn("text-xs", statusColor)}>
                {s.status}
              </Badge>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{s.role.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Designation</p>
                <p className="font-medium">{s.designation ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium">{s.department ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mobile</p>
                <p className="font-medium">{s.login_mobile ?? "—"}</p>
              </div>
            </div>

            {/* Dynamic columns preview (first 2 only for cards) */}
            {dynamicColumns.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {dynamicColumns.slice(0, 2).map((col) => (
                  <div key={col.key} className="text-xs">
                    <span className="text-muted-foreground">{col.label}: </span>
                    <span className="font-medium">{getCellValue(s, col.key)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => { e.stopPropagation(); onView(s); }}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onDownloadIdCard(s); }}
              >
                <Download className="h-4 w-4" />
              </Button>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onToggleStatus(s); }}
                  className={s.status === "active" ? "text-amber-600" : "text-green-600"}
                >
                  <UserCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}