import { useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Check, X, ChevronDown, AlertCircle } from "lucide-react";

export interface Student {
  id: string;
  roll_no: string;
  full_name: string;
  fathers_name?: string | null;
}

export type AttendanceStatus = "present" | "absent" | "leave" | null;

export interface DateColumn {
  date: string; // ISO date string YYYY-MM-DD
  status: AttendanceStatus | null; // null = not marked
  studentStatuses: Record<string, AttendanceStatus | null>; // studentId -> status
  isToday?: boolean;
  markedCount?: number;
  totalCount?: number;
}

interface AttendanceListViewProps {
  students: Student[];
  dateColumns: DateColumn[];
  isRangeMode: boolean;
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
  markedDateCount: number;
}

const DAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function getDayInitial(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return DAY_INITIALS[d.getDay()];
}

export function AttendanceListView({
  students,
  dateColumns,
  isRangeMode,
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
  markedDateCount,
}: AttendanceListViewProps) {
  const guideText = "Click to toggle P/A. Double-click for Leave.";

  // Count unmarked students for a given date
  const getUnmarkedCount = (date: string, statuses: Record<string, AttendanceStatus>) => {
    return students.filter((s) => !statuses[s.id]).length;
  };

  // All students have a status?
  const allMarked = (statuses: Record<string, AttendanceStatus>) => {
    return students.every((s) => statuses[s.id] !== null);
  };

  // Save disabled if any unmarked
  const isSaveDisabled = (date: string) => {
    const statuses = editingDate === date ? pendingStatuses : dateColumns.find((c) => c.date === date)?.studentStatuses ?? {};
    return !allMarked(statuses);
  };

  // Count for confirmation
  const getCounts = (statuses: Record<string, AttendanceStatus>) => {
    const present = students.filter((s) => statuses[s.id] === "present").length;
    const absent = students.filter((s) => statuses[s.id] === "absent").length;
    const leave = students.filter((s) => statuses[s.id] === "leave").length;
    return { total: students.length, present, absent, leave };
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-3">
      {/* On-screen guide */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <span className="font-medium">{guideText}</span>
        <span className="text-muted-foreground/60">|</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500" />
          Present
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-red-500" />
          Absent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400" />
          Leave
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
<div className="overflow-auto" ref={scrollContainerRef}>
<Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {/* Fixed: Roll No. */}
                <TableHead className="sticky left-0 z-10 bg-muted/50 min-w-[80px]">
                  Roll No.
                </TableHead>
                {/* Fixed: Student Name */}
                <TableHead className="sticky left-[88px] z-10 bg-muted/50 min-w-[200px]">
                  Student / Father's Name
                </TableHead>
                {/* Scrollable: date columns */}
                {dateColumns.map((col) => {
                  const isEditing = editingDate === col.date;
                  const dayInitial = getDayInitial(col.date);
                  return (
                    <TableHead
                      key={col.date}
                      className={cn(
                        "min-w-[70px] text-center",
                        col.status === null && "bg-muted/20",
                        col.status !== null && "bg-primary/5"
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-mono">
                          {format(new Date(col.date + "T00:00:00"), "dd")}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {dayInitial}
                        </span>

                        {/* Column action button */}
                        {canMark && !isRangeMode && (
                          <div className="mt-1">
                            {col.status === null && !isEditing ? (
                              // Unmarked — show Mark button
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-5 text-[10px] px-1.5 cursor-pointer"
                                onClick={() => onMarkDate(col.date)}
                              >
                                Mark
                              </Button>
                            ) : col.status !== null && !isEditing ? (
                              // Already marked — show Edit button
                              <Button
                                size="xs"
                                variant="secondary"
                                className="h-5 text-[10px] px-1.5 cursor-pointer"
                                onClick={() => onEditDate(col.date)}
                              >
                                Edit
                              </Button>
                            ) : isEditing ? (
                              // Editing — show Save + Cancel
                              <div className="flex items-center gap-0.5">
                                <Button
                                  size="xs"
                                  variant="default"
                                  className="h-5 text-[10px] px-1.5 cursor-pointer"
                                  disabled={isSaveDisabled(col.date)}
                                  onClick={() => {
                                    onSaveDate(col.date, pendingStatuses);
                                  }}
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  className="h-5 w-5 p-0 cursor-pointer"
                                  onClick={() => onCancelDate(col.date)}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {/* Bulk mark dropdown */}
                        {canMark && !isRangeMode && isEditing && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="xs"
                                variant="ghost"
                                className="h-5 text-[10px] px-1 cursor-pointer mt-0.5"
                              >
                                <ChevronDown className="h-2.5 w-2.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center">
                              <DropdownMenuItem
                                onClick={() => onBulkMark(col.date, "present")}
                              >
                                All Present
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onBulkMark(col.date, "absent")}
                              >
                                All Absent
                              </DropdownMenuItem>
                              {isCoordinator && (
                                <DropdownMenuItem
                                  onClick={() => onBulkMark(col.date, "blank")}
                                >
                                  All Blank
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => {
                const isUnmarkedHighlight = editingDate !== null &&
                  !pendingStatuses[student.id];

                return (
                  <TableRow
                    key={student.id}
                    className={cn(
                      isUnmarkedHighlight && "bg-red-50/50"
                    )}
                  >
                    {/* Fixed: Roll No. */}
                    <TableCell className="sticky left-0 z-10 bg-card font-mono text-sm">
                      {student.roll_no}
                    </TableCell>

                    {/* Fixed: Student Name + Father's Name */}
                    <TableCell className="sticky left-[88px] z-10 bg-card">
                      <div>
                        <p className="font-semibold text-sm leading-tight">
                          {student.full_name}
                        </p>
                        {student.fathers_name && (
                          <p className="text-xs text-muted-foreground leading-tight">
                            {student.fathers_name}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Scrollable: date cells */}
                    {dateColumns.map((col) => {
                      const isEditing = editingDate === col.date;
                      const status = isEditing
                        ? pendingStatuses[student.id] ?? null
                        : col.studentStatuses[student.id] ?? null;

                      return (
                        <TableCell
                          key={col.date}
                          className={cn(
                            "text-center cursor-pointer select-none p-1",
                            status === "present" && "bg-green-100",
                            status === "absent" && "bg-red-100",
                            status === "leave" && "bg-yellow-100",
                            status === null && !isEditing && "bg-muted/10",
                            isEditing && "p-0"
                          )}
                          onClick={() => {
                            if (isEditing) onCellClick(student.id, col.date);
                          }}
                          onDoubleClick={() => {
                            if (isEditing) onCellDoubleClick(student.id, col.date);
                          }}
                        >
                          {isEditing ? (
                            <div className="flex items-center justify-center h-full">
                              {status === null ? (
                                <span className="text-xs text-muted-foreground/40">—</span>
                              ) : status === "present" ? (
                                <span className="text-xs font-bold text-green-700">P</span>
                              ) : status === "absent" ? (
                                <span className="text-xs font-bold text-red-700">A</span>
                              ) : (
                                <span className="text-xs font-bold text-yellow-700">L</span>
                              )}
                            </div>
                          ) : (
                            <span
                              className={cn(
                                "text-xs font-bold",
                                status === "present" && "text-green-700",
                                status === "absent" && "text-red-700",
                                status === "leave" && "text-yellow-700",
                                status === null && "text-muted-foreground/40"
                              )}
                            >
                              {status === "present"
                                ? "P"
                                : status === "absent"
                                  ? "A"
                                  : status === "leave"
                                    ? "L"
                                    : "—"}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Marked dates summary */}
      {markedDateCount > 0 && (
        <div className="text-xs text-muted-foreground text-right">
          {markedDateCount} date{markedDateCount !== 1 ? "s" : ""} marked this month
        </div>
      )}
    </div>
  );
}
