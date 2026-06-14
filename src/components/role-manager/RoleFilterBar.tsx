import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { RoleFilters } from "./RoleManagerTab";

interface RoleFilterBarProps {
  filters: RoleFilters;
  onFiltersChange: (f: RoleFilters) => void;
  resultCount: number;
  canEdit: boolean;
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={`h-8 text-xs ${active ? "" : "text-muted-foreground"}`}
    >
      {children}
    </Button>
  );
}

export function RoleFilterBar({ filters, onFiltersChange, resultCount, canEdit }: RoleFilterBarProps) {
  const clearAll = () => onFiltersChange({});

  const hasFilters =
    filters.search ||
    filters.masterAdmin ||
    filters.admin ||
    filters.teacher ||
    filters.classTeacher ||
    filters.coordinator ||
    filters.deptIncharge ||
    filters.departments?.length;

  return (
    <div className="space-y-3">
      {/* Search + Result count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name, ID, or messenger tag..."
            value={filters.search ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {resultCount} staff
        </span>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Master Admin — only shown to principal */}
        {canEdit && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Non-Academic</span>
            <ToggleButton
              active={!!filters.masterAdmin}
              onClick={() => onFiltersChange({ ...filters, masterAdmin: !filters.masterAdmin })}
            >
              Master Admin
            </ToggleButton>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Non-Academic</span>
          <ToggleButton
            active={!!filters.admin}
            onClick={() => onFiltersChange({ ...filters, admin: !filters.admin })}
          >
            Admin
          </ToggleButton>
          <ToggleButton
            active={!!filters.deptIncharge}
            onClick={() => onFiltersChange({ ...filters, deptIncharge: !filters.deptIncharge })}
          >
            Dept Incharge
          </ToggleButton>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Academic</span>
          <ToggleButton
            active={!!filters.teacher}
            onClick={() => onFiltersChange({ ...filters, teacher: !filters.teacher })}
          >
            Teacher
          </ToggleButton>
          <ToggleButton
            active={!!filters.classTeacher}
            onClick={() => onFiltersChange({ ...filters, classTeacher: !filters.classTeacher })}
          >
            Class Teacher
          </ToggleButton>
          <ToggleButton
            active={!!filters.coordinator}
            onClick={() => onFiltersChange({ ...filters, coordinator: !filters.coordinator })}
          >
            Coordinator
          </ToggleButton>
        </div>
      </div>
    </div>
  );
}