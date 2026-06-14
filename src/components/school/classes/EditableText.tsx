import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface EditableTextProps {
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  transform?: (v: string) => string;
  testId?: string;
}

export function EditableText({
  value,
  onChange,
  maxLength,
  placeholder,
  disabled,
  className,
  transform,
  testId,
}: EditableTextProps) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(transform ? transform(e.target.value) : e.target.value)}
      maxLength={maxLength}
      placeholder={placeholder}
      disabled={disabled}
      data-testid={testId}
      className={cn("h-8 px-2 text-sm", className)}
    />
  );
}
