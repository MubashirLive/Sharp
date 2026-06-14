import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SchoolSelection } from "@/components/SchoolSelection";
import { LoginCard } from "@/components/auth/LoginCard";
import { StaffLoginForm } from "@/components/auth/LoginForms";
import { toast } from "@/hooks/use-toast";
import {
  BriefcaseBusiness, Eye, EyeOff, GraduationCap,
  Loader2, School, Building2, ChevronLeft,
} from "lucide-react";
import { AUTH_STORAGE_KEYS } from "@/lib/auth-constants";

type LoginKind = "principal" | "staff" | "student";

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(100);

function normalizeRole(role: string | null | undefined): string | null {
  if (role === "super_admin") return "superadmin";
  if (role === "student_parent") return "student";
  if (["superadmin", "principal", "admin", "teacher", "student", "master_admin", "non_teaching"].includes(role ?? "")) return role!;
  return null;
}

const ROLE_CONFIG = {
  principal: {
    title: "Principal Login",
    icon: School,
    brandingLabel: "SHARP",
    subtitle: "Sign in to your school dashboard",
    authMethod: "password" as const,
  },
  staff: {
    title: "Staff Login",
    icon: BriefcaseBusiness,
    brandingLabel: "SHARP",
    subtitle: "Sign in to your account",
    authMethod: "pin" as const,
  },
  student: {
    title: "Student Login",
    icon: GraduationCap,
    brandingLabel: "SHARP",
    subtitle: "Sign in to your account",
    authMethod: "pin" as const,
  },
} as const;

export default function AuthRoleLogin({ kind }: { kind: LoginKind }) {
  const navigate = useNavigate();
  const { user, loading, role } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creds, setCreds] = useState({ email: "", password: "" });

  const config = ROLE_CONFIG[kind];

  // Check for saved school from localStorage
  useEffect(() => {
    const savedSchoolId = localStorage.getItem(AUTH_STORAGE_KEYS.SCHOOL_ID);
    const savedSchoolName = localStorage.getItem(AUTH_STORAGE_KEYS.SCHOOL_NAME);
    const savedSchoolLogo = localStorage.getItem(AUTH_STORAGE_KEYS.SCHOOL_LOGO);

    if (savedSchoolId && config.authMethod === "pin") {
      setSchoolId(savedSchoolId);
      setSchoolName(savedSchoolName);
      setSchoolLogo(savedSchoolLogo || null);
    }
  }, [config.authMethod]);

  useEffect(() => {
    if (loading || !user) return;
    const allowed: Record<string, string[]> = {
      principal: ["principal"],
      staff: ["admin", "teacher", "master_admin", "non_teaching"],
      student: ["student"],
    };
    if (role && (allowed[kind] ?? []).includes(role)) {
      navigate("/school", { replace: true });
    }
  }, [loading, user, role, kind, navigate]);

  const handleSchoolSelect = (id: string, name: string, logoUrl: string | null) => {
    setSchoolId(id);
    setSchoolName(name);
    setSchoolLogo(logoUrl);
  };

  const handleBackToSchoolSelection = () => {
    setSchoolId(null);
    setSchoolName(null);
    setSchoolLogo(null);
    setCreds({ email: "", password: "" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ev = emailSchema.safeParse(creds.email);
    const pv = passwordSchema.safeParse(creds.password);
    if (!ev.success) return toast({ title: "Invalid email", description: ev.error.errors[0].message, variant: "destructive" });
    if (!pv.success) return toast({ title: "Invalid password", description: pv.error.errors[0].message, variant: "destructive" });

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: ev.data,
      password: pv.data,
      options: { redirectTo: window.location.origin + "/auth/principal" }
    });
    if (error) { setBusy(false); return toast({ title: "Sign in failed", description: error.message, variant: "destructive" }); }

    const { data: userData } = await supabase.auth.getUser();
    const signedInUserId = userData.user?.id;
    if (!signedInUserId) { setBusy(false); await supabase.auth.signOut(); return toast({ title: "Sign in failed", description: "Unable to load signed-in user.", variant: "destructive" }); }

    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role, must_change_password, school_id, status").eq("id", signedInUserId).maybeSingle();
    setBusy(false);

    if (profileError || !profile) { await supabase.auth.signOut(); return toast({ title: "Profile not found", description: profileError?.message ?? "This account does not have a profile yet.", variant: "destructive" }); }

    // Check account status
    if (profile.status === "locked") {
      await supabase.auth.signOut();
      return toast({ title: "Account locked", description: "Your account is locked. Contact your admin.", variant: "destructive" });
    }
    if (profile.status === "inactive") {
      await supabase.auth.signOut();
      return toast({ title: "Account inactive", description: "Your account is inactive. Contact your admin.", variant: "destructive" });
    }
    if (profile.must_change_password) { navigate("/change-password", { replace: true }); return; }

    const profileRole = normalizeRole(profile.role);
    const allowed: Record<string, string[]> = { principal: ["principal"], staff: ["admin", "teacher", "master_admin", "non_teaching"], student: ["student"] };
    if (profileRole && (allowed[kind] ?? []).includes(profileRole)) {
      if (kind !== "principal" && schoolId && profile.school_id !== schoolId) {
        await supabase.auth.signOut();
        return toast({ title: "Access denied", description: "This account does not belong to the selected school.", variant: "destructive" });
      }
      navigate("/school", { replace: true });
      return;
    }
    await supabase.auth.signOut();
    toast({ title: "Access denied", description: "This account is not allowed to use this login.", variant: "destructive" });
  };

  const Icon = config.icon;

  // ── PIN-based login (Staff + Student) ──────────────────────────────────────────
  if (config.authMethod === "pin") {
    // Show school selection if no school saved
    if (!schoolId) {
      return (
        <LoginCard
          brandingIcon={<Icon className="h-8 w-8" />}
          brandingLabel={config.brandingLabel}
          title={config.title}
          subtitle="Select your school to continue"
          footer="Your school data is kept private and secure."
        >
          <SchoolSelection onSelect={handleSchoolSelect} savedSchoolId={localStorage.getItem(AUTH_STORAGE_KEYS.SCHOOL_ID)} />
        </LoginCard>
      );
    }

    // PIN login form
    return (
      <div className="login-page-bg px-4 py-10">
        <div className="w-full max-w-[26rem]">
          {/* White-label school header */}
          <div className="flex flex-col items-center mb-7">
            {schoolLogo ? (
              <img src={schoolLogo} alt={schoolName ?? ""} loading="lazy" decoding="async" className="login-branding-icon mb-4 object-cover" />
            ) : (
              <div className="login-branding-icon mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
            )}
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--login-text-muted))]">
              Signing in to
            </p>
            <h1 className="text-2xl font-bold text-[hsl(var(--login-text))] tracking-tight mt-1">
              {schoolName}
            </h1>
          </div>

          {/* PIN login card */}
          <div className="login-card px-6 py-7">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[hsl(var(--login-text))]}">{config.title}</h2>
                <p className="text-sm text-[hsl(var(--login-text-muted))] mt-0.5">Enter your credentials to sign in.</p>
              </div>
              <div className="login-branding-icon shrink-0 w-10 h-10 rounded-xl" style={{ background: "linear-gradient(135deg, hsl(262 83% 58%), hsl(270 67% 76%))" }}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>

            <StaffLoginForm
              schoolId={schoolId}
              schoolName={schoolName || ""}
              schoolLogo={schoolLogo}
              role={kind === "staff" ? "staff" : "student"}
            />

            <button
              type="button"
              onClick={handleBackToSchoolSelection}
              className="mt-4 w-full flex items-center justify-center gap-1.5 text-sm text-[hsl(var(--login-text-muted))] hover:text-[hsl(var(--login-primary))] transition-colors duration-200 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Change school
            </button>
          </div>

          <p className="text-center text-xs text-[hsl(var(--login-text-muted))] mt-5">
            Powered by <span className="font-semibold text-[hsl(var(--login-primary))]">SHARP</span>
          </p>
        </div>
      </div>
    );
  }

  // ── Password-based login (Principal) ──────────────────────────────────────────
  return (
    <LoginCard
      brandingIcon={<Icon className="h-8 w-8" />}
      brandingLabel={config.brandingLabel}
      title={config.title}
      subtitle={config.subtitle}
      footer="Contact your Super Admin if you do not have credentials."
    >
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-email`} className="text-sm font-medium text-[hsl(var(--login-text))]">
            Email address
          </Label>
          <Input
            id={`${kind}-email`}
            type="email"
            autoComplete="email"
            placeholder="principal@school.com"
            required
            value={creds.email}
            onChange={(e) => setCreds({ ...creds, email: e.target.value })}
            className="login-input"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${kind}-password`} className="text-sm font-medium text-[hsl(var(--login-text))]">
            Password
          </Label>
          <div className="relative">
            <Input
              id={`${kind}-password`}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              value={creds.password}
              onChange={(e) => setCreds({ ...creds, password: e.target.value })}
              className="login-input pr-11"
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
          {busy ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </LoginCard>
  );
}