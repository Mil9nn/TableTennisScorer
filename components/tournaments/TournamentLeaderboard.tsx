import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { axiosInstance } from "@/lib/axiosInstance";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Ionicons } from "@expo/vector-icons";
import { getDisplayName } from "@/lib/utils";

interface DetailedPlayerStats {
  participant: {
    _id: string;
    username: string;
    fullName: string;
    profileImage?: string;
  };
  standing: {
    rank: number;
    played: number;
    won: number;
    lost: number;
    drawn: number;
    setsWon: number;
    setsLost: number;
    setsDiff: number;
    pointsScored: number;
    pointsConceded: number;
    pointsDiff: number;
    points: number;
    form: string[];
  };
  advancedStats: {
    winRate: number;
    setsWinRate: number;
    pointsPerMatch: number;
    avgPointsScored: number;
    avgPointsConceded: number;
    avgSetDifferential: number;
    currentStreak: number;
    longestWinStreak: number;
    dominanceRating: number;
  };
  matchHistory: {
    matchId: string;
    opponent: {
      _id: string;
      username: string;
      fullName: string;
    };
    result: "win" | "loss" | "draw";
    score: string;
    setsWon: number;
    setsLost: number;
    pointsScored: number;
    pointsConceded: number;
    date?: Date;
    roundNumber?: number;
    groupId?: string;
  }[];
}

interface TournamentLeaderboardProps {
  tournamentId: string;
}

export default function TournamentLeaderboard({
  tournamentId,
}: TournamentLeaderboardProps) {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] = useState<{
    tournament: any;
    leaderboard: DetailedPlayerStats[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<DetailedPlayerStats | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [tournamentId]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(
        `/tournaments/${tournamentId}/leaderboard/detailed`
      );
      setLeaderboardData(data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakDisplay = (streak: number) => {
    if (streak === 0) return <Text className="text-gray-400 text-[11px]">-</Text>;
    const isWinStreak = streak > 0;
    return (
      <Badge variant={isWinStreak ? "success" : "error"} size="sm">
        <Ionicons name="flame" size={10} color={isWinStreak ? "#10b981" : "#ef4444"} />
        {Math.abs(streak)}
        {isWinStreak ? "W" : "L"}
      </Badge>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center h-64">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!leaderboardData || !leaderboardData.leaderboard) {
    return (
      <View className="p-8 items-center">
        <Text className="text-center text-gray-500">
          No leaderboard data available
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-200 bg-gray-50">
        <View className="flex-row items-center gap-3">
          <View className="p-2 bg-amber-100 rounded-lg">
            <Ionicons name="trophy" size={20} color="#f59e0b" />
          </View>
          <View>
            <Text className="text-sm font-semibold text-gray-700">
              Tournament Leaderboard
            </Text>
            <Text className="text-[11px] text-gray-500 mt-0.5">
              Final standings
            </Text>
          </View>
        </View>
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Text className="text-center text-xs font-medium text-gray-600">
                  Rank
                </Text>
              </TableHead>
              <TableHead className="w-40">
                <Text className="text-xs font-medium text-gray-600">Player</Text>
              </TableHead>
              <TableHead className="w-12">
                <Text className="text-center text-xs font-medium text-gray-600">
                  P
                </Text>
              </TableHead>
              <TableHead className="w-12">
                <Text className="text-center text-xs font-medium text-gray-600">
                  W
                </Text>
              </TableHead>
              <TableHead className="w-12">
                <Text className="text-center text-xs font-medium text-gray-600">
                  L
                </Text>
              </TableHead>
              <TableHead className="w-16">
                <Text className="text-center text-xs font-medium text-gray-600">
                  Sets
                </Text>
              </TableHead>
              <TableHead className="w-20">
                <Text className="text-center text-xs font-semibold text-gray-700">
                  Win%
                </Text>
              </TableHead>
              <TableHead className="w-20">
                <Text className="text-center text-xs font-medium text-gray-600">
                  Streak
                </Text>
              </TableHead>
              <TableHead className="w-16">
                <Text className="text-center text-xs font-medium text-gray-600">
                  Pts
                </Text>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {leaderboardData.leaderboard.map((entry) => {
              const highlight = entry.standing.rank <= 3;
              const winRate = entry.advancedStats.winRate;

              return (
                <TableRow
                  key={entry.participant._id}
                  className={highlight ? "bg-indigo-50/60" : "bg-white"}
                  onPress={() => {
                    router.push(`/profile/${entry.participant._id}` as any);
                  }}
                >
                  {/* Rank */}
                  <TableCell className="w-12">
                    <View className="items-center">
                      {highlight ? (
                        <Text className="text-indigo-600 font-semibold text-xs">
                          {entry.standing.rank}
                        </Text>
                      ) : (
                        <Text className="text-gray-400 text-xs">
                          {entry.standing.rank}
                        </Text>
                      )}
                    </View>
                  </TableCell>

                  {/* Player */}
                  <TableCell className="w-40">
                    <TouchableOpacity
                      onPress={() => {
                        router.push(`/profile/${entry.participant._id}` as any);
                      }}
                      className="flex-row items-center gap-2"
                      activeOpacity={0.7}
                    >
                      <Avatar
                        src={entry.participant.profileImage}
                        alt={getDisplayName(entry.participant)}
                        size={28}
                      />
                      <View className="flex-1">
                        <Text className="text-xs font-medium text-gray-700" numberOfLines={1}>
                          {getDisplayName(entry.participant)}
                        </Text>
                        <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                          @{entry.participant.username}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </TableCell>

                  {/* Played */}
                  <TableCell className="w-12">
                    <Text className="text-center text-sm text-gray-700">
                      {entry.standing.played}
                    </Text>
                  </TableCell>

                  {/* Won */}
                  <TableCell className="w-12">
                    <Text className="text-center text-sm text-green-600 font-medium">
                      {entry.standing.won}
                    </Text>
                  </TableCell>

                  {/* Lost */}
                  <TableCell className="w-12">
                    <Text className="text-center text-sm text-red-600 font-medium">
                      {entry.standing.lost}
                    </Text>
                  </TableCell>

                  {/* Sets */}
                  <TableCell className="w-16">
                    <Text className="text-center text-xs text-gray-700">
                      {entry.standing.setsWon}-{entry.standing.setsLost}
                    </Text>
                  </TableCell>

                  {/* Win% */}
                  <TableCell className="w-20">
                    <View className="items-center">
                      <Badge variant="primary" size="sm">
                        {Math.round(winRate)}%
                      </Badge>
                    </View>
                  </TableCell>

                  {/* Streak */}
                  <TableCell className="w-20">
                    <View className="items-center">
                      {getStreakDisplay(entry.advancedStats.currentStreak)}
                    </View>
                  </TableCell>

                  {/* Points */}
                  <TableCell className="w-16">
                    <Text className="text-center text-sm font-semibold text-gray-700">
                      {entry.standing.points || 0}
                    </Text>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollView>
    </View>
  );
}

