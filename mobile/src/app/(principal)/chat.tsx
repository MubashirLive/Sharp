import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Text as RNText,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Search,
  MessageCircle,
  Plus,
  ShieldCheck,
  Building2,
  Users,
} from 'lucide-react-native';

type PrincipalChatThread = {
  id: string;
  name: string;
  subtext: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatarBg: string;
  initials: string;
};

const CHATS: PrincipalChatThread[] = [
  {
    id: 'pc1',
    name: 'HOD & Department Incharges Council',
    subtext: '12 Department Heads',
    lastMessage: 'Mr. Gupta: Mid-Term Exam Question Bank ready for review.',
    time: '11:20 AM',
    unreadCount: 3,
    avatarBg: '#000000',
    initials: 'HOD',
  },
  {
    id: 'pc2',
    name: 'School Management Board',
    subtext: '6 Executive Directors',
    lastMessage: 'Board Chair: Annual budget allocation approved for new Science Lab equipment.',
    time: 'Yesterday',
    unreadCount: 0,
    avatarBg: '#1B8CC4',
    initials: 'SMB',
  },
  {
    id: 'pc3',
    name: 'Mrs. Priya Sharma (Class Teacher 10-A)',
    subtext: 'Senior Math Faculty',
    lastMessage: 'Sir, leave request for 13th & 14th August submitted for your approval.',
    time: 'Yesterday',
    unreadCount: 1,
    avatarBg: '#7C3AED',
    initials: 'PS',
  },
  {
    id: 'pc4',
    name: 'Parent-Teacher Association Executive',
    subtext: 'PTA Representatives',
    lastMessage: 'PTA President: Proposal for career counselling workshop for Grade 12.',
    time: '10 Aug',
    unreadCount: 0,
    avatarBg: '#059669',
    initials: 'PTA',
  },
];

export default function PrincipalChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = CHATS.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <RNText style={styles.headerTitle}>Principal Communications</RNText>
        <TouchableOpacity style={styles.newChatBtn} activeOpacity={0.8}>
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ─── Search Bar ────────────────────────────────────────────── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={16} color="rgba(60,60,67,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search channels, HODs, or staff..."
            placeholderTextColor="rgba(60,60,67,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* ─── Chat List ─────────────────────────────────────────────── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatsScrollContent}
      >
        {filteredChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatCard}
            activeOpacity={0.7}
            onPress={() => router.push('/chat-detail')}
          >
            <View style={[styles.avatarBox, { backgroundColor: chat.avatarBg }]}>
              <RNText style={styles.avatarTxt}>{chat.initials}</RNText>
            </View>

            <View style={styles.chatMetaCol}>
              <View style={styles.chatHeaderRow}>
                <RNText style={styles.chatName} numberOfLines={1}>
                  {chat.name}
                </RNText>
                <RNText style={styles.chatTime}>{chat.time}</RNText>
              </View>

              <RNText style={styles.chatSubtext}>{chat.subtext}</RNText>
              <RNText style={styles.lastMessage} numberOfLines={1}>
                {chat.lastMessage}
              </RNText>
            </View>

            {chat.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <RNText style={styles.unreadText}>{chat.unreadCount}</RNText>
              </View>
            )}
          </TouchableOpacity>
        ))}

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
  newChatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F3',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F4F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#000000',
  },
  chatsScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F3',
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
  chatMetaCol: {
    flex: 1,
    gap: 2,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chatName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  chatTime: {
    fontSize: 11,
    color: 'rgba(60,60,67,0.5)',
  },
  chatSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1B8CC4',
  },
  lastMessage: {
    fontSize: 13,
    color: 'rgba(60,60,67,0.65)',
  },
  unreadBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
