/**
 * ChatListItem — single conversation row in the chat inbox.
 * Used in: Chat Inbox (chat.tsx)
 *
 * Variants:
 *  - 'dm'        1:1 direct message
 *  - 'group'     group with rounded-square avatar
 *  - 'broadcast' one-way channel (megaphone icon overlay)
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Megaphone } from 'lucide-react-native';
import ChatAvatar from './ChatAvatar';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

type Variant = 'dm' | 'group' | 'broadcast';

export type ChatItemData = {
  id: string;
  name: string;
  /** Subtitle shown below name (designation for DMs, member count for groups) */
  subtitle: string;
  /** Last message preview text */
  preview: string;
  /** Display timestamp string */
  time: string;
  /** Unread message count — 0 or undefined hides the badge */
  unread?: number;
  /** 1–3 character initials */
  initials: string;
  /** Avatar background colour (optional — auto-derived from id if omitted) */
  avatarColor?: string;
  variant?: Variant;
  /** If true, show a green online dot on the avatar */
  online?: boolean;
};

type Props = ChatItemData & {
  onPress: () => void;
};

export default function ChatListItem({
  id,
  name,
  subtitle,
  preview,
  time,
  unread,
  initials,
  avatarColor,
  variant = 'dm',
  online,
  onPress,
}: Props) {
  const hasUnread = !!unread && unread > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onPress={onPress}
      android_ripple={{ color: ChatColors.bgPressed }}
    >
      {/* Avatar + broadcast overlay */}
      <View style={styles.avatarWrap}>
        <ChatAvatar
          initials={initials}
          size={56}
          id={id}
          color={avatarColor}
          online={online}
          variant={variant === 'dm' ? 'circle' : 'rounded'}
        />
        {variant === 'broadcast' && (
          <View style={styles.broadcastBadge}>
            <Megaphone size={11} color="#fff" strokeWidth={2.5} fill="#fff" />
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Row 1: name + time */}
        <View style={styles.headerLine}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>
            {time}
          </Text>
        </View>

        {/* Row 2: subtitle / designation */}
        <View style={styles.subtitleLine}>
          {variant === 'dm' && (
            <Text style={styles.subtitleBadge} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          {variant !== 'dm' && (
            <Text style={styles.subtitlePlain} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Row 3: preview + unread badge */}
        <View style={styles.previewLine}>
          <Text
            style={[styles.preview, hasUnread && styles.previewUnread]}
            numberOfLines={1}
          >
            {preview}
          </Text>
          {hasUnread ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unread! > 99 ? '99+' : unread}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  rowPressed: {
    backgroundColor: ChatColors.bgPressed,
  },

  // ── Avatar ────────────────────────────────────────────────────────────────
  avatarWrap: {
    marginRight: 14,
  },
  broadcastBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ChatColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ChatColors.bg,
  },

  // ── Body ──────────────────────────────────────────────────────────────────
  body: {
    flex: 1,
    minWidth: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: ChatColors.divider,
    paddingBottom: 10,
  },

  headerLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 2,
  },
  name: {
    flex: 1,
    color: ChatColors.textSecondary,
    fontSize: 17,
    fontWeight: '800',
  },
  time: {
    color: ChatColors.iconMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  timeUnread: {
    color: ChatColors.accent,
  },

  subtitleLine: {
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleBadge: {
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: ChatColors.roleBg,
    color: ChatColors.roleText,
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 6,
    maxWidth: '60%',
  },
  subtitlePlain: {
    color: ChatColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },

  previewLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  preview: {
    flex: 1,
    color: ChatColors.textTertiary,
    fontSize: 14,
    fontWeight: '500',
  },
  previewUnread: {
    color: '#dce3e6',
    fontWeight: '700',
  },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ChatColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: ChatColors.accentText,
    fontSize: 11,
    fontWeight: '900',
  },
});
