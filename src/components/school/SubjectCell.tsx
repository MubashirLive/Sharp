import { AssignedSubject, isNonAcademicSubject } from "@/data/subjects";
import { Badge } from "@/components/ui/badge";

interface SubjectCellProps {
  subjects: AssignedSubject[];
  onClick: () => void;
}

export function SubjectCell({ subjects, onClick }: SubjectCellProps) {
  return (
    <button
      onClick={onClick}
      className="w-full min-h-[60px] p-2 border rounded-md bg-card hover:bg-muted/50 transition-colors text-left cursor-pointer"
    >
      {subjects.length === 0 ? (
        <p className="text-xs text-muted-foreground">+ Add subjects</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {subjects.map((subject) => {
            const isNonAcad = isNonAcademicSubject(subject);
            return (
              <Badge
                key={subject.name}
                variant={isNonAcad ? "outline" : "secondary"}
                className={
                  isNonAcad
                    ? "text-xs py-0.5 px-1.5 border-emerald-500/30 text-emerald-700 bg-emerald-50/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 font-medium"
                    : "text-xs py-0.5 px-1.5"
                }
              >
                {subject.name}
              </Badge>
            );
          })}
        </div>
      )}
    </button>
  );
}