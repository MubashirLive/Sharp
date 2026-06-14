import { SaveStatus } from "@/hooks/useAutoSave";
import { Loader2, Check, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  error?: Error | null;
  onRetry?: () => void;
  /** Show countdown bar when saving in progress */
  timeUntilSave?: number | null;
  /** Debounce ms for progress bar */
  debounceMs?: number;
  /** Custom labels */
  labels?: {
    idle?: string;
    saved?: string;
    saving?: string;
    error?: string;
    retry?: string;
  };
  className?: string;
}

/**
 * Unified save status indicator for all School tabs.
 * Shows: icon + label + optional progress bar + recovery actions.
 */
export function SaveStatusIndicator({
  status,
  error,
  onRetry,
  timeUntilSave,
  debounceMs = 2000,
  labels = {},
  className,
}: SaveStatusIndicatorProps) {
  const {
    idle = "All saved",
    saved = "Saved",
    saving = "Saving",
    error: errorLabel = "Save failed",
    retry = "Retry",
  } = labels;

  if (status === "idle" && !timeUntilSave) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs text-muted-foreground",
          className
        )}
      >
        <Check className="h-3.5 w-3.5 text-green-500" />
        <span>{idle}</span>
      </div>
    );
  }

  if (status === "saved") {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs text-green-600",
          className
        )}
      >
        <Check className="h-3.5 w-3.5" />
        <span>{saved}</span>
      </div>
    );
  }

  if (status === "saving" || (timeUntilSave !== null && timeUntilSave > 0)) {
    const progress = timeUntilSave !== null && debounceMs > 0
      ? ((debounceMs - timeUntilSave) / debounceMs) * 100
      : null;

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>{saving}</span>
          {timeUntilSave !== null && (
            <span className="text-[10px]">
              ({Math.ceil(timeUntilSave / 1000)}s)
            </span>
          )}
        </div>
        {progress !== null && (
          <div className="h-0.5 w-20 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>
            {errorLabel}
            {error?.message && (
              <span className="text-muted-foreground ml-1">
                — {error.message}
              </span>
            )}
          </span>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={onRetry}
          >
            {retry}
          </Button>
        )}
      </div>
    );
  }

  return null;
}
