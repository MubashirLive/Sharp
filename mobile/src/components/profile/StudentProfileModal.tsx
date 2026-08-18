import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

// ─── Types ───────────────────────────────────────────────────────────
export type SubjectTeacher = {
  subject: string;
  teacher: string;
  color: string;
};

export type SiblingInfo = {
  name: string;
  grade: string;
  section: string;
  avatarBg: string;
  initials: string;
};

export type StudentProfileData = {
  id: string;
  name: string;
  grade: string;
  section: string;
  rollNo: string;
  school: string;
  avatarBg: string;
  initials: string;
  gender: string;
  dob: string;
  age: number;
  bloodGroup: string;
  transport: string;
  address: string;
  house: string;
  academicYear: string;
  classTeacher: string;
  admissionDate: string;
  subjects: SubjectTeacher[];
  fatherName: string;
  motherName: string;
  siblings: SiblingInfo[];
  contact: string;
  emergencyContact: string;
  email: string;
};

type Props = {
  visible: boolean;
  profile: StudentProfileData;
  onClose: () => void;
};

export function StudentProfileModal({ visible, profile, onClose }: Props) {
  const insets = useSafeAreaInsets();

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
          {/* Avatar + Core Identity */}
          <View style={[styles.headerAvatar, { backgroundColor: profile.avatarBg }]}>
            <Text style={styles.headerInitials}>{profile.initials}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{profile.name}</Text>
            <Text style={styles.headerMeta}>
              {profile.grade} · Sec {profile.section} · Roll #{profile.rollNo}
            </Text>
            <View style={styles.idPill}>
              <Text style={styles.idPillText}>{profile.id}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Close">
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
          <SectionLabel title="Personal" />
          <View style={styles.gridCard}>
            <InfoCell label="Gender" value={profile.gender} />
            <GridDividerV />
            <InfoCell label="Age" value={`${profile.age} yrs`} />
            <GridDividerH />
            <InfoCell label="Date of Birth" value={profile.dob} />
            <GridDividerV />
            <InfoCell label="Blood Group" value={profile.bloodGroup} highlight="#EF4444" />
            <GridDividerH />
            <InfoCell label="Transport" value={profile.transport} />
            <GridDividerV />
            <InfoCell label="Admission" value={profile.admissionDate} />
          </View>
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>📍 Address</Text>
            <Text style={styles.addressValue}>{profile.address}</Text>
          </View>

          {/* ─── Academic Details ─────────────────────────── */}
          <SectionLabel title="Academic" />
          <View style={styles.gridCard}>
            <InfoCell label="Class" value={`${profile.grade} — ${profile.section}`} />
            <GridDividerV />
            <InfoCell label="House" value={profile.house} />
            <GridDividerH />
            <InfoCell label="Class Teacher" value={profile.classTeacher} />
            <GridDividerV />
            <InfoCell label="Acad. Year" value={profile.academicYear} />
          </View>

          {/* ─── Subjects & Faculty ───────────────────────── */}
          <SectionLabel title="Subjects & Faculty" />
          <View style={styles.subjectsCard}>
            {profile.subjects.map((item, index) => (
              <View key={item.subject} style={[styles.subjectRow, index % 2 === 1 && styles.subjectRowAlt]}>
                <View style={[styles.subjectDot, { backgroundColor: item.color }]} />
                <Text style={styles.subjectName}>{item.subject}</Text>
                <Text style={styles.teacherName}>{item.teacher}</Text>
              </View>
            ))}
          </View>

          {/* ─── Family ───────────────────────────────────── */}
          <SectionLabel title="Family" />
          <View style={styles.gridCard}>
            <InfoCell label="Father" value={profile.fatherName} />
            <GridDividerV />
            <InfoCell label="Mother" value={profile.motherName} />
          </View>

          {/* Siblings */}
          {profile.siblings.length > 0 && (
            <>
              <Text style={styles.subLabel}>Siblings</Text>
              <View style={styles.siblingsRow}>
                {profile.siblings.map((sib) => (
                  <View key={sib.name} style={styles.sibCard}>
                    <View style={[styles.sibAvatar, { backgroundColor: sib.avatarBg }]}>
                      <Text style={styles.sibInitials}>{sib.initials}</Text>
                    </View>
                    <View style={styles.sibInfo}>
                      <Text style={styles.sibName} numberOfLines={1}>{sib.name}</Text>
                      <Text style={styles.sibMeta}>{sib.grade} · Sec {sib.section}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ─── Contact ──────────────────────────────────── */}
          <SectionLabel title="Contact" />
          <View style={styles.gridCard}>
            <InfoCell label="Primary" value={profile.contact} />
            <GridDividerV />
            <InfoCell label="Emergency" value={profile.emergencyContact} highlight="#EF4444" />
            <GridDividerH />
            <InfoCell label="Email" value={profile.email} />
            <GridDividerV />
            <InfoCell label="" value="" />
          </View>

          <View style={{ height: 20 }} />
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
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  text: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 },
});

function InfoCell({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <View style={cellStyles.cell}>
      {label ? <Text style={cellStyles.label}>{label}</Text> : null}
      <Text style={[cellStyles.value, highlight ? { color: highlight } : null]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  cell: { flex: 1, paddingVertical: 10, paddingHorizontal: 12 },
  label: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 13, fontWeight: '700', color: '#111827' },
});

function GridDividerV() {
  return <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB' }} />;
}

function GridDividerH() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginHorizontal: 0, flexBasis: '100%' }} />;
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
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
  headerMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  idPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  idPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
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
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },

  // Address full-width card
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

  // Subject list
  subjectsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    gap: 8,
  },
  subjectRowAlt: {
    backgroundColor: '#FAFBFC',
  },
  subjectDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  subjectName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  teacherName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    flexShrink: 1,
    textAlign: 'right',
  },

  // Sub label
  subLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 10,
    marginBottom: 6,
    marginLeft: 2,
  },

  // Siblings
  siblingsRow: {
    gap: 8,
  },
  sibCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  sibAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sibInitials: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sibInfo: {
    flex: 1,
  },
  sibName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  sibMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
});
