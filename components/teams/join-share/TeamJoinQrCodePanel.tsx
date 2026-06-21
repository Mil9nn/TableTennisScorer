import React from "react";
import { StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Text } from "react-native-paper";
import { buildCustomSchemeJoinUrl } from "@/lib/teams/joinLinks";

interface TeamJoinQrCodePanelProps {
  joinCode: string;
  size?: number;
}

export function TeamJoinQrCodePanel({ joinCode, size = 168 }: TeamJoinQrCodePanelProps) {
  const value = buildCustomSchemeJoinUrl(joinCode);

  return (
    <View style={styles.wrap}>
      <Text variant="labelSmall" style={styles.label}>
        Scan to join in the app
      </Text>
      <View style={styles.qrFrame}>
        <QRCode value={value} size={size} backgroundColor="#ffffff" color="#0f172a" />
      </View>
      <Text variant="bodySmall" style={styles.hint}>
        Point your camera at this code on the Join Team screen
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 8,
  },
  label: {
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  qrFrame: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  hint: {
    textAlign: "center",
    color: "#64748b",
    paddingHorizontal: 8,
  },
});
