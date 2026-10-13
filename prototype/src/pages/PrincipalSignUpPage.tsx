import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  QrCode,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  RefreshCw,
  Smartphone,
  Award,
  ChevronRight,
  Shield,
} from "lucide-react";
import schoolLogo from "../assets/ideal-logo.jpg";
import ThemeToggle from "../components/ThemeToggle";


interface PrincipalSignUpPageProps {
  onSwitchToTeacher?: () => void;
  onSwitchToPrincipalLogin?: () => void;
  onSwitchToPrincipalNewDevice?: () => void;
}

export default function PrincipalSignUpPage({
  onSwitchToTeacher,
  onSwitchToPrincipalLogin,
  onSwitchToPrincipalNewDevice,
}: PrincipalSignUpPageProps) {
  // Wizard steps: 1: Phone OTP -> 2: Email OTP -> 3: Set Password -> 4: Setup TOTP -> 5: Activated
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Pre-filled Invitation Data from SuperAdmin Activation Link
  const principalProfile = {
    name: "Dr. Meenakshi Sundaram",
    email: "principal@stxaviers.edu.in",
    maskedEmail: "p•••••••••l@stxaviers.edu.in",
    phone: "+91 98765 43210",
    maskedPhone: "+91 98765 ••••10",
    schoolName: "St. Xavier's Model School",
    schoolCode: "SXMS-DL",
    role: "Principal & Head of Institution",
  };

  // Step 1: Phone OTP
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneTimer, setPhoneTimer] = useState(45);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [step1Error, setStep1Error] = useState("");

  // Step 2: Email OTP
  const [emailOtp, setEmailOtp] = useState("");
  const [emailTimer, setEmailTimer] = useState(45);
  const [emailLoading, setEmailLoading] = useState(false);
  const [step2Error, setStep2Error] = useState("");

  // Step 3: Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step3Error, setStep3Error] = useState("");

  // Step 4: TOTP 2FA Setup
  const [totpVerifyCode, setTotpVerifyCode] = useState("");
  const [step4Error, setStep4Error] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [totpLoading, setTotpLoading] = useState(false);

  const mockSecretKey = "JBSWY3DPEHPK3PXP";

  // Phone OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (phoneTimer > 0) {
      interval = setInterval(() => setPhoneTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [phoneTimer]);

  // Email OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (currentStep === 2 && emailTimer > 0) {
      interval = setInterval(() => setEmailTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, emailTimer]);

  // Password strength calculation (8 chars, alphanumeric & special symbol)
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Za-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  };

  const passwordScore = getPasswordStrength();

  // Handle Step 1: Phone OTP Submit
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Error("");

    if (phoneOtp.length < 6) {
      setStep1Error("Please enter the 6-digit verification code sent via SMS.");
      return;
    }

    setPhoneLoading(true);
    setTimeout(() => {
      setPhoneLoading(false);
      if (phoneOtp === "123456" || phoneOtp.length === 6) {
        setCurrentStep(2);
      } else {
        setStep1Error("Invalid code. Enter 123456 for demo verification.");
      }
    }, 450);
  };

  // Handle Step 2: Email OTP Submit
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error("");

    if (emailOtp.length < 6) {
      setStep2Error("Please enter the 6-digit verification code sent to your email.");
      return;
    }

    setEmailLoading(true);
    setTimeout(() => {
      setEmailLoading(false);
      if (emailOtp === "123456" || emailOtp.length === 6) {
        setCurrentStep(3);
      } else {
        setStep2Error("Invalid code. Enter 123456 for demo verification.");
      }
    }, 450);
  };

  // Handle Step 3: Password Submit (8 characters with alphanumeric & special symbol)
  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep3Error("");

    if (password.length < 8) {
      setStep3Error("Password must be at least 8 characters long.");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setStep3Error("Password must include alphanumeric characters (letters and numbers).");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setStep3Error("Password must include at least one special symbol (e.g. @, #, $, %).");
      return;
    }

    if (password !== confirmPassword) {
      setStep3Error("Passwords do not match.");
      return;
    }

    setCurrentStep(4);
  };

  // Handle Step 4: TOTP Setup Submit
  const handleStep4Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep4Error("");

    if (totpVerifyCode.length < 6) {
      setStep4Error("Please enter the 6-digit code generated by your Authenticator app.");
      return;
    }

    setTotpLoading(true);
    setTimeout(() => {
      setTotpLoading(false);
      if (totpVerifyCode === "123456" || totpVerifyCode.length === 6) {
        setCurrentStep(5);
      } else {
        setStep4Error("Invalid authenticator code. Check your app and try again.");
      }
    }, 500);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(mockSecretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/25 to-teal-50/25 dark:from-slate-950 dark:via-indigo-950/20 dark:to-teal-950/20 flex flex-col items-center justify-center p-4 relative overflow-x-hidden text-slate-900 dark:text-slate-100">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* ════════════ TOP PORTAL SWITCHER & THEME TOGGLE ════════════ */}
      <div className="fixed top-5 left-5 z-30 flex items-center gap-2 flex-wrap">
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-full p-1 flex items-center shadow-xs flex-wrap gap-1">
          {onSwitchToTeacher && (
            <button
              type="button"
              onClick={onSwitchToTeacher}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Teacher's Login
            </button>
          )}

          {onSwitchToPrincipalLogin && (
            <button
              type="button"
              onClick={onSwitchToPrincipalLogin}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Principal Login
            </button>
          )}

          {onSwitchToPrincipalNewDevice && (
            <button
              type="button"
              onClick={onSwitchToPrincipalNewDevice}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Principal New Device Login
            </button>
          )}

          <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Principal Sign Up</span>
          </div>
        </div>

        <ThemeToggle variant="pill" />
      </div>

      {/* ════════════ MAIN ACTIVATION CARD ════════════ */}
      <div className="w-full max-w-lg mx-auto z-10 my-8">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-indigo-950/5 dark:shadow-indigo-950/30 p-6 sm:p-8 relative overflow-hidden">
          {/* Card Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3.5 flex items-center justify-center">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-indigo-500/25 to-blue-500/25 blur-md pointer-events-none" />
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white dark:bg-slate-100 p-1.5 ring-4 ring-white/90 dark:ring-slate-700 shadow-xl shadow-indigo-950/10 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105">
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain rounded-full mix-blend-multiply select-none"
                  draggable={false}
                />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Principal Sign Up</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Official Account Activation & Setup</p>
          </div>

          {/* Invitation Badge */}
          <div className="mb-6 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-xs">
            <div className="min-w-0 pr-2">
              <div className="font-bold text-slate-900 dark:text-white truncate">{principalProfile.name}</div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-400 truncate">
                {principalProfile.email}
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full shrink-0">
              Invited
            </span>
          </div>

          {/* Progress Stepper (1 -> 2 -> 3 -> 4) */}
          {currentStep < 5 && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                <span className={currentStep >= 1 ? "text-indigo-600 dark:text-indigo-400 font-bold" : ""}>
                  1. Phone
                </span>
                <span className={currentStep >= 2 ? "text-indigo-600 dark:text-indigo-400 font-bold" : ""}>
                  2. Email
                </span>
                <span className={currentStep >= 3 ? "text-indigo-600 dark:text-indigo-400 font-bold" : ""}>
                  3. Password
                </span>
                <span className={currentStep >= 4 ? "text-indigo-600 dark:text-indigo-400 font-bold" : ""}>
                  4. 2FA
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep >= 1 ? "bg-indigo-600 dark:bg-indigo-500 shadow-2xs" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep >= 2 ? "bg-indigo-600 dark:bg-indigo-500 shadow-2xs" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep >= 3 ? "bg-indigo-600 dark:bg-indigo-500 shadow-2xs" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    currentStep >= 4 ? "bg-indigo-600 dark:bg-indigo-500 shadow-2xs" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ════════════ STEP 1: Phone Ownership Verification (SMS OTP) ════════════ */}
            {currentStep === 1 && (
              <motion.form
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep1Submit}
                className="space-y-4"
              >
                <div className="bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Verify Registered Mobile Number</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    A 6-digit verification code was sent via SMS to <strong>{principalProfile.maskedPhone}</strong> to prove phone ownership.
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Enter 6-Digit SMS OTP
                    </label>
                    {phoneTimer > 0 ? (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Resend in {phoneTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPhoneTimer(45)}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
                      >
                        Resend SMS OTP
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => {
                      setPhoneOtp(e.target.value.replace(/\D/g, ""));
                      setStep1Error("");
                    }}
                    placeholder="••••••"
                    autoFocus
                    className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 font-mono text-center text-xl font-bold tracking-[0.35em] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-mono">
                    (Use <strong>123456</strong> for prototype demo)
                  </div>
                </div>

                {step1Error && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{step1Error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={phoneLoading || phoneOtp.length < 6}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {phoneLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify Mobile & Proceed to Email</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* ════════════ STEP 2: Email Verification (Email OTP) ════════════ */}
            {currentStep === 2 && (
              <motion.form
                key="step-2-email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep2Submit}
                className="space-y-4"
              >
                <div className="bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3.5 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Verify Administrative Email</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    A 6-digit confirmation code was dispatched to <strong>{principalProfile.email}</strong>.
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Enter 6-Digit Email OTP
                    </label>
                    {emailTimer > 0 ? (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        Resend in {emailTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEmailTimer(45)}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer"
                      >
                        Resend Email Code
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    maxLength={6}
                    value={emailOtp}
                    onChange={(e) => {
                      setEmailOtp(e.target.value.replace(/\D/g, ""));
                      setStep2Error("");
                    }}
                    placeholder="••••••"
                    autoFocus
                    className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 font-mono text-center text-xl font-bold tracking-[0.35em] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-mono">
                    (Use <strong>123456</strong> for prototype demo)
                  </div>
                </div>

                {step2Error && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{step2Error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={emailLoading || emailOtp.length < 6}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {emailLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Verify Email & Set Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* ════════════ STEP 3: Create Strong Password (8+ chars) ════════════ */}
            {currentStep === 3 && (
              <motion.form
                key="step-3-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep3Submit}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Create Administrator Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setStep3Error("");
                      }}
                      placeholder="Minimum 8 characters (letters, numbers & symbols)"
                      autoFocus
                      className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="space-y-1 pt-1">
                      <div className="grid grid-cols-4 gap-1">
                        <div
                          className={`h-1 rounded-full ${
                            passwordScore >= 1 ? "bg-red-500" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                        <div
                          className={`h-1 rounded-full ${
                            passwordScore >= 2 ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                        <div
                          className={`h-1 rounded-full ${
                            passwordScore >= 3 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                        <div
                          className={`h-1 rounded-full ${
                            passwordScore >= 4 ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-700"
                          }`}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                        <span>
                          {passwordScore === 4
                            ? "Strong password (alphanumeric + symbol ✓)"
                            : passwordScore >= 3
                            ? "Good (letters, numbers & symbols required)"
                            : "Minimum 8 characters with alphanumeric & special symbols"}
                        </span>
                        <span className="font-mono font-bold">
                          {password.length >= 8 ? "8+ Chars ✓" : `${password.length}/8`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setStep3Error("");
                      }}
                      placeholder="Re-enter password"
                      className="w-full pl-4 pr-11 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {step3Error && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{step3Error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={password.length < 8 || password !== confirmPassword}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Set Password & Proceed to 2FA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.form>
            )}

            {/* ════════════ STEP 4: Setup Mandatory Two-Factor (TOTP) ════════════ */}
            {currentStep === 4 && (
              <motion.form
                key="step-4-totp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleStep4Submit}
                className="space-y-4"
              >
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-center space-y-3">
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Scan with Authenticator App</span>
                  </div>

                  {/* Mock QR Code Visual */}
                  <div className="w-36 h-36 mx-auto bg-white dark:bg-slate-100 p-2.5 rounded-2xl flex flex-col items-center justify-center shadow-xs border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-slate-900 rounded-xl">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-xs ${
                            (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                              ? "bg-white"
                              : "bg-slate-900"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Secret Key with Copy */}
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-[11px] font-mono text-slate-800 dark:text-slate-200">
                    <span>Key: {mockSecretKey}</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1 hover:text-indigo-800 dark:hover:text-indigo-300 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                      title="Copy Secret"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm First TOTP Code */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Verify First 6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={totpVerifyCode}
                    onChange={(e) => {
                      setTotpVerifyCode(e.target.value.replace(/\D/g, ""));
                      setStep4Error("");
                    }}
                    placeholder="••••••"
                    className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 font-mono text-center text-xl font-bold tracking-[0.35em] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-mono">
                    (Use <strong>123456</strong> for prototype demo)
                  </div>
                </div>

                {step4Error && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{step4Error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={totpLoading || totpVerifyCode.length < 6}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {totpLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Finalize & Activate Account</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* ════════════ STEP 5: Activation Success Celebration ════════════ */}
            {currentStep === 5 && (
              <motion.div
                key="step-5-success"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-3 space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                  <ShieldCheck className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Successfully Activated!</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Welcome to SHARP Administration, {principalProfile.name}.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-left text-xs space-y-2">
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Security Profile Complete</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 font-mono pt-1">
                    <div><strong>Phone:</strong> Verified (SMS OTP)</div>
                    <div><strong>Email:</strong> Verified (Email OTP)</div>
                    <div><strong>Password:</strong> Argon2id Set</div>
                    <div><strong>2FA TOTP:</strong> Active & Synced</div>
                  </div>
                </div>

                {onSwitchToPrincipalLogin && (
                  <button
                    type="button"
                    onClick={onSwitchToPrincipalLogin}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Go to Principal Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
