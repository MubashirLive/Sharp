import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text as RNText,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Building2,
  Bell,
  Users,
  UserCheck,
  Megaphone,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  ChevronRight,
  ShieldAlert,
  Clock,
  FileSpreadsheet,
  BadgeCheck,
} from 'lucide-react-native';

type LeaveRequest = {
  id: string;
  staffName: string;
  role: string;
  dates: string;
  reason: string;
  avatarBg: string;
  initials: string;
};

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr1',
    staffName: 'Mrs. Priya Sharma',
    role: 'Class Teacher (10-A) • Math',
    dates: '13 Aug - 14 Aug (2 Days)',
    reason: 'Medical appointment & fever recovery',
    avatarBg: '#000000',
    initials: 'PS',
  },
  {
    id: 'lr2',
    staffName: 'Mr. Vikram Singh',
    role: 'Hindi Teacher • Senior Wing',
    dates: '14 Aug (1 Day)',
    reason: 'Family urgency in home town',
    avatarBg: '#EF4444',
    initials: 'VS',
  },
];

export default function PrincipalHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');

  const handleApproveLeave = (id: string, name: string) => {
    setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
    Alert.alert('Leave Approved', `Leave request for ${name} has been approved.`);
  };

  const handleRejectLeave = (id: string, name: string) => {
    setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
    Alert.alert('Leave Rejected', `Leave request for ${name} has been rejected.`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Top Navigation Bar ────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <View style={styles.principalInfoRow}>
          <View style={styles.avatarContainer}>
            <RNText style={styles.avatarText}>RS</RNText>
          </View>
          <View style={styles.principalTextCol}>
            <RNText style={styles.roleBadgeText}>PRINCIPAL DASHBOARD</RNText>
            <RNText style={styles.principalName}>Dr. Rajeshwar Sharma</RNText>
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
        {/* ─── Executive KPI Banner ─────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <View style={styles.schoolPill}>
              <Building2 size={14} color="#ffffff" />
              <RNText style={styles.schoolPillText}>Academic Session 2026-27</RNText>
            </View>
            <RNText style={styles.liveDateText}>12 Aug 2026</RNText>
          </View>

          <RNText style={styles.kpiTitle}>School Performance Overview</RNText>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCol}>
              <RNText style={styles.kpiValue}>94.2%</RNText>
              <RNText style={styles.kpiLabel}>Student Attendance</RNText>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiCol}>
              <RNText style={styles.kpiValue}>96.8%</RNText>
              <RNText style={styles.kpiLabel}>Staff Attendance (62/64)</RNText>
            </View>
          </View>

          <View style={styles.heroFooterRow}>
            <Users size={14} color="rgba(255,255,255,0.7)" />
            <RNText style={styles.heroFooterText}>
              1,420 Active Students enrolled across 32 Sections
            </RNText>
          </View>
        </View>

        {/* ─── Quick Actions ───────────────────────────────────────────── */}
        <RNText style={styles.sectionHeader}>Quick Actions</RNText>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#000000' }]}
            activeOpacity={0.8}
            onPress={() => setShowBroadcastModal(true)}
          >
            <Megaphone size={18} color="#ffffff" />
            <RNText style={styles.actionBtnTextDark}>Publish Notice</RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F0F0F3' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(principal)/staff')}
          >
            <BadgeCheck size={18} color="#000000" />
            <RNText style={styles.actionBtnTextLight}>Staff Directory</RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F0F0F3' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(principal)/attendance')}
          >
            <TrendingUp size={18} color="#000000" />
            <RNText style={styles.actionBtnTextLight}>Attendance Analytics</RNText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#F0F0F3' }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(principal)/chat')}
          >
            <Users size={18} color="#000000" />
            <RNText style={styles.actionBtnTextLight}>Staff Messages</RNText>
          </TouchableOpacity>
        </View>

        {/* ─── Wing Attendance Compliance Breakdown ────────────────────── */}
        <View style={styles.sectionTitleRow}>
          <RNText style={styles.sectionHeader}>Wing Attendance Summary</RNText>
          <TouchableOpacity onPress={() => router.push('/(principal)/attendance')}>
            <RNText style={styles.viewDetailsText}>View Details →</RNText>
          </TouchableOpacity>
        </View>

        <View style={styles.wingCardList}>
          <View style={styles.wingCard}>
            <View style={styles.wingHeaderRow}>
              <RNText style={styles.wingName}>Primary Wing (Grades 1-5)</RNText>
              <RNText style={[styles.wingPct, { color: '#34C759' }]}>96.5%</RNText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '96.5%', backgroundColor: '#34C759' }]} />
            </View>
            <RNText style={styles.wingMeta}>420 Students • 12 Sections</RNText>
          </View>

          <View style={styles.wingCard}>
            <View style={styles.wingHeaderRow}>
              <RNText style={styles.wingName}>Middle Wing (Grades 6-8)</RNText>
              <RNText style={[styles.wingPct, { color: '#1B8CC4' }]}>93.1%</RNText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '93.1%', backgroundColor: '#1B8CC4' }]} />
            </View>
            <RNText style={styles.wingMeta}>480 Students • 10 Sections</RNText>
          </View>

          <View style={styles.wingCard}>
            <View style={styles.wingHeaderRow}>
              <RNText style={styles.wingName}>Senior Secondary (Grades 9-12)</RNText>
              <RNText style={[styles.wingPct, { color: '#7C3AED' }]}>94.0%</RNText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '94.0%', backgroundColor: '#7C3AED' }]} />
            </View>
            <RNText style={styles.wingMeta}>520 Students • 10 Sections</RNText>
          </View>
        </View>

        {/* ─── Pending Staff Leave Approvals ─────────────────────────────── */}
        <View style={styles.sectionTitleRow}>
          <RNText style={styles.sectionHeader}>Staff Leave Requests</RNText>
          <RNText style={styles.pendingBadgeText}>{leaveRequests.length} Pending</RNText>
        </View>

        {leaveRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <CheckCircle2 size={24} color="#34C759" />
            <RNText style={styles.emptyText}>All leave requests have been reviewed!</RNText>
          </View>
        ) : (
          <View style={styles.leaveRequestsList}>
            {leaveRequests.map((req) => (
              <View key={req.id} style={styles.leaveCard}>
                <View style={styles.leaveTopRow}>
                  <View style={[styles.leaveAvatar, { backgroundColor: req.avatarBg }]}>
                    <RNText style={styles.leaveAvatarText}>{req.initials}</RNText>
                  </View>
                  <View style={styles.leaveMetaCol}>
                    <RNText style={styles.leaveStaffName}>{req.staffName}</RNText>
                    <RNText style={styles.leaveRoleText}>{req.role}</RNText>
                  </View>
                </View>

                <View style={styles.leaveDetailBox}>
                  <View style={styles.leaveDateRow}>
                    <Clock size={12} color="#1B8CC4" />
                    <RNText style={styles.leaveDatesText}>{req.dates}</RNText>
                  </View>
                  <RNText style={styles.leaveReasonText}>"{req.reason}"</RNText>
                </View>

                <View style={styles.leaveActionsRow}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => handleRejectLeave(req.id, req.staffName)}
                    activeOpacity={0.8}
                  >
                    <XCircle size={14} color="#FF3B30" />
                    <RNText style={styles.rejectBtnText}>Reject</RNText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => handleApproveLeave(req.id, req.staffName)}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2 size={14} color="#ffffff" />
                    <RNText style={styles.approveBtnText}>Approve Leave</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Emergency Notice Modal ────────────────────────────────────── */}
      <Modal visible={showBroadcastModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RNText style={styles.modalTitle}>School-Wide Announcement</RNText>
            <RNText style={styles.modalSub}>Post urgent notice to all staff, teachers, and parents</RNText>

            <TextInput
              style={styles.inputTitle}
              placeholder="Notice Title (e.g. School Closed Tomorrow due to Rain)"
              value={broadcastTitle}
              onChangeText={setBroadcastTitle}
            />

            <TextInput
              style={[styles.inputTitle, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Write official announcement body here..."
              multiline
              value={broadcastBody}
              onChangeText={setBroadcastBody}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowBroadcastModal(false)}
              >
                <RNText style={styles.modalCancelText}>Cancel</RNText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={() => {
                  setShowBroadcastModal(false);
                  setBroadcastTitle('');
                  setBroadcastBody('');
                  Alert.alert('Announcement Broadcasted! 📢', 'Notice has been published to all users.');
                }}
              >
                <RNText style={styles.modalSubmitText}>Broadcast Now</RNText>
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
  principalInfoRow: {
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
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  principalTextCol: {
    gap: 1,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1B8CC4',
    letterSpacing: 0.5,
  },
  principalName: {
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
    gap: 12,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schoolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  schoolPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  liveDateText: {
    fontSize: 12,
    color: '#34AADC',
    fontWeight: '700',
  },
  kpiTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  kpiLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroFooterText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
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
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B8CC4',
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF9500',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
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
  wingCardList: {
    gap: 10,
    marginBottom: 24,
  },
  wingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    gap: 8,
  },
  wingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wingName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  wingPct: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F0F0F3',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  wingMeta: {
    fontSize: 12,
    color: 'rgba(60,60,67,0.60)',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F9ED',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
  },
  leaveRequestsList: {
    gap: 12,
    marginBottom: 24,
  },
  leaveCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    gap: 12,
  },
  leaveTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leaveAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveAvatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  leaveMetaCol: {
    flex: 1,
    gap: 2,
  },
  leaveStaffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  leaveRoleText: {
    fontSize: 12,
    color: 'rgba(60,60,67,0.60)',
  },
  leaveDetailBox: {
    backgroundColor: '#F4F4F6',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  leaveDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leaveDatesText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B8CC4',
  },
  leaveReasonText: {
    fontSize: 12,
    color: '#444444',
    fontStyle: 'italic',
  },
  leaveActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: 12,
  },
  rejectBtnText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#000000',
    paddingVertical: 10,
    borderRadius: 12,
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
