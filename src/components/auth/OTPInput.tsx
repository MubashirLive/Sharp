import { useState, useRef, useEffect, useCallback } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { OTP_CONFIG } from "@/lib/auth-constants";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  onResend?: () => void;
  disabled?: boolean;
  expirySeconds?: number;
  error?: string | null;
}

export function OTPInput({
  length = OTP_CONFIG.LENGTH,
  onComplete,
  onResend,
  disabled,
  expirySeconds = OTP_CONFIG.EXPIRY_MINUTES * 60,
  error,
}: OTPInputProps) {
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(expirySeconds);
  const [canResend, setCanResend] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleComplete = useCallback((value: string) => {
    if (value.length === length && !disabled) {
      onComplete(value);
    }
  }, [length, disabled, onComplete]);

  const handleResend = () => {
    if (canResend && onResend) {
      onResend();
      setTimeLeft(expirySeconds);
      setCanResend(false);
      setOtp("");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <InputOTP
          ref={inputRef}
          maxLength={length}
          value={otp}
          onChange={setOtp}
          onComplete={handleComplete}
          disabled={disabled}
          render={({ slots }) => (
            <InputOTPGroup>
              {slots.map((slot, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className={error ? "border-destructive" : ""}
                />
              ))}
            </InputOTPGroup>
          )}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      {/* Timer / Resend */}
      <div className="text-center">
        {canResend ? (
          <Button
            type="button"
            variant="link"
            onClick={handleResend}
            disabled={disabled}
            className="text-sm"
          >
            Resend OTP
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Resend in {formatTime(timeLeft)}
          </p>
        )}
      </div>
    </div>
  );
}