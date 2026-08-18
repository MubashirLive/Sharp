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
  Megaphone,
  Users,
  User,
  Plus,
  CheckCheck,
} from 'lucide-react-native';

type ChatThread = {
  id: string;
  name: string;
  subtext: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
  avatarBg: string;
  initials: string;
  isGroup?: boolean;
};

const CHATS: ChatThread[] = [
  {
    id: 'c1',
    name: 'Grade 10-A Official Parent Group',
    subtext: '36 Members',
    lastMessage: 'Mrs. Sharma: Reminder for tomorrow science exhibition submission.',
    time: '10:42 AM',
    unreadCount: 4,
    avatarBg: '#000000',
    initials: '10A',
    isGroup: true,
  },
  {
    id: 'c2',
    name: 'Robert Johnson (Alex\'s Father)',
    subtext: 'Grade 10-A',
    lastMessage: 'Thank you maam, I will make sure Alex completes the assignment today.',
    time: 'Yesterday',
    unreadCount: 0,
    avatarBg: '#3B82F6',
    initials: 'RJ',
  },
  {
    id: 'c3',
    name: 'Vikram Patel (Aditi\'s Father)',
    subtext: 'Grade 10-A',
    lastMessage: 'Can we meet during the parent teacher meeting next Saturday?',
    time: 'Yesterday',
    unreadCount: 1,
    avatarBg: '#EC4899',
    initials: 'VP',
  },
  {
    id: 'c4',
    name: 'Mathematics Department Staff',
    subtext: '8 Teachers',
    lastMessage: 'Mr. Gupta: Mid-term exam question paper draft has been shared.',
    time: '10 Aug',
    unreadCount: 0,
    avatarBg: '#7C3AED',
    initials: 'MATH',
    isGroup: true,
  },
];

export default function TeacherChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'all' | 'parents' | 'groups'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = CHATS.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'parents') return matchesSearch && !c.isGroup;
    if (activeTab === 'groups') return matchesSearch && c.isGroup;
    return matchesSearch;
  });

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
        <RNText style={styles.headerTitle}>Teacher Messages</RNText>
        <TouchableOpacity style={styles.newChatBtn} activeOpacity={0.8}>
          <Plus size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ─── Search & Category Tabs ─────────────────────────────────── */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Search size={16} color="rgba(60,60,67,0.5)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages or parents..."
            placeholderTextColor="rgba(60,60,67,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.tabsRow}>
          {(['all', 'parents', 'groups'] as const).map((tab) => {
            const isSel = tab === activeTab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, isSel && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <RNText style={[styles.tabBtnText, isSel && styles.tabBtnTextActive]}>
                  {tab === 'all' ? 'All Chats' : tab === 'parents' ? 'Parents' : 'Class Groups'}
                </RNText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ─── Broadcast Banner ────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.broadcastBanner}
        activeOpacity={0.8}
        onPress={() => router.push('/(teacher)')}
      >
        <View style={styles.broadcastIconBox}>
          <Megaphone size={18} color="#ffffff" />
        </View>
        <View style={styles.broadcastTextCol}>
          <RNText style={styles.broadcastTitle}>Send Class Broadcast</RNText>
          <RNText style={styles.broadcastSub}>Message all 36 Grade 10-A parents at once</RNText>
        </View>
      </TouchableOpacity>

      {/* ─── Chat Threads List ───────────────────────────────────────── */}
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
    gap: 10,
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
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F4F4F6',
  },
  tabBtnActive: {
    backgroundColor: '#000000',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  tabBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  broadcastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#000000',
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
    borderRadius: 16,
  },
  broadcastIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastTextCol: {
    flex: 1,
    gap: 2,
  },
  broadcastTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  broadcastSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  chatsScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 8,
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
