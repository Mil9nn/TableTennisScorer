import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface LeaderboardEmptyProps {
  message: string;
  icon?: React.ReactNode;
}

export function LeaderboardEmpty({ message, icon }: LeaderboardEmptyProps) {
  const IconToRender = icon || (
    <Ionicons name="podium-outline" size={40} color="#9ca3af" />
  );

  return (
    <View className="flex-1 items-center justify-center py-16">
      <View className="mb-2">{IconToRender}</View>
      <Text className="text-sm text-gray-500">{message}</Text>
    </View>
  );
}

