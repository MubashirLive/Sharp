import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, GraduationCap, LogOut } from 'lucide-react-native';

// ─── Types ───────────────────────────────────────────────────────────
export type TeacherClassItem = {
  grade: string;
  section: string;
  subject: string;
  room: string;
  totalStudents: number;
  color: string;
};

export type TeacherQualification = {
  degree: string;
  institution: string;
  year: string;
};

export type TeacherProfileData = {
  id: string;
  name: string;
  designation: string; // PGT Commerce
  role: string; // Class Teacher
  department: string;
  school: string;
  avatarBg: string;
  initials: string;
  gender: string;
  dob: string;
  age: number;
  bloodGroup: string;
  experience: string;
  joiningDate: string;
  employeeType: string;
  address: string;
  contact: string;
  emergencyContact: string;
  email: string;
  cabin: string;
  primaryClass: string;
  classes: TeacherClassItem[];
  qualifications: TeacherQualification[];
};

type Props = {
  visible: boolean;
  profile: TeacherProfileData;
  onClose: () => void;
  onLogout?: () => void;
};

export function TeacherProfileModal({ visible, profile, onClose, onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out from Teacher account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onLogout) {
              onLogout();
            } else {
              router.replace('/(auth)/phone');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* ── Compact Header ──────────────────────────────────────── */}
        <View style={styles.headerBar}>
          <View style={[styles.headerAvatar, { backgroundColor: profile.avatarBg }]}>
            <Text style={styles.headerInitials}>{profile.initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            {/* Name */}
            <Text style={styles.headerName} numberOfLines={1}>
              {profile.name}
            </Text>
            {/* 1. PGT Commerce */}
            <Text style={styles.headerPost}>
              {profile.designation}
            </Text>
            {/* 2. Class Teacher */}
            <Text style={styles.headerRole}>
              {profile.role}
            </Text>
            {/* 3. App Id */}
            <View style={styles.idPill}>
              <Text style={styles.idPillText}>App Id: {profile.id}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Close"
          >
            <X size={20} color="#374151" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Scrollable Content ──────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Personal Details ─────────────────────────── */}
          <SectionLabel title="Personal Information" />
          <View style={styles.gridCard}>
            <InfoCell label="Gender" value={profile.gender} />
            <GridDividerV />
            <InfoCell label="Age" value={`${profile.age} yrs`} />
            <GridDividerH />
            <InfoCell label="Date of Birth" value={profile.dob} />
            <GridDividerV />
            <InfoCell label="Blood Group" value={profile.bloodGroup} highlight="#EF4444" />
            <GridDividerH />
            <InfoCell label="Experience" value={profile.experience} />
            <GridDividerV />
            <InfoCell label="Joining Date" value={profile.joiningDate} />
          </View>
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>📍 Residential Address</Text>
            <Text style={styles.addressValue}>{profile.address}</Text>
          </View>

          {/* ─── Academic & Role Details ──────────────────── */}
          <SectionLabel title="Academic & Role Assignment" />
          <View style={styles.gridCard}>
            <InfoCell label="Primary Class" value={profile.primaryClass} />
            <GridDividerV />
            <InfoCell label="Department" value={profile.department} />
            <GridDividerH />
            <InfoCell label="Employment" value={profile.employeeType} />
            <GridDividerV />
            <InfoCell label="Staff Cabin" value={profile.cabin} />
          </View>

          {/* ─── Assigned Classes & Subjects ──────────────── */}
          <SectionLabel title="Assigned Classes & Subjects" />
          <View style={styles.classesCard}>
            {profile.classes.map((item, index) => (
              <View
                key={`${item.grade}-${item.subject}`}
                style={[
                  styles.classRow,
                  index % 2 === 1 && styles.classRowAlt,
                ]}
              >
                <View style={[styles.classColorDot, { backgroundColor: item.color }]} />
                <View style={styles.classInfo}>
                  <Text style={styles.classSubject}>{item.subject}</Text>
                  <Text style={styles.classMeta}>
                    {item.grade} · Section {item.section} · {item.room}
                  </Text>
                </View>
                <View style={styles.studentBadge}>
                  <Text style={styles.studentBadgeText}>
                    {item.totalStudents} Students
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ─── Qualifications & Education ───────────────── */}
          <SectionLabel title="Qualifications & Education" />
          <View style={styles.qualCard}>
            {profile.qualifications.map((q, index) => (
              <View key={q.degree} style={[styles.qualRow, index > 0 && styles.qualRowBorder]}>
                <View style={styles.qualIconBox}>
                  <GraduationCap size={18} color="#4F46E5" />
                </View>
                <View style={styles.qualTextCol}>
                  <Text style={styles.qualDegree}>{q.degree}</Text>
                  <Text style={styles.qualInstitution}>{q.institution}</Text>
                </View>
                <Text style={styles.qualYear}>{q.year}</Text>
              </View>
            ))}
          </View>

          {/* ─── Contact Details ──────────────────────────── */}
          <SectionLabel title="Contact & Official Directory" />
          <View style={styles.gridCard}>
            <InfoCell label="Primary Mobile" value={profile.contact} />
            <GridDividerV />
            <InfoCell
              label="Emergency Contact"
              value={profile.emergencyContact}
              highlight="#EF4444"
            />
            <GridDividerH />
            <InfoCell label="Official Email" value={profile.email} />
            <GridDividerV />
            <InfoCell label="School" value={profile.school} />
          </View>

          {/* ─── Log Out Button ──────────────────────────── */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
            accessibilityLabel="Log Out"
          >
            <LogOut size={18} color="#DC2626" />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>

          <View style={{ height: Math.max(insets.bottom, 20) + 20 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────
function SectionLabel({ title }: { title: string }) {
  return (
    <View style={slStyles.wrap}>
      <View style={slStyles.line} />
      <Text style={slStyles.text}>{title}</Text>
      <View style={slStyles.line} />
    </View>
  );
}

const slStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 8,
  },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

function InfoCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <View style={cellStyles.cell}>
      {label ? <Text style={cellStyles.label}>{label}</Text> : null}
      <Text
        style={[cellStyles.value, highlight ? { color: highlight } : null]}
        numberOfLines={2}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  cell: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: { fontSize: 13, fontWeight: '700', color: '#111827' },
});

function GridDividerV() {
  return <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' }} />;
}

function GridDividerH() {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#E5E7EB',
        flexBasis: '100%',
      }}
    />
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },

  // Compact Header
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerInitials: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  headerPost: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B8CC4',
    marginTop: 1,
  },
  headerRole: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  idPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  idPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20 },

  // 2-Column Grid Card
  gridCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },

  // Address Card
  addressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  addressValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },

  // Classes list
  classesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  classRowAlt: {
    backgroundColor: '#FAFBFC',
  },
  classColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  classInfo: {
    flex: 1,
    gap: 1,
  },
  classSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  classMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  studentBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  studentBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },

  // Qualifications
  qualCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  qualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  qualRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  qualIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qualTextCol: {
    flex: 1,
    gap: 2,
  },
  qualDegree: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  qualInstitution: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  qualYear: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 8,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
    letterSpacing: 0.3,
  },
});
