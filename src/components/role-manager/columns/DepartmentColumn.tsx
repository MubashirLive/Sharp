import { useState, useEffect } from "react";
import { Loader2, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import type { DepartmentMembership } from "@/integrations/supabase/queries/roleManager";

interface DepartmentColumnProps {
  staffId: string;
  schoolId: string;
  departments: DepartmentMembership[];
  isReadOnly: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSaved: () => Promise<void>;
}

export function DepartmentColumn({
  staffId,
  schoolId,
  departments,
  isReadOnly,
  isEditing,
  onToggleEdit,
  onSaved,
}: DepartmentColumnProps) {
  const [allDepts, setAllDepts] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(departments.map((d) => d.department_id)));
  const [inchargeSet, setInchargeSet] = useState<Set<string>>(new Set(
    departments.filter((d) => d.is_incharge).map((d) => d.department_id)
  ));
  const [saving, setSaving] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    setLoadingDepts(true);
    supabase
      .from("departments")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name")
      .then(({ data }) => {
        setAllDepts(data ?? []);
        setLoadingDepts(false);
      });
  }, [schoolId]);

  const handleDeptToggle = (deptId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const handleInchargeToggle = (deptId: string) => {
    setInchargeSet((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);

    const currentUserId = (await supabase.auth.getUser()).data.user?.id ?? "";
    const currentIds = new Set(departments.map((d) => d.department_id));
    const newIds = new Set(selected);
    const newIncharges = new Set(inchargeSet);

    // 2026-06-19: department_staff is the single source of truth — membership
    // AND incharge designation live on the same row (is_incharge boolean).
    // Compute desired per (staffId, deptId) state, then issue delete / upsert /
    // update against department_staff only.

    // 1. Remove depts no longer in the selection.
    const toRemove = [...currentIds].filter((id) => !newIds.has(id));
    if (toRemove.length) {
      const { error } = await supabase
        .from("department_staff")
        .delete()
        .eq("staff_profile_id", staffId)
        .in("department_id", toRemove);
      if (error) throw error;
    }

    // 2. Add new memberships (is_incharge = whether dept is in inchargeSet).
    const toAdd = [...newIds].filter((id) => !currentIds.has(id));
    if (toAdd.length) {
      const { error } = await supabase.from("department_staff").insert(
        toAdd.map((deptId) => ({
          staff_profile_id: staffId,
          department_id: deptId,
          school_id: schoolId,
          is_incharge: newIncharges.has(deptId),
          assigned_by: currentUserId,
        }))
      );
      if (error) throw error;
    }

    // 3. Flip is_incharge on existing rows where the designation changed.
    const toPromote = [...newIncharges].filter((id) => currentIds.has(id) && !departments.find((d) => d.department_id === id && d.is_incharge));
    if (toPromote.length) {
      const { error } = await supabase
        .from("department_staff")
        .update({ is_incharge: true })
        .eq("staff_profile_id", staffId)
        .in("department_id", toPromote);
      if (error) throw error;
    }

    const toDemote = [...currentIds]
      .filter((id) => newIds.has(id) && !newIncharges.has(id))
      .filter((id) => departments.find((d) => d.department_id === id && d.is_incharge));
    if (toDemote.length) {
      const { error } = await supabase
        .from("department_staff")
        .update({ is_incharge: false })
        .eq("staff_profile_id", staffId)
        .in("department_id", toDemote);
      if (error) throw error;
    }

    setSaving(false);
    onToggleEdit();
    await onSaved();
  };

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium">Department</span>
        {!isReadOnly && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onToggleEdit}>
            {isEditing ? "Cancel" : "Manage"}
          </Button>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-1">
          {departments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No department</p>
          ) : (
            departments.map((d) => (
              <div key={d.department_id} className="flex items-center gap-1">
                <span className="text-xs">{d.department_name}</span>
                {d.is_incharge && (
                  <Badge variant="outline" className="text-xs h-4">
                    <User className="h-3 w-3 mr-0.5" />
                    Incharge
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                Select departments...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {loadingDepts ? (
                <div className="p-2 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : allDepts.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">No departments</div>
              ) : (
                allDepts.map((d) => (
                  <DropdownMenuCheckboxItem
                    key={d.id}
                    checked={selected.has(d.id)}
                    onCheckedChange={() => handleDeptToggle(d.id)}
                  >
                    {d.name}
                  </DropdownMenuCheckboxItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {departments.length === 0 && !isEditing && null}

          {selected.size > 0 && (
            <div className="space-y-1">
              {[...selected].map((deptId) => {
                const dept = allDepts.find((d) => d.id === deptId);
                if (!dept) return null;
                return (
                  <div key={deptId} className="flex items-center gap-2">
                    <span className="text-xs flex-1 truncate">{dept.name}</span>
                    <Button
                      size="sm"
                      variant={inchargeSet.has(deptId) ? "default" : "outline"}
                      className="h-5 text-xs px-1"
                      onClick={() => handleInchargeToggle(deptId)}
                    >
                      Incharge
                    </Button>
                    <button
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeptToggle(deptId)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            size="sm"
            className="w-full h-7 text-xs"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Save
          </Button>
        </div>
      )}
    </div>
  );
}