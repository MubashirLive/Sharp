import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatService } from "@/services/chatService";
import { cn } from "@/lib/utils";

export function ChatModal() {
  const { data: conversations = [] } = useQuery({
    queryKey: ["convs"],
    queryFn: ChatService.getConversations,
    staleTime: 15_000,
  });

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count ?? 0), 0);

  return (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="relative cursor-pointer"
      title="Messages"
    >
      <a href="/messenger">
        <MessageSquare className="h-5 w-5" />
        {totalUnread > 0 && (
          <div className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
            {totalUnread > 99 ? "99+" : totalUnread}
          </div>
        )}
      </a>
    </Button>
  );
}
