-- ============================================================
-- SHARP Messenger — Auto-groups trigger
-- Creates class+section and class+subject groups automatically
-- ============================================================

create or replace function public.create_class_section_group(p_class_id uuid, p_section_id uuid, p_school_id uuid)
returns uuid as $$
declare
  v_conv_id uuid;
  v_class_name text;
  v_section_name text;
  v_group_name text;
  v_creator_id uuid;
begin
  select c.name, s.name into v_class_name, v_section_name
  from public.classes c
  join public.sections s on s.id = p_section_id
  where c.id = p_class_id and s.id = p_section_id;

  v_group_name := v_class_name || ' ' || v_section_name;

  -- Find class teacher
  select p.id into v_creator_id
  from public.profiles p
  join public.staff_class_assignments sca on sca.profile_id = p.id
  where sca.class_id = p_class_id
    and sca.section_id = p_section_id
    and sca.is_class_teacher = true
  limit 1;

  if v_creator_id is null then
    select p.id into v_creator_id
    from public.profiles p
    where p.school_id = p_school_id
    and p.role = 'principal'
    limit 1;
  end if;

  -- Check if group already exists
  select id into v_conv_id
  from public.conversations
  where school_id = p_school_id
    and type = 'group'
    and broadcast_class = p_class_id
    and broadcast_section = p_section_id;

  if v_conv_id is not null then
    return v_conv_id;
  end if;

  insert into public.conversations (school_id, type, name, broadcast_scope, broadcast_class, broadcast_section, created_by)
  values (p_school_id, 'group', v_group_name, 'section', p_class_id, p_section_id, v_creator_id)
  returning id into v_conv_id;

  -- Add all students in this section
  insert into public.conversation_participants (conversation_id, profile_id, role_in_chat)
  select v_conv_id, s.profile_id, 'member'
  from public.student_profiles s
  where s.class_id = p_class_id and s.section_id = p_section_id
  on conflict do nothing;

  -- Add class teacher as admin
  if v_creator_id is not null then
    insert into public.conversation_participants (conversation_id, profile_id, role_in_chat)
    values (v_conv_id, v_creator_id, 'admin')
    on conflict do nothing;
  end if;

  return v_conv_id;
end;
$$ language plpgsql security definer;
