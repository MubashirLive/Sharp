import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Text as RNText,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnnouncementCarousel } from '@/components/announcement/AnnouncementCarousel';
import {
  TeacherProfileModal,
  TeacherProfileData,
} from '@/components/profile/TeacherProfileModal';
import { useCurriculumStore } from '@/data/curriculumStore';
import {
  Search,
  Bell,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  BookOpen,
  ClipboardList,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  Megaphone,
  FileText,
  X,
  Award,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Coffee,
  MapPin,
  User,
  History,
  Download,
  Paperclip,
  Calendar,
  CheckSquare,
  Layers,
  BookMarked,
  Eye,
} from 'lucide-react-native';

// ─── Design Tokens ───────────────────────────────────────────────────
const C = {
  primary: '#000000',
  primaryDark: '#34AADC',
  primaryDeep: '#1B8CC4',
  primaryContainer: '#E3F5FD',
  onPrimary: '#ffffff',
  surface: '#ffffff',
  surfaceTinted: '#EEF8FE',
  surfaceGradientEnd: '#FAFEFF',
  onSurface: '#000000',
  onSurfaceSecondary: 'rgba(60,60,67,0.60)',
  onSurfaceTertiary: 'rgba(60,60,67,0.30)',
  cardBg: '#ffffff',
  cardBorder: '#F0F0F3',
  progressTrack: '#F0F0F3',
  pink: '#FF9EB0',
  pinkDeep: '#FF7C94',
  green: '#34C759',
  greenContainer: '#D1FAE5',
  greenBg: '#E8F9ED',
  orange: '#FF9500',
  orangeBg: '#FFF4E5',
  purple: '#5856D6',
  purpleBg: '#F0F0FC',
  blueBg: '#E3F5FD',
  // Quick Access tokens (identical to Student)
  examBg: '#E0E7FF',
  examFg: '#4F46E5',
  testBg: '#FCE7F3',
  testFg: '#DB2777',
  timetableBg: '#E3F5FD',
  timetableFg: '#000000',
  resultBg: '#FFF2D4',
  resultFg: '#FF9500',
  curriculumBg: '#F3E8FF',
  curriculumFg: '#7C3AED',
  materialBg: '#D1FAE5',
  materialFg: '#059669',
};

// ─── Quick Access Configuration (Same as Student) ────────────────────
const QUICK_ACCESS = [
  { key: 'exam', label: 'Exam', Icon: GraduationCap, bg: C.examBg, fg: C.examFg, route: '/exam' },
  { key: 'test', label: 'Tests', Icon: ClipboardList, bg: C.testBg, fg: C.testFg, route: '/test' },
  { key: 'timetable', label: 'Timetable', Icon: CalendarDays, bg: C.timetableBg, fg: C.timetableFg, route: '/timetable' },
  { key: 'result', label: 'Result', Icon: ClipboardCheck, bg: C.resultBg, fg: C.resultFg, route: '/timetable' },
  { key: 'curriculum', label: 'Curriculum', Icon: BookOpen, bg: C.curriculumBg, fg: C.curriculumFg, route: '/curriculum' },
  { key: 'material', label: 'Resources', Icon: FileText, bg: C.materialBg, fg: C.materialFg, route: '/study-material?role=teacher' },
];

// ─── Today's Teaching Schedule (Classes & Subjects for current date) ───
type TodayClassItem = {
  id: string;
  periodNum: string;
  time: string;
  className: string;
  subject: string;
  room: string;
  badgeBg: string;
  badgeFg: string;
};

const TODAY_TEACHING_SCHEDULE: TodayClassItem[] = [
  {
    id: 't1',
    periodNum: 'I',
    time: '8:00 - 8:40 AM',
    className: '10-A',
    subject: 'Mathematics',
    room: 'Room 204',
    badgeBg: '#E0F2FE',
    badgeFg: '#0369A1',
  },
  {
    id: 't2',
    periodNum: 'II',
    time: '8:40 - 9:20 AM',
    className: '12-B',
    subject: 'Physics Lab',
    room: 'Lab 2',
    badgeBg: '#DCFCE7',
    badgeFg: '#15803D',
  },
  {
    id: 't3',
    periodNum: 'III',
    time: '9:20 - 10:00 AM',
    className: '10-A',
    subject: 'Commerce',
    room: 'Room 204',
    badgeBg: '#FEF3C7',
    badgeFg: '#B45309',
  },
  {
    id: 't4',
    periodNum: 'IV',
    time: '10:00 - 10:40 AM',
    className: '12-A',
    subject: 'Accountancy',
    room: 'Room 305',
    badgeBg: '#FFE4E6',
    badgeFg: '#BE123C',
  },
  {
    id: 't5',
    periodNum: 'V',
    time: '10:40 - 11:20 AM',
    className: '9-C',
    subject: 'Mathematics',
    room: 'Room 108',
    badgeBg: '#E0F2FE',
    badgeFg: '#0369A1',
  },
  {
    id: 't6',
    periodNum: 'VI',
    time: '11:50 - 12:30 PM',
    className: '10-B',
    subject: 'Physics',
    room: 'Room 205',
    badgeBg: '#EDE9FE',
    badgeFg: '#6D28D9',
  },
  {
    id: 't7',
    periodNum: 'VII',
    time: '12:30 - 1:10 PM',
    className: '11-A',
    subject: 'Accountancy',
    room: 'Room 302',
    badgeBg: '#FFE4E6',
    badgeFg: '#BE123C',
  },
  {
    id: 't8',
    periodNum: 'VIII',
    time: '1:10 - 1:50 PM',
    className: 'Staff',
    subject: 'Office Hours / Mentoring',
    room: 'Cabin 3',
    badgeBg: '#F1F5F9',
    badgeFg: '#64748B',
  },
  {
    id: 't9',
    periodNum: 'IX',
    time: '1:50 - 2:30 PM',
    className: '12-A',
    subject: 'Economics',
    room: 'Room 305',
    badgeBg: '#FFEDD5',
    badgeFg: '#C2410C',
  },
  {
    id: 't10',
    periodNum: 'X',
    time: '2:30 - 3:10 PM',
    className: '10-A',
    subject: 'Remedial & Doubt Clearing',
    room: 'Room 204',
    badgeBg: '#F3E8FF',
    badgeFg: '#7C3AED',
  },
];

// ─── Upcoming Faculty Meetings Data (Option B: Multi-Meeting Support) ───
const UPCOMING_FACULTY_MEETINGS = [
  {
    id: 'm-today',
    title: 'Mid-Term Exam Paper Moderation & Digital Evaluation Protocol',
    shortTitle: 'Paper Moderation',
    tabLabel: 'Today · 3:30 PM',
    tagBg: '#FEF3C7',
    tagFg: '#B45309',
    category: 'Academic Council · Mandatory',
    date: 'Wednesday, 26 Aug 2026',
    time: '03:30 PM - 04:30 PM',
    duration: '60 mins',
    host: 'Dr. Rajesh Malhotra',
    hostRole: 'Principal & Head of Academic Council',
    venue: 'Main Conference Hall #1 (Building B)',
    room: 'Conference Hall 1',
    attendees: 'Secondary & Senior Secondary Faculty (Grades 9-12)',
    agendaFocus: 'Question paper moderation, internal practicals & digital marks portal.',
    agendaItems: [
      'Moderation of question papers for Term-1 Examinations (Sets A & B).',
      'Review of internal assessment & practical marks distribution blueprint.',
      'Implementation of the new Digital Assessment Portal for mark entry.',
      'Remedial support action plan for low-scoring student cohorts.',
    ],
    instructions: [
      'Please bring your signed syllabus coverage sheets & draft question paper sets.',
      'Carry your charged school-issued laptop with access to the Teacher Portal.',
      'Ensure all pending weekly class test marks are entered before 2:00 PM.',
    ],
    documents: [
      { name: 'Term1_Paper_Moderation_SOP_2026.pdf', size: '1.4 MB' },
      { name: 'Digital_Evaluation_Guidelines.pdf', size: '840 KB' },
    ],
  },
  {
    id: 'm-dept',
    title: 'Commerce & Economics Dept. Curriculum Sync & Term Plan',
    shortTitle: 'Dept. Curriculum Sync',
    tabLabel: 'Tomorrow · 11:00 AM',
    tagBg: '#E0F2FE',
    tagFg: '#0369A1',
    category: 'Department Sync · Commerce Faculty',
    date: 'Thursday, 27 Aug 2026',
    time: '11:00 AM - 11:45 AM',
    duration: '45 mins',
    host: 'Mr. Alok Verma',
    hostRole: 'HOD Commerce & Business Studies',
    venue: 'Staff Room #3 (Commerce Cabin)',
    room: 'Cabin Room 3',
    attendees: 'Commerce & Economics Faculty (Grade 11 & 12)',
    agendaFocus: 'Term-1 syllabus progress, project evaluation guidelines & case studies.',
    agendaItems: [
      'Review syllabus completion rate for Accountancy & Business Studies.',
      'Standardization of Term-1 Project Work Evaluation Rubrics.',
      'Scheduling extra doubt-clearing sessions for Grade 12 Board candidates.',
    ],
    instructions: [
      'Bring updated teacher registers with student project submission statuses.',
      'Submit unit test answer sheets moderation summary.',
    ],
    documents: [
      { name: 'Commerce_Term1_Project_Rubrics_2026.pdf', size: '920 KB' },
    ],
  },
  {
    id: 'm-pta',
    title: 'PTA Core Committee & Grade 10 Academic Progress Review',
    shortTitle: 'PTA Committee Review',
    tabLabel: 'Friday · 02:00 PM',
    tagBg: '#F3E8FF',
    tagFg: '#7C3AED',
    category: 'PTA Committee · Hybrid',
    date: 'Friday, 28 Aug 2026',
    time: '02:00 PM - 03:00 PM',
    duration: '60 mins',
    host: 'Mrs. Ananya Sen',
    hostRole: 'Vice Principal & PTA Coordinator',
    venue: 'School Auditorium & Google Meet',
    room: 'Auditorium',
    attendees: 'Class Teachers of Grade 10 & 12, PTA Representatives',
    agendaFocus: 'Parent communication protocol, upcoming PTM schedule & career counseling.',
    agendaItems: [
      'Finalization of staggered Parent-Teacher Meeting (PTM) time slots.',
      'Addressing parent queries on digital report cards & attendance tracking.',
      'Career guidance orientation workshop schedule for Class 10 stream selection.',
    ],
    instructions: [
      'Review parent communication logs and attendance outliers for Grade 10-A.',
      'Ensure preliminary student progress cards are ready for review.',
    ],
    documents: [
      { name: 'PTM_Slot_Allocation_Schedule_2026.pdf', size: '1.1 MB' },
    ],
  },
];

// ─── Past Meetings & MoM Data ──────────────────────────────────────────
const PAST_FACULTY_MEETINGS = [
  {
    id: 'pm-1',
    date: '18 Aug 2026',
    time: '03:00 PM - 04:15 PM',
    duration: '75 mins',
    title: 'Curriculum Progress Review & Annual Sports Day Prep',
    shortTitle: 'Sports Day Prep',
    category: 'Staff Council · Concluded',
    tagBg: '#DCFCE7',
    tagFg: '#15803D',
    chair: 'Mrs. Ananya Sen',
    chairRole: 'Vice Principal & Activity Head',
    venue: 'Staff Room #3 (Main Building)',
    attendees: 'All Secondary Faculty & Physical Education Teachers',
    quorumStatus: '100% Faculty Attended · Quorum Met',
    agendaFocus: 'Annual sports day schedule, inter-house events, and academic syllabus alignment.',
    agendaItems: [
      'Finalization of the annual inter-house sports calendar and grounds schedule.',
      'Academic buffer period planning to ensure zero syllabus lag during sports week.',
      'Allocation of teacher supervisory duties for track & field events.',
      'First aid and emergency medical readiness protocol review.',
    ],
    instructions: [
      'Submit house team rosters and student participation lists to the PE department by Aug 22.',
      'Coordinate with co-teachers to reschedule any missed laboratory sessions.',
      'Confirm attendance for the pre-sports rehearsal walkthrough.',
      'Ensure all weekly grade books are locked before event week begins.',
    ],
    keyDecisions: 'Approved inter-house sports calendar; fixed Term-1 blueprint submission deadline for Aug 24.',
    actionItems: [
      'Aug 24: Term-1 question paper blueprints submission to moderation cell.',
      'Aug 28: Ground inspection & sports equipment audit by PE committee.',
      'Sep 02: Publishing of house-wise student heat lists on school notice board.',
    ],
    momDoc: 'MoM_18_Aug_2026.pdf',
    docSize: '1.2 MB',
    documents: [
      { name: 'MoM_18_Aug_2026.pdf', size: '1.2 MB' },
      { name: 'Sports_Day_Duty_Chart_2026.pdf', size: '850 KB' },
    ],
  },
  {
    id: 'pm-2',
    date: '05 Aug 2026',
    time: '02:00 PM - 03:30 PM',
    duration: '90 mins',
    title: 'Quarterly Parent-Teacher Meeting (PTM) Execution Strategy',
    shortTitle: 'PTM Strategy',
    category: 'PTA Committee · Concluded',
    tagBg: '#E0F2FE',
    tagFg: '#0369A1',
    chair: 'Dr. Rajesh Malhotra',
    chairRole: 'Principal & Chairman',
    venue: 'School Auditorium & Conference Wing',
    attendees: 'Class Teachers (Grades 1-12) & Administration',
    quorumStatus: 'Fully Attended · Decisions Enacted',
    agendaFocus: 'Parent-Teacher interaction schedule, slot allocations, and student progress feedback framework.',
    agendaItems: [
      'Staggered 15-minute slot allocation for seamless parent flow without crowd congestion.',
      'Deployment of digital feedback forms via the mobile parent portal.',
      'Review of special progress reports for students needing remedial academic intervention.',
      'Classroom setup and waiting area logistics in the school auditorium.',
    ],
    instructions: [
      'Keep student cumulative records, attendance registers, and unit test dossiers handy.',
      'Maintain positive, constructive feedback tone; record any special parent concerns in the portal.',
      'Collect signed PTM acknowledgement slips and archive in class files.',
      'Submit remedial class recommendation list by end of meeting week.',
    ],
    keyDecisions: 'Finalized staggered 15-minute PTM slots; digital feedback form integrated into parent portal.',
    actionItems: [
      'Aug 08: Digital PTM invites dispatched to all parents via app notification.',
      'Aug 10: Parent grievance redressal report compiled and submitted to Principal office.',
      'Aug 14: Remedial batch timetable circulated to participating students.',
    ],
    momDoc: 'MoM_05_Aug_2026.pdf',
    docSize: '950 KB',
    documents: [
      { name: 'MoM_05_Aug_2026.pdf', size: '950 KB' },
      { name: 'PTM_Feedback_Framework.pdf', size: '640 KB' },
    ],
  },
  {
    id: 'pm-3',
    date: '22 Jul 2026',
    time: '10:30 AM - 12:00 PM',
    duration: '90 mins',
    title: 'Academic Council Orientation & NEP Pedagogical Compliance',
    shortTitle: 'NEP Compliance',
    category: 'Academic Council · Concluded',
    tagBg: '#F3E8FF',
    tagFg: '#7C3AED',
    chair: 'Dr. S. K. Mukherjee',
    chairRole: 'Academic Dean & Council Head',
    venue: 'Conference Hall #2 (Academic Block)',
    attendees: 'Senior Secondary Faculty & Subject Department Leads',
    quorumStatus: 'Council Quorum Confirmed · Circular Issued',
    agendaFocus: 'NEP 2020 pedagogical compliance, competency-based assessments, and teacher training plans.',
    agendaItems: [
      'Integration of competency-based assessment questions in Term examinations.',
      'Experiential learning lesson plan guidelines per NEP 2020 norms.',
      'Continuous Professional Development (CPD) credit hours tracking for faculty.',
      'Digitized peer-review methodology for senior secondary projects.',
    ],
    instructions: [
      'Incorporate minimum 2 competency-based questions in every upcoming formative evaluation.',
      'Complete mandatory 25-hour annual CPD online modules before term end.',
      'Share sample rubric sheets with your respective department heads.',
      'Upload updated lesson plans reflecting activity-based learning elements.',
    ],
    keyDecisions: 'Competency-based assessment framework adopted for Grades 9 to 12.',
    actionItems: [
      'Aug 01: Model question paper bank update across Mathematics & Sciences.',
      'Aug 15: CPD portal certificate submission deadline for Phase 1.',
      'Aug 20: Departmental audit of competency-based lesson plan rubrics.',
    ],
    momDoc: 'MoM_22_Jul_2026.pdf',
    docSize: '1.6 MB',
    documents: [
      { name: 'MoM_22_Jul_2026.pdf', size: '1.6 MB' },
      { name: 'NEP_Pedagogical_Directives_2026.pdf', size: '1.1 MB' },
    ],
  },
];

const TEACHER_PROFILE: TeacherProfileData = {
  id: 'TEA-8042',
  name: 'Mrs. Priya Sharma',
  designation: 'PGT Commerce',
  role: 'Class Teacher',
  department: 'Department of Commerce & Economics',
  school: 'Ideal International School, Indore',
  avatarBg: '#000000',
  initials: 'PS',
  gender: 'Female',
  dob: '14 July 1988',
  age: 38,
  bloodGroup: 'B+',
  experience: '9+ Years',
  joiningDate: '01 June 2017',
  employeeType: 'Permanent / Full-Time',
  address: 'Flat 402, Lotus Boulevard, Sector 100, Noida, UP',
  contact: '+91 98765 12345',
  emergencyContact: '+91 98111 22334 (Spouse)',
  email: 'priya.sharma@idealschool.edu.in',
  cabin: 'Staff Room #3 · Desk 12',
  primaryClass: 'Grade 10 - Section A',
  classes: [
    { grade: 'Grade 10', section: 'A', subject: 'Advanced Mathematics', room: 'Room 204', totalStudents: 36, color: '#4F46E5' },
    { grade: 'Grade 12', section: 'B', subject: 'Physics Practical Lab', room: 'Lab 2', totalStudents: 28, color: '#059669' },
    { grade: 'Grade 9', section: 'C', subject: 'General Mathematics', room: 'Room 108', totalStudents: 40, color: '#D97706' },
    { grade: 'Grade 10', section: 'B', subject: 'Theoretical Physics', room: 'Room 205', totalStudents: 34, color: '#EC4899' },
  ],
  qualifications: [
    { degree: 'Master of Commerce (M.Com)', institution: 'Delhi University', year: '2012' },
    { degree: 'Bachelor of Education (B.Ed)', institution: 'NCERT Certified Institute', year: '2014' },
    { degree: 'Bachelor of Commerce (B.Com Hons)', institution: 'Delhi University', year: '2010' },
  ],
};

export default function TeacherHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const curriculumSubjects = useCurriculumStore();
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [showMeetingDetailsModal, setShowMeetingDetailsModal] = useState(false);
  const [showPastMeetingsModal, setShowPastMeetingsModal] = useState(false);
  const [selectedPastMeeting, setSelectedPastMeeting] = useState<typeof PAST_FACULTY_MEETINGS[0] | null>(null);
  const [selectedMeetingIndex, setSelectedMeetingIndex] = useState(0);
  const [acknowledgedMeetings, setAcknowledgedMeetings] = useState<Record<string, boolean>>({});
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  const currentMeeting = UPCOMING_FACULTY_MEETINGS[selectedMeetingIndex] || UPCOMING_FACULTY_MEETINGS[0];

  const totalTeachingLectures = useMemo(() => {
    return TODAY_TEACHING_SCHEDULE.filter((p) => p.className !== 'Staff').length;
  }, []);

  const totalFreeLectures = useMemo(() => {
    return TODAY_TEACHING_SCHEDULE.filter((p) => p.className === 'Staff').length;
  }, []);

  return (
    <View style={[styles.flex1, { backgroundColor: C.surfaceTinted }]}>
      {/* ─── Top Header (Student Style UI & UX) ────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setIsProfileOpen(true)}
          >
            <View style={[styles.avatar, { backgroundColor: C.primary }]}>
              <RNText style={styles.avatarInitials}>PS</RNText>
              <View style={styles.avatarOnlineBadge} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.greetingWrap}
            onPress={() => setIsProfileOpen(true)}
          >
            <View style={styles.nameRow}>
              <RNText style={styles.greetingName}>Hello, Priya</RNText>
              <ChevronRight size={14} color="#6B7280" strokeWidth={2.5} />
            </View>
            <RNText style={styles.greetingSub}>
              PGT Commerce · Class Teacher · TEA-8042
            </RNText>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={styles.headerRight}>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerBtn}>
            <Search size={17} color="#374151" strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerBtn}>
            <Bell size={17} color="#374151" strokeWidth={2.2} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ─── Scrollable Content ────────────────────────────────────────── */}
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Announcement Carousel (Same as Student) */}
        <AnnouncementCarousel />

        {/* 2. Quick Access Grid (Same as Student) */}
        <View style={styles.sectionHeader}>
          <RNText style={styles.sectionTitle}>Quick Access</RNText>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => router.push('/(teacher)/my-classes')}
          >
            <RNText style={styles.seeAllText}>See all</RNText>
            <ChevronRight size={14} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickGrid}>
          {QUICK_ACCESS.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              style={styles.quickItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.quickIcon, { backgroundColor: item.bg }]}>
                <item.Icon size={22} color={item.fg} strokeWidth={2.2} />
              </View>
              <RNText style={styles.quickLabel}>{item.label}</RNText>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── Teacher's Portal ───────────────────────────────────────── */}
        <View style={styles.sectionTitleRow}>
          <RNText style={styles.sectionTitle}>Teacher's Portal</RNText>
          <RNText style={styles.dateSubtext}>Academic Session 2026-27</RNText>
        </View>

        <View style={styles.portalList}>
          {/* Card 1: Today's Schedule (Collapsed shows summary, Expanded shows all 10 periods) */}
          <View style={styles.portalCard}>
            {/* Header with Single Unified Timetable Button */}
            <View style={styles.portalCardHeader}>
              <View style={styles.portalHeaderLeftCol}>
                <View style={styles.portalTitleRow}>
                  <CalendarDays size={16} color="#000000" strokeWidth={2.2} />
                  <RNText style={styles.portalTitle}>Today's Schedule</RNText>
                </View>
                <View style={styles.todayDatePill}>
                  <RNText style={styles.todayDatePillText}>Wed 26 Aug , 2026</RNText>
                </View>
              </View>

              {/* Single systematic button to open full 6-day master timetable */}
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.unifiedTimetableBtn}
                onPress={() => router.push('/teacher-timetable')}
              >
                <RNText style={styles.unifiedTimetableBtnText}>Full Timetable</RNText>
                <ArrowUpRight size={13} color="#0369A1" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* ── COLLAPSED VIEW: Summary (Number of lectures & Free lectures) ── */}
            {!isScheduleExpanded && (
              <View style={styles.scheduleSummaryBox}>
                <View style={styles.summaryStatsRow}>
                  {/* Teaching Lectures Stat */}
                  <View style={[styles.summaryStatBadge, { backgroundColor: '#E0F2FE' }]}>
                    <View style={[styles.summaryStatIconCircle, { backgroundColor: '#BAE6FD' }]}>
                      <BookOpen size={16} color="#0369A1" strokeWidth={2.2} />
                    </View>
                    <View style={styles.summaryStatTextCol}>
                      <RNText style={[styles.summaryStatNumber, { color: '#0369A1' }]}>
                        {totalTeachingLectures} Lectures
                      </RNText>
                      <RNText style={styles.summaryStatLabel}>Assigned Lectures</RNText>
                    </View>
                  </View>

                  {/* Free / Prep Lectures Stat */}
                  <View style={[styles.summaryStatBadge, { backgroundColor: '#F0FDF4' }]}>
                    <View style={[styles.summaryStatIconCircle, { backgroundColor: '#BBF7D0' }]}>
                      <Coffee size={16} color="#15803D" strokeWidth={2.2} />
                    </View>
                    <View style={styles.summaryStatTextCol}>
                      <RNText style={[styles.summaryStatNumber, { color: '#15803D' }]}>
                        {totalFreeLectures} Free / Prep
                      </RNText>
                      <RNText style={styles.summaryStatLabel}>Staff Hours</RNText>
                    </View>
                  </View>
                </View>

                {/* Subtext info */}
                <View style={styles.summarySubRow}>
                  <RNText style={styles.summarySubText}>
                    Next Period (8:00 AM) in 10-A Mathematics in Room 204
                  </RNText>
                </View>
              </View>
            )}

            {/* ── EXPANDED VIEW: Complete Day List (All 10 Periods) ── */}
            {isScheduleExpanded && (
              <View style={styles.todayScheduleBox}>
                {TODAY_TEACHING_SCHEDULE.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.todayClassRow,
                      index !== TODAY_TEACHING_SCHEDULE.length - 1 && styles.todayClassRowBorder,
                    ]}
                  >
                    {/* Period Numeral & Time */}
                    <View style={styles.todayPeriodCol}>
                      <RNText style={styles.todayPeriodNumeral}>Period {item.periodNum}</RNText>
                      <RNText style={styles.todayPeriodTime}>{item.time}</RNText>
                    </View>

                    {/* Class Badge */}
                    <View style={[styles.todayClassBadge, { backgroundColor: item.badgeBg }]}>
                      <RNText style={[styles.todayClassBadgeText, { color: item.badgeFg }]}>
                        {item.className}
                      </RNText>
                    </View>

                    {/* Subject & Room */}
                    <View style={styles.todaySubjectCol}>
                      <RNText style={styles.todaySubjectTitle} numberOfLines={1}>
                        {item.subject}
                      </RNText>
                      <RNText style={styles.todayRoomText} numberOfLines={1}>
                        {item.room}
                      </RNText>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Dropdown Toggle Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.expandDropdownBtn}
              onPress={() => setIsScheduleExpanded(!isScheduleExpanded)}
            >
              <RNText style={styles.expandDropdownText}>
                Today's Schedule
              </RNText>
              {isScheduleExpanded ? (
                <ChevronUp size={16} color="#000000" strokeWidth={2.5} />
              ) : (
                <ChevronDown size={16} color="#000000" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>

          {/* Card 2: Upcoming Meetings Card (Option B: Compact Meeting Pills / Date Selector) */}
          <View style={styles.portalCard}>
            {/* Header: Title + Active Meeting Category + Past Meetings Action */}
            <View style={styles.portalCardHeader}>
              <View style={styles.portalHeaderLeftCol}>
                <View style={styles.portalTitleRow}>
                  <Users size={16} color="#000000" strokeWidth={2.2} />
                  <RNText style={styles.portalTitle}>Upcoming Meetings</RNText>
                </View>
                <View style={[styles.todayDatePill, { backgroundColor: currentMeeting.tagBg }]}>
                  <RNText style={[styles.todayDatePillText, { color: currentMeeting.tagFg }]}>
                    {currentMeeting.category}
                  </RNText>
                </View>
              </View>

              {/* Past Meetings Quick Header Link */}
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.pastMeetingsHeaderBtn}
                onPress={() => setShowPastMeetingsModal(true)}
              >
                <History size={13} color="#0369A1" strokeWidth={2.2} />
                <RNText style={styles.pastMeetingsHeaderBtnText}>Past Meetings</RNText>
              </TouchableOpacity>
            </View>

            {/* Standardized Horizontal Scrollable Meeting Pills Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.meetingPillScrollView}
              contentContainerStyle={styles.meetingPillScrollContainer}
            >
              {UPCOMING_FACULTY_MEETINGS.map((meeting, index) => {
                const isActive = selectedMeetingIndex === index;
                return (
                  <TouchableOpacity
                    key={meeting.id}
                    activeOpacity={0.75}
                    style={[
                      styles.meetingSelectorPill,
                      isActive && styles.meetingSelectorPillActive,
                    ]}
                    onPress={() => setSelectedMeetingIndex(index)}
                  >
                    <RNText
                      style={[
                        styles.meetingSelectorPillText,
                        isActive && styles.meetingSelectorPillTextActive,
                      ]}
                    >
                      {meeting.tabLabel}
                    </RNText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selected Meeting Details Box */}
            <View style={styles.meetingInfoBox}>
              <RNText style={styles.meetingTitleText}>
                {currentMeeting.title}
              </RNText>

              {/* 4 Essential Details Grid: When, Who, Where, Agenda */}
              <View style={styles.meetingMetaList}>
                {/* 1. When */}
                <View style={styles.meetingMetaRow}>
                  <View style={styles.meetingMetaIconCircle}>
                    <Clock size={13} color="#0369A1" strokeWidth={2.2} />
                  </View>
                  <View style={styles.meetingMetaTextCol}>
                    <RNText style={styles.meetingMetaLabel}>When</RNText>
                    <RNText style={styles.meetingMetaVal}>
                      {currentMeeting.date.split(',')[0]}, {currentMeeting.time} ({currentMeeting.duration})
                    </RNText>
                  </View>
                </View>

                {/* 2. Who (Host) */}
                <View style={styles.meetingMetaRow}>
                  <View style={styles.meetingMetaIconCircle}>
                    <User size={13} color="#0369A1" strokeWidth={2.2} />
                  </View>
                  <View style={styles.meetingMetaTextCol}>
                    <RNText style={styles.meetingMetaLabel}>Who's Taking</RNText>
                    <RNText style={styles.meetingMetaVal}>
                      {currentMeeting.host} ({currentMeeting.hostRole.split('&')[0].trim()})
                    </RNText>
                  </View>
                </View>

                {/* 3. Where (Venue) */}
                <View style={styles.meetingMetaRow}>
                  <View style={styles.meetingMetaIconCircle}>
                    <MapPin size={13} color="#0369A1" strokeWidth={2.2} />
                  </View>
                  <View style={styles.meetingMetaTextCol}>
                    <RNText style={styles.meetingMetaLabel}>Where / Venue</RNText>
                    <RNText style={styles.meetingMetaVal}>
                      {currentMeeting.venue}
                    </RNText>
                  </View>
                </View>

                {/* 4. Agenda preview */}
                <View style={styles.meetingMetaRow}>
                  <View style={styles.meetingMetaIconCircle}>
                    <FileText size={13} color="#0369A1" strokeWidth={2.2} />
                  </View>
                  <View style={styles.meetingMetaTextCol}>
                    <RNText style={styles.meetingMetaLabel}>Agenda Focus</RNText>
                    <RNText style={styles.meetingMetaVal} numberOfLines={2}>
                      {currentMeeting.agendaFocus}
                    </RNText>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Action: View Meeting Details & Instructions (Full Width) */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.meetingDetailsBtn}
              onPress={() => setShowMeetingDetailsModal(true)}
            >
              <RNText style={styles.meetingDetailsBtnText}>
                Instruction
              </RNText>
              <ArrowUpRight size={14} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Card 3: Curriculum Studio Setup Card */}
          <View style={styles.portalCard}>
            <View style={styles.portalCardHeader}>
              <View style={styles.portalHeaderLeftCol}>
                <View style={styles.portalTitleRow}>
                  <Layers size={16} color="#000000" strokeWidth={2.2} />
                  <RNText style={styles.portalTitle}>Curriculum Studio</RNText>
                </View>
                <View style={[styles.todayDatePill, { backgroundColor: '#F3E8FF' }]}>
                  <RNText style={[styles.todayDatePillText, { color: '#7C3AED' }]}>
                    Academic Setup
                  </RNText>
                </View>
              </View>

              {/* Quick Preview Header Link */}
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.pastMeetingsHeaderBtn}
                onPress={() => router.push('/curriculum')}
              >
                <Eye size={13} color="#0369A1" strokeWidth={2.2} />
                <RNText style={styles.pastMeetingsHeaderBtnText}>Quick View</RNText>
              </TouchableOpacity>
            </View>

            {/* Curriculum Summary / Stats Banner */}
            <View style={styles.curriculumStudioBody}>
              <View style={styles.curriculumStatsRow}>
                <View style={[styles.summaryStatBadge, { backgroundColor: '#F5F3FF', flex: 1 }]}>
                  <View style={[styles.summaryStatIconCircle, { backgroundColor: '#EDE9FE' }]}>
                    <BookOpen size={16} color="#7C3AED" strokeWidth={2.2} />
                  </View>
                  <View style={styles.summaryStatTextCol}>
                    <RNText style={[styles.summaryStatNumber, { color: '#7C3AED' }]}>
                      {curriculumSubjects.length} Subjects
                    </RNText>
                    <RNText style={styles.summaryStatLabel}>Configured Curriculums</RNText>
                  </View>
                </View>
              </View>

              {/* All Class & Subject Badges */}
              <View style={styles.curriculumSubjectPillRow}>
                {curriculumSubjects.map((subj) => (
                  <View key={subj.id} style={styles.curriculumSubjTag}>
                    <RNText style={styles.curriculumSubjTagText}>
                      {subj.grade} · {subj.subjectName}
                    </RNText>
                  </View>
                ))}
              </View>
            </View>

            {/* Bottom Action: Open Curriculum Studio */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.curriculumStudioBtn}
              onPress={() => router.push('/curriculum-builder')}
            >
              <RNText style={styles.curriculumStudioBtnText}>
                Set Up Curriculum
              </RNText>
              <ArrowUpRight size={14} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Quick Notice Modal ────────────────────────────────────────── */}
      <Modal visible={showNoticeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RNText style={styles.modalTitle}>Post Announcement</RNText>
            <RNText style={styles.modalSub}>Send notice to your class students & parents</RNText>

            <TextInput
              style={styles.inputTitle}
              placeholder="Announcement Title (e.g. Physics Test Moved)"
              placeholderTextColor="#9CA3AF"
              value={noticeTitle}
              onChangeText={setNoticeTitle}
            />

            <TextInput
              style={[styles.inputTitle, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Write notice details here..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={noticeBody}
              onChangeText={setNoticeBody}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowNoticeModal(false)}
              >
                <RNText style={styles.modalCancelText}>Cancel</RNText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={() => {
                  setShowNoticeModal(false);
                  setNoticeTitle('');
                  setNoticeBody('');
                }}
              >
                <RNText style={styles.modalSubmitText}>Publish Notice</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Meeting Brief & Instructions Modal ────────────────────── */}
      <Modal
        visible={showMeetingDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMeetingDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.meetingModalContent}>
            {/* Modal Header */}
            <View style={styles.meetingModalHeader}>
              <View style={{ flex: 1 }}>
                <View style={[styles.meetingCategoryPill, { backgroundColor: currentMeeting.tagBg }]}>
                  <RNText style={[styles.meetingCategoryPillText, { color: currentMeeting.tagFg }]}>
                    {currentMeeting.category}
                  </RNText>
                </View>
                <RNText style={styles.meetingModalTitle}>
                  Faculty Meeting Brief
                </RNText>
              </View>

              <TouchableOpacity
                style={styles.meetingCloseBtn}
                onPress={() => setShowMeetingDetailsModal(false)}
              >
                <X size={20} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Modal Meeting Switcher Row */}
            <View style={styles.modalSelectorWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.modalMeetingSelectorRow}
              >
                {UPCOMING_FACULTY_MEETINGS.map((m, idx) => {
                  const isSelected = selectedMeetingIndex === idx;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      activeOpacity={0.8}
                      style={[
                        styles.modalMeetingTab,
                        isSelected && styles.modalMeetingTabActive,
                      ]}
                      onPress={() => setSelectedMeetingIndex(idx)}
                    >
                      <RNText
                        style={[
                          styles.modalMeetingTabText,
                          isSelected && styles.modalMeetingTabTextActive,
                        ]}
                      >
                        {m.shortTitle}
                      </RNText>
                      <View
                        style={[
                          styles.modalMeetingTabPill,
                          isSelected ? { backgroundColor: 'rgba(255,255,255,0.25)' } : { backgroundColor: '#E2E8F0' },
                        ]}
                      >
                        <RNText
                          style={[
                            styles.modalMeetingTabPillText,
                            isSelected ? { color: '#ffffff' } : { color: '#475569' },
                          ]}
                        >
                          {m.tabLabel.split('·')[0].trim()}
                        </RNText>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <ScrollView
              style={styles.meetingModalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Meeting Title Banner */}
              <View style={styles.meetingModalBanner}>
                <RNText style={styles.meetingModalTopic}>
                  {currentMeeting.title}
                </RNText>
              </View>

              {/* Key Logistics Grid */}
              <View style={styles.logisticsCard}>
                <View style={styles.logisticItem}>
                  <Calendar size={15} color="#0369A1" strokeWidth={2.2} />
                  <View style={{ flex: 1 }}>
                    <RNText style={styles.logisticLabel}>Date & Time</RNText>
                    <RNText style={styles.logisticVal}>
                      {currentMeeting.date} · {currentMeeting.time} ({currentMeeting.duration})
                    </RNText>
                  </View>
                </View>

                <View style={styles.logisticItem}>
                  <MapPin size={15} color="#0369A1" strokeWidth={2.2} />
                  <View style={{ flex: 1 }}>
                    <RNText style={styles.logisticLabel}>Venue / Location</RNText>
                    <RNText style={styles.logisticVal}>
                      {currentMeeting.venue}
                    </RNText>
                  </View>
                </View>

                <View style={styles.logisticItem}>
                  <User size={15} color="#0369A1" strokeWidth={2.2} />
                  <View style={{ flex: 1 }}>
                    <RNText style={styles.logisticLabel}>Chaired By</RNText>
                    <RNText style={styles.logisticVal}>
                      {currentMeeting.host} ({currentMeeting.hostRole})
                    </RNText>
                  </View>
                </View>

                <View style={styles.logisticItem}>
                  <Users size={15} color="#0369A1" strokeWidth={2.2} />
                  <View style={{ flex: 1 }}>
                    <RNText style={styles.logisticLabel}>Target Attendees</RNText>
                    <RNText style={styles.logisticVal}>
                      {currentMeeting.attendees}
                    </RNText>
                  </View>
                </View>
              </View>

              {/* Agenda Section */}
              <View style={styles.meetingSection}>
                <RNText style={styles.meetingSectionTitle}>📋 Meeting Agenda</RNText>
                <View style={styles.agendaCard}>
                  {currentMeeting.agendaItems.map((item, idx) => (
                    <View key={idx} style={styles.agendaItemRow}>
                      <View style={styles.agendaNumberBadge}>
                        <RNText style={styles.agendaNumberText}>{idx + 1}</RNText>
                      </View>
                      <RNText style={styles.agendaItemText}>{item}</RNText>
                    </View>
                  ))}
                </View>
              </View>

              {/* Instructions & Pre-requisites Section */}
              <View style={styles.meetingSection}>
                <RNText style={styles.meetingSectionTitle}>⚠️ Faculty Instructions & Pre-requisites</RNText>
                <View style={styles.instructionsBox}>
                  {currentMeeting.instructions.map((inst, idx) => (
                    <View key={idx} style={styles.instructionRow}>
                      <CheckSquare size={16} color="#B45309" strokeWidth={2.2} />
                      <RNText style={styles.instructionText}>{inst}</RNText>
                    </View>
                  ))}
                </View>
              </View>

              {/* Attached Documents */}
              <View style={styles.meetingSection}>
                <RNText style={styles.meetingSectionTitle}>📎 Attached Reference Materials</RNText>
                <View style={styles.docsList}>
                  {currentMeeting.documents.map((doc, idx) => (
                    <View key={idx} style={styles.docItem}>
                      <Paperclip size={16} color="#0369A1" />
                      <View style={{ flex: 1 }}>
                        <RNText style={styles.docName} numberOfLines={1}>{doc.name}</RNText>
                        <RNText style={styles.docSize}>{doc.size} · PDF Document</RNText>
                      </View>
                      <TouchableOpacity style={styles.downloadIconBtn}>
                        <Download size={15} color="#000000" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              <View style={{ height: 16 }} />
            </ScrollView>

            {/* Modal Bottom Actions */}
            <View style={styles.meetingModalFooter}>
              <TouchableOpacity
                style={[
                  styles.acknowledgeBtn,
                  acknowledgedMeetings[currentMeeting.id] && styles.acknowledgeBtnDone,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setAcknowledgedMeetings((prev) => ({
                    ...prev,
                    [currentMeeting.id]: !prev[currentMeeting.id],
                  }));
                }}
              >
                {acknowledgedMeetings[currentMeeting.id] ? (
                  <>
                    <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.5} />
                    <RNText style={styles.acknowledgeBtnText}>Acknowledgement Marked</RNText>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.2} />
                    <RNText style={styles.acknowledgeBtnText}>Mark Acknowledgement</RNText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Past Meetings & MoM Modal ─────────────────────────────── */}
      <Modal
        visible={showPastMeetingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedPastMeeting(null);
          setShowPastMeetingsModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.meetingModalContent}>
            {!selectedPastMeeting ? (
              <>
                {/* Modal Header */}
                <View style={styles.meetingModalHeader}>
                  <View style={{ flex: 1 }}>
                    <RNText style={styles.meetingModalTitle}>Past Meetings & MoM</RNText>
                    <RNText style={styles.pastModalSubtitle}>Minutes of Meetings (MoM) Archive</RNText>
                  </View>

                  <TouchableOpacity
                    style={styles.meetingCloseBtn}
                    onPress={() => {
                      setSelectedPastMeeting(null);
                      setShowPastMeetingsModal(false);
                    }}
                  >
                    <X size={20} color="#000000" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.meetingModalScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.pastMeetingsList}>
                    {PAST_FACULTY_MEETINGS.map((meeting) => (
                      <View key={meeting.id} style={styles.pastMeetingCard}>
                        {/* Date Pill & Venue */}
                        <View style={styles.pastMeetingTopRow}>
                          <View style={styles.pastDatePill}>
                            <Calendar size={12} color="#0369A1" strokeWidth={2.2} />
                            <RNText style={styles.pastDatePillText}>{meeting.date}</RNText>
                          </View>
                          <RNText style={styles.pastVenueText}>{meeting.venue.split('(')[0].trim()}</RNText>
                        </View>

                        {/* Meeting Title */}
                        <RNText style={styles.pastMeetingTitle}>{meeting.title}</RNText>

                        {/* Chair Info */}
                        <View style={styles.pastChairRow}>
                          <User size={13} color="#64748B" />
                          <RNText style={styles.pastChairText}>Chaired by: {meeting.chair} ({meeting.chairRole})</RNText>
                        </View>

                        {/* Key Decisions */}
                        <View style={styles.pastDecisionsBox}>
                          <RNText style={styles.pastDecisionsLabel}>Key Decisions / Outcomes:</RNText>
                          <RNText style={styles.pastDecisionsText}>{meeting.keyDecisions}</RNText>
                        </View>

                        {/* MoM Document Button */}
                        <TouchableOpacity style={styles.pastDocRow} activeOpacity={0.75}>
                          <FileText size={15} color="#0369A1" />
                          <RNText style={styles.pastDocName} numberOfLines={1}>
                            {meeting.momDoc} ({meeting.docSize})
                          </RNText>
                          <Download size={14} color="#0369A1" />
                        </TouchableOpacity>

                        {/* Instruction Button - Just like Upcoming Meetings */}
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.pastInstructionBtn}
                          onPress={() => setSelectedPastMeeting(meeting)}
                        >
                          <RNText style={styles.pastInstructionBtnText}>
                            Instruction
                          </RNText>
                          <ArrowUpRight size={14} color="#ffffff" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <View style={{ height: 20 }} />
                </ScrollView>
              </>
            ) : (
              <>
                {/* ─── FULL PAST MEETING DETAILS VIEW ─── */}
                <View style={styles.meetingModalHeader}>
                  <View style={{ flex: 1 }}>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      style={styles.pastBackBtn}
                      onPress={() => setSelectedPastMeeting(null)}
                    >
                      <ChevronLeft size={16} color="#0369A1" strokeWidth={2.5} />
                      <RNText style={styles.pastBackBtnText}>Back to Past Meetings</RNText>
                    </TouchableOpacity>
                    <View style={[styles.meetingCategoryPill, { backgroundColor: selectedPastMeeting.tagBg, marginTop: 6 }]}>
                      <RNText style={[styles.meetingCategoryPillText, { color: selectedPastMeeting.tagFg }]}>
                        {selectedPastMeeting.category}
                      </RNText>
                    </View>
                    <RNText style={styles.meetingModalTitle}>
                      Past Meeting Brief & MoM
                    </RNText>
                  </View>

                  <TouchableOpacity
                    style={styles.meetingCloseBtn}
                    onPress={() => {
                      setSelectedPastMeeting(null);
                      setShowPastMeetingsModal(false);
                    }}
                  >
                    <X size={20} color="#000000" />
                  </TouchableOpacity>
                </View>


                <ScrollView
                  style={styles.meetingModalScroll}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Meeting Title Banner */}
                  <View style={styles.meetingModalBanner}>
                    <RNText style={styles.meetingModalTopic}>
                      {selectedPastMeeting.title}
                    </RNText>
                  </View>

                  {/* Key Logistics Grid */}
                  <View style={styles.logisticsCard}>
                    <View style={styles.logisticItem}>
                      <Calendar size={15} color="#0369A1" strokeWidth={2.2} />
                      <View style={{ flex: 1 }}>
                        <RNText style={styles.logisticLabel}>Date & Time</RNText>
                        <RNText style={styles.logisticVal}>
                          {selectedPastMeeting.date} · {selectedPastMeeting.time} ({selectedPastMeeting.duration})
                        </RNText>
                      </View>
                    </View>

                    <View style={styles.logisticItem}>
                      <MapPin size={15} color="#0369A1" strokeWidth={2.2} />
                      <View style={{ flex: 1 }}>
                        <RNText style={styles.logisticLabel}>Venue / Location</RNText>
                        <RNText style={styles.logisticVal}>
                          {selectedPastMeeting.venue}
                        </RNText>
                      </View>
                    </View>

                    <View style={styles.logisticItem}>
                      <User size={15} color="#0369A1" strokeWidth={2.2} />
                      <View style={{ flex: 1 }}>
                        <RNText style={styles.logisticLabel}>Chaired By</RNText>
                        <RNText style={styles.logisticVal}>
                          {selectedPastMeeting.chair} ({selectedPastMeeting.chairRole})
                        </RNText>
                      </View>
                    </View>

                    <View style={styles.logisticItem}>
                      <Users size={15} color="#0369A1" strokeWidth={2.2} />
                      <View style={{ flex: 1 }}>
                        <RNText style={styles.logisticLabel}>Target Attendees</RNText>
                        <RNText style={styles.logisticVal}>
                          {selectedPastMeeting.attendees}
                        </RNText>
                      </View>
                    </View>

                    <View style={styles.logisticItem}>
                      <CheckCircle2 size={15} color="#15803D" strokeWidth={2.2} />
                      <View style={{ flex: 1 }}>
                        <RNText style={styles.logisticLabel}>Quorum & Status</RNText>
                        <RNText style={[styles.logisticVal, { color: '#15803D' }]}>
                          {selectedPastMeeting.quorumStatus}
                        </RNText>
                      </View>
                    </View>
                  </View>

                  {/* Key Decisions & Action Items Section */}
                  <View style={styles.meetingSection}>
                    <RNText style={styles.meetingSectionTitle}>🎯 Key Decisions & Action Outcomes</RNText>
                    <View style={styles.pastDecisionsDetailCard}>
                      <RNText style={styles.pastDecisionsDetailPrimary}>
                        {selectedPastMeeting.keyDecisions}
                      </RNText>
                      <View style={styles.pastActionItemsDivider} />
                      <RNText style={styles.pastActionItemsHeader}>Follow-up Action Deadlines:</RNText>
                      {selectedPastMeeting.actionItems.map((action, idx) => (
                        <View key={idx} style={styles.pastActionItemRow}>
                          <View style={styles.pastActionBullet} />
                          <RNText style={styles.pastActionItemText}>{action}</RNText>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Agenda Discussed Section */}
                  <View style={styles.meetingSection}>
                    <RNText style={styles.meetingSectionTitle}>📋 Meeting Agenda Discussed</RNText>
                    <View style={styles.agendaCard}>
                      {selectedPastMeeting.agendaItems.map((item, idx) => (
                        <View key={idx} style={styles.agendaItemRow}>
                          <View style={styles.agendaNumberBadge}>
                            <RNText style={styles.agendaNumberText}>{idx + 1}</RNText>
                          </View>
                          <RNText style={styles.agendaItemText}>{item}</RNText>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Faculty Instructions & Directives Section */}
                  <View style={styles.meetingSection}>
                    <RNText style={styles.meetingSectionTitle}>⚠️ Faculty Instructions & Directives</RNText>
                    <View style={styles.instructionsBox}>
                      {selectedPastMeeting.instructions.map((inst, idx) => (
                        <View key={idx} style={styles.instructionRow}>
                          <CheckSquare size={16} color="#B45309" strokeWidth={2.2} />
                          <RNText style={styles.instructionText}>{inst}</RNText>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Attached MoM & Reference Documents */}
                  <View style={styles.meetingSection}>
                    <RNText style={styles.meetingSectionTitle}>📎 Minutes of Meeting & Documents</RNText>
                    <View style={styles.docsList}>
                      {selectedPastMeeting.documents.map((doc, idx) => (
                        <View key={idx} style={styles.docItem}>
                          <Paperclip size={16} color="#0369A1" />
                          <View style={{ flex: 1 }}>
                            <RNText style={styles.docName} numberOfLines={1}>{doc.name}</RNText>
                            <RNText style={styles.docSize}>{doc.size} · Official PDF</RNText>
                          </View>
                          <TouchableOpacity style={styles.downloadIconBtn}>
                            <Download size={15} color="#000000" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={{ height: 16 }} />
                </ScrollView>

                {/* Bottom Footer with Back Action */}
                <View style={styles.meetingModalFooter}>
                  <TouchableOpacity
                    style={styles.pastReturnToListBtn}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPastMeeting(null)}
                  >
                    <ChevronLeft size={16} color="#0F172A" strokeWidth={2.2} />
                    <RNText style={styles.pastReturnToListBtnText}>Back to Past Meetings Archive</RNText>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Teacher Profile Full-Screen Modal ─────────────────────── */}
      <TeacherProfileModal
        visible={isProfileOpen}
        profile={TEACHER_PROFILE}
        onClose={() => setIsProfileOpen(false)}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex1: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: C.surfaceTinted,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  avatarInitials: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarOnlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  greetingWrap: { flex: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greetingName: {
    fontSize: 20,
    fontWeight: '800',
    color: C.onSurface,
  },
  greetingSub: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceSecondary,
    marginTop: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },

  // Scroll Content
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.onSurface,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.primary,
  },

  // Quick Access Grid
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  quickItem: {
    alignItems: 'center',
    width: '31%',
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurface,
    textAlign: 'center',
  },

  // Card General
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    padding: 18,
    marginTop: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: C.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: C.onSurfaceSecondary,
    marginTop: 2,
  },
  periodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.progressTrack,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 2,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceSecondary,
  },

  // Progress Rows
  progressRow: {},
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: C.onSurface,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: C.onSurfaceSecondary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: C.progressTrack,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  heroTextCol: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(60,60,67,0.60)',
  },

  // Action Grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  actionBtnTextDark: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnTextLight: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 13,
  },

  // Teacher's Portal
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    marginTop: 18,
  },
  dateSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B8CC4',
  },
  portalList: {
    gap: 14,
    marginBottom: 24,
  },
  portalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  portalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  portalHeaderLeftCol: {
    flex: 1,
    gap: 4,
  },
  portalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  portalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  todayDatePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  todayDatePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369A1',
  },
  unifiedTimetableBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexShrink: 0,
  },
  unifiedTimetableBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
  },

  // ── Collapsed Summary View Styles ──
  scheduleSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryStatBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  summaryStatIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryStatTextCol: {
    flex: 1,
  },
  summaryStatNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  summaryStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  summarySubRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  summarySubText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },

  // ── Expanded 10-Period List Styles ──
  todayScheduleBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  todayClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
  },
  todayClassRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  todayPeriodCol: {
    width: 66,
  },
  todayPeriodNumeral: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  todayPeriodTime: {
    fontSize: 8.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  todayClassBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayClassBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  todaySubjectCol: {
    flex: 1,
  },
  todaySubjectTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  todayRoomText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  expandDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  expandDropdownText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },

  // ── Meeting Card Styles ──
  pastMeetingsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    flexShrink: 0,
  },
  pastMeetingsHeaderBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0369A1',
  },

  // ── Standardized Scrollable Pill Selector Styles ──
  meetingPillScrollView: {
    marginHorizontal: -2,
    marginBottom: 4,
  },
  meetingPillScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 3,
  },
  meetingSelectorPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  meetingSelectorPillActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  meetingSelectorPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  meetingSelectorPillTextActive: {
    color: '#ffffff',
  },

  meetingInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  meetingTitleText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  meetingMetaList: {
    gap: 10,
  },
  meetingMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  meetingMetaIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  meetingMetaTextCol: {
    flex: 1,
  },
  meetingMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  meetingMetaVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
    lineHeight: 17,
  },
  meetingDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#000000',
    marginTop: 2,
  },
  meetingDetailsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },

  // ── Meeting Modals Styles ──
  meetingModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 24,
    maxHeight: '88%',
    width: '100%',
  },
  meetingModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  meetingCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4,
  },
  meetingCategoryPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  meetingModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  pastModalSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  meetingCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal Switcher Tabs
  modalSelectorWrapper: {
    marginTop: 10,
    marginBottom: 2,
  },
  modalMeetingSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  modalMeetingTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalMeetingTabActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  modalMeetingTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalMeetingTabTextActive: {
    color: '#ffffff',
  },
  modalMeetingTabPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  modalMeetingTabPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  meetingModalScroll: {
    marginTop: 12,
  },
  meetingModalBanner: {
    backgroundColor: '#000000',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  meetingModalTopic: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 20,
  },
  logisticsCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    marginBottom: 16,
  },
  logisticItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  logisticLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  logisticVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
    lineHeight: 17,
  },
  meetingSection: {
    marginBottom: 16,
    gap: 8,
  },
  meetingSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  agendaCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  agendaItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  agendaNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  agendaNumberText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0369A1',
  },
  agendaItemText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 18,
  },
  instructionsBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 17,
  },
  docsList: {
    gap: 8,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  docName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  docSize: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  downloadIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingModalFooter: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  acknowledgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 14,
  },
  acknowledgeBtnDone: {
    backgroundColor: '#15803D',
  },
  acknowledgeBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  // ── Past Meetings List Styles ──
  pastMeetingsList: {
    gap: 12,
    paddingTop: 4,
  },
  pastMeetingCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  pastMeetingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastDatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pastDatePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  pastVenueText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  pastMeetingTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  pastChairRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pastChairText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  pastDecisionsBox: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 3,
  },
  pastDecisionsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  pastDecisionsText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 16,
  },
  pastDocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF8FE',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  pastDocName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  pastInstructionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#000000',
    marginTop: 2,
  },
  pastInstructionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  pastBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pastBackBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  pastDecisionsDetailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  pastDecisionsDetailPrimary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 18,
  },
  pastActionItemsDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  pastActionItemsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  pastActionItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
  },
  pastActionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0369A1',
    marginTop: 6,
  },
  pastActionItemText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 17,
  },
  pastReturnToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pastReturnToListBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  scheduleCardLive: {
    borderColor: '#1B8CC4',
    borderWidth: 2,
    backgroundColor: '#FAFEFF',
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444444',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  scheduleSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  scheduleDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleClassText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B8CC4',
  },
  bulletDot: {
    fontSize: 12,
    color: '#999999',
  },
  scheduleRoomText: {
    fontSize: 13,
    color: 'rgba(60,60,67,0.60)',
  },
  scheduleStudentCount: {
    fontSize: 13,
    color: 'rgba(60,60,67,0.60)',
  },
  liveActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  liveActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Pending Items
  pendingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
  },
  pendingItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pendingIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTextCol: {
    flex: 1,
    gap: 2,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  pendingSubtitle: {
    fontSize: 12,
    color: 'rgba(60,60,67,0.60)',
  },
  pendingArrowBtn: {
    padding: 6,
  },
  pendingDivider: {
    height: 1,
    backgroundColor: '#F0F0F3',
    marginVertical: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
  },
  modalSub: {
    fontSize: 13,
    color: 'rgba(60,60,67,0.60)',
    marginBottom: 8,
  },
  inputTitle: {
    backgroundColor: '#F4F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#000000',
  },
  modalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F6',
    borderRadius: 12,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },

  // Curriculum Studio Card Styles
  curriculumStudioBody: {
    gap: 12,
    marginBottom: 12,
  },
  curriculumStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  curriculumSubjectPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  curriculumSubjTag: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  curriculumSubjTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  curriculumStudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 12,
  },
  curriculumStudioBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
