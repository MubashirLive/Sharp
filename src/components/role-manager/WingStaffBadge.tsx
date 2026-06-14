import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface WingStaffBadgeProps {
  name: string;
  role: "coordinator" | "class_teacher" | "subject_teacher";
  className?: string;
  sectionName?: string;
  subjectName?: string;
  isPrimary?: boolean;
  autoAssigned?: boolean;
  onRemove?: () => void;
  canRemove?: boolean;
}

export function WingStaffBadge({
  name,
  role,
  className,
  sectionName,
  subjectName,
  isPrimary,
  autoAssigned,
  onRemove,
  canRemove = false,
}: WingStaffBadgeProps) {
  let displayText = name;
  let badgeVariant: "default" | "secondary" | "outline" = "secondary";

  // Generate display text based on role
  if (role === "class_teacher" && sectionName) {
    displayText = `CT ${sectionName}`;
    badgeVariant = "default";
  } else if (role === "subject_teacher" && sectionName) {
    displayText = `ST ${sectionName}${subjectName ? ` ${subjectName}` : ""}`;
    badgeVariant = "default";
  } else if (role === "coordinator") {
    displayText = name;
    badgeVariant = "default";
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
        badgeVariant === "default" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        badgeVariant === "secondary" && "bg-muted text-muted-foreground",
        badgeVariant === "outline" && "border border-border bg-background",
        className
      )}
    >
      {/* Icons and badges */}
      {role === "coordinator" && (
        <span className="flex items-center gap-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "h-3 w-3",
              isPrimary && "fill-blue-600 text-blue-600 dark:fill-blue-400 dark:text-blue-400"
            )}
          >
            <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
          </svg>
          {isPrimary && (
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">✨</span>
          )}
        </span>
      )}

      {/* Display text */}
      <span className="truncate max-w-[120px]" title={displayText}>
        {displayText}
      </span>

      {/* Auto-assigned indicator */}
      {autoAssigned && role !== "coordinator" && (
        <span
          className="ml-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400"
          title="Auto-assigned via CT/ST role"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2 w-2"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
            <circle cx="5" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
          </svg>
        </span>
      )}

      {/* Remove button */}
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-destructive transition-colors"
          title={isPrimary ? "Cannot remove primary coordinator" : "Remove from wing"}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

// Staff list with badges
interface StaffListBadgesProps {
  staff: Array<{
    id: string;
    staff_name: string;
    assignment_type: "coordinator" | "teacher";
    is_primary?: boolean;
    auto_assigned?: boolean;
    class_teacher_for?: string;
    subject_teacher_for?: string;
  }>;
  onRemove?: (staffId: string, role: string) => void;
  canRemove?: boolean;
}

export function StaffListBadges({ staff, onRemove, canRemove = false }: StaffListBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {staff.map((person) => (
        <WingStaffBadge
          key={person.id}
          name={person.staff_name}
          role={person.assignment_type === "coordinator" ? "coordinator" : "subject_teacher"}
          sectionName={person.class_teacher_for || person.subject_teacher_for}
          isPrimary={person.is_primary}
          autoAssigned={person.auto_assigned}
          onRemove={canRemove ? () => onRemove(person.id, person.assignment_type) : undefined}
          canRemove={canRemove}
        />
      ))}
    </div>
  );
}