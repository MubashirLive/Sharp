import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Info,
  Paperclip,
  Smile,
  Send,
  Download,
  File,
  X,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChat } from "@/hooks/useChat";
import type { Conversation, Message } from "@/services/chatService";

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
}

const quickMessages = [
  "Acknowledge receipt",
  "Please hold",
  "Schedule call",
];

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const {
    messages,
    messagesLoading,
    isTyping,
    sendMessage,
    sendTypingIndicator,
    markAsRead,
    sendingMessage,
    uploadFile,
    uploadingFile,
  } = useChat();

  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const emojis = ["😀", "😂", "❤️", "🎉", "👍", "🙏", "😍", "🔥", "✨", "🎊"];

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as read when conversation is viewed
  useEffect(() => {
    if (messages.length > 0) {
      const unreadMessageIds = messages
        .filter(msg => !msg.read_by?.includes('current-user-id')) // This would need to be the actual user ID
        .map(msg => msg.id);

      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    }
  }, [messages, markAsRead]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedAttachment) return;

    let mediaUrl: string | undefined;
    let messageType: 'text' | 'image' | 'file' = 'text';

    if (selectedAttachment) {
      try {
        mediaUrl = await uploadFile({ file: selectedAttachment, conversationId: conversation.id });
        messageType = selectedAttachment.type.startsWith('image/') ? 'image' : 'file';
      } catch (error) {
        console.error('Failed to upload file:', error);
        return;
      }
    }

    sendMessage({
      conversationId: conversation.id,
      content: inputValue || (selectedAttachment ? selectedAttachment.name : ''),
      messageType,
      mediaUrl,
    });

    setInputValue("");
    setSelectedAttachment(null);
    setShowEmojiPicker(false);
  };

  const handleQuickMessage = (message: string) => {
    sendMessage({
      conversationId: conversation.id,
      content: message,
    });
  };

  const handleAddEmoji = (emoji: string) => {
    setInputValue(inputValue + emoji);
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAttachment(file);
    }
  };

  const getConversationDisplayName = () => {
    if (conversation.name) return conversation.name;

    // For direct messages, show other participant's name
    if (conversation.type === "direct" && conversation.participants) {
      const otherParticipant = conversation.participants.find(p => p.profile?.full_name);
      return otherParticipant?.profile?.full_name || "Unknown User";
    }

    return "Unnamed Conversation";
  };

  const getParticipantCount = () => {
    return conversation.participants?.length || 0;
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMessageSenderInfo = (message: Message) => {
    return {
      name: message.sender_name || "Unknown",
      initials: (message.sender_name || "U").split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      role: "User", // This would need to be fetched from user roles
    };
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="font-semibold text-sm">{getConversationDisplayName()}</h2>
            <p className="text-xs text-muted-foreground">
              {getParticipantCount()} Participants
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Info className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="space-y-4 p-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const senderInfo = getMessageSenderInfo(message);
              const isCurrentUser = message.sender_name === "You"; // This needs proper user identification

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    isCurrentUser && "flex-row-reverse gap-3"
                  )}
                >
                  {/* Avatar */}
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8 mt-1 shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
                        {senderInfo.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Message Container */}
                  <div className={cn("flex-1 max-w-xs", isCurrentUser && "flex flex-col items-end")}>
                    {/* Sender Info */}
                    {!isCurrentUser && (
                      <div className="text-xs text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">
                          {senderInfo.name}
                        </span>
                        {senderInfo.role && (
                          <span className="text-muted-foreground ml-1">
                            · {senderInfo.role}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm break-words",
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      )}
                    >
                      {message.content}
                    </div>

                    {/* Attachments */}
                    {message.media_url && (
                      <div className="mt-2">
                        {message.message_type === 'image' ? (
                          <img
                            src={message.media_url}
                            alt="Attachment"
                            className="max-w-xs rounded-md cursor-pointer"
                            loading="lazy"
                            decoding="async"
                            onClick={() => window.open(message.media_url, '_blank')}
                          />
                        ) : (
                          <div className={cn(
                            "flex items-center gap-2 p-2 rounded-md border",
                            isCurrentUser
                              ? "bg-primary/10 border-primary/20"
                              : "bg-muted border-muted-foreground/20"
                          )}>
                            <File className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {message.media_metadata?.name || "Attachment"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {message.media_metadata?.size || ""}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => window.open(message.media_url, '_blank')}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {message.reactions.map((reaction) => (
                          <Button
                            key={reaction.emoji}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                          >
                            {reaction.emoji} {reaction.count}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatMessageTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {isTyping.length > 0 && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1 shrink-0">
                <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
                  ?
                </AvatarFallback>
              </Avatar>
              <div className="px-3 py-2 rounded-lg bg-muted text-foreground rounded-bl-none">
                <div className="text-sm text-muted-foreground">
                  {isTyping.length === 1 ? "Someone is typing..." : "Several people are typing..."}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Quick Messages */}
      <div className="border-t px-4 py-2 space-y-2 shrink-0">
        <div className="text-xs text-muted-foreground px-1">Quick replies:</div>
        <div className="flex flex-wrap gap-2">
          {quickMessages.map((msg) => (
            <Button
              key={msg}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => handleQuickMessage(msg)}
            >
              {msg}
            </Button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t p-3 shrink-0 space-y-3">
        {/* Selected Attachment Preview */}
        {selectedAttachment && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <File className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground flex-1 truncate">
              {selectedAttachment.name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setSelectedAttachment(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="flex gap-2 p-2 bg-muted rounded-md flex-wrap">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                className="text-lg hover:bg-background p-1 rounded transition-colors"
                onClick={() => {
                  handleAddEmoji(emoji);
                  setShowEmojiPicker(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleAttachmentClick}
            disabled={uploadingFile}
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Input
            placeholder="Type a message"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              sendTypingIndicator(e.target.value.length > 0);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 h-9 text-sm"
            disabled={sendingMessage}
          />

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            title="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </Button>

          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() && !selectedAttachment || sendingMessage}
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
