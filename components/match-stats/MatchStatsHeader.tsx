import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface MatchStatsHeaderProps {
  onShare: () => void;
  onExportPdf?: () => void;
  exportDisabled?: boolean;
  exporting?: boolean;
}

export function MatchStatsHeader({
  onShare,
  onExportPdf,
  exportDisabled = false,
  exporting = false,
}: MatchStatsHeaderProps) {
  const exportDisabledState = exportDisabled || exporting;

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[styles.headerButton, styles.backButton]}
        onPress={() => router.back()}
      >
        <Ionicons name="chevron-back" size={18} color="#1f2937" />
        <Text style={styles.headerButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.actions}>
        {onExportPdf ? (
          <TouchableOpacity
            style={[
              styles.headerButton,
              styles.exportButton,
              exportDisabledState && styles.headerButtonDisabled,
            ]}
            onPress={onExportPdf}
            disabled={exportDisabledState}
          >
            <Ionicons
              name="document-text-outline"
              size={14}
              color={exportDisabledState ? "#94a3b8" : "#ffffff"}
            />
            <Text
              style={[
                styles.exportButtonText,
                exportDisabledState && styles.headerButtonTextDisabled,
              ]}
            >
              {exporting ? "Exporting…" : "Export PDF"}
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity style={styles.headerButton} onPress={onShare}>
          <Ionicons name="share-outline" size={14} color="#1f2937" />
          <Text style={styles.headerButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0",
  },
  exportButton: {
    backgroundColor: "#4f46e5",
    borderColor: "#4338ca",
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  headerButtonDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
  },
  headerButtonTextDisabled: {
    color: "#94a3b8",
  },
  backButton: {
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  headerButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
  },
});
