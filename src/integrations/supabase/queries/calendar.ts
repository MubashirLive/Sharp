import { supabase } from "@/integrations/supabase";
import type { Database } from "@/integrations/supabase/types";

export type EventType = Database["public"]["Tables"]["calendar_events"]["Row"];
export type SchoolCalendar = Database["public"]["Tables"]["school_calendar"]["Row"];
export type ClassSessionDates = Database["public"]["Tables"]["class_session_dates"]["Row"];
export type TaskCompletion = Database["public"]["Tables"]["event_task_completions"]["Row"];
export type NationalHoliday = Database["public"]["Tables"]["national_holidays"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type EventHistory = Database["public"]["Tables"]["event_history"]["Row"];

// ─── School Calendar ────────────────────────────────────────────────────────────

export async function getSchoolCalendar(schoolId: string, academicYearId: string) {
  return supabase
    .from("school_calendar")
    .select("id, school_id, academic_year_id, working_days, created_by")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .maybeSingle();
}

export async function upsertSchoolCalendar(
  schoolId: string,
  academicYearId: string,
  workingDays: string[],
  userId: string
) {
  return supabase
    .from("school_calendar")
    .upsert(
      { school_id: schoolId, academic_year_id: academicYearId, working_days: workingDays, created_by: userId },
      { onConflict: "school_id,academic_year_id" }
    )
    .select()
    .single();
}

// ─── Calendar Events ────────────────────────────────────────────────────────────

export async function getCalendarEvents(schoolId: string, startDate: string, endDate: string) {
  return supabase
    .from("calendar_events")
    .select("*, declared_by_profile:profiles!declared_by(full_name)")
    .eq("school_id", schoolId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");
}

export async function createCalendarEvent(payload: {
  schoolId: string;
  calendarId: string;
  date: string;
  endDate?: string;
  specificDates?: string[];
  eventType: string;
  title: string;
  detail?: string;
  scope: string;
  scopeIds?: string[];
  includeStudents?: boolean;
  attachmentUrls?: string[];
  isHalfDay?: boolean;
  halfDayFraction?: string;
  notify?: boolean;
  notifyAt?: string;
  scheduledPublishAt?: string;
  examId?: string;
  declaredBy: string;
}) {
  return supabase
    .from("calendar_events")
    .insert({
      school_id: payload.schoolId,
      calendar_id: payload.calendarId,
      date: payload.date,
      end_date: payload.endDate ?? null,
      specific_dates: payload.specificDates ?? null,
      event_type: payload.eventType,
      title: payload.title,
      detail: payload.detail ?? null,
      scope: payload.scope,
      scope_ids: payload.scopeIds ?? null,
      include_students: payload.includeStudents ?? true,
      attachment_urls: payload.attachmentUrls ?? null,
      is_half_day: payload.isHalfDay ?? false,
      half_day_fraction: payload.halfDayFraction ?? null,
      notify: payload.notify ?? true,
      notify_at: payload.notifyAt ?? null,
      scheduled_publish_at: payload.scheduledPublishAt ?? null,
      published_at: payload.scheduledPublishAt ? null : new Date().toISOString(),
      exam_id: payload.examId ?? null,
      declared_by: payload.declaredBy,
    })
    .select()
    .single();
}

export async function updateCalendarEvent(
  id: string,
  payload: Partial<{
    date: string;
    endDate: string;
    specificDates: string[];
    eventType: string;
    title: string;
    detail: string;
    scope: string;
    scopeIds: string[];
    includeStudents: boolean;
    attachmentUrls: string[];
    isHalfDay: boolean;
    halfDayFraction: string;
    notify: boolean;
    notifyAt: string;
    scheduledPublishAt: string;
    examId: string;
  }>
) {
  return supabase
    .from("calendar_events")
    .update({
      date: payload.date,
      end_date: payload.endDate,
      specific_dates: payload.specificDates,
      event_type: payload.eventType,
      title: payload.title,
      detail: payload.detail,
      scope: payload.scope,
      scope_ids: payload.scopeIds,
      include_students: payload.includeStudents,
      attachment_urls: payload.attachmentUrls,
      is_half_day: payload.isHalfDay,
      half_day_fraction: payload.halfDayFraction,
      notify: payload.notify,
      notify_at: payload.notifyAt,
      scheduled_publish_at: payload.scheduledPublishAt,
      exam_id: payload.examId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
}

export async function cancelCalendarEvent(id: string, cancelledBy: string) {
  return supabase
    .from("calendar_events")
    .update({
      cancelled_at: new Date().toISOString(),
      cancelled_by: cancelledBy,
    })
    .eq("id", id)
    .select()
    .single();
}

export async function deleteCalendarEvent(id: string) {
  return supabase.from("calendar_events").delete().eq("id", id);
}

// ─── Class Session Dates ───────────────────────────────────────────────────────

export async function getClassSessionDates(schoolId: string, academicYearId: string) {
  return supabase
    .from("class_session_dates")
    .select("*, class:class(name)")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);
}

export async function upsertClassSessionDates(
  records: Array<{
    schoolId: string;
    academicYearId: string;
    classId: string;
    startDate: string;
    endDate: string;
    userId: string;
  }>
) {
  return supabase
    .from("class_session_dates")
    .upsert(
      records.map((r) => ({
        school_id: r.schoolId,
        academic_year_id: r.academicYearId,
        class_id: r.classId,
        start_date: r.startDate,
        end_date: r.endDate,
        created_by: r.userId,
      })),
      { onConflict: "school_id,academic_year_id,class_id" }
    )
    .select();
}

// ─── National Holidays ────────────────────────────────────────────────────────
// Runtime reference — NOT copied per school. Attendance gate reads directly.

export async function getNationalHolidays(country = "India", state?: string) {
  let q = supabase
    .from("national_holidays")
    .select("id, date, title, country, state")
    .eq("country", country)
    .order("date")
    .limit(100); // Cap for performance
  if (state) q = q.or(`state.is.null,state.eq.${state}`);
  return q;
}

// ─── Event Task Completions ────────────────────────────────────────────────────

export async function getTaskCompletions(eventId: string) {
  return supabase
    .from("event_task_completions")
    .select("*, staff:profiles!staff_id(full_name)")
    .eq("event_id", eventId);
}

export async function upsertTaskCompletion(eventId: string, staffId: string, done: boolean) {
  return supabase
    .from("event_task_completions")
    .upsert(
      { event_id: eventId, staff_id: staffId, done, done_at: done ? new Date().toISOString() : null },
      { onConflict: "event_id,staff_id" }
    )
    .select()
    .single();
}

// ─── Staff tasks for sidebar ────────────────────────────────────────────────────

export async function getMyTasks(staffId: string, schoolId: string, upToDate: string) {
  return supabase
    .from("calendar_events")
    .select("id, date, event_type, title, detail, scope, scope_ids, is_half_day, declared_by, task_completions(event_id, staff_id, done)")
    .eq("school_id", schoolId)
    .eq("event_type", "staff_task")
    .lte("date", upToDate)
    .contains("scope_ids", [staffId])
    .order("date", { ascending: false })
    .limit(100); // Cap for performance
}

// ─── Departments ───────────────────────────────────────────────────────────────

export async function getDepartments(schoolId: string) {
  return supabase
    .from("departments")
    .select("id, name, code, school_id, created_at")
    .eq("school_id", schoolId)
    .order("name");
}

export async function createDepartment(schoolId: string, name: string, code?: string) {
  return supabase
    .from("departments")
    .insert({ school_id: schoolId, name, code: code ?? null })
    .select()
    .single();
}

// ─── Event History (Audit Trail) ───────────────────────────────────────────────

export async function getEventHistory(eventId: string) {
  return supabase
    .from("event_history")
    .select("*, actor:profiles!actor_id(full_name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
}

export async function createEventHistory(payload: {
  eventId: string;
  action: "created" | "edited" | "cancelled" | "broadcast_sent";
  actorId: string;
  changedFields?: Record<string, { old: unknown; new: unknown }>;
  broadcastMessageId?: string;
}) {
  return supabase
    .from("event_history")
    .insert({
      event_id: payload.eventId,
      action: payload.action,
      actor_id: payload.actorId,
      changed_fields: payload.changedFields ?? null,
      broadcast_message_id: payload.broadcastMessageId ?? null,
    })
    .select()
    .single();
}

// ─── Event Attachments ──────────────────────────────────────────────────────────

export async function uploadEventAttachment(
  file: File,
  schoolId: string,
  eventId: string
): Promise<{ url: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${schoolId}/events/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("event-attachments")
    .upload(path, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from("event-attachments")
    .createSignedUrl(path, 3600 * 24 * 7); // 7 day expiry

  if (!urlData?.signedUrl) throw new Error("Failed to get signed URL");
  return { url: urlData.signedUrl };
}

export async function deleteEventAttachment(url: string) {
  // Extract path from signed URL
  const urlObj = new URL(url);
  const path = urlObj.pathname.split("/event-attachments/")[1]?.split("?")[0];
  if (!path) return { error: "Invalid URL" };
  return supabase.storage.from("event-attachments").remove([path]);
}
