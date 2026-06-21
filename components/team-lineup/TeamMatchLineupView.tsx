import { DesignTokens } from "@/constants/designTokens";
import type { useTeamLineup } from "@/features/team-lineup/useTeamLineup";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { RubberPreviewList } from "./RubberPreviewList";
import { TeamLineupPanel } from "./TeamLineupPanel";

type LineupHookResult = ReturnType<typeof useTeamLineup>;

interface Props {
  lineup: LineupHookResult;
}

export function TeamMatchLineupView({ lineup }: Props) {
  if (!lineup.needsLineup) return null;

  if (lineup.loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={DesignTokens.colors.primary[600]} />
      </View>
    );
  }

  if (lineup.error || !lineup.team1 || !lineup.team2) {
    return <Text style={styles.error}>{lineup.error ?? "Could not load teams"}</Text>;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Today&apos;s lineup</Text>
      <Text style={styles.subheading}>
        Assign positions for this tie only. Rubbers are generated automatically.
      </Text>

      <TeamLineupPanel
        team={lineup.team1}
        positions={lineup.team1Positions}
        slots={lineup.team1Slots}
        onSlotChange={(pos, id) => lineup.setSlot("team1", pos, id)}
      />

      <TeamLineupPanel
        team={lineup.team2}
        positions={lineup.team2Positions}
        slots={lineup.team2Slots}
        onSlotChange={(pos, id) => lineup.setSlot("team2", pos, id)}
      />

      <RubberPreviewList previews={lineup.rubberPreview} />

      {!lineup.validation.valid && lineup.validation.errors.length > 0 && (
        <Text style={styles.error}>{lineup.validation.errors[0]}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: DesignTokens.spacing[5],
  },
  heading: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  subheading: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    marginTop: -DesignTokens.spacing[3],
  },
  loader: {
    paddingVertical: DesignTokens.spacing[6],
    alignItems: "center",
  },
  error: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: "#dc2626",
  },
});
