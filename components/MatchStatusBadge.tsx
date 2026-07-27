import { PulsingLiveDot } from "@/components/matches/PulsingLiveDot";
import { DesignTokens, type ThemeColors } from "@/constants/designTokens";
import { useThemeColors } from "@/hooks/useThemeColors";
import { formatLiveElapsed, formatTimeDuration } from "@/lib/utils";
import { StyleSheet, Text, View, type TextStyle } from "react-native";

type MatchStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

type Props = {
  status: MatchStatus | string;
  matchDuration?: number;
  startedAt?: string | Date;
  compact?: boolean;
};

type TextProps = {
  status: MatchStatus | string;
  matchDuration?: number;
  startedAt?: string | Date;
  style?: TextStyle;
};

export function getMatchStatusColor(
  status: MatchStatus | string,
  colors: ThemeColors,
  matchDuration?: number,
): string {
  const isCompletedMatch = status === "completed" || (matchDuration != null && matchDuration > 0);

  if (status === "in_progress") return colors.status.live;
  if (isCompletedMatch) return colors.status.completed;
  if (status === "scheduled") return colors.status.scheduled;
  if (status === "cancelled") return colors.gray[500];
  return colors.text.tertiary;
}

export function getMatchStatusLabel(
  status: MatchStatus | string,
  matchDuration?: number,
  startedAt?: string | Date,
): string {
  const isCompletedMatch = status === "completed" || (matchDuration != null && matchDuration > 0);

  if (status === "in_progress") {
    const elapsed = formatLiveElapsed(startedAt);
    return elapsed ? `LIVE · ${elapsed}` : "LIVE";
  }
  if (isCompletedMatch) {
    return matchDuration != null && matchDuration > 0
      ? formatTimeDuration(matchDuration)
      : "Completed";
  }
  if (status === "scheduled") return "Upcoming";
  if (status === "cancelled") return "Cancelled";
  if (matchDuration != null && matchDuration > 0) return formatTimeDuration(matchDuration);
  return status || "Unknown";
}

export function MatchStatusText({ status, matchDuration, startedAt, style }: TextProps) {
  const theme = useThemeColors();
  const label = getMatchStatusLabel(status, matchDuration, startedAt);
  const color = getMatchStatusColor(status, theme.colors, matchDuration);
  const isLive = status === "in_progress";

  return (
    <Text
      style={[
        {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: isLive
            ? theme.typography.fontWeight.bold
            : theme.typography.fontWeight.medium,
          color,
          letterSpacing: isLive ? 0.3 : 0,
        },
        style,
      ]}
      numberOfLines={1}
    >
      {label}
    </Text>
  );
}

export default function MatchStatusBadge({
  status,
  matchDuration,
  startedAt,
  compact = false,
}: Props) {
  const isCompletedMatch = status === "completed" || (matchDuration != null && matchDuration > 0);
  const label = getMatchStatusLabel(status, matchDuration, startedAt);

  const getBadgeStyle = () => {
    if (status === "in_progress") {
      return {
        bg: "rgba(239, 68, 68, 0.08)",
        border: "rgba(239, 68, 68, 0.25)",
        text: DesignTokens.colors.error,
        dot: DesignTokens.colors.error,
      };
    }

    if (isCompletedMatch || status === "completed") {
      return {
        bg: "rgba(34, 197, 94, 0.08)",
        border: "rgba(34, 197, 94, 0.25)",
        text: DesignTokens.colors.success,
      };
    }

    if (status === "scheduled") {
      return {
        bg: "rgba(59, 130, 246, 0.08)",
        border: "rgba(59, 130, 246, 0.25)",
        text: DesignTokens.colors.status.scheduled,
      };
    }

    if (status === "cancelled") {
      return {
        bg: "rgba(100, 116, 139, 0.08)",
        border: "rgba(100, 116, 139, 0.25)",
        text: DesignTokens.colors.gray[500],
      };
    }

    return {
      bg: "rgba(255,255,255,0.05)",
      border: "rgba(255,255,255,0.1)",
      text: DesignTokens.colors.gray[100],
    };
  };

  const badge = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        compact && styles.badgeCompact,
        {
          backgroundColor: badge.bg,
          borderColor: badge.border,
        },
      ]}
    >
      {status === "in_progress" && <PulsingLiveDot size={6} color={badge.dot} />}

      <Text style={[styles.badgeText, { color: badge.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[1],
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeCompact: {
    gap: 4,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    letterSpacing: 0.4,
  },
});
