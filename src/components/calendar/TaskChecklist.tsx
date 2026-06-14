import { CheckCircle2, Circle, ClipboardList } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUpsertTaskCompletion } from "@/hooks/useCalendar";
import type { CalendarEvent } from "@/hooks/useCalendar";

interface TaskChecklistProps {
  tasks: CalendarEvent[];
  staffId: string;
  isPrincipal?: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function isPast(dateStr: string): boolean {
  return dateStr < new Date().toISOString().split("T")[0];
}

export function TaskChecklist({ tasks, staffId, isPrincipal = false }: TaskChecklistProps) {
  const mutation = useUpsertTaskCompletion();

  const handleToggle = (eventId: string, currentDone: boolean) => {
    mutation.mutate({ eventId, staffId, done: !currentDone });
  };

  const todayTasks = tasks.filter((t) => t.date === new Date().toISOString().split("T")[0]);
  const pastTasks = tasks.filter((t) => isPast(t.date));
  const orderedTasks = [...todayTasks, ...pastTasks];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <ClipboardList className="w-3.5 h-3.5" />
        My Tasks
      </h3>
      {orderedTasks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center shadow-clay">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
            <ClipboardList className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No tasks assigned</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orderedTasks.map((task) => {
            const myCompletion = (task as any).task_completions?.find(
              (c: any) => c?.staff_id === staffId
            );
            const isDone = myCompletion?.done ?? false;
            const past = isPast(task.date) && !isDone;

            return (
              <div
                key={task.id}
                className={[
                  "rounded-xl border p-3 transition-all duration-200 cursor-pointer",
                  "hover:shadow-clay",
                  isDone
                    ? "bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-950/30 border-emerald-200 dark:border-emerald-800"
                    : past
                    ? "bg-gradient-to-br from-red-50 to-transparent dark:from-red-950/30 border-red-200 dark:border-red-800"
                    : "bg-card border-border shadow-sm",
                ].join(" ")}
                onClick={() => handleToggle(task.id, isDone)}
              >
                <div className="flex items-start gap-2.5">
                  {/* Custom checkbox */}
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 cursor-pointer" />
                    ) : (
                      <Circle className={`w-5 h-5 cursor-pointer ${past ? "text-red-400" : "text-muted-foreground"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label
                      className={[
                        "text-sm font-semibold cursor-pointer leading-snug",
                        isDone ? "line-through text-muted-foreground" : "",
                        !isDone && past ? "text-red-600 dark:text-red-300" : "",
                      ].join(" ")}
                    >
                      {task.title}
                    </Label>
                    {task.detail && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {task.detail}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono border-border">
                        {formatDate(task.date)}
                      </Badge>
                      {isDone && (
                        <Badge className="text-[10px] px-1.5 py-0 font-semibold bg-emerald-500 text-white">
                          Done
                        </Badge>
                      )}
                      {!isDone && past && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-semibold">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}