import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple PIN validation
function validatePIN(pin: string): { valid: boolean; error?: string } {
  if (!pin || pin.length !== 6) {
    return { valid: false, error: "PIN must be 6 digits" };
  }
  if (!/^\d+$/.test(pin)) {
    return { valid: false, error: "PIN must contain only numbers" };
  }
  // Block weak PINs
  const blockedPins = ["123456", "654321", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999", "000000", "121212"];
  if (blockedPins.includes(pin)) {
    return { valid: false, error: "Choose a stronger PIN" };
  }
  return { valid: true };
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

    // Validate PIN
    const validation = validatePIN(pin);
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, error: validation.error }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Hash PIN with PBKDF2-SHA256 (210k iters, OWASP 2023+) using per-user salt
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const saltB64 = btoa(String.fromCharCode(...saltBytes));
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(pin),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations: 210000, hash: "SHA-256" },
      keyMaterial,
      256
    );
    const hashB64 = btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
    const pinHash = `pbkdf2$${saltB64}$210000$${hashB64}`;

    // Update profile with PIN hash
    const { error } = await admin
      .from("profiles")
      .update({
        pin_hash: pinHash,
        must_change_pin: false,
        status: "active",
      })
      .eq("id", user_id);

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});