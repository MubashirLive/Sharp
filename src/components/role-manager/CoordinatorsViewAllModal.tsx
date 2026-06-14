import { useState } from "react";
import { Loader2, Plus, X, Crown, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { removeStaffFromWing, type WingWithStats } from "@/integrations/supabase/queries/wings";
import { toast } from "sonner";

interface CoordinatorsViewAllModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wing: WingWithStats | null;
  schoolId: string;
  canEdit: boolean;
}

export function CoordinatorsViewAllModal({
  open,
  onOpenChange,
  wing,
  schoolId,
  canEdit,
}: CoordinatorsViewAllModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  if (!wing) return null;

  const filteredCoordinators = searchQuery
    ? wing.coordinators.filter((c) =>
        c.staff_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : wing.coordinators;

  const handleRemove = async (staffId: string) => {
    setRemoving(staffId);
    try {
      const result = await removeStaffFromWing(wing.id, staffId);
      if (result.success) {
        toast.success("Coordinator removed");
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to remove");
      }
    } catch (e) {
      toast.error("Failed to remove coordinator");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            {wing.name} — Coordinators ({wing.coordinators.length})
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coordinators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
          </div>

          <ScrollArea className="h-[300px] rounded-md border p-2">
            {filteredCoordinators.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No coordinators found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCoordinators.map((coord) => (
                  <div
                    key={coord.id}
                    className="flex items-center justify-between p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border"
                  >
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-500" />
                      <div>
                        <div className="font-medium text-sm">{coord.staff_name}</div>
                        {coord.is_primary && (
                          <div className="text-xs text-amber-600 flex items-center gap-1">
                            ✨ Primary Coordinator
                          </div>
                        )}
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(coord.staff_id)}
                        disabled={removing === coord.staff_id}
                        className="text-destructive"
                      >
                        {removing === coord.staff_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}