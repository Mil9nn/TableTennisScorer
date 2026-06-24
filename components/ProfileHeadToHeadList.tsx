import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Avatar } from "react-native-paper";
import { getAvatarFallbackStyle } from "@/lib/leaderboard/utils";
import { HeadToHeadRow } from "@/lib/profile/types";
import { DesignTokens } from "@/constants/designTokens";

interface ProfileHeadToHeadListProps {
  opponents: HeadToHeadRow[];
  onOpponentPress: (opponentId: string, opponentName: string) => void;
}

function PlayerAvatar({
  name,
  profileImage,
  playerId,
  size = 32,
}: {
  name?: string;
  profileImage?: string;
  playerId?: string;
  size?: number;
}) {
  const fallbackInitial = name?.charAt(0).toUpperCase() || "?";
  const fallbackStyle = getAvatarFallbackStyle(playerId ?? "");

  return profileImage ? (
    <Image
      source={{ uri: profileImage }}
      style={[
        styles.avatarImg,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: "#e5e7eb",
        },
      ]}
    />
  ) : (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fallbackStyle.backgroundColor,
          borderWidth: 1,
          borderColor: "#e5e7eb",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text
        style={{
          fontSize: size * 0.4,
          fontWeight: "bold",
          color: fallbackStyle.color,
        }}
      >
        {fallbackInitial}
      </Text>
    </View>
  );
}

export default function ProfileHeadToHeadList({ opponents, onOpponentPress }: ProfileHeadToHeadListProps) {
  if (!opponents || opponents.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No head-to-head yet</Text>
        <Text style={styles.emptySubtext}>Play more matches to generate opponents.</Text>
      </View>
    );
  }

  const renderOpponent = (opponent: HeadToHeadRow) => {
    const opponentId = String(opponent.opponent?._id ?? "");
    const opponentName = opponent.opponent?.fullName || "Unknown Player";
    const winRate = Math.round(opponent.winRate);

    return (
      <TouchableOpacity
        key={opponentId}
        style={styles.opponentCard}
        onPress={() => onOpponentPress(opponentId, opponentName)}
        activeOpacity={0.7}
      >
        {/* Player Avatar */}
        <View style={styles.avatarContainer}>
          <PlayerAvatar
            name={opponent.opponent?.fullName}
            profileImage={opponent.opponent?.profileImage}
            playerId={opponent.opponent?._id}
            size={40}
          />
        </View>

        {/* Player Info */}
        <View style={styles.opponentInfo}>
          <Text style={styles.opponentName} numberOfLines={1}>
            vs {opponentName}
          </Text>
          <Text style={styles.opponentUsername} numberOfLines={1}>
            @{opponent.opponent?.username || opponentId}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.recordContainer}>
            <Text style={styles.winsText}>{opponent.wins} Wins</Text>
            <Text style={styles.lossesText}>{opponent.losses} Losses</Text>
          </View>
          <View style={styles.winRateContainer}>
            <Text style={styles.winRateText}>{winRate}% win rate</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {opponents.map(renderOpponent)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatarImg: {
    backgroundColor: "#f3f4f6",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  contextHeader: {
    backgroundColor: DesignTokens.colors.primary[50],
    paddingVertical: DesignTokens.spacing[3],
    paddingHorizontal: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[3],
    borderRadius: DesignTokens.borderRadius.md,
  },
  contextText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.primary[600],
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DesignTokens.spacing[8],
  },
  emptyText: {
    fontSize: DesignTokens.typography.fontSize.xl,
    color: DesignTokens.colors.gray[500],
    textAlign: "center",
    marginBottom: DesignTokens.spacing[2],
  },
  emptySubtext: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.gray[400],
    textAlign: "center",
  },
  opponentCard: {
    backgroundColor: DesignTokens.colors.background.primary,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[2],
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: DesignTokens.spacing[3],
  },
  opponentInfo: {
    flex: 1,
    marginRight: DesignTokens.spacing[3],
  },
  opponentName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[1],
  },
  opponentUsername: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
  },
  statsContainer: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  recordContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[1],
  },
  winsText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.success,
    marginRight: DesignTokens.spacing[2],
  },
  lossesText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.error,
  },
  winRateContainer: {
    backgroundColor: DesignTokens.colors.gray[100],
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.sm,
  },
  winRateText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
});
