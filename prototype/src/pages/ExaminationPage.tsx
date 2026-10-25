import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Award,
  Clock,
  Sparkles,
  Building2,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  FileText,
  Calendar,
  Users,
  Check,
  ShieldCheck,
  Printer,
  Download,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import schoolLogo from "../assets/ideal-logo.jpg";

interface ExaminationPageProps {
  user: any;
  onBackToDashboard: () => void;
  onOpenMySchool?: () => void;
  onOpenTimetable?: () => void;
  onSignOut?: () => void;
}

const WINGS = ["All Wings", "Primary Wing (1-5)", "Middle Wing (6-8)", "Secondary (9-10)", "Sr. Secondary (11-12)"];

const EXAM_SCHEDULE = [
  {
    id: "ex-1",
    examName: "Half-Yearly Examination 2026",
    subject: "Physics & Chemistry (Theory)",
    grade: "Grade 12",
    section: "A & B (Science)",
    date: "Oct 28, 2026",
    time: "09:00 AM - 12:00 PM",
    room: "Examination Hall A & B",
    chiefInvigilator: "Dr. Rajesh Sharma",
    totalStudents: 92,
    hallTicketsIssued: 92,
    status: "Scheduled",
    marksDeadline: "Nov 05, 2026",
    wing: "Sr. Secondary (11-12)",
  },
  {
    id: "ex-2",
    examName: "Half-Yearly Examination 2026",
    subject: "Mathematics Standard / Basic",
    grade: "Grade 10",
    section: "A, B, C & D",
    date: "Oct 29, 2026",
    time: "09:00 AM - 12:00 PM",
    room: "Wing Rooms 201-208",
    chiefInvigilator: "Mrs. Sunita Verma",
    totalStudents: 164,
    hallTicketsIssued: 164,
    status: "Scheduled",
    marksDeadline: "Nov 06, 2026",
    wing: "Secondary (9-10)",
  },
  {
    id: "ex-3",
    examName: "Mid-Term Assessment",
    subject: "Social Science",
    grade: "Grade 8",
    section: "A & B",
    date: "Oct 30, 2026",
    time: "09:30 AM - 12:00 PM",
    room: "Middle Wing Block 3",
    chiefInvigilator: "Mr. Amit Trivedi",
    totalStudents: 84,
    hallTicketsIssued: 84,
    status: "Scheduled",
    marksDeadline: "Nov 08, 2026",
    wing: "Middle Wing (6-8)",
  },
  {
    id: "ex-4",
    examName: "Mid-Term Assessment",
    subject: "English Language & Literature",
    grade: "Grade 5",
    section: "Lotus & Rose",
    date: "Oct 26, 2026",
    time: "09:00 AM - 11:30 AM",
    room: "Primary Block 102",
    chiefInvigilator: "Ms. Kavita Rao",
    totalStudents: 78,
    hallTicketsIssued: 78,
    status: "Completed",
    marksDeadline: "Nov 02, 2026",
    wing: "Primary Wing (1-5)",
  },
  {
    id: "ex-5",
    examName: "Half-Yearly Examination 2026",
    subject: "Accountancy & Business Studies",
    grade: "Grade 11",
    section: "Commerce C",
    date: "Nov 02, 2026",
    time: "09:00 AM - 12:00 PM",
    room: "Senior Hall 304",
    chiefInvigilator: "Mr. Alok Sen",
    totalStudents: 54,
    hallTicketsIssued: 52,
    status: "Admit Cards Pending",
    marksDeadline: "Nov 10, 2026",
    wing: "Sr. Secondary (11-12)",
  },
];

const INVIGILATION_ROSTER = [
  { id: "inv-1", name: "Dr. Rajesh Sharma", dept: "Physics", assignedRoom: "Exam Hall A", shift: "Morning (08:30 - 12:30)", status: "Confirmed" },
  { id: "inv-2", name: "Mrs. Sunita Verma", dept: "Mathematics", assignedRoom: "Room 201-204", shift: "Morning (08:30 - 12:30)", status: "Confirmed" },
  { id: "inv-3", name: "Mr. Amit Trivedi", dept: "History", assignedRoom: "Block 3 Hall", shift: "Morning (08:30 - 12:30)", status: "Confirmed" },
  { id: "inv-4", name: "Ms. Neha Kapoor", dept: "Chemistry", assignedRoom: "Exam Hall B", shift: "Morning (08:30 - 12:30)", status: "Substitute Needed" },
  { id: "inv-5", name: "Mr. Vivek Nambiar", dept: "Computer Science", assignedRoom: "Room 304", shift: "Morning (08:30 - 12:30)", status: "Confirmed" },
];

export const ExaminationPage: React.FC<ExaminationPageProps> = ({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable,
  onSignOut,
}) => {
  const [selectedWing, setSelectedWing] = useState("All Wings");
  const [activeTab, setActiveTab] = useState<"datesheet" | "invigilation" | "marks_entry" | "hall_tickets">("datesheet");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredExams = EXAM_SCHEDULE.filter((exam) => {
    const matchesWing = selectedWing === "All Wings" || exam.wing === selectedWing;
    const matchesQuery =
      exam.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.examName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || exam.status === filterStatus;
    return matchesWing && matchesQuery && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-slate-100 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBackToDashboard}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 text-sm font-medium"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      Examination & Assessments
                    </h1>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Mid-Term Cycle
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Term datesheets, invigilation duty roster & marks entry status
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {onOpenMySchool && (
                <button
                  onClick={onOpenMySchool}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:flex items-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  My School
                </button>
              )}
              {onOpenTimetable && (
                <button
                  onClick={onOpenTimetable}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden md:flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Time Table
                </button>
              )}
              <ThemeToggle />
              <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800">
                <img
                  src={schoolLogo}
                  alt="School"
                  className="w-8 h-8 rounded-full border border-purple-300 dark:border-purple-700 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Exam Cycle</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">Half-Yearly</span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">2026-27</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Oct 26 – Nov 04 • 5 Wings enrolled</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Invigilation Coverage</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">96.8%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">allocated</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">38 of 40 exam halls staffed</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Admit Cards Issued</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">1,418 / 1,420</span>
            </div>
            <p className="mt-1 text-xs text-amber-500 dark:text-amber-400 font-medium">2 pending fee clearance</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Marks Entry Progress</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">68.4%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">verified</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Evaluation closes in 6 days</p>
          </div>
        </div>

        {/* Tab Selection & Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "datesheet", label: "Term Datesheet", icon: Calendar },
              { id: "invigilation", label: "Invigilation Duties", icon: UserCheck },
              { id: "marks_entry", label: "Marks Entry Status", icon: FileText },
              { id: "hall_tickets", label: "Hall Tickets", icon: ShieldCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-purple-600 text-white shadow-sm shadow-purple-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => alert("Datesheet PDF generated with QR validation stamp")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Schedule</span>
            </button>
            <button
              onClick={() => alert("Published to Student & Parent Mobile Portal")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm shadow-purple-600/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish Circular</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {WINGS.map((wing) => (
              <button
                key={wing}
                onClick={() => setSelectedWing(wing)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedWing === wing
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-purple-400"
                }`}
              >
                {wing}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Datesheet Content */}
        {activeTab === "datesheet" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {exam.grade} • {exam.section}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                        {exam.subject}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exam.examName}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        exam.status === "Scheduled"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                          : exam.status === "Completed"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" /> Date & Time
                      </span>
                      <span className="font-semibold">{exam.date} • {exam.time}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Building2 className="w-3.5 h-3.5 text-purple-500" /> Venue
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{exam.room}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <UserCheck className="w-3.5 h-3.5 text-purple-500" /> Invigilator
                      </span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">{exam.chiefInvigilator}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-purple-500" /> Marks Due
                      </span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">{exam.marksDeadline}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enrolled: <strong className="text-slate-900 dark:text-white">{exam.totalStudents}</strong> students
                    </span>
                    <button
                      onClick={() => alert(`Viewing seating arrangement and paper pack for ${exam.subject}`)}
                      className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 flex items-center gap-1"
                    >
                      Seating Plan <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Invigilation Duties */}
        {activeTab === "invigilation" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Invigilation Duty Allocation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Staff allocations and exam room verification</p>
              </div>
              <button
                onClick={() => alert("Auto-distributing balanced duties across department teachers...")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
              >
                Auto-Balance Duties
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-semibold">Staff Member</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Room Assigned</th>
                    <th className="pb-3 font-semibold">Duty Shift</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {INVIGILATION_ROSTER.map((staff) => (
                    <tr key={staff.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">{staff.name}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{staff.dept}</td>
                      <td className="py-3 font-semibold text-purple-600 dark:text-purple-400">{staff.assignedRoom}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{staff.shift}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            staff.status === "Confirmed"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                              : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                          }`}
                        >
                          {staff.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => alert(`Reassigning duty for ${staff.name}`)}
                          className="text-purple-600 dark:text-purple-400 font-medium hover:underline text-xs"
                        >
                          Reassign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Marks Entry Status */}
        {activeTab === "marks_entry" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Teacher Marks Submission Tracker</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track entry status, moderation check, and report card locking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">Grade 12 Physics (Theory)</span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">100% Submitted</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Submitted by Dr. Rajesh Sharma • 92 students locked</p>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-full" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">Grade 10 Mathematics</span>
                  <span className="text-xs text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full">65% In-Progress</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Evaluated by Mrs. Sunita Verma • 106 / 164 records entered</p>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full w-[65%]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Hall Tickets */}
        {activeTab === "hall_tickets" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Admit Card Distribution & Verification</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Barcode validation, student clearance checks and bulk printing</p>
              </div>
              <button
                onClick={() => alert("Bulk downloading all admit cards with photos and barcodes...")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Bulk Download All</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <h4 className="text-sm font-bold text-purple-900 dark:text-purple-200">Admit Cards Live on Mobile App</h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Parents can download authenticated hall tickets directly with QR security verification.
                  </p>
                </div>
              </div>
              <button
                onClick={() => alert("All digital cards signed and synchronized.")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 shadow-sm"
              >
                Sync Status
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExaminationPage;
