import React, { useState } from "react";
import { motion } from "framer-motion";
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

const DEPARTMENTS = ["All Departments", "Science & Mathematics", "Humanities & Social Sciences", "Languages", "Sports & Arts", "Primary Section"];

const ATTENDANCE_LOG = [
  {
    id: "att-1",
    name: "Dr. Ramanathan Swamy",
    empCode: "EMP-014",
    dept: "Science & Mathematics",
    role: "HOD Physics",
    punchIn: "07:38 AM",
    punchOut: "--",
    status: "Present",
    biometricTerminal: "Main Gate Device #01",
    substituteRequired: false,
  },
  {
    id: "att-2",
    name: "Ms. Sunita Rao",
    empCode: "EMP-028",
    dept: "Science & Mathematics",
    role: "Mathematics Lead",
    punchIn: "--",
    punchOut: "--",
    status: "On Leave",
    biometricTerminal: "Medical Leave Approved",
    substituteRequired: true,
    periodsToCover: ["Period 3 (10A)", "Period 5 (9B)"],
  },
  {
    id: "att-3",
    name: "Mr. Vikramaditya Rathore",
    empCode: "EMP-042",
    dept: "Humanities & Social Sciences",
    role: "History Teacher",
    punchIn: "08:14 AM",
    punchOut: "--",
    status: "Late Arrival",
    biometricTerminal: "Academic Block #02",
    substituteRequired: false,
  },
  {
    id: "att-4",
    name: "Ms. Rekha Sharma",
    empCode: "EMP-019",
    dept: "Science & Mathematics",
    role: "Senior Math Faculty",
    punchIn: "07:42 AM",
    punchOut: "--",
    status: "Present",
    biometricTerminal: "Main Gate Device #01",
    substituteRequired: false,
  },
  {
    id: "att-5",
    name: "Mr. Devendra Joshi",
    empCode: "EMP-063",
    dept: "Languages",
    role: "Hindi Faculty",
    punchIn: "--",
    punchOut: "--",
    status: "On Leave",
    biometricTerminal: "Casual Leave Applied",
    substituteRequired: true,
    periodsToCover: ["Period 2 (8C)"],
  },
  {
    id: "att-6",
    name: "Ms. Patricia Gomes",
    empCode: "EMP-031",
    dept: "Languages",
    role: "English Faculty",
    punchIn: "07:45 AM",
    punchOut: "--",
    status: "Present",
    biometricTerminal: "Admin Porch #01",
    substituteRequired: false,
  },
];

export default function TeacherAttendancePage({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable,
  onSignOut,
}: TeacherAttendancePageProps) {
  const [selectedDept, setSelectedDept] = useState("All Departments");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"log" | "proxy" | "trends">("log");
  const [assignedProxies, setAssignedProxies] = useState<Record<string, string>>({});

  const handleAssignProxy = (key: string, teacherName: string) => {
    setAssignedProxies((prev) => ({ ...prev, [key]: teacherName }));
  };

  const filteredLog = ATTENDANCE_LOG.filter((item) => {
    const matchesDept = selectedDept === "All Departments" || item.dept === selectedDept;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* ── TOP HEADER ── */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5 flex-wrap">
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
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>My School</span>
              </button>
            )}

            {onOpenTimetable && (
              <button
                type="button"
                onClick={onOpenTimetable}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-xs font-semibold border border-violet-200 dark:border-violet-800 transition-all cursor-pointer shadow-2xs"
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
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Teacher Attendance</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300">
                    Live Logistics
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle variant="icon" />

            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className={`w-7 h-7 rounded-lg ${user.avatarColor} flex items-center justify-center font-bold text-xs`}>
                {user.initials}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user.fullName}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 leading-tight font-medium">{user.roleTitle}</div>
              </div>
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-800 dark:hover:text-rose-200 transition-all cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Banner Section */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Biometric Terminal Sync • Active Today</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Faculty Attendance & Substitute Dispatch
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              Monitor real-time biometric check-ins, approve digital leave requests, and resolve class proxy coverage with smart free-educator matching.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 relative z-10">
            <button
              type="button"
              className="px-4 py-2.5 rounded-2xl bg-white text-emerald-900 font-bold text-xs shadow-md hover:bg-emerald-50 transition-all cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Sync Biometrics</span>
            </button>
          </div>
        </div>

        {/* ── 4 STAT METRICS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Present Today</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">78 / 84</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">92.8% Attendance</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">On Approved Leave</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">4</div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">2 Medical, 2 Casual</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserX className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Late Check-ins</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">2</div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Within Grace Period</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Proxy Allocations</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">3 Slots</div>
              <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">Action Required</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ── TABS & FILTERS BAR ── */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 self-start">
            <button
              type="button"
              onClick={() => setActiveTab("log")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "log"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Faculty Attendance Log
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("proxy")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "proxy"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Substitute / Proxy Desk
            </button>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff, code, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-56"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold cursor-pointer focus:outline-hidden"
            >
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        {activeTab === "log" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Department & Role</th>
                    <th className="py-3 px-4">Punch In</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Terminal / Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {filteredLog.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center shrink-0">
                            {item.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{item.empCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>{item.dept}</div>
                        <div className="text-[11px] text-slate-400">{item.role}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold">{item.punchIn}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === "Present"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : item.status === "Late Arrival"
                                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {item.biometricTerminal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "proxy" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                3 periods today have absent subject educators. The system has pre-screened available unassigned teachers for instant proxy dispatch.
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Absent Teacher
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">Ms. Sunita Rao (Math)</h4>
                    <p className="text-xs text-slate-500">Period 3 (10:15 - 11:00 AM) • Grade 10 Section A</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Recommended Free Faculty</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Mr. Aakash Verma</div>
                      <div className="text-[10px] text-slate-400">Chemistry (Free Period 3)</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignProxy("p3", "Mr. Aakash Verma")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        assignedProxies["p3"]
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {assignedProxies["p3"] ? "Proxy Dispatched" : "Assign Proxy"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Absent Teacher
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">Mr. Devendra Joshi (Hindi)</h4>
                    <p className="text-xs text-slate-500">Period 2 (09:30 - 10:15 AM) • Grade 8 Section C</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Recommended Free Faculty</div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">Ms. Patricia Gomes</div>
                      <div className="text-[10px] text-slate-400">English (Free Period 2)</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAssignProxy("p2", "Ms. Patricia Gomes")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        assignedProxies["p2"]
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                      }`}
                    >
                      {assignedProxies["p2"] ? "Proxy Dispatched" : "Assign Proxy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
