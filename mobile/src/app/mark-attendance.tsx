import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCheck,
  CircleAlert,
  Clock,
  Edit3,
  Eye,
  GraduationCap,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react-native';

const COLORS = {
  surface: '#f9f9ff',
  surfaceLow: '#f3f3f9',
  surfaceLowest: '#ffffff',
  surfaceContainer: '#edecef',
  text: '#191b20',
  textMuted: '#707884',
  outline: '#c3c6cf',
  primary: '#000000',
  primaryContainer: '#d1e4ff',
  onPrimary: '#ffffff',
  present: '#29b85d',
  presentBg: '#e8f9ed',
  presentText: '#14532d',
  absent: '#ef3d3d',
  absentBg: '#fee2e2',
  absentText: '#7f1d1d',
  leave: '#f3ce28',
  leaveBg: '#fef9c3',
  leaveText: '#713f12',
  warning: '#b45309',
  warningBg: '#fef3c7',
};

type AttendanceStatus = 'present' | 'absent' | 'leave';

type StudentEntry = {
  id: string;
  name: string;
  rollNo: string;
  className: string;
  section: string;
  avatarBg: string;
  initials: string;
  status: AttendanceStatus;
  note?: string;
};

// Initial student roster data generator
function generateInitialStudents(className: string, section: string): StudentEntry[] {
  const sampleNames = [
    { roll: '01', name: 'Aarav Sharma', bg: '#3B82F6', inits: 'AS', status: 'present' as const },
    { roll: '02', name: 'Aditi Patel', bg: '#EC4899', inits: 'AP', status: 'present' as const },
    { roll: '03', name: 'Alex Johnson', bg: '#000000', inits: 'AJ', status: 'present' as const },
    { roll: '04', name: 'Ananya Verma', bg: '#10B981', inits: 'AV', status: 'present' as const },
    { roll: '05', name: 'Devansh Gupta', bg: '#F59E0B', inits: 'DG', status: 'absent' as const, note: 'Uninformed absence' },
    { roll: '06', name: 'Diya Kapoor', bg: '#8B5CF6', inits: 'DK', status: 'present' as const },
    { roll: '07', name: 'Ishan Kumar', bg: '#059669', inits: 'IK', status: 'present' as const },
    { roll: '08', name: 'Kabir Singh', bg: '#EF4444', inits: 'KS', status: 'present' as const },
    { roll: '09', name: 'Kavya Roy', bg: '#6366F1', inits: 'KR', status: 'leave' as const, note: 'Medical appointment' },
    { roll: '10', name: 'Marcus Johnson', bg: '#10B981', inits: 'MJ', status: 'present' as const },
    { roll: '11', name: 'Meera Das', bg: '#EC4899', inits: 'MD', status: 'present' as const },
    { roll: '12', name: 'Nikhil Mehta', bg: '#3B82F6', inits: 'NM', status: 'present' as const },
    { roll: '13', name: 'Riya Bose', bg: '#8B5CF6', inits: 'RB', status: 'present' as const },
    { roll: '14', name: 'Siddharth Rao', bg: '#F59E0B', inits: 'SR', status: 'present' as const },
    { roll: '15', name: 'Vihaan Joshi', bg: '#000000', inits: 'VJ', status: 'present' as const },
    { roll: '16', name: 'Zoya Khan', bg: '#EC4899', inits: 'ZK', status: 'present' as const },
    { roll: '17', name: 'Yashwardhan Roy', bg: '#3B82F6', inits: 'YR', status: 'present' as const },
    { roll: '18', name: 'Tanya Malhotra', bg: '#8B5CF6', inits: 'TM', status: 'present' as const },
    { roll: '19', name: 'Samar Pratap', bg: '#F59E0B', inits: 'SP', status: 'present' as const },
    { roll: '20', name: 'Rohan Mehra', bg: '#10B981', inits: 'RM', status: 'present' as const },
    { roll: '21', name: 'Pooja Hegde', bg: '#EF4444', inits: 'PH', status: 'absent' as const },
    { roll: '22', name: 'Omkar Salvi', bg: '#6366F1', inits: 'OS', status: 'present' as const },
    { roll: '23', name: 'Neha Kakkar', bg: '#EC4899', inits: 'NK', status: 'present' as const },
    { roll: '24', name: 'Manish Pandey', bg: '#059669', inits: 'MP', status: 'present' as const },
    { roll: '25', name: 'Lakshya Sen', bg: '#3B82F6', inits: 'LS', status: 'present' as const },
    { roll: '26', name: 'Kriti Sanon', bg: '#F59E0B', inits: 'KS', status: 'present' as const },
    { roll: '27', name: 'Jatin Sapru', bg: '#8B5CF6', inits: 'JS', status: 'present' as const },
    { roll: '28', name: 'Hitesh Modi', bg: '#000000', inits: 'HM', status: 'present' as const },
    { roll: '29', name: 'Garima Sharma', bg: '#10B981', inits: 'GS', status: 'present' as const },
    { roll: '30', name: 'Faisal Khan', bg: '#EF4444', inits: 'FK', status: 'present' as const },
    { roll: '31', name: 'Ekta Kapoor', bg: '#EC4899', inits: 'EK', status: 'present' as const },
    { roll: '32', name: 'Danish Sait', bg: '#6366F1', inits: 'DS', status: 'present' as const },
    { roll: '33', name: 'Chetan Hans', bg: '#059669', inits: 'CH', status: 'present' as const },
    { roll: '34', name: 'Bhumika Chawla', bg: '#F59E0B', inits: 'BC', status: 'present' as const },
    { roll: '35', name: 'Armaan Malik', bg: '#3B82F6', inits: 'AM', status: 'present' as const },
    { roll: '36', name: 'Alia Bhatt', bg: '#8B5CF6', inits: 'AB', status: 'present' as const },
  ];

  return sampleNames.map((s, idx) => ({
    id: `${className}-${section}-${idx + 1}`,
    name: s.name,
    rollNo: s.roll,
    className,
    section,
    avatarBg: s.bg,
    initials: s.inits,
    status: s.status,
    note: s.note,
  }));
}

function formatDate(dateStr: string) {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return dateStr;
}

export default function MarkAttendanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    className?: string;
    section?: string;
    date?: string;
    isMarked?: string;
    mode?: 'view' | 'edit';
  }>();

  const className = params.className || 'Grade 10';
  const section = params.section || 'Section A';
  const dateKey = params.date || '2026-07-29';
  const isInitiallyMarked = params.isMarked === 'true';
  const requestedMode = params.mode || (isInitiallyMarked ? 'view' : 'edit');

  // ─── State ────────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentEntry[]>(() =>
    generateInitialStudents(className, section)
  );

  // Snapshot of initial student state to detect actual changes
  const [initialSnapshot, setInitialSnapshot] = useState<StudentEntry[]>(() =>
    generateInitialStudents(className, section)
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isEditingMode, setIsEditingMode] = useState(requestedMode === 'edit');
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // ─── Check if user made any actual changes ───────────────────────────────
  const hasChanges = useMemo(() => {
    if (!isEditingMode) return false;
    return students.some((s, idx) => {
      const orig = initialSnapshot[idx];
      return orig && (s.status !== orig.status || s.note !== orig.note);
    });
  }, [students, initialSnapshot, isEditingMode]);

  const changedCount = useMemo(() => {
    if (!isEditingMode) return 0;
    return students.filter((s, idx) => {
      const orig = initialSnapshot[idx];
      return orig && (s.status !== orig.status || s.note !== orig.note);
    }).length;
  }, [students, initialSnapshot, isEditingMode]);

  // ─── Live Real-Time Metrics ───────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = students.length;
    const present = students.filter((s) => s.status === 'present').length;
    const absent = students.filter((s) => s.status === 'absent').length;
    const leave = students.filter((s) => s.status === 'leave').length;
    const percentage = total === 0 ? 0 : Math.round((present / total) * 100);

    const presentWidth = total === 0 ? '0%' : `${(present / total) * 100}%`;
    const absentWidth = total === 0 ? '0%' : `${(absent / total) * 100}%`;
    const leaveWidth = total === 0 ? '0%' : `${(leave / total) * 100}%`;

    return { total, present, absent, leave, percentage, presentWidth, absentWidth, leaveWidth };
  }, [students]);

  // ─── Filtered Students ────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.rollNo.includes(q)
    );
  }, [students, searchQuery]);

  // ─── Action Handlers ──────────────────────────────────────────────────────
  const handleSetStatus = (id: string, status: AttendanceStatus) => {
    if (!isEditingMode) {
      setShowWarningModal(true);
      return;
    }
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const handleMarkAllPresent = () => {
    if (!isEditingMode) {
      setShowWarningModal(true);
      return;
    }
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: 'present' as const }))
    );
  };

  const handleResetToUnmarked = () => {
    if (!isEditingMode) {
      setShowWarningModal(true);
      return;
    }
    setStudents((prev) =>
      prev.map((s) => ({ ...s, status: 'present' as const }))
    );
  };

  const handleProceedToEdit = () => {
    setInitialSnapshot(JSON.parse(JSON.stringify(students)));
    setIsEditingMode(true);
    setShowWarningModal(false);
  };

  const handleSaveAttendance = () => {
    if (!hasChanges) return;
    setIsSuccessModalVisible(true);
    setTimeout(() => {
      setIsSuccessModalVisible(false);
      router.back();
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ─── Screen Header ────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {isEditingMode ? (isInitiallyMarked ? 'Edit Attendance' : 'Mark Attendance') : 'View Attendance'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {className} - {section} • {formatDate(dateKey)}
          </Text>
        </View>

        {!isEditingMode ? (
          <TouchableOpacity
            style={styles.headerEditBtn}
            onPress={() => setShowWarningModal(true)}
          >
            <Edit3 size={14} color="#000000" />
            <Text style={styles.headerEditBtnText}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.saveHeaderBtn,
              !hasChanges && styles.saveHeaderBtnDisabled,
            ]}
            disabled={!hasChanges}
            onPress={handleSaveAttendance}
          >
            <Text style={[styles.saveHeaderBtnText, !hasChanges && styles.saveHeaderBtnTextDisabled]}>
              Submit
            </Text>
          </TouchableOpacity>
        )}
      </View>



      {/* ─── Live Summary Strip ────────────────────────────────────────── */}
      <View style={styles.summaryStrip}>
        <View style={styles.summaryStatsRow}>
          <View style={styles.summaryCountItem}>
            <Text style={styles.summaryCountLabel}>Total</Text>
            <Text style={styles.summaryCountVal}>{metrics.total}</Text>
          </View>
          <View style={styles.summaryCountDivider} />
          <View style={styles.summaryCountItem}>
            <View style={styles.dotLabelRow}>
              <View style={[styles.microDot, { backgroundColor: COLORS.present }]} />
              <Text style={styles.summaryCountLabel}>Present</Text>
            </View>
            <Text style={[styles.summaryCountVal, { color: COLORS.presentText }]}>
              {String(metrics.present).padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.summaryCountDivider} />
          <View style={styles.summaryCountItem}>
            <View style={styles.dotLabelRow}>
              <View style={[styles.microDot, { backgroundColor: COLORS.absent }]} />
              <Text style={styles.summaryCountLabel}>Absent</Text>
            </View>
            <Text style={[styles.summaryCountVal, { color: COLORS.absentText }]}>
              {String(metrics.absent).padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.summaryCountDivider} />
          <View style={styles.summaryCountItem}>
            <View style={styles.dotLabelRow}>
              <View style={[styles.microDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.summaryCountLabel}>Leave</Text>
            </View>
            <Text style={[styles.summaryCountVal, { color: '#b45309' }]}>
              {String(metrics.leave).padStart(2, '0')}
            </Text>
          </View>
          <View style={styles.summaryCountDivider} />
          <View style={styles.summaryRateBadge}>
            <Text style={styles.summaryRateText}>{metrics.percentage}%</Text>
          </View>
        </View>

        {/* Multi-segment Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressSeg, { width: metrics.presentWidth as any, backgroundColor: COLORS.present }]} />
          <View style={[styles.progressSeg, { width: metrics.absentWidth as any, backgroundColor: COLORS.absent }]} />
          <View style={[styles.progressSeg, { width: metrics.leaveWidth as any, backgroundColor: COLORS.leave }]} />
        </View>
      </View>

      {/* ─── Bulk Action Buttons at Top (Only Enabled in Edit Mode) ────── */}
      {isEditingMode && (
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={styles.markAllPresentBtn}
            onPress={handleMarkAllPresent}
            activeOpacity={0.8}
          >
            <CheckCheck size={17} color="#ffffff" />
            <Text style={styles.markAllPresentText}>Mark All Present</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleResetToUnmarked}
            activeOpacity={0.8}
          >
            <RotateCcw size={15} color={COLORS.textMuted} />
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Search Box Filter ────────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={16} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${students.length} students by name or roll...`}
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Student Roster List ──────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollList}
        contentContainerStyle={styles.scrollListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>
            Student Roster ({filteredStudents.length})
          </Text>
          <Text style={styles.rosterTip}>
            {isEditingMode ? 'Tap P, A, or L to modify status' : 'Tap Edit to change records'}
          </Text>
        </View>

        {filteredStudents.map((student) => (
          <View key={student.id} style={styles.studentCard}>
            {/* Left: Avatar & Info */}
            <View style={styles.studentLeft}>
              <View style={[styles.avatar, { backgroundColor: student.avatarBg }]}>
                <Text style={styles.avatarText}>{student.initials}</Text>
              </View>
              <View style={styles.studentDetails}>
                <Text style={styles.studentName} numberOfLines={1}>
                  {student.name}
                </Text>
                <Text style={styles.studentRoll}>Roll #{student.rollNo}</Text>
                {student.note ? (
                  <View style={styles.notePill}>
                    <Text style={styles.noteText}>"{student.note}"</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Right: 3-Segment Control (P | A | L) */}
            <View style={styles.segmentContainer}>
              {/* Present Button */}
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  student.status === 'present' && styles.statusBtnPresentActive,
                ]}
                onPress={() => handleSetStatus(student.id, 'present')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    student.status === 'present' && styles.statusBtnTextActive,
                  ]}
                >
                  P
                </Text>
              </TouchableOpacity>

              {/* Absent Button */}
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  student.status === 'absent' && styles.statusBtnAbsentActive,
                ]}
                onPress={() => handleSetStatus(student.id, 'absent')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    student.status === 'absent' && styles.statusBtnTextActive,
                  ]}
                >
                  A
                </Text>
              </TouchableOpacity>

              {/* Leave Button */}
              <TouchableOpacity
                style={[
                  styles.statusBtn,
                  student.status === 'leave' && styles.statusBtnLeaveActive,
                ]}
                onPress={() => handleSetStatus(student.id, 'leave')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.statusBtnText,
                    student.status === 'leave' && styles.statusBtnTextLeaveActive,
                  ]}
                >
                  L
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ─── Bottom Sticky Action Bar (Req 4: Edit in View Mode, Submit in Edit Mode) ─── */}
      <View style={styles.bottomBar}>
        {!isEditingMode ? (
          /* View Mode: "Edit Attendance" button */
          <TouchableOpacity
            style={styles.editModeBtn}
            onPress={() => setShowWarningModal(true)}
            activeOpacity={0.85}
          >
            <Edit3 size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.submitBtnText}>Edit Attendance</Text>
          </TouchableOpacity>
        ) : (
          /* Edit Mode: "Submit" button (Grey when no changes, Vibrant Green when changes made!) */
          <TouchableOpacity
            style={[
              styles.submitBtn,
              hasChanges ? styles.submitBtnActive : styles.submitBtnDisabled,
            ]}
            disabled={!hasChanges}
            onPress={handleSaveAttendance}
            activeOpacity={hasChanges ? 0.85 : 1}
          >
            <Check size={18} color={hasChanges ? '#ffffff' : '#94a3b8'} style={{ marginRight: 6 }} />
            <Text style={[styles.submitBtnText, !hasChanges && styles.submitBtnTextDisabled]}>
              {hasChanges
                ? `Submit Attendance (${changedCount} ${changedCount === 1 ? 'Change' : 'Changes'})`
                : 'Submit Attendance (No Changes)'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── Confirmation Warning Modal (Req 3: Triggered when clicking Edit) ─── */}
      <Modal visible={showWarningModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowWarningModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.warningCard}>
                <View style={styles.warningIconWrapper}>
                  <AlertTriangle size={32} color="#b45309" />
                </View>

                <Text style={styles.warningTitle}>Modify Attendance Records?</Text>

                <Text style={styles.warningBody}>
                  Attendance for <Text style={{ fontWeight: '800' }}>{className} - {section}</Text> on{' '}
                  <Text style={{ fontWeight: '800' }}>{formatDate(dateKey)}</Text> was already recorded with{' '}
                  <Text style={{ color: COLORS.presentText, fontWeight: '800' }}>{metrics.present} Present</Text>,{' '}
                  <Text style={{ color: COLORS.absentText, fontWeight: '800' }}>{metrics.absent} Absent</Text>, and{' '}
                  <Text style={{ color: '#b45309', fontWeight: '800' }}>{metrics.leave} Leave</Text>.
                </Text>

                <Text style={styles.warningPrompt}>
                  Are you sure you want to unlock editing for this attendance session?
                </Text>

                <View style={styles.warningActions}>
                  <TouchableOpacity
                    style={styles.warningCancelBtn}
                    onPress={() => setShowWarningModal(false)}
                  >
                    <Text style={styles.warningCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.warningProceedBtn}
                    onPress={handleProceedToEdit}
                  >
                    <Text style={styles.warningProceedText}>Proceed to Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ─── Success Confirmation Toast Modal ──────────────────────────── */}
      <Modal visible={isSuccessModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successToast}>
            <View style={styles.successIconCircle}>
              <Check size={28} color="#ffffff" />
            </View>
            <Text style={styles.successTitle}>Attendance Saved!</Text>
            <Text style={styles.successSub}>
              {metrics.present} Present • {metrics.absent} Absent • {metrics.leave} Leave
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  header: {
    minHeight: 60,
    backgroundColor: COLORS.surfaceLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.outline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  headerEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLow,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 4,
  },
  headerEditBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  saveHeaderBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  saveHeaderBtnDisabled: {
    backgroundColor: '#e2e8f0',
  },
  saveHeaderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  saveHeaderBtnTextDisabled: {
    color: '#94a3b8',
    fontWeight: '700',
  },

  // View Mode Banner
  viewingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#bae6fd',
  },
  viewingBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369a1',
    flex: 1,
    marginLeft: 6,
  },
  viewingEditPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewingEditPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },

  // Edit Mode Banner
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#fde68a',
  },
  editingBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.warning,
    flex: 1,
  },

  // Live Summary Strip
  summaryStrip: {
    backgroundColor: COLORS.surfaceLowest,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCountItem: {
    alignItems: 'center',
  },
  dotLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  microDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  summaryCountLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
  },
  summaryCountVal: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  summaryCountDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    backgroundColor: COLORS.surfaceContainer,
  },
  summaryRateBadge: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  summaryRateText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  progressTrack: {
    overflow: 'hidden',
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainer,
    flexDirection: 'row',
    marginTop: 12,
  },
  progressSeg: {
    height: '100%',
  },

  // Top Bulk Action Bar
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  markAllPresentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  markAllPresentText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  resetBtnText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },

  // Search Container
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },

  // Roster ScrollView
  scrollList: {
    flex: 1,
    marginTop: 8,
  },
  scrollListContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    gap: 8,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  rosterTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  rosterTip: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },

  // Student Card
  studentCard: {
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.outline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  studentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  studentRoll: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  notePill: {
    marginTop: 3,
    backgroundColor: COLORS.surfaceLow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  noteText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },

  // Segmented Status Control (P | A | L)
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 10,
    padding: 2,
    gap: 2,
  },
  statusBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnPresentActive: {
    backgroundColor: COLORS.present,
  },
  statusBtnAbsentActive: {
    backgroundColor: COLORS.absent,
  },
  statusBtnLeaveActive: {
    backgroundColor: COLORS.leave,
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  statusBtnTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  statusBtnTextLeaveActive: {
    color: COLORS.leaveText,
    fontWeight: '900',
  },

  // Bottom Sticky Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceLowest,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.outline,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 8,
  },
  editModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitBtnActive: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  submitBtnTextDisabled: {
    color: '#94a3b8',
    fontWeight: '700',
  },

  // Warning Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  warningCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surfaceLowest,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  warningIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginBottom: 8,
  },
  warningBody: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  warningPrompt: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  warningActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  warningCancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  warningProceedBtn: {
    flex: 1.2,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningProceedText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Success Toast
  successToast: {
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
  },
  successSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    marginTop: 4,
  },
});
