import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "@/components/ui/Avatar";
import { RankBadge } from "./shared/RankBadge";
import { StreakBadge } from "./shared/StreakBadge";
import { LeaderboardEmpty, LeaderboardLoading } from "./shared";
import { PlayerDetailsDialog } from "./shared/PlayerDetailsDialog";
import { getDisplayName, getAvatarFallbackStyle, formatDifferential } from "@/lib/leaderboard/utils";
import { PlayerStats } from "@/types/leaderboard";

interface PlayerLeaderboardProps {
  data: PlayerStats[];
  loading: boolean;
  emptyMessage: string;
  currentUserId?: string;
}

const PlayerRow = ({
  entry,
  isTopThree,
  isCurrentUser,
  onClick,
}: {
  entry: PlayerStats;
  isTopThree: boolean;
  isCurrentUser: boolean;
  onClick: () => void;
}) => {
  const router = useRouter();
  const isRank1 = entry.rank === 1;
  const isRank2or3 = entry.rank === 2 || entry.rank === 3;

  // Determine background color based on rank
  const getBackgroundColor = () => {
    if (entry.rank === 1) return "bg-yellow-100"; // Premium golden
    if (entry.rank === 2) return "bg-gray-100";  // Silver
    if (entry.rank === 3) return "bg-orange-100"; // Bronze
    return isCurrentUser ? "bg-indigo-50" : "bg-white";
  };

  const getBorderColor = () => {
    if (isCurrentUser) return "border-l-indigo-600";
    return "border-l-transparent";
  };

  return (
    <TouchableOpacity
      onPress={onClick}
      activeOpacity={0.7}
      className={`px-4 py-4 border-l-4 ${getBackgroundColor()} ${getBorderColor()}`}
    >
      <View className="flex-row items-center gap-3">
        <RankBadge rank={entry.rank} />

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            router.push(`/profile/${entry.player._id}` as any);
          }}
          activeOpacity={0.7}
        >
          <Avatar
            src={entry.player.profileImage}
            alt={getDisplayName(entry.player)}
            size={48}
          />
        </TouchableOpacity>

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between mb-1 gap-2">
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <Text
                className="text-sm font-semibold text-gray-900"
                numberOfLines={1}
              >
                {getDisplayName(entry.player)}
              </Text>
              {entry.stats.currentStreak !== 0 && (
                <StreakBadge streak={entry.stats.currentStreak} />
              )}
            </View>
            <Text className="text-xs text-gray-600 shrink-0">
              WR:{" "}
              <Text className="font-semibold text-indigo-600">
                {entry.stats.winRate}%
              </Text>
            </Text>
          </View>

          <View className="flex-row items-center gap-1 flex-wrap">
            <Text className="text-xs font-semibold text-gray-900">
              {entry.stats.wins}
            </Text>
            <Text className="text-[10px] text-gray-500">wins</Text>
            <Text className="text-gray-300">•</Text>
            <Text className={`text-xs font-semibold ${
              entry.stats.losses > 0 ? "text-rose-600" : "text-gray-900"
            }`}>
              {entry.stats.losses}
            </Text>
            <Text className="text-[10px] text-gray-500">losses</Text>
            <Text className="text-gray-300">•</Text>
            <Text className="text-xs font-semibold text-gray-900">
              {entry.stats.setsWon}
            </Text>
            <Text className="text-[10px] text-gray-500">sets won</Text>
            <Text className="text-gray-300">•</Text>
            <Text className="text-xs font-semibold text-gray-900">
              {entry.stats.setsLost}
            </Text>
            <Text className="text-[10px] text-gray-500">sets lost</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export function PlayerLeaderboard({
  data,
  loading,
  emptyMessage,
  currentUserId,
}: PlayerLeaderboardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerStats | null>(null);


  if (loading) return <LeaderboardLoading />;
  if (data.length === 0) return <LeaderboardEmpty message={emptyMessage} />;

  // Find current user's entry
  const currentUserEntry = currentUserId
    ? data.find((entry) => entry.player._id === currentUserId)
    : null;

  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <View className="flex-1">
      {/* Current User Section - Show if not in top 3 */}
      {currentUserEntry && currentUserEntry.rank > 3 && (
        <>
          <View className="bg-indigo-50 border border-indigo-200 border-b-0">
            <PlayerRow
              entry={currentUserEntry}
              isTopThree={false}
              isCurrentUser={true}
              onClick={() => setSelectedPlayer(currentUserEntry)}
            />
          </View>
          <View
            className="h-px mx-4"
            style={{
              backgroundColor:
                "transparent",
            }}
          />
        </>
      )}

      {/* Top 3 Players */}
      <FlatList
        data={topThree}
        renderItem={({ item: entry }) => (
          <View className="border-b border-gray-200">
            <PlayerRow
              entry={entry}
              isTopThree={true}
              isCurrentUser={currentUserId === entry.player._id}
              onClick={() => setSelectedPlayer(entry)}
            />
          </View>
        )}
        keyExtractor={(item) => item.player._id}
        scrollEnabled={false}
      />

      {/* Remaining Players (Rank 4+) */}
      <FlatList
        data={others}
        renderItem={({ item: entry }) => (
          <View className="border-b border-gray-200">
            <PlayerRow
              entry={entry}
              isTopThree={false}
              isCurrentUser={currentUserId === entry.player._id}
              onClick={() => setSelectedPlayer(entry)}
            />
          </View>
        )}
        keyExtractor={(item) => item.player._id}
        scrollEnabled={false}
      />

      {/* Stats Modal */}
      <PlayerDetailsDialog
        visible={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        data={selectedPlayer ? {
          profileImage: selectedPlayer.player.profileImage,
          fullName: getDisplayName(selectedPlayer.player),
          username: selectedPlayer.player.username,
          winRate: `${selectedPlayer.stats.winRate}%`,
          streak: formatDifferential(selectedPlayer.stats.currentStreak),
          bestStreak: selectedPlayer.stats.bestStreak,
          wins: selectedPlayer.stats.wins,
          losses: selectedPlayer.stats.losses,
          totalMatches: selectedPlayer.stats.wins + selectedPlayer.stats.losses,
          setsWon: selectedPlayer.stats.setsWon,
          setsLost: selectedPlayer.stats.setsLost,
          pointsScored: selectedPlayer.stats.totalPointsScored || 0,
          pointsConceded: selectedPlayer.stats.totalPointsConceded || 0,
          totalServes: 0, // Will need detailed stats for this
          servesWon: 0,   // Will need detailed stats for this
          servesLost: 0,  // Will need detailed stats for this
        } : null}
      />
    </View>
  );
}
