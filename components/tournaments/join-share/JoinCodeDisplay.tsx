import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

interface JoinCodeDisplayProps {
  joinCode: string;
}

export function JoinCodeDisplay({ joinCode }: JoinCodeDisplayProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="labelSmall" style={styles.label}>
        Join code
      </Text>
      <View style={styles.codeBox}>
        <Text style={styles.codeText}>{joinCode}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  codeBox: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  codeText: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 4,
    color: "#4f46e5",
  },
});
