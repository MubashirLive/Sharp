import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookCheck,
  Clock,
  Sparkles,
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  Users,
  Check,
  ClipboardList,
  Edit3,
  FileCheck,
  AlertTriangle,
  Bookmark
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import schoolLogo from "../assets/ideal-logo.jpg";

interface NotebookCheckingPageProps {
  user: any;
  onBackToDashboard: () => void;
  onOpenMySchool?: () => void;
  onOpenTimetable?: () => void;
  onSignOut?: () => void;
}

const WINGS = ["All Wings", "Primary Wing (1-5)", "Middle Wing (6-8)", "Secondary (9-10)", "Sr. Secondary (11-12)"];

const NOTEBOOK_AUDITS = [
  {
    id: "nb-1",
    subject: "Mathematics Homework & Classwork",
    grade: "Grade 10",
    section: "Section A",
    teacher: "Mrs. Sunita Verma",
    totalNotebooks: 42,
    checkedCount: 42,
    backlog: 0,
    qualityScore: 96,
    indexUpdated: true,
    correctionsDone: true,
    lastAuditDate: "Yesterday",
    status: "Verified & Approved",
    wing: "Secondary (9-10)",
  },
  {
    id: "nb-2",
    subject: "English Literature Note Journal",
    grade: "Grade 8",
    section: "Lotus",
    teacher: "Mrs. Meenakshi Joshi",
    totalNotebooks: 38,
    checkedCount: 38,
    backlog: 0,
    qualityScore: 94,
    indexUpdated: true,
    correctionsDone: true,
    lastAuditDate: "Oct 24, 2026",
    status: "Verified & Approved",
    wing: "Middle Wing (6-8)",
  },
  {
    id: "nb-3",
    subject: "Physics Lab Manual & Notes",
    grade: "Grade 11",
    section: "Science A",
    teacher: "Dr. Rajesh Sharma",
    totalNotebooks: 46,
    checkedCount: 39,
    backlog: 7,
    qualityScore: 88,
    indexUpdated: true,
    correctionsDone: false,
    lastAuditDate: "Oct 22, 2026",
    status: "Correction In-Progress",
    wing: "Sr. Secondary (11-12)",
  },
  {
    id: "nb-4",
    subject: "Hindi Vyakaran & Nibandh",
    grade: "Grade 6",
    section: "Section B",
    teacher: "Mr. Rameshwar Prasad",
    totalNotebooks: 36,
    checkedCount: 27,
    backlog: 9,
    qualityScore: 78,
    indexUpdated: false,
    correctionsDone: false,
    lastAuditDate: "Oct 19, 2026",
    status: "Needs Follow-up",
    wing: "Middle Wing (6-8)",
  },
  {
    id: "nb-5",
    subject: "Environmental Studies (EVS)",
    grade: "Grade 3",
    section: "Bluebells",
    teacher: "Ms. Ananya Roy",
    totalNotebooks: 32,
    checkedCount: 32,
    backlog: 0,
    qualityScore: 98,
    indexUpdated: true,
    correctionsDone: true,
    lastAuditDate: "Oct 23, 2026",
    status: "Verified & Approved",
    wing: "Primary Wing (1-5)",
  },
];

export const NotebookCheckingPage: React.FC<NotebookCheckingPageProps> = ({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable,
  onSignOut,
}) => {
  const [selectedWing, setSelectedWing] = useState("All Wings");
  const [activeTab, setActiveTab] = useState<"audits" | "backlog" | "standards">("audits");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAudits = NOTEBOOK_AUDITS.filter((audit) => {
    const matchesWing = selectedWing === "All Wings" || audit.wing === selectedWing;
    const matchesQuery =
      audit.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.grade.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWing && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/20 to-slate-100 dark:from-slate-950 dark:via-amber-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                  <BookCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      Notebook Checking & Quality Audit
                    </h1>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Fortnightly Audit
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track homework correction, index updation, feedback quality & teacher backlogs
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
                  className="w-8 h-8 rounded-full border border-amber-300 dark:border-amber-700 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Audited Sets</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">124 / 140</span>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">88.5%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">16 sets pending audit by HODs</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Correction Quality Avg</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">92.4%</span>
              <span className="text-xs text-emerald-500 font-medium">High Standard</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Constructive feedback present in 94%</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Teacher Backlog</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600">16 Sets</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">&gt; 3 days old</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Automatic reminder alert active</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Parent Endorsement</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FileCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">89.2%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">signed notes</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Parent signature checked weekly</p>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "audits", label: "Audit Submissions", icon: ClipboardList },
              { id: "backlog", label: "Correction Backlog", icon: AlertCircle },
              { id: "standards", label: "Quality Standards & Rubric", icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-amber-600 text-white shadow-sm shadow-amber-500/20"
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
              onClick={() => alert("Scheduled next round of random sample notebook inspections")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Initiate New Audit Round</span>
            </button>
          </div>
        </div>

        {/* Wing and Search Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {WINGS.map((wing) => (
              <button
                key={wing}
                onClick={() => setSelectedWing(wing)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedWing === wing
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-amber-400"
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
              placeholder="Search teacher, subject or grade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Tab 1: Audit List Cards */}
        {activeTab === "audits" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAudits.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {item.grade} • {item.section}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                      {item.subject}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{item.teacher}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                      item.status === "Verified & Approved"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : item.status === "Correction In-Progress"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Notebooks Checked</span>
                    <span className="font-semibold">{item.checkedCount} / {item.totalNotebooks}</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${(item.checkedCount / item.totalNotebooks) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Index & Dates Updated</span>
                    <span className={item.indexUpdated ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                      {item.indexUpdated ? "Yes, Complete" : "Missing Entries"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Audit Score</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{item.qualityScore} / 100</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Audited {item.lastAuditDate}</span>
                  <button
                    onClick={() => alert(`Digital inspection stamp signed by Principal for ${item.subject}`)}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Review & Stamp <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Backlog View */}
        {activeTab === "backlog" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Teacher Checking Backlog</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Classes where notebook correction is pending past the 72-hour window</p>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Mr. Rameshwar Prasad • Grade 6 Hindi</h4>
                  <p className="text-slate-400 text-[11px]">9 notebooks pending since Oct 19 • 5 days overdue</p>
                </div>
                <button
                  onClick={() => alert("Notification reminder dispatched to teacher.")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                >
                  Send Nudge
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200">Dr. Rajesh Sharma • Grade 11 Physics</h4>
                  <p className="text-slate-400 text-[11px]">7 lab reports pending since Oct 22 • 2 days overdue</p>
                </div>
                <button
                  onClick={() => alert("Notification reminder dispatched to teacher.")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200"
                >
                  Send Nudge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Standards */}
        {activeTab === "standards" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Institutional Checking Guidelines & Rubrics</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Strict quality criteria enforced across all academic departments</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <span className="font-bold text-amber-600 text-xs uppercase">1. Up-to-Date Index</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                  Every notebook must have a systematically maintained index with serial numbers, topics, dates, and teacher signatures.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <span className="font-bold text-amber-600 text-xs uppercase">2. Constructive Remarks</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                  Mere checkmarks are discouraged; teachers must underline errors and provide constructive suggestions for improvement.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <span className="font-bold text-amber-600 text-xs uppercase">3. Parent Signature Follow-up</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                  Teachers must ensure parent countersignatures on major corrections and periodic chapter-end assessments.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NotebookCheckingPage;
