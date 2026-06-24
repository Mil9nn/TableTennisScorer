import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Ionicons } from "@expo/vector-icons";
import { OverallInsights } from "@/types/weaknesses.type";
import { RecommendationText } from "./RecommendationText";

interface WeaknessInsightsPanelProps {
  insights: OverallInsights;
}

export function WeaknessInsightsPanel({ insights }: WeaknessInsightsPanelProps) {
  return (
    <View className="gap-4">
      {/* Primary Weakness Alert */}
      <Alert variant="destructive">
        <Ionicons name="alert-circle" size={20} color="#dc2626" />
        <AlertDescription>
          <View className="gap-1">
            <Text className="font-semibold text-red-900">Primary Weakness</Text>
            <Text className="text-sm text-red-800">
              <RecommendationText text={insights.primaryWeakness} />
            </Text>
          </View>
        </AlertDescription>
      </Alert>

      {/* Summary Cards */}
      <View className="flex-row gap-4">
        {/* Secondary Weakness */}
        {insights.secondaryWeakness && (
          <Card className="border-yellow-200 bg-yellow-50 flex-1">
            <View className="p-4 gap-2">
              <View className="flex-row items-start gap-3">
                <Ionicons name="locate" size={20} color="#ca8a04" />
                <View className="flex-1 gap-1">
                  <Text className="font-semibold text-yellow-900 text-sm">
                    Secondary Weakness
                  </Text>
                  <Text className="text-sm text-yellow-800">
                    <RecommendationText text={insights.secondaryWeakness} />
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Strength to Maintain */}
        <Card className="border-green-200 bg-green-50 flex-1">
          <View className="p-4 gap-2">
            <View className="flex-row items-start gap-3">
              <Ionicons name="trending-up" size={20} color="#16a34a" />
              <View className="flex-1 gap-1">
                <Text className="font-semibold text-green-900 text-sm">
                  Strength to Maintain
                </Text>
                <Text className="text-sm text-green-800">
                  <RecommendationText text={insights.strengthToMaintain} />
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {/* Improvement Priorities */}
      {insights.improvementPriority.length > 0 && (
        <Card>
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row items-center gap-2">
              <Ionicons name="checkmark-circle" size={20} color="#2563eb" />
              <Text className="text-lg font-semibold text-gray-900">
                Priority Improvements
              </Text>
            </View>
          </View>
          <View className="p-4 gap-3">
            {insights.improvementPriority.map((priority, index) => (
              <View
                key={index}
                className="flex-row items-start gap-3 p-3 rounded-lg bg-gray-50"
              >
                <Badge
                  variant={index === 0 ? "error" : "default"}
                  size="sm"
                >
                  #{index + 1}
                </Badge>
                <Text className="text-sm text-gray-700 flex-1">
                  <RecommendationText text={priority} />
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}

