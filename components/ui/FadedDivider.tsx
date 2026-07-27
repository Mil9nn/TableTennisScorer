import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  let normalized = hex.replace("#", "");
  if (normalized.length === 3) {
    normalized = normalized
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${normalized.slice(0, 6)}${a}`;
}

interface FadedDividerProps {
  style?: ViewStyle;
  /** Horizontal inset from the container edges */
  inset?: number;
}

export function FadedDivider({ style, inset = 0 }: FadedDividerProps) {
  const theme = useThemeColors();
  const lineColor = theme.colors.border.light;
  const fadeColor = theme.colors.background.tertiary;

  const gradientColors = useMemo(
    () =>
      [
        fadeColor,
        withAlpha(lineColor, 0.22),
        withAlpha(lineColor, 0.55),
        withAlpha(lineColor, 0.22),
        fadeColor,
      ] as const,
    [fadeColor, lineColor],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        line: {
          height: Math.max(StyleSheet.hairlineWidth, 1),
          marginHorizontal: inset,
        },
      }),
    [inset],
  );

  return (
    <LinearGradient
      colors={[...gradientColors]}
      locations={[0, 0.18, 0.5, 0.82, 1]}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={[styles.line, style]}
    />
  );
}
