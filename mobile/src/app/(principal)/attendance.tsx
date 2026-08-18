import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text as RNText,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Send,
  Users,
  Clock,
} from 'lucide-react-native';

type ClassAttendanceReport = {
  id: string;
  className: string;
  classTeacher: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  status: 'submitted' | 'pending';
};

const MOCK_REPORTS: ClassAttendanceReport[] = [
  { id: '1', className: 'Grade 10 - Section A', classTeacher: 'Mrs. Priya Sharma', totalStudents: 36, presentCount: 33, absentCount: 3, status: 'submitted' },
  { id: '2', className: 'Grade 12 - Section B', classTeacher: 'Dr. Neha Verma', totalStudents: 28, presentCount: 28, absentCount: 0, status: 'submitted' },
  { id: '3', className: 'Grade 9 - Section C', classTeacher: 'Mr. Vikram Singh', totalStudents: 40, presentCount: 36, absentCount: 4, status: 'submitted' },
  { id: '4', className: 'Grade 10 - Section B', classTeacher: 'Mr. Rajesh Gupta', totalStudents: 34, presentCount: 0, absentCount: 0, status: 'pending' },
  { id: '5', className: 'Grade 8 - Section A', classTeacher: 'Ms. Anita Roy', totalStudents: 38, presentCount: 35, absentCount: 3, status: 'submitted' },
];

export default function PrincipalAttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reports, setReports] = useState<ClassAttendanceReport[]>(MOCK_REPORTS);

  const pendingClasses = reports.filter((r) => r.status === 'pending');

  const handleSendReminder = (className: string, teacherName: string) => {
    Alert.alert(
      'Send Attendance Reminder',
      `Send instant push notification to ${teacherName} to mark attendance for ${className}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reminder',
          onPress: () =>
            Alert.alert('Reminder Sent 📲', `Notification sent to ${teacherName}.`),
        },
      ]
    );
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
        <RNText style={styles.headerTitle}>School Attendance Reports</RNText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Summary Hero ────────────────────────────────────────────── */}
        <View style={styles.summaryHeroCard}>
          <View style={styles.summaryHeaderRow}>
            <BarChart3 size={20} color="#ffffff" />
            <RNText style={styles.summaryTitle}>Today's Overall Attendance</RNText>
          </View>

          <RNText style={styles.summaryPctText}>94.2%</RNText>
          <RNText style={styles.summarySub}>1,338 Present out of 1,420 Students</RNText>

          {pendingClasses.length > 0 && (
            <View style={styles.alertBox}>
              <AlertTriangle size={16} color="#EA580C" />
              <RNText style={styles.alertText}>
                {pendingClasses.length} Class Attendance Submissions Pending Today
              </RNText>
            </View>
          )}
        </View>

        <RNText style={styles.sectionTitle}>Class Compliance Breakdown</RNText>

        {/* ─── Class Attendance Table List ────────────────────────────── */}
        <View style={styles.reportsList}>
          {reports.map((item) => {
            const isDone = item.status === 'submitted';
            const pct = isDone ? Math.round((item.presentCount / item.totalStudents) * 100) : 0;

            return (
              <View key={item.id} style={styles.reportCard}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <RNText style={styles.classNameText}>{item.className}</RNText>
                    <RNText style={styles.teacherNameText}>CT: {item.classTeacher}</RNText>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isDone ? { backgroundColor: '#E8F9ED' } : { backgroundColor: '#FFF4E5' },
                    ]}
                  >
                    <RNText
                      style={[
                        styles.statusBadgeText,
                        isDone ? { color: '#34C759' } : { color: '#FF9500' },
                      ]}
                    >
                      {isDone ? 'Submitted ✅' : 'Pending ⏳'}
                    </RNText>
                  </View>
                </View>

                {isDone ? (
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <RNText style={styles.statVal}>{item.presentCount}</RNText>
                      <RNText style={styles.statLbl}>Present</RNText>
                    </View>
                    <View style={styles.statBox}>
                      <RNText style={[styles.statVal, { color: '#FF3B30' }]}>
                        {item.absentCount}
                      </RNText>
                      <RNText style={styles.statLbl}>Absent</RNText>
                    </View>
                    <View style={styles.statBox}>
                      <RNText style={[styles.statVal, { color: '#1B8CC4' }]}>{pct}%</RNText>
                      <RNText style={styles.statLbl}>Rate</RNText>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.reminderBtn}
                    onPress={() => handleSendReminder(item.className, item.classTeacher)}
                    activeOpacity={0.8}
                  >
                    <Send size={14} color="#000000" />
                    <RNText style={styles.reminderBtnText}>Send Reminder to {item.classTeacher}</RNText>
                  </TouchableOpacity>
                )}
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
  summaryHeroCard: {
    backgroundColor: '#000000',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 8,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryPctText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#ffffff',
  },
  summarySub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 6,
  },
  alertText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  classNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  teacherNameText: {
    fontSize: 12,
    color: 'rgba(60,60,67,0.60)',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F4F4F6',
    borderRadius: 12,
    paddingVertical: 10,
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  statLbl: {
    fontSize: 10,
    color: 'rgba(60,60,67,0.60)',
    marginTop: 2,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E3F5FD',
    paddingVertical: 10,
    borderRadius: 12,
  },
  reminderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },
});
