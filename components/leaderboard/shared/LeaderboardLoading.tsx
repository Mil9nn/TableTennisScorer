import React from "react";
import { View, ActivityIndicator } from "react-native";

export function LeaderboardLoading() {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

