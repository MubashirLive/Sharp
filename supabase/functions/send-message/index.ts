// supabase/functions/send-message/index.ts
// Deno Edge Function: handles send, delete, mark-read, create-conversation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://deno.land/x/supabase@v2.4.0/mod.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

    const body = await req.json();
    const { action } = body;

    // ── SEND MESSAGE ─────────────────────────────────────────────────────
    if (action === "send") {
      const { conversation_id, content, content_type = "text", media_url, media_bucket, media_name, media_size, meta } = body;

      if (!conversation_id) return new Response(JSON.stringify({ error: "conversation_id required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

      // Verify participant
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", conversation_id)
        .eq("profile_id", user.id)
        .single();

      if (!participant) return new Response(JSON.stringify({ error: "Not a participant" }), { status: 403, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

      const { data: msg, error } = await supabase
        .from("messages")
        .insert({
          conversation_id,
          sender_id: user.id,
          content: content || null,
          content_type,
          media_url: media_url || null,
          media_bucket: media_bucket || null,
          media_name: media_name || null,
          media_size: media_size || null,
          meta: meta || {},
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversation_id);

      // Mark read for sender
      await supabase.from("message_reads").upsert({
        message_id: msg.id,
        profile_id: user.id,
        read_at: new Date().toISOString(),
      }, { onConflict: "message_id,profile_id" });

      return new Response(JSON.stringify({ message_id: msg.id, sent_at: msg.sent_at }), {
        headers: { "Content-Type": "application/json", ...CORS_HEADERS }
      });
    }

    // ── DELETE MESSAGE ──────────────────────────────────────────────────
    if (action === "delete") {
      const { message_id } = body;
      if (!message_id) return new Response(JSON.stringify({ error: "message_id required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

      const { data: msg } = await supabase
        .from("messages")
        .select("sender_id, sent_at, conversation_id")
        .eq("id", message_id)
        .single();

      if (!msg) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

      const sentAt = new Date(msg.sent_at ?? Date.now());
      const diffMs = Date.now() - sentAt.getTime();

      const isAdmin = await supabase
        .from("conversation_participants")
        .select("id")
        .eq("conversation_id", msg.conversation_id)
        .eq("profile_id", user.id)
        .eq("role_in_chat", "admin")
        .single();

      if (msg.sender_id !== user.id && !isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      if (msg.sender_id === user.id && diffMs > 120_000) {
        return new Response(JSON.stringify({ error: "Delete window (2 min) has passed" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      const { error } = await supabase
        .from("messages")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", message_id);

      if (error) throw error;

      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }

    // ── MARK READ ────────────────────────────────────────────────────────
    if (action === "mark_read") {
      const { conversation_id, message_ids } = body;
      if (!conversation_id || !message_ids?.length) {
        return new Response(JSON.stringify({ error: "conversation_id and message_ids required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      const reads = message_ids.map((mid: string) => ({ message_id: mid, profile_id: user.id }));
      await supabase.from("message_reads").upsert(reads, { onConflict: "message_id,profile_id" });
      await supabase.from("conversation_reads").upsert({
        conversation_id,
        profile_id: user.id,
        last_read_at: new Date().toISOString(),
        last_read_msg: message_ids[message_ids.length - 1],
      }, { onConflict: "conversation_id,profile_id" });

      return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }

    // ── CREATE CONVERSATION ──────────────────────────────────────────────
    if (action === "create_conversation") {
      const { type, name, participant_ids, broadcast_scope, broadcast_class, broadcast_section } = body;

      if (!type || !participant_ids?.length) {
        return new Response(JSON.stringify({ error: "type and participant_ids required" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .single();

      if (!profile?.school_id) return new Response(JSON.stringify({ error: "No school" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({
          school_id: profile.school_id,
          type,
          name: name || null,
          broadcast_scope: broadcast_scope || null,
          broadcast_class: broadcast_class || null,
          broadcast_section: broadcast_section || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const participants = participant_ids.map((pid: string, i: number) => ({
        conversation_id: conv.id,
        profile_id: pid,
        role_in_chat: i === 0 ? "admin" : "member",
      }));

      const { error: pe } = await supabase.from("conversation_participants").insert(participants);
      if (pe) throw pe;

      return new Response(JSON.stringify({ id: conv.id }), { headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json", ...CORS_HEADERS } });
  }
});
