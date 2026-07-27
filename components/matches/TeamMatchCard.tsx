import { Image } from "expo-image";
import { MatchCardMetaRow } from "@/components/matches/MatchCardMetaRow";
import {
  formatTeamFormatLabel,
  teamFormatIcon,
} from "@/lib/match/matchCardUtils";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { formatFeedRelativeDate } from "@/lib/utils";
import type { TeamMatch } from "@/types/match.type";
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

const AVATAR_SIZE = 44;

function TeamAvatar({
  name,
  logo,
  size = AVATAR_SIZE,
  theme,
}: {
  name?: string;
  logo?: string;
  size?: number;
  theme: ReturnType<typeof useThemeColors>;
}) {
  const fallbackInitial = name?.charAt(0)?.toUpperCase() || "T";

  return logo ? (
    <Image
      source={{ uri: logo }}
      contentFit="cover"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: theme.components.avatar.borderWidth,
        borderColor: theme.colors.border.light,
      }}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: theme.colors.gray[100],
        borderWidth: theme.components.avatar.borderWidth,
        borderColor: theme.components.avatar.borderColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontWeight: theme.typography.fontWeight.semibold,
          fontSize: size * 0.4,
          color: theme.colors.text.tertiary,
        }}
      >
        {fallbackInitial}
      </Text>
    </View>
  );
}

export type TeamMatchCardProps = {
  match: TeamMatch;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  pressable?: boolean;
  variant?: "list" | "carousel";
};

export function TeamMatchCard({
  match,
  onPress,
  containerStyle,
  pressable = true,
  variant = "list",
}: TeamMatchCardProps) {
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
        rowTop: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
          flexGrow: isCarousel ? 1 : undefined,
        },
        sideBlock: {
          flex: 1,
          minWidth: 0,
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[3],
        },
        sideRight: {
          justifyContent: "flex-end",
        },
        teamName: {
          flex: 1,
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.primary,
          minWidth: 0,
        },
        teamNameRight: {
          textAlign: "right",
        },
        teamNameWinner: {
          color: theme.colors.success,
          fontWeight: theme.typography.fontWeight.bold,
        },
        scoreCol: {
          alignItems: "center",
          minWidth: 72,
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
  const team1Won = match.winnerTeam === "team1";
  const team2Won = match.winnerTeam === "team2";
  const location = match.city || match.venue || null;
  const s1 = match.finalScore?.team1Matches || 0;
  const s2 = match.finalScore?.team2Matches || 0;

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
      <View style={styles.rowTop}>
        <View style={styles.sideBlock}>
          <TeamAvatar name={match.team1?.name} logo={match.team1?.logo} theme={theme} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text
              style={[styles.teamName, team1Won && styles.teamNameWinner]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {match.team1?.name || "Team 1"}
            </Text>
          </View>
        </View>

        <View style={styles.scoreCol}>
          {isCompleted || (isLive && (s1 > 0 || s2 > 0)) ? (
            <>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>{s1}</Text>
                <Text style={styles.scoreSeparator}>:</Text>
                <Text style={styles.scoreText}>{s2}</Text>
              </View>
              {isLive ? <Text style={styles.watchHint}>▶ Watch</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.vsText}>VS</Text>
              {isLive ? <Text style={styles.watchHint}>▶ Watch</Text> : null}
            </>
          )}
        </View>

        <View style={[styles.sideBlock, styles.sideRight]}>
          <View style={{ flex: 1, minWidth: 0, alignItems: "flex-end" }}>
            <Text
              style={[
                styles.teamName,
                styles.teamNameRight,
                team2Won && styles.teamNameWinner,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {match.team2?.name || "Team 2"}
            </Text>
          </View>
          <TeamAvatar name={match.team2?.name} logo={match.team2?.logo} theme={theme} />
        </View>
      </View>

      <MatchCardMetaRow
        leadLabel={formatTeamFormatLabel(match.matchFormat)}
        matchTypeIcon={teamFormatIcon(match.matchFormat)}
        status={match.status}
        matchDuration={match.matchDuration}
        startedAt={(match as { startedAt?: string }).startedAt}
        tournamentName={match.tournament?.name}
        location={location}
        dateLabel={formatFeedRelativeDate(match.createdAt) || "—"}
        liveDotAnimated={isCarousel}
      />
    </View>
  );

  const matchId = normalizeMatchIdParam(match?._id ?? (match as { id?: string }).id);
  const accessibilityLabel = `${match.team1?.name || "Team 1"} versus ${match.team2?.name || "Team 2"}, ${match.status}`;

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
