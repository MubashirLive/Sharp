import { supabase } from "@/integrations/supabase";

export type AttendanceGateResult = { allowed: boolean; reason?: string };

export async function canMarkAttendance(classId: string, date: string): Promise<AttendanceGateResult> {
  const { data, error } = await supabase.rpc("can_mark_attendance", {
    p_class_id: classId,
    p_date: date,
  });

  if (error || !data) {
    return { allowed: false, reason: "Could not verify attendance gate — contact admin" };
  }

  return data as AttendanceGateResult;
}
