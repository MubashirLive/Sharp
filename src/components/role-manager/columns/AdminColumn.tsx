import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface AdminColumnProps {
  staffId: string;
  isAdmin: boolean;
  isReadOnly: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  currentUserId: string;
  onSaved: () => Promise<void>;
}

export function AdminColumn({
  staffId,
  isAdmin,
  isReadOnly,
  isEditing,
  onToggleEdit,
  onSaved,
}: AdminColumnProps) {
  const [pendingValue, setPendingValue] = useState(isAdmin);
  const [saving, setSaving] = useState(false);

  const handleToggle = () => {
    if (isEditing) {
      setPendingValue((v) => !v);
    } else {
      onToggleEdit();
      setPendingValue(isAdmin);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const newRole = pendingValue ? "admin" : "staff";
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", staffId);

    setSaving(false);
    if (error) return;
    onToggleEdit();
    await onSaved();
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Admin</span>
        {!isReadOnly && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={handleToggle}>
            {isEditing ? (saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save") : "Edit"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={isEditing ? pendingValue : isAdmin}
          onCheckedChange={handleToggle}
          disabled={isReadOnly}
        />
        <span className="text-xs text-muted-foreground">
          {isEditing ? (pendingValue ? "ON" : "OFF") : isAdmin ? "ON" : "OFF"}
        </span>
      </div>

      {isEditing && (
        <Button size="sm" className="w-full mt-2 h-7 text-xs" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Save
        </Button>
      )}
    </div>
  );
}