import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Send, Paperclip, X, MoreHorizontal, FileText, CheckCheck, Loader2, Users,
} from "lucide-react";
import { ChatService, type Conversation, type Message } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatMsgTime(ts?: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function getDisplayName(conv: Conversation) {
  if (conv.name) return conv.name;
  const other = conv.participants?.find((p) => p.profile?.full_name);
  return other?.profile?.full_name ?? "Unknown";
}

function canDelete(msg: Message, uid: string, isAdmin: boolean) {
  if (msg.deleted_at) return false;
  if (msg.sender_id === uid) return true;
  return isAdmin;
}

function MsgBubble({
  msg,
  currentUid,
  isAdmin,
  onDelete,
  onImageClick,
}: {
  msg: Message;
  currentUid: string;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onImageClick: (url: string) => void;
}) {
  const isMine = msg.sender_id === currentUid;
  const diffMs = Date.now() - new Date(msg.sent_at ?? 0).getTime();
  const canDeleteNow = canDelete(msg, currentUid, isAdmin) && diffMs < 120_000;
  const allRead = msg.read_by?.filter((id) => id !== currentUid).length ?? 0;

  if (msg.deleted_at) {
    return (
      <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
        <div className="px-3 py-2 rounded-lg bg-muted/40 text-xs italic text-muted-foreground max-w-xs">
          Message deleted
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
      {!isMine && (
        <Avatar className="h-8 w-8 mt-1 shrink-0">
          <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
            {getInitials(msg.sender_name)}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
        {!isMine && msg.sender_name && (
          <span className="text-xs text-muted-foreground mb-0.5 ml-1">{msg.sender_name}</span>
        )}
        <div
          className={cn(
            "px-3 py-2 rounded-xl text-sm max-w-xs break-words relative group",
            isMine
              ? "bg-gradient-primary text-primary-foreground rounded-br-none"
              : "bg-muted text-foreground rounded-bl-none"
          )}
        >
          {msg.content_type === "image" && msg.media_url && (
            <img
              src={msg.media_url}
              alt="image"
              loading="lazy"
              decoding="async"
              className="max-w-[220px] rounded-md cursor-pointer mb-1"
              onClick={() => onImageClick(msg.media_url!)}
            />
          )}
          {msg.content_type === "pdf" && msg.media_url && (
            <a
              href={msg.media_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs underline"
            >
              <FileText className="h-4 w-4" />
              {msg.media_name ?? "Document"}
            </a>
          )}
          {msg.content && <span>{msg.content}</span>}
          {canDeleteNow && (
            <button
              onClick={() => onDelete(msg.id)}
              className="absolute -top-3 -right-1 h-5 w-5 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete (2 min window)"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className={cn("flex items-center gap-1 mt-0.5 px-1", isMine ? "flex-row-reverse" : "flex-row")}>
          <span className="text-[10px] text-muted-foreground">{formatMsgTime(msg.sent_at)}</span>
          {isMine && (
            allRead > 0
              ? <CheckCheck className="h-3 w-3 text-blue-500" />
              : <CheckCheck className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Chat Window ────────────────────────────────────────────────────────────

export function ChatWindow({
  conversation,
  onBack,
  onClose,
}: {
  conversation: Conversation;
  onBack: () => void;
  onClose?: () => void;
}) {
  const { user, role } = useAuth();
  const uid = user?.id ?? "";
  const isAdmin = role === "principal" || role === "master_admin";

  const [input, setInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const isGroupOrBroadcast = conversation.type !== "direct";
  const displayName = getDisplayName(conversation);
  const participants = conversation.participants ?? [];

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["msgs", conversation.id],
    queryFn: () => ChatService.getMessages(conversation.id, 100),
    staleTime: 30_000,
  });

  useEffect(() => {
    const sub = ChatService.subscribeToMessages(conversation.id, (msg) => {
      queryClient.setQueryData<Message[]>(["msgs", conversation.id], (old) =>
        old ? [...old, msg] : [msg]
      );
      queryClient.invalidateQueries({ queryKey: ["convs"] });
    });
    return () => {
      sub.unsubscribe();
    };
  }, [conversation.id, queryClient]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      const unreadIds = messages
        .filter((m) => !m.read_by?.includes(uid) && m.sender_id !== uid)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        ChatService.markAsRead(conversation.id, unreadIds);
      }
    }
  }, [messages.length, uid, conversation.id, messages]);

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return;
    setSending(true);
    try {
      let mediaUrl: string | undefined;
      let mediaBucket: string | undefined;
      let mediaName: string | undefined;
      let mediaSize: number | undefined;
      let contentType = "text";

      if (selectedFile) {
        const uploaded = await ChatService.uploadFile(selectedFile, conversation.id);
        mediaUrl = uploaded.url;
        mediaBucket = "messenger-media";
        mediaName = selectedFile.name;
        mediaSize = selectedFile.size;
        contentType = selectedFile.type.startsWith("image/") ? "image" : "pdf";
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setSelectedFile(null);
      }

      await ChatService.sendMessage({
        conversationId: conversation.id,
        content: input.trim(),
        contentType,
        mediaUrl,
        mediaBucket,
        mediaName,
        mediaSize,
      });
      setInput("");
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ChatService.deleteMessage(id);
      queryClient.invalidateQueries({ queryKey: ["msgs", conversation.id] });
    } catch (e: any) {
      toast({ title: "Cannot delete", description: e.message, variant: "destructive" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 cursor-pointer sm:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-sm truncate">{displayName}</h2>
          <p className="text-xs text-muted-foreground">
            {isGroupOrBroadcast
              ? `${participants.length} members`
              : participants.find((p) => p.profile_id !== uid)?.profile?.role ?? ""}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 cursor-pointer">
          <MoreHorizontal className="h-5 w-5" />
        </Button>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 cursor-pointer sm:hidden"
            onClick={onClose}
            title="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No messages yet. Say hi!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MsgBubble
                key={msg.id}
                msg={msg}
                currentUid={uid}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onImageClick={setLightboxUrl}
              />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {previewUrl && selectedFile && (
        <div className="border-t px-4 py-2 flex items-center gap-3 shrink-0">
          <img src={previewUrl} alt="preview" className="h-16 w-16 object-cover rounded-md border" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 cursor-pointer"
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="border-t p-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 cursor-pointer"
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            title="Attach image / PDF"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 h-9 text-sm"
            disabled={sending}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90 cursor-pointer"
            onClick={handleSend}
            disabled={(!input.trim() && !selectedFile) || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {lightboxUrl && (
        <Dialog open onOpenChange={() => setLightboxUrl(null)}>
          <DialogContent className="max-w-3xl p-0">
            <img src={lightboxUrl} alt="preview" className="w-full h-auto" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
