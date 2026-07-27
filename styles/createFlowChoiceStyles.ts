import type { AppTheme } from "@/constants/designTokens";
import { getDesignTokens } from "@/constants/designTokens";
import { StyleSheet } from "react-native";

/**
 * Shared pill + category chip styles for create flows (tournament, match, etc.).
 *
 * Horizontal filter chips on feeds (matches tab, etc.) use `ChoiceChip` in
 * `components/ui/ChoiceChip.tsx`, which mirrors this file's pill borders and
 * typography while sourcing colors from theme tokens.
 */
export function getCreateFlowChoiceStyles(theme: AppTheme) {
  const { colors, typography, spacing, borderRadius } = theme;

  return StyleSheet.create({
    pill: {
      height: 36,
      width: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      backgroundColor: colors.background.primary,
      borderColor: colors.border.light,
    },
    pillActive: {
      backgroundColor: colors.primary[100],
      borderColor: colors.primary[200],
      elevation: 4,
    },
    pillText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.text.tertiary,
    },
    pillTextActive: {
      color: colors.primary[700],
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
      backgroundColor: colors.gray[100],
    },
    categoryCardIconActive: {
      backgroundColor: colors.primary[500],
    },
    categoryCardText: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text.tertiary,
      flexShrink: 0,
    },
    sectionLabel: {
      fontSize: typography.fontSize.base,
      color: colors.text.secondary,
      marginBottom: spacing[2],
      marginTop: spacing[4],
    },
    segmentedControlContainer: {
      flexDirection: "column",
      backgroundColor: colors.background.secondary,
      borderRadius: borderRadius.sm,
    },
    segmentedButton: {
      paddingVertical: spacing[3],
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.sm,
    },
    segmentedButtonActive: {
      backgroundColor: colors.background.primary,
      elevation: 2,
    },
    segmentedButtonText: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      color: colors.text.secondary,
    },
    segmentedButtonTextActive: {
      color: colors.info,
    },
  });
}

/** @deprecated Use getCreateFlowChoiceStyles(useThemeColors()) */
export const createFlowChoiceStyles = getCreateFlowChoiceStyles(getDesignTokens("light"));
