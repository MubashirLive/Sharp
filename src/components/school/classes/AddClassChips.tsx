import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface AddClassChipsProps {
  existingNames: string[];
  onAdd: (name: string) => void;
  /** Defaults to a small set of canonical class names. */
  suggestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "Nursery", "LKG", "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8",
  "Class 9", "Class 10", "Class 11", "Class 12",
];

export function AddClassChips({ existingNames, onAdd, suggestions = DEFAULT_SUGGESTIONS }: AddClassChipsProps) {
  const [customName, setCustomName] = useState("");
  const existing = new Set(existingNames.map((n) => n.toLowerCase()));

  const available = suggestions.filter((s) => !existing.has(s.toLowerCase()));

  const handleCustomAdd = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    if (existing.has(trimmed.toLowerCase())) return;
    onAdd(trimmed);
    setCustomName("");
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card/50 p-3" data-testid="add-class-chips">
      <div className="text-xs font-medium text-muted-foreground">Quick add</div>
      <div className="flex flex-wrap gap-1.5">
        {available.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">All standard classes already added.</p>
        ) : (
          available.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => onAdd(s)}
              data-testid={`add-class-chip-${s}`}
            >
              <Plus className="h-3 w-3 mr-1" />
              {s}
            </Badge>
          ))
        )}
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCustomAdd();
            }
          }}
          placeholder="Custom class name"
          maxLength={32}
          className="h-8 text-sm"
          data-testid="add-class-custom-input"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleCustomAdd}
          disabled={!customName.trim()}
          data-testid="add-class-custom-button"
        >
          Add
        </Button>
      </div>
    </div>
  );
}
