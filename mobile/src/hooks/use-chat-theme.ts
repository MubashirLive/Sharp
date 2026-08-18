/**
 * useChatTheme — returns the mode-aware chat color palette.
 *
 * Usage:
 *   const chatColors = useChatTheme();
 *   // chatColors.bubbleSent, chatColors.textPrimary, etc.
 */

import { ChatColors } from '@/constants/chat-theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useChatTheme() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? 'dark' : 'light';
  return ChatColors[theme];
}
