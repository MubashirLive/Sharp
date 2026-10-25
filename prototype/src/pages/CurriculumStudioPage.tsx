import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpen,
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
  Award,
  Layers,
  FileText,
  Calendar,
  Users,
  Check,
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import schoolLogo from "../assets/ideal-logo.jpg";

interface CurriculumStudioPageProps {
  user: any;
  onBackToDashboard: () => void;
  onOpenMySchool?: () => void;
  onOpenTimetable?: () => void;
  onSignOut?: () => void;
}

const WINGS = ["All Wings", "Primary Wing (1-5)", "Middle Wing (6-8)", "Secondary (9-10)", "Sr. Secondary (11-12)"];

const SUBJECT_PACING_DATA = [
  {
    id: "cur-1",
    subject: "Physics",
    code: "PHY-042",
    wing: "Sr. Secondary (11-12)",
    grade: "Grade 12",
    totalUnits: 14,
    completedUnits: 10,
    progress: 71,
    leadTeacher: "Dr. Ramanathan Swamy",
    currentUnit: "Electromagnetic Induction & AC Currents",
    status: "On Track",
    lastAudit: "Yesterday",
    bloomsLevel: "Application & Analysis",
  },
  {
    id: "cur-2",
    subject: "Mathematics",
    code: "MAT-041",
    wing: "Secondary (9-10)",
    grade: "Grade 10",
    totalUnits: 15,
    completedUnits: 12,
    progress: 80,
    leadTeacher: "Ms. Rekha Sharma",
    currentUnit: "Surface Areas and Volumes",
    status: "Ahead",
    lastAudit: "3 days ago",
    bloomsLevel: "Problem Solving",
  },
  {
    id: "cur-3",
    subject: "Chemistry",
    code: "CHE-043",
    wing: "Sr. Secondary (11-12)",
    grade: "Grade 11",
    totalUnits: 14,
    completedUnits: 8,
    progress: 57,
    leadTeacher: "Mr. Aakash Verma",
    currentUnit: "Thermodynamics & Equilibrium",
    status: "Needs Attention",
    lastAudit: "Today",
    bloomsLevel: "Theoretical Evaluation",
  },
  {
    id: "cur-4",
    subject: "English Literature",
    code: "ENG-101",
    wing: "Middle Wing (6-8)",
    grade: "Grade 8",
    totalUnits: 18,
    completedUnits: 13,
    progress: 72,
    leadTeacher: "Ms. Patricia Gomes",
    currentUnit: "Poetry Anthology: The Solitary Reaper",
    status: "On Track",
    lastAudit: "2 days ago",
    bloomsLevel: "Critical Appreciation",
  },
  {
    id: "cur-5",
    subject: "Computer Science",
    code: "CS-083",
    wing: "Sr. Secondary (11-12)",
    grade: "Grade 12",
    totalUnits: 12,
    completedUnits: 11,
    progress: 92,
    leadTeacher: "Mr. Karthik Menon",
    currentUnit: "SQL Connectivity & Django Framework",
    status: "Ahead",
    lastAudit: "Oct 22",
    bloomsLevel: "Synthesis & Creation",
  },
  {
    id: "cur-6",
    subject: "Social Science",
    code: "SST-087",
    wing: "Secondary (9-10)",
    grade: "Grade 9",
    totalUnits: 16,
    completedUnits: 11,
    progress: 68,
    leadTeacher: "Mrs. Ananya Sen",
    currentUnit: "Electoral Politics in Democratic India",
    status: "On Track",
    lastAudit: "Oct 23",
    bloomsLevel: "Comprehension & Civic Insight",
  },
];

const RECENT_LESSON_PLANS = [
  {
    id: "lp-1",
    title: "Ray Optics & Dispersion Phenomenon",
    teacher: "Dr. Ramanathan Swamy",
    subject: "Physics (Grade 12)",
    submittedOn: "Today, 09:30 AM",
    status: "Approved",
    bloomLevel: "Synthesis",
  },
  {
    id: "lp-2",
    title: "Quadratic Equations Word Problems Analysis",
    teacher: "Ms. Rekha Sharma",
    subject: "Mathematics (Grade 10)",
    submittedOn: "Yesterday, 04:15 PM",
    status: "Approved",
    bloomLevel: "Problem Solving",
  },
  {
    id: "lp-3",
    title: "Chemical Bonding Hybridization Theory Lab",
    teacher: "Mr. Aakash Verma",
    subject: "Chemistry (Grade 11)",
    submittedOn: "2 days ago",
    status: "Pending Review",
    bloomLevel: "Laboratory Practical",
  },
  {
    id: "lp-4",
    title: "Shakespeare's Merchant of Venice Act III",
    teacher: "Ms. Patricia Gomes",
    subject: "English (Grade 8)",
    submittedOn: "Oct 21",
    status: "Needs Revision",
    bloomLevel: "Dramatization",
  },
];

export default function CurriculumStudioPage({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable,
  onSignOut,
}: CurriculumStudioPageProps) {
  const [selectedWing, setSelectedWing] = useState("All Wings");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pacing" | "lesson_plans">("pacing");

  const filteredPacing = SUBJECT_PACING_DATA.filter((item) => {
    const matchesWing = selectedWing === "All Wings" || item.wing === selectedWing;
    const matchesSearch =
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.leadTeacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.currentUnit.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWing && matchesSearch;
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
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Curriculum Studio</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">
                    Syllabus & Pacing
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
                <div className="text-[10px] text-amber-600 dark:text-amber-400 leading-tight font-medium">{user.roleTitle}</div>
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
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold text-white uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Academic Year 2026-27 • Pacing Framework</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Institutional Curriculum & Lesson Mastery Studio
            </h1>
            <p className="text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
              Monitor real-time chapter progression, audit Bloom's Taxonomy learning outcomes, and review educator lesson blueprints across departments.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 relative z-10">
            <button
              type="button"
              className="px-4 py-2.5 rounded-2xl bg-white text-amber-900 font-bold text-xs shadow-md hover:bg-amber-50 transition-all cursor-pointer flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>New Lesson Plan</span>
            </button>
          </div>
        </div>

        {/* ── 4 STAT METRICS CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Curriculum Units</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">142</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">48 Active Subjects</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Overall Pacing</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">68.4%</div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">On Track vs Term Target</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Plans Approved</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">94.2%</div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">4 Under Review</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bloom's Coverage</span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">88.0%</div>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Mapped to Outcomes</span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* ── TABS & FILTERS BAR ── */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 self-start">
            <button
              type="button"
              onClick={() => setActiveTab("pacing")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "pacing"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Syllabus Pacing Matrix
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("lesson_plans")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "lesson_plans"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Weekly Lesson Plans
            </button>
          </div>

          {/* Search & Wing filter */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject, teacher, unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500 w-56"
              />
            </div>

            <select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold cursor-pointer focus:outline-hidden"
            >
              {WINGS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── TAB CONTENT ── */}
        {activeTab === "pacing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPacing.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -3 }}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-md transition-all flex flex-col justify-between text-left space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {item.subject} • {item.grade}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{item.wing}</p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "Ahead"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : item.status === "On Track"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">Syllabus Completion</span>
                      <span className="text-slate-900 dark:text-white font-mono font-bold">{item.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.progress >= 80 ? "bg-emerald-500" : item.progress >= 65 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span>
                        {item.completedUnits} of {item.totalUnits} Units Finished
                      </span>
                      <span>Audited {item.lastAudit}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-xs">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Active Unit</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.currentUnit}</div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                      Focus: {item.bloomsLevel}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium truncate">
                    <Users className="w-3.5 h-3.5 shrink-0 opacity-70" />
                    <span className="truncate">{item.leadTeacher}</span>
                  </div>
                  <button
                    type="button"
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 font-bold shrink-0 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {activeTab === "lesson_plans" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Educator Weekly Lesson Submissions</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Review, approve, or request revisions for upcoming week instructional methodologies.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {RECENT_LESSON_PLANS.map((plan) => (
                <div key={plan.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{plan.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {plan.bloomLevel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{plan.subject}</span>
                      <span>•</span>
                      <span>By {plan.teacher}</span>
                      <span>•</span>
                      <span>Submitted {plan.submittedOn}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        plan.status === "Approved"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : plan.status === "Pending Review"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {plan.status}
                    </span>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      View Plan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
