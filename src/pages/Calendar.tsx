import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { CalendarHeader } from "@/components/calendar/CalendarHeader";
import { TaskChecklist } from "@/components/calendar/TaskChecklist";
import { EventForm } from "@/components/calendar/EventForm";
import { EventFilters } from "@/components/calendar/EventFilters";
import { EventAuditHistory } from "@/components/calendar/EventAuditHistory";
import { useAuth } from "@/contexts/AuthContext";
import {
  useCalendarEvents,
  useSchoolCalendar,
  useMyTasks,
  type CalendarEvent,
} from "@/hooks/useCalendar";
import { supabase } from "@/integrations/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Palmtree,
  Mic,
  ClipboardList,
  PartyPopper,
  GraduationCap,
  FileText,
  CalendarDays,
  Bell,
} from "lucide-react";

function getMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

const CAN_CREATE_ALL = new Set(["principal", "admin", "master_admin"]);
const CAN_CREATE_CLASS = new Set(["teacher"]);

const TABS = [
  { id: "events", label: "Events", icon: PartyPopper },
  { id: "holiday", label: "Holiday", icon: Palmtree },
  { id: "exam", label: "Exam/Test", icon: GraduationCap },
  { id: "task", label: "Task", icon: ClipboardList },
  { id: "homework", label: "Homework", icon: FileText },
  { id: "attendance", label: "Attendance", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Calendar() {
  const { user, school, role } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formOpen, setFormOpen] = useState(false);
  const [defaultEventType, setDefaultEventType] = useState("school_event");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("events");
  const [eventFilter, setEventFilter] = useState("all");
  const [selectedEventForHistory, setSelectedEventForHistory] = useState<string | null>(null);

  const { startDate, endDate } = useMemo(() => getMonthBounds(currentMonth), [currentMonth]);

  const academicYearId = school?.current_academic_year_id ?? "";

  const { data: calendarData, isLoading: calLoading } = useSchoolCalendar(school?.id ?? "", academicYearId);
  const workingDays: string[] = calendarData?.working_days ?? ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const { data: eventsData, isLoading: eventsLoading } = useCalendarEvents(
    school?.id ?? "",
    startDate,
    endDate
  );
  const events: CalendarEvent[] = eventsData?.data ?? [];

  // Filter events by tab and filter
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Filter by tab
    if (activeTab === "holiday") {
      filtered = filtered.filter((e) => e.event_type === "holiday" || e.event_type === "working_override");
    } else if (activeTab === "events") {
      filtered = filtered.filter(
        (e) => e.event_type === "school_event" || e.event_type === "class_event" || e.event_type === "staff_meeting"
      );
    } else if (activeTab === "exam") {
      filtered = filtered.filter((e) => e.event_type === "exam_timetable");
    } else if (activeTab === "task") {
      filtered = filtered.filter((e) => e.event_type === "staff_task");
    }

    // Filter by event filter
    const now = new Date().toISOString().split("T")[0];
    switch (eventFilter) {
      case "school-wide":
        filtered = filtered.filter((e) => e.scope === "all");
        break;
      case "department":
        filtered = filtered.filter((e) => e.scope === "department");
        break;
      case "wing":
        filtered = filtered.filter((e) => e.scope === "wing");
        break;
      case "class":
        filtered = filtered.filter((e) => e.scope === "class");
        break;
      case "upcoming":
        filtered = filtered.filter((e) => e.date >= now && !e.cancelled_at);
        break;
      case "ended":
        filtered = filtered.filter((e) => e.date < now || !!e.cancelled_at);
        break;
    }

    return filtered;
  }, [events, activeTab, eventFilter]);

  const { data: myTasksData } = useMyTasks(user?.id ?? "", school?.id ?? "", new Date().toISOString().split("T")[0]);
  const myTasks: CalendarEvent[] = myTasksData?.data ?? [];

  // Classes for scope selector
  const { data: classesData } = useQuery({
    queryKey: ["calendar", "classes", school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      const { data } = await supabase.from("classes").select("id, name").eq("school_id", school.id).order("display_order");
      return data ?? [];
    },
    enabled: !!school?.id,
  });

  // Wings for scope selector
  const { data: wingsData } = useQuery({
    queryKey: ["calendar", "wings", school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      const { data } = await supabase.from("wings").select("id, name").eq("school_id", school.id).order("display_order");
      return data ?? [];
    },
    enabled: !!school?.id,
  });

  // Staff for individual scope selector
  const { data: staffData } = useQuery({
    queryKey: ["calendar", "staff", school?.id],
    queryFn: async () => {
      if (!school?.id) return [];
      const { data } = await supabase.from("profiles").select("id, full_name").eq("school_id", school.id);
      return (data ?? []).map((p) => ({ id: p.id, full_name: p.full_name }));
    },
    enabled: !!school?.id && CAN_CREATE_ALL.has(role ?? ""),
  });

  const canCreateAll = CAN_CREATE_ALL.has(role ?? "");
  const canCreateClass = CAN_CREATE_CLASS.has(role ?? "");
  const isStudent = role === "student_parent";

  const openForm = (type: string) => {
    setEditingEvent(null);
    setDefaultEventType(type);
    setFormOpen(true);
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setSelectedEventForHistory(event.id);
    setFormOpen(true);
  };

  const handlePrevMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const calendarId = calendarData?.id ?? "";

  // Get default event type for current tab
  const getDefaultEventTypeForTab = (tab: TabId) => {
    switch (tab) {
      case "holiday":
        return "holiday";
      case "events":
        return "school_event";
      case "exam":
        return "exam_timetable";
      case "task":
        return "staff_task";
      default:
        return "school_event";
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page header */}
        <div className="clay-page-header">
          <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Calendar
          </h1>
          <p className="text-muted-foreground text-sm">
            {isStudent
              ? "School events, holidays, and exam schedule"
              : "Manage holidays, events, meetings, and tasks"}
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer",
                  isActive
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main calendar area */}
          <div className="flex-1 space-y-4">
            {/* Events tab: show filters + header */}
            {activeTab === "events" && (
              <>
                <EventFilters
                  currentFilter={eventFilter}
                  onFilterChange={setEventFilter}
                  events={events}
                />
                <CalendarHeader
                  currentMonth={currentMonth}
                  onPrevMonth={handlePrevMonth}
                  onNextMonth={handleNextMonth}
                  onDeclareHoliday={() => openForm("holiday")}
                  onScheduleMeeting={() => openForm("staff_meeting")}
                  onAssignTask={() => openForm("staff_task")}
                  onAnnounceEvent={() => openForm(canCreateAll ? "school_event" : "class_event")}
                  canCreateAll={canCreateAll}
                  canCreateClass={canCreateClass}
                />
              </>
            )}

            {/* Other tabs: show only header */}
            {activeTab !== "events" && (
              <CalendarHeader
                currentMonth={currentMonth}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onDeclareHoliday={() => openForm("holiday")}
                onScheduleMeeting={() => openForm("staff_meeting")}
                onAssignTask={() => openForm("staff_task")}
                onAnnounceEvent={() => openForm(getDefaultEventTypeForTab(activeTab))}
                canCreateAll={canCreateAll}
                canCreateClass={canCreateClass}
              />
            )}

            {eventsLoading || calLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-4 shadow-clay">
                <CalendarGrid
                  events={filteredEvents}
                  workingDays={workingDays}
                  onMonthChange={setCurrentMonth}
                  onDateClick={handleEdit}
                />
              </div>
            )}

            {/* Placeholder for other tabs */}
            {activeTab === "attendance" && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-clay">
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-base font-medium mb-1">Attendance Analytics</p>
                  <p className="text-sm">Coming soon — view attendance trends by class, wing, or student.</p>
                </div>
              </div>
            )}
            {activeTab === "homework" && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Homework calendar will be integrated here</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-4">
            {/* Task sidebar — teachers and principal/admin */}
            {(canCreateAll || canCreateClass) && activeTab !== "task" && (
              <>
                {/* Mobile: sheet trigger */}
                <div className="lg:hidden mb-2">
                  <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="clay-btn w-full cursor-pointer">
                        My Tasks
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-80">
                      <SheetHeader>
                        <SheetTitle className="font-bold">My Tasks</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-clay">
                        <TaskChecklist tasks={myTasks} staffId={user?.id ?? ""} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                {/* Desktop: inline sidebar */}
                <div className="hidden lg:block rounded-xl border border-border bg-card p-4 shadow-clay">
                  <TaskChecklist tasks={myTasks} staffId={user?.id ?? ""} />
                </div>
              </>
            )}

            {/* Task tab: full task view */}
            {activeTab === "task" && (
              <div className="rounded-xl border border-border bg-card p-4 shadow-clay">
                <TaskChecklist tasks={myTasks} staffId={user?.id ?? ""} />
              </div>
            )}

            {/* Event audit history (shown when event is selected) */}
            {activeTab === "events" && selectedEventForHistory && (
              <div className="rounded-xl border border-border bg-card p-4 shadow-clay">
                <EventAuditHistory eventId={selectedEventForHistory} />
              </div>
            )}
          </div>
        </div>

        {/* Event form dialog */}
        <EventForm
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) {
              setEditingEvent(null);
              setSelectedEventForHistory(null);
            }
          }}
          defaultEventType={defaultEventType}
          editEvent={editingEvent}
          schoolId={school?.id ?? ""}
          calendarId={calendarId}
          wings={wingsData ?? []}
          classes={classesData ?? []}
          staff={staffData ?? []}
          academicYearId={academicYearId}
          onSuccess={() => setSelectedEventForHistory(editingEvent?.id ?? null)}
        />
      </div>
    </AppShell>
  );
}