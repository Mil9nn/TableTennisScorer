import MatchStatusBadge from "@/components/MatchStatusBadge";
import { DesignTokens } from "@/constants/designTokens";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MatchCardMetaRowProps {
  leadLabel: string;
  status: string;
  matchDuration?: number;
  tailParts?: string[];
}

export function MatchCardMetaRow({
  leadLabel,
  status,
  matchDuration,
  tailParts = [],
}: MatchCardMetaRowProps) {
  const tail = tailParts.filter(Boolean).join(" • ");

  return (
    <View style={styles.row}>
      <Text style={styles.metaText} numberOfLines={1}>
        {leadLabel}
      </Text>
      <Text style={styles.metaDot}>•</Text>
      <MatchStatusBadge status={status} matchDuration={matchDuration} compact />
      {tail ? (
        <>
          <Text style={styles.metaDot}>•</Text>
          <Text style={[styles.metaText, styles.metaTail]} numberOfLines={1} ellipsizeMode="tail">
            {tail}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: DesignTokens.spacing[2],
  },
  metaText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.normal,
    color: DesignTokens.colors.text.tertiary,
    flexShrink: 0,
  },
  metaTail: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  metaDot: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
    flexShrink: 0,
  },
});
