// SectionGroup — wraps a labeled group of chips/rows for the Staff card.
//
// Visual: left-border accent (blue Academic, amber Non-Academic, violet Both,
// muted-foreground for neutral) + small uppercase label. Reused for the
// collapsed card layout and (later) the drawer sections.
//
// Empty children → returns null so the parent can render the wrapper
// unconditionally without leaving blank space.

import { ReactNode } from "react";

type Accent = "blue" | "amber" | "violet" | "muted";

const accentMap: Record<Accent, string> = {
  blue: "border-l-blue-400",
  amber: "border-l-amber-400",
  violet: "border-l-violet-400",
  muted: "border-l-muted-foreground",
};

const labelMap: Record<Accent, string> = {
  blue: "text-blue-700 dark:text-blue-300",
  amber: "text-amber-700 dark:text-amber-300",
  violet: "text-violet-700 dark:text-violet-300",
  muted: "text-muted-foreground",
};

interface SectionGroupProps {
  label: string;
  accent: Accent;
  children: ReactNode;
}

export function SectionGroup({ label, accent, children }: SectionGroupProps) {
  return (
    <div className={`border-l-4 ${accentMap[accent]} pl-3 py-1`}>
      <div
        className={`text-[10px] font-semibold uppercase tracking-wider ${labelMap[accent]}`}
      >
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
