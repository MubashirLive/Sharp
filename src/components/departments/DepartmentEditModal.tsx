import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDepartmentAction, type DepartmentWithDetails } from "@/integrations/supabase/queries/departments";
import { toTitleCase } from "@/lib/text-utils";

interface DepartmentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentWithDetails;
  schoolId: string;
  currentUserId?: string;
  currentUserName?: string;
  existingNames: string[];
  onSaved: () => void;
  onDeleted: () => void;
}

export function DepartmentEditModal({
  open,
  onOpenChange,
  department,
  schoolId,
  currentUserId,
  currentUserName,
  existingNames,
  onSaved,
  onDeleted,
}: DepartmentEditModalProps) {
  const [name, setName] = useState(department.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = (open: boolean) => {
    if (!open) setName(department.name);
    onOpenChange(open);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Department name cannot be empty.");
      return;
    }
    if (
      existingNames.some(
        (n) => n.toLowerCase() === trimmed.toLowerCase() && n !== department.name
      )
    ) {
      toast.error("A department with this name already exists.");
      return;
    }
    setIsSaving(true);
    try {
      await supabase
        .from("departments")
        .update({ name: toTitleCase(trimmed) })
        .eq("id", department.id);

      await logDepartmentAction({
        schoolId,
        userId: currentUserId ?? "",
        userName: currentUserName ?? "",
        deptId: department.id,
        deptName: toTitleCase(trimmed),
        action: "updated",
        what: `Department renamed to "${toTitleCase(trimmed)}"`,
      });
      toast.success("Department renamed");
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error("Failed to rename department");
    } finally {
      setIsSaving(false);
    }
  };

  const noChanges = name.trim() === department.name;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Department name"
              maxLength={50}
              className="text-sm"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onDeleted}
            disabled={isSaving}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Department
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || noChanges}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}