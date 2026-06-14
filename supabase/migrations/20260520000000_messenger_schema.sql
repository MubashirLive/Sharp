-- ============================================================
-- SHARP Messenger — Core Schema
-- Phase 1 MVP: conversations, messages, participants, reads
-- ============================================================

-- Conversations: direct (1:1), group, or broadcast
create table if not exists public.conversations (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  type             text not null check (type in ('direct', 'group', 'broadcast')),
  name             text,           -- display name (null for direct chats)
  avatar_url       text,

  -- Broadcast scope (null for non-broadcast)
  broadcast_scope  text check (broadcast_scope in ('school', 'class', 'section', 'subject', 'custom')),
  broadcast_class  uuid references public.classes(id),
  broadcast_section uuid references public.sections(id),

  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  is_archived      boolean default false
);

-- Participants: who can see / send in a conversation
create table if not exists public.conversation_participants (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  role_in_chat    text not null default 'member' check (role_in_chat in ('admin', 'member')),
  joined_at       timestamptz default now(),
  unique(conversation_id, profile_id)
);

-- Messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,

  content         text,          -- null for media-only messages
  content_type    text not null default 'text'
                  check (content_type in (
                    'text','image','pdf',
                    'homework_assign','homework_submit','homework_review',
                    'attendance_alert','calendar_event','broadcast'
                  )),

  -- Media
  media_url       text,
  media_bucket    text,
  media_name      text,
  media_size      integer,

  -- Structured message meta
  meta            jsonb default '{}',

  sent_at         timestamptz default now(),
  deleted_at      timestamptz,   -- soft delete; kept for audit
  edited_at       timestamptz
);

-- Read receipts per message
create table if not exists public.message_reads (
  id         uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  read_at    timestamptz default now(),
  unique(message_id, profile_id)
);

-- Per-conversation read cursor
create table if not exists public.conversation_reads (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  last_read_at    timestamptz default '1970-1-1',
  last_read_msg   uuid references public.messages(id),
  unique(conversation_id, profile_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists messages_conversation_idx  on public.messages(conversation_id, sent_at desc);
create index if not exists messages_sender_idx        on public.messages(sender_id);
create index if not exists participants_profile_idx  on public.conversation_participants(profile_id);
create index if not exists participants_conv_idx     on public.conversation_participants(conversation_id);
create index if not exists message_reads_msg_idx      on public.message_reads(message_id);
create index if not exists conversation_reads_idx     on public.conversation_reads(profile_id, conversation_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.conversations          enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages              enable row level security;
alter table public.message_reads         enable row level security;
alter table public.conversation_reads     enable row level security;

-- Conversations: only participants can see
create policy "participants_read_conversations"
  on public.conversations for select
  using (
    id in (
      select conversation_id from public.conversation_participants
      where profile_id = auth.uid()
    )
  );

create policy "participants_insert_conversations"
  on public.conversations for insert
  with check (created_by = auth.uid());

create policy "admins_update_conversations"
  on public.conversations for update
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = id
        and profile_id = auth.uid()
        and role_in_chat = 'admin'
    )
  );

-- Participants: only self or school admin
create policy "participants_read"
  on public.conversation_participants for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = parent.conversation_id
        and profile_id = auth.uid()
    )
  );

create policy "participants_insert"
  on public.conversation_participants for insert
  with check (profile_id = auth.uid());

create policy "admin_remove_participant"
  on public.conversation_participants for delete
  using (
    exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_id
        and cp.profile_id = auth.uid()
        and cp.role_in_chat = 'admin'
    )
  );

-- Messages: participant read + insert
create policy "participants_read_messages"
  on public.messages for select
  using (
    conversation_id in (
      select conversation_id from public.conversation_participants
      where profile_id = auth.uid()
    )
  );

create policy "participants_send_messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and conversation_id in (
      select conversation_id from public.conversation_participants
      where profile_id = auth.uid()
    )
  );

-- Soft delete: sender within 2 min OR chat admin (no time limit)
create policy "delete_own_message_within_2min"
  on public.messages for update
  using (
    sender_id = auth.uid()
    or exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
        and profile_id = auth.uid()
        and role_in_chat = 'admin'
    )
  )
  with check (
    deleted_at is null
    or (
      deleted_at > sent_at + interval '2 minutes'
      and sender_id = auth.uid()
    )
    or exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id
        and profile_id = auth.uid()
        and role_in_chat = 'admin'
    )
  );

-- message_reads
create policy "participants_read_reads"
  on public.message_reads for select
  using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id in (
        select conversation_id from public.messages where id = message_id
      )
      and profile_id = auth.uid()
    )
  );

create policy "participants_insert_reads"
  on public.message_reads for insert
  with check (profile_id = auth.uid());

create policy "participants_update_reads"
  on public.message_reads for update
  using (profile_id = auth.uid());

-- conversation_reads
create policy "participants_manage_reads"
  on public.conversation_reads for all
  using (profile_id = auth.uid());

-- ============================================================
-- UPDATED_AT trigger
-- ============================================================
create or replace function public.conversation_updated_at()
returns trigger as $$
begin
  update public.conversations set updated_at = now() where id = NEW.id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger conversations_updated_at
  after insert or update on public.messages
  for each row execute procedure public.conversation_updated_at();