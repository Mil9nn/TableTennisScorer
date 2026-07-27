import { Avatar } from "@/components/ui/Avatar";
import { DesignTokens } from "@/constants/designTokens";
import { formatTimeDuration } from "@/lib/utils";
import { isIndividualMatch, Match, TeamMatch } from "@/types/match.type";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { format } from "date-fns";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const tokens = DesignTokens;

function safeDateLabel(raw: unknown): string {
  if (!raw) return "—";
  const v =
    typeof raw === "object" &&
    raw !== null &&
    "$date" in (raw as Record<string, unknown>)
      ? (raw as { $date?: unknown }).$date
      : raw;
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? "—" : format(d, "d MMM yyyy");
}

function statusLineLabel(status: string, matchDuration?: number): string {
  if (status === "in_progress") return "Live";
  if (status === "scheduled") return "Scheduled";
  if (status === "cancelled") return "Cancelled";
  if (status === "completed") {
    if (matchDuration != null && matchDuration > 0) {
      return formatTimeDuration(matchDuration);
    }
    return "Completed";
  }
  return status;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "in_progress":
      return tokens.colors.status.live;
    case "completed":
      return tokens.colors.status.completed;
    case "scheduled":
      return tokens.colors.status.scheduled;
    case "cancelled":
      return tokens.colors.text.tertiary;
    default:
      return tokens.colors.text.tertiary;
  }
}

function getStatusIcon(status: string): keyof typeof Ionicons.glyphMap {
  switch (status) {
    case "in_progress":
      return "radio-outline";
    case "completed":
      return "checkmark-circle-outline";
    case "scheduled":
      return "calendar-outline";
    case "cancelled":
      return "close-circle-outline";
    default:
      return "help-circle-outline";
  }
}

function matchTypeLabel(matchType?: string): string {
  if (!matchType) return "—";
  const m: Record<string, string> = {
    singles: "Singles",
    doubles: "Doubles",
    mixed_doubles: "Mixed doubles",
  };
  return m[matchType] || matchType.replace(/_/g, " ");
}

function teamFormatLabel(formatValue: TeamMatch["matchFormat"]): string {
  if (formatValue === "five_singles") return "Swaythling (best of 5)";
  if (formatValue === "single_double_single") return "Single–Double–Single";
  if (formatValue === "custom") return "Custom";
  return formatValue;
}

function InfoRow({
  label,
  value,
  highlighted,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[styles.infoValue, highlighted && styles.highlightedValue]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.infoCard}>
      <Text style={styles.infoCardTitle}>{title}</Text>
      <View style={styles.infoCardContent}>{children}</View>
    </View>
  );
}

function scorerLabel(match: Match): string {
  if (!match.scorer) return "—";
  if (typeof match.scorer === "object") {
    return match.scorer.fullName || match.scorer.username || "Unknown";
  }
  const scorers = (
    match.tournament as
      | { scorers?: Array<{ _id: string; fullName?: string; username?: string }> }
      | undefined
  )?.scorers;
  const found = scorers?.find((s) => s._id === match.scorer);
  return found?.fullName || found?.username || "Unknown";
}

function TournamentBlock({ match }: { match: Match }) {
  const tournament = match.tournament as
    | {
        name?: string;
        format?: string;
        status?: string;
        organizer?: { fullName?: string; profileImage?: string };
      }
    | undefined;

  if (!tournament?.name) return null;

  const roundName = (match as { roundName?: string }).roundName;
  const bracketPosition = (
    match as {
      bracketPosition?: {
        round?: number;
        matchNumber?: number;
        nextMatchNumber?: number;
      };
    }
  ).bracketPosition;

  return (
    <InfoCard title="Tournament Information">
      <InfoRow label="Tournament" value={tournament.name} highlighted />
      {tournament.format ? (
        <InfoRow label="Format" value={tournament.format.replace(/_/g, " ")} />
      ) : null}
      {tournament.status ? (
        <InfoRow label="Status" value={tournament.status.replace(/_/g, " ")} />
      ) : null}
      {roundName ? <InfoRow label="Round" value={roundName} /> : null}
      {bracketPosition?.round != null ? (
        <InfoRow label="Round Number" value={`Round ${bracketPosition.round}`} />
      ) : null}
      {bracketPosition?.matchNumber != null ? (
        <InfoRow
          label="Match Number"
          value={`Match ${bracketPosition.matchNumber}`}
        />
      ) : null}
      {bracketPosition?.nextMatchNumber != null ? (
        <InfoRow
          label="Next Match"
          value={`Match ${bracketPosition.nextMatchNumber}`}
        />
      ) : null}
      {tournament.organizer?.fullName ? (
        <View style={styles.organizerRow}>
          <Text style={styles.infoLabel}>Organizer</Text>
          <View style={styles.organizerInfo}>
            <Avatar
              src={tournament.organizer.profileImage}
              alt={tournament.organizer.fullName}
              size={32}
            />
            <Text style={styles.organizerName}>
              {tournament.organizer.fullName}
            </Text>
          </View>
        </View>
      ) : null}
      {match.scorer ? (
        <InfoRow label="Scored By" value={scorerLabel(match)} highlighted />
      ) : null}
    </InfoCard>
  );
}

interface InfoTabProps {
  match: Match;
}

export function InfoTab({ match }: InfoTabProps) {
  const copyMatchCode = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const matchCode = `#${match._id}`;
    await Clipboard.setStringAsync(matchCode);
    Alert.alert("Copied!", `Match code ${matchCode} copied to clipboard`);
  };

  if (isIndividualMatch(match)) {
    return (
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <Ionicons
              name={getStatusIcon(match.status)}
              size={20}
              color={getStatusColor(match.status)}
            />
            <Text style={[styles.statusText, styles.highlightedStatus]}>
              {statusLineLabel(match.status, match.matchDuration)}
            </Text>
          </View>
          <View style={styles.matchCodeContainer}>
            <Text style={styles.matchCode}>#{match._id}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={copyMatchCode}
              hitSlop={8}
            >
              <Ionicons
                name="copy-outline"
                size={14}
                color={tokens.colors.text.tertiary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <InfoCard title="Match Information">
          <InfoRow label="Date" value={safeDateLabel(match.createdAt)} />
          <InfoRow label="Location" value={match.city || "—"} />
          <InfoRow label="Venue" value={match.venue || "—"} />
          <InfoRow
            label="Type"
            value={matchTypeLabel(match.matchType)}
            highlighted
          />
          <InfoRow label="Format" value={`Best of ${match.numberOfSets}`} />
        </InfoCard>

        <TournamentBlock match={match} />
      </View>
    );
  }

  const tm = match as TeamMatch;
  const setsPerSub =
    tm.numberOfSetsPerSubMatch ??
    (tm as { numberOfGamesPerRubber?: number }).numberOfGamesPerRubber ??
    tm.subMatches?.[0]?.numberOfSets ??
    (tm.subMatches?.[0] as { numberOfGames?: number } | undefined)?.numberOfGames ??
    "—";

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View style={styles.statusLeft}>
          <Ionicons
            name={getStatusIcon(tm.status)}
            size={20}
            color={getStatusColor(tm.status)}
          />
          <Text style={styles.statusText}>
            {statusLineLabel(tm.status, tm.matchDuration)}
          </Text>
        </View>
        <View style={styles.matchCodeContainer}>
          <Text style={styles.matchCode}>#{tm._id}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={copyMatchCode}
            hitSlop={8}
          >
            <Ionicons
              name="copy-outline"
              size={14}
              color={tokens.colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <InfoCard title="Match Information">
        <InfoRow label="Date" value={safeDateLabel(tm.createdAt)} />
        <InfoRow label="Location" value={tm.city || "—"} />
        <InfoRow label="Venue" value={tm.venue || "—"} />
        <InfoRow label="Type" value="Team" highlighted />
        <InfoRow label="Format" value={teamFormatLabel(tm.matchFormat)} />
        <InfoRow label="Sets / tie" value={`Best of ${setsPerSub} per sub-match`} />
      </InfoCard>

      <TournamentBlock match={tm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
    backgroundColor: "#f8fafc",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: tokens.spacing[4],
    backgroundColor: tokens.colors.background.secondary,
    borderRadius: tokens.borderRadius.sm,
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
  },
  statusText: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
  matchCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
  },
  matchCode: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.tertiary,
    backgroundColor: tokens.colors.background.secondary,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.borderRadius.sm,
  },
  copyButton: {
    padding: tokens.spacing[1],
    borderRadius: tokens.borderRadius.sm,
    backgroundColor: tokens.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    overflow: "hidden",
  },
  infoCardTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  infoCardContent: {
    paddingTop: tokens.spacing[3],
    gap: tokens.spacing[3],
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: tokens.spacing[4],
  },
  infoLabel: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.medium,
    color: tokens.colors.text.tertiary,
    flexShrink: 0,
    minWidth: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textAlign: "right",
  },
  highlightedValue: {
    color: tokens.colors.lightBlue,
    fontWeight: tokens.typography.fontWeight.bold,
  },
  highlightedStatus: {
    fontWeight: tokens.typography.fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  organizerRow: {
    gap: tokens.spacing[4],
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[2],
    flexShrink: 0,
  },
  organizerName: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
  },
});
