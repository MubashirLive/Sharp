import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  FileText,
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
  Target,
  BarChart3,
  HelpCircle,
  Plus
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import schoolLogo from "../assets/ideal-logo.jpg";

interface TestPageProps {
  user: any;
  onBackToDashboard: () => void;
  onOpenMySchool?: () => void;
  onOpenTimetable?: () => void;
  onSignOut?: () => void;
}

const WINGS = ["All Wings", "Primary Wing (1-5)", "Middle Wing (6-8)", "Secondary (9-10)", "Sr. Secondary (11-12)"];

const UNIT_TESTS = [
  {
    id: "ut-1",
    testName: "Unit Test 4: Thermodynamics & Kinetic Theory",
    subject: "Physics",
    grade: "Grade 11",
    section: "A & B",
    scheduledDate: "Tomorrow, 09:30 AM",
    duration: "45 mins",
    maxMarks: 25,
    avgScore: "21.4 / 25",
    evaluated: true,
    highestScore: 25,
    remedialCount: 4,
    teacher: "Dr. Rajesh Sharma",
    wing: "Sr. Secondary (11-12)",
  },
  {
    id: "ut-2",
    testName: "Weekly Assessment: Quadratic Equations",
    subject: "Mathematics",
    grade: "Grade 10",
    section: "A, B, C",
    scheduledDate: "Oct 27, 2026",
    duration: "40 mins",
    maxMarks: 20,
    avgScore: "16.8 / 20",
    evaluated: true,
    highestScore: 20,
    remedialCount: 8,
    teacher: "Mrs. Sunita Verma",
    wing: "Secondary (9-10)",
  },
  {
    id: "ut-3",
    testName: "Grammar & Comprehension Quiz",
    subject: "English Core",
    grade: "Grade 9",
    section: "All Sections",
    scheduledDate: "Oct 29, 2026",
    duration: "30 mins",
    maxMarks: 20,
    avgScore: "Pending Evaluation",
    evaluated: false,
    highestScore: "-",
    remedialCount: 0,
    teacher: "Mrs. Meenakshi Joshi",
    wing: "Secondary (9-10)",
  },
  {
    id: "ut-4",
    testName: "Light: Reflection and Refraction",
    subject: "Science",
    grade: "Grade 7",
    section: "Newton & Einstein",
    scheduledDate: "Oct 24, 2026",
    duration: "45 mins",
    maxMarks: 30,
    avgScore: "24.2 / 30",
    evaluated: true,
    highestScore: 30,
    remedialCount: 3,
    teacher: "Mr. Amit Trivedi",
    wing: "Middle Wing (6-8)",
  },
  {
    id: "ut-5",
    testName: "Numbers & Mental Arithmetic Speed Test",
    subject: "Mathematics",
    grade: "Grade 4",
    section: "Daffodils",
    scheduledDate: "Oct 23, 2026",
    duration: "25 mins",
    maxMarks: 15,
    avgScore: "13.8 / 15",
    evaluated: true,
    highestScore: 15,
    remedialCount: 2,
    teacher: "Ms. Kavita Rao",
    wing: "Primary Wing (1-5)",
  },
];

const REMEDIAL_STUDENTS = [
  { id: "rem-1", name: "Aarav Gupta", grade: "Grade 10-B", subject: "Mathematics", score: "07 / 20", weakArea: "Quadratic word problems", assignedTutor: "Mrs. Sunita Verma" },
  { id: "rem-2", name: "Riya Sen", grade: "Grade 11-A", subject: "Physics", score: "09 / 25", weakArea: "Derivations & numericals", assignedTutor: "Dr. Rajesh Sharma" },
  { id: "rem-3", name: "Kabir Mehta", grade: "Grade 7-N", subject: "Science", score: "11 / 30", weakArea: "Ray diagrams", assignedTutor: "Mr. Amit Trivedi" },
  { id: "rem-4", name: "Tanvi Saxena", grade: "Grade 10-A", subject: "Mathematics", score: "08 / 20", weakArea: "Sign conventions", assignedTutor: "Mrs. Sunita Verma" },
];

export const TestPage: React.FC<TestPageProps> = ({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable,
  onSignOut,
}) => {
  const [selectedWing, setSelectedWing] = useState("All Wings");
  const [activeTab, setActiveTab] = useState<"schedule" | "remedial" | "analytics">("schedule");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTests = UNIT_TESTS.filter((t) => {
    const matchesWing = selectedWing === "All Wings" || t.wing === selectedWing;
    const matchesQuery =
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.grade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.testName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWing && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-slate-100 dark:from-slate-950 dark:via-teal-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      Tests & Formative Assessments
                    </h1>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      Weekly Trackers
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Continuous evaluation, weekly unit tests & early intervention support
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
                  className="w-8 h-8 rounded-full border border-teal-300 dark:border-teal-700 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Scheduled This Week</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">16 Tests</span>
              <span className="text-xs text-teal-600 dark:text-teal-400 font-semibold">Active</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">All wings covered on Friday roster</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">School Avg Score</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">81.6%</span>
              <span className="text-xs text-emerald-500 font-medium">+3.2% vs last cycle</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Across 620 assessed students</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Remedial Support</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">17 Students</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Personalized remedial slots booked</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Evaluation Speed</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">2.1 Days</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">avg turnaround</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Target turnaround is 3 days</p>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "schedule", label: "Weekly Test Schedule", icon: Calendar },
              { id: "remedial", label: "Remedial & Interventions", icon: AlertCircle },
              { id: "analytics", label: "Score Analytics", icon: BarChart3 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-teal-600 text-white shadow-sm shadow-teal-500/20"
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
              onClick={() => alert("Creating new unit test schedule entry...")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Test</span>
            </button>
          </div>
        </div>

        {/* Wings and Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {WINGS.map((wing) => (
              <button
                key={wing}
                onClick={() => setSelectedWing(wing)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedWing === wing
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-teal-400"
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
              placeholder="Search test, subject or class..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Tab 1: Schedule View */}
        {activeTab === "schedule" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test) => (
              <div
                key={test.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      {test.grade} • {test.section}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                      {test.testName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{test.subject} • {test.teacher}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                      test.evaluated
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    }`}
                  >
                    {test.evaluated ? "Evaluated" : "Upcoming"}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">When</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{test.scheduledDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Duration</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{test.duration} ({test.maxMarks}m)</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Class Avg</span>
                    <p className="font-bold text-teal-600 dark:text-teal-400">{test.avgScore}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Remedial Flag</span>
                    <p className={`font-semibold ${test.remedialCount > 0 ? "text-rose-600" : "text-slate-500"}`}>
                      {test.remedialCount} students
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => alert(`Opening score breakdown for ${test.testName}`)}
                    className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    View Scorecard <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => alert(`Parent SMS sent for ${test.subject} scores.`)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Notify Parents
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Remedial Roster */}
        {activeTab === "remedial" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Targeted Remedial Support Roster</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Students flagged below benchmark for individual intervention</p>
              </div>
              <button
                onClick={() => alert("Assigned extra zero-period practice sessions.")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
              >
                Schedule Zero-Period Clinics
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="pb-3 font-semibold">Student Name</th>
                    <th className="pb-3 font-semibold">Class / Section</th>
                    <th className="pb-3 font-semibold">Subject</th>
                    <th className="pb-3 font-semibold">Recent Score</th>
                    <th className="pb-3 font-semibold">Identified Weak Area</th>
                    <th className="pb-3 font-semibold">Assigned Mentor</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {REMEDIAL_STUDENTS.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">{st.name}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{st.grade}</td>
                      <td className="py-3 font-medium text-teal-600 dark:text-teal-400">{st.subject}</td>
                      <td className="py-3 font-bold text-rose-600">{st.score}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{st.weakArea}</td>
                      <td className="py-3 font-medium text-slate-700 dark:text-slate-300">{st.assignedTutor}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => alert(`Parent meeting arranged for ${st.name}`)}
                          className="text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                        >
                          Book Parent Meet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Analytics */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Subject Mastery Bell Curve</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Aggregate performance distribution across recent weekly cycles</p>
              <div className="mt-6 space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Outstanding (&gt; 90%)</span>
                    <span className="text-teal-600">34% of students</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-teal-500 h-full rounded-full w-[34%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Proficient (70% - 89%)</span>
                    <span className="text-blue-600">48% of students</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full w-[48%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>Needs Attention (&lt; 50%)</span>
                    <span className="text-rose-600">8% of students</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full w-[8%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Performing Cohorts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Weekly leaderboard recognizing high academic effort</p>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">1. Grade 11-A (Physics)</span>
                  <span className="font-bold text-emerald-600">92.4% avg</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">2. Grade 10-C (Mathematics)</span>
                  <span className="font-bold text-emerald-600">88.9% avg</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">3. Grade 8-A (Social Science)</span>
                  <span className="font-bold text-emerald-600">86.2% avg</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TestPage;
