// Supabase Edge Function: create-staff-user
// Creates a new staff user end-to-end:
//   1. Verifies caller is a principal/admin/superadmin in the same school
//   2. Calls auth.admin.createUser (service role, server-side only)
//   3. Inserts profiles row using the real auth.users.id
//   4. Reserves a staff_id via reserve_staff_id RPC
//   5. Inserts staff_profiles row with employee_id
//   6. Commits the reserved staff_id
// On any failure: rolls back (deletes auth user, deletes profile, releases staff_id)

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

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

function randomTempPassword(): string {
  // 16 chars: letters + digits. Stored nowhere — staff sets their own PIN via set-pin on first login.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => chars[b % chars.length]).join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ success: false, error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Admin client (bypasses RLS) for inserts and auth admin
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Caller identity extracted from the JWT (passed by the browser via Authorization header)
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return jsonResponse({ success: false, error: "Missing Authorization header" }, 401);
    }
    // Use admin client to read the user from the JWT (auth.getUser(jwt) does NOT need a session)
    const { data: userResult, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userResult?.user) {
      return jsonResponse({ success: false, error: `Invalid JWT: ${userErr?.message ?? "no user"}` }, 401);
    }
    const callerUserId = userResult.user.id;

    // ── Parse + validate input ────────────────────────────────────────────
    const body = await req.json();
    const school_id: string | undefined = body.school_id;
    const login_mobile: string | undefined = body.login_mobile;
    const full_name: string | undefined = body.full_name;
    const role: string | undefined = body.role;
    const year: number | undefined = body.year;
    const father_first_name: string | undefined = body.father_first_name;
    const father_middle_name: string | undefined = body.father_middle_name;
    const father_last_name: string | undefined = body.father_last_name;
    const gender: string | undefined = body.gender;
    const dob: string | undefined = body.dob;
    const salutation: string | undefined = body.salutation;
    const idempotency_key: string | undefined = body.idempotency_key;

    if (!school_id) return jsonResponse({ success: false, error: "school_id required" }, 400);
    if (!login_mobile || !/^\d{10}$/.test(login_mobile)) {
      return jsonResponse({ success: false, error: "login_mobile must be 10 digits" }, 400);
    }
    if (!role || !["teacher", "non_teaching", "admin", "principal"].includes(role)) {
      return jsonResponse({ success: false, error: "role invalid" }, 400);
    }
    if (!idempotency_key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idempotency_key)) {
      return jsonResponse({ success: false, error: "idempotency_key required (UUID v4)" }, 400);
    }
    const staffYear = year ?? new Date().getFullYear();

    // ── Idempotency replay ──────────────────────────────────────────────
    // Same key + same endpoint + not expired → return cached response.
    // Catches network retry, tab refresh, mobile resume, and any future
    // unguarded client double-submit. See docs/SUBMIT_GUARD.md.
    {
      const { data: cached } = await admin
        .from("idempotency_keys")
        .select("status_code, response_body")
        .eq("key", idempotency_key)
        .eq("endpoint", "create-staff-user")
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      if (cached) {
        console.log("[create-staff-user] idempotency replay:", { idempotency_key });
        return jsonResponse(cached.response_body, cached.status_code);
      }
    }

    // ── Verify caller ────────────────────────────────────────────────────
    const { data: callerProfile, error: callerErr } = await admin
      .from("profiles")
      .select("id, role, status, school_id")
      .eq("id", callerUserId)
      .single();

    if (callerErr || !callerProfile) {
      return jsonResponse({ success: false, error: `Unauthorized: ${callerErr?.message ?? "profile not found"}` }, 401);
    }
    if (
      callerProfile.status !== "active" ||
      !["principal", "admin", "superadmin"].includes(callerProfile.role) ||
      (callerProfile.role !== "superadmin" && callerProfile.school_id !== school_id)
    ) {
      return jsonResponse({ success: false, error: "Forbidden: not authorized for this school" }, 403);
    }

    // ── Step 1: reserve staff_id (DB-side) ───────────────────────────────
    console.log("[create-staff-user] step 1: reserve_staff_id", { school_id, staffYear });
    const { data: employeeId, error: reserveErr } = await admin.rpc("reserve_staff_id", {
      p_school_id: school_id,
      p_year: staffYear,
    });

    if (reserveErr || !employeeId) {
      console.error("[create-staff-user] step 1 FAILED:", { reserveErr: reserveErr?.message, employeeId });
      return jsonResponse({ success: false, step: 1, error: reserveErr?.message ?? "reserve_staff_id returned no data" }, 500);
    }
    console.log("[create-staff-user] step 1 OK:", { employeeId });

    // ── State for rollback ───────────────────────────────────────────────
    let authUserId: string | null = null;
    let profileId: string | null = null;
    let staffProfileId: string | null = null;

    const rollback = async (reason: string) => {
      console.error("[create-staff-user] ROLLBACK START:", reason, { staffProfileId, profileId, authUserId, employeeId });
      try {
        if (staffProfileId) {
          const { error } = await admin.from("staff_profiles").delete().eq("id", staffProfileId);
          console.log("[rollback] staff_profiles delete:", { error: error?.message });
        }
        if (profileId) {
          const { error } = await admin.from("profiles").delete().eq("id", profileId);
          console.log("[rollback] profiles delete:", { error: error?.message });
        }
        if (authUserId) {
          const { error } = await admin.auth.admin.deleteUser(authUserId);
          console.log("[rollback] auth user delete:", { error: error?.message });
        }
        const { error: relErr } = await admin.rpc("release_staff_id", {
          p_school_id: school_id,
          p_year: staffYear,
          p_staff_id: employeeId,
        });
        console.log("[rollback] release_staff_id:", { error: relErr?.message });
      } catch (e) {
        console.error("[create-staff-user] rollback error:", (e as Error).message);
      }
    };

    // ── Step 2: create auth user ─────────────────────────────────────────
    console.log("[create-staff-user] step 2: auth.admin.createUser");
    const tempPassword = randomTempPassword();
    // Unique per-call synthetic email — Supabase auth requires email uniqueness.
    // Real login is mobile + PIN (set-pin flow). Email is not user-facing.
    const uniq = crypto.randomUUID().slice(0, 8);
    const syntheticEmail = `${login_mobile}+${uniq}@staff.${school_id.slice(0, 8)}.local`;
    console.log("[create-staff-user] step 2 input:", { syntheticEmail, role, login_mobile });

    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: syntheticEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        school_id,
        role,
        login_mobile,
        full_name: full_name ?? null,
        created_via: "create-staff-user",
      },
    });

    if (authErr || !authData?.user) {
      console.error("[create-staff-user] step 2 FAILED:", { authErr: authErr?.message });
      await rollback(`auth.admin.createUser failed: ${authErr?.message}`);
      return jsonResponse({ success: false, step: 2, error: authErr?.message ?? "auth user creation failed" }, 500);
    }
    authUserId = authData.user.id;
    console.log("[create-staff-user] step 2 OK:", { authUserId });

    // ── Step 3: upsert profiles row ─────────────────────────────────────
    // NOTE: a DB trigger `on_auth_user_created` auto-inserts a stub row into
    // `profiles` (role='student') immediately after auth.admin.createUser.
    // We use upsert with onConflict:'id' to overwrite the trigger's stub with
    // the correct role + school + login_mobile + messenger_tag.
    console.log("[create-staff-user] step 3: profiles upsert", { authUserId, school_id, role, login_mobile });
    const nameParts = (full_name ?? "").trim().split(/\s+/).filter(Boolean);
    const messengerTag = nameParts.length
      ? nameParts.map((p) => p[0]).join("").toUpperCase().slice(0, 3)
      : null;

    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .upsert({
        id: authUserId,
        school_id,
        login_mobile,
        role,
        status: "active",
        full_name: full_name ?? null,
        messenger_tag: messengerTag,
        must_change_pin: true,
      }, { onConflict: "id" })
      .select("id")
      .single();

    if (profileErr || !profile) {
      console.error("[create-staff-user] step 3 FAILED:", { profileErr: profileErr?.message, code: profileErr?.code, authUserId, login_mobile });
      await rollback(`profiles upsert failed: ${profileErr?.message}`);
      return jsonResponse({ success: false, step: 3, error: profileErr?.message ?? "profiles upsert failed", code: profileErr?.code }, 500);
    }
    profileId = profile.id;
    console.log("[create-staff-user] step 3 OK:", { profileId });

    // ── Step 4: insert staff_profiles row ────────────────────────────────
    console.log("[create-staff-user] step 4: staff_profiles insert", { profileId, employeeId, school_id });
    const { data: staffRow, error: staffErr } = await admin
      .from("staff_profiles")
      .insert({
        profile_id: profileId,
        school_id,
        employee_id: employeeId,
        full_name: full_name ?? "—",
        salutation: salutation ?? null,
        gender: gender ?? null,
        dob: dob ?? null,
        father_first_name: father_first_name ?? null,
        father_middle_name: father_middle_name ?? null,
        father_last_name: father_last_name ?? null,
      })
      .select("id")
      .single();

    if (staffErr || !staffRow) {
      console.error("[create-staff-user] step 4 FAILED:", { staffErr: staffErr?.message, code: staffErr?.code, profileId, employeeId });
      await rollback(`staff_profiles insert failed: ${staffErr?.message}`);
      return jsonResponse({ success: false, step: 4, error: staffErr?.message ?? "staff_profiles insert failed", code: staffErr?.code }, 500);
    }
    staffProfileId = staffRow.id;
    console.log("[create-staff-user] step 4 OK:", { staffProfileId });

    // ── Step 5: commit reserved staff_id ─────────────────────────────────
    console.log("[create-staff-user] step 5: commit_staff_id", { school_id, staffYear });
    const { error: commitErr } = await admin.rpc("commit_staff_id", {
      p_school_id: school_id,
      p_year: staffYear,
    });
    if (commitErr) {
      // Not fatal — staff_id is already linked. Log and continue.
      console.warn("[create-staff-user] step 5 commit_staff_id failed (non-fatal):", commitErr.message);
    } else {
      console.log("[create-staff-user] step 5 OK");
    }

    console.log("[create-staff-user] ALL STEPS OK", { profileId, authUserId, staffProfileId, employeeId });
    const responseBody = {
      success: true,
      profile_id: profileId,
      user_id: authUserId,
      staff_profile_id: staffProfileId,
      employee_id: employeeId,
    };
    // Persist successful response so any retry with the same idempotency_key
    // replays this exact body. 5xx responses are NOT cached — they must be
    // retryable with a fresh key.
    await admin.from("idempotency_keys").insert({
      key: idempotency_key,
      endpoint: "create-staff-user",
      status_code: 200,
      response_body: responseBody,
    });
    return jsonResponse(responseBody);
  } catch (e) {
    console.error("[create-staff-user] UNHANDLED EXCEPTION:", (e as Error).message, (e as Error).stack);
    return jsonResponse({ success: false, step: 0, error: (e as Error).message }, 500);
  }
});
