import { z } from "zod";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getCalendarEvents,
  getSchoolCalendar,
  getClassSessionDates,
  getTaskCompletions,
  getMyTasks,
  getNationalHolidays,
  getDepartments,
  getEventHistory,
  createCalendarEvent,
  updateCalendarEvent,
  cancelCalendarEvent,
  deleteCalendarEvent,
  upsertTaskCompletion,
  upsertSchoolCalendar,
  upsertClassSessionDates,
  createEventHistory,
} from "@/integrations/supabase/queries/calendar";
import { canMarkAttendance } from "@/integrations/supabase/queries/attendanceGate";

// ─── Query Keys ────────────────────────────────────────────────────────────────

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (schoolId: string, startDate: string, endDate: string) =>
    ["calendar", "events", schoolId, startDate, endDate] as const,
  schoolCalendar: (schoolId: string, academicYearId: string) =>
    ["calendar", "schoolCalendar", schoolId, academicYearId] as const,
  classSessionDates: (schoolId: string, academicYearId: string) =>
    ["calendar", "classSessionDates", schoolId, academicYearId] as const,
  taskCompletions: (eventId: string) =>
    ["calendar", "taskCompletions", eventId] as const,
  myTasks: (staffId: string, schoolId: string) =>
    ["calendar", "myTasks", staffId, schoolId] as const,
  attendanceGate: (classId: string, date: string) =>
    ["calendar", "attendanceGate", classId, date] as const,
  nationalHolidays: (country: string, state?: string) =>
    ["calendar", "nationalHolidays", country, state ?? "all"] as const,
  departments: (schoolId: string) =>
    ["calendar", "departments", schoolId] as const,
  eventHistory: (eventId: string) =>
    ["calendar", "eventHistory", eventId] as const,
};

// ─── Calendar Events ──────────────────────────────────────────────────────────

export function useCalendarEvents(schoolId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: calendarKeys.events(schoolId, startDate, endDate),
    queryFn: () => getCalendarEvents(schoolId, startDate, endDate),
    enabled: !!schoolId && !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── School Calendar ──────────────────────────────────────────────────────────

export function useSchoolCalendar(schoolId: string, academicYearId: string) {
  return useQuery({
    queryKey: calendarKeys.schoolCalendar(schoolId, academicYearId),
    queryFn: () => getSchoolCalendar(schoolId, academicYearId),
    enabled: !!schoolId && !!academicYearId,
    staleTime: Infinity,
  });
}

export function useUpsertSchoolCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: { schoolId: string; academicYearId: string; workingDays: string[]; userId: string }) =>
      upsertSchoolCalendar(opts.schoolId, opts.academicYearId, opts.workingDays, opts.userId),
    onSuccess: (_, { schoolId, academicYearId }) => {
      qc.invalidateQueries({ queryKey: calendarKeys.schoolCalendar(schoolId, academicYearId) });
    },
  });
}

// ─── Class Session Dates ──────────────────────────────────────────────────────

export function useClassSessionDates(schoolId: string, academicYearId: string) {
  return useQuery({
    queryKey: calendarKeys.classSessionDates(schoolId, academicYearId),
    queryFn: () => getClassSessionDates(schoolId, academicYearId),
    enabled: !!schoolId && !!academicYearId,
    staleTime: Infinity,
  });
}

export function useUpsertClassSessionDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: { schoolId: string; academicYearId: string; records: Array<{
      schoolId: string; academicYearId: string; classId: string; startDate: string; endDate: string; userId: string
    }> }) =>
      upsertClassSessionDates(opts.records),
    onSuccess: (_, { schoolId, academicYearId }) => {
      qc.invalidateQueries({ queryKey: calendarKeys.classSessionDates(schoolId, academicYearId) });
    },
  });
}

// ─── Create / Update / Delete Events ─────────────────────────────────────────

export function useCreateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useUpdateCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateCalendarEvent>[1] }) =>
      updateCalendarEvent(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

export function useDeleteCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

// ─── Task Completions ─────────────────────────────────────────────────────────

export function useTaskCompletions(eventId: string) {
  return useQuery({
    queryKey: calendarKeys.taskCompletions(eventId),
    queryFn: () => getTaskCompletions(eventId),
    enabled: !!eventId,
  });
}

export function useUpsertTaskCompletion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, staffId, done }: { eventId: string; staffId: string; done: boolean }) =>
      upsertTaskCompletion(eventId, staffId, done),
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: calendarKeys.taskCompletions(eventId) });
      qc.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

// ─── My Tasks (teacher sidebar) ───────────────────────────────────────────────

export function useMyTasks(staffId: string, schoolId: string, today: string) {
  return useQuery({
    queryKey: calendarKeys.myTasks(staffId, schoolId),
    queryFn: () => getMyTasks(staffId, schoolId, today),
    enabled: !!staffId && !!schoolId,
  });
}

// ─── National Holidays ───────────────────────────────────────────────────────

export function useNationalHolidays(country = "India", state?: string) {
  return useQuery({
    queryKey: calendarKeys.nationalHolidays(country, state),
    queryFn: () => getNationalHolidays(country, state),
    staleTime: Infinity,
  });
}

// ─── Departments ─────────────────────────────────────────────────────────────

export function useDepartments(schoolId: string) {
  return useQuery({
    queryKey: calendarKeys.departments(schoolId),
    queryFn: () => getDepartments(schoolId),
    enabled: !!schoolId,
  });
}

// ─── Event History (Audit Trail) ────────────────────────────────────────────

export function useEventHistory(eventId: string) {
  return useQuery({
    queryKey: calendarKeys.eventHistory(eventId),
    queryFn: () => getEventHistory(eventId),
    enabled: !!eventId,
  });
}

export function useCreateEventHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createEventHistory,
    onSuccess: (_, { eventId }) => {
      qc.invalidateQueries({ queryKey: calendarKeys.eventHistory(eventId) });
    },
  });
}

// ─── Cancel Event (soft delete) ──────────────────────────────────────────────

export function useCancelCalendarEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancelledBy }: { id: string; cancelledBy: string }) =>
      cancelCalendarEvent(id, cancelledBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
}

// ─── Attendance Gate ──────────────────────────────────────────────────────────

export function useAttendanceGate(classId: string, date: string) {
  return useQuery({
    queryKey: calendarKeys.attendanceGate(classId, date),
    queryFn: () => canMarkAttendance(classId, date),
    enabled: !!classId && !!date,
    staleTime: 0,
  });
}

// ─── Shared Calendar Types ────────────────────────────────────────────────────

export type CalendarEvent = {
  id: string;
  school_id: string;
  calendar_id: string;
  date: string;
  end_date: string | null;
  specific_dates: string[] | null;
  event_type: string;
  title: string;
  detail: string | null;
  scope: string;
  scope_ids: string[] | null;
  include_students: boolean;
  attachment_urls: string[] | null;
  published_at: string | null;
  scheduled_publish_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  is_half_day: boolean;
  half_day_fraction: string | null;
  notify: boolean;
  notify_at: string | null;
  exam_id: string | null;
  declared_by: string;
  created_at: string;
  updated_at: string;
  declared_by_profile?: { full_name: string | null };
};

export const eventTypeOptions = [
  { value: "holiday", label: "Holiday" },
  { value: "working_override", label: "Working Day" },
  { value: "school_event", label: "School Event" },
  { value: "class_event", label: "Class Event" },
  { value: "staff_meeting", label: "Staff Meeting" },
  { value: "staff_task", label: "Staff Task" },
  { value: "exam_timetable", label: "Exam Timetable" },
] as const;

export const dateTypeOptions = [
  { value: "one_day", label: "One Day" },
  { value: "multi_day", label: "Multi-Day" },
  { value: "selected_days", label: "Selected Days" },
] as const;

export const scopeOptions = [
  { value: "all", label: "Entire School" },
  { value: "students", label: "Students Only" },
  { value: "staff", label: "Staff Only" },
  { value: "wing", label: "By Wing" },
  { value: "class", label: "By Class" },
  { value: "department", label: "By Department" },
  { value: "individual", label: "Individual" },
] as const;

export const halfDayFractions = [
  { value: "0.5", label: "Half Day (0.5)" },
  { value: "0.25", label: "Quarter Day (0.25)" },
  { value: "0.125", label: "Eighth Day (0.125)" },
  { value: "0.75", label: "Three-Quarter Day (0.75)" },
] as const;

export const eventFilterOptions = [
  { value: "all", label: "All Events" },
  { value: "school-wide", label: "School-wide" },
  { value: "department", label: "Department" },
  { value: "wing", label: "Wing" },
  { value: "class", label: "Class" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ended", label: "Ended" },
] as const;

// ─── Zod Schema for Event Form ───────────────────────────────────────────────

export const calendarEventSchema = z.object({
  dateType: z.enum(dateTypeOptions.map((o) => o.value) as [string, ...string[]], {
    required_error: "Date type is required",
  }),
  date: z.string().min(1, "Date is required"),
  endDate: z.string().optional(),
  specificDates: z.array(z.string()).optional(),
  eventType: z.enum(eventTypeOptions.map((o) => o.value) as [string, ...string[]], {
    required_error: "Event type is required",
  }),
  title: z.string().trim().min(1, "Title is required").max(200),
  detail: z.string().optional(),
  scope: z.enum(scopeOptions.map((o) => o.value) as [string, ...string[]], {
    required_error: "Scope is required",
  }),
  scopeIds: z.array(z.string()).optional(),
  includeStudents: z.boolean().optional(),
  isHalfDay: z.boolean().optional(),
  halfDayFraction: z.string().optional(),
  notify: z.boolean().optional(),
  notifyAt: z.string().optional(),
  scheduledPublishAt: z.string().optional(),
  examId: z.string().optional(),
}).refine((data) => {
  if (data.dateType === "multi_day" && !data.endDate) {
    return false;
  }
  return true;
}, {
  message: "End date is required for multi-day events",
  path: ["endDate"],
}).refine((data) => {
  if (data.dateType === "selected_days" && (!data.specificDates || data.specificDates.length === 0)) {
    return false;
  }
  return true;
}, {
  message: "At least one date must be selected for selected days",
  path: ["specificDates"],
});

export type CalendarEventFormData = z.infer<typeof calendarEventSchema>;
