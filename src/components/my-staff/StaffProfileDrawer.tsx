import { X, ExternalLink, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { StaffWithDetails } from "@/integrations/supabase/queries/staff";

interface StaffProfileDrawerProps {
  staff: StaffWithDetails;
  onClose: () => void;
  onViewInRoleManager: () => void;
}

export function StaffProfileDrawer({ staff, onClose, onViewInRoleManager }: StaffProfileDrawerProps) {
  const initials = staff.full_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Staff Profile</SheetTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar and basic info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xl font-semibold">
              {initials || "?"}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{staff.full_name}</h3>
              <p className="text-sm text-muted-foreground font-mono">{staff.employee_id ?? "—"}</p>
              <Badge variant={staff.status === "active" ? "default" : "secondary"} className="mt-1">
                {staff.status}
              </Badge>
            </div>
          </div>

          {/* Quick contact buttons */}
          {staff.login_mobile && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={`tel:${staff.login_mobile}`}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={`sms:${staff.login_mobile}`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message
                </a>
              </Button>
            </div>
          )}

          {/* Details */}
          <div className="space-y-4">
            {staff.messenger_tag && (
              <DetailRow label="Messenger Tag" value={staff.messenger_tag} />
            )}
            {staff.role && (
              <DetailRow label="Role" value={staff.role.replace("_", " ")} />
            )}
            {staff.designation && (
              <DetailRow label="Designation" value={staff.designation} />
            )}
            {staff.department && (
              <DetailRow label="Department" value={staff.department} />
            )}
            {staff.login_mobile && (
              <DetailRow label="Mobile" value={staff.login_mobile} />
            )}
            {staff.email && (
              <DetailRow label="Email" value={staff.email} />
            )}
            {staff.joining_date && (
              <DetailRow
                label="Joined"
                value={new Date(staff.joining_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            )}
          </div>

          {/* Links */}
          <div className="space-y-2 pt-4 border-t">
            <Button variant="outline" className="w-full justify-between" onClick={onViewInRoleManager}>
              View Full Profile in My Staff
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={onViewInRoleManager}>
              View Roles in Role Manager
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}