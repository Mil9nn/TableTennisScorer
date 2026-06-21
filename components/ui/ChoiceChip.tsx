import { DesignTokens } from "@/constants/designTokens";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

const tokens = DesignTokens;

export type ChoiceChipSelectionTone = "default" | "live";

export interface ChoiceChipProps {
  children: string;
  selected?: boolean;
  /** When selected, primary (indigo) or live (red) treatment. */
  selectionTone?: ChoiceChipSelectionTone;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

/**
 * Small selectable pill used in filter rows and create flows.
 * Visual language aligns with `DesignTokens.components.chip` and
 * `createFlowChoiceStyles` (light border, full-radius pill, semibold label).
 */
export function ChoiceChip({
  children,
  selected = false,
  selectionTone = "default",
  onPress,
  style,
  textStyle,
  testID,
}: ChoiceChipProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      android_ripple={{
        color:
          selected && selectionTone === "live"
            ? "rgba(255,255,255,0.25)"
            : selected
              ? "rgba(255,255,255,0.2)"
              : "rgba(99,102,241,0.12)",
        borderless: false,
      }}
      style={[
        styles.pressable,
        selected && selectionTone === "default" && styles.pressableSelected,
        selected && selectionTone === "live" && styles.pressableSelectedLive,
        pressed && styles.pressablePressed,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          !selected && styles.labelDefault,
          selected && selectionTone === "default" && styles.labelSelected,
          selected && selectionTone === "live" && styles.labelSelectedLive,
          textStyle,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: tokens.borderRadius.sm,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
  },
  pressablePressed: {
    opacity: 0.92,
  },
  label: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    letterSpacing: DesignTokens.typography.letterSpacing.wide,
  },
  labelDefault: {
    color: tokens.components.chip.default.textColor,
  },
  labelSelected: {
    color: tokens.colors.info,
  },
  labelSelectedLive: {
    color: tokens.colors.error,
  },
});
