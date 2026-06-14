import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { LoginCard } from "@/components/auth/LoginCard";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(100);

export default function AuthSuperAdmin() {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creds, setCreds] = useState({ email: "", password: "" });

  useEffect(() => {
    if (!loading && user && role === "superadmin") navigate("/super-admin", { replace: true });
  }, [loading, navigate, role, user]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const ev = emailSchema.safeParse(creds.email);
    const pv = passwordSchema.safeParse(creds.password);
    if (!ev.success) return toast({ title: "Invalid email", description: ev.error.errors[0].message, variant: "destructive" });
    if (!pv.success) return toast({ title: "Invalid password", description: pv.error.errors[0].message, variant: "destructive" });

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: ev.data,
      password: pv.data,
      options: { redirectTo: window.location.origin + "/auth/superadmin" }
    });
    if (error) { setBusy(false); return toast({ title: "Sign in failed", description: error.message, variant: "destructive" }); }

    const { data: userData } = await supabase.auth.getUser();
    const signedInUserId = userData.user?.id;
    if (!signedInUserId) { setBusy(false); await supabase.auth.signOut(); return toast({ title: "Sign in failed", description: "Unable to load signed-in user.", variant: "destructive" }); }

    const { data: profile, error: profileError } = await supabase.from("profiles").select("role, must_change_password").eq("id", signedInUserId).maybeSingle();
    setBusy(false);

    if (profileError || !profile) { await supabase.auth.signOut(); return toast({ title: "Profile not found", description: profileError?.message ?? "This account does not have an app profile yet.", variant: "destructive" }); }
    if (profile.must_change_password) { navigate("/change-password", { replace: true }); return; }
    if (profile.role === "superadmin" || profile.role === "super_admin") { navigate("/super-admin", { replace: true }); return; }
    await supabase.auth.signOut();
    toast({ title: "Access denied", description: "This screen is only for Super Admin.", variant: "destructive" });
  };

  return (
    <LoginCard
      brandingIcon={<Shield className="h-8 w-8" />}
      brandingLabel="Platform Admin"
      title="Super Admin"
      subtitle="Sign in to manage SHARP platform"
      footer="Access restricted to authorised platform administrators only."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="super-email" className="text-sm font-medium text-[hsl(var(--login-text))]">
            Email address
          </Label>
          <Input
            id="super-email"
            type="email"
            autoComplete="email"
            placeholder="admin@sharp.com"
            required
            value={creds.email}
            onChange={(e) => setCreds({ ...creds, email: e.target.value })}
            className="login-input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="super-password" className="text-sm font-medium text-[hsl(var(--login-text))]">
            Password
          </Label>
          <div className="relative">
            <Input
              id="super-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={creds.password}
              onChange={(e) => setCreds({ ...creds, password: e.target.value })}
              className="login-input pr-10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[hsl(var(--login-text-muted))] hover:text-[hsl(var(--login-primary))] transition-colors duration-200 cursor-pointer rounded-r-xl"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" className="login-btn login-btn-primary w-full mt-2" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Signing in..." : "Sign in as Super Admin"}
        </Button>
      </form>
    </LoginCard>
  );
}