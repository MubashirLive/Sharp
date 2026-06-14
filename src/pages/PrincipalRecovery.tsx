import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail, Smartphone } from "lucide-react";
import { OTPInput } from "@/components/auth/OTPInput";

type Step = "identify" | "email_otp" | "mobile_otp" | "reset_password";

export default function PrincipalRecovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identify");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  const sendEmailOtp = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await supabase.functions.invoke("send-otp", {
        body: { user_id: userId, purpose: "recovery", email },
      });
      toast({ title: "OTP sent to your email" });
      setStep("email_otp");
    } catch {
      toast({ title: "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!userId || emailOtp.length !== 6) return;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("verify-otp", {
        body: { user_id: userId, code: emailOtp, purpose: "recovery" },
      }) as { data: { success?: boolean; error?: string } };
      if (!data?.success) {
        toast({ title: data?.error || "Invalid OTP", variant: "destructive" });
        return;
      }
      setStep("mobile_otp");
      await sendMobileOtp();
    } finally {
      setLoading(false);
    }
  };

  const sendMobileOtp = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await supabase.functions.invoke("send-otp", {
        body: { user_id: userId, purpose: "recovery", mobile },
      });
      toast({ title: "OTP sent to your mobile" });
    } catch {
      toast({ title: "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyMobileOtp = async () => {
    if (!userId || mobileOtp.length !== 6) return;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("verify-otp", {
        body: { user_id: userId, code: mobileOtp, purpose: "recovery" },
      }) as { data: { success?: boolean; error?: string } };
      if (!data?.success) {
        toast({ title: data?.error || "Invalid OTP", variant: "destructive" });
        return;
      }
      setStep("reset_password");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (password: string) => {
    if (!userId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Password reset successful" });
      navigate("/auth/principal");
    } catch {
      toast({ title: "Failed to reset password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Recover Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Principal recovery requires email + mobile verification
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "identify" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Registered Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="principal@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Registered Mobile</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={async () => {
                  // Lookup user by email/mobile
                  const { data } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("email", email)
                    .eq("mobile", mobile)
                    .eq("role", "principal")
                    .single();
                  if (!data) {
                    toast({ title: "No account found with these details", variant: "destructive" });
                    return;
                  }
                  setUserId(data.id);
                  await sendEmailOtp();
                }}
                disabled={!email || !mobile}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Identity"}
              </Button>
            </>
          )}

          {step === "email_otp" && (
            <>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
                <OTPInput value={emailOtp} onChange={setEmailOtp} />
              </div>
              <Button
                className="w-full"
                onClick={verifyEmailOtp}
                disabled={emailOtp.length !== 6 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Email OTP"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={sendEmailOtp} disabled={loading}>
                Resend Email OTP
              </Button>
            </>
          )}

          {step === "mobile_otp" && (
            <>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code sent to <strong>{mobile}</strong>
                </p>
                <OTPInput value={mobileOtp} onChange={setMobileOtp} />
              </div>
              <Button
                className="w-full"
                onClick={verifyMobileOtp}
                disabled={mobileOtp.length !== 6 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Mobile OTP"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={sendMobileOtp} disabled={loading}>
                Resend Mobile OTP
              </Button>
            </>
          )}

          {step === "reset_password" && (
            <ResetPasswordForm onSubmit={handleResetPassword} loading={loading} />
          )}

          <Button variant="ghost" className="w-full" onClick={() => navigate("/auth/principal")}>
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ResetPasswordForm({ onSubmit, loading }: { onSubmit: (pwd: string) => void; loading: boolean }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
        Identity verified. Set your new password.
      </div>

      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>

      <Button
        className="w-full"
        onClick={() => onSubmit(password)}
        disabled={!password || password !== confirm || loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
      </Button>
    </div>
  );
}