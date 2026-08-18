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
  BadgeCheck,
  Phone,
  MessageCircle,
  Users,
  UserCheck,
  AlertCircle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';

type StaffItem = {
  id: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  status: 'present' | 'on_leave';
  avatarBg: string;
  initials: string;
  isClassTeacher?: boolean;
};

const MOCK_STAFF: StaffItem[] = [
  {
    id: 'st1',
    name: 'Mrs. Priya Sharma',
    designation: 'Senior Secondary Teacher',
    department: 'Mathematics & Physics',
    phone: '+91 98765 11111',
    status: 'present',
    avatarBg: '#000000',
    initials: 'PS',
    isClassTeacher: true,
  },
  {
    id: 'st2',
    name: 'Mr. Rajesh Gupta',
    designation: 'HOD Science Department',
    department: 'Mathematics',
    phone: '+91 98765 22222',
    status: 'present',
    avatarBg: '#3B82F6',
    initials: 'RG',
  },
  {
    id: 'st3',
    name: 'Dr. Neha Verma',
    designation: 'Senior Physics Faculty',
    department: 'Physics',
    phone: '+91 98765 33333',
    status: 'present',
    avatarBg: '#EC4899',
    initials: 'NV',
  },
  {
    id: 'st4',
    name: 'Mr. Vikram Singh',
    designation: 'Department Incharge',
    department: 'Hindi & Sanskrit',
    phone: '+91 98765 44444',
    status: 'on_leave',
    avatarBg: '#EF4444',
    initials: 'VS',
  },
  {
    id: 'st5',
    name: 'Ms. Anita Roy',
    designation: 'Computer Science Lead',
    department: 'Information Tech',
    phone: '+91 98765 55555',
    status: 'present',
    avatarBg: '#7C3AED',
    initials: 'AR',
  },
];

export default function PrincipalStaffScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'teachers' | 'support'>('all');

  const filteredStaff = MOCK_STAFF.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleCallStaff = (phone: string, name: string) => {
    Alert.alert('Call Staff Member', `Dialing ${name} (${phone})`, [
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
        <RNText style={styles.headerTitle}>Staff Management</RNText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Overview Counter Card ────────────────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCol}>
            <RNText style={styles.summaryValue}>64</RNText>
            <RNText style={styles.summaryLabel}>Total Staff</RNText>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.summaryCol}>
            <RNText style={[styles.summaryValue, { color: '#34C759' }]}>62</RNText>
            <RNText style={styles.summaryLabel}>Present Today</RNText>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.summaryCol}>
            <RNText style={[styles.summaryValue, { color: '#FF9500' }]}>2</RNText>
            <RNText style={styles.summaryLabel}>On Leave</RNText>
          </View>
        </View>

        {/* ─── Search & Filter Bar ─────────────────────────────────────── */}
        <View style={styles.searchBox}>
          <Search size={16} color="rgba(60,60,67,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by name or subject..."
            placeholderTextColor="rgba(60,60,67,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <RNText style={styles.sectionTitle}>Staff Directory</RNText>

        {/* ─── Staff Cards List ────────────────────────────────────────── */}
        <View style={styles.staffList}>
          {filteredStaff.map((staff) => {
            const isPresent = staff.status === 'present';

            return (
              <View key={staff.id} style={styles.staffCard}>
                <View style={styles.staffTopRow}>
                  <View style={[styles.avatarBox, { backgroundColor: staff.avatarBg }]}>
                    <RNText style={styles.avatarTxt}>{staff.initials}</RNText>
                  </View>

                  <View style={styles.staffMetaCol}>
                    <View style={styles.nameRow}>
                      <RNText style={styles.staffName}>{staff.name}</RNText>
                      {staff.isClassTeacher && (
                        <View style={styles.ctBadge}>
                          <RNText style={styles.ctBadgeText}>Class Teacher 10-A</RNText>
                        </View>
                      )}
                    </View>
                    <RNText style={styles.staffDesig}>{staff.designation}</RNText>
                    <RNText style={styles.staffDept}>{staff.department}</RNText>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isPresent ? { backgroundColor: '#E8F9ED' } : { backgroundColor: '#FFF4E5' },
                    ]}
                  >
                    <RNText
                      style={[
                        styles.statusPillText,
                        isPresent ? { color: '#34C759' } : { color: '#FF9500' },
                      ]}
                    >
                      {isPresent ? 'Present' : 'On Leave'}
                    </RNText>
                  </View>
                </View>

                {/* Quick actions for calling/messaging staff */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleCallStaff(staff.phone, staff.name)}
                    activeOpacity={0.8}
                  >
                    <Phone size={14} color="#000000" />
                    <RNText style={styles.actionBtnText}>Call Staff</RNText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push('/(principal)/chat')}
                    activeOpacity={0.8}
                  >
                    <MessageCircle size={14} color="#000000" />
                    <RNText style={styles.actionBtnText}>Chat</RNText>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    marginBottom: 16,
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000000',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'rgba(60,60,67,0.60)',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#F0F0F3',
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
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#000000',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  staffList: {
    gap: 10,
  },
  staffCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    gap: 12,
  },
  staffTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  staffMetaCol: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  staffName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  ctBadge: {
    backgroundColor: '#E3F5FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ctBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1B8CC4',
  },
  staffDesig: {
    fontSize: 12,
    color: 'rgba(60,60,67,0.70)',
    fontWeight: '500',
  },
  staffDept: {
    fontSize: 11,
    color: '#1B8CC4',
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4F4F6',
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
});
