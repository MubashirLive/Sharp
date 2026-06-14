import { eventFilterOptions, type CalendarEvent } from "@/hooks/useCalendar";

interface EventFiltersProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  events?: CalendarEvent[];
}

export function EventFilters({ currentFilter, onFilterChange, events = [] }: EventFiltersProps) {
  const getCounts = (filter: string) => {
    if (!events.length) return null;
    const now = new Date().toISOString().split("T")[0];
    switch (filter) {
      case "all":
        return events.length;
      case "school-wide":
        return events.filter((e) => e.scope === "all").length;
      case "department":
        return events.filter((e) => e.scope === "department").length;
      case "wing":
        return events.filter((e) => e.scope === "wing").length;
      case "class":
        return events.filter((e) => e.scope === "class").length;
      case "upcoming":
        return events.filter((e) => e.date >= now && !e.cancelled_at).length;
      case "ended":
        return events.filter((e) => e.date < now || e.cancelled_at).length;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-1 bg-muted/50 rounded-lg">
      {eventFilterOptions.map((option) => {
        const count = getCounts(option.value);
        const isActive = currentFilter === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={[
              "px-3 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer",
              isActive
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50",
            ].join(" ")}
          >
            {option.label}
            {count !== null && (
              <span className={[
                "ml-1.5 text-xs px-1.5 py-0.5 rounded-full",
                isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              ].join(" ")}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}