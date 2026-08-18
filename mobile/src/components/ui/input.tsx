import * as React from "react";
import { TextInput, type TextInputProps } from "react-native";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, TextInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base text-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        placeholderTextColor="#8a8a8e"
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
