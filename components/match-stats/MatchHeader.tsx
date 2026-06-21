import React from "react";
import { View, Text, TouchableOpacity, Share } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

interface MatchHeaderProps {
  matchId: string;
  matchCategory: string;
  side1Name: string;
  side2Name: string;
}

export function MatchHeader({
  matchId,
  matchCategory,
  side1Name,
  side2Name,
}: MatchHeaderProps) {

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Match Stats - ${side1Name} vs ${side2Name}`,
        title: `Match Stats - ${side1Name} vs ${side2Name}`,
      });
      Toast.show({
        type: "success",
        text1: "Match shared!",
      });
    } catch (err) {
      console.error("Share failed:", err);
    }
  };

  return (
    <View className="w-full flex-row items-center justify-between p-4 border-b border-gray-200">
      {/* LEFT: Back + Title */}
      <View className="flex-row items-center gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="rounded-full p-2 bg-gray-100"
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        <View className="flex-col">
          <Text className="text-lg font-semibold text-gray-900">
            Match Overview
          </Text>
        </View>
      </View>

      {/* RIGHT: Share */}
      <TouchableOpacity
        onPress={handleShare}
        className="flex-row items-center gap-2 px-4 py-2 rounded-full border border-gray-300"
        activeOpacity={0.7}
      >
        <Ionicons name="share-outline" size={16} color="#374151" />
        <Text className="text-sm font-medium text-gray-700">Share</Text>
      </TouchableOpacity>
    </View>
  );
}

