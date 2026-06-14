import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Generate a unique idempotency key
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Hook for authenticated mutations with automatic idempotency key handling
export function useAuthenticatedMutation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Execute a mutation with idempotency key
  const mutate = useCallback(
    async <T>({
      table,
      method = "insert",
      data,
      id,
      returning = "representation",
    }: {
      table: string;
      method?: "insert" | "update" | "upsert" | "delete";
      data?: Record<string, unknown>;
      id?: string;
      returning?: "representation" | "minimal";
    }): Promise<T | null> => {
      if (!user?.id) {
        throw new Error("Not authenticated");
      }

      const idempotencyKey = generateIdempotencyKey();

      switch (method) {
        case "insert": {
          const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select()
            .single();
          if (error) throw error;
          return result as T;
        }
        case "update": {
          if (!id) throw new Error("ID required for update");
          const { data: result, error } = await supabase
            .from(table)
            .update(data)
            .eq("id", id)
            .select()
            .maybeSingle();
          if (error) throw error;
          return result as T;
        }
        case "delete": {
          if (!id) throw new Error("ID required for delete");
          const { error } = await supabase.from(table).delete().eq("id", id);
          if (error) throw error;
          return null;
        }
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    },
    [user?.id]
  );

  // Invalidate related queries after mutation
  const invalidate = useCallback(
    async (queryKeys: string[][]) => {
      for (const keys of queryKeys) {
        await queryClient.invalidateQueries({ queryKey: keys });
      }
    },
    [queryClient]
  );

  return { mutate, invalidate };
}

// Hook to get session user directly
export function useSessionUser() {
  const { user, session } = useAuth();
  return { user, session };
}