// create-superadmin.js — Creates a superadmin user
// Usage: node create-superadmin.js

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ndtqhschvnyloeccaelv.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdHFoc2Nodm55bG9lY2NhZWx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU5NDg3MiwiZXhwIjoyMDkyMTcwODcyfQ.j5dzni6oKtcjpWDYg84dOWvZ908IyWDzRKl6zFLZUJY";

const EMAIL = "mubashirkhan711@gmail.com";
const PASSWORD = "SharpAdmin@2026";
const FULL_NAME = "Mubashir Khan";

async function createSuperAdmin() {
  console.log("🔄 Creating superadmin user...");

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('id, email')
    .eq('email', EMAIL)
    .single();

  if (existingUser) {
    console.log("ℹ️  User already exists. Updating role to superadmin...");

    // Update existing profile to superadmin
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'superadmin', full_name: FULL_NAME, is_active: true })
      .eq('id', existingUser.id);

    if (profileError) {
      console.error("❌ Profile update failed:", profileError.message);
      process.exit(1);
    }

    console.log("✅ Role updated to superadmin!");
    console.log("\n📧 Login credentials:");
    console.log("   Email:", EMAIL);
    console.log("   Password: SharpAdmin@2026");
    return;
  }

  // Create new auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: FULL_NAME }
  });

  if (authError) {
    console.error("❌ Auth user creation failed:", authError.message);
    process.exit(1);
  }

  console.log("✅ Auth user created:", authUser.user.id);

  // Create profile with superadmin role
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.user.id,
      email: EMAIL,
      full_name: FULL_NAME,
      role: 'superadmin',
      is_active: true,
      must_change_password: false
    });

  if (profileError) {
    console.error("❌ Profile creation failed:", profileError.message);
    process.exit(1);
  }

  console.log("✅ Profile created with superadmin role!");
  console.log("\n📧 Login credentials:");
  console.log("   Email:", EMAIL);
  console.log("   Password:", PASSWORD);
}

createSuperAdmin();