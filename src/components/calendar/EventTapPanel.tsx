import { X, CalendarDays } from "lucide-react";
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

interface EventTapPanelProps {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
}

export function EventTapPanel({ date, events, onClose }: EventTapPanelProps) {
  const formatted = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-l border-r border-border bg-popup shadow-clay"
      role="dialog"
      aria-modal="true"
    >
      {/* Gradient top bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-t-2xl" />

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h3 className="font-bold font-mono text-sm">{formatted}</h3>
          </div>
          <button
            onClick={onClose}
            className="clay-btn p-1.5 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {events.map((e) => {
            const badge = TYPE_BADGE[e.event_type] ?? { label: e.event_type, cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
            const dotColor =
              e.event_type === "holiday" ? "bg-red-500" :
              e.event_type === "exam_timetable" ? "bg-blue-500" :
              e.event_type === "working_override" ? "bg-emerald-500" :
              e.event_type === "staff_task" ? "bg-amber-500" :
              e.event_type === "staff_meeting" ? "bg-teal-500" :
              "bg-purple-500";
            return (
              <div key={e.id} className="rounded-xl border border-border bg-card p-3 shadow-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm ${dotColor}`} />
                  <span className="font-semibold text-sm truncate">{e.title}</span>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-semibold ml-auto ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>
                {e.detail && (
                  <p className="text-xs text-muted-foreground ml-4">{e.detail}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}