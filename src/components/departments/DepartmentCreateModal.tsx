import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { logDepartmentAction } from "@/integrations/supabase/queries/departments";
import { toTitleCase } from "@/lib/text-utils";

const NAME_TEMPLATES = ["Fees", "Transport", "Human Resource", "Reception", "Discipline"];

interface DepartmentCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  currentUserId?: string;
  currentUserName?: string;
  existingNames: string[];
  onCreated: () => void;
}

export function DepartmentCreateModal({
  open,
  onOpenChange,
  schoolId,
  currentUserId,
  currentUserName,
  existingNames,
  onCreated,
}: DepartmentCreateModalProps) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a department name.");
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A department with this name already exists.");
      return;
    }
    setIsSaving(true);
    try {
      const { data } = await supabase
        .from("departments")
        .insert({
          name: toTitleCase(trimmed),
          school_id: schoolId,
          members: [],
          messenger_settings: { who_can_use: "incharges_only", visibility: [] },
        })
        .select("id, name")
        .single();

      if (data) {
        await logDepartmentAction({
          schoolId,
          userId: currentUserId ?? "",
          userName: currentUserName ?? "",
          deptId: data.id,
          deptName: data.name,
          action: "created",
          what: `Department "${data.name}" created`,
        });
        toast.success("Department created");
        setName("");
        onOpenChange(false);
        onCreated();
      }
    } catch {
      toast.error("Failed to create department");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) setName("");
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Department</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Transport"
              maxLength={50}
              className="text-sm"
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {NAME_TEMPLATES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setName(tpl)}
                  className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                    name === tpl
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary"
                  }`}
                >
                  {tpl}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Assign Incharge and Members in Role Manager after creation.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Create Department
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}