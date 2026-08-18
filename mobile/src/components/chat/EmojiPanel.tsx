/**
 * EmojiPanel — scrollable emoji grid that slides up from the bottom of a chat.
 * Used by: ChatDetailScreen, GroupChatScreen
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChatColorsDefault as ChatColors } from '@/constants/chat-theme';

const EMOJIS = [
  '\u{1F600}', '\u{1F602}', '\u{1F60A}', '\u{1F60D}', '\u{1F44D}', '\u{1F64F}',
  '\u{1F44F}', '\u{1F525}', '\u{1F389}', '\u{2705}',  '\u{1F4DA}', '\u{270F}\u{FE0F}',
  '\u{1F4DD}', '\u{1F4CE}', '\u{1F3EB}', '\u{2B50}',  '\u{1F4A1}', '\u{1F642}',
  '\u{1F604}', '\u{1F91D}', '\u{1F44C}', '\u{1F4AF}', '\u{1F4C5}', '\u{1F514}',
  '\u{1F60B}', '\u{1F973}', '\u{1FAF6}', '\u{1F917}', '\u{1F92D}', '\u{1F600}',
  '\u{1F62E}', '\u{1F631}',
];

type Props = {
  onEmojiPress: (emoji: string) => void;
};

export default function EmojiPanel({ onEmojiPress }: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.grabber} />
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {EMOJIS.map((emoji) => (
          <Pressable
            key={emoji}
            style={({ pressed }) => [styles.emojiBtn, pressed && { opacity: 0.6 }]}
            onPress={() => onEmojiPress(emoji)}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    height: 258,
    backgroundColor: ChatColors.bgPanel,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grabber: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a484f',
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 24,
  },
  emojiBtn: {
    width: '12.5%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
});
