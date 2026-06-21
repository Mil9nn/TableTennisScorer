import React from "react";
import { StyleSheet, View } from "react-native";
import { ActivityIndicator, Switch, Text } from "react-native-paper";

interface JoinEnableToggleProps {
  enabled: boolean;
  loading: boolean;
  onToggle: (enabled: boolean) => void;
}

export function JoinEnableToggle({ enabled, loading, onToggle }: JoinEnableToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text variant="titleSmall" style={styles.title}>
          Open registration
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Players can join with your link, QR code, or 6-character code
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <Switch value={enabled} onValueChange={onToggle} disabled={loading} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: "#0f172a",
  },
  subtitle: {
    color: "#64748b",
  },
});
