import { useThemeColors } from "@/hooks/useThemeColors";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

export type ChoiceChipSelectionTone = "default" | "live";

export interface ChoiceChipProps {
  children: string;
  selected?: boolean;
  selectionTone?: ChoiceChipSelectionTone;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function ChoiceChip({
  children,
  selected = false,
  selectionTone = "default",
  onPress,
  style,
  textStyle,
  testID,
}: ChoiceChipProps) {
  const theme = useThemeColors();
  const [pressed, setPressed] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        pressable: {
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: theme.borderRadius.full,
          minHeight: 44,
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[2],
          borderWidth: 1,
          borderColor: theme.colors.border.medium,
        },
        pressablePressed: { opacity: 0.92 },
        pressableSelected: {
          backgroundColor: theme.colors.background.primary,
          borderWidth: 1,
          borderColor: theme.colors.info,
        },
        pressableSelectedLive: {
          backgroundColor: theme.colors.error,
          borderWidth: 1,
          borderColor: theme.colors.error,
        },
        label: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.semibold,
          letterSpacing: theme.typography.letterSpacing.wide,
        },
        labelDefault: { color: theme.colors.text.secondary },
        labelSelected: { color: theme.colors.info },
        labelSelectedLive: { color: theme.colors.white },
      }),
    [theme],
  );

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={children}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      android_ripple={{
        color:
          selected && selectionTone === "live"
            ? "rgba(255,255,255,0.25)"
            : selected
              ? "rgba(255,255,255,0.2)"
              : "rgba(59,130,246,0.12)",
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
