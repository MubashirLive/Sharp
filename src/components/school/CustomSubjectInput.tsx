import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateSubjectCode } from "@/data/subjects";
import { toast } from "sonner";

interface CustomSubjectInputProps {
  onAdd: (name: string, code: string) => void;
  existingCustomNames: string[];
}

export function CustomSubjectInput({ onAdd, existingCustomNames }: CustomSubjectInputProps) {
  const [value, setValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (trimmed.length < 2) {
      toast.error("Subject name too short");
      return;
    }

    if (trimmed.length > 50) {
      toast.error("Subject name too long (max 50 chars)");
      return;
    }

    if (existingCustomNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Subject already exists");
      return;
    }

    const code = generateSubjectCode(trimmed);
    onAdd(trimmed, code);
    setValue("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") {
      setValue("");
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/50 hover:border-foreground/30 rounded-md transition-colors w-full justify-center"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Custom Subject
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Subject name"
        className="h-8 text-xs flex-1"
        autoFocus
      />
      <Button size="sm" variant="default" onClick={handleAdd} className="h-8 px-2" disabled={!value.trim()}>
        <Plus className="h-3.5 w-3.5" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => { setValue(""); setIsAdding(false); }} className="h-8 px-2">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}