import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { axiosInstance } from "@/lib/axiosInstance";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Tab } from "@/components/ui/Tab";
import { WeaknessInsightsPanel } from "./WeaknessInsightsPanel";
import { ShotWeaknessChart } from "./ShotWeaknessChart";
import { ServeReceiveWeaknessCard } from "./ServeReceiveWeaknessCard";
import { ZoneHeatmap } from "./ZoneHeatmap";
import { OpponentPatternAnalysis } from "./OpponentPatternAnalysis";
import { ZoneSectorWeaknessTable } from "./ZoneSectorWeaknessTable";
import { LineWeaknessChart } from "./LineWeaknessChart";
import { OriginDistanceAnalysis } from "./OriginDistanceAnalysis";
import {
  hasZoneSectorData,
  hasLineData,
  hasOriginDistanceData,
} from "@/lib/weaknesses-analysis-utils";
import { Ionicons } from "@expo/vector-icons";
import { getDisplayName } from "@/lib/utils";

interface MatchWeaknessesSectionProps {
  matchId: string;
  category: "individual" | "team";
  hideWhenUnavailable?: boolean;
}

export function MatchWeaknessesSection({
  matchId,
  category,
  hideWhenUnavailable = false,
}: MatchWeaknessesSectionProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("0");

  useEffect(() => {
    const fetchWeaknesses = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.get(
          `/matches/${matchId}/weaknesses?category=${category}`
        );

        if (response.data.success) {
          setData(response.data.data);
        } else {
          setError(response.data.message || "Failed to fetch weaknesses");
        }
      } catch (err: any) {
        console.error("Error fetching match weaknesses:", err);
        setError(err.response?.data?.message || "Failed to load weakness analysis");
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchWeaknesses();
    }
  }, [matchId, category]);

  if (loading) {
    return (
      <View className="items-center justify-center py-20">
        <View className="items-center gap-3">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-600">Analyzing match weaknesses...</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    if (hideWhenUnavailable) {
      return null;
    }
    return (
      <Alert variant="warning">
        <Ionicons name="alert-circle" size={20} color="#ca8a04" />
        <AlertDescription>
          <Text className="font-semibold text-yellow-900">No Analysis Available</Text>
          <Text className="text-sm text-yellow-800 mt-1">
            {error || "Insufficient data for weakness analysis in this match."}
          </Text>
        </AlertDescription>
      </Alert>
    );
  }

  const participants = data.participants || [];

  if (participants.length === 0) {
    return (
      <Alert>
        <Ionicons name="alert-circle" size={20} color="#6b7280" />
        <AlertDescription>
          <Text>No participant data available for weakness analysis.</Text>
        </AlertDescription>
      </Alert>
    );
  }

  // Single participant - no tabs needed
  if (participants.length === 1) {
    const participant = participants[0];

    return (
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 gap-6">
          <WeaknessInsightsPanel insights={participant.weaknesses.overallInsights} />

          <View className="gap-4">
            <ShotWeaknessChart
              shotWeaknesses={participant.weaknesses.shotWeaknesses.byStrokeType}
              variant="weaknesses"
              showTop={8}
            />
            <ZoneHeatmap
              zoneData={participant.weaknesses.zoneWeaknesses}
              viewMode="winRate"
            />
          </View>

          <ServeReceiveWeaknessCard
            serveStats={participant.weaknesses.serveReceiveWeaknesses.serve}
            receiveStats={participant.weaknesses.serveReceiveWeaknesses.receive}
          />

          <OpponentPatternAnalysis
            patterns={participant.weaknesses.opponentPatternAnalysis.successfulStrokes}
            maxDisplay={5}
          />

          {/* Semantic Zone Analysis Section */}
          {participant.weaknesses.semanticZoneAnalysis && (
            <View className="gap-4 mt-6">
              {(hasZoneSectorData(participant.weaknesses.semanticZoneAnalysis.zoneSectorWeaknesses) ||
                hasLineData(participant.weaknesses.semanticZoneAnalysis.lineWeaknesses) ||
                hasOriginDistanceData(participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses)) && (
                <View>
                  <Text className="text-xl font-semibold text-gray-900">
                    Semantic Zone Analysis
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Advanced analysis using table zones, sectors, and shot trajectories
                  </Text>
                </View>
              )}

              <ZoneSectorWeaknessTable
                weaknesses={participant.weaknesses.semanticZoneAnalysis.zoneSectorWeaknesses}
                showAll={false}
              />

              <View className="gap-4">
                <LineWeaknessChart
                  lineWeaknesses={participant.weaknesses.semanticZoneAnalysis.lineWeaknesses}
                />
                <OriginDistanceAnalysis
                  distanceWeaknesses={participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // Multiple participants - use tabs
  const tabItems = participants.map((participant: any, index: number) => ({
    value: index.toString(),
    label: getDisplayName(participant),
  }));

  return (
    <View className="flex-1">
      {/* Tab Selector */}
      <View className="p-4 border-b border-gray-200">
        <Tab
          items={tabItems}
          activeTab={selectedTab}
          onTabChange={setSelectedTab}
          scrollable={true}
        />
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {participants.map((participant: any, index: number) => {
          if (selectedTab !== index.toString()) return null;

          return (
            <View key={index} className="p-4 gap-6">
              <WeaknessInsightsPanel insights={participant.weaknesses.overallInsights} />

              <View className="gap-4">
                <ShotWeaknessChart
                  shotWeaknesses={participant.weaknesses.shotWeaknesses.byStrokeType}
                  variant="weaknesses"
                  showTop={8}
                />
                <ZoneHeatmap
                  zoneData={participant.weaknesses.zoneWeaknesses}
                  viewMode="winRate"
                />
              </View>

              <ServeReceiveWeaknessCard
                serveStats={participant.weaknesses.serveReceiveWeaknesses.serve}
                receiveStats={participant.weaknesses.serveReceiveWeaknesses.receive}
              />

              <OpponentPatternAnalysis
                patterns={participant.weaknesses.opponentPatternAnalysis.successfulStrokes}
                maxDisplay={5}
              />

              {/* Semantic Zone Analysis Section */}
              {participant.weaknesses.semanticZoneAnalysis && (
                <View className="gap-4 mt-6">
                  {(hasZoneSectorData(participant.weaknesses.semanticZoneAnalysis.zoneSectorWeaknesses) ||
                    hasLineData(participant.weaknesses.semanticZoneAnalysis.lineWeaknesses) ||
                    hasOriginDistanceData(participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses)) && (
                    <View>
                      <Text className="text-xl font-semibold text-gray-900">
                        Semantic Zone Analysis
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        Advanced analysis using table zones, sectors, and shot trajectories
                      </Text>
                    </View>
                  )}

                  <ZoneSectorWeaknessTable
                    weaknesses={participant.weaknesses.semanticZoneAnalysis.zoneSectorWeaknesses}
                    showAll={false}
                  />

                  <View className="gap-4">
                    <LineWeaknessChart
                      lineWeaknesses={participant.weaknesses.semanticZoneAnalysis.lineWeaknesses}
                    />
                    <OriginDistanceAnalysis
                      distanceWeaknesses={participant.weaknesses.semanticZoneAnalysis.originDistanceWeaknesses}
                    />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

