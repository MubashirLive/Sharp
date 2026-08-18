/**
 * BroadcastChannelScreen — one-way announcements channel.
 *
 * Key differences from DM/Group:
 *  - ComposerBar is in readOnly mode (cannot send)
 *  - All messages show a 📢 Broadcast badge
 *  - ChatHeader shows 'broadcast' variant with the megaphone pill
 *  - Messages are always shown as "received" (from the channel admin)
 */

import { useRef } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChatHeader, ComposerBar, MessageBubble } from '@/components/chat';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

// ── Types ──────────────────────────────────────────────────────────────────

type BroadcastMessage =
  | { type: 'system'; id: string; text: string }
  | { type: 'message'; id: string; text: string; time: string };

// ── Mock broadcast channels ────────────────────────────────────────────────

const CHANNELS: Record<string, { name: string; subtitle: string }> = {
  'broadcast-holidays': {
    name: 'School Announcements',
    subtitle: 'Admin · Read-only channel',
  },
};

const FALLBACK_CHANNEL = {
  name: 'Broadcast Channel',
  subtitle: 'Read-only channel',
};

const SEED_MESSAGES: BroadcastMessage[] = [
  { type: 'system', id: 'sys-1', text: 'This week' },
  {
    type: 'message', id: '1',
    text: '📅 Term 2 examinations begin on August 5th. Please ensure all students have their admit cards.',
    time: 'Mon · 10:00 AM',
  },
  {
    type: 'message', id: '2',
    text: '🎉 Congratulations to Class 10-A for winning the Inter-House Science Quiz!',
    time: 'Tue · 2:30 PM',
  },
  {
    type: 'message', id: '3',
    text: '🏖️ Summer break starts July 15th and ends July 31st. Classes resume on August 1st.',
    time: 'Wed · 9:00 AM',
  },
  {
    type: 'message', id: '4',
    text: '📋 Parents are requested to collect the progress reports from the school office between 9AM–1PM on Saturday.',
    time: 'Today · 11:00 AM',
  },
];

// ── Screen ─────────────────────────────────────────────────────────────────

export default function BroadcastChannelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const channel = CHANNELS[id ?? ''] ?? FALLBACK_CHANNEL;

  const listRef = useRef<FlashList<BroadcastMessage>>(null);

  const renderItem = ({ item }: { item: BroadcastMessage }) => {
    if (item.type === 'system') {
      return <MessageBubble text={item.text} sender="me" time="" isSystem />;
    }
    return (
      <MessageBubble
        text={item.text}
        sender="other"
        time={item.time}
        isBroadcast
      />
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ChatHeader
        name={channel.name}
        subtitle={channel.subtitle}
        initials={channel.name.slice(0, 2).toUpperCase()}
        avatarId={id}
        variant="broadcast"
        onBack={() => router.back()}
      />

      <FlashList
        ref={listRef}
        data={SEED_MESSAGES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={72}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Read-only composer bar */}
      <ComposerBar
        value=""
        onChangeText={() => {}}
        onSend={() => {}}
        activePanel={null}
        onToggleEmoji={() => {}}
        onToggleAttachment={() => {}}
        readOnly
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ChatColors.bg },
  listContent: { paddingTop: 14, paddingBottom: 8 },
});
