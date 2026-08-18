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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  ChevronRight,
  UserCheck,
  BookOpen,
  ClipboardList,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Users,
  Search,
  Sparkles,
  Award,
  ArrowRight,
  TrendingUp,
  FileText,
  Megaphone,
} from 'lucide-react-native';

const C = {
  primary: '#000000',
  primaryBlue: '#34AADC',
  primaryDeep: '#1B8CC4',
  surface: '#ffffff',
  surfaceTinted: '#EEF8FE',
  cardBg: '#ffffff',
  cardBorder: '#F0F0F3',
  onSurface: '#000000',
  onSurfaceSecondary: 'rgba(60,60,67,0.60)',
  onSurfaceTertiary: 'rgba(60,60,67,0.30)',
  green: '#34C759',
  greenBg: '#E8F9ED',
  orange: '#FF9500',
  orangeBg: '#FFF4E5',
  purple: '#5856D6',
  purpleBg: '#F0F0FC',
  blueBg: '#E3F5FD',
};

type ScheduleItem = {
  id: string;
  time: string;
  className: string;
  subject: string;
  room: string;
  status: 'completed' | 'live' | 'upcoming';
  totalStudents: number;
};

const SCHEDULE: ScheduleItem[] = [
  {
    id: 's1',
    time: '08:30 AM - 09:15 AM',
    className: 'Grade 10 - Section A',
    subject: 'Advanced Mathematics',
    room: 'Room 204',
    status: 'completed',
    totalStudents: 36,
  },
  {
    id: 's2',
    time: '09:15 AM - 10:00 AM',
    className: 'Grade 12 - Section B',
    subject: 'Physics Lab Practical',
    room: 'Lab 2',
    status: 'live',
    totalStudents: 28,
  },
  {
    id: 's3',
    time: '10:30 AM - 11:15 AM',
    className: 'Grade 9 - Section C',
    subject: 'General Mathematics',
    room: 'Room 108',
    status: 'upcoming',
    totalStudents: 40,
  },
  {
    id: 's4',
    time: '11:45 AM - 12:30 PM',
    className: 'Grade 10 - Section B',
    subject: 'Theoretical Physics',
    room: 'Room 205',
    status: 'upcoming',
    totalStudents: 34,
  },
];

export default function TeacherHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Top Navigation Bar ────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <View style={styles.teacherInfoRow}>
          <View style={styles.avatarContainer}>
            <RNText style={styles.avatarText}>PS</RNText>
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.teacherTextContainer}>
            <RNText style={styles.teacherRoleTag}>CLASS TEACHER 10-A</RNText>
            <RNText style={styles.teacherName}>Mrs. Priya Sharma</RNText>
            <RNText style={styles.schoolName}>St. Xavier High School</RNText>
          </View>
        </View>

        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
          <Bell size={20} color="#000000" />
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Hero Banner ──────────────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextCol}>
            <View style={styles.badgeRow}>
              <Sparkles size={14} color="#000000" />
              <RNText style={styles.heroBadgeText}>Teacher Portal</RNText>
            </View>
            <RNText style={styles.heroTitle}>Good morning, Priya! ☀️</RNText>
            <RNText style={styles.heroSubtitle}>
              You have 4 classes scheduled today. Next up is Physics Lab in Room 2.
            </RNText>
          </View>
        </View>

        {/* ─── Quick Stats Grid ─────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#F4FAFE' }]}>
            <View style={[styles.statIconBadge, { backgroundColor: '#D6EFFC' }]}>
              <Clock size={18} color="#1B8CC4" />
            </View>
            <RNText style={styles.statValue}>4</RNText>
            <RNText style={styles.statLabel}>Today's Classes</RNText>
          </View>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}
            activeOpacity={0.7}
            onPress={() => router.push('/(teacher)/attendance')}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#FFEDD5' }]}>
              <UserCheck size={18} color="#EA580C" />
            </View>
            <RNText style={[styles.statValue, { color: '#EA580C' }]}>1 Pending</RNText>
            <RNText style={styles.statLabel}>Attendance Call</RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}
            activeOpacity={0.7}
            onPress={() => router.push('/(teacher)/homework')}
          >
            <View style={[styles.statIconBadge, { backgroundColor: '#DDD6FE' }]}>
              <BookOpen size={18} color="#7C3AED" />
            </View>
            <RNText style={[styles.statValue, { color: '#7C3AED' }]}>28</RNText>
            <RNText style={styles.statLabel}>Homework Review</RNText>
          </TouchableOpacity>

          <View style={[styles.statCard, { backgroundColor: '#ECFDF5' }]}>
            <View style={[styles.statIconBadge, { backgroundColor: '#A7F3D0' }]}>
              <Users size={18} color="#059669" />
            </View>
            <RNText style={[styles.statValue, { color: '#059669' }]}>138</RNText>
            <RNText style={styles.statLabel}>Total Students</RNText>
          </View>
        </View>

        {/* ─── Quick Action Actions Bar ─────────────────────────────────── */}
        <RNText style={styles.sectionHeader}>Quick Actions</RNText>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#000000' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(teacher)/attendance')}
          >
            <UserCheck size={20} color="#ffffff" />
            <RNText style={styles.actionBtnTextDark}>Mark Attendance</RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F0F0F3' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(teacher)/homework')}
          >
            <BookOpen size={20} color="#000000" />
            <RNText style={styles.actionBtnTextLight}>Assign Homework</RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F0F0F3' }]}
            activeOpacity={0.8}
            onPress={() => setShowNoticeModal(true)}
          >
            <Megaphone size={20} color="#000000" />
            <RNText style={styles.actionBtnTextLight}>Post Notice</RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F0F0F3' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(teacher)/my-classes')}
          >
            <Users size={20} color="#000000" />
            <RNText style={styles.actionBtnTextLight}>View Classes</RNText>
          </TouchableOpacity>
        </View>

        {/* ─── Today's Schedule ─────────────────────────────────────────── */}
        <View style={styles.sectionTitleRow}>
          <RNText style={styles.sectionHeader}>Today's Schedule</RNText>
          <RNText style={styles.dateSubtext}>Aug 12, 2026</RNText>
        </View>

        <View style={styles.scheduleList}>
          {SCHEDULE.map((item) => {
            const isLive = item.status === 'live';
            const isDone = item.status === 'completed';

            return (
              <View
                key={item.id}
                style={[
                  styles.scheduleCard,
                  isLive && styles.scheduleCardLive,
                ]}
              >
                <View style={styles.scheduleHeaderRow}>
                  <View style={styles.timePill}>
                    <Clock size={12} color="#666666" />
                    <RNText style={styles.timePillText}>{item.time}</RNText>
                  </View>

                  {isDone && (
                    <View style={[styles.statusBadge, { backgroundColor: C.greenBg }]}>
                      <CheckCircle2 size={12} color={C.green} />
                      <RNText style={[styles.statusText, { color: C.green }]}>Completed</RNText>
                    </View>
                  )}

                  {isLive && (
                    <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                      <View style={styles.livePulseDot} />
                      <RNText style={[styles.statusText, { color: '#EF4444' }]}>LIVE NOW</RNText>
                    </View>
                  )}

                  {!isDone && !isLive && (
                    <View style={[styles.statusBadge, { backgroundColor: '#F3F4F6' }]}>
                      <RNText style={[styles.statusText, { color: '#6B7280' }]}>Upcoming</RNText>
                    </View>
                  )}
                </View>

                <RNText style={styles.scheduleSubject}>{item.subject}</RNText>
                
                <View style={styles.scheduleDetailRow}>
                  <RNText style={styles.scheduleClassText}>{item.className}</RNText>
                  <RNText style={styles.bulletDot}>•</RNText>
                  <RNText style={styles.scheduleRoomText}>{item.room}</RNText>
                  <RNText style={styles.bulletDot}>•</RNText>
                  <RNText style={styles.scheduleStudentCount}>
                    {item.totalStudents} Students
                  </RNText>
                </View>

                {isLive && (
                  <TouchableOpacity
                    style={styles.liveActionBtn}
                    activeOpacity={0.8}
                    onPress={() => router.push('/(teacher)/attendance')}
                  >
                    <UserCheck size={16} color="#ffffff" />
                    <RNText style={styles.liveActionText}>Take Roll Call</RNText>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* ─── Pending Action Items ─────────────────────────────────────── */}
        <RNText style={styles.sectionHeader}>Pending Items</RNText>
        <View style={styles.pendingCard}>
          <View style={styles.pendingItemRow}>
            <View style={[styles.pendingIconBox, { backgroundColor: C.orangeBg }]}>
              <AlertCircle size={20} color={C.orange} />
            </View>
            <View style={styles.pendingTextCol}>
              <RNText style={styles.pendingTitle}>Grade 10-B Attendance Pending</RNText>
              <RNText style={styles.pendingSubtitle}>Period 4 attendance has not been submitted</RNText>
            </View>
            <TouchableOpacity
              style={styles.pendingArrowBtn}
              onPress={() => router.push('/(teacher)/attendance')}
            >
              <ChevronRight size={18} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.pendingDivider} />

          <View style={styles.pendingItemRow}>
            <View style={[styles.pendingIconBox, { backgroundColor: C.purpleBg }]}>
              <FileText size={20} color={C.purple} />
            </View>
            <View style={styles.pendingTextCol}>
              <RNText style={styles.pendingTitle}>Grade 10-A Math Assignment</RNText>
              <RNText style={styles.pendingSubtitle}>18 out of 36 student submissions remaining</RNText>
            </View>
            <TouchableOpacity
              style={styles.pendingArrowBtn}
              onPress={() => router.push('/(teacher)/homework')}
            >
              <ChevronRight size={18} color="#000000" />
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
              value={noticeTitle}
              onChangeText={setNoticeTitle}
            />

            <TextInput
              style={[styles.inputTitle, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Write notice details here..."
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  teacherInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  teacherTextContainer: {
    gap: 1,
  },
  teacherRoleTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1B8CC4',
    letterSpacing: 0.5,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  schoolName: {
    fontSize: 12,
    color: 'rgba(60,60,67,0.60)',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
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
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
  },
  dateSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1B8CC4',
  },
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
  scheduleList: {
    gap: 12,
    marginBottom: 24,
  },
  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    gap: 8,
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
});
