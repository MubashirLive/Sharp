/**
 * ChatListScreen — the main chat inbox tab.
 *
 * Features:
 *  - Search bar
 *  - Filter chips (All / Unread / Groups / Teachers / Admin / Broadcast)
 *  - FlashList of ChatListItem rows (DM, group, broadcast variants)
 *  - FAB to start a new chat
 */

import { useCallback, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Pencil, Search } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ChatListItem } from '@/components/chat';
import type { ChatItemData } from '@/components/chat';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

// ── Filter chips ──────────────────────────────────────────────────────────

const FILTERS = ['All', 'Unread', 'Groups', 'Broadcast', 'Teachers', 'Admin'] as const;
type Filter = (typeof FILTERS)[number];

// ── Mock conversations ────────────────────────────────────────────────────

const ALL_CHATS: ChatItemData[] = [
  {
    id: 'kapoor',
    name: 'Mr. Kapoor',
    subtitle: 'Mathematics Teacher',
    preview: 'We will go over the sine formulas again tomorrow.',
    time: '09:41 AM',
    unread: 2,
    initials: 'MK',
    avatarColor: '#214d7a',
    variant: 'dm',
  },
  {
    id: 'roberts',
    name: 'Mrs. Roberts',
    subtitle: 'TGT English',
    preview: 'The essays have been graded. Please check remarks.',
    time: 'Yesterday',
    initials: 'MR',
    avatarColor: '#7a4a2d',
    variant: 'dm',
  },
  {
    id: 'class-10a',
    name: 'Class 10-A — General',
    subtitle: '34 members',
    preview: 'Mr. Kapoor: Holiday homework uploaded.',
    time: 'Mon',
    unread: 5,
    initials: '10A',
    avatarColor: '#176b4d',
    variant: 'group',
  },
  {
    id: 'broadcast-holidays',
    name: 'School Announcements',
    subtitle: 'Admin · Broadcast',
    preview: '📢 Summer break starts July 15th.',
    time: 'Tue',
    unread: 1,
    initials: 'SA',
    avatarColor: '#39434d',
    variant: 'broadcast',
  },
  {
    id: 'kumar',
    name: 'Dr. Kumar',
    subtitle: 'PGT Commerce',
    preview: 'Are we still meeting for assessment planning?',
    time: 'Tue',
    unread: 1,
    initials: 'DK',
    avatarColor: '#7b5b1e',
    variant: 'dm',
  },
  {
    id: 'davis',
    name: 'Coach Davis',
    subtitle: 'P.E. Dept',
    preview: 'Sports day schedule is finalized.',
    time: 'Mon',
    initials: 'CD',
    avatarColor: '#176b4d',
    variant: 'dm',
  },
  {
    id: 'maths-group',
    name: 'Maths Study Group',
    subtitle: '12 members',
    preview: 'Riya: Can someone share chapter 5 notes?',
    time: '11/04',
    initials: 'MG',
    avatarColor: '#214d7a',
    variant: 'group',
  },
  {
    id: 'higgins',
    name: 'Ms. Higgins',
    subtitle: 'Librarian',
    preview: 'The new shipment of textbooks arrived.',
    time: '11/04',
    initials: 'MH',
    avatarColor: '#5f4b8b',
    variant: 'dm',
  },
  {
    id: 'principal',
    name: 'Principal Office',
    subtitle: 'Admin',
    preview: 'Staff meeting minutes attached.',
    time: '10/25',
    initials: 'PO',
    avatarColor: '#39434d',
    variant: 'dm',
  },
];

// ── Filter logic ──────────────────────────────────────────────────────────

function applyFilter(chats: ChatItemData[], filter: Filter, query: string): ChatItemData[] {
  let result = chats;

  if (filter === 'Unread') result = result.filter((c) => (c.unread ?? 0) > 0);
  else if (filter === 'Groups') result = result.filter((c) => c.variant === 'group');
  else if (filter === 'Broadcast') result = result.filter((c) => c.variant === 'broadcast');
  else if (filter === 'Teachers') result = result.filter((c) => c.variant === 'dm');
  else if (filter === 'Admin') result = result.filter((c) => c.subtitle?.toLowerCase().includes('admin'));

  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q)
    );
  }

  return result;
}

// ── Screen ────────────────────────────────────────────────────────────────

export default function ChatListScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<Filter>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = applyFilter(ALL_CHATS, activeFilter, searchQuery);

  const handleOpen = useCallback(
    (item: ChatItemData) => {
      if (item.variant === 'group') {
        router.push(`/group-chat?id=${item.id}`);
      } else if (item.variant === 'broadcast') {
        router.push(`/broadcast-channel?id=${item.id}`);
      } else {
        router.push(`/chat-detail?id=${item.id}`);
      }
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatItemData }) => (
      <ChatListItem {...item} onPress={() => handleOpen(item)} />
    ),
    [handleOpen]
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Chats</Text>
        <View style={styles.searchBox}>
          <Search size={18} color={ChatColors.iconMuted} strokeWidth={2.2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations"
            placeholderTextColor={ChatColors.iconMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((filter) => {
          const active = filter === activeFilter;
          return (
            <Pressable
              key={filter}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Conversation list ── */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No conversations found.</Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={82}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* ── New chat FAB ── */}
      <Pressable style={styles.fab}>
        <Pencil size={22} color={ChatColors.bg} strokeWidth={2.4} />
      </Pressable>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ChatColors.bg,
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    color: ChatColors.textSecondary,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  searchBox: {
    height: 46,
    borderRadius: 23,
    backgroundColor: ChatColors.bgElevated,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: ChatColors.textPrimary,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  list: {
    flex: 1,
  },
  filterRow: {
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 4,
  },
  chip: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: ChatColors.inputBorder,
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  chipActive: {
    backgroundColor: '#1e3a34',
    borderColor: ChatColors.accent,
  },
  chipText: {
    color: ChatColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: ChatColors.accent,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 100,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: ChatColors.textMuted,
    fontSize: 15,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ChatColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});