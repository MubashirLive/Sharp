/**
 * ChatAvatar — circular avatar with initials or online-dot indicator.
 * Used in: ChatListItem, ChatDetailHeader, GroupInfo, BroadcastHeader
 */

import { StyleSheet, Text, View } from 'react-native';
import { ChatColorsDefault as ChatColors, avatarColorFor } from '@/constants/chat-theme';

type Props = {
  /** 1–3 character initials to display */
  initials: string;
  /** Size in px (default 48) */
  size?: number;
  /** Background color override — falls back to deterministic hash of `id` */
  color?: string;
  /** ID used to derive a deterministic color when `color` is not supplied */
  id?: string;
  /** If true, show a green online dot in the bottom-right corner */
  online?: boolean;
  /** Shape variant: 'circle' (default) or 'rounded' (for groups / channels) */
  variant?: 'circle' | 'rounded';
};

export default function ChatAvatar({
  initials,
  size = 48,
  color,
  id = '',
  online = false,
  variant = 'circle',
}: Props) {
  const bg = color ?? avatarColorFor(id || initials);
  const radius = variant === 'rounded' ? size * 0.28 : size / 2;
  const fontSize = size < 40 ? size * 0.36 : size * 0.32;
  const dotSize = size * 0.28;

  return (
    <View style={{ width: size, height: size }}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: radius, backgroundColor: bg },
        ]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      </View>

      {online && (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#f7f8fa',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: ChatColors.accent,
    borderWidth: 2,
    borderColor: ChatColors.bgPanel,
  },
});
