import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "sonner";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";

interface PendingProfilesTabProps {
  staff: StaffWithDetails[];
  onResume: (staff: StaffWithDetails) => void;
  onDelete: (staff: StaffWithDetails) => Promise<void>;
  canEdit: boolean;
}

export function PendingProfilesTab({ staff, onResume, onDelete, canEdit }: PendingProfilesTabProps) {
  if (staff.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground text-lg font-medium">No pending profiles</p>
        <p className="text-sm text-muted-foreground mt-1">
          Draft staff will appear here for completion
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {staff.length} draft profile{staff.length !== 1 ? "s" : ""} pending completion
        </p>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Staff</TableHead>
              <TableHead>Last Edited</TableHead>
              <TableHead>Profile Completion</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-amber-100 text-amber-800 text-sm font-semibold">
                        {s.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {s.employee_id ?? "—"}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">—</p>
                </TableCell>
                <TableCell>
                  <ProfileCompletionBadge completion={estimateCompletion(s)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {canEdit && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResume(s)}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (window.confirm(`Delete draft for ${s.full_name}?`)) {
                              await onDelete(s);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
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

function ProfileCompletionBadge({ completion }: { completion: number }) {
  const color =
    completion >= 70 ? "bg-green-100 text-green-800" :
    completion >= 40 ? "bg-amber-100 text-amber-800" :
    "bg-red-100 text-red-800";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {completion}%
    </span>
  );
}

// Rough estimation based on filled fields
function estimateCompletion(staff: StaffWithDetails): number {
  let filled = 0;
  const total = 15; // Stage 1 + basic fields

  if (staff.full_name) filled++;
  if (staff.gender) filled++;
  if (staff.dob) filled++;
  if (staff.login_mobile) filled++;
  if (staff.designation) filled++;
  if (staff.department) filled++;
  if (staff.joining_date) filled++;
  if (staff.blood_group) filled++;
  if (staff.email) filled++;
  if (staff.local_address) filled++;
  if (staff.personal_email) filled++;
  if (staff.whatsapp_mobile) filled++;
  if (staff.emergency_contact_name) filled++;
  if (staff.emergency_contact_number) filled++;
  if (staff.qualification) filled++;

  return Math.round((filled / total) * 100);
}