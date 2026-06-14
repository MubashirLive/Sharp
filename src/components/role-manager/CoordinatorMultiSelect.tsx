import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { WingOption } from "@/integrations/supabase/queries/roleAssignments";

interface CoordinatorMultiSelectProps {
  value: string[]; // wing ids
  options: WingOption[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

export function CoordinatorMultiSelect({
  value, options, onChange, disabled,
}: CoordinatorMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedNames = options
    .filter((o) => value.includes(o.id))
    .map((o) => o.name);

  const label =
    selectedNames.length === 0
      ? "Pick wing(s)"
      : selectedNames.length === 1
        ? `👑 ${selectedNames[0]}`
        : `👑 ${selectedNames.length} wings`;

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="h-7 text-xs font-normal justify-between min-w-[10rem]"
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3 w-3 ml-2 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        {options.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2">No wings in this school.</p>
        ) : (
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
            {options.map((o) => {
              const checked = value.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => toggle(o.id)}
                  className="flex items-center gap-2 text-xs px-2 py-1.5 rounded hover:bg-accent text-left"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      checked ? "bg-primary border-primary text-primary-foreground" : "border-input"
                    }`}
                  >
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="flex-1 truncate">{o.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
