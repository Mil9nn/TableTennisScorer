import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { IndividualMatch } from "@/types/match.type";
import { Ionicons } from "@expo/vector-icons";
import { getDisplayName } from "@/lib/utils";
import { getSetScores } from "@/lib/match/singlesClient";

interface TournamentMatchRowProps {
  match: IndividualMatch;
  roundNumber?: number;
  matchNumber?: number;
}

export default function TournamentMatchRow({
  match,
  roundNumber,
  matchNumber,
}: TournamentMatchRowProps) {
  const router = useRouter();
  const [side1Player1, side1Player2] =
    match.matchType === "singles"
      ? [match.participants[0], null]
      : [match.participants[0], match.participants[1]];

  const [side2Player1, side2Player2] =
    match.matchType === "singles"
      ? [match.participants[1], null]
      : [match.participants[2], match.participants[3]];

  const isCompleted = match.status === "completed";
  const isLive = match.status === "in_progress";
  const side1Won = match.winnerSide === "side1";
  const side2Won = match.winnerSide === "side2";
  const [side1Sets, side2Sets] = getSetScores(match);

  const getStatusBadge = () => {
    switch (match.status) {
      case "completed":
        return (
          <Badge variant="success" size="sm">
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="info" size="sm">
            Live
          </Badge>
        );
      case "scheduled":
        return (
          <Badge variant="warning" size="sm">
            Scheduled
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      onPress={() => router.push(`/match/${match._id}` as any)}
      className="flex-row items-center py-3 px-4 border-b border-gray-100 bg-white"
      activeOpacity={0.7}
    >
      {/* Round/Match Number */}
      <View className="w-12 items-center">
        {roundNumber && (
          <Text className="text-xs text-gray-500 font-medium">R{roundNumber}</Text>
        )}
        {matchNumber && (
          <Text className="text-[10px] text-gray-400">#{matchNumber}</Text>
        )}
      </View>

      {/* Side 1 Players */}
      <View className="flex-1 flex-row items-center gap-2 min-w-0">
        <Avatar
          src={side1Player1?.profileImage}
          alt={getDisplayName(side1Player1)}
          size={32}
        />
        <View className="flex-1 min-w-0">
          <Text
            className={`text-sm font-medium ${
              side1Won ? "text-blue-600 font-semibold" : "text-gray-700"
            }`}
          >
            {getDisplayName(side1Player1) || "TBD"}
          </Text>
          {side1Player2 && (
            <Text
              className={`text-xs ${
                side1Won ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {getDisplayName(side1Player2)}
            </Text>
          )}
        </View>
        {side1Won && (
          <Ionicons name="trophy" size={16} color="#fbbf24" />
        )}
      </View>

      {/* Score */}
      <View className="flex-row items-center justify-center gap-2 px-4">
        {isCompleted ? (
          <View className="flex-row items-center gap-2">
            <Text
              className={`text-lg font-bold ${
                side1Won ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {side1Sets}
            </Text>
            <Text className="text-gray-400">-</Text>
            <Text
              className={`text-lg font-bold ${
                side2Won ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {side2Sets}
            </Text>
          </View>
        ) : (
          <Text className="text-xs text-gray-400">vs</Text>
        )}
      </View>

      {/* Side 2 Players */}
      <View className="flex-1 flex-row items-center gap-2 min-w-0 justify-end">
        {side2Won && (
          <Ionicons name="trophy" size={16} color="#fbbf24" />
        )}
        <Avatar
          src={side2Player1?.profileImage}
          alt={getDisplayName(side2Player1)}
          size={32}
        />
        <View className="flex-1 min-w-0 items-end">
          <Text
            className={`text-sm font-medium text-right ${
              side2Won ? "text-blue-600 font-semibold" : "text-gray-700"
            }`}
          >
            {getDisplayName(side2Player1) || "TBD"}
          </Text>
          {side2Player2 && (
            <Text
              className={`text-xs text-right ${
                side2Won ? "text-blue-500" : "text-gray-500"
              }`}
            >
              {getDisplayName(side2Player2)}
            </Text>
          )}
        </View>
      </View>

      {/* Status */}
      <View className="ml-2">{getStatusBadge()}</View>
    </TouchableOpacity>
  );
}

