import { Link } from "react-router-dom";
import { BookOpen, Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceCardProps {
  variant: "my_class" | "my_wing";
  className?: string; // e.g. "7A"
  wingName?: string; // e.g. "Senior Wing"
  roleLabel: string; // "Class Teacher" | "Coordinator"
  markedToday: boolean | null; // null = loading
  // Navigate pre-filled to this scope
  classId?: string;
  sectionId?: string;
  wingId?: string;
}

function buildHref(variant: "my_class" | "my_wing", classId?: string, sectionId?: string, wingId?: string) {
  if (variant === "my_class" && classId && sectionId) return `/attendance?classId=${classId}&sectionId=${sectionId}`;
  if (variant === "my_wing" && wingId) return `/attendance?wingId=${wingId}`;
  return "/attendance";
}

export function AttendanceCard({
  variant,
  className,
  wingName,
  roleLabel,
  markedToday,
  classId,
  sectionId,
  wingId,
}: AttendanceCardProps) {
  const isMyClass = variant === "my_class";
  const Icon = isMyClass ? BookOpen : Building2;
  const title = isMyClass ? `My Class: ${className}` : `My Wing: ${wingName}`;
  const href = buildHref(variant, classId, sectionId, wingId);
  const marked = markedToday;

  return (
    <div className="h-full rounded-xl border bg-card px-5 py-4 shadow-sm flex flex-col gap-3">
      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center shrink-0 shadow-sm">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base leading-tight">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2">
        {marked === null ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-muted animate-pulse" />
            <span className="text-xs text-muted-foreground">Loading…</span>
          </>
        ) : marked ? (
          <>
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <span className="text-xs text-green-700 font-medium">Marked today</span>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-xs text-amber-600 font-medium">Not marked yet</span>
          </>
        )}
      </div>

      {/* CTA */}
      <div className="mt-auto">
        {marked === null ? (
          <Button variant="outline" size="sm" className="w-full" disabled>
            Open Attendance
          </Button>
        ) : !marked ? (
          <Button
            asChild
            size="sm"
            className="w-full font-medium"
          >
            <Link to={href}>Mark Today's Attendance</Link>
          </Button>
        ) : (
          <Button variant="outline" asChild size="sm" className="w-full">
            <Link to={href}>Open Attendance</Link>
          </Button>
        )}
      </div>
    </div>
  );
}