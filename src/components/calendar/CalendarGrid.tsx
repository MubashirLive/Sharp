import { useState, useCallback, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EventTooltip } from "./EventTooltip";
import { EventTapPanel } from "./EventTapPanel";
import type { CalendarEvent } from "@/hooks/useCalendar";

interface CalendarGridProps {
  events: CalendarEvent[];
  workingDays: string[];
  onMonthChange?: (date: Date) => void;
  onDateClick?: (date: Date) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const DOT_COLORS: Record<string, string> = {
  holiday: "bg-red-500 shadow-sm",
  exam_timetable: "bg-blue-500 shadow-sm",
  school_event: "bg-purple-500 shadow-sm",
  class_event: "bg-purple-500 shadow-sm",
  staff_meeting: "bg-teal-500 shadow-sm",
  staff_task: "bg-amber-500 shadow-sm",
  working_override: "bg-emerald-500 shadow-sm",
};

const CELL_TINTS: Record<string, string> = {
  all: "bg-red-50 dark:bg-red-950/30",
  students: "bg-amber-50 dark:bg-amber-950/30",
  staff: "bg-green-50 dark:bg-green-950/30",
};

function getWeeks(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // getDay() is 0=Sun, 1=Mon...6=Sat — already Sunday-first
  const startDow = firstDay.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

function getDayEvents(date: Date, events: CalendarEvent[]) {
  const iso = date.toISOString().split("T")[0];
  return events.filter((e) => e.date === iso);
}

function getHolidayScope(events: CalendarEvent[]): string | null {
  const h = events.find((e) => e.event_type === "holiday");
  return h?.scope ?? null;
}

function getIsWorkingOverride(events: CalendarEvent[]): boolean {
  return events.some((e) => e.event_type === "working_override");
}

const WEEKEND_DAYS = new Set(["Sun"]);

export function CalendarGrid({ events, workingDays, onMonthChange, onDateClick }: CalendarGridProps) {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [tooltipPos, setTooltipPos] = useState<"below" | "above">("below");
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [mobileDate, setMobileDate] = useState<Date | null>(null);
  const isMobileRef = useRef(false);
  if (typeof window !== "undefined") isMobileRef.current = window.innerWidth <= 520;

  const workingDaysSet = useMemo(() => new Set(workingDays), [workingDays]);
  const weeks = useMemo(() => getWeeks(selectedYear, selectedMonth), [selectedYear, selectedMonth]);
  const hoveredEvents = hoveredDate ? getDayEvents(hoveredDate, events) : [];
  const mobilePanelEvents = mobileDate ? getDayEvents(mobileDate, events) : [];
  const currentYears = useMemo(() => {
    const cur = today.getFullYear();
    return Array.from({ length: 11 }, (_, i) => cur - 5 + i);
  }, []);

  const handleMonthChange = useCallback((m: number) => {
    setSelectedMonth(m);
    const newDate = new Date(selectedYear, m, 1);
    setShowMonthPicker(false);
    onMonthChange?.(newDate);
  }, [selectedYear, onMonthChange]);

  const handleYearChange = useCallback((y: number) => {
    setSelectedYear(y);
    setShowYearPicker(false);
    onMonthChange?.(new Date(y, selectedMonth, 1));
  }, [selectedMonth, onMonthChange]);

  const handleCellClick = useCallback((date: Date) => {
    if (isMobileRef.current) {
      setMobileDate((prev) =>
        prev?.toDateString() === date.toDateString() ? null : date
      );
    } else {
      onDateClick?.(date);
    }
  }, [onDateClick]);

  const handleMouseEnter = useCallback((date: Date, el: HTMLElement) => {
    setHoveredDate(date);
    const rect = el.getBoundingClientRect();
    setTooltipPos(rect.bottom > window.innerHeight - 180 ? "above" : "below");
  }, []);

  return (
    <div className="relative space-y-3">
      {/* Month / Year selectors */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Month picker */}
          <div className="relative">
            <button
              onClick={() => { setShowMonthPicker((v) => !v); setShowYearPicker(false); }}
              className="text-lg font-bold font-mono hover:text-primary transition-colors cursor-pointer tracking-tight"
            >
              {MONTHS[selectedMonth]}
            </button>
            {showMonthPicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-popup border rounded-xl shadow-clay p-1.5 grid grid-cols-3 gap-0.5 w-64">
                {MONTHS.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => handleMonthChange(i)}
                    className={`px-2 py-2 text-sm rounded-lg hover:bg-accent cursor-pointer text-left font-medium transition-colors ${
                      i === selectedMonth ? "bg-primary text-primary-foreground shadow-sm" : ""
                    }`}
                  >
                    {m.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Year picker */}
          <div className="relative">
            <button
              onClick={() => { setShowYearPicker((v) => !v); setShowMonthPicker(false); }}
              className="text-lg font-bold font-mono text-muted-foreground hover:text-primary transition-colors cursor-pointer tracking-tight"
            >
              {selectedYear}
            </button>
            {showYearPicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-popup border rounded-xl shadow-clay p-1.5 grid grid-cols-4 gap-0.5 w-48 max-h-48 overflow-y-auto">
                {currentYears.map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearChange(y)}
                    className={`px-2 py-2 text-sm rounded-lg hover:bg-accent cursor-pointer text-center font-mono font-medium transition-colors ${
                      y === selectedYear ? "bg-primary text-primary-foreground shadow-sm" : ""
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Prev / Next */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleMonthChange(selectedMonth === 0 ? 11 : selectedMonth - 1)}
            className="clay-btn p-2 cursor-pointer transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleMonthChange(selectedMonth === 11 ? 0 : selectedMonth + 1)}
            className="clay-btn p-2 cursor-pointer transition-all"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div key={d} className={[
            "text-center text-xs font-bold py-2",
            d === "Sun" ? "text-red-500 dark:text-red-400" : "text-muted-foreground",
          ].join(" ")}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid — 6 rows max */}
      <div className="grid grid-cols-7 rounded-2xl overflow-hidden border border-border shadow-clay">
        {weeks.slice(0, 6).map((week, wi) =>
          week.map((date, di) => {
            if (!date) {
              return <div key={`empty-${wi}-${di}`} className="bg-card min-h-[80px]" />;
            }
            const iso = date.toISOString().split("T")[0];
            const dayEvents = getDayEvents(date, events);
            const holidayScope = getHolidayScope(dayEvents);
            const isWorkingOverride = getIsWorkingOverride(dayEvents);
            const dow = date.getDay();
            const dayName = WEEKDAYS[dow];
            const isSunday = WEEKEND_DAYS.has(dayName);
            const isSaturday = dayName === "Sat";
            const isWeekend = isSunday || isSaturday;
            const isWorkingDay = workingDaysSet.has(dayName);
            const showMuted = isSunday || (isSaturday && !isWorkingDay && !isWorkingOverride);
            const tintClass = holidayScope && !isWorkingOverride ? CELL_TINTS[holidayScope] : "";
            const isToday = date.toDateString() === today.toDateString();
            const MAX_DOTS = 3;

            return (
              <div
                key={iso}
                className={[
                  "bg-card min-h-[80px] p-2 cursor-pointer transition-all duration-200 relative",
                  "hover:shadow-clay hover:z-10 hover:relative",
                  showMuted ? "opacity-40" : "",
                  isToday ? "ring-2 ring-primary ring-inset bg-primary/5" : "",
                  tintClass,
                ].join(" ")}
                onClick={() => handleCellClick(date)}
                onMouseEnter={(e) => handleMouseEnter(date, e.currentTarget)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <span className={[
                  "text-xs font-mono font-semibold block mb-1",
                  isToday ? "text-primary" : "text-foreground",
                  isSunday ? "text-red-500 dark:text-red-400" : "",
                ].join(" ")}>
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dayEvents.slice(0, MAX_DOTS).map((e) => (
                      <span key={e.id} className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLORS[e.event_type] ?? "bg-gray-400 shadow-sm"}`} />
                    ))}
                    {dayEvents.length > MAX_DOTS && (
                      <span className="text-[9px] text-muted-foreground leading-none font-mono">+{dayEvents.length - MAX_DOTS}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop tooltip */}
      {!isMobileRef.current && hoveredDate && hoveredEvents.length > 0 && (
        <EventTooltip date={hoveredDate} events={hoveredEvents} position={tooltipPos} />
      )}

      {/* Mobile panel */}
      {isMobileRef.current && mobileDate && mobilePanelEvents.length > 0 && (
        <EventTapPanel
          date={mobileDate}
          events={mobilePanelEvents}
          onClose={() => setMobileDate(null)}
        />
      )}
    </div>
  );
}
