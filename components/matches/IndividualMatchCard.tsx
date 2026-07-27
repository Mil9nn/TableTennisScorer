import { Image } from "expo-image";
import { MatchCardMetaRow } from "@/components/matches/MatchCardMetaRow";
import {
  asMatchId,
  displayParticipantName,
  formatMatchTypeLabel,
  getIndividualSetScore,
  getIndividualWinnerFlags,
} from "@/lib/match/matchCardUtils";
import { formatFeedRelativeDate } from "@/lib/utils";
import type { AppTheme } from "@/constants/designTokens";
import { useThemeColors } from "@/hooks/useThemeColors";
import React, { useMemo, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

function PlayerAvatar({
  name,
  profileImage,
  size = 40,
  theme,
}: {
  name?: string;
  profileImage?: string;
  size?: number;
  theme: AppTheme;
}) {
  const fallbackInitial = name?.charAt(0).toUpperCase() || "?";

  return profileImage ? (
    <Image
      source={{ uri: profileImage }}
      contentFit="cover"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: theme.colors.border.light,
        backgroundColor: theme.colors.background.secondary,
      }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.primary[100],
        borderWidth: 2,
        borderColor: theme.colors.primary[200],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.38,
          color: theme.colors.primary[700],
          fontWeight: theme.typography.fontWeight.semibold,
          textTransform: "uppercase",
        }}
      >
        {fallbackInitial}
      </Text>
    </View>
  );
}

export type IndividualMatchCardProps = {
  match: any;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  pressable?: boolean;
  /** Home carousel — fills a shared row height so singles match doubles. */
  variant?: "list" | "carousel";
};

export function IndividualMatchCard({
  match,
  onPress,
  containerStyle,
  pressable = true,
  variant = "list",
}: IndividualMatchCardProps) {
  const theme = useThemeColors();
  const isCarousel = variant === "carousel";
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        cardContainer: {
          backgroundColor: theme.colors.background.primary,
          borderBottomWidth: isCarousel ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.border.light,
        },
        cardFill: {
          flex: 1,
        },
        cardInner: {
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[4],
          backgroundColor: theme.colors.background.primary,
          gap: theme.spacing[3],
        },
        cardInnerFill: {
          flex: 1,
          justifyContent: "space-between",
        },
        cardLive: {
          backgroundColor: "rgba(239, 68, 68, 0.03)",
        },
        matchContent: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          flexGrow: isCarousel ? 1 : undefined,
        },
        playerSection: {
          flex: 1,
          minWidth: 0,
          alignItems: "flex-start",
          justifyContent: isCarousel ? "center" : undefined,
          gap: theme.spacing[2],
        },
        playerSectionRight: {
          alignItems: "flex-end",
        },
        playerInfo: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
          flexShrink: 1,
          maxWidth: "100%",
        },
        playerInfoRight: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
        },
        playerInfoDoubles: {
          flexDirection: "column",
          alignItems: "flex-start",
          gap: theme.spacing[2],
        },
        playerInfoDoublesRight: {
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "flex-start",
        },
        avatarContainer: {
          flexDirection: "row",
          alignItems: "center",
        },
        avatarOverlap: {
          marginLeft: -theme.spacing[2],
        },
        avatarOverlapRight: {
          marginRight: -theme.spacing[2],
        },
        playerName: {
          flexShrink: 1,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          maxWidth: 110,
        },
        playerNameRight: {
          textAlign: "right",
        },
        playerNameWinner: {
          color: theme.colors.success,
          fontWeight: theme.typography.fontWeight.bold,
        },
        scoreContainer: {
          alignItems: "center",
          justifyContent: "center",
          minWidth: 72,
          paddingHorizontal: theme.spacing[1],
        },
        scoreBox: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        },
        scoreText: {
          fontSize: theme.typography.fontSize["3xl"],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.primary,
          fontVariant: ["tabular-nums"],
          lineHeight: theme.typography.fontSize["3xl"] + 4,
        },
        scoreSeparator: {
          fontSize: theme.typography.fontSize.lg,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.tertiary,
          marginBottom: 2,
        },
        vsText: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.tertiary,
          letterSpacing: theme.typography.letterSpacing.wide,
        },
        bestOf: {
          marginTop: 4,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.tertiary,
        },
        watchHint: {
          marginTop: 6,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.status.live,
          letterSpacing: 0.4,
        },
      }),
    [theme, isCarousel],
  );

  const isCompleted = match.status === "completed";
  const isLive = match.status === "in_progress";
  const isDoubles = match.matchType !== "singles";
  const useDoublesColumnLayout = isDoubles;
  const { side1Won, side2Won } = getIndividualWinnerFlags(match);
  const score = getIndividualSetScore(match);

  const side1Name = isDoubles
    ? `${displayParticipantName(match.participants?.[0], "Player 1")} & ${displayParticipantName(match.participants?.[1], "Player 2")}`
    : displayParticipantName(match.participants?.[0], "Player 1");

  const side2Name = isDoubles
    ? `${displayParticipantName(match.participants?.[2], "Player 3")} & ${displayParticipantName(match.participants?.[3], "Player 4")}`
    : displayParticipantName(match.participants?.[1], "Player 2");

  const location = match.city || match.venue || null;
  const bestOf =
    typeof match.numberOfSets === "number" && match.numberOfSets > 0
      ? `Best of ${match.numberOfSets}`
      : null;

  const runPressScale = (toValue: number) => {
    animationRef.current?.stop();
    animationRef.current = Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    });
    animationRef.current.start();
  };

  const cardBody = (
    <View
      style={[
        styles.cardInner,
        isCarousel && styles.cardInnerFill,
        isLive && styles.cardLive,
      ]}
    >
      <View style={styles.matchContent}>
        <View style={styles.playerSection}>
          <View style={[styles.playerInfo, useDoublesColumnLayout && styles.playerInfoDoubles]}>
            <View style={styles.avatarContainer}>
              <PlayerAvatar
                name={displayParticipantName(match.participants?.[0], "Player 1")}
                profileImage={match.participants?.[0]?.profileImage}
                size={40}
                theme={theme}
              />
              {isDoubles ? (
                <View style={styles.avatarOverlap}>
                  <PlayerAvatar
                    name={displayParticipantName(match.participants?.[1], "Player 2")}
                    profileImage={match.participants?.[1]?.profileImage}
                    size={40}
                    theme={theme}
                  />
                </View>
              ) : null}
            </View>
            <View style={{ minWidth: 0, flexShrink: 1 }}>
              <Text
                style={[styles.playerName, side1Won && styles.playerNameWinner]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {side1Name}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          {isCompleted && match.finalScore ? (
            <>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>{score.side1}</Text>
                <Text style={styles.scoreSeparator}>:</Text>
                <Text style={styles.scoreText}>{score.side2}</Text>
              </View>
              {bestOf ? <Text style={styles.bestOf}>{bestOf}</Text> : null}
            </>
          ) : isLive && (score.side1 > 0 || score.side2 > 0 || match.finalScore) ? (
            <>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>{score.side1}</Text>
                <Text style={styles.scoreSeparator}>:</Text>
                <Text style={styles.scoreText}>{score.side2}</Text>
              </View>
              <Text style={styles.watchHint}>▶ Watch</Text>
            </>
          ) : (
            <>
              <Text style={styles.vsText}>VS</Text>
              {bestOf ? <Text style={styles.bestOf}>{bestOf}</Text> : null}
              {isLive ? <Text style={styles.watchHint}>▶ Watch</Text> : null}
            </>
          )}
        </View>

        <View style={[styles.playerSection, styles.playerSectionRight]}>
          <View
            style={[
              styles.playerInfo,
              styles.playerInfoRight,
              useDoublesColumnLayout && styles.playerInfoDoublesRight,
            ]}
          >
            <View style={{ minWidth: 0, flexShrink: 1, alignItems: "flex-end" }}>
              <Text
                style={[
                  styles.playerName,
                  styles.playerNameRight,
                  side2Won && styles.playerNameWinner,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {side2Name}
              </Text>
            </View>
            <View style={styles.avatarContainer}>
              {isDoubles ? (
                <>
                  <PlayerAvatar
                    name={displayParticipantName(match.participants?.[2], "Player 3")}
                    profileImage={match.participants?.[2]?.profileImage}
                    size={40}
                    theme={theme}
                  />
                  <View style={styles.avatarOverlapRight}>
                    <PlayerAvatar
                      name={displayParticipantName(match.participants?.[3], "Player 4")}
                      profileImage={match.participants?.[3]?.profileImage}
                      size={40}
                      theme={theme}
                    />
                  </View>
                </>
              ) : (
                <PlayerAvatar
                  name={displayParticipantName(match.participants?.[1], "Player 2")}
                  profileImage={match.participants?.[1]?.profileImage}
                  size={40}
                  theme={theme}
                />
              )}
            </View>
          </View>
        </View>
      </View>

      <MatchCardMetaRow
        leadLabel={formatMatchTypeLabel(match.matchType)}
        matchTypeIcon={isDoubles ? "doubles" : "singles"}
        status={match.status}
        matchDuration={match.matchDuration}
        startedAt={match.startedAt}
        tournamentName={match.tournament?.name}
        location={location}
        dateLabel={formatFeedRelativeDate(match.createdAt) || "—"}
        liveDotAnimated={isCarousel}
      />
    </View>
  );

  const matchId = asMatchId(match?._id ?? match?.id);
  const accessibilityLabel = `${side1Name} versus ${side2Name}, ${match.status || "match"}`;

  return (
    <View style={[styles.cardContainer, isCarousel && styles.cardFill, containerStyle]}>
      {pressable && onPress ? (
        <Animated.View style={[isCarousel && styles.cardFill, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            onPress={onPress}
            disabled={!matchId}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPressIn={() => runPressScale(0.98)}
            onPressOut={() => runPressScale(1)}
            style={isCarousel ? styles.cardFill : undefined}
          >
            {cardBody}
          </TouchableOpacity>
        </Animated.View>
      ) : (
        cardBody
      )}
    </View>
  );
}
