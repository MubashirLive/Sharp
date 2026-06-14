import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import { PIN_CONFIG } from "@/lib/auth-constants";
import { PINKeypad } from "@/components/auth/PINKeypad";

export default function ForcedPINSetup() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");

  const handlePinEnter = (enteredPin: string) => {
    setPin(enteredPin);
    setError("");
  };

  const handleNext = () => {
    if (pin.length !== PIN_CONFIG.LENGTH) {
      setError(`PIN must be ${PIN_CONFIG.LENGTH} digits`);
      return;
    }
    if (PIN_CONFIG.WEAK_PINS_BLOCKED.includes(pin)) {
      setError("Choose a stronger PIN");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleConfirmPin = (enteredPin: string) => {
    setConfirmPin(enteredPin);
    if (enteredPin.length === PIN_CONFIG.LENGTH) {
      if (enteredPin !== pin) {
        toast({ title: "PINs do not match", variant: "destructive" });
        setConfirmPin("");
        return;
      }
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { error: fnError } = await supabase.functions.invoke("set-pin", {
        body: { user_id: user.id, pin },
      });

      if (fnError || !fnError) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            must_change_pin: false,
            status: "active",
          })
          .eq("id", user.id);

        if (updateError) throw updateError;
      }

      toast({ title: "PIN set successfully" });
      navigate("/school", { replace: true });
    } catch {
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
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">Set Your PIN</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Create a 6-digit PIN to secure your account
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
              <PINKeypad
                value={pin}
                onChange={handlePinEnter}
                error={error}
              />

              <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground mb-2">PIN requirements:</p>
                <p className={pin.length === 6 ? "text-green-600" : ""}>
                  ✓ Exactly 6 digits
                </p>
                <p className={!PIN_CONFIG.WEAK_PINS_BLOCKED.includes(pin) && pin.length === 6 ? "text-green-600" : ""}>
                  ✓ Not a common pattern
                </p>
              </div>

              <Button
                className="w-full"
                onClick={handleNext}
                disabled={pin.length !== PIN_CONFIG.LENGTH}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-2">Re-enter your PIN to confirm</p>
                <PINKeypad
                  value={confirmPin}
                  onChange={handleConfirmPin}
                  error=""
                />
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Setting PIN...</span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}