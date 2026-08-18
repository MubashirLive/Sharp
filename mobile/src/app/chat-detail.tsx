/**
 * ChatDetailScreen — 1:1 Direct Message conversation screen.
 *
 * Uses the shared chat component library:
 *  - ChatHeader     → top bar
 *  - MessageBubble  → each message row (+ system date separators)
 *  - ComposerBar    → input + mic/send
 *  - EmojiPanel     → emoji bottom sheet
 *  - AttachmentPanel → attachment bottom sheet
 *  - FlashList      → high-performance message list
 */

import { useCallback, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  StyleSheet,
  View,
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

type ChatProfile = {
  id: string;
  name: string;
  designation: string;
  avatar: string;
  avatarColor: string;
};

type MessageItem =
  | { type: 'system'; id: string; text: string }
  | {
      type: 'message';
      id: string;
      text: string;
      sender: 'me' | 'other';
      time: string;
      readState?: 'sending' | 'sent' | 'delivered' | 'seen';
    };

type ActivePanel = 'emoji' | 'attachment' | null;

// ── Mock data ──────────────────────────────────────────────────────────────

const PROFILES: Record<string, ChatProfile> = {
  kapoor: { id: 'kapoor', name: 'Mr. Kapoor', designation: 'Mathematics Teacher', avatar: 'MK', avatarColor: '#214d7a' },
  roberts: { id: 'roberts', name: 'Mrs. Roberts', designation: 'TGT English', avatar: 'MR', avatarColor: '#7a4a2d' },
  kumar: { id: 'kumar', name: 'Dr. Kumar', designation: 'PGT Commerce', avatar: 'DK', avatarColor: '#7b5b1e' },
  davis: { id: 'davis', name: 'Coach Davis', designation: 'P.E. Dept', avatar: 'CD', avatarColor: '#176b4d' },
};

const FALLBACK: ChatProfile = { id: 'default', name: 'Principal Office', designation: 'Admin', avatar: 'PO', avatarColor: '#39434d' };

const SEED_MESSAGES: MessageItem[] = [
  { type: 'system', id: 'sys-1', text: 'Today' },
  { type: 'message', id: '1', text: 'Hello! Did you have a chance to look at the trigonometry exercises?', sender: 'other', time: '10:30 AM' },
  { type: 'message', id: '2', text: "Yes, I'm working on exercise 4.2 right now. It's a bit tricky.", sender: 'me', time: '10:32 AM', readState: 'seen' },
  { type: 'message', id: '3', text: "No worries. We'll go over the sine formulas again in class tomorrow.", sender: 'other', time: '10:35 AM' },
  { type: 'message', id: '4', text: 'Thank you, sir. I will mark the difficult questions.', sender: 'me', time: '10:36 AM', readState: 'seen' },
];

// ── Screen ─────────────────────────────────────────────────────────────────

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const profile = PROFILES[id ?? ''] ?? FALLBACK;

  const [messages, setMessages] = useState<MessageItem[]>(SEED_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);

  const listRef = useRef<FlashList<MessageItem>>(null);

  // ── Panel helpers ─────────────────────────────────────────────────────────

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

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const newMsg: MessageItem = {
      type: 'message',
      id: `msg-${Date.now()}`,
      text,
      sender: 'me',
      time,
      readState: 'sending',
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  }, [inputText]);

  const addEmoji = useCallback((emoji: string) => {
    setInputText((t) => `${t}${emoji}`);
  }, []);

  // ── Render item ───────────────────────────────────────────────────────────

  const renderItem = useCallback(({ item }: { item: MessageItem }) => {
    if (item.type === 'system') {
      return <MessageBubble text={item.text} sender="me" time="" isSystem />;
    }
    return (
      <MessageBubble
        text={item.text}
        sender={item.sender}
        time={item.time}
        readState={item.readState}
      />
    );
  }, []);

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ChatHeader
        name={profile.name}
        subtitle={profile.designation}
        initials={profile.avatar}
        avatarColor={profile.avatarColor}
        avatarId={profile.id}
        variant="dm"
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
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

        {/* Composer */}
        <ComposerBar
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          activePanel={activePanel}
          onToggleEmoji={toggleEmoji}
          onToggleAttachment={toggleAttachment}
        />

        {/* Bottom panels */}
        {activePanel === 'emoji' && <EmojiPanel onEmojiPress={addEmoji} />}
        {activePanel === 'attachment' && <AttachmentPanel />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: ChatColors.bg,
  },
  flex: {
    flex: 1,
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 8,
  },
});