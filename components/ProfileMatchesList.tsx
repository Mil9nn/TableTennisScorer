import MatchStatusBadge from "@/components/MatchStatusBadge";
import { DesignTokens } from "@/constants/designTokens";
import { getAvatarFallbackStyle } from "@/lib/leaderboard/utils";
import {
  getProfileMatchResult,
  isParticipantWinner,
} from "@/lib/profile/matchResult";
import { ProfileMatchHistoryItem } from "@/lib/profile/types";
import { formatApiDateShort, formatTimeDuration } from "@/lib/utils";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "react-native-paper";

interface ProfileMatchesListProps {
  matches: ProfileMatchHistoryItem[];
  userId: string;
}

const playerLabel = (
  player: { username?: string; fullName?: string } | undefined,
  fallback: string,
) => player?.username || player?.fullName || fallback;

function formatMatchTypeLabel(matchType?: string) {
  const raw = matchType?.replace(/_/g, " ") || "match";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function getScoreLabel(match: ProfileMatchHistoryItem) {
  const p1 = match.participants?.[0];
  const p2 = match.participants?.[1];
  const sets = match.finalScore?.setsById;
  if (!sets || !p1 || !p2) return null;
  return `${sets[p1._id] ?? 0} – ${sets[p2._id] ?? 0}`;
}

function PlayerAvatar({
  name,
  profileImage,
  playerId,
  size = 24,
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
          borderColor: DesignTokens.colors.border.light,
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
          borderColor: DesignTokens.colors.border.light,
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

export default function ProfileMatchesList({
  matches,
  userId,
}: ProfileMatchesListProps) {
  const handleMatchPress = (match: ProfileMatchHistoryItem) => {
    if (match.matchCategory === "team") {
      router.push(`/match/${match._id}?category=team`);
    } else {
      router.push(`/match/${match._id}?category=individual`);
    }
  };

  const renderIndividualMatch = (match: ProfileMatchHistoryItem) => {
    const player1 = match.participants?.[0];
    const player2 = match.participants?.[1];
    if (!player1 || !player2) return null;

    const result = getProfileMatchResult(match, userId);
    const scoreLabel = getScoreLabel(match);
    const player1IsWinner = isParticipantWinner(match, player1._id);
    const player2IsWinner = isParticipantWinner(match, player2._id);

    return (
      <TouchableOpacity
        key={match._id}
        activeOpacity={0.7}
        onPress={() => handleMatchPress(match)}
      >
        <Card mode="contained" style={styles.matchCard}>
          <Card.Content style={styles.matchCardContent}>
            <View style={styles.matchHeader}>
              <View style={styles.matchIcon}>
                <FontAwesome5
                  name="exchange-alt"
                  size={14}
                  color={DesignTokens.colors.primary[600]}
                />
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchTitle} numberOfLines={1}>
                  {formatMatchTypeLabel(match.matchType)}
                </Text>
                <Text style={styles.matchMeta}>
                  {match.matchCategory === "team" ? "Team" : "Individual"}
                  {match.city ? ` • ${match.city}` : ""}
                </Text>
              </View>
              {result ? (
                <View
                  style={[
                    styles.resultBadge,
                    result === "win" && styles.resultBadgeWin,
                  ]}
                >
                  <Text
                    style={[
                      styles.resultText,
                      result === "win" && styles.resultTextWin,
                    ]}
                  >
                    {result === "win" ? "Win" : "Loss"}
                  </Text>
                </View>
              ) : match.matchDuration ? (
                <MatchStatusBadge
                  status={match.status ?? "completed"}
                  matchDuration={match.matchDuration}
                />
              ) : null}
            </View>

            <View style={styles.matchRow}>
              <View style={styles.playerSection}>
                <View style={styles.playerInfo}>
                  <PlayerAvatar
                    name={player1.username || player1.fullName}
                    profileImage={player1.profileImage}
                    playerId={player1._id}
                  />
                  <Text
                    style={[
                      styles.playerName,
                      player1IsWinner && styles.playerNameWinner,
                    ]}
                    numberOfLines={1}
                  >
                    {playerLabel(player1, "Player 1")}
                  </Text>
                </View>
              </View>

              <View style={styles.scoreContainer} pointerEvents="none">
                {scoreLabel ? (
                  <Text style={styles.scoreText}>{scoreLabel}</Text>
                ) : (
                  <Text style={styles.vsText}>vs</Text>
                )}
              </View>

              <View style={styles.playerSectionRight}>
                <View style={styles.playerInfoRight}>
                  <Text
                    style={[
                      styles.playerName,
                      styles.playerNameRight,
                      player2IsWinner && styles.playerNameWinner,
                    ]}
                    numberOfLines={1}
                  >
                    {playerLabel(player2, "Player 2")}
                  </Text>
                  <PlayerAvatar
                    name={player2.username || player2.fullName}
                    profileImage={player2.profileImage}
                    playerId={player2._id}
                  />
                </View>
              </View>
            </View>

            <View style={styles.matchFooter}>
              <Text style={styles.footerText}>
                {formatApiDateShort(match.createdAt) || "—"}
              </Text>
              {scoreLabel ? (
                <Text style={styles.footerRecord}>{scoreLabel} sets</Text>
              ) : null}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderTeamOrFallbackMatch = (match: ProfileMatchHistoryItem) => {
    const participants = match.participants || [];
    const playerNames = participants
      .map((p) => playerLabel(p, "Unknown"))
      .join(" vs ");

    return (
      <TouchableOpacity
        key={match._id}
        activeOpacity={0.7}
        onPress={() => handleMatchPress(match)}
      >
        <Card mode="contained" style={styles.matchCard}>
          <Card.Content style={styles.matchCardContent}>
            <View style={styles.matchHeader}>
              <View style={styles.matchIcon}>
                <FontAwesome5
                  name="users"
                  size={14}
                  color={DesignTokens.colors.primary[600]}
                />
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchTitle} numberOfLines={1}>
                  {formatMatchTypeLabel(match.matchType) || "Team match"}
                </Text>
                <Text style={styles.matchMeta} numberOfLines={1}>
                  {playerNames || "Team match"}
                </Text>
              </View>
            </View>

            <View style={styles.matchFooter}>
              <Text style={styles.footerText}>
                {match.createdAt
                  ? formatApiDateShort(match.createdAt)
                  : "—"}
                {match.city ? ` • ${match.city}` : ""}
              </Text>
              {match.matchDuration ? (
                <Text style={styles.footerRecord}>
                  {formatTimeDuration(match.matchDuration * 1000)}
                </Text>
              ) : null}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {matches.map((match) =>
        match.matchCategory === "individual" &&
        match.participants &&
        match.participants.length >= 2
          ? renderIndividualMatch(match)
          : renderTeamOrFallbackMatch(match),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: DesignTokens.spacing[2],
  },
  avatarImg: {
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  matchCard: {
    backgroundColor: DesignTokens.colors.background.primary,
    borderRadius: DesignTokens.borderRadius.sm,
    marginBottom: DesignTokens.spacing[2],
  },
  matchCardContent: {
    gap: DesignTokens.spacing[3],
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignTokens.spacing[3],
  },
  matchIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: DesignTokens.colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  matchInfo: {
    flex: 1,
    minWidth: 0,
  },
  matchTitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
    textTransform: "capitalize",
  },
  matchMeta: {
    marginTop: 2,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
  },
  resultBadge: {
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  resultBadgeWin: {
    backgroundColor: "#dcfce7",
  },
  resultText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  resultTextWin: {
    color: "#15803d",
  },
  matchRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    minHeight: 28,
  },
  playerSection: {
    flex: 1,
    minWidth: 0,
    paddingRight: DesignTokens.spacing[8],
  },
  playerSectionRight: {
    flex: 1,
    minWidth: 0,
    paddingLeft: DesignTokens.spacing[8],
    alignItems: "flex-end",
  },
  playerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    flexShrink: 1,
    maxWidth: "100%",
  },
  playerInfoRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: DesignTokens.spacing[2],
    flexShrink: 1,
    maxWidth: "100%",
  },
  playerName: {
    flexShrink: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  playerNameRight: {
    textAlign: "right",
  },
  playerNameWinner: {
    color: DesignTokens.colors.success,
  },
  scoreContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  vsText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  matchFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  footerText: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
  },
  footerRecord: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
});
