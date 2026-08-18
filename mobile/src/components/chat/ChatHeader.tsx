/**
 * ChatHeader — top navigation bar shared by DM, Group, and Broadcast screens.
 *
 * Props control what icons appear on the right side:
 *  - DM:        MoreVertical menu
 *  - Group:     MoreVertical menu
 *  - Broadcast: Megaphone icon (non-pressable badge) + MoreVertical
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, Megaphone, MoreVertical } from 'lucide-react-native';
import ChatAvatar from './ChatAvatar';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

type Variant = 'dm' | 'group' | 'broadcast';

type Props = {
  name: string;
  subtitle: string;
  initials: string;
  avatarColor?: string;
  avatarId?: string;
  variant?: Variant;
  onBack: () => void;
  onMenu?: () => void;
};

export default function ChatHeader({
  name,
  subtitle,
  initials,
  avatarColor,
  avatarId,
  variant = 'dm',
  onBack,
  onMenu,
}: Props) {
  return (
    <View style={styles.header}>
      {/* Back */}
      <Pressable onPress={onBack} style={styles.back}>
        <ChevronLeft size={31} color={ChatColors.textPrimary} strokeWidth={2.1} />
      </Pressable>

      {/* Avatar */}
      <ChatAvatar
        initials={initials}
        size={42}
        id={avatarId}
        color={avatarColor}
        variant={variant === 'dm' ? 'circle' : 'rounded'}
      />

      {/* Text */}
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {variant === 'broadcast' ? '📢 ' : ''}
          {subtitle}
        </Text>
      </View>

      {/* Right actions */}
      {variant === 'broadcast' && (
        <View style={styles.broadcastPill}>
          <Megaphone size={14} color={ChatColors.broadcastAccent} strokeWidth={2.2} />
          <Text style={styles.broadcastText}>Broadcast</Text>
        </View>
      )}

      <Pressable onPress={onMenu} style={styles.menuBtn}>
        <MoreVertical size={22} color={ChatColors.textPrimary} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    backgroundColor: ChatColors.bgPanel,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 10,
  },
  back: {
    width: 48,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: ChatColors.textSecondary,
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    color: ChatColors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  menuBtn: {
    width: 42,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ChatColors.broadcastBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  broadcastText: {
    color: ChatColors.broadcastAccent,
    fontSize: 11,
    fontWeight: '700',
  },
});
