import React from "react";
import { View, Text } from "react-native";

interface MatchScoreSummaryProps {
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
  totalPoints: number;
  totalGames: number;
}

export function MatchScoreSummary({
  side1Name,
  side2Name,
  side1Sets,
  side2Sets,
  totalPoints,
  totalGames,
}: MatchScoreSummaryProps) {
  const isSide1Winning = side1Sets > side2Sets;
  const isSide2Winning = side2Sets > side1Sets;
  const totalSetsPlayed = (side1Sets || 0) + (side2Sets || 0);

  return (
    <View className="w-full max-w-sm mx-auto p-2 gap-2">
      {/* Main Score Section */}
      <View className="flex-row items-center justify-between">
        {/* Side 1 */}
        <View className="flex-1">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
            {side1Name}
          </Text>
          <Text
            className={`text-lg font-semibold ${
              isSide1Winning ? "text-blue-600" : "text-gray-700"
            }`}
          >
            {side1Sets}
          </Text>
        </View>

        {/* VS */}
        <Text className="text-[10px] px-2 text-gray-500 font-semibold">vs</Text>

        {/* Side 2 */}
        <View className="flex-1 items-end">
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
            {side2Name}
          </Text>
          <Text
            className={`text-lg font-semibold ${
              isSide2Winning ? "text-blue-600" : "text-gray-700"
            }`}
          >
            {side2Sets}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View className="border-t border-gray-300" />

      {/* Stats Footer */}
      <View className="flex-row items-center justify-between">
        <View className="flex-1 items-center">
          <Text className="text-[10px] text-gray-500">Total Points</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {totalPoints || 0}
          </Text>
        </View>

        <View className="w-px h-6 bg-gray-300" />

        <View className="flex-1 items-center">
          <Text className="text-[10px] text-gray-500">Sets Played</Text>
          <Text className="text-sm font-semibold text-gray-900">
            {totalSetsPlayed || 0}
          </Text>
        </View>
      </View>
    </View>
  );
}

