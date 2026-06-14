import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface HouseAuditLog {
  id: string;
  school_id: string;
  house_name: string;
  action: string;
  actor_id: string | null;
  actor_name: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

interface HouseLogPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  houseFilter?: string;
}

const DEFAULT_HOUSE_NAMES = ["Red", "Blue", "Green", "Yellow"];

const ACTION_LABELS: Record<string, string> = {
  house_renamed: "Renamed",
  emblem_changed: "Emblem",
  staff_assigned: "Staff Added",
  staff_removed: "Staff Removed",
  incharge_assigned: "Incharge Set",
  incharge_removed: "Incharge Removed",
  reset: "Reset",
};

export function HouseLogPanel({ open, onOpenChange, schoolId, houseFilter }: HouseLogPanelProps) {
  const [logs, setLogs] = useState<HouseAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedHouse, setSelectedHouse] = useState<string>("all");

  useEffect(() => {
    if (open && schoolId) {
      fetchLogs();
    }
  }, [open, schoolId]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("houses_audit_log")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (selectedHouse !== "all") {
      query = query.ilike("house_name", selectedHouse);
    }

    const { data } = await query;
    setLogs((data ?? []) as HouseAuditLog[]);
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.actor_name?.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.house_name.toLowerCase().includes(q) ||
      log.old_value?.toLowerCase().includes(q) ||
      log.new_value?.toLowerCase().includes(q)
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

  const getLogDescription = (log: HouseAuditLog): string => {
    switch (log.action) {
      case "house_renamed":
        return `${log.house_name} renamed from "${log.old_value}" to "${log.new_value}"`;
      case "emblem_changed":
        return `Emblem changed for ${log.house_name}`;
      case "staff_assigned":
        return `${log.new_value} assigned to ${log.house_name}`;
      case "staff_removed":
        return `${log.old_value} removed from ${log.house_name}`;
      case "incharge_assigned":
        return `${log.new_value} marked as Incharge of ${log.house_name}`;
      case "incharge_removed":
        return `Incharge removed from ${log.house_name}`;
      case "reset":
        return `${log.house_name} reset to default`;
      default:
        return `${log.action}: ${log.house_name}`;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>House Activity Log</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Search by user, action, or house..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm"
            />
            <Select value={selectedHouse} onValueChange={(val) => { setSelectedHouse(val); }}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="All Houses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Houses</SelectItem>
                {DEFAULT_HOUSE_NAMES.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Log entries */}
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
                        {ACTION_LABELS[log.action] ?? log.action}
                      </Badge>
                      <span className="text-xs font-medium">{log.house_name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
                  </div>
                  <p className="text-sm">{getLogDescription(log)}</p>
                  <p className="text-xs text-muted-foreground">By: {log.actor_name ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}