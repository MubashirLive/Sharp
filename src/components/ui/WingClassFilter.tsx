import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HelpCircle } from "lucide-react";

const getClassAcademicRank = (className: string): number => {
  const name = className.toLowerCase().trim();
  if (name === "nursery") return 0;
  if (name === "lkg") return 1;
  if (name === "ukg") return 2;
  const match = name.match(/class\s*(\d+)/i) || name.match(/^(\d+)$/);
  if (match) return 10 + parseInt(match[1], 10);
  return 100;
};

export interface WingFilterOption {
  id: string;
  name: string;
  display_order?: number;
}

export interface WingClassFilterProps {
  wings: WingFilterOption[];
  /** Objects that have optional wing_id field */
  items: Array<{ id: string; wing_id?: string | null }>;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  children: (filteredItems: Array<{ id: string; wing_id?: string | null }>) => React.ReactNode;
  /** Text shown above the tab list */
  label?: string;
  /** Extra content to show in the roll number tooltip */
  rollNoTooltip?: React.ReactNode;
  /** Maps item ID (class _id or name) to class display name for academic rank sorting */
  nameMap?: Record<string, string>;
}

export function WingClassFilter({
  wings,
  items,
  activeFilter,
  onFilterChange,
  children,
  label,
  rollNoTooltip,
  nameMap,
}: WingClassFilterProps) {
  const wingTabs = useMemo(() => {
    const hasUnassigned = items.some((c) => !c.wing_id);
    const sortedWings = [...wings].sort((a, b) => {
      const aItems = items.filter((item) => item.wing_id === a.id);
      const bItems = items.filter((item) => item.wing_id === b.id);
      const aRank = aItems.length
        ? Math.min(...aItems.map((i) => getClassAcademicRank(nameMap?.[i.id] ?? String(i.id))))
        : 999;
      const bRank = bItems.length
        ? Math.min(...bItems.map((i) => getClassAcademicRank(nameMap?.[i.id] ?? String(i.id))))
        : 999;
      return aRank - bRank;
    });
    return [
      ...sortedWings.map((w) => ({ key: w.id, label: w.name })),
      ...(hasUnassigned ? [{ key: "unassigned", label: "Unassigned" }] : []),
      { key: "all", label: "All" },
    ];
  }, [wings, items, nameMap]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "unassigned") return items.filter((c) => !c.wing_id);
    return items.filter((c) => c.wing_id === activeFilter);
  }, [items, activeFilter]);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {label && (
            <span className="text-xs text-muted-foreground">{label}</span>
          )}
          {rollNoTooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                {rollNoTooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <Tabs value={activeFilter} onValueChange={onFilterChange}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {wingTabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {wingTabs.map((tab) => {
            const tabItems = tab.key === "all"
              ? items
              : tab.key === "unassigned"
                ? items.filter((c) => !c.wing_id)
                : items.filter((c) => c.wing_id === tab.key);
            return (
              <TabsContent key={tab.key} value={tab.key} className="mt-4">
                {children(tabItems)}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </TooltipProvider>
  );
}