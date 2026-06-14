import { useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, CalendarDays, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export interface WingOption {
  id: string;
  name: string;
  display_order?: number;
}

export interface ClassOption {
  id: string;
  name: string;
  wing_id?: string | null;
  display_order?: number;
}

export interface SectionOption {
  id: string;
  name: string;
  class_id: string;
}

export type SortOption = "name_asc" | "name_desc" | "roll_asc" | "roll_desc";
export type StatusFilter = "present" | "absent" | "leave" | "not_marked";
export type ViewMode = "list" | "grid";

interface AttendanceFilterBarProps {
  wings: WingOption[];
  classes: ClassOption[];
  sections: SectionOption[];
  activeWing: string;
  activeClass: string;
  activeSection: string;
  activeDate: Date;
  dateRange: { from: Date | null; to: Date | null } | null;
  activeStatuses: StatusFilter[];
  searchQuery: string;
  sortBy: SortOption;
  viewMode: ViewMode;
  isRangeMode: boolean;
  // Locked state from role
  isClassLocked: boolean;
  lockedClassName?: string;
  lockedSectionName?: string;
  // Callbacks
  onWingChange: (wingId: string) => void;
  onClassChange: (classId: string) => void;
  onSectionChange: (sectionId: string) => void;
  onDateChange: (date: Date) => void;
  onRangeToggle: (enabled: boolean) => void;
  onRangeChange: (range: { from: Date | null; to: Date | null } | null) => void;
  onStatusToggle: (status: StatusFilter) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  onViewChange: (mode: ViewMode) => void;
  onBackToMyClass: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "name_asc", label: "Name A→Z" },
  { value: "name_desc", label: "Name Z→A" },
  { value: "roll_asc", label: "Roll No. ↑" },
  { value: "roll_desc", label: "Roll No. ↓" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
  { value: "not_marked", label: "Not Marked" },
];

export function AttendanceFilterBar({
  wings,
  classes,
  sections,
  activeWing,
  activeClass,
  activeSection,
  activeDate,
  dateRange,
  activeStatuses,
  searchQuery,
  sortBy,
  viewMode,
  isRangeMode,
  isClassLocked,
  lockedClassName,
  lockedSectionName,
  onWingChange,
  onClassChange,
  onSectionChange,
  onDateChange,
  onRangeToggle,
  onRangeChange,
  onStatusToggle,
  onSearchChange,
  onSortChange,
  onViewChange,
  onBackToMyClass,
}: AttendanceFilterBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [rangeFromPopoverOpen, setRangeFromPopoverOpen] = useState(false);
  const [rangeToPopoverOpen, setRangeToPopoverOpen] = useState(false);

  // Filter classes by wing
  const filteredClasses = activeWing === "all"
    ? classes
    : activeWing === "unassigned"
      ? classes.filter((c) => !c.wing_id)
      : classes.filter((c) => c.wing_id === activeWing);

  // Filter sections by class
  const filteredSections = sections.filter((s) => s.class_id === activeClass);

  // Active non-default filters for chips
  const activeChips: { label: string; onRemove: () => void }[] = [];

  if (activeWing !== "all") {
    const wing = wings.find((w) => w.id === activeWing);
    activeChips.push({
      label: wing ? `Wing: ${wing.name}` : "Wing: Unassigned",
      onRemove: () => onWingChange("all"),
    });
  }
  if (activeClass) {
    const cls = classes.find((c) => c.id === activeClass);
    if (cls) activeChips.push({ label: `Class: ${cls.name}`, onRemove: () => onClassChange("") });
  }
  if (activeSection) {
    const sec = sections.find((s) => s.id === activeSection);
    if (sec) activeChips.push({ label: `Section: ${sec.name}`, onRemove: () => onSectionChange("") });
  }
  if (isRangeMode && dateRange?.from && dateRange?.to) {
    activeChips.push({
      label: `${format(dateRange.from, "dd MMM")} – ${format(dateRange.to, "dd MMM")}`,
      onRemove: () => onRangeToggle(false),
    });
  } else if (!isRangeMode) {
    activeChips.push({
      label: format(activeDate, "dd MMM yyyy"),
      onRemove: () => onDateChange(new Date()),
    });
  }
  activeStatuses.forEach((s) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === s);
    if (opt) activeChips.push({ label: opt.label, onRemove: () => onStatusToggle(s) });
  });

  const hasActiveFilters = activeChips.length > 0;

  // Navigate months
  const goToPrevMonth = () => {
    const d = new Date(activeDate);
    d.setMonth(d.getMonth() - 1);
    onDateChange(d);
  };
  const goToNextMonth = () => {
    const d = new Date(activeDate);
    d.setMonth(d.getMonth() + 1);
    onDateChange(d);
  };

  return (
    <div className="space-y-3">
      {/* Filter row */}
      <div className="flex flex-wrap items-center gap-2">

        {/* Wing filter — toggle buttons */}
        <ToggleGroup
          type="single"
          value={activeWing}
          onValueChange={(v) => v && onWingChange(v)}
          className="flex flex-wrap gap-1"
        >
          <Toggle value="all" className="text-xs px-2.5 py-1 cursor-pointer">
            All
          </Toggle>
          {wings.map((wing) => (
            <Toggle key={wing.id} value={wing.id} className="text-xs px-2.5 py-1 cursor-pointer">
              {wing.name}
            </Toggle>
          ))}
          {classes.some((c) => !c.wing_id) && (
            <Toggle value="unassigned" className="text-xs px-2.5 py-1 cursor-pointer">
              Unassigned
            </Toggle>
          )}
        </ToggleGroup>

        {/* Divider */}
        <div className="w-px h-6 bg-border self-center shrink-0" />

        {/* Class dropdown */}
        <Select
          value={activeClass}
          onValueChange={(v) => {
            onClassChange(v);
            onSectionChange(""); // reset section when class changes
          }}
          disabled={isClassLocked}
        >
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {filteredClasses.length === 0 ? (
              <SelectItem value="__empty__" disabled>
                {activeWing === "all" ? "All classes" : "Select a wing first"}
              </SelectItem>
            ) : (
              filteredClasses
                .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))
                .map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))
 )}
          </SelectContent>
        </Select>

        {/* Section dropdown — hidden if no sections */}
        {filteredSections.length > 0 && (
          <Select value={activeSection} onValueChange={onSectionChange}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue placeholder="Section" />
            </SelectTrigger>
            <SelectContent>
              {filteredSections
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((sec) => (
                  <SelectItem key={sec.id} value={sec.id}>
                    {sec.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-border self-center shrink-0" />

        {/* Date navigation */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Date picker */}
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 px-2 cursor-pointer font-normal"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                {isRangeMode
                  ? dateRange?.from && dateRange?.to
                    ? `${format(dateRange.from, "dd MMM")} – ${format(dateRange.to, "dd MMM")}`
                    : "Select range"
                  : format(activeDate, "dd MMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="range-mode"
                    checked={isRangeMode}
                    onCheckedChange={(v) => {
                      onRangeToggle(!!v);
                      if (!v) onRangeChange(null);
                    }}
                  />
                  <label htmlFor="range-mode" className="text-sm cursor-pointer">
                    Date range
                  </label>
                </div>
                {!isRangeMode ? (
                  <Calendar
                    mode="single"
                    selected={activeDate}
                    onSelect={(d) => {
                      if (d) {
                        onDateChange(d);
                        setDatePopoverOpen(false);
                      }
                    }}
                    initialFocus
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">From</div>
                    <Popover open={rangeFromPopoverOpen} onOpenChange={setRangeFromPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs cursor-pointer font-normal"
                        >
                          {dateRange?.from ? format(dateRange.from, "dd MMM yyyy") : "Select start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange?.from ?? undefined}
                          onSelect={(d) => {
                            onRangeChange({ from: d, to: dateRange?.to ?? null });
                            setRangeFromPopoverOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="text-xs text-muted-foreground">To</div>
                    <Popover open={rangeToPopoverOpen} onOpenChange={setRangeToPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs cursor-pointer font-normal"
                        >
                          {dateRange?.to ? format(dateRange.to, "dd MMM yyyy") : "Select end date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateRange?.to ?? undefined}
                          onSelect={(d) => {
                            onRangeChange({ from: dateRange?.from, to: d });
                            setRangeToPopoverOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Today shortcut */}
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs px-2.5 cursor-pointer"
            onClick={() => {
              onDateChange(new Date());
              onRangeToggle(false);
              onRangeChange(null);
            }}
          >
            Today
          </Button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border self-center shrink-0" />

        {/* Status toggles */}
        <div className="flex items-center gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <Toggle
              key={opt.value}
              pressed={activeStatuses.includes(opt.value)}
              onPressedChange={() => onStatusToggle(opt.value)}
              className={cn(
                "text-xs px-2.5 py-1 cursor-pointer",
                activeStatuses.includes(opt.value) && "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              )}
            >
              {opt.label}
            </Toggle>
          ))}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border self-center shrink-0" />

        {/* Search */}
        <div className="relative">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 cursor-pointer">
                <Search className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <div className="p-2">
                <Input
                  placeholder="Search Roll No., Name, Father's Name…"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View toggle */}
        <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && onViewChange(v as ViewMode)}>
          <Toggle value="list" className="h-8 w-8 p-0 cursor-pointer" title="List view">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mx-auto">
              <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor" />
              <rect x="1" y="12" width="14" height="2" rx="1" fill="currentColor" />
            </svg>
          </Toggle>
          <Toggle value="grid" className="h-8 w-8 p-0 cursor-pointer" title="Grid view">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mx-auto">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
              <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" />
              <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" />
              <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" />
            </svg>
          </Toggle>
        </ToggleGroup>
      </div>

      {/* Back to my class shortcut */}
      {isClassLocked && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 px-2 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={onBackToMyClass}
          >
            <ArrowLeft className="h-3 w-3" />
            Back to my class
          </Button>
          {lockedClassName && (
            <span className="text-xs text-muted-foreground">
              {lockedClassName}{lockedSectionName ? ` — ${lockedSectionName}` : ""}
            </span>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5">
          {activeChips.map((chip, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="pl-2 pr-1 py-0.5 text-xs gap-1 cursor-pointer hover:bg-muted/80"
              onClick={chip.onRemove}
            >
              {chip.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs px-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => {
              onWingChange("all");
              onClassChange("");
              onSectionChange("");
              onDateChange(new Date());
              onRangeToggle(false);
              onRangeChange(null);
              activeStatuses.forEach((s) => onStatusToggle(s));
              onSearchChange("");
            }}
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
