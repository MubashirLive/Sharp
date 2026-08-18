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
  ChevronLeft,
  Megaphone,
  Plus,
  Users,
  Calendar,
  Clock,
  Eye,
  BellRing,
  Sparkles,
} from 'lucide-react-native';

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  targetAudience: string;
  date: string;
  views: number;
  urgent?: boolean;
};

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'an1',
    title: 'Mid-Term Examination Schedule & Syllabus Release',
    body: 'The comprehensive date sheet for Mid-Term Examinations (Session 2026-27) for Grades 6 through 12 has been published.',
    targetAudience: 'All Parents & Students',
    date: '11 Aug 2026',
    views: 1240,
    urgent: true,
  },
  {
    id: 'an2',
    title: 'Staff Meeting on Academic Progress Review',
    body: 'All department heads and senior teachers are requested to attend the monthly review meeting in the Conference Hall at 3:30 PM.',
    targetAudience: 'Teaching Staff Only',
    date: '09 Aug 2026',
    views: 64,
  },
  {
    id: 'an3',
    title: 'Annual Sports Day Selection Trials',
    body: 'House sports captains to submit team lists for athletics and swimming trials by Friday.',
    targetAudience: 'Senior Secondary Students',
    date: '05 Aug 2026',
    views: 890,
  },
];

export default function PrincipalAnnouncementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState('All School');
  const [body, setBody] = useState('');

  const handlePublishNotice = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Missing Fields', 'Please fill in both title and announcement body.');
      return;
    }

    const newNotice: AnnouncementItem = {
      id: `an-${Date.now()}`,
      title,
      body,
      targetAudience,
      date: 'Today',
      views: 0,
      urgent: true,
    };

    setAnnouncements([newNotice, ...announcements]);
    setShowModal(false);
    setTitle('');
    setBody('');
    Alert.alert('Notice Published! 📢', `Announcement broadcasted to ${targetAudience}.`);
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
        <RNText style={styles.headerTitle}>School Announcements</RNText>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ─── Create Broadcast Action ─────────────────────────────────── */}
        <TouchableOpacity
          style={styles.broadcastBanner}
          activeOpacity={0.85}
          onPress={() => setShowModal(true)}
        >
          <View style={styles.broadcastIconBox}>
            <BellRing size={20} color="#ffffff" />
          </View>
          <View style={styles.broadcastTextCol}>
            <RNText style={styles.broadcastTitle}>Publish Instant Announcement</RNText>
            <RNText style={styles.broadcastSub}>Broadcast alert to parents, students, or staff</RNText>
          </View>
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>

        <RNText style={styles.sectionTitle}>Notice History</RNText>

        {/* ─── Announcements List ──────────────────────────────────────── */}
        <View style={styles.announcementsList}>
          {announcements.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.audienceTag}>
                  <Users size={12} color="#1B8CC4" />
                  <RNText style={styles.audienceTagText}>{item.targetAudience}</RNText>
                </View>

                {item.urgent && (
                  <View style={styles.urgentBadge}>
                    <Sparkles size={10} color="#ffffff" />
                    <RNText style={styles.urgentBadgeText}>URGENT</RNText>
                  </View>
                )}
              </View>

              <RNText style={styles.cardTitle}>{item.title}</RNText>
              <RNText style={styles.cardBody}>{item.body}</RNText>

              <View style={styles.cardFooterRow}>
                <View style={styles.footerItem}>
                  <Clock size={12} color="rgba(60,60,67,0.5)" />
                  <RNText style={styles.footerText}>{item.date}</RNText>
                </View>

                <View style={styles.footerItem}>
                  <Eye size={12} color="rgba(60,60,67,0.5)" />
                  <RNText style={styles.footerText}>{item.views} Views</RNText>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── Create Announcement Modal ─────────────────────────────────── */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RNText style={styles.modalTitle}>New Official Announcement</RNText>
            <RNText style={styles.modalSub}>Select target audience & post notice</RNText>

            <TextInput
              style={styles.inputTitle}
              placeholder="Announcement Title"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.inputTitle}
              placeholder="Target Audience (e.g. All Parents & Staff)"
              value={targetAudience}
              onChangeText={setTargetAudience}
            />

            <TextInput
              style={[styles.inputTitle, { height: 110, textAlignVertical: 'top' }]}
              placeholder="Write official notice text..."
              multiline
              value={body}
              onChangeText={setBody}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowModal(false)}
              >
                <RNText style={styles.modalCancelText}>Cancel</RNText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handlePublishNotice}
              >
                <RNText style={styles.modalSubmitText}>Broadcast Notice</RNText>
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
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#000000',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  broadcastIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastTextCol: {
    flex: 1,
    gap: 2,
  },
  broadcastTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  broadcastSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  announcementsList: {
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audienceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E3F5FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  audienceTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1B8CC4',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  cardBody: {
    fontSize: 13,
    color: 'rgba(60,60,67,0.75)',
    lineHeight: 18,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(60,60,67,0.60)',
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
