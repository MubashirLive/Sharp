// Supabase Edge Function: check-staff-deletion-eligibility
// Blocks deletion if user is:
// - Sole coordinator of any wing
// - Sole incharge of any department
// - Class teacher of any section
// - Member of any house (House Incharge / House Master)
//
// Also performs caller validation:
// - Caller must be principal/master_admin/superadmin in same school
// - Caller cannot delete their own account

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Generate idempotency key for requests
function generateIdempotencyKey(req: Request): string {
  return crypto.randomUUID();
}

// Check if request has idempotency key
function getIdempotencyKey(req: Request): string | null {
  return req.headers.get("x-idempotency-key");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  // Idempotency key handling
  const idempotencyKey = getIdempotencyKey(req);
  if (req.method === "POST" && !idempotencyKey) {
    return jsonResponse({ success: false, error: "x-idempotency-key header required" }, 400);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── Caller auth ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) return jsonResponse({ success: false, error: "Missing Authorization header" }, 401);
    const { data: userResult, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userResult?.user) {
      return jsonResponse({ success: false, error: `Invalid JWT: ${userErr?.message ?? "no user"}` }, 401);
    }
    const callerUserId = userResult.user.id;

    const body = await req.json();
    const staff_id: string | undefined = body.staff_id;
    if (!staff_id) return jsonResponse({ success: false, error: "staff_id required" }, 400);

    // ── Self-delete guard ────────────────────────────────────────────────
    if (callerUserId === staff_id) {
      return jsonResponse({
        eligible: false,
        reason: "You cannot delete your own account from this screen. Ask another principal/admin to do it.",
        blocked_items: [{ type: "self", name: "self" }],
      }, 400);
    }

    // ── Look up staff to verify same school ───────────────────────────────
    const { data: staffProfile, error: staffErr } = await admin
      .from("staff_profiles")
      .select("profile_id, school_id")
      .eq("profile_id", staff_id)
      .maybeSingle();
    if (staffErr) return jsonResponse({ success: false, error: staffErr.message }, 500);
    if (!staffProfile) {
      return jsonResponse({ eligible: false, reason: "Staff not found or already deleted.", blocked_items: [] }, 404);
    }

    const { data: callerProfile, error: callerErr } = await admin
      .from("profiles")
      .select("id, role, status, school_id")
      .eq("id", callerUserId)
      .single();
    if (callerErr || !callerProfile) {
      return jsonResponse({ success: false, error: "Caller profile not found" }, 401);
    }
    if (callerProfile.status !== "active" || !["principal", "master_admin", "superadmin", "admin"].includes(callerProfile.role)) {
      return jsonResponse({ success: false, error: "Forbidden: not authorized to delete staff" }, 403);
    }
    if (callerProfile.role !== "superadmin" && callerProfile.school_id !== staffProfile.school_id) {
      return jsonResponse({ success: false, error: "Forbidden: staff belongs to a different school" }, 403);
    }

    const blockedItems: { type: "wing" | "department" | "class_teacher" | "house"; name: string }[] = [];

    // ── Check 1: Class Teacher ───────────────────────────────────────────
    const { data: classTeacherEntries } = await admin
      .from("class_teachers")
      .select("id, class_id, section_id, classes(name), sections(name)")
      .eq("staff_profile_id", staff_id)
      .eq("school_id", staffProfile.school_id);
    if (classTeacherEntries && classTeacherEntries.length > 0) {
      for (const ct of classTeacherEntries as any[]) {
        const className = ct.classes?.name ?? "Class";
        const sectionName = ct.sections?.name ?? "Section";
        blockedItems.push({ type: "class_teacher", name: `${className} – ${sectionName}` });
      }
    }

    // ── Check 2: Sole wing coordinator ───────────────────────────────────
    const { data: coordinatorEntries } = await admin
      .from("wings_coordinators")
      .select("wing_id, wings(name)")
      .eq("staff_id", staff_id);
    if (coordinatorEntries && coordinatorEntries.length > 0) {
      for (const entry of coordinatorEntries as any[]) {
        const { count } = await admin
          .from("wings_coordinators")
          .select("id", { count: "exact", head: true })
          .eq("wing_id", entry.wing_id);
        if ((count ?? 0) <= 1) {
          const wingName = entry.wings?.name;
          if (wingName) blockedItems.push({ type: "wing", name: wingName });
        }
      }
    }

    // ── Check 3: Sole department incharge ────────────────────────────────
    const { data: deptEntries } = await admin
      .from("department_incharges")
      .select("department_id, departments(name)")
      .eq("staff_profile_id", staff_id);
    if (deptEntries && deptEntries.length > 0) {
      for (const entry of deptEntries as any[]) {
        const { count } = await admin
          .from("department_incharges")
          .select("id", { count: "exact", head: true })
          .eq("department_id", entry.department_id);
        if ((count ?? 0) <= 1) {
          const deptName = entry.departments?.name;
          if (deptName) blockedItems.push({ type: "department", name: deptName });
        }
      }
    }

    // ── Check 4: House membership (House Incharge / House Master) ───────
    // house_staff has no is_incharge flag in current schema → any membership is a blocker
    const { data: houseEntries } = await admin
      .from("house_staff")
      .select("house_name")
      .eq("staff_profile_id", staff_id)
      .eq("school_id", staffProfile.school_id);
    if (houseEntries && houseEntries.length > 0) {
      for (const h of houseEntries as any[]) {
        if (h.house_name) blockedItems.push({ type: "house", name: h.house_name });
      }
    }

    if (blockedItems.length > 0) {
      // Build human-readable reason
      const ctBlocked = blockedItems.filter((b) => b.type === "class_teacher").map((b) => b.name);
      const wingBlocked = blockedItems.filter((b) => b.type === "wing").map((b) => b.name);
      const deptBlocked = blockedItems.filter((b) => b.type === "department").map((b) => b.name);
      const houseBlocked = blockedItems.filter((b) => b.type === "house").map((b) => b.name);

      const parts: string[] = [];
      if (ctBlocked.length > 0) parts.push(`Class Teacher of ${ctBlocked.join(", ")}`);
      if (wingBlocked.length > 0) parts.push(`sole Coordinator of ${wingBlocked.join(", ")}`);
      if (deptBlocked.length > 0) parts.push(`sole Incharge of ${deptBlocked.join(", ")}`);
      if (houseBlocked.length > 0) parts.push(`House Incharge of ${houseBlocked.join(", ")}`);

      return jsonResponse({
        eligible: false,
        reason: `Cannot delete: this staff is ${parts.join("; ")}. Reassign first, then delete.`,
        blocked_items: blockedItems,
      }, 400);
    }

    return jsonResponse({ eligible: true, reason: null, blocked_items: [] }, 200);
  } catch (e) {
    console.error("[check-staff-deletion-eligibility] EXCEPTION:", (e as Error).message);
    return jsonResponse({ success: false, error: (e as Error).message }, 500);
  }
});
