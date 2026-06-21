import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { LineWeakness } from "@/types/weaknesses.type";
import { Ionicons } from "@expo/vector-icons";
import { RecommendationText } from "./RecommendationText";

interface LineWeaknessChartProps {
  lineWeaknesses: LineWeakness[];
}

export function LineWeaknessChart({ lineWeaknesses }: LineWeaknessChartProps) {
  const sortedLines = [...lineWeaknesses]
    .filter((l) => l.totalShots >= 5)
    .sort((a, b) => a.winRate - b.winRate);

  if (sortedLines.length === 0) {
    return null;
  }

  const getProgressColor = (winRate: number) => {
    if (winRate >= 55) return "#10b981"; // Green
    if (winRate >= 45) return "#f59e0b"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <Card>
      <View className="p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900">
          Line of Play Analysis
        </Text>
        <Text className="text-sm text-gray-500">
          Your performance when playing different shot trajectories
        </Text>
      </View>
      <View className="p-4 gap-4">
        {sortedLines.map((line, idx) => {
          const isVulnerable = line.winRate < 45;
          const opponentEffective = line.averageOpponentWinRate > 55;

          return (
            <View key={idx} className="gap-2">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="font-semibold capitalize text-sm">{line.line}</Text>
                  {isVulnerable && (
                    <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  )}
                  {opponentEffective && (
                    <Ionicons name="trending-up" size={16} color="#f97316" />
                  )}
                </View>
                <Text className="text-sm text-gray-500">
                  {line.wins}W / {line.losses}L
                </Text>
              </View>

              {/* Win Rate Bar */}
              <View className="gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Your Win Rate</Text>
                  <Text
                    className={`text-xs font-semibold ${
                      line.winRate < 45
                        ? "text-red-600"
                        : line.winRate > 55
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {line.winRate.toFixed(1)}%
                  </Text>
                </View>
                <Progress
                  value={line.winRate}
                  color={getProgressColor(line.winRate)}
                />
              </View>

              {/* Opponent Success Rate */}
              {line.averageOpponentWinRate > 0 && (
                <View className="gap-1">
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-gray-500">Opponent Success vs You</Text>
                    <Text
                      className={`text-xs font-semibold ${
                        line.averageOpponentWinRate > 55 ? "text-orange-600" : "text-gray-600"
                      }`}
                    >
                      {line.averageOpponentWinRate.toFixed(1)}%
                    </Text>
                  </View>
                  <Progress
                    value={line.averageOpponentWinRate}
                    color="#f97316"
                  />
                </View>
              )}

              {/* Recommendation */}
              {line.recommendation && (
                <View className="mt-2 pt-2 border-t border-gray-200">
                  <Text className="text-xs text-gray-600 italic">
                    <RecommendationText text={line.recommendation} />
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

