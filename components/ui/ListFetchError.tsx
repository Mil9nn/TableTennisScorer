import { Button } from "@/components/ui/Button";
import { useThemeColors } from "@/hooks/useThemeColors";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

interface ListFetchErrorProps {
  title?: string;
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}

export function ListFetchError({
  title = "Something went wrong",
  message,
  onRetry,
  retrying = false,
}: ListFetchErrorProps) {
  const theme = useThemeColors();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          minHeight: 280,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: theme.spacing[6],
        },
        card: { alignItems: "center", maxWidth: 320 },
        title: {
          fontSize: theme.typography.fontSize.xl,
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing[4],
          marginBottom: theme.spacing[2],
          textAlign: "center",
        },
        message: {
          fontSize: theme.typography.fontSize.base,
          color: theme.colors.text.tertiary,
          textAlign: "center",
          lineHeight: theme.typography.fontSize.base * 1.45,
          marginBottom: theme.spacing[6],
        },
        button: { minWidth: 140 },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={theme.colors.text.tertiary}
        />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <Button
          variant="primary"
          size="sm"
          onPress={onRetry}
          disabled={retrying}
          loading={retrying}
          style={styles.button}
        >
          {retrying ? "Trying again…" : "Try again"}
        </Button>
      </View>
    </View>
  );
}
