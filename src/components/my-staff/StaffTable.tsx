import { useState, useCallback } from "react";
import { Eye, Pencil, MoreHorizontal, Download, FileText, UserX, UserCheck, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";
import type { MergedColumn } from "./ColumnPicker";

export type DynamicColumn = {
  key: string;
  label: string;
  width?: number;
  sensitive?: boolean;
};

interface StaffTableProps {
  staff: StaffWithDetails[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onView: (staff: StaffWithDetails) => void;
  onEdit: (staff: StaffWithDetails) => void;
  onDownloadIdCard: (staff: StaffWithDetails) => void;
  onToggleStatus: (staff: StaffWithDetails) => void;
  onDelete: (staff: StaffWithDetails) => void;
  dynamicColumns: DynamicColumn[];
  mergedColumns?: MergedColumn[];
  canEdit: boolean;
  userRole: string;
  onInlineEditTag?: (staffId: string, tag: string) => void;
}

function getMergedValue(staff: StaffWithDetails, merged: MergedColumn): string {
  return merged.fields
    .map((f) => {
      const val = (staff as any)[f];
      return val ?? "—";
    })
    .join(merged.delimiter);
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { color: string; dot: string }> = {
    active: { color: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
    inactive: { color: "bg-gray-100 text-gray-800", dot: "bg-gray-500" },
    draft: { color: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  };
  const config = configs[status] ?? configs.active;

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", config.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// Role badge component
function RoleBadge({ role }: { role: string }) {
  const academicRoles = ["teacher", "class_teacher", "coordinator", "activity_staff"];
  const isAcademic = academicRoles.includes(role);

  return (
    <Badge variant={isAcademic ? "default" : "secondary"} className="text-xs">
      {role.replace("_", " ")}
    </Badge>
  );
}

// Avatar initials component
function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("flex items-center justify-center rounded-full bg-purple-100 text-purple-800 font-semibold text-sm", className)}>
      {initials || "?"}
    </div>
  );
}

function computeProfileCompletion(staff: StaffWithDetails): number {
  const fields = [
    staff.full_name,
    staff.gender,
    staff.dob,
    staff.login_mobile,
    staff.email,
    staff.designation,
    staff.department,
    staff.joining_date,
    staff.local_address,
    staff.blood_group,
    staff.qualification,
    staff.employment_status,
    staff.whatsapp_mobile,
    staff.emergency_contact_name,
    staff.emergency_contact_number,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

// Inline Messenger Tag editor
function InlineTagEditor({
  tag,
  onSave,
  onCancel,
}: {
  tag: string;
  onSave: (tag: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(tag);

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, 50))}
        className="h-7 px-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(value);
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button size="sm" variant="ghost" onClick={() => onSave(value)}>Save</Button>
    </div>
  );
}

export function StaffTable({
  staff,
  selectedIds,
  onSelectionChange,
  onView,
  onEdit,
  onDownloadIdCard,
  onToggleStatus,
  onDelete,
  dynamicColumns,
  mergedColumns = [],
  canEdit,
  userRole,
  onInlineEditTag,
}: StaffTableProps) {
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagValue, setEditingTagValue] = useState("");

  // Filter sensitive columns for Admin role
  const visibleDynamicColumns = dynamicColumns.filter((col) => !col.sensitive || !["admin"].includes(userRole));

  const allSelected = staff.length > 0 && selectedIds.size === staff.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(staff.map((s) => s.id)));
    }
  };

  const handleSelectRow = (id: string, shiftKey: boolean) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  const getCellValue = (staff: StaffWithDetails, key: string): string => {
    switch (key) {
      case "gender": return staff.gender ?? "—";
      case "dob": return staff.dob ? new Date(staff.dob).toLocaleDateString() : "—";
      case "blood_group": return staff.blood_group ?? "—";
      case "employment_status": return staff.employment_status ?? "—";
      case "designation": return staff.designation ?? "—";
      case "department": return staff.department ?? "—";
      case "joining_date": return staff.joining_date ? new Date(staff.joining_date).toLocaleDateString() : "—";
      case "email": return staff.email ?? "—";
      case "profile_completion": return `${computeProfileCompletion(staff)}%`;
      case "personal_email": return staff.personal_email ?? "—";
      case "login_mobile": return staff.login_mobile ?? "—";
      case "whatsapp_mobile": return staff.whatsapp_mobile ?? "—";
      case "local_address": return staff.local_address ?? "—";
      case "emergency_contact_name": return staff.emergency_contact_name ?? "—";
      case "emergency_contact_number": return staff.emergency_contact_number ?? "—";
      case "qualification": return staff.qualification ?? "—";
      default: return (staff as any)[key] ?? "—";
    }
  };

  if (staff.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-1">No staff found</h3>
        <p className="text-muted-foreground text-sm">Try adjusting your filters or add your first staff member.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox checked={allSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
              {/* Fixed columns */}
              <TableHead className="min-w-[240px]">Staff</TableHead>
              <TableHead className="min-w-[140px]">Staff ID</TableHead>
              <TableHead className="min-w-[180px]">Messenger Tag</TableHead>
              <TableHead className="min-w-[120px]">Role</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[100px]">Joined</TableHead>
              <TableHead className="min-w-[120px]">Actions</TableHead>
              {/* Dynamic columns */}
              {visibleDynamicColumns.map((col) => (
                <TableHead key={col.key} className="min-w-[140px]">{col.label}</TableHead>
              ))}
              {/* Merged columns */}
              {(mergedColumns ?? []).map((mc) => (
                <TableHead key={mc.id} className="min-w-[180px]">{mc.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id} className={selectedIds.has(s.id) ? "bg-purple-50" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => handleSelectRow(s.id, false)}
                  />
                </TableCell>

                {/* Staff column with avatar */}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.full_name} className="w-10 h-10" />
                    <div>
                      <p className="font-semibold">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.login_mobile ?? "—"}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Staff ID */}
                <TableCell className="font-mono text-sm">{s.employee_id ?? "—"}</TableCell>

                {/* Messenger Tag with inline edit */}
                <TableCell>
                  {editingTagId === s.id ? (
                    <InlineTagEditor
                      tag={editingTagValue}
                      onSave={(tag) => {
                        onInlineEditTag?.(s.id, tag);
                        setEditingTagId(null);
                      }}
                      onCancel={() => setEditingTagId(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <span className="text-sm">{s.messenger_tag ?? "—"}</span>
                      {canEdit && (
                        <button
                          onClick={() => {
                            setEditingTagId(s.id);
                            setEditingTagValue(s.messenger_tag ?? "");
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Role */}
                <TableCell>
                  <RoleBadge role={s.role} />
                </TableCell>

                {/* Status */}
                <TableCell>
                  <StatusBadge status={s.status} />
                </TableCell>

                {/* Joined */}
                <TableCell className="text-sm">
                  {s.joining_date ? new Date(s.joining_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }) : "—"}
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onView(s)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button size="sm" variant="ghost" onClick={() => onEdit(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDownloadIdCard(s)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download ID Card
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuItem onClick={() => onToggleStatus(s)}>
                              {s.status === "active" ? (
                                <><UserX className="h-4 w-4 mr-2" />Mark Inactive</>
                              ) : (
                                <><UserCheck className="h-4 w-4 mr-2" />Activate</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDelete(s)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>

                {/* Dynamic columns */}
                {visibleDynamicColumns.map((col) => (
                  <TableCell key={col.key} className="text-sm">
                    {getCellValue(s, col.key)}
                  </TableCell>
                ))}
                {/* Merged columns */}
                {(mergedColumns ?? []).map((mc) => (
                  <TableCell key={mc.id} className="text-sm">
                    {getMergedValue(s, mc)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Import Users for empty state
import { Users } from "lucide-react";