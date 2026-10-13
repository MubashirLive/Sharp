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
import {
  X,
  GraduationCap,
  Award,
  Building2,
  Mail,
  Phone,
  Calendar,
  LogOut,
  ShieldCheck,
  Briefcase,
  Layers,
} from 'lucide-react-native';

// ─── Types ───────────────────────────────────────────────────────────
export type PrincipalQualification = {
  degree: string;
  institution: string;
  year: string;
};

export type AdministrativePortfolio = {
  title: string;
  desc: string;
  iconName?: string;
};

export type PrincipalProfileData = {
  id: string;
  name: string;
  designation: string;
  role: string;
  department: string;
  school: string;
  affiliation: string;
  avatarBg: string;
  initials: string;
  gender: string;
  dob: string;
  age: number;
  bloodGroup: string;
  experience: string;
  joiningDate: string;
  employeeType: string;
  cabin: string;
  contact: string;
  emergencyContact: string;
  email: string;
  qualifications: PrincipalQualification[];
  portfolios: AdministrativePortfolio[];
};

export const DEFAULT_PRINCIPAL_PROFILE: PrincipalProfileData = {
  id: 'PRN-00001',
  name: 'Dr. Rajeshwar Sharma',
  designation: 'Principal & Executive Head',
  role: 'School Administrator',
  department: 'Executive Leadership & Administration',
  school: 'Ideal International School, Indore',
  affiliation: 'CBSE Affiliation #1030492 · K-12',
  avatarBg: '#000000',
  initials: 'RS',
  gender: 'Male',
  dob: '14 May 1976',
  age: 50,
  bloodGroup: 'O+',
  experience: '22+ Years in Academic Leadership',
  joiningDate: '15 June 2018',
  employeeType: 'Permanent / Head of Institution',
  cabin: 'Executive Admin Wing, Room 101',
  contact: '+91 98260 12345',
  emergencyContact: '+91 98260 99999',
  email: 'principal@idealschool.edu.in',
  qualifications: [
    { degree: 'Ph.D. in Educational Leadership', institution: 'Delhi University', year: '2008' },
    { degree: 'M.Sc. in Physics', institution: 'IIT Roorkee', year: '2000' },
    { degree: 'Bachelor of Education (B.Ed)', institution: 'NCERT Certified Institute', year: '2002' },
  ],
  portfolios: [
    {
      title: 'Academic Governance',
      desc: 'Oversees CBSE syllabus alignment, digital curriculum standardisation & faculty evaluations.',
    },
    {
      title: 'Institutional Strategy & Safety',
      desc: 'Directs institutional policy, infrastructure development, campus safety & budget allocation.',
    },
    {
      title: 'Community & Parent Relations',
      desc: 'Leads parent-teacher governance council, inter-school sports council & civic partnerships.',
    },
  ],
};

type Props = {
  visible: boolean;
  profile?: PrincipalProfileData;
  onClose: () => void;
  onLogout?: () => void;
};

export function PrincipalProfileModal({
  visible,
  profile = DEFAULT_PRINCIPAL_PROFILE,
  onClose,
  onLogout,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out from Principal account?',
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
            {/* Designation */}
            <Text style={styles.headerPost}>
              {profile.designation}
            </Text>
            {/* Role */}
            <Text style={styles.headerRole}>
              {profile.role}
            </Text>
            {/* App Id */}
            <View style={styles.idPill}>
              <Text style={styles.idPillText}>App Id: {profile.id}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            accessibilityLabel="Close"
          >
            <X size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* ── Body ─────────────────────────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Official Profile ─────────────────────────── */}
          <SectionLabel title="Official Administration Profile" />
          <View style={styles.gridCard}>
            <InfoCell label="Department" value={profile.department} />
            <GridDividerV />
            <InfoCell label="Employee Type" value={profile.employeeType} />
            <GridDividerH />
            <InfoCell label="Experience" value={profile.experience} />
            <GridDividerV />
            <InfoCell label="Joining Date" value={profile.joiningDate} />
            <GridDividerH />
            <InfoCell label="Executive Office" value={profile.cabin} />
            <GridDividerV />
            <InfoCell label="Blood Group" value={profile.bloodGroup} highlight="#EF4444" />
          </View>

          {/* ─── Institutional Overview ─────────────────────── */}
          <SectionLabel title="Institution & Affiliation" />
          <View style={styles.schoolCard}>
            <View style={styles.schoolIconBox}>
              <Building2 size={22} color="#000000" />
            </View>
            <View style={styles.schoolTextCol}>
              <Text style={styles.schoolName}>{profile.school}</Text>
              <Text style={styles.schoolAffil}>{profile.affiliation}</Text>
              <View style={styles.schoolStatusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Executive Campus Active · Session 2026-27</Text>
              </View>
            </View>
          </View>

          {/* ─── Administrative Portfolios ─────────────────── */}
          <SectionLabel title="Administrative Portfolios" />
          <View style={styles.portfolioCard}>
            {profile.portfolios.map((p, index) => (
              <View
                key={p.title}
                style={[
                  styles.portfolioRow,
                  index > 0 && styles.portfolioRowBorder,
                ]}
              >
                <View style={styles.portfolioIconBox}>
                  <Briefcase size={16} color="#000000" />
                </View>
                <View style={styles.portfolioTextCol}>
                  <Text style={styles.portfolioTitle}>{p.title}</Text>
                  <Text style={styles.portfolioDesc}>{p.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ─── Qualifications & Education ───────────────── */}
          <SectionLabel title="Qualifications & Leadership Credentials" />
          <View style={styles.qualCard}>
            {profile.qualifications.map((q, index) => (
              <View key={q.degree} style={[styles.qualRow, index > 0 && styles.qualRowBorder]}>
                <View style={styles.qualIconBox}>
                  <GraduationCap size={18} color="#000000" />
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
            <InfoCell label="Executive Mobile" value={profile.contact} />
            <GridDividerV />
            <InfoCell
              label="Emergency Line"
              value={profile.emergencyContact}
              highlight="#EF4444"
            />
            <GridDividerH />
            <InfoCell label="Official Email" value={profile.email} />
            <GridDividerV />
            <InfoCell label="School Campus" value={profile.school} />
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
  cell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
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
        marginHorizontal: 0,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerInitials: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerInfo: {
    flex: 1,
    gap: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  headerPost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  headerRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  idPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 2,
  },
  idPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },

  // Grid Card
  gridCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },

  // School Overview Card
  schoolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  schoolIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolTextCol: {
    flex: 1,
    gap: 2,
  },
  schoolName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  schoolAffil: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  schoolStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },

  // Administrative Portfolios Card
  portfolioCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  portfolioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
  },
  portfolioRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  portfolioIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  portfolioTextCol: {
    flex: 1,
    gap: 2,
  },
  portfolioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  portfolioDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Qualifications Card
  qualCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  qualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  qualRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  qualIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
    color: '#000000',
  },

  // Log Out Button
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
