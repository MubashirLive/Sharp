import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

const BodySchema = z.object({
  schoolId: z.string().uuid(),
  schoolName: z.string().trim().min(2).max(120),
  acronym: z.string().trim().min(2).max(6),
  academicBoard: z.string().trim().min(2),
  affiliationNumber: z.string().trim().nullable(),
  schoolType: z.string().trim().min(2),
  address: z.string().trim().min(2),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  postalCode: z.string().trim().min(2),
  contactPhone: z.string().trim().nullable(),
  contactEmail: z.string().trim().email().nullable(),
  website: z.string().trim().url().nullable(),
  emblemBase64: z.string().nullable(),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  principalName: z.string().trim().min(2),
  principalEmail: z.string().trim().email(),
  principalMobile: z.string().trim().regex(/^\d{10}$/),
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

    const data = parsed.data;

    let emblemUrl: string | null = null;
    if (data.emblemBase64) {
      const base64Data = data.emblemBase64.split(",")[1] ?? data.emblemBase64;
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const path = `emblems/${data.slug}-${Date.now()}.png`;
      const { error: upErr } = await admin.storage
        .from("school-assets")
        .upload(path, bytes, { contentType: "image/png", upsert: true });
      if (upErr) {
        return new Response(JSON.stringify({ error: `Emblem upload failed: ${upErr.message}` }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: urlData } = admin.storage.from("school-assets").getPublicUrl(path);
      emblemUrl = urlData.publicUrl;
    }

    const updatePayload: Record<string, unknown> = {
      name: data.schoolName.toUpperCase(),
      acronym: data.acronym.toUpperCase(),
      academic_board: data.academicBoard,
      affiliation_number: data.affiliationNumber,
      school_type: data.schoolType,
      address: data.address.toUpperCase(),
      city: data.city.toUpperCase(),
      state: data.state,
      postal_code: data.postalCode,
      contact_phone: data.contactPhone,
      contact_email: data.contactEmail,
      website: data.website,
      principal_name: data.principalName,
      principal_email: data.principalEmail,
      principal_mobile: data.principalMobile,
    };
    if (emblemUrl) updatePayload.emblem_url = emblemUrl;

    const { error } = await admin
      .from("schools")
      .update(updatePayload)
      .eq("id", data.schoolId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("audit_log").insert({
      actor_id: userData.user.id,
      action: "school_updated",
      entity_type: "school",
      entity_id: data.schoolId,
      details: { fields_updated: Object.keys(updatePayload) },
    });

    return new Response(JSON.stringify({ success: true, emblemUrl }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
