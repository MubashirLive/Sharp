import type { StaffAllRoles } from "@/integrations/supabase/queries/roleAssignments";

export type DerivedRole = "Academic" | "Non-Academic" | "Both" | "—";

/**
 * Role is auto-derived from assignments per docs/ROLE_MANAGER.md §3.1.2(c):
 *   - Academic     = Coordinator | Class Teacher | Subject Teacher | House
 *   - Non-Academic = Department member | Department Incharge
 *   - Both         = both Academic AND Non-Academic items present
 *   - "—"          = zero assignments
 *
 * No stored value, no override. To change role, change assignments.
 */
export function deriveRole(roles: Pick<StaffAllRoles, "coordinator" | "class_teachers" | "subject_teachers" | "departments" | "house">): DerivedRole {
  const hasAcademic = !!roles.coordinator || roles.class_teachers.length > 0 || roles.subject_teachers.length > 0 || !!roles.house;
  const hasNonAcademic = roles.departments.length > 0;
  if (hasAcademic && hasNonAcademic) return "Both";
  if (hasAcademic) return "Academic";
  if (hasNonAcademic) return "Non-Academic";
  return "—";
}

interface RoleFieldProps {
  roles: StaffAllRoles;
  showHint?: boolean;
}

export function RoleField({ roles, showHint }: RoleFieldProps) {
  const role = deriveRole(roles);
  const colorClass =
    role === "Both" ? "bg-violet-50 text-violet-700 border-violet-200"
    : role === "Academic" ? "bg-blue-50 text-blue-700 border-blue-200"
    : role === "Non-Academic" ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-muted text-muted-foreground border-border";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`px-2 py-0.5 rounded-full border text-xs ${colorClass}`}>{role}</span>
      {showHint && (
        <span className="text-[10px] text-muted-foreground italic">auto-derived</span>
      )}
    </span>
  );
}
