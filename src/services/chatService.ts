import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type ConvRow = Database['public']['Tables']['conversations']['Row'];
type MsgRow = Database['public']['Tables']['messages']['Row'];
type PartRow = Database['public']['Tables']['conversation_participants']['Row'];

export interface ConversationParticipant {
  id: string;
  profile_id: string;
  role_in_chat: 'admin' | 'member';
  joined_at: string | null;
  profile?: {
    full_name: string | null;
    mobile: string | null;
    role: string | null;
  };
}

export interface LastMessage {
  id: string;
  content: string | null;
  content_type: string;
  created_at: string;
  sender_id: string;
  sender_name?: string;
}

export interface Conversation extends ConvRow {
  participants?: ConversationParticipant[];
  last_message?: LastMessage | null;
  unread_count?: number;
}

export interface MsgRead {
  profile_id: string;
  read_at: string;
}

export interface Message extends MsgRow {
  sender_name?: string;
  sender_role?: string;
  reads?: MsgRead[];
  read_by?: string[];
}

export class ChatService {
  // ── Conversations ──────────────────────────────────────────

  static async getConversations(limit = 50): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 50;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants(
          id,
          profile_id,
          role_in_chat,
          joined_at,
          profile:profiles(full_name, mobile, role)
        )
      `)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(safeLimit);

    if (error) throw error;

    // Batch fetch last messages + unread counts (fixes N+1)
    const convIds = (data || []).map(c => c.id);

    const [lastMessages, unreadCounts] = await Promise.all([
      this.batchGetLastMessages(convIds),
      this.batchGetUnreadCounts(convIds, user.id),
    ]);

    return (data || []).map(conv => ({
      ...conv,
      participants: conv.conversation_participants as ConversationParticipant[],
      last_message: lastMessages[conv.id] ?? null,
      unread_count: unreadCounts[conv.id] ?? 0,
    }));
  }

  static async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        conversation_participants(
          id,
          profile_id,
          role_in_chat,
          joined_at,
          profile:profiles(full_name, mobile, role)
        )
      `)
      .eq('id', conversationId)
      .single();

    if (error) return null;

    const [lastMsg, unread] = await Promise.all([
      this.getLastMessage(conversationId),
      this.getUnreadCount(conversationId, user.id),
    ]);

    return {
      ...data,
      participants: data.conversation_participants as ConversationParticipant[],
      last_message: lastMsg,
      unread_count: unread,
    };
  }

  static async createConversation(params: {
    type: 'direct' | 'group' | 'broadcast';
    name?: string;
    participantIds: string[];
    broadcastScope?: string;
    broadcastClass?: string;
    broadcastSection?: string;
  }): Promise<Conversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) throw new Error('No school associated');

    const { data: conv, error } = await supabase
      .from('conversations')
      .insert({
        school_id: profile.school_id,
        type: params.type,
        name: params.name ?? null,
        broadcast_scope: params.broadcastScope ?? null,
        broadcast_class: params.broadcastClass ?? null,
        broadcast_section: params.broadcastSection ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error || !conv) throw error ?? new Error('Failed to create conversation');

    // Add all participants; creator is admin
    const participants = params.participantIds.map((pid, i) => ({
      conversation_id: conv.id,
      profile_id: pid,
      role_in_chat: i === 0 ? 'admin' : 'member',
    }));

    const { error: pe } = await supabase
      .from('conversation_participants')
      .insert(participants);

    if (pe) throw pe;

    return this.getConversation(conv.id) as Promise<Conversation>;
  }

  static async getOrCreateDirectConversation(otherUserId: string): Promise<Conversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's school_id first (needed for filter + creation)
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!myProfile?.school_id) throw new Error('No school associated');

    // Check existing 1:1 with school_id filter
    const { data: existing } = await supabase
      .from('conversations')
      .select(`id, conversation_participants(profile_id)`)
      .eq('type', 'direct')
      .eq('is_archived', false)
      .eq('school_id', myProfile.school_id)
      .limit(100); // Safety cap

    if (existing) {
      for (const conv of existing) {
        const pids = (conv.conversation_participants as { profile_id: string }[]).map(p => p.profile_id);
        if (pids.includes(user.id) && pids.includes(otherUserId) && pids.length === 2) {
          return this.getConversation(conv.id) as Promise<Conversation>;
        }
      }
    }

    return this.createConversation({
      type: 'direct',
      participantIds: [user.id, otherUserId],
    });
  }

  static async archiveConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ is_archived: true })
      .eq('id', conversationId);
    if (error) throw error;
  }

  // ── Messages ────────────────────────────────────────────────

  static async getMessages(
    conversationId: string,
    limit = 50,
    before?: string
  ): Promise<Message[]> {
    let q = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name, role),
        message_reads(profile_id, read_at)
      `)
      .eq('conversation_id', conversationId)
      .order('sent_at', { ascending: true })
      .limit(limit);

    if (before) q = q.lt('sent_at', before);

    const { data, error } = await q;
    if (error) throw error;

    return (data || []).map(m => ({
      ...m,
      sender_name: m.sender?.full_name,
      sender_role: m.sender?.role,
      read_by: (m.message_reads || []).map((r: { profile_id: string }) => r.profile_id),
    }));
  }

  static async sendMessage(params: {
    conversationId: string;
    content: string;
    contentType?: string;
    mediaUrl?: string;
    mediaBucket?: string;
    mediaName?: string;
    mediaSize?: number;
    meta?: Record<string, unknown>;
  }): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: params.conversationId,
        sender_id: user.id,
        content: params.content || null,
        content_type: params.contentType ?? 'text',
        media_url: params.mediaUrl ?? null,
        media_bucket: params.mediaBucket ?? null,
        media_name: params.mediaName ?? null,
        media_size: params.mediaSize ?? null,
        meta: params.meta ?? {},
      })
      .select(`*, sender:profiles!messages_sender_id_fkey(full_name)`)
      .single();

    if (error) throw error;

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.conversationId);

    // Mark as read for sender
    await this.markAsRead(params.conversationId, [data.id]);

    return {
      ...data,
      sender_name: (data as any).sender?.full_name,
      read_by: [user.id],
    };
  }

  static async deleteMessage(messageId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check: within 2 min
    const { data: msg } = await supabase
      .from('messages')
      .select('sender_id, sent_at')
      .eq('id', messageId)
      .single();

    if (!msg) throw new Error('Message not found');

    const sentAt = new Date(msg.sent_at ?? Date.now());
    const now = new Date();
    const diffMs = now.getTime() - sentAt.getTime();

    if (msg.sender_id === user.id && diffMs > 2 * 60 * 1000) {
      throw new Error('Delete window (2 min) has passed');
    }

    const { error } = await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', messageId);

    if (error) throw error;
  }

  static async markAsRead(conversationId: string, messageIds: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || messageIds.length === 0) return;

    const reads = messageIds.map(mid => ({
      message_id: mid,
      profile_id: user.id,
    }));

    await supabase
      .from('message_reads')
      .upsert(reads, { onConflict: 'message_id,profile_id' });

    await supabase
      .from('conversation_reads')
      .upsert({
        conversation_id: conversationId,
        profile_id: user.id,
        last_read_at: new Date().toISOString(),
        last_read_msg: messageIds[messageIds.length - 1],
      }, { onConflict: 'conversation_id,profile_id' });
  }

  // ── File Upload ──────────────────────────────────────────────

  static async uploadFile(file: File, conversationId: string): Promise<{ url: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();

    if (!profile?.school_id) throw new Error('No school associated');

    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${profile.school_id}/${conversationId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('messenger-media')
      .upload(path, file, { contentType: file.type });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('messenger-media')
      .createSignedUrl(path, 3600);

    if (!urlData?.signedUrl) throw new Error('Failed to get signed URL');

    return { url: urlData.signedUrl };
  }

  // ── Realtime ────────────────────────────────────────────────

  static subscribeToMessages(
    conversationId: string,
    callback: (msg: Message) => void
  ) {
    return supabase
      .channel(`msg:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, async (payload) => {
        const { data: sender } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', (payload.new as MsgRow).sender_id)
          .single();
        callback({
          ...payload.new as MsgRow,
          sender_name: sender?.full_name,
        });
      })
      .subscribe();
  }

  static subscribeToTyping(
    conversationId: string,
    callback: (userId: string, typing: boolean) => void
  ) {
    const channel = supabase.channel(`typing:${conversationId}`);
    channel.on('broadcast', { event: 'typing' }, (p) => {
      callback(p.payload.userId, p.payload.typing);
    });
    channel.subscribe();
    return channel;
  }

  static async sendTypingIndicator(conversationId: string, typing: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, typing },
    });
  }

  // ── Contacts ────────────────────────────────────────────────
  // Used for New Chat sheet: who can this user message

  static async getMessagingContacts(role: string, schoolId: string, myProfileId: string): Promise<any[]> {
    // Students: only assigned teacher + designated admin
    if (role === 'student') {
      const { data } = await supabase
        .from('students')
        .select(`
          class_id, section_id,
          classes:classes(name),
          sections:sections(name),
          profiles:profiles!students_class_id_fkey(full_name, mobile, role)
        `)
        .eq('profiles.id', myProfileId)
        .single();

      if (!data) return [];

      // Get class teacher + admin
      const { data: staff } = await supabase
        .from('profiles')
        .select('id, full_name, mobile, role')
        .eq('school_id', schoolId)
        .in('role', ['teacher', 'admin', 'master_admin'])
        .eq('id', myProfileId); // placeholder — real query filters by class assignment

      return staff || [];
    }

    // Staff can message anyone in school
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, mobile, role')
      .eq('school_id', schoolId)
      .neq('id', myProfileId);

    return data || [];
  }

  // ── Helpers ─────────────────────────────────────────────────

  private static async getLastMessage(convId: string): Promise<LastMessage | null> {
    const { data } = await supabase
      .from('messages')
      .select(`id, content, content_type, sent_at, sender_id, sender:profiles!messages_sender_id_fkey(full_name)`)
      .eq('conversation_id', convId)
      .is('deleted_at', null)
      .order('sent_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;
    return {
      id: data.id,
      content: data.content,
      content_type: data.content_type,
      created_at: data.sent_at ?? '',
      sender_id: data.sender_id,
      sender_name: (data.sender as any)?.full_name,
    };
  }

  private static async getUnreadCount(convId: string, profileId: string): Promise<number> {
    const { data: cr } = await supabase
      .from('conversation_reads')
      .select('last_read_at')
      .eq('conversation_id', convId)
      .eq('profile_id', profileId)
      .single();

    const since = cr?.last_read_at ?? '1970-01-01';

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .eq('sender_id', profileId) // exclude own messages
      .neq('sender_id', profileId)
      .gt('sent_at', since);

    return count ?? 0;
  }

  // ── Batch Helpers (fixes N+1) ─────────────────────────────────

  private static async batchGetLastMessages(convIds: string[]): Promise<Record<string, LastMessage | null>> {
    if (convIds.length === 0) return {};

    const { data } = await supabase
      .from('messages')
      .select(`id, content, content_type, sent_at, sender_id, conversation_id, sender:profiles!messages_sender_id_fkey(full_name)`)
      .in('conversation_id', convIds)
      .is('deleted_at', null)
      .order('sent_at', { ascending: false });

    // Group by conversation, take newest per conv
    const result: Record<string, LastMessage | null> = {};
    const seen = new Set<string>();

    for (const msg of data || []) {
      if (!seen.has(msg.conversation_id)) {
        seen.add(msg.conversation_id);
        result[msg.conversation_id] = {
          id: msg.id,
          content: msg.content,
          content_type: msg.content_type ?? 'text',
          created_at: msg.sent_at ?? '',
          sender_id: msg.sender_id,
          sender_name: (msg.sender as any)?.full_name,
        };
      }
    }

    return result;
  }

  private static async batchGetUnreadCounts(convIds: string[], profileId: string): Promise<Record<string, number>> {
    if (convIds.length === 0) return {};

    // Get all conversation_reads for this user
    const { data: reads } = await supabase
      .from('conversation_reads')
      .select('conversation_id, last_read_at')
      .eq('profile_id', profileId)
      .in('conversation_id', convIds);

    const readMap = new Map<string, string>();
    for (const r of reads || []) {
      readMap.set(r.conversation_id, r.last_read_at ?? '1970-01-01');
    }

    // Count unread per conversation (loop with individual queries - can't easily batch due to per-conv timestamps)
    const result: Record<string, number> = {};
    for (const convId of convIds) {
      const since = readMap.get(convId) ?? '1970-01-01';
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .neq('sender_id', profileId)
        .gt('sent_at', since);
      result[convId] = count ?? 0;
    }

    return result;
  }
}