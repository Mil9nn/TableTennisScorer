import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useThemeColors } from "@/hooks/useThemeColors";

type LocationSelectRowProps = {
  label: string;
  value?: string | null;
  placeholder?: string;
  subtitle?: string | null;
  disabled?: boolean;
  error?: string;
  onPress: () => void;
};

/**
 * Selection row that opens a full-screen location picker.
 * Mimics modern Maps / Spotify picker UX instead of free-text inputs.
 */
export function LocationSelectRow({
  label,
  value,
  placeholder = "Select…",
  subtitle,
  disabled = false,
  error,
  onPress,
}: LocationSelectRowProps) {
  const theme = useThemeColors();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrap: {
          gap: theme.spacing[1],
        },
        label: {
          fontSize: theme.typography.fontSize.sm,
          fontWeight: theme.typography.fontWeight.medium,
          color: theme.colors.text.secondary,
          marginBottom: theme.spacing[1],
        },
        row: {
          minHeight: 52,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: theme.spacing[4],
          paddingVertical: theme.spacing[3],
          borderRadius: theme.borderRadius.lg,
          borderWidth: 1,
          borderColor: error ? theme.colors.error : theme.colors.border.medium,
          backgroundColor: disabled
            ? theme.colors.background.tertiary
            : theme.colors.background.secondary,
          opacity: disabled ? 0.6 : 1,
        },
        textBlock: {
          flex: 1,
          marginRight: theme.spacing[3],
          gap: 2,
        },
        value: {
          fontSize: theme.typography.fontSize.base,
          fontWeight: theme.typography.fontWeight.medium,
          color: value
            ? theme.colors.text.primary
            : theme.colors.text.tertiary,
        },
        subtitle: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.text.tertiary,
        },
        error: {
          fontSize: theme.typography.fontSize.xs,
          color: theme.colors.error,
          marginTop: theme.spacing[1],
        },
      }),
    [theme, value, disabled, error],
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && !disabled && { opacity: 0.85 }]}
      >
        <View style={styles.textBlock}>
          <Text style={styles.value} numberOfLines={1}>
            {value || placeholder}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Icon
          name="chevron-right"
          size={20}
          color={theme.colors.text.tertiary}
        />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}
