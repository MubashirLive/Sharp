import { CalendarEvent, scopeOptions, dateTypeOptions } from "@/hooks/useCalendar";
import { format } from "date-fns";
import { FileText, Users, Bell, Calendar, MapPin } from "lucide-react";

interface EventPreviewProps {
  event: Partial<CalendarEvent>;
  dateType: "one_day" | "multi_day" | "selected_days";
  onConfirm: () => void;
  onEdit: () => void;
  isSubmitting?: boolean;
}

export function EventPreview({
  event,
  dateType,
  onConfirm,
  onEdit,
  isSubmitting,
}: EventPreviewProps) {
  const formatDate = () => {
    if (dateType === "one_day" && event.date) {
      return format(new Date(event.date), "EEEE, dd MMMM yyyy");
    }
    if (dateType === "multi_day" && event.date && event.end_date) {
      return `${format(new Date(event.date), "dd MMM")} – ${format(new Date(event.end_date), "dd MMM yyyy")}`;
    }
    if (dateType === "selected_days" && event.specific_dates?.length) {
      return `${event.specific_dates.length} dates selected`;
    }
    return "Date not set";
  };

  const getScopeLabel = () => {
    return scopeOptions.find((s) => s.value === event.scope)?.label ?? event.scope;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Event Preview</h3>
          <p className="text-xs text-muted-foreground">
            This is how recipients will see the event
          </p>
        </div>
      </div>

      {/* Event Card Preview */}
      <div className="border border-border rounded-xl p-5 space-y-4 bg-card shadow-sm">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold">{event.title || "Untitled Event"}</h2>
          <p className="text-sm text-primary mt-1">
            {dateTypeOptions.find((d) => d.value === dateType)?.label}
          </p>
        </div>

        {/* Date */}
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{formatDate()}</span>
        </div>

        {/* Scope */}
        <div className="flex items-center gap-3 text-sm">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{getScopeLabel()}</span>
          {event.include_students !== undefined && (
            <span className="text-xs text-muted-foreground">
              {event.include_students ? "• Includes students" : "• Staff only"}
            </span>
          )}
        </div>

        {/* Description */}
        {event.detail && (
          <div className="pt-2 border-t">
            <div className="flex items-start gap-3 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
              <p className="text-muted-foreground whitespace-pre-wrap">{event.detail}</p>
            </div>
          </div>
        )}

        {/* Attachments */}
        {event.attachment_urls?.length ? (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              {event.attachment_urls.length} attachment(s) included
            </p>
          </div>
        ) : null}

        {/* Notify */}
        <div className="flex items-center gap-3 text-sm">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className={event.notify ? "text-green-600" : "text-muted-foreground"}>
            {event.notify ? "Notification will be sent" : "No notification"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-2.5 border border-border rounded-lg font-medium hover:bg-muted/50 transition-colors cursor-pointer"
        >
          ← Edit Details
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Publishing..." : "Publish Event"}
        </button>
      </div>
    </div>
  );
}