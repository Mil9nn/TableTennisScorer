import { Button } from "@/components/ui/Button";
import { DesignTokens } from "@/constants/designTokens";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
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
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Ionicons
          name="cloud-offline-outline"
          size={48}
          color={DesignTokens.colors.text.tertiary}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
  },
  card: {
    alignItems: "center",
    maxWidth: 320,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: DesignTokens.colors.text.secondary,
    marginTop: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[2],
    textAlign: "center",
  },
  message: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center",
    lineHeight: DesignTokens.typography.fontSize.base * 1.45,
    marginBottom: DesignTokens.spacing[6],
  },
  button: {
    minWidth: 140,
  },
});
