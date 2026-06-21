import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak === 0) return null;

  const isWin = streak > 0;
  const absStreak = Math.abs(streak);

  return (
    <View className="flex-row items-center gap-1">
      <Ionicons
        name="flame"
        size={12}
        color={isWin ? "#10b981" : "#ef4444"}
      />
      <Text
        className={cn(
          "text-xs font-medium",
          isWin ? "text-green-700" : "text-red-700"
        )}
      >
        {absStreak}
      </Text>
    </View>
  );
}

