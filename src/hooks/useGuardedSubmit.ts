import { useCallback, useRef, useState } from "react";

/**
 * Submit-once guard for any async handler.
 *
 * Why: a `disabled` prop driven by `useState` lags React's commit by one render.
 * Two rapid clicks in the same tick both see `disabled={false}` and both
 * invoke the mutation. The `useRef` lock here is synchronous, so the second
 * call returns `undefined` immediately regardless of commit timing.
 *
 * Use this hook for non-button triggers (form `onSubmit`, dialog footers,
 * imperative handles). For plain mutation buttons, prefer `<SubmitButton>`
 * from `@/components/ui/submit-button`.
 *
 * Pattern: SHARP project standard. See `docs/SUBMIT_GUARD.md`.
 */
export interface UseGuardedSubmitResult {
  /** Wrap any async handler. Second call while in-flight returns `undefined`. */
  run: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  /** True while wrapped fn is in-flight. Wire to `disabled` prop. */
  isPending: boolean;
  /** Force-release the lock (e.g. on cancel mid-submit). */
  reset: () => void;
}

export function useGuardedSubmit(): UseGuardedSubmitResult {
  // Synchronous re-entry lock. The `disabled` prop on a button is
  // React-state-driven and lags the click by one render — two rapid clicks
  // can both pass the disabled check. This ref blocks the second call
  // regardless of React's commit timing.
  const inFlightRef = useRef(false);
  const [isPending, setIsPending] = useState(false);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    if (inFlightRef.current) return undefined; // silent drop — second click is a no-op
    inFlightRef.current = true;
    setIsPending(true);
    try {
      return await fn();
    } finally {
      inFlightRef.current = false;
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    inFlightRef.current = false;
    setIsPending(false);
  }, []);

  return { run, isPending, reset };
}
