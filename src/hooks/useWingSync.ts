import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  syncClassWingToWingStaff,
  staffHasTeachingAssignments,
  autoAssignStaffToWings
} from "@/integrations/supabase/queries/sync";

export function useWingSync(schoolId: string) {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncMutation = useMutation({
    mutationFn: async ({ classId, wingId }: { classId: string; wingId: string }) => {
      return syncClassWingToWingStaff(classId, wingId, schoolId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "classes-wings"],
      });
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "wings-with-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "staff-wings"],
      });
    },
    onError: (error) => {
      console.error("Sync error:", error);
      toast.error("Failed to sync wing assignments");
    },
  });

  const autoAssignMutation = useMutation({
    mutationFn: async (wingId: string) => {
      return autoAssignStaffToWings(schoolId, wingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "wings-with-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "staff-wings"],
      });
    },
    onError: (error) => {
      console.error("Auto-assign error:", error);
      toast.error("Failed to auto-assign staff to wing");
    },
  });

  const assignStaffMutation = useMutation({
    mutationFn: async ({
      wingId,
      staffId,
      assignmentType
    }: {
      wingId: string;
      staffId: string;
      assignmentType: "teacher" | "coordinator";
    }) => {
      const { error } = await supabase
        .from("wing_staff")
        .insert({
          wing_id: wingId,
          staff_id: staffId,
          assignment_type: assignmentType,
          school_id: schoolId,
        });

      if (error) {
        if (error.code === "23505") {
          throw new Error("Staff already assigned to this wing");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "wings-with-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "staff-wings"],
      });
    },
    onError: (error) => {
      if (error.message.includes("Staff already assigned")) {
        toast.error("Staff already assigned to this wing");
      } else {
        console.error("Assign staff error:", error);
        toast.error("Failed to assign staff to wing");
      }
    },
  });

  const removeStaffMutation = useMutation({
    mutationFn: async ({
      wingId,
      staffId
    }: {
      wingId: string;
      staffId: string;
    }) => {
      const { error } = await supabase
        .from("wing_staff")
        .delete()
        .eq("wing_id", wingId)
        .eq("staff_id", staffId);

      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "wings-with-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["school", schoolId, "staff-wings"],
      });
    },
    onError: (error) => {
      console.error("Remove staff error:", error);
      toast.error("Failed to remove staff from wing");
    },
  });

  const canRemoveStaff = async (wingId: string, staffId: string, assignmentType: "teacher" | "coordinator"): Promise<boolean> => {
    if (assignmentType === "coordinator") {
      // Check if this is the sole coordinator
      const { data } = await supabase
        .from("wing_staff")
        .select("staff_id", { count: "exact", head: true })
        .eq("wing_id", wingId)
        .eq("assignment_type", "coordinator");

      const coordinatorCount = data?.count ?? 0;
      if (coordinatorCount <= 1) {
        const confirmed = confirm("This is the only coordinator. Removing will leave this wing without a coordinator. Continue?");
        return confirmed;
      }
    }

    return true;
  };

  const syncClassWing = async (classId: string, wingId: string) => {
    setIsSyncing(true);
    try {
      const success = await syncClassWingToWingStaff(classId, wingId, schoolId);
      if (success) {
        toast.success("Wing assignments synced");
      } else {
        toast.error("Failed to sync wing assignments");
      }
      return success;
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync wing assignments");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  const autoAssignToWing = async (wingId: string) => {
    setIsSyncing(true);
    try {
      await autoAssignStaffToWings(schoolId, wingId);
      toast.success("Staff auto-assigned to wing");
    } catch (error) {
      console.error("Auto-assign error:", error);
      toast.error("Failed to auto-assign staff to wing");
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncClassWing: syncMutation.mutate,
    autoAssignToWing: autoAssignMutation.mutate,
    assignStaff: assignStaffMutation.mutate,
    removeStaff: removeStaffMutation.mutate,
    canRemoveStaff,
    syncMutation,
    autoAssignMutation,
    assignStaffMutation,
    removeStaffMutation,
  };
}