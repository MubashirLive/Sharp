/**
 * GroupChatScreen — multi-member group conversation.
 *
 * Differences from DM:
 *  - MessageBubble shows sender name + unique member colour
 *  - ChatHeader shows "N members" subtitle + rounded-square avatar
 *  - Members list used for colour mapping
 */

import { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AttachmentPanel,
  ChatHeader,
  ComposerBar,
  EmojiPanel,
  MessageBubble,
} from '@/components/chat';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

// ── Types ──────────────────────────────────────────────────────────────────

type Member = { id: string; name: string; color: string };

type MessageItem =
  | { type: 'system'; id: string; text: string }
  | {
      type: 'message';
      id: string;
      text: string;
      sender: 'me' | 'other';
      senderId: string;
      time: string;
      readState?: 'sending' | 'sent' | 'delivered' | 'seen';
    };

type ActivePanel = 'emoji' | 'attachment' | null;

// ── Member colours — unique per member ────────────────────────────────────

const MEMBER_COLORS = [
  '#e9c46a', '#f4a261', '#e76f51', '#2a9d8f',
  '#57cc99', '#80b918', '#f72585', '#4361ee',
];

// ── Mock group data ────────────────────────────────────────────────────────

const GROUPS: Record<string, { name: string; members: Member[] }> = {
  'class-10a': {
    name: 'Class 10-A — General',
    members: [
      { id: 'kapoor', name: 'Mr. Kapoor', color: MEMBER_COLORS[0] },
      { id: 'riya', name: 'Riya', color: MEMBER_COLORS[1] },
      { id: 'arjun', name: 'Arjun', color: MEMBER_COLORS[2] },
    ],
  },
  'maths-group': {
    name: 'Maths Study Group',
    members: [
      { id: 'kapoor', name: 'Mr. Kapoor', color: MEMBER_COLORS[0] },
      { id: 'riya', name: 'Riya', color: MEMBER_COLORS[3] },
    ],
  },
};

const FALLBACK_GROUP = {
  name: 'Group Chat',
  members: [] as Member[],
};

const SEED_MESSAGES: MessageItem[] = [
  { type: 'system', id: 'sys-1', text: 'Today' },
  {
    type: 'message', id: '1',
    text: 'Good morning everyone! Holiday homework has been uploaded to the portal.',
    sender: 'other', senderId: 'kapoor', time: '08:15 AM',
  },
  {
    type: 'message', id: '2',
    text: 'Sir, can someone share chapter 5 notes?',
    sender: 'other', senderId: 'riya', time: '08:22 AM',
  },
  {
    type: 'message', id: '3',
    text: "I've shared them in Files.",
    sender: 'me', senderId: 'me', time: '08:30 AM', readState: 'seen',
  },
  {
    type: 'message', id: '4',
    text: 'Thank you! See everyone on Monday.',
    sender: 'other', senderId: 'kapoor', time: '08:35 AM',
  },
];

// ── Screen ─────────────────────────────────────────────────────────────────

export default function GroupChatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const group = GROUPS[id ?? ''] ?? FALLBACK_GROUP;

  const memberColorMap = Object.fromEntries(
    group.members.map((m) => [m.id, m.color])
  );
  const memberNameMap = Object.fromEntries(
    group.members.map((m) => [m.id, m.name])
  );

  const [messages, setMessages] = useState<MessageItem[]>(SEED_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const listRef = useRef<FlashList<MessageItem>>(null);

  const setPanel = useCallback((panel: ActivePanel) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActivePanel(panel);
  }, []);

  const toggleEmoji = useCallback(() => {
    Keyboard.dismiss();
    setPanel(activePanel === 'emoji' ? null : 'emoji');
  }, [activePanel, setPanel]);

  const toggleAttachment = useCallback(() => {
    Keyboard.dismiss();
    setPanel(activePanel === 'attachment' ? null : 'attachment');
  }, [activePanel, setPanel]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { type: 'message', id: `msg-${Date.now()}`, text, sender: 'me', senderId: 'me', time, readState: 'sending' },
    ]);
    setInputText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [inputText]);

  const addEmoji = useCallback((emoji: string) => {
    setInputText((t) => `${t}${emoji}`);
  }, []);

  const renderItem = useCallback(({ item }: { item: MessageItem }) => {
    if (item.type === 'system') {
      return <MessageBubble text={item.text} sender="me" time="" isSystem />;
    }
    const isMe = item.sender === 'me';
    return (
      <MessageBubble
        text={item.text}
        sender={item.sender}
        time={item.time}
        readState={item.readState}
        senderName={isMe ? undefined : memberNameMap[item.senderId]}
        senderColor={isMe ? undefined : memberColorMap[item.senderId]}
      />
    );
  }, [memberNameMap, memberColorMap]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ChatHeader
        name={group.name}
        subtitle={`${group.members.length} members`}
        initials={group.name.slice(0, 2).toUpperCase()}
        avatarId={id}
        variant="group"
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlashList
          ref={listRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={60}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        />

        <ComposerBar
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          activePanel={activePanel}
          onToggleEmoji={toggleEmoji}
          onToggleAttachment={toggleAttachment}
        />

        {activePanel === 'emoji' && <EmojiPanel onEmojiPress={addEmoji} />}
        {activePanel === 'attachment' && <AttachmentPanel />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ChatColors.bg },
  flex: { flex: 1 },
  listContent: { paddingTop: 14, paddingBottom: 8 },
});
