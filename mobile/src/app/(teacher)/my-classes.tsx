import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text as RNText,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Search,
  Users,
  Phone,
  MessageCircle,
  Award,
  BookOpen,
  UserCheck,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';

type StudentClassItem = {
  id: string;
  rollNo: string;
  name: string;
  fatherName: string;
  parentContact: string;
  attendancePct: number;
  avatarBg: string;
  initials: string;
};

const CLASS_STUDENTS: StudentClassItem[] = [
  { id: '1', rollNo: '01', name: 'Aarav Sharma', fatherName: 'Rajesh Sharma', parentContact: '+91 98765 43210', attendancePct: 94, avatarBg: '#3B82F6', initials: 'AS' },
  { id: '2', rollNo: '02', name: 'Aditi Patel', fatherName: 'Vikram Patel', parentContact: '+91 98765 43211', attendancePct: 98, avatarBg: '#EC4899', initials: 'AP' },
  { id: '3', rollNo: '03', name: 'Alex Johnson', fatherName: 'Robert Johnson', parentContact: '+91 98765 43212', attendancePct: 88, avatarBg: '#000000', initials: 'AJ' },
  { id: '4', rollNo: '04', name: 'Ananya Verma', fatherName: 'Suresh Verma', parentContact: '+91 98765 43213', attendancePct: 91, avatarBg: '#10B981', initials: 'AV' },
  { id: '5', rollNo: '05', name: 'Devansh Gupta', fatherName: 'Anil Gupta', parentContact: '+91 98765 43214', attendancePct: 96, avatarBg: '#F59E0B', initials: 'DG' },
  { id: '6', rollNo: '06', name: 'Diya Kapoor', fatherName: 'Sameer Kapoor', parentContact: '+91 98765 43215', attendancePct: 84, avatarBg: '#8B5CF6', initials: 'DK' },
  { id: '7', rollNo: '07', name: 'Ishan Kumar', fatherName: 'Ravi Kumar', parentContact: '+91 98765 43216', attendancePct: 92, avatarBg: '#059669', initials: 'IK' },
];

export default function MyClassesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedClassTab, setSelectedClassTab] = useState('Grade 10-A');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStudents = CLASS_STUDENTS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNo.includes(searchQuery)
  );

  const handleCallParent = (phone: string, studentName: string) => {
    Alert.alert('Call Parent', `Initiating call to ${studentName}'s parent (${phone})`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', onPress: () => Linking.openURL(`tel:${phone}`) },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ─── Header Bar ────────────────────────────────────────────── */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="#000000" />
        </TouchableOpacity>
        <RNText style={styles.headerTitle}>My Classes & Roster</RNText>
        <View style={{ width: 40 }} />
      </View>

      {/* ─── Class Tabs ─────────────────────────────────────────────── */}
      <View style={styles.tabsRow}>
        {['Grade 10-A', 'Grade 12-B', 'Grade 9-C'].map((tab) => {
          const isSel = tab === selectedClassTab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isSel && styles.tabBtnActive]}
              onPress={() => setSelectedClassTab(tab)}
              activeOpacity={0.8}
            >
              <RNText style={[styles.tabBtnText, isSel && styles.tabBtnTextActive]}>
                {tab}
              </RNText>
              {tab === 'Grade 10-A' && (
                <View style={styles.ctBadge}>
                  <RNText style={styles.ctBadgeText}>CT</RNText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Class Summary Card ──────────────────────────────────────── */}
        <View style={styles.classCard}>
          <View style={styles.classHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.ctRow}>
                <Award size={14} color="#1B8CC4" />
                <RNText style={styles.ctLabel}>Class Teacher Assigned</RNText>
              </View>
              <RNText style={styles.classTitle}>{selectedClassTab}</RNText>
              <RNText style={styles.classSub}>Room 204 • Academic Session 2026-27</RNText>
            </View>

            <View style={styles.strengthBadge}>
              <RNText style={styles.strengthValue}>36</RNText>
              <RNText style={styles.strengthLabel}>Students</RNText>
            </View>
          </View>

          <View style={styles.classStatsDivider} />

          <View style={styles.classStatsRow}>
            <View style={styles.classStatCol}>
              <RNText style={styles.classStatVal}>93%</RNText>
              <RNText style={styles.classStatLbl}>Avg Attendance</RNText>
            </View>
            <View style={styles.classStatCol}>
              <RNText style={styles.classStatVal}>6 Subjects</RNText>
              <RNText style={styles.classStatLbl}>Curriculum</RNText>
            </View>
            <View style={styles.classStatCol}>
              <RNText style={styles.classStatVal}>20 Boys / 16 Girls</RNText>
              <RNText style={styles.classStatLbl}>Ratio</RNText>
            </View>
          </View>
        </View>

        {/* ─── Roster Header & Search ───────────────────────────────────── */}
        <View style={styles.rosterHeaderRow}>
          <RNText style={styles.rosterTitle}>Student Directory</RNText>
          <RNText style={styles.rosterCount}>{filteredStudents.length} Students</RNText>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color="rgba(60,60,67,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by student name or roll no..."
            placeholderTextColor="rgba(60,60,67,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* ─── Student Directory Cards List ─────────────────────────────── */}
        <View style={styles.studentsList}>
          {filteredStudents.map((s) => {
            return (
              <View key={s.id} style={styles.studentCard}>
                <View style={styles.studentTopRow}>
                  <View style={styles.rollBox}>
                    <RNText style={styles.rollTxt}>{s.rollNo}</RNText>
                  </View>

                  <View style={[styles.avatarBox, { backgroundColor: s.avatarBg }]}>
                    <RNText style={styles.avatarTxt}>{s.initials}</RNText>
                  </View>

                  <View style={styles.studentMetaCol}>
                    <RNText style={styles.studentNameTxt}>{s.name}</RNText>
                    <RNText style={styles.parentNameTxt}>Father: {s.fatherName}</RNText>
                  </View>

                  <View
                    style={[
                      styles.attBadge,
                      s.attendancePct >= 90
                        ? { backgroundColor: '#E8F9ED' }
                        : { backgroundColor: '#FFF4E5' },
                    ]}
                  >
                    <RNText
                      style={[
                        styles.attBadgeText,
                        s.attendancePct >= 90
                          ? { color: '#34C759' }
                          : { color: '#FF9500' },
                      ]}
                    >
                      {s.attendancePct}% Att.
                    </RNText>
                  </View>
                </View>

                {/* Quick actions for parent contact */}
                <View style={styles.actionsBarRow}>
                  <TouchableOpacity
                    style={styles.contactActionBtn}
                    onPress={() => handleCallParent(s.parentContact, s.name)}
                    activeOpacity={0.8}
                  >
                    <Phone size={14} color="#000000" />
                    <RNText style={styles.contactActionText}>Call Parent</RNText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactActionBtn}
                    onPress={() => router.push('/(teacher)/chat')}
                    activeOpacity={0.8}
                  >
                    <MessageCircle size={14} color="#000000" />
                    <RNText style={styles.contactActionText}>Message</RNText>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F4F4F6',
  },
  tabBtnActive: {
    backgroundColor: '#000000',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  ctBadge: {
    backgroundColor: '#1B8CC4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ctBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  classCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  classHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  ctRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  ctLabel: {
    color: '#34AADC',
    fontSize: 12,
    fontWeight: '700',
  },
  classTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  classSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  strengthBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  strengthValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  strengthLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
  },
  classStatsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14,
  },
  classStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classStatCol: {
    gap: 2,
  },
  classStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  classStatLbl: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  rosterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rosterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  rosterCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1B8CC4',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#000000',
  },
  studentsList: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    gap: 12,
  },
  studentTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rollBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F4F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rollTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444444',
  },
  avatarBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  studentMetaCol: {
    flex: 1,
    gap: 2,
  },
  studentNameTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  parentNameTxt: {
    fontSize: 12,
    color: 'rgba(60,60,67,0.60)',
  },
  attBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  attBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsBarRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4F4F6',
    paddingVertical: 8,
    borderRadius: 10,
  },
  contactActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
});
