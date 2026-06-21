import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { PlayerStats, FormatSpecificStats } from "@/types/leaderboard";
import { getDisplayName, getDifferentialColor, formatDifferential } from "@/lib/leaderboard/utils";
import { axiosInstance } from "@/lib/axiosInstance";

interface PlayerStatsModalProps {
  player: PlayerStats | null;
  visible: boolean;
  onClose: () => void;
}

export function PlayerStatsModal({
  player,
  visible,
  onClose,
}: PlayerStatsModalProps) {
  const [detailedStats, setDetailedStats] = useState<FormatSpecificStats | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (!player || !visible) {
      setDetailedStats(null);
      return;
    }

    const fetchDetailedStats = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(
          `/leaderboard/player/${player.player._id}/stats?type=singles`
        );
        setDetailedStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch detailed stats:", error);
        setDetailedStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, [player, visible]);

  if (!player) return null;

  const stats = player.stats;
  const totalGames = stats.wins + stats.losses;
  const pointsFor = detailedStats?.points.totalScored ?? 0;
  const pointsAgainst = detailedStats?.points.totalConceded ?? 0;
  const pointsDiff = detailedStats?.points.differential ?? 0;
  const gameDiff = stats.wins - stats.losses;
  const setDiff = stats.setsWon - stats.setsLost;
  const avgPointsPerGame = detailedStats
    ? detailedStats.points.avgPerSet.toFixed(1)
    : "0.0";
  const avgPointsAgainst = detailedStats
    ? detailedStats.points.avgConcededPerSet.toFixed(1)
    : "0.0";


  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center px-4"
        onPress={onClose}
      >
        <Pressable
          className="bg-white rounded-2xl w-full max-h-[90vh]"
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView className="max-h-[80vh]" showsVerticalScrollIndicator={true}>
            {/* ===== HEADER ===== */}
            <View className="px-4 py-4 border-b border-gray-200">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <Avatar
                    src={player.player.profileImage}
                    alt={getDisplayName(player.player)}
                    size={56}
                  />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
                        {getDisplayName(player.player)}
                      </Text>
                      <View className="bg-indigo-600 px-2 py-1 rounded">
                        <Text className="text-xs font-bold text-white">#{player.rank}</Text>
                      </View>
                    </View>
                    <Text className="text-sm text-gray-500">
                      @{player.player.username}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={onClose}
                  className="p-2"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#6b7280" />
                </Pressable>
              </View>

              <View className="items-end">
                <Text className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Win Rate
                </Text>
                <Text className="text-3xl font-bold text-indigo-600">
                  {stats.winRate}%
                </Text>
              </View>
            </View>

            {/* ===== CONTENT ===== */}
            <View className="p-4 gap-4">
              {/* Performance Overview */}
              <View>
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Performance Overview
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                    <Text className="text-2xl font-bold text-emerald-500 mb-1">
                      {stats.wins}
                    </Text>
                    <Text className="text-xs text-gray-500 font-medium">Wins</Text>
                    <View className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <View
                        className="h-full bg-emerald-500"
                        style={{
                          width:
                            totalGames > 0
                              ? `${(stats.wins / totalGames) * 100}%`
                              : "0%",
                        }}
                      />
                    </View>
                  </View>

                  <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                    <Text className="text-2xl font-bold text-rose-500 mb-1">
                      {stats.losses}
                    </Text>
                    <Text className="text-xs text-gray-500 font-medium">Losses</Text>
                    <View className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <View
                        className="h-full bg-rose-500"
                        style={{
                          width:
                            totalGames > 0
                              ? `${(stats.losses / totalGames) * 100}%`
                              : "0%",
                        }}
                      />
                    </View>
                  </View>

                  <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                    <Text className="text-2xl font-bold text-gray-600 mb-1">
                      {totalGames}
                    </Text>
                    <Text className="text-xs text-gray-500 font-medium">Total</Text>
                    <View className="h-1.5 bg-gray-400 rounded-full mt-2" />
                  </View>
                </View>
              </View>

              {/* Game Statistics */}
              <View>
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Game Statistics
                </Text>
                <View className="gap-2">
                  <View className="bg-white border border-gray-200 rounded-lg p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-gray-500 font-medium">
                        Game Differential
                      </Text>
                      <Text
                        className="text-lg font-bold"
                        style={{
                          color: getDifferentialColor(gameDiff),
                        }}
                      >
                        {formatDifferential(gameDiff)}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-white border border-gray-200 rounded-lg p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-gray-500 font-medium">
                        Set Differential
                      </Text>
                      <Text
                        className="text-lg font-bold"
                        style={{
                          color: getDifferentialColor(setDiff),
                        }}
                      >
                        {formatDifferential(setDiff)}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-white border border-gray-200 rounded-lg p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-gray-500 font-medium">
                        Current Streak
                      </Text>
                      <Text
                        className="text-lg font-bold"
                        style={{
                          color: getDifferentialColor(stats.currentStreak),
                        }}
                      >
                        {formatDifferential(stats.currentStreak)}
                      </Text>
                    </View>
                  </View>

                  <View className="bg-white border border-gray-200 rounded-lg p-3">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs text-gray-500 font-medium">
                        Best Streak
                      </Text>
                      <Text className="text-lg font-bold text-gray-900">
                        +{stats.bestStreak}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Point Statistics */}
              {detailedStats && (
                <View>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Point Statistics
                  </Text>
                  <View className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <View className="flex-row p-4 border-b border-gray-200">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-medium mb-1">
                          Scored
                        </Text>
                        <View className="flex-row items-baseline gap-1 flex-wrap">
                          <Text className="text-2xl font-bold text-gray-900">
                            {pointsFor}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            ({avgPointsPerGame}/set)
                          </Text>
                        </View>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-medium mb-1">
                          Conceded
                        </Text>
                        <View className="flex-row items-baseline gap-1 flex-wrap">
                          <Text className="text-2xl font-bold text-gray-900">
                            {pointsAgainst}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            ({avgPointsAgainst}/set)
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="bg-gray-50 p-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-gray-600 font-medium">
                          Point Differential
                        </Text>
                        <Text
                          className="text-2xl font-bold"
                          style={{
                            color: getDifferentialColor(pointsDiff),
                          }}
                        >
                          {formatDifferential(pointsDiff)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Serve Performance */}
              {detailedStats && detailedStats.serve.totalServes > 0 && (
                <View>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Serve Performance
                  </Text>
                  <View className="bg-white border border-gray-200 rounded-lg p-4">
                    <View className="flex-row justify-between items-center mb-4">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-medium mb-1">
                          Total Serves
                        </Text>
                        <Text className="text-2xl font-bold text-gray-900">
                          {detailedStats.serve.totalServes}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-medium mb-1">
                          Won on Serve
                        </Text>
                        <Text className="text-2xl font-bold text-emerald-600">
                          {detailedStats.serve.pointsWonOnServe}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-medium mb-1">
                          Lost
                        </Text>
                        <Text className="text-2xl font-bold text-rose-600">
                          {detailedStats.serve.totalServes - detailedStats.serve.pointsWonOnServe}
                        </Text>
                      </View>
                    </View>

                    <View className="h-2 rounded-full overflow-hidden flex-row bg-gray-100 mb-3">
                      <View
                        className="h-full bg-emerald-600"
                        style={{
                          width: `${(
                            (detailedStats.serve.pointsWonOnServe /
                              detailedStats.serve.totalServes) *
                            100
                          ).toFixed(1)}%`,
                        }}
                      />
                      <View className="flex-1 bg-rose-600" />
                    </View>

                    <View className="items-center">
                      <Text className="text-sm font-bold text-gray-900">
                        {detailedStats.serve.serveWinPercentage.toFixed(1)}% Win Rate
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Loading State */}
              {loading && (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text className="text-xs text-gray-500 mt-2">
                    Loading detailed stats...
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
