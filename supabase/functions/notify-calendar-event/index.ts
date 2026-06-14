import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CalendarEventPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: {
    id: string;
    school_id: string;
    calendar_id: string;
    date: string;
    event_type: string;
    title: string;
    detail: string | null;
    scope: string;
    scope_ids: string[] | null;
    notify: boolean;
    notify_at: string | null;
    declared_by: string;
  };
  old_record: null | Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Parse webhook payload
    const payload: CalendarEventPayload = await req.json();

    // Only handle INSERT for now
    if (payload.type !== "INSERT") {
      return new Response(JSON.stringify({ skipped: "not an insert" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = payload.record;

    // Skip if notifications disabled
    if (!event.notify) {
      return new Response(JSON.stringify({ skipped: "notify=false" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip if scheduled for later
    if (event.notify_at && new Date(event.notify_at) > new Date()) {
      return new Response(JSON.stringify({ skipped: "scheduled for later" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Build recipient list based on scope + scope_ids
    const recipients: string[] = [];

    if (event.scope === "all") {
      // All school staff + students
      const { data: staff } = await admin
        .from("profiles")
        .select("user_id")
        .eq("school_id", event.school_id);
      recipients.push(...(staff ?? []).map((s: any) => s.user_id));

    } else if (event.scope === "students") {
      const { data: students } = await admin
        .from("profiles")
        .select("user_id")
        .eq("school_id", event.school_id)
        .eq("role", "student_parent");
      recipients.push(...(students ?? []).map((s: any) => s.user_id));

    } else if (event.scope === "staff") {
      const { data: staff } = await admin
        .from("profiles")
        .select("user_id")
        .in("role", ["teacher", "admin", "master_admin"])
        .eq("school_id", event.school_id);
      recipients.push(...(staff ?? []).map((s: any) => s.user_id));

    } else if (event.scope === "class" && event.scope_ids) {
      const { data: students } = await admin
        .from("profiles")
        .select("user_id")
        .eq("school_id", event.school_id)
        .eq("role", "student_parent");
      recipients.push(...(students ?? []).map((s: any) => s.user_id));

    } else if (event.scope === "individual" && event.scope_ids) {
      recipients.push(...event.scope_ids);

    } else if (event.scope === "wing" && event.scope_ids) {
      // Wings stored in school.wings — fetch wing members
      // For now, treat wing scope as all school members
      const { data: staff } = await admin
        .from("profiles")
        .select("user_id")
        .eq("school_id", event.school_id);
      recipients.push(...(staff ?? []).map((s: any) => s.user_id));
    }

    // Deduplicate
    const uniqueRecipients = [...new Set(recipients)];

    // Build notification content
    const eventDate = new Date(event.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });

    const notifTitle = event.event_type === "holiday"
      ? `Holiday: ${event.title}`
      : event.event_type === "working_override"
      ? `Working Day: ${event.title}`
      : `Event: ${event.title}`;

    const notifBody = event.detail
      ? `${event.detail} — ${eventDate}`
      : eventDate;

    // Insert notifications for each recipient
    if (uniqueRecipients.length > 0) {
      const notifRecords = uniqueRecipients.map((uid) => ({
        user_id: uid,
        school_id: event.school_id,
        title: notifTitle,
        body: notifBody,
        is_read: false,
      }));

      const { error: notifErr } = await admin
        .from("notifications")
        .insert(notifRecords);

      if (notifErr) {
        console.error("Failed to insert notifications:", notifErr);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      notified: uniqueRecipients.length,
      event_id: event.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("notify-calendar-event error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
