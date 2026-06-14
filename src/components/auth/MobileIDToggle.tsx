import * as React from "react";
import { cn } from "@/lib/utils";

interface MobileIDToggleProps {
  value: "mobile" | "id";
  onChange: (value: "mobile" | "id") => void;
  className?: string;
}

export function MobileIDToggle({ value, onChange, className }: MobileIDToggleProps) {
  return (
    <div className={cn("flex rounded-lg border p-1 bg-muted/50", className)}>
      <button
        type="button"
        onClick={() => onChange("mobile")}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
          value === "mobile"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Mobile
      </button>
      <button
        type="button"
        onClick={() => onChange("id")}
        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
          value === "id"
            ? "bg-background shadow-sm text-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {value === "id" ? "App ID" : "ID"}
      </button>
    </div>
  );
}