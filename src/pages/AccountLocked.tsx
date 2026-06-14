import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Mail, Smartphone } from "lucide-react";

type LockReason = "pin_exceeded" | "otp_exceeded" | "password_failed" | "manual";

const RECOVERY_OPTIONS_MAP: Record<string, ("email" | "mobile" | "superadmin")[]> = {
  principal: ["email", "mobile"],
  staff: ["mobile"],
  student: ["mobile"],
  superadmin: ["email", "mobile", "superadmin"],
};

export default function AccountLocked() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lockReason = (searchParams.get("reason") as LockReason) || "pin_exceeded";
  const role = searchParams.get("role") || "staff";
  const lockedUntil = searchParams.get("until") || undefined;
  const recoveryOptions = RECOVERY_OPTIONS_MAP[role] || ["mobile"];

  const getMessage = () => {
    switch (lockReason) {
      case "pin_exceeded":
        return "Too many incorrect PIN attempts. Your account is temporarily locked.";
      case "otp_exceeded":
        return "Too many incorrect OTP attempts. Your account is temporarily locked.";
      case "password_failed":
        return "Too many failed password attempts. Your account has been locked.";
      case "manual":
        return "Your account has been locked by an administrator.";
    }
  };

  const formatUnlockTime = (iso?: string) => {
    if (!iso) return "24 hours";
    const date = new Date(iso);
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Account Locked</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-sm">{getMessage()}</p>
            {lockedUntil && (
              <p className="text-xs text-muted-foreground mt-2">
                Unlocks at: {formatUnlockTime(lockedUntil)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">
              Recover your account using one of these options:
            </p>

            {recoveryOptions.includes("email") && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/auth/${role}/recover?method=email`)}
              >
                <Mail className="h-4 w-4 mr-2" />
                Reset via Email
              </Button>
            )}

            {recoveryOptions.includes("mobile") && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate(`/auth/${role}/recover?method=mobile`)}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Reset via Mobile OTP
              </Button>
            )}

            {recoveryOptions.includes("superadmin") && (
              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                <p>Contact your Super Administrator to unlock your account manually.</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/auth/select")}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}