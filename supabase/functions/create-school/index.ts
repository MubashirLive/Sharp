import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

const BodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  principalEmail: z.string().trim().email().max(255),
  principalName: z.string().trim().min(2).max(100),
});

function genPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  for (const n of arr) p += chars[n % chars.length];
  return p + "!9";
}

function getCurrentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) return `${year}-${String(year + 1).slice(-2)}`;
  return `${year - 1}-${String(year).slice(-2)}`;
}

function getAcademicYearDates(academicYear: string): { start_date: string; end_date: string } {
  const [startYear] = academicYear.split("-").map((s) => parseInt(s, 10));
  return { start_date: `${startYear}-04-01`, end_date: `${startYear + 1}-03-31` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Idempotency key handling
  const idempotencyKey = req.headers.get("x-idempotency-key");
  if (req.method !== "OPTIONS" && !idempotencyKey) {
    return new Response(JSON.stringify({ error: "x-idempotency-key header required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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

    // Verify caller is a super_admin using their JWT
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

    // Check for existing idempotent response
    if (idempotencyKey) {
      const { data: existingRequest } = await admin
        .from("school_creation_requests")
        .select("result")
        .eq("idempotency_key", idempotencyKey)
        .single();

      if (existingRequest) {
        // Log idempotency hit
        await admin
          .from("audit_log")
          .insert({
            event_type: "idempotent_create_school_request",
            event_details: {
              idempotency_key: idempotencyKey,
              original_result: existingRequest.result
            },
            user_id: userData.user.id,
          });
        return new Response(JSON.stringify(existingRequest.result), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Verify caller is a superadmin (profiles.role = 'superadmin')
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

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { name, slug, principalEmail, principalName } = parsed.data;

    let result;

    try {
      // 1. Create school
      const { data: school, error: schoolErr } = await admin
        .from("schools").insert({ name, slug }).select("id").single();
      if (schoolErr) {
        result = { error: schoolErr.message };
      } else {
        let principalUserId: string | null = null;
        let tempPassword: string | null = null;

        // Look up by email
        const { data: existing } = await admin.auth.admin.listUsers();
        const found = existing.users.find((u) => u.email?.toLowerCase() === principalEmail.toLowerCase());

        if (found) {
          principalUserId = found.id;
        } else {
          tempPassword = genPassword();
          const { data: created, error: createErr } = await admin.auth.admin.createUser({
            email: principalEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: principalName },
          });
          if (createErr || !created.user) {
            await admin.from("schools").delete().eq("id", school.id);
            result = { error: createErr?.message ?? "Failed to create user" };
          } else {
            principalUserId = created.user.id;
          }
        }

        if (principalUserId && !result?.error) {
          // 3. Link profile to school
          await admin.from("profiles").update({ school_id: school.id, full_name: principalName }).eq("user_id", principalUserId);

          // 4. Assign principal role
          await admin.from("user_roles").insert({
            user_id: principalUserId,
            role: "principal",
            school_id: school.id,
          });

          // 5. Auto-create academic session
          const academicYear = getCurrentAcademicYear();
          const { start_date, end_date } = getAcademicYearDates(academicYear);
          await admin.from("academic_sessions").insert({
            school_id: school.id,
            academic_year: academicYear,
            start_date,
            end_date,
            is_current: true,
          });

          // 6. Audit
          await admin.from("audit_log").insert({
            actor_id: userData.user.id,
            school_id: school.id,
            action: "school_created",
            entity_type: "school",
            entity_id: school.id,
            details: { principal_email: principalEmail },
          });

          result = { success: true, schoolId: school.id, principalUserId, tempPassword };
        }
      }
    } catch (e) {
      result = { error: (e as Error).message };
    }

    // Store idempotent response
    if (idempotencyKey && result) {
      await admin
        .from("school_creation_requests")
        .insert({
          idempotency_key: idempotencyKey,
          user_id: userData.user.id,
          result: result,
          created_at: new Date().toISOString(),
        });
    }

    if (result?.error) {
      return new Response(JSON.stringify(result), {
        status: result.error.includes("Forbidden") ? 403 : result.error.includes("Unauthorized") ? 401 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});