import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import {
  ServeWeaknessData,
  ReceiveWeaknessData,
} from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { RecommendationText } from "./RecommendationText";

interface ServeReceiveWeaknessCardProps {
  serveStats: ServeWeaknessData;
  receiveStats: ReceiveWeaknessData;
}

export function ServeReceiveWeaknessCard({
  serveStats,
  receiveStats,
}: ServeReceiveWeaknessCardProps) {
  const getProgressColor = (winRate: number) => {
    if (winRate >= 55) return "#10b981"; // Green
    if (winRate >= 45) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  // Get top 3 weakest receive types
  const weakestReceiveTypes = Object.entries(receiveStats.vsStrokeType)
    .filter(([_, stats]) => stats.received >= 3)
    .sort((a, b) => a[1].winRate - b[1].winRate)
    .slice(0, 3);

  return (
    <View className="flex-row gap-4">
      {/* Serve Stats */}
      <Card className="flex-1">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Serve Performance
          </Text>
        </View>
        <View className="p-4 gap-4">
          {/* Progress Bar */}
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600">Wins: {serveStats.servesWon}</Text>
              <Text className="text-xs text-gray-600">Losses: {serveStats.servesLost}</Text>
            </View>
            <Progress
              value={serveStats.serveWinRate}
              color={getProgressColor(serveStats.serveWinRate)}
            />
            <Text className="text-xs text-gray-500 text-center">
              Total Serves: {serveStats.totalServes}
            </Text>
          </View>

          {/* Recommendation */}
          <View className="pt-2 border-t border-gray-200">
            <Text
              className={`text-xs italic ${
                serveStats.recommendation?.includes("Need more")
                  ? "text-gray-500"
                  : "text-gray-600"
              }`}
            >
              <RecommendationText text={serveStats.recommendation} />
            </Text>
            {serveStats.totalServes > 0 && serveStats.totalServes < 3 && (
              <Text className="text-xs text-gray-400 mt-1">
                (Minimum 3 serves needed for accurate analysis)
              </Text>
            )}
          </View>
        </View>
      </Card>

      {/* Receive Stats */}
      <Card className="flex-1">
        <View className="p-4 border-b border-gray-200">
          <Text className="text-lg font-semibold text-gray-900">
            Receive Performance
          </Text>
        </View>
        <View className="p-4 gap-4">
          {/* Progress Bar */}
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600">
                Wins: {receiveStats.receivesWon}
              </Text>
              <Text className="text-xs text-gray-600">
                Losses: {receiveStats.receivesLost}
              </Text>
            </View>
            <Progress
              value={receiveStats.receiveWinRate}
              color={getProgressColor(receiveStats.receiveWinRate)}
            />
            <Text className="text-xs text-gray-500 text-center">
              Total Receives: {receiveStats.totalReceives}
            </Text>
          </View>

          {/* Weakest Receive Types */}
          {weakestReceiveTypes.length > 0 && (
            <View className="pt-2 border-t border-gray-200 gap-2">
              <Text className="text-xs font-semibold text-gray-700">
                Weakest vs Stroke Types:
              </Text>
              <ScrollView>
                {weakestReceiveTypes.map(([stroke, stats], index) => (
                  <View
                    key={index}
                    className="mb-2 p-2 bg-red-50 rounded border border-red-200"
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="text-xs font-medium text-red-900">
                        {formatStrokeName(stroke)}
                      </Text>
                      <Text className="text-xs font-semibold text-red-600">
                        {stats.winRate.toFixed(1)}%
                      </Text>
                    </View>
                    <Text className="text-xs text-red-700 mt-1">
                      {stats.received} received
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Recommendation */}
          <View className="pt-2 border-t border-gray-200">
            <Text
              className={`text-xs italic ${
                receiveStats.recommendation?.includes("Need more")
                  ? "text-gray-500"
                  : "text-gray-600"
              }`}
            >
              <RecommendationText text={receiveStats.recommendation} />
            </Text>
            {receiveStats.totalReceives > 0 && receiveStats.totalReceives < 3 && (
              <Text className="text-xs text-gray-400 mt-1">
                (Minimum 3 receives needed for accurate analysis)
              </Text>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
}

