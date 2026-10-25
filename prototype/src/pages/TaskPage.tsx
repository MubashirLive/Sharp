import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckSquare,
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
  ListTodo,
  Plus,
  AlertTriangle,
  Tag,
  UserCheck,
  Flag,
  MoreVertical
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import schoolLogo from "../assets/ideal-logo.jpg";

interface TaskPageProps {
  user: any;
  onBackToDashboard: () => void;
  onOpenMySchool?: () => void;
  onOpenTimetable?: () => void;
  onSignOut?: () => void;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  assignee: string;
  role: string;
  dueDate: string;
  priority: "Urgent" | "High" | "Medium" | "Normal";
  category: "Compliance" | "Academic" | "Administration" | "Events";
  status: "todo" | "in_progress" | "review" | "completed";
}

const INITIAL_TASKS: TaskItem[] = [
  {
    id: "tsk-1",
    title: "CBSE Affiliation Extension Safety Audit",
    description: "Compile fire safety, structural fitness certificates and upload to SARAS portal.",
    assignee: "Mr. Alok Sen",
    role: "Admin Officer",
    dueDate: "Oct 30, 2026",
    priority: "Urgent",
    category: "Compliance",
    status: "in_progress",
  },
  {
    id: "tsk-2",
    title: "Mid-Term Question Paper Moderation",
    description: "Ensure bilingual formatting and syllabus compliance for Grade 9-12 sets.",
    assignee: "Dr. Rajesh Sharma",
    role: "Academic Dean",
    dueDate: "Oct 27, 2026",
    priority: "High",
    category: "Academic",
    status: "todo",
  },
  {
    id: "tsk-3",
    title: "Annual Sports Day Ground Logistics",
    description: "Vendor quotations for track marking, audio system, and chief guest invitation cards.",
    assignee: "Coach Vikram Rathore",
    role: "HOD Sports",
    dueDate: "Nov 05, 2026",
    priority: "Medium",
    category: "Events",
    status: "todo",
  },
  {
    id: "tsk-4",
    title: "Quarterly Staff Biometric Attendance Reconciliation",
    description: "Verify medical leaves and finalize loss of pay adjustments for October payroll.",
    assignee: "Mrs. Preeti Kapoor",
    role: "HR Executive",
    dueDate: "Oct 28, 2026",
    priority: "High",
    category: "Administration",
    status: "review",
  },
  {
    id: "tsk-5",
    title: "Science Laboratory Chemical Inventory Audit",
    description: "Verify disposal of expired reagents and stock hazardous materials safely in Chemistry lab.",
    assignee: "Ms. Neha Kapoor",
    role: "Lab In-Charge",
    dueDate: "Oct 24, 2026",
    priority: "Normal",
    category: "Compliance",
    status: "completed",
  },
  {
    id: "tsk-6",
    title: "Parent-Teacher Meeting (PTM) Digital Slot Scheduling",
    description: "Open time slot booking in parent app for upcoming Grade 10 & 12 progress reviews.",
    assignee: "Mr. Vivek Nambiar",
    role: "IT Coordinator",
    dueDate: "Oct 29, 2026",
    priority: "High",
    category: "Academic",
    status: "in_progress",
  },
];

export const TaskPage: React.FC<TaskPageProps> = ({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable,
  onSignOut,
}) => {
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<"kanban" | "list" | "compliance">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  const moveTask = (id: string, newStatus: TaskItem["status"]) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesCat = filterCategory === "All" || t.category === filterCategory;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignee.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const columns: { id: TaskItem["status"]; title: string; color: string }[] = [
    { id: "todo", title: "To Do", color: "border-slate-300 dark:border-slate-700" },
    { id: "in_progress", title: "In Progress", color: "border-blue-400 dark:border-blue-700" },
    { id: "review", title: "Principal Review", color: "border-amber-400 dark:border-amber-700" },
    { id: "completed", title: "Completed", color: "border-emerald-400 dark:border-emerald-700" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/20 to-slate-100 dark:from-slate-950 dark:via-sky-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      Tasks & Delegation
                    </h1>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      Institutional Kanban
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Track statutory compliance, administrative deliverables & teacher action items
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
                  className="w-8 h-8 rounded-full border border-sky-300 dark:border-sky-700 object-cover"
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
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Action Items</span>
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <ListTodo className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">28 Tasks</span>
              <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">Active</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Assigned across 14 staff members</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Resolved This Month</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">64 Tasks</span>
              <span className="text-xs text-emerald-500 font-medium">96% on-time</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Average closure: 3.4 days</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">High Priority / Urgent</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600">5 Tasks</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Includes 2 statutory filings</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">3 Items</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">for sign-off</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Requires Principal approval</p>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "kanban", label: "Kanban Board", icon: CheckSquare },
              { id: "list", label: "All Tasks List", icon: ListTodo },
              { id: "compliance", label: "Statutory & Compliance", icon: Flag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-sky-600 text-white shadow-sm shadow-sky-500/20"
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
              onClick={() => {
                const title = prompt("Enter new task title:");
                if (title) {
                  setTasks((prev) => [
                    {
                      id: `tsk-${Date.now()}`,
                      title,
                      description: "Added from quick task creator",
                      assignee: "Self (Principal)",
                      role: "Principal",
                      dueDate: "Next Week",
                      priority: "High",
                      category: "Administration",
                      status: "todo",
                    },
                    ...prev,
                  ]);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-700 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Task</span>
            </button>
          </div>
        </div>

        {/* Category and Search Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Compliance", "Academic", "Administration", "Events"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterCategory === cat
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-sky-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, assignees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Tab 1: Kanban Board */}
        {activeTab === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 min-h-[500px] flex flex-col"
                >
                  <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200 dark:border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                        {col.title}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {colTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow transition-shadow space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                              t.priority === "Urgent"
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                                : t.priority === "High"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            {t.priority}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{t.category}</span>
                        </div>

                        <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2">
                          {t.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                          {t.description}
                        </p>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[9px]">Assignee</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{t.assignee}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 block text-[9px]">Due</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{t.dueDate}</span>
                          </div>
                        </div>

                        {/* Status switcher buttons */}
                        <div className="pt-2 flex items-center justify-end gap-1">
                          {col.id !== "todo" && (
                            <button
                              onClick={() => moveTask(t.id, col.id === "completed" ? "review" : col.id === "review" ? "in_progress" : "todo")}
                              className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                            >
                              ← Back
                            </button>
                          )}
                          {col.id !== "completed" && (
                            <button
                              onClick={() => moveTask(t.id, col.id === "todo" ? "in_progress" : col.id === "in_progress" ? "review" : "completed")}
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-300 hover:bg-sky-100"
                            >
                              Advance →
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && (
                      <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                        No tasks in this lane
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: List View */}
        {activeTab === "list" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="pb-3 font-semibold">Task</th>
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold">Assignee</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Priority</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-medium text-slate-900 dark:text-white max-w-xs">{t.title}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{t.category}</td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">{t.assignee} ({t.role})</td>
                      <td className="py-3 font-medium">{t.dueDate}</td>
                      <td className="py-3 font-semibold text-rose-600">{t.priority}</td>
                      <td className="py-3 font-semibold uppercase text-[10px] text-sky-600">{t.status.replace("_", " ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Compliance */}
        {activeTab === "compliance" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Statutory & Board Compliance Calendar</h3>
            <p className="text-xs text-slate-500">Affiliation renewal, building fitness, RTE compliances & fire NOC checklists</p>
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">SARAS CBSE Portal Status: Green</h4>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">All mandatory certificates updated for the 2026-27 cycle.</p>
              </div>
              <button
                onClick={() => alert("Verification certificates downloaded")}
                className="px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 rounded-lg shadow-sm"
              >
                Download Packet
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TaskPage;
