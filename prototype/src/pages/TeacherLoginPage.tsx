import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  Lock,
  ArrowRight,
  School,
  ShieldCheck,
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
  Trash2,
} from "lucide-react";
import schoolLogo from "../assets/ideal-logo.jpg";
import ThemeToggle from "../components/ThemeToggle";


// Mock faculty database with 12 teachers to support 10+ teacher scenarios
const MOCK_TEACHER_PROFILES: Record<
  string,
  Array<{
    id: string;
    fullName: string;
    roleTitle: string;
    tag: string;
    schoolName: string;
    schoolCode: string;
    schoolCity: string;
    validPin: string;
    initials: string;
    avatarColor: string;
    tagBadgeColor: string;
  }>
> = {
  "9876543210": [
    {
      id: "usr_101",
      fullName: "Ms. Priya Sharma",
      roleTitle: "Senior Faculty",
      tag: "PGT Commerce",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "PS",
      avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20",
      tagBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
  ],
  "9876500001": [
    {
      id: "usr_102",
      fullName: "Dr. Rajesh Verma",
      roleTitle: "Faculty",
      tag: "TGT Hindi",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "654321",
      initials: "RV",
      avatarColor: "bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-xs shadow-indigo-500/20",
      tagBadgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    },
  ],
  "9876500002": [
    {
      id: "usr_103",
      fullName: "Mr. Amit Singh",
      roleTitle: "Senior Faculty",
      tag: "PGT Mathematics",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "AS",
      avatarColor: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs shadow-blue-500/20",
      tagBadgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
    },
  ],
  "9876500003": [
    {
      id: "usr_104",
      fullName: "Mrs. Sunita Rao",
      roleTitle: "Faculty",
      tag: "PGT Physics",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "SR",
      avatarColor: "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xs shadow-purple-500/20",
      tagBadgeColor: "bg-purple-50 text-purple-700 border-purple-200/80",
    },
  ],
  "9876500004": [
    {
      id: "usr_105",
      fullName: "Mr. Vikram Malhotra",
      roleTitle: "Faculty",
      tag: "TGT English",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "VM",
      avatarColor: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/20",
      tagBadgeColor: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
  ],
  "9876500005": [
    {
      id: "usr_106",
      fullName: "Ms. Neha Kapoor",
      roleTitle: "Faculty",
      tag: "PGT Chemistry",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "NK",
      avatarColor: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs shadow-rose-500/20",
      tagBadgeColor: "bg-rose-50 text-rose-700 border-rose-200/80",
    },
  ],
  "9876500006": [
    {
      id: "usr_107",
      fullName: "Mr. Deepak Joshi",
      roleTitle: "Faculty",
      tag: "TGT Social Science",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "DJ",
      avatarColor: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xs shadow-cyan-500/20",
      tagBadgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    },
  ],
  "9876500007": [
    {
      id: "usr_108",
      fullName: "Mrs. Ananya Sen",
      roleTitle: "Senior Faculty",
      tag: "PGT Computer Science",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "AS",
      avatarColor: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs shadow-teal-500/20",
      tagBadgeColor: "bg-teal-50 text-teal-700 border-teal-200/80",
    },
  ],
  "9876500008": [
    {
      id: "usr_109",
      fullName: "Mr. Rohan Mehra",
      roleTitle: "Faculty",
      tag: "TGT Biology",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "RM",
      avatarColor: "bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-xs shadow-emerald-600/20",
      tagBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
  ],
  "9876500009": [
    {
      id: "usr_110",
      fullName: "Ms. Kavita Nair",
      roleTitle: "Primary Faculty",
      tag: "PRT Primary",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "KN",
      avatarColor: "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-xs shadow-fuchsia-500/20",
      tagBadgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80",
    },
  ],
  "9876500010": [
    {
      id: "usr_111",
      fullName: "Mr. Suresh Patel",
      roleTitle: "Senior Faculty",
      tag: "PGT Economics",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "SP",
      avatarColor: "bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-xs shadow-slate-600/20",
      tagBadgeColor: "bg-slate-50 text-slate-700 border-slate-200/80",
    },
  ],
  "9876500011": [
    {
      id: "usr_112",
      fullName: "Mrs. Pooja Gupta",
      roleTitle: "Faculty",
      tag: "TGT Sanskrit",
      schoolName: "St. Xavier's Model School",
      schoolCode: "SXMS-DL",
      schoolCity: "New Delhi",
      validPin: "123456",
      initials: "PG",
      avatarColor: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xs shadow-orange-500/20",
      tagBadgeColor: "bg-orange-50 text-orange-700 border-orange-200/80",
    },
  ],
};

interface SavedAccount {
  phone: string;
  name: string;
  tag: string;
  school: string;
  role: string;
  lastLogin: string;
  initials: string;
  avatarColor: string;
  tagBadgeColor: string;
}

interface TeacherLoginPageProps {
  onSwitchToPrincipalLogin?: () => void;
  onSwitchToPrincipalNewDevice?: () => void;
  onSwitchToPrincipalSignUp?: () => void;
}

export default function TeacherLoginPage({
  onSwitchToPrincipalLogin,
  onSwitchToPrincipalNewDevice,
  onSwitchToPrincipalSignUp,
}: TeacherLoginPageProps) {
  // Preload 12 saved accounts for testing shared workstations
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([
    {
      phone: "9876543210",
      name: "Ms. Priya Sharma",
      tag: "PGT Commerce",
      school: "St. Xavier's Model School",
      role: "Senior Faculty",
      lastLogin: "Active today",
      initials: "PS",
      avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20",
      tagBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
    {
      phone: "9876500001",
      name: "Dr. Rajesh Verma",
      tag: "TGT Hindi",
      school: "St. Xavier's Model School",
      role: "Faculty",
      lastLogin: "Active today",
      initials: "RV",
      avatarColor: "bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-xs shadow-indigo-500/20",
      tagBadgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
    },
    {
      phone: "9876500002",
      name: "Mr. Amit Singh",
      tag: "PGT Mathematics",
      school: "St. Xavier's Model School",
      role: "Senior Faculty",
      lastLogin: "Active yesterday",
      initials: "AS",
      avatarColor: "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xs shadow-blue-500/20",
      tagBadgeColor: "bg-blue-50 text-blue-700 border-blue-200/80",
    },
    {
      phone: "9876500003",
      name: "Mrs. Sunita Rao",
      tag: "PGT Physics",
      school: "St. Xavier's Model School",
      role: "Faculty",
      lastLogin: "Active yesterday",
      initials: "SR",
      avatarColor: "bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xs shadow-purple-500/20",
      tagBadgeColor: "bg-purple-50 text-purple-700 border-purple-200/80",
    },
    {
      phone: "9876500004",
      name: "Mr. Vikram Malhotra",
      tag: "TGT English",
      school: "St. Xavier's Model School",
      role: "Faculty",
      lastLogin: "2 days ago",
      initials: "VM",
      avatarColor: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xs shadow-amber-500/20",
      tagBadgeColor: "bg-amber-50 text-amber-700 border-amber-200/80",
    },
    {
      phone: "9876500005",
      name: "Ms. Neha Kapoor",
      tag: "PGT Chemistry",
      school: "St. Xavier's Model School",
      role: "Faculty",
      lastLogin: "2 days ago",
      initials: "NK",
      avatarColor: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs shadow-rose-500/20",
      tagBadgeColor: "bg-rose-50 text-rose-700 border-rose-200/80",
    },
    {
      phone: "9876500006",
      name: "Mr. Deepak Joshi",
      tag: "TGT Social Science",
      school: "St. Xavier's Model School",
      role: "Faculty",
      lastLogin: "3 days ago",
      initials: "DJ",
      avatarColor: "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xs shadow-cyan-500/20",
      tagBadgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200/80",
    },
    {
      phone: "9876500007",
      name: "Mrs. Ananya Sen",
      tag: "PGT Computer Science",
      school: "St. Xavier's Model School",
      role: "Senior Faculty",
      lastLogin: "3 days ago",
      initials: "AS",
      avatarColor: "bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xs shadow-teal-500/20",
      tagBadgeColor: "bg-teal-50 text-teal-700 border-teal-200/80",
    },
    {
      phone: "9876500008",
      name: "Mr. Rohan Mehra",
      tag: "TGT Biology",
      school: "St. Xavier's Model School",
      role: "Faculty",
      lastLogin: "4 days ago",
      initials: "RM",
      avatarColor: "bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-xs shadow-emerald-600/20",
      tagBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    },
    {
      phone: "9876500009",
      name: "Ms. Kavita Nair",
      tag: "PRT Primary",
      school: "St. Xavier's Model School",
      role: "Primary Faculty",
      lastLogin: "5 days ago",
      initials: "KN",
      avatarColor: "bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white shadow-xs shadow-fuchsia-500/20",
      tagBadgeColor: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/80",
    },
    {
      phone: "9876500010",
      name: "Mr. Suresh Patel",
      tag: "PGT Economics",
      school: "St. Xavier's Model School",
      role: "Senior Faculty",
      lastLogin: "5 days ago",
      initials: "SP",
      avatarColor: "bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-xs shadow-slate-600/20",
      tagBadgeColor: "bg-slate-50 text-slate-700 border-slate-200/80",
    },
    {
      phone: "9876500011",
      name: "Mrs. Pooja Gupta",
      tag: "TGT Sanskrit",
      school: "St. Xavier's Model School",
      role: "Faculty",
      lastLogin: "1 week ago",
      initials: "PG",
      avatarColor: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xs shadow-orange-500/20",
      tagBadgeColor: "bg-orange-50 text-orange-700 border-orange-200/80",
    },
  ]);

  // Main login inputs
  const [phone, setPhone] = useState("9876543210");
  const [showPhone, setShowPhone] = useState(true);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Right-side Floating Drawer State
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // User existence state
  const [userStatus, setUserStatus] = useState<"idle" | "checking" | "exists" | "not_found">("exists");
  const [matchedProfiles, setMatchedProfiles] = useState<any[]>(MOCK_TEACHER_PROFILES["9876543210"]);
  const [selectedProfile, setSelectedProfile] = useState<any>(MOCK_TEACHER_PROFILES["9876543210"][0]);
  const [showSchoolPicker, setShowSchoolPicker] = useState(false);

  // Lockout State
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(60);

  // Authenticated State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [dismissSavePrompt, setDismissSavePrompt] = useState(false);
  const [profileJustSaved, setProfileJustSaved] = useState(false);

  // Quick PIN Modal for Selected Saved Teacher
  const [pinModalAccount, setPinModalAccount] = useState<SavedAccount | null>(null);
  const [modalPin, setModalPin] = useState("");
  const [showModalPin, setShowModalPin] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const isAccountSaved = savedAccounts.some((a) => a.phone === (pinModalAccount?.phone || phone));

  // Check user existence when 10 digits are typed
  useEffect(() => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      setUserStatus("checking");
      const timer = setTimeout(() => {
        const profiles = MOCK_TEACHER_PROFILES[cleanPhone];
        if (profiles && profiles.length > 0) {
          setUserStatus("exists");
          setMatchedProfiles(profiles);
          if (profiles.length === 1) {
            setSelectedProfile(profiles[0]);
            setShowSchoolPicker(false);
          } else {
            setSelectedProfile(null);
            setShowSchoolPicker(true);
          }
        } else {
          setUserStatus("not_found");
          setSelectedProfile(null);
          setMatchedProfiles([]);
          setShowSchoolPicker(false);
        }
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setUserStatus("idle");
      setSelectedProfile(null);
      setMatchedProfiles([]);
      setShowSchoolPicker(false);
    }
  }, [phone]);

  // Lockout countdown
  useEffect(() => {
    let timer: any;
    if (isLocked && lockCountdown > 0) {
      timer = setInterval(() => setLockCountdown((t) => t - 1), 1000);
    } else if (isLocked && lockCountdown === 0) {
      setIsLocked(false);
      setAttemptsLeft(5);
      setLockCountdown(60);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockCountdown]);

  const handleOpenPinModal = (acc: SavedAccount) => {
    setPinModalAccount(acc);
    setModalPin("");
    setModalError("");
    setShowModalPin(false);
    setIsSideDrawerOpen(false);
  };

  const handleModalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    if (modalPin.length < 6) {
      setModalError("Please enter your complete 6-digit PIN.");
      return;
    }

    if (!pinModalAccount) return;

    setModalLoading(true);

    setTimeout(() => {
      setModalLoading(false);
      const profile = MOCK_TEACHER_PROFILES[pinModalAccount.phone]?.[0];
      const validPin = profile?.validPin || "123456";

      if (modalPin === validPin || modalPin === "123456" || modalPin === "654321") {
        setPhone(pinModalAccount.phone);
        setSelectedProfile(profile);
        setIsAuthenticated(true);
        setPinModalAccount(null);
      } else {
        const next = attemptsLeft - 1;
        setAttemptsLeft(next);
        setModalPin("");
        if (next <= 0) {
          setIsLocked(true);
          setPinModalAccount(null);
        } else {
          setModalError(`Incorrect PIN. ${next} attempt${next > 1 ? "s" : ""} remaining.`);
        }
      }
    }, 500);
  };

  const handleSaveCurrentProfile = () => {
    if (selectedProfile) {
      const initials = selectedProfile.fullName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const newAccount: SavedAccount = {
        phone: phone,
        name: selectedProfile.fullName,
        tag: selectedProfile.tag || "Senior Faculty",
        school: "St. Xavier's Model School",
        role: selectedProfile.roleTitle || "Faculty",
        lastLogin: "Active now",
        initials: initials || "TC",
        avatarColor: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs shadow-emerald-500/20",
        tagBadgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      };

      setSavedAccounts((prev) => [...prev.filter((a) => a.phone !== phone), newAccount]);
      setProfileJustSaved(true);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (phone.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (userStatus === "not_found") {
      setErrorMsg("No staff account found with this number. Please check or contact school admin.");
      return;
    }

    if (!selectedProfile && matchedProfiles.length > 1) {
      setErrorMsg("Please select your school appointment first.");
      return;
    }

    if (pin.length < 6) {
      setErrorMsg("Please enter your complete 6-digit PIN.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const validPin = selectedProfile?.validPin || "123456";

      if (pin === validPin || pin === "123456" || pin === "654321") {
        if (rememberDevice && !isAccountSaved && selectedProfile) {
          handleSaveCurrentProfile();
        }
        setIsAuthenticated(true);
      } else {
        const next = attemptsLeft - 1;
        setAttemptsLeft(next);
        setPin("");
        if (next <= 0) {
          setIsLocked(true);
        } else {
          setErrorMsg(`Incorrect PIN. ${next} attempt${next > 1 ? "s" : ""} remaining.`);
        }
      }
    }, 600);
  };

  const handleRemoveSavedAccount = (e: React.MouseEvent, phoneToRemove: string) => {
    e.stopPropagation();
    setSavedAccounts(savedAccounts.filter((a) => a.phone !== phoneToRemove));
  };

  const handleResetDemo = () => {
    setIsAuthenticated(false);
    setIsLocked(false);
    setAttemptsLeft(5);
    setPin("");
    setErrorMsg("");
    setDismissSavePrompt(false);
    setProfileJustSaved(false);
  };

  // Filtered accounts for flyout drawer (by search query only)
  const filteredAccounts = savedAccounts.filter((acc) => {
    return (
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/25 to-teal-50/35 dark:from-slate-950 dark:via-emerald-950/20 dark:to-teal-950/30 flex flex-col items-center justify-center p-4 relative overflow-x-hidden text-slate-900 dark:text-slate-100">
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      {/* ════════════ TOP PORTAL SWITCHER & THEME TOGGLE ════════════ */}
      <div className="fixed top-5 left-5 z-30 flex items-center gap-2 flex-wrap">
        {(onSwitchToPrincipalLogin || onSwitchToPrincipalSignUp) && (
          <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 rounded-full p-1 flex items-center shadow-xs">
            <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs flex items-center gap-1.5">
              <span>Teacher's Login</span>
            </div>

            {onSwitchToPrincipalLogin && (
              <button
                type="button"
                onClick={onSwitchToPrincipalLogin}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Principal Login</span>
              </button>
            )}

            {onSwitchToPrincipalNewDevice && (
              <button
                type="button"
                onClick={onSwitchToPrincipalNewDevice}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Principal New Device Login</span>
              </button>
            )}

            {onSwitchToPrincipalSignUp && (
              <button
                type="button"
                onClick={onSwitchToPrincipalSignUp}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Principal Sign Up</span>
              </button>
            )}
          </div>
        )}

        <ThemeToggle variant="pill" />
      </div>

      {/* ════════════ TOP-RIGHT FLOATING STATUS PILL (Subdued, Professional Placement) ════════════ */}
      {!isAuthenticated && savedAccounts.length > 0 && !isSideDrawerOpen && (
        <motion.button
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          type="button"
          onClick={() => {
            setIsSideDrawerOpen(true);
            setSearchQuery("");
          }}
          className="fixed top-5 right-5 sm:right-7 z-30 bg-white/85 dark:bg-slate-900/85 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-full py-1.5 pl-2 pr-3.5 shadow-sm hover:shadow-md transition-all flex items-center gap-2.5 cursor-pointer group select-none"
          title="Open saved teacher accounts on this device"
        >
          {/* Overlapping Mini Avatar Stack */}
          <div className="flex -space-x-2">
            {savedAccounts.slice(0, 3).map((acc, i) => (
              <div
                key={acc.phone}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-white dark:ring-slate-900 ${acc.avatarColor}`}
                style={{ zIndex: 10 - i }}
              >
                {acc.initials}
              </div>
            ))}
          </div>

          <div className="text-left flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
              Saved Profiles
            </span>
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/80 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 px-1.5 py-0.2 rounded-full transition-colors">
              {savedAccounts.length}
            </span>
          </div>

          <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        </motion.button>
      )}

      {/* ════════════ CENTER OF ATTENTION: 100% CLEAN HERO LOGIN CARD ════════════ */}
      <div className="w-full max-w-md mx-auto z-10">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-emerald-950/10 dark:shadow-emerald-950/40 p-6 sm:p-8 relative overflow-hidden">
          {/* Main Card Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3.5 flex items-center justify-center">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-emerald-500/25 to-teal-500/25 blur-md pointer-events-none" />
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white dark:bg-slate-100 p-1.5 ring-4 ring-white/90 dark:ring-slate-700 shadow-xl shadow-emerald-950/10 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center overflow-hidden transition-all duration-300 hover:scale-105">
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain rounded-full mix-blend-multiply select-none"
                  draggable={false}
                />
              </div>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Teacher's Login</h1>
          </div>

          <AnimatePresence mode="wait">
            {/* ════════════ VIEW: Authenticated Success ════════════ */}
            {isAuthenticated ? (
              <motion.div
                key="view-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-2 space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="w-9 h-9" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Welcome, {selectedProfile?.fullName || "Faculty Member"}!
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">St. Xavier's Model School</p>
                </div>

                <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-4 text-left text-xs space-y-2">
                  <div className="font-semibold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Authenticated Session Active (FastAPI RS256)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono pt-1">
                    <div><strong>Role:</strong> Teacher</div>
                    <div><strong>School Code:</strong> SXMS-DL</div>
                    <div><strong>Access Token:</strong> 15 mins (Memory)</div>
                    <div><strong>Session Type:</strong> Secure Cookie</div>
                  </div>
                </div>

                {/* Save Profile Prompt or Status */}
                {!isAccountSaved && !dismissSavePrompt && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-800/90 border border-emerald-200/90 dark:border-emerald-800/80 rounded-2xl p-4 text-left space-y-3 shadow-sm shadow-emerald-950/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Save profile for future logins?</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Save <strong>{selectedProfile?.fullName}</strong> on this browser for 1-tap quick sign-in next time.
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={handleSaveCurrentProfile}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Save Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDismissSavePrompt(true)}
                        className="py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                      >
                        Not Now
                      </button>
                    </div>
                  </motion.div>
                )}

                {(isAccountSaved || profileJustSaved) && (
                  <div className="bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Profile saved on this browser</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-200/70 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                      Saved
                    </span>
                  </div>
                )}

                <button
                  onClick={handleResetDemo}
                  className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-2xl font-semibold text-xs transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </motion.div>
            ) : isLocked ? (
              /* ════════════ VIEW: Account Locked ════════════ */
              <motion.div
                key="view-locked"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-4 space-y-4"
              >
                <div className="w-14 h-14 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl mx-auto flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Account Temporarily Locked</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                    Too many incorrect PIN attempts. Protected for 60 minutes.
                  </p>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl p-3.5 font-mono text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  <span>00:{lockCountdown.toString().padStart(2, "0")} remaining</span>
                </div>

                <button
                  onClick={handleResetDemo}
                  className="w-full py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Reset Lock Demo
                </button>
              </motion.div>
            ) : (
              /* ════════════ VIEW: Pure Clean Form (Center of Attention) ════════════ */
              <form onSubmit={handleManualLogin} className="space-y-4">
                {/* 1. Mobile Number Input with Inside Eye Button */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Mobile Number
                    </label>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold text-sm pr-2 border-r border-slate-200 dark:border-slate-700">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                    </div>

                    <input
                      type={showPhone ? "tel" : "password"}
                      maxLength={10}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, ""));
                        setErrorMsg("");
                      }}
                      placeholder="Enter 10-digit mobile"
                      className="w-full pl-24 pr-11 py-3 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 font-mono text-base font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all tracking-wider placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      autoFocus
                    />

                    <button
                      type="button"
                      onClick={() => setShowPhone(!showPhone)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      title={showPhone ? "Hide mobile number" : "Show mobile number"}
                    >
                      {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time User Existence Confirmation Badge */}
                  <div className="pt-1.5 min-h-[22px]">
                    {userStatus === "checking" && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-600 dark:text-emerald-400" />
                        <span>Verifying mobile registration...</span>
                      </div>
                    )}

                    {userStatus === "exists" && (
                      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-1 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Account exist</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">Active</span>
                      </div>
                    )}

                    {userStatus === "not_found" && (
                      <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-800/80 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                        <UserX className="w-3.5 h-3.5 text-red-500 dark:text-red-400 shrink-0" />
                        <span>Mobile number not registered in school records.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-School Selector (if phone is visiting faculty in 2 schools) */}
                {showSchoolPicker && matchedProfiles.length > 1 && (
                  <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl space-y-2">
                    <div className="text-xs font-semibold text-emerald-950 dark:text-emerald-200 flex items-center justify-between">
                      <span>Select School Appointment:</span>
                      <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded-full text-emerald-800 dark:text-emerald-300">
                        2 Found
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {matchedProfiles.map((prof) => (
                        <button
                          key={prof.id}
                          type="button"
                          onClick={() => {
                            setSelectedProfile(prof);
                            setShowSchoolPicker(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                            selectedProfile?.id === prof.id
                              ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-xs"
                              : "bg-white dark:bg-slate-800 border-emerald-200/60 dark:border-slate-700 hover:bg-emerald-100/50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          <div>
                            <div className="font-bold">{prof.schoolName}</div>
                            <div
                              className={`text-[10px] ${
                                selectedProfile?.id === prof.id ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {prof.roleTitle} · {prof.schoolCity}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-70" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. 6-Digit PIN Input with Inside Eye Button */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Enter 6-Digit PIN
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      maxLength={6}
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value.replace(/\D/g, ""));
                        setErrorMsg("");
                      }}
                      placeholder="••••••"
                      className="w-full py-3 px-11 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 font-mono text-center text-xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      title={showPin ? "Hide PIN digits" : "Show PIN digits"}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                    <span>{attemptsLeft} attempts remaining</span>
                  </div>
                </div>

                {/* Save Profile Checkbox */}
                <div className="flex items-center px-1 pt-0.5">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                    />
                    <span>Save profile for further login</span>
                  </label>
                </div>

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || phone.length < 10 || pin.length < 6 || userStatus === "not_found"}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════ FLOATING RIGHT ISLAND DRAWER (Apple / Raycast Style Flyout Card) ════════════ */}
      <AnimatePresence>
        {isSideDrawerOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSideDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs"
            />

            {/* Floating Island Panel (Detached from edges, rounded corners, sleek glassmorphism) */}
            <motion.aside
              initial={{ x: 20, opacity: 0, scale: 0.96 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 20, opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="fixed top-4 bottom-4 right-4 w-84 sm:w-92 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 p-4 sm:p-5 z-50 flex flex-col space-y-3 text-slate-900 dark:text-slate-100"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    Saved on this device
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                    <span>Faculty Profiles</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded-full font-medium">
                      {savedAccounts.length}
                    </span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSideDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Instant Search Bar (Subdued & Minimalist) */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute inset-y-0 left-3 my-auto pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by teacher name or subject..."
                  autoFocus
                  className="w-full pl-8 pr-7 py-2 bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1.5 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Scrollable Saved Teachers List (Subdued, Clean Row Cards) */}
              <div className="space-y-1.5 overflow-y-auto flex-1 pr-0.5">
                {filteredAccounts.length > 0 ? (
                  filteredAccounts.map((acc) => (
                    <div
                      key={acc.phone}
                      onClick={() => handleOpenPinModal(acc)}
                      className="group p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-2xs transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 shadow-2xs ${acc.avatarColor}`}
                        >
                          {acc.initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-emerald-950 dark:group-hover:text-emerald-300 truncate">
                              {acc.name}
                            </span>
                            <span
                              className={`text-[9px] font-medium px-1.5 py-0.2 rounded-md border ${acc.tagBadgeColor}`}
                            >
                              {acc.tag}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <span className="truncate">{acc.school}</span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span>{acc.lastLogin}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 pl-1.5">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                        <button
                          type="button"
                          title="Remove from this browser"
                          onClick={(e) => handleRemoveSavedAccount(e, acc.phone)}
                          className="p-1 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 dark:text-slate-500 space-y-1">
                    <Users className="w-5 h-5 mx-auto opacity-30" />
                    <p className="text-xs font-medium">No saved teacher matches "{searchQuery}"</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer Tip */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 text-center">
                Click any teacher to enter 6-digit PIN
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════ PIN ENTRY MODAL (Triggered when clicking a profile from the right flyout) ════════════ */}
      <AnimatePresence>
        {pinModalAccount && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPinModalAccount(null)}
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              className="relative w-full max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-emerald-950/20 dark:shadow-black/60 p-6 z-10 space-y-4 overflow-hidden text-slate-900 dark:text-slate-100"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPinModalAccount(null)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Teacher Info in Modal */}
              <div className="flex items-center gap-3.5 pt-1 pr-6">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shrink-0 shadow-md ${pinModalAccount.avatarColor}`}
                >
                  {pinModalAccount.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">
                      {pinModalAccount.name}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${pinModalAccount.tagBadgeColor}`}
                    >
                      {pinModalAccount.tag}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                    <School className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">{pinModalAccount.school}</span>
                  </div>
                </div>
              </div>

              {/* PIN Form */}
              <form onSubmit={handleModalLogin} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                    Enter 6-Digit PIN
                  </label>

                  <div className="relative">
                    <input
                      type={showModalPin ? "text" : "password"}
                      maxLength={6}
                      value={modalPin}
                      onChange={(e) => {
                        setModalPin(e.target.value.replace(/\D/g, ""));
                        setModalError("");
                      }}
                      placeholder="••••••"
                      autoFocus
                      className="w-full py-3 px-11 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 font-mono text-center text-xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />

                    <button
                      type="button"
                      onClick={() => setShowModalPin(!showModalPin)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      title={showModalPin ? "Hide PIN digits" : "Show PIN digits"}
                    >
                      {showModalPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex justify-end text-[10px] text-slate-400 dark:text-slate-500 font-mono pt-0.5">
                    <span>{attemptsLeft} attempts remaining</span>
                  </div>
                </div>

                {/* Modal Error Message */}
                {modalError && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                    <span>{modalError}</span>
                  </div>
                )}

                {/* Modal Submit Button */}
                <button
                  type="submit"
                  disabled={modalLoading || modalPin.length < 6}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {modalLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
