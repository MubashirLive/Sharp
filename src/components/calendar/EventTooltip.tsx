import { CalendarDays } from "lucide-react";
import type { CalendarEvent } from "@/hooks/useCalendar";

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  holiday: { label: "Holiday", cls: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  working_override: { label: "Working Day", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" },
  school_event: { label: "Event", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  class_event: { label: "Class Event", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  staff_meeting: { label: "Meeting", cls: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" },
  staff_task: { label: "Task", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  exam_timetable: { label: "Exam", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
};

interface EventTooltipProps {
  date: Date;
  events: CalendarEvent[];
  position: "below" | "above";
}

export function EventTooltip({ date, events, position }: EventTooltipProps) {
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      style={{ width: 220 }}
      className={[
        "absolute z-50 rounded-xl border border-border bg-popup shadow-clay p-3",
        "pointer-events-none",
        position === "below" ? "top-full mt-1.5 left-1/2 -translate-x-1/2" : "bottom-full mb-1.5 left-1/2 -translate-x-1/2",
      ].join(" ")}
    >
      {/* Gradient date header */}
      <div className="rounded-lg bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 px-2.5 py-1.5 mb-2.5">
        <p className="text-xs font-bold font-mono text-primary">{formatted}</p>
      </div>
      <div className="space-y-1.5">
        {events.map((e) => {
          const badge = TYPE_BADGE[e.event_type] ?? { label: e.event_type, cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
          const dotColor =
            e.event_type === "holiday" ? "bg-red-500 shadow-sm" :
            e.event_type === "exam_timetable" ? "bg-blue-500 shadow-sm" :
            e.event_type === "working_override" ? "bg-emerald-500 shadow-sm" :
            e.event_type === "staff_task" ? "bg-amber-500 shadow-sm" :
            e.event_type === "staff_meeting" ? "bg-teal-500 shadow-sm" :
            "bg-purple-500 shadow-sm";
          return (
            <div key={e.id}>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                <span className="text-sm font-semibold truncate">{e.title}</span>
              </div>
              {e.detail && (
                <p className="text-xs text-muted-foreground ml-3.5 truncate mt-0.5">{e.detail}</p>
              )}
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 ml-3.5 ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}