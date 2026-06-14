import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChatService } from '@/services/chatService';
import type { Conversation, Message } from '@/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useChat() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['conversations'],
    queryFn: ChatService.getConversations,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch messages for selected conversation
  const {
    data: conversationMessages = [],
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage
  } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => selectedConversation ? ChatService.getMessages(selectedConversation.id) : [],
    enabled: !!selectedConversation,
  });

  // Update messages when conversationMessages changes
  useEffect(() => {
    setMessages(conversationMessages);
  }, [conversationMessages]);

  // Real-time subscriptions
  useEffect(() => {
    if (!selectedConversation) return;

    const messageSubscription = ChatService.subscribeToMessages(
      selectedConversation.id,
      (newMessage) => {
        setMessages(prev => {
          // Check if message already exists (to avoid duplicates)
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });

        // Update conversation's last message
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    );

    const typingSubscription = ChatService.subscribeToTyping(
      selectedConversation.id,
      (userId, typing) => {
        setIsTyping(prev => ({ ...prev, [userId]: typing }));
      }
    );

    return () => {
      if (messageSubscription) {
        supabase.removeChannel(messageSubscription);
      }
      if (typingSubscription) {
        supabase.removeChannel(typingSubscription);
      }
    };
  }, [selectedConversation, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({
      conversationId,
      content,
      messageType,
      mediaUrl,
      mediaMetadata,
      replyToId
    }: {
      conversationId: string;
      content: string;
      messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
      mediaUrl?: string;
      mediaMetadata?: any;
      replyToId?: string;
    }) => ChatService.sendMessage(
      conversationId,
      content,
      messageType,
      mediaUrl,
      mediaMetadata,
      replyToId
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: ({
      type,
      name,
      participantIds,
      description
    }: {
      type: 'direct' | 'group' | 'broadcast';
      name?: string;
      participantIds?: string[];
      description?: string;
    }) => ChatService.createConversation(type, name, participantIds, description),
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(newConversation);
      toast({
        title: 'Success',
        description: 'Conversation created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive',
      });
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: ({ file, conversationId }: { file: File; conversationId: string }) =>
      ChatService.uploadFile(file, conversationId),
  });

  // Typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!selectedConversation) return;

    ChatService.sendTypingIndicator(selectedConversation.id, isTyping);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        ChatService.sendTypingIndicator(selectedConversation.id, false);
      }, 3000);
    }
  }, [selectedConversation]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Mark messages as read
  const markAsRead = useCallback(async (messageIds: string[]) => {
    if (!selectedConversation) return;

    try {
      await ChatService.markAsRead(selectedConversation.id, messageIds);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, [selectedConversation, queryClient]);

  // Get or create direct conversation
  const getOrCreateDirectConversation = useCallback(async (otherUserId: string) => {
    try {
      const conversation = await ChatService.getOrCreateDirectConversation(otherUserId);
      setSelectedConversation(conversation);
      return conversation;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation',
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast]);

  // Load more messages
  const loadMoreMessages = useCallback(() => {
    if (hasNextPage && !messagesLoading) {
      fetchNextPage();
    }
  }, [hasNextPage, messagesLoading, fetchNextPage]);

  // Get typing users
  const getTypingUsers = useCallback(() => {
    return Object.entries(isTyping)
      .filter(([_, typing]) => typing)
      .map(([userId]) => userId);
  }, [isTyping]);

  return {
    // State
    conversations,
    conversationsLoading,
    selectedConversation,
    messages,
    messagesLoading,
    isTyping: getTypingUsers(),

    // Actions
    setSelectedConversation,
    sendMessage: sendMessageMutation.mutate,
    createConversation: createConversationMutation.mutate,
    uploadFile: uploadFileMutation.mutate,
    sendTypingIndicator,
    markAsRead,
    getOrCreateDirectConversation,
    loadMoreMessages,

    // Status
    sendingMessage: sendMessageMutation.isPending,
    creatingConversation: createConversationMutation.isPending,
    uploadingFile: uploadFileMutation.isPending,

    // Refetch
    refetchConversations,
  };
}