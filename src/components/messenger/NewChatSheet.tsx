import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Loader2 } from "lucide-react";
import { ChatService, type Conversation } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  full_name: string | null;
  mobile: string | null;
  role: string | null;
}

interface NewChatSheetProps {
  open: boolean;
  onClose: () => void;
  onStartChat: (conv: Conversation) => void;
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

const ROLE_BADGE: Record<string, string> = {
  teacher: "Teacher",
  admin: "Admin",
  master_admin: "Master Admin",
  principal: "Principal",
  student: "Student",
};

export function NewChatSheet({ open, onClose, onStartChat }: NewChatSheetProps) {
  const { user, role, school } = useAuth();
  const uid = user?.id ?? "";
  const schoolId = school?.id ?? "";
  const [search, setSearch] = useState("");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", schoolId, uid],
    queryFn: async (): Promise<Contact[]> => {
      if (!schoolId || !uid) return [];

      // Staff / admin / principal / teacher → list all school members
      if (role !== "student") {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, mobile, role")
          .eq("school_id", schoolId)
          .neq("id", uid);
        return data ?? [];
      }

      // Student → only assigned teacher + designated admin
      // This needs the staff_class_assignments or similar table.
      // For now: list all teachers + admins in school.
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, mobile, role")
        .eq("school_id", schoolId)
        .in("role", ["teacher", "admin", "master_admin"]);
      return data ?? [];
    },
    enabled: !!schoolId && !!uid,
  });

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (c.full_name ?? "").toLowerCase().includes(s) ||
      (c.mobile ?? "").includes(s) ||
      (c.role ?? "").toLowerCase().includes(s)
    );
  });

  const handleStartChat = async (contactId: string) => {
    try {
      const conv = await ChatService.getOrCreateDirectConversation(contactId);
      onStartChat(conv);
    } catch (e: any) {
      toast({ title: "Could not start chat", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="left" className="flex flex-col w-full sm:w-80 p-0">
        <SheetHeader className="px-6 py-4 border-b space-y-1">
          <SheetTitle className="text-lg">New Message</SheetTitle>
          <Input
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
          />
        </SheetHeader>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
              <User className="h-6 w-6 opacity-40" />
              <p>No contacts found</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleStartChat(contact.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left cursor-pointer"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
                      {getInitials(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {contact.full_name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_BADGE[contact.role ?? ""] ?? contact.role ?? ""}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
