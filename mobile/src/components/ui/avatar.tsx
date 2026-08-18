import * as React from "react";
import { View, Image, Text } from "react-native";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
  {
    variants: {
      size: {
        default: "h-10 w-10",
        sm: "h-8 w-8",
        lg: "h-14 w-14",
        xl: "h-20 w-20",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof View>,
    VariantProps<typeof avatarVariants> {
  src?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<React.ElementRef<typeof View>, AvatarProps>(
  ({ className, size, src, fallback, ...props }, ref) => {
    return (
      <View ref={ref} className={cn(avatarVariants({ size }), className)} {...props}>
        {src ? (
          <Image
            source={{ uri: src }}
            className="flex-1 h-full w-full aspect-square"
          />
        ) : (
          <View className="flex-1 h-full w-full items-center justify-center rounded-full bg-muted">
            <Text className="text-muted-foreground font-semibold">
              {fallback?.substring(0, 2).toUpperCase() || "CN"}
            </Text>
          </View>
        )}
      </View>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
