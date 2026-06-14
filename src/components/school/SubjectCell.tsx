import { AssignedSubject } from "@/data/subjects";
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
          {subjects.map((subject) => (
            <Badge
              key={subject.name}
              variant="secondary"
              className="text-xs py-0.5 px-1.5"
            >
              {subject.name}
            </Badge>
          ))}
        </div>
      )}
    </button>
  );
}