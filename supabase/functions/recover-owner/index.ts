import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-recovery-secret",
};

const RECOVERY_SECRET = "sharp-owner-recovery-2026-04-26";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const incomingSecret = req.headers.get("x-recovery-secret");
    if (incomingSecret !== RECOVERY_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, password, fullName } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: usersData, error: listError } = await admin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = usersData.users.find(
      (user) => user.email?.toLowerCase() === String(email).toLowerCase(),
    );

    const ensureSuperAdminRole = async (userId: string, email: string, fullName: string) => {
      const { data: existingSuperAdmin } = await admin
        .from("profiles")
        .select("id")
        .eq("role", "superadmin")
        .maybeSingle();

      if (existingSuperAdmin && existingSuperAdmin.id !== userId) return;

      const { error: profileError } = await admin
        .from("profiles")
        .upsert({
          id: userId,
          email,
          full_name: fullName,
          role: "superadmin",
          school_id: null,
          must_change_password: false,
        });
      if (profileError) throw profileError;
    };

    if (existingUser) {
      const { data: updatedUser, error: updateError } = await admin.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            ...existingUser.user_metadata,
            full_name: fullName ?? existingUser.user_metadata?.full_name ?? email,
          },
        },
      );
      if (updateError) throw updateError;
      await ensureSuperAdminRole(updatedUser.user.id, email, fullName ?? email);

      return new Response(JSON.stringify({ ok: true, created: false, userId: updatedUser.user.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName ?? email },
    });
    if (createError || !createdUser.user) throw createError ?? new Error("Failed to create user");
    await ensureSuperAdminRole(createdUser.user.id, email, fullName ?? email);

    return new Response(JSON.stringify({ ok: true, created: true, userId: createdUser.user.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
