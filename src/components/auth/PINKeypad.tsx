import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PIN_CONFIG } from "@/lib/auth-constants";

interface PINKeypadProps {
  onComplete: (pin: string) => void;
  onForgot?: () => void;
  disabled?: boolean;
  error?: string | null;
}

export function PINKeypad({ onComplete, onForgot, disabled, error }: PINKeypadProps) {
  const [pin, setPin] = useState<string>("");
  const [shake, setShake] = useState(false);

  const handleDigit = useCallback((digit: string) => {
    if (disabled || pin.length >= PIN_CONFIG.LENGTH) return;
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === PIN_CONFIG.LENGTH) {
      onComplete(newPin);
    }
  }, [pin, disabled, onComplete]);

  const handleBackspace = useCallback(() => {
    if (disabled) return;
    setPin((prev) => prev.slice(0, -1));
  }, [disabled]);

  const handleClear = useCallback(() => {
    if (disabled) return;
    setPin("");
  }, [disabled]);

  // Trigger shake animation on error
  if (error && pin.length > 0) {
    setShake(true);
    setPin("");
    setTimeout(() => setShake(false), 500);
  }

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

  return (
    <div className="space-y-4">
      {/* PIN dots display */}
      <div className="flex justify-center gap-3">
        {Array.from({ length: PIN_CONFIG.LENGTH }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all duration-200 ${
              i < pin.length
                ? "bg-primary scale-110"
                : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive text-center animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      {/* Keypad */}
      <div className={`grid grid-cols-3 gap-3 ${shake ? "animate-pulse" : ""}`}>
        {digits.map((digit) => {
          const isClear = digit === "C";
          const isBackspace = digit === "⌫";

          return (
            <Button
              key={digit}
              type="button"
              variant={isClear ? "ghost" : "outline"}
              className={`h-14 text-lg font-semibold ${
                isBackspace ? "text-muted-foreground" : ""
              }`}
              onClick={() => {
                if (isClear) {
                  handleClear();
                } else if (isBackspace) {
                  handleBackspace();
                } else {
                  handleDigit(digit);
                }
              }}
              disabled={disabled}
            >
              {digit}
            </Button>
          );
        })}
      </div>

      {/* Forgot PIN link */}
      {onForgot && (
        <div className="text-center">
          <button
            type="button"
            onClick={onForgot}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            disabled={disabled}
          >
            Forgot PIN?
          </button>
        </div>
      )}
    </div>
  );
}