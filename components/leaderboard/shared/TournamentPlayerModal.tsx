import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { Avatar } from "@/components/ui/Avatar";
import { TournamentPlayerStats } from "@/types/leaderboard";
import { getDisplayName } from "@/lib/leaderboard/utils";
import { axiosInstance } from "@/lib/axiosInstance";

interface TournamentPlayerModalProps {
  player: TournamentPlayerStats | null;
  visible: boolean;
  onClose: () => void;
}

interface TournamentSpecificStats {
  tournamentHistory?: {
    name: string;
    placement: "winner" | "finalist" | "semifinalist" | "quarterfinalist" | "participant";
    matchWins: number;
    matchLosses: number;
    date: string;
  }[];
  performanceByCategory?: {
    category: string;
    tournamentsEntered: number;
    won: number;
    placementBreakdown: Record<string, number>;
  }[];
}

export function TournamentPlayerModal({
  player,
  visible,
  onClose,
}: TournamentPlayerModalProps) {
  const [detailedStats, setDetailedStats] = useState<TournamentSpecificStats | null>(null);
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
          `/leaderboard/tournament/player/${player.player._id}/stats`
        );
        setDetailedStats(data.stats);
      } catch (error) {
        console.error("Failed to fetch tournament stats:", error);
        setDetailedStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedStats();
  }, [player, visible]);

  if (!player) return null;

  const stats = player.stats;
  const totalMatches = stats.tournamentMatchWins + stats.tournamentMatchLosses;
  const matchWinPercentage = totalMatches > 0 
    ? ((stats.tournamentMatchWins / totalMatches) * 100).toFixed(1)
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
          className="bg-white rounded-2xl w-full max-h-[85%]"
          onPress={(e) => e.stopPropagation()}
        >
          <ScrollView className="max-h-[85%]">
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
                        <Text className="text-xs font-bold text-white">
                          #{player.rank}
                        </Text>
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
                  {matchWinPercentage}%
                </Text>
              </View>
            </View>

            {/* ===== CONTENT ===== */}
            <View className="p-4 gap-4">
              {/* Tournament Achievements */}
              <View>
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Tournament Achievements
                </Text>
                <View className="flex-row gap-2">
                  {/* Tournaments Won */}
                  <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <MaterialCommunityIcons
                        name="trophy"
                        size={16}
                        color="#FFD700"
                      />
                      <Text className="text-2xl font-bold text-gray-900">
                        {stats.tournamentsWon}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500 font-medium">
                      Tournaments Won
                    </Text>
                  </View>

                  {/* Tournaments Played */}
                  <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                    <Text className="text-2xl font-bold text-gray-900 mb-1">
                      {stats.tournamentsPlayed}
                    </Text>
                    <Text className="text-xs text-gray-500 font-medium">
                      Tournaments Played
                    </Text>
                  </View>
                </View>
              </View>

              {/* Finals & Semifinals */}
              <View>
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Tournament Placements
                </Text>
                <View className="flex-row gap-2">
                  {/* Finals Reached */}
                  <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                    <View className="flex-row items-center gap-2 mb-1">
                      <MaterialCommunityIcons
                        name="medal"
                        size={16}
                        color="#C0C0C0"
                      />
                      <Text className="text-2xl font-bold text-gray-900">
                        {stats.finalsReached}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500 font-medium">
                      Finals Reached
                    </Text>
                  </View>

                  {/* Semifinals Reached */}
                  {stats.semiFinalsReached > 0 && (
                    <View className="flex-1 bg-white border border-gray-200 rounded-lg p-3">
                      <View className="flex-row items-center gap-2 mb-1">
                        <MaterialCommunityIcons
                          name="medal"
                          size={16}
                          color="#CD7F32"
                        />
                        <Text className="text-2xl font-bold text-gray-900">
                          {stats.semiFinalsReached}
                        </Text>
                      </View>
                      <Text className="text-xs text-gray-500 font-medium">
                        Semifinals Reached
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Match Statistics */}
              <View>
                <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Match Statistics
                </Text>
                <View className="gap-2">
                  {/* Wins/Losses */}
                  <View className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <View className="flex-row p-3 border-b border-gray-200">
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-medium mb-1">
                          Wins
                        </Text>
                        <Text className="text-2xl font-bold text-emerald-600">
                          {stats.tournamentMatchWins}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-medium mb-1">
                          Losses
                        </Text>
                        <Text className="text-2xl font-bold text-rose-600">
                          {stats.tournamentMatchLosses}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs text-gray-500 font-medium mb-1">
                          Total
                        </Text>
                        <Text className="text-2xl font-bold text-gray-900">
                          {totalMatches}
                        </Text>
                      </View>
                    </View>

                    {/* Match Win Rate Bar */}
                    <View className="bg-gray-50 px-3 py-3">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-xs text-gray-600 font-medium">
                          Match Win Rate
                        </Text>
                        <Text className="text-sm font-bold text-indigo-600">
                          {matchWinPercentage}%
                        </Text>
                      </View>
                      <View className="h-2 rounded-full overflow-hidden flex-row bg-gray-200">
                        <View
                          className="h-full bg-emerald-600"
                          style={{
                            width: `${
                              totalMatches > 0
                                ? (stats.tournamentMatchWins / totalMatches) * 100
                                : 0
                            }%`,
                          }}
                        />
                        <View className="flex-1 bg-rose-600" />
                      </View>
                    </View>
                  </View>

                  {/* Set Differential */}
                  {stats.tournamentSetDifferential !== 0 && (
                    <View className="bg-white border border-gray-200 rounded-lg p-3">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-gray-500 font-medium">
                          Set Differential
                        </Text>
                        <Text
                          className="text-lg font-bold"
                          style={{
                            color:
                              stats.tournamentSetDifferential > 0
                                ? "#10b981"
                                : "#ef4444",
                          }}
                        >
                          {stats.tournamentSetDifferential > 0 ? "+" : ""}
                          {stats.tournamentSetDifferential}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Tournament Points */}
              {stats.totalTournamentPoints > 0 && (
                <View>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Points
                  </Text>
                  <View className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <View className="flex-row items-baseline gap-2">
                      <Text className="text-3xl font-bold text-indigo-600">
                        {stats.totalTournamentPoints}
                      </Text>
                      <Text className="text-sm text-indigo-600 font-medium">
                        points
                      </Text>
                    </View>
                    <Text className="text-xs text-indigo-600 mt-1">
                      Accumulated from tournament performances
                    </Text>
                  </View>
                </View>
              )}

              {/* Tournament History */}
              {detailedStats?.tournamentHistory && detailedStats.tournamentHistory.length > 0 && (
                <View>
                  <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Recent Tournament Results
                  </Text>
                  <View className="gap-2">
                    {detailedStats.tournamentHistory.slice(0, 5).map((tournament, idx) => (
                      <View
                        key={idx}
                        className="bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <View className="flex-row items-start justify-between mb-1">
                          <Text
                            className="font-semibold text-gray-900 flex-1"
                            numberOfLines={1}
                          >
                            {tournament.name}
                          </Text>
                          <View
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              tournament.placement === "winner"
                                ? "bg-yellow-100 text-yellow-800"
                                : tournament.placement === "finalist"
                                ? "bg-gray-100 text-gray-800"
                                : tournament.placement === "semifinalist"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {tournament.placement === "winner"
                              ? "Won"
                              : tournament.placement === "finalist"
                              ? "2nd"
                              : tournament.placement === "semifinalist"
                              ? "SF"
                              : "Played"}
                          </View>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Text className="text-xs text-gray-500">
                            {tournament.matchWins}W - {tournament.matchLosses}L
                          </Text>
                          <Text className="text-xs text-gray-400">•</Text>
                          <Text className="text-xs text-gray-500">
                            {new Date(tournament.date).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Loading State */}
              {loading && (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text className="text-xs text-gray-500 mt-2">
                    Loading tournament history...
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
