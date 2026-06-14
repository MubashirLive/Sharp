import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { PASSWORD_CONFIG } from "@/lib/auth-constants";

export default function ForcedPasswordChange() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < PASSWORD_CONFIG.MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters`;
    }
    if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter";
    }
    if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter";
    }
    if (PASSWORD_CONFIG.REQUIRE_NUMBER && !/[0-9]/.test(pwd)) {
      return "Password must contain at least one number";
    }
    if (PASSWORD_CONFIG.BLOCKED_PASSWORDS.includes(pwd.toLowerCase())) {
      return "This password is too common";
    }
    return null;
  };

  const handleNext = () => {
    const error = validatePassword(passwords.new);
    if (error) {
      setErrors({ new: error });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setErrors({ confirm: "Passwords do not match" });
      return;
    }
    setErrors({});
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new,
      });

      if (error) {
        toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Update profile status
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id);

      toast({ title: "Password updated successfully" });
      navigate("/school", { replace: true });
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Your Password</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Create a strong password to secure your account
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="flex justify-center gap-2">
            <div className={`h-2 w-16 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
            <div className={`h-2 w-16 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
          </div>

          {step === 1 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className={errors.new ? "border-destructive" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.new && <p className="text-sm text-destructive">{errors.new}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className={errors.confirm ? "border-destructive" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirm && <p className="text-sm text-destructive">{errors.confirm}</p>}
              </div>

              {/* Password requirements */}
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground mb-2">Password requirements:</p>
                <p className={passwords.new.length >= 8 ? "text-green-600" : ""}>
                  ✓ At least 8 characters
                </p>
                <p className={/[A-Z]/.test(passwords.new) ? "text-green-600" : ""}>
                  ✓ One uppercase letter
                </p>
                <p className={/[a-z]/.test(passwords.new) ? "text-green-600" : ""}>
                  ✓ One lowercase letter
                </p>
                <p className={/[0-9]/.test(passwords.new) ? "text-green-600" : ""}>
                  ✓ One number
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleNext}
                disabled={!passwords.new || !passwords.confirm}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
                <p className="text-sm">
                  Your password will be changed to the one you just entered.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Make sure you remember it. You will need this password to sign in.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Password"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}