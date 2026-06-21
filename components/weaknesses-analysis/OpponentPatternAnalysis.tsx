import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OpponentPattern } from "@/types/weaknesses.type";
import { formatStrokeName } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { RecommendationText } from "./RecommendationText";

interface OpponentPatternAnalysisProps {
  patterns: OpponentPattern[];
  maxDisplay?: number;
}

export function OpponentPatternAnalysis({
  patterns,
  maxDisplay = 5,
}: OpponentPatternAnalysisProps) {
  const displayPatterns = patterns.slice(0, maxDisplay);

  if (displayPatterns.length === 0) {
    return (
      <Card>
        <View className="p-4 border-b border-gray-200">
          <View className="flex-row items-center gap-2">
            <Ionicons name="trending-up" size={20} color="#6b7280" />
            <Text className="text-lg font-semibold text-gray-900">
              Opponent Patterns
            </Text>
          </View>
        </View>
        <View className="p-4">
          <Text className="text-sm text-gray-500">
            No significant opponent patterns identified yet. Play more matches to see what
            strategies opponents use against you.
          </Text>
        </View>
      </Card>
    );
  }

  const getEffectivenessLevel = (rate: number): {
    label: string;
    color: string;
    bgColor: string;
  } => {
    if (rate >= 70)
      return {
        label: "Critical",
        color: "text-red-700",
        bgColor: "bg-red-100 border-red-300",
      };
    if (rate >= 60)
      return {
        label: "High",
        color: "text-orange-700",
        bgColor: "bg-orange-100 border-orange-300",
      };
    if (rate >= 50)
      return {
        label: "Medium",
        color: "text-yellow-700",
        bgColor: "bg-yellow-100 border-yellow-300",
      };
    return {
      label: "Low",
      color: "text-gray-700",
      bgColor: "bg-gray-100 border-gray-300",
    };
  };

  return (
    <Card>
      <View className="p-4 border-b border-gray-200">
        <View className="flex-row items-center gap-2">
          <Ionicons name="alert-triangle" size={20} color="#f97316" />
          <Text className="text-lg font-semibold text-gray-900">
            What Opponents Use Against You
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          Shots and strategies that opponents successfully use to win points
        </Text>
      </View>
      <View className="p-4 gap-3">
        {displayPatterns.map((pattern, index) => {
          const effectiveness = getEffectivenessLevel(pattern.effectivenessRate);

          return (
            <View
              key={index}
              className={`p-4 rounded-lg border-2 ${effectiveness.bgColor}`}
            >
              <View className="flex-row items-start justify-between gap-4 mb-2">
                <View className="flex-1 gap-2">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-semibold text-sm text-gray-900">
                      {formatStrokeName(pattern.stroke)}
                    </Text>
                    <Badge variant="default" size="sm">
                      {effectiveness.label}
                    </Badge>
                  </View>
                  <Text className="text-xs text-gray-600">
                    Used {pattern.timesUsed} times with {pattern.effectivenessRate.toFixed(1)}% success rate
                  </Text>
                </View>
                <Text className={`text-sm font-semibold ${effectiveness.color}`}>
                  {pattern.effectivenessRate.toFixed(0)}%
                </Text>
              </View>
              {pattern.recommendation && (
                <View className="mt-2 pt-2 border-t border-gray-300">
                  <Text className="text-xs text-gray-700">
                    <RecommendationText text={pattern.recommendation} />
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

