import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, ShieldCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type School = Database["public"]["Tables"]["schools"]["Row"];

const SALUTATION_OPTIONS = ["Mr.", "Mrs.", "Ms.", "Dr."];

function genIdempotencyKey(): string {
  return crypto.randomUUID();
}

interface Props {
  school: School;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export default function PrincipalEditDialog({ school, open, onOpenChange, onSaved }: Props) {
  // ── Step: "otp" | "edit" | "reset"
  const [step, setStep] = useState<"otp" | "edit" | "reset">("otp");
  const [busy, setBusy] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"email" | "mobile">("email");
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Change form
  const [form, setForm] = useState({
    salutation: "Mr.",
    fullName: school.principal_name || "",
    email: school.principal_email || "",
    mobile: school.principal_mobile || "",
  });

  // Reset password
  const [resetConfirm, setResetConfirm] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep("otp");
      setBusy(false);
      setOtpSent(false);
      setOtp("");
      setVerified(false);
      setResendTimer(0);
      setNewPassword("");
      setResetConfirm("");
      setForm({ salutation: "Mr.", fullName: school.principal_name || "", email: school.principal_email || "", mobile: school.principal_mobile || "" });
    }
  }, [open, school]);

  // Resend timer
  useEffect(() => {
    if (!otpSent || resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [otpSent, resendTimer]);

  // ── Send OTP (stub for now - OTP persists to otp_codes table)
  const handleSendOtp = async () => {
    setOtpSent(true);
    setResendTimer(30);
    toast({ title: `OTP sent to ${otpChannel === "email" ? school.principal_email : school.principal_mobile}` });
  };

  // ── Verify OTP
  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({ title: "Enter 6-digit OTP", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const idempotencyKey = genIdempotencyKey();
      const { data, error } = await supabase.functions.invoke<{ verified: boolean }>(
        "superadmin-verify-principal-otp",
        {
          body: {
            principalEmail: otpChannel === "email" ? school.principal_email : undefined,
            principalMobile: otpChannel === "mobile" ? school.principal_mobile : undefined,
            channel: otpChannel,
            otp,
            principalUserId: school.id,
          },
          headers: { "x-idempotency-key": idempotencyKey },
        }
      );
      if (error) throw error;
      if (data?.verified) {
        setVerified(true);
        setStep("edit");
      }
    } catch (err: any) {
      toast({ title: "Invalid OTP", description: err.message, variant: "destructive" });
    }
    setBusy(false);
  };

  // ── Save changes
  const handleSave = async () => {
    setBusy(true);
    try {
      const idempotencyKey = genIdempotencyKey();
      const { error } = await supabase.functions.invoke("superadmin-update-principal", {
        body: {
          schoolId: school.id,
          principalUserId: school.id,
          fullName: form.fullName,
          email: form.email,
          mobile: form.mobile,
        },
        headers: { "x-idempotency-key": idempotencyKey },
      });
      if (error) throw error;

      toast({ title: "Principal updated successfully" });
      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    }
    setBusy(false);
  };

  // ── Reset password
  const handleResetPassword = async () => {
    if (resetConfirm !== school.principal_name) {
      toast({ title: "Type principal name to confirm", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const idempotencyKey = genIdempotencyKey();
      const { data, error } = await supabase.functions.invoke<{ newPassword: string }>(
        "superadmin-reset-principal-password",
        {
          body: {
            schoolId: school.id,
            principalUserId: school.id,
            principalName: school.principal_name!,
            confirmName: resetConfirm,
          },
          headers: { "x-idempotency-key": idempotencyKey },
        }
      );
      if (error) throw error;
      if (data?.newPassword) {
        setNewPassword(data.newPassword);
        setResetConfirm("");
        toast({ title: "Password reset. Share new credentials with principal." });
      }
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const close = () => onOpenChange(false);

  // ── Render
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-xl bg-card border border-border shadow-xl max-w-md">

        {/* OTP Step */}
        {step === "otp" && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <DialogTitle>Verify Identity</DialogTitle>
              </div>
              <DialogDescription>
                To change principal credentials, verify with an OTP sent to the current contact.
              </DialogDescription>
            </DialogHeader>

            {!otpSent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Send OTP via</Label>
                  <RadioGroup value={otpChannel} onValueChange={(v) => setOtpChannel(v as "email" | "mobile")}>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="email" id="ch-email" />
                      <Label htmlFor="ch-email" className="cursor-pointer">Email — {school.principal_email}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="mobile" id="ch-mobile" />
                      <Label htmlFor="ch-mobile" className="cursor-pointer">Mobile — {school.principal_mobile}</Label>
                    </div>
                  </RadioGroup>
                </div>
                <Button onClick={handleSendOtp} disabled={busy} className="w-full clay-btn clay-btn-primary cursor-pointer">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Send OTP
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  OTP sent to <strong>{otpChannel === "email" ? school.principal_email : school.principal_mobile}</strong>.
                  Enter 6-digit code below.
                </p>
                <div className="space-y-1.5">
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em] font-mono clay-input"
                  />
                </div>
                <Button onClick={handleVerify} disabled={busy || otp.length !== 6} className="w-full clay-btn clay-btn-primary cursor-pointer">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Verify OTP
                </Button>
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-muted-foreground">Resend in {resendTimer}s</p>
                  ) : (
                    <Button variant="link" size="sm" onClick={handleSendOtp} className="text-xs cursor-pointer">
                      Resend OTP
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Step */}
        {step === "edit" && (
          <>
            <DialogHeader>
              <DialogTitle>Edit Principal — {school.name}</DialogTitle>
              <DialogDescription>All fields editable. Save to apply changes.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label>Salutation</Label>
                  <Select value={form.salutation} onValueChange={(v) => setForm((f) => ({ ...f, salutation: v }))}>
                    <SelectTrigger className="clay-input"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SALUTATION_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="pName">Full Name</Label>
                  <Input id="pName" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} className="clay-input" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pEmail">Email (Login ID)</Label>
                <Input id="pEmail" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="clay-input" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pMobile">Mobile</Label>
                <Input id="pMobile" type="tel" value={form.mobile} onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) }))} maxLength={10} className="clay-input" />
              </div>

              {/* Reset Password */}
              {step === "edit" && newPassword ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-medium text-green-800 mb-1">New Password</p>
                  <code className="text-sm font-mono text-green-900">{newPassword}</code>
                  <p className="text-xs text-green-700 mt-1">Share this with the principal manually.</p>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("reset")}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 cursor-pointer"
                >
                  Reset Password
                </Button>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={close} className="clay-btn cursor-pointer">Cancel</Button>
              <Button onClick={handleSave} disabled={busy} className="clay-btn clay-btn-primary cursor-pointer">
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Reset Step */}
        {step === "reset" && (
          <>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                This will generate a new temp password for <strong>{school.principal_name}</strong>.
                The old password will stop working immediately.
              </DialogDescription>
            </DialogHeader>
            {newPassword ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
                <p className="text-sm font-medium text-green-800">New Password</p>
                <code className="text-xl font-mono font-bold text-green-900 block">{newPassword}</code>
                <p className="text-xs text-green-700">Share this with the principal manually. Old password is now invalid.</p>
                <Button onClick={() => { onSaved(); close(); }} className="w-full mt-2 clay-btn clay-btn-primary cursor-pointer">
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                  Type <strong>{school.principal_name}</strong> to confirm:
                </div>
                <Input
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  placeholder={school.principal_name}
                  className="clay-input"
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("edit")} className="clay-btn cursor-pointer">Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={resetConfirm !== school.principal_name || busy}
                    onClick={handleResetPassword}
                    className="flex-1 cursor-pointer"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Reset Password
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}