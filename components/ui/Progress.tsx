import React from "react";
import { View } from "react-native";
import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0-100
  className?: string;
  indicatorClassName?: string;
  color?: string;
}

export function Progress({
  value,
  className,
  indicatorClassName,
  color = "#3b82f6",
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
        className
      )}
    >
      <View
        className={cn("h-full rounded-full transition-all", indicatorClassName)}
        style={{
          width: `${clampedValue}%`,
          backgroundColor: color,
        }}
      />
    </View>
  );
}

