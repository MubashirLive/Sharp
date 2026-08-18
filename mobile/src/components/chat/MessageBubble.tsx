/**
 * MessageBubble — the core chat message display unit.
 * Handles: sent / received layout, WhatsApp tail, time + read receipt meta,
 * system messages, and broadcast read-only style.
 */

import { StyleSheet, Text, View } from 'react-native';
import { CheckCheck } from 'lucide-react-native';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

type ReadState = 'sending' | 'sent' | 'delivered' | 'seen';

type Props = {
  text: string;
  sender: 'me' | 'other';
  time: string;
  /** Only used when sender === 'me' */
  readState?: ReadState;
  /** Sender name — shown above received bubble in group chats */
  senderName?: string;
  /** Sender name color — unique per-member color in group chat */
  senderColor?: string;
  /** If true, render a compact centred system message (date pill, event notice) */
  isSystem?: boolean;
  /** If true, mark with a broadcast megaphone indicator */
  isBroadcast?: boolean;
};

export default function MessageBubble({
  text,
  sender,
  time,
  readState = 'delivered',
  senderName,
  senderColor,
  isSystem = false,
  isBroadcast = false,
}: Props) {
  // ── System / date separator pill ─────────────────────────────────────────
  if (isSystem) {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemPill}>
          <Text style={styles.systemText}>{text}</Text>
        </View>
      </View>
    );
  }

  const isMe = sender === 'me';

  // ── Tick colour for read receipts ─────────────────────────────────────────
  const tickColor =
    readState === 'seen' ? ChatColors.tickSeen : ChatColors.tickSent;

  return (
    <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        {/* Sender name — group chats only */}
        {!isMe && senderName ? (
          <Text
            style={[
              styles.senderName,
              { color: senderColor ?? ChatColors.accent },
            ]}
            numberOfLines={1}
          >
            {senderName}
          </Text>
        ) : null}

        {/* Broadcast badge */}
        {isBroadcast ? (
          <Text style={styles.broadcastTag}>📢 Broadcast</Text>
        ) : null}

        {/* Message text */}
        <Text style={styles.text}>{text}</Text>

        {/* Meta row: time + tick */}
        <View style={[styles.meta, isMe ? styles.metaMe : styles.metaOther]}>
          <Text style={styles.time}>{time}</Text>
          {isMe ? (
            <CheckCheck size={15} color={tickColor} strokeWidth={2.4} />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Row ───────────────────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingHorizontal: 10,
  },
  rowMe: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },

  // ── Bubble ────────────────────────────────────────────────────────────────
  bubble: {
    maxWidth: '82%',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 5,
  },
  bubbleMe: {
    backgroundColor: ChatColors.bubbleSent,
    borderTopRightRadius: 2,
  },
  bubbleOther: {
    backgroundColor: ChatColors.bubbleReceived,
    borderTopLeftRadius: 2,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  senderName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  broadcastTag: {
    fontSize: 11,
    fontWeight: '700',
    color: ChatColors.broadcastAccent,
    marginBottom: 4,
  },
  text: {
    color: ChatColors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400',
  },

  // ── Meta (time + ticks) ───────────────────────────────────────────────────
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  metaMe: {
    alignSelf: 'flex-end',
    marginLeft: 18,
  },
  metaOther: {
    alignSelf: 'flex-end',
  },
  time: {
    color: ChatColors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },

  // ── System / date separator ───────────────────────────────────────────────
  systemRow: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  systemPill: {
    borderRadius: 9,
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  systemText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
});
