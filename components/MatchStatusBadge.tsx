import { formatTimeDuration } from "@/lib/utils";
import { DesignTokens } from "@/constants/designTokens";
import { StyleSheet, Text, View } from "react-native";

type MatchStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

type Props = {
  status: MatchStatus | string;
  matchDuration?: number;
  compact?: boolean;
};

export function getMatchStatusLabel(status: MatchStatus | string, matchDuration?: number): string {
  const isCompletedMatch = status === "completed" || (matchDuration != null && matchDuration > 0);

  if (status === "in_progress") return "Live";
  if (isCompletedMatch) {
    return matchDuration != null && matchDuration > 0
      ? formatTimeDuration(matchDuration)
      : "Completed";
  }
  if (status === "scheduled") return "Scheduled";
  if (status === "cancelled") return "Cancelled";
  if (matchDuration != null && matchDuration > 0) return formatTimeDuration(matchDuration);
  return status || "Unknown";
}

export default function MatchStatusBadge({ status, matchDuration, compact = false }: Props) {
  const isCompletedMatch = status === "completed" || (matchDuration != null && matchDuration > 0);
  const label = getMatchStatusLabel(status, matchDuration);

  const getBadgeStyle = () => {
    // Use completed style for matches that appear completed (have duration)
    if (status === "in_progress") {
      return {
        bg: "rgba(239, 68, 68, 0.08)", // soft red
        border: "rgba(239, 68, 68, 0.25)",
        text: DesignTokens.colors.error,
        dot: DesignTokens.colors.error,
      };
    }
    
    if (isCompletedMatch || status === "completed") {
      return {
        bg: "rgba(148, 163, 184, 0.08)", // slate
        border: "rgba(148, 163, 184, 0.25)",
        text: DesignTokens.colors.gray[400],
      };
    }
    
    if (status === "scheduled") {
      return {
        bg: "rgba(59, 130, 246, 0.08)", // blue
        border: "rgba(59, 130, 246, 0.25)",
        text: DesignTokens.colors.primary[500],
      };
    }
    
    if (status === "cancelled") {
      return {
        bg: "rgba(100, 116, 139, 0.08)",
        border: "rgba(100, 116, 139, 0.25)",
        text: DesignTokens.colors.gray[500],
      };
    }
    
    // Default style for unknown statuses
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
      {status === "in_progress" && (
        <View style={[styles.dot, { backgroundColor: badge.dot }]} />
      )}

      <Text style={[styles.badgeText, { color: badge.text }]}>
        {label}
      </Text>
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
    borderRadius: 999, // pill
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
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
});