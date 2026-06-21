import { DesignTokens } from "@/constants/designTokens";
import type { LineupPlayer, PositionSlots, TeamRoster } from "@/features/team-lineup/types";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PositionSlotRow } from "./PositionSlotRow";

interface Props {
  team: TeamRoster;
  positions: string[];
  slots: PositionSlots;
  onSlotChange: (position: string, playerId: string | null) => void;
}

export function TeamLineupPanel({ team, positions, slots, onSlotChange }: Props) {
  const usedPlayerIds = useMemo(() => {
    const ids = new Set<string>();
    for (const playerId of Object.values(slots)) {
      if (playerId) ids.add(playerId);
    }
    return ids;
  }, [slots]);

  return (
    <View style={styles.panel}>
      <Text style={styles.teamName}>{team.name}</Text>
      <View style={styles.slots}>
        {positions.map((position) => (
          <PositionSlotRow
            key={position}
            position={position}
            selectedPlayerId={slots[position] ?? null}
            roster={team.players}
            usedPlayerIds={usedPlayerIds}
            onSelect={(playerId) => onSlotChange(position, playerId)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: DesignTokens.spacing[3],
  },
  teamName: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.primary,
  },
  slots: {
    gap: DesignTokens.spacing[2],
  },
});
