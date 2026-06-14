import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { ProfileCard } from "./ProfileCard";
import { PINKeypad } from "./PINKeypad";
import { OTPInput } from "./OTPInput";
import { MobileIDToggle } from "./MobileIDToggle";
import { AUTH_STORAGE_KEYS, LOCKOUT_CONFIG } from "@/lib/auth-constants";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Staff = Tables<"staffs">;
type Student = Tables<"students">;

interface StaffProfile {
  profile: Profile;
  staff: Staff;
}

interface StudentProfile {
  profile: Profile;
  student: Student;
}

interface Props {
  schoolId: string;
  schoolName: string;
  schoolLogo: string | null;
  role: "staff" | "student";
}

type LoginPhase = "identifier" | "profile" | "otp" | "pin" | "pin_setup";

export function StaffLoginForm({ schoolId, schoolName, schoolLogo, role }: Props) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<LoginPhase>("identifier");
  const [inputMode, setInputMode] = useState<"mobile" | "id">("mobile");
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleIdentifierSubmit = async () => {
    if (!identifier.trim()) return;

    setLoading(true);
    setPinError(null);

    try {
      // Search by mobile or staff ID
      let profileQuery = supabase
        .from("profiles")
        .select("*")
        .eq("school_id", schoolId)
        .eq("role", role === "staff" ? "!=" : "student", role === "staff" ? "student" : "!=");

      if (inputMode === "mobile") {
        profileQuery = profileQuery.or(`mobile.eq.${identifier},login_mobile.eq.${identifier}`);
      } else {
        // Search in staffs/students table by employee_id/student roll_no
        profileQuery = profileQuery.eq("mobile", identifier);
      }

      const { data: profile, error: profileError } = await profileQuery.maybeSingle();

      if (profileError || !profile) {
        toast({
          title: inputMode === "mobile" ? "Wrong number" : "ID not found",
          description: inputMode === "mobile"
            ? "This mobile number is not registered for this school."
            : "This ID does not exist.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Fetch additional data based on role
      if (role === "staff") {
        const { data: staff } = await supabase
          .from("staffs")
          .select("*")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (!staff) {
          toast({ title: "Staff record not found", variant: "destructive" });
          setLoading(false);
          return;
        }

        setStaffProfile({ profile, staff });
      } else {
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("profile_id", profile.id)
          .maybeSingle();

        if (!student) {
          toast({ title: "Student record not found", variant: "destructive" });
          setLoading(false);
          return;
        }

        setStudentProfile({ profile, student });
      }

      // Check if PIN is set
      if (!profile.pin_hash) {
        // First time - needs OTP verification
        setPhase("otp");
      } else {
        // Has PIN - show profile and PIN entry
        setPhase("profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (otp: string) => {
    setLoading(true);
    setOtpError(null);

    try {
      // Verify OTP via edge function
      const { data, error } = await supabase.rpc("verify_otp", {
        p_user_id: staffProfile?.profile.id || studentProfile?.profile.id,
        p_code: otp,
        p_purpose: "setup",
      });

      if (error || !data?.success) {
        setOtpError(data?.error || "Invalid OTP");
        return;
      }

      // OTP verified - proceed to PIN setup
      setPhase("pin_setup");
    } catch (error) {
      console.error("OTP verify error:", error);
      setOtpError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePINSubmit = async (pin: string) => {
    setLoading(true);
    setPinError(null);

    const profileId = staffProfile?.profile.id || studentProfile?.profile.id;

    try {
      // Verify PIN via edge function (PBKDF2 server-side)
      const { data, error } = await supabase.functions.invoke("verify-pin", {
        body: { user_id: profileId, pin },
      });

      if (error || !data?.success) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= LOCKOUT_CONFIG.MAX_PIN_ATTEMPTS) {
          // Lock account
          await supabase
            .from("profiles")
            .update({ status: "locked" })
            .eq("id", profileId);

          toast({ title: "Account locked", description: "Too many failed attempts. Contact your admin.", variant: "destructive" });
          navigate("/auth/staff");
          return;
        }

        setPinError(`Incorrect PIN. ${LOCKOUT_CONFIG.MAX_PIN_ATTEMPTS - newAttempts} attempts remaining.`);
        return;
      }

      // PIN verified - save to localStorage and navigate
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_USER_ID, profileId!);
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ROLE, role);
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_USER_NAME, staffProfile?.profile.full_name || studentProfile?.profile.full_name || "");

      navigate("/school", { replace: true });
    } catch (error) {
      console.error("PIN verify error:", error);
      setPinError("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePINSetup = async (pin: string) => {
    setLoading(true);

    const profileId = staffProfile?.profile.id || studentProfile?.profile.id;

    try {
      // Hash PIN via server-side edge function
      const { data: pinResult, error } = await supabase.functions.invoke("set-pin", {
        body: { user_id: profileId, pin },
      });

      if (error || !pinResult?.success) {
        throw new Error(pinResult?.error || error?.message || "PIN setup failed");
      }

      if (error) throw error;

      // Save to localStorage
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_USER_ID, profileId!);
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ROLE, role);
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_USER_NAME, staffProfile?.profile.full_name || studentProfile?.profile.full_name || "");

      toast({ title: "PIN set successfully" });
      navigate("/school", { replace: true });
    } catch (error) {
      console.error("PIN setup error:", error);
      toast({ title: "Failed to set PIN", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const renderPhase = () => {
    switch (phase) {
      case "identifier":
        return (
          <div className="space-y-4">
            <MobileIDToggle value={inputMode} onChange={setInputMode} />

            <Input
              type={inputMode === "mobile" ? "tel" : "text"}
              placeholder={inputMode === "mobile" ? "Enter mobile number" : "Enter App ID"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="login-input"
              maxLength={inputMode === "mobile" ? 10 : 20}
            />

            <Button
              className="w-full login-btn login-btn-primary"
              onClick={handleIdentifierSubmit}
              disabled={loading || !identifier.trim()}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </div>
        );

      case "otp":
        return (
          <div className="space-y-4">
            <OTPInput
              onComplete={handleOTPVerify}
              error={otpError}
              disabled={loading}
              onResend={() => {
                // TODO: Trigger OTP resend via edge function
              }}
            />
          </div>
        );

      case "profile":
        return (
          <div className="space-y-6">
            <ProfileCard
              name={staffProfile?.profile.full_name || studentProfile?.profile.full_name || ""}
              appId={staffProfile?.staff.employee_id || studentProfile?.student.roll_no || ""}
              photoUrl={staffProfile?.staff.photo_url || undefined}
              tag={staffProfile?.staff.designation || undefined}
              role={role}
            />

            <PINKeypad
              onComplete={handlePINSubmit}
              disabled={loading}
              error={pinError}
              onForgot={() => {
                // TODO: Navigate to recovery flow
              }}
            />
          </div>
        );

      case "pin_setup":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Set Your PIN</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create a 6-digit PIN for quick login
              </p>
            </div>

            <PINKeypad
              onComplete={handlePINSetup}
              disabled={loading}
              error={null}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {phase === "profile" && (
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">Enter your PIN to sign in</p>
        </div>
      )}
      {renderPhase()}
    </div>
  );
}
