import React from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { Card } from "@/components/ui/Card";
import { BarChart } from "@/components/charts/BarChart";
import { ShotWeaknessData } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { RecommendationText } from "./RecommendationText";

interface ShotWeaknessChartProps {
  shotWeaknesses: ShotWeaknessData[];
  showTop?: number;
  variant?: "weaknesses" | "strengths" | "all";
}

export function ShotWeaknessChart({
  shotWeaknesses,
  showTop = 10,
  variant = "weaknesses",
}: ShotWeaknessChartProps) {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = Math.max(screenWidth - 64, 280);

  // Filter and sort based on variant
  let displayData = [...shotWeaknesses];

  if (variant === "weaknesses") {
    displayData = displayData
      .filter((s) => s.totalAttempts >= 5)
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, showTop);
  } else if (variant === "strengths") {
    displayData = displayData
      .filter((s) => s.totalAttempts >= 5)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, showTop);
  } else {
    displayData = displayData.sort((a, b) => a.winRate - b.winRate);
  }

  if (displayData.length === 0) {
    return null;
  }

  // Format data for chart
  const chartData = displayData.map((weakness) => ({
    label: formatStrokeName(weakness.stroke),
    value: weakness.winRate,
    fullData: weakness,
  }));

  // Get color based on win rate
  const getBarColor = (winRate: number) => {
    if (winRate >= 60) return "#10b981"; // Green
    if (winRate >= 50) return "#f59e0b"; // Yellow
    if (winRate >= 40) return "#f97316"; // Orange
    return "#ef4444"; // Red
  };

  return (
    <Card>
      <View className="p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900">
          Shot Type Performance
        </Text>
        <Text className="text-xs text-gray-500 mt-1">
          {variant === "weaknesses"
            ? "Weakest shots (lowest win rate)"
            : variant === "strengths"
            ? "Strongest shots (highest win rate)"
            : "All shots by win rate"}
        </Text>
      </View>
      <View className="p-4">
        <BarChart
          data={chartData}
          width={chartWidth}
          height={200}
          showGrid
          showValues
        />
        <ScrollView className="mt-4 max-h-48">
          {displayData.map((weakness, index) => (
            <View
              key={index}
              className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold text-sm text-gray-900">
                  {formatStrokeName(weakness.stroke)}
                </Text>
                <View
                  className="px-2 py-1 rounded"
                  style={{ backgroundColor: getBarColor(weakness.winRate) + "20" }}
                >
                  <Text
                    className="text-xs font-semibold"
                    style={{ color: getBarColor(weakness.winRate) }}
                  >
                    {weakness.winRate.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <View className="gap-1">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Win Rate:</Text>
                  <Text className="text-xs font-semibold text-green-600">
                    {weakness.winRate.toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Loss Rate:</Text>
                  <Text className="text-xs font-semibold text-red-600">
                    {weakness.lossRate.toFixed(1)}%
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Attempts:</Text>
                  <Text className="text-xs font-semibold">{weakness.totalAttempts}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Wins/Losses:</Text>
                  <Text className="text-xs font-semibold">
                    {weakness.pointsWon}/{weakness.pointsLost}
                  </Text>
                </View>
              </View>
              {weakness.recommendation && (
                <View className="mt-2 pt-2 border-t border-gray-200">
                  <Text className="text-xs text-gray-500 italic">
                    <RecommendationText text={weakness.recommendation} />
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Card>
  );
}

