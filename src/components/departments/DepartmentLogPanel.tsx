import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getDepartmentsAuditLog } from "@/integrations/supabase/queries/departments";
import type { DepartmentAuditLog } from "@/integrations/supabase/queries/departments";

interface DepartmentLogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  deptFilter?: string;
  deptName?: string;
}

export function DepartmentLogPanel({ open, onOpenChange, schoolId, deptFilter, deptName }: DepartmentLogPanelProps) {
  const [logs, setLogs] = useState<DepartmentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open && schoolId) {
      setLoading(true);
      getDepartmentsAuditLog(schoolId, deptFilter).then((data) => {
        setLogs(data);
        setLoading(false);
      });
    }
  }, [open, schoolId, deptFilter]);

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.change_summary?.toLowerCase().includes(q)
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
          <SheetTitle>Department Activity Log</SheetTitle>
          {deptName && <p className="text-sm text-muted-foreground">Filtered by: {deptName}</p>}
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <Input
            placeholder="Search by action or description..."
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
                    <Badge variant="outline" className="text-xs">
                      {log.action}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                  </div>
                  {log.change_summary && <p className="text-sm">{log.change_summary}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}