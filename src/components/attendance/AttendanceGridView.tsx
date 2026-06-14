import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttendanceListView, Student, AttendanceStatus } from "./AttendanceListView";

export interface DateColumn {
  date: string;
  status: AttendanceStatus;
  studentStatuses: Record<string, AttendanceStatus>;
}

interface AttendanceGridViewProps {
  students: Student[];
  dateColumn: DateColumn | null; // single date only in grid view
  canMark: boolean;
  isCoordinator: boolean;
  onMarkDate: (date: string) => void;
  onEditDate: (date: string) => void;
  onSaveDate: (date: string, statuses: Record<string, AttendanceStatus>) => void;
  onCancelDate: (date: string) => void;
  onCellClick: (studentId: string, date: string) => void;
  onCellDoubleClick: (studentId: string, date: string) => void;
  onBulkMark: (date: string, status: "present" | "absent" | "blank") => void;
  editingDate: string | null;
  pendingStatuses: Record<string, AttendanceStatus>;
}

export function AttendanceGridView({
  students,
  dateColumn,
  canMark,
  isCoordinator,
  onMarkDate,
  onEditDate,
  onSaveDate,
  onCancelDate,
  onCellClick,
  onCellDoubleClick,
  onBulkMark,
  editingDate,
  pendingStatuses,
}: AttendanceGridViewProps) {
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-1">No students found</h3>
        <p className="text-muted-foreground text-sm">
          Select a class and section to view attendance.
        </p>
      </div>
    );
  }

  if (!dateColumn) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-1">Select a date</h3>
        <p className="text-muted-foreground text-sm">
          Grid view shows attendance for a single date only. Use the date picker to select a date.
        </p>
      </div>
    );
  }

  const isEditing = editingDate === dateColumn.date;

  return (
    <div className="space-y-3">
      {/* Guide */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
        <span className="font-medium">Click to toggle P/A. Double-click for Leave.</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500" /> Present
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" /> Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400" /> Leave
        </span>
      </div>

      {/* Date label */}
      <div className="text-sm font-medium text-muted-foreground">
        Showing: {dateColumn.date}
      </div>

      {/* Grid — 3 cols @ 375, 4 @768, 5 @ 1024+ */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {students.map((student) => {
          const status = isEditing
            ? pendingStatuses[student.id] ?? null
            : dateColumn.studentStatuses[student.id] ?? null;

          return (
            <div
              key={student.id}
              className={cn(
                "rounded-xl border p-4 flex flex-col gap-2 transition-all",
                "min-h-[100px]",
                status === "present" && "border-green-400 bg-green-50 dark:bg-green-950/30",
                status === "absent" && "border-red-400 bg-red-50 dark:bg-red-950/30",
                status === "leave" && "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30",
                status === null && "border-border bg-card",
                isEditing && "cursor-pointer active:scale-95"
              )}
              onClick={() => {
                if (isEditing) onCellClick(student.id, dateColumn.date);
              }}
              onDoubleClick={() => {
                if (isEditing) onCellDoubleClick(student.id, dateColumn.date);
              }}
            >
              {/* Roll No. badge */}
              <div className="flex items-start justify-between">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-xs font-mono font-semibold">
                  {student.roll_no}
                </span>
                {/* Status indicator */}
                {status !== null && (
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full shrink-0 mt-1",
                      status === "present" && "bg-green-500",
                      status === "absent" && "bg-red-500",
                      status === "leave" && "bg-yellow-400"
                    )}
                  />
                )}
              </div>

              {/* Student name */}
              <div className="flex-1">
                <p className="font-semibold text-sm leading-tight">{student.full_name}</p>
                {student.fathers_name && (
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                    {student.fathers_name}
                  </p>
                )}
              </div>

              {/* Status display (when not editing) */}
              {!isEditing && (
                <div className="flex items-center justify-center h-8 rounded-lg border mt-auto"
                  style={{
                    backgroundColor:
                      status === "present" ? "#bbf7d0" :
                      status === "absent" ? "#fecaca" :
                      status === "leave" ? "#fef08a" :
                      "transparent",
                    borderColor:
                      status === "present" ? "#4ade80" :
                      status === "absent" ? "#f87171" :
                      status === "leave" ? "#facc15" :
                      "#e5e7eb",
                  }}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    status === "present" && "text-green-700",
                    status === "absent" && "text-red-700",
                    status === "leave" && "text-yellow-700",
                    status === null && "text-muted-foreground/40"
                  )}>
                    {status === "present" ? "Present" :
                     status === "absent" ? "Absent" :
                     status === "leave" ? "Leave" : "—"}
                  </span>
                </div>
              )}

              {/* Edit mode: cycle indicator */}
              {isEditing && (
                <div className="flex items-center justify-center h-8 rounded-lg border mt-auto"
                  style={{
                    backgroundColor:
                      status === "present" ? "#bbf7d0" :
                      status === "absent" ? "#fecaca" :
                      status === "leave" ? "#fef08a" :
                      "transparent",
                    borderColor:
                      status === "present" ? "#4ade80" :
                      status === "absent" ? "#f87171" :
                      status === "leave" ? "#facc15" :
                      "#e5e7eb",
                  }}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    status === "present" ? "text-green-700" :
                    status === "absent" ? "text-red-700" :
                    status === "leave" ? "text-yellow-700" :
                    "text-muted-foreground/40"
                  )}>
                    {status === "present" ? "P" :
                     status === "absent" ? "A" :
                     status === "leave" ? "L" : "—"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
