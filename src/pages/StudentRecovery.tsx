import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Smartphone, User } from "lucide-react";
import { OTPInput } from "@/components/auth/OTPInput";
import { PINKeypad } from "@/components/auth/PINKeypad";

type Step = "identify" | "otp" | "set_pin";

export default function StudentRecovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("identify");
  const [appId, setAppId] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  const sendOtp = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      await supabase.functions.invoke("send-otp", {
        body: { user_id: userId, purpose: "recovery", mobile },
      });
      toast({ title: "OTP sent to registered mobile" });
      setStep("otp");
    } catch {
      toast({ title: "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!userId || otp.length !== 6) return;
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke("verify-otp", {
        body: { user_id: userId, code: otp, purpose: "recovery" },
      }) as { data: { success?: boolean; error?: string } };
      if (!data?.success) {
        toast({ title: data?.error || "Invalid OTP", variant: "destructive" });
        return;
      }
      setStep("set_pin");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPin = async () => {
    if (!userId || newPin.length !== 6) return;
    setLoading(true);
    try {
      await supabase.functions.invoke("set-pin", {
        body: { user_id: userId, pin: newPin },
      });
      await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", userId);
      toast({ title: "PIN reset successfully" });
      navigate("/auth/student");
    } catch {
      toast({ title: "Failed to reset PIN", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Recover Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Student recovery via App ID + mobile OTP
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === "identify" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="appId">App ID</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="appId"
                    placeholder="SHARP-2026-123456"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Find this on your admission letter or ID card</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Registered Mobile</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="+91 parent mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={async () => {
                  const { data } = await supabase
                    .from("profiles")
                    .select("id, mobile")
                    .eq("app_id", appId)
                    .eq("mobile", mobile)
                    .eq("role", "student")
                    .single();
                  if (!data) {
                    toast({ title: "No student account found with these details", variant: "destructive" });
                    return;
                  }
                  setUserId(data.id);
                  await sendOtp();
                }}
                disabled={!appId || !mobile || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter the 6-digit code sent to <strong>{mobile}</strong>
                </p>
                <OTPInput value={otp} onChange={setOtp} />
              </div>
              <Button
                className="w-full"
                onClick={verifyOtp}
                disabled={otp.length !== 6 || loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify OTP"}
              </Button>
              <Button variant="ghost" className="w-full" onClick={sendOtp} disabled={loading}>
                Resend OTP
              </Button>
            </>
          )}

          {step === "set_pin" && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 text-center mb-4">
                Identity verified. Set your new 6-digit PIN.
              </div>
              <div className="flex justify-center">
                <PINKeypad
                  value={newPin}
                  onChange={(pin) => {
                    setNewPin(pin);
                    if (pin.length === 6) handleSetPin();
                  }}
                  error=""
                />
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Setting PIN...</span>
                </div>
              )}
            </>
          )}

          <Button variant="ghost" className="w-full" onClick={() => navigate("/auth/student")}>
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}