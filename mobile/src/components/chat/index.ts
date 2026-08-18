/**
 * Chat component library — barrel export
 * Import from '@/components/chat' instead of individual files.
 */

export { default as ChatAvatar } from './ChatAvatar';
export { default as ChatHeader } from './ChatHeader';
export { default as ChatListItem } from './ChatListItem';
export { default as MessageBubble } from './MessageBubble';
export { default as ComposerBar } from './ComposerBar';
export { default as EmojiPanel } from './EmojiPanel';
export { default as AttachmentPanel } from './AttachmentPanel';

export type { ChatItemData } from './ChatListItem';
