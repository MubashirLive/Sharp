import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { LoginCard } from "@/components/auth/LoginCard";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { school, refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const newPwLen = newPassword.length;
  const newPwStrong = newPwLen >= 8;
  const passwordsMatch = confirmPassword.length > 0 && confirmPassword === newPassword;
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast({ title: "Weak password", description: "Use at least 8 characters.", variant: "destructive" });
    if (newPassword !== confirmPassword) return toast({ title: "Passwords do not match", description: "Confirm password must match new password.", variant: "destructive" });
    if (newPassword === currentPassword) return toast({ title: "Choose a new password", description: "New password must be different.", variant: "destructive" });

    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: authError } = await supabase.auth.updateUser({ password: newPassword });
      if (authError) throw authError;
      if (user) {
        const { error: profileError } = await supabase.from("profiles").update({ must_change_password: false }).eq("id", user.id);
        if (profileError) throw profileError;
      }
      if (school?.id) {
        const { error: schoolError } = await supabase.from("schools").update({ principal_temp_password: null }).eq("id", school.id);
        if (schoolError) throw schoolError;
      }
      await refresh();
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
      if (!school?.onboarding_complete) {
        navigate("/school/onboarding", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err: any) {
      toast({ title: "Could not update password", description: err.message ?? "Something went wrong.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <LoginCard
      brandingIcon={<LockKeyhole className="h-8 w-8" />}
      brandingLabel="Account Setup"
      title="Set your password"
      subtitle="Create a new password to secure your account"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Temporary Password */}
        <div className="space-y-1.5">
          <Label htmlFor="temp-password" className="text-sm font-medium text-[hsl(var(--login-text))]">
            Temporary password
          </Label>
          <div className="relative">
            <Input
              id="temp-password"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Enter temporary password"
              className="login-input pr-11"
            />
            <button
              type="button"
              aria-label={showCurrent ? "Hide password" : "Show password"}
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[hsl(var(--login-text-muted))] hover:text-[hsl(var(--login-primary))] transition-colors duration-200 cursor-pointer rounded-r-xl"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="new-password" className="text-sm font-medium text-[hsl(var(--login-text))]">
            New password
          </Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Min. 8 characters"
              className="login-input pr-11"
            />
            <button
              type="button"
              aria-label={showNew ? "Hide password" : "Show password"}
              onClick={() => setShowNew((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[hsl(var(--login-text-muted))] hover:text-[hsl(var(--login-primary))] transition-colors duration-200 cursor-pointer rounded-r-xl"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPwLen > 0 && (
            <div className="flex items-center gap-1.5 mt-1">
              {newPwStrong ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-[hsl(var(--login-text-muted))] shrink-0" />
              )}
              <span className={`text-xs ${newPwStrong ? "text-green-600" : "text-[hsl(var(--login-text-muted))]"}`}>
                {newPwStrong ? "Strong password" : `${8 - newPwLen} more characters needed`}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password" className="text-sm font-medium text-[hsl(var(--login-text))]">
            Confirm new password
          </Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Re-enter new password"
              className="login-input pr-11"
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[hsl(var(--login-text-muted))] hover:text-[hsl(var(--login-primary))] transition-colors duration-200 cursor-pointer rounded-r-xl"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {passwordsMismatch && (
            <div className="flex items-center gap-1.5 mt-1">
              <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              <span className="text-xs text-destructive">Passwords do not match</span>
            </div>
          )}
          {passwordsMatch && (
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span className="text-xs text-green-600">Passwords match</span>
            </div>
          )}
        </div>

        <Button type="submit" className="login-btn login-btn-primary w-full mt-2" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {busy ? "Updating..." : "Update password"}
        </Button>
      </form>
    </LoginCard>
  );
}