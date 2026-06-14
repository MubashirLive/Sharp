import * as React from "react";
import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useGuardedSubmit } from "@/hooks/useGuardedSubmit";

/**
 * Drop-in replacement for shadcn `<Button>` for any button that triggers
 * an async mutation. Wraps `useGuardedSubmit` so the same-tick
 * double-click race (the React commit-lag window) cannot fire twice.
 *
 * Pattern: SHARP project standard. See `docs/SUBMIT_GUARD.md`.
 */
export interface SubmitButtonProps extends Omit<ButtonProps, "onClick"> {
  /** Async (or sync) handler — automatically guarded against double-submit. */
  onClick: () => Promise<unknown> | unknown;
  /** Label shown while the handler is in-flight. Defaults to `children`. */
  loadingLabel?: React.ReactNode;
  /** Show the spinner icon while pending. Default: true. */
  showSpinner?: boolean;
}

export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ onClick, loadingLabel, showSpinner = true, disabled, children, type, ...rest }, ref) => {
    const { run, isPending } = useGuardedSubmit();
    return (
      <Button
        ref={ref}
        type={type ?? "button"}
        disabled={disabled || isPending}
        onClick={() => {
          // Fire-and-forget — errors surface via the handler's own toasts.
          void run(async () => Promise.resolve(onClick()));
        }}
        {...rest}
      >
        {isPending && showSpinner && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
        {isPending && loadingLabel ? loadingLabel : children}
      </Button>
    );
  },
);
SubmitButton.displayName = "SubmitButton";
