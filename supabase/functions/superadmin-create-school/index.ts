import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-idempotency-key",
};

const BodySchema = z.object({
  schoolName: z.string().trim().min(2).max(120),
  acronym: z.string().trim().min(2).max(6),
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
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
  principalName: z.string().trim().min(2),
  principalEmail: z.string().trim().email(),
  principalMobile: z.string().trim().regex(/^\d{10}$/),
});

function genPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let p = "";
  const arr = new Uint32Array(14);
  crypto.getRandomValues(arr);
  for (const n of arr) p += chars[n % chars.length];
  return p + "!9";
}

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

    // Slug uniqueness check
    const { data: existing } = await admin
      .from("schools")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "School name already exists" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload emblem if provided
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

    // Create school
    const tempPassword = genPassword();
    const { data: school, error: schoolErr } = await admin
      .from("schools")
      .insert({
        name: data.schoolName.toUpperCase(),
        acronym: data.acronym.toUpperCase(),
        slug: data.slug,
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
        emblem_url: emblemUrl,
        principal_name: data.principalName,
        principal_email: data.principalEmail,
        principal_mobile: data.principalMobile,
        principal_temp_password: tempPassword,
        status: "active",
        onboarding_complete: false,
      })
      .select()
      .single();

    if (schoolErr || !school) {
      return new Response(JSON.stringify({ error: schoolErr?.message ?? "School creation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user
    const { data: principalUser, error: signUpErr } = await admin.auth.admin.createUser({
      email: data.principalEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.principalName },
    });

    if (signUpErr || !principalUser?.user?.id) {
      await admin.from("schools").delete().eq("id", school.id);
      return new Response(JSON.stringify({ error: signUpErr?.message ?? "User creation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create profile
    const { error: profileErr } = await admin.from("profiles").upsert({
      id: principalUser.user.id,
      email: data.principalEmail,
      full_name: data.principalName,
      role: "principal",
      school_id: school.id,
      mobile: data.principalMobile,
      must_change_password: true,
    }, { onConflict: "id" });

    if (profileErr) {
      await admin.auth.admin.deleteUser(principalUser.user.id);
      await admin.from("schools").delete().eq("id", school.id);
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("audit_log").insert({
      actor_id: userData.user.id,
      action: "school_created",
      entity_type: "school",
      entity_id: school.id,
      details: { principal_email: data.principalEmail },
    });

    return new Response(JSON.stringify({
      success: true,
      schoolId: school.id,
      principalUserId: principalUser.user.id,
      tempPassword,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
