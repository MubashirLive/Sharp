/**
 * ComposerBar — the message input toolbar at the bottom of every chat screen.
 *
 * Features:
 *  - Emoji toggle button
 *  - Auto-growing TextInput (min 44 → max 146 px)
 *  - Attachment icon (opens parent-controlled panel)
 *  - Camera icon
 *  - Mic button (visible when input is empty) / Send button (when text exists)
 *  - readOnly mode: hides input and shows a "Read-only" notice (broadcast)
 */

import {
  Keyboard,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Camera, Mic, Paperclip, Send, Smile } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

const MIN_H = 44;
const MAX_H = 146;

type ActivePanel = 'emoji' | 'attachment' | null;

type Props = {
  /** Current input text */
  value: string;
  onChangeText: (text: string) => void;
  /** Called when the send button is pressed */
  onSend: () => void;
  /** Currently active bottom panel */
  activePanel: ActivePanel;
  onToggleEmoji: () => void;
  onToggleAttachment: () => void;
  /** If true, render a read-only notice instead of the input */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
};

export default function ComposerBar({
  value,
  onChangeText,
  onSend,
  activePanel,
  onToggleEmoji,
  onToggleAttachment,
  readOnly = false,
  placeholder = 'Message',
}: Props) {
  const [inputHeight, setInputHeight] = useState(MIN_H);
  const inputRef = useRef<TextInput>(null);

  const focusInput = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    inputRef.current?.focus();
  };

  // ── Read-only notice (broadcast channels) ────────────────────────────────
  if (readOnly) {
    return (
      <View style={styles.readOnlyBar}>
        <Text style={styles.readOnlyText}>
          📢 This is a broadcast channel. You cannot send messages here.
        </Text>
      </View>
    );
  }

  const canSend = value.trim().length > 0;

  return (
    <View style={styles.wrap}>
      {/* Pill-shaped composer */}
      <Pressable style={styles.composer} onPress={focusInput}>
        {/* Emoji toggle */}
        <Pressable style={styles.icon} onPress={onToggleEmoji}>
          <Smile
            size={25}
            color={activePanel === 'emoji' ? ChatColors.accent : ChatColors.iconMuted}
            strokeWidth={2}
          />
        </Pressable>

        {/* Text input */}
        <TextInput
          ref={inputRef}
          style={[styles.input, { height: inputHeight }]}
          placeholder={placeholder}
          placeholderTextColor={ChatColors.iconMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }}
          onContentSizeChange={(e) => {
            const next = Math.min(
              MAX_H,
              Math.max(MIN_H, e.nativeEvent.contentSize.height)
            );
            setInputHeight(next);
          }}
          scrollEnabled={inputHeight >= MAX_H}
          multiline
          returnKeyType="default"
        />

        {/* Attachment */}
        <Pressable style={styles.icon} onPress={onToggleAttachment}>
          <Paperclip
            size={24}
            color={
              activePanel === 'attachment' ? ChatColors.accent : ChatColors.iconMuted
            }
            strokeWidth={2}
          />
        </Pressable>

        {/* Camera — hidden when text exists */}
        {!canSend && (
          <Pressable style={styles.icon}>
            <Camera size={24} color={ChatColors.iconMuted} strokeWidth={2} />
          </Pressable>
        )}
      </Pressable>

      {/* Mic / Send FAB */}
      <Pressable
        style={[styles.fab, canSend && styles.fabSend]}
        onPress={canSend ? onSend : undefined}
      >
        {canSend ? (
          <Send size={22} color={ChatColors.bg} strokeWidth={2.4} />
        ) : (
          <Mic size={24} color={ChatColors.bg} fill={ChatColors.bg} strokeWidth={2.4} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
    backgroundColor: ChatColors.bg,
  },

  composer: {
    flex: 1,
    minHeight: 50,
    maxHeight: 162,
    borderRadius: 25,
    backgroundColor: ChatColors.bgElevated,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 7,
    paddingRight: 6,
  },

  icon: {
    width: 37,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  input: {
    flex: 1,
    color: ChatColors.textPrimary,
    fontSize: 16,
    lineHeight: 21,
    minHeight: MIN_H,
    maxHeight: MAX_H,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },

  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e9edef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabSend: {
    backgroundColor: ChatColors.accent,
  },

  // ── Read-only bar ─────────────────────────────────────────────────────────
  readOnlyBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: ChatColors.bgPanel,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: ChatColors.divider,
    alignItems: 'center',
  },
  readOnlyText: {
    color: ChatColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
