import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Loader2, X, Plus } from "lucide-react";
import { ChatService } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  full_name: string | null;
  role: string | null;
}

interface CreateGroupSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function getInitials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function CreateGroupSheet({ open, onClose, onCreated }: CreateGroupSheetProps) {
  const { user, role, school } = useAuth();
  const uid = user?.id ?? "";
  const schoolId = school?.id ?? "";
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", schoolId, uid],
    queryFn: async (): Promise<Contact[]> => {
      if (!schoolId || !uid) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("school_id", schoolId)
        .neq("id", uid);
      return data ?? [];
    },
    enabled: !!schoolId && !!uid,
  });

  const filtered = contacts.filter(c =>
    !search || (c.full_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const createMutation = useMutation({
    mutationFn: () =>
      ChatService.createConversation({
        type: "group",
        name: name.trim(),
        participantIds: [uid, ...selected],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convs"] });
      toast({ title: "Group created" });
      setName("");
      setSelected([]);
      onCreated();
    },
    onError: (e: any) => {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    },
  });

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const canSubmit = name.trim().length > 0 && selected.length > 0 && !createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col w-full sm:w-[480px] p-0">
        <SheetHeader className="px-6 py-4 border-b space-y-1">
          <SheetTitle className="text-lg">Create Group</SheetTitle>
          <Input
            placeholder="Group name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
        </SheetHeader>

        <div className="px-6 py-3 border-b">
          <Label className="text-xs text-muted-foreground">Add members</Label>
          <Input
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm mt-1.5"
          />
        </div>

        {/* Selected members */}
        {selected.length > 0 && (
          <div className="px-6 py-2 flex flex-wrap gap-2 border-b">
            {selected.map(id => {
              const c = contacts.find(x => x.id === id);
              return (
                <div key={id} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                  <span>{c?.full_name ?? id}</span>
                  <button onClick={() => toggle(id)} className="cursor-pointer">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filtered.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => toggle(contact.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer",
                    selected.includes(contact.id)
                      ? "bg-primary/10"
                      : "hover:bg-muted/60"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs font-semibold bg-gradient-primary text-primary-foreground">
                      {getInitials(contact.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contact.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{contact.role ?? ""}</p>
                  </div>
                  {selected.includes(contact.id) && (
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                      <Plus className="h-3 w-3 rotate-45" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canSubmit}
            className="cursor-pointer"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Group
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
