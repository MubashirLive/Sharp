-- Chat System Tables and Policies
-- Migration: 20260426160226_chat_system.sql

-- Conversations table (replaces chats)
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  type conversation_type NOT NULL,
  name TEXT,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Constraints
  CONSTRAINT conversations_name_required CHECK (
    (type = 'direct' AND name IS NULL) OR
    (type IN ('group', 'broadcast') AND name IS NOT NULL)
  ),
  CONSTRAINT conversations_description_length CHECK (char_length(description) <= 500)
);

-- Conversation types enum
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group', 'broadcast');

-- Conversation participants
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES
  public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role participant_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_read_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,

  UNIQUE(conversation_id, user_id)
);

-- Participant roles enum
CREATE TYPE public.participant_role AS ENUM ('admin', 'member');

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type message_type_enum NOT NULL DEFAULT 'text',
  media_url TEXT,
  media_metadata JSONB,
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT messages_content_required CHECK (
    (message_type = 'text' AND content IS NOT NULL AND char_length(content) > 0) OR
    (message_type IN ('image', 'file', 'audio', 'video') AND media_url IS NOT NULL)
  ),
  CONSTRAINT messages_content_length CHECK (char_length(content) <= 2000)
);

-- Message types enum
CREATE TYPE public.message_type_enum AS ENUM ('text', 'image', 'file', 'audio', 'video');

-- Message reactions
CREATE TABLE public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(message_id, user_id, emoji)
);

-- Message read status
CREATE TABLE public.message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(message_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_conversations_school_id ON public.conversations(school_id);
CREATE INDEX idx_conversations_type ON public.conversations(type);
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversations_updated_at ON public.conversations(updated_at DESC);

CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_active ON public.conversation_participants(is_active);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_reply_to_id ON public.messages(reply_to_id);

CREATE INDEX idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON public.message_reactions(user_id);

CREATE INDEX idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON public.message_reads(user_id);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Updated-at trigger
CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Conversations: Users can view conversations they're participants in, within their school
CREATE POLICY "users_view_own_conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    school_id = public.get_user_school_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid() AND is_active = true
    )
  );

-- Conversations: Staff can create group/broadcast conversations
CREATE POLICY "staff_create_conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.get_user_school_id(auth.uid()) AND
    public.is_school_staff(auth.uid(), school_id) AND
    type IN ('group', 'broadcast')
  );

-- Conversations: Users can create direct conversations (will be handled by application logic)
CREATE POLICY "users_create_direct_conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.get_user_school_id(auth.uid()) AND
    type = 'direct' AND
    created_by = auth.uid()
  );

-- Conversations: Only admins can update conversations
CREATE POLICY "admins_update_conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    school_id = public.get_user_school_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    school_id = public.get_user_school_id(auth.uid()) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Conversation participants: Users can view participants of conversations they're in
CREATE POLICY "users_view_participants" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.school_id = public.get_user_school_id(auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid() AND cp.is_active = true
    )
  );

-- Conversation participants: Staff can add participants to group conversations
CREATE POLICY "staff_add_participants" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.school_id = public.get_user_school_id(auth.uid()) AND c.type IN ('group', 'broadcast')
    ) AND
    public.is_school_staff(auth.uid(), (SELECT school_id FROM public.conversations WHERE id = conversation_id))
  );

-- Conversation participants: Users can add themselves to direct conversations (application logic)
CREATE POLICY "users_join_direct_conversations" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.school_id = public.get_user_school_id(auth.uid()) AND c.type = 'direct'
    )
  );

-- Conversation participants: Users can update their own participation (leave, read status)
CREATE POLICY "users_update_own_participation" ON public.conversation_participants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Messages: Users can view messages in conversations they're participants in
CREATE POLICY "users_view_messages" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.school_id = public.get_user_school_id(auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid() AND cp.is_active = true
    )
  );

-- Messages: Users can send messages to conversations they're participants in
CREATE POLICY "users_send_messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.school_id = public.get_user_school_id(auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid() AND cp.is_active = true
    )
  );

-- Messages: Users can edit their own messages
CREATE POLICY "users_edit_own_messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- Message reactions: Users can view reactions on messages they can see
CREATE POLICY "users_view_reactions" ON public.message_reactions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id AND c.school_id = public.get_user_school_id(auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = (SELECT conversation_id FROM public.messages WHERE id = message_id)
      AND cp.user_id = auth.uid() AND cp.is_active = true
    )
  );

-- Message reactions: Users can add reactions to messages they can see
CREATE POLICY "users_add_reactions" ON public.message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id AND c.school_id = public.get_user_school_id(auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = (SELECT conversation_id FROM public.messages WHERE id = message_id)
      AND cp.user_id = auth.uid() AND cp.is_active = true
    )
  );

-- Message reactions: Users can remove their own reactions
CREATE POLICY "users_remove_own_reactions" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Message reads: Users can view read status for messages they can see
CREATE POLICY "users_view_reads" ON public.message_reads
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id AND c.school_id = public.get_user_school_id(auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = (SELECT conversation_id FROM public.messages WHERE id = message_id)
      AND cp.user_id = auth.uid() AND cp.is_active = true
    )
  );

-- Message reads: Users can mark messages as read
CREATE POLICY "users_mark_read" ON public.message_reads
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE m.id = message_id AND c.school_id = public.get_user_school_id(auth.uid())
    ) AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = (SELECT conversation_id FROM public.messages WHERE id = message_id)
      AND cp.user_id = auth.uid() AND cp.is_active = true
    )
  );

-- Storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/*', 'audio/*', 'video/*', 'application/pdf', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies for chat attachments
CREATE POLICY "users_upload_attachments" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text
  );

CREATE POLICY "users_download_attachments" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text
  );

CREATE POLICY "users_delete_attachments" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    (storage.foldername(name))[1] = public.get_user_school_id(auth.uid())::text
  );

-- Helper functions for chat system

-- Function to get conversation with participant info
CREATE OR REPLACE FUNCTION public.get_conversation_with_participants(conversation_uuid UUID)
RETURNS TABLE (
  id UUID,
  school_id UUID,
  type conversation_type,
  name TEXT,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_active BOOLEAN,
  participants JSONB
)
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    c.id,
    c.school_id,
    c.type,
    c.name,
    c.description,
    c.created_by,
    c.created_at,
    c.updated_at,
    c.is_active,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'user_id', p.user_id,
          'role', p.role,
          'joined_at', p.joined_at,
          'last_read_at', p.last_read_at,
          'is_active', p.is_active,
          'profile', jsonb_build_object(
            'full_name', pr.full_name,
            'phone', pr.phone
          )
        )
      ) FILTER (WHERE p.user_id IS NOT NULL),
      '[]'::jsonb
    ) as participants
  FROM public.conversations c
  LEFT JOIN public.conversation_participants p ON c.id = p.conversation_id AND p.is_active = true
  LEFT JOIN public.profiles pr ON p.user_id = pr.id
  WHERE c.id = conversation_uuid
  GROUP BY c.id, c.school_id, c.type, c.name, c.description, c.created_by, c.created_at, c.updated_at, c.is_active;
$$;

-- Function to get unread message count for user
CREATE OR REPLACE FUNCTION public.get_unread_message_count(user_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.messages m
  JOIN public.conversations c ON m.conversation_id = c.id
  JOIN public.conversation_participants cp ON c.id = cp.conversation_id
  LEFT JOIN public.message_reads mr ON m.id = mr.message_id AND mr.user_id = user_uuid
  WHERE cp.user_id = user_uuid
    AND cp.is_active = true
    AND c.is_active = true
    AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01'::timestamptz)
    AND mr.id IS NULL;
$$;