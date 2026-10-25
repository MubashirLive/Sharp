import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Clock,
  Building2,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  RefreshCw,
  Sliders,
  Plus,
  Edit3,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  FileText,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Layers,
  PieChart,
  Award,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import schoolLogo from "../assets/ideal-logo.jpg";

interface TeacherAttendancePageProps {
  user: any;
  onBackToDashboard: () => void;
  onOpenMySchool?: () => void;
  onOpenTimetable?: () => void;
  onSignOut?: () => void;
}

// ─────────────────────────────────────────────────────────────
// DATA TYPES
// ─────────────────────────────────────────────────────────────

export interface RuleSet {
  id: string;
  name: string;
  description: string;
  badgeColor: string;
  inTime: string; // e.g. "07:45 AM"
  outTime: string; // e.g. "02:15 PM"
  graceMinutes: number; // e.g. 10 mins
  latePenaltyRule: string; // e.g. "3 Lates = 1/2 Day Deduction"
  maxLateMinutesBeforeHalfDay: number;
  earlyDepartureGraceMinutes: number;
  earlyDeparturePenalty: string;
  overtimeEligible: boolean;
  overtimeMinMinutes: number;
  overtimeRateDesc: string;
  fractionalLeaves: {
    eighthDay: boolean; // 1/8 day (~1 period / gate pass)
    quarterDay: boolean; // 1/4 day (~2 periods)
    halfDay: boolean; // 1/2 day (half shift)
    threeQuarterDay: boolean; // 3/4 day (leaves early/late)
  };
  inchargeApprover: string;
  assignedTeacherIds: string[];
}

export interface TeacherStaff {
  id: string;
  name: string;
  empCode: string;
  wing: "Primary Wing (1-5)" | "Middle Wing (6-8)" | "Secondary (9-10)" | "Sr. Secondary (11-12)";
  dept: "Science & Mathematics" | "Languages" | "Humanities & Social Sciences" | "Sports & Arts" | "Administrative";
  role: string;
  ruleSetId: string;
  todayPunchIn?: string;
  todayPunchOut?: string;
  todayStatus: "Present" | "Grace Buffer" | "Late Arrival" | "Early Departure" | "1/8 Day Pass" | "1/4 Day Leave" | "1/2 Day Leave" | "3/4 Day Leave" | "On Leave" | "Absent";
  todayLateMins?: number;
  todayEarlyMins?: number;
  todayOvertimeMins?: number;
  biometricTerminal: string;
  monthStats: {
    presentDays: number;
    lateCount: number;
    eighthDayCount: number;
    quarterDayCount: number;
    halfDayCount: number;
    deductionsTotal: string;
    overtimeHours: number;
    compOffBalance: number;
  };
  periodsToCover?: string[];
}

export interface LeaveRequestItem {
  id: string;
  teacherId: string;
  teacherName: string;
  empCode: string;
  type: "1/8 Day Gate Pass" | "1/4 Day Leave" | "1/2 Day Leave" | "3/4 Day Leave" | "Comp-Off Grant" | "Late Waiver";
  periodsAffected: string[];
  reason: string;
  requestedAt: string;
  ruleSetName: string;
  status: "Pending" | "Approved" | "Rejected";
}

// ─────────────────────────────────────────────────────────────
// INITIAL MOCK DATA
// ─────────────────────────────────────────────────────────────

const INITIAL_RULE_SETS: RuleSet[] = [
  {
    id: "rs-1",
    name: "Secondary & Sr. Secondary Morning",
    description: "Standard morning academic shift for Grades 9 to 12 faculty and laboratory coordinators.",
    badgeColor: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    inTime: "07:45 AM",
    outTime: "02:15 PM",
    graceMinutes: 10,
    latePenaltyRule: "3 Late Marks in a Month = 1/2 Day LOP Deduction",
    maxLateMinutesBeforeHalfDay: 60,
    earlyDepartureGraceMinutes: 10,
    earlyDeparturePenalty: "Leaving > 20 mins early without pass triggers 1/4 Day Deduction",
    overtimeEligible: true,
    overtimeMinMinutes: 45,
    overtimeRateDesc: "After-school remedial periods (1.0x rate) or 3 duties = 1 Comp-Off",
    fractionalLeaves: {
      eighthDay: true,
      quarterDay: true,
      halfDay: true,
      threeQuarterDay: true,
    },
    inchargeApprover: "Dr. Rajesh Sharma (Academic Dean)",
    assignedTeacherIds: ["t-1", "t-3", "t-4", "t-7"],
  },
  {
    id: "rs-2",
    name: "Primary Wing Shift",
    description: "Child-friendly shift with extended morning briefing and afternoon bus dispersal duty.",
    badgeColor: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    inTime: "08:30 AM",
    outTime: "03:15 PM",
    graceMinutes: 15,
    latePenaltyRule: "3 Late Marks = 1/4 Day Deduction",
    maxLateMinutesBeforeHalfDay: 45,
    earlyDepartureGraceMinutes: 15,
    earlyDeparturePenalty: "Leaving early without gate pass triggers 1/4 Day deduction",
    overtimeEligible: false,
    overtimeMinMinutes: 60,
    overtimeRateDesc: "Standard school hours, event duties converted to Comp-Off",
    fractionalLeaves: {
      eighthDay: true,
      quarterDay: true,
      halfDay: true,
      threeQuarterDay: false,
    },
    inchargeApprover: "Mrs. Shalini Saxena (Primary Incharge)",
    assignedTeacherIds: ["t-2", "t-8"],
  },
  {
    id: "rs-3",
    name: "Visiting & Specialist Faculty",
    description: "Flexible, lecture-bound rule set for external foreign language & robotics tutors.",
    badgeColor: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    inTime: "09:30 AM",
    outTime: "01:30 PM",
    graceMinutes: 5,
    latePenaltyRule: "Pro-rata hourly fee deduction per missed period",
    maxLateMinutesBeforeHalfDay: 30,
    earlyDepartureGraceMinutes: 5,
    earlyDeparturePenalty: "Pro-rata per-period deduction",
    overtimeEligible: true,
    overtimeMinMinutes: 30,
    overtimeRateDesc: "Flat ₹450 / extra 45-min lecture period",
    fractionalLeaves: {
      eighthDay: false,
      quarterDay: true,
      halfDay: true,
      threeQuarterDay: false,
    },
    inchargeApprover: "Mr. Alok Sen (HR Administrator)",
    assignedTeacherIds: ["t-5"],
  },
  {
    id: "rs-4",
    name: "Sports & Extended Day Care",
    description: "Special schedule for physical education, athletics coaches, and day-boarding supervisors.",
    badgeColor: "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    inTime: "08:00 AM",
    outTime: "04:30 PM",
    graceMinutes: 10,
    latePenaltyRule: "2 Late Marks = 1/2 Day Deduction",
    maxLateMinutesBeforeHalfDay: 60,
    earlyDepartureGraceMinutes: 10,
    earlyDeparturePenalty: "Requires sports coordinator approval for early out",
    overtimeEligible: true,
    overtimeMinMinutes: 60,
    overtimeRateDesc: "Weekend tournament coaching = 1 Full Comp-Off Grant",
    fractionalLeaves: {
      eighthDay: true,
      quarterDay: true,
      halfDay: true,
      threeQuarterDay: true,
    },
    inchargeApprover: "Coach Vikramaditya Rathore (HOD PE)",
    assignedTeacherIds: ["t-6"],
  },
];

const INITIAL_TEACHERS: TeacherStaff[] = [
  {
    id: "t-1",
    name: "Dr. Ramanathan Swamy",
    empCode: "EMP-014",
    wing: "Sr. Secondary (11-12)",
    dept: "Science & Mathematics",
    role: "HOD Physics",
    ruleSetId: "rs-1",
    todayPunchIn: "07:38 AM",
    todayPunchOut: "--",
    todayStatus: "Present",
    biometricTerminal: "Main Gate Device #01",
    monthStats: {
      presentDays: 21,
      lateCount: 0,
      eighthDayCount: 1,
      quarterDayCount: 0,
      halfDayCount: 0,
      deductionsTotal: "None",
      overtimeHours: 4.5,
      compOffBalance: 2,
    },
  },
  {
    id: "t-2",
    name: "Ms. Sunita Rao",
    empCode: "EMP-028",
    wing: "Primary Wing (1-5)",
    dept: "Science & Mathematics",
    role: "Mathematics Lead (Primary)",
    ruleSetId: "rs-2",
    todayPunchIn: "--",
    todayPunchOut: "--",
    todayStatus: "On Leave",
    biometricTerminal: "Medical Certificate Submitted",
    periodsToCover: ["Period 3 (10A)", "Period 5 (9B)"],
    monthStats: {
      presentDays: 18,
      lateCount: 1,
      eighthDayCount: 0,
      quarterDayCount: 0,
      halfDayCount: 1,
      deductionsTotal: "1 Day Casual Leave",
      overtimeHours: 0,
      compOffBalance: 0,
    },
  },
  {
    id: "t-3",
    name: "Mr. Devendra Joshi",
    empCode: "EMP-063",
    wing: "Secondary (9-10)",
    dept: "Languages",
    role: "Hindi Senior Faculty",
    ruleSetId: "rs-1",
    todayPunchIn: "08:02 AM",
    todayPunchOut: "--",
    todayStatus: "Late Arrival",
    todayLateMins: 17,
    biometricTerminal: "Secondary Block Terminal #02",
    monthStats: {
      presentDays: 19,
      lateCount: 3,
      eighthDayCount: 2,
      quarterDayCount: 1,
      halfDayCount: 0,
      deductionsTotal: "1/2 Day LOP (3 Lates Warning)",
      overtimeHours: 1.0,
      compOffBalance: 1,
    },
  },
  {
    id: "t-4",
    name: "Ms. Rekha Sharma",
    empCode: "EMP-019",
    wing: "Sr. Secondary (11-12)",
    dept: "Science & Mathematics",
    role: "Mathematics PGT",
    ruleSetId: "rs-1",
    todayPunchIn: "07:44 AM",
    todayPunchOut: "--",
    todayStatus: "Grace Buffer",
    biometricTerminal: "Main Gate Device #01",
    monthStats: {
      presentDays: 22,
      lateCount: 1,
      eighthDayCount: 0,
      quarterDayCount: 0,
      halfDayCount: 0,
      deductionsTotal: "None",
      overtimeHours: 3.0,
      compOffBalance: 1,
    },
  },
  {
    id: "t-5",
    name: "Ms. Patricia Gomes",
    empCode: "EMP-031",
    wing: "Middle Wing (6-8)",
    dept: "Languages",
    role: "French Specialist Tutor",
    ruleSetId: "rs-3",
    todayPunchIn: "09:28 AM",
    todayPunchOut: "--",
    todayStatus: "Present",
    biometricTerminal: "Admin Porch Terminal #01",
    monthStats: {
      presentDays: 16,
      lateCount: 0,
      eighthDayCount: 0,
      quarterDayCount: 1,
      halfDayCount: 0,
      deductionsTotal: "None",
      overtimeHours: 2.0,
      compOffBalance: 0,
    },
  },
  {
    id: "t-6",
    name: "Coach Vikramaditya Rathore",
    empCode: "EMP-042",
    wing: "Middle Wing (6-8)",
    dept: "Sports & Arts",
    role: "HOD Physical Education",
    ruleSetId: "rs-4",
    todayPunchIn: "07:55 AM",
    todayPunchOut: "--",
    todayStatus: "Present",
    biometricTerminal: "Sports Arena Device #01",
    monthStats: {
      presentDays: 23,
      lateCount: 0,
      eighthDayCount: 0,
      quarterDayCount: 0,
      halfDayCount: 0,
      deductionsTotal: "None",
      overtimeHours: 8.5,
      compOffBalance: 3,
    },
  },
  {
    id: "t-7",
    name: "Dr. Alok Verma",
    empCode: "EMP-055",
    wing: "Sr. Secondary (11-12)",
    dept: "Humanities & Social Sciences",
    role: "Political Science Faculty",
    ruleSetId: "rs-1",
    todayPunchIn: "07:40 AM",
    todayPunchOut: "--",
    todayStatus: "1/8 Day Pass",
    biometricTerminal: "Main Gate Device #01 (Pass #GP-104)",
    monthStats: {
      presentDays: 20,
      lateCount: 1,
      eighthDayCount: 1,
      quarterDayCount: 0,
      halfDayCount: 0,
      deductionsTotal: "None",
      overtimeHours: 1.5,
      compOffBalance: 1,
    },
  },
  {
    id: "t-8",
    name: "Mrs. Kavita Rao",
    empCode: "EMP-072",
    wing: "Primary Wing (1-5)",
    dept: "Languages",
    role: "Primary English Coordinator",
    ruleSetId: "rs-2",
    todayPunchIn: "08:25 AM",
    todayPunchOut: "--",
    todayStatus: "1/4 Day Leave",
    biometricTerminal: "Approved 2-Period Exit (Doctor Appt)",
    periodsToCover: ["Period 6 (3B)", "Period 7 (4A)"],
    monthStats: {
      presentDays: 19,
      lateCount: 0,
      eighthDayCount: 1,
      quarterDayCount: 1,
      halfDayCount: 0,
      deductionsTotal: "1/4 Casual Leave Debited",
      overtimeHours: 0,
      compOffBalance: 0,
    },
  },
];

const INITIAL_REQUESTS: LeaveRequestItem[] = [
  {
    id: "req-1",
    teacherId: "t-7",
    teacherName: "Dr. Alok Verma",
    empCode: "EMP-055",
    type: "1/8 Day Gate Pass",
    periodsAffected: ["Period 4 (11:00 - 11:45 AM)"],
    reason: "Urgent emergency medical consultation for son",
    requestedAt: "Today, 07:15 AM",
    ruleSetName: "Secondary & Sr. Secondary Morning",
    status: "Approved",
  },
  {
    id: "req-2",
    teacherId: "t-8",
    teacherName: "Mrs. Kavita Rao",
    empCode: "EMP-072",
    type: "1/4 Day Leave",
    periodsAffected: ["Period 6 (01:45 PM)", "Period 7 (02:30 PM)"],
    reason: "Leaving 2 periods early for scheduled specialist health checkup",
    requestedAt: "Today, 08:10 AM",
    ruleSetName: "Primary Wing Shift",
    status: "Approved",
  },
  {
    id: "req-3",
    teacherId: "t-3",
    teacherName: "Mr. Devendra Joshi",
    empCode: "EMP-063",
    type: "Late Waiver",
    periodsAffected: ["Arrived 08:02 AM (17m late)"],
    reason: "City Metro orange line signal failure between Station 4 and 9",
    requestedAt: "Today, 08:15 AM",
    ruleSetName: "Secondary & Sr. Secondary Morning",
    status: "Pending",
  },
  {
    id: "req-4",
    teacherId: "t-6",
    teacherName: "Coach Vikramaditya Rathore",
    empCode: "EMP-042",
    type: "Comp-Off Grant",
    periodsAffected: ["Sunday Interschool Basketball Tournament (6 Hours)"],
    reason: "Officiated state-level tournament matches as lead school referee",
    requestedAt: "Oct 24, 2026",
    ruleSetName: "Sports & Extended Day Care",
    status: "Approved",
  },
];

export const TeacherAttendancePage: React.FC<TeacherAttendancePageProps> = ({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable,
  onSignOut,
}) => {
  // Top-level Navigation: "dashboard" (Attendance Dashboard) vs "rules" (Rule Sets Studio) vs "proxy" (Proxy Dispatch)
  const [currentTab, setCurrentTab] = useState<"dashboard" | "rules" | "proxy">("dashboard");

  // Dashboard Sub-views: "day" | "wing" | "group" | "individual" | "approvals"
  const [dashboardSubView, setDashboardSubView] = useState<"day" | "wing" | "group" | "individual" | "approvals">("day");

  // State Collections
  const [ruleSets, setRuleSets] = useState<RuleSet[]>(INITIAL_RULE_SETS);
  const [teachers, setTeachers] = useState<TeacherStaff[]>(INITIAL_TEACHERS);
  const [requests, setRequests] = useState<LeaveRequestItem[]>(INITIAL_REQUESTS);

  // Filters & Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWing, setSelectedWing] = useState("All Wings");
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [selectedTeacherForDossier, setSelectedTeacherForDossier] = useState<TeacherStaff>(INITIAL_TEACHERS[0]);

  // Modals & Drawers
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleSet, setEditingRuleSet] = useState<RuleSet | null>(null);
  const [ruleFormData, setRuleFormData] = useState<Partial<RuleSet>>({});
  const [assigningRuleSet, setAssigningRuleSet] = useState<RuleSet | null>(null);

  // Proxy state
  const [assignedProxies, setAssignedProxies] = useState<Record<string, string>>({});

  const handleAssignProxy = (key: string, substituteName: string) => {
    setAssignedProxies((prev) => ({ ...prev, [key]: substituteName }));
  };

  // Helper: Get rule set by ID
  const getRuleSet = (id: string) => ruleSets.find((r) => r.id === id);

  // Handlers for Rule Set Actions
  const handleOpenCreateRuleSet = () => {
    setEditingRuleSet(null);
    setRuleFormData({
      id: `rs-${Date.now()}`,
      name: "",
      description: "",
      badgeColor: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      inTime: "08:00 AM",
      outTime: "03:00 PM",
      graceMinutes: 10,
      latePenaltyRule: "3 Late Marks = 1/2 Day LOP Deduction",
      maxLateMinutesBeforeHalfDay: 60,
      earlyDepartureGraceMinutes: 10,
      earlyDeparturePenalty: "Leaving early without pass = 1/4 Day Deduction",
      overtimeEligible: true,
      overtimeMinMinutes: 45,
      overtimeRateDesc: "Standard overtime multiplier 1.0x",
      fractionalLeaves: {
        eighthDay: true,
        quarterDay: true,
        halfDay: true,
        threeQuarterDay: false,
      },
      inchargeApprover: "Vice Principal Dr. Vandana Roy",
      assignedTeacherIds: [],
    });
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRuleSet = (rs: RuleSet) => {
    setEditingRuleSet(rs);
    setRuleFormData({ ...rs });
    setIsRuleModalOpen(true);
  };

  const handleSaveRuleSet = () => {
    if (!ruleFormData.name?.trim()) {
      alert("Please enter a valid Rule Set Name.");
      return;
    }

    if (editingRuleSet) {
      setRuleSets((prev) =>
        prev.map((r) => (r.id === editingRuleSet.id ? ({ ...r, ...ruleFormData } as RuleSet) : r))
      );
    } else {
      const newRs = {
        ...ruleFormData,
        id: ruleFormData.id || `rs-${Date.now()}`,
        assignedTeacherIds: [],
      } as RuleSet;
      setRuleSets((prev) => [...prev, newRs]);
    }
    setIsRuleModalOpen(false);
  };

  const handleDeleteRuleSet = (rsId: string) => {
    const rs = getRuleSet(rsId);
    if (!rs) return;
    if (rs.assignedTeacherIds.length > 0) {
      alert(`Cannot delete '${rs.name}' because ${rs.assignedTeacherIds.length} teachers are currently assigned to it. Please reassign them first.`);
      return;
    }
    if (confirm(`Are you sure you want to delete '${rs.name}'?`)) {
      setRuleSets((prev) => prev.filter((r) => r.id !== rsId));
    }
  };

  // 1-to-1 Teacher Assignment Handler (strictly one rule set per teacher)
  const handleAssignTeacherToRuleSet = (teacherId: string, targetRuleSetId: string) => {
    setTeachers((prevTeachers) =>
      prevTeachers.map((t) => (t.id === teacherId ? { ...t, ruleSetId: targetRuleSetId } : t))
    );

    setRuleSets((prevRuleSets) =>
      prevRuleSets.map((rs) => {
        if (rs.id === targetRuleSetId) {
          return {
            ...rs,
            assignedTeacherIds: rs.assignedTeacherIds.includes(teacherId)
              ? rs.assignedTeacherIds
              : [...rs.assignedTeacherIds, teacherId],
          };
        } else {
          return {
            ...rs,
            assignedTeacherIds: rs.assignedTeacherIds.filter((id) => id !== teacherId),
          };
        }
      })
    );
  };

  // Request approval actions
  const handleUpdateRequestStatus = (reqId: string, newStatus: "Approved" | "Rejected") => {
    setRequests((prev) =>
      prev.map((req) => (req.id === reqId ? { ...req, status: newStatus } : req))
    );
  };

  // Filtered Teachers
  const filteredTeachers = teachers.filter((t) => {
    const matchesWing = selectedWing === "All Wings" || t.wing === selectedWing;
    const matchesDept = selectedDept === "All Departments" || t.dept === selectedDept;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWing && matchesDept && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ── TOP HEADER ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            {onOpenMySchool && (
              <button
                type="button"
                onClick={onOpenMySchool}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>My School</span>
              </button>
            )}

            {onOpenTimetable && (
              <button
                type="button"
                onClick={onOpenTimetable}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Time Table</span>
              </button>
            )}

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-100 p-0.5 ring-1 ring-slate-200/90 dark:ring-slate-700 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={schoolLogo}
                  alt="School Logo"
                  className="w-full h-full object-contain rounded-full mix-blend-multiply"
                />
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Teacher Attendance & Shift Rules Engine
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                    Live Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="icon" />

            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className={`w-7 h-7 rounded-lg ${user?.avatarColor || "bg-emerald-600 text-white"} flex items-center justify-center font-bold text-xs`}>
                {user?.initials || "PR"}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.fullName || "Principal Office"}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-tight font-medium">Administrator</div>
              </div>
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-all cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT WRAPPER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Feature Switcher Tab Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setCurrentTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "dashboard"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Attendance Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab("rules")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "rules"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Rule Sets Studio ({ruleSets.length})</span>
            </button>

            <button
              onClick={() => setCurrentTab("proxy")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentTab === "proxy"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Proxy & Substitute Dispatch</span>
            </button>
          </div>

          {currentTab === "rules" && (
            <button
              onClick={handleOpenCreateRuleSet}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Rule Set</span>
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: ATTENDANCE DASHBOARD
           ══════════════════════════════════════════════════════════════════ */}
        {currentTab === "dashboard" && (
          <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Faculty</span>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{teachers.length}</div>
                <span className="text-[10px] text-slate-400">4 Active Shifts</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200/60 dark:border-emerald-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Present On-Time</span>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {teachers.filter((t) => t.todayStatus === "Present").length}
                </div>
                <span className="text-[10px] text-emerald-500 font-medium">Within Shift In-Time</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200/60 dark:border-blue-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Grace Buffer</span>
                <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                  {teachers.filter((t) => t.todayStatus === "Grace Buffer").length}
                </div>
                <span className="text-[10px] text-blue-500 font-medium">&lt; 10m Grace Used</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">Late Arrivals</span>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {teachers.filter((t) => t.todayStatus === "Late Arrival").length}
                </div>
                <span className="text-[10px] text-amber-500 font-medium">Flagged for Deduction</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200/60 dark:border-purple-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400">Fractional Leaves</span>
                <div className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                  {teachers.filter((t) => t.todayStatus.includes("1/8") || t.todayStatus.includes("1/4") || t.todayStatus.includes("1/2") || t.todayStatus.includes("3/4")).length}
                </div>
                <span className="text-[10px] text-purple-500 font-medium">1/8 Gate Passes & 1/4 Day</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/60 dark:border-rose-900/40 shadow-xs">
                <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">On Full Leave</span>
                <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                  {teachers.filter((t) => t.todayStatus === "On Leave" || t.todayStatus === "Absent").length}
                </div>
                <span className="text-[10px] text-rose-500 font-medium">Substitutes Required</span>
              </div>
            </div>

            {/* Dashboard Sub-View Navigation Buttons */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setDashboardSubView("day")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dashboardSubView === "day"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Day-Wise Live Biometric
              </button>

              <button
                onClick={() => setDashboardSubView("wing")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dashboardSubView === "wing"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Wing-Wise Rollup
              </button>

              <button
                onClick={() => setDashboardSubView("group")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dashboardSubView === "group"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Group / Department Status
              </button>

              <button
                onClick={() => setDashboardSubView("individual")}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dashboardSubView === "individual"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                Individual Dossier & History
              </button>

              <button
                onClick={() => setDashboardSubView("approvals")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  dashboardSubView === "approvals"
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span>Approvals Queue</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                  {requests.filter((r) => r.status === "Pending").length}
                </span>
              </button>
            </div>

            {/* ── SUB-VIEW 1: DAY-WISE LIVE BIOMETRIC TABLE ── */}
            {dashboardSubView === "day" && (
              <div className="space-y-4">
                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {["All Wings", "Primary Wing (1-5)", "Middle Wing (6-8)", "Secondary (9-10)", "Sr. Secondary (11-12)"].map((wing) => (
                      <button
                        key={wing}
                        onClick={() => setSelectedWing(wing)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                          selectedWing === wing
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-400"
                        }`}
                      >
                        {wing}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search faculty or code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Teacher / Faculty</th>
                          <th className="py-3 px-4 font-semibold">Wing & Dept</th>
                          <th className="py-3 px-4 font-semibold">Assigned Rule Set</th>
                          <th className="py-3 px-4 font-semibold">Shift In / Out</th>
                          <th className="py-3 px-4 font-semibold">Actual Punch</th>
                          <th className="py-3 px-4 font-semibold">Today Status</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredTeachers.map((teacher) => {
                          const rs = getRuleSet(teacher.ruleSetId);
                          return (
                            <tr key={teacher.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-900 dark:text-white">{teacher.name}</div>
                                <div className="text-[11px] text-slate-400 font-mono">{teacher.empCode} • {teacher.role}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-700 dark:text-slate-300">{teacher.wing}</div>
                                <div className="text-[10px] text-slate-400">{teacher.dept}</div>
                              </td>
                              <td className="py-3 px-4">
                                {rs ? (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${rs.badgeColor}`}>
                                    {rs.name}
                                  </span>
                                ) : (
                                  <span className="text-rose-500 text-[10px] font-bold">No Rule Set Assigned</span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px]">
                                {rs ? `${rs.inTime} – ${rs.outTime}` : "--"}
                              </td>
                              <td className="py-3 px-4 font-mono text-[11px]">
                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                  {teacher.todayPunchIn || "--"}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                  {teacher.biometricTerminal}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                    teacher.todayStatus === "Present"
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                      : teacher.todayStatus === "Grace Buffer"
                                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                      : teacher.todayStatus === "Late Arrival"
                                      ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                      : teacher.todayStatus.includes("1/8") || teacher.todayStatus.includes("1/4")
                                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                  }`}
                                >
                                  {teacher.todayStatus}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedTeacherForDossier(teacher);
                                    setDashboardSubView("individual");
                                  }}
                                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                  View Dossier →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUB-VIEW 2: WING-WISE ROLLUP ── */}
            {dashboardSubView === "wing" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { wing: "Primary Wing (1-5)", total: 24, present: 23, late: 1, leave: 1, rate: 95.8, lead: "Mrs. Shalini Saxena" },
                  { wing: "Middle Wing (6-8)", total: 22, present: 21, late: 0, leave: 1, rate: 95.4, lead: "Mr. Alok Sen" },
                  { wing: "Secondary (9-10)", total: 20, present: 19, late: 1, leave: 0, rate: 95.0, lead: "Mrs. Sunita Verma" },
                  { wing: "Sr. Secondary (11-12)", total: 18, present: 17, late: 1, leave: 0, rate: 94.4, lead: "Dr. Rajesh Sharma" },
                ].map((item, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.wing}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {item.rate}% Present
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">{item.present}</span>
                      <span className="text-xs text-slate-400">/ {item.total} faculty on duty</span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${item.rate}%` }} />
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] space-y-1 text-slate-500">
                      <div className="flex justify-between">
                        <span>Late Buffer:</span>
                        <span className="font-semibold text-amber-600">{item.late} faculty</span>
                      </div>
                      <div className="flex justify-between">
                        <span>On Leave / Gate Pass:</span>
                        <span className="font-semibold text-rose-600">{item.leave} faculty</span>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1">
                        <span>Wing Approver:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.lead}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── SUB-VIEW 3: GROUP / DEPARTMENT BREAKDOWN ── */}
            {dashboardSubView === "group" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  { dept: "Science & Mathematics", staff: 28, present: 27, ruleSet: "Sr. Secondary Morning (07:45 - 14:15)", color: "from-blue-600 to-indigo-600" },
                  { dept: "Languages & Literature", staff: 22, present: 21, ruleSet: "Standard Morning (08:00 - 14:30)", color: "from-purple-600 to-pink-600" },
                  { dept: "Humanities & Social Sciences", staff: 16, present: 15, ruleSet: "Secondary Morning (07:45 - 14:15)", color: "from-amber-600 to-orange-600" },
                  { dept: "Sports & Physical Education", staff: 8, present: 8, ruleSet: "Sports & Extended Day (08:00 - 16:30)", color: "from-emerald-600 to-teal-600" },
                  { dept: "Arts & Performing Clubs", staff: 6, present: 6, ruleSet: "Primary / Specialist Flexible", color: "from-rose-600 to-red-600" },
                  { dept: "Administrative & Lab Assistants", staff: 12, present: 11, ruleSet: "Full Day Campus Operational", color: "from-slate-700 to-slate-900" },
                ].map((grp, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${grp.color}`} />
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{grp.dept}</h4>
                    </div>

                    <div className="flex items-baseline justify-between text-xs pt-1">
                      <span className="text-slate-500">Attendance:</span>
                      <span className="font-extrabold text-emerald-600">{grp.present} / {grp.staff} ({Math.round((grp.present / grp.staff) * 100)}%)</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 block text-[9px] uppercase font-bold">Standard Shift Constraint:</span>
                      <span className="font-medium">{grp.ruleSet}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── SUB-VIEW 4: INDIVIDUAL TEACHER DOSSIER ── */}
            {dashboardSubView === "individual" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Staff Selector */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h4 className="font-bold text-xs uppercase text-slate-400">Select Staff Dossier</h4>
                  <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                    {teachers.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTeacherForDossier(t)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          selectedTeacherForDossier.id === t.id
                            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold"
                            : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.empCode} • {t.dept}</div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          {t.todayStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Detailed Dossier Card */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {selectedTeacherForDossier.name}
                          </h3>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {selectedTeacherForDossier.empCode}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          {selectedTeacherForDossier.role} • {selectedTeacherForDossier.wing} ({selectedTeacherForDossier.dept})
                        </p>
                      </div>

                      {(() => {
                        const rs = getRuleSet(selectedTeacherForDossier.ruleSetId);
                        return rs ? (
                          <div className="text-left sm:text-right">
                            <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold border ${rs.badgeColor}`}>
                              {rs.name}
                            </span>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Shift: {rs.inTime} – {rs.outTime}</p>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Monthly KPI Ledger */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase">Monthly Present</span>
                        <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                          {selectedTeacherForDossier.monthStats.presentDays} Days
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-amber-500 uppercase">Late Marks</span>
                        <div className="text-lg font-black text-amber-600 mt-1">
                          {selectedTeacherForDossier.monthStats.lateCount} Days
                        </div>
                        <span className="text-[9px] text-slate-400">Rule: 3 Lates = 1/2 Day LOP</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-purple-500 uppercase">Fractional Leaves</span>
                        <div className="text-lg font-black text-purple-600 mt-1">
                          {selectedTeacherForDossier.monthStats.eighthDayCount} (1/8) • {selectedTeacherForDossier.monthStats.quarterDayCount} (1/4)
                        </div>
                        <span className="text-[9px] text-slate-400">Approved Gate Passes</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-emerald-500 uppercase">Comp-Off Balance</span>
                        <div className="text-lg font-black text-emerald-600 mt-1">
                          {selectedTeacherForDossier.monthStats.compOffBalance} Grants
                        </div>
                        <span className="text-[9px] text-slate-400">Overtime: {selectedTeacherForDossier.monthStats.overtimeHours} hrs</span>
                      </div>
                    </div>

                    {/* Today's Punch Timeline */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-200">Today Biometric Event Log</span>
                        <span className="text-slate-400">{selectedTeacherForDossier.biometricTerminal}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono pt-1">
                        <div>Punch-In: <strong className="text-emerald-600">{selectedTeacherForDossier.todayPunchIn || "Not Recorded"}</strong></div>
                        <div>Punch-Out: <strong className="text-slate-600">{selectedTeacherForDossier.todayPunchOut || "Awaiting Exit"}</strong></div>
                        <div>Status: <strong className="text-indigo-600">{selectedTeacherForDossier.todayStatus}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── SUB-VIEW 5: APPROVALS QUEUE ── */}
            {dashboardSubView === "approvals" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Incharge & Principal Leave Approvals
                    </h3>
                    <p className="text-xs text-slate-500">
                      Approve or review 1/8 gate passes, 1/4 day departures, compensatory grants, and late arrival waivers.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {requests.map((req) => (
                    <div key={req.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{req.teacherName}</span>
                          <span className="text-slate-400 text-[11px]">({req.empCode})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {req.type}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">{req.reason}</p>
                        <p className="text-[11px] text-slate-400">
                          Affected: <span className="font-semibold text-slate-700 dark:text-slate-300">{req.periodsAffected.join(", ")}</span> • Requested {req.requestedAt} • Rule Set: {req.ruleSetName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {req.status === "Pending" ? (
                          <>
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, "Approved")}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleUpdateRequestStatus(req.id, "Rejected")}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              req.status === "Approved"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {req.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: RULE SETS CONFIGURATION STUDIO
           ══════════════════════════════════════════════════════════════════ */}
        {currentTab === "rules" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Institutional Attendance Rule Sets
                </h3>
                <p className="text-xs text-slate-500">
                  Configure multiple rule sets. Each teacher in the school is bound to exactly one rule set controlling their shift in/out times, late grace, fractional leaves, overtime, and deduction limits.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ruleSets.map((rs) => (
                <div
                  key={rs.id}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${rs.badgeColor}`}>
                          {rs.name}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                          Shift: {rs.inTime} – {rs.outTime}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditRuleSet(rs)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Edit Rule Set"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRuleSet(rs.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Delete Rule Set"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {rs.description}
                    </p>

                    {/* Constraint Specifications */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">Grace Allowance:</span>
                        <span className="font-semibold">{rs.graceMinutes} mins buffer</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">Late Penalty:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{rs.latePenaltyRule}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400">Early Departure:</span>
                        <span className="font-semibold">{rs.earlyDeparturePenalty}</span>
                      </div>

                      {/* Fractional Leave Badges */}
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                          Enabled Fractional Leaves:
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rs.fractionalLeaves.eighthDay ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-400 line-through"}`}>
                            1/8 Day (Gate Pass)
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rs.fractionalLeaves.quarterDay ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-400 line-through"}`}>
                            1/4 Day (2 Periods)
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rs.fractionalLeaves.halfDay ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-400 line-through"}`}>
                            1/2 Day (Half Shift)
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rs.fractionalLeaves.threeQuarterDay ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-slate-100 text-slate-400 line-through"}`}>
                            3/4 Day
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1">
                        <span className="text-slate-400">Approving Incharge:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{rs.inchargeApprover}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Assigned: <strong className="text-slate-900 dark:text-white font-bold">{rs.assignedTeacherIds.length}</strong> teachers (1:1 strict)
                    </span>
                    <button
                      onClick={() => setAssigningRuleSet(rs)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 cursor-pointer"
                    >
                      Manage Staff →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: PROXY & SUBSTITUTE DISPATCH
           ══════════════════════════════════════════════════════════════════ */}
        {currentTab === "proxy" && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Automated Proxy & Substitute Allocation
              </h3>
              <p className="text-xs text-slate-500">
                Periods uncovered due to full-day leaves, 1/4 day early exits, or 1/8 gate passes requiring urgent staff substitution.
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
              {teachers
                .filter((t) => t.periodsToCover && t.periodsToCover.length > 0)
                .map((absentTeacher) => (
                  <div key={absentTeacher.id} className="pt-4 first:pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{absentTeacher.name}</span>
                          <span className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                            {absentTeacher.todayStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{absentTeacher.role} • {absentTeacher.wing}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {absentTeacher.periodsToCover?.map((period, idx) => {
                        const key = `${absentTeacher.id}-${idx}`;
                        const currentSubstitute = assignedProxies[key];
                        return (
                          <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{period}</span>
                              <p className="text-[11px] text-slate-500">
                                Assigned Proxy: <strong className="text-emerald-600">{currentSubstitute || "Unassigned"}</strong>
                              </p>
                            </div>

                            <select
                              value={currentSubstitute || ""}
                              onChange={(e) => handleAssignProxy(key, e.target.value)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium cursor-pointer"
                            >
                              <option value="">Select Substitute...</option>
                              <option value="Dr. Ramanathan Swamy">Dr. Ramanathan Swamy (Free Period)</option>
                              <option value="Ms. Rekha Sharma">Ms. Rekha Sharma (Free Period)</option>
                              <option value="Coach Vikramaditya">Coach Vikramaditya (PE Pool)</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: CREATE / EDIT RULE SET
         ══════════════════════════════════════════════════════════════════ */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {editingRuleSet ? "Edit Attendance Rule Set" : "Create New Attendance Rule Set"}
              </h3>
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rule Set Name</label>
                <input
                  type="text"
                  placeholder="e.g. Primary Wing Afternoon Shift"
                  value={ruleFormData.name || ""}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Purpose and applicable staff departments..."
                  value={ruleFormData.description || ""}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Shift In-Time</label>
                  <input
                    type="text"
                    placeholder="08:00 AM"
                    value={ruleFormData.inTime || ""}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, inTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Shift Out-Time</label>
                  <input
                    type="text"
                    placeholder="03:00 PM"
                    value={ruleFormData.outTime || ""}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, outTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Late Grace (Minutes)</label>
                  <input
                    type="number"
                    value={ruleFormData.graceMinutes || 10}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, graceMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Late Penalty Threshold</label>
                  <input
                    type="text"
                    placeholder="3 Lates = 1/2 Day LOP"
                    value={ruleFormData.latePenaltyRule || ""}
                    onChange={(e) => setRuleFormData({ ...ruleFormData, latePenaltyRule: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Fractional Leaves Checklist */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Fractional Day Leave Permissions
                </label>
                <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleFormData.fractionalLeaves?.eighthDay ?? true}
                      onChange={(e) =>
                        setRuleFormData({
                          ...ruleFormData,
                          fractionalLeaves: {
                            ...ruleFormData.fractionalLeaves!,
                            eighthDay: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>1/8 Day (Gate Pass / 1 Period)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleFormData.fractionalLeaves?.quarterDay ?? true}
                      onChange={(e) =>
                        setRuleFormData({
                          ...ruleFormData,
                          fractionalLeaves: {
                            ...ruleFormData.fractionalLeaves!,
                            quarterDay: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>1/4 Day (~2 Periods Exit)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleFormData.fractionalLeaves?.halfDay ?? true}
                      onChange={(e) =>
                        setRuleFormData({
                          ...ruleFormData,
                          fractionalLeaves: {
                            ...ruleFormData.fractionalLeaves!,
                            halfDay: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>1/2 Day (Half Shift)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ruleFormData.fractionalLeaves?.threeQuarterDay ?? false}
                      onChange={(e) =>
                        setRuleFormData({
                          ...ruleFormData,
                          fractionalLeaves: {
                            ...ruleFormData.fractionalLeaves!,
                            threeQuarterDay: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>3/4 Day</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Incharge Approver</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma (Dean)"
                  value={ruleFormData.inchargeApprover || ""}
                  onChange={(e) => setRuleFormData({ ...ruleFormData, inchargeApprover: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsRuleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRuleSet}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm cursor-pointer"
              >
                Save Rule Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: STAFF 1-TO-1 ASSIGNMENT MANAGER
         ══════════════════════════════════════════════════════════════════ */}
      {assigningRuleSet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Assign Staff to Rule Set: {assigningRuleSet.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Strict 1-to-1 Mapping: Assigning a teacher moves them automatically from their previous rule set.
                </p>
              </div>
              <button
                onClick={() => setAssigningRuleSet(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {teachers.map((t) => {
                const isCurrent = t.ruleSetId === assigningRuleSet.id;
                const prevRuleSet = getRuleSet(t.ruleSetId);
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                      <div className="text-[11px] text-slate-400">{t.empCode} • {t.wing} ({t.dept})</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Current Rule Set: <strong className="text-indigo-600">{prevRuleSet?.name || "None"}</strong>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          Active in this Set
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAssignTeacherToRuleSet(t.id, assigningRuleSet.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
                        >
                          Transfer to this Set →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setAssigningRuleSet(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendancePage;
