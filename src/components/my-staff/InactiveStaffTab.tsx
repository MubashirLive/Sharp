import { Eye, Pencil, Trash2, UserCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";

interface InactiveStaffTabProps {
  staff: StaffWithDetails[];
  onView: (staff: StaffWithDetails) => void;
  onEdit: (staff: StaffWithDetails) => void;
  onReactivate: (staff: StaffWithDetails) => void;
  onDelete: (staff: StaffWithDetails) => void;
  canEdit: boolean;
}

// Status badge
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; dot: string }> = {
    inactive: { color: "bg-gray-100 text-gray-800", dot: "bg-gray-500" },
  };
  const config = configs[status] ?? configs.inactive;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      Inactive
    </span>
  );
}

// Role badge
function RoleBadge({ role }: { role: string }) {
  const academicRoles = ["teacher", "class_teacher", "coordinator", "activity_staff"];
  const isAcademic = academicRoles.includes(role);

  return (
    <Badge variant={isAcademic ? "default" : "secondary"} className="text-xs">
      {role.replace("_", " ")}
    </Badge>
  );
}

export function InactiveStaffTab({ staff, onView, onEdit, onReactivate, onDelete, canEdit }: InactiveStaffTabProps) {
  if (staff.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-lg font-medium">No inactive staff</p>
        <p className="text-sm text-muted-foreground mt-1">
          Staff marked inactive will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {staff.length} inactive staff member{staff.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[280px]">Staff</TableHead>
              <TableHead>Staff ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center font-semibold text-sm">
                      {s.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.login_mobile ?? "—"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{s.employee_id ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <RoleBadge role={s.role} />
                </TableCell>
                <TableCell>
                  <span className="text-sm">{s.department ?? "—"}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {s.joining_date ? new Date(s.joining_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) : "—"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onView(s)} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => onEdit(s)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onReactivate(s)}
                          title="Reactivate"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(s)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}