import { DesignTokens } from "@/constants/designTokens";
import {
  formatRubberPreviewLabel,
  type RubberPreview,
} from "@/shared/match/teamLineup";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Props {
  previews: RubberPreview[];
}

export function RubberPreviewList({ previews }: Props) {
  if (previews.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rubber preview</Text>
      {previews.map((preview) => {
        const complete = preview.team1PlayerId && preview.team2PlayerId;
        return (
          <View key={preview.matchNumber} style={styles.row}>
            <Text style={styles.matchNum}>{preview.matchNumber}.</Text>
            <Text
              style={[
                styles.label,
                !complete && styles.labelIncomplete,
              ]}
              numberOfLines={2}
            >
              {formatRubberPreviewLabel(preview)}
              {preview.matchType === "doubles" ? " · doubles" : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: DesignTokens.spacing[2],
    padding: DesignTokens.spacing[4],
    borderRadius: DesignTokens.borderRadius.sm,
    backgroundColor: DesignTokens.colors.background.secondary,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: DesignTokens.spacing[2],
  },
  matchNum: {
    width: 20,
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.tertiary,
  },
  label: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.primary,
  },
  labelIncomplete: {
    color: DesignTokens.colors.text.tertiary,
  },
});
