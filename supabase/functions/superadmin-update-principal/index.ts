import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

const BodySchema = z.object({
  schoolId: z.string().uuid(),
  principalUserId: z.string().uuid(),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  mobile: z.string().trim().regex(/^\d{10}$/),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const idempotencyKey = req.headers.get("x-idempotency-key");
  if (!idempotencyKey) {
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
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (profile?.role !== "superadmin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { schoolId, principalUserId, fullName, email, mobile } = parsed.data;

    // 1. Update auth user
    const { error: authErr } = await admin.auth.admin.updateUserById(
      principalUserId,
      {
        email,
        phone: `+91${mobile}`,
        user_metadata: { full_name: fullName },
      }
    );
    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Update schools table
    const { error: schoolErr } = await admin
      .from("schools")
      .update({
        principal_name: fullName,
        principal_email: email,
        principal_mobile: mobile,
      })
      .eq("id", schoolId);
    if (schoolErr) {
      return new Response(JSON.stringify({ error: schoolErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Update profiles table
    const { error: profileErr } = await admin
      .from("profiles")
      .update({
        full_name: fullName,
        email,
        mobile,
      })
      .eq("school_id", schoolId)
      .eq("role", "principal");
    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("audit_log").insert({
      actor_id: userData.user.id,
      action: "principal_updated",
      entity_type: "user",
      entity_id: principalUserId,
      details: { fullName, email, mobile },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
