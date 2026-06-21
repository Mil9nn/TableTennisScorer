import React, { useState, useEffect } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  View,
  Text,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "react-native-paper";
import { fetchHeadToHeadOpponent } from "@/lib/profile/api";
import type { HeadToHeadOpponentMatch } from "@/lib/profile/types";
import { DesignTokens } from "@/constants/designTokens";
import HeadToHeadMatchItem from "@/components/HeadToHeadMatchItem";

interface HeadToHeadMatchesModalProps {
  userId: string;
  opponentId: string;
  opponentName: string;
  visible: boolean;
  onClose: () => void;
}

export function HeadToHeadMatchesModal({
  userId,
  opponentId,
  opponentName,
  visible,
  onClose,
}: HeadToHeadMatchesModalProps) {
  const [matches, setMatches] = useState<HeadToHeadOpponentMatch[]>([]);
  const [summary, setSummary] = useState<{
    wins: number;
    losses: number;
    total: number;
    winRate: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedMatches = React.useMemo(() => {
    const items = Array.isArray(matches) ? [...matches] : [];
    items.sort((a, b) => {
      const ad = a?.date ? Date.parse(a.date) : 0;
      const bd = b?.date ? Date.parse(b.date) : 0;
      return bd - ad;
    });
    return items;
  }, [matches]);

  useEffect(() => {
    if (!userId || !opponentId || !visible) {
      setMatches([]);
      setSummary(null);
      setError(null);
      return;
    }

    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchHeadToHeadOpponent(userId, opponentId);
        if (!res || res.success !== true) {
          throw new Error(res?.error || res?.message || "Failed to load matches");
        }
        setMatches(Array.isArray(res.matches) ? res.matches : []);
        setSummary(res.summary || null);
      } catch (err: any) {
        setError(err?.message || "Failed to load matches");
        setMatches([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [userId, opponentId, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </Pressable>
        <Text style={styles.headerTitle}>vs {opponentName}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ padding: 10 }}>
        {summary ? (
          <Card style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <Text style={styles.summaryText}>
                {summary.wins} Wins • {summary.losses} Losses • {Math.round(summary.winRate)}% win rate
              </Text>
              <Text style={styles.totalText}>Total: {summary.total}</Text>
            </Card.Content>
          </Card>
        ) : null}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading matches...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : sortedMatches.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyTitle}>No matches found</Text>
            <Text style={styles.emptySubtitle}>No recorded matches vs this opponent yet.</Text>
          </View>
        ) : (
          sortedMatches.map((m) => (
            <HeadToHeadMatchItem key={m._id} match={m} />
          ))
        )}
      </ScrollView>
    </Modal>
  );
}

const styles = {
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  closeButton: {
    padding: DesignTokens.spacing[2],
  },
  headerTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
    flex: 1,
    textAlign: "center" as const,
  },
  headerSpacer: {
    width: 40,
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  contentContainer: {
    padding: DesignTokens.spacing[4],
  },
  summaryCard: {
    marginBottom: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.background.primary,
  },
  summaryContent: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  summaryText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: DesignTokens.colors.text.secondary,
  },
  totalText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.text.tertiary,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: DesignTokens.spacing[8],
  },
  loadingText: {
    marginTop: DesignTokens.spacing[4],
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.error,
    textAlign: "center" as const,
  },
  emptyTitle: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: DesignTokens.colors.text.secondary,
    marginBottom: DesignTokens.spacing[2],
  },
  emptySubtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: DesignTokens.colors.text.tertiary,
    textAlign: "center" as const,
  },
  matchCard: {
    marginBottom: DesignTokens.spacing[3],
    backgroundColor: DesignTokens.colors.background.primary,
  },
};
