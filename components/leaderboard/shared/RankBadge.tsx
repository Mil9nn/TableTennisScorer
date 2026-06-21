import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: number;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // All ranks now have consistent styling
  if (rank <= 3) {
    return (
      <View
        className={cn(
          "rounded-full bg-gray-100 items-center justify-center",
          sizeClasses[size]
        )}
      >
        <Text className={cn("font-semibold text-gray-700", textSizeClasses[size])}>
          {rank}
        </Text>
      </View>
    );
  }

  return (
    <View className={cn("items-center justify-center", sizeClasses[size])}>
      <Text className={cn("text-gray-500", textSizeClasses[size])}>{rank}</Text>
    </View>
  );
}

