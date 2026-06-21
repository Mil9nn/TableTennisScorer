import { DesignTokens } from "@/constants/designTokens";
import { StyleSheet } from "react-native";

/**
 * Shared pill + category chip styles for create flows (tournament, match, etc.).
 *
 * Horizontal filter chips on feeds (matches tab, etc.) use `ChoiceChip` in
 * `components/ui/ChoiceChip.tsx`, which mirrors this file’s pill borders and
 * typography while sourcing colors from `DesignTokens.components.chip`.
 */
export const createFlowChoiceStyles = StyleSheet.create({
  pill: {
    height: 36,
    width: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "#fff",
    borderColor: "#e2e8f0",
  },
  pillActive: {
    backgroundColor: "#E0E7FF",
    borderColor: "#C7D2FE",
    elevation: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  pillTextActive: {
    color: "#4338CA",
  },
  categoryCardRow: {
    flexDirection: "row",
    gap: 12,
  },
  categoryCardEqual: {
    flex: 1,
    minWidth: 0,
    padding: 10,
  },
  categoryCardRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCardChip: {
    flexShrink: 0,
    padding: 10,
  },
  categoryCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  categoryCardIconActive: {
    backgroundColor: "#6366f1",
  },
  categoryCardText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    flexShrink: 0,
  },

  // Section label (e.g., "Best of", "Type")
  sectionLabel: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[2],
    marginTop: DesignTokens.spacing[4],
  },

  // Segmented control (matching web version's "bg-muted p-1 rounded-lg" design)
  segmentedControlContainer: {
    flexDirection: "column",
    backgroundColor: DesignTokens.colors.background.secondary,
    borderRadius: DesignTokens.borderRadius.sm,
  },
  segmentedButton: {
    paddingVertical: DesignTokens.spacing[3],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: DesignTokens.borderRadius.sm,
  },
  segmentedButtonActive: {
    backgroundColor: DesignTokens.colors.background.primary,
    elevation: 2,
  },
  segmentedButtonText: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text.secondary,
  },
  segmentedButtonTextActive: {
    color: DesignTokens.colors.info,
  },
});
