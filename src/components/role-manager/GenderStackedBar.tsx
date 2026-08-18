// GenderStackedBar — pure presentational stacked bar for male/female ratio.
// Used in the Houses > Role Manager collapsed card per-wing breakdown
// (docs/superpowers/specs/2026-06-19-houses-collapsed-card-redesign.md).
//
// Renders a 6px-tall horizontal bar split by ratio. Honors aria-valuenow
// for screen readers, prefers-reduced-motion (no transition), and shows a
// `title` tooltip on hover.

import { useMemo } from "react";

export interface GenderStackedBarProps {
  male: number;
  female: number;
  total: number;
  className?: string;
}

export function GenderStackedBar({ male, female, total, className }: GenderStackedBarProps) {
  // Safe percentages; total = 0 falls back to 0/100 so the bar is a single
  // muted segment instead of NaN.
  const safeTotal = Math.max(0, total);
  const safeMale = Math.max(0, male);
  const safeFemale = Math.max(0, female);
  const malePct = useMemo(() => {
    if (safeTotal === 0) return 0;
    return Math.min(100, Math.round((safeMale / safeTotal) * 100));
  }, [safeMale, safeTotal]);
  const femalePct = useMemo(() => {
    if (safeTotal === 0) return 0;
    return Math.min(100, Math.max(0, 100 - malePct));
  }, [safeTotal, malePct]);

  const isEmpty = safeTotal === 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={safeTotal}
      aria-label={`${safeMale} male, ${safeFemale} female`}
      title={`${safeMale} male / ${safeFemale} female`}
      className={`flex w-full h-1.5 rounded-full overflow-hidden bg-muted ${className ?? ""}`}
    >
      {isEmpty ? (
        <div className="w-full h-full bg-muted" />
      ) : (
        <>
          {malePct > 0 && (
            <div
              className="h-full bg-blue-500 dark:bg-blue-400"
              style={{ width: `${malePct}%` }}
            />
          )}
          {femalePct > 0 && (
            <div
              className="h-full bg-pink-500 dark:bg-pink-400"
              style={{ width: `${femalePct}%` }}
            />
          )}
        </>
      )}
    </div>
  );
}
