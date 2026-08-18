/**
 * Sharp Messenger — Chat Design Tokens
 *
 * High contrast light gray bubble colors with pure black text.
 * - Sent bubble: Rich slate light gray (#D1D5DB) - distinctly darker light gray
 * - Received bubble: Bright off-white light gray (#F3F4F6) - bright soft light gray
 * - Message font: Pure Black (#000000)
 */

import { Accent, Radius, Spacing } from './theme';

// ─── Chat Colors ────────────────────────────────────────────────────────────

export const ChatColors = {
  light: {
    // ── Backgrounds
    bg: '#FFFFFF',
    bgPanel: '#FAFAFA',
    bgElevated: '#F3F4F6',
    bgPressed: '#E5E7EB',

    // ── Bubbles (High Contrast Light Grays)
    /** Sent message bubble — Distinctly darker slate light gray */
    bubbleSent: '#D1D5DB',
    /** Received message bubble — Bright off-white light gray */
    bubbleReceived: '#F3F4F6',

    // ── Accent
    accent: '#000000',
    accentPressed: '#262626',
    accentText: '#FFFFFF',

    // ── Text (Pure Black fonts for messages)
    textPrimary: '#000000',
    textSecondary: '#4B5563',
    textTertiary: '#6B7280',
    textMuted: '#6B7280',

    // ── Icons
    iconMuted: '#6B7280',
    tickSeen: '#000000',
    tickSent: '#6B7280',

    // ── Dividers
    divider: '#E5E7EB',
    inputBorder: '#E5E7EB',

    // ── Role / designation badge
    roleBg: '#E5E7EB',
    roleText: '#000000',

    // ── Broadcast channel
    broadcastBg: '#E5E7EB',
    broadcastAccent: '#000000',
  },

  dark: {
    // ── Backgrounds
    bg: '#000000',
    bgPanel: '#121212',
    bgElevated: '#2C2C2E',
    bgPressed: '#3A3A3C',

    // ── Bubbles
    bubbleSent: '#374151',
    bubbleReceived: '#1F2937',

    // ── Accent
    accent: '#FFFFFF',
    accentPressed: '#E5E5E5',
    accentText: '#000000',

    // ── Text
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    textTertiary: '#6B7280',
    textMuted: '#9CA3AF',

    // ── Icons
    iconMuted: '#9CA3AF',
    tickSeen: '#FFFFFF',
    tickSent: '#6B7280',

    // ── Dividers
    divider: '#374151',
    inputBorder: '#374151',

    // ── Role badge
    roleBg: '#374151',
    roleText: '#FFFFFF',

    // ── Broadcast
    broadcastBg: '#1F2937',
    broadcastAccent: '#FFFFFF',
  },
} as const;

export type ChatColor = keyof typeof ChatColors.light & keyof typeof ChatColors.dark;

/** Default flat export for backwards compatibility */
export const ChatColorsDefault = ChatColors.light;

// ─── Chat Layout Constants ──────────────────────────────────────────────────

export const BubbleLayout = {
  paddingH: Spacing.three,     // 12px
  paddingV: Spacing.two,       // 8px
  gapSame: Spacing.half,      // 2px
  gapDifferent: Spacing.two,  // 8px
  maxWidthPercent: 0.78,
  radius: Radius.bubble,       // 18px
  radiusTail: 4,
} as const;

// ─── Group Avatar Fallback Colors ───────────────────────────────────────────

export const groupAvatarColors = [
  '#000000', '#1F2937', '#374151', '#4B5563',
  '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB',
] as const;

/** Returns a deterministic avatar background color for a given user/group id string */
export function avatarColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return groupAvatarColors[Math.abs(hash) % groupAvatarColors.length];
}
