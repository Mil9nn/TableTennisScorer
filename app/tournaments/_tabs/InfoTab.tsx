import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DesignTokens } from "@/constants/designTokens";
import { formatDateShort } from "@/lib/utils";
import {
  formatCustomRubbersSummary,
  formatTeamMatchFormatLabel,
} from "@/lib/tournament/teamConfig";

const tokens = DesignTokens;

interface InfoTabProps {
  tournament: any;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  isTeamTournament: boolean;
}

export const InfoTab: React.FC<InfoTabProps> = ({
  tournament,
  fadeAnim,
  scaleAnim,
  isTeamTournament,
}) => {
  

  const detailsRows: Array<{ label: string; value: string | number }> = [
    {
      label: "Format",
      value:
        tournament.format === "hybrid"
          ? "Hybrid"
          : tournament.format === "round_robin"
            ? "Round-Robin"
            : tournament.format.replace(/_/g, " "),
    },
    {
      label: "Category",
      value: tournament.category === "team" ? "Team" : "Individual",
    },
    ...(isTeamTournament
      ? [
          {
            label: "Match structure",
            value: formatTeamMatchFormatLabel(tournament.teamConfig?.matchFormat),
          },
          ...(tournament.teamConfig?.matchFormat === "custom"
            ? [
                {
                  label: "Rubbers",
                  value: formatCustomRubbersSummary(
                    tournament.teamConfig?.customSubMatches
                  ),
                },
              ]
            : []),
        ]
      : [
          {
            label: "Match Type",
            value: tournament.matchType?.replace(/_/g, " ") || "N/A",
          },
        ]),
    {
      label: "Date",
      value: tournament.startDate ? formatDateShort(tournament.startDate) : "N/A",
    },
    { label: "City", value: tournament.city || "N/A" },
    { label: "Venue", value: tournament.venue || "N/A" },
    {
      label: "Participants",
      value: `${tournament.participants?.length || 0} ${isTeamTournament ? "teams" : "players"}`,
    },
    { label: "Seeding", value: tournament.seedingMethod || "none" },
  ];

  const rulesRows: Array<{ label: string; value: string | number }> = [
    {
      label: tournament.category === "team" ? "Sets per submatch" : "Sets per match",
      value:
        tournament.category === "team"
          ? tournament.teamConfig?.setsPerSubMatch || "N/A"
          : tournament.rules?.setsPerMatch || "N/A",
    },
    { label: "Points per set", value: tournament.rules?.pointsPerSet || "N/A" },
    {
      label: "Win / Loss",
      value: `${tournament.rules?.pointsForWin || 0}/${tournament.rules?.pointsForLoss || 0}`,
    },
  ];

  const hasGroups = () => {
    if (tournament.format === "round_robin") {
      return tournament.useGroups;
    }
    if (tournament.format === "hybrid") {
      return tournament?.hybridConfig?.roundRobinUseGroups || false;
    }
    return false;
  };

  if (hasGroups()) {
    rulesRows.push({
      label: "Number of Groups",
      value:
        tournament.format === "hybrid"
          ? tournament.hybridConfig?.roundRobinNumberOfGroups || 0
          : tournament.numberOfGroups || 0,
    });
    const advanceValue =
      tournament.format === "hybrid"
        ? tournament.hybridConfig?.qualifyingPerGroup || 0
        : tournament.advancePerGroup || 0;
    if (advanceValue) {
      rulesRows.push({
        label: tournament.format === "hybrid" ? "Qualify per Group" : "Advance per Group",
        value: advanceValue,
      });
    }
  }

  if (tournament.format === "knockout" && tournament.knockoutConfig?.thirdPlaceMatch) {
    rulesRows.push({ label: "Third Place Match", value: "Yes" });
  }

  if (
    tournament.format === "hybrid" &&
    tournament.hybridConfig?.knockoutThirdPlaceMatch
  ) {
    rulesRows.push({ label: "Knockout Third Place", value: "Yes" });
  }


  

  return (
    <Animated.View style={[styles.infoContainer, { opacity: fadeAnim }]}>
      {/* Main Header */}
      <View style={styles.contentCardHeader}>
        <View style={styles.contentCardHeaderLeft}>
          <Ionicons name="information-circle" size={20} color={tokens.colors.primary[600]} />
          <Text style={styles.contentCardTitle}>
            Tournament Information
          </Text>
        </View>
      </View>

      {/* Details Section */}
      <View style={styles.infoSection}>


        <Text style={styles.infoSectionTitle}>Tournament Details</Text>

        <View style={styles.infoGrid}>
          {detailsRows.map((row, index) => (
            <Animated.View
              key={row.label}
              style={[
                styles.infoCard,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Text style={styles.infoCardLabel}>{row.label}</Text>
              <Text style={styles.infoCardValue}>{row.value}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Rules Section */}
      <View style={styles.infoSection}>


        <Text style={styles.infoSectionTitle}>Tournament Rules</Text>

        <View style={styles.infoGrid}>
          {rulesRows.map((row, index) => (
            <Animated.View
              key={`${row.label}-${index}`}
              style={[
                styles.infoCard,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Text style={styles.infoCardLabel}>{row.label}</Text>
              <Text style={styles.infoCardValue}>{row.value}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  infoContainer: {
    padding: tokens.spacing[4],
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
  contentCardBadge: {
    backgroundColor: tokens.colors.primary[50],
    paddingHorizontal: tokens.spacing[8],
    paddingVertical: tokens.spacing[4],
    borderRadius: tokens.borderRadius.base,
  },
  infoSection: {
    marginBottom: tokens.spacing[6],
    backgroundColor: tokens.colors.background.secondary,
    padding: tokens.spacing[4],
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: tokens.spacing[8],
    marginBottom: tokens.spacing[10],
  },
  infoTitle: {
    fontSize: tokens.typography.fontSize.lg,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    textTransform: "uppercase",
    letterSpacing: tokens.typography.letterSpacing.wide,
  },
  infoSectionTitle: {
    fontSize: tokens.typography.fontSize.base,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing[4],
  },

  infoGrid: {
    flexDirection: "column",
  },
  infoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: tokens.spacing[6],
  },
  infoCardLabel: {
    fontSize: tokens.typography.fontSize.sm,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing[4],
    textTransform: "uppercase",
    letterSpacing: tokens.typography.letterSpacing.wide,
  },
  infoCardValue: {
    fontSize: tokens.typography.fontSize.sm,
    fontWeight: tokens.typography.fontWeight.semibold,
    color: tokens.colors.text.secondary,
  },
});
