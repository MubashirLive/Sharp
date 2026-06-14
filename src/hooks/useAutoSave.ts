import { useState, useCallback, useRef, useEffect } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutoSaveOptions<T> {
  /** Initial data snapshot for revert */
  initialData: T;
  /** Debounce delay in ms (default: 2000) */
  debounceMs?: number;
  /** Called when auto-save should trigger */
  onSave: (data: T) => Promise<void>;
  /** Called when status changes */
  onStatusChange?: (status: SaveStatus) => void;
}

export interface UseAutoSaveReturn<T> {
  /** Current data being edited */
  localData: T;
  /** Update local data (marks dirty) */
  setLocalData: React.Dispatch<React.SetStateAction<T>>;
  /** Force immediate save */
  save: () => Promise<void>;
  /** Revert to initial state */
  discard: () => void;
  /** Refresh local data from new initial data */
  refresh: (newInitial: T) => void;
  /** Current save status */
  status: SaveStatus;
  /** Error from last save attempt */
  error: Error | null;
  /** Whether data has changed from initial */
  isDirty: boolean;
  /** Time until auto-save fires */
  timeUntilSave: number | null;
}

/**
 * Unified auto-save hook for all School tabs.
 * Handles: debounce, status tracking, error retry, granular discard.
 */
export function useAutoSave<T>({
  initialData,
  debounceMs = 2000,
  onSave,
  onStatusChange,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const [localData, setLocalData] = useState<T>(initialData);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [timeUntilSave, setTimeUntilSave] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countDownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestDataRef = useRef<T>(initialData);
  const savedDataRef = useRef<T>(initialData);

  // Keep refs in sync
  useEffect(() => {
    latestDataRef.current = localData;
  }, [localData]);

  // Update status helper
  const updateStatus = useCallback(
    (newStatus: SaveStatus, err: Error | null = null) => {
      setStatus(newStatus);
      setError(err);
      onStatusChange?.(newStatus);
    },
    [onStatusChange]
  );

  // Debounced save
  const scheduleSave = useCallback(() => {
    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countDownRef.current) clearInterval(countDownRef.current);

    // Start countdown display
    let remaining = debounceMs;
    setTimeUntilSave(remaining);
    countDownRef.current = setInterval(() => {
      remaining -= 100;
      setTimeUntilSave(Math.max(0, remaining));
      if (remaining <= 0 && countDownRef.current) {
        clearInterval(countDownRef.current);
      }
    }, 100);

    // Schedule save
    timerRef.current = setTimeout(async () => {
      if (countDownRef.current) clearInterval(countDownRef.current);
      setTimeUntilSave(null);

      const dataToSave = latestDataRef.current;

      // Skip if unchanged from last save
      if (JSON.stringify(dataToSave) === JSON.stringify(savedDataRef.current)) {
        updateStatus("idle");
        return;
      }

      updateStatus("saving");
      try {
        await onSave(dataToSave);
        savedDataRef.current = dataToSave;
        updateStatus("saved");
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Save failed");
        updateStatus("error", error);
        // Auto-retry once after 1s
        setTimeout(async () => {
          updateStatus("saving");
          try {
            await onSave(latestDataRef.current);
            savedDataRef.current = latestDataRef.current;
            updateStatus("saved");
          } catch {
            updateStatus("error", error);
          }
        }, 1000);
      }
    }, debounceMs);
  }, [debounceMs, onSave, updateStatus]);

  // When localData changes, schedule auto-save
  const handleSetLocalData: typeof setLocalData = useCallback(
    (action) => {
      setLocalData((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        if (JSON.stringify(next) !== JSON.stringify(savedDataRef.current)) {
          scheduleSave();
        }
        return next;
      });
    },
    [scheduleSave]
  );

  // Force immediate save
  const save = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countDownRef.current) clearInterval(countDownRef.current);
    setTimeUntilSave(null);

    const dataToSave = latestDataRef.current;
    if (JSON.stringify(dataToSave) === JSON.stringify(savedDataRef.current)) {
      updateStatus("idle");
      return;
    }

    updateStatus("saving");
    try {
      await onSave(dataToSave);
      savedDataRef.current = dataToSave;
      updateStatus("saved");
    } catch (err) {
      updateStatus("error", err instanceof Error ? err : new Error("Save failed"));
    }
  }, [onSave, updateStatus]);

  // Discard changes
  const discard = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countDownRef.current) clearInterval(countDownRef.current);
    setTimeUntilSave(null);
    setLocalData(savedDataRef.current);
    updateStatus("idle");
  }, [updateStatus]);

  // Refresh from new initial data
  const refresh = useCallback(
    (newInitial: T) => {
      savedDataRef.current = newInitial;
      latestDataRef.current = newInitial;
      setLocalData(newInitial);
      updateStatus("idle");
    },
    [updateStatus]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countDownRef.current) clearInterval(countDownRef.current);
    };
  }, []);

  const isDirty = JSON.stringify(localData) !== JSON.stringify(savedDataRef.current);

  return {
    localData,
    setLocalData: handleSetLocalData,
    save,
    discard,
    refresh,
    status,
    error,
    isDirty,
    timeUntilSave,
  };
}
