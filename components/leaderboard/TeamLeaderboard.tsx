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
import { getDisplayName } from "@/lib/leaderboard/utils";
import { TeamStats } from "@/types/leaderboard";
import { Ionicons } from "@expo/vector-icons";

interface TeamLeaderboardProps {
  data: TeamStats[];
  loading: boolean;
  currentUserId?: string;
}

const TeamRow = ({
  entry,
  isTopThree,
  isCurrentUser,
  isExpanded,
  onToggleExpand,
  onClick,
}: {
  entry: TeamStats;
  isTopThree: boolean;
  isCurrentUser: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
}) => {
  const router = useRouter();
  const isRank1 = entry.rank === 1;
  const isRank2or3 = entry.rank === 2 || entry.rank === 3;

  return (
    <>
      <TouchableOpacity
        onPress={onToggleExpand}
        activeOpacity={0.7}
        className={`px-4 py-4 border-l-4 flex-row items-center gap-3 ${
          isCurrentUser || isRank1
            ? "bg-indigo-50 border-l-indigo-600"
            : isRank2or3
            ? "bg-white border-l-gray-200"
            : "bg-white border-l-transparent"
        }`}
      >
        <RankBadge rank={entry.rank} />

        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            router.push(`/teams/${entry.team._id}` as any);
          }}
          activeOpacity={0.7}
        >
          <Avatar
            src={entry.team.logo}
            alt={entry.team.name}
            size={48}
            className={
              isTopThree
                ? isRank1
                  ? "border-[2.5px] border-indigo-600"
                  : "border-[1.5px] border-gray-300"
                : undefined
            }
          />
        </TouchableOpacity>

        <View className="flex-1 min-w-0">
          <View className="flex-row items-center justify-between mb-1 gap-2">
            <View className="flex-row items-center gap-2 flex-1 min-w-0">
              <Text
                className="text-sm font-semibold text-gray-900"
                numberOfLines={1}
              >
                {entry.team.name}
              </Text>
              {entry.stats.currentStreak !== 0 && (
                <StreakBadge streak={entry.stats.currentStreak} />
              )}
            </View>
            <Text className="text-xs text-gray-600 flex-shrink-0">
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
            <Text className="text-xs font-semibold text-rose-600">
              {entry.stats.losses}
            </Text>
            <Text className="text-[10px] text-gray-500">losses</Text>
            {entry.stats.ties > 0 && (
              <>
                <Text className="text-gray-300">•</Text>
                <Text className="text-xs font-semibold text-gray-900">
                  {entry.stats.ties}
                </Text>
                <Text className="text-[10px] text-gray-500">ties</Text>
              </>
            )}
            <Text className="text-gray-300">•</Text>
            <Text className="text-xs font-semibold text-gray-900">
              {entry.stats.subMatchesWon}
            </Text>
            <Text className="text-[10px] text-gray-500">smw</Text>
          </View>
        </View>

        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color="#6b7280"
        />
      </TouchableOpacity>

      {/* Expanded Player Stats */}
      {isExpanded && entry.playerStats.length > 0 && (
        <View
          className="bg-indigo-50 border-l-4 border-l-indigo-600 px-4 py-3"
          style={{
            borderLeftColor: "#4f46e5",
          }}
        >
          <Text className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Player Performance
          </Text>
          <View className="gap-2">
            {entry.playerStats.map((playerStat) => (
              <TouchableOpacity
                key={playerStat.player._id}
                onPress={() =>
                  router.push(
                    `/profile/${playerStat.player._id}` as any
                  )
                }
                activeOpacity={0.7}
                className="flex-row items-center gap-2 bg-white border border-indigo-200 rounded-lg p-2"
              >
                <Avatar
                  src={playerStat.player.profileImage}
                  alt={getDisplayName(playerStat.player)}
                  size={32}
                />
                <View className="flex-1 min-w-0">
                  <Text
                    className="text-xs font-medium text-gray-900"
                    numberOfLines={1}
                  >
                    {getDisplayName(playerStat.player)}
                  </Text>
                  <Text className="text-[10px] text-gray-500">
                    {playerStat.subMatchesWon}/{playerStat.subMatchesPlayed}
                  </Text>
                </View>
                <Text className="text-xs font-semibold text-indigo-600">
                  {playerStat.winRate}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </>
  );
};

export function TeamLeaderboard({
  data,
  loading,
  currentUserId,
}: TeamLeaderboardProps) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  if (loading) return <LeaderboardLoading />;
  if (data.length === 0) return <LeaderboardEmpty message="No team matches yet" />;

  // Find teams where current user is a member
  const currentUserTeams = currentUserId
    ? data.filter((entry) =>
        entry.playerStats.some((ps) => ps.player._id === currentUserId)
      )
    : [];

  // Find current user's team entry (if not in top 3)
  const currentUserEntry = currentUserTeams.find((team) => team.rank > 3);

  const topThree = data.slice(0, 3);
  const others = data.slice(3);

  return (
    <View className="flex-1">
      {/* Current User Team Section - Show if not in top 3 */}
      {currentUserEntry && (
        <>
          <View className="bg-indigo-50 border border-indigo-200 border-b-0">
            <TeamRow
              entry={currentUserEntry}
              isTopThree={false}
              isCurrentUser={true}
              isExpanded={expandedTeam === currentUserEntry.team._id}
              onToggleExpand={() =>
                setExpandedTeam(
                  expandedTeam === currentUserEntry.team._id
                    ? null
                    : currentUserEntry.team._id
                )
              }
              onClick={() => {}}
            />
          </View>
          <View
            className="h-px mx-4"
            style={{
              backgroundColor: "rgba(99, 102, 241, 0.2)",
            }}
          />
        </>
      )}

      {/* Top 3 Teams */}
      <FlatList
        data={topThree}
        renderItem={({ item: entry }) => (
          <View className="border-b border-gray-200">
            <TeamRow
              entry={entry}
              isTopThree={true}
              isCurrentUser={currentUserTeams.some(
                (team) => team.team._id === entry.team._id
              )}
              isExpanded={expandedTeam === entry.team._id}
              onToggleExpand={() =>
                setExpandedTeam(
                  expandedTeam === entry.team._id ? null : entry.team._id
                )
              }
              onClick={() => {}}
            />
          </View>
        )}
        keyExtractor={(item) => item.team._id}
        scrollEnabled={false}
      />

      {/* Remaining Teams (Rank 4+) */}
      <FlatList
        data={others}
        renderItem={({ item: entry }) => (
          <View className="border-b border-gray-200">
            <TeamRow
              entry={entry}
              isTopThree={false}
              isCurrentUser={currentUserTeams.some(
                (team) => team.team._id === entry.team._id
              )}
              isExpanded={expandedTeam === entry.team._id}
              onToggleExpand={() =>
                setExpandedTeam(
                  expandedTeam === entry.team._id ? null : entry.team._id
                )
              }
              onClick={() => {}}
            />
          </View>
        )}
        keyExtractor={(item) => item.team._id}
        scrollEnabled={false}
      />
    </View>
  );
}
