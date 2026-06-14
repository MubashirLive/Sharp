import { useState } from "react";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StaffFilters, SortOption } from "@/integrations/supabase/queries/staff";

interface FilterBarProps {
  filters: StaffFilters;
  onFiltersChange: (filters: StaffFilters) => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onColumnPickerOpen: () => void;
  onClearAll: () => void;
  onQuickEnroll: () => void;
  onBulkImport: () => void;
  hasActiveFilters: boolean;
}

export function FilterBar({
  filters,
  onFiltersChange,
  sort,
  onSortChange,
  onColumnPickerOpen,
  onClearAll,
  onQuickEnroll,
  onBulkImport,
  hasActiveFilters,
}: FilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const roles = ["principal", "master_admin", "admin", "teacher", "non_teaching"];
  const employmentTypes = ["Permanent", "Probation", "Contract", "Part-Time", "Guest", "Substitute"];
  const statuses = ["active", "inactive", "draft"];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "name_asc", label: "Name A–Z" },
    { value: "name_desc", label: "Name Z–A" },
    { value: "staff_id_asc", label: "Staff ID ↑" },
    { value: "staff_id_desc", label: "Staff ID ↓" },
    { value: "joined_newest", label: "Joined Newest" },
    { value: "joined_oldest", label: "Joined Oldest" },
  ];

  // Active filter chips
  const activeChips: { label: string; onRemove: () => void }[] = [];

  if (filters.search) {
    activeChips.push({ label: `Search: "${filters.search}"`, onRemove: () => onFiltersChange({ ...filters, search: undefined }) });
  }
  if (filters.status?.length) {
    filters.status.forEach((s) => {
      activeChips.push({
        label: `Status: ${s}`,
        onRemove: () => onFiltersChange({ ...filters, status: filters.status?.filter((x) => x !== s) }),
      });
    });
  }
  if (filters.roles?.length) {
    filters.roles.forEach((r) => {
      activeChips.push({
        label: `Role: ${r}`,
        onRemove: () => onFiltersChange({ ...filters, roles: filters.roles?.filter((x) => x !== r) }),
      });
    });
  }
  if (filters.employmentType?.length) {
    filters.employmentType.forEach((e) => {
      activeChips.push({
        label: `Type: ${e}`,
        onRemove: () => onFiltersChange({ ...filters, employmentType: filters.employmentType?.filter((x) => x !== e) }),
      });
    });
  }

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, Staff ID..."
            value={filters.search ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            className="pl-9"
          />
        </div>

        {/* Role filter */}
        <select
          className="h-10 px-3 rounded-md border bg-background text-sm"
          value={filters.roles?.[0] ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, roles: e.target.value ? [e.target.value] : undefined })}
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>{r.replace("_", " ").toUpperCase()}</option>
          ))}
        </select>

        {/* Employment Type filter */}
        <select
          className="h-10 px-3 rounded-md border bg-background text-sm"
          value={filters.employmentType?.[0] ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, employmentType: e.target.value ? [e.target.value] : undefined })}
        >
          <option value="">All Types</option>
          {employmentTypes.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          className="h-10 px-3 rounded-md border bg-background text-sm"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* More Filters toggle */}
        <Button variant="outline" onClick={() => setShowMoreFilters(!showMoreFilters)}>
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>

        {/* Column Picker */}
        <Button variant="outline" onClick={onColumnPickerOpen}>
          ⚙️ Columns
        </Button>

        {/* Bulk Actions */}
        <Button variant="outline" onClick={onQuickEnroll}>Quick Enroll</Button>
        <Button variant="outline" onClick={onBulkImport}>Bulk Import</Button>

        {/* Clear All */}
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClearAll} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Expanded filters */}
      {showMoreFilters && (
        <div className="flex flex-wrap gap-3 items-center p-3 bg-muted/30 rounded-lg">
          {/* Status filter */}
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {statuses.map((s) => {
              const isSelected = filters.status?.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => {
                    const current = filters.status ?? [];
                    const updated = isSelected ? current.filter((x) => x !== s) : [...current, s];
                    onFiltersChange({ ...filters, status: updated.length ? updated : undefined });
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-purple-100 text-purple-800 border border-purple-300"
                      : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip, i) => (
            <Badge key={i} variant="secondary" className="gap-1 pl-2 pr-1">
              {chip.label}
              <button onClick={chip.onRemove} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}