import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio, Loader2, Users, BookOpen, GraduationCap, ChevronDown } from "lucide-react";
import { ChatService } from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CreateBroadcastSheetProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type BroadcastScope = "school" | "class" | "section";

export function CreateBroadcastSheet({ open, onClose, onCreated }: CreateBroadcastSheetProps) {
  const { user, role, school } = useAuth();
  const uid = user?.id ?? "";
  const schoolId = school?.id ?? "";
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<BroadcastScope>("school");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [step, setStep] = useState<"compose" | "preview">("compose");

  const { data: classes = [] } = useQuery({
    queryKey: ["broadcast-classes", schoolId],
    queryFn: async () => {
      if (!schoolId) return [];
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .eq("school_id", schoolId);
      return data ?? [];
    },
    enabled: !!schoolId,
  });

  const { data: sections = [] } = useQuery({
    queryKey: ["broadcast-sections", schoolId, selectedClassId],
    queryFn: async () => {
      if (!schoolId || !selectedClassId) return [];
      const { data } = await supabase
        .from("sections")
        .select("id, name, class_id")
        .eq("school_id", schoolId)
        .eq("class_id", selectedClassId);
      return data ?? [];
    },
    enabled: !!schoolId && !!selectedClassId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["broadcast-students", schoolId, selectedSectionId],
    queryFn: async () => {
      if (!schoolId || !selectedSectionId) return [];
      const { data } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("school_id", schoolId)
        .eq("section_id", selectedSectionId);
      return data ?? [];
    },
    enabled: !!schoolId && !!selectedSectionId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      // Gather recipient IDs
      let recipientIds: string[] = [];

      if (scope === "school") {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("school_id", schoolId);
        recipientIds = (data ?? []).map((p: any) => p.id);
      } else if (scope === "section" && selectedSectionId) {
        const { data } = await supabase
          .from("students")
          .select("id, profiles:profile_id(id)")
          .eq("school_id", schoolId)
          .eq("section_id", selectedSectionId);
        recipientIds = (data ?? []).map((s: any) => s.profiles?.id ?? s.id).filter(Boolean);
      } else if (scope === "class" && selectedClassId) {
        const { data } = await supabase
          .from("students")
          .select("id")
          .eq("school_id", schoolId)
          .eq("class_id", selectedClassId);
        recipientIds = (data ?? []).map((s: any) => s.id);
      }

      const conv = await ChatService.createConversation({
        type: "broadcast",
        name: name.trim() || "Broadcast",
        participantIds: [uid, ...recipientIds],
        broadcastScope: scope,
        broadcastClass: selectedClassId || undefined,
        broadcastSection: selectedSectionId || undefined,
      });

      await ChatService.sendMessage({
        conversationId: conv.id,
        content: message.trim(),
        contentType: "broadcast",
        meta: { scope, broadcast_name: name.trim() },
      });

      return conv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["convs"] });
      toast({ title: "Broadcast sent" });
      setName("");
      setMessage("");
      setScope("school");
      setSelectedClassId("");
      setSelectedSectionId("");
      setStep("compose");
      onCreated();
    },
    onError: (e: any) => {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    },
  });

  const recipientCount =
    scope === "school"
      ? "All staff & students"
      : scope === "class"
      ? students.length > 0 ? `${students.length} students` : "Select a class"
      : students.length > 0 ? `${students.length} students` : "Select a section";

  const canSend =
    message.trim().length > 0 && !createMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex flex-col w-full sm:w-[520px] p-0">
        <SheetHeader className="px-6 py-4 border-b space-y-1">
          <SheetTitle className="text-lg flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            New Broadcast
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            One-way message — recipients cannot see each other. Their replies create private threads.
          </p>
        </SheetHeader>

        {step === "compose" ? (
          <>
            <div className="px-6 py-4 space-y-4 border-b">
              <div className="space-y-1.5">
                <Label className="text-sm">Broadcast name (optional)</Label>
                <Input
                  placeholder="e.g. Summer Vacation Notice"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Send to</Label>
                <RadioGroup value={scope} onValueChange={(v) => setScope(v as BroadcastScope)}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="school" id="scope-school" />
                    <Label htmlFor="scope-school" className="flex items-center gap-2 text-sm cursor-pointer">
                      <Users className="h-4 w-4" /> Entire school
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="class" id="scope-class" />
                    <Label htmlFor="scope-class" className="flex items-center gap-2 text-sm cursor-pointer">
                      <GraduationCap className="h-4 w-4" /> By class
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="section" id="scope-section" />
                    <Label htmlFor="scope-section" className="flex items-center gap-2 text-sm cursor-pointer">
                      <BookOpen className="h-4 w-4" /> By section
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {(scope === "class" || scope === "section") && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Class</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      value={selectedClassId}
                      onChange={(e) => {
                        setSelectedClassId(e.target.value);
                        setSelectedSectionId("");
                      }}
                    >
                      <option value="">Select class</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  {scope === "section" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Section</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                        value={selectedSectionId}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                      >
                        <option value="">Select section</option>
                        {sections.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
                <Radio className="h-4 w-4" />
                {recipientCount} will receive this broadcast
              </div>
            </div>

            <div className="flex-1 px-6 py-4">
              <Label className="text-sm mb-1.5 block">Message</Label>
              <Textarea
                placeholder="Write your broadcast message here…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[160px] text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length} characters
              </p>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} className="cursor-pointer">
                Cancel
              </Button>
              <Button
                onClick={() => setStep("preview")}
                disabled={!canSend}
                className="cursor-pointer"
              >
                Preview & Send
              </Button>
            </div>
          </>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="space-y-4">
                <div className="rounded-xl border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">Broadcast name</p>
                  <p className="font-medium">{name || "Unnamed Broadcast"}</p>
                </div>
                <div className="rounded-xl border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">Recipients</p>
                  <p className="font-medium">{recipientCount}</p>
                </div>
                <div className="rounded-xl border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">Message</p>
                  <p className="text-sm whitespace-pre-wrap">{message}</p>
                </div>
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
                  <Radio className="h-4 w-4 inline mr-1" />
                  Replies from students will create private threads — they cannot see each other's replies.
                </div>
              </div>
            </ScrollArea>
            <div className="px-6 py-4 border-t flex justify-between gap-3">
              <Button variant="outline" onClick={() => setStep("compose")} className="cursor-pointer">
                Edit
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!canSend}
                className="cursor-pointer"
              >
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Broadcast
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
