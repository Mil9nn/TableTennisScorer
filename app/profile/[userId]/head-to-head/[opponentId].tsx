import { fetchHeadToHeadOpponent } from "@/lib/profile/api";
import type { HeadToHeadOpponentMatch } from "@/lib/profile/types";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { Card, List, Text } from "react-native-paper";

export default function ProfileHeadToHeadOpponentScreen() {
  const { userId, opponentId } = useLocalSearchParams<{
    userId: string;
    opponentId: string;
  }>();

  const resolvedUserId = String(userId ?? "");
  const resolvedOpponentId = String(opponentId ?? "");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<HeadToHeadOpponentMatch[]>([]);
  const [summary, setSummary] = useState<{
    wins: number;
    losses: number;
    total: number;
    winRate: number;
  } | null>(null);

  const sortedMatches = useMemo(() => {
    const items = Array.isArray(matches) ? [...matches] : [];
    items.sort((a, b) => {
      const ad = a?.date ? Date.parse(a.date) : 0;
      const bd = b?.date ? Date.parse(b.date) : 0;
      return bd - ad;
    });
    return items;
  }, [matches]);

  const load = useCallback(async () => {
    if (!resolvedUserId || !resolvedOpponentId) return;
    setError(null);
    const res = await fetchHeadToHeadOpponent(
      resolvedUserId,
      resolvedOpponentId,
    );
    if (!res || res.success !== true) {
      throw new Error(res?.error || res?.message || "Failed to load opponent");
    }
    setMatches(Array.isArray(res.matches) ? res.matches : []);
    setSummary(res.summary || null);
  }, [resolvedOpponentId, resolvedUserId]);

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to load opponent"))
      .finally(() => setLoading(false));
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load()
      .catch((e: any) => setError(e?.message || "Failed to refresh"))
      .finally(() => setRefreshing(false));
  }, [load]);

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text variant="bodySmall" style={{ marginBottom: 12 }}>
        UserId: {resolvedUserId} • OpponentId: {resolvedOpponentId}
      </Text>

      {summary ? (
        <Card style={{ marginBottom: 12 }}>
          <Card.Content>
            <Text variant="titleMedium">
              W {summary.wins} • L {summary.losses} • {Math.round(summary.winRate)}%
            </Text>
            <Text variant="bodySmall">Total: {summary.total}</Text>
          </Card.Content>
        </Card>
      ) : null}

      {loading ? (
        <Text>Loading…</Text>
      ) : error ? (
        <Text style={{ color: "#b91c1c" }}>{error}</Text>
      ) : sortedMatches.length === 0 ? (
        <View style={{ paddingVertical: 24 }}>
          <Text variant="titleMedium">No matches found</Text>
          <Text variant="bodySmall">No recorded matches vs this opponent yet.</Text>
        </View>
      ) : (
        sortedMatches.map((m) => {
          const title = m?.tournament?.name
            ? `${m.tournament.name}${m.tournament.format ? ` • ${m.tournament.format}` : ""}`
            : "Match";
          const desc = [
            m?.date ? new Date(m.date).toLocaleDateString() : undefined,
            m?.result ? String(m.result).toUpperCase() : undefined,
          ]
            .filter(Boolean)
            .join(" • ");
          return (
            <Card key={m._id} style={{ marginBottom: 12 }}>
              <List.Item
                title={title}
                description={desc || "—"}
                left={(props) => (
                  <List.Icon
                    {...props}
                    icon={
                      m?.result === "win"
                        ? "check-circle-outline"
                        : m?.result === "loss"
                          ? "close-circle-outline"
                          : "circle-outline"
                    }
                  />
                )}
              />
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

