import { ChevronLeft, ChevronRight, Palmtree, Mic, ClipboardList, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarHeaderProps {
  onDeclareHoliday: () => void;
  onScheduleMeeting: () => void;
  onAssignTask: () => void;
  onAnnounceEvent: () => void;
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  canCreateAll?: boolean;   // principal/admin/master_admin
  canCreateClass?: boolean; // teacher
}

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });

export function CalendarHeader({
  onDeclareHoliday,
  onScheduleMeeting,
  onAssignTask,
  onAnnounceEvent,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  canCreateAll = false,
  canCreateClass = false,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevMonth}
          className="clay-btn p-2 cursor-pointer transition-all"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <h2 className="text-xl font-bold font-mono tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent min-w-[180px] text-center">
          {MONTH_FORMAT.format(currentMonth)}
        </h2>
        <button
          onClick={onNextMonth}
          className="clay-btn p-2 cursor-pointer transition-all"
          aria-label="Next month"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      </div>

      {/* Action buttons */}
      {(canCreateAll || canCreateClass) && (
        <div className="flex flex-wrap gap-2">
          {canCreateAll && (
            <>
              <button
                onClick={onDeclareHoliday}
                className="clay-btn !bg-red-50 !text-red-600 dark:!bg-red-950/50 dark:!text-red-300 hover:!bg-red-100 dark:hover:!bg-red-900 gap-1.5 text-sm font-medium px-3 py-2 flex items-center border border-red-200 dark:border-red-800 cursor-pointer"
              >
                <Palmtree className="h-4 w-4" />
                Declare Holiday
              </button>
              <button
                onClick={onScheduleMeeting}
                className="clay-btn gap-1.5 text-sm font-medium px-3 py-2 flex items-center border border-border cursor-pointer"
              >
                <Mic className="h-4 w-4" />
                Schedule Meeting
              </button>
              <button
                onClick={onAssignTask}
                className="clay-btn gap-1.5 text-sm font-medium px-3 py-2 flex items-center border border-border cursor-pointer"
              >
                <ClipboardList className="h-4 w-4" />
                Assign Task
              </button>
              <button
                onClick={onAnnounceEvent}
                className="clay-btn !bg-primary !text-primary-foreground gap-1.5 text-sm font-medium px-3 py-2 flex items-center shadow-sm border border-primary/20 cursor-pointer"
              >
                <PartyPopper className="h-4 w-4" />
                Announce Event
              </button>
            </>
          )}
          {canCreateClass && !canCreateAll && (
            <button
              onClick={onAnnounceEvent}
              className="clay-btn !bg-primary !text-primary-foreground gap-1.5 text-sm font-medium px-3 py-2 flex items-center shadow-sm border border-primary/20 cursor-pointer"
            >
              <PartyPopper className="h-4 w-4" />
              Announce Class Event
            </button>
          )}
        </div>
      )}
    </div>
  );
}