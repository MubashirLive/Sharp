import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Clock,
  Search,
  Users,
  X,
  UserCheck,
  UserX,
  Sparkles,
  KeyRound,
  QrCode,
  Smartphone,
  HelpCircle,
  Building2,
  Award,
  Laptop,
  GraduationCap,
  Calendar,
  LogOut,
  MapPin,
  Check,
  Settings,
  BookOpen,
  Layers,
  ChevronUp,
  ArrowLeft,
  School,
  Home,
  Zap,
} from "lucide-react";
import MySchoolSubjectTab from "../components/MySchoolSubjectTab";
import TimetablePage from "./TimetablePage";
import Timetable2Page from "./Timetable2Page";
import Timetable3Page from "./Timetable3Page";
import schoolLogo from "../assets/ideal-logo.jpg";
import ThemeToggle from "../components/ThemeToggle";


// Mock Principal database for St. Xavier's Model School
const MOCK_PRINCIPALS: Record<
  string,
  {
    id: string;
    fullName: string;
    email: string;
    roleTitle: string;
    schoolName: string;
    schoolCode: string;
    schoolCity: string;
    schoolAddress: string;
    affiliationNo: string;
    totalStudents: string;
    totalFaculty: string;
    academicYear: string;
    avatarColor: string;
    initials: string;
    validPassword: string;
    validTotp: string;
  }
> = {
  "principal@stxaviers.edu.in": {
    id: "prin_001",
    fullName: "Dr. Meenakshi Sundaram",
    email: "principal@stxaviers.edu.in",
    roleTitle: "Principal & Head of Institution",
    schoolName: "St. Xavier's Model School",
    schoolCode: "SXMS-DL",
    schoolCity: "New Delhi",
    schoolAddress: "Sector 14, Rohini, New Delhi, Delhi 110085",
    affiliationNo: "CBSE/AFF/2130842",
    totalStudents: "1,420",
    totalFaculty: "84",
    academicYear: "2026–2027",
    avatarColor: "bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md shadow-indigo-500/20",
    initials: "MS",
    validPassword: "password123",
    validTotp: "123456",
  },
  "director@stxaviers.edu.in": {
    id: "prin_002",
    fullName: "Rev. Fr. Augustine D'Souza",
    email: "director@stxaviers.edu.in",
    roleTitle: "Director of Academics",
    schoolName: "St. Xavier's Model School",
    schoolCode: "SXMS-DL",
    schoolCity: "New Delhi",
    schoolAddress: "Sector 14, Rohini, New Delhi, Delhi 110085",
    affiliationNo: "CBSE/AFF/2130842",
    totalStudents: "1,420",
    totalFaculty: "84",
    academicYear: "2026–2027",
    avatarColor: "bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-md shadow-slate-700/20",
    initials: "AD",
    validPassword: "password123",
    validTotp: "123456",
  },
};

interface PrincipalLoginPageProps {
  onSwitchToTeacher?: () => void;
  onSwitchToPrincipalLogin?: () => void;
  onSwitchToPrincipalNewDevice?: () => void;
  onSwitchToPrincipalSignUp?: () => void;
  isNewDeviceMode?: boolean;
}

export default function PrincipalLoginPage({
  onSwitchToTeacher,
  onSwitchToPrincipalLogin,
  onSwitchToPrincipalNewDevice,
  onSwitchToPrincipalSignUp,
  isNewDeviceMode = false,
}: PrincipalLoginPageProps) {
  // Main Login State
  const [email, setEmail] = useState("principal@stxaviers.edu.in");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Account Existence State
  const [userStatus, setUserStatus] = useState<"idle" | "checking" | "exists" | "not_found">("exists");
  const [matchedPrincipal, setMatchedPrincipal] = useState<any>(MOCK_PRINCIPALS["principal@stxaviers.edu.in"]);

  // Two-Factor Authentication (TOTP) State
  const [step, setStep] = useState<"credentials" | "totp_2fa">("credentials");
  const [totpCode, setTotpCode] = useState("");
  const [totpError, setTotpError] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);
  const [totpCountdown, setTotpCountdown] = useState(30);

  // Authenticated State -> When true, enters dashboard/workspace
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<"dashboard" | "my_school_full" | "timetable" | "timetable_2" | "timetable_3">("dashboard");
  const [activeSchoolTab, setActiveSchoolTab] = useState<
    "profile" | "classes" | "sessions" | "subjects" | "wings" | "houses" | "departments"
  >("subjects");

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Reset step if mode switches
  useEffect(() => {
    setStep("credentials");
    setIsAuthenticated(false);
    setErrorMsg("");
    setTotpError("");
    setCurrentScreen("dashboard");
  }, [isNewDeviceMode]);

  // Real-time Email check
  useEffect(() => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.includes("@") && cleanEmail.includes(".")) {
      setUserStatus("checking");
      const timer = setTimeout(() => {
        const principal = MOCK_PRINCIPALS[cleanEmail];
        if (principal) {
          setUserStatus("exists");
          setMatchedPrincipal(principal);
        } else {
          setUserStatus("not_found");
          setMatchedPrincipal(null);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setUserStatus("idle");
      setMatchedPrincipal(null);
    }
  }, [email]);

  // TOTP refresh tick simulation
  useEffect(() => {
    if (step === "totp_2fa") {
      const interval = setInterval(() => {
        setTotpCountdown((c) => (c > 1 ? c - 1 : 30));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Handle Step 1: Password Submission
  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid administrative email address.");
      return;
    }

    if (!matchedPrincipal) {
      setErrorMsg("No principal account found with this email. Please check your credentials.");
      return;
    }

    if (!password || password.length < 8) {
      setErrorMsg("Please enter your administrator password.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (password === matchedPrincipal.validPassword || password === "password123") {
        if (isNewDeviceMode) {
          // New device mode: requires TOTP 2FA
          setStep("totp_2fa");
          setTotpCode("");
          setTotpError("");
        } else {
          // Trusted daily device mode: enters dashboard directly
          setIsAuthenticated(true);
          setCurrentScreen("dashboard");
        }
      } else {
        setErrorMsg("Incorrect password. Please verify and try again.");
      }
    }, 450);
  };

  // Handle Step 2: TOTP 2FA Verification
  const handleTotpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError("");

    if (totpCode.length < 6) {
      setTotpError("Please enter the 6-digit authenticator code.");
      return;
    }

    setTotpLoading(true);

    setTimeout(() => {
      setTotpLoading(false);
      const validTotp = matchedPrincipal?.validTotp || "123456";

      if (totpCode === validTotp || totpCode === "123456") {
        setIsAuthenticated(true);
        setCurrentScreen("dashboard");
      } else {
        setTotpError("Invalid authenticator code. Enter 123456 for demo.");
        setTotpCode("");
      }
    }, 450);
  };

  // Forgot Password handler
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotEmail.includes("@")) {
      setForgotSent(true);
    }
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setStep("credentials");
    setPassword("password123");
    setTotpCode("");
    setErrorMsg("");
    setTotpError("");
    setForgotSent(false);
    setIsForgotModalOpen(false);
    setCurrentScreen("dashboard");
  };

  // ══════════════════════════════════════════════════════════════════
  // ══════════════════════════════════════════════════════════════════
  // IF AUTHENTICATED: DASHBOARD / MY SCHOOL / TIMETABLE
  // ══════════════════════════════════════════════════════════════════
  if (isAuthenticated) {
    const user = matchedPrincipal || MOCK_PRINCIPALS["principal@stxaviers.edu.in"];

    // ── 1. TIMETABLE FULL PAGE ──
    if (currentScreen === "timetable") {
      return (
        <TimetablePage
          user={user}
          onBackToDashboard={() => setCurrentScreen("dashboard")}
          onOpenMySchool={() => setCurrentScreen("my_school_full")}
          onOpenTimetable2={() => setCurrentScreen("timetable_2")}
          onOpenTimetable3={() => setCurrentScreen("timetable_3")}
          onSignOut={handleSignOut}
        />
      );
    }

    // ── 2. TIMETABLE 2 FULL PAGE (EXPERIMENTAL UI/UX SANDBOX) ──
    if (currentScreen === "timetable_2") {
      return (
        <Timetable2Page
          user={user}
          onBackToDashboard={() => setCurrentScreen("dashboard")}
          onOpenMySchool={() => setCurrentScreen("my_school_full")}
          onOpenTimetable1={() => setCurrentScreen("timetable")}
          onOpenTimetable3={() => setCurrentScreen("timetable_3")}
          onSignOut={handleSignOut}
        />
      );
    }

    // ── 3. TIMETABLE 3 FULL PAGE (INTERACTIVE STUDIO SANDBOX) ──
    if (currentScreen === "timetable_3") {
      return (
        <Timetable3Page
          user={user}
          onBackToDashboard={() => setCurrentScreen("dashboard")}
          onOpenMySchool={() => setCurrentScreen("my_school_full")}
          onOpenTimetable1={() => setCurrentScreen("timetable")}
          onOpenTimetable2={() => setCurrentScreen("timetable_2")}
          onSignOut={handleSignOut}
        />
      );
    }

    // ── 4. FULL SCREEN "MY SCHOOL" PAGE (WITH DIRECT SWITCH TO TIMETABLES / DASHBOARD) ──
    if (currentScreen === "my_school_full") {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
          {/* Top Header */}
          <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3 shadow-2xs">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCurrentScreen("dashboard")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen("timetable")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200 dark:border-violet-800 transition-all cursor-pointer shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Time Table</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen("timetable_2")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Time Table 2</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen("timetable_3")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800 transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Time Table 3</span>
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-100 p-0.5 ring-1 ring-slate-200/90 dark:ring-slate-700 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                    <img
                      src={schoolLogo}
                      alt="School Logo"
                      className="w-full h-full object-contain rounded-full mix-blend-multiply"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{user.schoolName}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                        {user.schoolCode}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Profile, Theme Toggle & Sign Out */}
              <div className="flex items-center gap-2.5">
                <ThemeToggle variant="icon" />

                <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className={`w-7 h-7 rounded-lg ${user.avatarColor} flex items-center justify-center font-bold text-xs`}>
                    {user.initials}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user.fullName}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-tight font-medium">{user.roleTitle}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-800 dark:hover:text-rose-200 transition-all cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </header>

          {/* Full Screen Page Content - Maximized Space */}
          <main className="flex-1 w-full mx-auto p-2 sm:p-4 bg-slate-50 dark:bg-slate-950">
            <MySchoolSubjectTab />
          </main>
        </div>
      );
    }

    // ── 3. MAIN DASHBOARD SCREEN (DEFAULT LANDING SCREEN WHERE MY SCHOOL & TIME TABLE LIE) ──
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-blue-50/20 dark:from-slate-950 dark:via-indigo-950/20 dark:to-blue-950/20 text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-hidden">
        {/* Background Ambience */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Top Navbar */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3.5 shadow-2xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-100 p-0.5 ring-1 ring-slate-200/90 dark:ring-slate-700 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain rounded-full mix-blend-multiply"
                />
              </div>
              <div>
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                  SHARP Administration
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                  {user.schoolCode}
                </span>
              </div>
            </div>

            {/* Middle Quick Links */}
            <div className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setCurrentScreen("dashboard")}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs cursor-pointer"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen("my_school_full")}
                className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                My School
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen("timetable")}
                className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Time Table
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen("timetable_2")}
                className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Time Table 2
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen("timetable_3")}
                className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Time Table 3
              </button>
            </div>

            {/* Right Profile, Theme Toggle & Sign Out */}
            <div className="flex items-center gap-2.5">
              <ThemeToggle variant="icon" />

              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className={`w-7 h-7 rounded-lg ${user.avatarColor} flex items-center justify-center font-bold text-xs`}>
                  {user.initials}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user.fullName}</div>
                  <div className="text-[10px] text-indigo-600 dark:text-indigo-400 leading-tight font-medium">{user.roleTitle}</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-800 dark:hover:text-rose-200 transition-all cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Screen: ONLY 4 items: My School, Time Table, Time Table 2, Time Table 3 */}
        <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
          <div className="w-full space-y-6 my-auto py-6">
            <div className="text-center sm:text-left space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Administrative Workspaces • {user.schoolName}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Institutional Portals
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Select a workspace to configure school structures, manage operational timetables, or explore prototype studios.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* ── CARD 1: MY SCHOOL ── */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setCurrentScreen("my_school_full")}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-950/5 dark:hover:shadow-black/40 shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300">
                      {user.schoolCode}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center gap-2">
                      <span>My School</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Manage institutional departments, academic wings, curriculum subject matrix, and faculty allocations.
                    </p>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      12 Wings
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      48 Subjects
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      84 Faculty
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Open My School</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* ── CARD 2: TIME TABLE ── */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setCurrentScreen("timetable")}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-xl hover:shadow-violet-950/5 dark:hover:shadow-black/40 shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 group-hover:scale-105 transition-transform">
                      <Clock className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Term 1 Active</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex items-center gap-2">
                      <span>Time Table</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Design, visualize, and optimize class period timings, faculty subject assignments, and clash audits.
                    </p>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Weekly Grid Matrix
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      10 Periods/Day
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Draft Revisions
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-violet-600 dark:text-violet-400">
                  <span>Open Time Table</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* ── CARD 3: TIME TABLE 2 (PROTOTYPE UI/UX) ── */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setCurrentScreen("timetable_2")}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-950/5 dark:hover:shadow-black/40 shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Sandbox v2</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      <span>Time Table 2</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Multi-view canvas sandbox for testing period grid paradigms, timeline views, and faculty allocators.
                    </p>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Multi-View Canvas
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Bell Timeline
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Faculty Allocator
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Open Time Table 2</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>

              {/* ── CARD 4: TIME TABLE 3 (INTERACTIVE STUDIO) ── */}
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => setCurrentScreen("timetable_3")}
                className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-xl hover:shadow-amber-950/5 dark:hover:shadow-black/40 shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25 group-hover:scale-105 transition-transform">
                      <Zap className="w-7 h-7" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span>Studio Studio</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      <span>Time Table 3</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Interactive timetable studio with color-coded subject assignment palette, educator load quotas, and slot details.
                    </p>
                  </div>

                  {/* Feature Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Subject Palette
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Educator Quota
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Fast Reassign
                    </span>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                  <span>Open Time Table 3</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // LOGIN FORM SCREEN (CREDENTIALS / 2FA PROMPT)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/25 to-teal-50/25 dark:from-slate-950 dark:via-indigo-950/20 dark:to-teal-950/20 flex flex-col items-center justify-center p-4 relative overflow-x-hidden text-slate-900 dark:text-slate-100">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* ════════════ TOP PORTAL SWITCHER (4 Scenarios) & THEME TOGGLE ════════════ */}
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

          {!isNewDeviceMode ? (
            <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Principal Login</span>
            </div>
          ) : (
            onSwitchToPrincipalLogin && (
              <button
                type="button"
                onClick={onSwitchToPrincipalLogin}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Principal Login
              </button>
            )
          )}

          {isNewDeviceMode ? (
            <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" />
              <span>Principal New Device Login</span>
            </div>
          ) : (
            onSwitchToPrincipalNewDevice && (
              <button
                type="button"
                onClick={onSwitchToPrincipalNewDevice}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Principal New Device Login
              </button>
            )
          )}

          {onSwitchToPrincipalSignUp && (
            <button
              type="button"
              onClick={onSwitchToPrincipalSignUp}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Principal Sign Up
            </button>
          )}
        </div>

        <ThemeToggle variant="pill" />
      </div>

      {/* ════════════ MAIN CENTERED PRINCIPAL LOGIN CARD ════════════ */}
      <div className="w-full max-w-md mx-auto z-10 my-6">
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
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isNewDeviceMode ? "Principal New Device Login" : "Principal's Login"}
            </h1>
            {isNewDeviceMode && (
              <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 px-2.5 py-0.5 rounded-full mt-1.5">
                New Device · 2FA Verification Required
              </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {step === "totp_2fa" ? (
              /* ════════════ VIEW 2: Two-Factor Authentication (TOTP) Prompt ════════════ */
              <motion.div
                key="view-totp-prompt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-3.5 text-left flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      New device detected. Enter the 6-digit code from your Authenticator app (Google
                      Authenticator or 1Password).
                    </p>
                  </div>
                </div>

                <form onSubmit={handleTotpSubmit} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        6-Digit TOTP Code
                      </label>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                        Refreshes in {totpCountdown}s
                      </span>
                    </div>

                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => {
                        setTotpCode(e.target.value.replace(/\D/g, ""));
                        setTotpError("");
                      }}
                      placeholder="••••••"
                      autoFocus
                      className="w-full py-3 px-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 font-mono text-center text-xl font-bold tracking-[0.35em] focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 text-center font-mono">
                      (Use <strong>123456</strong> for prototype demo)
                    </div>
                  </div>

                  {/* Stay Signed In Checkbox */}
                  <div className="flex items-center px-1">
                    <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={trustDevice}
                        onChange={(e) => setTrustDevice(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      />
                      <span>Stay signed in on this device</span>
                    </label>
                  </div>

                  {/* Error Message */}
                  {totpError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>{totpError}</span>
                    </div>
                  )}

                  {/* Verify TOTP Button */}
                  <button
                    type="submit"
                    disabled={totpLoading || totpCode.length < 6}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {totpLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Verify & Access Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("credentials");
                      setTotpError("");
                    }}
                    className="w-full py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    ← Back to Email & Password
                  </button>
                </form>
              </motion.div>
            ) : (
              /* ════════════ VIEW 3: Step 1 Credentials Form (Email + Password) ════════════ */
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Email
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>

                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMsg("");
                      }}
                      placeholder="principal@school.edu.in"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      autoFocus
                    />
                  </div>

                  {/* Real-time User Existence Confirmation Badge */}
                  <div className="pt-1.5 min-h-[22px]">
                    {userStatus === "checking" && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
                        <span>Verifying administrative record...</span>
                      </div>
                    )}

                    {userStatus === "exists" && (
                      <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Account exist</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">Authorized</span>
                      </div>
                    )}

                    {userStatus === "not_found" && (
                      <div className="text-[11px] text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                        <UserX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>No administrator record found with this email.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Password Field with Inside Eye Button */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setIsForgotModalOpen(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>

                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg("");
                      }}
                      placeholder="Enter administrator password"
                      className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 text-sm font-medium focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Stay Signed In Option */}
                <div className="flex items-center px-1 pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={trustDevice}
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                    />
                    <span>Stay signed in</span>
                  </label>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !email.includes("@") || password.length < 8 || userStatus === "not_found"}
                  className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{isNewDeviceMode ? "Continue to 2FA" : "Sign In to Dashboard"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════ FORGOT PASSWORD MODAL ════════════ */}
      <AnimatePresence>
        {isForgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsForgotModalOpen(false)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 z-10 space-y-4 shadow-2xl text-slate-900 dark:text-slate-100"
            >
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Reset Password</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Receive a secure reset link via email</p>
                </div>
              </div>

              {forgotSent ? (
                <div className="space-y-4 py-2">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>
                      Password reset link sent to <strong>{forgotEmail}</strong>. Please check your inbox.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotSent(false);
                    }}
                    className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="principal@school.edu.in"
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

