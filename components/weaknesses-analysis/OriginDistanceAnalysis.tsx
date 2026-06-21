import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OriginDistanceWeakness } from "@/types/weaknesses.type";
import { RecommendationText } from "./RecommendationText";

interface OriginDistanceAnalysisProps {
  distanceWeaknesses: OriginDistanceWeakness[];
}

export function OriginDistanceAnalysis({
  distanceWeaknesses,
}: OriginDistanceAnalysisProps) {
  const distanceOrder = [
    "on-table",
    "close-to-table",
    "mid-distance",
    "far-distance",
  ];
  const sortedDistances = [...distanceWeaknesses].sort(
    (a, b) =>
      distanceOrder.indexOf(a.originZone) - distanceOrder.indexOf(b.originZone)
  );

  const hasData = sortedDistances.some((d) => d.totalShots > 0);

  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <View className="p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-900">
          Distance from Table Analysis
        </Text>
        <Text className="text-sm text-gray-500">
          Your performance based on where you hit shots from
        </Text>
      </View>
      <View className="p-4 gap-4">
        {sortedDistances.map((distance, idx) => {
          if (distance.totalShots === 0) {
            return (
              <View
                key={idx}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50 opacity-60"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="font-semibold capitalize text-sm text-gray-500">
                    {distance.originZone.replace(/-/g, " ")}
                  </Text>
                  <Badge variant="default" size="sm">
                    No data
                  </Badge>
                </View>
                <Text className="text-sm text-gray-400">
                  No shots recorded from this position
                </Text>
              </View>
            );
          }

          const bgColor =
            distance.winRate < 45
              ? "border-red-300 bg-red-50"
              : distance.winRate > 55
              ? "border-green-300 bg-green-50"
              : "border-yellow-300 bg-yellow-50";

          const badgeVariant = distance.winRate < 45 ? "error" : "default";

          return (
            <View key={idx} className={`p-4 border rounded-lg ${bgColor}`}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-semibold capitalize text-sm">
                  {distance.originZone.replace(/-/g, " ")}
                </Text>
                <Badge variant={badgeVariant} size="sm">
                  {distance.winRate.toFixed(0)}%
                </Badge>
              </View>

              <View className="text-sm gap-1 mb-3">
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Total Shots:</Text>
                  <Text className="font-semibold">{distance.totalShots}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">W/L:</Text>
                  <Text className="font-semibold">
                    {distance.wins}/{distance.losses}
                  </Text>
                </View>
              </View>

              {distance.recommendation && (
                <View className="mt-2 pt-2 border-t border-gray-300">
                  <Text className="text-xs text-gray-700">
                    <RecommendationText text={distance.recommendation} />
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

