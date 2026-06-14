import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify PIN against stored hash (PBKDF2 format)
async function verifyPIN(storedHash: string, pin: string): Promise<boolean> {
  if (!storedHash.startsWith("pbkdf2$")) {
    // Fallback for old plain PINs (remove in future)
    return pin === storedHash.replace(/^hash_/, "");
  }

  const [ , saltB64, iterationsStr, hashB64 ] = storedHash.split("$");
  const saltBytes = Uint8Array.from(atob(saltB64).split("").map(c => c.charCodeAt(0)));
  const iterations = parseInt(iterationsStr, 10);

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const computedHashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));

  return computedHashB64 === hashB64;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { user_id, pin } = await req.json();

    if (!user_id || !pin) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get stored PIN hash
    const { data: profile, error: fetchError } = await admin
      .from("profiles")
      .select("pin_hash")
      .eq("id", user_id)
      .single();

    if (fetchError || !profile?.pin_hash) {
      return new Response(JSON.stringify({ success: false, error: "PIN not set" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isMatch = await verifyPIN(profile.pin_hash, pin);

    return new Response(JSON.stringify({
      success: isMatch,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});