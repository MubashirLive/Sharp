import { useState } from "react";
import {
  Paperclip, Search, Users, Radio, Loader2, UsersRound,
} from "lucide-react";
import { ChatService, type Conversation } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ChatWindow } from "./ChatWindow";
import { NewChatSheet } from "./NewChatSheet";
import { CreateGroupSheet } from "./CreateGroupSheet";
import { CreateBroadcastSheet } from "./CreateBroadcastSheet";

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatConvTime(ts?: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 86_400_000;
  if (diffH < 1) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  if (diffH < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getDisplayName(conv: Conversation) {
  if (conv.name) return conv.name;
  const other = conv.participants?.find((p) => p.profile?.full_name);
  return other?.profile?.full_name ?? "Unknown";
}

function ConvItem({
  conv,
  selected,
  onClick,
}: {
  conv: Conversation;
  selected: boolean;
  onClick: () => void;
}) {
  const displayName = getDisplayName(conv);
  const isBroadcast = conv.type === "broadcast";
  const unread = conv.unread_count ?? 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors hover:bg-muted/50 border-b cursor-pointer",
        selected && "bg-muted/70"
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        {unread > 0 && (
          <div className="absolute -top-1 -right-1 h-5 min-w-[20px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("font-medium text-sm truncate", unread > 0 && "font-semibold")}>
            {displayName}
          </p>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatConvTime(conv.updated_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">
            {conv.last_message?.content
              ? conv.last_message.content
              : conv.last_message?.media_url
              ? "📎 Attachment"
              : "No messages yet"}
          </p>
          <div className="flex gap-1 shrink-0">
            {isBroadcast && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Radio className="h-3 w-3 mr-0.5" />
                Broadcast
              </Badge>
            )}
            {conv.type === "group" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                <UsersRound className="h-3 w-3 mr-0.5" />
                Group
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Content (shared between full page + side panel) ────────────────────────

export function MessengerPanelContent({ onClose }: { onClose?: () => void }) {
  const { role } = useAuth();
  const [tab, setTab] = useState("all");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [search, setSearch] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateBroadcast, setShowCreateBroadcast] = useState(false);

  const { data: conversations = [], isLoading: convsLoading, refetch } = useQuery({
    queryKey: ["convs"],
    queryFn: ChatService.getConversations,
    staleTime: 15_000,
  });

  const filtered = conversations.filter((c) => {
    const matchesTab =
      tab === "all" ||
      (tab === "dms" && c.type === "direct") ||
      (tab === "groups" && c.type === "group") ||
      (tab === "broadcasts" && c.type === "broadcast");
    if (!matchesTab) return false;
    if (!search) return true;
    const name = getDisplayName(c).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleCreated = () => {
    setShowCreateGroup(false);
    setShowCreateBroadcast(false);
    refetch();
  };

  const canCreateGroup = role === "principal" || role === "master_admin" || role === "admin";
  const canCreateBroadcast = role === "principal" || role === "master_admin" || role === "admin";

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r shrink-0",
          selectedConv ? "hidden sm:flex sm:w-72" : "flex w-full sm:w-80"
        )}
      >
        <div className="border-b px-4 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Messages</h2>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 cursor-pointer"
              onClick={() => setShowNewChat(true)}
              title="New message"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          <Input
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full grid grid-cols-4 h-8 bg-muted/50">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="dms" className="text-xs">DMs</TabsTrigger>
              <TabsTrigger value="groups" className="text-xs">Groups</TabsTrigger>
              <TabsTrigger value="broadcasts" className="text-xs">Broad.</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {convsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground text-sm">
              <Users className="h-8 w-8 opacity-40" />
              <p>No conversations</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                selected={selectedConv?.id === conv.id}
                onClick={() => setSelectedConv(conv)}
              />
            ))
          )}
        </ScrollArea>

        {(canCreateGroup || canCreateBroadcast) && (
          <div className="border-t px-3 py-2 flex gap-2">
            {canCreateGroup && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 cursor-pointer"
                onClick={() => setShowCreateGroup(true)}
              >
                <Users className="h-3 w-3 mr-1" />
                Group
              </Button>
            )}
            {canCreateBroadcast && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 cursor-pointer"
                onClick={() => setShowCreateBroadcast(true)}
              >
                <Radio className="h-3 w-3 mr-1" />
                Broadcast
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          !selectedConv && "hidden sm:flex"
        )}
      >
        {selectedConv ? (
          <ChatWindow
            conversation={selectedConv}
            onBack={() => setSelectedConv(null)}
            onClose={onClose}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <Users className="h-14 w-14 opacity-20 mb-3" />
            <p className="text-sm">Select a conversation</p>
            <p className="text-xs mt-1">or start a new one</p>
          </div>
        )}
      </div>

      <NewChatSheet
        open={showNewChat}
        onClose={() => setShowNewChat(false)}
        onStartChat={(conv) => {
          setSelectedConv(conv);
          setShowNewChat(false);
        }}
      />
      <CreateGroupSheet
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreated={handleCreated}
      />
      <CreateBroadcastSheet
        open={showCreateBroadcast}
        onClose={() => setShowCreateBroadcast(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
