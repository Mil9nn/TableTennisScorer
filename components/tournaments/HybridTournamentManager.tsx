import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { axiosInstance } from "@/lib/axiosInstance";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";

interface HybridStatus {
  isHybrid: boolean;
  format: string;
  currentPhase: string;
  phaseTransitionDate?: Date;
  roundRobinComplete: boolean;
  knockoutComplete: boolean;
  qualifiedCount: number;
  totalParticipants: number;
  hybridConfig: any;
  canTransition: boolean;
  nextAction: string;
  qualificationSummary?: {
    method: string;
    qualifiedCount: number;
    eliminatedCount: number;
    qualificationRate: number;
  };
  roundRobinProgress?: {
    useGroups: boolean;
    groups?: Array<{
      groupId: string;
      groupName: string;
      participantCount: number;
      roundsTotal: number;
      roundsCompleted: number;
      isComplete: boolean;
    }>;
    roundsTotal?: number;
    roundsCompleted?: number;
    isComplete?: boolean;
  };
  knockoutProgress?: {
    currentRound: number;
    totalRounds: number;
    roundsCompleted: number;
    bracketSize: number;
    isComplete: boolean;
  };
}

interface HybridTournamentManagerProps {
  tournamentId: string;
  isOrganizer: boolean;
  onUpdate?: () => void;
}

export function HybridTournamentManager({
  tournamentId,
  isOrganizer,
  onUpdate,
}: HybridTournamentManagerProps) {
  const [status, setStatus] = useState<HybridStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  const fetchStatus = async () => {
    try {
      const { data } = await axiosInstance.get(
        `/tournaments/${tournamentId}/hybrid-status`
      );
      setStatus(data);
    } catch (err) {
      console.error("Error fetching hybrid status:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to load hybrid tournament status",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [tournamentId]);

  const handleTransition = async () => {
    Alert.alert(
      "Transition to Knockout",
      "Ready to transition to knockout phase? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Transition",
          style: "destructive",
          onPress: async () => {
            setTransitioning(true);
            try {
              const { data } = await axiosInstance.post(
                `/tournaments/${tournamentId}/transition-to-knockout`
              );

              Toast.show({
                type: "success",
                text1: "Success",
                text2: data.message || "Tournament transitioned successfully",
              });

              if (data.warnings && data.warnings.length > 0) {
                data.warnings.forEach((warning: string) => {
                  Toast.show({
                    type: "info",
                    text1: "Warning",
                    text2: warning,
                  });
                });
              }

              await fetchStatus();
              if (onUpdate) {
                onUpdate();
              }
            } catch (err: any) {
              console.error("Error transitioning to knockout:", err);
              const details = err.response?.data?.details;
              const detailLine = Array.isArray(details)
                ? details.filter(Boolean).join(" ")
                : typeof details === "string"
                  ? details
                  : "";
              const message =
                err.response?.data?.error || "Failed to transition to knockout phase";
              Toast.show({
                type: "error",
                text1: "Error",
                text2: detailLine ? `${message}: ${detailLine}` : message,
              });
            } finally {
              setTransitioning(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Card>
        <View className="p-6 items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </Card>
    );
  }

  if (!status?.isHybrid) {
    return null;
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "round_robin":
        return "bg-blue-500";
      case "transition":
        return "bg-yellow-500";
      case "knockout":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <View className="">
      <ScrollView className="p-4 gap-4">
        {/* Round Robin Progress */}
        {status.roundRobinProgress && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-gray-700">Round Robin Phase</Text>
            {status.roundRobinProgress.useGroups && status.roundRobinProgress.groups ? (
              <View className="gap-2">
                {status.roundRobinProgress.groups.map((group) => (
                  <View key={group.groupId} className="p-3 bg-gray-50 rounded-lg">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-medium text-gray-900">
                        {group.groupName}
                      </Text>
                      <Badge variant={group.isComplete ? "success" : "default"} size="sm">
                        {group.isComplete ? "Complete" : "In Progress"}
                      </Badge>
                    </View>
                    <Text className="text-xs text-gray-500">
                      {group.roundsCompleted} / {group.roundsTotal} rounds completed
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="p-3 bg-gray-50 rounded-lg">
                <Text className="text-sm text-gray-700">
                  {status.roundRobinProgress.roundsCompleted} / {status.roundRobinProgress.roundsTotal} rounds completed
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Qualification Summary */}
        {status.qualificationSummary && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-gray-700">Qualification</Text>
            <View className="p-3 bg-indigo-50 rounded-lg">
              <Text className="text-sm text-gray-900">
                {status.qualificationSummary.qualifiedCount} participants qualified
              </Text>
              <Text className="text-xs text-gray-600 mt-1">
                Method: {status.qualificationSummary.method}
              </Text>
            </View>
          </View>
        )}

        {/* Knockout Progress */}
        {status.knockoutProgress && (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-gray-700">Knockout Phase</Text>
            <View className="p-3 bg-purple-50 rounded-lg">
              <Text className="text-sm text-gray-900">
                Round {status.knockoutProgress.currentRound} / {status.knockoutProgress.totalRounds}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">
                {status.knockoutProgress.roundsCompleted} rounds completed
              </Text>
            </View>
          </View>
        )}

        {/* Transition Button */}
        {isOrganizer && status.canTransition && (
          <Button
            onPress={handleTransition}
            disabled={transitioning}
            loading={transitioning}
            fullWidth
          >
            Transition to Knockout Phase
          </Button>
        )}

        {/* Next Action */}
        <View className="p-3 bg-blue-50 rounded-lg">
          <Text className="text-sm font-medium text-blue-900">Next Action</Text>
          <Text className="text-xs text-blue-700 mt-1">{status.nextAction}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

