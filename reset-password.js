// reset-password.js — Resets password for a Supabase user
// Usage: node reset-password.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ndtqhschvnyloeccaelv.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdHFoc2Nodm55bG9lY2NhZWx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU5NDg3MiwiZXhwIjoyMDkyMTcwODcyfQ.j5dzni6oKtcjpWDYg84dOWvZ908IyWDzRKl6zFLZUJY";

const USER_ID = "0ee5b4d2-1443-451b-a37a-420940f47c17";
const NEW_PASSWORD = "Sharp@2026!";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function resetPassword() {
  console.log("🔄 Resetting password for user:", USER_ID);

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      USER_ID,
      { password: NEW_PASSWORD }
    );

    if (error) {
      console.error("❌ Error:", error.message);
      process.exit(1);
    }

    console.log("✅ Password reset successful!");
    console.log("   Email:", data.user.email);
    console.log("   New password:", NEW_PASSWORD);
    console.log("\n📧 You can now login with these credentials.");
  } catch (err) {
    console.error("❌ Unexpected error:", err.message);
    process.exit(1);
  }
}

resetPassword();