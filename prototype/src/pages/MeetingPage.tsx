import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
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
  Check,
  Video,
  FileText,
  MapPin,
  Plus,
  Share2,
  MessageSquare
} from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";
import schoolLogo from "../assets/ideal-logo.jpg";

interface MeetingPageProps {
  user: any;
  onBackToDashboard: () => void;
  onOpenMySchool?: () => void;
  onOpenTimetable?: () => void;
  onSignOut?: () => void;
}

const MEETINGS_DATA = [
  {
    id: "mtg-1",
    title: "Weekly Senior Leadership & Academic Council",
    category: "Academic Council",
    dateTime: "Today, 02:30 PM - 03:45 PM",
    venue: "Conference Room A / Boardroom",
    host: "Principal Dr. Vandana Roy",
    attendeesCount: 12,
    attendees: ["HOD Science", "HOD Math", "HOD English", "Academic Dean", "Senior Vice Principal"],
    agenda: ["Half-yearly examination readiness", "Winter uniform transition circular", "Remedial clinic rosters"],
    momStatus: "Pending Conduct",
    isLiveOrSoon: true,
  },
  {
    id: "mtg-2",
    title: "Secondary Wing Staff Morning Briefing",
    category: "Staff Huddle",
    dateTime: "Tomorrow, 07:45 AM - 08:05 AM",
    venue: "Central Auditorium",
    host: "Vice Principal (Secondary)",
    attendeesCount: 38,
    attendees: ["All Grade 9 & 10 Class Teachers & Subject Faculty"],
    agenda: ["Zero-period discipline monitoring", "CBSE registration verification check"],
    momStatus: "Scheduled",
    isLiveOrSoon: false,
  },
  {
    id: "mtg-3",
    title: "Annual Term-1 Parent-Teacher Conference (PTM)",
    category: "PTM Coordination",
    dateTime: "Saturday, Nov 01 • 08:30 AM - 01:30 PM",
    venue: "All Classrooms & Online Hybrid Slots",
    host: "Academic Directorate",
    attendeesCount: 1420,
    attendees: ["All Parents & Teachers"],
    agenda: ["Report card distribution", "Subject progress discussion", "Counselor consultations"],
    momStatus: "Slots 92% Booked",
    isLiveOrSoon: false,
  },
  {
    id: "mtg-4",
    title: "Discipline & Pastoral Care Committee Review",
    category: "Committee",
    dateTime: "Oct 24, 2026 • 03:00 PM",
    venue: "Principal Office",
    host: "Head of Student Welfare",
    attendeesCount: 6,
    attendees: ["School Counselor", "HOD PE", "Hostel Warden", "Senior Coordinator"],
    agenda: ["Student anti-bullying compliance review", "Bus route safety updates"],
    momStatus: "MOM Published",
    isLiveOrSoon: false,
  },
];

export const MeetingPage: React.FC<MeetingPageProps> = ({
  user,
  onBackToDashboard,
  onOpenMySchool,
  onOpenTimetable,
  onSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "ptm" | "mom">("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  const filteredMeetings = MEETINGS_DATA.filter((m) => {
    const matchesCat = selectedCat === "All" || m.category === selectedCat;
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.host.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                      Meetings & Parent-Teacher Conferences
                    </h1>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      Council & PTM
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Staff huddles, Academic Council deliberations & PTM slot bookings
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
                  className="w-8 h-8 rounded-full border border-indigo-300 dark:border-indigo-700 object-cover"
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
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">This Week's Meetings</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">6 Scheduled</span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">1 Today</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Academic Council meets at 02:30 PM</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PTM Bookings</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">92.4%</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">capacity</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">1,312 parent time slots reserved</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Action Items from MOM</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">18 Open</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">tracked</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">12 closed in previous week</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Staff Attendance Rate</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">98.1%</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Across morning briefings</p>
          </div>
        </div>

        {/* Tab & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "upcoming", label: "Scheduled Meetings & Huddles", icon: Calendar },
              { id: "ptm", label: "PTM Slot Management", icon: Users },
              { id: "mom", label: "Minutes of Meeting (MOM)", icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
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
              onClick={() => alert("Convening new meeting notification to committee members")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Convene New Meeting</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
            {["All", "Academic Council", "Staff Huddle", "PTM Coordination", "Committee"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCat === cat
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-400"
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
              placeholder="Search meeting, host or agenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Tab 1: Meetings List */}
        {activeTab === "upcoming" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeetings.map((mtg) => (
              <div
                key={mtg.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {mtg.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                        {mtg.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Chaired by {mtg.host}</p>
                    </div>
                    {mtg.isLiveOrSoon && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" /> Today
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span className="font-medium">{mtg.dateTime}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span>{mtg.venue}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                      <span>{mtg.attendeesCount} participants ({mtg.attendees.slice(0, 2).join(", ")}...)</span>
                    </div>

                    <div className="mt-3 pt-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Key Agenda Topics</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300 text-[11px]">
                        {mtg.agenda.map((ag, i) => (
                          <li key={i}>{ag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Status: {mtg.momStatus}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert(`Opening agenda details and RSVP tracker for ${mtg.title}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => alert(`Starting session for ${mtg.title}`)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Start Meeting
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: PTM Management */}
        {activeTab === "ptm" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Annual Term-1 PTM Booking Matrix</h3>
                <p className="text-xs text-slate-500">Slot allocation across 10-minute parent intervals</p>
              </div>
              <button
                onClick={() => alert("Broadcasted reminder notification to parents who haven't booked slots.")}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              >
                Broadcast Reminder to Parents
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Primary Wing (Grades 1-5)</span>
                <p className="text-xs text-slate-500 mt-1">420 of 440 slots reserved (95.4%)</p>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[95%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Middle Wing (Grades 6-8)</span>
                <p className="text-xs text-slate-500 mt-1">372 of 410 slots reserved (90.7%)</p>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[90%]" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Senior Wing (Grades 9-12)</span>
                <p className="text-xs text-slate-500 mt-1">520 of 570 slots reserved (91.2%)</p>
                <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-[91%]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: MOM */}
        {activeTab === "mom" && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Archived Minutes of Meeting (MOM)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Digitally signed proceedings and task assignment history</p>

            <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">Discipline & Pastoral Care Committee Review</h4>
                  <p className="text-slate-400 text-[11px]">Conducted Oct 24, 2026 • 6 attendees • 4 action items logged</p>
                </div>
                <button
                  onClick={() => alert("Downloading signed MOM PDF...")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200"
                >
                  Download MOM PDF
                </button>
              </div>

              <div className="py-3 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">CBSE Affiliation Inspection Preparation Huddle</h4>
                  <p className="text-slate-400 text-[11px]">Conducted Oct 18, 2026 • 14 attendees • 8 action items logged</p>
                </div>
                <button
                  onClick={() => alert("Downloading signed MOM PDF...")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-slate-200"
                >
                  Download MOM PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MeetingPage;
