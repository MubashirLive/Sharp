import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getWingsAuditLog } from "@/integrations/supabase/queries/wings";
import type { WingAuditLog } from "@/integrations/supabase/queries/wings";

interface WingLogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  wingFilter?: string; // wing_id filter
  wingName?: string;
}

export function WingLogPanel({ open, onOpenChange, schoolId, wingFilter, wingName }: WingLogPanelProps) {
  const [logs, setLogs] = useState<WingAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && schoolId) {
      setLoading(true);
      getWingsAuditLog(schoolId, wingFilter).then((data) => {
        setLogs(data);
        setLoading(false);
      });
    }
  }, [open, schoolId, wingFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.user_name?.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.what?.toLowerCase().includes(q) ||
      log.wing_name?.toLowerCase().includes(q)
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Wing Activity Log</SheetTitle>
          {wingName && <p className="text-sm text-muted-foreground">Filtered by: {wingName}</p>}
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Input
            placeholder="Search by user, action, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />

          {loading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No log entries yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {log.action}
                      </Badge>
                      {log.wing_name && (
                        <span className="text-xs font-medium">{log.wing_name}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(log.changed_at)}</span>
                  </div>
                  {log.what && <p className="text-sm">{log.what}</p>}
                  <p className="text-xs text-muted-foreground">By: {log.user_name ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}