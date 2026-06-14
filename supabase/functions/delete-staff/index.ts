// Supabase Edge Function: delete-staff
// Hard-deletes a staff end-to-end:
//   1. Validates caller is principal/master_admin/superadmin in same school
//   2. Re-runs eligibility check (server-side guard)
//   3. Deletes event_task_completions (manual — though FK is now CASCADE, explicit clear is safer)
//   4. Deletes staff_profiles (CASCADEs into staff_profile_extended)
//   5. Deletes profiles (CASCADEs into junctions: department_staff, house_staff,
//      department_incharges, wings_coordinators, wings_activity_staff,
//      principal_profiles, student_profiles [no], superadmin_profiles [no])
//   6. Deletes auth.users row
//   7. Logs
//
// v1: no audit log table. v2 will add staff_audit_log.
//
// Idempotent: if staff already deleted, returns 404.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
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

    // Check for existing idempotent response
    if (idempotencyKey) {
      const { data: existingCheck } = await admin
        .from("deletion_eligibility_checks")
        .select("result")
        .eq("idempotency_key", idempotencyKey)
        .single();

      if (existingCheck) {
        // Log idempotency hit
        await admin
          .from("audit_log")
          .insert({
            event_type: "idempotent_delete_staff_request",
            event_details: {
              idempotency_key: idempotencyKey,
              original_result: existingCheck.result
            },
            user_id: req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || null,
          });
        return jsonResponse(existingCheck.result, 200);
      }
    }

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
        success: false,
        step: 0,
        error: "You cannot delete your own account. Ask another principal/admin to do it.",
      }, 400);
    }

    // ── Look up staff + caller ───────────────────────────────────────────
    const { data: staffRow, error: staffErr } = await admin
      .from("staff_profiles")
      .select("profile_id, school_id, employee_id, full_name")
      .eq("profile_id", staff_id)
      .maybeSingle();

    if (staffErr) return jsonResponse({ success: false, step: 1, error: staffErr.message }, 500);
    if (!staffRow) {
      // Idempotent: already deleted
      const result = { success: false, step: 1, error: "Staff not found or already deleted." };

      // Store idempotent response
      if (idempotencyKey) {
        await admin
          .from("deletion_eligibility_checks")
          .insert({
            idempotency_key: idempotencyKey,
            staff_id: staff_id,
            caller_id: callerUserId,
            school_id: staffRow?.school_id || null,
            result: result,
          });
      }

      return jsonResponse(result, 404);
    }

    const { data: callerProfile, error: callerErr } = await admin
      .from("profiles")
      .select("id, role, status, school_id")
      .eq("id", callerUserId)
      .single();
    if (callerErr || !callerProfile) {
      return jsonResponse({ success: false, step: 1, error: "Caller profile not found" }, 401);
    }
    if (callerProfile.status !== "active" || !["principal", "master_admin", "superadmin", "admin"].includes(callerProfile.role)) {
      return jsonResponse({ success: false, step: 1, error: "Forbidden: not authorized to delete staff" }, 403);
    }
    if (callerProfile.role !== "superadmin" && callerProfile.school_id !== staffRow.school_id) {
      return jsonResponse({ success: false, step: 1, error: "Forbidden: staff belongs to a different school" }, 403);
    }

    // ── Step 2: Eligibility re-check (server-side guard) ─────────────────
    // Inline check (avoids re-invoking the function). If anything blocks, abort.
    const blockedItems: string[] = [];

    const { data: ctEntries } = await admin
      .from("class_teachers")
      .select("id")
      .eq("staff_profile_id", staff_id)
      .eq("school_id", staffRow.school_id);
    if (ctEntries && ctEntries.length > 0) blockedItems.push("class_teacher");

    const { data: coordEntries } = await admin
      .from("wings_coordinators")
      .select("wing_id")
      .eq("staff_id", staff_id);
    if (coordEntries && coordEntries.length > 0) {
      for (const e of coordEntries) {
        const { count } = await admin
          .from("wings_coordinators")
          .select("id", { count: "exact", head: true })
          .eq("wing_id", e.wing_id);
        if ((count ?? 0) <= 1) {
          blockedItems.push("wing");
          break;
        }
      }
    }

    const { data: deptEntries } = await admin
      .from("department_incharges")
      .select("department_id")
      .eq("staff_profile_id", staff_id);
    if (deptEntries && deptEntries.length > 0) {
      for (const e of deptEntries) {
        const { count } = await admin
          .from("department_incharges")
          .select("id", { count: "exact", head: true })
          .eq("department_id", e.department_id);
        if ((count ?? 0) <= 1) {
          blockedItems.push("department");
          break;
        }
      }
    }

    const { data: houseEntries } = await admin
      .from("house_staff")
      .select("id")
      .eq("staff_profile_id", staff_id)
      .eq("school_id", staffRow.school_id);
    if (houseEntries && houseEntries.length > 0) blockedItems.push("house");

    if (blockedItems.length > 0) {
      const result = {
        success: false,
        step: 2,
        error: `Cannot delete: blocked by [${blockedItems.join(", ")}]. Reassign first.`,
        blocked_items: blockedItems,
      };

      // Store idempotent response
      if (idempotencyKey) {
        await admin
          .from("deletion_eligibility_checks")
          .insert({
            idempotency_key: idempotencyKey,
            staff_id: staff_id,
            caller_id: callerUserId,
            school_id: staffRow.school_id,
            result: result,
          });
      }

      return jsonResponse(result, 400);
    }

    // ── Step 3: clear event_task_completions (FK is CASCADE so this is redundant,
    // but explicit DELETE is safer in case the FK is missing for any reason) ──
    const { error: evtErr } = await admin
      .from("event_task_completions")
      .delete()
      .eq("staff_id", staff_id);
    if (evtErr) {
      console.warn("[delete-staff] event_task_completions delete warn:", evtErr.message);
    }

    // ── Step 4: delete staff_profiles (CASCADEs staff_profile_extended) ───
    const { error: spErr } = await admin
      .from("staff_profiles")
      .delete()
      .eq("profile_id", staff_id);
    if (spErr) {
      console.error("[delete-staff] step 4 FAILED:", spErr.message);
      return jsonResponse({ success: false, step: 4, error: spErr.message }, 500);
    }

    // ── Step 5: delete profiles (CASCADEs all junctions) ────────────────
    const { error: profErr } = await admin
      .from("profiles")
      .delete()
      .eq("id", staff_id);
    if (profErr) {
      console.error("[delete-staff] step 5 FAILED:", profErr.message);
      return jsonResponse({ success: false, step: 5, error: profErr.message }, 500);
    }

    // ── Step 6: delete auth.users row ────────────────────────────────────
    const { error: authErr } = await admin.auth.admin.deleteUser(staff_id);
    if (authErr) {
      console.error("[delete-staff] step 6 FAILED:", authErr.message);
      return jsonResponse({ success: false, step: 6, error: authErr.message }, 500);
    }

    const result = {
      success: true,
      employee_id: staffRow.employee_id,
      full_name: staffRow.full_name,
    };

    // Log successful deletion
    await admin
      .from("audit_log")
      .insert({
        event_type: "delete_staff",
        event_details: {
          employee_id: staffRow.employee_id,
          full_name: staffRow.full_name,
          staff_id: staffRow.profile_id,
        },
        user_id: callerUserId,
      });

    console.log("[delete-staff] OK", {
      callerUserId,
      staffId: staff_id,
      employeeId: staffRow.employee_id,
      fullName: staffRow.full_name,
    });

    return jsonResponse(result, 200);
  } catch (e) {
    console.error("[delete-staff] UNHANDLED EXCEPTION:", (e as Error).message, (e as Error).stack);
    return jsonResponse({ success: false, step: 0, error: (e as Error).message }, 500);
  }
});