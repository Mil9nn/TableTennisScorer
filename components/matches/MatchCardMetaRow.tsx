import { MatchStatusText } from "@/components/MatchStatusBadge";
import { PulsingLiveDot } from "@/components/matches/PulsingLiveDot";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type MatchTypeIcon = "singles" | "doubles" | "team" | "swaythling" | "sds" | "custom";

interface MatchCardMetaRowProps {
  leadLabel: string;
  matchTypeIcon?: MatchTypeIcon;
  status: string;
  matchDuration?: number;
  startedAt?: string | Date;
  tournamentName?: string | null;
  location?: string | null;
  dateLabel?: string | null;
  liveDotAnimated?: boolean;
}

function typeIconName(
  kind?: MatchTypeIcon,
): React.ComponentProps<typeof Ionicons>["name"] {
  switch (kind) {
    case "doubles":
      return "people-outline";
    case "team":
    case "swaythling":
    case "sds":
    case "custom":
      return "trophy-outline";
    case "singles":
    default:
      return "person-outline";
  }
}

export function MatchCardMetaRow({
  leadLabel,
  matchTypeIcon,
  status,
  matchDuration,
  startedAt,
  tournamentName,
  location,
  dateLabel,
  liveDotAnimated = false,
}: MatchCardMetaRowProps) {
  const theme = useThemeColors();
  const isLive = status === "in_progress";
  const iconColor = theme.colors.text.tertiary;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        stack: {
          gap: theme.spacing[2],
        },
        contextRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: theme.spacing[2],
        },
        contextLabel: {
          flex: 1,
          minWidth: 0,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.semibold,
          color: theme.colors.text.secondary,
        },
        row: {
          flexDirection: "row",
          alignItems: "center",
          flexWrap: "nowrap",
          gap: theme.spacing[2],
        },
        typeWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
        },
        metaText: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.tertiary,
          flexShrink: 0,
        },
        metaTail: {
          flex: 1,
          minWidth: 0,
          flexShrink: 1,
        },
        metaDot: {
          fontSize: theme.typography.fontSize.sm,
          color: theme.colors.text.tertiary,
          flexShrink: 0,
        },
        locationWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: 3,
          flexShrink: 1,
          minWidth: 0,
          maxWidth: 120,
        },
        locationText: {
          flexShrink: 1,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.tertiary,
        },
        liveWrap: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          flexShrink: 0,
        },
      }),
    [theme],
  );

  const contextLabel = tournamentName?.trim() || "Friendly Match";

  return (
    <View style={styles.stack}>
      <View style={styles.contextRow}>
        <Text style={styles.contextLabel} numberOfLines={1}>
          {contextLabel}
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.typeWrap}>
          <Ionicons name={typeIconName(matchTypeIcon)} size={13} color={iconColor} />
          <Text style={styles.metaText} numberOfLines={1}>
            {leadLabel}
          </Text>
        </View>

        <Text style={styles.metaDot}>•</Text>

        {isLive ? (
          <View style={styles.liveWrap}>
            <PulsingLiveDot size={7} animated={liveDotAnimated} />
            <MatchStatusText
              status={status}
              matchDuration={matchDuration}
              startedAt={startedAt}
              style={{ flexShrink: 0 }}
            />
          </View>
        ) : (
          <MatchStatusText
            status={status}
            matchDuration={matchDuration}
            startedAt={startedAt}
            style={{ flexShrink: 0 }}
          />
        )}

        {location ? (
          <>
            <Text style={styles.metaDot}>•</Text>
            <View style={styles.locationWrap}>
              <Ionicons name="location-outline" size={12} color={iconColor} />
              <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
                {location}
              </Text>
            </View>
          </>
        ) : null}

        {dateLabel ? (
          <>
            <Text style={styles.metaDot}>•</Text>
            <Text style={[styles.metaText, styles.metaTail]} numberOfLines={1} ellipsizeMode="tail">
              {dateLabel}
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}
