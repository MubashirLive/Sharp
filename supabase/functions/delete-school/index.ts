import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify superadmin
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (profile?.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Forbidden — superadmin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const schoolId: string | undefined = body?.schoolId;

    if (!schoolId) {
      return new Response(JSON.stringify({ error: "schoolId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get school info for audit log
    const { data: school } = await admin.from("schools").select("id, name, slug").eq("id", schoolId).single();
    if (!school) {
      return new Response(JSON.stringify({ error: "School not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auditLog: string[] = [];

    // Step 1: Get all profile emails for this school (to delete auth users)
    const { data: profiles } = await admin
      .from("profiles")
      .select("user_id, email")
      .eq("school_id", schoolId);

    const emails = (profiles ?? []).map((p) => p.email).filter(Boolean);
    const userIds = (profiles ?? []).map((p) => p.user_id).filter(Boolean);

    // Step 2: Delete auth users by email
    const authClient = createClient(SUPABASE_URL, SERVICE_KEY);
    if (emails.length > 0) {
      for (const email of emails) {
        try {
          const { data: authUsers } = await authClient.auth.admin.listUsers();
          const user = authUsers.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
          if (user) {
            await authClient.auth.admin.deleteUser(user.id);
            auditLog.push(`Deleted auth user: ${email}`);
          }
        } catch (e) {
          console.error(`Failed to delete auth user ${email}:`, e);
        }
      }
    }

    // Step 3: Delete in correct order (child tables first, then parents)
    // These handle their own cascades (sections → classes, class_teachers → classes, etc.)
    const tablesToDelete = [
      // event_history and event_task_completions cascade from calendar_events
      ["calendar_events", "school_id"],
      ["class_teachers", "school_id"],
      ["class_session_dates", "school_id"],
      ["school_calendar", "school_id"],
      ["school_subjects", "school_id"],
      ["section_subjects", "school_id"],
      ["session_audit_log", "school_id"],
      ["subject_teachers", "school_id"],
      ["wings", "school_id"],
      ["students", "school_id"],
      ["staffs", "school_id"],
      // sections cascade from classes
      ["sections", "school_id"],
      ["classes", "school_id"],
      // departments cascade to departments_audit_log
      ["departments", "school_id"],
      // subjects before school_subjects (already deleted above but for clarity)
      ["subjects", "school_id"],
      // Standalone school_id tables
      ["academic_sessions", "school_id"],
      ["pending_principals", "school_id"],
      ["sessions", "school_id"],
      // Profiles after auth users deleted
      ["profiles", "school_id"],
    ];

    for (const [table, column] of tablesToDelete) {
      const { error } = await admin.from(table).delete().eq(column, schoolId);
      if (error) {
        console.error(`Failed to delete ${table}:`, error);
        auditLog.push(`Failed to delete ${table}: ${error.message}`);
      } else {
        auditLog.push(`Deleted all from ${table}`);
      }
    }

    // Step 4: Delete storage buckets and objects for this school
    const { data: buckets } = await admin.storage.listBuckets();
    const schoolBuckets = (buckets ?? []).filter(
      (b) => b.name.includes(school.slug) || b.name.includes(school.id)
    );

    for (const bucket of schoolBuckets) {
      // Delete all objects in bucket
      const { files } = await admin.storage.from(bucket.name).list();
      if (files && files.length > 0) {
        const paths = files.map((f) => f.name);
        await admin.storage.from(bucket.name).remove(paths);
      }
      await admin.storage.deleteBucket(bucket.name);
      auditLog.push(`Deleted storage bucket: ${bucket.name}`);
    }

    // Step 5: Delete the school last
    const { error: schoolErr } = await admin.from("schools").delete().eq("id", schoolId);
    if (schoolErr) {
      return new Response(JSON.stringify({ error: `Failed to delete school: ${schoolErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    auditLog.push("Deleted school record");

    // Step 6: Create audit log entry
    await admin.from("audit_log").insert({
      actor_id: userData.user.id,
      action: "school_deleted",
      entity_type: "school",
      entity_id: schoolId,
      details: { school_name: school.name, school_slug: school.slug, cleanup_summary: auditLog },
    });

    return new Response(
      JSON.stringify({
        success: true,
        schoolId,
        schoolName: school.name,
        cleanupSummary: auditLog,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});