import React, { useState } from 'react';
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
import { StudentProfileModal, StudentProfileData } from '@/components/profile/StudentProfileModal';
import { MaterialIcons } from '@expo/vector-icons';
import {
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  BookOpen,
  CalendarDays,
  UserCheck,
  ClipboardCheck,
  User,
  X,
  CheckCircle2,
  PlusCircle,
  ShieldCheck,
  Check,
  Calendar,
  Phone,
  MapPin,
  Heart,
  Droplets,
  GraduationCap,
  ClipboardList,
  Users,
  Hash,
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
  // Quick Access
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
  // Schedule accents
  mathColor: '#000000',
  physicsColor: '#34AADC',
  englishColor: '#FF8FA8',
};

// ─── Profile Data Model ──────────────────────────────────────────────
export type StudentProfile = {
  id: string;
  name: string;
  grade: string;
  section: string;
  rollNo: string;
  school: string;
  avatarBg: string;
  initials: string;
  attendance: number;
  pendingAssignments: number;
  fatherName: string;
  motherName: string;
  dob: string;
  age: number;
  contact: string;
  address: string;
  bloodGroup: string;
  admissionDate: string;
  house: string;
  // New fields
  gender: string;
  transport: string;
  academicYear: string;
  classTeacher: string;
  emergencyContact: string;
  email: string;
  subjects: { subject: string; teacher: string; color: string }[];
};

const INITIAL_PROFILES: StudentProfile[] = [
  {
    id: 'STU-10042',
    name: 'Alex Johnson',
    grade: 'Grade 10',
    section: 'A',
    rollNo: '14',
    school: 'St. Xavier High School',
    avatarBg: '#000000',
    initials: 'AJ',
    attendance: 88,
    pendingAssignments: 35,
    fatherName: 'Robert Johnson',
    motherName: 'Emily Johnson',
    dob: '15 March 2011',
    age: 15,
    contact: '+91 98765 43210',
    address: '42, Maple Street, Sector 12, Noida, UP',
    bloodGroup: 'B+',
    admissionDate: '01 April 2021',
    house: 'Blue House',
    gender: 'Male',
    transport: 'Bus Route #7',
    academicYear: '2026-27',
    classTeacher: 'Mrs. Priya Sharma',
    emergencyContact: '+91 91234 56789',
    email: 'robert.johnson@email.com',
    subjects: [
      { subject: 'Mathematics', teacher: 'Mr. Rajesh Gupta', color: '#4F46E5' },
      { subject: 'Physics', teacher: 'Dr. Neha Verma', color: '#059669' },
      { subject: 'Chemistry', teacher: 'Mr. Arjun Patel', color: '#D97706' },
      { subject: 'English', teacher: 'Mrs. Sonia Kapoor', color: '#EC4899' },
      { subject: 'Hindi', teacher: 'Mr. Vikram Singh', color: '#EF4444' },
      { subject: 'Computer Science', teacher: 'Ms. Anita Roy', color: '#3B82F6' },
      { subject: 'Social Studies', teacher: 'Mr. Ravi Kumar', color: '#8B5CF6' },
    ],
  },
  {
    id: 'STU-10087',
    name: 'Sarah Johnson',
    grade: 'Grade 5',
    section: 'B',
    rollNo: '08',
    school: 'St. Xavier Primary School',
    avatarBg: '#EC4899',
    initials: 'SJ',
    attendance: 96,
    pendingAssignments: 15,
    fatherName: 'Robert Johnson',
    motherName: 'Emily Johnson',
    dob: '22 August 2016',
    age: 10,
    contact: '+91 98765 43210',
    address: '42, Maple Street, Sector 12, Noida, UP',
    bloodGroup: 'A+',
    admissionDate: '01 April 2023',
    house: 'Red House',
    gender: 'Female',
    transport: 'Bus Route #7',
    academicYear: '2026-27',
    classTeacher: 'Mrs. Kavita Mehta',
    emergencyContact: '+91 91234 56789',
    email: 'robert.johnson@email.com',
    subjects: [
      { subject: 'Mathematics', teacher: 'Ms. Deepa Rao', color: '#4F46E5' },
      { subject: 'English', teacher: 'Mrs. Sunita Das', color: '#EC4899' },
      { subject: 'Hindi', teacher: 'Mr. Ashok Sharma', color: '#EF4444' },
      { subject: 'EVS', teacher: 'Mrs. Rekha Jain', color: '#059669' },
      { subject: 'Art & Craft', teacher: 'Ms. Tanya Bose', color: '#D97706' },
    ],
  },
  {
    id: 'STU-10103',
    name: 'Marcus Johnson',
    grade: 'Grade 8',
    section: 'C',
    rollNo: '22',
    school: 'St. Xavier Middle School',
    avatarBg: '#10B981',
    initials: 'MJ',
    attendance: 91,
    pendingAssignments: 60,
    fatherName: 'Robert Johnson',
    motherName: 'Emily Johnson',
    dob: '10 January 2013',
    age: 13,
    contact: '+91 98765 43210',
    address: '42, Maple Street, Sector 12, Noida, UP',
    bloodGroup: 'O+',
    admissionDate: '01 April 2022',
    house: 'Green House',
    gender: 'Male',
    transport: 'Self-Transport',
    academicYear: '2026-27',
    classTeacher: 'Mr. Suresh Nair',
    emergencyContact: '+91 91234 56789',
    email: 'robert.johnson@email.com',
    subjects: [
      { subject: 'Mathematics', teacher: 'Mr. Amit Saxena', color: '#4F46E5' },
      { subject: 'Science', teacher: 'Dr. Pooja Desai', color: '#059669' },
      { subject: 'English', teacher: 'Mrs. Anita Kulkarni', color: '#EC4899' },
      { subject: 'Hindi', teacher: 'Mr. Vikram Singh', color: '#EF4444' },
      { subject: 'Social Science', teacher: 'Mr. Ravi Kumar', color: '#8B5CF6' },
      { subject: 'Sanskrit', teacher: 'Mr. Devendra Tiwari', color: '#D97706' },
    ],
  },
];

const QUICK_ACCESS = [
  { key: 'exam', label: 'Exam', Icon: GraduationCap, bg: C.examBg, fg: C.examFg, route: '/exam' },
  { key: 'test', label: 'Tests', Icon: ClipboardList, bg: C.testBg, fg: C.testFg, route: '/test' },
  { key: 'timetable', label: 'Timetable', Icon: CalendarDays, bg: C.timetableBg, fg: C.timetableFg, route: '/timetable' },
  { key: 'result', label: 'Result', Icon: ClipboardCheck, bg: C.resultBg, fg: C.resultFg, route: '/timetable' },
  { key: 'curriculum', label: 'Curriculum', Icon: BookOpen, bg: C.curriculumBg, fg: C.curriculumFg, route: '/curriculum' },
];

const SCHEDULE = [
  { subject: 'Mathematics', room: 'Room 204', time: '9:00 - 9:45 AM', color: C.mathColor },
  { subject: 'Physics', room: 'Lab 3', time: '10:00 - 10:45 AM', color: C.physicsColor },
  { subject: 'English Literature', room: 'Room 108', time: '11:15 - 12:00 PM', color: C.englishColor },
];

// ─── Main Component ──────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState('Month');

  // Profile Switcher State
  const [profiles, setProfiles] = useState<StudentProfile[]>(INITIAL_PROFILES);
  const [activeProfileId, setActiveProfileId] = useState<string>('STU-10042');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);

  // Link New Profile Form State
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [newId, setNewId] = useState('');

  const activeProfile =
    profiles.find((p) => p.id === activeProfileId) ?? profiles[0];

  const handleAddProfile = () => {
    if (!newName.trim() || !newId.trim()) return;

    const initials = newName
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    const colors = ['#F59E0B', '#8B5CF6', '#3B82F6', '#10B981', '#EC4899'];
    const randomColor = colors[profiles.length % colors.length];

    const newProfile: StudentProfile = {
      id: newId.trim().toUpperCase(),
      name: newName.trim(),
      grade: newGrade.trim() || 'Grade 1',
      section: 'A',
      rollNo: `${Math.floor(Math.random() * 30) + 1}`,
      fatherName: 'Parent',
      motherName: 'Parent',
      dob: '01 January 2015',
      age: 11,
      contact: '+91 00000 00000',
      address: 'Address not provided',
      bloodGroup: 'N/A',
      admissionDate: '01 April 2024',
      house: 'Not Assigned',
      school: 'St. Xavier School',
      avatarBg: randomColor,
      initials: initials || 'ST',
      attendance: 90,
      pendingAssignments: 25,
      gender: 'Not Specified',
      transport: 'Not Assigned',
      academicYear: '2026-27',
      classTeacher: 'Not Assigned',
      emergencyContact: '+91 00000 00000',
      email: 'not.provided@email.com',
      subjects: [],
    };

    setProfiles((prev) => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);
    setNewName('');
    setNewGrade('');
    setNewId('');
    setIsLinkModalOpen(false);
    setIsSwitcherOpen(false);
  };

  return (
    <View style={[s.flex1, { backgroundColor: C.surfaceTinted }]}>
      {/* ── Header ──────────────────────────────────────────────── */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        {/* Avatar (tap → ID Switcher) + Greeting (tap → Student Profile) */}
        <View style={s.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setIsSwitcherOpen(true)}
          >
            <View style={[s.avatar, { backgroundColor: activeProfile.avatarBg }]}>
              <RNText style={s.avatarInitials}>{activeProfile.initials}</RNText>
              <View style={s.avatarSwitchBadge}>
                <ChevronDown size={10} color="#ffffff" strokeWidth={3} />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            style={s.greetingWrap}
            onPress={() => setIsProfileOpen(true)}
          >
            <View style={s.nameRow}>
              <RNText style={s.greetingName}>
                Hello, {activeProfile.name.split(' ')[0]}
              </RNText>
              <ChevronRight size={14} color="#6B7280" strokeWidth={2.5} />
            </View>
            <RNText style={s.greetingSub}>
              {activeProfile.grade} · Section {activeProfile.section} · {activeProfile.id}
            </RNText>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={s.headerRight}>
          <TouchableOpacity activeOpacity={0.7} style={s.headerBtn}>
            <Search size={17} color="#374151" strokeWidth={2.2} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} style={s.headerBtn}>
            <Bell size={17} color="#374151" strokeWidth={2.2} />
            <View style={s.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable Content ──────────────────────────────────── */}
      <ScrollView
        style={s.flex1}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Announcement Carousel Section ─────────────────────── */}
        <AnnouncementCarousel />

        {/* ── Quick Access ──────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <RNText style={s.sectionTitle}>Quick Access</RNText>
          <TouchableOpacity style={s.seeAllBtn}>
            <RNText style={s.seeAllText}>See all</RNText>
            <ChevronRight size={14} color={C.primary} />
          </TouchableOpacity>
        </View>

        <View style={s.quickGrid}>
          {QUICK_ACCESS.map((item) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.8}
              style={s.quickItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[s.quickIcon, { backgroundColor: item.bg }]}>
                <item.Icon size={22} color={item.fg} strokeWidth={2.2} />
              </View>
              <RNText style={s.quickLabel}>{item.label}</RNText>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Academic Overview ──────────────────────────────────── */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View>
              <RNText style={s.cardTitle}>Academic Overview</RNText>
              <RNText style={s.cardSubtitle}>
                {activeProfile.name}&apos;s Progress
              </RNText>
            </View>
            <TouchableOpacity style={s.periodPill}>
              <RNText style={s.periodText}>{period}</RNText>
              <MaterialIcons name="keyboard-arrow-down" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Attendance bar */}
          <View style={s.progressRow}>
            <View style={s.progressLabelRow}>
              <RNText style={s.progressLabel}>Attendance</RNText>
              <RNText style={s.progressValue}>
                {activeProfile.attendance}/100%
              </RNText>
            </View>
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${activeProfile.attendance}%`,
                    backgroundColor: C.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Assignments bar */}
          <View style={[s.progressRow, { marginTop: 16 }]}>
            <View style={s.progressLabelRow}>
              <RNText style={s.progressLabel}>Pending Assignments</RNText>
              <RNText style={s.progressValue}>
                {activeProfile.pendingAssignments}/100%
              </RNText>
            </View>
            <View style={s.progressTrack}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${activeProfile.pendingAssignments}%`,
                    backgroundColor: C.pink,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* ── Today's Schedule ───────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <RNText style={s.sectionTitle}>Today's Schedule</RNText>
          <TouchableOpacity style={s.seeAllBtn}>
            <RNText style={s.seeAllText}>See all</RNText>
            <ChevronRight size={14} color={C.primary} />
          </TouchableOpacity>
        </View>

        {SCHEDULE.map((item) => (
          <View key={item.subject} style={s.scheduleItem}>
            <View style={[s.scheduleAccent, { backgroundColor: item.color }]} />
            <View style={s.scheduleContent}>
              <RNText style={s.scheduleSubject}>{item.subject}</RNText>
              <RNText style={s.scheduleRoom}>{item.room}</RNText>
            </View>
            <RNText style={s.scheduleTime}>{item.time}</RNText>
          </View>
        ))}
      </ScrollView>

      {/* ── Profile / ID Switcher Bottom Sheet Modal ─────────────── */}
      <Modal
        visible={isSwitcherOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsSwitcherOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={s.modalOverlay}
          onPress={() => setIsSwitcherOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={s.modalSheet}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <View style={s.modalDragHandle} />

            {/* Header */}
            <View style={s.sheetHeader}>
              <View style={s.sheetHeaderLeft}>
                <ShieldCheck size={24} color={C.primary} strokeWidth={2.2} />
                <View>
                  <RNText style={s.sheetTitle}>Switch Student Profile</RNText>
                  <RNText style={s.sheetSubtitle}>
                    {profiles.length} Accounts linked with this number 989-080-9809
                  </RNText>
                </View>
              </View>
              <TouchableOpacity
                style={s.closeBtn}
                onPress={() => setIsSwitcherOpen(false)}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Student List */}
            <ScrollView
              style={s.sheetList}
              showsVerticalScrollIndicator={false}
            >
              {profiles.map((item) => {
                const isActive = item.id === activeProfileId;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    style={[
                      s.profileCard,
                      isActive && s.profileCardActive,
                    ]}
                    onPress={() => {
                      setActiveProfileId(item.id);
                      setIsSwitcherOpen(false);
                    }}
                  >
                    {/* Avatar */}
                    <View
                      style={[
                        s.profileAvatar,
                        { backgroundColor: item.avatarBg },
                      ]}
                    >
                      <RNText style={s.profileAvatarText}>
                        {item.initials}
                      </RNText>
                    </View>

                    {/* Content */}
                    <View style={s.profileInfo}>
                      <View style={s.profileNameRow}>
                        <RNText style={s.profileName}>{item.name}</RNText>
                        {isActive && (
                          <View style={s.activeBadge}>
                            <Check size={12} color="#ffffff" strokeWidth={3} />
                            <RNText style={s.activeBadgeText}>Active</RNText>
                          </View>
                        )}
                      </View>
                      <RNText style={s.profileMeta}>
                        {item.grade} · Section {item.section} · Roll #{item.rollNo}
                      </RNText>
                      <RNText style={s.profileSchool}>
                        ID: {item.id}
                      </RNText>
                    </View>

                    {/* Radio/Check indicator */}
                    <View
                      style={[
                        s.checkCircle,
                        isActive && s.checkCircleActive,
                      ]}
                    >
                      {isActive && (
                        <CheckCircle2 size={22} color={C.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Link New Student ID Modal ─────────────────────────────── */}
      <Modal
        visible={isLinkModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsLinkModalOpen(false)}
      >
        <View style={s.dialogOverlay}>
          <View style={s.dialogCard}>
            <View style={s.dialogHeader}>
              <RNText style={s.dialogTitle}>Link Student ID</RNText>
              <TouchableOpacity onPress={() => setIsLinkModalOpen(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <RNText style={s.dialogSub}>
              Enter the registered student details to link a new student ID.
            </RNText>

            <View style={s.inputGroup}>
              <RNText style={s.inputLabel}>Student Full Name</RNText>
              <TextInput
                style={s.input}
                placeholder="e.g. Maya Johnson"
                placeholderTextColor="#9CA3AF"
                value={newName}
                onChangeText={setNewName}
              />
            </View>

            <View style={s.inputGroup}>
              <RNText style={s.inputLabel}>Grade & Section</RNText>
              <TextInput
                style={s.input}
                placeholder="e.g. Grade 4 · Section A"
                placeholderTextColor="#9CA3AF"
                value={newGrade}
                onChangeText={setNewGrade}
              />
            </View>

            <View style={s.inputGroup}>
              <RNText style={s.inputLabel}>Student Registration ID Code</RNText>
              <TextInput
                style={s.input}
                placeholder="e.g. STU-10145"
                placeholderTextColor="#9CA3AF"
                value={newId}
                onChangeText={setNewId}
                autoCapitalize="characters"
              />
            </View>

            <View style={s.dialogActions}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setIsLinkModalOpen(false)}
              >
                <RNText style={s.cancelText}>Cancel</RNText>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.submitBtn}
                onPress={handleAddProfile}
              >
                <RNText style={s.submitText}>Link Profile</RNText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Student Profile Full-Screen Modal ──────────────────────── */}
      <StudentProfileModal
        visible={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={{
          ...activeProfile,
          siblings: profiles
            .filter((p) => p.id !== activeProfile.id)
            .map((p) => ({
              name: p.name,
              grade: p.grade,
              section: p.section,
              avatarBg: p.avatarBg,
              initials: p.initials,
            })),
        }}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
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
  avatarSwitchBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: C.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Scroll content
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
    rowGap: 14,
  },
  quickItem: {
    alignItems: 'center',
    width: '18%',
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

  // Card general
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
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

  // Progress rows
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

  // Schedule
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  scheduleAccent: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 14,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: C.onSurface,
  },
  scheduleRoom: {
    fontSize: 12,
    fontWeight: '500',
    color: C.onSurfaceSecondary,
    marginTop: 2,
  },
  scheduleTime: {
    fontSize: 12,
    fontWeight: '600',
    color: C.primary,
  },

  // ── Profile Switcher Modal Styles ─────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    paddingBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.onSurface,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: C.onSurfaceSecondary,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetList: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 340,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  profileCardActive: {
    backgroundColor: '#F5F3FF',
    borderColor: C.primary,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.onSurface,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: C.onSurfaceSecondary,
    marginTop: 2,
  },
  profileSchool: {
    fontSize: 11,
    fontWeight: '500',
    color: C.onSurfaceTertiary,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  checkCircleActive: {},

  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  addAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryContainer,
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  addAccountText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.primary,
  },

  // ── Dialog Modal Styles ───────────────────────────────────────────
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialogCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: C.onSurface,
  },
  dialogSub: {
    fontSize: 13,
    fontWeight: '500',
    color: C.onSurfaceSecondary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.onSurface,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: C.onSurface,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.onSurfaceSecondary,
  },
  submitBtn: {
    backgroundColor: C.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});

