import { Users, CheckCircle, XCircle, FileText, Building } from "lucide-react";
import type { StaffStats } from "@/integrations/supabase/queries/staff";

interface StatCardsProps {
  stats: StaffStats;
  onFilterByStatus: (status: "active" | "inactive" | "draft" | null) => void;
  activeStatusFilter: string | null;
}

export function StatCards({ stats, onFilterByStatus, activeStatusFilter }: StatCardsProps) {
  const cards = [
    {
      label: "Total Staff",
      value: stats.total,
      icon: Users,
      accent: "bg-purple-500",
      filter: null,
    },
    {
      label: "Active",
      value: stats.active,
      icon: CheckCircle,
      accent: "bg-green-500",
      filter: "active",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      icon: XCircle,
      accent: "bg-gray-500",
      filter: "inactive",
    },
    {
      label: "Draft",
      value: stats.draft,
      icon: FileText,
      accent: "bg-amber-500",
      filter: "draft",
    },
    {
      label: "Departments",
      value: stats.departmentCount,
      icon: Building,
      accent: "bg-blue-500",
      filter: null,
      readonly: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const isActive = activeStatusFilter === card.filter;
        const Icon = card.icon;

        return (
          <button
            key={card.label}
            onClick={() => !card.readonly && onFilterByStatus(isActive ? null : (card.filter as any))}
            disabled={card.readonly}
            className={`
              clay-stat-card rounded-xl border bg-card px-4 py-4 shadow-md text-left
              transition-all hover:shadow-lg
              ${!card.readonly ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"}
              ${isActive ? "ring-2 ring-purple-500" : ""}
              disabled:opacity-80
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 shadow-sm ${card.accent}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}