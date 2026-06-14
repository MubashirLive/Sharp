import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

const BodySchema = z.object({
  principalEmail: z.string().trim().email().optional(),
  principalMobile: z.string().trim().regex(/^\d{10}$/).optional(),
  channel: z.enum(["email", "mobile"]),
  otp: z.string().regex(/^\d{6}$/),
  principalUserId: z.string().uuid(),
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

    const { principalUserId, otp, channel } = parsed.data;

    // Look up matching unused, unexpired OTP
    const { data: otpRecord, error: lookupErr } = await admin
      .from("otp_codes")
      .select("id, expires_at, used")
      .eq("user_id", principalUserId)
      .eq("code", otp)
      .eq("used", false)
      .maybeSingle();

    if (lookupErr) {
      return new Response(JSON.stringify({ error: lookupErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!otpRecord) {
      return new Response(JSON.stringify({ error: "Invalid or expired OTP" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      await admin.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);
      return new Response(JSON.stringify({ error: "OTP expired" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark as used
    await admin.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

    await admin.from("audit_log").insert({
      actor_id: userData.user.id,
      action: "principal_otp_verified",
      entity_type: "user",
      entity_id: principalUserId,
      details: { channel },
    });

    return new Response(JSON.stringify({ verified: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
