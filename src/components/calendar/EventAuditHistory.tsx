import { useEventHistory } from "@/hooks/useCalendar";
import { format } from "date-fns";

interface EventAuditHistoryProps {
  eventId: string;
}

export function EventAuditHistory({ eventId }: EventAuditHistoryProps) {
  const { data: history, isLoading } = useEventHistory(eventId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Activity</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!history?.data?.length) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Activity</h3>
        <p className="text-sm text-muted-foreground">No activity recorded</p>
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return "➕";
      case "edited":
        return "✏️";
      case "cancelled":
        return "❌";
      case "broadcast_sent":
        return "📢";
      default:
        return "📋";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "created":
        return "Created";
      case "edited":
        return "Edited";
      case "cancelled":
        return "Cancelled";
      case "broadcast_sent":
        return "Notification Sent";
      default:
        return action;
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">Activity</h3>
      <div className="space-y-2">
        {history.data.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
          >
            <span className="text-base">{getActionIcon(entry.action)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{getActionLabel(entry.action)}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(entry.created_at), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                by {(entry as any).actor?.full_name ?? "Unknown"}
              </p>
              {entry.changed_fields && (
                <div className="mt-2 space-y-1">
                  {Object.entries(entry.changed_fields as Record<string, { old: unknown; new: unknown }>).map(
                    ([field, change]) => (
                      <div key={field} className="text-xs">
                        <span className="font-medium capitalize">{field}:</span>{" "}
                        <span className="text-muted-foreground line-through">{String(change.old)}</span>
                        {" → "}
                        <span className="text-foreground">{String(change.new)}</span>
                      </div>
                    )
                  )}
                </div>
              )}
              {entry.broadcast_message_id && (
                <p className="text-xs text-primary mt-1">
                  📬 Message sent via Messenger
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}