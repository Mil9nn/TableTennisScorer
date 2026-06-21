import { useMatchStore } from "@/hooks/useMatchStore";
import {
  computeMatchStatsData,
  useMatchStatsData,
} from "@/hooks/useMatchStatsData";
import {
  generateMatchPdfFile,
  shareMatchPdfFile,
} from "@/lib/match-pdf/exportMatchPdf";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { normalizeMatchIdParam } from "@/lib/normalizeMatchId";
import { MatchStatsHeader } from "@/components/match-stats/MatchStatsHeader";
import { MatchStatsTabContent } from "@/components/match-stats/MatchStatsTabContent";

export default function MatchStatsPage() {
  const { id: matchIdParam, category: categoryParam } = useLocalSearchParams();
  const matchId = normalizeMatchIdParam(matchIdParam);
  const category = (categoryParam as "individual" | "team") || "individual";
  const { match, fetchingMatch, fetchMatch } = useMatchStore();
  const statsData = useMatchStatsData(match, matchId);
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    if (!matchId) return;
    fetchMatch(matchId, category, { view: "stats" });
  }, [matchId, category, fetchMatch]);

  const canExportPdf = match?.status === "completed";

  const handleShare = async () => {
    if (!statsData) return;
    try {
      await Share.share({
        message: `${statsData.side1Name} ${statsData.side1Sets} – ${statsData.side2Sets} ${statsData.side2Name}\n\nMatch stats on TTPro`,
        title: "Match Stats",
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to share" });
    }
  };

  const handleExportPdf = useCallback(async () => {
    if (!matchId || !canExportPdf || exportingPdf) return;

    setExportingPdf(true);
    let pdfUri: string | null = null;

    try {
      await fetchMatch(matchId, category, { view: "details" });
      const freshMatch = useMatchStore.getState().match;
      if (!freshMatch) {
        throw new Error("Match data unavailable");
      }

      const exportStats = computeMatchStatsData(freshMatch, matchId);
      if (!exportStats) {
        throw new Error("Could not compute match stats for export");
      }

      pdfUri = await generateMatchPdfFile(freshMatch, exportStats);
    } catch (error) {
      console.error("[MatchStatsPage] PDF export failed:", error);
      Toast.show({
        type: "error",
        text1: "PDF export failed",
        text2: "Please try again",
      });
    } finally {
      setExportingPdf(false);
      fetchMatch(matchId, category, { view: "stats" }).catch(() => {});
    }

    if (!pdfUri) return;

    try {
      await shareMatchPdfFile(pdfUri);
    } catch (error) {
      console.error("[MatchStatsPage] PDF share failed:", error);
      Toast.show({ type: "error", text1: "Failed to open share sheet" });
    }
  }, [matchId, category, canExportPdf, exportingPdf, fetchMatch]);

  if (fetchingMatch && !match) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading match stats…</Text>
      </SafeAreaView>
    );
  }

  if (!match || !statsData) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Match not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <MatchStatsHeader
        onShare={handleShare}
        onExportPdf={handleExportPdf}
        exportDisabled={!canExportPdf}
        exporting={exportingPdf}
      />
      <MatchStatsTabContent data={statsData} />

      <Modal visible={exportingPdf} transparent animationType="fade">
        <View style={styles.exportOverlay}>
          <View style={styles.exportCard}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.exportText}>Generating PDF…</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
  },
  exportOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  exportCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
    minWidth: 160,
  },
  exportText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
});
