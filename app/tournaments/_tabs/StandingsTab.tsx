import React, { useMemo } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import { EnhancedStandingsTable } from "@/components/tournaments/EnhancedStandingsTable";
import { normalizeStandingRow } from "@/lib/standingsUtils";

const tokens = DesignTokens;

interface StandingsTabProps {
  tournament: any;
  fadeAnim: Animated.Value;
  tournamentId: string;
}

const normalizeId = (value: any): string => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (typeof value.$oid === "string") return value.$oid;
    if (value._id) return normalizeId(value._id);
    if (typeof value.toString === "function") {
      const asString = value.toString();
      if (asString && asString !== "[object Object]") return asString;
    }
    return "";
  }
  return String(value);
};

const getParticipantId = (participant: any) => {
  if (!participant) return "";
  return normalizeId(participant);
};

export const StandingsTab: React.FC<StandingsTabProps> = ({
  tournament,
  fadeAnim,
  tournamentId,
}) => {
  const participants = Array.isArray(tournament?.participants)
    ? tournament.participants
    : [];

  const resolvedStandings = useMemo(() => {
    const standings = Array.isArray(tournament?.standings) ? tournament.standings : [];
    if (standings.length === 0) return [];

    const participantById = new Map<string, any>(
      participants
        .filter((participant: any) => participant && typeof participant === "object")
        .map((participant: any) => [getParticipantId(participant), participant] as const)
        .filter(([id]: readonly [string, any]) => Boolean(id)),
    );

    return standings.map((row: any, index: number) => {
      const normalized = normalizeStandingRow(row);
      const rowParticipantId =
        getParticipantId(normalized?.participant?._id) ||
        getParticipantId(normalized?.participant) ||
        getParticipantId(normalized?.participantId) ||
        `idx-${index}`;
      const mappedParticipant = participantById.get(rowParticipantId);
      if (!mappedParticipant) return normalized;

      return {
        ...normalized,
        participant: {
          ...(typeof normalized?.participant === "object" ? normalized.participant : {}),
          ...mappedParticipant,
          _id: rowParticipantId,
        },
      };
    });
  }, [tournament?.standings, participants]);

  return (
    <Animated.View style={[styles.contentCard, { opacity: fadeAnim }]}>
      <View style={styles.contentCardHeader}>
        <View style={styles.contentCardHeaderLeft}>
          <Ionicons name="podium-outline" size={20} color={tokens.colors.primary[600]} />
          <Text style={styles.contentCardTitle}>Tournament Standings</Text>
        </View>
      </View>
      {resolvedStandings.length > 0 ? (
          <EnhancedStandingsTable
            standings={resolvedStandings}
            showDetailedStats={true}
            highlightTop={3}
            tournamentId={tournamentId}
            category={tournament.category as "individual" | "team"}
            matchType={tournament.matchType}
            participants={participants}
          />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="podium-outline" size={48} color={tokens.colors.gray[400]} />
          <Text style={styles.emptyStateTitle}>No Standings Yet</Text>
          <Text style={styles.emptyStateSubtitle}>
            Generate matches to create tournament standings.
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  contentCard: {
    backgroundColor: tokens.colors.white,
  },
  contentCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: tokens.spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.light,
  },
  contentCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[8],
  },
  contentCardTitle: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: tokens.typography.letterSpacing.wide,
  },
  emptyState: {
    alignItems: "center",
    padding: tokens.spacing[16],
  },
  emptyStateTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginTop: tokens.spacing[12],
    marginBottom: tokens.spacing[8],
  },
  emptyStateSubtitle: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    textAlign: "center",
  },
});
